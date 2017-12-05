/**
 * @createTime 2015-04-19
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import "dialog.h"
#import "nsobject+delay_block.h"
#import <tesla/util.h>

/* Detect which user idiom we're running on */
#define IPAD (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)

@interface Alert:TeDialog<TeDialogDelegate>
@property (strong, nonatomic) TeDialogCallback cb;
@end

@implementation Alert

- (id)init_with_text:(NSString*)text cb:(TeDialogCallback)cb {
  self = [super init_with_title:nil
                            msg:text
                       delegate:self
                  button_titles:@[ NSLocalizedString(@"OK", nil) ]];
  self.cb = cb;
  return self;
}

- (void)dialog:(TeDialog*)view clicked_button_at_index:(NSInteger)index{
  if(self.cb){
    self.cb(@"");
  }
}
@end

@interface Confirm: Alert
@end

@implementation Confirm

- (id)init_with_text:(NSString*)text cb:(TeDialogCallback)cb {
  self = [super init_with_title:nil
                            msg:text
                       delegate:self
                  button_titles:@[NSLocalizedString(@"Cancel", nil),
                                  NSLocalizedString(@"OK", nil)]];
  self.cb = cb;
  return self;
}

- (void)dialog:(TeDialog*)view clicked_button_at_index:(NSInteger)index{
  if(self.cb){
    self.cb(index == 0 ? @"false": @"true");
  }
}
@end

@interface DeleteFileConfirm: Alert
@end

@implementation DeleteFileConfirm

- (id)init_with_text:(NSString*)text cb:(TeDialogCallback)cb {
  self = [super init_with_title:nil
                            msg:text
                       delegate:self
                  button_titles:@[NSLocalizedString(@"Cancel", nil),
                                  NSLocalizedString(@"Local", nil),
                                  NSLocalizedString(@"All", nil)]];
  self.cb = cb;
  return self;
}

- (void)dialog:(TeDialog*)view clicked_button_at_index:(NSInteger)index{
  if(self.cb){
    self.cb([NSString stringWithFormat:@"%ld", index]);
  }
}
@end

@interface Prompt:Alert<UITextFieldDelegate>
@property (strong, nonatomic) UITextField* field;
@end

@implementation Prompt
- (id)init_with_text:(NSString*)text input:(NSString*)input cb:(TeDialogCallback)cb {
  self = [super init_with_title:nil
                            msg:text
                       delegate:self
                  button_titles:@[NSLocalizedString(@"Cancel", nil),
                                  NSLocalizedString(@"OK", nil)]];
  if(self){
    self.field = [[UITextField alloc] init];
    self.field.clearButtonMode = UITextFieldViewModeWhileEditing; //编辑时会出现个修改Xsel
    self.field.autocorrectionType = UITextAutocorrectionTypeNo;
    self.field.borderStyle = UITextBorderStyleRoundedRect;
    self.field.autocorrectionType = UITextAutocorrectionTypeNo;
    self.field.autocapitalizationType = UITextAutocapitalizationTypeNone;
    self.field.returnKeyType = UIReturnKeyDone;
    self.field.font = [UIFont systemFontOfSize:14];
    self.field.text = input;
    self.field.delegate = self;

    self.cb = cb;
  }
  return self;
}

- (void)dialog_will_show:(TeDialog*)view{
  self.field.translatesAutoresizingMaskIntoConstraints = NO;
  [self.content addSubview:self.field];
  [self.content addConstraints:
   [NSLayoutConstraint constraintsWithVisualFormat:@"H:|-5-[field]-5-|"
                                           options:0
                                           metrics:nil
                                             views:@{ @"field": self.field }]];
  [self.content addConstraints:
   [NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0-[field(30)]-20-|"
                                           options:0
                                           metrics:nil
                                             views:@{ @"field": self.field }]];
  [self.field becomeFirstResponder];
}

