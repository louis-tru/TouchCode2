//
//  CYRKeyboardButtonView.m
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

#import "CYRKeyboardButtonView.h"
#import "CYRKeyboardButton.h"
#import "TurtleBezierPath.h"

/* Detect which user idiom we're running on */
#define IPAD (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)

@interface CYRKeyboardButtonView ()

@property (nonatomic, weak) CYRKeyboardButton *button;
@property (nonatomic, assign) CYRKeyboardButtonViewType type;
@property (nonatomic, assign) CYRKeyboardButtonPosition expandedPosition;
@property (nonatomic, strong) NSMutableArray *inputOptionRects;
@property (nonatomic, assign) NSInteger selectedInputIndex;

@end

@implementation CYRKeyboardButtonView

#pragma mark - UIView

- (id)initWithKeyboardButton:(CYRKeyboardButton *)button
                        type:(CYRKeyboardButtonViewType)type {
  CGRect frame = [UIScreen mainScreen].bounds;
  
  self = [super initWithFrame:frame];
  
  if (self) {
    _button = button;
    _type = type;
    _selectedInputIndex = 0;

    self.backgroundColor = [UIColor clearColor];
    self.userInteractionEnabled = NO;
    
    if (button.position != CYRKeyboardButtonPositionInner) {
      _expandedPosition = button.position;
    } else {
      
      // Determine the position
      CGFloat leftPadding = CGRectGetMinX(button.frame);
      CGFloat rightPadding =
        CGRectGetMaxX(button.superview.frame) - CGRectGetMaxX(button.frame);
      
      if (IPAD) {
        _expandedPosition = CYRKeyboardButtonPositionCount;
      } else {
        if (leftPadding > rightPadding) {
          _expandedPosition = CYRKeyboardButtonPositionLeft;
        } else {
          _expandedPosition = CYRKeyboardButtonPositionRight;
        }
      }
    }
  }
  
  return self;
}

- (void)didMoveToSuperview {
  if (_type == CYRKeyboardButtonViewTypeExpanded) {
    [self determineExpandedKeyGeometries];
  }
}

#pragma mark - Public

- (void)updateSelectedInputIndexForPoint:(CGPoint)point {
  __block NSInteger selectedInputIndex = NSNotFound;
  
  CGRect testRect = CGRectMake(point.x, point.y, 0, 0);
  
  CGPoint location = [self convertRect:testRect fromView:self.button.superview].origin;
  
  [self.inputOptionRects enumerateObjectsUsingBlock:^(NSValue *rectValue,
                                                      NSUInteger idx,
                                                      BOOL *stop) {
    CGRect keyRect = [rectValue CGRectValue];
    CGRect infiniteKeyRect = CGRectMake(CGRectGetMinX(keyRect), 0,
                                        CGRectGetWidth(keyRect), NSIntegerMax);
    infiniteKeyRect = CGRectInset(infiniteKeyRect, -3, 0);
    
    if (CGRectContainsPoint(infiniteKeyRect, location)) {
      selectedInputIndex = idx;
      *stop = YES;
    }
  }];
  
  if (self.selectedInputIndex != selectedInputIndex) {
    self.selectedInputIndex = selectedInputIndex;
    [self setNeedsDisplay];
  }
}

#pragma mark - Drawing

- (void)drawRect:(CGRect)rect {
  switch (_type) {
    case CYRKeyboardButtonViewTypeInput:
      [self drawInputView:rect];
      break;
      
    case CYRKeyboardButtonViewTypeExpanded:
      [self drawExpandedInputView:rect];
      break;
      
    default:
      break;
  }
}

