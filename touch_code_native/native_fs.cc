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
#include <truth/util.h>
#include <truth/fs.h>
#include <truth/handle.h>
#include <truth/exception.h>
#include <thread>
#include <node_context.h>

using namespace node;
using namespace v8;

TNs(tc);

#define TYPE_ERROR(msg) env->ThrowTypeError(msg)
#define _call_fs_api_(name, ...) self->name(__VA_ARGS__)
#define async_call_fs_api(name, cb, ...) {\
    NativeFile* self = Unwrap<NativeFile>(args.Holder()); \
    tr::String cb_id = tr::id(); \
    self->object()->Set(OneByteString(args.GetIsolate(), *cb_id), (cb)); \
    _call_fs_api_(name, ##__VA_ARGS__, cb_id); \
  }((void)0)

#define callback(error, rev, ...)  \
  callback_func<decltype(rev)>(this, tr::move(cb), (error), tr::move(rev), ##__VA_ARGS__)

class NativeFile: public BaseObject {
  
 public:
  /**
   * @constructor
   */
  NativeFile(Environment* env, v8::Local<v8::Object> wrap, NodeContext* ctx)
  : BaseObject(env, wrap)
  , m_node_ctx(ctx)
  , stop_signal(false){
    MakeWeak<NativeFile>(this);
  }
  
  virtual ~NativeFile(){
    
  }

 private:
  
  template<class T>
  static void callback_func(NativeFile* self,
                            tr::String cb,
                            tr::Exception* error,
                            T rev,
                            bool is_cancel,
                            Handle<Value> (*func)(T &)){
    struct Return {
      NativeFile* self;
      tr::String cb;
      tr::Handle<tr::Exception> error;
      T rev;
      bool is_cancel;
      Handle<Value> (*func)(T& data);
    };
    
    self->m_node_ctx->push_run_queue([](NodeContext* ctx, void* data) {
      tr::Handle<Return> h = (Return*)data;
      Isolate* iso = ctx->isolate();
      
      Handle<Value> v8_err = Null(iso);
      
      if(!h->error.is_null()){
        Handle<Object> err_rev = Object::New(iso);
        err_rev->Set(OneByteString(iso, "code"), Int32::New(iso, h->error->code()));
        err_rev->Set(OneByteString(iso, "message"),
                     String::NewFromUtf8(iso, *h->error->message()));
        v8_err = err_rev;
      }
      
      Handle<Value> argv[] = {
        v8_err,
        h->func(h->rev),
        Boolean::New(iso, h->is_cancel),
      };
      
      Handle<String> key = OneByteString(ctx->isolate(), *h->cb);
      Handle<Value> func = h->self->object()->Get(key);
      
      if (func->IsFunction()) {
        h->self->object()->Delete(key);
        func.As<Function>()->Call(h->self->object(), 3, argv);
      }
    }, new Return({
      self,
      tr::move(cb),
      error ? new tr::Exception(*error) : NULL,
      tr::move(rev),
      is_cancel,
      func
    }));
  }
  
  template<class T>
  static void callback_func(NativeFile* self,
                            tr::String cb,
                            tr::Exception* error,
                            tr::String rev,
                            bool is_cancel){
    callback_func<tr::String>(self, tr::move(cb), error, tr::move(rev), is_cancel,
                              [](tr::StringRef rev){
      Handle<Value> ret = String::NewFromUtf8(Isolate::GetCurrent(), *rev);
      return ret;
    });
  }
  
  void cp(tr::CStringRef source, tr::CStringRef target, tr::CStringRef cb){
    std::thread([&, source, target, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      
      bool is = tr::FileHelper::cp_p(source, target, &stop_signal);
      if (is || stop_signal) {
        callback(NULL, "", stop_signal);
      } else {
        tr::Exception error("Clone file error");
        callback(&error, "", stop_signal);
      }
      stop_signal = false;
    }).detach();
  }
  
  void rm(tr::CStringRef path, tr::CStringRef cb) {
    std::thread([&, path, cb](){
      std::lock_guard<std::mutex> lock(m_run_lock); // 锁定
      
      bool is = tr::FileHelper::rm_p(path, &stop_signal);
      if (is || stop_signal) {
        callback(NULL, "", stop_signal);
      } else {
        tr::Exception error("Remove file error");
        callback(&error, "", stop_signal);
      }
      stop_signal = false;
    }).detach();
  }
  
  void cancel() {
    stop_signal = true;
  }
  
 public:
  
  static void New(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    NodeContext* ctx = NodeContext::GetCurrent(args.GetIsolate());
    new NativeFile(env, args.This(), ctx);
  }
  
  static void Cp(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 3 ||
        !args[0]->IsString() ||
        !args[1]->IsString() ||
        !args[2]->IsFunction()) {
      return env->ThrowTypeError("Bad argument");
    }
    async_call_fs_api(cp, args[2], *Utf8Value(args[0]), *Utf8Value(args[1]));
  }
  
  static void Rm(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 2 ||
        !args[0]->IsString() ||
        !args[1]->IsFunction()) {
      return env->ThrowTypeError("Bad argument");
    }
    async_call_fs_api(rm, args[1], *Utf8Value(args[0]));
  }
  
  static void Cancel(const FunctionCallbackInfo<Value>& args) {
    HandleScope scope(args.GetIsolate());
    Unwrap<NativeFile>(args.Holder())->cancel();
  }
  
 private:
  NodeContext* m_node_ctx;
  std::mutex m_run_lock;  // 运行锁
  bool stop_signal;
};

static void InitNativeFile(Handle<Object> target, Handle<Value> unused,
                          Handle<Context> context, void* priv) {
  Environment* env = Environment::GetCurrent(context);
  Local<FunctionTemplate> fs = FunctionTemplate::New(env->isolate(), NativeFile::New);
  fs->InstanceTemplate()->SetInternalFieldCount(1);
  NODE_SET_PROTOTYPE_METHOD(fs, "cp", NativeFile::Cp);
  NODE_SET_PROTOTYPE_METHOD(fs, "rm", NativeFile::Rm);
  NODE_SET_PROTOTYPE_METHOD(fs, "cancel", NativeFile::Cancel);
  
  target->Set(FIXED_ONE_BYTE_STRING(env->isolate(), "NativeFile"), fs->GetFunction());
}

TEnd

NODE_MODULE_CONTEXT_AWARE_BUILTIN(native_fs, tc::InitNativeFile);
