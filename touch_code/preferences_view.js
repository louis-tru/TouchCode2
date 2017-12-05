/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2015, Louis.chu
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Louis.chu nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL Louis.chu BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * ***** END LICENSE BLOCK ***** */

//import 'preferences_view.vx';
//import ':gui/app';
import ':util/event';
import ':util';
import ':util/storage';
//import ':truth/loc';
//import ':wgui/display_port';
//import ':wgui/view';
//import NavPage from ':wgui/nav';
import 'checkbox';
import 'input';
import 'number_roller';
import OverlayPanel from 'overlay_panel';
import 'editor::Editor';
import EditSession from 'edit_session';
import 'req:ace/ext/themelist';
import VirtualRenderer from 'req:ace/virtual_renderer';

var preferences = null;

/**
 * 获取偏好
 */
function get_preferences () {
  
  if(preferences){
    return preferences;
  }
  
  preferences = {
    enable_line_number: false,
    font_size: 14,
    show_invisibles: false,
    indent_guides: false,
    enable_touch_focus : false,
    enable_auto_line: true,
    indent_width: 4,
    theme: 'ace/theme/xcode',
    theme_name: 'XCode',
  };
  
  if(util.env.iphone || util.env.ipod){
    preferences.enable_auto_line = false;
    preferences.indent_width = 2;
  }
  else{
    preferences.enable_auto_line = true;
    preferences.indent_width = 4;
  }
  return util.extend(preferences, storage.get('teide_preferences'));
}

/**
 * 获取偏好item
 */
function get_preferences_item (name) {
  return get_preferences()[name];
}

/**
 * 设置偏好
 */
function set_preferences (opts) {
  storage.set('teide_preferences', util.extend(get_preferences(), opts));
  exports.onpreferences_change.notice(preferences);
}

/**
 * 设置偏好item
 */
function set_preferences_item (name, value) {
  get_preferences()[name] = value;
  storage.set('teide_preferences', preferences);
  exports.onpreferences_change.notice(preferences);
}

/**
 * 设置偏好取反
 */
function set_preferences_item_not (name) {
  set_preferences_item(name, !get_preferences_item(name));
}

function update_diaplay (self) {
  
  var preferences = get_preferences();
  // {@自动换行} 
  self.inl.auto_line_ch.selected = preferences.enable_auto_line;
  // {@显示行号} 
  self.inl.line_number_ch.selected = preferences.enable_line_number;
  // {@触摸焦点} 
  self.inl.touch_focus_ch.selected = preferences.enable_touch_focus;
  // {@显示制表符} 
  self.inl.invisibles_ch.selected = preferences.show_invisibles;
  // {@显示缩进向导} 
  self.inl.indent_guides_ch.selected = preferences.indent_guides;
  // {@缩进宽度} 
  self.inl.indent_width_num.value = preferences.indent_width;
  // {@字体大小} 
  self.inl.font_size_num.value = preferences.font_size;
  // 
  var editor = self.m_editor;
  // update editor
  editor.setOption('showGutter', preferences.enable_line_number);
  editor.setOption("wrap", preferences.enable_auto_line ? 'free' : 'off');
  editor.setFontSize(preferences.font_size);
  editor.session.setTabSize(preferences.indent_width);
  // {@显示制表符} 
  editor.setShowInvisibles(preferences.show_invisibles);
  // {@显示缩进向导} 
  editor.setDisplayIndentGuides(preferences.indent_guides);
  // 主题
  editor.setTheme(preferences.theme);
  
  self.inl.theme_value.text = preferences.theme_name;
}

var demo_js = [
  "// {@初始编辑器}",
  "function init_editor(self){",
  "\tvar editor_container = self.inl.editor_container;",
  "\tvar renderer = new VirtualRenderer(editor_container.dom);",
  "\tvar editor = new Editor(renderer, new EditSession(demo_js, 'demo.js'));",
  "\tif (util.env.touch) {",
  "\t\teditor.setOption('scrollPastEnd', false);",
  "\t\teditor.setReadOnly(true); // {@设置为只读}",
  "\t}",
  "}"
];

function resize_editor (self) {
  (function (){
    self.m_editor.resize(true);
  }).delay(200);
}

// 初始编辑器
function init_editor (self) {
  var editor_container = self.inl.editor_container;
  var renderer = new VirtualRenderer(editor_container.dom);
  var session = new EditSession(loc.rep(demo_js.join('\n')), 'demo.js');
  var editor = new Editor(renderer, session);
  editor.setOption('showFoldWidgets', !util.env.touch); // 代码折叠快暂时禁用
  editor.setOption('highlightActiveLine', false);
  // editor.setOption('scrollPastEnd', false);
  editor.setReadOnly(true); // 设置为只读
  renderer.setShowPrintMargin(false);
  editor.setOption('autoScrollEditorIntoView', true);
  editor.setOption('maxLines', 30);
  self.m_editor = editor;
  app.root.onchange_layout_status.$on(resize_editor, self);
}

