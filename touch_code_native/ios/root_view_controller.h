/**
 * @createTime 2015-04-03
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <UIKit/UIKit.h>

@interface RootViewController: UIViewController;
@property (assign, nonatomic) NSString* teide_webview_url;
- (id) initWithWindow:(UIWindow*)win;
- (void) show_teide_webview;
- (void) open_inl_browser:(NSString*)url priority_history:(BOOL)priority;
- (void) close_inl_browser;
- (void) set_loading_text:(NSString*)text;
- (void) ondisplay_port_size_change_notice:(CGFloat)w
                                    height:(CGFloat)h
                           keyboard_height:(CGFloat)key_h;
- (void) set_ad_panel_diaplay:(BOOL)value;
@end
