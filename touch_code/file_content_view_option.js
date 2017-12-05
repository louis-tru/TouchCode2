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
//import ':wgui/view');
//import 'search_panel.vx');
import OverlayPanel from 'overlay_panel';
//import 'file_content_view_option.vx';
import 'text_editor';
import 'preferences_view';

function get_preferences(){
  return preferences_view.get_preferences();
}

function set_preferences(value){
  return preferences_view.set_preferences(value);
}

function get_preferences_item(name){
  return preferences_view.get_preferences_item(name);
}

function set_preferences_item(name, value){
  return preferences_view.set_preferences_item(name, value);
}

function set_preferences_item_not(name){
  return preferences_view.set_preferences_item_not(name);
}

function update_FileContentOption_display(self){
  
  var preferences = get_preferences();

  if(preferences.enable_line_number){
    self.enable_line_number_btn.add_cls('on');
  }
  else{
    self.enable_line_number_btn.del_cls('on');
  }
  
  if(preferences.enable_auto_line){
    self.enable_auto_line_btn.add_cls('on');
  }
  else{
    self.enable_auto_line_btn.del_cls('on');
  }
  
  if(preferences.font_size == 16){
    self.use_16_font_btn.add_cls('on');
  }
  else{
    self.use_16_font_btn.del_cls('on');
  }
  
  if(preferences.indent_width == 2){
    self.use_2_indent_btn.add_cls('on');
  }
  else{
    self.use_2_indent_btn.del_cls('on');
  }  
  if(preferences.enable_touch_focus){
    self.enable_touch_focus_btn.add_cls('on');
  }
  else{
    self.enable_touch_focus_btn.del_cls('on');
  }
  
  var editor = text_editor.core;
  if (editor && editor.session.isFoldsData()) {
    self.fold_unfold_all_btn.add_cls('on');
  } else {
    self.fold_unfold_all_btn.del_cls('on');
  }
}

export class FileContentViewOption extends OverlayPanel {
  
  // 不脆弱,不会一点击就消失
  frail: false;
  
  constructor (tag){
    OverlayPanel.call(this, tag);
    this.onload_view.$on(update_FileContentOption_display);
  }
  
  m_enable_number_click_handle (){
    set_preferences_item_not('enable_line_number');
    update_FileContentOption_display(this);
  }
  m_enable_auto_line_click_handle (){
    set_preferences_item_not('enable_auto_line');
    update_FileContentOption_display(this);
  }
  m_use_16_font_click_handle (){
    set_preferences_item('font_size', get_preferences_item('font_size') == 16 ? 14 : 16);
    update_FileContentOption_display(this);
  }
  m_use_2_indent_click_handle (){
    set_preferences_item('indent_width', get_preferences_item('indent_width') == 2 ? 4 : 2);
    update_FileContentOption_display(this);
  }
  m_enable_touch_focus_click_handle (){
    set_preferences_item_not('enable_touch_focus');
    update_FileContentOption_display(this);
  }
  m_fold_unfold_all_click_handle (){
    var editor = text_editor.core;
    if (editor) {
      if (editor.session.isFoldsData()) {
        editor.session.unfold();
      } else {
        editor.session.foldAll();
      }
      update_FileContentOption_display(this);
    }
  }
  
}
