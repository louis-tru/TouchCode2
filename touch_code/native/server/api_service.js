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
$import(':tplus/service');
$import(':tplus/http_service::HttpService');
$import(':tplus/conv');
$import('app.js');
$import('preferences');
$import('console2');
$import('script_service');
$import('req:os');

function get_icon (name) {
  var mat = name.match(/\.([^\.]+)$/);
  if (mat) {
    return mat[1].replace(/\+/g, 'p').toLowerCase();
  }
  return '';
}

/**
 * 是否要排除文件
 */
function is_exclude_file (name) {
  
  name = name.toLowerCase();
  
  // 使用微信SDK后会有这个文件
  if (name.index_of('tencent_wxo_analysis') != -1) {
    return true;
  }
  
  var exclude_files = {

    /* 使用ShareSDK后会有这个文件 */
    'tcsdkconfig.plus': true, 
    /* 
     * apple ios 外部打开的文件会自动创建这个文件夹,
     * 且这个文件夹还没有权限删除,所以不需要显示它
    */
    'inbox': true,
  };
  
  // console.log('is_exclude_file', name);
  
  exclude_files[ preferences.settings_file_basename ] = true;
  
  if(name in exclude_files){
    return true;
  }
   
  // if(/\.map\/entity$/.test(name) || /\.map\/conf.keys/.test(name)){
  if(/\.map(\/|$)/.test(name)){
    return true;
  }
  return false;
}

// 支持的所有后缀
var support_find_suffix = 
'abap|asciidoc|c9search_results|search|Cakefile|coffee|cf|cfm|cs|css|dart|diff|patch|dot|\
glsl|frag|vert|vp|fp|go|groovy|hx|haml|htm|html|xhtml|c|cc|cpp|cxx|h|hh|hpp|clj|jade|java|\
jsp|js|json|conf|jsx|te|teh|latex|tex|ltx|bib|less|lisp|scm|rkt|liquid|lua|lp|lucene|\
GNUmakefile|makefile|Makefile|OCamlMakefile|make|mk|keys|script|log|module|map|\
md|markdown|m|mm|ml|mli|pl|pm|pgsql|php|phtml|ps1|py|gyp|gypi|r|Rd|Rhtml|ru|gemspec|rake|rb|\
scad|scala|scss|sass|sh|bash|bat|sql|styl|stylus|svg|tcl|tex|txt|textile|typescript|ts|str|\
xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl|vx|xq|yaml'.toLowerCase().split('|');

/**
 * 是否可以搜索的文件
 */
function is_find (path) {
  var suffix = path.match(/[^\.\/]+$/)[0].toLowerCase();
  return support_find_suffix.indexOf(suffix) != -1;
}

var console_log_file = 'console.log';

function get_read_only (filename) {
  if (filename == console_log_file) {
    return true;
  }
  return false;
}

// 是否可运行
function is_run (filename) {
  return script_service.share().is_can_run(filename);
}

/*
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 * because the buffer-to-string conversion in `fs.readFileSync()`
 * translates it to FEFF, the UTF-16 BOM.
 */
function stripBOM (buff) {
  //0xFEFF
  //0xFFFE
  var c = buff[0];//.charCodeAt(0);
	if (c === 0xFEFF || c == 0xFFFE) {
		return buff.slice(1);
	}
	return buff;
}

// 查找文本中换行的数量与最后上个换行符号的位置
function find_wrap (text) {
  
  var count = 0;
  var index = -1;
  
  while (true) {
    var i = text.indexOf('\n', index + 1);
    if(i == -1){
      break;
    }
    count++;
    index = i;
  }
  return { count: count, lastIndex: index };
}

/**
 * 搜索文件
 * @private
 */
