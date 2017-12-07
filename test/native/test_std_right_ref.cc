
#include <ngui/base/error.h>
#include <ngui/base/string.h>
#include <vector>
#include <string>

using namespace ngui;

void test_str_ref(String&& str){
  String s = move(str);
  LOG(s);
}

void test_std_right_ref() {
  
  std::string std_str = "Test LOG";
  
  LOG(std_str.c_str());
  
  String str = String::format("ABCD %s", "OK");
  
  LOG(str);
  
  String str2 = "ABCD";
  
  String&& str3 = move(str2);
  
  String str4 = str3;
  
  str4 = move(str3);
  
  test_str_ref(move(str4));
  
  LOG(str2);
}
