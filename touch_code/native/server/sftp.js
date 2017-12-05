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
$import('file_mapping_entity::FileMappingEntity');
$import('file_mapping_entity::FileMappingStat');
$import('req:ssh2-connect as ssh2');

/**
 * @private
 */
function readdir (self, path, cb) {
  cb = util.cb(cb);
  
  self.m_sftp.readdir(self.dir + path, function (err, ls) {
    if (err) return cb.throw(err);
    
    cb(ls.map(function (item) {
      var data = item.attrs;
      var stat = new FileMappingStat(
          item.filename, 
          data.isDirectory() ? 'd': 'f', 
          new Date(data.mtime * 1000), 
          data.size
        );
      return stat;
    }));
  });
}

/**
 * @private
 */
function stat (self, name, cb) {
  var path = self.dir + name;
  
  cb = util.cb(cb);
  
  self.m_sftp.stat(path, function (err, data) {
    if (err) return cb.throw(err);
    
    var mat = path.match(/[^\/]+$/);
    var stat = new FileMappingStat(
        mat ? mat[0] : '.', 
        data.isDirectory() ? 'd': 'f', 
        new Date(data.mtime * 1000), 
        data.size
      );
    cb(stat);
  });
}

function mkdir (self, path, cb) {
	var sftp = self.m_sftp;
	var path2 = self.dir + path;
	
	cb = util.cb(cb);
	
	sftp.exists(path2, function (exists) {
		if (exists)
			return cb();
		
		var prefix = path2.match(/^\/?/)[0];
		var ls = path2.substr(prefix.length).split('/');
		
		function handle () {
			if (!ls.length)
				return cb();
				
			prefix += ls.shift() + '/';
			sftp.exists(prefix, function (exists) {
				if (exists)
					return handle();
				sftp.mkdir(prefix, function (err) {
				  if (err) { return cb.throw(err) }
				  handle();
				});
			});
		}
		handle();
	});
}

/**
 * @private
 */
function rm (self, path, cb) {
  cb = util.cb(cb);
  self.m_sftp.unlink(self.dir + path, function (err) {
    if (err) cb.throw(err);
    else cb();
  });
}

/**
 * @private
 */
function rmdir (self, path, cb) {
  var sftp = self.m_sftp;
  var ls = null;
  
  cb = util.cb(cb);
  
  function handle (err) {
    if(err) { return cb.throw(err) }
    
		if (!ls.length) 
			return sftp.rmdir(path, function (err) {
			  if (err) cb.throw(err);
			  else cb();
			});
		
		var stat = ls.shift();
		var new_path = path + '/' + stat.filename;
		
		if (stat.attrs.isFile()) {
      // console.log('test del file', new_path);
		  sftp.unlink(new_path, handle);
		}
		else if (stat.attrs.isDirectory()) {
      // console.log('test del dir', new_path);
		  rmdir(self, new_path, handle);
		} else {
      return cb.throw('error');
		}
  }
  
	//dir
	sftp.readdir(path, function (err, data) {
    ls = data;
    handle(err);
  });
}

/**
 * @class SFTP
 * @extends FileMappingEntity
 */
$class('SFTP', FileMappingEntity, {
  
  // private:
  m_ssh: null,
  m_sftp: null,
  
  /**
   * @constructor
   */
  constructor: function (local_dir, config) {
    FileMappingEntity.call(this, local_dir, config);
  },
  
  /**
   * 连接
   */
  connect: function (cb) {
    var self = this;
    cb = util.cb(cb);
    
    ssh2({
      host: self.host,
      username: self.user,
      password: self.passwd,
      port: self.port || 22,
      //compress: true,
    }, function (err, ssh) {
      if(err) { return cb.throw(err) }
      
      self.m_ssh = ssh;
      
      ssh.sftp(function (err, sftp) {
        if (err) {
          cb.throw(err);
          self.close();
          return;
        }
        ssh.on('end', function () {
          self.close();
        });
        ssh.on('close', function () {
          self.close();
        });
        
        self.m_sftp = sftp;
        cb();
      });
    });
  },
  
  /**
   * 关闭
   */
  close: function () {
    FileMappingEntity.members.close.call(this);
    if (this.m_ssh) {
      this.m_ssh.end();
      this.m_ssh = null;
      this.m_sftp = null;
    }
  },
  
  /**
   * 读取服务器文件目录
   * @overwrite
   */
  readdir: function (name, cb) {
    var self = this;
    self.ready(function () {
      readdir(self, name, cb);
    }.err(cb));
  },
  
  /**
   * 读取远程文件信息
   * @overwrite
   */  
  stat: function (name, cb) {
    var self = this;
    self.ready(function () {
      stat(self, name, cb);
    }.err(cb));
  },
  
  /**
   * 从服务器读取文件
   * @overwrite
   */
  readFile: function (name, cb){
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      var stream = self.m_sftp.createReadStream(self.dir + name);
      cb(stream);
    }.err(cb));
  },
  
  /**
   * 写入文件到服务器
   * @overwrite
   */
  writeFile: function (name, input, cb) {
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      self.m_sftp.fastPut(input, self.dir + name, function (err) {
        if(err) cb.throw(err);
        else cb();
      });
    }.err(cb));
  },
  
  /**
   * 在服务器创建目录
   * @overwrite
   */
  mkdir: function (name, cb) {
    var self = this;
    self.ready(function () {
      mkdir(self, name, cb);
    }.err(cb));
  },
  
  /**
   * 删除服务器文件
   * @overwrite
   */
  rm: function (name, cb) {
    var self = this;
    self.ready(function () {
      rm(self, name, cb);
    }.err(cb));
  },
  
  /**
   * 删除目录
   * @overwrite
   */
  rmdir: function (name, cb){
    var self = this;
    self.ready(function () {
      rmdir(self, self.dir + name, cb);
    }.err(cb));
  },
  // @end
});


