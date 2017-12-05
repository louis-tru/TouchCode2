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

$import(':truth/util');
$import(':truth/fs');
$import('preferences');
// console.log(new Date().toString('yyyy-MM-dd hh:mm:ss.fff'), 'TEST 0');
$import(':tplus/server::Server');
// console.log(new Date().toString('yyyy-MM-dd hh:mm:ss.fff'), 'TEST 1');

var native_util = null;

try {
  native_util = process.binding('native_util');
} catch (err) { }

var language = 'local_en';
var lang = native_util ? native_util.request_get_system_language() : util.language;

if (!/^en(_|-)?.*$/.test(lang)) {
  language = {
    'en': 'local_en',
    'zh-cn': 'local_zh-cn',
    'zh-tw': 'local_zh-tw',
  }[lang] || 'local_en';
}

$import(language);

var test_documents_path = 
  util.format(util.config.server.documents_path || 'out/documents') + '/';
  
var has_ios_native = 
    process.platform == 'ios' || 
    process.config.variables.OS == 'ios' ||
    process.env.platform == 'ios';

if (!util.debug) {
	// 只有在非调试时
	// error
	util.onerror.on(function (evt) {
		console.error(evt.data.stack);
		evt.return_value = false;
	});
}

/**
 * @class ApplicationServer
 * @extends Server
 */
$class.private('ApplicationServer', Server, {
  
  // private:
  // 文档目录
  m_documents_path: '',

  // public:
	/**
	 * @constructor
	 */
  func constructor () {
	  
		if (has_ios_native) {
      
      var opt = util.extend({ }, util.config.server);
      // TODO 设置为沙盒文件系统中的temp目录
      opt.temp = process.env.HOME + '/tmp/';
		  // TODO 在ios系统中运行时这个路径设置为app沙盒文件系统的文档目录
		  self.m_documents_path = process.env.HOME + '/Documents/';
      // TODO 沙盒系统中的路径
		  self.root = util.format($.__lib_path, '..');
      Server.call(self, opt);
		} else {
      Server.call(self, util.config.server);
      
      self.m_documents_path = test_documents_path;
      // create test dir
      fs.mkdir_p_sync(self.m_documents_path);
		}
		
		if (!util.debug) {
		  self.auto_index = false;
		  self.print_log = false;
		}
    
		process.on('ApplicationDidEnterBackground', function () {
			if(self.is_run){
				self.stop();
			}
		});
    
		process.on('ApplicationWillEnterForeground', function () {
			if (!self.is_run) {
				self.start();
			}
		});
	},
	
	start: function () {
	  Server.members.start.call(this);
	  if (native_util) { // 通知native
	    util.next_tick(function () {
	      native_util.request_notify_start_server();
	    });
	  }
	},
	
	/**
	 * 获取文档根目录
	 */
	get documents_path () {
	  return this.m_documents_path;
	},
  // @end
});

var share = null;

exports = {
  
  /**
    * 获取共享服务器
    */
  get share () {
    if (!share) {
      share = new ApplicationServer();
    }
    return share;
  },
  
	/**
	 * 获取文档根目录
	 */
	get documents_path () {
	  return this.share.m_documents_path;
	},
	
	// 系统言语
	get language () {
		return lang;
	},
  
	get has_ios_native () {
		return has_ios_native;
	},
  
  // 获取偏好设置
  get preferences () {
    return preferences.share(exports.documents_path);
  },
};
