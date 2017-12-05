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

//import ':gui/app';
import ':util';
import ':util/event';
//import ':wgui/node';
//import ':wgui/node::Node';
//import ':wgui/ctrl::Ctrl';
//import ':truth/loc::tag';
import Editor from 'editor';
import 'edit_session';
import EditSession from 'edit_session';
import FileContentView from 'file_content_view';
import 'preferences_view';
import VirtualRenderer from 'req:ace/virtual_renderer';
import UndoManager from 'req:ace/undomanager';
import TouchNativeTextInput from 'req:ace/touch/native_textinput';
import TextInputDelegate from 'req:ace/touch/native_textinput';
import 'req:ace/touch/overlay_panel';

overlay_panel.tag = tag;

var MAX_COLUMN = 80;
var FOLDS_SAVE_DELAY_TIME = 1e4; //毫秒
var editor = null; // ace editor core
var editor_wait_container = null;

function init_text_tnput_delegate (self) {
  FastNativeService.onace_text_input_focus.on(function () {
    self.input.onfocus();
  });
  FastNativeService.onace_text_input_blur.on(function () {
    self.input.onblur();
  });
  FastNativeService.onace_text_input_input.on(function (evt) {
    self.input.oninput(evt.data);
  });
  FastNativeService.onace_text_input_backspace.on(function () {
    self.input.onbackspace();
  });
  FastNativeService.onace_text_input_indent.on(function () {
    self.input.onindent();
  });
  FastNativeService.onace_text_input_outdent.on(function () {
    self.input.onoutdent();
  });
  FastNativeService.onace_text_input_comment.on(function () {
    self.input.oncomment();
  });
  FastNativeService.onace_text_input_composition_start.on(function (evt) {
    self.input.oncomposition_start(evt.data);
  });
  FastNativeService.onace_text_input_composition_update.on(function (evt) {
    self.input.oncomposition_update(evt.data);
  });
  FastNativeService.onace_text_input_composition_end.on(function (evt) {
    self.input.oncomposition_end(evt.data);
  });
}

export class TCTextInputDelegate extends TextInputDelegate {

  m_editor: null;
  m_input: null;

  constructor (editor, input) {
    this.m_editor = editor;
    this.input = input;
    input.delegate = this;
    init_text_tnput_delegate(this);
  }

  focus (input) {
    FastNativeService.call('ace_textinput_focus');
  }

  blur (input) {
    FastNativeService.call('ace_textinput_blur');
  }
  
  set_can_delete (value) {
    FastNativeService.call('ace_textinput_set_can_delete', value);
  }

}

function center_selection () { // 选中的在中心显示

  var pos = editor.getCursorPositionScreen();
  var line = pos.row;
  var renderer = editor.renderer;
  var top = renderer.getScrollTopRow();
  var bottom = renderer.getScrollBottomRow();

  if(line < top || line > bottom){
    editor.centerSelection();
  }
}

function update_editor () {
  var main = app.root;
  var size = main.east_size;
  if (main.layout_status == 2) { // 状态2编辑器为不可见状态
    // editor.blur();
  } else {
    // Dialog.alert('width:' + size.width + ', height:' + size.height);
    // console.nlog('width:' + size.width + ', height:' + size.height);
    node.$(editor.container).set_css('width', size.width + 'px');
    editor.resize(true); // size.width, size.height
    
    // 打开键盘打开时调整光标中心显示
    // if (teide.touch.MainViewport.share().is_open_soft_keyboard) {
    center_selection();
    // } else {

    // }
  }
}

/*
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 * because the buffer-to-string conversion in `fs.readFileSync()`
 * translates it to FEFF, the UTF-16 BOM.
 */
function stripBOM (content) {
  //0xFEFF
  //0xFFFE
  var c = content.charCodeAt(0);
	if (c === 0xFEFF || c == 0xFFFE) {
		content = content.slice(1);
	}
	return content;
}

function set_editor_preferences (editor) { 
  
  var preferences = preferences_view.get_preferences();
  
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
}

