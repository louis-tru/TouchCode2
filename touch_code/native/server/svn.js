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
$import(':truth/loc');
$import('console2');
$import('revision_control_protocol::RevisionControlProtocol');

var Subversion = null;
try {
  Subversion = process.binding('native_svn').Subversion;
} catch(err) { }

function init_user_and_passwd (self) {
	if (self.m_init_user) 
	  return;
	self.m_init_user = true;
  self.m_svn.set_user(self.user);
  self.m_svn.set_passwd(self.passwd);
}

function is_checkout_and_error (self, cb) {
  if (fs.existsSync(self.local_dir + '.map/wc.db')) { // 没有这个文件需要checkout
    return false;
  }
  if (cb) {
  	cb.throw(loc('无法完成操作,请先更新svn根目录.'));
  }
  return true;
}

// teide.touch.SVN 因为在调用过程中没有对像拥有它, 这个对像很有可能很快被释放,
// 所以给这个对像这一个全局挂载点, 
var all_svn = { };

function init (self) {
  self.m_svn = new Subversion(self.path, self.local_dir);
  self.m_sysid_id = util.id();
  all_svn[self.m_sysid_id] = self;
  
	self.m_svn.onconsole_log_handle = function (mark, log, path) {
		if(mark == '.'){
			console2.log('.');
		} else{
			console2.log(mark, log + (path !== null ? self.format_path(path) : ""));
		}
	};
}

/**
  * @class SVN
  * @extends RevisionControlProtocol
  */
$class('SVN', RevisionControlProtocol, {

	m_svn: null,
	m_init_user: false,
	m_sysid_id: 0, 
  
  /**
    * @constructor
    */
  constructor: function (local_dir, config) {
    RevisionControlProtocol.call(this, local_dir, config);
    init(this);
  },
  
  /** 
    * @virtual
    */
	add: function (path, cb) {
	  cb = util.cb(cb);
	  this.m_svn.add(path, function (err) {
	    if (err) cb.throw(err);
	    else cb.apply(null, util.to_array(arguments, 1));
	  });
	},
	
  /** 
    * @virtual
    */
	update: function (path, cb) {
	  cb = util.cb(cb);
		init_user_and_passwd(this);
		
	  if (path === '' && is_checkout_and_error(this)) { // 没有这个文件需要checkout
	    return this.m_svn.checkout(cb);
	  }
	  // update
	  this.m_svn.update(path, function (err, data, cancel) {
	  	if (err) {
	  		err.message = loc(err.message);
	  		// console.log('update err', err.message, err.code);
	  	  cb.throw(err);
	  	} else {
	  	  cb.apply(null, util.to_array(arguments, 1));
	  	}
	  });
	},
	
  /** 
    * @virtual
    */
	commit: function (path, cb) { 
	  cb = util.cb(cb);
		if (is_checkout_and_error(this, cb)) 
		  return;
		init_user_and_passwd(this);
	  this.m_svn.commit(path, function (err, data, cancel) {
	  	if (err) {
	  		err.message = loc(err.message);
	  		cb.throw(err);
	  	} else {
	  	  cb.apply(null, util.to_array(arguments, 1));
	  	}
	  });
	},
	
  /** 
    * @virtual
    */
	remove: function (path, cb) { 
	  cb = util.cb(cb);
	  this.m_svn.remove(path, function (err) {
	    if (err) cb.throw(err);
	    else cb.apply(null, util.to_array(arguments, 1));
	  });
	},

  /** 
    * @virtual
    */
	rename: function (path, new_path, cb) {
		var self = this;
		cb = util.cb(cb);
	  this.m_svn.rename(path, new_path, function (err, data, cancel){
	  	if (err) 
	  		return cb.throw(err);
	  	if (cancel) {
	  		cb(data, cancel);
	  	} else {
	  		fs.rename(self.local_dir + path, self.local_dir + new_path, function (err) {
	  		  if (err) return cb.throw(err);
	  		  cb();
	  		});
	  	}
	  });
	},
	
  /** 
    * @virtual
    */
	cleanup: function (path, cb) {
	  cb = util.cb(cb);
	  this.m_svn.cleanup(path, function (err) {
	    if (err) cb.throw(err);
	    else cb.apply(null, util.to_array(arguments, 1));
	  });
	},

  /**
    * @virtual
    * 解决冲突
    */
	resolved: function (path, cb) {
	  cb = util.cb(cb);
	  this.m_svn.resolved(path, function (err) {
	    if (err) cb.throw(err);
	    else cb.apply(null, util.to_array(arguments, 1));
	  });
	},
	
  /** 
    * @virtual
    */
	revert: function (path, cb) { 
	  cb = util.cb(cb);
	  this.m_svn.revert(path, function (err) {
	    if (err) cb.throw(err);
	    else cb.apply(null, util.to_array(arguments, 1));
	  });
	},
	
  /** 
    * @virtual
    */
	status: function (path, cb) {
	  cb = util.cb(cb);
	  this.m_svn.status(path, function (err) {
	    if (err) cb.throw(err);
	    else cb.apply(null, util.to_array(arguments, 1));
	  });
	},
	
  /** 
    * @virtual
    */
	unlock: function (path, cb) { 
	  cb = util.cb(cb);
	  this.m_svn.unlock(path, function (err) {
	    if (err) cb.throw(err);
	    else cb.apply(null, util.to_array(arguments, 1));
	  });
	},
	
  /** 
    * 释放对像
    * 如果当前还有操作没有完成,必须马上完成且回调参数中标识为取消
    * @virtual
    */
	release: function () { 
		delete all_svn[this.m_sysid_id]; // 删除全局挂载点
	  this.m_svn.release();
	},

	// 取消操作
	cancel: function () {
		this.m_svn.cancel();
	},
	
	/**
	  * 获取文件状态码
	  *  @virtual
	  */
	stat_code: function (path) {
	  return this.m_svn.stat_code(path);
	},
	
	/**
	  * 查询冲突列表
	  *  @virtual
	  */
	conflict_list: function (path, cb) { 
	  cb = util.cb(cb);
		if (is_checkout_and_error(this, cb)) return;
		
		var self = this;
		
	  this.m_svn.conflict_list(path, 10, function (err, data, cancel) {
	  	if (err) {
	  		return cb.throw(err);
	  	}
	  	var m_console = teide.touch.Console.share();
	  	if (data.length) {
	  		m_console.log('Conflict list:');
	  	}
	  	for (var i = 0; i < data.length; i++) {
	  		data[i] = self.format_path(data[i]);
				m_console.log('!', data[i]);
	  	}
	  	cb(data || [], cancel);
	  });
	},
	
	/**
	  * 查询是否存在冲突
	  *  @virtual
	  */
	is_conflict: function (path, cb) { 
	  cb = util.cb(cb);
		if (is_checkout_and_error(this, cb)) 
		  return;
	  this.m_svn.conflict_list(path, 1, function (err, data, cancel) {
	  	if (err) cb.throw(err);
	  	else cb(data && data.length !== 0, cancel);
	  });
	},
	
	/** 
	  * 测试配置的有效性
	  * @virtual
	  */
	test: function (cb) {
	  cb = util.cb(cb);
		this.m_svn.test(function (err) {
	    if (err) cb.throw(err);
	    else cb.apply(null, util.to_array(arguments, 1));
	  });
	},
  // @end
});

exports.is_support = function () {
  return !!Subversion;
};
