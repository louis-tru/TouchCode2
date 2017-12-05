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
//import ':truth/app';
//import ':truth/loc';
//import ':wgui/view';
import 'added_menu';
//import 'file_info_menu.vx';
import 'resources';
import 'more_menu';
import OverlayPanel from 'overlay_panel';

function isBusy() {
  return app.root.res.isBusy;
}

/**
 * 验证文件名称的合法性
 */
function verifyFileName(name) {
  if (!name) {
    return false;
  }
  return !/[\/\\:]/.test(name);
}

/**
 * 重新命名
 */
function rename(self, name, show_name) {

  Dialog.prompt('输入新的名称', show_name, function (new_name) {
    if (new_name == name || new_name === null) {
      return;
    }
    else if (!verifyFileName(new_name)) {
      return Dialog.alert('名称不能为空或特殊字符', rename.bind(null, self, name, new_name));
    }
    // OK
    var node = self.m_node;
    var path = node.path;
    var names = path.split('/');
    var new_path = new_name;
    if (names.length > 1) {
      names.pop();
      new_path = names.join('/') + '/' + new_name;
    }

    if (!node.startBusy()) {
      return Dialog.error('无法重命名,当前有任务没有完成!');
    }

    FileActionService.call('rename', path, new_path, function (data) {
      
      // 这里的取消实现方法还未实现
      if (data.cancel) {
        node.info = data.info;
        return;
      }

      node.text = new_name;
      if (node.icon == 'dir') {
        node.reload();
      }
      else {
        node.icon = resources.get_icon(new_name);
      }
      node.info = data.info;
      app.root.east_content.rename(path, new_path);
    }.catch(function (err) {
      Dialog.error(err.message, rename.bind(null, self, name, new_name));
    }).finally(function () {
      node.stopBusy();
    }));
  });
}

/**
 * 初始化
 */
function init(self) {
  
  var node = self.m_node;
  
  switch (node.info.mark) {
    case 'I':
      break;
    case 'S':
      self.update_btn.show();
      if (node.icon == 'dir') {
        self.submit_btn.show();
      }
      break;
    case '!':
      self.solve_btn.show();
      break;
    case 'M':
      self.update_btn.show();
      self.submit_btn.show();
      break;
    case 'A':
      self.submit_btn.show();
      break;
    case 'D':
      self.submit_btn.show();
      self.join_btn.show();
      break;
    case '?':
      self.join_btn.show();
      break;
    case 'L':
      self.cleanup_btn.show(); break;
    default:
      break;
  }

  if (node.icon == 'zip') {
    self.decompress_btn.show();
  }
  if(node.icon != 'dir'){
    self.send_btn.show();
  }
}

/**
 * 设置停止更新或提交
 */
function stepStopUpdateOrSubmit(node, text) {
  // 停止更新或提交
  node.root.onclickbusy.on(function () {
    view.create('StopAction')
      .setValue(text)
      .setClickHandle(function () {
        // stop 停止提交或更新信号
        FileActionService.call('stop_update_or_submit');
      }).activate(node.busy_btn);
  }, 'stop_update_or_submit');
}

/**
 * 提交
 */
function submitMappingNode(node) {
  
  var isExpand = node.isExpand();
  
  if (!node.startBusy()) {
    return Dialog.error('无法提交,当前有任务没有完成!');
  }
  
  stepStopUpdateOrSubmit(node, '停止提交');
  
  function finally_fun () {
    node.root.onclickbusy.off('stop_update_or_submit');
    node.stopBusy();
    if (isExpand) {
      node.expand();
    }
  }
  
  FileActionService.call('submit', node.path, function (info) {
    finally_fun();
    node.info = info;
    
    if (node.icon == 'dir') {
      node.reload(); 
    } else {
      node.getParentNode().reload();
    }
  }.catch(function (err) {
    finally_fun();
    Dialog.error(err.message);
  }));
}

/**
 * 更新映射节点
 * @private
 */
function updateMappingNode (node) {
  if (!app.root.verif_high_func()) return;
    
  var isExpand = node.isExpand();
  
  if (!node.startBusy()) {
    return Dialog.error('无法更新,当前有任务没有完成!');
  }
  
  stepStopUpdateOrSubmit(node, '停止更新');
  
  FileActionService.call('update', node.path, util.finally(function (err, info) {
    
    node.root.onclickbusy.off('stop_update_or_submit');
    node.stopBusy();
    
    if (isExpand) {
      node.expand();
    }
    
    if (err) {
      if(err.info) {
        node.info = err.info;
      }
      
      if(err.code == 201){ // 版本冲突
        // 'Update file version conflict, Do you want to see the log?'
        Dialog.confirm('更新版本冲突,是否要查看日志信息?', function (is){
          if(is){
            app.root.east_content.open('console.log');
          }
        });

      } else {
        Dialog.error(err.message);
      }
    } else {
      node.info = info;
    }
    
    if (node.icon == 'dir') {
      node.reload();
    } else {
      node.getParentNode().reload();
    }
  }));
}

