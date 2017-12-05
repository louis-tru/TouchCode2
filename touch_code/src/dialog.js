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
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * ***** END LICENSE BLOCK ***** */

import ':util';
//import ':truth/loc';
//import ':wgui/window::Window');
//import ':wgui/dialog::Dialog as wgui_Dialog');
//import ':wgui/view');
//import 'dialog.vx');
import Button from 'button';
import DialogButton from 'button';
import 'input';

var wgui_Window_show = Window.members.show;
var wgui_Window_hide = Window.members.hide;
var wgui_Window_close = Window.members.close;

/**
 * @class BasicDialog
 * @bases Dialog
 */
export class BasicDialog extends wgui_Dialog {

  /**
   * 是否显示
   * @private
   */
  m_is_show: false;
  
  /**
   * dialog的宽度
   * @private
   */
  m_width: 262;
  
  /**
   * 设置为true时点击dialog外部就会关闭
   */
  frail: false;
  
  /**
   * 显示dialog
   */
  show() {
    wgui_Window_show.call(this);
    this.set_css('display', '');
    this.add_cls('show');
    this.m_is_show = true;
    this.bg.animate({ opacity: 0.3 }, 200);
    if (util.env.ios) {
      if(util.env.ipad) {
        this.box.set_css('width', '380px');
      }
      else {
        this.box.set_css('width', '90%');
      }
    }
    this.box.animate({ transform: 'scale(0, 0)', opacity: 0.01 }, 0);
    this.box.style = { transform: 'scale(0, 0)', opacity: 0.01 };
    this.box.animate({ transform: 'scale(1, 1)', opacity: 1 }, 200);
  }
  
  /**
   * 隐藏dialog
   */
  hide () {
    self.m_is_show = false;
    self.bg.animate({ opacity: 0.01 }, 200);
    self.box.animate({ transform: 'scale(0, 0)', opacity: 0.01 }, 200, function () {
      if (!self.m_is_show)
        wgui_Window_hide.call(self);
    });
  }
  
  /**
   * 关闭dialog
   */
  close () {
    this.hide();
    this.onhide.once(function () {
      wgui_Window_close.call(this);
    });
  }
  
  get width () {
    return this.m_width;
  }
  
  set width (value) {
    // /262
    this.m_width = value;
    this.box.set_css('width', value + 'px');
  }
  
  m_bg_click_handle () {
    if (this.frail) {
      this.close();
    }
  }
  // @end
}

//--------------------------------------------------
//dialog

function init_DialogMaster (self) {
  if (self.buttons.length) {
    self.buttons_box.del_cls('hide');
  }
}

/**
 * @class Dialog
 * @bases BasicDialog
 */
export class Dialog extends BasicDialog {
  
	/**
	 * @constructor
	 */
  constructor (tag) {
    BasicDialog.call(this, tag);
    this.onload_view.$on(init_DialogMaster);
  }
  
  get title () {
    return this.title_box.html;
  }
  
  set title (value) {
    this.title_box.html = loc(value);
    if (value) {
      this.title_box.show();
    }
    else{
      this.title_box.hide();
    }
  }
  
  get content () {
    return this.content_box.html;
  }
  
  set content (value) {
    this.content_box.html = loc(value).replace(/\n/g, '<br/>');
  }
  
  get buttons () {
    return this.buttons_box.children.filter(function (el) { 
      return el instanceof Button;
    });
  }
  
  set buttons (buttons) {
    if (!util.is_array(buttons)) { //不为数组
      var btns = [];
      for (var name in buttons) {
        var btn = new DialogButton();
        btn.value = loc(name);
        btn.on('click', buttons[name]);
        btns.push(btn);
      }
      buttons = btns;
    }
    
    var buttons_box = this.buttons_box;
    
    buttons_box.empty();
    
    if (buttons.length) {
      buttons_box.del_cls('hide');
    } else {
      buttons_box.hide();
      buttons_box.add_cls('hide');
    }
    (buttons || []).forEach(function (b) {
      b.on('click', Dialog.close);
      b.append_to(buttons_box);
    });
  }
  // @end
}

