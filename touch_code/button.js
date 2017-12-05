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

import ':util';
//import ':truth/loc';
//import ':truth/app';
//import ':wgui/display_port';
//import ':wgui/ctrl::Ctrl');
//import ':wgui/view');
import 'preferences_view';
import 'text_editor';
import TextEditor from 'text_editor';
//import 'button.vx';

function start (self) {
  self.add_cls('son');
  // self.animate({'transform': 'scale(1.15)'}, 150);
  // self.animate({'transform': 'scale(1)'}, 100);
  if (self.music) {
    // TODO ?
  }
}

function end (self) {
  self.del_cls('son');
}

function init (self) {
  
  self.class = 'button fine';
  
  if (truth.env.toush) {
    self.$on('touchstart', start);
    self.$on('touchend', end);
  }
  else { //pc
    self.$on('mousedown', start);
    self.$on('mouseup', end);
    self.$on('mouseout', end);
  }
}

/**
 * @class Button
 * @extends wgui/ctrl::Ctrl
 */
export class Button extends Ctrl {

  /**
   * 按钮颜色
   * @private
   */
  m_color: 'blue'; // blue | red | green | grey
  
  /**
   * 按钮类型
   * @private
   */
  m_type: 'basic';     // basic | circle | min | back | dialog
  
  /**
   * 在按钮组中是否被选中
   * @private
   */
  m_selected: false;
  
  /**
   * 点击按钮的声音
   */ 
  music: '';
  
  get selected () {
    return this.m_selected;
  }
  
  set selected (value){
    this.m_selected = value;
    if (value) {
      this.add_cls('on');
    }
    else {
      this.del_cls('on');
    }
  }
  
  get value () {
    return this.html;
  }
  
  set value (value) {
    this.html = loc(value);
  }
  
  get color () {
    return this.m_color;
  }
  
  set color (value){
    this.del_cls(this.m_color);
    this.add_cls(value);
    this.m_color = value;
  }
  
  get type () {
    return this.m_type;
  }
  
  set type (value) {
    this.del_cls(this.m_type);
    this.add_cls(value);
    this.m_type = value;
  }
  
	/**
	 * @constructor
	 */
  constructor (tag) {
    super(tag);
    init(this);
  }

  click (msg) {
    this.notice('click', msg);
  }
  // @end
}

/**
 * @class BackButton
 * @bases Button
 */
export class BackButton extends Button {
  /**
   * @constructor
   */
  constructor (tag) {
    super(tag);
    this.type = 'back';
  }
  // @end
}

/**
 * @class DialogButton
 * @bases Button
 */
export class DialogButton extends Button {
  /**
   * @constructor
   */
  constructor (tag) {
    Button.call(self, tag);
    self.type = 'dialog';
  }
  // @end
}

/**
 * @class TitBtn
 * @bases :wgui/ctrl::Ctrl
 * @vtags TitBtn
 */
export class TitBtn extends Ctrl {
  // @private:
  m_disable: false;
  
  // @public:
  /**
   * @get disable {Bool}
   */
  get disable() {
    return self.m_disable;
  }

  /**
   * @set disable {Bool}
   */
  set disable(value) {
    self.m_disable = value;
    if (value) {
      self.style = {
        'pointer-events': 'none',
        'opacity': 0.2,
      };
    } else {
      self.style = {
        'pointer-events': 'auto',
        'opacity': 1,
      };
    }
  }
  
  // @end
}


// 更新ace编辑器状态
function update_immediate_focus_status (self) {
  var ace = text_editor.core;
  if (ace) {
    if (preferences_view.get_preferences_item('enable_touch_focus')) {
      ace.setOption('immediateFocus', true);
    } else {
      if (self.m_is_open_soft_keyboard) { // 键盘打开状态
        ace.setOption('immediateFocus', true);
      } else {
        ace.setOption('immediateFocus', false);
      }
    }
  }
}