export class FileInfoMenu extends OverlayPanel {

  /**
   * 当前的节点
   * @private
   */
  m_node: null;

	/**
	 * 设置当前的节点
	 */
	setNode (node) {
	  this.m_node = node;
	  init(this);
	}

  m_rename_click_handle () {
    if (isBusy()) {
  	  return Dialog.error('无法重命名,当前有任务没有完成!');
    }
    rename(this, this.m_node.text, this.m_node.text);
  }

  m_clone_click_handle (){
  	var self = this;
  	var node = this.m_node;
  	var path = node.path;
  	
  	// TODO 克隆大文件时可能需要很长时间
  	// 在这里显示一个loading的标志
  	
  	if(!node.startBusy()){
  	  return Dialog.error('无法克隆,当前有任务没有完成!');
    }
    
    function setNode(data){
      var 
      new_node = node.root.NewNode();
      new_node.text = data.name.split('/').pop();
      new_node.icon = node.icon;
      new_node.info = data.info;
      node.after(new_node);
      new_node.leaf = node.leaf;
      new_node.root.updateNodeInfo(new_node);
    }
    
    // 停止克隆
    node.root.onclickbusy.on(function (){
      view.create('StopAction')
        .setValue('停止克隆')
        .setClickHandle(function (){
          // stop 克隆信号
          FileActionService.call('stop_clone');
        }).activate(node.busy_btn);
    }, 'stop_clone');
  	
  	FileActionService.call('clone', path, util.finally(function (err, data) {
  	  node.root.onclickbusy.off('stop_clone');
  	  node.stopBusy();
      if (err) {
        Dialog.error(err.message);
      }
      if (data) {
        setNode(data);
      }
    }));
  }

  m_delete_click_handle () {
    
    var self = this;
    var node = this.m_node;
    
    // type false 只删除本地
    // type true 全部删除
    function ok (type) {
      
      if (!type) return;
      
	    // TODO delete 
	    var path = node.path;
	    
	    // TODO 删除大文件时可能需要很长时间
  	  
    	if (!node.startBusy()) {
    	  return Dialog.error('无法删除,当前有任务没有完成!');
      }
      
      // 停止删除
      node.root.onclickbusy.on(function (){
        view.create('StopAction')
          .setValue('停止删除')
          .setClickHandle(function (){
            // stop 删除信号
            FileActionService.call('stop_delete');
          }).activate(node.busy_btn);
      }, 'stop_delete');
	    
	    FileActionService.call('remove', path, type == 2, util.finally(function (err, info) {
	      
        node.root.onclickbusy.off('stop_delete');
        node.stopBusy();
	      
        if (err) {
          return Dialog.error(err.message);
        }
        
        if (info) { // 文件没有被删除,可能是被取消了,返回了新info值
          node.info = info;
          if (node.icon == 'dir') {
            node.reload(); // 重新载入数据
          }
        } else {
          node.remove(); // 删除节点
        }
        // 关闭和这个路径相似的文件
        app.root.east_content.close(path); 
	    }));
  	}
    
    var info = node.info;
    var msg = loc('是否要删除 {0} ?').format(node.text);
    var msg2 = loc('是否要删除 {0}, 删除本地或者全部 ?').format(node.text);
    
    // This is a mapping file, delete local or all
    
    // I S A D M L ! ?
    
    if (info.root) { // 只删除本地
      return Dialog.confirm(msg, ok);
    }
    
    switch (info.mark) {
      default:
      case 'I':
      case '?':
      case 'L': // 只需要删除本地文件
      case '!':
      case 'D':
        Dialog.confirm(msg, ok);
        break;
      case 'A':
        Dialog.confirm(msg, function (is){ is && ok(2) }); // 删除全部
        break;
      case 'S':
      case 'M':
        Dialog.delete_file_confirm(msg2, ok);
        break;
    }
  }
  
  m_search_click_handle (){
    
    var main = app.root;
    var node = this.m_node;
    //
  	node.root.setSelectedNode(node);
  	main.activate_search(true, { search_target: 'selected' });
  	//if (node.icon != 'dir') { // 打开文件
  	//  main.east_content.open(node.path);
  	//}
  }

