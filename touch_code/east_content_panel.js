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

//import 'east_content_panel.vx';
import ':util/storage';
import ':util';
//import ':gui/app');
import EventNoticer from ':util/event';
//import ':wgui/view';
//import ':wgui/ctrl::Ctrl');
import 'edit_session';
import TextEditor from 'text_editor';
import ConsoleView from 'console_view';
import 'image_view';
import 'unknown_file_view';
import 'audio_file_view';
import 'video_file_view';
import 'pdf_file_view';
import 'zip_file_view';

function get_suffix (name) {
  var mat = name.match(/([^\.\/]+)$/);
  if (mat) {
    return mat[1].replace(/\+/g, 'p').toLowerCase();
  }
  return '';
}

function is_svn_conflict (name) {
	return /\.(mine|r\d+)$/.test(name);
}

function update_layout (self) {
  if (app.root.layout_status == 2) {  // 当前内容视图为不可见状态
    // 在小屏幕IOS手机与ipod上运行时,为节省性能.
    // 内容视图如果切换走,关闭当前打开的文件
    if (util.env.iphone || util.env.ipod) {
      self.close_current();
    }
  } else {
    self.set_css('height', app.root.east_size.height + 'px');
  }
}

function open_file (self, name) {
	var v = null;
	
	switch (get_suffix(name)) {
		case 'jpg':
		case 'jpeg':
		case 'png':
		case 'gif':
		case 'tiff':
		case 'tif':
		case 'tga':
		case 'pvr':
		case 'ico':
		case 'jpf':
		  v = view.create('ImageView');
		  break;
		case 'mp3':
		case 'ogg':
		case 'wma':
		case 'acc':
		  v = view.create('AudioFileView');
		  break;
		case 'zip':
		  v = view.create('ZIPFileView');
		  break;
		case 'docx':
		case 'doc':
		case 'xls':
		case 'xlsx':
		case 'ppt':
		case 'pptx':
		case 'pdf':
		  v = view.create('PDFFileView');
		  break;
		case 'mp4':
		case 'avi':
		case 'rmvb':
		case 'rm':
		case 'mov':
		case 'wmv':
		case '3gp':
		case 'm4v':
		case 'mpg':
		  v = view.create('VideoFileView');
		  break;
		default:     //Only supports the code editor
		
		  if (is_console_log(name)) {
		    v = new ConsoleView();
		  }
			else if (is_svn_conflict(name)) {
				v = new TextEditor();
			}
		  else if (edit_session.is_text(name)) {
		    v = new TextEditor();
		  }
		  else {
	      v = view.create('UnknownFileView');
		  }
			break;
	}
	
  var current = self.current;
  if (current) {
     // 删除当前
    if (current instanceof TextEditor && v instanceof TextEditor) {
      current.remove_hold_blur(); // 删除但不卸载焦点
    } else {
      current.remove();
    }
  }
  
	v.init(name);
	v.$on('release', release_view, self);
	self.append(v);
	self._current = v;
	
	self.onopen_view.notice(v);
  if (util.env.iphone || util.env.ipod) { // 切换到代码视图
    app.root.set_layout_status(0, true);
  }
	return v;
}

function save_history (self) {
  storage.set('teide_open_file_history', self.history);
  storage.set('teide_open_file_history_index', self._history_index);
  self.onchange_history.notice();
}

function file_exists (self, name, cb) {
  FileActionService.call('exists', name, cb.catch(function () { cb(false) }));
}

function init (self) {
  var info = app.root.application_info;
  var default_open = [ info.is_lite ? 'example/index.html' : 'example/node.js' ];
  self._history = storage.get('teide_open_file_history') || default_open;
  self._history_index = storage.get('teide_open_file_history_index') || 0;
  save_history(self);

  // 监控日志,如果当前显示的文件被删除,关闭文件
  FileActionService.on('console_log', function (evt) {
    var log = evt.data;
    if (log.substr(0, 2) == 'D ') { // 有文件被删除
      self.close(log.substr(2)); // 尝试关闭相似文件
    }
  });
  
  var main = app.root;
  update_layout(self);
  main.onchange_layout_status.$on(update_layout, self);

  util.next_tick(function () { // 等待 TCRoot 初始化完成
  
    if (main.layout_status != 2) {
      // 当前内容为可见状态,初始化打开一个历史文件
		  var name = self.history[self._history_index];
		  file_exists(self, name, function (exists) {
		    if (exists) {
		      open_file(self, name);
		    }
		    self.onchange_history.notice();
		  });
		}
	});
}

