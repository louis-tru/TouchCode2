/**
 * @createTime 2015-04-03
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <jtn/json.h>
#import "teide_webview.h"
#import "magnifier.h"
#import "ace_text_input.h"
#import "dialog.h"

@interface TeIDEWebView()<UIScrollViewDelegate, AceTextInputDelegate, WKNavigationDelegate>
@property (strong, nonatomic) Magnifier*      magnifier;
@property (strong, nonatomic) AceTextInput*   ace_text_input;
@property (assign, nonatomic) BOOL force_webview_resign_first_responder;
@property (weak, nonatomic) UIView* inl_webview;
@end

static UIView* current_first_responder = nil;

@implementation UIView(AceTextInput)

- (BOOL)becomeFirstResponder {

  if(self.superview && self.superview.superview){
    
    UIView* view = self.superview.superview;
    
    NSString* cl = NSStringFromClass(view.class);
    
    if([cl compare:@"TeIDEWebView"] == NSOrderedSame){
      TeIDEWebView* webview = (TeIDEWebView*)view;
      webview.inl_webview = self;
      
      // 如果当前没有第一响应者, webview 就可以成为第一响应者
      // 或者webview内部发出强制申请成为第一响应者
      if(current_first_responder == nil   ||
         current_first_responder == self  ||
         webview.force_webview_resign_first_responder){
        webview.force_webview_resign_first_responder = NO;
        return [self allow_becomeFirstResponder];
      }
      return NO;
    }
  }
  return [self allow_becomeFirstResponder];
}

- (BOOL)allow_becomeFirstResponder {
  if([super becomeFirstResponder]) {
    if (current_first_responder &&
        current_first_responder != self) { // 当前还有第一响应者，辞掉它
      [current_first_responder resignFirstResponder];
    }
    current_first_responder = self;
    return YES;
  }
  return NO;
}

// 辞去第一响应者
- (BOOL)resignFirstResponder {
  if([super resignFirstResponder]){
    current_first_responder = nil;
    return YES;
  } else {
    return NO;
  }
}

@end

@implementation TeIDEWebView

- (id) init {
  
  self = [super init];
  if(self) {
    self.configuration.allowsInlineMediaPlayback = YES;
    self.configuration.mediaPlaybackRequiresUserAction = NO;
    self.backgroundColor = [UIColor whiteColor];
    self.navigationDelegate = self;
    self.magnifier = [[Magnifier alloc] init];
    self.magnifier.viewToMagnify = self;
    self.ace_text_input = [[AceTextInput alloc] initWithFrame:CGRectMake(0, -2000, 100, 50)];
    self.ace_text_input.delegaet = self;
    self.force_webview_resign_first_responder = NO;
    self.inl_webview = nil;
    self.scrollView.delegate = self;
    self.scrollView.scrollEnabled = NO;
    self.scrollView.bounces = NO;
    [self addSubview:self.ace_text_input];
  }
  return self;
}

- (void) activate_touch_magnifier:(int)x y:(int)y {
  [self.magnifier show];
  self.magnifier.touchPoint = CGPointMake(x, y);
}

- (void) touch_magnifier_move:(int)x y:(int)y {
  self.magnifier.touchPoint = CGPointMake(x, y);
}

- (void) stop_touch_magnifier {
  [self.magnifier hide];
}

// UIScrollViewDelegate

- (void) scrollViewDidScroll:(UIScrollView*)scrollView {
  scrollView.contentOffset = CGPointMake(0, 0);
}

- (UIView*)viewForZoomingInScrollView:(UIScrollView*)scrollView {
  return nil;
}

- (void) webView:(WKWebView*)webView
decidePolicyForNavigationAction:(WKNavigationAction*)navigationAction
 decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
  
  NSURL* nsurl = [navigationAction.request URL];
  NSString* url = [nsurl path];
  NSRange range = [url rangeOfString:@"/teide_native_call/"];
  if(range.length == 0){
    return decisionHandler(WKNavigationActionPolicyAllow);
  }
  
  NSUInteger  index     = range.location + range.length;
  NSRange     ran       = { index, [url length] - index };
  NSString*   json_str  = [url substringWithRange:ran];
  ts::JSON    json      = ts::JSON::parse([json_str UTF8String]);
  
  ts::String    name = json[0].to_string();
  ts::CJSONRef  args = json[1];
  ts::String    cb = json.length() > 2 ? json[2].to_string() : "";
  
  if(name == "ace_touch_magnifier_start"){
    [self activate_touch_magnifier:args[0].to_int() y:args[1].to_int()];
  }
  else if(name == "ace_touch_magnifier_move"){
    [self touch_magnifier_move:args[0].to_int() y:args[1].to_int()];
  }
  else if(name == "ace_touch_magnifier_stop"){
    [self stop_touch_magnifier];
  }
  else if(name == "ace_textinput_focus"){
    [self.ace_text_input focus];
  }
  else if(name == "ace_textinput_blur"){
    [self.ace_text_input blur];
  }
  else if(name == "ace_textinput_set_can_delete"){
    self.ace_text_input.can_delete = args[0].to_bool();
  }
  else if(name == "force_browser_focus"){ // 获取浏览器焦点
    self.force_webview_resign_first_responder = YES;
    if(self.inl_webview){ // 申请焦点
      [self.inl_webview becomeFirstResponder];
    }
  } else if(name == "alert") {
    
    [TeDialog alert:[NSString stringWithUTF8String:args[0].to_cstring()]
     cb            :^(NSString* text){
       if(!cb.isEmpty()){
         [self evaluateJavaScript:
          [NSString stringWithFormat:@"FastNativeService.callback('%s')", *cb]
                completionHandler:nil
          ];
       }
     }];
  } else if(name == "prompt") {
    
    [TeDialog prompt:[NSString stringWithUTF8String:args[0].to_cstring()]
               input:[NSString stringWithUTF8String:args[1].to_cstring()]
     cb             :^(NSString* text){
       if(!cb.isEmpty()){
         [self evaluateJavaScript:
          [NSString stringWithFormat:@"FastNativeService.callback('%s', [%@])",
           *cb, [self format_str:text]]
                completionHandler:nil
          ];
       }
     }];
  } else if(name == "confirm") {
    
    [TeDialog confirm:[NSString stringWithUTF8String:args[0].to_cstring()]
     cb              :^(NSString* text){
       if(!cb.isEmpty()){
         [self evaluateJavaScript:
          [NSString stringWithFormat:@"FastNativeService.callback('%s', [%@])", *cb, text]
                completionHandler:nil
          ];
       }
     }];
  } else if(name == "delete_file_confirm") {
    [TeDialog delete_file_confirm:[NSString stringWithUTF8String:args[0].to_cstring()]
     cb                          :^(NSString* text){
       if(!cb.isEmpty()){
         [self evaluateJavaScript:
          [NSString stringWithFormat:@"FastNativeService.callback('%s', [%@])", *cb, text]
                completionHandler:nil
          ];
       }
     }];
  }
  
  decisionHandler(WKNavigationActionPolicyCancel);
}

- (void) ondisplay_port_size_change_notice:(CGFloat)w
                                    height:(CGFloat)h
                           keyboard_height:(CGFloat)key_h {
  self.magnifier.limit_height = key_h;
  [self evaluateJavaScript:
   [NSString stringWithFormat:
    @"FastNativeService.ondisplay_port_size_change_notice(%f, %f)", w, h]
   completionHandler:nil
   ];
}

// AceTextInputDelegate

- (NSString*)format_str:(NSString*)str{
  if(!str){
    return @"null";
  }
  ts::JSON json = [str UTF8String];
  ts::String str2 = ts::JSON::stringify(json);
  return [NSString stringWithUTF8String:*str2];
}

- (void)onace_text_input_focus_notice {
  [self evaluateJavaScript:
   [NSString stringWithFormat:@"FastNativeService.onace_text_input_focus_notice()"]
   completionHandler:nil
   ];
}

- (void)onace_text_input_blur_notice{
  [self evaluateJavaScript:
   [NSString stringWithFormat:@"FastNativeService.onace_text_input_blur_notice()"]
   completionHandler:nil
   ];
}

- (void)onace_text_input_input_notice:(NSString*)data {
  [self evaluateJavaScript:
   [NSString stringWithFormat:@"FastNativeService.onace_text_input_input_notice(%@)",
    [self format_str:data]]
   completionHandler:nil
   ];
}

- (void)onace_text_input_backspace_notice {
  [self evaluateJavaScript:
   [NSString stringWithFormat:
    @"FastNativeService.onace_text_input_backspace_notice()"] completionHandler:nil
   ];
}

- (void)onace_text_input_indent_notice {
  [self evaluateJavaScript:
   [NSString stringWithFormat:
    @"FastNativeService.onace_text_input_indent_notice()"] completionHandler:nil
   ];
}

- (void)onace_text_input_outdent_notice {
  [self evaluateJavaScript:
   [NSString stringWithFormat:
    @"FastNativeService.onace_text_input_outdent_notice()"] completionHandler:nil
   ];
}

- (void)onace_text_input_comment_notice {
  [self evaluateJavaScript:
   [NSString stringWithFormat:
    @"FastNativeService.onace_text_input_comment_notice()"] completionHandler:nil
   ];
}

- (void)onace_text_input_composition_start_notice:(NSString*)data {
  [self evaluateJavaScript:
   [NSString stringWithFormat:
    @"FastNativeService.onace_text_input_composition_start_notice(%@)", [self format_str:data]]
   completionHandler:nil
   ];
}

- (void)onace_text_input_composition_update_notice:(NSString*)data{
  NSString* script =
    [NSString stringWithFormat:
     @"FastNativeService.onace_text_input_composition_update_notice(%@)", [self format_str:data]];
  [self evaluateJavaScript:script completionHandler:nil];
}

- (void)onace_text_input_composition_end_notice:(NSString*)data{
  [self evaluateJavaScript:
   [NSString stringWithFormat:
    @"FastNativeService.onace_text_input_composition_end_notice(%@)",
    [self format_str:data]]
   completionHandler:nil
   ];
}

@end
