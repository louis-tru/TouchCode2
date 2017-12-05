/**
 * @createTime 2014-01-19
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <string.h>
#import <native_util.h>
#import <node_context.h>
#import <thread>
#import <version.h>
#import <tesla/fs.h>
#import <tesla/json.h>
#import <MessageUI/MFMailComposeViewController.h>
#import "app_delegate.h"
#import "category_share.h"
#import "nsobject+delay_block.h"
#import "root_view_controller.h"
#import "dialog.h"
#import "keychain.h"

static IPhonesAppDelegate* app_delegate = nil;

@interface IPhonesAppDelegate()
@property (strong, nonatomic) RootViewController* root;
- (void) download_file:(NSString*)url;
- (void) send_file:(NSString*)dir path:(NSString*)path;
- (void) send_email_to_author;
@end

JNs(tc)

jtn::String get_system_language() {

  NSArray* languages = [NSLocale preferredLanguages];
  jtn::String language = [[languages objectAtIndex:0] UTF8String];
  
  if (language == "zh-HK" || language == "zh-Hant") {
    language = "zh-tw";
  } else if (language == "zh-Hans") {
    language = "zh-cn";
  }
  return language;
}

void open_outer_browser(jtn::CStringRef url){
  NSString* ns_url = [NSString stringWithFormat:@"%s", *url];
  dispatch_async(dispatch_get_main_queue(), ^(){
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:ns_url]];
  });
}

void open_web_browser(jtn::CStringRef url, bool priority_history) {
  NSString* ns_url = (JEmpty(url) ? nil :
                      [NSString stringWithFormat:@"%s", *url]);
  dispatch_async(dispatch_get_main_queue(), ^(){
    [app_delegate.root open_inl_browser:ns_url priority_history:priority_history];
  });
}

void set_ad_panel_diaplay(bool value) {
  dispatch_async(dispatch_get_main_queue(), ^(){
    [app_delegate.root set_ad_panel_diaplay:value];
  });
}

void send_email_to_author() {
  dispatch_async(dispatch_get_main_queue(), ^(){
    [app_delegate send_email_to_author];
  });
}

void start_server() {
  static bool is = false;
  if (is) return;
  is = true;
  
  dispatch_async(dispatch_get_main_queue(), ^{
    // TODO webview 在开始加载的时候 WebThread会Collapse
    // 这个问题现在暂时可在加载webview时候关闭UI动画解决
    [UIView setAnimationsEnabled:NO];
    
    NSString* url = [[NSString alloc] initWithFormat:
                     @"http://127.0.0.1:8081/touch?application_token=%s&ios_native=1&_=v%f",
                     *jtn::String(tc::get_application_token()),
                     [[NSDate date] timeIntervalSince1970]];
    app_delegate.root.teide_webview_url = url;
//    [app_delegate.root set_loading_text:@"Start web server"];
  });
}

void complete_load() {
  static bool is = false;
  if (is) return;
  is = true;
  
//  [app_delegate.root set_loading_text:@"Loading ace"];
  
  dispatch_time_t time =
  dispatch_time(DISPATCH_TIME_NOW, 800 * NSEC_PER_MSEC);
  //
  dispatch_after(time, dispatch_get_main_queue(), ^(){
    // TODO webview加载完成时可以打开UI动画
    [UIView setAnimationsEnabled:YES];
    [app_delegate.root show_teide_webview];
  });
}

static bool disable_clipboard_data_change = false;

void set_ace_clipboard_data(jtn::CStringRef data) {
  disable_clipboard_data_change = true;
  UIPasteboard* pasteboard = [UIPasteboard generalPasteboard];
  pasteboard.string = [NSString stringWithUTF8String:*data];
}

void set_clipboard_data(jtn::CStringRef data) {
  UIPasteboard* pasteboard = [UIPasteboard generalPasteboard];
  pasteboard.string = [NSString stringWithUTF8String:*data];
}

void onclipboard_data_change_notice() {
  if(disable_clipboard_data_change){
    disable_clipboard_data_change = false;
  }
  else{
    UIPasteboard* pasteboard = [UIPasteboard generalPasteboard];
    tc::onclipboard_data_change_notice([pasteboard.string UTF8String]);
  }
}

void share_app(int x, int y, int width, int height) {
  
  CGRect rect = CGRectMake(x, y, width, height);
  dispatch_async(dispatch_get_main_queue(), ^(){
    
    NSArray* items =
    @[
      // @"亲爱的小伙伴",
      NSLocalizedString(@"share_desc_text", nil),
      [NSURL URLWithString:[NSString stringWithFormat:@"%s", *tc::get_share_app_url()]],
      [UIImage imageNamed:@"res/logo_256x256"]
      ];
    
    CategoryShare* act =
    [[CategoryShare alloc] init_with_activity_items:items
                                         origin_ctr:app_delegate.root];
    [act activity_with_rect:rect];
  });
}

void sleep_disabled(bool value) {
  UIApplication.sharedApplication.idleTimerDisabled = value;
}

void send_file(jtn::CStringRef document_path, jtn::CStringRef path) {
  [app_delegate send_file:[NSString stringWithFormat:@"%s", *document_path]
                     path:[NSString stringWithFormat:@"%s", *path]];
}

static jtn::String device_token;

jtn::String get_device_token() {
  return device_token;
}

void set_device_token(jtn::CStringRef token) {
  device_token = token;
}

void onpush_message_notice(NSDictionary* msg, bool is_init) {
  NSMutableDictionary* obj = [NSMutableDictionary dictionaryWithDictionary:msg];
  if (is_init) {
    obj[@"is_init"] = @"true";
  }
  NSData* data = [NSJSONSerialization dataWithJSONObject:obj options:0 error:nil];
  NSString* str;
  BOOL is = YES;
  [NSString stringEncodingForData:data encodingOptions:nil
                  convertedString:&str usedLossyConversion:&is];
  [UIApplication.sharedApplication setApplicationIconBadgeNumber:0];
  tc::onpush_message_notice([str UTF8String]);
}

jtn::String get_device_id() {
  
  static jtn::String str_id;
  
  if (!JEmpty(str_id)) {
    return str_id;
  }
  
  NSString* uuid = [Keychain get:@"com.mg.TouchCode.DEVICE_UUID"];
  if (uuid) {
    str_id = [uuid UTF8String];
    return str_id;
  }
  
  CFUUIDRef uuidRef = CFUUIDCreate(kCFAllocatorDefault);
  uuid = (NSString*)CFBridgingRelease(CFUUIDCreateString(kCFAllocatorDefault, uuidRef));
  
  jtn::String
  str = jtn::hash([uuid UTF8String]);
  str = hex_encode(str.toData());
  
  uuid = [NSString stringWithFormat:@"%s", *str];
  
  [Keychain set:@"com.mg.TouchCode.DEVICE_UUID" data:uuid];
  
  str_id = str;
  
  return jtn::move(str);
}

JEnd

@interface IPhonesAppDelegate()<MFMailComposeViewControllerDelegate> {
  @private
  CGFloat             m_keyboard_bar_height;
  BOOL                m_soft_key_board_status;
  node::NodeContext*  m_context;
}
@end

@implementation IPhonesAppDelegate;
@synthesize window;

static void onnode_context_stop_handle(tesla::Event<>& evt) {
  // 不知道什么原因停止了运行,不管什么原因,重新启动它
  JLog("Unknown exception stop");
  JLog("Restart...");
//  std::this_thread::sleep_for(std::chrono::seconds(1));
  ((node::NodeContext*)evt.sender())->start();
}

+ (node::NodeContext*)create_node_context {
  NSBundle* bundle = [NSBundle mainBundle];
  NSString* tesla = [bundle pathForResource:@"server/tesla/tesla" ofType:@"js"];
#ifdef DEBUG
  int argc = 4;
  const char* argv[] = { "node", [tesla UTF8String], "touch.js", "--debug" };
#else
  int argc = 3;
  const char* argv[] = { "node", [tesla UTF8String], "touch.js" };
#endif
  return new node::NodeContext(argc, argv);
}

//程序启动
- (BOOL) application:(UIApplication*)application
didFinishLaunchingWithOptions:(NSDictionary*)launchOptions {

  app_delegate = self;
  m_keyboard_bar_height = 0;
  
  m_context = [IPhonesAppDelegate create_node_context];
  m_context->JOn(stop, onnode_context_stop_handle);
  m_context->start();
  
//  [self.root set_loading_text:@"Start ace"];
  
  m_soft_key_board_status = NO;
  
  self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]]; // 创建一个窗口
  self.window.backgroundColor = [UIColor whiteColor];
  
  self.root = [[RootViewController alloc] initWithWindow: self.window];
//  [self.root set_loading_text:@"Initialize v8 nodejs"];
  
  self.window.rootViewController = self.root;
  [self.window makeKeyAndVisible];
  
  // 消息
  float version = [[[UIDevice currentDevice] systemVersion] floatValue];
  
  NSNotificationCenter* center = [NSNotificationCenter defaultCenter];
  [center addObserver:self
             selector:@selector(UIPasteboardChanged:)
                 name:UIPasteboardChangedNotification
               object:nil]; // 剪贴板变化
  // 键盘
  [center addObserver:self
             selector:@selector(UIKeyboardWillShowNotification:)
                 name:UIKeyboardWillShowNotification
               object:nil];
  [center addObserver:self
             selector:@selector(UIKeyboardDidShowNotification:)
                 name:UIKeyboardDidShowNotification
               object:nil];
  [center addObserver:self
             selector:@selector(UIKeyboardWillHideNotification:)
                 name:UIKeyboardWillHideNotification
               object:nil];
  if (version >= 5.0) {
    [center addObserver:self
               selector:@selector(UIKeyboardDidChangeFrameNotification:)
                   name:UIKeyboardDidChangeFrameNotification
                 object:nil];
  }
  
  if (launchOptions) {
    id msg = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
    if (msg) {
      tc::onpush_message_notice(msg, YES);
    }
  }
  [application registerForRemoteNotifications]; // 注册APNs服务
  tc::oninit_application_notice();
  return YES;
}

// APNS注册成功
-(void) application:(UIApplication*)application
 didRegisterForRemoteNotificationsWithDeviceToken:(NSData*)deviceToken {
  NSString* token = [NSString stringWithFormat:@"%@", deviceToken];
  NSString* str = [[token substringWithRange:{ 1, token.length - 2 }]
                   stringByReplacingOccurrencesOfString:@" " withString:@""];
  tc::set_device_token([str UTF8String]);
}

//收到远程推送通知消息
-(void) application:(UIApplication*)application
didReceiveRemoteNotification:(NSDictionary*)userInfo {
  tc::onpush_message_notice(userInfo, NO);
}

- (void) UIPasteboardChanged:(NSNotification*)o {
  tc::onclipboard_data_change_notice();
}

- (void) UIKeyboardWillShowNotification:(NSNotification*)note {
  m_soft_key_board_status = YES;
  tc::onopen_soft_keyboard_notice();
  [self set_webview_keyboard_bar];
}

- (void) UIKeyboardDidShowNotification:(NSNotification*)note {
  CGRect keyboardBounds;
  [[note.userInfo valueForKey:UIKeyboardFrameEndUserInfoKey] getValue: &keyboardBounds];
//  CGSize size = self.root.view.bounds.size;
  CGSize size = self.window.bounds.size;
  [self display_port_size_change:size.width
                          height:size.height - (keyboardBounds.size.height - m_keyboard_bar_height)
                          keyboard_height:keyboardBounds.size.height - m_keyboard_bar_height];
}

- (void) UIKeyboardWillHideNotification:(NSNotification*)note {
//  CGSize size = self.root.view.bounds.size;
  CGSize size = self.window.bounds.size;
  m_soft_key_board_status = NO;
  tc::onclose_soft_keyboard_notice();
  [self display_port_size_change:size.width height:size.height keyboard_height:0.0];
}

- (void) UIKeyboardDidChangeFrameNotification:(NSNotification*)note {
  if (m_soft_key_board_status) {
    [self UIKeyboardDidShowNotification:note];
  }
}

 // 设置 webview toolbar
- (void) set_webview_keyboard_bar {
  
  UIWindow* keyboard_window = nil;
  NSArray* windows = [[UIApplication sharedApplication] windows];
  
  for (UIWindow* item in windows) {
    NSString* name = NSStringFromClass(item.class);
    if ([name isEqualToString:@"UITextEffectsWindow"]) {
      keyboard_window = item;
      break;
    }
  }
  
  if (keyboard_window) {
    
    UIView* UIWebFormAccessory =
      [self find_webview_keyboard_bar:keyboard_window
                                 name:@"UIWebFormAccessory"
                         limit_height:80.0];
    if (UIWebFormAccessory) {
      NSArray* constraints = UIWebFormAccessory.constraints;
      for (NSLayoutConstraint* constraint in constraints) {
        m_keyboard_bar_height = constraint.constant;
        constraint.constant = 0;
      }
      UIWebFormAccessory.hidden = YES;
    }
    
    UIView* UIKBInputBackdropView =
      [self find_webview_keyboard_bar:keyboard_window
                                 name:@"UIKBInputBackdropView"
                         limit_height:80.0];
    if (UIKBInputBackdropView) {
      if (UIWebFormAccessory) { // webview
        UIKBInputBackdropView.hidden = YES;
      } else {
        UIKBInputBackdropView.hidden = NO;
        m_keyboard_bar_height = 0;
      }
    }
  }
}

- (UIView*) find_webview_keyboard_bar:(UIView*)view
                                 name:(NSString*)name
                         limit_height:(CGFloat)height {
  NSArray* views = [view subviews];
  for (UIView* item in views) {
    NSString* cls = NSStringFromClass(item.class);
    if ([cls isEqualToString:name] &&
        (height == 0.0 || item.frame.size.height < height)) {
      return item;
    } else {
      UIView* tmp = [self find_webview_keyboard_bar:item
                                               name:name
                                       limit_height:height];
      if (tmp) {
        return tmp;
      }
    }
  }
  return nil;
}

- (void) display_port_size_change:(CGFloat)width
                           height:(CGFloat)height
                  keyboard_height:(CGFloat)key_height {
  [self.root ondisplay_port_size_change_notice:width
                                        height:height
                               keyboard_height:key_height];
}

- (void) download_file:(NSString*)url {
  tc::ondownload_file_notice([url UTF8String]);
}

- (void) applicationDidEnterBackground:(UIApplication*)application {
  node::NodeContext::OnApplicationDidEnterBackground(); // 通知所有的上下文应用进入后台
}

- (void) applicationWillEnterForeground:(UIApplication*)application {
  node::NodeContext::OnApplicationWillEnterForeground(); // 通知所有的上下文应用进入前台
  tc::onclipboard_data_change_notice();
  [self performSelector:@selector(update_display_port_size:) withObject:self afterDelay:2];
  [application setApplicationIconBadgeNumber:0];
  application.idleTimerDisabled = NO; // 启用休眠
}

- (void) update_display_port_size:(id)o {
  CGSize size = self.root.view.bounds.size;
  [self display_port_size_change:size.width height:size.height keyboard_height:0.0];
}

//  mailto:Louistru@live.com?cc=third@example.com,third2@example.com&bcc=fourth@example.com&
//  subject=my email&body=<b>email</b> body!
//  请求发送文件
- (void) send_file:(NSString*)dir path:(NSString*)path {
  if ([MFMailComposeViewController canSendMail]) {
    MFMailComposeViewController* mail = [[MFMailComposeViewController alloc] init];
    NSArray* arr = [path componentsSeparatedByString:@"/"];
    NSString* name = [arr objectAtIndex:arr.count - 1];
    [mail setSubject:name];
    [mail setMessageBody:@"From Touch Code" isHTML:NO];
    mail.mailComposeDelegate = self;
    NSData* data = [NSData dataWithContentsOfFile:
                    [NSString stringWithFormat:@"%@%@", dir, path]];
    [mail addAttachmentData:data mimeType:@"text" fileName:path];
    [self.root presentViewController:mail animated:YES completion:nil];
  } else {
    NSString* url = @"mailto:?body=From Touch Code";
    url = [url stringByAddingPercentEscapesUsingEncoding: NSUTF8StringEncoding];
    [[UIApplication sharedApplication] openURL: [NSURL URLWithString:url]];
  }
}

- (void) send_email_to_author {
  if ([MFMailComposeViewController canSendMail]) {
    MFMailComposeViewController* mail = [[MFMailComposeViewController alloc] init];
    [mail setToRecipients:@[ @"Louistru@live.com" ]];
    mail.mailComposeDelegate = self;
    [self.root presentViewController:mail animated:YES completion:nil];
  } else {
    NSString* url = @"mailto:Louistru@live.com";
    url = [url stringByAddingPercentEscapesUsingEncoding: NSUTF8StringEncoding];
    [[UIApplication sharedApplication] openURL: [NSURL URLWithString:url]];
  }
}

- (void) mailComposeController:(MFMailComposeViewController*)controller
           didFinishWithResult:(MFMailComposeResult)result
                         error:(NSError*)error {
  [controller dismissViewControllerAnimated:YES completion:nil];
}

- (void) applicationDidReceiveMemoryWarning:(UIApplication*)application {
  m_context->garbageCollection(); // v8 GC
}

// https://developer.apple.com/library/mac/#documentation/Miscellaneous/Reference/UTIRef/Articles/System-DeclaredUniformTypeIdentifiers.html

- (BOOL) application:(UIApplication*)application
       handleOpenURL:(NSURL*)url {
  tc::onopen_external_file_notice([url.absoluteString UTF8String]);
  return YES;
}

- (void) dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end

