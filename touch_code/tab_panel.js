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

import 'ngui/util';
import 'ngui/event';
//import ':gui/app';
//import ':wgui/ctrl::Ctrl';
//import ':wgui/view';
//import ':wgui/node::Node';
//import 'tab_panel.vx';

function init_TabButton (self) {
  self.more_btn.on(util.env.touch ? 'touchstart' : 'mousedown', function (evt){
    evt.return_value = false;
  });
}

/**
 * @class TabButton
 * @bases Ctrl
 * @vtags TabButton 
 */
export class TabButton extends Ctrl {
  
  // 面板
  m_tab = null;
  
  /**
	 * @constructor
	 */
  constructor () {
    Ctrl.call(this);
    this.onload_view.$on(init_TabButton);
  }
  
  setTab (tab) {
    this.m_tab = tab;
  }
  
  setLebel (text) {
    this.label.text = text;
  }
  
  // 更多按钮点击处理
  m_more_btn_click_handle (evt) {
    //evt.return_value = false;
  }
  
  // 关闭按钮处理器
  m_close_btn_click_handle () {
    this.m_tab.remove();
  }
  
}

//--------------------------------------

/**
 * 激活tab
 */
function activateTab (self) {
  self.top.activate(self);
}

function init (self) {
  if(util.env.touch){
    self.m_tab_button.$on('touchstart', activateTab, self);
  }
  else{
    self.m_tab_button.$on('mousedown', activateTab, self);
  }
}

/**
 * @class Tab
 * @extends Ctrl
 */
export class Tab extends Ctrl {
  
  // private:
  m_name = '';         // 标签名称
  m_tab_button = null; // 标签按钮
  
  /**
   * 激活标签事件
   * @event onactivate
   */
  event onactivate;
  
  /**
   * 标签沉默事件
   * @event onreticent
   */
  event onreticent;
  
  /**
	 * @constructor
	 */
  constructor (tag){
    Ctrl.call(this, tag);
    // event.init_events(this, 'activate', 'reticent');
    this.m_tab_button = view.create('TabButton');
    this.m_tab_button.setTab(this);
    init(this);
  }
  
  get tab_button(){
    return this.m_tab_button;
  }
  
  /**
   * 获取标签的名称
   */
  get name(){
    return m_name;
  }
  
  /**
   * 设置标签的名称
   */
  set name(value){
    this.m_name = value;
    this.m_tab_button.setLebel(value);
  }
  
  /**
   * 返回面板
   */
  get tab_panel(){
    return this.top;
  }
  
  /** 
   * 删除标签
   */
  remove (){
    this.m_tab_button.remove(); // 删除
    Node.members.remove.call(this);
  }
  
  /**
   * 重写
   */
  append_to (parent, id){
    
    if(parent.parent instanceof TabPanel){
      if(id){
        this.id = id;
      }
      parent.parent.add(this); // 加入到面板
    }
    else {
      throw new Error('tab 标签只能加入到TabPanel中');
    }
  }
  
}

//----------------------------------------

function change_layout_status_handle (self) {
  self.content.set_css('height', self.parent.east_size.height + 'px');
  if(app.root.layout_status == 1){
    self.toggle_btn.add_cls('on');
  }
  else{
    self.toggle_btn.del_cls('on');
  }
  update(self);
}

function init_TabPanel (self) {
  change_layout_status_handle(self);
  app.root.onchange_layout_status.$on(change_layout_status_handle, self);
}

function release_TabPanel (self) {
  app.root.onchange_layout_status.off(change_layout_status_handle, self);
}

/**
 * tab 标签事件处事器
 * @private
 */
function release_TabEventHandle (self, evt) {

  var tabs = self.m_tabs;
  var index = tabs.indexOf(evt.sender);
  
  if(evt.sender === self.m_active_tab){
    self.m_active_tab.onreticent.notice();
    self.m_active_tab = null;
  }
  
  tabs.del_value(evt.sender);
  
  if(tabs.length){
    if(tabs.length > index){
      self.activate(tabs[index]);
    }
    else if(index > 0){
      self.activate(tabs[index - 1]);
    }
  }
  
  self.ontabchange.notice();
}

/**
 * 更新面板状态
 */
