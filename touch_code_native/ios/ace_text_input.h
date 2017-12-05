/**
 * @createTime 2015-04-19
 * @author louis.tru <louistru@live.com>
 * @copyright (C) 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#import <UIKit/UIKit.h>

@protocol AceTextInputDelegate;

@interface AceTextInput: UIView<UITextInput>
@property (assign, nonatomic) id<AceTextInputDelegate> delegaet;
@property (assign, nonatomic) BOOL can_delete;
- (void)focus;
- (void)blur;
@end

@protocol AceTextInputDelegate<NSObject>
@required
- (void)onace_text_input_focus_notice;
- (void)onace_text_input_blur_notice;
- (void)onace_text_input_input_notice:(NSString*)data;
- (void)onace_text_input_backspace_notice;
- (void)onace_text_input_indent_notice;
- (void)onace_text_input_outdent_notice;
- (void)onace_text_input_comment_notice;
- (void)onace_text_input_composition_start_notice:(NSString*)data;
- (void)onace_text_input_composition_update_notice:(NSString*)data;
- (void)onace_text_input_composition_end_notice:(NSString*)data;
@end
