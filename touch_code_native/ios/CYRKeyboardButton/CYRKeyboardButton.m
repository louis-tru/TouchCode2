//
//  CYRKeyboardButton.m
//
//  Created by Illya Busigin on 7/19/14.
//  Copyright (c) 2014 Cyrillian, Inc.
//  Portions Copyright (c) 2013 Nigel Timothy Barber (TurtleBezierPath)
//
//  Distributed under MIT license.
//  Get the latest version from here:
//
//  https://github.com/illyabusigin/CYRKeyboardButton
//
// The MIT License (MIT)
//
// Copyright (c) 2014 Cyrillian, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "CYRKeyboardButton.h"
#import "CYRKeyboardButtonView.h"

NSString *const CYRKeyboardButtonPressedNotification =
  @"CYRKeyboardButtonPressedNotification";
NSString *const CYRKeyboardButtonDidShowExpandedInputNotification =
  @"CYRKeyboardButtonDidShowExpandedInputNotification";
NSString *const CYRKeyboardButtonDidHideExpandedInputNotification =
  @"CYRKeyboardButtonDidHideExpandedInputNotification";
NSString *const CYRKeyboardButtonKeyPressedKey =
  @"CYRKeyboardButtonKeyPressedKey";

@interface CYRKeyboardButton () <UIGestureRecognizerDelegate> {
  @private
  NSString* m_input;
  NSArray* m_inputOptions;
  NSMutableDictionary* m_values;
}

@property (nonatomic, strong) UILabel *inputLabel;
@property (nonatomic, strong) CYRKeyboardButtonView *buttonView;
@property (nonatomic, strong) CYRKeyboardButtonView *expandedButtonView;
@property (nonatomic, assign) CYRKeyboardButtonPosition position;

// Input options state
@property (nonatomic, strong) UILongPressGestureRecognizer *optionsViewRecognizer;
@property (nonatomic, strong) UIPanGestureRecognizer *panGestureRecognizer;

// Internal style
@property (nonatomic, assign) CGFloat keyCornerRadius UI_APPEARANCE_SELECTOR;

@end

@implementation CYRKeyboardButton

#pragma mark - UIView

- (id)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    [self common_init];
  }
  return self;
}

- (id)initWithCoder:(NSCoder*)aDecoder {
  self = [super initWithCoder:aDecoder];
  if (self) {
    [self common_init];
  }
  return self;
}

- (void)common_init {
  m_input = nil;
  m_inputOptions = nil;
  
  switch ([UIDevice currentDevice].userInterfaceIdiom) {
    case UIUserInterfaceIdiomPhone:
      _style = CYRKeyboardButtonStylePhone;
      break;
    case UIUserInterfaceIdiomPad:
      _style = CYRKeyboardButtonStyleTablet;
      break;
      
    default:
      break;
  }
  
  // Default appearance
  _font = [UIFont systemFontOfSize:22.f];
  _inputOptionsFont = [UIFont systemFontOfSize:22.f];
  _keyColor = [UIColor whiteColor];
  _keyTextColor = [UIColor blackColor];
  _keyShadowColor = [UIColor colorWithRed:136 / 255.f green:138 / 255.f blue:142 / 255.f alpha:1];
  _keyHighlightedColor = [UIColor colorWithRed:213/255.f green:214/255.f blue:216/255.f alpha:1];
  
  // Styling
  self.backgroundColor = [UIColor clearColor];
  self.clipsToBounds = NO;
  self.layer.masksToBounds = NO;
  self.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
  
  // State handling
  [self addTarget:self
           action:@selector(handleTouchDown)
 forControlEvents:UIControlEventTouchDown];
  
  [self addTarget:self
           action:@selector(handleTouchUpInside)
 forControlEvents:UIControlEventTouchUpInside];
  
  // Input label
  
  UILabel* inputLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, -2, 0, 0)];
  inputLabel.autoresizingMask =
  UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  inputLabel.textAlignment = NSTextAlignmentCenter;
  inputLabel.backgroundColor = [UIColor clearColor];
  inputLabel.userInteractionEnabled = NO;
  inputLabel.textColor = _keyTextColor;
  inputLabel.font = _font;
  
  [self addSubview:inputLabel];
  _inputLabel = inputLabel;
  
  [self updateDisplayStyle];
}

