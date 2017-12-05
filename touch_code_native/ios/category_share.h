/**
 * @createTime 2015-04-08
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <UIKit/UIKit.h>

@interface CategoryShare: UIActivityViewController
+ (void)init_category_share;
- (id)init_with_activity_items:(NSArray*)items origin_ctr:(UIViewController*)ctr;
- (void)activity:(UIView*)sender;
- (void)activity_with_rect:(CGRect)frame;
@end
