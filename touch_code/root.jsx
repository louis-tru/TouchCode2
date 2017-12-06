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

import 'ngui/sys';
import { 
	ViewController, CSS, atomPixel,
	Root, Div, Indep, Text, Image, 
} from 'ngui';

// import ResourcesController from 'resources_panel';
// font-family: "Helvetica Neue", 
//  HelveticaNeue, "Helvetica-Neue",
//  Helvetica, "BBAlpha Sans", sans-serif;

const $ = resolve;
const iOS = (sys.name() == 'iOS');
export const px1 = atomPixel;
export const sys_bar_size = iOS ? 20: 0; /* display_port.statusBarHeight */;
export const bar_height = 44;
export const full_bar_height = sys_bar_size + bar_height + px1;

const tit_btn_base = {
	panel: {
		width: 49,
		height: bar_height,
	  margin_left: 2,
	  margin_right: 2,
	  //background_color: '#f00',
	},
	btn_base: { 
		width: 30,
		origin_x: 15,
		margin: 'auto',
	},
}

CSS({

	'.root': {
	  background_color: '#fff',
	},

	'.west': {
	  width: 320,
	  height: 'full',
	  border_right: `${px1} rgb(179, 179, 179)`,
	},

	'.main_bar': {
	  height: bar_height + sys_bar_size,
	  width: 'full',
	  border_bottom: `${px1} rgb(179, 179, 179)`,
	  background_color: 'rgb(249, 249, 249)',
	},

	'.main_bar_left': {
		height: bar_height,
		margin_top: sys_bar_size,
	},

	'.main_bar_right': {
		height: bar_height,
		margin_top: sys_bar_size,
		align_x: 'right',
		//background_color: '#ff0',
	},

	'.bar_btn': {
    width: 49,
    height: bar_height,
    margin_left: 2,
    margin_right: 2,
    //background_color: '#f00',
	},
	
	'.bar_btn .btn': {
	  width: 30,
		origin_x: 15,
		margin: 'auto',
	},
  
  '.bar_btn.res_btn:normal .btn': {
    src: $('./res/icon/01.png'),
  },
  
  '.bar_btn.res_btn:down .btn, .bar_btn.res_btn.on .btn': {
    src: $('./res/icon/01-2.png'),
  },
  
  '.bar_btn.search_btn:normal .btn': {
    src: $('./res/icon/03.png'),
  },
  
  '.bar_btn.search_btn:down .btn, .bar_btn.search_btn.on .btn': {
    src: $('./res/icon/03-2.png'),
  },
  
  '.bar_btn.add_btn:normal .btn': {
    src: $('./res/icon/07.png'),
  },
  
  '.bar_btn.add_btn:down .btn': {
    src: $('./res/icon/07-2.png'),
  },
  
  '.bar_btn.more_btn:normal .btn': {
    src: $('./res/icon/more_btn-2.png'),
  },
  
  '.bar_btn.more_btn:down .btn': {
    src: $('./res/icon/more_btn.png'),
  },
  
  '.bar_btn.share_btn:normal .btn': {
    src: $('./res/icon/share_btn.png'),
  },
  
  '.bar_btn.share_btn:down .btn': {
    src: $('./res/icon/share_btn-2.png'),
  },
  
  '.bar_btn.edit_btn:normal .btn': {
    src: $('./res/icon/edit.png'),
  },
  
  '.bar_btn.edit_btn:down .btn': {
    src: $('./res/icon/edit-2.png'),
  },
  
  '.west_edit_btn': {
    text_line_height: bar_height,
  },
  
  '.west_edit_btn:normal': {
    text_color: '#000',
		time: 200,
  },
  
  '.west_edit_btn:down': {
    text_color: '#157efb',
		time: 200,
  },
	
	'.west_content': {
	  width: 'full',
	  height: `${full_bar_height}!`,
	  // background_color: '#f00',
	},
  
	// -------------------east-------------------
  
	'.east': {
	  width: '320!',
	  height: 'full',
	  x: 320 + px1,
	  //background_color: '#f00',
	},
  
  '.bar_btn.back_btn:normal .btn': {
    src: $('./res/icon/back_btn.png'),
  },
  
  '.bar_btn.back_btn:down .btn': {
    src: $('./res/icon/back_btn-2.png'),
  },
  
  '.bar_btn.forward_btn:normal .btn': {
    scale_x: -1,
    src: $('./res/icon/back_btn.png'),
  },
  
  '.bar_btn.forward_btn:down .btn': {
    scale_x: -1,
    src: $('./res/icon/back_btn-2.png'),
  },
  
  '.bar_btn.run_btn:normal .btn': {
    width: 25, src: $('./res/icon/05.png')
  },
  
  '.bar_btn.run_btn:down .btn': {
    width: 25, src: $('./res/icon/05-2.png')
  },
  
  '.bar_btn.stop_btn:normal .btn': {
    width: 25, src: $('./res/icon/08.png')
  },
  
  '.bar_btn.stop_btn:down .btn': {
    width: 25, src: $('./res/icon/08-2.png')
  },
	
  '.bar_btn.internet_btn:normal .btn': {
    src: $('./res/icon/08.png')
  },
  
  '.bar_btn.internet_btn:down .btn': {
    src: $('./res/icon/08-2.png')
  },
	
  '.bar_btn.undo_btn:normal .btn': {
    width: 16, src: $('./res/icon/undo_btn.png')
  },
  
  '.bar_btn.undo_btn:down .btn': {
    width: 16, src: $('./res/icon/undo_btn-2.png')
  },
	
  '.bar_btn.redo_btn:normal .btn': {
    scale_x: -1, 
    origin_x: 8, 
    width: 16, 
    src: $('./res/icon/undo_btn.png')
  },
  
  '.bar_btn.redo_btn:down .btn': {
    scale_x: -1, 
    origin_x: 8, 
    width: 16, 
    src: $('./res/icon/undo_btn-2.png')
  },
  
  '.bar_btn.toggle_btn:normal .btn': {
    src: $('./res/icon/02.png')
  },
  
  '.bar_btn.toggle_btn:down .btn, .bar_btn.toggle_btn.on .btn': {
    src: $('./res/icon/02-2.png')
  },
  
	'.east_content': {
	  width: 'full',
	  height: `${full_bar_height}!`
	},
  
	'.btnOpenSoftKeyboard': {
	  visible: false,
	  //  position: absolute;
	  y: -8,
	  x: -8,
	  align_x: 'right',
	  align_y: 'bottom',
	  // z-index: 4;
	  opacity: 0.4,
	},
  
	'.btnOpenSoftKeyboard.iphone': {
	  src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
	  y: -5,
	  x: -5,
	  width: 45,
	  height: bar_height,
	},
  
	<!--默认为肖像视图 portrait-->
	'.btnOpenSoftKeyboard.ipad': {
	  src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
	  width: 60,
	  height: 60,
	},
  
	<!--风景视图 landscape -->
	'.btnOpenSoftKeyboard.ipad.landscape': {
	  src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
	  width: 77,
	  height: 75,
	},
  
	<!--iphone暂时没有风景视图-->
	'.btnOpenSoftKeyboard.iphone.landscape': {

	},
  
	'.btnOpenSoftKeyboard:normal': {
	  opacity: 1,
	},
  
	'.btnOpenSoftKeyboard:down': {
	  opacity: 0.2,
	},
  
	<!--软键盘打开状态按钮样式 -->
	'.btnOpenSoftKeyboard.open': {
	  scale_y: -1,
	},
  
})

