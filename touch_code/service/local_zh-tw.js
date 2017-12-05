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

$import(':truth/loc::def');

// APIService.js
def([
  '查询表达式格式错误',
'查詢表達式格式錯誤',
  '文件大小超过限制',
'文件大小超過限制',
  '请先结束当前查询才能开始新的查询',
'請先結束當前查詢才能開始新的查詢',
// server/teide/touch/FileActionService.js
  '无法停止,当前没有下载对像',
'無法停止,當前沒有下載對象',
  '无法停止,当前没有压缩对像',
'無法停止,當前沒有壓縮對象',
  '无法停止,当前没有解压对像',
'無法停止,當前沒有解壓對像',
  '无法停止,当前没有克隆对像',
'無法停止,當前沒有克隆對像',
  '无法停止,当前没有删除对像',
'無法停止,當前沒有刪除對像',
  '无法停止,当前没有更新或提交任务',
'無法停止,當前沒有更新或提交任務',
  '当前正在下载状态',
'當前正在下載狀態',
  '不支持压缩功能',
'不支持壓縮功能',
  '当前正在压缩状态',
'當前正在壓縮狀態',
  '压缩文件失败',
'壓縮文件失敗',
  '不支持解缩功能',
'不支持解縮功能',
  '当前正在解压状态',
'當前正在解壓狀態',
  '解压文件失败',
'解壓文件失敗',
  '文件不存在',
'文件不存在',
  '目录已存在',
'目錄已存在',
  '文件已存在',
'文件已存在',
  '无需重复添加,请打开文件.map/conf.keys',
'無需重複添加,請打開文件.map/conf.keys',
  '有一个任务正在进行',
'有一個任務正在進行',
// server/teide/touch/FileActionService.js
  // ##
  '请以正确的格式输入',
'請以正確的格式輸入',
  '支持',
'支持',
  '支持FTP与SFTP协议',
'支持FTP與SFTP協議',
  '服务器域名或IP地址',
'服務器域名或IP地址',
  '服务端口默认FTP为21,SFTP为22',
'服務端口默認FTP為21,SFTP為22',
  '默认为用户根目录',
'默認為用戶根目錄',
  '默认为匿名',
'默認為匿名',
  '密码',
'密碼',
  // ##  
  '支持ssh协议',
'支持ssh協議',
  '服务端口默认ssh为22',
'服務端口默認ssh為22',
  '用户名',
'用戶名',
  '此处输入命令,点击三角按钮可运行',
'此處輸入命令,點擊三角按鈕可運行',
// server/teide/touch/FileMappingEntity.js
  '无法合并本地目录与线上文件,请先删除本地目录',
'無法合併本地目錄與線上文件,請先刪除本地目錄',
  '目录存在冲突,这个目录被其它映射占用无法更新',
'目錄存在衝突,這個目錄被其它映射佔用無法更新',
  '文件不存在',
'文件不存在',
  '写入文件到服务错误,服务器有新版本请先更新这个文件',
'寫入文件到服務錯誤,服務器有新版本請先更新這個文件',
  '写入文件到服务错误,服务器文件已更改过请先更新文件',
'寫入文件到服務錯誤,服務器文件已更改過請先更新文件',
  '写入文件到服务错误,服务器文件已被删除请更新文件所在的目录',
'寫入文件到服務錯誤,服務器文件已被刪除請更新文件所在的目錄',
  '删除服务器文件错误,文件已改变请更新文件所在的目录',
'刪除服務器文件錯誤,文件已改變請更新文件所在的目錄',
  '非法文件名',
'非法文件名',
  '目标不是目录',
'目標不是目錄',
// server/teide/touch/JavascriptContext.js
  '暂不支持Javascript运行',
'暫不支持Javascript運行',
  '只有Ph与Pro版本才有此功能',
'只有Ph与Pro版本才有此功能',
  '已经开始运行',
'已經開始運行',
// server/teide/touch/MFTP.js
  '连接到FTP服务器异常',
'連接到FTP服務器異常',
  '目录无法读取',
'目錄無法讀取',
  '无法读取文件属性',
'無法讀取文件屬性',
// server/teide/touch/RemoteScriptContext.js
  '已经开始运行',
'已經開始運行',
  '暂时只支持SSH类型协议',
'暫時只支持SSH類型協議',
// server/teide/touch/ScriptService.js
  '同时只能运行一个脚本文件',
'同時只能運行一個腳本文件',
  '无法运行的文件类型',
'無法運行的文件類型',
  '运行异常详情请见控制台日志',
'運行異常詳情請見控制台日誌',
  '当前没有运行任何脚本文件',
'當前沒有運行任何腳本文件',
//
  '更新文件版本冲突',
'更新文件版本衝突',
  '不能压缩.map文件',
'不能壓縮.map檔案',
  '现在无法使用此功能',
"現在無法使用此功能",
  '请购买Ph版或Pro版或将此软件推荐给5个好友可免费激活',
'請購買Ph版或Pro版或將此軟體推薦給5個好友可免費啟動',
  '请购买Ph版或Pro版',
'請購買Ph版或Pro版',
]);

