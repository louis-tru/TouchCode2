/**
 * @createTime 2015-04-03
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <UIKit/UIKit.h>

@interface Magnifier : UIView

@property (nonatomic, assign) UIView* viewToMagnify;
@property (nonatomic) CGPoint touchPoint;
@property (nonatomic) CGFloat scale;
@property (nonatomic) CGFloat limit_height;
- (void)show;
- (void)hide;
@end
