//
//  test_mmap.cc
//  TeIDE
//
//  Created by louis on 15/4/2.
//
//

#include <mach/vm_statistics.h>
#include <sys/mman.h>
#include <ngui/base/util.h>
#include <errno.h>

static const int kMmapFd = VM_MAKE_TAG(255);
static const off_t kMmapFdOffset = 0;

#if defined(__ARM_ARCH_7A__) || \
    defined(__ARM_ARCH_7R__) || \
    defined(__ARM_ARCH_7__)
// # error
#endif

void test_mmap(){
  
//  void* result = mmap(OS::GetRandomMmapAddr(),
//                      size,
//                      PROT_NONE,
//                      MAP_PRIVATE | MAP_ANON | MAP_NORESERVE,
//                      kMmapFd,
//                      kMmapFdOffset);
  
  size_t size = 512 * 1024 * 1024; // 512MB
  
  while(true){
  
    void* result = mmap(NULL,
                        size,
                        PROT_NONE,
                        MAP_PRIVATE | MAP_ANON | MAP_NORESERVE,
                        kMmapFd,
                        kMmapFdOffset);
    
    if(result == MAP_FAILED){
      
      switch (errno) {
        case EBADF:
          LOG("参数fd 不是有效的文件描述词");
          break;
        case EACCES:
          LOG("存取权限有误。如果是MAP_PRIVATE 情况下文件必须可读，使用MAP_SHARED则要有PROT_WRITE以及该文件要能写入。");
          break;
        case EINVAL:
          LOG("参数start、length 或offset有一个不合法。");
          break;
        case EAGAIN:
          LOG(" 文件被锁住，或是有太多内存被锁住。");
          break;
        case ENOMEM:
          LOG("内存不足。");
          break;
        default:
          LOG("unknown");
          break;
      }
      break;
    }
    
    LOG("%lu", result);

  };
}





