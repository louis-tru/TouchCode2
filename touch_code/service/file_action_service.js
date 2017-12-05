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
$import(':truth/loc');
$import(':truth/loc::rep');
$import(':truth/event::EventDelegate');
$import(':truth/fs');
$import(':tplus/service');
$import(':tplus/ws_service::SocketService');
$import('revision_control_service::RevisionControlService');
$import('app');
$import('api_service');
$import('script_service');
$import('console2');
$import('preferences');
$import('req:wget');

var zip = null;
var NativeFile = null;
try {
  zip = process.binding('native_zip');
  NativeFile = process.binding('native_fs').NativeFile;
} catch (e) { }

//
function compare (a, b) {
	a = a.text.toLowerCase();
	b = b.text.toLowerCase();
	var l = Math.max(a.length, b.length);
	for (var i = 0; i < l; i++) {
		var codea = (a.substr(i,1) || 'a').charCodeAt(0);
		var codeb = (b.substr(i,1) || 'a').charCodeAt(0);
		if (codea != codeb) {
			return codea - codeb;
		}
	}
	return 0;
}

function get_icon (name) {
  var mat = name.match(/\.([^\.]+)$/);
  if (mat) {
    return mat[1].replace(/\+/g, 'p').toLowerCase();
  }
  return '';
}

function get_clone_name (name) {
	return name.replace(/(_clone\d+)?(\.[^\.\/]+$|$)/, '_clone' + util.id() + '$2');
}

// 解决路径重复
function solve_name_repeat (self, name) {
  if (fs.existsSync(app.documents_path + name)) { // 文件已存在,改名
    name = name.replace(/(_\d+)?(\.[^\.\/]+$|$)/, '_' + util.id() + '$2');
  }
  return name;
}

/**
 * 创建新的管理器
 */
function new_revision_control_service () {
  return new RevisionControlService(app.documents_path);
}

// 保存的日志文件
var console_log_file = 'console.log';

// 共享console.log流
var share_write_stream = null;

/**
 * 初始console流写入
 */
var init_console_write_stream = function () {
  
  init_console_write_stream = util.noop;
  
  console2.onlog.on(function (evt) {
    share_write_stream.write(evt.data + '\n');
  });
  
  console2.onerror.on(function (evt) {
    share_write_stream.write(evt.data + '\n');
  });
};

/**
 * 重新初始写入流
 */
function reload_write_stream (force) {
  if (share_write_stream) {
    if (force) // 强制重新初始
      share_write_stream.destroy();
    else 
      return;
  }
  var path = app.documents_path + console_log_file;
  share_write_stream = fs.createWriteStream(path, { flags: 'a' });
  share_write_stream.on('error', function (){
    reload_write_stream(true); // 错误
  });
  
  init_console_write_stream();
}

/**
 * init
 */
function init_FileActionService (self) {
  self.m_event_handle_id = util.id();
  
  console2.onlog.on(function (evt){
    self.onconsole_log.notice(evt.data);
  }, self.m_event_handle_id + 'onconsole_log');
  
  console2.onerror.on(function (evt){
    self.onconsole_error.notice(evt.data);
  }, self.m_event_handle_id + 'onconsole_error');
  
  reload_write_stream(); //重新初始写入流

	self.conv.onclose.on(function () { // 监控连接是否关闭
		stop_download(self);
		stop_compress(self);
		stop_decompress(self);
		stop_clone(self);
		stop_delete(self);
		stop_update_or_submit(self);
		release_FileActionService(self); //释放
	});
}

/**
 * 释放
 */
function release_FileActionService (self) {
  console2.onlog.off(self.m_event_handle_id + 'onconsole_log');
  console2.onerror.off(self.m_event_handle_id + 'onconsole_error');
}

/**
 * 停止下载
 */
function stop_download (self) {
  var m_download = self.m_download;
	if (m_download) {
	  if (m_download.request) {
	    self.m_download = null;
      m_download.request.abort();
    }
	}
}

function stop_compress (self) {
	if (self.m_zip_compress) {
		self.m_zip_compress.close();
		var exists = fs.existsSync(self.m_zip_compress.path);
		if (exists) 
			fs.unlinkSync(self.m_zip_compress.path);
		self.m_zip_compress = null;
	}
}

function stop_decompress (self) {
	if (self.m_zip_decompress) {
		self.m_zip_decompress.close();
  	self.m_zip_decompress = null;
	}
}

/**
 * 获取解压文件数据
 */