function find_file (self, path, name, data, cb, end_cb) {
  
  data.result.end++; // 增加一个索引
    
  // 是否要跳过文件,从指定位置开始
  if (data.result.end <= data.start) {
    return cb(); // 跳过
  }
  
  if (!is_find(name)) // 不支持的文件格式
    return cb();
  
  fs.readFile(app.documents_path + path + name, function (err, buff) {
    if (err)
      return end_cb.throw(err);
    
    // TODO find string
    var results = [];
    var code = stripBOM(buff).toString('utf-8');
    //
    var cur_row = 0;    // 当前行数
    var prev_index = 0; // 上一个匹配的位置
    
    var match = data.regexp.exec(code);
    
    function match_code () {
      if (cur_find_id != data.cur_find_id) { // 是否还在查询中
        // return end_cb(); 
        return; // 退出本次查询
      }
      
      var index = -1;
      var match_count = 0;
      
      while (match) {
        
        if (index == match.index) { // 如果一直相等就会死循环了
          // return end_cb('The query expression error');
          return end_cb.throw(loc('查询表达式格式错误'));
        }
        index = match.index; 
        
        match_count++;
        if (match_count > 100) { // 歇会,这里主要是不想出现死循环,把线程阻塞
          return match_code.delay(10);
        }
        
        var wrap = find_wrap(code.substring(prev_index, index)); 
        var last_wrap_index = prev_index + wrap.lastIndex; // 最后一个换行符位置
        cur_row += wrap.count;  // 加上经过的换行
        
        var length = match[0].length;
        var start = index - last_wrap_index - 1; //列开始位置
        var html_0_len = Math.min(start, 30); // 最多显示30个字符
        var html_2_len = code.substr(index + length, 30).indexOf('\n');
        
        results.push({ 
          row: cur_row, 
          start: start,
          length: length,
          html: [ 
            code.substr(index - html_0_len, html_0_len).trimLeft(),
            code.substr(index, length), // 匹配的文本
            code.substr(index + length, html_2_len == -1 ? 30 : html_2_len).trimRight()
          ]
        });
        
        prev_index = index; 
        
        match = data.regexp.exec(code); // 继续匹配
      }
      
      if (results.length) {  // 如果有结果返回这个文件
        data.result.data.push({
          icon: get_icon(name),
          text: name,
          path: path.substr(0, path.length - 1),
          results: results,
          count: results.length,
          expand: data.expand_class
        });
        data.result.count++;
      }
      cb();
    } // match_code end
    
    match_code();
    // readFile end
  });
}

/**
 * 当前是否正在查询
 * 为性能考虑一次只能进行一次查询
 * @private
 */
var cur_find_id = 0;

/**
 * 搜索目录
 * @private
 */
function find_dir (self, path, data, cb, end_cb) {
  
  if (cur_find_id != data.cur_find_id) // 是否还在查询中
    return end_cb();
  
  var ls = null;
  var documents_path = app.documents_path;
  
  function callback () {
    if (data.result.count == data.size) {     // 匹配的文件达到50个停止搜索
      data.result.is_end = false;             // 标记为没有结束
      return end_cb();
    }
    
    if (!ls.length)
      return cb();
      
    var name = ls.shift();
    
    // 忽略影藏文件,与.preference.json文件
		if (is_exclude_file(name) || name.slice(0, 1) == '.')
		  return callback();
    
    fs.stat(documents_path + path + name, function (err, stat){
      if (err)
        return end_cb.throw(err);
        
      if (stat.isFile())
        find_file(self, path, name, data, callback, end_cb);
      else
        find_dir(self, path + name + '/', data, callback, end_cb);
    });
  }
  
  callback.err(end_cb);
  
  // 读取目录
  fs.readdir(documents_path + path, function (err, list) {
    if (err)
      return end_cb.throw(err);
    ls = list;
    callback();
  });
}

//set util
function set_header (self) {
  var res = self.response;
  res.setHeader('Server', 'truth framework, Touch Code');
  res.setHeader('Date', new Date().toUTCString());
  var expires = self.server.expires;
  if (expires) {
    res.setHeader('Expires', new Date().add(6e4 * expires).toUTCString());
    res.setHeader('Cache-Control', 'public, max-age=' + (expires * 60));
  }
}

/**
 * @arg path {String}
 * @private
 */
function upload_file (self, path, cb) {
  if (self.request.method != 'POST')
    return cb();
  
  var files = self.data.file; // 上传的文件列表
  if (!files.length) // 没有上传文件
    return cb();
    
  var index = path.index_of('?');
  if (index != -1)
    path = path.substring(0, index);
  
  var documents_path = app.documents_path;
  var relative_dir = path ? path.replace(/\/?$/, '/') : '';
  var dir = documents_path + relative_dir;
  var output = [];
  
  function h () {

    if (!files.length) {
      // 通知连接的所有客户端
      // 获取所socket连接
      var convs = conv.all;
      for (var token in convs) {
        var services = convs[token].services; // 获取绑定的服务
        for (var name in services) {
          if (name == 'FileActionService') {
            // 通知服务上传了文件
            services[name].onupload_file_notice(relative_dir, output);
          }
        }
      }
      return cb();
    }
    
    var file = files.shift();
    var filename = file.filename;
    if (!filename)
      return h();
    
    fs.exists(file.path, function (exists) {
      if (!exists)
        return h();
      console2.log('Upload', './' + filename);
      output.push(filename);
      fs.rename(file.path, dir + filename, function (err) {
        if (err) return cb.throw(err)
        h();
      });
    });
  }
  h();
}