function update (self) {
  
  var tabs = self.m_tabs;
  
  if(!tabs.length){
    return;
  }
  var total_btns_width = self.parent.east_size.width - 44; // 总宽度
  var min_tab_button_width = 70; // 最小 tab button 宽度
  var more = false; // 是否要显示more按钮
  
  // 当前显示的按钮数量,最少也需要显示一个按钮
  var display_tab_btn_count = 
    Math.max(Math.floor(total_btns_width / min_tab_button_width), 1);
  
  // 大于实际按钮大于可显示的数量
  if(tabs.length > display_tab_btn_count){ 
    more = true; // 这里需要显示more按钮
    total_btns_width -= 30; // 这30像素用来显示more按钮
    self.btns.set_css('margin-left', '30px');
  }
  else{
    display_tab_btn_count = tabs.length;
    self.btns.set_css('margin-left', '0px');
  }
  
  // 实际按钮宽度,最小也要不能小于 min_tab_button_width 
  var tab_btn_width = 
    Math.max(total_btns_width / display_tab_btn_count, min_tab_button_width); 
  var tab_btn_width_percent = 100 / display_tab_btn_count;
  // 
  self.m_display_tab_btn_count = display_tab_btn_count;
  self.m_tab_btn_width = tab_btn_width;
  //
  
  var active_tab = self.m_active_tab;
  var active_tab_index = tabs.indexOf(active_tab);
  // 如果当前激活的标签超出显示范围,强制调整为可显示范围
  if(active_tab_index >= display_tab_btn_count){
    tabs.splice(active_tab_index, 1);
    tabs.splice(display_tab_btn_count - 1, 0, active_tab);
  }
  
  for(var i = 0; i < display_tab_btn_count; i++){
    var tab = tabs[i];
    tab.tab_button.style = {
      width: tab_btn_width_percent + '%', 
      right: tab_btn_width_percent * i + '%'
    };
    tab.hide();
    tab.tab_button.del_cls('on');
    tab.tab_button.del_cls('more');
    tab.tab_button.show();
  }
  
  // 隐藏不需要显示的标签
  for(var i = display_tab_btn_count; i < tabs.length; i++){
    var tab = tabs[i];
    tab.hide();
    tab.tab_button.hide();
  }
  
  // 显示更多
  if(more){
    tabs[display_tab_btn_count - 1].tab_button.add_cls('more');
  }
  
  active_tab.tab_button.add_cls('on');
  active_tab.show();
}

/**
 * @class TabPanel
 * @bases :wgui/ctrl::Ctrl
 */
export class TabPanel extends Ctrl {
  
  // @private:
  
  m_active_tab            = null;   // 当前激活的标签
  m_tabs                  = null;   // 当前面板中的所有标签
  m_display_tab_btn_count = 0;      // 当前显示的按钮数量
  m_tab_btn_width         = 0;      // 当前tab btn 的宽度
  
  // @public:
  
  /**
   * @tab变化事件
   * @event ontabchange
   */
  event ontabchange;
  
  /**
	 * @constructor
	 */
  constructor () {
    Ctrl.call(this);
    // event.init_events(this, 'tabchange');
    this.onload_view.$on(init_TabPanel);
    this.$on('release', release_TabPanel);
    this.m_tabs = [];
  }
  
  /**
   * 添加一个标签
   */
  add (tab) {
    
    if (this.m_tabs.indexOf(tab) == -1) {
      this.m_tabs.push(tab);

      // 添加 title item
      tab.tab_button.append_to(this.btns);
      
      // 添加 content
      this.content.append(tab);
      tab.$on('release', release_TabEventHandle, this); //添加事件侦听
      
      if (this.m_active_tab) { 
        update(this);
      }
      else {
        // 如果当前没有激活的标签激活它
        this.activate(tab);        
      }
    }
    else {
      throw new Error('标签已经添加过了');
    }
  }
  
  /**
   * 激活一个标签
   */
  activate (tab) {
    
    if (tab instanceof Tab) {
      if (tab !== this.m_active_tab) {
        if (this.m_active_tab) {
          this.m_active_tab.onreticent.notice(); //触发沉默事件
        }
        this.m_active_tab = tab;
        update(this);
        tab.onactivate.notice(); //触发激活事件
        this.ontabchange.notice();
      }
    }
    else {
      throw new Error('只能激活 teide.touch.Tab ');
    }
  }
  
  /**
   * 当前激活的标签
   */
  getActiveTab () {
    return this.m_active_tab;
  }
  
  /**
   * 获取标签列表
   */
  get tabs () {
    return this.m_tabs;
  }
  
  /**
   * 切换
   */
  m_toggle_click_handle () {
    this.parent.toggle();
  }
  
}
