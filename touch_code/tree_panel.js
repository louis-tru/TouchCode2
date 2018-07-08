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

import ':util/event';
import ':util';
import { Div, Scroll } from ':gui';
import ViewController from ':gui/ctr';
import 'tree_panel.jsx';

//import ':wgui/res';
//import ':wgui/node';
//import ':wgui/node::Node';
//import ':wgui/ctrl::Ctrl';
//import ':wgui/view';
//import 'tree_panel.vx';

/**
 * 更新节点层级
 * @private
 */
function updateLeval(self) {
  
  var level = self.m_parent.level + 1;
  
  if(level != self.m_level){
    self.m_level = level;
    self.inner.set_css('padding-left', (level - 1) * 15 + 'px');

    var children = self.children;
    
    // 设置子节点的层级
    for(var i = 0; i < children.length; i++){
      updateLeval(children[i]);
    }
  }
}

/**
 * 通过以当前节点的偏移值查询节点
 * 返回偏移移值上面相近的节点
 * @private
 */
function queryNodeByOffset(self, y) {
  
  var root = self.m_root;
  y += root.m_dart_basic_offset_y + root.m_dart_basic_scroll_top;
  var count = Math.round(y / 32);
  
  if(count < 1){
    return null;
  }
  return queryNode(self, root, { count: count /*找目标节点的上一个*/ });
}

/**
 * 查找节点
 */
function queryNode(self, node, data) {
  
  var children = node.children;
  
  for(var i = 0; i < children.length; i++){

    if(data.count === 0){
      if(node === self){ 
        // 如果找到自己的位置,在向下查找一个位置
        data.count++;
      }
      else{
        return node;
      }
    }

    node = children[i];
    data.count--;

    if(node.isExpand()){     // 如果已展开
      node = queryNode(self, node, data);
    }
  }
  
  return node;
}

/**
 * 选中节点
 * @private
 */
function selected_node(self) {
  self.add_cls('select');
}

/**
 * 反选中节点
 * @private
 */
function not_selected_node(self){
  self.del_cls('select');
}

function drag_start(self, x, y) {
  self.m_root.m_dart_basic_offset_y = self.offset.top - self.m_root.offset.top; //45; // 设置基础偏移
  self.m_root.m_dart_basic_scroll_top = self.m_root.dom.scrollTop;
  self.m_root.m_drag_start_x = x;
  self.m_root.m_drag_start_y = y;
  // 开始拖拽
  // 设置样式为拖拽状态
  self.add_cls('drag');
}

// 拖拽移动
function drag_move(self, x, y) {
  
  var root =  self.m_root;
  var start_x = root.m_drag_start_x;
  var start_y = root.m_drag_start_y;
  var distance_x = x - start_x;
  var distance_y = y - start_y;
  
  if(!root.m_drag_node){
    // 移动超过5像素开始拖拽
    if(Math.abs(distance_x) > 5 || Math.abs(distance_y) > 5){
      root.m_drag_node = self;
      self.collapse();  // 收拢节点
    }
  }
  
  if(root.m_drag_node){
    
    var first = root.children[0];
    
    if(root.m_drag_adjoin){
      root.m_drag_adjoin.css0ms('margin-bottom', 0);
      root.m_drag_adjoin = null;
    } else {
      first.css0ms('margin-top', 0);
    }
    
    distance_y += (root.dom.scrollTop - root.m_dart_basic_scroll_top);
    
    if(distance_y >= 16) { // 修正偏差
      distance_y += 32;
    }

    self.css0ms('top', distance_y + 'px');

    // 查询最相近的节点,返回的这个节点始终都靠近偏移值上面
    var node = queryNodeByOffset(self, distance_y);
    if(node){
      root.m_drag_adjoin = node;
      root.m_drag_adjoin.css0ms('margin-bottom', '32px');
      self.css0ms('margin-top', '-32px');
    }
    else{
      // 如果没有返回表示已经达到最上面
      if(first !== self){
        first.css0ms('margin-top', '32px');
        self.css0ms('margin-top', '-32px');
      }
      else{
        self.css0ms('margin-top', 0);
      }
    }
  }
}

