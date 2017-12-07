
#include <v8.h>
#include <memory>
#include <string>
#include <stdlib.h>

using namespace v8;

class WrapHandle{
 public:
  
  WrapHandle(Isolate* isolate, Local<Object> This)
  : m_isolate(isolate)
  , m_handle(isolate, This)
  {
    This->SetAlignedPointerInInternalField(0, this);
    m_handle.MarkIndependent();
    m_handle.SetWeak(this, WeakCallback);
  }
  
  virtual ~WrapHandle(){
    m_handle.Reset();
  }
  
  Local<v8::Object> This()const{
    if (m_handle.IsWeak()) {
      return Local<Object>::New(m_isolate, m_handle);
    } else {
      return *reinterpret_cast<Local<Object>*>(const_cast<v8::Persistent<Object>*>(&m_handle));
    }
  }
  
  Persistent<Object>& handle(){
    return m_handle;
  }
  
  template<class T>
  static T* UnWrap(Local<Object> This){
    return static_cast<T*>(This->GetAlignedPointerFromInternalField(0));
  }
  
 private:
  
  static void WeakCallback(const v8::WeakCallbackData<v8::Object, WrapHandle>& wrap) {
    delete wrap.GetParameter();
  }
  
 private:
  Isolate* m_isolate;
  Persistent<Object> m_handle;
};

static void setPrototypeMethod(Handle<FunctionTemplate> recv,
                               const char* name,
                               FunctionCallback callback){
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope handle_scope(isolate);
  v8::Handle<v8::Signature> s = v8::Signature::New(isolate, recv);
  v8::Local<v8::FunctionTemplate> t =
  v8::FunctionTemplate::New(isolate, callback, v8::Handle<v8::Value>(), s);
  v8::Local<v8::Function> fn = t->GetFunction();
  recv->PrototypeTemplate()->Set(v8::String::NewFromUtf8(isolate, name), fn);
  v8::Local<v8::String> fn_name = v8::String::NewFromUtf8(isolate, name);
  fn->SetName(fn_name);
}

template <typename TypeName>
static void setMethod(const TypeName& recv, const char* name, FunctionCallback callback) {
  v8::Isolate* isolate = Isolate::GetCurrent();
  v8::HandleScope handle_scope(isolate);
  v8::Local<v8::FunctionTemplate> t = FunctionTemplate::New(isolate,
                                                            callback);
  v8::Local<v8::Function> fn = t->GetFunction();
  v8::Local<v8::String> fn_name = String::NewFromUtf8(isolate, name);
  fn->SetName(fn_name);
  recv->Set(fn_name, fn);
}

std::string Utf8Value(v8::Handle<v8::Value> value){

  if (value.IsEmpty())
    return "";
  
  v8::Local<v8::String> val_ = value->ToString();
  if (val_.IsEmpty())
    return "";
  
  // Allocate enough space to include the null terminator
  size_t len = val_->Utf8Length() + 1;
  
  char* str = static_cast<char*>(calloc(1, len));
  
  val_->WriteUtf8(str, len, 0);
  
  std::string res = str;
  free(str);
  return std::move(res);
}

// Executes a str within the current v8 context.
std::string eval(Isolate* isolate, const char* source) {
  EscapableHandleScope scope(isolate);
  
  Handle<String> code = String::NewFromUtf8(isolate, source);
  Handle<String> name = String::NewFromUtf8(isolate, "[eval]");
  
  TryCatch try_catch;
  
  // try_catch must be nonverbose to disable FatalException() handler,
  // we will handle exceptions ourself.
  try_catch.SetVerbose(false);
  
  Local<v8::Script> script = v8::Script::Compile(code, name);
  if (script.IsEmpty()) {
    return "Exception";
  }
  
  Local<Value> result = script->Run();
  if (result.IsEmpty()) {
    return "Exception";
  }
  
  return std::move(Utf8Value(result));
}

class Test: public WrapHandle{
 public:
  
  Test(Isolate* isolate, Local<Object> handle): WrapHandle(isolate, handle){
    a = new int(100);
    b = new int(200);
  }
  
  ~Test(){
    printf("%s\n", "Test destructor");
    delete a;
    delete b;
  }
  
  void print(){
    printf("%d,%d\n", *a, *b);
  }
  
  static void Print(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    Test* test = UnWrap<Test>(args.Holder());
    test->print();
  }
  
  static void StaticPrint(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    printf("%s\n", "static print");
  }
  
  static void New(const FunctionCallbackInfo<Value>& args){
    HandleScope scope(args.GetIsolate());
    new Test(args.GetIsolate(), args.This());
  }
  
 private:
  int* a;
  int* b;
};

void test_v8() {
  
  
  Isolate* isolate = Isolate::New();
  {
    Locker lock(isolate);
    Isolate::Scope isolate_scope(isolate);
    {
      HandleScope handle_scope(isolate);
      Local<Context> context = Context::New(isolate);
      Context::Scope context_scope(context);
      Local<v8::Object> global = context->Global();
      
      // binding
      Local<FunctionTemplate> wrap = FunctionTemplate::New(isolate, Test::New);
      wrap->InstanceTemplate()->SetInternalFieldCount(1);
      setPrototypeMethod(wrap, "print", Test::Print);
      setMethod(wrap, "print", Test::StaticPrint);
      wrap->SetClassName(String::NewFromUtf8(isolate, "Test"));
      global->Set(String::NewFromUtf8(isolate, "Test"), wrap->GetFunction());
      
      eval(isolate, "var test = new Test(); test.print(); Test.print(); ");
    }
    
    while(!isolate->IdleNotification(1000 / 60)) { } // 等待v8的垃圾回收线程回收内存
  }
  
  isolate->Dispose();
}


