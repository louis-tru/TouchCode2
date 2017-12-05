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

import EditSession as AceEditSession from 'req:ace/edit_session';
import Range from 'req:ace/range';

var default_mode = 'ace/mode/text';

// 支持的所有后缀
var support_text_suffix = 
'abap|asciidoc|c9search_results|search|Cakefile|coffee|cf|cfm|cs|css|dart|diff|patch|dot|\
glsl|frag|vert|vp|fp|go|groovy|hx|haml|htm|html|xhtml|c|cc|cpp|cxx|h|hh|hpp|clj|jade|java|\
jsp|js|json|conf|jsx|te|teh|latex|tex|ltx|bib|less|lisp|scm|rkt|liquid|lua|lp|lucene|\
GNUmakefile|makefile|Makefile|OCamlMakefile|make|mk|keys|script|log|module|map|\
md|markdown|m|mm|ml|mli|pl|pm|pgsql|php|phtml|ps1|py|gyp|gypi|r|Rd|Rhtml|ru|gemspec|rake|rb|\
scad|scala|scss|sass|sh|bash|bat|sql|styl|stylus|svg|tcl|tex|txt|textile|typescript|ts|str|\
xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl|vx|xq|yaml|license|text'.toLowerCase().split('|');

/**
 * 是否可以搜索的文件
 */
function is_text(path) {
  var suffix = path.match(/[^\.\/]+$/)[0].toLowerCase();
  return support_text_suffix.indexOf(suffix) != -1;
}

var modes = {
    abap:       ["ABAP"         , "abap"],
    asciidoc:   ["AsciiDoc"     , "asciidoc"],
    c9search:   ["C9Search"     , "c9search_results|search"],
    coffee:     ["CoffeeScript" , "Cakefile|coffee|cf"],
    coldfusion: ["ColdFusion"   , "cfm"],
    csharp:     ["C#"           , "cs"],
    css:        ["CSS"          , "css"],
    dart:       ["Dart"         , "dart"],
    diff:       ["Diff"         , "diff|patch"],
    dot:        ["Dot"          , "dot"],
    glsl:       ["Glsl"         , "glsl|frag|vert|vp|fp"],
    golang:     ["Go"           , "go"],
    groovy:     ["Groovy"       , "groovy"],
    haxe:       ["haXe"         , "hx"],
    haml:       ["HAML"         , "haml"],
    html:       ["HTML"         , "htm|html|xhtml"],
    c_cpp:      ["C/C++"        , "c|cc|cpp|cxx|h|hh|hpp"],
    clojure:    ["Clojure"      , "clj"],
    jade:       ["Jade"         , "jade"],
    java:       ["Java"         , "java"],
    jsp:        ["JSP"          , "jsp"],
    javascript: ["JavaScript"   , "js"],
    json:       ["JSON"         , "json|conf"],
    jsx:        ["JSX"          , "jsx|te|teh"],
    latex:      ["LaTeX"        , "latex|tex|ltx|bib"],
    less:       ["LESS"         , "less"],
    lisp:       ["Lisp"         , "lisp|scm|rkt"],
    liquid:     ["Liquid"       , "liquid"],
    lua:        ["Lua"          , "lua"],
    luapage:    ["LuaPage"      , "lp"], // http://keplerproject.github.com/cgilua/manual.html#templates
    lucene:     ["Lucene"       , "lucene"],
    makefile:   ["Makefile"     , "GNUmakefile|makefile|Makefile|OCamlMakefile|make|mk|keys|script|module"],
    markdown:   ["Markdown"     , "md|markdown"],
    objectivec: ["Objective-C"  , "m|mm"],
    ocaml:      ["OCaml"        , "ml|mli"],
    perl:       ["Perl"         , "pl|pm"],
    pgsql:      ["pgSQL"        , "pgsql"],
    php:        ["PHP"          , "php|phtml"],
    powershell: ["Powershell"   , "ps1"],
    python:     ["Python"       , "py|gyp|gypi"],
    r:          ["R"            , "r"],
    rdoc:       ["RDoc"         , "Rd"],
    rhtml:      ["RHTML"        , "Rhtml|vx"],
    ruby:       ["Ruby"         , "ru|gemspec|rake|rb"],
    scad:       ["OpenSCAD"     , "scad"],
    scala:      ["Scala"        , "scala"],
    scss:       ["SCSS"         , "scss|sass"],
    sh:         ["SH"           , "sh|bash|bat"],
    sql:        ["SQL"          , "sql"],
    stylus:     ["Stylus"       , "styl|stylus"],
    svg:        ["SVG"          , "svg"],
    tcl:        ["Tcl"          , "tcl"],
    tex:        ["Tex"          , "tex"],
    text:       ["Text"         , "txt|log|map"],
    textile:    ["Textile"      , "textile"],
    typescript: ["Typescript"   , "typescript|ts|str"],
    xml:        ["XML"          , "xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl"],
    xquery:     ["XQuery"       , "xq"],
    yaml:       ["YAML"         , "yaml"]
};