export const S = {

	main_view: {
	  background_color: '#fff',
	},

	west: {
	  width: 320,
	  height: 'full',
	  border_right: `${px1} rgb(179, 179, 179)`,
	},

	main_bar: {
	  height: bar_height + sys_bar_size,
	  width: 'full',
	  border_bottom: `${px1} rgb(179, 179, 179)`,
	  background_color: 'rgb(249, 249, 249)',
	},

	main_bar_left: {
		height: bar_height,
		margin_top: sys_bar_size,
	},
  
	main_bar_right: {
		height: bar_height,
		margin_top: sys_bar_size,
		align_x: 'right',
		//background_color: '#ff0',
	},
  
	res_btn: {
		__proto__: tit_btn_base,
		panel: { __proto__: tit_btn_base.panel, margin_left: 4, },
		normal: { btn: { src: $('./res/icon/01.png') } },
		down: { btn: { src: $('./res/icon/01-2.png') } },
	},
  
	res_btn_on: {
		__proto__: tit_btn_base,
		panel: { __proto__: tit_btn_base.panel, margin_left: 4, },
		btn: { src: $('./res/icon/01-2.png') },
	},
  
	search_btn: {
		__proto__: tit_btn_base,
		normal: { btn: { src: $('./res/icon/03.png') } },
		down: { btn: {src: $('./res/icon/03-2.png')} },
	},
  
	search_btn_on: {
		__proto__: tit_btn_base,
		btn: { src: $('./res/icon/03-2.png') }
	},
	
	add_btn: {
		__proto__: tit_btn_base,
		normal: { btn: { src: $('./res/icon/07.png') } },
		down: { btn: {src: $('./res/icon/07-2.png')} },
	},
	
	more_btn: {
		__proto__: tit_btn_base,
		normal: { btn: { width: 18, src: $('./res/icon/more_btn-2.png') } },
		down: { btn: { width: 18, src: $('./res/icon/more_btn.png') } },
	},
	
	share_btn: {
		__proto__: tit_btn_base,
		normal: { btn: { src: $('./res/icon/share_btn.png') } },
		down: { btn: {src: $('./res/icon/share_btn-2.png')} },
	},
	
	edit_btn: {
		__proto__: tit_btn_base,
		normal: { btn: { src: $('./res/icon/edit.png') } },
		down: { btn: {src: $('./res/icon/edit-2.png')} },
	},

	west_edit_btn: {
		text_line_height: bar_height,
		normal: {
			text_color: '#000',
			time: 200,
		},
		down: { 
			text_color: '#157efb',
			time: 200,
		}
	},
	
	west_content: {
	  width: 'full',
	  height: `${full_bar_height}!`,
	  // background_color: '#f00',
	},
  
	// ------------------------------------east---------------------------------------
  
	east: {
	  width: '320!',
	  height: 'full',
	  x: 320 + px1,
	  //background_color: '#f00',
	},
  
	back_btn: {
		__proto__: tit_btn_base,
		normal: { btn: { src: $('./res/icon/back_btn.png') } },
		down: { btn: { src: $('./res/icon/back_btn-2.png') } },
	},
  
	forward_btn : {
	  __proto__: tit_btn_base,
	  normal: { btn: { scale_x: -1, src: $('./res/icon/back_btn.png') } },
		down: { btn: { scale_x: -1, src: $('./res/icon/back_btn-2.png') } },
	},
	
	run_btn : {
	  __proto__: tit_btn_base,
	  normal: { btn: {  width: 25, src: $('./res/icon/05.png') } },
		down: { btn: {  width: 25, src: $('./res/icon/05-2.png') } },
	},
	
	stop_btn: {
	  __proto__: tit_btn_base,
	  normal: { btn: {  width: 25, src: $('./res/icon/08.png') } },
		down: { btn: {  width: 25, src: $('./res/icon/08-2.png') } },
	},
	
	internet_btn : {
	  __proto__: tit_btn_base,
	  normal: { btn: {  width: 25, src: $('./res/icon/internet.png') } },
		down: { btn: {  width: 25, src: $('./res/icon/internet-2.png') } },
	},
	
	undo_btn : {
	  __proto__: tit_btn_base,
	  normal: { btn: {  width: 16, src: $('./res/icon/undo_btn.png') } },
		down: { btn: {  width: 16, src: $('./res/icon/undo_btn-2.png') } },
	},
	
	redo_btn : {
	  __proto__: tit_btn_base,
	  normal: { btn: { scale_x: -1, origin_x: 8, width: 16, src: $('./res/icon/undo_btn.png') } },
		down: { btn: { scale_x: -1, origin_x: 8, width: 16, src: $('./res/icon/undo_btn-2.png') } },
	},

	toggle_btn : {
	  __proto__: tit_btn_base,
	  normal: { btn: { src: $('./res/icon/02.png') } },
		down: { btn: { src: $('./res/icon/02-2.png') } },
	},
	
	toggle_btn_on: {
	  __proto__: tit_btn_base,
	  btn: { src: $('./res/icon/02-2.png') },
	},
	
	east_content: {
	  width: 'full',
	  height: `${full_bar_height}!`
	},
  
	btnOpenSoftKeyboard : {
	  visible: false,
	  //  position: absolute;
	  bottom: -8,
	  right: -8,
	  align_x: 'right',
	  align_y: 'bottom',
	  //   z-index: 4;
	  opacity: 0.4,
	},

	btnOpenSoftKeyboard_iphone : {
	  src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
	  bottom: 5,
	  right: 5,
	  width: 45,
	  height: bar_height,
	},

	<!--默认为肖像视图 portrait-->
	btnOpenSoftKeyboard_ipad : {  
	  src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
	  width: 60,
	  height: 60,
	},

	<!--风景视图 landscape -->
	btnOpenSoftKeyboard_ipad_landscape : {
	  src: $('./res/icon/btnOpenSoftKeyboard_ipad.png'),
	  width: 77,
	  height: 75,
	},

	<!--iphone暂时没有风景视图-->
	btnOpenSoftKeyboard_iphone_landscape: {

	},

	btnOpenSoftKeyboard_active: {
	  opacity: 0.2,
	},

	<!--软键盘打开状态按钮样式 -->
	btnOpenSoftKeyboard_open: {
	  scale_y: -1,
	},
};

