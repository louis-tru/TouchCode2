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

import ':util/event';
//import ':wgui/ctrl::Ctrl';
//import ':wgui/view';
//import 'checkbox.vx';

function init (self) {
  self.checkbox.on('click', function () {
    self.selected = !self.selected;
  });
}

/**
 * @class Checkbox
 * @bases wgui/ctrl::Ctrl
 */
export class Checkbox extends Ctrl {
  
  m_selected: false;
  m_disable: false;
  
  // 变化事件
  onchange: null;
  
	/**
	 * @constructor
	 */
  constructor () {
    Ctrl.call(this, 'span');
    event.init_events(this, 'change');
    this.onload_view.$on(init);
  }

  get disable () {
    return this.m_disable;
  }

  set disable (value) {
    this.m_disable = !!value;
    this.style = value ? {
      'pointer-events': 'none',
      'opacity': 0.5,
    } : {
      'pointer-events': 'auto',
      'opacity': 1,
    };
  }
  
  get selected () {
    return this.m_selected;
  }
  
  set selected (value) {
    
    value = !!value;
    if(value == this.m_selected) return;
    
    this.m_selected = value;
    
    if(value) {
      this.checkbox.add_cls('on');
    }
    else {
      this.checkbox.del_cls('on');
    }
    this.onchange.notice(value);
  }
  // @end
}