- (void)dialog:(TeDialog*)view clicked_button_at_index:(NSInteger)index{
  if(self.cb){
    if(index == 1){
      self.cb(self.field.text);
    }
    else{
      self.cb(nil);
    }
  }
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField{
  if(self.cb){
    self.cb(self.field.text);
  }
  [self close];
  return YES;
}

@end

@interface TeButton: UIButton
@property (strong, nonatomic) UIColor* highlightBackgroundColor;
@property (strong, nonatomic) UIColor* regularBackgroundColor;
@end

@implementation TeButton

- (id)initWithTitle:(NSString*)title{
  self = [super init];
  if (self) {
    
    UIColor* color = [UIColor colorWithRed:0x15 / 255.0
                                     green:0x7e / 255.0
                                      blue:0xfb / 255.0
                                     alpha:1.0];
    [self setTitleColor:color forState:UIControlStateNormal];
    [self setTitle:title forState:UIControlStateNormal];
    self.tintColor = color;
    
    self.highlightBackgroundColor = [UIColor colorWithRed:0xe1 / 255.0
                                                    green:0xe4 / 255.0
                                                     blue:0xe4 / 255.0
                                                    alpha:1];
    self.regularBackgroundColor = [UIColor colorWithWhite:1 alpha:1];
    self.backgroundColor = self.regularBackgroundColor;
    self.clipsToBounds = YES;
  }
  return self;
}

- (UIButtonType)buttonType{
  return UIButtonTypeCustom;
}

-(void)setHighlighted:(BOOL)highlighted {
  self.backgroundColor =
    highlighted ? self.highlightBackgroundColor: self.regularBackgroundColor;
}

@end

@interface TeDialogKeyboardNotificationService: NSObject
@property (strong, nonatomic) NSMutableArray* dialogs;
@property (assign, nonatomic) BOOL soft_key_board_status;
@property (assign, nonatomic) CGFloat keyboard_height;
@end

@implementation TeDialogKeyboardNotificationService

- (id)init{
  self = [super init];
  if(self){
    
    self.dialogs = [NSMutableArray new];
    // 消息
    float version = [[[UIDevice currentDevice] systemVersion] floatValue];
    
    NSNotificationCenter* notification = [NSNotificationCenter defaultCenter];
    
    // 键盘
    [notification addObserver:self
                     selector:@selector(UIKeyboardWillShowNotification:)
                         name:UIKeyboardWillShowNotification
                       object:nil];   //
    [notification addObserver:self
                     selector:@selector(UIKeyboardWillHideNotification:)
                         name:UIKeyboardWillHideNotification
                       object:nil];
    
    if (version >= 5.0) {
      [notification addObserver:self
                       selector:@selector(UIKeyboardDidChangeFrameNotification:)
                           name:UIKeyboardDidChangeFrameNotification
                         object:nil];
    }
  }
  return self;
}

- (void)UIKeyboardWillShowNotification:(NSNotification*)note{
  
  CGRect keyboardBounds;
    [[note.userInfo valueForKey:UIKeyboardFrameEndUserInfoKey] getValue: &keyboardBounds];
  
  self.soft_key_board_status = YES;
  self.keyboard_height = keyboardBounds.size.height;
  
  for(TeDialog* dag in self.dialogs){
    [self set_dialog_frame:dag];
  }
}

- (void)UIKeyboardWillHideNotification:(NSNotification*)note{
  
  self.soft_key_board_status = NO;
  self.keyboard_height = 0;
  
  for(TeDialog* dag in self.dialogs){
    [self set_dialog_frame:dag];
  }
}

- (void)UIKeyboardDidChangeFrameNotification:(NSNotification*)note{
  if(self.soft_key_board_status){
    [self UIKeyboardWillShowNotification:note];
  }
}

- (void)push_dialog:(TeDialog*)dag{
  [self.dialogs addObject:dag];
}

- (void)remove_dialog:(TeDialog*)dag{
  [self.dialogs removeObject:dag];
}

- (void)set_dialog_frame:(TeDialog*)dag{
  //  CGSize size = self.root.view.bounds.size;
  CGSize size = dag.window.bounds.size;
  int width = size.width;
  int height = size.height - self.keyboard_height;
  dag.frame = CGRectMake(0, 0, width, height);
}

- (void)dealloc{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (TeDialogKeyboardNotificationService*)share{
  static TeDialogKeyboardNotificationService* service = nil;
  if(!service){
    service = [TeDialogKeyboardNotificationService new];
  }
  return service;
}

@end

TSInitBlock(init_TeDialogKeyboardNotificationService){
  [TeDialogKeyboardNotificationService share];
}

@interface TeDialog()
@property (strong, nonatomic) NSString* title_str;
@property (strong, nonatomic) NSString* msg_str;
@property (strong, nonatomic) NSArray* buttons_str;
@property (strong, nonatomic) UIView* main;
@property (strong, nonatomic) UILabel* title;
@property (strong, nonatomic) UILabel* msg;
@property (strong, nonatomic) UIView* buttons;
@property (strong, nonatomic) NSMutableDictionary* views;
@property (strong, nonatomic) UIWindow* window;
//@property (strong, nonatomic) DelayedCall* delay;
@end

@implementation TeDialog

- (id)init_with_title:(NSString*)title
                  msg:(NSString*)msg
             delegate:(id<TeDialogDelegate>)del
        button_titles:(NSArray *)titles {
  self = [super init];
  
  if(self){
    [[TeDialogKeyboardNotificationService share] push_dialog:self];
    self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]]; // 创建一个窗口
    self.window.rootViewController = [UIViewController new];
    self.window.rootViewController.view = self;
    self.window.backgroundColor = [UIColor colorWithWhite:0 alpha:0.3];
    self.window.windowLevel = 10.0;
    self.backgroundColor = [UIColor clearColor];
    self.views = [NSMutableDictionary new];
    self.title_str = title;
    self.msg_str = msg;
    self.buttons_str = titles;
    self.delegate = del;
    self.main = [UIView new];
    self.title = [UILabel new];
    self.msg = [UILabel new];
    self.content = [UIView new];
    self.buttons = [UIView new];
    self.views[@"main"] = self.main;
    self.views[@"title"] = self.title;
    self.views[@"msg"] = self.msg;
    self.views[@"buttons"] = self.buttons;
  }
  return self;
}