// 拖拽结束
function drag_end(self, x, y) {
  
  self.del_cls('drag');
  self.set_css('top', 0);

  var root = self.m_root;

  if(!root.m_drag_node){
    return;
  }
  //
  root.m_drag_node = null;
  root.children[0].css0ms('margin-top', 0);
  self.css0ms('margin-top', 0);
  
  var parent = self.m_parent;
  var drag_adjoin = root.m_drag_adjoin;
  var data = { oldParent: parent, node: self };
  
  root.m_drag_adjoin = null;
  
  if(drag_adjoin){
    drag_adjoin.css0ms('margin-bottom', 0);
    
    if(drag_adjoin === self){ // 如果是自己无效
      return;
    }
    
    // 拖拽到达drag_adjoin节点的下面
    // 如果相邻的节点已经加载过数据并且没有子节点与展开的情况下
    // 当前做为子节点加入到相邻节点否则插入该节点的后面
    if(drag_adjoin.isLoadData && drag_adjoin.isExpand()){
      drag_adjoin.prepend(self); // 前置节点
    }
    // 如果节点是一个叶子节点,并且是一个目录
    // 加入到节点内部,成为子节点
    else if(drag_adjoin.icon == 'dir' && drag_adjoin.leaf){
      drag_adjoin.prepend(self);  // 前置节点
      drag_adjoin.expand();       // 展开
    }
    else{ // 插入到后面
      drag_adjoin.after(self);
    }
    root.ondrag.trigger(data);
  }
  else{
    // 没有相邻的节点表示达到最上面
    if(root.children[0] !== self){
      root.children[0].before(self);
      root.ondrag.trigger(data);
    }
  }
}

// 绑定mobile事件
function bindMobileEvent(self) {
  
  var is_start = false;
  var touch_point_id = 0; // 触点id
  
  self.drag_btn.on('touchstart', function (evt){
    
    evt.return_value = false;
    
    // 是否为编辑状态,是否已经开始,是否忙碌
    if(!self.root.edit || 
      is_start || 
      self.root.isBusy  // 只有节点正在占线,就不允许操作
      //self.isBusy(true)
      ){
      // 已经开始就不需要在来一次了 // 一个触点就够了
      return;
    }
    
    is_start = true;
    touch_point_id = evt.data.touches[0].identifier;
		var touche = evt.data.touches[0];
		drag_start(self, touche.pageX, touche.pageY);
		
  });
  
  function selectTouches(touches, fn){
    
    if(!is_start){
      return;
    }
    for(var i = 0; i < touches.length; i++){
      if(touches[i].identifier == touch_point_id){
        fn(self, touches[i].pageX, touches[i].pageY);
        return true;
      }
    }
  }
  
  self.drag_btn.on('touchmove', function (evt){
    evt.return_value = false;
    selectTouches(evt.data.changedTouches, drag_move);
  });
  
  self.drag_btn.on('touchend', function (evt){
    if(selectTouches(evt.data.changedTouches, drag_end)){
      is_start = false;
    }
  });
}

// 绑定pc事件
function bindPCEvent(self) {
  self.drag_btn.on('mousedown', function (evt){
    // TODO 
  });
}

/**
 * @节点初始化
 * @private
 */
function init_TreeNode(self) {

  self.on('click', function () {
    // 展开与收拢状态切换
    self.toggleNode();
    if(!self.m_root.edit){
      // 如果不为编辑状态,可选中当前节点
      self.root.setSelectedNode(self);
      self.root.onnodeclick.trigger({ node: self });
    }
  });
  
  self.info_btn.on('click', function (evt){
    self.m_root.onclickinfo.trigger({ node: self });
    evt.return_value = false;
  });

  self.busy_btn.on('click', function (evt){
    self.m_root.onclickbusy.trigger({ node: self });
    evt.return_value = false;
  });
  
  if(util.env.touch){
    bindMobileEvent(self);
  }
  else{
    bindPCEvent(self);
  }
}

/**
 * 节点卸载事件
 */
function release_TreeNode(self) {
  var root = self.m_root;
  if(root.selectedNode() === self){
    root.setSelectedNode(null);
  }
  if(root.m_drag_node === self){
    root.m_drag_node = null;
  }
}

/**
 * 设置节点的数据
 * @private
 */
