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
import ':util/event';
// import SessionCtrl from ':wgui/ctrl';
//import ':wgui/view';
import Button from 'button';

function click_handle(self, evt) {
  if(evt.sender.id !== self.value) {
    set_value(self, evt.sender.id);
  }
}

function set_value(self, value) {
  
  var btn = self[value];
  if ( !(btn instanceof Button) )
    return;
    
  if (self[self.m_value]) 
    self[self.m_value].selected = false;
    
  self.m_value = value;
  btn.selected = true;
  self.onchange.notice();
}

function init(self) {
  
  self.m_init = true;
  
  self.children.forEach(function (btn) {
    if (btn instanceof Button) {
      btn.$on('click', click_handle, self);
    }
  });
  
  if (self.m_value) { // trigger click
    self[self.m_value].click();
  }
}

/**
 * @class GroupButton
 * @extends SessionCtrl
 */
export class GroupButton extends SessionCtrl {
  
  m_value: '';
  m_init: false;
  onchange: null;
  
	/**
	 * @constructor
	 */
  constructor (tag) {
    SessionCtrl.call(this, tag);
    event.init_events(this, 'change');
    this.onload_view.$on(init);
  }
  
  get value() {
    return this.m_value;
  }
  
  set value(value) {
    if (value !== self.m_value) {
      if (this.m_init) {
        var btn = this[value];
        if (btn instanceof Button) {
          btn.click();
        }
      } else {
        set_value(this, value);
      }
    }
  }
  // @end
}