- (void)dealloc{
  
}

- (void)setContent:(UIView*)value{
  _content = value;
  self.views[@"content"] = value;
}

- (void)step{
  
  [self.window makeKeyAndVisible];
  [self step_main];
  NSString* title_h = [self step_title];
  NSString* msg_h = [self step_msg];
  NSString* content_h = [self step_content];
  NSString* buttons_h = [self step_buttons];
  NSString* f =
    [NSString stringWithFormat:@"V:|%@%@%@%@|", title_h, msg_h, content_h, buttons_h];
  [self.main addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:f
                                                                    options:0
                                                                    metrics:nil
                                                                      views:self.views]];
  [self add_buttons];
}

- (void)step_main{
  self.main.backgroundColor = [UIColor colorWithWhite:1 alpha:1];
  self.main.layer.cornerRadius = 7; // 圆角
  self.main.clipsToBounds = YES;
  self.main.layer.masksToBounds = YES;
  self.main.translatesAutoresizingMaskIntoConstraints = NO;
  [self addSubview:self.main];
  [self addConstraint:[NSLayoutConstraint constraintWithItem:self.main
                                                   attribute:NSLayoutAttributeCenterX
                                                   relatedBy:NSLayoutRelationEqual
                                                      toItem:self
                                                   attribute:NSLayoutAttributeCenterX
                                                  multiplier:1
                                                    constant:0]];
  [self addConstraint:[NSLayoutConstraint constraintWithItem:self.main
                                                   attribute:NSLayoutAttributeCenterY
                                                   relatedBy:NSLayoutRelationEqual
                                                      toItem:self
                                                   attribute:NSLayoutAttributeCenterY
                                                  multiplier:1
                                                    constant:0]];
  
  if(IPAD){
    [self addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:[main(380)]"
                                                                 options:0
                                                                 metrics:nil
                                                                   views:self.views ]];
  }
  else{ // iphone
    [self addConstraint:[NSLayoutConstraint constraintWithItem:self.main
                                                     attribute:NSLayoutAttributeWidth
                                                     relatedBy:NSLayoutRelationEqual
                                                        toItem:self
                                                     attribute:NSLayoutAttributeWidth
                                                    multiplier:0.9
                                                      constant:0]];
  }
}

- (NSString*)step_title{
  self.title.translatesAutoresizingMaskIntoConstraints = NO;
  self.title.clipsToBounds = YES;
  [self.main addSubview:self.title];
  [self.main addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[title]-10-|"
                                                                    options:0
                                                                    metrics:nil
                                                                      views:self.views]];
  self.title.text = self.title_str ? self.title_str : @"";
  self.title.font = [UIFont systemFontOfSize:18.0];
  self.title.textAlignment = NSTextAlignmentCenter;
  
  return @"-10-[title]";
}

- (NSString*)step_msg{
  self.msg.translatesAutoresizingMaskIntoConstraints = NO;
  [self.main addSubview:self.msg];
  [self.main addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[msg]-10-|"
                                                                    options:0
                                                                    metrics:nil
                                                                      views:self.views]];
  self.msg.text = self.msg_str ? self.msg_str : @"";
  self.msg.font = [UIFont systemFontOfSize:14.0];
  self.msg.textAlignment = NSTextAlignmentCenter;
  self.msg.numberOfLines = 0;
  
  if(self.msg_str){
    return @"-10-[msg]-20-";
  }
  else{
    return @"-10[msg]";
  }
}

