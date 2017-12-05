/**
 * @createTime 2015-04-19
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import "ace_text_input.h"
#import "ace_text_input_range.h"
#include <objc/message.h>
#import "CYRKeyboardButton.h"

/* Detect which user idiom we're running on */
#define IPAD (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)

@interface KeyboardAccessoryView: UIInputView<UIInputViewAudioFeedback> {
  @private
  __weak id<UITextInput> m_input;
  NSMutableArray* m_btns;
}
@end

@implementation KeyboardAccessoryView

- (id) init_with_input:(id<UITextInput>)input {
  
  CGRect rect = CGRectMake(0, 0, 768, 45);
  self = [super initWithFrame:rect inputViewStyle:UIInputViewStyleKeyboard];
  
  if(self){
    m_input = input;
    m_btns = [NSMutableArray new];
    return self;
  }
  return nil;
}

- (BOOL) enableInputClicksWhenVisible{
  return YES;
}

- (CYRKeyboardButton*) add_btn_with_titles:(NSArray*)titles{
  return [self add_btn_with_titles:titles values:titles];
}

- (CYRKeyboardButton*) add_btn_with_titles:(NSArray*)titles values:(NSArray*)values{
  CYRKeyboardButton* btn = [[CYRKeyboardButton alloc] initWithFrame:CGRectZero];
  btn.translatesAutoresizingMaskIntoConstraints = NO;
  btn.textInput = m_input;
  [btn set_titles:titles values:values];
  [m_btns addObject:btn];
  [self addSubview:btn];
  // 
  [self addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:@"V:|-6-[btn]-0-|"
                                                               options:0
                                                               metrics:nil
                                                                 views:@{ @"btn": btn }]];
  return btn;
}

- (void) add_complete {
  
  NSDictionary* metrics = nil;
  
  if (IPAD) {
    metrics =
    @{
      @"margin" : @6,
      @"spacing" : @12,
    };
  } else {
    metrics =
    @{
      @"margin" : @3,
      @"spacing" : @6,
    };
  }
  
  NSMutableDictionary* views = [NSMutableDictionary new];
  __block NSString* layout_format = @"H:|-margin-";
  __block NSUInteger count = m_btns.count;
  
  [m_btns enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    views[[NSString stringWithFormat:@"v%lu", (unsigned long)idx]] = obj;
    if (idx + 1 < count) {
      layout_format =
        [layout_format stringByAppendingFormat:@"[v%lu(==v0)]-spacing-", (unsigned long)idx];
    }
  }];
  
  layout_format =
    [layout_format stringByAppendingFormat:@"[v%lu(==v0)]-margin-|", count - 1];
  
  [self addConstraints:[NSLayoutConstraint constraintsWithVisualFormat:layout_format
                                                               options:0
                                                               metrics:metrics
                                                                 views:views]];
}

@end

@interface AceTextInput(){
  @private
  NSString*                   m_marked_text;
  UITextInputStringTokenizer* m_tokenizer;
}
// @property (strong, nonatomic) UIView* inputView;
@property (strong, nonatomic) UIView* inputAccessoryView;
@end

@implementation AceTextInput

#pragma mark UITextInputTraits protocol
@synthesize autocapitalizationType;
@synthesize autocorrectionType;
@synthesize keyboardType;
@synthesize keyboardAppearance;
@synthesize returnKeyType;
@synthesize spellCheckingType;
@synthesize enablesReturnKeyAutomatically;

#pragma mark UITextInput protocol
@synthesize selectedTextRange;
@synthesize markedTextRange;
@synthesize markedTextStyle;
@synthesize beginningOfDocument;
@synthesize endOfDocument;
@synthesize inputDelegate;
@synthesize tokenizer;

- (id)initWithFrame:(CGRect)frame {
  
  self = [super initWithFrame:frame];
  if (self) {
    self.delegaet = nil;
    self.autocapitalizationType = UITextAutocapitalizationTypeNone;
    self.autocorrectionType = UITextAutocorrectionTypeNo;
    self.keyboardType = UIKeyboardTypeDefault;
    self.returnKeyType = UIReturnKeyDefault;
    self.backgroundColor = [UIColor whiteColor];
    
    self.can_delete = YES;
    m_marked_text = [NSMutableString string];
    
    NSNotificationCenter* notification = [NSNotificationCenter defaultCenter];
    [notification addObserver:self
                     selector:@selector(UIKeyboardWillHideNotification:)
                         name:UIKeyboardWillHideNotification
                       object:nil];
  }
  return self;
}