- (void)drawInputView:(CGRect)rect {
  // Generate the overlay
  UIBezierPath *bezierPath = [self inputViewPath];
  NSString *inputString = self.button.input;
  
  // Position the overlay
  CGRect keyRect = [self convertRect:self.button.frame fromView:self.button.superview];
  
  CGContextRef context = UIGraphicsGetCurrentContext();
  
  // Overlay path & shadow
  {
  //// Shadow Declarations
  UIColor* shadow = [[UIColor blackColor] colorWithAlphaComponent: 0.5];
  CGSize shadowOffset = CGSizeMake(0, 0.5);
  CGFloat shadowBlurRadius = 2;
  
  //// Rounded Rectangle Drawing
  CGContextSaveGState(context);
  CGContextSetShadowWithColor(context, shadowOffset, shadowBlurRadius, shadow.CGColor);
  [self.button.keyColor setFill];
  [bezierPath fill];
  CGContextRestoreGState(context);
  }
  
  // Draw the key shadow sliver
  {
  //// Color Declarations
  UIColor *color = self.button.keyColor;
  
  //// Shadow Declarations
  UIColor *shadow = self.button.keyShadowColor;
  CGSize shadowOffset = CGSizeMake(0.1, 1.1);
  CGFloat shadowBlurRadius = 0;
  
  //// Rounded Rectangle Drawing
  UIBezierPath *roundedRectanglePath =
  [UIBezierPath bezierPathWithRoundedRect:CGRectMake(keyRect.origin.x, keyRect.origin.y, keyRect.size.width, keyRect.size.height - 1) cornerRadius:4];
  CGContextSaveGState(context);
  CGContextSetShadowWithColor(context, shadowOffset, shadowBlurRadius, shadow.CGColor);
  [color setFill];
  [roundedRectanglePath fill];
  
  CGContextRestoreGState(context);
  }
  
  // Text drawing
  {
  UIColor *stringColor = self.button.keyTextColor;
  
  CGRect stringRect = bezierPath.bounds;
  
  NSMutableParagraphStyle *p = [NSMutableParagraphStyle new];
  p.alignment = NSTextAlignmentCenter;
  
  NSAttributedString *attributedString = [[NSAttributedString alloc]
                                          initWithString:inputString
                                          attributes:
                                          @{NSFontAttributeName : [UIFont fontWithName:@"HelveticaNeue-Light" size:44], NSForegroundColorAttributeName : stringColor, NSParagraphStyleAttributeName : p}];
  [attributedString drawInRect:stringRect];
  }
}

- (void)drawExpandedInputView:(CGRect)rect {
  // Generate the overlay
  UIBezierPath *bezierPath = [self expandedInputViewPath];
  
  // Position the overlay
  CGRect keyRect = [self convertRect:self.button.frame fromView:self.button.superview];
  
  CGContextRef context = UIGraphicsGetCurrentContext();
  
  // Overlay path & shadow
  {
    CGFloat shadowAlpha = 0;
    CGSize shadowOffset;
    
    switch ([UIDevice currentDevice].userInterfaceIdiom) {
      case UIUserInterfaceIdiomPhone:
        shadowAlpha = 0.5;
        shadowOffset = CGSizeMake(0, 0.5);
        break;
        
      case UIUserInterfaceIdiomPad:
        shadowAlpha = 0.25;
        shadowOffset = CGSizeZero;
        break;
        
      default:
        break;
    }
    
    //// Shadow Declarations
    UIColor* shadow = [[UIColor blackColor] colorWithAlphaComponent: shadowAlpha];
    CGFloat shadowBlurRadius = 2;
    
    //// Rounded Rectangle Drawing
    CGContextSaveGState(context);
    CGContextSetShadowWithColor(context, shadowOffset, shadowBlurRadius, shadow.CGColor);
    [self.button.keyColor setFill];
    [bezierPath fill];
    CGContextRestoreGState(context);
  }
  
  // Draw the key shadow sliver
  if (self.button.style == CYRKeyboardButtonStylePhone) {
    UIColor *color = self.button.keyColor;
    
    //// Shadow Declarations
    UIColor *shadow = self.button.keyShadowColor;
    CGSize shadowOffset = CGSizeMake(0.1, 1.1);
    CGFloat shadowBlurRadius = 0;
    
    //// Rounded Rectangle Drawing
    UIBezierPath *roundedRectanglePath =
    [UIBezierPath bezierPathWithRoundedRect:CGRectMake(keyRect.origin.x, keyRect.origin.y, keyRect.size.width, keyRect.size.height - 1) cornerRadius:4];
    CGContextSaveGState(context);
    CGContextSetShadowWithColor(context, shadowOffset, shadowBlurRadius, shadow.CGColor);
    [color setFill];
    [roundedRectanglePath fill];
    
    CGContextRestoreGState(context);
  }
  
  [self drawExpandedInputViewOptions];
}

