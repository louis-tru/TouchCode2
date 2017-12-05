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
#import "app_delegate.h"
#import "category_share.h"
#import "nsobject+delay_block.h"
#import <MessageUI/MFMailComposeViewController.h>
#import "root_view_controller.h"

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
    [app_delegate.root set_loading_text:@"Start web server"];
  });
}

void complete_load() {
  static bool is = false;
  if (is) return;
  is = true;
  
  [app_delegate.root set_loading_text:@"Loading ace"];
  
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
  
  [self.root set_loading_text:@"Start ace"];
  
  m_soft_key_board_status = NO;
  
  self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]]; // 创建一个窗口
  self.window.backgroundColor = [UIColor whiteColor];
  
  self.root = [[RootViewController alloc] initWithWindow: self.window];
  [self.root set_loading_text:@"Initialize v8 nodejs"];
  
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
  
  //[application setApplicationIconBadgeNumber:10];
  
  //1.创建消息上面要添加的动作(按钮的形式显示出来)
  UIMutableUserNotificationAction* action = [UIMutableUserNotificationAction new];
  action.identifier = @"action";//按钮的标示
  action.title = @"Accept";//按钮的标题
  action.activationMode = UIUserNotificationActivationModeForeground;//当点击的时候启动程序
  //action.authenticationRequired = YES;
  //action.destructive = YES;
  
  UIMutableUserNotificationAction* action2 = [UIMutableUserNotificationAction new];
  action2.identifier = @"action2";
  action2.title = @"Reject";
  //当点击的时候不启动程序，在后台处理
  action2.activationMode = UIUserNotificationActivationModeBackground;
  action2.authenticationRequired = YES;
  //需要解锁才能处理
  //如果action.activationMode = UIUserNotificationActivationModeForeground;则这个属性被忽略；
  action2.destructive = YES;
  
  //2.创建动作(按钮)的类别集合
  UIMutableUserNotificationCategory* categorys = [UIMutableUserNotificationCategory new];
  categorys.identifier = @"alert";//这组动作的唯一标示
  [categorys setActions:@[action, action2] forContext:(UIUserNotificationActionContextMinimal)];
  
  //3.创建UIUserNotificationSettings，并设置消息的显示类类型
  UIUserNotificationType type =
    (UIUserNotificationTypeAlert | UIUserNotificationTypeBadge | UIUserNotificationTypeSound);
  UIUserNotificationSettings* uns =
  [UIUserNotificationSettings settingsForTypes:type
                                    categories:[NSSet setWithObjects:categorys, nil]];
  
  //4.注册推送
  [application registerForRemoteNotifications];
  [application registerUserNotificationSettings:uns];
  
//  //5.发起本地推送消息
//  UILocalNotification* notification = [[UILocalNotification alloc] init];
//  notification.fireDate = [NSDate dateWithTimeIntervalSinceNow:5];
//  notification.timeZone = [NSTimeZone defaultTimeZone];
//  notification.alertBody = @"测试推送的快捷回复";
//  notification.category = @"alert";
//  [[UIApplication sharedApplication] scheduleLocalNotification:notification];
//  
//  //用这两个方法判断是否注册成功
//   NSLog(@"currentUserNotificationSettings = %@", [application currentUserNotificationSettings]);
//  [application isRegisteredForRemoteNotifications];
  
  tc::oninit_application_notice();
  return YES;
}

// start Notification delegate

//本地推送通知
-(void)application:(UIApplication *)application
didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
  //成功注册registerUserNotificationSettings:后，回调的方法
//  NSLog(@"%@",notificationSettings);
}

-(void)application:(UIApplication *)application
didReceiveLocalNotification:(UILocalNotification *)notification {
  //收到本地推送消息后调用的方法
//  NSLog(@"%@",notification);
}

-(void) application:(UIApplication *)application
handleActionWithIdentifier:(NSString *)identifier
forLocalNotification:(UILocalNotification *)notification
  completionHandler:(void (^)())completionHandler {
  //在非本App界面时收到本地消息，下拉消息会有快捷回复的按钮，点击按钮后调用的方法，
  //根据identifier来判断点击的哪个按钮，notification为消息内容
  //  NSLog(@"%@----%@",identifier,notification);
  completionHandler();//处理完消息，最后一定要调用这个代码块
}

// 向APNS注册成功
-(void) application:(UIApplication *)application
 didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {

  NSString* decToken = [NSString stringWithFormat:@"%@", deviceToken];
  //获取到之后要去掉尖括号和中间的空格
  NSMutableString* st = [NSMutableString stringWithString:decToken];
  [st deleteCharactersInRange:NSMakeRange(0, 1)];
  [st deleteCharactersInRange:NSMakeRange(st.length-1, 1)];
  NSString* string1 = [st stringByReplacingOccurrencesOfString:@" " withString:@""];
  //保存到本地
  NSUserDefaults* u = [NSUserDefaults standardUserDefaults];
  [u setObject:string1 forKey:@"deviceToken"];
  
  tc::set_device_token(jtn::Data(new char[deviceToken.length], (int)deviceToken.length));
}

//向APNS注册失败
-(void) application:(UIApplication *)application
 didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  
}

//收到远程推送通知消息
-(void) application:(UIApplication *)application
didReceiveRemoteNotification:(NSDictionary *)userInfo {
  
}

-(void)application:(UIApplication *)application
handleActionWithIdentifier:(NSString *)identifier
forRemoteNotification:(NSDictionary *)userInfo
 completionHandler:(void (^)())completionHandler {
  //在没有启动本App时，收到服务器推送消息，下拉消息会有快捷回复的按钮，
  //点击按钮后调用的方法，根据identifier来判断点击的哪个按钮
}

// end Notification

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
  [self.root ondisplay_port_size_change_notice:width height:height keyboard_height:key_height];
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
  UIApplication.sharedApplication.idleTimerDisabled = NO; // 启用休眠
}

- (void) update_display_port_size:(id)o {
  CGSize size = self.root.view.bounds.size;
  [self display_port_size_change:size.width height:size.height keyboard_height:0.0];
}

// 请求发送文件
- (void) send_file:(NSString*)dir path:(NSString*)path {
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
}

- (void) mailComposeController:(MFMailComposeViewController*)controller
           didFinishWithResult:(MFMailComposeResult)result
                         error:(NSError*)error {
  [controller dismissViewControllerAnimated:YES completion:nil];
}

- (void) send_email_to_author {
  MFMailComposeViewController* mail = [[MFMailComposeViewController alloc] init];
  [mail setToRecipients:@[ @"louistru@live.com" ]];
  mail.mailComposeDelegate = self;
  [self.root presentViewController:mail animated:YES completion:nil];
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

