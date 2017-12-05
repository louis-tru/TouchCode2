/**
 * @createTime 2015-04-03
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import "root_view_controller.h"
#import "app_delegate.h"
#import "TOWebViewController.h"
#import "teide_webview.h"
#import "dialog.h"
#import <iAd/iAd.h>
#import <native_util.h>

/* Detect which user idiom we're running on */
#define IPAD (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)

@interface RootViewController()<ADBannerViewDelegate>
@property (weak,   nonatomic) UIWindow*       window;
@property (strong, nonatomic) NSString*       download_url;
@property (strong, nonatomic) UIImageView*    load_bg;
@property (strong, nonatomic) TeIDEWebView*   webview;
@property (strong, nonatomic) UILabel*        loading_lable;
@property (assign, nonatomic) int             loading_step_count;
@property (strong, nonatomic) NSString*       loading_text;
@property (strong, nonatomic) UIWindow*       inl_browser_window;
@property (strong, nonatomic) ADBannerView*   ad;
@end

@implementation RootViewController;

- (id) initWithWindow:(UIWindow*)win{
  self = [super init];
  self.window = win;
  self.download_url = @"";
  self.ad = nil;
  return self;
}

- (void) loadView{
  
  self.view = [[UIView alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
  self.webview = [[TeIDEWebView alloc] init];
  self.webview.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:self.webview];
  [self.view addConstraint:[NSLayoutConstraint constraintWithItem:self.webview
                                                        attribute:NSLayoutAttributeWidth
                                                        relatedBy:NSLayoutRelationEqual
                                                           toItem:self.view
                                                        attribute:NSLayoutAttributeWidth
                                                       multiplier:1
                                                         constant:0]];
  [self.view addConstraint:[NSLayoutConstraint constraintWithItem:self.webview
                                                        attribute:NSLayoutAttributeHeight
                                                        relatedBy:NSLayoutRelationEqual
                                                           toItem:self.view
                                                        attribute:NSLayoutAttributeHeight
                                                       multiplier:1
                                                         constant:0]];
  if (tc::is_lite()) {     // 初始化ADBannerView
    // 暂时禁用广告条
    /*
    _ad = [[ADBannerView alloc] initWithAdType:ADAdTypeBanner];
    _ad.translatesAutoresizingMaskIntoConstraints = NO;
    _ad.delegate = self;
    [self.view addSubview:_ad];
    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:
                              IPAD ? @"H:|[v1(320)]" : @"H:|[v1]|"
                                                                      options:0
                                                                      metrics:nil
                                                                        views:@{ @"v1": _ad }]];
    [self.view addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:[v1]|"
                                                                options:0
                                                                metrics:nil
                                                                  views:@{ @"v1": _ad }]];
    */
  }
  self.loading_step_count = 0;
//  self.loading_text = @"Initialize v8 nodejs";
  self.load_bg = [[UIImageView alloc] initWithFrame:CGRectZero];
  self.load_bg.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:self.load_bg];
  [self set_load_background];
  
  [self.view addConstraint:[NSLayoutConstraint constraintWithItem:self.load_bg
                                                        attribute:NSLayoutAttributeCenterX
                                                        relatedBy:NSLayoutRelationEqual
                                                           toItem:self.view
                                                        attribute:NSLayoutAttributeCenterX
                                                       multiplier:1
                                                         constant:0]];
  [self.view addConstraint:[NSLayoutConstraint constraintWithItem:self.load_bg
                                                        attribute:NSLayoutAttributeCenterY
                                                        relatedBy:NSLayoutRelationEqual
                                                           toItem:self.view
                                                        attribute:NSLayoutAttributeCenterY
                                                       multiplier:1
                                                         constant:0]];
  
  self.loading_lable = [[UILabel alloc] initWithFrame:CGRectZero];
  self.loading_lable.translatesAutoresizingMaskIntoConstraints = NO;
  self.loading_lable.textAlignment = NSTextAlignmentLeft;
  self.loading_lable.textColor =
    [UIColor colorWithRed:0xd3 / 256.0 green:0xe6 / 256.0 blue:0xfe / 256.0 alpha:1];
  self.loading_lable.font = [UIFont systemFontOfSize:14.0];
  
  [self.load_bg addSubview:self.loading_lable];
  
  [self.view addConstraint:[NSLayoutConstraint constraintWithItem:self.loading_lable
                                                        attribute:NSLayoutAttributeCenterX
                                                        relatedBy:NSLayoutRelationEqual
                                                           toItem:self.view
                                                        attribute:NSLayoutAttributeCenterX
                                                       multiplier:1
                                                         constant:0]];
  [self.view addConstraint:[NSLayoutConstraint constraintWithItem:self.loading_lable
                                                        attribute:NSLayoutAttributeCenterY
                                                        relatedBy:NSLayoutRelationEqual
                                                           toItem:self.view
                                                        attribute:NSLayoutAttributeCenterY
                                                       multiplier:1.3
                                                         constant:0]];
//  [self loading_step:nil];
};

