/**
 * @createTime 2015-04-19
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import "nsobject+delay_block.h"

@implementation NSObject(PerformDelayBlock)

- (void)perform_delay:(NSTimeInterval)delay block:(DelayCallBlock)block {
  
  [self performSelector:@selector(call_block:)
             withObject:[block copy]
             afterDelay:delay];
}

- (void)call_block:(DelayCallBlock)block{
  block();
}

@end

@interface DelayedCall()
@property (strong, nonatomic) DelayCallBlock block;
@end

@implementation DelayedCall
@synthesize complete;

- (id)init{
  self = [super init];
  complete = YES;
  return self;
}

- (void)call:(NSTimeInterval)delay block:(DelayCallBlock)block{
//  NSLog(@"delay call");
  self.block = block;
  [self cancel_call];
  complete = NO;
  [self performSelector:@selector(call_block:) withObject:nil afterDelay:delay];
}

- (void)call_block:(id)o{
//  NSLog(@"delay call ok");
  complete = YES;
  self.block();
}

- (BOOL)complete{
  return complete;
}

- (void)cancel_call{
  if(!self.complete){
    complete = YES;
    [NSObject cancelPreviousPerformRequestsWithTarget:self
                                             selector:@selector(call_block:)
                                               object:nil];
  }
}

@end


