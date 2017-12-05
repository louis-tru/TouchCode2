/**
 * @createTime 2015-04-03
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import "magnifier.h"
#import <QuartzCore/QuartzCore.h>

@implementation Magnifier {
  @private
  CGFloat _topMargin;
  UIImageView* loupeImageView;
}

@synthesize viewToMagnify;
@synthesize touchPoint;
@synthesize scale;

- (id) init {
  
  CGFloat w = 120;    // =imageWidth:126-(outerRadius:3 + 1)*2
  self = [super initWithFrame:CGRectMake(0, 0, w, w)];
  self.layer.borderColor = [UIColor clearColor].CGColor;
  self.layer.cornerRadius = w / 2;
  self.layer.masksToBounds = YES;
  self.layer.zPosition = 10;
  self.opaque = NO;
  self.scale = 1.5f;
  self.layer.borderWidth = 0;
  
  loupeImageView = nil;
  
  float version = [[[UIDevice currentDevice] systemVersion] floatValue];
  
  if (version < 7.0) {
    loupeImageView = [[UIImageView alloc] initWithFrame:
                      CGRectOffset(CGRectInset(self.bounds, -5.0, -5.0), 0, 2)];
    loupeImageView.image = [UIImage imageNamed:@"res/kb-loupe-hi_6"];
  } else {
    loupeImageView = [[UIImageView alloc] initWithFrame:
                      CGRectOffset(CGRectInset(self.bounds, -3.0, -3.0), 0, 2.5)];
    loupeImageView.image = [UIImage imageNamed:@"res/kb-loupe-hi_7"];
  }
  
  loupeImageView.backgroundColor = [UIColor clearColor];
  [self addSubview:loupeImageView];
  
  return self;
}

- (void) setTouchPoint:(CGPoint)pt {
  dispatch_async(dispatch_get_main_queue(), ^{
    touchPoint = pt;
    self.center = [self calc_center];
    
    CGRect rect = CGRectInset(self.viewToMagnify.bounds, 0, _topMargin);
    
    if (touchPoint.x < rect.origin.x) {
      touchPoint.x = rect.origin.x;
    } else if (touchPoint.x > CGRectGetMaxX(rect)) {
      touchPoint.x = CGRectGetMaxX(rect);
    }
    
    if (touchPoint.y < rect.origin.y) {
      touchPoint.y = rect.origin.y;
    } else if(pt.y > CGRectGetMaxY(rect) - _limit_height) {
      touchPoint.y = CGRectGetMaxY(rect) - _limit_height;
    }
    
    [self setNeedsDisplay];
  });
}

- (void) show {
  dispatch_async(dispatch_get_main_queue(), ^{
    self.center = [self calc_center];
    [self.viewToMagnify.superview addSubview:self];
  });
}

- (void) hide {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self removeFromSuperview];
  });
}

- (void) drawRect:(CGRect)rect {
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextTranslateCTM(context, self.frame.size.width / 2, self.frame.size.height / 2 );
  CGContextScaleCTM(context, scale, scale);
  CGContextTranslateCTM(context, -touchPoint.x, -touchPoint.y);
  [self.viewToMagnify drawViewHierarchyInRect:self.viewToMagnify.frame
                           afterScreenUpdates:NO];
//  [self.viewToMagnify.layer renderInContext:context];
}

- (CGPoint) calc_center {
  
  if (_topMargin < 1) {
    UIViewController *controller = (UIViewController *)self.viewToMagnify.nextResponder;
    
    if ([controller isKindOfClass:[UIViewController class]]) {
      UINavigationBar *bar = controller.navigationController.navigationBar;
      CGRect rect = [bar convertRect:bar.bounds toView:self.viewToMagnify];
      _topMargin = CGRectGetMaxY(rect);
    }
    _topMargin++;
  }
  
  CGRect rect = CGRectInset(self.viewToMagnify.bounds, 0, _topMargin);
  CGPoint pt;
  
  pt = CGPointMake(touchPoint.x, touchPoint.y - 60);
  
  if (pt.x < rect.origin.x) {
    pt.x = rect.origin.x;
  } else if (pt.x > CGRectGetMaxX(rect)) {
    pt.x = CGRectGetMaxX(rect);
  }
  
  if (pt.y < rect.origin.y) {
    pt.y = rect.origin.y;
  } else if(pt.y > CGRectGetMaxY(rect) - _limit_height - 60){
    pt.y = CGRectGetMaxY(rect) - _limit_height - 60;
  }
  
  return [self.superview convertPoint:pt fromView:self.viewToMagnify];
}

@end
