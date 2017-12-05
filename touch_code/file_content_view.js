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

import EventNoticer as EventDelegate from ':util/event';
//import ':wgui/ctrl::Ctrl';

function get_base_filename(name) {
  return name.match(/[^\/\\]+$/)[0];
}

/**
 * @class FileContentView
 * @extends Ctrl
 */
export class FileContentView extends Ctrl {
  // @private:
  
  // 文件名称
  m_filename: '';
  
  // @public:
  
  basename: '';
  
  /**
   * @event onchange # 文本变化事件
   */
	event onchange;
  
  /**
	 * @constructor
	 */
  constructor (tag){
    Ctrl.call(this, tag);
    this.set_css('height', '100%');
  }
  
  /**
   * 初始化
   */
  init () { }
  
	/**
	 * 获取文件名称
	 */
  get_filename () {
    return this.m_filename;
  }
  
  /**
	 * 设置文件名称
	 */
	set_filename (value) {
	  this.m_filename = value;
	  this.basename = get_base_filename(value);	  
	}
	
	/**
	 * 是否可运行
	 */
	is_run () {
	  return false;
	}
  
  /**
   * 撤销更改
   */
  undo () {
    
  }
  
  /**
   * 反撤销更改
   */
  redo () {
    
  }
  
  /**
   * 是否可撤销
   */
  hasUndo () {
    return false;
  }
  
  hasRedo () {
    return false;
  }
  
  /**
   * 是否可用 web browse
   */ 
  is_web_browse () {
    return false;
  }
  
}