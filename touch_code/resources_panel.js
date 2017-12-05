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
import ':gui/app';
import ViewController from ':gui/ctr';
import Tree from 'tree_panel';
// import 'file_info_menu';
// import 'dialog';
// import 'service';

function get_icon(name) {
  var mat = name.match(/\.([^\.]+)$/);
  if (mat) {
    return mat[1].replace(/\+/g, 'p').toLowerCase();
  }
  return '';
}

// var is_find = true;

/*
function log_handle(self) {
  if (is_find) { // 可以查找
    is_find = false; // 设置为不可查找,1秒后恢复
    (function (){ is_find = true; }).delay(1000);
    var node = self.find('console.log');
    if (!node) {
      // 如果没有这个文件节点创建一个
      node = self.NewNode();
      node.leaf = true;
      node.text = 'console.log';
      node.icon = 'log';
      self.append(node);
    }
  }
}*/

function init_ResourcesPanel (self) {
  
  //FileActionService.$on('console_log', log_handle, self);
  //FileActionService.$on('console_error', log_handle, self);
  
  /*
  FileActionService.on('download_process', function (evt){
    var node = self.find(evt.data.save);
    if(node){
      node.setBusyProgress(evt.data.progress);
    }
    else{
      console.error('Error: Download process');
    }
  });*/
  
  /*
  FileActionService.on(['compress_process', 'decompress_process'], function (evt){
    var node = self.find(evt.data.target);
    if(node){
      node.setBusyProgress(evt.data.progress);
    }
    else{
      console.error('Error: compress_process and decompress_process process');
    }
  });*/
  /*
  NativeService.on('open_external_file', function (evt) {
    var path = evt.data;
    // console.error('nolg open_external_file', path);

    var node = self.find('external');
    if (!node) {
      node = self.NewNode();
      node.text = 'external';
      node.icon = 'dir';
      
      var ns = self.children;
      for (var i = 0; i < ns.length; i++) {
        var item = ns[i];
        if (item.icon != 'dir') {
          item.before(node);
          break;
        }
      }
      if (i == ns.length) {
        node.append(node);
      }
    }
    node.reload(function () {
      util.next_tick(self, self.expand_all, path, function (node) {
        self.setSelectedNode(node);
        app.root.east_content.open(path);
      }.catch(function (err) { 
        Dialog.error(err.message);
      }));
    });
  });*/
  
  //decompress
  
  self.onrequest.on(function (evt) {
    //var node = evt.data.node;
    //FileActionService.call2('read_files_list', node.path, function (data) {
    //  node.loadData(data);
		//});
  });
  
  self.onnodeclick.on(function (evt) {
    var node = evt.data.node;
    if (node.leaf && 
        node.icon != 'dir' &&    // 
       !node.isBusy()            // 是否忙碌
      ){
      util.next_tick(function (){
        app.root.east_content.open(node.path);
      });
    }
  });
  
  self.onclickinfo.on(function (evt) {
    var menu = view.create('FileInfoMenu');
    menu.setNode(evt.data.node);
    menu.activate(evt.data.node.info_btn);
  });
  
  // 拖拽移动文件位置
  self.ondrag.on(function (evt) {
    var old_parent = evt.data.oldParent;
    var node = evt.data.node;
    var parent = node.getParentNode();

    if (old_parent !== parent) {

      var old_path = (old_parent === node.root ? '' : old_parent.path + '/') + node.text;

      var children = parent.children;
      for(var i = 0; i < children.length; i++){
        var item = children[i];
        if(item.text == node.text && item !== node){
          // 名称重复,需要改名
          node.text = node.text.replace(/(_\d+)?(\.[^\.\/]+$|$)/, '_' + util.id() + '$2');
          break;
        }
      }

      if (!node.startBusy()) {
        return Dialog.error('无法移动,当前有任务没有完成!');
      }
      
      var new_path = node.path;

      FileActionService.call('rename', old_path, new_path, util.finally(function (err, data){
        node.stopBusy();
        if (err) {
          return Dialog.error(err.message);
        }
        node.info = data.info;
        
        if (node.icon == 'dir') {
          node.reload();
        }
        app.root.east_content.rename(old_path, new_path);
      }));
    }
  });
  
  /*
  FileActionService.on('upload_file', function (evt) { // 监听上传文件事件
    
    var data = evt.data.data;
    var parent = self.find(evt.data.dir);
    
    if (parent !== self) {
      if (!parent || !parent.isLoadData) { // 如果还没有载入数据
        return;
      }
    }
    
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var node = self.NewNode();
      node.leaf = item.leaf;
      node.icon = item.icon;
      node.text = item.text;
      node.info = item.info;
      var old_node = parent.find(item.text);
      if (old_node) {
        old_node.remove();
      }
      parent.append(node);
    }
  });*/
  
  // 载入
  self.reload();
  
  //self.onloaddata.once(function () {
    // NativeService.call('complete_load_notice');
  //});
}

/**
 * @class ResourcesController
 */
export class ResourcesController extends ViewController {

	/**
	 * @constructor
	 */
	//constructor () {
	//	TreePanel.call(this);
		// this.onload_view.$on(init_ResourcesPanel);
	//}
	
	/**
	 * 更新节点info
	 */
	updateNodeInfo (node) {
	  FileActionService.call2('read_file_info', node.path, function (data) {
      node.info = data;
		});
	}

}

exports = {

  /**
   * 通过文件名称获取icon
   */
  get_icon: get_icon,

};