function setData(self, data) {
  // TODO
  self.m_data = util.extend({ }, data);
  delete self.m_data.children;
  
  if (data.text) {
    self.text = data.text;
  }
  if (data.icon) {
    self.icon = data.icon;
  }
  
  if (data.info) {
    self.info = data.info;
  }
  
  if (data.leaf) { // 叶子节点
    //self.loadData(null);
    self.leaf = true;
  }
  else if ('children' in data) {
    self.loadData(data.children);
  }

  self.m_root.onrendernode.trigger({ node: self });
}

/**
 * 展开节点
 */
function expand(self) {
  self.m_children_container.show();
}

// 初始子节点
function init_children(self, el) {
  var ns = el.childNodes;
  var ls = [];
  for (var i = 0; i < ns.length; i += 2) {
    ls.push(node.$(ns[i]));
  }
  self.m_children = ls;
  return ls;
}

// 
function get_last(self, el) {
  var n = el.lastChild;
  if(n){
    return node.$(n.previousSibling);
  }
  return null;
}

function find(self, names) {
  
  var name = names.shift();
  var ns = self.children;
  
  for(var i = 0; i < ns.length; i++){
    var node = ns[i];
    if(node.m_text == name){
      return names.length ? find(node, names): node;
    }
  }
  return null;
}

/**
 * 通过路径查询现有节点
 * @private
 */
function findByPath(self, path) {
  path = path.replace(/\/$/, '');
  if(path){
    return find(self, path.split('/'));
  }
  return self;
}

/**
 * @class TreeNode
 * @extends Ctrl
 */
class TreeNode extends ViewController {
  // private:
  m_text = '';     // 节点文本
  m_icon = '';     // 图标类型
  m_info = 'I';    // info 标记
  m_leaf = false;  // 是否为叶子节点
  m_level = -1;    // 节点层级
  m_children = null;
  m_children_container = null; // 子节点容器
  // 根节点 ResourcesPanel
  m_root = null;           
  // 父节点,这个父节点不是普通的父节点,它只能为TreeNode
  m_parent = null;
  // 节点是否展开
  m_is_expand = false;
  // 节点数据,只是单个节点数据,并没有子节点数据,子节点数据应该在子节点上找到
  // 这个数据通常是在父节点调用loadData后被设置的
  m_data = null;
  // 是否加载了数据
  m_is_load_data = false;
  // 是否占线
  m_is_busy = false;

	/**
	 * @constructor
	 */
  constructor(root) {
    super();
    this.m_root = root;
    this.m_children = [];
    this.load_view(tree_panel.node_vx); // 载入视图
    this.m_children_container = this.find('children_container');
    init_TreeNode(this);
  }
  
  trigger_remove_view(evt) {
    release_TreeNode(this);
    super.trigger_remove_view(evt);
  }
  
  /**
   * 返回是否已载入过子节点
   */
  get isLoadData() {
    return this.m_is_load_data;
  }

  /**
   * 节点文本
   * @get
   */  
  get text() { 
    return this.m_text; 
  }
  
  /**
   * 节点文本
   * @set
   */
  set text(value) {
    this.m_text = value;
    this.n_text.html = value;
  }
  
  /**
   * 节点类型
   * @get
   */  
  get icon() { 
    return this.m_icon;
  }
  
  /**
   * 节点类型
   * @set
   */
  set icon(value) {
    this.icon_panel.class = 'n_icon ' + value;
    this.m_icon = value;
  }

  /**
   * @是否忙碌状态
   * @param {boolean} depth 深度查询,查询子节点
   * @return {boolean} 
   */
  isBusy(depth) {

    if (this.m_is_busy) {
      return true;
    }

    if (depth && this.root.isBusy) {

      var node = this.root.m_busy_node;

      while (node) {
        if (node === this) {
          return true;
        }
        else {
          node = node.getParentNode();
        }
      }
    }

    return false;
  }
  
  /**
   * 开始忙碌,如果成功返回true
   */
  startBusy() {
    if (this.m_is_busy || this.m_root.m_busy_node) {
      return false; // 当前还有没有完成的任务
    }
    this.busy_progress_text.text = '';
    this.m_is_busy = true;
    this.m_root.m_busy_node = this;
    this.collapse();// 收起节点
    //this.add_cls('busy');
    this.root.onstartbusy.trigger(this);
    return true;
  }