- (void)drawExpandedInputViewOptions {
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSetShadowWithColor(context, CGSizeZero, 0, [[UIColor clearColor] CGColor]);
  CGContextSaveGState(context);
  
  NSArray *inputOptions = self.button.inputOptions;
  
  [inputOptions enumerateObjectsUsingBlock:^(NSString *optionString,
                                             NSUInteger idx,
                                             BOOL *stop) {
    CGRect optionRect = [self.inputOptionRects[idx] CGRectValue];
    
    BOOL selected = (idx == self.selectedInputIndex);
    
    if (selected) {
      // Draw selection background
      UIBezierPath *roundedRectanglePath = [UIBezierPath bezierPathWithRoundedRect:optionRect
                                                                      cornerRadius:4];
      
      [self.tintColor setFill];
      [roundedRectanglePath fill];
    }
    
    // Draw the text
    UIColor *stringColor = (selected ? [UIColor whiteColor] : self.button.keyTextColor);
    
    CGSize stringSize = [optionString sizeWithAttributes:
                         @{
                           NSFontAttributeName : self.button.inputOptionsFont
                          }
                         ];
    
    CGRect stringRect = CGRectMake(CGRectGetMidX(optionRect) - stringSize.width / 2,
                                   CGRectGetMidY(optionRect) - stringSize.height / 2,
                                   stringSize.width,
                                   stringSize.height);
    
    NSMutableParagraphStyle *p = [NSMutableParagraphStyle new];
    p.alignment = NSTextAlignmentCenter;
    
    NSAttributedString *attributedString = [[NSAttributedString alloc]
                                            initWithString:optionString
                                            attributes:
                                            @{
                                              NSFontAttributeName: self.button.inputOptionsFont,
                                              NSForegroundColorAttributeName: stringColor,
                                              NSParagraphStyleAttributeName: p,
                                            }];
    [attributedString drawInRect:stringRect];
  }];
  
  CGContextRestoreGState(context);
}

#pragma mark - Internal