function get_ace_text_editor () {
  
	if (editor) return editor;
  
  var main = app.root;
	var container = new Ctrl('div');
	container.style = { width: main.east_size.width + 'px', height: '100%' };
	editor_wait_container = node.create('div');
	editor_wait_container.set_css('display', 'none');
	editor_wait_container.append(container);
	editor_wait_container.append_to(main);
	
	var renderer = new VirtualRenderer(container.dom);
  if (main.ios_native) {
    editor = new Editor(renderer, new EditSession('', ''), TCTouchNativeTextInput);
    new TCTextInputDelegate(editor, editor.textInput);
  }
  else {
    editor = new Editor(renderer, new EditSession('', '')); 
  }
	editor.setFontSize(14);
	editor.setOption('showFoldWidgets', !util.env.touch); // 代码折叠快暂时禁用
	editor.setOption('highlightActiveLine', false);
	renderer.setPrintMarginColumn(MAX_COLUMN);
  
  main.onbefore_change_layout_status.on(function (){
    var status = main.layout_status;
    if(status == 2){ // 状态2编辑器为不可见状态
      editor.blur();
    } else if(status === 0) {
      update_editor();
    }
  });
	main.onchange_layout_status.on(update_editor);
	
	preferences_view.onpreferences_change.$on(set_editor_preferences, editor);

	set_editor_preferences(editor);
  
  NativeService.on('clipboard_data_change', function (evt) {
    editor.setOption('clipboardData', evt.data); // 更新剪贴板
  });
  
  editor.on('activate_touch_magnifier', function (evt) {
    // NativeService.call('activate_touch_magnifier', [evt.x, evt.y]);
    FastNativeService.call('ace_touch_magnifier_start', evt.x, evt.y);
  });
  
  editor.on('stop_touch_magnifier', function () {
    //NativeService.call('stopTouchMagnifier');
    FastNativeService.call('ace_touch_magnifier_stop');
  });
  
  editor.on('touch_magnifier_move', function (evt) {
    FastNativeService.call('ace_touch_magnifier_move', evt.x, evt.y);
  });
  
  // 设置是否立即捕获焦点
  editor.setOption('immediateFocus', 
    preferences_view.get_preferences_item('enable_touch_focus'));
    
  editor.on('open_url', function (url) {
    // alert(url);
    main.open_web_browser(url);
  });
  
  // console.nlog('ace editor init');
  
	editor.commands.addCommands([{
    name: "copy",
    readOnly: true,
    exec: function (editor) {
      var range = editor.getSelectionRange();
      editor._emit("copy", range);
      if(!range.isEmpty()){
      	NativeService.call('set_ace_clipboard_data', editor.getOption('clipboardData'));
    	}
  	},
    scrollIntoView: "cursor",
    multiSelectAction: "forEach"
	},{
    name: "cut",
    exec: function (editor) {
      var range = editor.getSelectionRange();
      editor._emit("cut", range);
      if (!range.isEmpty()) {
				NativeService.call('set_ace_clipboard_data', editor.getOption('clipboardData'));
				editor.clearSelection();
        editor.session.remove(range);
      }
    },
    scrollIntoView: "cursor",
    multiSelectAction: "forEach"
	}]);

	return editor;
}

function savingFolds (self) {
	if (!self.m_is_ready) {
	  return;
	}
	var folds = self.session.get_transform_folds();
	FileActionService.call('save_text_folds', self.get_filename(), folds, util.noop);
}

function saveFolds (self) {
	cancel_save_folds(self);
	self.m_folds_save_timeout_id = 
	  savingFolds.delay(FOLDS_SAVE_DELAY_TIME, self);
}

function cancel_save_folds(self) {
	util.clear_delay(self.m_folds_save_timeout_id);
}

var IgnoreChange = false;

function sessionChangeEventHandle (self, evt) {
  if(!IgnoreChange){
    self.m_is_change = true;
    (function (){ self.onchange.notice() }.delay(20));
  }
}

function sessionChangeBreakpointEventHandle (self, evt) {
  if(!self.m_is_ready){
	  return;
	}
  var breakpoints = self.m_session.get_transform_breakpoints();
	FileActionService.call( 'save_text_breakpoints', 
	                        self.get_filename(), breakpoints, util.noop);
}

/**
 * 所有的UndoManager
 * @static
 * @private
 */
var undos = [];

function getUndoManager (self, name) {
  
  var index = undos.index_of_inl('name', name);
  if (index != -1) {
    return undos[index].undo;
  }

  if (undos.length > 50) {
    // 最多可以保存50个对像
    undos.shift();
  }
  
  var undo = new UndoManager();
  undos.push({ name: name, undo: undo });
  return undo;
}

/**
 * 所有的session
 * @static
 * @private
 */
