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
$import(':truth/event::EventDelegate');

var all_settings  = { };
var destroy_time  = 5e5;
var saved_time    = 6e4;

function saved(self, cb) {
  if (self.m_path in all_settings) {
    var str = JSON.stringify(self.m_values);
		fs.writeFile(self.m_settings_file_path, str, cb);
	} else {
	  cb && cb();
	}
}

function save(self) {
	util.clear_delay(self.m_saved_timeoutid);
	self.m_saved_timeoutid = saved.delay(saved_time, self);
}

function destroy(path) {
  var o = all_settings[path];
  if (o) {
  	var self = o.value;
  	saved(self, function (){
  		delete all_settings[path];
  		self.ondestroy.notice();
  		self.ondestroy.off();
  		self.onchange_breakpoints.off();
  	});
  }
}

function encode_name(filename) {
	return filename.replace(/\./g, '&lg');
}

function decode_name(filename) {
	return filename.replace(/&lg/g, '.');
}

function get_file_key(filename) {
	return 'files.' + encode_name(filename).replace(/\//g, '.');
}

function for_each(values, name, cb) {
	if (util.is_array(values.breakpoints || values.folds)) {
		cb(name, values);
	} else {
  	for (var i in values) {
  	  var de = decode_name(i);
  		for_each(values[i], name ?  name + '/' + de : de, cb);
  	}
	}
}

/**
 * @class Preferences
 * @private
 */
$class.private('Preferences', {
// @private:
	m_path: '',
	m_settings_file_path: '',
	m_values: null,
	m_saved_timeoutid: 0,
  
// @public:
	/**
	 * @event onchange_breakpoints
	 */
	'@event onchange_breakpoints': null,

	/**
	 * @event ondestroy
	 */
	'@event ondestroy': null,
  
	/**
	* constructor
	* @param {String}  path
	* @constructor
	*/
	constructor: function (path) {
		this.m_path = path;
		this.m_settings_file_path = this.m_path + exports.settings_file_basename;
		this.m_values = { };
		try {
			var data = fs.readFileSync(this.m_settings_file_path).toString('utf8');
			this.m_values = JSON.parse(data);
		} catch (err) {
			//console.error('Settings:' + err.message);
		}
	},

	/**
	* Get setting by name
	* @param  {String}   name
	* @return {Object}
	*/
	get: function (name) {
		return util.get(name, this.m_values);
	},

	/**
	* Get all setting by name
	* @return {Object}
	*/
	get_all: function () {
		return this.m_values;
	},

	/**
	* Set setting by name
	* @param {String}   name
	* @param {Object}   value
	* @return {Object}
	*/
	set: function (name, value) {
		util.set(name, value, this.m_values);
		save(this);
	},

	/**
	* @param {String}
	*/
	del: function (name) {
		util.del(name, this.m_values);
		save(this);
	},

	/**
	* Set all setting by name
	* @param {Object}   values
	* @return {Object}
	*/
	set_all: function (values) {
		this.m_values = values;
		save(this);
	},
	
	// 获取偏好设置
	get_preferences: function (){
	  return this.get('preferences') || { };
	},
	
	set_preferences: function (preferences){
	  this.set('preferences', preferences || { });
	},
	
	set_preferences_item: function (name, value){
	  this.set('preferences.' + name, value);
	},
  
  del_preferences_item: function (name){
    this.del('preferences.' + name);
  },
  
	/*
	* @param {Object}   filename
	* @return {Object}
	*/
	get_file_property: function (filename) {
		var values = this.get(get_file_key(filename)) || {};
		values.breakpoints = values.breakpoints || [];
		values.folds = values.folds || [];
		return values;
	},
  
	/*
	* @param {Object}   filename
	* @param {Object}   value
	*/
	set_file_property: function (filename, value) {

		var key = get_file_key(filename);

		if(
			(!value.breakpoints || !value.breakpoints.length) &&
			(!value.folds || !value.folds.length)
		) {
			this.del(key);
		} else {
			this.set(key, value);
		}
		this.set_breakpoints(filename, value.breakpoints);
	},

	/*
	* @param {Object}   filename
	*/
	del_file_property: function (filename) {
		this.del(get_file_key(filename));
		this.set_breakpoints(filename);
	},
  
	/*
	* @param {Object}   old_filename
	* @param {Object}   new_filename
	*/
	rename_file_property: function (old_filename, new_filename) {
		var value = this.get(get_file_key(old_filename));
		if (value) {
			this.del_file_property(old_filename);
			this.set_file_property(new_filename, value);
		}
	},
  
	/**
	* @param {String}   filename
	* @param {Number[]}   folds
	*/
	set_folds: function (filename, folds){
		var key = get_file_key(filename) + '.folds';
    
		if(folds.length){
			this.set(key, folds);
		} else {
			this.del(key);
		}
	},
  
	/**
	* @param {String}   filename
	* @param {Number[]}   rows
	*/
	set_breakpoints: function (filename, rows) {
		rows = rows || [];
		
		var key = get_file_key(filename) + '.breakpoints';

		if (rows.length) {
			this.set(key, rows);
		} else {
			this.del(key);
		}
		this.onchange_breakpoints.notice(
			{ name: filename, rows: rows, action: 'set' });
	},

	/**
	* delete all breakpoint
	*/
	del_all_breakpoints: function () {
		for_each(this.get('files'), '', function (name, value) {
			delete value.breakpoints;
		});
		save(this);
		this.onchange_breakpoints.notice({ action: 'clear_all' });
	},
  
	/**
	* @param  {String}   filename
	* @return {Object}
	*/
	get_breakpoints: function (filename) {
		var key = get_file_key(filename) + '.breakpoints';
		return this.get(key) || [];
	},
  
	/**
	* @return {Object}
	*/
	get_all_breakpoints: function () {
		var client = [];
		var server = [];
		var rev = [];
		
		for_each(this.get('files') || { }, '', function (name, value) {
			var breakpoints = value.breakpoints;
			if (breakpoints && breakpoints.length) {
  			rev.push({ name: name, breakpoints: breakpoints.concat() });
			}
		});
		return rev;
	},
});

exports = {

	settings_file_basename: '.preference.json',
  
	/**
  	* Get share settings by path
  	* @param  {String} path
  	* @return {Preferences}
  	*/
	share: function (path) {
	  path = util.format(path) + '/';
	  
		var obj = all_settings[path];
		if (!obj) {
			obj = all_settings[path] = 
			  { value: new Preferences(path), timeout: 0 };
		} else {
		  util.clear_delay(obj.timeout);
		}
		obj.timeout = destroy.delay(destroy_time, path);
		return obj.value;
	},
};

