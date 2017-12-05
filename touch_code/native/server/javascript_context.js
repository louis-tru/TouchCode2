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
$import('script_context::ScriptContext');

var NodeVirtualMachine = null;
try {
  NodeVirtualMachine = 
    process.binding('node_virtual_machine').NodeVirtualMachine;
} catch (err) { }

/**
 * @class JavascriptContext
 * @extends ScriptContext
 */
$class('JavascriptContext', ScriptContext, {
  
  m_node_ctx: null,
  
  /**
   * @constructor
   */
  constructor: function (name) {
    if (!NodeVirtualMachine)
      throw new Error(loc('暂不支持Javascript运行'));
    
    var self = this;
    
    self.ScriptContext(name);
    self.m_node_ctx = new NodeVirtualMachine('node', self.path, '--teide-start');
    
    self.m_node_ctx.onstart_handle = function () {
      // TODO
    };
    
    self.m_node_ctx.onstop_handle = function () {
      self.onexit.notice({ code: 0, signal: null });
    };
    
    self.m_node_ctx.onconsole_log_handle = function (data) {
      self.onstdout.notice(data);
    };
    
    self.m_node_ctx.onconsole_error_handle = function (data) {
      self.onstderr.notice(data);
    };
    
    self.m_node_ctx.onexception_handle = function (data) {
      // self.onstderr.notice(data);
      // console.log('javascript onException', data);
      self.onerror.notice(data);
    };
  },
  
  /**
   * @overwrite
   */
  run: function () {
    
    if (this.m_node_ctx.is_run()) {
      throw new Error(loc('已经开始运行'));
    }
    
    this.m_node_ctx.start(); // 启动
  },
  
  /**
   * @overwrite
   */
  stop: function () {
    this.m_node_ctx.stop(); // 停止
  },
  // @end
});