var sessions = [];

var isInitConsoleLogMonitor = false;

function initConsoleLogMonitor () {
  isInitConsoleLogMonitor = true;
  
  // 监控日志,如果当前缓存的session被更新,需更新缓存的session
  FileActionService.on('console_log', function (evt){
    
    var log = evt.data;
    var type = { 'U ': 'U', 'D ': 'D'/*, '! ': 'U'*/ }[log.substr(0, 2)];
    if(!type) return;

    // 有文件被更新或删除
    var name = log.substr(2).replace(/^\s*local\s+/, '');
    
    // 更新session
    for(var i = 0; i < sessions.length; i++){
      var session = sessions[i];

      if(type == 'U'){
        if(session.name == name){
          if(editor.session === session.session){
            // 更新重新加载文件内容
            APIService.call2.delay(APIService, 500, 
              'read_file_as_text', name, function (data) {
              IgnoreChange = true;
              editor.session.setValue(stripBOM(data.code)); // 
              IgnoreChange = false;
            });
          } else{
            sessions.splice(i, 1); // 删除
            session.session.destroy(); // 删除session
            i--;
          }
        }
      } else if (session.name.indexOf(name) === 0) {
        sessions.splice(i, 1); // 删除
        session.session.destroy(); // 删除session
        i--;
      }
    }
  });
}

function get_session (self, name) {
  
  var index = sessions.index_of_inl('name', name);
  if (index != -1) {
    self.ready();
    var session = sessions[index].session;
    self.setReadOnly(session.readonly);
    return session;
  }
  
  try {
    
    if (!isInitConsoleLogMonitor) {
      initConsoleLogMonitor();
    }
    
    var data = APIService.call_sync('read_file_as_text', name);
    
    // 最多可以保存5个对像
    if (sessions.length > 5) {
      sessions.shift().session.destroy();
    }
    
    var session = new EditSession(stripBOM(data.code), name);
    session.setUndoManager(new UndoManager());
    session.setBreakpoints(data.breakpoints);
    session.add_folds_by_range(data.folds);
  	sessions.push({ name: name, session: session });
  	session.readonly = data.readonly;
  	session.is_run = data.is_run;
  	
  	self.setReadOnly(session.readonly);
  	
  	self.ready();
  	
  	return session;
  } catch (err) {
    // console.nlog('====================', name, err.message);
    return new EditSession('', name);
  }
}

function onblur_handle (self) {
  self.save(true); // 强制保存
}

function init (self, name) {

  var editor = self.core;
  var session = self.getSession(name);
	self.m_session = session;
	
	self.m_sessionChangeEventHandle = sessionChangeEventHandle.bind(null, self);  
	session.on('change', self.m_sessionChangeEventHandle);
	
	self.m_saveFolds = saveFolds.bind(null, self);
	session.on('changeFold', self.m_saveFolds);
	
	self.m_sessionChangeBreakpointEventHandle = 
	  sessionChangeBreakpointEventHandle.bind(null, self);
	session.on('changeBreakpoint', self.m_sessionChangeBreakpointEventHandle);
  
  self.$on('release', release);
  self.append(node.$(editor.container));
  editor.setSession(session);
  editor.onblur.$on(onblur_handle, self);
  
	//editor.focus();
	update_editor(self);

  var preferences = preferences_view.get_preferences();
  
  session.setTabSize(preferences.indent_width);
  // session.setUseSoftTabs(false); // 不使用软tab
  session.setUseSoftTabs(true); // 使用软tab
  session.setOption("wrap", preferences.enable_auto_line ? 'free' : 'off');
  
	self.m_save_timeout_id = setInterval(self.save.bind(self), 5000); // 定时5秒保存
}

function release (self) {
  
  clearInterval(self.m_save_timeout_id);
  self.save(); // 保存
  
  var editor = self.core;
  editor.onblur.off(onblur_handle, self);
  
  if (!self.m_rm_hold_blur) { // 保持焦点
    editor.blur(); 
  }
  
  var session = self.m_session;
  session.off('change', self.m_sessionChangeEventHandle);
  session.off('changeFold', self.m_saveFolds);
  session.off('changeBreakpoint', self.m_sessionChangeBreakpointEventHandle);
  
  editor.setSession(new EditSession());
  if (editor_wait_container) {
    editor_wait_container.append(node.create(editor.container));
  }
}

/**
 * @class TextEditor
 * @extends FileContentView
 */
