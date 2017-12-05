/**
 * @createTime 2015-04-22
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <UIKit/UIKit.h>

@class TeDialog;

@protocol TeDialogDelegate<NSObject>
@optional
- (void)dialog_will_show:(TeDialog*)view;
- (void)dialog:(TeDialog*)view clicked_button_at_index:(NSInteger)index;
@end

typedef void (^TeDialogCallback)(NSString* data);

@interface TeDialog: UIView
@property (assign, nonatomic) id<TeDialogDelegate> delegate;
@property (strong, nonatomic) UIView* content;
- (id)init_with_title:(NSString*)title
                  msg:(NSString*)msg
             delegate:(id<TeDialogDelegate>)del
        button_titles:(NSArray*)titles;
- (void)show;
- (void)close;

+ (void)alert:(NSString*)text;
+ (void)alert:(NSString*)text   cb:(TeDialogCallback)cb;
+ (void)confirm:(NSString*)text cb:(TeDialogCallback)cb;
+ (void)delete_file_confirm:(NSString*)text cb:(TeDialogCallback)cb;
+ (void)prompt:(NSString*)text  input:(NSString*)input cb:(TeDialogCallback)cb;
@end

