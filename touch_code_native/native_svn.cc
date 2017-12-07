/**
 * @createTime 2015-05-30
 * @author louis.tru <louistru@live.com>
 * @copyright © 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#include <node.h>
#include <async-wrap.h>
#include <async-wrap-inl.h>
#include <env.h>
#include <env-inl.h>
#include <util.h>
#include <jtn/util.h>
#include <jtn/fs.h>
#include <jtn/handle.h>
#include <svn_client.h>
#include <jtn/exception.h>
#include <thread>
#include <mutex>
#include <node_context.h>
#include "native_util.h"

using namespace node;
using namespace v8;

// tr::Handle
// T_On
// T_Off
// T_Once
// T_Notice
// T_Log

T_Ns(tc);

#define TYPE_ERROR(msg) env->ThrowTypeError(msg)
#define _call_svn_api_(name, ...) svn->name(__VA_ARGS__)
#define async_call_svn_api(name, cb, ...) {\
    Subversion* svn = Unwrap<Subversion>(args.Holder()); \
    jtn::String cb_id = jtn::id(); \
    svn->object()->Set(OneByteString(args.GetIsolate(), *cb_id), (cb)); \
    svn->m_async_work = true; /* 标识为异步工作 */\
    _call_svn_api_(name, ##__VA_ARGS__, cb_id); \
  }((void)0)

