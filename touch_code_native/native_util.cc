/**
 * @createTime 2015-03-13
 * @author louis.tru <louistru@live.com>
 * @copyright © 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#include "native_util.h"
#include "node_context.h"
#include <node.h>
#include <env.h>
#include <env-inl.h>
#include <async-wrap.h>
#include <async-wrap-inl.h>
#include <jtn/fs.h>
#include <jtn/json.h>
#include "version.h"
#include <thread>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <openssl/crypto.h>
#include <openssl/err.h>
#include <openssl/rand.h>
#include <openssl/bn.h>
#include <node_buffer.h>
#include <openssl/md5.h>

using namespace node;
using namespace v8;

//

T_Ns(tc);

typedef jtn::Event<jtn::String> EventStr;
jtn::EventDelegate<>           onopen_soft_keyboard("open_soft_keyboard");
jtn::EventDelegate<>           onclose_soft_keyboard("close_soft_keyboard");
jtn::EventDelegate<EventStr>   onclipboard_data_change("clipboard_data_change");
jtn::EventDelegate<EventStr>   onopen_external_file("open_external_file");
jtn::EventDelegate<EventStr>   ondownload_file("download_file");
jtn::EventDelegate<EventStr>   onpush_message("push_message");

static jtn::String application_info_save_path;
static jtn::JSON application_info(jtn::JSON::kObjectType);
static bool m_ = false;

#define base64_encoded_size(size) ((size + 2 - ((size + 2) % 3)) / 3 * 4)

// Doesn't check for padding at the end.  Can be 1-2 bytes over.
static inline size_t base64_decoded_size_fast(size_t size) {
  size_t remainder = size % 4;
  
  size = (size / 4) * 3;
  if (remainder) {
    if (size == 0 && remainder == 1) {
      // special case: 1-byte input cannot be decoded
      size = 0;
    } else {
      // non-padded input, add 1 or 2 extra bytes
      size += 1 + (remainder == 3);
    }
  }
  
  return size;
}

// supports regular and URL-safe base64
static const int unbase64_table[] =
{ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -2, -1, -1, -2, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, 62, -1, 63,
  52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
  -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, 63,
  -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
};
#define unbase64(x) unbase64_table[(uint8_t)(x)]

// 解码base64
jtn::Data base64_decode(jtn::CStringRef data) {
  char a, b, c, d;
  
  jtn::ccharp src = *data;
  size_t srcLen = data.length();
  char* buf = new char[srcLen];
  size_t len = base64_decoded_size_fast(srcLen);
  char* dst = buf;
  char* dstEnd = buf + len;
  const char* srcEnd = src + srcLen;
  
  while (src < srcEnd && dst < dstEnd) {
    int remaining = srcEnd - src;
    
    while (unbase64(*src) < 0 && src < srcEnd)
      src++, remaining--;
    if (remaining == 0 || *src == '=')
      break;
    a = unbase64(*src++);
    
    while (unbase64(*src) < 0 && src < srcEnd)
      src++, remaining--;
    if (remaining <= 1 || *src == '=')
      break;
    b = unbase64(*src++);
    
    *dst++ = (a << 2) | ((b & 0x30) >> 4);
    if (dst == dstEnd)
      break;
    
    while (unbase64(*src) < 0 && src < srcEnd)
      src++, remaining--;
    if (remaining <= 2 || *src == '=')
      break;
    c = unbase64(*src++);
    
    *dst++ = ((b & 0x0F) << 4) | ((c & 0x3C) >> 2);
    if (dst == dstEnd)
      break;
    
    while (unbase64(*src) < 0 && src < srcEnd)
      src++, remaining--;
    if (remaining <= 3 || *src == '=')
      break;
    d = unbase64(*src++);
    
    *dst++ = ((c & 0x03) << 6) | (d & 0x3F);
  }
  
  return jtn::Data(buf, dst - buf);
}

jtn::String base64_encode(jtn::CDataRef data) {
  
  jtn::ccharp src = *data;
  size_t slen = data.length();
  size_t dlen = base64_encoded_size(slen);
  char* dst = new char[dlen + 0];
  dst[dlen] = 0;
  
  unsigned a;
  unsigned b;
  unsigned c;
  unsigned i;
  unsigned k;
  unsigned n;
  
  static const char table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  "abcdefghijklmnopqrstuvwxyz"
  "0123456789+/";
  
  i = 0;
  k = 0;
  n = slen / 3 * 3;
  
  while (i < n) {
    a = src[i + 0] & 0xff;
    b = src[i + 1] & 0xff;
    c = src[i + 2] & 0xff;
    
    dst[k + 0] = table[a >> 2];
    dst[k + 1] = table[((a & 3) << 4) | (b >> 4)];
    dst[k + 2] = table[((b & 0x0f) << 2) | (c >> 6)];
    dst[k + 3] = table[c & 0x3f];
    
    i += 3;
    k += 4;
  }
  
  if (n != slen) {
    switch (slen - n) {
      case 1:
        a = src[i + 0] & 0xff;
        dst[k + 0] = table[a >> 2];
        dst[k + 1] = table[(a & 3) << 4];
        dst[k + 2] = '=';
        dst[k + 3] = '=';
        break;
        
      case 2:
        a = src[i + 0] & 0xff;
        b = src[i + 1] & 0xff;
        dst[k + 0] = table[a >> 2];
        dst[k + 1] = table[((a & 3) << 4) | (b >> 4)];
        dst[k + 2] = table[(b & 0x0f) << 2];
        dst[k + 3] = '=';
        break;
    }
  }
  return jtn::move(jtn::String(jtn::Data(dst, dlen)));
}

jtn::String hex_encode(jtn::CDataRef data) {
  size_t dlen = data.length() * 2;
  jtn::String rev;
  
  for (uint32_t i = 0, k = 0; k < dlen; i += 1, k += 2) {
    static const char hex[] = "0123456789ABCDEFG";
    uint8_t val = static_cast<uint8_t>(data[i]);
    rev += (char)hex[val >> 4];
    rev += (char)hex[val & 15];
  }
  return jtn::move(rev);
}

jtn::String md5_base64(jtn::CStringRef str){
  MD5_CTX c;
  MD5_Init(&c);
  MD5_Update(&c, *str, str.length());
  jtn::byte* md5 = new jtn::byte[16];
  MD5_Final(md5, &c);
  return jtn::move(base64_encode(jtn::Data((jtn::charp)md5, 16)));
}

static jtn::ccharp public_key =
"MIIBCgKCAQEAq5b/I9IqD2WKF3rjbt8XMfFrFeDVYDMnMtWA6FBvO4snMGG1qPSX\n\
4xBbZCiSVhESjr6JCd5JJonwmxzkuejyeBfzxDGjtMvqTx0pq5ZwTbOGdK35Y5uv\n\
rdrWWEGYjVZ7c9F5zYasBjLGtDwa6M/NzZ3EoPg8gHQjFPrc++eueFPdfr88lBTc\n\
WjqP2M0EIGOqPCrg0QDLItJIlmLaFfLIAqhnzm0yciRR8FwCUW2XPrEw4ZPZsWVU\n\
tYdMG1SvfFe6fjfocQPxBEUrkqYGuGt1CDJyfmLcXFdrB5ZmSRbYcN4ynx7orYlF\n\
L6mNpNF0HPJLsSJFBaDO2KZMTw3gS2SUYQIDAQAB\n";


// 升级为 late x 版本
// serial_number 应该为base64编码
bool upgrade_lite_x(jtn::CStringRef serial_number) {
  
  if (m_) {
    return serial_number == application_info["serial_number"].to_cstring();
  }
  
  if (JEmpty(serial_number)) {
    return m_ = false;
  }
  
  jtn::String key = jtn::String::format("%s%s%s",
                                      "-----BEGIN RSA PUBLIC KEY-----\n",
                                      public_key,
                                      "-----END RSA PUBLIC KEY-----\n");
  BIO* bio = BIO_new_mem_buf((char*)*key, key.length());
  RSA* rsa = PEM_read_bio_RSAPublicKey(bio, NULL, NULL, NULL);
  
  jtn::Data buf = base64_decode(serial_number);  // 解码 base64
  char* decrypted = new char[1024];
  int len = RSA_public_decrypt(buf.length(),    // 用公钥解密
                               (jtn::byte*)*buf,
                               (jtn::byte*)decrypted, rsa, RSA_PKCS1_PADDING);
  BIO_free_all(bio);
  
  if (len == -1)
    return m_ = false;
  
  jtn::String id = get_device_id();
  id += "ALSKD7Y";
  
  for(int i = 0; i < 5; i++) {
    int len = id.length();
    id = md5_base64(id +
                    id[(i * i * 30 + 91) % len] +
                    id[(i * i * 29 + 44) % len] +
                    id[(i * i * 28 + 108) % len] +
                    id[(i * i * 19 + 8) % len] +
                    id[(i * i * 10 + 1) % len] +
                    id[(i * i * 55 + 87) % len] +
                    id[(i * i * 87 + 45) % len] +
                    id[(i * i * 63 + 32) % len] +
                    id[(i * i * 11 + 78) % len] +
                    id[(i * i * 9 + 56) % len] +
                    id[(i * i * 10 + 60) % len]);
  }

  decrypted[len] = 0;
  
  m_ = (jtn::String(jtn::Data(decrypted, len)) == id);
  return m_;
}

void save_application_info() {
  jtn::FileHelper::write(application_info_save_path,
                        jtn::JSON::stringify(application_info)); // 写入数据
}

jtn::String get_app_store_url() {
  return application_info["app_store_url"].to_string();
}

jtn::String get_app_store_pro_url() {
  return application_info["app_store_pro_url"].to_string();
}

jtn::String get_app_store_ph_url() {
  return application_info["app_store_ph_url"].to_string();
}

jtn::String get_app_store_lite_url() {
  return application_info["app_store_lite_url"].to_string();
}

jtn::String get_share_app_url() {
  return application_info["share_app_url"].to_string();
}

void set_share_app_url(jtn::CStringRef value) {
  application_info["share_app_url"] =
  jtn::String::format("%s?introducer_id=%s", *value, *get_device_id());
}

bool is_support_high() {
  // lite 版本无法运行, lite_x 版本可运行
  if(is_lite() && !m_){
    return false;
  }
  return true;
}

void oninit_application_notice() {
  
  application_info_save_path =
    jtn::String::format("%s%s", *jtn::FilePath::temp_dir(), "version");
  application_info["application_run_count"] = 0;
  application_info["mark_reviews"]        = false;
  application_info["introducer_id"]       = "";
  application_info["share_count"]         = 0;
  application_info["serial_number"]       = "";
  application_info["app_store_pro_url"]   = "https://itunes.apple.com/app/id989524904";
  application_info["app_store_ph_url"]    = "https://itunes.apple.com/app/id1016281490";
  application_info["app_store_lite_url"]  = "https://itunes.apple.com/app/id1016281697";
  // 分享地址设置为lite版本地址
  set_share_app_url(application_info["app_store_lite_url"].to_string());
  
  if (is_pro()) {
    application_info["app_store_url"] = application_info["app_store_pro_url"].to_string();
  } else if (is_ph()) {
    application_info["app_store_url"] = application_info["app_store_ph_url"].to_string();
  } else if (is_lite()) {
    application_info["app_store_url"] = application_info["app_store_lite_url"].to_string();
  }
  
  jtn::Data data = jtn::FileHelper::read(application_info_save_path);
  if (!data.length()) { // 第一次打开app
    // 复制初始文件
    jtn::String app_path = jtn::FilePath::application_path().dir();
    jtn::String document_path = jtn::FilePath::document_dir();
    jtn::FileHelper::cp_p(app_path + "init_docs/example", document_path + "example");
    
    jtn::String readme = "readme.txt";
    if (get_system_language() == "zh-cn") {
      readme = "readme_zh-cn.txt";
    } else if (get_system_language() == "zh-tw") {
      readme = "readme_zh-tw.txt";
    }
    jtn::FileHelper::cp_p(app_path + "init_docs/" + readme,
                         document_path + "readme.txt");
  } else {
    try {
      jtn::JSON::extend(application_info, jtn::JSON::parse(data));
    } catch(jtn::IException& exp) { }
  }
  application_info["application_run_count"] =
    application_info["application_run_count"].to_int() + 1;
  jtn::ccharp num = application_info["serial_number"].to_cstring();
  if (!JEmpty(num)) {
    upgrade_lite_x(num); // 升级
  }
  save_application_info();
}

static void request_open_app_store_reviews(const FunctionCallbackInfo<Value>& args) {
  open_outer_browser(get_app_store_url());
  application_info["mark_reviews"] = true;
  save_application_info();
}

static void request_open_app_store_buy_pro(const FunctionCallbackInfo<Value>& args) {
  open_outer_browser(get_app_store_pro_url());
}

static void request_open_app_store_buy_ph(const FunctionCallbackInfo<Value>& args) {
  open_outer_browser(get_app_store_ph_url());
}

void onopen_soft_keyboard_notice(){
  onopen_soft_keyboard.notice();
}

void onclose_soft_keyboard_notice(){
  onclose_soft_keyboard.notice();
}

void onclipboard_data_change_notice(jtn::CStringRef data){
  onclipboard_data_change.notice(data);
}

// 外部打开历史
static jtn::String open_external_file_history;

void onopen_external_file_notice(jtn::CStringRef path) {
  
  if (path.indexOf("file://") != 0) {
    return;
  }
  
//  jtn::FilePath file_path = path.indexOf("file://") == 0 ? path.substr(7) : path;
  jtn::FilePath file_path = path.substr(7);
  
  jtn::String new_dir = jtn::FilePath::format("%s../external/", *file_path.dir());
  if (!jtn::FileHelper::mkdir_p(new_dir)) {
    JLog("Error mkdir %s", *new_dir);
  }
  
  jtn::String new_path = new_dir + file_path.name();
  if (!jtn::FileHelper::mv(file_path.path(), new_path)) {
    JLog("Error mv %s to %s", *file_path.path(), *new_dir);
  }
  open_external_file_history = new_path;
  onopen_external_file.notice(new_path);
}

void ondownload_file_notice(jtn::CStringRef url){
  ondownload_file.notice(url);
}

static jtn::String push_message_history;

void onpush_message_notice(jtn::CStringRef msg) {
  push_message_history = msg;
  onpush_message.notice(msg);
}

jtn::uint64 get_application_token(){
  static jtn::uint64 token = 0;
#ifndef DEBUG
  if(token == 0){
    token = jtn::id() + 1;
  }
#endif
  return token;
}

static void request_notify_start_server(const FunctionCallbackInfo<Value>& args) {
  start_server();
}

static void request_notify_complete_load(const FunctionCallbackInfo<Value>& args) {
  complete_load();
  if (!open_external_file_history.isEmpty()) {
    // 有一个历史记录,也许这个消息在初始之前不能被处理,所以重新发送这个消息
    onopen_external_file.notice(open_external_file_history);
  }
  if (!JEmpty(push_message_history)) {
    // 有一个历史记录, 重新发送这个消息
    onpush_message.notice(push_message_history);
    push_message_history = "";
  }
}

static void request_get_system_language(const FunctionCallbackInfo<Value>& args) {
  HandleScope scope(args.GetIsolate());
  jtn::String language = get_system_language();
  args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), *language));
}

static const uint init_hash = 5381;
static jtn::ccharp I64BIT_TABLE =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

static uint update_hash(uint hash, const jtn::byte* buffer, int len){
  for (int i = len - 1; i > -1; i--) {
    hash += (hash << 5) + buffer[i];
  }
  return hash;
}

static jtn::String digest_hash(uint hash){
  
  hash &= 0x7FFFFFFF;
  //
  jtn::String retValue;
  do{
    retValue += I64BIT_TABLE[hash & 0x3F];
  }
  while(hash >>= 6);
  return jtn::move(retValue);
}

static void request_get_file_hash(const FunctionCallbackInfo<Value>& args) {
  
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  HandleScope scope(args.GetIsolate());
  
  if (args.Length() < 1 || !args[0]->IsString()) {
    return env->ThrowTypeError("Bad argument");
  }
  
  jtn::String path = *Utf8Value(args[0]);
  
  jtn::File file(path);
  
  if(!file.open(jtn::IFile::Read)){ // 只读方式
    return env->ThrowTypeError("Open file error");
  }
  
  int size = 100 * 1024; // 100 kb
  jtn::Handle<jtn::byte> data = new jtn::byte[size];
  uint hash = init_hash;
  
  int len = file.read(*data, size);
  while (len > 0) {
    hash = update_hash(hash, *data, len);
    len = file.read(*data, size);
  }
  
  jtn::String base64 = digest_hash(hash);
  
  args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), *base64));
}

static void request_is_pro(const FunctionCallbackInfo<Value>& args){
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), is_pro()));
}

static void request_is_lite(const FunctionCallbackInfo<Value>& args){
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), is_lite()));
}

static void request_is_lite_x(const FunctionCallbackInfo<Value>& args){
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), m_));
}

static void request_is_ph(const FunctionCallbackInfo<Value>& args){
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), is_ph()));
}

static void request_version(const FunctionCallbackInfo<Value>& args){
  args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), TouchCodeVersion));
}

static void request_device_id(const FunctionCallbackInfo<Value>& args){
  args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), *get_device_id()));
}

static void request_get_device_token(const FunctionCallbackInfo<Value>& args) {
  args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(), *get_device_token()));
}

static void request_get_application_token(const FunctionCallbackInfo<Value>& args){
  Local<String> token =
    String::NewFromUtf8(args.GetIsolate(), *jtn::String(get_application_token()));
  args.GetReturnValue().Set(token);
}

static void request_has_debug(const FunctionCallbackInfo<Value>& args){
#ifdef DEBUG
  bool debug = true;
#else
  bool debug = false;
#endif
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), debug));
}

static void request_application_run_count(const FunctionCallbackInfo<Value>& args) {
  args.GetReturnValue().Set(Number::New(args.GetIsolate(),
                                        application_info["application_run_count"].to_int()));
}

static void request_mark_reviews(const FunctionCallbackInfo<Value>& args) {
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(),
                                         application_info["mark_reviews"].to_bool()));
}

static void request_introducer_id(const FunctionCallbackInfo<Value>& args) {
  args.GetReturnValue().Set(String::NewFromUtf8(args.GetIsolate(),
                                                application_info["introducer_id"].to_cstring()));
}

static void request_share_count(const FunctionCallbackInfo<Value>& args) {
  args.GetReturnValue().Set(Int32::New(args.GetIsolate(),
                                       application_info["share_count"].to_int()));
}

static void request_set_ace_clipboard_data(const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  HandleScope scope(args.GetIsolate());
  if (args.Length() < 1 || !args[0]->IsString()) {
    return env->ThrowTypeError("Bad argument");
  }
  set_ace_clipboard_data(*Utf8Value(args[0]));
}

static void request_set_clipboard_data(const FunctionCallbackInfo<Value>& args) {
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  HandleScope scope(args.GetIsolate());
  if (args.Length() < 1 || !args[0]->IsString()) {
    return env->ThrowTypeError("Bad argument");
  }
  set_clipboard_data(*Utf8Value(args[0]));
}

static void request_open_web_browser(const FunctionCallbackInfo<Value>& args) {
  HandleScope scope(args.GetIsolate());
  
  jtn::String url;
  
  if (args.Length() > 0 && args[0]->IsString()) {
    url = *Utf8Value(args[0]);
  }
  
  if (args.Length() > 1) {
    open_web_browser(url, args[1]->ToBoolean()->Value());
  } else {
    open_web_browser(url, false);
  }
}

static void request_share_app(const FunctionCallbackInfo<Value>& args){
  
  Isolate* iso = args.GetIsolate();
  HandleScope scope(iso);
  Environment* env = Environment::GetCurrent(iso);
  
  if (args.Length() < 1 || !args[0]->IsObject()) {
    return env->ThrowTypeError("Bad argument");
  }
  Local<Object> obj = args[0]->ToObject();
  
  share_app(obj->Get(String::NewFromUtf8(iso, "left"))->ToInt32()->Value(),
            obj->Get(String::NewFromUtf8(iso, "top"))->ToInt32()->Value(),
            obj->Get(String::NewFromUtf8(iso, "width"))->ToInt32()->Value(),
            obj->Get(String::NewFromUtf8(iso, "height"))->ToInt32()->Value());
}

static void request_sleep_disabled(const FunctionCallbackInfo<Value>& args) {
  HandleScope scope(args.GetIsolate());
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  
  if (args.Length() < 1) {
    return env->ThrowTypeError("Bad argument");
  }
  sleep_disabled(args[0]->ToBoolean()->Value());
}

static void request_send_file(const FunctionCallbackInfo<Value>& args) {
  HandleScope scope(args.GetIsolate());
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  
  if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
    return env->ThrowTypeError("Bad argument");
  }
  send_file(*Utf8Value(args[0]), *Utf8Value(args[1]));
}

static void request_send_email_to_author(const FunctionCallbackInfo<Value>& args) {
  send_email_to_author();
}

static void request_set_share_app_url(const FunctionCallbackInfo<Value>& args) {
  HandleScope scope(args.GetIsolate());
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  
  if (args.Length() < 1 || !args[0]->IsString()) {
    return env->ThrowTypeError("Bad argument");
  }
  set_share_app_url(*Utf8Value(args[0]));
  save_application_info();
}

static void request_set_introducer_id(const FunctionCallbackInfo<Value>& args) {
  HandleScope scope(args.GetIsolate());
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  
  if (args.Length() < 1 || !args[0]->IsString()) {
    return env->ThrowTypeError("Bad argument");
  }
//  // 这个属性,只能设置一次,
//  if (JEmpty(application_info["introducer_id"].to_cstring())) {
//  }
  application_info["introducer_id"] = *Utf8Value(args[0]);
  save_application_info();
}

static void request_set_share_count(const FunctionCallbackInfo<Value>& args) {
  HandleScope scope(args.GetIsolate());
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  
  if (args.Length() < 1 || !args[0]->IsNumber()) {
    return env->ThrowTypeError("Bad argument");
  }
  application_info["share_count"] = args[0]->ToInt32()->Value();
  save_application_info();
}

static void request_set_serial_number(const FunctionCallbackInfo<Value>& args) {
  HandleScope scope(args.GetIsolate());
  Environment* env = Environment::GetCurrent(args.GetIsolate());
  
  if (args.Length() < 1 || !args[0]->IsString()) {
    return env->ThrowTypeError("Bad argument");
  }
  
  jtn::String num = *Utf8Value(args[0]);
  if (upgrade_lite_x(num)) { // 升级成功
    application_info["serial_number"] = num;
    save_application_info();
  }
}

static void request_show_ad_panel(const FunctionCallbackInfo<Value>& args) {
  set_ad_panel_diaplay(true);
}

static void request_hide_ad_panel(const FunctionCallbackInfo<Value>& args) {
  set_ad_panel_diaplay(false);
}

class NativeUtilService: public BaseObject{
  
 public:
  
  NativeUtilService(Environment* env, Local<Object> wrap): BaseObject(env, wrap){
    m_ctx = NodeContext::GetCurrent(env->isolate());
    m_ctx->JOn(stop, &NativeUtilService::m_context_onstop_handle, this);
    onopen_soft_keyboard.on(&NativeUtilService::m_onopen_soft_keyboard_handle, this);
    onclose_soft_keyboard.on(&NativeUtilService::m_onclose_soft_keyboard_handle, this);
    onclipboard_data_change.on(&NativeUtilService::m_onclipboard_data_change_handle, this);
    onopen_external_file.on(&NativeUtilService::m_onopen_external_file_handle, this);
    ondownload_file.on(&NativeUtilService::m_ondownload_file_handle, this);
    onpush_message.on(&NativeUtilService::m_onpush_message_handle, this);
    MakeWeak<NativeUtilService>(this);
  }
  
  virtual ~NativeUtilService(){
    off();
  }
  
 private:
  
  void off(){
    m_ctx->JOff(stop, this);
    onopen_soft_keyboard.off(this);
    onclose_soft_keyboard.off(this);
    onclipboard_data_change.off(this);
    onopen_external_file.off(this);
    ondownload_file.off(this);
    onpush_message.off(this);
  }
  
  void m_context_onstop_handle(jtn::Event<>& evt){
    // 如果上下文停止还没释放对像,那真是很糟糕的事情,那么必须要卸载这些事件
    off();
  }
  
  struct StringData {
    jtn::String data;
    NativeUtilService* util;
  };
  
  struct SizeData {
    int width;
    int height;
    NativeUtilService* util;
  };

  void m_onopen_soft_keyboard_handle(jtn::Event<>& evt){
    m_ctx->push_run_queue([](NodeContext* ctx, void* p){
      NativeUtilService* util = (NativeUtilService*)p;
      MakeCallback(ctx->isolate(), util->object(), "onopen_soft_keyboard_handle", 0, NULL);
    }, this);
  }
  
  void m_onclose_soft_keyboard_handle(jtn::Event<>& evt){
    m_ctx->push_run_queue([](NodeContext* ctx, void* p){
      NativeUtilService* util = (NativeUtilService*)p;
      MakeCallback(ctx->isolate(), util->object(), "onclose_soft_keyboard_handle", 0, NULL);
    }, this);
  }
  
  void m_onclipboard_data_change_handle(EventStr& evt){
    m_ctx->push_run_queue([](NodeContext* ctx, void* p){
      jtn::Handle<StringData> data = (StringData*)p;
      Local<Object> obj = data->util->object();
      Local<Value> args = String::NewFromUtf8(ctx->isolate(), *data->data);
      MakeCallback(ctx->isolate(), obj, "onclipboard_data_change_handle", 1, &args);
    }, new StringData({ evt.data(), this }));
  }
  
  void m_onopen_external_file_handle(EventStr& evt){
    m_ctx->push_run_queue([](NodeContext* ctx, void* p){
      jtn::Handle<StringData> data = (StringData*)p;
      Local<Object> obj = data->util->object();
      Local<Value> args = String::NewFromUtf8(ctx->isolate(), *data->data);
      MakeCallback(ctx->isolate(), obj, "onopen_external_file_handle", 1, &args);
    }, new StringData({ evt.data(), this }));
  }
  
  void m_ondownload_file_handle(EventStr& evt){
    m_ctx->push_run_queue([](NodeContext* ctx, void* p){
      jtn::Handle<StringData> data = (StringData*)p;
      Local<Value> args = String::NewFromUtf8(ctx->isolate(), *data->data);
      MakeCallback(ctx->isolate(), data->util->object(), "ondownload_file_handle", 1, &args);
    }, new StringData({ evt.data(), this }));
  }
  
  void m_onpush_message_handle(EventStr& evt) {
    m_ctx->push_run_queue([](NodeContext* ctx, void* p){
      jtn::Handle<StringData> data = (StringData*)p;
      Local<Value> args = String::NewFromUtf8(ctx->isolate(), *data->data);
      MakeCallback(ctx->isolate(), data->util->object(), "onpush_message_handle", 1, &args);
    }, new StringData({ evt.data(), this }));
  }
  
 public:
  
  static void New(const FunctionCallbackInfo<Value>& args){
    Environment* env = Environment::GetCurrent(args.GetIsolate());
    HandleScope scope(args.GetIsolate());
    new NativeUtilService(env, args.This());
  }

 private:
  NodeContext* m_ctx;
};

static void noop(const FunctionCallbackInfo<Value>& args){
  // Noop
}

static void InitNativeUtil(Handle<Object> target,
                           Handle<Value> unused,
                           Handle<Context> context,
                           void* priv) {
  Environment* env = Environment::GetCurrent(context);
  HandleScope scope(env->isolate());
  
  // static service api
  NODE_SET_METHOD(target, "request_notify_start_server", request_notify_start_server);
  NODE_SET_METHOD(target, "request_notify_complete_load", request_notify_complete_load);
  NODE_SET_METHOD(target, "request_get_system_language", request_get_system_language);
  NODE_SET_METHOD(target, "request_get_file_hash", request_get_file_hash);
  NODE_SET_METHOD(target, "request_is_pro", request_is_pro);
  NODE_SET_METHOD(target, "request_is_lite", request_is_lite);
  NODE_SET_METHOD(target, "request_is_lite_x", request_is_lite_x);
  NODE_SET_METHOD(target, "request_is_ph", request_is_ph);
  NODE_SET_METHOD(target, "request_version", request_version);
  NODE_SET_METHOD(target, "request_device_id", request_device_id);
  NODE_SET_METHOD(target, "request_get_device_token", request_get_device_token);
  NODE_SET_METHOD(target, "request_get_application_token", request_get_application_token);
  NODE_SET_METHOD(target, "request_has_debug", request_has_debug);
  NODE_SET_METHOD(target, "request_application_run_count", request_application_run_count);
  NODE_SET_METHOD(target, "request_open_app_store_reviews", request_open_app_store_reviews);
  NODE_SET_METHOD(target, "request_open_app_store_buy_pro", request_open_app_store_buy_pro);
  NODE_SET_METHOD(target, "request_open_app_store_buy_ph", request_open_app_store_buy_ph);
  NODE_SET_METHOD(target, "request_mark_reviews", request_mark_reviews);
  NODE_SET_METHOD(target, "request_introducer_id", request_introducer_id);
  NODE_SET_METHOD(target, "request_share_count", request_share_count);
  NODE_SET_METHOD(target, "request_set_ace_clipboard_data", request_set_ace_clipboard_data);
  NODE_SET_METHOD(target, "request_set_clipboard_data", request_set_clipboard_data);
  NODE_SET_METHOD(target, "request_open_web_browser", request_open_web_browser);
  NODE_SET_METHOD(target, "request_share_app", request_share_app);
  NODE_SET_METHOD(target, "request_sleep_disabled", request_sleep_disabled);
  NODE_SET_METHOD(target, "request_set_share_app_url", request_set_share_app_url);
  NODE_SET_METHOD(target, "request_send_file", request_send_file);
  NODE_SET_METHOD(target, "request_send_email_to_author", request_send_email_to_author);
  NODE_SET_METHOD(target, "request_set_introducer_id", request_set_introducer_id);
  NODE_SET_METHOD(target, "request_set_share_count", request_set_share_count);
  NODE_SET_METHOD(target, "request_set_serial_number", request_set_serial_number);
  NODE_SET_METHOD(target, "request_show_ad_panel", request_show_ad_panel);
  NODE_SET_METHOD(target, "request_hide_ad_panel", request_hide_ad_panel);
  
  //
  Local<FunctionTemplate> util = FunctionTemplate::New(env->isolate(), NativeUtilService::New);
  util->InstanceTemplate()->SetInternalFieldCount(1);
  util->SetClassName(FIXED_ONE_BYTE_STRING(env->isolate(), "NativeUtilService"));
  target->Set(FIXED_ONE_BYTE_STRING(env->isolate(), "NativeUtilService"), util->GetFunction());
  //
  NODE_SET_PROTOTYPE_METHOD(util, "ondownload_file_handle", noop);
  NODE_SET_PROTOTYPE_METHOD(util, "onopen_soft_keyboard_handle", noop);
  NODE_SET_PROTOTYPE_METHOD(util, "onclose_soft_keyboard_handle", noop);
  NODE_SET_PROTOTYPE_METHOD(util, "onclipboard_data_change_handle", noop);
  NODE_SET_PROTOTYPE_METHOD(util, "onopen_external_file_handle", noop);
  NODE_SET_PROTOTYPE_METHOD(util, "onpush_message_handle", noop);
}

T_End

NODE_MODULE_CONTEXT_AWARE_BUILTIN(native_util, tc::InitNativeUtil)

