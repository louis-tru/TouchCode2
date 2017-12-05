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
//import ':util/app';
import ':util/path';
//import ':util/loc';
//import ':wgui/view';
import OverlayPanel from 'overlay_panel';
//import 'added_menu.vx';
import 'dialog';
import 'file_info_menu';
import 'more_menu';
import 'resources';

function isBusy () {
  return false; // app.root.res.isBusy;
}

/**
 * 获取当前选择的节点
 */
function get_select_directory_node () {
  var res = app.root.res;
  var selectedNode = res.selectedNode();
  if (selectedNode) {
    if (selectedNode.icon != 'dir') {
      return selectedNode.getParentNode();
    }
  } else {
    return res;
  }
  return selectedNode;
}

// 创建新的下载目录
function new_downloads (cb) {
  
  var root = app.root.res;
  
  FileActionService.call('mkdir', 'downloads', function (info) {
    var 
    new_node = root.NewNode();
    new_node.text = 'downloads';
    new_node.leaf = true;
    new_node.info = info;
    new_node.icon = 'dir';
    
    var children = root.children;
    for (var i = 0; i < children.length; i++) {
      var item = children[i];
      if (item.icon != 'dir') {
        item.before(new_node);
        break;
      }
    }
    if (i == children.length) {
      root.append(new_node);
    }
    
    root.setSelectedNode(new_node); // 选择节点
    
    cb(new_node);
  }.err(cb));
}

/**
 * 添加
 */
function add (self, name, title, api, cb) {
  
  if (isBusy()) {
    return Dialog.error('无法添加,当前有任务没有完成!');
  }
  
  Dialog.prompt(title, name, function (new_name) {
    
    if (new_name === null) { // 取消
      return;
    }
    else if (!file_info_menu.verifyFileName(new_name)) {
      return Dialog.alert('名称不能为空或特殊字符', 
        add.bind(null, self, new_name, title, api, cb));
    }
    
    // OK
    var node = get_select_directory_node();
    var dir = node.path;
    var new_path = (dir ? dir + '/' : '') + new_name;
    
    FileActionService.call(api, new_path, function (info) {
      
      var new_node = node.root.NewNode();
      new_node.text = new_name;
      new_node.leaf = true;
      new_node.info = info;
      
      var children = node.children;
      for (var i = 0; i < children.length; i++) {
        var item = children[i];
        if (item.icon != 'dir') {
          item.before(new_node);
          break;
        }
      }
      if (i == children.length) {
        node.append(new_node);
      }
      
      if (node !== node.root) {
        node.expand();
      }
      
      node.root.setSelectedNode(new_node); // 选择节点
      
      cb({ node: new_node, path: new_path }); // 成功创建
    }.catch(function (err) {
      Dialog.error(err.message, add.bind(null, self, new_name, title, api, cb));
    }));
  });
}

/**
 * 添加map
 * @private
 */
function add_map (self) {
  
  if (isBusy()) {
    return Dialog.error('无法添加,当前有任务没有完成!');
  }
  var node = get_select_directory_node();
  
  FileActionService.call2('create_map', node.path, function (info) {
    
    //node.reload();
    var map = node.root.NewNode();
    map.text = '.map';
    map.icon = 'dir';
    var conf = node.root.NewNode();
    conf.text = 'conf.keys';
    conf.icon = 'keys';
    conf.leaf = true;
    node.prepend(map);
    map.append(conf);
    map.expand();
    node.root.setSelectedNode(conf);
    
    if (node !== node.root) {
      node.info = info;
      node.expand(); //展开
    }
    
    //***
    var conf_path = (node.path ? node.path + '/' : '') + '.map/conf.keys';
    var east_content = app.root.east_content;
    east_content.open(conf_path);
    
    node.root.onstartbusy.on(function (evt) { // 开始占线
      if (evt.data === node) { // 
        east_content.onrelease_view.off('add_map_config'); // 取消侦听
        node.root.onstartbusy.off('add_map_config');
      }
    }, 'add_map_config');
    
    east_content.onrelease_view.once(function (evt) {
      
      node.root.onstartbusy.off('add_map_config'); // 取消侦听
      
      var name = evt.data.get_filename();
      
      if (/\.map\/conf\.keys$/.test(name)) {
        // 测试连接
        var dir = name.replace(/\/?\.map\/conf\.keys$/, '');
        // var dir_node = app.root.res.find(dir);
        // if(!dir_node || node !== dir_node){
        //   return;
        // }
        
        FileActionService.call2('test_mapping', dir, function (is) {
          if (!is) { return }
          // TODO连接正常
          // TODO 提示用户是否要更新目录
          Dialog.confirm('检测到您刚刚添加了映射配置,是否立即从服务器更新目录', function (is) {
            if (is) {
              file_info_menu.updateMappingNode(node);
            }
          });
        });
      }
    }, 'add_map_config');
  });
}

