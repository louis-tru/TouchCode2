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

import 'ngui/util';
import HttpService from 'ngui/service';

/**
 * @class FastNativeService # 快速native服务
 */
// export class FastNativeService {
//   // @private:
//   m_callbacks: null
//   // @public:
//   onace_text_input_focus: null
//   onace_text_input_blur: null
//   onace_text_input_input: null
//   onace_text_input_backspace: null
//   onace_text_input_indent: null
//   onace_text_input_outdent: null
//   onace_text_input_comment: null
//   onace_text_input_composition_start: null
//   onace_text_input_composition_update: null
//   onace_text_input_composition_end: null
//   ondisplay_port_size_change: null

//   constructor (){
//     event.init_events(this, 
//       'ace_text_input_focus',
//       'ace_text_input_blur',
//       'ace_text_input_input',
//       'ace_text_input_backspace',
//       'ace_text_input_indent',
//       'ace_text_input_outdent',
//       'ace_text_input_comment',
//       'ace_text_input_composition_start',
//       'ace_text_input_composition_update',
//       'ace_text_input_composition_end',
//       'display_port_size_change');
//     this.m_callbacks = { };
//   }

//   // 是否支持快速native服务
//   is_support (){
//     return app.root.ios_native;
//   }
  
//   callback (id, args) {
//     var cb = this.m_callbacks[id];
//     if (cb) {
//       delete this.m_callbacks[id];
//       cb.apply(null, args || []);
//     }
//   }
  
//   call (name/*, [args..], [cb]*/) {
  
//     var args = util.to_array(arguments).slice(1);
//     var cb = typeof args.last(0) == 'function' ? args.pop() : null;
    
//     if (app.root.ios_native) {
//       var param = [ name, args, ];
//       if (cb) {
//         var id = util.id();
//         param.push(String(id));
//         this.m_callbacks[id] = cb;
//       }
//       var send_msg = '/teide_native_call/' + JSON.stringify(param);
//       location.href = encodeURIComponent(send_msg);
//     }
//     else {
//       // alert('Error: Not support FastNativeService');
//     }
//   }

//   onace_text_input_focus_notice () {
//     return this.onace_text_input_focus.notice();
//   }
  
//   onace_text_input_blur_notice () {
//     return this.onace_text_input_blur.notice();
//   }

//   onace_text_input_input_notice (data) {
//     return this.onace_text_input_input.notice(data);
//   }

//   onace_text_input_backspace_notice () {
//     return this.onace_text_input_backspace.notice();
//   }
  
//   onace_text_input_indent_notice () {
//     return this.onace_text_input_indent.notice();
//   }
  
//   onace_text_input_outdent_notice () {
//     return this.onace_text_input_outdent.notice();
//   }
  
//   onace_text_input_comment_notice () {
//     return this.onace_text_input_comment.notice();
//   }
  
//   onace_text_input_composition_start_notice (data) {
//     return this.onace_text_input_composition_start.notice(data);
//   }

//   onace_text_input_composition_update_notice (data) {
//     return this.onace_text_input_composition_update.notice(data);
//   }

//   onace_text_input_composition_end_notice (data) {
//     return this.onace_text_input_composition_end.notice(data);
//   }

//   ondisplay_port_size_change_notice (width, height) {
//     return this.ondisplay_port_size_change.notice({ width: width, height: height });
//   }
//   // @end
// }

global.ManageService = new HttpService('tc.ManageService', util.config.manage_server);
