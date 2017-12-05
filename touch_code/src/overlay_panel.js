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
//import ':gui/app');
//import ':wgui/node::Node');
//import ':wgui/ctrl::Ctrl');
//import ':wgui/scroll');
//import 'overlay_panel.vx');
//import ':wgui/display_port');

var arrowSize = { width: 30, height: 13 };

function init (self) {
  
  display_port.onchange.on(self.remove, self);
  
  if(util.env.touch){
    self.bg.on('touchend', self.remove, self);
  }
  else{
    self.bg.on('mouseup', self.remove, self);
  }
  self.on('click', function (){
    if(self.frail){
      self.remove();
    }
  });
}

function release(self){
  display_port.onchange.off(self.remove, self);
}

/**
 * 获取left
 * @private
 */
function get_left(self, x, offset_x){
  
  x -= 10; // 留出10像素边距
  var screen_width = display_port.size.width - 20;
  var width = self.dom.clientWidth;
  
  if(screen_width < width){
    return (screen_width - width) / 2 + 10;
  }
  else{
    var left = x + offset_x / 2 - width / 2;
    if(left < 0){
      left = 0;
    }
    else if(left + width > screen_width){
      left = screen_width - width;
    }
    return left + 10;
  }
}

/**
 * 获取top
 * @private
 */
function get_top(self, y, offset_y){

  y -= 10; // 留出10像素边距
  var screen_height = display_port.size.height - 20;
  var height = self.dom.clientHeight;
  
  if(screen_height < height){
    return (screen_height - height) / 2 + 10;
  }
  else{
    var top = y + offset_y / 2 - height / 2;
    if(top < 0){
      top = 0;
    }
    else if(top + height > screen_height){
      top = screen_height - height;
    }
    return top + 10;
  }
}

/**
 * 获取arrowtop
 * @private
 */
function get_arrow_top(self, top, y, offset_y){
  var height = self.dom.clientHeight;
  y += offset_y / 2;
  var min = 8 + arrowSize.width / 2;
  var max = height - 8 - arrowSize.width / 2;
  if(min > max){
    return height / 2;
  }
  return Math.min(Math.max(min, y - top), max);
}

/**
 * 获取arrowleft
 * @private
 */
function get_arrow_left(self, left, x, offset_x){
  var width = self.dom.clientWidth;
  x += offset_x / 2;
  var min = 8 + arrowSize.width / 2;
  var max = width - 8 - arrowSize.width / 2;
  if(min > max){
    return width / 2;
  }
  return Math.min(Math.max(min, x - left), max);
}

/**
 * 尝试在目标的top显示
 * @private
 */
function attempt_top(self, x, y, offset_x, offset_y, force){

  var height = self.dom.clientHeight;
  var top = y - height - arrowSize.height;
  
  if (top - 10 > 0 || force){
    var left = get_left(self, x, offset_x);
    var arrow_left = get_arrow_left(self, left, x, offset_x) - arrowSize.width / 2;
    self.inl.style = { top: top + 'px', left: left + 'px' };
    self.arrow.style = { 
      top: 'auto', 
      bottom: '-{0}px'.format(arrowSize.height - 0.5), 
      right: 'auto', 
      left: arrow_left + 'px',
      transform: 'rotateZ(180deg)'
    };
    return true;
  }
  return false;
}

/**
 * 尝试在目标的right显示
 * @private
 */
function attempt_right(self, x, y, offset_x, offset_y, force){
  
  var size = display_port.size;
  var width = self.dom.clientWidth;
  
  var left = x + offset_x + arrowSize.height;
  
  if (left + width + 10 <= size.width || force){
    var top = get_top(self, y, offset_y);
    var arrow_top = get_arrow_top(self, top, y, offset_y) - arrowSize.height / 2;
    self.inl.style = { top: top + 'px', left: left + 'px' };
    self.arrow.style = { 
      top: arrow_top + 'px', 
      bottom: 'auto', 
      right: 'auto',
      left: '-{0}px'.format(arrowSize.width / 2 + arrowSize.height / 2),
      transform: 'rotateZ(-90deg)'
    };
    return true;
  }
  return false;
}

/**
 * 尝试在目标的bottom显示
 * @private
 */
function attempt_bottom(self, x, y, offset_x, offset_y, force){
  
  var size = display_port.size;
  var height = self.dom.clientHeight;
  
  var top = y + offset_y + arrowSize.height;
  
  if (top + height + 10 <= size.height || force){
    var left = get_left(self, x, offset_x);
    var arrow_left = get_arrow_left(self, left, x, offset_x) - arrowSize.width / 2;
    self.inl.style = { top: top + 'px', left: left + 'px' };
    self.arrow.style = { 
      top: '-{0}px'.format(arrowSize.height),
      bottom: 'auto', 
      right: 'auto',
      left: arrow_left + 'px',
      transform: 'rotateZ(0deg)'
    };
    return true;
  }
  return false;
}