  // 发送文件给好友
  m_send_click_handle (){
    NativeService.call('send_file', this.m_node.path);
  }

  m_decompress_click_handle (){
    more_menu.decompress(this.m_node);
  }
  
  // 加入映射
  m_join_click_handle (){
    
    var node = this.m_node;
    
    if(node.info.mark != '?'){
      return;
    }
    
    var isExpand = node.isExpand();
    
    if(!node.startBusy()){
      return Dialog.error('无法加入,当前有任务没有完成!');
    }
    
    // TODO 这里的加入可能遇到大文件夹时,速度也会变慢
    // TODO 可能需要在这里添加一个停止加入按钮
    
    FileActionService.call('join', node.path, util.finally(function (err, info){
      
      node.stopBusy();
      
      if(isExpand){
        node.expand();
      }
      
      if (err) {
        return Dialog.error(err.message);
      }
      node.info = info;
      
      if (node.icon == 'dir') {
        node.reload();
      }
    }));
  }
  
  m_update_click_handle () {
    updateMappingNode(this.m_node); // 更新映射节点
  }
  
  // 提交
  m_submit_click_handle () {
    if (!app.root.verif_high_func()) return;

    var node = this.m_node;

    if (!node.startBusy()) {
      return Dialog.error('无法提交,当前有任务没有完成!');
    }
    
    var self = this;
    
    // 先查询是否有冲突
    FileActionService.call('conflict_list', node.path, util.finally(function (err, data) {
      node.stopBusy();
      
      if(err){
        return Dialog.error(err.message);
      }
      
      // var msg = !data.length ? '确定要将变化提交到服务器吗?' : // 没有冲突
      //   loc('当前还有{0}个冲突没有解决,确定要将变化提交到服务器吗?').format(data.length);

      var msg = !data.length ? '确定要将变化提交到服务器吗?' : // 没有冲突
        loc('无法提交,当前有{0}个冲突没有解决,是否查看冲突日志?').format(data.length);
      
      Dialog.confirm(msg, function (is){
        if(is){
          if(data.length){ // 有冲突,查看日志
            app.root.east_content.open('console.log');
          } else {
            submitMappingNode(node); // 提交
          }
        }
      });
    }));
  }
  
  // 解决冲突
  m_solve_click_handle () {
    
    var node = this.m_node;
    
    if (node.info.mark != '!') {
      return;
    }
    
    if (isBusy()) {
      return Dialog.error('无法解决冲突,当前有任务没有完成!');
    }
    
    FileActionService.call2('resolved', node.path, function (info){
      // var reg = new RegExp('^' + node.text + '\.(mine|r\\d+)$');
      var text = node.text;
      var reg = /^\.(mine|r\d+)$/;

      // 删除无用的临时文件显示，
      var ls = node.getParentNode().children;
      for(var i = 0; i < ls.length; i++){
        var item = ls[i];
        var item_text = item.text;
        if(item_text != text && 
          item_text.indexOf(text) === 0 && 
          reg.test(item_text.substr(text.length))){
          item.remove(); // 删除节点
        }
      }
      node.info = info;
    });
  }

  // 解锁
  m_unlock_click_handle () {
    var node = this.m_node;
    
    if (node.info.mark != 'L') {
      return;
    }

    if (!node.startBusy()) {
      return Dialog.error('无法解锁,当前有任务没有完成!');
    }

    FileActionService.call('unlock', node.path, util.finally(function (err, info){
      node.stopBusy();
      
      if (err) {
        return Dialog.error(err.message);
      }
      node.info = info;
      if (node.icon == 'dir') {
        node.reload();
      }
    }));
  }

  // 清理
  m_cleanup_click_handle () {
    var node = this.m_node;
    
    if (node.info.mark != 'L') {
      return;
    }

    if (!node.startBusy()) {
      return Dialog.error('无法清理,当前有任务没有完成!');
    }

    FileActionService.call('cleanup', node.path, util.finally(function (err, info) {
      node.stopBusy();
      if (err) {
        return Dialog.error(err.message);
      }
      node.info = info;
      if (node.icon == 'dir') {
        node.reload();
      }
    }));
  }
  // @end
}

exports = {
  
  /**
   * @static
   */
  verifyFileName: function (name){
    return verifyFileName(name);
  },
  
  /**
   * 更新映射节点
   */
  updateMappingNode: updateMappingNode,

};
