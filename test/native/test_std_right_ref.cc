
#include <tesla/exception.h>
#include <tesla/string.h>
#include <vector>
#include <string>

TSUse

void test_str_ref(StringRRef str){
  String s = move(str);
  TSLog(s);
}

void test_std_right_ref() {
  
  std::string std_str = "Test LOG";
  
  TSLog(std_str);
  
  String str = String::format("ABCD %s", "OK");
  
  TSLog(str);
  
  String str2 = "ABCD";
  
  String&& str3 = move(str2);
  
  String str4 = str3;
  
  str4 = move(str3);
  
  test_str_ref(move(str4));
  
  TSLog(str2);
}