function read_document_directory (self, path) {

  var res = self.response;
  var req = self.request;
  
  //读取目录
  if (path && !path.match(/\/$/))  //目录不正确,重定向
    return self.redirect(self.clean_url + '/');
  
  fs.ls(app.documents_path + path, function (err, files) {
    if (err)
      return self.ret_status(404);
      
    console2.log('Readdir', './' + path);
    
    var html =
      '<!DOCTYPE html><html><head><title>Index of {0}</title>'.format(path) +
      '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
      '<style type="text/css">*{font-family:Courier New}div,span{line-height:20px;' +
      'height:20px;}span{display:block;float:right;width:220px}</style>' +
      '</head><body bgcolor="white">' +
      '<h1>Touch Code documents</h1>'+
      '<h4>Index of {0}</h4><hr/><pre><div><a href="{1}">../</a></div>'
      .format(path, path ? '../' : 'javascript:');
      
    var ls0 = [];
    var ls1 = [];

    for (var i = 0, stat; (stat = files[i]); i++) {
      var name = stat.name;
      
      if (is_exclude_file(path + name))
        continue;
        
      var link = name;
      var size = (stat.size / 1024).toFixed(2) + ' KB';
      var isdir = stat.dir;

      if (isdir) {
        link += '/';
        size = '-';
      } else {
        if (/\.script$/i.test(name))
          continue; // 禁止访问 
      }
      
      var s =
        '<div><a href="{0}">{0}</a><span>{2}</span><span>{1}</span></div>'
            .format(link, stat.ctime.to_string('yyyy-MM-dd hh:mm:ss'), size);
      isdir ? ls0.push(s) : ls1.push(s);
    }
    
    html += ls0.join('') + ls1.join('') + '</pre>';
    
    var from = [
      '<form enctype="multipart/form-data" method="post">',
        '<input type="file" name="file" multiple="" />',
        '<input type="submit" value="upload" />',
      '</form>',
    ];
    
    html += from.join('\n');
    html += '<hr/></body></html>';
    
    set_header(self);
    var type = self.server.get_mime('html');
    res.writeHead(200, { 'Content-Type': type });
    res.end(html);
  });
}

/**
 * @class APIService
 * @bases HttpService
 */