#define callback(error, rev, ...)  \
  callback_func<decltype(rev)>(this, jtn::move(cb), (error), jtn::move(rev), ##__VA_ARGS__)

template<class T>
static tr::String convert_to_string(apr_array_header_t* arr){
  tr::String str = "";
  for(int i = 0; i < arr->nelts; i++){
    T item = APR_ARRAY_IDX(arr, 0, T);
    str += jtn::String((int)item);
    if(i + 1 != arr->nelts){
      str += ",";
    }
  }
  
  return jtn::move(str);
}

static void callback_error(Isolate* iso, Handle<Value> cb, jtn::ccharp err) {
  Handle<Value> error = Object::New(iso);
  error->ToObject()->Set(OneByteString(iso, "message"), String::NewFromUtf8(iso, err));
  if(cb->IsFunction()){
    cb.As<Function>()->CallAsFunction(Null(iso), 1, &error);
  }
}

class Subversion: public BaseObject {
  
 public:
  /**
   * @constructor
   */
  Subversion(Environment* env,
             v8::Local<v8::Object> wrap,
             NodeContext* node_ctx,
             jtn::CStringRef path,
             jtn::CStringRef local)
  : BaseObject(env, wrap)
  , m_node_ctx(node_ctx)
  , m_path(path)
  , m_local(local)
  , m_pool(NULL)
  , m_ctx(NULL)
  , m_user()
  , m_passwd()
  , m_async_work(false)
  , m_cancel_async(false)
  , m_ready_release(false)
  , m_status(NULL)
  , m_conflict_list(NULL){
    
    if(path.substr(path.length() - 1) == "/"){
      m_path = path.substring(0, path.length() - 1);
    }
    MakeWeak<Subversion>(this);
  }
  
  virtual ~Subversion(){
    // 要释放不能在有异步工作进行
    JAssert(!m_async_work);
    release();
  }

 private:
  
  template<class T>
  static void callback_func(Subversion* self,
                            jtn::String cb,
                            svn_error_t* error,
                            T rev,
                            Handle<Value> (*func)(T &)){
    bool is_cancel = false;
    jtn::ccharp err_str = "";
    int err_code = 0;
    svn_error_t* err = error;
    while (error) {
      if(err){
        if(err->apr_err == SVN_ERR_CANCELLED){ // 这个并不是错误，这个是取消
          is_cancel = true;
          break;
        }
        err = err->child;
      } else {
        jtn::ccharp err2 = error->child && error->child->message ?
                          error->child->message :
                          error->message;
        self->console_log("Error:", err2);
        switch (error->apr_err) {
          case 160024: err_str = "写入文件到服务错误,服务器文件已更改过请先更新文件"; break;
          case 200004: err_str = "更新文件版本冲突"; err_code = 201; break;
          default: err_str = err2; break;
        }
        break;
      }
    }
    
    struct Return {
      Subversion* self;
      jtn::String cb;
      jtn::String err_message;
      int err_code;
      T rev;
      Handle<Value> (*func)(T& data);
      bool is_cancel;
    };
    self->m_node_ctx->push_run_queue([](NodeContext* ctx, void* data) {
      jtn::Handle<Return> h = (Return*)data;
      Isolate* iso = ctx->isolate();
      
      Handle<Value> v8_err = Null(iso);
      
      if(!h->err_message.isEmpty()){
        Handle<Object> err_rev = Object::New(iso);
        err_rev->Set(OneByteString(iso, "code"), Int32::New(iso, h->err_code));
        err_rev->Set(OneByteString(iso, "message"), String::NewFromUtf8(iso, *h->err_message));
        v8_err = err_rev;
      }
      
      Handle<Value> argv[] = {
        v8_err,
        h->func(h->rev),
        Boolean::New(iso, h->is_cancel),
      };
      
      Handle<String> key = OneByteString(ctx->isolate(), *h->cb);
      Handle<Value> func = h->self->object()->Get(key);
      
      if(func->IsFunction()){
        h->self->object()->Delete(key);
        func.As<Function>()->Call(h->self->object(), 3, argv);
      }
      
      h->self->m_async_work = false;  // 关闭异步工作标识
      if (h->self->m_ready_release) { // 是否准备要释放
        h->self->release(); // 释放
      }
    }, new Return({ self, jtn::move(cb), err_str, err_code, jtn::move(rev), func, is_cancel }));
  }
  
  template<class T>
  static void callback_func(Subversion* self,
                            jtn::String cb,
                            svn_error_t* error,
                            jtn::String rev){
    callback_func<jtn::String>(self, jtn::move(cb), error,
                              jtn::move(rev), [](jtn::StringRef rev){
      Handle<Value> ret = String::NewFromUtf8(Isolate::GetCurrent(), *rev);
      return ret;
    });
  }
  
  void set_user(jtn::CStringRef value){
    
    m_user = value;
    
    if(is_init()){
      svn_auth_set_parameter(m_ctx->auth_baton,
                             SVN_AUTH_PARAM_DEFAULT_USERNAME, apr_pstrdup(m_pool, *m_user));
    } else {
      
    }
  }
  
  void set_passwd(jtn::CStringRef value){
    
    m_passwd = value;
    
    if(is_init()){
      svn_auth_set_parameter(m_ctx->auth_baton,
                             SVN_AUTH_PARAM_DEFAULT_PASSWORD, apr_pstrdup(m_pool, *m_passwd));
    }
  }
  
  jtn::CStringRef user()const{
    return m_user;
  }
  
  jtn::CStringRef passwd()const{
    return m_passwd;
  }
  
  bool is_init() const{
    return m_pool;
  }
  
  static svn_error_t* svn_auth_plaintext_prompt(svn_boolean_t* may_save_plaintext,
                                                jtn::ccharp realmstring,
                                                void* baton,
                                                apr_pool_t* pool) {
    (*may_save_plaintext) = false;
    return SVN_NO_ERROR;
  }
  
  static svn_error_t *
  svn_auth_ssl_server_trust_prompt(svn_auth_cred_ssl_server_trust_t** cred,
                                   jtn::voidp baton,
                                   jtn::ccharp realm,
                                   apr_uint32_t failures,
                                   const svn_auth_ssl_server_cert_info_t* cert_info,
                                   svn_boolean_t may_save,
                                   apr_pool_t* pool){
    (*cred) = (svn_auth_cred_ssl_server_trust_t*)apr_pcalloc(pool, sizeof(**cred));
    (*cred)->may_save = false;
    (*cred)->accepted_failures = failures;
    return SVN_NO_ERROR;
  }

  static svn_error_t* svn_client_get_commit_log3(const char **log_msg,
                                                 const char **tmp_file,
                                                 const apr_array_header_t *commit_items,
                                                 void *baton,
                                                 apr_pool_t *pool){
    *log_msg = "Touch code commit";
    return SVN_NO_ERROR;
  }
  
  // svn 文件发生冲突的通知
  static svn_error_t* svn_wc_conflict_resolver_func2(svn_wc_conflict_result_t **result,
                                                     const svn_wc_conflict_description2_t *description,
                                                     void *baton,
                                                     apr_pool_t *result_pool,
                                                     apr_pool_t *scratch_pool){
    Subversion* self = (Subversion*)baton;
    self->console_log("!", self->format_path(description->local_abspath));
    return SVN_NO_ERROR;
  }
  
  // svn 操作进度通知回调
  static void svn_ra_progress_notify_func(apr_off_t progress,
                                          apr_off_t total,
                                          void *baton,
                                          apr_pool_t *pool){
    
  }
  
  jtn::ccharp format_path(jtn::ccharp path){
    jtn::ccharp new_path = "";
    if (strlen(path) > m_local.length()) {
      new_path = path + m_local.length();
    }
    return new_path;
  }
  
  // 输出日志
  void console_log(jtn::ccharp mark, jtn::ccharp log, jtn::ccharp path = NULL){
    
    struct Data {
      jtn::String mark;
      jtn::String log;
      jtn::String path;
      bool is_path;
      Subversion* self;
    };
    
    m_node_ctx->push_run_queue([](NodeContext* ctx, void* p){
      jtn::Handle<Data> h = (Data*)p;
      Isolate* iso = ctx->isolate();
      Handle<Value> path = Null(iso);
      if (h->is_path) {
        path = OneByteString(iso, *h->path);
      }
      Handle<Value> rev[] = {
        OneByteString(iso, *h->mark),
        OneByteString(iso, *h->log),
        path,
      };
      MakeCallback(iso, h->self->object(), "onconsole_log_handle", 3, rev);
    }, new Data({ mark, log, path, path != NULL, this }));
  }
  
  // svn 操作通知变化
  static void svn_wc_notify_func2(void *baton,
                                  const svn_wc_notify_t *notify,
                                  apr_pool_t *pool){
    Subversion* self = (Subversion*)baton;
    jtn::ccharp  mark = "";
    
    switch (notify->action) {
        
      /** Adding a path to revision control. */
      case svn_wc_notify_add:  mark = "A"; break;
      
      /** Copying a versioned path. */
      case svn_wc_notify_copy:  mark = "C"; break;
      
      /** Deleting a versioned path. */
      case svn_wc_notify_delete:  mark = "D"; break;
      
      /** Restoring a missing path from the pristine text-base. */
      case svn_wc_notify_restore: mark = "R"; break;
      
      /** Reverting a modified path. */
      case svn_wc_notify_revert: mark = "R"; break;
      
      /** Resolving a conflict. */
      case svn_wc_notify_resolved: mark = "Resolved"; break;
      
      /** Got a delete in an update. */
      case svn_wc_notify_update_delete: mark = "D"; break;
      
      /** Got an add in an update. */
      case svn_wc_notify_update_add: mark = "A"; break;
      
      /** Got any other action in an update. */
      case svn_wc_notify_update_update: mark = "U"; break;
      
      /** The last notification in an update (including updates of externals). */
//      case svn_wc_notify_update_completed: mark = "Done"; break;
      
      /** Committing a modification. */
      case svn_wc_notify_commit_modified: mark = "Sending"; break;
      
      /** Committing an addition. */
      case svn_wc_notify_commit_added: mark = "Adding"; break;
      
      /** Committing a deletion. */
      case svn_wc_notify_commit_deleted: mark = "Deleting"; break;
      
      /** Committing a replacement. */
      case svn_wc_notify_commit_replaced:  mark = "Replacing"; break;
      
      /** Transmitting post-fix text-delta data for a file. */
      case svn_wc_notify_commit_postfix_txdelta: mark = "."; break;
      
      /** Starting an update operation.  @since New in 1.7. */
      case svn_wc_notify_update_started: mark = "Start update"; break;
        
      /** Conflict resolver is starting.
       * This can be used by clients to detect when to display conflict summary
       * information, for example.
       * @since New in 1.8. */
      case svn_wc_notify_conflict_resolver_starting: mark = "!"; return;
      
      /** Conflict resolver is done.
       * This can be used by clients to detect when to display conflict summary
       * information, for example.
       * @since New in 1.8. */
      case svn_wc_notify_conflict_resolver_done: mark = "!"; return;
        
      /** Committing a non-overwriting copy (path is the target of the
       * copy, not the source).
       * @since New in 1.7. */
      case svn_wc_notify_commit_copied: mark = "Adding"; break;
        
        // default
      default: return;
    }

    self->console_log(mark, "", self->format_path(notify->path));
  }
  
  static svn_error_t* get_svn_cancel_err() {
    static svn_error_t* m_cancel_err = NULL;
    if(!m_cancel_err){
      m_cancel_err = svn_error_create(SVN_ERR_CANCELLED, NULL, "cancel");
    }
    return m_cancel_err;
  }
  
  // 取消回调,由svn-lib调用,返回非SVN_NO_ERROR表示要取消操作
  static svn_error_t* svn_cancel_func(void *cancel_baton){
    Subversion* self = (Subversion*)cancel_baton;
    if (self->m_cancel_async) {     // 已取消,所以取消操作
      self->m_cancel_async = false; // 一次设置一次使用
      return get_svn_cancel_err();
    }
    return SVN_NO_ERROR;
  }
  
  void init() JErr {
    
    if(is_init()){
      return;
    }
    
    apr_pool_initialize();
    apr_pool_create_core(&m_pool);
    
    svn_error_t* err = svn_client_create_context2(&m_ctx, apr_hash_make(m_pool), m_pool);
    
    if(err){
      jtn::Exception exception(err->message);
      release();
      throw exception;
    }
    
    svn_auth_provider_object_t* provider;
    apr_array_header_t* providers =
      apr_array_make(m_pool, 5, sizeof(svn_auth_provider_object_t*));
    
    svn_auth_get_simple_provider2(&provider, svn_auth_plaintext_prompt, this, m_pool); //
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_username_provider(&provider, m_pool);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    svn_auth_get_ssl_server_trust_prompt_provider(&provider,
                            svn_auth_ssl_server_trust_prompt, this, m_pool);
    APR_ARRAY_PUSH(providers, svn_auth_provider_object_t*) = provider;
    
    svn_auth_baton_t* auth_baton;
    
    jtn::voidp config_dir =
      apr_pstrdup(m_pool, (jtn::FilePath::document_dir() + ".subversion").c());
    svn_auth_open(&auth_baton, providers, m_pool);
    svn_auth_set_parameter(auth_baton, SVN_AUTH_PARAM_CONFIG_DIR, config_dir);
    svn_auth_set_parameter(auth_baton, SVN_AUTH_PARAM_NON_INTERACTIVE, "");
    svn_auth_set_parameter(auth_baton, SVN_AUTH_PARAM_DEFAULT_USERNAME, *m_user);
    svn_auth_set_parameter(auth_baton, SVN_AUTH_PARAM_DEFAULT_PASSWORD, *m_passwd);
    
    m_ctx->auth_baton = auth_baton;
    m_ctx->log_msg_func3 = svn_client_get_commit_log3;
    m_ctx->log_msg_baton3 = this;
    m_ctx->conflict_func2 = svn_wc_conflict_resolver_func2;
    m_ctx->conflict_baton2 = this;
    m_ctx->progress_func = svn_ra_progress_notify_func;
    m_ctx->progress_baton = this;
    m_ctx->notify_func2 = svn_wc_notify_func2;
    m_ctx->notify_baton2 = this;
    m_ctx->cancel_func = svn_cancel_func;
    m_ctx->cancel_baton = this;
  }
  
  void release() {
    if (m_pool) {
      if(m_async_work){ // 当前正在异步工作中,不能立即释放
        m_cancel_async = true; // 取消
        m_ready_release = true; // 准备释放
      } else {
        apr_pool_destroy(m_pool);
        m_pool = NULL;
      }
    }
  }
  
  // 取消当前的异步操作
  void cancel() {
    m_cancel_async = true;// 取消标志
  }
  
  // 拉取代码
  void checkout(jtn::CStringRef cb){
    std::thread([&, cb]() {
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      svn_revnum_t rev;
      svn_opt_revision_t revision = { svn_opt_revision_head };
      svn_error_t* err = svn_client_checkout3(&rev,
                                              *m_path,
                                              *m_local,
                                              &revision,
                                              &revision,
                                              svn_depth_unknown,
                                              true,
                                              false,
                                              m_ctx,
                                              pool);
      int rev_i = rev;
      console_log("At revision", *jtn::String::format("%d", rev_i));
      console_log("Done", "", "");
      callback(err, rev_i);
      apr_pool_destroy(pool);
    }).detach();
  }
  
  // 更新
  void update(jtn::CStringRef path, jtn::CStringRef cb){
    // 可能时候会比较长,在新的线程中工作,这里还需要有个取消句柄
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      apr_array_header_t* result_revs;
      svn_opt_revision_t revision = { svn_opt_revision_head };
      apr_array_header_t* paths = apr_array_make (pool, 1, sizeof(jtn::ccharp));
      APR_ARRAY_PUSH(paths, jtn::ccharp) = apr_pstrdup(pool, *(this->m_local + path));
      
      svn_error_t* err = svn_client_update4(&result_revs,
                                            paths,
                                            &revision,
                                            svn_depth_unknown,
                                            true,
                                            true,
                                            false,
                                            false,
                                            false,
                                            m_ctx,
                                            pool);
      
      jtn::String revs = convert_to_string<svn_revnum_t>(result_revs);
      console_log("At revision", *revs);
      console_log("Done", "", *path);
      callback(err, revs); // 加入到nodejs消息队列,回调
      apr_pool_destroy(pool);
    }).detach();
  }
  
  // 合并解决冲突
  void resolved(jtn::CStringRef path, jtn::CStringRef cb){
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      svn_error_t* err = svn_client_resolve(apr_pstrdup(pool, *(m_local + path)),
                                            svn_depth_unknown,
                                            svn_wc_conflict_choose_merged, // 合并
                                            m_ctx,
                                            pool);
      callback(err, "");
      apr_pool_destroy(pool);
    }).detach();
  }
  
  // 获取状态
  void status(jtn::CStringRef path, jtn::CStringRef cb) {
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      // TODO Empty 有空在搞吧!反正现在也不需要这个功能
      svn_error_t* err = SVN_NO_ERROR;
      callback(err, "");
    }).detach();
  }
  
  // 状态回调
  static svn_error_t* svn_client_status_func(void* baton,
                                             const char* path,
                                             const svn_client_status_t* status,
                                             apr_pool_t* scratch_pool){
    Subversion* self = (Subversion*)baton;
    self->m_status = status;
    return SVN_NO_ERROR;
  }
  
  // 获取文件状态代码
  jtn::ccharp stat_code(jtn::CStringRef path) {
    apr_pool_t* pool;
    apr_pool_create(&pool, m_pool);
    svn_revnum_t result_rev;
    svn_opt_revision_t revision = { svn_opt_revision_head };
    
    svn_error_t* err = svn_client_status5(&result_rev,
                                          m_ctx,
                                          apr_pstrdup(pool, *(this->m_local + path)),
                                          &revision,
                                          svn_depth_empty,
                                          true,
                                          false,
                                          true,
                                          false,
                                          true,
                                          NULL,
                                          svn_client_status_func,
                                          this,
                                          pool);
    // JDebug("code", path);
    
    if (err) {
      apr_pool_destroy(pool);
      return "?";
    }
    
    if (m_status->wc_is_locked) {
      apr_pool_destroy(pool);
      return "L"; // 锁定,需要解锁
    }
    
    jtn::ccharp ret = "S";
    
    switch (m_status->node_status) {
        
        /** does not exist */
      case svn_wc_status_none: ret = "I"; break;
        
        /** is not a versioned thing in this wc */
      case svn_wc_status_unversioned: ret = "?"; break;
        
        /** exists, but uninteresting */
      case svn_wc_status_normal: ret = "S"; break;
        
        /** is scheduled for addition */
      case svn_wc_status_added: ret = "A"; break;
        
        /** under v.c., but is missing */ // 可能是本地删除的
      case svn_wc_status_missing: ret = "d"; break;
        
        /** scheduled for deletion */
      case svn_wc_status_deleted: ret = "D"; break;
        
        /** was deleted and then re-added */
      case svn_wc_status_replaced: ret = "M"; break;
        
        /** text or props have been modified */
      case svn_wc_status_modified: ret = "M"; break;
        
        /** local mods received repos mods (### unused) */
      case svn_wc_status_merged: ret = "M"; break;
        
        /** local mods received conflicting repos mods */
      case svn_wc_status_conflicted: ret = "!"; break;
        
        /** is unversioned but configured to be ignored */
      case svn_wc_status_ignored: ret = "I"; break;
        
        /** an unversioned resource is in the way of the versioned resource */
      case svn_wc_status_obstructed: ret = "S"; break;
        
        /** an unversioned directory path populated by an svn:externals
         property; this status is not used for file externals */
      case svn_wc_status_external: ret = "S"; break;
        
        /** a directory doesn't contain a complete entries list */
      case svn_wc_status_incomplete: ret = "S"; break;
    }
    
    apr_pool_destroy(pool);
    
    return ret;
  }
  
  // svn api
  void add(jtn::CStringRef path, jtn::CStringRef cb) {
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      
      svn_error_t* err = svn_client_add5(apr_pstrdup(pool, *(m_local + path)),
                                         svn_depth_infinity,
                                         true,
                                         false,
                                         false,
                                         true,
                                         m_ctx,
                                         pool);
      callback(err, "");
      apr_pool_destroy(pool);
    }).detach();
  }
  
  
  static svn_error_t* svn_commit_callback(const svn_commit_info_t* commit_info,
                                          void* baton,
                                          apr_pool_t* pool){
    Subversion* self = (Subversion*)baton;
    jtn::String ver = (int)commit_info->revision;
    self->console_log("Committed revision", *ver);
    return SVN_NO_ERROR;
  }
  
  // 提交到服务器
  void commit(jtn::CStringRef path, jtn::CStringRef cb){
    std::thread([&, path, cb](){
      console_log("Start commit", "", *path);
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      apr_array_header_t* targets = apr_array_make(pool, 1, sizeof(jtn::ccharp));
      APR_ARRAY_PUSH(targets, jtn::ccharp) = apr_pstrdup(pool, *(m_local + path));
      
      svn_error_t* err = svn_client_commit6(targets,
                                            svn_depth_infinity,
                                            false,
                                            false,
                                            true,
                                            false,
                                            false,
                                            NULL,
                                            NULL,
                                            svn_commit_callback,
                                            this,
                                            m_ctx,
                                            pool);
      callback(err, "");
      apr_pool_destroy(pool);
      console_log("Done", "", *path);
    }).detach();
  }
  
  // 清理
  void cleanup(jtn::CStringRef path, jtn::CStringRef cb){
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      svn_error_t* err =
      svn_client_cleanup(apr_pstrdup(pool, *(m_local + path)), m_ctx, pool);
      callback(err, "");
      apr_pool_destroy(pool);
    }).detach();
  }
  
  // 解锁
  void unlock(jtn::CStringRef path, jtn::CStringRef cb) {
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      apr_array_header_t* targets = apr_array_make(pool, 1, sizeof(jtn::ccharp));
      APR_ARRAY_PUSH(targets, jtn::ccharp) = apr_pstrdup(pool, *(m_local + path));
      svn_error_t* err = svn_client_unlock(targets, false, m_ctx, pool);
      
      callback(err, "");
      apr_pool_destroy(pool);
    }).detach();
  }
  
  // 查找冲突列表回调
  static svn_error_t* svn_client_status_func2(void* baton,
                                              const char* path,
                                              const svn_client_status_t* status,
                                              apr_pool_t* scratch_pool){
    if (status->node_status == svn_wc_status_conflicted) {
      Subversion* self = (Subversion*)baton;
      self->m_conflict_list->push_back(self->format_path(status->local_abspath));
      if(self->m_conflict_list->size() >= self->m_query_max_conflict_count){
        return get_svn_cancel_err();
      }
    }
    return SVN_NO_ERROR;
  }
  
  /**
   * 查询冲突列表
   */
  void conflict_list(jtn::CStringRef path, int count, jtn::CStringRef cb) {
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      svn_revnum_t result_rev;
      svn_opt_revision_t revision = { svn_opt_revision_head };
      
      std::list<jtn::String> conflict_list;
      
      m_conflict_list = &conflict_list;
      m_query_max_conflict_count = count;
      
      svn_error_t* err = svn_client_status5(&result_rev,
                                            m_ctx,
                                            apr_pstrdup(pool, *(this->m_local + path)),
                                            &revision,
                                            svn_depth_unknown,
                                            true,
                                            false,
                                            true,
                                            false,
                                            true,
                                            NULL,
                                            svn_client_status_func2,
                                            this,
                                            pool);
      
      m_conflict_list = NULL;
      
      callback(err, conflict_list, [](std::list<jtn::String>& list){
        
        Isolate* iso = Isolate::GetCurrent();
        
        Handle<Array> arr = Array::New(iso);
        int i = 0;
        
        std::for_each(begin(list), end(list), [&](jtn::String& path) {
          arr->Set(Int32::New(iso, i), OneByteString(iso, *path));
          i++;
        });
        Handle<Value> rev = arr;
        return rev;
      });
      
      apr_pool_destroy(pool);
    }).detach();
  }
  
  static svn_error_t* svn_client_info_receiver(void *baton,
                                               const char *abspath_or_url,
                                               const svn_client_info2_t *info,
                                               apr_pool_t *scratch_pool){
    return SVN_NO_ERROR;
  }
  
  // 测试这个svn路径是否有效
  void test(jtn::CStringRef cb){
    std::thread([&, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      
      svn_opt_revision_t revision = { svn_opt_revision_head };
      svn_error_t* err = svn_client_info3(apr_pstrdup(pool, *m_path),
                                          &revision,
                                          &revision,
                                          svn_depth_empty,
                                          false,
                                          false,
                                          NULL,
                                          svn_client_info_receiver,
                                          this,
                                          m_ctx,
                                          pool);
      bool is = err == NULL;
      
      callback(err, is, [](bool& is){
        Handle<Value> rev = Boolean::New(Isolate::GetCurrent(), is);
        return rev;
      });
      apr_pool_destroy(pool);
    }).detach();
  }
  
  static svn_error_t* svn_remove_cb(const svn_commit_info_t *commit_info,
                                    void *baton,
                                    apr_pool_t *pool){
    return SVN_NO_ERROR;
  }
  
  void remove(jtn::CStringRef path, jtn::CStringRef cb) {
    std::thread([&, path, cb]() {
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      apr_array_header_t* paths = apr_array_make(pool, 1, sizeof(jtn::ccharp));
      APR_ARRAY_PUSH(paths, jtn::ccharp) = apr_pstrdup(pool, *(m_local + path));
      
      svn_error_t* err = svn_client_delete4(paths,
                                            true,
                                            false,
                                            NULL,
                                            svn_remove_cb,
                                            this,
                                            m_ctx,
                                            pool);
      callback(err, "");
      apr_pool_destroy(pool);
    }).detach();
  }
  
  static svn_error_t* svn_rename_cb(const svn_commit_info_t *commit_info,
                                    void *baton,
                                    apr_pool_t *pool){
    return SVN_NO_ERROR;
  }
  
  void rename(jtn::CStringRef path, jtn::CStringRef new_path, jtn::CStringRef cb){
    std::thread([&, path, new_path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      apr_array_header_t* src_paths = apr_array_make(pool, 1, sizeof(jtn::ccharp));
      APR_ARRAY_PUSH(src_paths, jtn::ccharp) = apr_pstrdup(pool, *(m_local + path));
      
      svn_error_t* err = svn_client_move7(src_paths,
                                          apr_pstrdup(pool, *(m_local + new_path)),
                                          false,
                                          true,
                                          true,
                                          true,
                                          NULL,
                                          svn_rename_cb,
                                          this,
                                          m_ctx,
                                          pool);
      callback(err, "");
      apr_pool_destroy(pool);
    }).detach();
  }
  
  //*******************************************************************************************
  
  // 重置文件本地的修改变化
  void revert(jtn::CStringRef path, jtn::CStringRef cb){
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      apr_array_header_t* targets = apr_array_make(pool, 1, sizeof(jtn::ccharp));
      APR_ARRAY_PUSH(targets, jtn::ccharp) = apr_pstrdup(pool, *(m_local + path));
      svn_error_t* err = svn_client_revert2(targets,
                         svn_depth_unknown,
                         NULL,
                         m_ctx,
                         pool);
      callback(err, "");
      apr_pool_destroy(pool);
    }).detach();
  }
  
  void merge(jtn::CStringRef path, jtn::CStringRef path2,
             jtn::CStringRef wcpath, jtn::CStringRef cb){
    std::thread([&, path, path2, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      apr_pool_t* pool;
      apr_pool_create(&pool, m_pool);
      
      svn_opt_revision_t revision = { svn_opt_revision_head };
      
      svn_error_t* err =  svn_client_merge5(apr_pstrdup(pool, *(m_local + path)),
                                            &revision,
                                            apr_pstrdup(pool, *(m_local + path2)),
                                            &revision,
                                            apr_pstrdup(pool, *(m_local + wcpath)),
                                            svn_depth_unknown,
                                            true,
                                            true,
                                            false,
                                            false,
                                            false,
                                            true,
                                            NULL,
                                            m_ctx,
                                            pool);
      callback(err, "");
      apr_pool_destroy(pool);
    }).detach();
  }
  
