/**
 * @createTime 2015-03-22
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <WebKit/WebKit.h>

@interface TeIDEWebView: WKWebView
- (void) ondisplay_port_size_change_notice:(CGFloat)w
                                    height:(CGFloat)h
                           keyboard_height:(CGFloat)key_h;
@end
