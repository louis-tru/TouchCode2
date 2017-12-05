/**
 * @createTime 2015-04-19
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import "ace_text_input_range.h"

@implementation AceTextPosition
+ (id)new:(NSUInteger)value {
  AceTextPosition* obj = [AceTextPosition new];
  obj.value = value;
  return obj;
}
@end

@interface AceTextRange(){
  AceTextPosition* start;
  AceTextPosition* end;
}
@end

@implementation AceTextRange

+ (id)new{
  return [AceTextRange new:[AceTextPosition new] end:[AceTextPosition new]];
}

+ (id)new:(AceTextPosition*)start end:(AceTextPosition*)end{
  AceTextRange* range = [[AceTextRange alloc] init];
  [range set_start:start];
  [range set_end:end];
  return range;
}

+ (id)new_with_uint:(NSUInteger)start end:(NSUInteger)end{
  return [AceTextRange new:[AceTextPosition new:start] end:[AceTextPosition new:end]];
}

- (BOOL)isEmpty {
  return end.value != start.value;
}

- (NSInteger)length {
  return end.value - start.value;
}

- (UITextPosition*)start {
  return start;
}

- (UITextPosition*)end {
  return end;
}

- (void)set_start:(AceTextPosition*)value {
  start = value;
}

- (void)set_end:(AceTextPosition*)value {
  end = value;
}

- (id)copyWithZone:(NSZone*)zone {
  AceTextRange* copy = [[[self class] allocWithZone: zone] init];
  [copy set_start:[AceTextPosition new:start.value]];
  [copy set_end:[AceTextPosition new:0]];
  return copy;
}

@end