- (void)didMoveToSuperview {
  [self updateButtonPosition];
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [self setNeedsDisplay];
  [self updateButtonPosition];
}

#pragma mark - UIGestureRecognizerDelegate

- (BOOL)                          gestureRecognizer:(UIGestureRecognizer*)gestureRecognizer
 shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer*)otherGestureRecognizer {
  // Only allow simulateous recognition with our internal recognizers
  return (gestureRecognizer == _panGestureRecognizer ||
          gestureRecognizer == _optionsViewRecognizer) &&
  (otherGestureRecognizer == _panGestureRecognizer ||
   otherGestureRecognizer == _optionsViewRecognizer);
}

#pragma mark - Overrides

- (NSString*)description {
  NSString* description =
  [NSString stringWithFormat:
   @"<%@ %p>; frame = %@; input = %@; inputOptions = %@",
   NSStringFromClass([self class]),
   self,
   NSStringFromCGRect(self.frame),
   m_input,
   m_inputOptions];
  return description;
}

- (NSString*) input {
  return m_input;
}

- (NSArray*) inputOptions {
  return m_inputOptions;
}

- (void)set_input:(NSString*)input {
//  [self willChangeValueForKey:NSStringFromSelector(@selector(input))];
  m_input = input;
//  [self didChangeValueForKey:NSStringFromSelector(@selector(input))];
  _inputLabel.text = m_input;
}

- (void)set_input_options:(NSArray*)inputOptions {
//  [self willChangeValueForKey:NSStringFromSelector(@selector(inputOptions))];
  m_inputOptions = inputOptions;
//  [self didChangeValueForKey:NSStringFromSelector(@selector(inputOptions))];
  if (m_inputOptions.count > 0) {
    [self setupInputOptionsConfiguration];
  } else {
    [self tearDownInputOptionsConfiguration];
  }
}

- (void)setStyle:(CYRKeyboardButtonStyle)style {
  [self willChangeValueForKey:NSStringFromSelector(@selector(style))];
  _style = style;
  [self didChangeValueForKey:NSStringFromSelector(@selector(style))];
  
  [self updateDisplayStyle];
}

- (void)setKeyTextColor:(UIColor*)keyTextColor {
  if (_keyTextColor != keyTextColor) {
    [self willChangeValueForKey:NSStringFromSelector(@selector(keyTextColor))];
    _keyTextColor = keyTextColor;
    [self didChangeValueForKey:NSStringFromSelector(@selector(keyTextColor))];
    
    _inputLabel.textColor = keyTextColor;
  }
}

- (void)setFont:(UIFont *)font {
  if (_font != font) {
    [self willChangeValueForKey:NSStringFromSelector(@selector(font))];
    _font = font;
    [self didChangeValueForKey:NSStringFromSelector(@selector(font))];
    _inputLabel.font = font;
  }
}

- (void)setTextInput:(id<UITextInput>)textInput {
  NSAssert([textInput conformsToProtocol:@protocol(UITextInput)],
           @"<CYRKeyboardButton> The text input object must conform to the UITextInput protocol!");
  
  [self willChangeValueForKey:NSStringFromSelector(@selector(textInput))];
  _textInput = textInput;
  [self didChangeValueForKey:NSStringFromSelector(@selector(textInput))];
}

//
- (void) set_titles:(NSArray*)titles{
  [self set_titles:titles values:titles];
}

//
- (void) set_titles:(NSArray*)titles values:(NSArray*)values {
  
  if (!titles) {
    [self set_input:nil];
    [self set_input_options:nil];
    m_values = nil;
    return;
  }
  
  NSMutableArray* input_options = [NSMutableArray new];
  m_values = [NSMutableDictionary new];
  
  [titles enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    if (idx > 0) {
      [input_options addObject:obj];
    } else {
      [self set_input:obj];
    }
    m_values[obj] = values[idx];
  }];
  if (input_options.count) {
    [self set_input_options:input_options];
  }
}

#pragma mark - Internal - UI

- (void)showInputView {
  if (_style == CYRKeyboardButtonStylePhone) {
    [self hideInputView];
    
    self.buttonView =
    [[CYRKeyboardButtonView alloc] initWithKeyboardButton:self
                                                     type:CYRKeyboardButtonViewTypeInput];
    [self.window addSubview:self.buttonView];
  } else {
    [self setNeedsDisplay];
  }
}

