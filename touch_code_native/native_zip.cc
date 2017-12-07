/**
 * @createTime 2015-02-17
 * @author louis.tru <louistru@live.com>
 * @copyright © 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#include <ngui/base/util.h>
#include <ngui/base/zlib.h>
#include <ngui/base/fs.h>
#include <ngui/base/string.h>
#include <ngui/base/error.h>
#include <util.h>
#include <node.h>
#include <async-wrap.h>
#include <async-wrap-inl.h>
#include <env.h>
#include <env-inl.h>

using namespace node;
using namespace v8;

//

JNs(tc);

#define TYPE_ERROR(msg) env->ThrowTypeError(msg)

/**
 * @class teide::ZipDecompress
 */
class ZipDecompress: public BaseObject {
 public:
  
  /**
   * @constructor
   */
  ZipDecompress(Environment* env, Local<Object> wrap, tr::CStringRef path)
    : BaseObject(env, wrap)
    , m_zip_path(path)
    , mZipReader(NULL)
    {
    MakeWeak<ZipDecompress>(this);
  }
  
  void init() JErr {
    // 选初始化,这个有异常抛出
    mZipReader = new tr::ZipReader(m_zip_path);
  }
  
  /**
   * @destructor
   */
  ~ZipDecompress(){
    close();
  }
  
  /**
   * 解压当前文件到目录,成功返回true
   */
  bool decompress(tr::CStringRef save){
    
    tr::FilePath path = save; //dir + mZipReader->name();
    
    if(!tr::FileHelper::mkdir_p(path.dir())){ // 创建目录
      return false;
    }
    
    tr::String name = mZipReader->name();
    if(name[name.length() - 1] == '/'){ // 目录
      return true;
    }
    
    tr::File file(path.path());
    
    if(!file.open()){ // 打开文件
      return false;
    }
    
    int size = 1024 * 100; // 100 kb
    tr::Handles<char> buffer = new char[size];
    int len = mZipReader->read(*buffer, size);
    
    while(len){
      if(!file.write(*buffer, len)){
        return false;
      }
      len = mZipReader->read(*buffer, size);
    }
    
    return true;
  }
  
  /**
   * 定位到下一个文件,成功返回true
   */
  bool next() {
    return mZipReader->next();
  }
  
  /**
   * 当前文件名称
   */
  tr::String name(){
    return mZipReader->name();
  }
  
  /**
   * 关闭
   */
  void close() {
    if(mZipReader){
      delete mZipReader;
      mZipReader = NULL;
    }
  }
  
  // 解压当前文件到目录
  static void Decompress(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    
    if (args.Length() < 1 || !args[0]->IsString()) {
      return TYPE_ERROR("Bad argument");
    }
    ZipDecompress* ctx = Unwrap<ZipDecompress>(args.Holder());
    return args.GetReturnValue()
      .Set(Boolean::New(args.GetIsolate(), ctx->decompress(*Utf8Value(args[0]))));
  }
  
  // 定位
  static void Next(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    ZipDecompress* ctx = Unwrap<ZipDecompress>(args.Holder());
    args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), ctx->next()));
  }
  
  // 名称
  static void Name(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    ZipDecompress* ctx = Unwrap<ZipDecompress>(args.Holder());
    args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), ctx->name().c()));
  }
  
  // 关闭压缩包
  static void Close(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    ZipDecompress* ctx = Unwrap<ZipDecompress>(args.Holder());
    ctx->close();
  }
  
  // 新对像
  static void New(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    
    if (args.Length() < 1 || !args[0]->IsString()) {
      return TYPE_ERROR("Bad argument");
    }
    try {
      (new ZipDecompress(env, args.This(), *Utf8Value(args[0])))->init();
    }
    catch (tr::IException& ex) {
      TYPE_ERROR(ex.message().c());
    }
  }
  
 private:
  tr::String      m_zip_path;
  tr::ZipReader*  mZipReader;
};

/**
 * @class teide::ZipCompress
 */
class ZipCompress: public BaseObject {
 public:
  