$class('APIService', '@service', HttpService, {
  // @public:
  /**
   * @overwrite 
   */
  auth: function (cb, action) {
    if (this.form) // 默认为不允许上传文件,这里设置为可以
      this.form.is_upload = (action == 'read_documents');
    cb(true);
  },
  
  /**
   * 获取本机系统网络信息
   */
  network_interfaces: function (cb) {
    var ifaces = os.networkInterfaces();
    var data = { ifaces: ifaces, port: this.server.port };
    cb(data);
  },
  
	/**
	 * read file as text
	 * @param {String}   filename
	 * @param {Function} cb
	 */
	read_file_as_text: function (filename, cb) {

		var self = this;
		var root = app.documents_path;
		var path = root + filename;
    
		fs.stat(path, function (err, stat) {
		  if (err) { return cb.throw(err) }
      
			if (stat.size > self.server.max_file_size) {// File size exceeds the limit
				return cb(loc('文件大小超过限制'));
			}

			fs.readFile(path, function (err, buff) {
			  if (err) { return cb.throw(err) }
				var value = app.preferences.get_file_property(filename);
				cb({
					code: buff + '',
					breakpoints: value.breakpoints,
					folds: value.folds,
					readonly: get_read_only(filename),
					is_run: is_run(filename),
				});
			});
		});
	},
	
	// 读取偏好设置
	get_preferences: function (cb) {
	  cb(app.preferences.get_preferences());
	},
	
	// 保存偏好设置
	set_preferences: function (preferences, cb) {
	  app.preferences.set_preferences(preferences)
	  cb();
	},
	
	/**
	 * 返回html
	 */
	touch: function () {
	  this.ret_file(util.format($.__lib_path, '../cli/touch.htm'));
	},
	
	/**
	 * 返回html
	 */
	touch_d: function (cb) {
	  this.ret_file(util.format($.__lib_path, '../cli/touch_d.htm'));
	},
	
	/**
	 * 返回html
	 */
	touch_d2: function (cb) {
	  this.ret_file(util.format($.__lib_path, '../cli/touch_d2.htm'));
	},
  
	/**
	 * read file
	 * @param {String}   filename
	 * @param {Function} cb
	 */
	read_file: function (filename, cb) {
	  
	  // var self = this;
	  var name = filename.replace(/\?.*$/, '');
	  
	 // fs.readFile(app.documents_path + name, function (err, data){
	 //   if (err)
	 //     self.ret_status(404, err.message);
	 //   else
	 //     self.ret_data(self.server.get_mime(name), data);
	 // });
	 
    this.onresponse.on(function (evt) {
	    evt.data.res.removeHeader('Expires');        // 删除默认的过期头
	    evt.data.res.removeHeader('Cache-Control');
	    evt.data.res.removeHeader('Last-Modified');
    });
	  this.ret_file(app.documents_path + name);
	},
  
  /**
   * 读取文档
   */
  read_documents: function (path, cb) {
  
    var self = this;
    var name = path;
    var index = name.index_of('?');
    
    if (index != -1)
      name = path.substring(0, index);
      
    if (is_exclude_file(name) || /\.script$/i.test(name))
      return this.ret_status(403); // 禁止访问
    
    fs.stat(app.documents_path + name, function (err, stat) {
      
      if (!err && stat.isDirectory()) {
        upload_file(self, path, function (err) {
          if (err)
            return self.ret_status(500, err.message); // 错误
          read_document_directory(self, path);
        });
      } else {
        if (/\.script$/i.test(name))
          this.ret_status(403); // 禁止访问 
        else {
          console2.log('Readfile', './' + name);
          self.ret_file(app.documents_path + name);
        }
      }
    });
  },
  
	/**
	 * 停止搜索
	 */
	stop_find: function () {
	  cur_find_id = 0; // 停止查询
	},
	
	/**
	 * 查询文件
	 */
	find: function (args, cb) {
	  
	  if (cur_find_id)
	    return cb.throw(loc('请先结束当前查询才能开始新的查询'));
	    
	  cur_find_id = util.id();
    
    var self = this;
	  var key = args.key;
	  var options = args.options;
    var path = args.path;
    
    var data = {
      result: {
        data: [],
        // 这种文件内部查询非常耗时,没有办法知道有多少个文件匹配成功
        // 只能一次查询部分结果,再次查询时以上次结束的位置开始.
        // total: Infinity,
        count: 0,     // 一次最多返回50个文件的搜索结果
        end: 0,       // 当前查询到的文件结束位置
        is_end: true  // 是否查询结束,告诉客户端不需要发起后续查询
      },
      start: args.start || 0, // 从指定的文件位置开始
      size: args.size || 50,
      cur_find_id: cur_find_id, // 当前查询的标识
      enable_hide_file: options.enable_hide_file, // 是否查询隐藏的文件
      expand_class: options.expand_all_results ? 'expand' : '', // 是否要展开结果
      // 查询表达式
      regexp: new RegExp(
        options.enable_regexp ? key : // 使用正则
        key.replace(/([\\\[\]\(\)\{\}\.\$\&\*\+\-\^\?\|\<\>\=])/g, '\\$1'), // 使用普通文本匹配
        options.ignoring_case ? 'img' : 'mg')
    };
    
    // this.conversation.onclose.on(function () { // 监控连接是否关闭
    //   cur_find_id = 0;
    // });
    
    this.response.on('close', function () { // 监控连接是否关闭
      cur_find_id = 0;
    });
    
    var callback = function () {
      cb(data.result);
    }.err(cb).finally(function () {
      cur_find_id = 0;
    });
    
    fs.stat(app.documents_path + path, function (err, stat) {
      if (err) { return callback.throw(err) }
      if (stat.isFile()) {
        var ls = path.split('/');
        var name = ls.pop();
        find_file(self, ls.length ? ls.join('/') + '/' : '', name, data, callback, callback);
      } else
        find_dir(self, path ? path.replace(/\/?$/, '/') : '', data, callback, callback);
    });
	},
	// @end
});

exports = {
  /**
   * 支持的后缀
   */
  support_find_suffix: support_find_suffix,
  
  /**
   * 是否要排除文件
   */
  is_exclude_file: is_exclude_file,
};