- (void)showExpandedInputView:(UILongPressGestureRecognizer *)recognizer {
  if (recognizer.state == UIGestureRecognizerStateBegan) {
    if (self.expandedButtonView == nil) {
      CYRKeyboardButtonView *expandedButtonView =
      [[CYRKeyboardButtonView alloc] initWithKeyboardButton:self
                                                       type:CYRKeyboardButtonViewTypeExpanded];
      
      if (self.window.rootViewController.view) {
        [self.window.rootViewController.view addSubview:expandedButtonView];
      } else {
        [self.window addSubview:expandedButtonView];
      }
      self.expandedButtonView = expandedButtonView;
      
      [[NSNotificationCenter defaultCenter]
       postNotificationName:CYRKeyboardButtonDidShowExpandedInputNotification object:self];
      
      [self hideInputView];
    }
  } else if (recognizer.state == UIGestureRecognizerStateCancelled ||
             recognizer.state == UIGestureRecognizerStateEnded) {
    if (self.panGestureRecognizer.state != UIGestureRecognizerStateRecognized) {
      [self handleTouchUpInside];
    }
  }
}

- (void)hideInputView {
  [self.buttonView removeFromSuperview];
  self.buttonView = nil;
  
  [self setNeedsDisplay];
}

- (void)hideExpandedInputView {
  if (self.expandedButtonView.type == CYRKeyboardButtonViewTypeExpanded) {
    [[NSNotificationCenter defaultCenter] postNotificationName:CYRKeyboardButtonDidHideExpandedInputNotification object:self];
  }
  
  [self.expandedButtonView removeFromSuperview];
  self.expandedButtonView = nil;
}

- (void)updateDisplayStyle {
  switch (_style) {
    case CYRKeyboardButtonStylePhone:
      _keyCornerRadius = 4.f;
      break;
      
    case CYRKeyboardButtonStyleTablet:
      _keyCornerRadius = 6.f;
      break;
      
    default:
      break;
  }
  
  [self setNeedsDisplay];
}

#pragma mark - Internal - Text Handling

- (void)insertText:(NSString*)text {
  
  id value = m_values[text];
  
  if ([value isKindOfClass:NSString.class]) {
    text = value;
  } else {
    typedef void (^Callback)(CYRKeyboardButton* btn);
    Callback cb = value;
    cb(self);
    return;
  }
  
  BOOL shouldInsertText = YES;
  
  if ([self.textInput isKindOfClass:[UITextView class]]) {
    // Call UITextViewDelegate methods if necessary
    UITextView *textView = (UITextView *)self.textInput;
    NSRange selectedRange = textView.selectedRange;
    
    if ([textView.delegate respondsToSelector:@selector(textView:shouldChangeTextInRange:replacementText:)]) {
      shouldInsertText = [textView.delegate textView:textView shouldChangeTextInRange:selectedRange replacementText:text];
    }
  } else if ([self.textInput isKindOfClass:[UITextField class]]) {
    // Call UITextFieldDelgate methods if necessary
    UITextField *textField = (UITextField *)self.textInput;
    NSRange selectedRange = [self textInputSelectedRange];
    
    if ([textField.delegate respondsToSelector:@selector(textField:shouldChangeCharactersInRange:replacementString:)]) {
      shouldInsertText = [textField.delegate textField:textField shouldChangeCharactersInRange:selectedRange replacementString:text];
    }
  }
  
  if (shouldInsertText == YES) {
    [self.textInput insertText:text];
    
    [[NSNotificationCenter defaultCenter] postNotificationName:CYRKeyboardButtonPressedNotification object:self
                                                      userInfo:@{CYRKeyboardButtonKeyPressedKey : text}];
  }
}

- (NSRange)textInputSelectedRange {
  UITextPosition *beginning = self.textInput.beginningOfDocument;
  
  UITextRange *selectedRange = self.textInput.selectedTextRange;
  UITextPosition *selectionStart = selectedRange.start;
  UITextPosition *selectionEnd = selectedRange.end;
  
  const NSInteger location = [self.textInput offsetFromPosition:beginning toPosition:selectionStart];
  const NSInteger length = [self.textInput offsetFromPosition:selectionStart toPosition:selectionEnd];
  
  return NSMakeRange(location, length);
}