function get_decompress_file_list (self, zip_decompress) {
	var output = zip_decompress.output;
	var dirPath = zip_decompress.dirPath;
	var map = new_revision_control_service();
	var ls = [];
  
	for (var name in output) {
		// map.add(dirPath + name);
		var data = {
		  text: name,
		  leaf: false,
		  info: map.stat_code(dirPath + name)
		};
		
		if (output[name] == 'file') {
			data.leaf = true;
			data.icon = get_icon(name);
		} else 
		  data.icon = 'dir';
		ls.push(data);
	}
	
	map.release();
  return ls;
}

/**
 * 停止克隆
 */  
function stop_clone (self) {
  if (self.m_clone_handle) {
    self.m_clone_handle.cancel();
    self.m_clone_handle = null;
  }
}

/**
 * 停止删除
 */
function stop_delete (self) {
  if (self.m_delete_handle) {
    self.m_delete_handle.cancel();
    self.m_delete_handle = null;
  }
}

/**
 * 停止更新与提交
 */
function stop_update_or_submit (self) {
  if (self.m_update_or_submit_handle) {
    self.m_update_or_submit_handle.cancel();
    self.m_update_or_submit_handle = null;
  }
}

/**
 * @class FileActionService
 * @extends SocketService
 */
$class('FileActionService', '@service', SocketService, {
  // @private:
	m_download: null,           // 当前下载对像
	m_zip_decompress: null,     // 当前解压对像
	m_zip_compress: null,       // 当前压缩对像
	m_clone_handle: null,       // 克隆句柄
	m_delete_handle: null,      // 删除句柄
	m_update_or_submit_handle: null, // 更新或提交文件句柄
  
  // @public:
	'@event onconsole_log': null,        // 控制台日志
	'@event onconsole_error': null,      // 控制台错误日志
	'@event ondownload_process': null,   // 下载进度变化事件
	'@event onupload_file': null,        // 上传文件事件
  
  /**
   * @constructor
   */
  constructor: function (conv) {
    SocketService.call(this, conv);
    init_FileActionService(this);
  },
  
  /**
   * 通知上传了新文件
   */
  onupload_file_notice: function (dir, data) {
    
    var map = new_revision_control_service();
    var results = [];
    
    for(var i = 0; i < data.length; i++){
      var name = data[i];
  		var item = {
  		  text: name, 
  		  leaf: true,
  		  info: map.stat_code(dir + name),
  		  icon: get_icon(name),
  		};
  		results.push(item);
    }
    map.release();
    // console.log(dir, results);
    this.onupload_file.notice({ dir: dir, data: results});
  },

  /**
   * 停止当前下载,信号
   */
  stop_download: function () {
    stop_download(this);
  },
  
  /**
   * 停止压缩,信号
   */
  stop_compress: function () {
		stop_compress(this);
  },
  
  /**
   * 停止解压缩,信号
   */
  stop_decompress: function () {
		stop_decompress(this);
  },
  
	/**
	 * 停止克隆,信号
	 */  
  stop_clone: function () {
    stop_clone(this);
  },
  
  /**
   * 停止删除,信号
   */
  stop_delete: function () {
    stop_delete(this);
  },
  
	/**
	 * 停止更新与提交,信号
	 */
  stop_update_or_submit: function () {
    stop_update_or_submit(this);
  },
  
  /**
   * 下载文件
   */
  download: function (target, save, cb) {
    var self = this;
    
    if (self.m_download)
    	return cb.throw(loc('当前正在下载状态'));
    	
    var save_path   = app.documents_path + save;
    var download    = wget.download(target, save_path);
    var header_name = '';
    
		self.m_download = {
			download: download,
			target: target,
			save: save,
		};
		
		download.on('ready', function (data) {
		  //content-disposition "attachment; filename=iscroll-master.zip"
		  var disposition = data.res.headers['content-disposition'];
		  if (disposition) {
		    var mat = disposition.match(/filename=([^\;\&]+)/i);
		    if (mat)
		      header_name = mat[1];
		  }
		  
			if (self.m_download) {
				self.m_download.request = data.req;
				self.m_download.response = data.res;
			} 
			else
				data.res.close(); // 关闭
		});
		
		download.on('error', function (err) {
		  console2.log(err);
	    self.m_download = null;
	    if (cb) {
        cb.throw(err);
        cb = null;
	    }
		});
    
		download.on('end', function (output) {
		  if (!cb) return;
			var cancel = !self.m_download; // 是否取消
			var rest = { cancel: !self.m_download };
			self.m_download = null;
			
      // 是否要改正名字,以响应头中的名字命名 ?
      if (header_name) {
        var ls = save.split('/');
        if (header_name != ls[ls.length - 1].replace(/_[\d]+/, '')) { // 不相似需要改名
          ls[ls.length - 1] = header_name;
          save = solve_name_repeat(self, ls.join('/'));
          fs.renameSync(save_path, app.documents_path + save);
          rest.rename = save.split('/').pop();
        }
      }
      
      var map = new_revision_control_service();
      rest.info = map.stat_code(save);
      cb(rest);
      cb = null;
      map.release();
		});
    
    var progress_int = 0;
    
		download.on('progress', function (progress) {
      progress = progress || 0;
      
      var i = Math.round(progress * 100);
      if (progress_int == i) {
        return;
      }
      progress_int = i;
      
      // 为节省性能,只发送总数
		  self.ondownload_process.notice({ target: target, save: save, progress: progress });
		});
		
    // 初始进度 0%
    self.ondownload_process.notice({ target: target, save: save, progress: 0 });
  },
  
  /**
   * 添加zip压缩文件
   * {String} target 压缩的目录文件
   * {String} save 	 压缩保存的zip文件
   */
  compress: function (target, save, cb) {
  	if (!zip) {
  		return cb.throw(loc('不支持压缩功能'));
  	}
    var self = this;
    
    if (self.m_zip_compress) {
    	return cb.throw(loc('当前正在压缩状态'));
    }
    
  	var ls = target.split('/');
  	var name = ls.pop();
  	
    if (name == '.map') {
  	  return cb.throw(loc('不能压缩.map文件'));
  	}
  	
  	var zip_path = app.documents_path + save;
  	
  	self.m_zip_compress = new zip.ZipCompress(zip_path);
  	self.m_zip_compress.target = target;
  	self.m_zip_compress.path = zip_path;
  	self.m_zip_compress.save = save;
  	
    // 开始压缩
  	var dirPath = (ls.length ? ls.join('/') + '/' : '');
  	var rootPath = app.documents_path + dirPath;
  	
  	function error (err) {
  		stop_compress(self);
  		cb.throw(err);
  	}
    
		function done () {
      if(self.m_zip_compress){
			  self.m_zip_compress.close(); // 关闭
        self.m_zip_compress = null;
        var map = new_revision_control_service();
        cb({ info: map.stat_code(save), cancel: false });
        map.release();
      } else // 已取消,压缩的文件被删除
		    cb({ cancel: true });
		}

  	function each_directory (target, callback) {
  		var source = rootPath + target;
  		
  		fs.readdir(source, function (err, ls) {
  			if (err)
  				return error(err);
  			if (!self.m_zip_compress) // 已经被强制停止
  				return done(); // 结束
  				
  			function shift (err) {
  				if (err)
  					return error(err);
  				if (!ls.length)
  					return callback();
  				
  				var name = ls.shift();
  				if (name == '.map') {
            // console.log('**************************.MAP**************************');
  				  shift();
  				} else
  				  compress(target + '/' + name, shift);
  			}
  			shift();
  		});
  	}
  	
  	function compress (target, callback) {
  		var source = rootPath + target;
  		
  		fs.stat(source, function (err, stat){
  			if (err)
  				return error(err);
  			if (!self.m_zip_compress) // 已经停止
  				return callback();
  				
  			if (stat.isDirectory())
  				each_directory(target, callback);
  			else {
          console2.log('Zip c', dirPath + target);
					if (self.m_zip_compress.compress(source, target))
						callback();
					else
						error(loc('压缩文件失败'));
  			}
  		});
  	}
  	compress(name, done);
  },

	/**
	 * 解压缩zip包
	 */
	decompress: function (target, cb) {
		if (!zip) {
			// return cb('not support decompress');
			return cb.throw(loc('不支持解缩功能'));
		}
		var self = this;
		
    if (self.m_zip_decompress)
    	return cb.throw(loc('当前正在解压状态'));
    	
  	var zipPath = app.documents_path + target;
  	try {
  		self.m_zip_decompress = new zip.ZipDecompress(zipPath);
  	}
  	catch (err) {
  		if (self.m_zip_decompress) {
  			self.m_zip_decompress = null;
  		}
  		return cb.throw(err);
  	}
  	
    var m_zip_decompress = self.m_zip_decompress;
  	self.m_zip_decompress.target = target;
  	self.m_zip_decompress.path = zipPath;
  	self.m_zip_decompress.output = { };
    
  	// 开始解压
  	var ls = target.split('/'); ls.pop();
  	var dirPath = (ls.length ? ls.join('/') + '/' : '');
  	var rootPath = app.documents_path + dirPath;
  	self.m_zip_decompress.dirPath = dirPath;
  	self.m_zip_decompress.rootPath = rootPath;
    
  	function done () {
      if (self.m_zip_decompress) {
        self.m_zip_decompress.close(); // 关闭
        self.m_zip_decompress = null;
      }
			var data = get_decompress_file_list(self, m_zip_decompress);
			cb(data);
  	}
  	
  	function decompress () {
  		if (!self.m_zip_decompress) // 已经被强制停止
  			return done();
  		var name = self.m_zip_decompress.name();
  		var save = rootPath + name;
  		var is;
  		
  		try {
  		  console2.log('Zip x', dirPath + name);
				is = self.m_zip_decompress.decompress(save);
			} catch (err) {
				stop_decompress(self);
  			return cb.throw(err);
			}

  		if (is) {
				var name1 = name.match(/^[^\/]+/)[0]; // 只添加目录与当前目录的文件
				if (!self.m_zip_decompress.output[name1]) {
					self.m_zip_decompress.output[name1] = (name == name1 ? 'file' : 'dir');
				}
  			if (!self.m_zip_decompress.next()) { // 下一个文件
  				done(); // 定位失败表示解压完成
  			} else {
  				decompress.delay(1); // 解压5个文件歇会,这里主要是不想出现死循环,把线程阻塞
          // nextTick(decompress);
  			}
  		} else {
				stop_decompress(self);
  			cb.throw('解压文件失败');
  		}
  	}
  	decompress();
	},
  
	/**
	 * get project resources list by path
	 * @param {String}   path
	 * @param {Function} cb
	 */
	read_files_list: function (path, cb) {
    var map = new_revision_control_service();
    
    path = path ? path.replace(/\/?$/, '/') : '';
    
    fs.ls(app.documents_path + path, function (err, ls) {
			if (err) 
				return cb.throw(err);
			var dir = [];
			var leaf = [];
			
			for (var i = 0, l = ls.length; i < l; i++) {
				var info 			= ls[i];
				var name 			= info.name;
				var new_path 	= path + name;
				
        // 排除一些文件,这些文件不需要提供给用户
        if (!/\.map(\/conf\.keys)?$/.test(new_path)) {
          if (api_service.is_exclude_file(new_path))
  					continue;
        }
        
				var data = { 
				  text: name, 
				  leaf: false, 
				  info: map.stat_code(new_path)
				};
				if (!info.dir) {
					data.leaf = true;
					data.icon = get_icon(name);
					leaf.push(data);
				} else {
				  data.icon = 'dir';
				  dir.push(data);
				}
			}
			map.release();
			cb(dir.sort(compare).concat(leaf.sort(compare)));
		});
	},
	
	/**
	 * 获取文件info标识
	 */
	read_file_info: function (path, cb) {
	  var map = new_revision_control_service();
	  cb(map.stat_code(path));
	  map.release();
	},
  
	/**
	 * save text file
	 * @param {String}    filename
	 * @param {String}    code
	 * @param {Number[]}  breakpoints
	 * @param {Object}    folds
	 * @param {Function}  cb
	 */
	save_file_as_text: function (name, code, attachment, cb) {
		var root = app.documents_path;
		var path = root + name;
		
		fs.exists(path, function (exists) {
			if (!exists)
				return cb.throw(loc('文件不存在'));
			fs.writeFile(path, code, function (err) {
			  if (err) { return cb.throw(err) }
				app.preferences.set_file_property(name, attachment);
				var map = new_revision_control_service();
				cb(map.stat_code(name));
				map.release();
			});
		});
	},
  
	/**
	 * 保存文本文件折叠信息
	 */
	save_text_folds: function (name, folds, cb) {
		app.preferences.set_folds(name, folds);
		cb();
	},
  
  /**
   * 保存文本断点信息
   */
	save_text_breakpoints: function (name, breakpoints, cb) {
	  app.preferences.set_breakpoints(name, breakpoints);
		cb();
	},
	
	/**
	 * 文件是否存在
	 */
	exists: function (name, cb) {
	  fs.exists(app.documents_path + name, function (exists){
	    cb(exists);
	  });
	},
  
	/**
	 * create directory
	 * @param {String}    path
	 * @param {Function}  cb
	 */
	mkdir: function (name, cb) {
	  console2.log('Mkdir local', name);
		var path = app.documents_path + name;
		
		fs.exists(path, function (exists) {
			if (exists)
				return cb.throw(loc('目录已存在'));
			fs.mkdir(path, function (err) {
			  if (err) return cb.throw(err);
			  var map = new_revision_control_service()
			  cb(map.stat_code(name));
			  map.release();
			});
		});
	},
	
	/**
	 * 创建目录映射
	 */
	create_map: function (dir, cb) {
	  var map_path = app.documents_path + (dir ? dir + '/.map': '.map');
	  var keys_path = map_path + '/conf.keys';
	  
		fs.exists(keys_path, function (exists) {
			if (exists)
				return cb.throw(loc('无需重复添加,请打开文件.map/conf.keys'));
				
			fs.mkdir(map_path, function (err) {
			  if (err) return cb.throw(err);
        var demo_path = script_service.is_support_high() ? 
          get_path('./template/demo.mapping.txt') : 
          get_path('./template/demo2.mapping.txt');
        var code = rep(fs.readFileSync(demo_path).toString('utf-8'));
        
  			fs.writeFile(keys_path, code, function (err) {
  			  if (err) return cb.throw(err);
  			  var map = new_revision_control_service();
  			  cb(map.stat_code(dir));
  			  map.release();
  			});
			});
		});
	},
	
	/**
	 * 创建远程脚本
	 */
	create_script: function (name, cb) {
		var path = app.documents_path + name;
		fs.exists(path, function (exists) {
			if (exists)
				return cb.throw('File already exists');
      var demo_path = script_service.is_support_high() ? 
        get_path('./template/demo.script.txt') : 
        get_path('./template/demo2.script.txt');
      var code = rep(fs.readFileSync(demo_path).toString('utf-8'));
      
			fs.writeFile(path, code, function (err) {
			  if (err) return cb.throw(err);
			  var map = new_revision_control_service()
			  cb(map.stat_code(name));
			  map.release();
			});
		});
	},
  
	/**
	 * create file
	 * @param {String}    name
	 * @param {Function}  cb
	 */
	create: function (name, cb) {
    console2.log('A local', name);
		var path = app.documents_path + name;
		
		fs.exists(path, function (exists) {
			if (exists)
				return cb.throw(loc('文件已存在'));
			var code = '';
			var suffix = name.match(/\.?([^\.]+)$/)[1].toLowerCase();
			var demo_path = get_path('./template/demo.' + suffix + '.txt');
			
			if (fs.existsSync(demo_path))
			  code = rep(fs.readFileSync(demo_path).toString('utf-8'));
			fs.writeFile(path, code, function (err) {
			  if (err) return cb.throw(err);
			  var map = new_revision_control_service();
			  cb(map.stat_code(name));
			  map.release();
			});
		});
	},
  
	/**
	 * 删除文件或目录
	 * all 完全删除,删除本地与版本管理
	 */
	remove: function (name, all, cb) {
	  console2.log('D local', name);
    var self = this;
    var root = app.documents_path;
    
	  var delete_complete = function (err) {
      self.m_delete_handle = null;
      if (err) {
        return cb.throw(err);
      }
      
      if (fs.existsSync(root + name)) { // 文件还存可能是取消了
        var map = new_revision_control_service();
        cb(map.stat_code(name));
        map.release();
        return;
      }
      app.preferences.del_file_property(name);
      if(name == console_log_file){
        reload_write_stream(true);
      }
      cb();
	  };
	  
	  if (all) {
	    var map = new_revision_control_service();
      // 这些句柄必须提供一个cancel方法
      self.m_delete_handle = map;
	    self.m_delete_handle.remove(name, function () {
        map.release();
        delete_complete();
      }.catch(function (err) {
        map.release();
        delete_complete(err);
      }));   
	  } else {
      if (NativeFile) {
        self.m_delete_handle = new NativeFile();
        self.m_delete_handle.rm(root + name, delete_complete)
      } else {
        self.m_delete_handle = fs.rm_p(root + name, delete_complete);
      }
	  }
	},
  
	/**
	 * rename directory or file
	 * @param {String}    old_name
	 * @param {String}    new_name
	 * @param {Function}  cb
	 */
	rename: function (old_name, new_name, cb) {
    console2.log('R local', old_name, 'to', new_name);
		var root = app.documents_path;
    
    fs.exists(root + new_name, function (exists) {
      if (exists)
        return cb.throw(loc('文件已存在'));
      var map = new_revision_control_service();
      
      map.rename(old_name, new_name, function (data, cancel) {
        map.release(); // 结束
        if (cancel) {
          cb({ cancel: cancel, info: map.stat_code(new_name) });
        } else {
          app.preferences.rename_file_property(old_name, new_name);
          cb({ info : map.stat_code(new_name) });
        }
      }.catch(function (err) {
        map.release(); // 结束
        cb.throw(err);
      }));
    });
	},
  
	/**
	 * 文件克隆
	 * clone directory or file
	 * @param {String}    name
	 * @param {Function}  cb
	 */
	clone: function (name, cb) {
	  console2.log('C local', name);
	  var self = this;
		var root = app.documents_path;
		var new_name = get_clone_name(name);
		
    function callback (err) {
      self.m_clone_handle = null;
      if (fs.existsSync(root + name)) { // 文件存在
        var map = new_revision_control_service();
        cb({ name: new_name, info: map.stat_code(new_name) });
        map.release();
      } else
        cb.throw(err);
    }
    if (NativeFile) {
      self.m_clone_handle = new NativeFile();
      self.m_clone_handle.cp(root + name, root + new_name, callback)
    } else
  		self.m_clone_handle = fs.cp(root + name, root + new_name, callback);
	},
	
	/**
	 * 通过名称查询冲突
	 */
	conflict_list: function (name, cb) {
	  var map = new_revision_control_service();
	  map.conflict_list(name, function (data) {
	    map.release();
	    cb(data);
	  }.catch(function (err) {
	    map.release();
	    cb.throw(err);
	  }));
	},
	
	/**
	 * 更新
	 */
	update: function (name, cb) {
	  if (this.m_update_or_submit_handle)
	    return cb.throw(loc('有一个任务正在进行'));
	  var self = this;
	  var map = new_revision_control_service();
	  self.m_update_or_submit_handle = map;
	  
	  map.update(name, function () {
	    self.m_update_or_submit_handle = null;
	    cb(map.stat_code(name));
	    map.release();
	  }.catch(function (err) {
	    self.m_update_or_submit_handle = null;
	    if(typeof err == 'string')
    		err = { message: err };
    	err.info = map.stat_code(name);
    	cb.throw(err);
	    map.release();
	  }));
	},
	
	/**
	 * 提交更改
	 */
	submit: function (name, cb) {
	  if (this.m_update_or_submit_handle)
	    return cb.throw(loc('有一个任务正在进行'));
	  var self = this;
	  var map = new_revision_control_service();
	  self.m_update_or_submit_handle = map;
	  
	  map.submit(name, function () {
	    self.m_update_or_submit_handle = null;
	    cb(map.stat_code(name));
	    map.release();
	  }.catch(function (err) {
	    self.m_update_or_submit_handle = null;
	    map.release();
	    cb.throw(err);
	  }));
	},

	/**
	 * 解决冲突
	 */
	resolved: function (name, cb) {
	  var map = new_revision_control_service();
	  map.resolved(name, function () {
	    cb(map.stat_code(name));
  	  map.release();
	  }.catch(function (err) {
	    map.release();
	    cb.throw(err);
	  }));
	},
	
	/**
	 * 加入到映射
	 */
	join: function (name, cb) {
	  var map = new_revision_control_service();
	  map.add(name, function () {
	    cb(map.stat_code(name));
	    map.release();
	  }.catch(function (err) {
	    map.release();
	    cb.throw(err);
	  }));
	},

	/**
	 * 测试文件是否在有效的映射范围
	 */
	test_mapping: function (name, cb) {
	  var map = new_revision_control_service();
	  map.test(name, function (is) {
	    map.release();
	    cb(is);
	  }.catch(function (err) {
	    map.release();
	    cb.throw(err);
	  }));
	},
  
	/**
	 * 解锁文件
	 */
	unlock: function (name, cb) {
	  var map = new_revision_control_service();
	  map.unlock(name, function () {
	    cb(map.stat_code(name));
	    map.release();
	  }.catch(function (err) {
	    map.release();
	    cb.throw(err);
	  }));
	},
  
	/**
	 * 清理文件夹
	 */
	cleanup: function (name, cb) {
	  var map = new_revision_control_service();
	  map.cleanup(name, function () {
	    cb(map.stat_code(name));
	    map.release();
	  }.catch(function (err) {
	    map.release();
	    cb.throw(err);
	  }));
	},
	// @end
});
