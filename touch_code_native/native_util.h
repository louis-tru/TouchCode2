/**
 * @createTime 2015-03-13
 * @author louis.tru <louistru@live.com>
 * @copyright © 2011 louis.tru, http://mooogame.com
 * @version 1.0
 */

#ifndef __native_util__
#define __native_util__

#include <ngui/base/event.h>

T_Ns(tc);

extern void oninit_application_notice();
extern void onopen_soft_keyboard_notice();
extern void onclose_soft_keyboard_notice();
extern void onclipboard_data_change_notice(tr::CStringRef data);
extern void onopen_external_file_notice(tr::CStringRef path);
extern void ondownload_file_notice(tr::CStringRef url);
extern void onpush_message_notice(tr::CStringRef msg);
//
extern tr::uint64 get_application_token();
extern tr::String get_system_language();
extern tr::String get_share_app_url();
extern tr::String get_app_store_url();
extern tr::String get_app_store_pro_url();
extern tr::String get_app_store_ph_url();
extern tr::String get_app_store_lite_url();
extern tr::String get_device_id();
extern tr::String get_device_token();
extern tr::String hex_encode(tr::CDataRef data);
extern bool is_pro();
extern bool is_ph();
extern bool is_lite();
extern bool is_support_high();
extern void start_server();
extern void complete_load();
extern void set_ace_clipboard_data(jtn::CStringRef data);
extern void set_clipboard_data(jtn::CStringRef data);
extern void open_web_browser(jtn::CStringRef url, bool priority_history);
extern void share_app(int x, int y, int width, int height);
extern void sleep_disabled(bool value);
extern void send_file(jtn::CStringRef document_path, jtn::CStringRef path);
extern void send_email_to_author();
extern void open_outer_browser(jtn::CStringRef url);
extern void set_ad_panel_diaplay(bool value);

T_End

#endif