#pragma mark - Internal - Configuration

- (void)updateButtonPosition {
  // Determine the button sposition state based on the superview padding
  CGFloat leftPadding = CGRectGetMinX(self.frame);
  CGFloat rightPadding = CGRectGetMaxX(self.superview.frame) - CGRectGetMaxX(self.frame);
  CGFloat minimumClearance = CGRectGetWidth(self.frame) / 2 + 8;
  
  if (leftPadding >= minimumClearance && rightPadding >= minimumClearance) {
    self.position = CYRKeyboardButtonPositionInner;
  } else if (leftPadding > rightPadding) {
    self.position = CYRKeyboardButtonPositionLeft;
  } else {
    self.position = CYRKeyboardButtonPositionRight;
  }
}

- (void)setupInputOptionsConfiguration {
  [self tearDownInputOptionsConfiguration];
  
  if (m_inputOptions.count > 0) {
    UILongPressGestureRecognizer *longPressGestureRecognizer =
    [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(showExpandedInputView:)];
    longPressGestureRecognizer.minimumPressDuration = 0.3;
    longPressGestureRecognizer.delegate = self;
    
    [self addGestureRecognizer:longPressGestureRecognizer];
    self.optionsViewRecognizer = longPressGestureRecognizer;
    
    UIPanGestureRecognizer *panGestureRecognizer = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(_handlePanning:)];
    panGestureRecognizer.delegate = self;
    
    [self addGestureRecognizer:panGestureRecognizer];
    self.panGestureRecognizer = panGestureRecognizer;
  }
}

- (void)tearDownInputOptionsConfiguration {
  [self removeGestureRecognizer:self.optionsViewRecognizer];
  [self removeGestureRecognizer:self.panGestureRecognizer];
}

#pragma mark - Touch Actions

- (void)handleTouchDown {
  [[UIDevice currentDevice] playInputClick];
  [self showInputView];
}

- (void)handleTouchUpInside {
  if (self.expandedButtonView &&
      self.expandedButtonView.selectedInputIndex != NSNotFound) {
    NSString* input_option =
    m_inputOptions[self.expandedButtonView.selectedInputIndex];
    [self insertText:input_option];
  } else {
    [self insertText:m_input];
  }
  [self hideInputView];
  [self hideExpandedInputView];
}

- (void)_handlePanning:(UIPanGestureRecognizer *)recognizer {
  
  if (recognizer.state == UIGestureRecognizerStateEnded ||
      recognizer.state == UIGestureRecognizerStateCancelled) {
    
    if (self.expandedButtonView.selectedInputIndex != NSNotFound) {
      NSString* inputOption =
        m_inputOptions[self.expandedButtonView.selectedInputIndex];
      [self insertText:inputOption];
    }
    
    [self hideExpandedInputView];
  } else {
    CGPoint location = [recognizer locationInView:self.superview];
    [self.expandedButtonView updateSelectedInputIndexForPoint:location];
  };
}

#pragma mark - Touch Handling

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  
  [self hideInputView];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  
  [self hideInputView];
}

#pragma mark - Drawing

- (void)drawRect:(CGRect)rect
{
  CGContextRef context = UIGraphicsGetCurrentContext();
  UIColor *color = self.keyColor;
  
  if (_style == CYRKeyboardButtonStyleTablet && self.state == UIControlStateHighlighted) {
    color = self.keyHighlightedColor;
  }
  
  UIColor *shadow = self.keyShadowColor;
  CGSize shadowOffset = CGSizeMake(0.1, 1.1);
  CGFloat shadowBlurRadius = 0;
  
  UIBezierPath *roundedRectanglePath =
  [UIBezierPath bezierPathWithRoundedRect:CGRectMake(0, 0,
                                                     self.frame.size.width,
                                                     self.frame.size.height - 1)
                             cornerRadius:self.keyCornerRadius];
  CGContextSaveGState(context);
  CGContextSetShadowWithColor(context, shadowOffset, shadowBlurRadius, shadow.CGColor);
  [color setFill];
  [roundedRectanglePath fill];
  CGContextRestoreGState(context);
}

@end