- (UIBezierPath *)inputViewPath {
  CGRect keyRect = [self convertRect:self.button.frame fromView:self.button.superview];
  
  UIEdgeInsets insets = UIEdgeInsetsMake(7, 13, 7, 13);
  CGFloat upperWidth = CGRectGetWidth(_button.frame) + insets.left + insets.right;
  CGFloat lowerWidth = CGRectGetWidth(_button.frame);
  CGFloat majorRadius = 10.f;
  CGFloat minorRadius = 4.f;
  
  TurtleBezierPath *path = [TurtleBezierPath new];
  [path home];
  path.lineWidth = 0;
  path.lineCapStyle = kCGLineCapRound;
  
  switch (self.button.position) {
    case CYRKeyboardButtonPositionInner: {
      [path rightArc:majorRadius turn:90]; // #1
      [path forward:upperWidth - 2 * majorRadius]; // #2 top
      [path rightArc:majorRadius turn:90]; // #3
      [path forward:CGRectGetHeight(keyRect) - 2 * majorRadius + insets.top + insets.bottom]; // #4 right big
      [path rightArc:majorRadius turn:48]; // #5
      [path forward:8.5f];
      [path leftArc:majorRadius turn:48]; // #6
      [path forward:CGRectGetHeight(keyRect) - 8.5f + 1];
      [path rightArc:minorRadius turn:90];
      [path forward:lowerWidth - 2 * minorRadius]; //  lowerWidth - 2 * minorRadius + 0.5f
      [path rightArc:minorRadius turn:90];
      [path forward:CGRectGetHeight(keyRect) - 2 * minorRadius];
      [path leftArc:majorRadius turn:48];
      [path forward:8.5f];
      [path rightArc:majorRadius turn:48];
      
      CGFloat offsetX = 0, offsetY = 0;
      CGRect pathBoundingBox = path.bounds;
      
      offsetX = CGRectGetMidX(keyRect) - CGRectGetMidX(path.bounds);
      offsetY = CGRectGetMaxY(keyRect) - CGRectGetHeight(pathBoundingBox) + 10;
      
      [path applyTransform:CGAffineTransformMakeTranslation(offsetX, offsetY)];
      break;
    } case CYRKeyboardButtonPositionLeft: {
      [path rightArc:majorRadius turn:90]; // #1
      [path forward:upperWidth - 2 * majorRadius]; // #2 top
      [path rightArc:majorRadius turn:90]; // #3
      [path forward:CGRectGetHeight(keyRect) - 2 * majorRadius + insets.top + insets.bottom]; // #4 right big
      [path rightArc:majorRadius turn:45]; // #5
      [path forward:28]; // 6
      [path leftArc:majorRadius turn:45]; // #7
      [path forward:CGRectGetHeight(keyRect) - 26 + (insets.left + insets.right) / 4]; // #8
      [path rightArc:minorRadius turn:90]; // 9
      [path forward:path.currentPoint.x - minorRadius]; // 10
      [path rightArc:minorRadius turn:90]; // 11
      
      
      CGFloat offsetX = 0, offsetY = 0;
      CGRect pathBoundingBox = path.bounds;
      
      offsetX = CGRectGetMaxX(keyRect) - CGRectGetWidth(path.bounds);
      offsetY = CGRectGetMaxY(keyRect) - CGRectGetHeight(pathBoundingBox) - CGRectGetMinY(path.bounds);
      
      [path applyTransform:CGAffineTransformTranslate(CGAffineTransformMakeScale(-1, 1), -offsetX - CGRectGetWidth(path.bounds), offsetY)];
      break;
    } case CYRKeyboardButtonPositionRight: {
      [path rightArc:majorRadius turn:90]; // #1
      [path forward:upperWidth - 2 * majorRadius]; // #2 top
      [path rightArc:majorRadius turn:90]; // #3
      [path forward:CGRectGetHeight(keyRect) - 2 * majorRadius + insets.top + insets.bottom]; // #4 right big
      [path rightArc:majorRadius turn:45]; // #5
      [path forward:28]; // 6
      [path leftArc:majorRadius turn:45]; // #7
      [path forward:CGRectGetHeight(keyRect) - 26 + (insets.left + insets.right) / 4]; // #8
      [path rightArc:minorRadius turn:90]; // 9
      [path forward:path.currentPoint.x - minorRadius]; // 10
      [path rightArc:minorRadius turn:90]; // 11
      
      CGFloat offsetX = 0, offsetY = 0;
      CGRect pathBoundingBox = path.bounds;
      
      offsetX = CGRectGetMinX(keyRect);
      offsetY = CGRectGetMaxY(keyRect) - CGRectGetHeight(pathBoundingBox) - CGRectGetMinY(path.bounds);
      
      [path applyTransform:CGAffineTransformMakeTranslation(offsetX, offsetY)];
      break;
    }
    default: break;
  }
  
  return path;
}