  /**
   * 设置忙线进度
   */
  setBusyProgress(progress) {
    this.busy_progress_text.text = Math.round(progress * 100) + '%';
  }
  
  /**
   * 停止忙碌状态,如果成功返回true
   */
  stopBusy() {
    if (!this.m_is_busy) {
      return false;
    }
    this.busy_progress_text.text = '';
    this.m_is_busy = false;
    this.m_root.m_busy_node = null;
    //this.del_cls('busy');
    this.root.onstopbuys.trigger(this);
    return true;
  }
  
  /**
   * 是否为叶子节点
   */
  get leaf() { 
    return this.m_leaf; 
  }
  
  /**
   * 设置是否叶子节点
   */
  set leaf(value) {
    if (value != this.m_leaf) {
      this.m_leaf = value;
      if (value) {
        this.loadData(null);
      }
      else{
        // 设置叶子节点后无法在设置回去
        // 只能通过loadData 加载数据更改或添加子节点
      }
    }
  }
  
  /**
   * 获取节点info标记
   */
  get info() {
    return this.m_info;
  }
  
  /**
   * 获取节点info标记
   */
  set info(value) {
    this.m_info = value;
    return this.info_btn.text = value.mark;
  }

  /**
   * 根节点
   */
  get root() {
    return this.m_root;
  }
  
  /**
   * 获取子节点列表,此子节点非彼子节点
   */
  get children() {
    if (this.m_children) {
      return this.m_children;
    } else {
      return init_children(this, this.m_children_container);
    }
  }
  
  /**
   * 删除所有的子节点
   */
  empty() {
    this.m_children = [];
    this.m_children_container.remove_all_child(); // 清空容器中的内容
  }
  
  /**
   * 子节点是否已经展开
   */
  isExpand() {
    return this.m_is_expand;
  }
  
  /**
   * 展开子节点
   */
  expand() {
    
    if (this.m_is_busy) {
      return; // 忙碌时无法展开
    }
    
    if (this.m_leaf) {// 叶子节点不能展开
      return;
    }
    
    if (this.m_is_expand) { // 节点已经展开
      return;
    }
    this.m_is_expand = true; // 设置成展开状态
    //this.add_cls('expand');
    
    if (this.m_is_load_data) {
      expand(this);
    }
    else {
      // 还未初始化, 请求数据
      this.m_root.onrequest.trigger({ node: this });
    }
    this.m_root.onexpand.trigger({ node: this });
  }
  
  /**
   * 收拢子节点
   */
  collapse() {
    if (this.m_is_expand) {
      this.m_is_expand = false; // 设置收拢成状态
      //this.del_cls('expand');
      this.m_children_container.hide();
      this.root.oncollapse.trigger({ node: this });
    }
  }
  
  /**
   * 展开与收拢子节点
   */
  toggleNode() {
    if (this.m_is_expand) {
      this.collapse();
    }
    else {
      this.expand();
    }
  }
  
  /**
   * 获取节点层级
   */
  get level() {
    return this.m_level;
  }
  
  /**
  * 前置节点,只能添加private$ResourcesPanelNode
  */
  prepend(node) {
    if (node instanceof TreeNode) {
      this.m_children_container.append(node.view);
      node.setParentNode(this); // 设置父节点
      // if(this.m_leaf){ // 去掉叶子节点属性
      //   this.m_leaf = false;
      //   this.del_cls('leaf');
      // }
    }
    else {
      throw new Error('只能添加 TerrPanel 创建的节点');
    }
  }

  /**
   * 添加子节点,只能添加private$ResourcesPanelNode
   */
  append(node) {
    if (node instanceof TreeNode) {
      this.m_children_container.append(node.view);
      node.setParentNode(this); // 设置父节点
      // if(this.m_leaf){ // 去掉叶子节点属性
      //   this.m_leaf = false;
      //   this.del_cls('leaf');
      // }
    }
    else {
      throw new Error('只能添加 TerrPanel 创建的节点');
    }
  }
  
  /**
   * 插入前,只能添加TreeNode
   */
  before(node) {
    if (node instanceof TreeNode) {
      this.view.before(node.view);
      node.setParentNode(this.m_parent); // 设置父节点
    }
    else {
      throw new Error('只能添加 TerrPanel 创建的节点');
    }
  }