- (NSString*)step_content{
  self.content.translatesAutoresizingMaskIntoConstraints = NO;
  [self.main addSubview:self.content];
  [self.main addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[content]-10-|"
                                                                    options:0
                                                                    metrics:nil
                                                                      views:self.views]];
  return @"[content]";
}

- (NSString*) step_buttons {
  self.buttons.translatesAutoresizingMaskIntoConstraints = NO;
  self.buttons.clipsToBounds = YES;
  [self.main addSubview:self.buttons];
  [self.main addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"H:|[buttons]|"
                                                                    options:0
                                                                    metrics:nil
                                                                      views:self.views]];
  self.buttons.backgroundColor = [UIColor colorWithRed:0x9d / 255.0
                                                 green:0xa1 / 255.0
                                                  blue:0xa0 / 255.0
                                                 alpha:1.0];
  return self.buttons_str.count ? @"[buttons(41)]" : @"[buttons(0)]";
}

- (void) add_buttons {
  
  NSUInteger count = self.buttons_str.count;
  if(!count) return;
  //
  NSMutableDictionary* btns = [NSMutableDictionary new];
  NSMutableString* format = [NSMutableString stringWithString:@"H:|"];
  for (NSUInteger i = 0; i < count; i++) {
    TeButton* button = [[TeButton alloc] initWithTitle:self.buttons_str[i]];
    button.translatesAutoresizingMaskIntoConstraints = NO;
    NSString* key = [NSString stringWithFormat:@"btn%lu", i];
    btns[key] = button;
    if(i == 0){
      [format appendString:[NSString stringWithFormat:@"[%@]", key]];
    } else {
      [format appendString:[NSString stringWithFormat:@"-0.5-[%@(btn0)]", key]];
    }
    [self.buttons addSubview:button];
    [self.buttons addConstraints:
     [NSLayoutConstraint constraintsWithVisualFormat:@"V:|-0.5-[btn]|"
                                             options:0
                                             metrics:nil
                                               views:@{ @"btn":button }]];
    [button addTarget:self
               action:@selector(didClickButton:)
     forControlEvents:UIControlEventTouchUpInside];
    [button setTag:i];
  }
  [format appendString:@"|"];
  [self.buttons addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:format
                                                                       options:0
                                                                       metrics:nil
                                                                         views:btns]];
}

- (void) didClickButton:(UIButton*)button {
  
  if([self.delegate respondsToSelector:@selector(dialog:clicked_button_at_index:)]){
    [self.delegate dialog:self clicked_button_at_index:button.tag];
  }
  
  [self close];
}

- (void) show {
  [self step];
  
  [[TeDialogKeyboardNotificationService share] set_dialog_frame:self];
  
  if([self.delegate respondsToSelector:@selector(dialog_will_show:)]){
    [self.delegate dialog_will_show:self];
  }
  
  self.window.backgroundColor = [UIColor colorWithWhite:0 alpha:0];
  self.main.transform = CGAffineTransformMakeScale(0, 0);
  self.main.alpha = 0;
  
  [UIView animateWithDuration:0.2 animations:^{
    self.window.backgroundColor = [UIColor colorWithWhite:0 alpha:0.3];
    self.main.transform = CGAffineTransformIdentity;
    self.main.alpha = 1;
  }];
}

- (void) close {

  [UIView animateWithDuration:0.2 animations:^{
    self.window.backgroundColor = [UIColor colorWithWhite:0 alpha:0];
    self.main.transform = CGAffineTransformMakeScale(0.6, 0.6);
    self.main.alpha = 0;
  } completion:^(BOOL finished) {
    [self removeFromSuperview];
    [self.window resignKeyWindow];
    [[TeDialogKeyboardNotificationService share] remove_dialog:self];
    self.window = nil;
  }];
}

+ (void)alert:(NSString*)text{
  [[[Alert alloc] init_with_text:text cb:nil] show];
}

+ (void)alert:(NSString*)text   cb:(TeDialogCallback)cb{
  [[[Alert alloc] init_with_text:text cb:cb] show];
}

+ (void)confirm:(NSString*)text cb:(TeDialogCallback)cb{
  [[[Confirm alloc] init_with_text:text cb:cb] show];
}

+ (void)delete_file_confirm:(NSString*)text cb:(TeDialogCallback)cb{
  [[[DeleteFileConfirm alloc] init_with_text:text cb:cb] show];
}

+ (void)prompt:(NSString*)text  input:(NSString*)input cb:(TeDialogCallback)cb{
  [[[Prompt alloc] init_with_text:text input:input cb:cb] show];
}

@end


