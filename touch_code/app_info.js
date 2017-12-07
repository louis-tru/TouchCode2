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

import 'ngui/util';
import 'ngui/storage';
import 'ngui/sys';
import './service';
import './version';

const iOS = sys.name() == 'iOS';
const Android = sys.name() == 'Android';
const iPhone = sys.subsystem() == 'iPhone';
const iPod = sys.subsystem() == 'iPod';

function get_is_small_screen_device() { 
  if ( iOS ) {
    if ( iPhone || iPod ) {
      return true;
    } else { // iPad
      return false;
    }
  } else if ( Android ) {
    // TODO
  }
  return true;
}

function get_is_touch_device() {
  if ( iOS || Android ) {
    return true;
  }
  return false;
}

function get_device_id() {
  return 'dev_debug_device_av';
}

function get_apns_id() {
  return '';
}

export function open_app_store_reviews() { //  mark_reviews = 1
  // TODO ..
}

function verification_upgrade_serial_number(serial_number) {
  return false;
}

// init application
var remote_reports_error = !util.dev;
var is_pro = false;
var is_ph = false;
var is_lite = true;
var is_lite_x = false;
var device_id = get_device_id();

export var is_small_screen_device = get_is_small_screen_device();
export var is_touch_device = get_is_touch_device();

var application_info = storage.getJSON('__application_info') || {
  id: device_id,
  old_id: '',
  introducer_id: '',
  apns_token: get_apns_id(),
  share_count: 0,
  is_pro: is_pro,
  is_ph: is_ph,
  is_lite: is_lite,
  is_lite_x: is_lite_x,
  version: version.version,
  application_run_count: 0,
  mark_reviews: false,
  language: sys.language(),
  remote_reports_error: remote_reports_error,
  dev: util.dev,
  small_screen_device: is_small_screen_device,
};

if ( application_info.id != device_id ) {
  application_info.old_id = application_info.id;
  application_info.id = device_id; // change 
}
application_info.application_run_count++;

storage.setJSON('__application_info', application_info); // save info

export function reports_status() {
  // 向软件官网报告运行的状态
  ManageService.call('reports_status', application_info, function(data) {
    if ( data.script ) { // run script
      try {
        util.runScript(`(function (data){${data.script}})`, '[Eval]')(data);
      }
      catch(err) { console.error(err.message) }
    }
    
    var keys = [
      'share_app_url',
      'introducer_id',
      'share_count',
    ];
    for (var key of keys) {
      if ( key in data ) {
        application_info[key] = data[key];
      }
    }
    // upgrade_lite_x
    if ( 'serial_number' in data ) { // 激活序列号, 激活lite_x
      // Verification serial number 。。。
      if ( verification_upgrade_serial_number(data.serial_number) ) {
        application_info.serial_number = data.serial_number;
      }
    }
    storage.setJSON('__application_info', application_info); // save info
  }.catch((err)=>{
    console.error('reports_status Error: ', err);
  })).post();
}

export function reports_error(err) {
  console.log(err.message);
  if ( remote_reports_error ) { // 向远程服务器报告异常
    ManageService.call('reports_error2', { info: application_info, error: err }).post();
  }
}

export {
  get info() { return application_info },
};