// 设置杨激活状态
function set_act_all_func_ch_on_stat (self){
  self.inl.act_all_func_ch.selected = true;
  self.inl.act_all_func_ch.disable = true;
}

function init (self) {
  var info = app.root.application_info;
  self.inl.my_id.text = info.id.toUpperCase();
  exports.onpreferences_change.$on(update_diaplay, self);
  init_editor(self);
  update_diaplay(self);
  
  if (info.introducer_id) {
    self.m_introducer_setting_done_status(info.introducer_id);
  } else {
    self.m_introducer_init_status();
  }

  self.inl.share_count.text = info.share_count;

  if (info.is_lite) {
    // self.inl.act_lite_x_panel.show();
    if (info.is_lite_x) {
      set_act_all_func_ch_on_stat(self);
    }
  }
}

/**
 * @class PreferencesView
 * @bases :wgui/nsv::NavPage
 */
export class PreferencesView extends NavPage {
  // @private:
  
  m_editor: null;
  
  m_introducer_setting_done_status_var: 1;
	
	// @public:
	
	/**
	 * @overwrite
	 */
	load_view (v, vd) {
	  NavPage.members.load_view.call(self, v, vd);
	  init(self);
	}
  
  m_my_id_click_handle (evt) {
    
    var menu = view.create('StopAction');
    
    menu.setValue('Copy').setClickHandle(function () {
      NativeService.call('set_clipboard_data', self.inl.my_id.text);
    });

    menu.priority = 'top';
    menu.activate(evt.sender);
  }
  
  m_introducer_init_status (){
    if (this.inl && this.m_introducer_setting_done_status_var != 4) {
      this.inl.introducer_id_text.hide(); 
      this.inl.introducer_id_input.hide(); 
      this.inl.introducer_panel.attr('class', 'action arrow');
      this.m_introducer_setting_done_status_var = 1;
    }
  }
  
  m_introducer_editor_status () {
    if (this.m_introducer_setting_done_status_var != 4) {
      this.inl.introducer_id_text.hide();
      this.inl.introducer_id_input.show();
      this.inl.introducer_id_input.clear();
      this.inl.introducer_id_input.focus();
      this.inl.introducer_panel.attr('class', ''); //disable_events
      this.m_introducer_setting_done_status_var = 2;
    }
  }
  
  m_introducer_editor_load_status (text) {
    if (this.m_introducer_setting_done_status_var != 4) {
      this.inl.introducer_id_text.text = text;
      this.inl.introducer_id_text.show();
      this.inl.introducer_id_input.hide();
      this.inl.introducer_panel.attr('class', 'loading');
      this.m_introducer_setting_done_status_var = 3;
    }
  }
  
  m_introducer_setting_done_status (text) {
    this.inl.introducer_id_text.text = text;
    this.inl.introducer_id_text.show();
    this.inl.introducer_id_input.hide();
    this.inl.introducer_panel.attr('class', ''); // disable_events
    this.m_introducer_setting_done_status_var = 4;
  }
  
  m_introducer_panel_click_handle () {
    if (this.m_introducer_setting_done_status_var == 1) {
      var info = app.root.application_info;
      if (info.introducer_id) {
        this.m_introducer_setting_done_status(info.introducer_id);
      } else {
        this.m_introducer_editor_status();
      }
    }
  }
  
  m_error (err){
    this.m_introducer_init_status();
    Dialog.error(err.message);
  }
  
  m_introducer_input_enter_handle (evt) { 
    
    var info = app.root.application_info;
    if (info.introducer_id) {
      self.m_introducer_setting_done_status(info.introducer_id);
      return;
    }
    
    var value = self.inl.introducer_id_input.value.toUpperCase();
    self.inl.introducer_id_input.blur();

    if (value == info.id.toUpperCase()) {
      Dialog.error('不能将自己设置为推荐人');
      return;
    }

    if (!/^([A-F0-9]{6,12})$/.test(value)) {
      Dialog.error('你的输入不正确,标识长度应不小于6并且不大于12的16进制字符串');
      return;
    }

    self.m_introducer_editor_load_status(value);
    Dialog.confirm(loc('推荐人ID设置后不能更改,确定要设置为"{0}"?').format(value), function (is) {
      if (!is) return self.m_introducer_init_status();
      // 调用管理服务
      ManageService.call('set_introducer', info, value, function (data) {
        value = data.introducer_id;
        // 成功后保存这个值到本地
        NativeService.call('update_application_info', data, function (data) {
          util.extend(info, data);
          self.m_introducer_setting_done_status(value);
          self.inl.share_count.text = info.share_count;
        }.catch(function (err) { self.m_error(err) }));
      }.catch(function (err) { self.m_error(err) }));
    });
  }
  
