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
import { ViewController, ngui } from 'ngui';
import EventNoticer from 'ngui/event';
import './app_info';
// import ':wgui/view';
// import ':wgui/nav';
// import ':wgui/node';
// import ':wgui/list';
// import 'service';
// import 'dialog';
// import 'resources';
// import 'east_content_panel';
// import 'preferences_view';
// import 'added_menu';
// import 'more_menu';
// import 'file_content_view_option';

function bind_service_event(self) {
  
  NativeService.on('node_application_error', function (evt) {
    self.reports_error(evt.data);
  });
  
  ngui.displayPort.onChange.on(function () {
    update_layout_status(self, false);
  }, self); 
  
  FastNativeService.ondisplay_port_size_change.on(function (evt) {
    // ngui.displayPort.set_temp_size(evt.data.width, evt.data.height);
  });
  
  NativeService.on('download_file', function (evt) {
    added_menu.nativeRequestDownload(evt.data);
  });
  
  NativeService.on('script_start', function () { // 开始运行
    self.m_is_runing = true;
    self.run_btn.add_cls('stop');
  });
  
  NativeService.on('script_exit', function () { // 运行完成
    self.m_is_runing = false;
    self.run_btn.del_cls('stop');
    var view = self.east_content.current;
    if (!view || !view.is_run()) {
      self.run_btn.disable = true;
    }
  });
  
  NativeService.on('script_error', function (evt) {
    if (evt.data.code == 102) {
      Dialog.confirm(evt.data.message, function (is) {
        if (is) {
          self.east_content.open('console.log');
        }
      });
    } else {
      Dialog.error(evt.data.message);
    }
  });
  
  NativeService.on('push_message', function (evt) {
    if (evt.data.script) { // 执行这个脚本
      try {
        util.run_script(`(function (data){${evt.data.script}})`, '[Eval]')(evt.data);
      } catch(err) { 
        console.error(err.message);
      }
    }
  });
}