function get_download_name (url, parent_node) {
  return path.basename(name) || util.id() + '';
}

function solve_download_name (url, name, parent_node) {
  
  // 是否为github下载  
  var mat = /^https:\/\/codeload\.github\.com\/([a-z0-9_\-\$]+)\/([a-z0-9_\-\$]+)\/([a-z0-9_\-\$]+)\/([a-z0-9_\-\$]+)$/i.exec(url);
  if (mat) {
    var proj = mat[2];
    var type = mat[3];
    var tag = mat[4];
    name = proj + '-' + tag + '.' + type;
  }
  
  var dir_path = parent_node.path;
  if (parent_node.root.find(dir_path ? dir_path + '/' + name : name)) { // 名称重复
    name = name.replace(/(_\d+)?(\.[^\.\/]+$|$)/, '_' + util.id() + '$2');
  }
  return name;
}

function download (url, cb, name) {
  
  var node = get_select_directory_node();
  if (node.root !== node && !node.isLoadData) { // 还没加载数据
    
    // 展开载入数据,并且监听一次加载完成事件
    node.root.onloaddata.once(function (evt) {
      evt.data.node.root.setSelectedNode(evt.data.node);
      download(url, cb, name); // 继续下载
    });
    node.expand(); // 展开会自动载入数据
    return;
  }
  
  if (!name) {
    name = get_download_name(url, node);
  }
  name = solve_download_name(url, name, node);
  var save = node.path ? node.path + '/' + name : name;

  if (isBusy()) {
    return cb.throw(loc('无法下载,当前有任务没有完成!'));
  }
  
  // TODO ?
  var new_node = node.root.NewNode();
  new_node.text = name;
  new_node.leaf = true;
  new_node.icon = resources.get_icon(name);
  node.append(new_node);
  
  if (node !== node.root) {
    node.expand(); // 展开
  }
  
  new_node.root.setSelectedNode(new_node); // 选择节点
  new_node.startBusy();
  new_node.root.onclickbusy.on(function () {
    view.create('StopAction')
      .setValue('停止下载')
      .setClickHandle(function () {
        // 发送stop下载信号
        FileActionService.call('stop_download', new_node.path);
      }).activate(new_node.busy_btn);
  }, 'stop_download');
  
  FileActionService.call('download', url, save, function (data) {
    if (data.rename && data.rename != name) { // 需要改名
      new_node.text = data.rename;
    }
    new_node.info = data.info;
    
    if (data.cancel) {
      cb();
    } else {
      cb(new_node);
    }
  }.catch(function (err) {
    new_node.remove();
    return cb.throw(loc('下载失败,请检查网络环境或下载地址是否有效'));
  }).finally(function () {
    new_node.root.onclickbusy.off('stop_download');
    new_node.stopBusy();
  }));
}

function nativeRequestDownload_confirm (url) {

  // 下载到 downloads 目录,如果没有这个目录创建一个
  var root = app.root.res;
  var node = root.find('downloads');
  
  if (node) { // 有这个目录
    // 选中这个目录,因为download函数会把文件下载到当前选中的目录
    root.setSelectedNode(node);
    download(url, function (err) { // 下载
      if (err) {
        Dialog.error(err);
      }
    });
    return;
  }
  
  // 如果没有这个目录创建一个
  new_downloads(function () {
    // 开始下载
    download(url, function () {
      // 成功下载到文件 
    }.catch(function (err) {
      Dialog.error(err);
    }));
  }.catch(function (err) {
    Dialog.error(err.message);
  }));
}