  m_act_all_func_handle (evt) {
    var info = app.root.application_info;

    if (!evt.sender.selected || info.is_lite_x) {
      return;
    }

    self.inl.act_all_func_ch.disable = true;
    self.inl.share_count.add_cls('ani');
    self.inl.share_count.text = '-';

    // 激活lite_x,返回激活lite_x的序列号
    ManageService.call.delay(ManageService, 2000, 
      'activate_lite_x', info, util.finally(function (err, data) {
      // 
      self.inl.act_all_func_ch.disable = false;
      self.inl.share_count.del_cls('ani');
      if (err) {
        self.inl.share_count.text = info.share_count;
        self.inl.act_all_func_ch.selected = false;
        return Dialog.error(err.message);
      }
      
      // 成功后保存这个值到本地
      NativeService.call('update_application_info', data, util.finally(function (err, data) {
        if (err) {
          self.inl.share_count.text = info.share_count;
          self.inl.act_all_func_ch.selected = false;
          return Dialog.error(err.message);
        }
        
        util.extend(info, data);

        self.inl.share_count.text = info.share_count;
        if (info.is_lite_x) {
          set_act_all_func_ch_on_stat(self);
        } else {
          self.inl.act_all_func_ch.selected = false;
        }
      }));
    }));
  }
	
  //自动换行
  m_auto_line_handle (evt) {
    set_preferences_item('enable_auto_line', evt.data);
  }
  
  //@显示行号
  m_line_number_handle (evt) {
    set_preferences_item('enable_line_number', evt.data);
  }
  
  //@触摸焦点
  m_auto_touch_focus_hand (evt) {
    set_preferences_item('enable_touch_focus', evt.data);
  }
  
  //显示制表符
  m_invisibles_handle (evt) {
    set_preferences_item('show_invisibles', evt.data);
  }
  
  //显示缩进向导
  m_indent_guides_handle (evt) {
    set_preferences_item('indent_guides', evt.data);
  }
  
  m_indent_width_handle (evt) {
    set_preferences_item('indent_width', evt.data);
  }
  
  m_font_size_handle (evt) {
    set_preferences_item('font_size', evt.data);
  }
  
  m_select_theme_handle (evt) {
    view.create('SelectTheme').set_target(this.inl.arrow);
  }
  
  /**
   * @overwrite
   */
  onreleasef () {
    self.m_editor.destroy();
    exports.onpreferences_change.off(update_diaplay);
    app.root.onchange_layout_status.off(resize_editor);
    NavPage.members.onreleasef.call(self);
  }
  // @end
}

function init_SelectTheme(self){
  if (util.env.touch) {
    if (util.env.ipad) {
      self.frail = false;
    } else {
      self.frail = true;
    }
  } else {
    self.frail = false;
  }
}

exports = {
  
  onpreferences_change: new event.EventDelegate('preferences_change'),
  
  /**
   * 获取偏好
   */
  get_preferences: get_preferences,
  
  /**
   * 获取偏好item
   */
  get_preferences_item: get_preferences_item,
  
  /**
   * 设置偏好
   */
  set_preferences: set_preferences,
  
  /**
   * 设置偏好item
   */
  set_preferences_item: set_preferences_item,
    
  /**
   * 设置偏好取反
   */
  set_preferences_item_not: set_preferences_item_not,
  
};

/**
  * @class teide.touch.SelectTheme
  */
export class SelectTheme extends OverlayPanel {
  
  frail: true;
  
  /**
    * @constructor
    */
  constructor (tag) {
    OverlayPanel.call(this, tag);
    this.onload_view.$on(init_SelectTheme);
  }
  
  set_target (target) {
    
    // caption: "Chrome"
    // isDark: false
    // name: "chrome"
    // theme: "ace/theme/chrome"
    
    var size = display_port.size;
    var cur_theme = get_preferences_item('theme');
    
    self.scroll.set_css('max-height', size.height - 20 + 'px');
    
    var y = 0;
    var ls = themelist.themes.map(function (item, index) {
      if (item.theme == cur_theme) {
        item.class_str = 'on';
        y = index;
      } else {
        item.class_str = ''; 
      }
      // item.class_str += item.isDark ? ' dark' : '';
      return item;
    });
    
    self.scroll.ls0.model = ls.slice(0, 16);
    self.scroll.ls1.model = ls.slice(16);
    
    if (size.width <= 320) {
      var offset = target.offset;
      self.activate_by_position(offset.left + 22, offset.top, 0, offset.height);
    } else {
      self.activate(target);
    }
    // self.scroll.set(0, y * 46 - (size.height - 20) / 2 + 70, 1, 0);
    self.scroll.dom.scrollTop = y * 46 - (size.height - 20) / 2 + 70;
  }
  
  m_select_click_handle (evt) {
    var theme = evt.sender.attr('theme');
    var theme_name = evt.sender.attr('theme_name');
    set_preferences({ theme: theme, theme_name: theme_name });
    
    var ls0 = this.scroll.ls0;
    var ls1 = this.scroll.ls1;
    ls0.model.data.forEach(function (item, i) {
      ls0.item(i).item.del_cls('on');
    });
    ls1.model.data.forEach(function (item, i) {
      ls1.item(i).item.del_cls('on');
    });
    evt.sender.add_cls('on');
  }
  // @end
}
