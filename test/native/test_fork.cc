/**
 * @createTime 2014-01-19
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#include <unistd.h>
#include <sys/types.h>
#include <stdio.h>
#include <stdlib.h>

void print_exit(){
  printf("the exit pid:%d\n", getpid());
}

void test_fork(){
  
  int count = 0;
  pid_t pid = fork(); //pid表示fork函数返回的值
  
  atexit(print_exit); //注册该进程退出时的回调函数
  
  if(pid < 0){
    printf("error in fork!");
  }
  else if (pid == 0) {
    printf("i am the child process, my process id is %d\n", getpid());
    printf("我是爹的儿子\n"); //对某些人来说中文看着更直白。
    count++;
  }
  else {
    int rtn; /*子进程的返回数值*/
    wait(&rtn); /* 父进程， 等待子进程结束，并打印子进程的返回值 */
    printf("child process retuen value : %d\n", rtn);
    printf("i am the parent process, my process id is %d\n", getpid());
    printf("我是孩子他爹\n");
    count++;
  }
  printf("统计结果是： %d\n", count);
}
