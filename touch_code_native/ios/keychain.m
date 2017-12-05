/**
 * @createTime 2015-07-14
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import "keychain.h"

@implementation Keychain

+ (NSMutableDictionary*)getKeychainQuery:(NSString *)service {
  
  return [NSMutableDictionary dictionaryWithObjectsAndKeys:
          (__bridge id)kSecClassGenericPassword, kSecClass,
          service, kSecAttrService,
          service, kSecAttrAccount,
          (__bridge id)kSecAttrAccessibleAfterFirstUnlock, kSecAttrAccessible,
          nil];
}

+ (void)set:(NSString *)name data:(id)data {
  
  NSMutableDictionary *keychainQuery = [self getKeychainQuery:name];
  SecItemDelete((__bridge CFDictionaryRef)keychainQuery);
  [keychainQuery setObject:[NSKeyedArchiver archivedDataWithRootObject:data]
                    forKey:(__bridge id)kSecValueData];
  SecItemAdd((__bridge CFDictionaryRef)keychainQuery, nil);
}

+ (id)get:(NSString*)name {
  id ret = nil;
  NSMutableDictionary*keychainQuery = [self getKeychainQuery:name];
  [keychainQuery setObject:(id)kCFBooleanTrue forKey:(__bridge id)kSecReturnData];
  [keychainQuery setObject:(__bridge id)kSecMatchLimitOne
                    forKey:(__bridge id)kSecMatchLimit];
  CFDataRef key_data = nil;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)keychainQuery,
                                        (CFTypeRef*)&key_data);
  if (status == noErr) {
    @try {
      ret = [NSKeyedUnarchiver unarchiveObjectWithData:(__bridge NSData*)key_data];
    } @catch (NSException* e) {
      NSLog(@"Unarchive of %@ failed: %@", name, e);
    } @finally {
    }
  }
  if (key_data)
    CFRelease(key_data);
  return ret;
}

+ (void)remove:(NSString*)name {
  NSMutableDictionary *keychainQuery = [self getKeychainQuery:name];
  SecItemDelete((__bridge CFDictionaryRef)keychainQuery);
}

@end