class BarBtn extends ViewController {
  
  get disable() {
    return this.view.receive;
  }
  
  set disable(value) {
    if (value) {
      this.view.opacity = 0.2;
      this.view.receive = false;
    } else {
      this.view.opacity = 1;
      this.view.receive = true;
    }
  }
}

// 更新ace编辑器状态
function update_immediate_focus_status(self) {
  var ace = text_editor.core;
  if (ace) {
    if (preferences_view.get_preferences_item('enable_touch_focus')) {
      ace.setOption('immediateFocus', true);
    } else {
      if (self.m_is_open_soft_keyboard) { // 键盘打开状态
        ace.setOption('immediateFocus', true);
      } else {
        ace.setOption('immediateFocus', false);
      }
    }
  }
}

// 更新按钮显示状态
function update_BtnOpenSoftKeyboard_status(self) {

  update_immediate_focus_status(self);

  var main = share_main_viewport;
  var view = main.east_content.current;

  // 当前没有任何文档被打开,不显示按钮
  if (!view) {
    return self.hide();
  }

  // 打开的不是文本文档,不显示按钮
  if (!(view instanceof TextEditor)) {
    return self.hide();
  }

  // 如果当前文档为只读文档,不显示按钮
  if (view.getReadOnly()) {
    return self.hide();
  }
  
  var enable_touch_focus = 
    preferences_view.get_preferences_item('enable_touch_focus')

  if (self.m_is_open_soft_keyboard) { // 键盘打开状态
    // if(util.env.ipad){ // ipad 打开状态不需要这个按钮
    //   self.hide();
    // }
    // else {
    //   self.show();
    // }
    self.hide(); // 现在打开键盘状态都不需要显示这个按钮
    self.add_cls('open'); // 设置打开状态样式
  } else { // 关闭状态
    if(enable_touch_focus){ // 点击编辑器能自动弹出键盘,所以不需要这个按钮
      self.hide();
    } else {
      self.show();
    }
    self.del_cls('open'); // 设置关闭状态样式
  }

  var size = displayPort.size;

  if (util.env.ios) {
    if (util.env.ipad) {
      if ((size.orientation == 0 || size.orientation == 180)) { // 肖像视图
        self.del_cls('landscape');
      } else { // 风景视图
        self.add_cls('landscape');
      }
    } else { 
      // iphone 无需处理,因为只有肖像视图
    }
  } else {
    // TODO
  }
}