  /**
   * 插入后,只能添加TreeNode
   */
  after(node) {
    if (node instanceof TreeNode) {
      this.view.after(node.view);
      node.setParentNode(this.m_parent); // 设置父节点
    }
    else {
      throw new Error('只能添加 TerrPanel 创建的节点');
    }
  }
  
  /**
   * 设置父节点
   */
  setParentNode(node) {
    
    if ( this.m_parent === node ) {
      if (node) {
        this.m_parent.m_children = null; // 重置子节点列表
      }
      // 相同不需要设置
      return;
    }
    if (this.m_parent) {
      this.m_parent.m_children = null; // 重置子节点列表
    }
    if (node) {
      if (node instanceof TreeNode) {
        node.m_is_load_data = true;
        if (node.m_leaf) { // 去掉叶子节点属性
          node.m_leaf = false;
          node.del_cls('leaf');
        }
      }
      this.m_parent = node;
      this.m_parent.m_children = null; // 重置子节点列表
      updateLeval(this);
    }
  }
  
  // /**
  // * 设置样式
  // */
  // css200ms(name, value) {
  //   this.set_css('transition-duration', '200ms');
  //   this.set_css(name, value);
  // }
  
  // /**
  // * 设置样式
  // */
  // css0ms(name, value) {
  //   this.set_css('transition-duration', 0);
  //   this.set_css(name, value);
  // }
  
  /**
   * 获取父节点
   */
  getParentNode() {
    return this.m_parent;
  }
  
  /**
   * 上一个兄弟节点
   */
  get prev() {
    var view = this.view.prev();
    return view && view.ctr;
  }
  
  /**
   * 下一个兄弟节点
   */
  get next() {
    var view = this.view.next();
    return view && view.ctr;
  }
  
  /**
   * 第一个子节点
   */
  get first() {
    var view = this.m_children_container.first;
    return view && view.ctr;
  }
  
  /**
   * 最后一个子节点
   */
  get last() {
    var view = this.m_children_container.last;
    return view && view.ctr;
  }
  
  /**
   * 删除节点
   */
  remove() {
    if (this.m_parent) {
      this.m_parent.m_children = null;  // 重置子节点列表
    }
    this.view.remove();
  }
  
  /**
   * 节点上的数据
   */
  get data() {
    return m_data;
  }
  
  /**
   * 重新载入子节点
   */
  reload(cb) {
    if (cb) {
      var self = this;
      self.root.onloaddata.once(function (evt) {
        if (evt.data.node === self) {
          cb();
        }
      });
    }
    this.m_root.onrequest.trigger({ node: this });
  }
  
  /**
   * 获取节点的路径
   */
  get path() {
    if (this.m_parent !== this.m_root) {
      return this.m_parent.path + '/' + this.m_text;
    }
    else {
      return this.m_text;
    }
  }
  
  /**
   * 通过路径查询现有节点
   */
  find(path) {
    return findByPath(this, path);
  }
  
  /**
   * 加载数据
   */ 
  loadData(data) {
    
    this.empty(); // 清空
    
    this.m_is_load_data = true; // 设置已加载过数据
    
    if (this instanceof TreeNode) {

      if (data === null || !data.length) { // 为叶子节点
        this.m_leaf = true;
        this.add_cls('leaf');
        this.collapse();
        return;
      }
      else {
        this.m_leaf = false;
        this.del_cls('leaf');
      }
    
      if (this.m_is_expand) {
        expand(this);
      }
    }
    else if (data === null) {
      return;
    }
    
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var node = this.m_root.NewNode();
      this.append(node);
      setData(node, item);
    }
    
    this.m_root.onloaddata.trigger({ node: this, data: data });
  }
  
}

/************************************************/

function test(self) {
  // test data
  var data = [
    { text: 'test.cpp', icon: 'cpp', leaf: true, expanded: true, draggable: false, info: 'A' },
    { text: 'test.c', icon: 'c', leaf: true, info: '?' },
    { text: 'test.h', icon: 'h', leaf: true, info: '!' },
    { text: 'test.cc', icon: 'cpp', leaf: true, info: 'M' },
    { text: 'TeIDE' }
  ];
  self.loadData(data);
  self.onrequest.on(function (evt){
    evt.data.node.loadData(data);
  });
}

