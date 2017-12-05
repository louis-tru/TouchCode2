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

//import ':gui/app';
import ':util';
//import ':truth/loc';
//import ':wgui/view';
import 'more_menu.vx';
import 'dialog';
import 'resources';
import OverlayPanel from 'overlay_panel';

function isBusy () {
  return false; // app.root.res.isBusy;
}

function solve_compress_name_repeat (path) {
  // if (app.root.res.find(path)) { // 名称重复
  //   path = path.replace(/(_\d+)?(\.[^\.\/]+$|$)/, '_' + util.id() + '$2');
  // }
  return {
  	path: path,
  	name: path.match(/[^\/]+$/)[0]
  };
}

function decompress (node) {
  
	if (isBusy()) {
		return Dialog.alert('无法解压,当前有任务没有完成!');
	}
  
	if (!/\.zip/i.test(node.text)) {
		return Dialog.alert('只有zip文件才能被解压缩');
	}
  
	var target = node.path;
	 
	function done (list) {
	  
    // debugger;
    
    var parent = node.getParentNode();
    var dirPath = parent.path ? parent.path + '/' : '';

    for (var i = 0; i < list.length; i++) {
      
      // TODO ?
      var data = list[i];
      var oldNode = node.root.find(dirPath + data.text);
      if (oldNode) { // 文件节点存在, 删除
        oldNode.remove();
      }
      
      var new_node = node.root.NewNode();
      new_node.text = data.text;
      new_node.leaf = data.leaf;
      new_node.info = data.info;
      new_node.icon = data.icon;

      if (data.icon == 'dir') {

        var children = parent.children;

        for (var j = 0; j < children.length; j++) {
          var item = children[j];
          if (item.icon != 'dir') {
            item.before(new_node);
            break;
          }
        }
        if (j == children.length) {
          parent.append(new_node);
        }
      }
      else {
        parent.append(new_node);
      }
    }
	}
  
	node.startBusy();
  node.root.onclickbusy.on(function () {
    view.create('StopAction')
      .setValue('停止解压')
      .setClickHandle(function () {
        // stop 解压缩信号
        FileActionService.call('stop_decompress', node.path);
      }).activate(node.busy_btn);
  }, 'stop_decompress');
  
	FileActionService.call('decompress', target, util.finally(function (err, list) {
    node.root.onclickbusy.off('stop_decompress');
    node.stopBusy();
    if (err) {
      return Dialog.alert('解压缩文件失败');
    }
    done(list);
	}));
}

function compress (node) {
	if (isBusy()) {
		return Dialog.alert('无法压缩,当前有任务没有完成!');
	}
  
	node.startBusy();
  node.root.onclickbusy.on(function () {
    view.create('StopAction')
      .setValue('停止压缩')
      .setClickHandle(function () {
        // stop 压缩信号
        FileActionService.call('stop_compress', node.path);
      }).activate(node.busy_btn);
  }, 'stop_compress');
  
	var target = node.path;
	var save = solve_compress_name_repeat(target + '.zip');

	FileActionService.call('compress', target, save.path, util.finally(function (err, data) {
    node.root.onclickbusy.off('stop_compress');
    node.stopBusy();
    
    if (err) {
  	  return Dialog.alert('压缩文件失败');
    }
    
    if (data.cancel) { // 压缩被取消
      return;
    }
    
	  var new_node = node.root.NewNode();
    new_node.info = data.info;
	  new_node.text = save.name;
	  new_node.leaf = true;
	  new_node.icon = resources.get_icon(save.name);
	  node.getParentNode().append(new_node);
	  node.root.setSelectedNode(new_node); // 选择节点
	}));
}

function init (self) {
  if (app.root.application_info.is_lite) {
    if (util.env.ios) {
      self.buy_pro_btn.show();
    } 
  }
}

/**
 * @class MoreMenu
 * @bases overlay_panel::OverlayPanel
 */
export class MoreMenu extends OverlayPanel {
  
  // 不脆弱,不会一点击就消失
  // frail: false,
  
	/**
	 * @constructor
	 */
	constructor (tag) {
		OverlayPanel.call(this, tag);
    this.onload_view.$on(init);
	}
	
  m_preferences_click_handle () {
    app.root.west.push('PreferencesView', true);
  }
	
  m_connect_device_click_handle () {
    
    NativeService.call('get_network_host', function (host) {
      
      if (host) {
        NativeService.call('sleep_disabled', [true]); // 禁用睡眠
        Dialog.alert_html(loc('Touch Code 保持唤醒状态用浏览器打开') + '<br/>\
<a href="javascript:truth.req(\':truth/app\').root.open_web_browser\
(\'http://{0}/documents/\')">http://{0}/documents/</a>'.format(host), function () {
          NativeService.call('sleep_disabled', [false]); // 启用睡眠
        });
      }
      else {
        if (util.env.ios || util.env.android || util.env.windows_phone) {
          Dialog.error('检测到设备没有连接到网络,请先将设备连接到wifi网络');
        }
        else {
          Dialog.error('检测到设备没有连接到网络,请先将设备连接到网络');
        }
      }
    });
  }
  
  m_refresh_root_click_handle () {
    if (isBusy()) {
		  return Dialog.error('无法刷新目录,当前有任务没有完成!');
    }
    //   app.root.res.reload();
  }
  
	m_about_click_handle () {
	  var about = view.create('AboutDialog');
	  about.ver.text = app.root.application_info.version;
	  about.show();
	}
  
  // 建议与bug
  m_suggest_click_handle () { 
    NativeService.call('send_email_to_author');
  }
  
  m_buy_pro_click_handle () {
    NativeService.call('open_app_store_buy_pro');
  }
  
  m_keep_activate_click_handle (evt) {
    // NativeService.call('sleep_disabled', [true]); // 禁用睡眠
    // NativeService.call('sleep_disabled', [false]); // 启用睡眠
    evt.return_value = false;
    this.keep_activate.toggle_cls('on');
  }
  
  m_visit_nodejs_click_handle () {
    app.root.open_web_browser('http://nodejs.org');
  }
  
  // @end
}

/**
 * sopt action ui control
 * @class StopAction
 * @extends OverlayPanel
 */
export class StopAction extends OverlayPanel {

  m_click_handle: null;
  
  priority: 'left';
  
  setPriority (value) {
    this.priority = value;
    return this;
  }

  setValue (value) {
    this.m_display_text.text = loc(value);
    return this;
  }
  
  m_stop_action_click_handle () {
    if (this.m_click_handle) {
      this.m_click_handle();
    }
  }
  
  /**
   * 设置处理handle
   */
  setClickHandle (handle) {
    this.m_click_handle = handle;
    return this;
  }
  // @end
}

export class AboutDialog extends dialog.Dialog {

  m_contact_author_click_handle () {
    NativeService.call('send_email_to_author');
  }
  // 
}

exports = {

	/**
	 * 解压节点
	 */
	decompress: decompress,
	
	/**
	 * 压缩节点
	 */
	compress: compress,
};
