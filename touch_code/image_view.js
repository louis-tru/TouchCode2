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

import FileContentView from 'file_content_view';
//import 'image_view.vx';
//import ':gui/app';
import ':util';
//import ':wgui/view');

function resize (self) {
	var size = app.root.east_size;
	self.table.style = {
		width : size.width + 'px',
		height : size.height + 'px',
	};
}

function init (self) {
  
	resize(self);
	app.root.onchange_layout_status.$on(resize, self);
  
	self.on('release', function () {
		app.root.onchange_layout_status.off(resize, self);
	});
}

/**
 * @class ImageView
 * @extends FileContentView
 */
export class ImageView extends FileContentView {
  
  /**
	 * @constructor
	 */
	constructor (tag) {
    super(tag);
    this.onload_view.$on(init);
	}
	
	init (name) {
	  this.set_filename(name);
	}
	
	/**
	 * 设置文件名称
	 */
	set_filename (value) {
	  FileContentView.members.set_filename.call(this, value);
	  this.img.src = util.format('read_file/' + encodeURI(value));
	}
	// @end
}