- (void)test_inl:(id)o{
  [self open_inl_browser:@"http://www.taobao.com" priority_history:NO];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
  
  NSArray* allOrientation = [NSArray arrayWithObjects:
                             @"UIInterfaceOrientationPortrait",
                             @"UIInterfaceOrientationPortraitUpsideDown",
                             @"UIInterfaceOrientationLandscapeRight",
                             @"UIInterfaceOrientationLandscapeLeft", nil];
  NSString* cur = [allOrientation objectAtIndex:interfaceOrientation - 1];
  NSDictionary* dic = [[NSBundle mainBundle] infoDictionary];
  NSArray* ls = [dic objectForKey:@"UISupportedInterfaceOrientations"];
  
  for(NSString* s in ls){
    if([cur compare:s] == NSOrderedSame){
      return YES;
    }
  }
  return NO;
}

- (BOOL)shouldAutorotate {
  return YES;
}

- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation {
  [self set_load_background];
}

- (void)set_load_background {
  
  if(!self.load_bg){
    return;
  }
  
  NSDictionary* dic =
  @{
    @"320x480" : @"LaunchImage-700",
    @"320x568" : @"LaunchImage-700-568h",           // 1.775
    @"375x667" : @"LaunchImage-800-667h",           // 1.778
    @"768x1024": @"LaunchImage-700-Portrait~ipad",
    @"1024x768": @"LaunchImage-700-Landscape~ipad",
    @"414x736" : @"LaunchImage-800-Portrait-736h",  // 1.777  // 肖像
    @"736x414" : @"LaunchImage-800-Landscape-736h",           // 风景
  };
  
  float width = self.window.bounds.size.width;
  float height = self.window.bounds.size.height;
  
  float bar_y = (width - self.view.frame.size.width) +
                (height - self.view.frame.size.height);
  
  NSString* key = [NSString stringWithFormat:@"%dx%d",
                   int(self.view.bounds.size.width),
                   int(self.view.bounds.size.height + bar_y)];
  UIImage* image = [UIImage imageNamed:dic[key]];
  
  self.load_bg.image = image;
  self.load_bg.frame = CGRectMake(0, -bar_y, image.size.width, image.size.height);
}

- (NSURL*)get_new_url:(NSString*)url {
  NSTimeInterval time = [[NSDate date] timeIntervalSince1970];
  NSString* urlStr = [NSString stringWithFormat:@"%@%s%f", url,
                      strstr([url UTF8String], "?") ? "&": "?", time];
  return [NSURL URLWithString:urlStr];
}

- (NSString*)teide_webview_url {
  return self.webview.URL.absoluteString;
}

- (void)setTeide_webview_url:(NSString*)url {
  NSURLRequest* request = [NSURLRequest requestWithURL:[self get_new_url:url]];
  [self.webview loadRequest:request];
}

