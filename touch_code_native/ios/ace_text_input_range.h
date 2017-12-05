/**
 * @createTime 2015-04-20
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <UIKit/UIKit.h>

@interface AceTextPosition: UITextPosition
@property (assign, nonatomic) NSUInteger value;
+ (id)new:(NSUInteger)value;
@end

@interface AceTextRange: UITextRange<NSCopying>
+ (id)new;
+ (id)new:(AceTextPosition*)start end:(AceTextPosition*)end;
+ (id)new_with_uint:(NSUInteger)start end:(NSUInteger)end;
- (void)set_start:(AceTextPosition*)value;
- (void)set_end:(AceTextPosition*)value;
- (NSInteger)length;
@end

