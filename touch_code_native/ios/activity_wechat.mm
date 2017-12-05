/**
 * @createTime 2015-04-11
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <jtn/util.h>

#if JArchARM

#import "activity_wechat.h"
#import "WXApi.h"

static BOOL is_init_wechat = NO;
static BOOL is_support_wechat = NO;

@interface ActivityWeChat()

+ (BOOL)is_support_wechat;
/* The URL to load */
@property (nonatomic, strong) NSURL*    url;
@property (nonatomic, strong) UIImage*  image;
@property (nonatomic, strong) NSString* title;
@property (nonatomic, strong) NSString* desc;
@end

@implementation ActivityWeChat

+ (void)init_wechat {
  if (!is_init_wechat) {
    is_init_wechat = YES;
    NSString* AppID =
      [[NSBundle mainBundle] infoDictionary][@"CFBundleURLTypes"][0][@"CFBundleURLSchemes"][0];
    is_support_wechat =
      [WXApi registerApp:AppID withDescription:@"Touch Code"];
  }
}

+ (BOOL)is_support_wechat {
  [self init_wechat];
  return is_support_wechat;
}

+ (UIActivityCategory)activityCategory {
  return UIActivityCategoryShare;
}

- (void)prepareWithActivityItems:(NSArray *)activityItems {
  
  for (id item in activityItems) {
    if ([item isKindOfClass:[NSURL class]]) {
      self.url = item;
    }
    else if ([item isKindOfClass:[UIImage class]]) {
      self.image = item;
    }
    else {
      if (!self.desc) {
        self.desc = item;
      }
      else if(!self.title) {
        self.title = self.desc;
        self.desc = item;
      }
    }
  }
}

- (BOOL)canPerformWithActivityItems:(NSArray *)activityItems {
  
  if ([ActivityWeChat is_support_wechat]) {
    
    // 是否有支持的数据类型
    for (id item in activityItems) {
      if ([item isKindOfClass:[NSURL class]] ||
          [item isKindOfClass:[UIImage class]] ||
          [item isKindOfClass:[NSString class]])
      {
        return YES;
      }
    }
  }

  return NO;
}

- (void)request_wechat_action:(int)scene {
  
  SendMessageToWXReq* req = [SendMessageToWXReq new];
  
  if (self.url) {
    WXMediaMessage* message = [WXMediaMessage message];
    WXWebpageObject* ext = [WXWebpageObject object];
    ext.webpageUrl = self.url.absoluteString;
    message.mediaObject = ext;
    message.description = self.desc ? self.desc : self.url.absoluteString;
    if(scene == WXSceneTimeline){
      message.title = self.title ?
        [NSString stringWithFormat:@"%@ %@", self.title, message.description] :
        message.description;
    }
    else{
      message.title = self.title;
    }
    message.thumbImage = self.image;
    message.mediaTagName = @"WECHAT_TAG_JUMP_SHOWRANK";
    req.message = message;
    req.bText = NO;
  }
  else if (self.desc) {
    req.text = self.desc;
    req.bText = YES;
  }
  else { //只有图像数据
    WXMediaMessage* message = [WXMediaMessage message];
    WXImageObject* ext = [WXImageObject object];
    ext.imageData = UIImagePNGRepresentation(self.image);
    message.mediaObject = ext;
    message.mediaTagName = @"WECHAT_TAG_JUMP_APP";
    message.messageExt = nil;
    message.messageAction = @"<action>dotalist</action>";
    req.message = message;
    req.bText = NO;
  }
  req.scene = scene;
  [WXApi sendReq:req];
}

@end

@implementation ActivityWeChatContacts

- (NSString*)activityType{
  return @"ActivityWeChatContacts";
}

- (NSString*)activityTitle{
  return NSLocalizedString(@"WeChat Contacts", nil);
}

- (UIImage*)activityImage{
  return [UIImage imageNamed:@"res/wechat_icon"];
}

- (void)performActivity{
  [self request_wechat_action:WXSceneSession];
}
@end

@implementation ActivityWeChatMoments

- (NSString*)activityType{
  return @"ActivityWeChatMoments";
}

- (NSString*)activityTitle{
  return NSLocalizedString(@"WeChat Moments", nil);
}

- (UIImage*)activityImage{
  return [UIImage imageNamed:@"res/wechat_icon_moments"];
}

- (void)performActivity{
  [self request_wechat_action:WXSceneTimeline];
}
@end

@implementation ActivityWeChatFavorites

- (NSString*)activityType{
  return @"ActivityWeChatFavorites";
}

- (NSString*)activityTitle{
  return NSLocalizedString(@"WeChat Favorites", nil);
}

- (UIImage*)activityImage{
  return [UIImage imageNamed:@"res/wechat_icon_collect"];
}

- (void)performActivity{
  [self request_wechat_action:WXSceneFavorite];
}
@end

#endif
