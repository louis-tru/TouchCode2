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

export class BarBtn extends ViewController {
  
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

const bar_btn_vx = (
  <BarBtn>
    <Div>
      <Image class="btn" />
    </Div>
  </BarBtn>
);

export const main_vx = (

<Root class="root">
  <!--西-->
  
  <Indep id="west" class="west">
    <!-- Bar -->
    <Div id="west_bar" class="main_bar">
      <!--左-->
      <Div id="west_bar_left" class="main_bar_left">
        <vx:bar_btn_vx id="res_btn" class="bar_btn res_btn on" onTouchStart="res_btn_click_handle" />
        <vx:bar_btn_vx id="search_btn" class="bar_btn search_btn" onTouchStart="search_btn_click_handle" />
        <vx:bar_btn_vx id="add_btn" class="bar_btn add_btn" onClick="m_add_click_handle" />
        <vx:bar_btn_vx id="share_btn" class="bar_btn share_btn" onClick="m_share_click_handle" />
        <vx:bar_btn_vx id="more_btn" class="bar_btn more_btn" onClick="m_more_click_handle" />
      </Div>
      <!--右-->
      <Indep id="west_bar_right" class="main_bar_right">
        <vx:bar_btn_vx id="edit_btn" class="bar_btn edit_btn" onClick="m_edit_click_handle" />
        <Text id="editing_btn" class="west_edit_btn" onClick="m_edit_click_handle" visible=0> 完成 </Text>
      </Indep>
    </Div>
    
    <Div id="west_content" class="west_content">
      <!--ResourcesController id="res" /-->
      <Div id="res" />
      <Div id="search_outer" />
    </Div>
  </Indep>
  
  <!--东-->
  <Indep id="east" class="east">
    <Div id="east_bar" class="main_bar">
      <!--左-->
      <Div id="east_bar_left" class="main_bar_left" margin_left=8>
        <vx:bar_btn_vx id="back_res_btn" class="bar_btn back_btn" onClick="m_back_res_click_handle" visible=0 />
        <vx:bar_btn_vx id="back_btn" class="bar_btn back_btn" onClick="m_back_click_handle" disable=0 />
        <vx:bar_btn_vx id="forward_btn" class="bar_btn forward_btn" onClick="m_forward_click_handle" disable=0 />
      </Div>
      <!--右--> 
      <Indep id="east_bar_right" class="main_bar_right" margin_right=8>
        <vx:bar_btn_vx id="east_more_btn" class="bar_btn more_btn" onClick="m_east_more_click_handle" />
        <vx:bar_btn_vx id="internet_btn" class="bar_btn internet_btn" onClick="m_internet_click_handle" />
        <vx:bar_btn_vx id="run_btn" class="bar_btn run_btn" onClick="m_start_run_click_handle" disable=0 />
        <vx:bar_btn_vx id="undo_btn" class="bar_btn undo_btn" onClick="m_undo_click_handle" disable=0 />
        <vx:bar_btn_vx id="redo_btn" class="bar_btn redo_btn" onClick="m_redo_click_handle" disable=0 />
        <vx:bar_btn_vx id="toggle_btn" class="bar_btn toggle_btn" onClick="m_toggle_click_handle" />
      </Indep>
    </Div>
    
    <!--vx:EastContentPanel id="east_content" class="east_content" /-->
  </Indep>
  
  <!--OpenSoftKeyboardButton id="btnOpenSoftKeyboard" /--> 
</Root>
);
