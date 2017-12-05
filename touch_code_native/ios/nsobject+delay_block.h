/**
 * @createTime 2015-04-22
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

typedef void (^DelayCallBlock)();

@interface NSObject(PerformDelayBlock)
- (void)perform_delay:(NSTimeInterval)delay block:(DelayCallBlock)block;
@end

@interface DelayedCall: NSObject
@property (assign, readonly) BOOL complete;
- (void)call:(NSTimeInterval)delay block:(DelayCallBlock)block;
- (void)cancel_call;
@end
