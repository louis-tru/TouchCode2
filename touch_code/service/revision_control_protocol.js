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

$import('app');
$import(':truth/util');

/**
  * 抽象的版本控制器协议
  */
$class('RevisionControlProtocol', {

  // document_path: '',

  /**
   * 本地目录
   */
  m_local_dir: '',
  
  /**
   * 配置
   */
  m_config: null,
  
  /**
   * 获取本地目录
   */
  get local_dir() {
    return this.m_local_dir;
  },
 	
  /**
   * 获取配置
   */
  get config() {
    return this.m_config;
  },
 	
 	get type() {
 	  return this.config.type;
 	},
 	
  get host() {
    return this.config.host;
  },
  
  get port() {
    return this.config.port;
  },
  
  get dir() {
    return this.config.dir;
  },
  
  get path() {
		return this.config.path;
  },
  
  get user() {
    return this.config.user;
  },
  
  get passwd() {
    return this.config.passwd;
  },
  
	constructor: function (local_dir, config) {
	  this.m_local_dir = local_dir.replace(/\/?$/, '/');
    // this.document_path = app.documents_path();
	  this.m_config = { };
	  
    if (config.path) {
      var reg = 
/^(?:([a-zA-Z]+)\:\/\/((?:\w+\.)+\w+)(?::(\d+)(?=[\?#\/$]))?\/?)?([\w\.\/]*)?(\?[^#]*)?(\#.*)?$/;
      // 'ftp://aa.aa:21/aaa.sdsds.ll/lll/dsds.l?lll#ggg'
      // "ftp://aa.aa:21/aaa.sdsds.ll/lll/dsds.l?lll#ggg", "ftp", "aa.aa", "21", "aaa.sdsds.ll/lll/dsds.l", "?lll", "#ggg"]
      var mat = config.path.match(reg);
      if (mat) {
        // config
        if (mat[2]) { // host
          this.m_config.host = mat[2];
        }
        if (mat[3]) { // port
          this.m_config.port = mat[3];
        }
        if (mat[4]) { // dir
          this.m_config.dir = mat[4];
        }
      }
    }
    
    util.extend(this.m_config, config);
    config = this.m_config;
    
    if (!config.host) {
      this.m_config.host = 'localhost';
    }
    if (!config.user) {
      config.user = 'anonymous';
    }
    if (!config.passwd) {
      config.passwd = 'anonymous@';
    }
     
    config.dir = config.dir ? config.dir.replace(/\/?$/, '/') : './';
    config.path = config.path ? config.path.replace(/\/?$/, '') : '';
	},

  format_path: function (path) {
    return (this.m_local_dir.substr(app.documents_path.length) + path).replace(/\/$/, '');
  },
  
  /** 
   * @virtual
   */
	add: function (path, cb) { },
	
  /** 
   * @virtual
   */
	update: function (path, cb) { },
	
  /** 
   * @virtual
   */
	commit: function (path, cb) { },
	
  /** 
   * @virtual
   */
	remove: function (path, cb) { },
  
  /** 
   * @virtual
   */
	rename: function (path, new_path, cb) { },
  
  /** 
   * @virtual
   */
	cleanup: function (path, cb) { },
  
  /**
    * @virtual
    * 解决的冲突
    */
	resolved: function (path, cb) { },
	
  /** 
   * @virtual
   */
	revert: function (path, cb) { },
	
  /** 
   * @virtual
   */
	status: function (path, cb) {  },
	
  /** 
   * @virtual
   */
	unlock: function (path, cb) { },
	
  /** 
   * 释放对像
   * 如果当前还有操作没有完成,必须马上完成且回调参数中标识为取消
   * @virtual
   */
	release: function () { },

  // 单纯取消当前操作,不释放对像
  cancel: function () { },
	
	/**
	  * 获取文件状态码
	  *  @virtual
	  */
	stat_code: function (path) { },
	
	/**
	  * 查询冲突列表
	  *  @virtual
	  */
	conflict_list: function (path, cb) { },
	
	/**
	  * 查询是否存在冲突
	  *  @virtual
	  */
	is_conflict: function (path, cb) { },
	
	/** 
	  * 测试配置的有效性
	  * @virtual
	  */
	test: function (cb) { }
	
});

