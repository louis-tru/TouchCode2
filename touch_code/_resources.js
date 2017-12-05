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

//import 'resources.vx';
//import ':gui/app';
//import ':truth/loc';
import ':util/path';
import ':util';
//import ':wgui/view');
//import ':wgui/vdata::ViewData');
//import ':wgui/nav::NavPage');
//import ':wgui/nav::Toolbar');

function get_icon (name) {
  var mat = name.match(/\.([^\.]+)$/);
  if(mat){
    return mat[1].replace(/\+/g, 'p').toLowerCase();
  }
  return '';
}

/**
 * @class ResourcesPage
 * @bases :wgui/nav::NavPage
 * @vtags ResourcesPage
 */
export class ResourcesPage extends NavPage {
  // @private:
  m_path: '';
  
  // @public:
  get path () { return this.m_path }
  
  load_view (v, vd) {
    
    self.m_path = self.args.path || '';
    self.title = self.path ? path.basename(self.path) : loc('我的文档');
    
    FileActionService.call2('read_files_list', self.path, function (data) {
      vd = new ViewData({ 
        files_list: data.map(function (item) {
          item.icon = item.leaf ? get_icon(item.text) : 'dir';
          return item;
        })
      });
      NavPage.members.load_view.call(self, v, vd);
		});
  }
  
  m_item_click (evt) {
    var vdata = evt.sender.top.vdata.data;
    var path = vdata.text;
    path = self.path ? self.path + '/' + path : path;
    if (!vdata.leaf) {
      self.nav.push('resources_page', { path: path }, true);
    } else {
      util.next_tick(function () {
        app.root.east_content.open(path);
      });
    }
  }
  
}

/**
 * @class ResourcesToolbar
 * @bases :wgui/nav::Toolbar
 * @vtags ResourcesToolbar
 */
export class ResourcesToolbar extends Toolbar {
  
  m_add_click (evt) {
    view.create('AddedMenu').activate(evt.sender, 0, 6);
  }
  
  m_more_click (evt) {
    view.create('MoreMenu').activate(evt.sender, 0, 6);
  }
  
  m_share_click (evt) {
    var offset = evt.sender.offset;
    offset.top += 6;
    offset.height -= 12;
    NativeService.call('share_app', [offset]); // 分享app
  }
  
  m_internet_click (evt) {
    app.root.open_web_browser();
  }
  
}

exports = {

  /**
   * 通过文件名称获取icon
   */
  get_icon: get_icon,

};