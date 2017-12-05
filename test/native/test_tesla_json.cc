
#include <tesla/handle.h>
#include <tesla/json.h>
#include <tesla/fs.h>

TSUse

TSNs

// extern const uint64 MaxUint64 = 0;//std::numeric_limits<uint64>::max();

//int _BasicDataWriteToFile(CStringRef path, void* data, uint size){
//  return FileHelper::write(path, data, size);
//}

TSEnd

Data test_handle_data(Data data){
  
  TSLog("OK");
  
  return data;
}

void test_tesla_json() {
  
  TSLog(MaxUint64);
  
  std::move(0);
  
  char* str = new char[8];
  
  memcpy(str, "ABCDEFG", 8);
  
  Data data(str, 7);
  
  Data data1 = test_handle_data(data);
  
  Data data2;
  
  data2 = data1;
  
  data2.writeToFile("aa");
  
  JSON json = JSON::parse("{  \"a\": 100, \"b\": \"OK\", \"c\": [ \"JSON::parse\", \"0\",\"1\",\"2\",\"3\" ]  }");

  JSON& a = json["a"];
  JSON& b = json["b"];
  JSON& cc = json["c"];
  
  for(auto i = cc.beginArray(); i != cc.endArray(); i++){
    TSLog("%s", i->toCString());
  }
  
  cc[10] = "你好";
  
  JSON& dd = cc[10];
  
  if(cc == cc){
    TSLog("eq");
  }
  
  JSON newJson = dd.clone();
  
  if(dd == newJson){
    TSLog("string eq");
  }
  
  TSLog(dd.toCString());
  TSLog(newJson.toCString());
  
  TSLog("OK, %d, %s, %s", a.toInt(), b.toCString(), dd.toCString());
  
  for(auto i = json.begin(); i != json.end(); i++){
    TSLog("member");
    if(i->value.isString()){
      TSLog("%s:%s", i->name.toCString(), i->value.toCString());
    }
  }
  
  JSON c = JSON::object();
  
  JSON& d = c;
  
  JSON e;
  
  e = d;
  
  e = c;
  
  //JSON& c = doc["c"];
  
  TSLog("OK, %d", cc.isArray());
  
  TSLog(JSON::stringify(json));
  
}