//  void blame(){ }
//  void cat(){ }
//  void changelist(){}
//  void copy(){}
//  void diff(){}
//  void exports(){}
//  void import(){}
//  void info(){}
//  void list(){}
//  void lock(){}
//  void log(){}
//  void mergeinfo(){}
//  void mkdir(){}
//  void patch(){}
//  void propdel(){}
//  void propedit(){}
//  void propget(){}
//  void proplist(){}
//  void propset(){}
//  void relocate(){}
//  void resolve(){}
//  void switchs(){}
//  void upgrade(){}
  
 public:
  static void New(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
      return TYPE_ERROR("Bad argument");
    }
    
    NodeContext* ctx = NodeContext::GetCurrent(args.GetIsolate());
    Subversion* svn =
      new Subversion(env, args.This(), ctx, *Utf8Value(args[0]), *Utf8Value(args[1]));
    
    try {
      svn->init();
    } catch (jtn::IException& ex) { TYPE_ERROR(*ex.message()); }
  }
  
  static void Release(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    Subversion* svn = Unwrap<Subversion>(args.Holder());
    svn->release();
  }
  
  static void Set_user(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    
    if (args.Length() < 1 || !args[0]->IsString()) {
      return TYPE_ERROR("Bad argument");
    }
    Subversion* svn = Unwrap<Subversion>(args.Holder());
    svn->set_user(*Utf8Value(args[0]));
  }
  
  static void Set_passwd(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    
    if (args.Length() < 1 || !args[0]->IsString()) {
      return TYPE_ERROR("Bad argument");
    }
    Subversion* svn = Unwrap<Subversion>(args.Holder());
    svn->set_passwd(*Utf8Value(args[0]));
  }
  
  static void User(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    Subversion* svn = Unwrap<Subversion>(args.Holder());
    args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), *svn->user()));
  }
  
  static void Passwd(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    Subversion* svn = Unwrap<Subversion>(args.Holder());
    args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), *svn->passwd()));
  }
  
  static void Add(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(add, args[1], *Utf8Value(args[0]));
  }
  
  static void Checkout(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 1 || !args[0]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    if (is_support_high()){
      async_call_svn_api(checkout, args[0]);
    } else {
      callback_error(args.GetIsolate(), args[0], "只有Ph与Pro版本才有此功能");
    }
  }
  
  static void Cleanup(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(cleanup, args[1], *Utf8Value(args[0]));
  }
  
  static void Commit(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    if (is_support_high()) {
      async_call_svn_api(commit, args[1], *Utf8Value(args[0]));
    } else {
      callback_error(args.GetIsolate(), args[1], "只有Ph与Pro版本才有此功能");
    }
  }
  
  static void Remove(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(remove, args[1], *Utf8Value(args[0]));
  }
  
  static void Merge(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 4 ||
        !args[0]->IsString() ||
        !args[1]->IsString() ||
        !args[2]->IsString() ||
        !args[3]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(merge, args[3],
                       *Utf8Value(args[0]), *Utf8Value(args[1]), *Utf8Value(args[2]));
  }
  
  static void Rename(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 3 ||
        !args[0]->IsString() ||
        !args[1]->IsString() ||
        !args[2]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(rename, args[2], *Utf8Value(args[0]), *Utf8Value(args[1]));
  }
  
  static void Resolved(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(resolved, args[1], *Utf8Value(args[0]));
  }
  
  static void Revert(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(revert, args[1], *Utf8Value(args[0]));
  }
  
  static void Status(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(status, args[1], *Utf8Value(args[0]));
  }
  
  static void Stat_code(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 1 || !args[0]->IsString()) {
      return TYPE_ERROR("Bad argument");
    }
    Subversion* svn = Unwrap<Subversion>(args.Holder());
    jtn::String str = svn->stat_code(*Utf8Value(args[0]));
    args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), *str));
  }
  
  static void Unlock(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(unlock, args[1], *Utf8Value(args[0]));
  }
  
  static void Update(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    if (is_support_high()){
      async_call_svn_api(update, args[1], *Utf8Value(args[0]));
    } else {
      callback_error(args.GetIsolate(), args[1], "只有Ph与Pro版本才有此功能");
    }
  }
  
  /**
   * 查询冲突列表
   */
  static void Conflict_list(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 3 ||
        !args[0]->IsString() ||
        !args[1]->IsInt32() ||
        !args[2]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(conflict_list, args[2], *Utf8Value(args[0]), args[1]->ToInt32()->Value());
  }
  
  /**
   * 查询冲突列表
   */
  static void Test(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 1 || !args[0]->IsFunction()) {
      return TYPE_ERROR("Bad argument");
    }
    async_call_svn_api(test, args[0]);
  }
  
  static void Cancel(const FunctionCallbackInfo<Value>& args){
    Unwrap<Subversion>(args.Holder())->cancel();
  }
  
  static void Noop(const FunctionCallbackInfo<Value>& args){
    
  }
  
