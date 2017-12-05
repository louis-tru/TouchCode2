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

import ':util/storage';
import ':util';
import ':gui/app';
//import ':wgui/view';
//import ':wgui/list';
//import ':wgui/ctrl::Ctrl';
import 'search_panel.vx';
import 'input';
import OverlayPanel from 'overlay_panel';
import 'service';
//import 'tree_panel.vx';
import TextEditor from 'text_editor';
import Range from 'req:ace/range';

function update_SerachOption_display (self) {
  
  var options = self.m_search_panel.options;
  
  if (options.search_target == 'all') {
    self.search_all_btn.add_cls('on');
    self.search_select_btn.del_cls('on');
  } else {
    self.search_all_btn.del_cls('on');
    self.search_select_btn.add_cls('on');
  }
  
  if (options.ignoring_case) {
    self.ignoring_case_btn.add_cls('on');
  } else {
    self.ignoring_case_btn.del_cls('on');
  }
  
  if (options.enable_regexp) {
    self.enable_regexp_btn.add_cls('on');
  } else {
    self.enable_regexp_btn.del_cls('on');
  }
  
  // if (options.enable_hide_file) {
  //   self.enable_hide_file_btn.add_cls('on');
  // } else {
  //   self.enable_hide_file_btn.del_cls('on');
  // }  
  
  if (options.expand_all_results) {
    self.expand_all_results_btn.add_cls('on');
  } else {
    self.expand_all_results_btn.del_cls('on');
  }
}

function release () {
  // TODO 
}

/**
 * @class SerachOption
 * @bases overlay_panel::OverlayPanel
 */
export class SerachOption extends OverlayPanel {
  // @public:
  
  // 不脆弱,不会一点击就消失
  frail: false;
  
  /**
   * 搜索面板
   * @private
   */
  m_search_panel: null;
  
  get options () {
    return this.m_search_panel.options;
  }
  
  setOptions (opt) {
    this.m_search_panel.setOptions(opt);
  }
  
  /**
   * 设置搜索面板
   */
  setSerachPanel (panel) {
    this.m_search_panel = panel;
    update_SerachOption_display(this);
  }
  
  m_search_all_click_handle () {
    this.setOptions({ search_target: 'all' });
    update_SerachOption_display(this);
  }
  
  m_search_select_click_handle () {
    this.m_search_target = 'selected';
    this.setOptions({ search_target: 'selected' });
    update_SerachOption_display(this);
  }
  
  m_ignoring_case_click_handle () {
    this.setOptions({ ignoring_case: !this.options.ignoring_case });
    update_SerachOption_display(this);
  }
  
  m_enable_regexp_click_handle () {
    this.setOptions({ enable_regexp: !this.options.enable_regexp });
    update_SerachOption_display(this);
  }
  
  m_enable_hide_file_click_handle () {
    this.setOptions({ enable_hide_file: !this.options.enable_hide_file });
    update_SerachOption_display(this);
  }
  
  m_expand_all_results_click_handle () {
    this.setOptions({ expand_all_results: !this.options.expand_all_results });
    update_SerachOption_display(this);
  }
  // @end
}


//**********************************************************************

function init (self) {
  
  self.setOptions(storage.get('search_options'));
  self.input.value = storage.get('search_key') || '';
  self.input.onenter.$on(search, self);
  
  self.search_result.onrender.on(function () {
    if (self.m_new_search) { // 最新搜索才展开
      var one = self.search_result.item(0);
      if (one) { // 展开第一个结果
        one.item.add_cls('expand');
      }
    }
  });
  
  var model = self.search_result.model;
  
  model.onasync_act.on(function (evt) {
    if (evt.data.status == 'start') {
      self.load_more_btn.hide();
      self.stop_load_btn.show();
    } else {
      // 已经结束,不需要更多
      if(!('is_end' in model.origin) || model.origin.is_end) {
        self.load_more_btn.hide();
      } else {
        self.load_more_btn.show();
      }
      self.stop_load_btn.hide();
    }
  });
  
  // search_result
  app.root.onchange_layout_status.on(function () {
    self.search_result.set_css('width', app.root.west_content.css('width'));
  });
}

function search_key (self, key) {
  
  storage.set('search_key', key); // save
  
  if (self.options.enable_regexp) { 
    // 如果启用正则匹配需要验证表达式的合法性
    try {
      new RegExp(key);
    } catch (err) {
      return Dialog.error('查询表达式格式错误,如果只是普通查询可禁用正则表达式');
    }
  }

  //self.search_result.empty(); // 先清空原先的数据显示
  // self.ds.clear_data(); // 先清空原先的数据显示
  
  self.m_select_result = null;
  
  var list = self.search_result;
  var path = '';
  
  if (self.options.search_target == 'selected') {
    var node = app.root.res.selectedNode();
    if (node) { // 把当前选中的文件做为搜索的目标
      path = node.path;
    } else {
      self.setOptions({ search_target: 'all' }); // 没有搜索项时搜索全部文件
    }
  }
  
  list.model.data = []; // 先清空当前数据
  
  list.model.args = {
    options: self.options,
    path: path, 
    key: key,
    start: 0,
    ignore_cur: true,
  };
  list.model.seek(0, 50);
  self.input.blur();
  //NativeService.call('close_soft_keyboard');
}