- (UIBezierPath *)expandedInputViewPath {
  CGRect keyRect = [self convertRect:self.button.frame fromView:self.button.superview];
  
  CGFloat lowerWidth = CGRectGetWidth(_button.frame);
  CGFloat majorRadius = 10.f;
  CGFloat minorRadius = 4.f;
  
  TurtleBezierPath *path = [TurtleBezierPath new];
  [path home];
  path.lineWidth = 0;
  path.lineCapStyle = kCGLineCapRound;
  
  CGFloat offsetX = 0, offsetY = 0;
  
  if (self.button.inputOptions.count == 1 &&
      self.button.style == CYRKeyboardButtonStylePhone) {
    
    UIEdgeInsets insets = UIEdgeInsetsMake(7, 13, 7, 13);
    CGFloat upperWidth = CGRectGetWidth(_button.frame) + insets.left + insets.right;
    CGFloat lowerWidth = CGRectGetWidth(_button.frame);
  
    [path rightArc:majorRadius turn:90]; // #1
    [path forward:upperWidth - 2 * majorRadius]; // #2 top
    [path rightArc:majorRadius turn:90]; // #3
    [path forward:CGRectGetHeight(keyRect) - 2 * majorRadius + insets.top + insets.bottom]; // #4 right big
    [path rightArc:majorRadius turn:48]; // #5
    [path forward:8.5f];
    [path leftArc:majorRadius turn:48]; // #6
    [path forward:CGRectGetHeight(keyRect) - 8.5f + 1];
    [path rightArc:minorRadius turn:90];
    [path forward:lowerWidth - 2 * minorRadius]; //  lowerWidth - 2 * minorRadius + 0.5f
    [path rightArc:minorRadius turn:90];
    [path forward:CGRectGetHeight(keyRect) - 2 * minorRadius];
    [path leftArc:majorRadius turn:48];
    [path forward:8.5f];
    [path rightArc:majorRadius turn:48];
    
    CGFloat offsetX = 0, offsetY = 0;
    CGRect pathBoundingBox = path.bounds;
    
    offsetX = CGRectGetMidX(keyRect) - CGRectGetMidX(path.bounds);
    offsetY = CGRectGetMaxY(keyRect) - CGRectGetHeight(pathBoundingBox) + 10;
    
    [path applyTransform:CGAffineTransformMakeTranslation(offsetX, offsetY)];
    return path;
  }
  
  UIEdgeInsets insets = UIEdgeInsetsMake(7, 13, 7, 13);
  CGFloat margin = 7.f;
  CGFloat upperWidth = insets.left + insets.right +
    self.button.inputOptions.count * CGRectGetWidth(keyRect) +
    margin * (self.button.inputOptions.count - 1) - margin / 2;
  
  // iPhone
  if (self.button.style == CYRKeyboardButtonStylePhone) {
    if (_expandedPosition == CYRKeyboardButtonPositionRight) {
      [path rightArc:majorRadius turn:90]; // #1
      [path forward:upperWidth - 2 * majorRadius]; // #2 top
      [path rightArc:majorRadius turn:90]; // #3
      [path forward:CGRectGetHeight(keyRect) - 2 * majorRadius + insets.top + insets.bottom - 3]; // #4 right big
      [path rightArc:majorRadius turn:90]; // #5
      [path forward:path.currentPoint.x - (CGRectGetWidth(keyRect) + 2 * majorRadius + 3)];
      [path leftArc:majorRadius turn:90]; // #6
      [path forward:CGRectGetHeight(keyRect) - minorRadius];
      [path rightArc:minorRadius turn:90];
      [path forward:lowerWidth - 2 * minorRadius]; //  lowerWidth - 2 * minorRadius + 0.5f
      [path rightArc:minorRadius turn:90];
      [path forward:CGRectGetHeight(keyRect) - 2 * minorRadius];
      [path leftArc:majorRadius turn:48];
      [path forward:8.5f];
      [path rightArc:majorRadius turn:48];
      
      offsetX = CGRectGetMaxX(keyRect) - CGRectGetWidth(keyRect) - insets.left;
      offsetY = CGRectGetMaxY(keyRect) - CGRectGetHeight(path.bounds) + 10;
      
      [path applyTransform:CGAffineTransformMakeTranslation(offsetX, offsetY)];
    } else {
      [path rightArc:majorRadius turn:90]; // #1
      [path forward:upperWidth - 2 * majorRadius]; // #2 top
      [path rightArc:majorRadius turn:90]; // #3
      [path forward:CGRectGetHeight(keyRect) - 2 * majorRadius + insets.top + insets.bottom - 3]; // #4 right big
      
      [path rightArc:majorRadius turn:48];
      [path forward:8.5f];
      [path leftArc:majorRadius turn:48];
      
      [path forward:CGRectGetHeight(keyRect) - minorRadius];
      [path rightArc:minorRadius turn:90];
      [path forward:lowerWidth - 2 * minorRadius]; //  lowerWidth - 2 * minorRadius + 0.5f
      [path rightArc:minorRadius turn:90];
      [path forward:CGRectGetHeight(keyRect) - 2 * minorRadius];
      
      [path leftArc:majorRadius turn:90]; // #5
      [path forward:path.currentPoint.x - majorRadius];
      [path rightArc:majorRadius turn:90]; // #6
      
      offsetX = CGRectGetMaxX(keyRect) - CGRectGetWidth(path.bounds) + insets.left;
      offsetY = CGRectGetMaxY(keyRect) - CGRectGetHeight(path.bounds) + 10;
      
      [path applyTransform:CGAffineTransformMakeTranslation(offsetX, offsetY)];
    }
  } else {
    // IPAD
    NSUInteger opt_count = self.button.inputOptions.count;
    CGRect firstRect = [self.inputOptionRects[0] CGRectValue];
    CGRect rect = CGRectMake(0, 0,
                             CGRectGetWidth(firstRect) * opt_count + 12,
                             CGRectGetHeight(firstRect) + 12);
    path = (id)[UIBezierPath bezierPathWithRoundedRect:rect cornerRadius:6];
    offsetX = CGRectGetMinX(firstRect) - 6;
    offsetY = CGRectGetMinY(firstRect) - 6;
    [path applyTransform:CGAffineTransformMakeTranslation(offsetX, offsetY)];
  }
  return path;
}