function cache_res() {
  res.load([
    "res/icon/drag_mark.png",
    "res/icon/circle.png",
    "res/suffix/htm.png",
    "res/suffix/cpp.png",
    "res/suffix/c.png",
    "res/suffix/cfm.png",
    "res/suffix/cjl.png",
    "res/suffix/h.png",
    "res/suffix/cs.png",
    "res/suffix/js.png",
    "res/suffix/dart.png",
    "res/suffix/dot.png",
    "res/suffix/css.png",
    "res/suffix/go.png",
    "res/suffix/ab.png",
    "res/suffix/ham.png",
    "res/suffix/m.png",
    "res/suffix/hx.png",
    "res/suffix/java.png",
    "res/suffix/mm.png",
    "res/suffix/py.png",
    "res/suffix/te.png",
    "res/suffix/gl.png",
    "res/suffix/php.png",
    "res/suffix/jsp.png",
    "res/suffix/json.png",
    "res/suffix/conf.png",
    "res/suffix/lua.png",
    "res/suffix/lp.png",
    "res/suffix/ml.png",
    "res/suffix/pl.png",
    "res/suffix/sql.png",
    "res/suffix/bat.png",
    "res/suffix/r.png",
    "res/suffix/sh.png",
    "res/suffix/cf.png",
    "res/suffix/svg.png",
    "res/suffix/xml.png",
    "res/suffix/vx.png",
  ]);
}

/**
 * @private
 */
function init_Tree(self) {
  
  // load icon
  util.next_tick(cache_res);

  self.on('click', function (evt){
    if(util.env.touch){
      if(evt.data.srcElement === evt.data.currentTarget){
        self.setSelectedNode(null); // 取消选择
      }
    }
    else{
      if(evt.data.srcElement.parentNode === evt.data.currentTarget){
        self.setSelectedNode(null); // 取消选择
      }      
    }
  });
}

// 
function expand_all(self, node, names, cb) {
  
  node = node.find(names.shift());
  
  if (!node) {
    return cb.throw(new Error('Error not node'));
  }
  
  if(!names.length){
    return cb(node);
  }
  
  if(node.isExpand()){
    expand_all(self, node, names, cb);
  } else if(node.isLoadData) {
    node.expand(); // 展开
    expand_all(self, node, names, cb);
  } else {
    self.onloaddata.once(function (evt){
      if(evt.data.node === node){
        expand_all(self, node, names, cb); // 继续查找
      }
    });
    node.expand(); // 展开
  }
}

/**
 * @class TreeController
 */
export class Tree extends TreeNode {
  
  // 选择的节点
  m_selected_node = null;      //
  m_children = null;           // 子节点
  m_edit = false; // 编辑状态
  // 编辑拖拽的开始x位置
  m_drag_start_x = 0;
  // 编辑拖拽的开始y位置
  m_drag_start_y = 0;
  // 当前拖拽的节点
  m_drag_node = null;
  // 拖拽相邻的节点
  m_drag_adjoin = null;
  // 拖拽节点的基础偏移
  m_dart_basic_offset_y = 0;
  // 是否有忙线的节点
  m_busy_node = null;
  
  /**
   * 节点点击事件
   * @event onnodeclick
   */
  event onnodeclick;
  
  /**
   * 请求子节点时触发
   * @event onrequest
   */
  event onrequest;
  
  /**
   * 节点每次展开都会触发
   */
  event onexpand;
  
  /**
   * 节点每次收拢都会触发
   */
  event oncollapse;
  
  /**
   * 子节点在载入数据后触发
   */
  event onloaddata;
  
  /**
   * 节点渲染后触发
   */
  event onrendernode;
  
  /**
   * 拖拽事件,这个事件只有打开编辑状态后才可能触发
   */
  event ondrag;
  
  /**
   * 节点的info按钮点击事件
   */
  event onclickinfo;

  /**
   * 忙线点击
   */
  event onclickbusy;
  
  event onstartbusy; // 开始占线
  
  event onstopbuys;  // 结束占线