private:
  jtn::String m_path;
  jtn::String m_local;
  NodeContext* m_node_ctx;
  apr_pool_t* m_pool;
  svn_client_ctx_t* m_ctx;
  std::mutex m_run_lock;  // 运行锁
  jtn::String m_user;
  jtn::String m_passwd;
  bool m_async_work;   // 当前是否异步工作中
  bool m_cancel_async;
  bool m_ready_release; // 准备要释放
  const svn_client_status_t* m_status;
  std::list<jtn::String>* m_conflict_list;
  int m_query_max_conflict_count;
};

static void InitNativeSvn(Handle<Object> target, Handle<Value> unused,
                          Handle<Context> context, void* priv) {
  Environment* env = Environment::GetCurrent(context);
  Local<FunctionTemplate> svn = FunctionTemplate::New(env->isolate(), Subversion::New);
  svn->InstanceTemplate()->SetInternalFieldCount(1);
  NODE_SET_PROTOTYPE_METHOD(svn, "release", Subversion::Release);
  NODE_SET_PROTOTYPE_METHOD(svn, "set_user", Subversion::Set_user);
  NODE_SET_PROTOTYPE_METHOD(svn, "set_passwd", Subversion::Set_passwd);
  NODE_SET_PROTOTYPE_METHOD(svn, "user", Subversion::User);
  NODE_SET_PROTOTYPE_METHOD(svn, "passwd", Subversion::Passwd);
  NODE_SET_PROTOTYPE_METHOD(svn, "add", Subversion::Add);
  NODE_SET_PROTOTYPE_METHOD(svn, "checkout", Subversion::Checkout);
  NODE_SET_PROTOTYPE_METHOD(svn, "cleanup", Subversion::Cleanup);
  NODE_SET_PROTOTYPE_METHOD(svn, "commit", Subversion::Commit);
  NODE_SET_PROTOTYPE_METHOD(svn, "remove", Subversion::Remove);
  NODE_SET_PROTOTYPE_METHOD(svn, "merge", Subversion::Merge);
  NODE_SET_PROTOTYPE_METHOD(svn, "rename", Subversion::Rename);
  NODE_SET_PROTOTYPE_METHOD(svn, "resolved", Subversion::Resolved);
  NODE_SET_PROTOTYPE_METHOD(svn, "revert", Subversion::Revert);
  NODE_SET_PROTOTYPE_METHOD(svn, "status", Subversion::Status);
  NODE_SET_PROTOTYPE_METHOD(svn, "stat_code", Subversion::Stat_code);
  NODE_SET_PROTOTYPE_METHOD(svn, "unlock", Subversion::Unlock);
  NODE_SET_PROTOTYPE_METHOD(svn, "update", Subversion::Update);
  NODE_SET_PROTOTYPE_METHOD(svn, "conflict_list", Subversion::Conflict_list);
  NODE_SET_PROTOTYPE_METHOD(svn, "test", Subversion::Test);
  NODE_SET_PROTOTYPE_METHOD(svn, "cancel", Subversion::Cancel);
  NODE_SET_PROTOTYPE_METHOD(svn, "onconsole_log_handle", Subversion::Noop);
  target->Set(FIXED_ONE_BYTE_STRING(env->isolate(), "Subversion"), svn->GetFunction());
}

T_End

NODE_MODULE_CONTEXT_AWARE_BUILTIN(native_svn, tc::InitNativeSvn);