- (void)dealloc{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView*) inputAccessoryView{
  
  if (_inputAccessoryView) return _inputAccessoryView;
  
  KeyboardAccessoryView* view = [[KeyboardAccessoryView alloc] init_with_input:self];

  [view add_btn_with_titles:@[ @"⇥", @"⇤" ] values:@[ ^(CYRKeyboardButton* btn){
    [self.delegaet onace_text_input_indent_notice];
  }, ^(CYRKeyboardButton* btn){
    [self.delegaet onace_text_input_outdent_notice];
  } ]];
  if (IPAD) {
    [view add_btn_with_titles:@[ @"{", @"[" ]];
    [view add_btn_with_titles:@[ @"}", @"]" ]];
    [view add_btn_with_titles:@[ @"(", @"<" ]];
    [view add_btn_with_titles:@[ @")", @">" ]];
    [view add_btn_with_titles:@[ @"\"",@"'" ]];
    [view add_btn_with_titles:@[ @";", @":", @".", @",", @"?", @"\\" ]];
    [view add_btn_with_titles:@[ @"$", @"_", @"@", @"#" ]];
    [view add_btn_with_titles:@[ @"&", @"|", @"!", @"^", @"~" ]];
    [view add_btn_with_titles:@[ @"+", @"-",@"*", @"/", @"%" ]];
    [view add_btn_with_titles:@[ @"=", @"//" ] values:
     @[
       @"=",
       ^(CYRKeyboardButton* btn){
        [self.delegaet onace_text_input_comment_notice];
      }
    ]];
  } else {
    [view add_btn_with_titles:@[ @"(", @"{", @"[", @"<" ]];
    [view add_btn_with_titles:@[ @")", @"}", @"]", @">" ]];
    [view add_btn_with_titles:@[ @"\"",@"'" ]];
    [view add_btn_with_titles:@[ @".", @",", @";", @":", @"?", @"\\" ]];
    [view add_btn_with_titles:@[ @"$", @"_", @"@", @"#" ]];
    [view add_btn_with_titles:@[ @"&", @"|", @"!", @"^", @"~" ]];
    [view add_btn_with_titles:@[ @"+", @"-", @"*", @"/", @"%" ]];
    [view add_btn_with_titles:@[ @"=", @"//" ] values:
     @[
       @"=", ^(CYRKeyboardButton* btn){
        [self.delegaet onace_text_input_comment_notice];
      }
    ]];
    [view add_btn_with_titles:@[ @"▾" ] values:@[ ^(CYRKeyboardButton* btn){
      [self resignFirstResponder];
    } ]].style = CYRKeyboardButtonStyleTablet;
  }
  [view add_complete];
  return _inputAccessoryView = view;
}

- (void)UIKeyboardWillHideNotification:(NSNotification*)note {
//  if(self.isFirstResponder){ // 辞去焦点
//    [self resignFirstResponder];
////    NSLog(@"UIKeyboardWillHideNotification");
//  }
}

- (void)focus {
  [self becomeFirstResponder];
}

- (void)blur {
  [self resignFirstResponder];
}

- (void)set_read_only:(BOOL)is {
  
}

- (BOOL)canBecomeFirstResponder {
  return YES;
}

- (BOOL)becomeFirstResponder {
  if([super becomeFirstResponder]){
    [self.delegaet onace_text_input_focus_notice];
    return YES;
  }
  return NO;
}

- (BOOL)resignFirstResponder {
  if([super resignFirstResponder]){
    [self.delegaet onace_text_input_blur_notice];
    return YES;
  }
  return NO;
}

- (BOOL)hasText {
  return m_marked_text.length > 0;
}

- (void)insertText:(NSString*)text {
  [self.delegaet onace_text_input_input_notice:text];
}

- (void)deleteBackward {
  [self.delegaet onace_text_input_backspace_notice];
}

