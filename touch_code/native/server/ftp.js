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
$import('file_mapping_entity::FileMappingEntity');
$import('req:ftp as NodeFtp');

/**
 * @class Ftp
 * @extends FileMappingEntity
 */
$class('FTP', FileMappingEntity, {

  /**
   * @private
   */
  m_ftp: null,
  
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
    
    if (this.m_ftp) 
      return cb.throw(loc('连接到FTP服务器异常'));
      
    var ftp = new NodeFtp();
    var ready = false;
    self.m_ftp = ftp;
    
    ftp.on('ready', function (){
      ftp.on('end', function (){
        self.close();
      });
      
      ftp.on('close', function (){
        self.close();
      });
      
      ready = true;
      cb();
    });
    
    ftp.on('error', function (data) {
      console.log(data);
      if (!ready) { // 还没准备
        self.close();
        cb.throw(data); // 连接失败
      }
    });
    
    ftp.connect({
      host: self.host,
      port: self.port || 21,
      user: self.user,
      password: self.passwd,
    });
  },
  
  /**
   * 关闭
   */
  close: function () {
    FileMappingEntity.members.close.call(this);
    if (this.m_ftp) {
      this.m_ftp.end(); // 结束连接
      this.m_ftp = null;
    }
  },
  
  /**
   * 读取服务器文件目录
   * @overwrite
   */
  readdir: function (name, cb) {
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      self.m_ftp.list(self.dir + name, function (err, ls) {
        
        if (err) 
          return cb.throw(err);
          
        if (!ls.length)
          return cb.throw(loc('目录无法读取'));
          
        var list = [];
        
        ls.forEach(function (item) {
          var data = item;//.expected;
          if (data.name == '.' || data.name == '..') 
            return;
          var stat = 
            new teide.touch.FileMappingStat(
              data.name, data.type == '-' ? 'f': 'd', data.date, data.size);
          list.push(stat);
        });
        cb(list);
      });
    }.err(cb));
  },
  
  /**
   * 读取远程文件信息
   * @overwrite
   */  
  stat: function (name, cb) {
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      var path = self.dir + name;
      
      self.m_ftp.list(path, function (err, ls) {
        if (err)
          return cb.throw(err);
          
        if (!ls.length)
          return cb.throw(loc('无法读取文件属性'));
          
        var data = ls[0];
        
        for (var i = 0; i < ls.length; i++) {
          var item = ls[i];
          if (item.name == '.') {
            var mat = path.match(/[^\/]+$/);
            data = item;
            data.name = mat ? mat[0] : '.';
            break;
          }
        }
        
        var stat = 
          new teide.touch.FileMappingStat(
            data.name, data.type == '-' ? 'f': 'd', data.date, data.size);
        cb(stat);
      });
    }.err(cb));
  },
  
  /**
   * 从服务器读取文件
   * @overwrite
   */
  read_file: function (name, cb) {
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      self.m_ftp.get(self.dir + name, function (err, socket) {
        if (err)
          return cb.throw(err);
        if (cb)
          cb(socket);
      });
    }.err(cb));
  },
  
  /**
   * 写入文件到服务器
   * @overwrite
   */
  write_file: function (name, input, cb) {
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      self.m_ftp.put(input, self.dir + name, function (err) {
        if (err)
          return cb.throw(err);
        if (cb)
          cb();
      });
    }.err(cb));
  },
  
  /**
   * 在服务器创建目录
   * @overwrite
   */
  mkdir: function (name, cb) {
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      self.m_ftp.mkdir(self.dir + name, true, function (err) {
        if (err)
          return cb.throw(err);
        if(cb)
          cb();
      });
    }.err(cb));
  },
  
  /**
   * 删除服务器文件
   * @overwrite
   */
  rm: function (name, cb) {
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      self.m_ftp.delete(self.dir + name, function (err) {
        if (err) cb.throw(err);
        else cb();
      });
    }.err(cb));
  },
  
  /**
   * 删除目录
   * @overwrite
   */
  rmdir: function (name, cb) {
    var self = this;
    cb = util.cb(cb);
    
    self.ready(function () {
      self.m_ftp.rmdir(self.dir + name, true, function (err) {
        if (err) cb.throw(err);
        else cb();
      });
    }.err(cb));
  },
  // @end
});