export class TextEditor extends FileContentView {
  
  // private:
	m_folds_save_timeout_id: 0;
	m_save_timeout_id: 0; // 定时保存句柄
	m_saved: false;       // 是否正在保存中
	m_session: null;
	m_core: null;
	m_is_change: false;
	m_is_ready: false;  // 如果这个没有准备好,不能保存
	m_modify: false;    // 文件最终是否变更过
	m_rm_hold_blur: false; // 删除保持焦点
	
  /**
	 * @constructor
	 */
	constructor () {
    FileContentView.call(this);
    this.m_core = get_ace_text_editor();
	}
	
	/**
	 * 初始化
	 */
	init (name) {
	  init(this, name);
	  this.set_filename(name);
	}
	
	/**
	 * 准备
	 */
	ready () {
	  this.m_is_ready = true;
	}
	
	/**
	 * 是否变化
	 */
	get modify () {
	  return this.m_modify;
	}
	
  /**
	 * 获取文本编辑 session
	 */
  get session () {
    return this.m_session;
  }
  
  // overwrite
  is_run () {
    return !!this.session.is_run;
  }
  
  // overwrite
  undo () {
    return this.session.getUndoManager().undo();
  }
  
  // overwrite
  redo () {
    return this.session.getUndoManager().redo();
  }
  
  // overwrite
  hasUndo () {
    return this.session.getUndoManager().hasUndo();
  }
  
  // overwrite
  hasRedo () {
    return this.session.getUndoManager().hasRedo();
  }
  
	/**
	* 设置运行调式断点
	*/
	set_debug_break (data) {
		this.m_session.set_debug_break(data.row, data.startColumn, data.endColumn);
	}
  
	/**
	 * 清除运行调式断点
	 */
	clear_debug_break () {
		this.m_session.clearDebugBreak();
	}
	
	get core() {
	  return this.m_core;
	}
  
	/**
	 * 是否为只读
	 */
	getReadOnly () {
		return this.core.getReadOnly();
	}
	
	setReadOnly (val) {
    if (val) {
      this.core.blur();
    }
	  this.core.setReadOnly(val);
	}
  
	/**
	* save file
	* @param {boolean} force save
	*/
	save (force) {

	  if (!this.m_is_change) { // 只有发生了变化才需要保存
	    return;
	  }
	  
	  if (!this.m_is_ready) { // 没有准备好文件
	    return;
	  }
	  
	  if (!force && this.m_saved) { // 正在保存中
	    return;
	  }

		cancel_save_folds(this);
    
		var self = this;
		var session = this.m_session;
		var code = session.getValue();
		var breakpoints = session.get_transform_breakpoints();
		var folds = session.get_transform_folds();
		
		this.m_saved = true;
		this.m_is_change = false;
		
		FileActionService.call('save_file_as_text', 
		  this.get_filename(), code, { breakpoints: breakpoints, folds: folds }, 
		  util.finally(function (err, info) {
		  self.m_saved = false;
		  if (err) {
  			return Dialog.error(err.message);
		  }
		  var path = self.get_filename();
		  // var node = app.root.res.find(path);
		  // if (node) {
		  //   node.info = info;
		  // }
		  self.m_modify = true;
		}));
	}
	
	getSession (name) {
	  return get_session(this, name);
	}
  
	/**
	 * 设置文件名称
	 */
	set_filename (value) {
	  FileContentView.members.set_filename.call(this, value);
	  var mode = edit_session.get_mode_by_name(value);
	  if (this.m_session.getMode() != mode) {
	    this.m_session.setMode(mode);
	  }
	}
	
	// 捕获焦点
	focus () {
    // because we have to call event.preventDefault() any window on ie and iframes 
    // on other browsers do not get focus, so we have to call window.focus() here
    if (!document.hasFocus || !document.hasFocus())
        window.focus();
		this.core.focus();
	}
  
	// 
	blur () {
		this.core.blur();
	}
	
	/**
	  * 删除并持有焦点
	  */
	remove_hold_blur () {
	  this.m_rm_hold_blur = true;
	  this.remove();
	}
	
	/**
	* 设置编辑器主题
	* @param {String} name
	*/
	setTheme (name) {
		this.core.setTheme(name);
	}
  // @end
}

exports = {

  stripBOM: stripBOM,

  /**
   * 获取ace core
   */  
  get core () {
    return editor;
  },
};