function search (self) {
  self.m_new_search = true;
  var key = self.input.value;
  if (!key) {
    return;
  }
  self.input.dom.blur();
  search_key(self, key);
}

/**
 * @class SearchPanel
 * @extends Scroll
 */
export class SearchPanel extends Ctrl {
  // @private:
  /**
   * 选择的搜索结果
   * @private
   */
  m_select_result: null;
  
  // 新的搜索,点击继续搜索按钮,
  // 这个状态会设置成false,点击搜索设置成true
  m_new_search: true;
  
  /**
   * 搜索选项
   * @private
   */
  m_options: null;
  
  // @public:
	/**
	 * @constructor
	 */
  constructor () {
    Ctrl.call(this);
    this.onload_view.$on(init);
    
    this.m_options = {
      search_target: 'all', // all | selected
      ignoring_case: true,
      enable_regexp: false,
      enable_hide_file: false,
      expand_all_results: true // 查询的结果全部展开
    };
  }
  
  get options () {
    return this.m_options;
  }
  
  setOptions (opt) {
    util.extend(this.m_options, opt);
    storage.set('search_options', this.m_options); // save
  }
  
  /**
   * is_focus 是否聚焦到输入框
   */
  focus () {
    // var self = this;
    // (function (){
    //  self.input.focus();
    // }).delay(100);
  }

  /**
   * 取消焦点
   */
  blur () {
    this.input.blur();
  }
  
  /**
   * 搜索
   */
  search (key) {
    search_key(this, key);
  }
  
  m_select_btn_click_handle (evt) {
    var opt = view.create('SerachOption');
    opt.setSerachPanel(this);
    opt.activate(evt.sender);
  }
  
  m_select2_btn_click_handle () {
    search(this);
  }
  
  m_input_entrt_handle () {
    search(this);
  }
  
  m_item_node_click_handle (evt) {
    evt.sender.parent.toggle_cls('expand');
  }
  
  m_result_click_handle (evt) {
    
    if (this.m_select_result) {
      this.m_select_result.del_cls('on');
    }
    this.m_select_result = evt.sender;
    this.m_select_result.add_cls('on');
    
    var sender = evt.sender;
    var list = sender.top.list;
    var path = list.attr('path');
    var name = (path ? path + '/': '') + list.attr('name');
    var start_row = parseInt(sender.attr('row'));
    var start_column = parseInt(sender.attr('start'));
    var length = parseInt(sender.attr('length'));
    
    var view = app.root.east_content.open(name);
    if (view && view instanceof TextEditor) {
      // 成功打开文本文件
      var ace_session = view.session;
      var ace_selection = ace_session.getSelection();
      var ace_document = ace_session.getDocument();
      
      var end_row = start_row;
      var end_column = start_column + length;
      var line_length = ace_document.getLength();
      
      for (var i = start_row; i < line_length; i++) {
        var row_length = ace_document.getLine(i).length;
        if (end_column <= row_length) {
          break;
        }
        else {
          end_row++; // 增加一行
          end_column = end_column - row_length - 2; // 两个字符分别是 \r\n
        }
      }
      var range = new Range(start_row, start_column, end_row, end_column);
      util.next_tick(function () {
        ace_selection.setRange(range); // 选中代码
        view.core.centerSelection(); 
      });
    }
  }
  
  // 载入更多
  m_load_more_btn_click_handle () {
    var list = this.search_result;
    if (list.model.args.key) { // 没有key时不用理会
      this.m_new_search = false;
      list.model.args.options = this.options;
      list.model.args.start = list.model.origin.end;
      list.model.seek(0, list.model.data.length + 50);
    }
  }
  
  // 停止载入
  m_stop_load_btn_click_handle (){
    this.search_result.model.abort(); // 取消数据载入
    //APIService.call('stop_find');
  }
  // @end
}

//********************************************

function init_SearchOuterPanel (self) {
  // search
  self.search.on('scroll', function () {
    // TODO ? setting top btn 
    // console.nlog(self.search.dom.scrollTop);
    var value = Math.min(0.7, Math.max(0, (self.search.dom.scrollTop - 500) / 500));
    set_return_top_btn_lightness(self, value);
  });
}

// 设置按钮明亮度
function set_return_top_btn_lightness (self, value) {

  if (value == self.m_return_top_btn_lightness) {
    return;
  }
  
  if (value === 0) { // 从影藏到显示
    self.return_top_btn.show();
  }
  else if (self.m_return_top_btn_lightness === 0) { // 从显示到影藏
    self.return_top_btn.show();
  }
  
  self.m_return_top_btn_lightness = value;
  self.return_top_btn.set_css('opacity', value);
}

/**
 * @class SearchOuterPanel
 * @bases :wgui/ctr::Ctrl
 */
export class SearchOuterPanel extends Ctrl {
  
  m_return_top_btn_lightness: 0.0;
  
	/**
	 * @constructor
	 */
  constructor () {
    Ctrl.call(this);
    this.onload_view.$on(init_SearchOuterPanel);
  }
  
  m_return_top_click_handle () {
    this.search.dom.scrollTop = 0;
  }
  // @end
}
