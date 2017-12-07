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

import './root.jsx';
import 'ngui/storage';
import 'ngui/util';
import 'ngui/sys';
import { ViewController, ngui, atomPixel } from 'ngui';
import EventNoticer from 'ngui/event';
import 'ngui/dialog';
import './app_info';

function initialize(self) {

  app_info.reports_status();
  
  ngui.displayPort.onChange.on(function() {
    update_layout_status(self, false);
  }, self);
  
  if (app_info.is_small_screen_device) { // 小屏设备
    self.find('back_res_btn').show();
    self.m_layout_status = 2; // 第一次运行的状态
  } else {
    self.find('toggle_btn').show();
    self.m_layout_status = 1; // 第一次运行的状态
  }
  
  var layout_status = storage.getJSON('layout_status');
  if (layout_status !== null) {
    self.m_layout_status = layout_status; // ? 1 : 0;
  }
  
  if (self.m_layout_status == 2) { // 非小屏幕设备初始化布局状态不能为2
    if (!app_info.is_small_screen_device) {
      self.m_layout_status = 1;
      storage.setJSON('layout_status', 1);
    }
  }
  
  update_layout_status(self, false);  // 初始布局状态
}

function update_layout_status_display(self) {
  switch (self.m_layout_status) {
    case 0:  //0西边布局尺寸为0宽度
      self.find('west').hide();
      self.find('east').show();
      break;
    case 1:  //1西边布局尺寸为320宽度
      self.find('west').show();
      self.find('east').show();
      break;
    default: //2西边布局尺寸为全屏宽度
      self.find('west').show();
      self.find('east').hide();
      break;
  }
}

/**
 * @fun update_layout_status() 更新布局状态
 */
function update_layout_status(self, is_ani) {
  
  var size = { 
    width: ngui.displayPort.width, 
    height: ngui.displayPort.height,
  };
  var height = size.height - root.full_bar_height;
  var width = 0;
  
  switch (self.m_layout_status) {
    case 0:  // 0西边布局尺寸为0宽度
      width = size.width;
      self.find('toggle_btn').removeClass('on');
      break;
    case 1:  // 1西边布局尺寸为320宽度
      width = size.width - 320;
      self.find('toggle_btn').addClass('on');
      break;
    default: // 2西边布局尺寸为全屏宽度
      break;
  }
  
  self.m_content_size.width = width;
  self.m_content_size.height = height;
  
  var west_width = Math.max(size.width - width, 320);
  var west_left = size.width - width - west_width;
  var east_left = size.width - width + atomPixel;
  
  self.triggerBeforeChangeLayoutStatus();
  
  self.find('west').show();
  self.find('east').show();
  
  if ( is_ani || self.m_animate ) { // 如果当前为动画状态,如果突然中断动画,体验感很不好
    self.m_animate = true;
    
    self.find('west').transition({ width: west_width, x: west_left, time: 400 });
    self.find('east').transition({ width: width, x: east_left, time: 400 }, function() {
      self.m_animate = false;
      update_layout_status_display(self);
      self.triggerChangeLayoutStatus();
    });
  } else {
    self.find('west').style = { width: west_width, x: west_left };
    self.find('east').style = { width: width, x: east_left };
    update_layout_status_display(self);
    self.triggerChangeLayoutStatus();
  }
}

/**
 * 设置布局状态
 * 0西边布局尺寸为0宽度
 * 1西边布局尺寸为320宽度
 * 2西边布局尺寸为全屏宽度
 * @fun update_layout_status0()
 */
function update_layout_status0(self, status, is_ani) {
  if ( app_info.is_small_screen_device ) {
    if (status == 1) { return }
  }
  if (self.m_layout_status != status) {
    storage.setJSON('layout_status', status);
    self.m_layout_status = status;
    update_layout_status(self, is_ani);
  }
}

/**
 * @class RootViewController
 */
export class RootViewController extends ViewController {
  // 布局状态
  // 0西边布局尺寸为0宽度
  // 1西边布局尺寸为320宽度
  // 2西边布局尺寸为全屏宽度
  m_layout_status: (app_info.is_small_screen_device ? 2 : 1);
  // 东布局尺寸
  m_content_size: null;
  // 动画切换状态
  m_animate: false;
  
  /** 
   * @event onBeforeChangeLayoutStatus 前变化
   */
  event onBeforeChangeLayoutStatus;
  
  /**
   * @event onChangeLayoutStatus 变化布局事件
   */
  event onChangeLayoutStatus;
  
  get is_open_soft_keyboard() {
    return this.find('btnOpenSoftKeyboard').is_open_soft_keyboard;
  }
  
  constructor() {
    super();
    this.m_content_size = { width: 0, height: 0 };
  }
  
  loadView() {
    super.loadView(root.main_vx);
    initialize(this);
  }
  
  reports_error(err) {
    app_info.reports_error(err);
  }
  
  // @布局状态
  get layout_status() {
    return this.m_layout_status;
  }
  
  set layout_status(value) {
    this.set_layout_status(value);
  }
  
  // @设置布局状态
  set_layout_status(status, is_ani) {
    update_layout_status0(this, status, is_ani);
  }
  
  /**
   * 切换面板
   */
  toggle() {
    if (this.m_layout_status == 0) {
      update_layout_status0(this, 1, true);
    }
    else if(this.m_layout_status == 1) {
      update_layout_status0(this, 0, true);
    }
  }

  /**
   * 打开内部浏览器
   */
  open_web_browser(url) {
    if (url) {
      if (!/https?:\/\/[^\.]+\.[^\.]+/i.test(url)) {
        // 用相对路径打开
        // return NativeService.call('open_web_browser_for_relative', encodeURI(url));
        return;
      }
    } else {
      var view = this.find('east_content').current;
      if (view) {
        // 如果当前打开的是一个html or office
        // |pdf|docx?|xlsx?|pptx?
        if (view.is_web_browse() || /\.(html?)$/i.test(view.get_filename())) {
          url = 'documents/' + view.get_filename();
          // NativeService.call('open_web_browser_for_relative', encodeURI(url));
          return;
        }
      }
    }
    // NativeService.call('open_web_browser', url ? encodeURI(url): '');
  }

  // @获取核心内容区的尺寸
  get content_size() {
    return this.m_content_size;
  }

  m_add_btn_click() {
    dialog.alert('Add');
  }

  m_share_btn_click() {
    dialog.alert('Share'); 
  }

  m_more_btn_click() {
    dialog.alert('More'); 
  }

  m_back_btn_click() {
    update_layout_status0(this, 2, true);
  }

  m_toggle_btn_click() {
    toggle();
  }

}