//通过文件获取模块名称
function get_mode_name(filename){

	var mat = filename.match(/([^\/\.]+)[^\/]*?(\.([^\.]+))?$/);
	if(mat){
    var suffix = mat[3];
    var basename = mat[1];
    var ls = [suffix, basename];

    for(var i = 0; i < 2; i++){

      var item = ls[i];
      if (item) {
    		for (var name in modes) {
    			var mode = modes[name];
          var reg = new RegExp('^(' + mode[1] + ')$', 'i');
          
    			if (reg.test(item)) {
    				return 'ace/mode/' + name;
    			}
    		}
      }
    }
	}
	return default_mode;
}

export class EditSession extends AceEditSession {

	/**
	* constructor function
	* @param {Object}   text
	* @param {String}   filename   (Optional)
	* @constructor
	*/
	constructor (text, filename) {
		AceEditSession.call(this, text || '', get_mode_name(filename || ''));
		
		this.$break = {
			row: -1,
			startColumn: -1,
			endColumn: -1
		};
		this.setTabSize(2); 				// 行缩进默认为2
		this.setUseSoftTabs(true);  // 使用软tab
	}

	//重写
	onChange (e){
		var delta = e.data;
		var breakpoints = this.$breakpoints;
		var len = breakpoints.length;
		var action = delta.action;
		var range = delta.range;
		var start = range.start.row;
		var end = range.end.row;
		
		switch (action) {
			case 'removeText':
			case 'removeLines':
				breakpoints.splice(start + 1, end - start);
				break;
			case 'insertText':
			case 'insertLines':
				if (start + 1 < len) {
					if (action == 'insertLines' || end - start > 0) {
						breakpoints.splice.apply( breakpoints, 
						                          [start + 1, 0].concat(new Array(end - start)));
					}
				}
				break;
		}
		
		AceEditSession.prototype.onChange.call(this, e);
	}

	get_transform_breakpoints (){
		var breakpoints = this.getBreakpoints();
		var rest = [];
		breakpoints.forEach(function (item, i){
			if (item) {
				rest.push(i);
			}
		});
		return rest;
	}

	get_transform_folds () {
		var folds = this.getAllFolds();
		var rest = [];
		return folds.map(function (item){
			var start = item.range.start;
			var end = item.range.end;
			//{ start: item.range.start, end: item.range.end };
			return [start.row, start.column, end.row, end.column];
		});
	}

	add_folds_by_range (ranges) {
		var self = this;
		ranges.forEach(function (item){
			//var range = new Range(start.row, start.column, end.row, end.column);
			self.addFold('...', new Range(item[0], item[1], item[2], item[3]));
		});
	}

	set_debug_break (row, startColumn, endColumn) {
	  
		this.clearDebugBreak();
		this.$break = {
			row: row,
			startColumn: startColumn,
			endColumn: endColumn
		};
		
		var range = new Range(row, startColumn, row, endColumn);

		this.addGutterDecoration(row, 'ace_debug_break');
		this.$breakMarkerId = 
		  this.addMarker(range, 'ace_selected_debug_break', 'text');
    
		this._emit("debugbreak", {
			action: 'set',
			row: row,
			startColumn: startColumn,
			endColumn: endColumn
		});
	}

	clear_debug_break () {
		var breakMarkerId = this.$breakMarkerId;
		if (!breakMarkerId)
			return;

		this.removeMarker(breakMarkerId);
		this.removeGutterDecoration(this.$break.row, 'ace_debug_break');

		this.$break = { row: -1, startColumn: -1, endColumn: -1 };
		this.$breakMarkerId = 0;
		this._emit("debugbreak", { action: 'clear' });
	}

	get_debug_break () {
		return this.$break;
	}

	destroy (){
		this.$stopWorker();
	}
	
}

exports = {
  
  /**
   * 通过文件名称获取代码mode
   */  
  get_mode_by_name: function (name) {
    return get_mode_name(name);
  },
  
  /**
   * 支持的文件后缀
   */
  support_text_suffix: support_text_suffix,
  
  /**
   * 是否为文本文件
   */
  is_text: is_text,
  
};