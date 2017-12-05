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
import ':util/storage';
import Editor as AceEditor from 'req:ace/editor';

var THEME_CHEAE_NAME = 'EDITOR_THEME';
var FONT_SIZE = '12px';
var DEFAULT_THEME = 'ace/theme/xcode';

// require("ace/config").loadModule(["ext", 'ace/ext/language_tools']);

export class Editor extends AceEditor {
  
  /**
   * 编辑器失去焦点事件
   */
  onblur: null;
  
  /**
   * constructor function
   * @param {ace.VirtualRenderer} renderer
   * @param {ace.EditSession}     session    (Optional)
   * @constructor
   */
	constructor (renderer, session, text_input_class) {
		AceEditor.call(this, renderer, session, text_input_class);
		this.onblur = new EventDelegate('blur', this);
		var self = this;
		
		this.on('blur', function () {
		  self.onblur.notice();
		});
		
		this.setTheme();
		this.setFontSize(FONT_SIZE);
		
		if(util.env.touch){
	    this.setOptions({
	      enableSnippets: true,
	      scrollPastEnd: true,
	    });
  	} else {
	    this.setOptions({
	      enableBasicAutocompletion: true,
	      enableLiveAutocompletion: true,
	      enableSnippets: true,
	      scrollPastEnd: true,
	    });
  	}
    this.setSelectionStyle('text');
	}

	/**
	 * set theme
	 * @method setTheme
	 * @param {String} name
	 */
	setTheme (theme) {
		theme = theme || storage.get(THEME_CHEAE_NAME) || DEFAULT_THEME;
		storage.set(THEME_CHEAE_NAME, theme);
		AceEditor.prototype.setTheme.call(this, theme);
	}

	setSession (session){

		if(this.session){
			this.session.removeEventListener("debugbreak", this.$on_debug_break);
		}
		this.$on_debug_break = this.on_debug_break.bind(this);
		session.addEventListener("debugbreak", this.$on_debug_break);

		AceEditor.prototype.setSession.call(this, session);
		this.on_debug_break();
	}

	on_debug_break () {
		var data = this.session.get_debug_break();
		var row = data.row;
		if (row !== -1)
			this.gotoLine(row + 1, data.startColumn);
	}

}