// vwbview完成载入
- (void)show_teide_webview {
  [UIView beginAnimations:@"hide_bg" context:nil];
  [UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
  [UIView setAnimationDuration:0.25];
  self.load_bg.alpha = 0.0;
  [UIView commitAnimations];
  [self performSelector:@selector(delete_load_bg:) withObject:nil afterDelay:0.4];
}

- (void)open_inl_browser:(NSString*)url priority_history:(BOOL)priority {
  
  TOWebViewController* webview_controller = nil;
  
  if(!url){
    url = @"http://127.0.0.1:8081/documents/";
  }
  
  webview_controller =
    [[TOWebViewController alloc] initWithURLString:url priorityHistory:priority];

  webview_controller.modalCompletionHandler = ^{
//    CGSize size = self.window.bounds.size;
//    [self ondisplay_port_size_change_notice:size.width height:size.height keyboard_height:0.0];
  };
  
  webview_controller.shouldStartLoadRequestHandler = ^(NSURLRequest* request,
                                                      UIWebViewNavigationType navigationType) {
    if ([self is_github_zip_download:request.URL.absoluteString]) {
      self.download_url = request.URL.absoluteString;
      [self download:self.download_url]; // 下载
      return NO;
    }
    return YES;
  };
  
  webview_controller.didFailLoadWithErrorHandler = ^(NSError* error) {
    
    if (error.code == 102) { // 下载异常
      NSString* url = [error.userInfo objectForKeyedSubscript:@"NSErrorFailingURLStringKey"];
      if (![url isEqualToString:self.download_url]) {
        [self download:url]; // 尝试发送给client下载
      }
    }
    self.download_url = @"";
  };
  
  UIViewController* ctr0 = [UIViewController new];
  self.inl_browser_window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
  self.inl_browser_window.rootViewController = ctr0;
  self.inl_browser_window.windowLevel = 1.0;
  [self.inl_browser_window makeKeyAndVisible];
  UINavigationController* ctr =
    [[UINavigationController alloc] initWithRootViewController:webview_controller];
  [ctr0 presentViewController:ctr
                     animated:YES
                   completion:^{
                     [self.inl_browser_window resignKeyWindow];
                     self.inl_browser_window = nil;
                   }];
}

- (void)download:(NSString*)url {
  [(IPhonesAppDelegate*)UIApplication.sharedApplication.delegate download_file:url];
}

- (BOOL)is_github_zip_download:(NSString*)url {
  
  // https://codeload.github.com/user/proj/type/tag
  
  NSRange ran = [url rangeOfString:@"https://codeload.github.com/"];
  
  if(ran.length == 0){
    return NO;
  }
  
  if(ran.location != 0){
    return NO;
  }
  
  NSString* str = [url substringFromIndex:ran.length];

  NSArray* ls = [str componentsSeparatedByString:@"/"];
  if(ls.count != 4){
    return NO;
  }
  
  for(NSString* s in ls){
    if([s isEqualToString:@""]){
      return NO;
    }
  }
  return YES;
}

- (void)close_inl_browser {
  
}

- (void)update_loading {
  
  NSArray* step_text =
  @[
    @"   ",
    @".  ",
    @".. ",
    @"...",
  ];
  self.loading_lable.text = [NSString stringWithFormat:@"%@ %@",
                             self.loading_text,
                             step_text[self.loading_step_count]];
}

- (void)loading_step:(id)o {
  if (self.loading_lable) {
    [self update_loading];
    self.loading_step_count = (self.loading_step_count + 1) % 4;
    [self performSelector:@selector(loading_step:) withObject:self afterDelay:0.6];
  }
}

- (void)set_loading_text:(NSString*)text {
  dispatch_async(dispatch_get_main_queue(), ^{
    self.loading_text = text;
    if(self.loading_lable) {
      [self update_loading];
    }
  });
}

- (void)delete_load_bg:(id)o {
  [self.load_bg removeFromSuperview];
  self.load_bg = nil;
  self.loading_lable = nil;
}

- (void) ondisplay_port_size_change_notice:(CGFloat)w
                                    height:(CGFloat)h
                           keyboard_height:(CGFloat)key_h {
  [self.webview ondisplay_port_size_change_notice:w height:h keyboard_height:key_h];
}

- (void) set_ad_panel_diaplay:(BOOL)value {
  if (self.ad) {
    self.ad.hidden = !value;
  }
}

@end