// 更新按钮显示状态
function update_BtnOpenSoftKeyboard_status (self) {

  update_immediate_focus_status(self);
  
  var view = app.root.east_content.current;

  // 当前没有任何文档被打开,不显示按钮
  if (!view) {
    return self.hide();
  }

  // 打开的不是文本文档,不显示按钮
  if (!(view instanceof TextEditor)) {
    return self.hide();
  }

  // 如果当前文档为只读文档,不显示按钮
  if (view.getReadOnly()) {
    return self.hide();
  }
  
  var enable_touch_focus = 
    preferences_view.get_preferences_item('enable_touch_focus');

  if (self.m_is_open_soft_keyboard) { // 键盘打开状态
    // if(util.env.ipad){ // ipad 打开状态不需要这个按钮
    //   self.hide();
    // }
    // else {
    //   self.show();
    // }
    self.hide(); // 现在打开键盘状态都不需要显示这个按钮
    self.add_cls('open'); // 设置打开状态样式
  } else { // 关闭状态
    if(enable_touch_focus){ // 点击编辑器能自动弹出键盘,所以不需要这个按钮
      self.hide();
    } else {
      self.show();
    }
    self.del_cls('open'); // 设置关闭状态样式
  }

  var size = display_port.size;

  if (util.env.ios) {
    if (util.env.ipad) {
      if ((size.orientation == 0 || size.orientation == 180)) { // 肖像视图
        self.del_cls('landscape');
      } else { // 风景视图
        self.add_cls('landscape');
      }
    } else { 
      // iphone 无需处理,因为只有肖像视图
    }
  } else {
    // TODO
  }
}

// 
function initBtnOpenSoftKeyboard (self) {

  NativeService.on('open_soft_keyboard', function (evt){
    if(!self.m_is_open_soft_keyboard){
      self.m_is_open_soft_keyboard = true;
      update_BtnOpenSoftKeyboard_status(self);
    }
  });
  
  NativeService.on('close_soft_keyboard', function (evt){
    if(self.m_is_open_soft_keyboard){
      self.m_is_open_soft_keyboard = false;
      update_BtnOpenSoftKeyboard_status(self);
    }
  });

  var root = app.root;
  root.east_content.onopen_view.$on(update_BtnOpenSoftKeyboard_status, self);
  root.east_content.onrelease_view.$on(update_BtnOpenSoftKeyboard_status, self);
  root.onchange_layout_status.$on(update_BtnOpenSoftKeyboard_status, self);
  
  preferences_view.onpreferences_change.$on(update_BtnOpenSoftKeyboard_status, self);

  // 点击事件
  self.on('click', function () {
    
    var view = root.east_content.current;
    if (view && view instanceof TextEditor) {
      
      if (view.getReadOnly()) {
        view.blur(); // 卸载焦点
      } else {
        if(self.m_is_open_soft_keyboard){ // 键盘打开状态,在次点击关闭它
          view.blur(); // 卸载焦点
        } else {
          view.focus(); // 获取焦点
          self.hide(); // 先隐藏显示
          (function (){ // 1秒后还没有呼出键盘,在次显示
            if (!self.m_is_open_soft_keyboard) {
              self.show();
            }
          }).delay(1000);
        }
      }
    } else { // 如果这种状态可能的话,这应该是一个错误.
          // 所在次点击尝试卸载 ace editor 焦点
      var ace = text_editor.core;
      if (ace) {
        ace.blur();
      }
    }
  });
}

/**
 * @class BtnOpenSoftKeyboard # 打开软键盘按钮
 * @bases :wgui/ctrl::Ctrl
 */
export class OpenSoftKeyboardButton extends Ctrl {
  // @privaet:
  m_timeoutid: 0;
  m_is_open_soft_keyboard: false;
  
  // @public:
  /**
   * @get is_open_soft_keyboard {Bool}
   */
  get is_open_soft_keyboard () {
    return self.m_is_open_soft_keyboard;
  }
  
  /**
   * @constructor
   */
  constructor () {
    Ctrl.call(self);
    self.hide();
    
    if (util.env.ipad) {
      self.add_cls('ipad');
    } else if (util.env.ipod || util.env.iphone) {
      self.add_cls('iphone');
    } else {
      return; // 不需要这个按钮
    }
    self.onload_view.$on(initBtnOpenSoftKeyboard);
  }
  
  /**
   * @overwrite
   */
  show () {
    util.clear_delay(self.m_timeoutid);
    if (!self.visible) {
      self.m_timeoutid = Ctrl.members.show.delay(self, 250);
    }
  }
  
  /**
   * @overwrite
   */
  hide () {
    util.clear_delay(self.m_timeoutid);
    if (self.visible) {
      self.m_timeoutid = Ctrl.members.hide.delay(self, 10);
    }
  }
  
  // @end
}
