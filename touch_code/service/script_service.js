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

$import(':truth/loc');
$import(':truth/util');
$import(':truth/event');
$import('remote_script_context::RemoteScriptContext');
$import('javascript_context::JavascriptContext');
$import('console2');

var native_util = null;
try {
  native_util = process.binding('native_util');
} catch(err) { }

/**
 * 通过名称获取后缀
 */
function get_suffix(name) {
  var mat = name.match(/\.([^\.]+)$/);
  if (mat) {
    return mat[1].replace(/\+/g, 'p').toLowerCase();
  }
  return '';
}

/**
 * 通过文件后缀获取构造器
 */
function get_constructor(suffix){
  
  switch (suffix) {
    case 'script':
      return RemoteScriptContext;
    case 'js':
      return JavascriptContext;
    default:
      return null;
  }
}

/**
 * 是否支持
 */
function is_support_high() {
  if (native_util) {
    if(native_util.request_is_lite() &&  // lite 版本无法运行
      !native_util.request_is_lite_x()) { // lite_x 版本可运行
      //throw new Error('只有Ph与Pro版本才有此功能');
      return false;
    }
    return true;
  }
  return false;
}

/**
 * 脚本运行服务
 * @class ScriptService
 */
$class('ScriptService', {
  
  /**
   * @type ScriptContext
   */
  m_context: null,
  
  /**
   * 运行启动
   */
  onstart: null,
  
  /**
   * 退出
   */
  onexit: null,
  
  /**
   * 退出
   */
  onerror: null,
  
  /**
   * @constructor
   */
  constructor: function (){
    event.init_events(this, 'start', 'exit', 'error');
  },
  
  /**
   * 是否可运行这个文件
   */
  is_can_run: function (name){
    var suffix = get_suffix(name);
    var constructor = get_constructor(suffix);
    return !!constructor;
  },

  is_run_status: function (){
    return !!this.m_context;
  },

  /**
   * 强制运行
   * 如果当前有运行的上下文,停止当前,运行一个新的
   */
  force_run: function (name){
    var self = this;
    if (!self.m_context) { 
      return self.run(name);
    }
    
    // 正在运行中,结束它
    self.m_context.onexit.on(function () { // 监听结束事件
      util.next_tick(function () {
        if(self.m_context){ // 如果还没有结束,报告异常
          self.onerror.notice({ msg: 'Run force error' });
        }
        self.run(name);  // 重新运行
      });
    });
    self.m_context.stop();
  },
  
  /**
   * 运行脚本
   */
  run: function (name){
    var self = this;
    
    if (!is_support_high()) {
      return self.onerror.notice({ message: loc('只有Ph与Pro版本才有此功能'), code: 109 });
    }
    
    if (self.m_context) {
      return self.onerror.notice({ message: loc('同时只能运行一个脚本文件'), code: 104 });
    }
    
    var suffix = get_suffix(name);
    var constructor = get_constructor(suffix);
    if (!constructor) {
      return self.onerror.notice({ message: loc('无法运行的文件类型'), code: 103 });
    }
    try {
      self.m_context = new constructor(name);
    }
    catch(err) {
      console2.error(err.message);
      return self.onerror.notice({ message: loc('运行异常详情请见控制台日志'), code: 102 });
    }

    self.m_context.onstdout.on(function (evt) {
      console2.log(evt.data); // 打印日志
    });
    
    self.m_context.onstderr.on(function (evt) {
      console2.error(evt.data);
    });
    
    self.m_context.onerror.on(function (evt) {
      console2.error(evt.data);
      self.onerror.notice({ message: loc('运行异常详情请见控制台日志'), code: 102 });
    });
    
    self.m_context.onexit.on(function (evt){
      self.m_context = null;
      self.onexit.notice(te.extend({ name: name }, evt.data)); // 通知退出
    });
    
    try {
      self.m_context.run();
    }
    catch(err) {
      self.onerror.notice({ message: err.message, code: 105 });
    }
    self.onstart.notice({ name: name }); // 通知启动
  },
  
  /**
   * 停止运行脚本
   */
  stop: function () {
    if (this.m_context) {
      this.m_context.stop(); // 发送停止信号
    }
  },
  
});

var share = null;

exports = {
  
  /**
    * 是否支持高级功能
    */
  is_support_high: is_support_high,
  
  /**
   * 获取共享服务
   */
  share: function () {
    if (!share) {
      share = new ScriptService();
    }
    return share;
  },
};