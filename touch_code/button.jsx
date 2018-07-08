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

import Navpage from 'ngui/nav';
import { 
  ViewController, Button, CSS,
  Text, TextNode, atomPixel: px, 
  Indep, isViewXml, Panel, Scroll, ngui
} from 'ngui';
import 'ngui/sys';
import './app_info';

const $ = resolve;

CSS({

  '.long_btn': {
    margin: 10,
    margin_bottom: 0,
    width: "full",
    height: 36,
    text_line_height: 36,
    text_color: "#0079ff",
    border_radius: 8,
    border: `${px} #0079ff`,
  },
    
  '.long_btn2': {
    margin: 10,
    margin_bottom: 0,
    width: "full",
    height: 36,
    text_line_height: 36,
    text_color: "#fff",
    border_radius: 8,
    border: `${px} #fff`,
  },
  
  '.next_btn': {
    width: "full",
    text_line_height: 45,
    text_align: "left",
    border_radius: 0,
  },
  
  '.next_btn:normal': {
    background_color: '#fff0', time: 180
  },
  
  '.next_btn:hover': {
    background_color: '#ececec', time: 50
  },
  
  '.next_btn:down': {
    background_color: '#E1E4E4', time: 50
  },

  '.input': {
    margin:10,
    margin_bottom:0,
    width:"full",
    height:30,
    background_color:"#eee",
    border_radius:8,
  },

  '.btnOpenSoftKeyboard': {
    visible: false,
    //  position: absolute;
    y: -8,
    x: -8,
    align_x: 'right',
    align_y: 'bottom',
    // z-index: 4;
    opacity: 0.4,
  },
  
  '.btnOpenSoftKeyboard.iphone': {
    src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
    y: -5,
    x: -5,
    width: 45,
    height: 45,
  },
  
  <!--默认为肖像视图 portrait-->
  '.btnOpenSoftKeyboard.ipad': {
    src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
    width: 60,
    height: 60,
  },
  
  <!--风景视图 landscape -->
  '.btnOpenSoftKeyboard.ipad.landscape': {
    src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
    width: 77,
    height: 75,
  },
  
  <!--iphone暂时没有风景视图-->
  '.btnOpenSoftKeyboard.iphone.landscape': {

  },
  
  '.btnOpenSoftKeyboard:normal': {
    opacity: 1,
  },
  
  '.btnOpenSoftKeyboard:down': {
    opacity: 0.2,
  },
  
  <!--软键盘打开状态按钮样式 -->
  '.btnOpenSoftKeyboard.open': {
    scale_y: -1,
  },
  
});

export class OpenSoftKeyboardButton extends ViewController {
  
  m_timeoutid = 0;
  m_is_open_soft_keyboard = false;
  
  get is_open_soft_keyboard() {
    return this.m_is_open_soft_keyboard;
  }

  loadView(vx) {
    super.loadView(vx);
    this.hide();

    if (app_info.is_touch_device) {
      this.addClass('btnOpenSoftKeyboard');
      if (app_info.is_small_screen_device) {
        this.addClass('iphone');
      } else {
        this.addClass('ipad');
      }
      initBtnOpenSoftKeyboard(this);
    }
  }
  
  // @overwrite
  show() {
    clearTimeout(this.m_timeoutid);
    if (!this.visible) {
      this.m_timeoutid = (()=>super.show()).setTimeout(250);
    }
  }
  
  // @overwrite
  hide() {
    clearTimeout(this.m_timeoutid);
    if(this.visible) {
      this.m_timeoutid = (()=>super.hide()).setTimeout(10);
    // Node.members.hide.call(this);
    }
  }
  
}

// 更新ace编辑器状态
function update_immediate_focus_status(self) {
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
function BtnOpenSoftKeyboard_update_status(self) {

  update_immediate_focus_status(self);

  var main = share_main_viewport;
  var view = main.east_content.current;

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
    preferences_view.get_preferences_item('enable_touch_focus')

  if (self.m_is_open_soft_keyboard) { // 键盘打开状态
    // if (util.env.ipad) { // ipad 打开状态不需要这个按钮
    //   self.hide();
    // }
    // else {
    //   self.show();
    // }
    self.hide(); // 现在打开键盘状态都不需要显示这个按钮
    self.addClass('open'); // 设置打开状态样式
  } else { // 关闭状态
    if(enable_touch_focus){ // 点击编辑器能自动弹出键盘,所以不需要这个按钮
      self.hide();
    } else {
      self.show();
    }
    self.removeClass('open'); // 设置关闭状态样式
  }

  var size = displayPort.size;

  if (util.env.ios) {
    if (util.env.ipad) {
      if ((size.orientation == 0 || size.orientation == 180)) { // 肖像视图
        self.removeClass('landscape');
      } else { // 风景视图
        self.addClass('landscape');
      }
    } else { 
      // iphone 无需处理,因为只有肖像视图
    }
  } else {
    // TODO
  }
}

function initBtnOpenSoftKeyboard(self) {

  NativeService.on('open_soft_keyboard', function (evt){
    if(!self.m_is_open_soft_keyboard){
      self.m_is_open_soft_keyboard = true;
      BtnOpenSoftKeyboard_update_status(self);
    }
  });
  
  NativeService.on('close_soft_keyboard', function (evt){
    if(self.m_is_open_soft_keyboard){
      self.m_is_open_soft_keyboard = false;
      BtnOpenSoftKeyboard_update_status(self);
    }
  });

  var main = share_main_viewport;
  main.east_content.onopen_view.on2(BtnOpenSoftKeyboard_update_status, self);
  main.east_content.onrelease_view.on2(BtnOpenSoftKeyboard_update_status, self);
  main.onchange_layout_status.on2(BtnOpenSoftKeyboard_update_status, self);
  
  preferences_view.onpreferences_change.on2(BtnOpenSoftKeyboard_update_status, self);

  // 点击事件
  self.onClock.on(function () {

    var view = main.east_content.current;
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
          }).setTimeout(1000);
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

//@end OpenSoftKeyboardButton