/**
 * 尝试在目标的left显示
 * @private
 */
function attempt_left(self, x, y, offset_x, offset_y, force) { 
  
  var width = self.dom.clientWidth;
  var left = x - width - arrowSize.height;
  
  if (left - 10 > 0 || force) {
    
    var top = get_top(self, y, offset_y);
    var arrow_top = get_arrow_top(self, top, y, offset_y) - arrowSize.height / 2;
    self.inl.style = { top: top + 'px', left: left + 'px' };
    self.arrow.style = { 
      top: arrow_top + 'px',
      bottom: 'auto', 
      right: '-{0}px'.format(arrowSize.width / 2 + arrowSize.height / 2),
      left: 'auto',
      transform: 'rotateZ(90deg)'
    };
    return true;
  }
  return false;
}

/**
 * @class OverlayPanel
 * @extends Ctrl
 */
export class OverlayPanel extends Ctrl {
  
  /**
   * 很脆弱
   * 默认为点击就会消失掉
   */
  frail: true;
  x: 0;
  y: 0;
  offset_x: 0;
  offset_y: 0;
  is_activate: false;
  opacity: 1;
  
  /**
   * 优先显示的位置
   */
  priority: 'bottom'; // top | right | bottom | left
  
  /**
	 * @constructor
	 */
  constructor (tag) {
    Ctrl.call(this, tag);
    Node.members.hide.call(this);
    app.root.append(this);
    this.$on('load_view', init);
    this.$on('release', release);
  }
  
  /**
   * @funactivate # 通过Node 激活 OverlayPanel
   * @arg target {Node} # 参数可提供要显示的位置信息
   * @arg [offset] {Object} # 显示目标位置的偏移
   */
  activate (target, offset_x, offset_y) {
    offset_x = offset_x || 0;
    offset_y = offset_y || 0;
    var o = target.offset;
    this.activate_by_position(
      o.left + offset_x, o.top + offset_y, 
      o.width - offset_x * 2, o.height - offset_y * 2);
  }
  
  /**
   * 通过位置激活
   */
  activate_by_position (x, y, offset_x, offset_y) {

    var self = this;
    var size = display_port.size;
    
    self.bg.style = { width: size.width + 'px', height: size.height + 'px' };

    x = Math.max(0, Math.min(size.width, x));
    y = Math.max(0, Math.min(size.height, y));

    offset_x = offset_x || 0;
    offset_y = offset_y || 0;
    
    self.show();
    
    this.x = x;
    this.y = y;
    this.offset_x = offset_x;
    this.offset_y = offset_y;
    
    switch (self.priority) {
      case 'top':
        attempt_top(self, x, y, offset_x, offset_y) ||
        attempt_bottom(self, x, y, offset_x, offset_y) ||
        attempt_right(self, x, y, offset_x, offset_y) ||
        attempt_left(self, x, y, offset_x, offset_y) ||
        attempt_top(self, x, y, offset_x, offset_y, true);
        break;
      case 'right':
        attempt_right(self, x, y, offset_x, offset_y) ||
        attempt_left(self, x, y, offset_x, offset_y) ||
        attempt_bottom(self, x, y, offset_x, offset_y) ||
        attempt_top(self, x, y, offset_x, offset_y) ||
        attempt_right(self, x, y, offset_x, offset_y, true);
        break;
      case 'bottom':
        attempt_bottom(self, x, y, offset_x, offset_y) ||
        attempt_top(self, x, y, offset_x, offset_y) ||
        attempt_right(self, x, y, offset_x, offset_y) ||
        attempt_left(self, x, y, offset_x, offset_y) ||
        attempt_bottom(self, x, y, offset_x, offset_y, true);
        break;
      default:
        attempt_left(self, x, y, offset_x, offset_y) ||
        attempt_right(self, x, y, offset_x, offset_y) ||
        attempt_bottom(self, x, y, offset_x, offset_y) ||
        attempt_top(self, x, y, offset_x, offset_y) ||
        attempt_left(self, x, y, offset_x, offset_y, true);
        break;
    }

    if (!self.is_activate) {
      self.animate({ opacity: self.opacity }, 200);
    }

    this.is_activate = true;
  }

  /**
   * 重新激活
   */
  reset () {
    if (this.is_activate) {
      this.activate_by_position(this.x, this.y, this.offset_x, this.offset_y);
    }
  }
  
  /**
   * @overwrite
   */
  append_to (parent, id) {
    if (parent === app.root) {
      Ctrl.members.append_to(parent, id);
    } else {
      throw new Error('只能加入Root节点');
    }
  }
  
  hide () {
    var self = this;
    this.animate({ opacity: 0.01 }, 200, function (){
      Node.members.hide.call(self);
    });
  }
  
  remove () {
    var self = this;
    this.animate({ opacity: 0.01 }, 200, function (){
      Node.members.remove.call(self);
    });
  }
  
}