  /**
   * @constructor
   */
  ZipCompress(Environment* env, Local<Object> wrap, tr::CStringRef path)
    : BaseObject(env, wrap)
    , m_zip_path(path)
    , mZipWrite(NULL) {
    MakeWeak<ZipCompress>(this);
  }
  
  /**
   * @destructor
   */
  ~ZipCompress() {
    close();
  }
  
  void init() {
    mZipWrite = new tr::ZipWriter(m_zip_path);
  }
  
  /**
   * 压缩一个文件到压缩包
   * @param {tr::CString&} source
   * @param {tr::CString&} target
   * @return {bool}
   */
  bool compress(tr::CStringRef source, tr::CStringRef target) {
    
    if(!mZipWrite->add_file(target)){
      return false;
    }
    
    tr::File file(source);
    
    if(!file.open(tr::IFile::Read)){
      return false;
    }
    
    int size = 1024 * 100; // 100 kb
    tr::Handle<char> buffer = new char[size];
    int len = file.read(*buffer, size);
    
    do{
      if(!mZipWrite->write(*buffer, len)){
        return false;
      }
      len = file.read(*buffer, size);
    }while(len);
    
    return true;
  }
  
  /**
   * 关闭
   */
  void close() {
    if(mZipWrite){
      delete mZipWrite;
      mZipWrite = NULL;
    }
  }
  
  // 添加文件
  static void Compress(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
      return TYPE_ERROR("Bad argument");
    }
    ZipCompress* ctx = Unwrap<ZipCompress>(args.Holder());
    Utf8Value source(args[0]);
    Utf8Value target(args[1]);
    args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), ctx->compress(*source, *target)));
  }
  
  // 写入文件
  static void Close(const FunctionCallbackInfo<Value>& args) {
    HandleScope scope(args.GetIsolate());
    ZipCompress* ctx = Unwrap<ZipCompress>(args.Holder());
    ctx->close();
  }
  
  // 新对像
  static void New(const FunctionCallbackInfo<Value>& args) {
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    if (args.Length() < 1 || !args[0]->IsString()) {
      return TYPE_ERROR("Bad argument");
    }
    
    try {
      (new ZipCompress(env, args.This(), *Utf8Value(args[0])))->init();
    }
    catch (tr::IException& ex) {
      TYPE_ERROR(ex.message().c());
    }
  }
  
 private:
  tr::String      m_zip_path;
  tr::ZipWriter*  mZipWrite;
};

static void InitNativeZip(Handle<Object> target,
                          Handle<Value> unused,
                          Handle<Context> context,
                          void* priv) {
  Environment* env = Environment::GetCurrent(context);

  Local<FunctionTemplate> compress = FunctionTemplate::New(env->isolate(), ZipCompress::New);
  compress->InstanceTemplate()->SetInternalFieldCount(1);
  NODE_SET_PROTOTYPE_METHOD(compress, "compress", ZipCompress::Compress);
  NODE_SET_PROTOTYPE_METHOD(compress, "close", ZipCompress::Close);
  compress->SetClassName(FIXED_ONE_BYTE_STRING(env->isolate(), "ZipCompress"));
  target->Set(FIXED_ONE_BYTE_STRING(env->isolate(), "ZipCompress"), compress->GetFunction());
  
  Local<FunctionTemplate> decompress = FunctionTemplate::New(env->isolate(), ZipDecompress::New);
  decompress->InstanceTemplate()->SetInternalFieldCount(1);
  NODE_SET_PROTOTYPE_METHOD(decompress, "decompress", ZipDecompress::Decompress);
  NODE_SET_PROTOTYPE_METHOD(decompress, "next", ZipDecompress::Next);
  NODE_SET_PROTOTYPE_METHOD(decompress, "name", ZipDecompress::Name);
  NODE_SET_PROTOTYPE_METHOD(decompress, "close", ZipDecompress::Close);
  decompress->SetClassName(FIXED_ONE_BYTE_STRING(env->isolate(), "ZipDecompress"));
  target->Set(FIXED_ONE_BYTE_STRING(env->isolate(), "ZipDecompress"), decompress->GetFunction());
}

JEnd

NODE_MODULE_CONTEXT_AWARE_BUILTIN(native_zip, tc::InitNativeZip)