- (void)determineExpandedKeyGeometries {
  
  CGRect key_rect =
    [self convertRect:self.button.frame fromView:self.button.superview];
  
  __block NSMutableArray *inputOptionRects =
    [NSMutableArray arrayWithCapacity:self.button.inputOptions.count];
  
  NSUInteger opt_count = self.button.inputOptions.count;
  CGFloat max_x = CGRectGetWidth(self.button.superview.frame);
  CGFloat offset = 0;
  CGFloat spacing = 0;
  
  __block CGRect option_rect = CGRectZero;
  
  switch (self.button.style) {
    case CYRKeyboardButtonStylePhone:
      offset = CGRectGetWidth(key_rect);
      spacing = 6;
      option_rect = CGRectOffset(CGRectInset(key_rect, 0, 0.5), 0,
                                -(CGRectGetHeight(key_rect) + 15));
      break;
      
    case CYRKeyboardButtonStyleTablet:
      spacing = 0;
      option_rect = CGRectInset(key_rect, 6, 6);
      offset = CGRectGetWidth(option_rect);
      
      self.selectedInputIndex = floor(opt_count / 2.0);
//      self.selectedInputIndex = ceil(opt_count / 2.0) - 1;
      
      option_rect = CGRectOffset(option_rect,
                                 self.selectedInputIndex * -offset,
                                -(CGRectGetHeight(key_rect) + 3));
      
      if ((CGRectGetMinX(option_rect) + opt_count * offset) > max_x) {
        option_rect = CGRectOffset(CGRectInset(key_rect, 6, 6),
                                   opt_count * -offset + offset,
                                   -(CGRectGetHeight(key_rect) + 3));
        self.selectedInputIndex = opt_count - 1;
      } else if(CGRectGetMinX(option_rect) < 0.0) {
        option_rect = CGRectOffset(CGRectInset(key_rect, 6, 6),
                                   0,
                                   -(CGRectGetHeight(key_rect) + 3));
        self.selectedInputIndex = 0;
      }
      
      break;
    default: break;
  }
  
  [self.button.inputOptions enumerateObjectsUsingBlock:^(NSString *option,
                                                         NSUInteger idx,
                                                         BOOL *stop) {
    [inputOptionRects addObject:[NSValue valueWithCGRect:option_rect]];
    
    if (self.button.style == CYRKeyboardButtonStyleTablet) {
      option_rect = CGRectOffset(option_rect, +(offset + spacing), 0);
    } else {
      // Offset the option rect
      if (_expandedPosition == CYRKeyboardButtonPositionRight) {
        option_rect = CGRectOffset(option_rect, +(offset + spacing), 0);
      } else if(_expandedPosition == CYRKeyboardButtonPositionLeft) {
        option_rect = CGRectOffset(option_rect, -(offset + spacing), 0);
      }
    }
  }];
  
  self.inputOptionRects = inputOptionRects;
}

@end
