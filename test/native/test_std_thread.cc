#include <iostream>
#include <utility>
#include <thread>
#include <chrono>
#include <functional>
#include <atomic>
#include <ngui/base/string.h>
#include <string>

using namespace ngui;

void f2(int n){
  for (int i = 0; i < 5; ++i) {
    std::cout << "Thread " << n << " executing\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
}

void f3(int& n){
  for (int i = 0; i < 5; ++i) {
    std::cout << "Thread 2 executing\n";
    ++n;
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
}

struct X { int value; };

class TestClass{
  
};

void test_std_thread() {
  
  std::string str = "Hello";
  std::vector<std::string> v;
  
  // uses the push_back(const T&) overload, which means
  // we'll incur the cost of copying str
  v.push_back(str);
  std::cout << "After copy, str is \"" << str << "\"\n";
  
  // uses the rvalue reference push_back(T&&) overload,
  // which means no strings will copied; instead, the contents
  // of str will be moved into the vector.  This is less
  // expensive, but also means str might now be empty.
  v.push_back(std::move(str));
  std::cout << "After move, str is \"" << str << "\"\n";
  
  std::cout << "The contents of the vector are \"" << v[0]
  << "\", \"" << v[1] << "\"\n";
  
  
  String a = "test String";
  String b = std::move(a);
  
  LOG(a);
  LOG(b);

  std::string s = "test";
  
  LOG(s.c_str());

  int n = 0;
  std::thread t1; // t1 is not a thread
  std::thread t2(f2, n + 1); // pass by value
  std::thread t3(f3, std::ref(n)); // pass by reference
  std::thread t4(std::move(t3)); // t4 is now running f2(). t3 is no longer a thread
  
  t4.swap(t2);// 交换线程
  
  std::this_thread::sleep_for(std::chrono::milliseconds(2000)); // 柱塞当前线程2秒

  t2.join();
  t4.join();
  std::cout << "Final value of n is " << n << '\n';
}







