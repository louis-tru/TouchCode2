
#include <ngui/base/handle.h>
#include <ngui/base/json.h>
#include <ngui/base/fs.h>

using namespace ngui;

// extern const uint64 MaxUint64 = 0;//std::numeric_limits<uint64>::max();

//int _BasicDataWriteToFile(CStringRef path, void* data, uint size){
//  return FileHelper::write(path, data, size);
//}

Buffer test_handle_data(Buffer data){
  
  LOG("OK");
  
  return data;
}

void test_tesla_json() {
  
  LOG(Uint64::max);
  
  std::move(0);
  
  char* str = new char[8];
  
  memcpy(str, "ABCDEFG", 8);
  
  Buffer data(str, 7);
  
  Buffer data1 = test_handle_data(data);
  
  Buffer data2;
  
  data2 = data1;
  
  FileHelper::write_file_sync(Path::documents("aa"), *data2, data2.length());
  
  JSON json = JSON::parse("{  \"a\": 100, \"b\": \"OK\", \"c\": [ \"JSON::parse\", \"0\",\"1\",\"2\",\"3\" ]  }");

  JSON& a = json["a"];
  JSON& b = json["b"];
  JSON& cc = json["c"];
  
  for (auto i = cc.begin_array(); i != cc.end_array(); i++) {
    LOG("%s", i->to_cstring());
  }
  
  cc[10] = "你好";
  
  JSON& dd = cc[10];
  
  if(cc == cc){
    LOG("eq");
  }
  
  JSON newJson = dd.clone();
  
  if(dd == newJson){
    LOG("string eq");
  }
  
  LOG(dd.to_cstring());
  LOG(newJson.to_cstring());
  
  LOG("OK, %d, %s, %s", a.to_int(), b.to_cstring(), dd.to_cstring());
  
  for(auto i = json.begin(); i != json.end(); i++){
    LOG("member");
    if(i->value.is_string()){
      LOG("%s:%s", i->name.to_cstring(), i->value.to_cstring());
    }
  }
  
  JSON c = JSON::object();
  
  JSON& d = c;
  
  JSON e;
  
  e = d;
  
  e = c;
  
  //JSON& c = doc["c"];
  
  LOG("OK, %d", cc.is_array());
  
  LOG(JSON::stringify(json));
  
}







