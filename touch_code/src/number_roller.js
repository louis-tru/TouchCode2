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
//import 'number_roller.vx';

function init (self) {
  
  self.minus.on('click', function (){
    self.value = self.m_value - 1;
  });
  
  self.plus.on('click', function (){
    self.value = self.m_value + 1;
  });
  
}

/**
 * @class NumberRoller
 * @extends Ctrl
 */
export class NumberRoller extends Ctrl {
  
  min: 0;
  max: 0; // 最大与最小相同表示不限制
  m_value: 0;
  m_format: '{0}';
  
  // 变化事件
  event onchange;
  
	/**
	 * @constructor
	 */
  constructor () {
    // Ctrl.call(this, 'span');
    // event.init_events(this, 'change');
    this.onload_view.$on(init);
  }
  
  get format(){
    return this.m_format;
  }
  
  set format(value){
    this.m_format = value;
    this.val_box.text = value.format(this.m_value);
  }
  
  get value(){
    return this.m_value;
  }
  
  set value(value){
    
    if(value == this.m_value) return;
    
    if(this.min == this.max){ // 无限制
      this.m_value = value;
      this.onchange.notice(this.m_value);
    }
    else{
      var tmp = Math.min(Math.max(value, this.min), this.max);
      if(tmp == this.m_value) return;
      this.m_value = tmp;
    }
    this.val_box.text = this.format.format(this.m_value);
    this.onchange.notice(this.m_value);
  }
  
}