  /**
	 * @constructor
	 */
  constructor () {
    super();
    this.m_children = [];
    this.add_cls('respanel');
    
    this.style = {
      'width': '100%',
      'height': '100%',
      'overflow-scrolling': 'touch',
      'overflow' : 'auto',
    };
    
    this.m_scroller = node.$('div');
    this.m_scroller.style = {
      'min-width': '100%',
      'min-height': '100%',
      'display': 'inline-block',
      'position': 'relative',
    };
    this.m_scroller.append_to(this);
    this.inl_dom = this.m_scroller.dom;
    this.onload_view.$on(init_TreePanel);
  }
  
  get isBusy() {
    return this.m_busy_node;
  }

  /**
   * 获取选择的节点
   */  
  selectedNode () {
    return this.m_selected_node;
  }
  
  /**
   * 设置选择的节点
   */
  setSelectedNode (node) {

    if (this.m_selected_node) {
      not_selected_node(this.m_selected_node);
    }
    
    this.m_selected_node = node;
    if (node) {
      selected_node(node);
    }
    
    // TODO 选中的节点如果没有在可视范围,调整到可视范围
  }
  
  /**
   * 加载数据
   */
  loadData(data) {

    this.empty(); // 清空
    
    if (data === null) {
      return;
    }
    
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var node = this.NewNode();
      this.append(node);
      setData(node, item);
    }

    this.onloaddata.trigger({ node: this, data: data });
  }
  
  /**
   * 获取子节点列表
   */
  get children() {
    if (this.m_children) {
      return this.m_children;
    } else {
      return init_children(this, this.inl_dom);
    }
  }

  /**
   * 获取父节点
   */
  getParentNode() {
    return null;
  }
  
  /**
   * 最后一个子节点
   */
  get last() {
    return get_last();
  }
  
  /**
   * 删除所有的子节点
   */
  empty(){
    this.m_children = [];
    Node.members.empty.call(this);
  }
  
  /**
  * 前置节点,只能添加private$ResourcesPanelNode
  */
  prepend(node) {
    if (node instanceof TreeNode) {
      Node.members.prepend.call(this, node); // 添加节点
      Node.members.after.call(node, node.m_children_container);
      node.setParentNode(this); // 设置父节点
    } else {
      throw new Error('只能添加 TerrPanel 创建的节点');
    }
  }
  
  /**
   * 添加子节点
   */
  append(node) {
    // TODO
    if (node instanceof TreeNode) {
      Node.members.append.call(this, node); // 添加节点
      Node.members.append.call(this, node.m_children_container); // 添加节点的容器
      node.setParentNode(this); // 设置父节点
    } else {
      throw new Error('只能添加 ResourcesPanel 创建的节点');
    }
  }
  
  /**
   * 删除这个控件
   */
  remove() {
    Node.members.remove.call(this); // 调用基础方法
  }

  get root() {
    return this;
  }
  
  /**
   * 获取节点层级
   */
  get level() {
    return 0;
  }
  
  /**
   * 获取节点的路径
   */
  get path() {
    return '';
  }
  
  /**
   * 通过展开所有目标节点
   */
  expand_all(path, cb) {
    if (!path) {
      return cb.throw(new Error('path error'));
    }
    expand_all(this, this, path.split('/'), cb || function (){ });
  }
  
  /**
   * 通过路径查询现有节点
   */
  find(path) {
    return findByPath(this, path);
  }
  
  /**
   * 开启编辑状态
   */
  enableEdit() {
    // 有忙线的节点时候不能进入编辑状态
    // if(this.isBusy){ 
    //   return false;
    // }
    this.m_edit = true;
    this.add_cls('edit');
    // 如果当前有选择的节点取消节点的选择
    if (this.m_selected_node) {
      not_selected_node(this.m_selected_node);
    }
    return true;
  }
  
  /**
   * 关闭编辑状态
   */
  disableEdit() {
    // 有忙线的节点时候不能关闭编辑状态
    // if(this.isBusy){
    //  return false;
    // }
    this.m_edit = false;
    this.del_cls('edit');
    return true;
  }
  
  /**
   * 返回是否为编辑状态
   */
  get edit() {
    return this.m_edit;
  }
  
  /**
   * 创建新的子节点
   * @
   */
  NewNode() {
    return new Node(this);
  }
  
  /**
   * 重新载入子节点
   */
  reload () {
    // this.empty(); // 清空
    this.onrequest.trigger({ node: this });
  }
  
}