// 
function initBtnOpenSoftKeyboard(self) {

  NativeService.on('open_soft_keyboard', function (evt){
    if(!self.m_is_open_soft_keyboard){
      self.m_is_open_soft_keyboard = true;
      update_BtnOpenSoftKeyboard_status(self);
    }
  });
  
  NativeService.on('close_soft_keyboard', function (evt){
    if(self.m_is_open_soft_keyboard){
      self.m_is_open_soft_keyboard = false;
      update_BtnOpenSoftKeyboard_status(self);
    }
  });

  var main = share_main_viewport;
  main.east_content.onopen_view.$on(update_BtnOpenSoftKeyboard_status, self);
  main.east_content.onrelease_view.$on(update_BtnOpenSoftKeyboard_status, self);
  main.onchange_layout_status.$on(update_BtnOpenSoftKeyboard_status, self);
  
  preferences_view.onpreferences_change.$on(update_BtnOpenSoftKeyboard_status, self);

  // 点击事件
  self.onClock.on(function () {

    var view = main.east_content.current;
    if (view && view instanceof TextEditor) {

      if (view.getReadOnly()) {
        view.blur(); // 卸载焦点
      } else {
        if(self.m_is_open_soft_keyboard){ // 键盘打开状态,在次点击关闭它
          view.blur(); // 卸载焦点
        } else {
          view.focus(); // 获取焦点
          self.hide(); // 先隐藏显示
          (function (){ // 1秒后还没有呼出键盘,在次显示
            if (!self.m_is_open_soft_keyboard) {
              self.show();
            }
          }).setTimeout(1000);
        }
      }
    } else { // 如果这种状态可能的话,这应该是一个错误.
          // 所在次点击尝试卸载 ace editor 焦点
      var ace = text_editor.core;
      if (ace) {
        ace.blur();
      }
    }
  });
}

