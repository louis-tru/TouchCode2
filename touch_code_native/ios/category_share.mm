/**
 * @createTime 2015-04-08
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <jtn/util.h>
#import "category_share.h"
#import "TOActivitySafari.h"
#import "TOActivityChrome.h"
#import "activity_wechat.h"

/* Detect which user idiom we're running on */
#define IPAD (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)

@interface CategoryShare ()
@property (nonatomic, weak) UIViewController* origin_ctr;
@end

@implementation CategoryShare

+ (void)init_category_share{
  //[ActivityWeChat init_wechat];
}

- (id)init_with_activity_items:(NSArray*)items origin_ctr:(UIViewController*)ctr {

  NSArray* browserActivities =
  @[
#if TSArchARM
    [ActivityWeChatContacts new],
    [ActivityWeChatMoments new],
    // [ActivityWeChatFavorites new],
#endif
    [TOActivitySafari new],
    [TOActivityChrome new],
  ];
  
  self = [super initWithActivityItems:items applicationActivities:browserActivities];
  
  self.origin_ctr = ctr;
  
  return self;
}

- (void)activity:(UIView*)sender {
  [self activity_with_rect:sender.frame to_view:sender.superview];
}

- (void)activity_with_rect:(CGRect)frame{
  [self activity_with_rect:frame to_view:self.origin_ctr.view];
}

- (void)activity_with_rect:(CGRect)frame to_view:(UIView*)view{
  
  if (IPAD == NO) {
    //If we're on an iPhone, we can just present it modally
    [self.origin_ctr presentViewController:self animated:YES completion:nil];
  }
  else {
    
    //Create the sharing popover controller
    UIPopoverController* sharingPopoverController =
      [[UIPopoverController alloc] initWithContentViewController:self];
    
    [sharingPopoverController presentPopoverFromRect:frame
                                              inView:view
                            permittedArrowDirections:UIPopoverArrowDirectionAny
                                            animated:YES];
  }
}


@end