function initialize(self) {
  
  // bind_service_event(self);
  
  var run_count = app_info.info.application_run_count;
  
  // if ( !self.application_info.mark_reviews && (run_count == 3 || run_count % 10 === 0) ) { 
  //   Dialog.confirm_html('您的支持是我前进的动力,是否要去评价此软件?', function (is) {
  //     if (is) { // yes
  //       app_info.open_app_store_reviews(); // open app store
  //     }
  //     app_info.reports_status();
  //   });
  // } else {
    app_info.reports_status();
  //}
  
  ngui.displayPort.onChange.on(function() {
    update_layout_status(self, false);
  }, self);
  
  /*
  self.find('east_content').onchange_history.on(function (evt) {
    var view = self.find('east_content').current;
    if (view) {
      view.onchange.on(function () {
        self.find('undo_btn').disable = !view.hasUndo();
        self.find('redo_btn').disable = !view.hasRedo();
      });
      self.find('undo_btn').disable = !view.hasUndo();
      self.find('redo_btn').disable = !view.hasRedo();
      if (!self.is_runing) {
        self.find('run_btn').disable = !view.is_run();
      }
    } else {
      self.find('run_btn').disable = !self.is_runing;
    }
    self.find('back_btn').disable = !self.east_content.is_back();
    self.find('forward_btn').disable = !self.east_content.is_forward();
  });*/
  
  if ( app_info.is_small_screen_device ) { // 小屏设备
    self.find('back_res_btn').show();
    self.m_layout_status = 2; // 第一次运行的状态
  } else {
    self.find('toggle_btn').show();
    self.find('back_btn').show();
    self.find('forward_btn').show();
    self.m_layout_status = 1; // 第一次运行的状态
  }
  
  var layout_status = storage.getJSON('layout_status');
  if (layout_status !== null) {
    self.m_layout_status = layout_status; // ? 1 : 0;
  }
  
  if (self.m_layout_status == 2) { // 非小屏幕设备初始化布局状态不能为2
    if (! app_info.is_small_screen_device ) {
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
  
  var size = { width: ngui.displayPort.width, height: ngui.displayPort.height };
  var height = size.height - root.full_bar_height;
  var width = 0;
  
  switch (self.m_layout_status) {
    case 0:  // 0西边布局尺寸为0宽度
      width = size.width;
      // self.find('toggle_btn').styles = root.S.toggle_btn;
      // self.search.blur(); // 不能在输入了,因为这个状态下,已无法看到它了
      break;
    case 1:  // 1西边布局尺寸为320宽度
      width = size.width - 320;
      // self.find('toggle_btn').styles = root.S.toggle_btn_on;
      break;
    default: // 2西边布局尺寸为全屏宽度
      width = 0;
      // console.log('root.S.toggle_btn');
      // self.find('toggle_btn').styles = root.S.toggle_btn;
      break;
  }
  
  self.m_east_size.width = width;
  self.m_east_size.height = height;
  
  var west_width = Math.max(size.width - width, 320);
  var west_left = size.width - width - west_width;
  var east_left = size.width - width + root.px1;
  
  self.triggerbefore_change_layout_status();
  
  self.find('west').show();
  self.find('east').show();
  
  if ( is_ani || self.m_animate ) { // 如果当前为动画状态,如果突然中断动画,体验感很不好
    self.m_animate = true;
    
    self.find('west').transition({ width: west_width, x: west_left, time: 400 });
    self.find('east').transition({ width: width, x: east_left, time: 400 }, function() {
      self.m_animate = false;
      if (self.m_layout_status != 0) {
        // self.find('east_content').width = width;
      }
      update_layout_status_display(self);
      self.triggerchange_layout_status();
    });
  } else {
    self.find('west').style = { width: west_width, x: west_left };
    self.find('east').style = { width: width, x: east_left };
    update_layout_status_display(self);
    self.triggerchange_layout_status();
  }
}

/**
 * 设置布局状态
 * 0西边布局尺寸为0宽度
 * 1西边布局尺寸为320宽度
 * 2西边布局尺寸为全屏宽度
 * @fun set_layout_status()
 */
function set_layout_status(self, status, is_ani) {
  if ( app_info.is_small_screen_device ) {
    if (status == 1) { return }
  }
  if (self.m_layout_status != status) {
    storage.setJSON('layout_status', status);
    self.m_layout_status = status;
    update_layout_status(self, is_ani);
  }
}

// 开始编辑
function edit(self) {
  if (self.m_is_edit) { return }
  // 开启编辑
  if ( !self.find('res').enableEdit() ) {
    return Dialog.error('无法编辑,当前有任务没有完成!');
  }
  
  self.m_is_edit = true;
  self.find('west_edit_btn_panel').show();
  self.find('west_edit_btn_panel').transition({ opacity: 1, width: 49, time: 200 });
  //只在正常状态显示的按钮
  self.find('west_btns_panel').transition({ opacity: 0, time: 200 }, ()=>{
    self.find('west_btns_panel').hide();
  });
  // 只在编辑状态显示的按钮
  // 资源管理器的尺寸设置成全屏状态
  set_layout_status(self, 2, true);
}

//完成编辑
function done_edit(self) {
  if (!self.m_is_edit) {
    return;
  }
  // 禁用编辑
  if ( !self.find('res').disableEdit() ) {
    return Dialog.error('无法完成编辑,当前有任务没有完成!');
  }
  
  self.m_is_edit = false;
  self.find('west_edit_btn_panel').transition({ opacity: 0, width: 0, time: 200 });
  //只在正常状态显示的按钮
  self.find('west_btns_panel').show();
  self.find('west_btns_panel').animate({ opacity: 1, time: 200 }, ()=>{
    self.find('west_edit_btn_panel').hide();
  });
  
  // 只在编辑状态显示的按钮
  set_layout_status(self, 1, true);
}

function activate_resources(self) {
  if ( self.m_is_edit ) return;
  self.find('res').show();
  self.find('search_outer').hide();
  // self.find('res_btn').styles = root.S.res_btn_on;
  // self.find('search_btn').styles = root.S.search_btn;
  self.find('edit_btn').show();
  self.find('edit_btn').transition({ opacity: 1, width: 49, time: 200 });
  self.find('add_btn').show();
  self.find('add_btn').transition({ opacity: 1, width: 49, time: 200 });
  //self.find('search').blur();
}

/**
 * is_focus 是否聚焦到输入框
 */
function activate_search(self, is_focus, opt) {
  if ( self.m_is_edit ) return;
  self.find('res').hide();
  self.find('search_outer').show();
  // self.find('res_btn').styles = root.S.res_btn;
  // self.find('search_btn').styles = root.S.search_btn_on;
  self.find('edit_btn').transition({ opacity: 0, width: 0, time: 200 }, (e)=>{ e.sender.hide() });
  self.find('add_btn').transition({ opacity: 0, width: 0, time: 200 }, (e)=>{ e.sender.hide() });
  if (is_focus) {
    self.find('search').focus();
  }
  //self.find('search').setOptions(opt);
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
  m_east_size: null;
  // 是否在编辑状态
  m_is_edit: false;
  // 当前是否运行
  m_is_runing: false;
  // 动画切换状态
  m_animate: false;
  
  // public:
  /** 
   * @event onbefore_change_layout_status # 前变化
   */
  event onbefore_change_layout_status;
  
  /**
   * @event onchange_layout_status # 变化布局事件
   */
  event onchange_layout_status;
  
  get is_open_soft_keyboard() {
    return this.find('btnOpenSoftKeyboard').is_open_soft_keyboard;
  }
  
  constructor() {
    super();
    this.m_east_size = { width: 0, height: 0 };
  }
  
  loadView() {
    super.loadView(root.main_vx);
    initialize(this);
  }
  
  reports_error(err) {
    app_info.reports_error(err);
  }
  
  get application_info() {
    return app_info.info;
  }
  
  get ios_native() { // delete
    return false;
  }
  
  get is_runing() {
    return this.m_is_runing;
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
    set_layout_status(this, status, is_ani);
  }
  
  /**
   * 切换面板
   */
  toggle() {
    if (this.m_layout_status == 0) {
      set_layout_status(this, 1, true);
    }
    else if(this.m_layout_status == 1) {
      set_layout_status(this, 0, true);
    }
  }

  /**
   * 激活资源管理器
   */
  activate_resources() {
    activate_resources(this);
  }
  
  /**
   * 激活搜索面板
   */
  activate_search(is_focus, options) {
    activate_search(this, is_focus, options);
  }
  
  /**
   * 打开内部浏览器
   */
  open_web_browser(url) {
    /*
    if (url) {
      if (!/https?:\/\/[^\.]+\.[^\.]+/i.test(url)) {
        // 用相对路径打开
        return NativeService.call('open_web_browser_for_relative', encodeURI(url));
      }
    } else {
      var view = self.east_content.current;
      if (view) {
        // 如果当前打开的是一个html or office
        // |pdf|docx?|xlsx?|pptx?
        if (view.is_web_browse() || /\.(html?)$/i.test(view.get_filename())) {
          url = 'documents/' + view.get_filename();
          return NativeService.call('open_web_browser_for_relative', encodeURI(url));
        }
      }
    }
    NativeService.call('open_web_browser', url ? encodeURI(url): '');
    */
    console.log(url);
  }

  // @search panel
  get search() {
    return this.search_outer.search;
  }
  
  // @获取核心内容区的尺寸
  get east_size() {
    return this.m_east_size;
  }
  
  get is_support_high() {
    var info = this.application_info;
    // lite 版本无法运行, lite_x 版本可运行
    if (info.is_lite && !info.is_lite_x) { 
      return false;
    }
    return true;
  }
  
  verif_high_func() {
    if (this.is_support_high) {
      return true;
    }
    // Can't use this functional now, please buy the Ph/Prp version
    // or recommend this software to five friends can be free to activate, now go to activate?
    Dialog.confirm(
      '现在无法使用此功能,请购买Ph版或Pro版.\n或将此软件推荐给5个好友可免费激活,现在就去激活吗?', 
    (is) => {
      if (is) {
        this.find('east_content').open('[preferences.settings]');
      }
    });
    Dialog.alert('现在无法使用此功能,请购买Ph版或Pro版.');
    return false;
  }
  
  /**
   * @overwrite
   */
  triggerRemoveView(view) {
    super.triggerRemoveView(view);
    ngui.displayPort.onChange.off(this);
  }
  
  // private:
  
  // ------------------ event bind -------------------- 
  
  res_btn_click_handle(e) {
    this.activate_resources(false, null);
  }
  
  search_btn_click_handle(e) {
    this.activate_search();
  }
  
  m_add_click_handle(evt) {
    //tesla.ngui.Control.New('teide.touch.AddedMenu').activateByElement(evt.sender);
  }
  
  m_more_click_handle(evt) {
    //tesla.ngui.Control.New('teide.touch.MoreMenu').activateByElement(evt.sender);
  }
  
  m_share_click_handle(evt) {
    //NativeService.call('share_app', [evt.sender.offset]); // 分享app
  }
  
  // 编辑按钮
  m_edit_click_handle(evt) {
    if ( this.m_is_edit ) {
      done_edit(this);
    } else {
      edit(this);
    }
  }
  
  // 运行或停止
  m_start_run_click_handle(evt) {
    
    if (!this.verif_high_func()) return;
    
    if (this.m_is_runing) { // 停止运行
      return NativeService.call('stop_run'); // 停止信号
    }
    // 高级版本才有这个功能
    // Dialog.alert('不是有效的可运行文件');
    var current = this.find('east_content').current;
    if (!current) {
      //return Dialog.alert('当前没有打开的可运行文件');
      return Dialog.alert('请先打开一个可运行的文件');
    }
    // NativeService.call('run', current.get_filename());
  }
  
  m_internet_click_handle(evt) {
    this.open_web_browser();
  }
  
  m_back_res_click_handle() {
    set_layout_status(this, 2, true);
  }
  
  m_back_click_handle() {
    this.find('east_content').back();
  }
  
  m_forward_click_handle() {
    this.find('east_content').forward();
  }
  
  m_undo_click_handle() {
    var view = this.find('east_content').current;
    if (view) {
      view.undo();
    }
  }
  
  m_redo_click_handle() {
    var view = this.find('east_content').current;
    if (view) {
      view.redo();
    }
  }
  
  m_east_more_click_handle(evt) {
    // view.create('FileContentViewOption').activate(evt.sender);
  }
  
  m_toggle_click_handle() {
    this.toggle();
  }

}