class BtnOpenSoftKeyboard extends ViewController {
  
  m_timeoutid: 0;
  m_is_open_soft_keyboard: false;
  
  get is_open_soft_keyboard() {
    return this.m_is_open_soft_keyboard;
  }
  
  constructor() {
    super();
    this.hide();
    
    // if (util.env.ipad) {
    //   this.add_cls('ipad');
    // } else if (util.env.ipod || util.env.iphone) {
    //   this.add_cls('iphone');
    // } else {
    //   return; // 不需要这个按钮
    // }
    this.onLoadView.on2(initBtnOpenSoftKeyboard);
  }

  loadView(vx) {
  	super.loadView(vx);
  }
  
  // @overwrite
  show() {
    clearTimeout(this.m_timeoutid);
    if (!this.visible) {
      this.m_timeoutid = (()=>super.show()).setTimeout(250);
    }
  }
  
  // @overwrite
  hide() {
    clearTimeout(this.m_timeoutid);
    if(this.visible) {
      this.m_timeoutid = (()=>super.hide()).setTimeout(10);
    // Node.members.hide.call(this);
    }
  }
  
}

const bar_btn = (
  <BarBtn>
    <Div>
      <Image class="btn" />
    </Div>
  </BarBtn>
);

export const main_vx = (

<Root class="root">
  
  <Indep id="west" class="west">
    <Div id="west_bar" class="main_bar">
      <Div id="west_bar_left" class="main_bar_left">
        <vx:bar_btn id="res_btn" class="bar_btn res_btn on" onTouchStart="res_btn_click_handle" />
        <vx:bar_btn id="search_btn" class="bar_btn search_btn" onTouchStart="search_btn_click_handle" />
        <vx:bar_btn id="add_btn" class="bar_btn add_btn" onClick="m_add_click_handle" />
        <vx:bar_btn id="share_btn" class="bar_btn share_btn" onClick="m_share_click_handle" />
        <vx:bar_btn id="more_btn" class="bar_btn more_btn" onClick="m_more_click_handle" />
      </Div>
      <Indep id="west_bar_right" class="main_bar_right">
        <vx:bar_btn id="edit_btn" class="bar_btn edit_btn" onClick="m_edit_click_handle" />
        <Text id="editing_btn" class="west_edit_btn" onClick="m_edit_click_handle" visible=0> 完成 </Text>
      </Indep>
    </Div>
    
    <Div id="west_content" class="west_content">
      <!--ResourcesController id="res" /-->
      <Div id="res" />
      <Div id="search_outer" />
    </Div>
  </Indep>
  
  <Indep id="east" class="east">
    <Div id="east_bar" class="main_bar">
      <Div id="east_bar_left" class="main_bar_left" margin_left=8>
        <vx:bar_btn id="back_res_btn" class="bar_btn back_btn" onClick="m_back_res_click_handle" visible=0 />
        <vx:bar_btn id="back_btn" class="bar_btn back_btn" onClick="m_back_click_handle" disable=0 />
        <vx:bar_btn id="forward_btn" class="bar_btn forward_btn" onClick="m_forward_click_handle" disable=0 />
      </Div>
      <Indep id="east_bar_right" class="main_bar_right" margin_right=8>
        <vx:bar_btn id="east_more_btn" class="bar_btn more_btn" onClick="m_east_more_click_handle" />
        <vx:bar_btn id="internet_btn" class="bar_btn internet_btn" onClick="m_internet_click_handle" />
        <vx:bar_btn id="run_btn" class="bar_btn run_btn" onClick="m_start_run_click_handle" disable=0 />
        <vx:bar_btn id="undo_btn" class="bar_btn undo_btn" onClick="m_undo_click_handle" disable=0 />
        <vx:bar_btn id="redo_btn" class="bar_btn redo_btn" onClick="m_redo_click_handle" disable=0 />
        <vx:bar_btn id="toggle_btn" class="bar_btn toggle_btn" onClick="m_toggle_click_handle" />
      </Indep>
    </Div>
    
    <!--vx:EastContentPanel id="east_content" class="east_content" /-->
  </Indep>
  
  <!--BtnOpenSoftKeyboard id="btnOpenSoftKeyboard" /--> 
</Root>
);
