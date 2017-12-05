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
import TextEditor from 'text_editor';
import 'service';
import UndoManager from 'req:ace/undomanager';
import EditSession from 'edit_session';

// var old_navigateTo = 0;

function log_handle(self, evt) {
  var ace_document = self.session.getDocument();
  var line = ace_document.getLength();
  ace_document.insertLines(line - 1, [evt.data]);
  self.core.navigateTo(line, 0);
  storage.set_json('ace_console_log_serollTop', self.session.getScrollTop());
}

function centerSelection(self) {
  var editor = self.core;
  var pos = editor.getCursorPositionScreen();
  var line = pos.row;
  var renderer = editor.renderer;
  var top = renderer.getScrollTopRow();
  var bottom = renderer.getScrollBottomRow();
  
  if(line - 1 < top || line + 1 > bottom){
    editor.centerSelection();
  }
}

/**
 * @private
 */
function init(self) {

  FileActionService.$on('console_log', log_handle, self);
  FileActionService.$on('console_error', log_handle, self);
  self.setReadOnly(true); // 设置为只读

  var old = storage.get('ace_console_log_serollTop');
  if (old) {
    self.session.setScrollTop(old);
  }

  var i = 0;

  function init_navigate() {
    if (i++ > 7 || self.core.session !== self.session) {
      return self.core.renderer.off('afterRender', init_navigate);
    }
    self.core.navigateTo(self.session.getDocument().getLength() - 1, 0);
    centerSelection(self);
    var scrollTop = self.session.getScrollTop();
    storage.set('ace_console_log_serollTop', scrollTop);
  }
  
  self.core.renderer.on('afterRender', init_navigate);
  (function (){ 
    self.core.renderer.off('afterRender', init_navigate);
  }.delay(500));
  
  self.$on('release', release);
}

/**
 * @private
 */
function release(self) {
  FileActionService.off('console_log', log_handle);
  FileActionService.off('console_error', log_handle);
}

/**
 * @class ConsoleView
 * @bases TextEditor
 */
export class ConsoleView extends TextEditor {
  
	init (name) {
	  TextEditor.members.init.call(this, name);
	  init(this);
	}
	
	/**
	 * @overwrite
	 */
	getSession (name){
    try {
      var data = APIService.call_sync('read_file_as_text', name);
      var session = new EditSession(data.code, name);
      return session;
    }
    catch(err) {
      return new EditSession('', name);
    }
	}
	
  // overwrite
  undo (){
    
  }
  
  // overwrite
  redo (){
    
  }
  
  // overwrite
  hasUndo (){
    return false;
  }
  
  // overwrite
  hasRedo (){
    return false;
  }
  
	/**
	 * 保存
	 * @overwrite
	 */
	save (force) {
	  // EMPTY
	}
	// @end
}
