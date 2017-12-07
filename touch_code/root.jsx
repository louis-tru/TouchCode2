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
	ViewController, CSS, atomPixel: px1, Hybrid,
	Root, Div, Indep, Text, Image, ngui
} from 'ngui';
import 'ngui/dialog';
import OpenSoftKeyboardButton from './button';
import { NavpageCollection, Navbar, Toolbar, Navpage } from 'ngui/nav';

// import ResourcesController from 'resources_panel';
// font-family: "Helvetica Neue", 
//  HelveticaNeue, "Helvetica-Neue",
//  Helvetica, "BBAlpha Sans", sans-serif;

const $ = resolve;
const iOS = (sys.name() == 'iOS');
export const sys_bar_size = iOS ? 20: 0; /* display_port.statusBarHeight */;
export const bar_height = 44;
export const full_bar_height = sys_bar_size + bar_height + px1;

CSS({

	'.root': {
	  background_color: '#fff',
	},

	'.west': {
	  width: 'full',
	  height: 'full',
	  border_right: `${px1} rgb(179, 179, 179)`,
	},
  
	'.east': {
	  width: '320!',
	  height: 'full',
	  x: 320 + px1,
	},
  
	'.east_content': {
	  width: 'full',
	  height: `${full_bar_height}!`,
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
	},

	'.bar_btn': {
    width: 49,
    height: 49,
    margin_left: 2,
    margin_right: 2,
	},
	
	'.bar_btn .btn': {
	  width: 30,
		origin_x: 15,
		margin: 'auto',
	},
  
  '.bar_btn.add_btn:normal .btn': {
    src: $('./res/icon/07.png'),
  },
  
  '.bar_btn.add_btn:down .btn': {
    src: $('./res/icon/07-2.png'),
  },
  
  '.bar_btn.more_btn .btn': {
  	width: 20,
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
	
  '.bar_btn.back_btn:normal .btn': {
    src: $('./res/icon/back_btn.png'),
  },
  
  '.bar_btn.back_btn:down .btn': {
    src: $('./res/icon/back_btn-2.png'),
  },
  
  '.bar_btn.toggle_btn:normal .btn': {
    src: $('./res/icon/02.png')
  },
  
  '.bar_btn.toggle_btn:down .btn, .bar_btn.toggle_btn.on .btn': {
    src: $('./res/icon/02-2.png')
  },

});

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

const bar_btn = (
  <BarBtn>
    <Div>
      <Image class="btn" />
    </Div>
  </BarBtn>
);

function add_btn_click() {
	ngui.rootCtr.m_add_btn_click();
}

function share_btn_click() {
	ngui.rootCtr.m_share_btn_click();
}

function more_btn_click() {
	ngui.rootCtr.m_more_btn_click();
}

var default_toolbar = (
  <Toolbar>
  	<Hybrid textAlign="center" width="full" height="full">
  		<vx:bar_btn class="bar_btn share_btn" onClick=share_btn_click />
	    <vx:bar_btn class="bar_btn add_btn" onClick=add_btn_click />
	    <vx:bar_btn class="bar_btn more_btn" onClick=more_btn_click />
    </Hybrid>
  </Toolbar>
);

export const main_vx = (
	<Root class="root">
	  
	  <Indep id="west" class="west">
	  	<NavpageCollection id="res" defaultToolbar=default_toolbar>
	  		<Navpage title="/">
	  			Resources
	  		</Navpage>
	  	</NavpageCollection>
	  </Indep>
	  
	  <Indep id="east" class="east">
	    <Div id="east_bar" class="main_bar">
	      <Div id="east_bar_left" class="main_bar_left" margin_left=8>
	        <vx:bar_btn id="back_res_btn" 
	        	class="bar_btn back_btn" onClick="m_back_btn_click" visible=0 />
	      </Div>
	      <Indep id="east_bar_right" class="main_bar_right" margin_right=8>
	        <vx:bar_btn id="toggle_btn" 
	        	class="bar_btn toggle_btn" onClick="m_toggle_btn_click" visible=0 />
	      </Indep>
	    </Div>

	    <Div id="east_content" class="east_content">
	    	Content
	    </Div>
	  </Indep>
	  
	  <!--OpenSoftKeyboardButton id="btnOpenSoftKeyboard" /--> 
	</Root>
);
