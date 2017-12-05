/**
 * @createTime 2015-07-14
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <Security/Security.h>

@interface Keychain : NSObject
+ (void)set:(NSString*)service data:(id)data;
+ (id)get:(NSString*)service;
+ (void)remove:(NSString*)service;
@end

