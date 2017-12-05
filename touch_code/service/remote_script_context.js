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

$import(':truth/event');
$import(':truth/fs');
$import(':truth/keys');
$import(':truth/loc');
$import('script_context::ScriptContext');
$import('req:ssh2-connect as ssh2');
$import('req:ssh2-exec as exec');

/**
 * @class RemoteScriptContext
 * @extends ScriptContext
 */
$class('RemoteScriptContext', ScriptContext, {
  
  /**
   * @private
   */
  m_config: null,
  //
  m_child: null,
  m_is_run: false,
  
  /**
   * @constructor
   */
  constructor: function (name) {
    ScriptContext.call(this, name);
    var code = fs.readFileSync(this.path).toString('utf-8');
    this.m_config = keys.parse(code);
  },
  
  /**
   * @overwrite
   */
  run: function () {
    
    if(this.m_is_run) {
      throw new Error(loc('已经开始运行'));
    }
    
    var self = this;
    var config = this.m_config;
    
    if (config.type != 'ssh') {
      throw new Error(loc('暂时只支持SSH类型协议'));
      //return this.onerror.notice('暂时只支持ssh类型协议');
    }
    
    this.m_is_run = true;
    
    ssh2({
      host: config.host || 'localhost',
      username: config.user || 'anonymous',
      password: config.passwd || 'anonymous@',
      port: config.port || 22,
      //compress: true,
    }, function (err, ssh) {
      
      if (err) {
        self.onerror.notice(err);
        self.onexit.notice({ code: 0, signal: null });
        return;
      }

      if (!self.m_is_run) { // 已经结束
        ssh.end();
        self.onexit.notice({ code: 0, signal: 'KILL' });
        return;
      }

      var command = config.command.join('\n');
      self.m_child = exec({ cmd: command, ssh: ssh, end: true });
      self.m_child.stdout.on('data', function (data){
        data = data.toString('utf-8');
        if (data[data.length - 1] == '\n') {
          data = data.substr(0, data.length -1);
        }
        self.onstdout.notice(data);
      });

      var is_stderr = false;
      self.m_child.stderr.on('data', function (data){
        data = data.toString('utf-8');
        if (data[data.length - 1] == '\n') {
          data = data.substr(0, data.length -1);
        }
        is_stderr = true;
        self.onstderr.notice(data);
      });

      self.m_child.on('error', function (data) {
        self.onerror.notice(data);
        // (function (){
        //   if(self.m_is_run){
        //     self.m_is_run = false;
        //     self.onexit.notice({ code: 0, signal: null });
        //   }
        // }.delay(1000));
      });

      self.m_child.on('exit', function (code, signal) {
        // if(self.m_is_run){
        //   self.m_is_run = false;
        if (is_stderr) {
          self.onerror.notice('Error: stderr');
        }
        self.onexit.notice({ code: code, signal: signal });
        // }
      });
      
    });
    
    self.onstdout.notice('Connection ' + config.host);
  },
  
  /**
   * @overwrite
   */
  stop: function () {
    this.m_is_run = false;
    if (this.m_child) {
      this.m_child.kill(); // 杀死
    }
  },
  // @end
});