exports = {
  
  /**
   * 显示对话框
   * @param {String}            text               内容
   * @param {String}            title   (Optional) 标题
   * @param {Object}            buttons (Optional) 按钮集合
   */
  show: function (text, title, buttons) {
    var dag = view.create('EmptyShareDialog');
    dag.title = title || '';
    dag.buttons = buttons;
    dag.content = text;
    dag.show();
    dag.dom.focus.delay(dag.dom, 220);
  },
  
  /**
   * 警报
   * @param {String}   text 警报内容
   * @param {Function} cb (Optional) 事件处理
   */
  alert: function (text, cb) {
    text = text ? loc(text + '') : '';
    if(FastNativeService.is_support()){
      return FastNativeService.call('alert', text, cb);
    }
    exports.alert_html(text, cb);
  },
  
  alert_html: function (text, cb){
    var dag = view.create('AlertDialog');
    dag.buttons[0].on('click', cb || util.noop);
    dag.content = text || '';
    dag.show();
    dag.dom.focus.delay(dag.dom, 220);
    return dag;
  },
  
  /**
   * 错误提示
   * 显示在最上面
   */
  error: function (text, cb) {
    text = text ? loc(text + '') : '';
    if(FastNativeService.is_support()){
      return FastNativeService.call('alert', text, cb);
    }
    exports.error_html(text, cb);
  },
  
  // 
  error_html: function (text, cb){
    var dag = exports.alert_html(text, cb);
    dag.set_css('z-index', 12000);
    return dag;
  },
  
  /**
   * 确认
   * @param {String}   text 确认内容
   * @param {Function} cb 回调
   */
  confirm: function (text, cb) {
    text = text ? loc(text + '') : '';
    if(FastNativeService.is_support()){
      return FastNativeService.call('confirm', text, cb);
    }
    exports.confirm_html(text, cb);
  },
  
  //
  confirm_html: function (text, cb){
    var dag = view.create('ConfirmDialog');
    if(cb){
      dag.buttons[0].on('click', cb.bind(null, false));
      dag.buttons[1].on('click', cb.bind(null, true));
    }
    dag.content = text || '';
    dag.show();
    dag.dom.focus.delay(dag.dom, 220);
    return dag;
  },
  
  // 
  delete_file_confirm: function (text, cb){
    text = text ? loc(text + '') : '';
    if(FastNativeService.is_support()){
      return FastNativeService.call('delete_file_confirm', text, cb);
    }
    exports.delete_file_confirm_html(text, cb);
  },
  
  // 
  delete_file_confirm_html: function (text, cb){
    var dag = view.create('DeleteFileConfirmDialog');
    if(cb){
      dag.buttons[0].on('click', cb.bind(null, 0));
      dag.buttons[1].on('click', cb.bind(null, 1));
      dag.buttons[2].on('click', cb.bind(null, 2));
    }
    dag.content = text || '';
    dag.show();
    dag.dom.focus.delay(dag.dom, 220);
    return dag;
  },
  
  /**
   * 提示输入
   */
  prompt: function (text, input, cb) {
    if (typeof input == 'function') {
      cb = input;
      input = '';
    }
    
    text = text ? loc(text + '') : '';
    input = input ? loc(input + '') : '';

    if(FastNativeService.is_support()){
      return FastNativeService.call('prompt', text, input, cb);
    }

    exports.prompt_html(text, input, cb);
  },
  
  prompt_html: function (text, input, cb){
    
    if (typeof input == 'function') {
      cb = input;
      input = '';
    }
    
    text = text ? loc(text + '') : '';
    input = input ? loc(input + '') : '';
    
    var dag = view.create('PromptDialog');
    if (cb) {
      dag.buttons[0].on('click', cb.bind(null, null));
      dag.buttons[1].on('click', function (){
        cb(dag.input.value);
      });
      dag.input.onenter.on(function () {
        dag.close();
        cb(dag.input.value);
      });
      dag.input.onesc.on(function () {
        dag.close();
        cb(null);
      });
    }
    // TODO set content
    dag.prompt_text.html = text;
    dag.input.value = input;
    dag.show();
    dag.input.focus.delay(dag.input, 300);
    return dag;
  },

};

global.Dialog = exports;