/**
 * native请求下载文件
 */
export function nativeRequestDownload (url) {
  
  if (isBusy()) {
    return Dialog.error('无法下载,当前有任务没有完成!');
  }

  Dialog.confirm(loc('确定要下载\n{0}').format(url), function (is) {
    if (is) {
      nativeRequestDownload_confirm(url);
    }
  });
}

// 建议解压zip
function downloadProposeUnzip (self, url, name) {
  
  download(url, function (node) {
    if (!node) { return } // 取消
    // 下载完成
    if (/\.zip$/i.test(node.text)) {
      // 下载的是一个压缩包,提示用户是否要解压
      Dialog.confirm('下载的文件似乎是个压缩包,是否尝试解压?', function (is) {
        if (is) {
          more_menu.decompress(node); // 解压
        }
      });
    }
  }.catch(function (err) {
    Dialog.error(err);
  }), name);
}

function download_web (self, url) {

  if (isBusy()) {
    return Dialog.error('无法下载,当前有任务没有完成!');
  }

  Dialog.prompt('输入要下载的文件URL', url || 'http://', function (url) {
    
    if (url === null) {
      return;
    }
    
    var mat = /^(https?:\/\/)?[a-z0-9_\-\$]+\.[a-z0-9_\-\$]+/i.exec(url);
    if (mat) {
      if (!mat[1]) {
        url = 'http://' + url;
      }
      downloadProposeUnzip(self, url);
    } else {
      Dialog.alert('请输入正确的URL', function () {
        download_web(self, url);
      });
    }
  });
}

function download_github (self, name) {

  if(isBusy()){
    return Dialog.error('无法下载,当前有任务没有完成!');
  }
  var node = get_select_directory_node();

  Dialog.prompt('输入GitHub项目路径', name || '(user)/(proj)/zip/master', function (url) {
    
    if (url === null) {
      return;
    }
    var mat = /^(https:\/\/codeload\.github\.com\/)?([a-z0-9_\-\$]+)\/([a-z0-9_\-\$]+)\/([a-z0-9_\-\$]+)\/([a-z0-9_\-\$]+)$/i.exec(url);
    if (mat) {
      url = 'https://codeload.github.com/';
      var user = mat[2];
      var proj = mat[3];
      var type = mat[4];
      var tag = mat[5];

      url += user + '/' + proj + '/' + type + '/' + tag;
      
      downloadProposeUnzip(self, url, proj + '-' + tag + '.' + type);
    }
    else {
      Dialog.alert('请输入正确的GitHub项目路径', function () {
        download_github(self, url);
      });
    }
  });
}

export class AddedMenu extends OverlayPanel {
  
  m_add_file_click_handle () {
  	add(this, 'NewFile.js', '输入新的文件名称', 'create', function (data) {
      if (!util.env.iphone && !util.env.ipod) { // 
        app.root.east_content.open(data.path);
      }
  	  data.node.icon = resources.get_icon(data.node.text);
  	});
  }
  
  m_add_dir_click_handle () {
  	add(this, 'NewDirectory', '输入新的目录名称', 'mkdir', function (data) {
  	  data.node.icon = 'dir';
  	});
  }
  
  // 添加映射,先创建一个本地目录
  m_add_ftp_sftp_click_handle () {
    var self = this;
    add(self, 'NewMappingDirectory', 
      '请先创建一个本地目录', 'mkdir', function (data) {
      data.node.icon = 'dir';
      add_map(self);
    });
  }
  
  m_add_ssh_remote_script_handle () {
    add(this, 'NewRemots.script', '输入新的文件名称', 'create_script', function (data) {
      app.root.east_content.open(data.path);
      data.node.icon = resources.get_icon(data.node.text);
    });
  }
	
  m_download_web_click_handle () {
    download_web(this);
  }
  
  m_download_GitHub_handle () {
    download_github(this);
  }
}