- (NSString*)textInRange:(UITextRange*)range {
  return m_marked_text.length ? m_marked_text : @"";
}

- (void)replaceRange:(UITextRange*)range withText:(NSString*)text {
  
}

- (void)setSelectedTextRange:(UITextRange*)aSelectedTextRange {
  
}

- (UITextRange*)selectedTextRange {
  return [AceTextRange new];
}

- (void)setMarkedTextStyle:(NSDictionary*)style {
  
}

- (NSDictionary*)markedTextStyle {
  return nil;
}

- (UITextRange*)markedTextRange {
  // 确定多级文本
  if(m_marked_text.length == 0){
    return nil;
  }
  return [AceTextRange new];
}

- (void)setMarkedText:(NSString*)markedText selectedRange:(NSRange)selectedRange {
  // 设置标记范围
  if(m_marked_text.length == 0){
    [self.delegaet onace_text_input_composition_start_notice:markedText];
  }
  else{
    [self.delegaet onace_text_input_composition_update_notice:markedText];
  }
  m_marked_text = markedText;
}

- (void)unmarkText {
  // 取消标记
  [self.delegaet onace_text_input_composition_end_notice:m_marked_text];
  m_marked_text = [NSMutableString string];
}

- (UITextPosition*)beginningOfDocument {
  return [AceTextPosition new:0];
}

- (UITextPosition*)endOfDocument {
  return [AceTextPosition new:m_marked_text.length];
}

- (UITextRange*)textRangeFromPosition:(UITextPosition*)fromPosition
                           toPosition:(UITextPosition*)toPosition {
  return [AceTextRange new:(AceTextPosition*)fromPosition end:(AceTextPosition*)toPosition];
}

- (UITextPosition*)positionFromPosition:(UITextPosition*)position
                                 offset:(NSInteger)offset {
  AceTextPosition* p = (AceTextPosition*)position;
  return [AceTextPosition new:p.value + offset];
}

- (UITextPosition*)positionFromPosition:(UITextPosition*)position
                            inDirection:(UITextLayoutDirection)direction
                                 offset:(NSInteger)offset {
  return [AceTextPosition new];
}

- (NSComparisonResult)comparePosition:(UITextPosition*)position
                           toPosition:(UITextPosition*)other {
  return self.can_delete ? NSOrderedAscending : NSOrderedSame;
}

- (NSInteger)offsetFromPosition:(UITextPosition *)from
                     toPosition:(UITextPosition *)toPosition {
  NSUInteger a = [(AceTextPosition*)from value];
  NSUInteger b = [(AceTextPosition*)toPosition value];
  NSInteger result = b - a;
  return result;
}

- (id<UITextInputTokenizer>)tokenizer {
  if (m_tokenizer == nil) {
    m_tokenizer = [[UITextInputStringTokenizer alloc] initWithTextInput:self];
  }
  return m_tokenizer;
}

- (UITextPosition*)positionWithinRange:(UITextRange *)range
                   farthestInDirection:(UITextLayoutDirection)direction {
  return nil;
}

- (UITextRange*)characterRangeByExtendingPosition:(UITextPosition *)position
                                      inDirection:(UITextLayoutDirection)direction; {
  return nil;
}

- (UITextWritingDirection)baseWritingDirectionForPosition:(UITextPosition *)position
                                              inDirection:(UITextStorageDirection)direction; {
  return UITextWritingDirectionLeftToRight;
}

- (void)setBaseWritingDirection:(UITextWritingDirection)writingDirection
                       forRange:(UITextRange*)range {
  
}

- (CGRect)firstRectForRange:(UITextRange*)range {
  return CGRectZero;
}

- (CGRect)caretRectForPosition:(UITextPosition*)position {
  return CGRectZero;
}

- (NSArray*)selectionRectsForRange:(UITextRange*)range{
  return nil;
}

- (UITextPosition*)closestPositionToPoint:(CGPoint)point {
  return [AceTextPosition new:0];
}

- (UITextPosition*)closestPositionToPoint:(CGPoint)point withinRange:(UITextRange*)range {
  return range.start;
}

- (UITextRange*)characterRangeAtPoint:(CGPoint)point {
  return [AceTextRange new];
}

@end