function release_view (self, evt) {
	if (evt.sender === self._current) {
		self._current = null;
	}
  self.onrelease_view.notice(evt.sender);
}

/**
 * console.log
 * @private
 */
function is_console_log (name) {
  return /console\.log$/.test(name);
}

/**
 * @class EastContentPanel
 * @extends Ctrl
 */
export class EastContentPanel extends Ctrl {
  // @private:
  
  /**
   * 当前打开的文件
   * @private
   */
  _current: null;
  
  /**
   * 历史
   */
  _history: null;
  
  /**
   * 历史位置
   */
  _history_index: -1;
  
  // @public:
  
  /**
   * 打开view 事件
   */
  event onopen_view;
  
  /***/
  event onrelease_view;
  
  /**
   * 历史变化
   */
  event onchange_history;
  
  /**
	 * @constructor
	 */
  constructor () {
    Ctrl.call(self);
    self.onload_view.$on(init);
  }
  
  /**
   * 当前打开的文件
   * FileContentView
   */
  get current () {
    return self._current;
  }
  
  get cur () {
    return self._current;
  }
  
	/**
	 * 打开文件
	 */
	open (name) {
    if (this.current && name == this.current.get_filename()) {
      if (util.env.iphone || util.env.ipod) {
        app.root.set_layout_status(0, true)
      }
      return this.current
    }
    
    var view = open_file(this, name)
    var index = this._history_index + 1
    var history = this.history
    var len = history.length - index
    
    this.history.splice(index, len, name)
    len = history.length - 25
    if (len > 0) {
      this.history.splice(0, len) // 最多25个历史记录
    }
    this._history_index = history.length - 1
    
    save_history(this)
    
    return view
	}
	
	get history () {
	  return this._history;
	}
	
	back () {
    if (self.is_back()) {
      
      self._history_index--;
      
      var name = self.history[self._history_index];
      
      file_exists(self, name, function (exists) {
        if (exists) { // 文件存在
          open_file(self, name); 
          save_history(self);
        } else { // 继续后退
          self.history.splice(self._history_index, 1); // 删除无效记录
          save_history(self);
          self.back();
        }
      });
    }
	}
	
	forward () {
    
    if (self.is_forward()) {
      
      self._history_index++;
      
      var name = self.history[self._history_index];
      
      file_exists(self, name, function (exists) {
        if (exists) { // 文件存在
          open_file(self, name);
          save_history(self);
        } else { // 继续前进
          self.history.splice(self._history_index, 1); // 删除无效记录
          save_history(self);
          self.forward();
        }
      });
    }
	}
	
  is_back () {
    return this._history_index > 0;
  }
  
  is_forward () {
    return this._history_index < this.history.length - 1;
  }
	
	/**
	 * 关闭与当前相似的文件
	 * 如果传入的路径与当前文件路径相似,关闭
	 */
	close (path) {
    if (this._current && this._current.get_filename().indexOf(path) === 0) {
      this._current.remove();
    }
	}
	
	/**
	 * 关闭当前文件
	 */
	close_current () {
		if (this._current) {
      this._current.remove();
		}
	}
	
	/**
	 * 改名相似的文件
	 */
	rename (old_path, new_path) {
    if (this._current) {
      var name = this._current.get_filename();
      var index = name.indexOf(old_path);
      if (index === 0) { // 
        //路径相似
        name = name.replace(old_path, new_path);
        open_file(this, name);
        this.history[this._history_index] = name; // 修改历史
        save_history(this);
      }
    }
	}
	
  // @end
}
