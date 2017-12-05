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
import EventNoticer as EventDelegate from ':util/event';
//import ':wgui/display_port';
//import ':wgui/view';
//import ':wgui/ctrl::Ctrl';
//import 'input.vx';

function update (self) {
	self.m_delayid = 0;
  if (!self.input) return;
  
  if(self.input.value){
    self.clear_btn.show();
  } else {
    self.clear_btn.hide();
  }
  if (self.value === '' && self.desc) {
    self.desc_div.show();
  } else {
    self.desc_div.hide();
  }
  self.onchange.notice();
}

function init (self) {

  self.on('click', function (){
    self.input.dom.focus();
  });
  //
  self.input.on('keyup', function (evt){
    var keyCode = evt.data.keyCode;
    switch(keyCode){
      case 13:
        self.onenter.notice();
        break;
      case 27:
        self.onesc.notice();
        break;
    }
    update(self);
  });
  
  self.input.on(['copy', 'cut', 'paste', 'change', 'input'], function (){
  	if(self.m_delayid){
  		util.clear_delay(self.m_delayid);
  	}
    self.m_delayid = update.delay(50, self);
  });

  self.input.on('focus', function (){
    if (global.FastNativeService && FastNativeService.is_support()) {
      FastNativeService.call('force_browser_focus');
    }
    self.onfocus.notice();
  });
  self.input.on('blur', function () {
    self.onblur.notice();
  });
  
  update(self);

  self.$on('release', release);
}

function release (self) {
  util.clear_delay(self.m_delayid);
}

/**
 * 单行文本输入框
 * @class Input
 * @extends Ctrl
 */
export class Input extends Ctrl {
  
  m_delayid: 0;
  m_font_size: 14;
  m_desc: '';
  
  /**
   * @event onenter # 回车事件
   */
  event onenter;
  
  /**
   * @event onesc # Esc 事件
   */
  event onesc;
  event onfocus;
  event onblur;
  event onchange;
  
	/**
	 * @constructor
	 */
  constructor () {
    super();
    this.set_css('border-width', display_port.device_pixel_1px + 'px');
    this.onload_view.$on(init);
  }
  
  get fontSize () {
    return this.m_font_size;
  }
  
  set fontSize (value) {
    this.m_font_size = value;
    this.input.set_css('font-size', value + 'px');
    this.set_css('font-size', value + 'px');
  }
  
  get desc () {
    return this.m_desc;
  }
  
  set desc (value) {
    this.m_desc = value;
    this.desc_text.text = value;
  }
  
  get value () {
    return this.input.value;
  }
  
  set value (value) {
    this.input.value = value;
    update(this);
  }
  
  select () {
    this.input.dom.select();
  }
  
  focus () {
    this.input.dom.focus();
  }
  
  get max_length () {
    return this.input.attr('maxlength');
  }
  
  set max_length (value) {
    this.input.attr('maxlength', value);
  }
  
  get type () {
    return this.input.attr('type');
  }
  
  set type (value) {
    this.input.attr('type', value);
  }
  
  /**
   * 失去焦点
   */
  blur () {
    this.input.dom.blur();
  }
  
  /**
   * 清空文本
   */
  clear () {
    this.input.value = '';
    update(this);
    this.clear_btn.hide();
  }
  // @end
}
