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

// Permission denied.

$import(':truth/loc::def');

// APIService.js
def([
  '查询表达式格式错误',
'Wrong format in query formula',
  '文件大小超过限制',
'File size exceeds the limit',
  '请先结束当前查询才能开始新的查询',
'New search only can be start after the current one finished',
// server/teide/touch/FileActionService.js
  '无法停止,当前没有下载对像',
'Can’t stop, no download object',
  '无法停止,当前没有压缩对像',
'Can’t stop, no compress object',
  '无法停止,当前没有解压对像',
'Can’t stop, no unzip object',
  '无法停止,当前没有克隆对像',
'Can’t stop, no clone object',
  '无法停止,当前没有删除对像',
'Can’t stop, no delete object',
  '无法停止,当前没有更新或提交任务',
'Can’t stop, no updates or submit missions currently.',
  '当前正在下载状态',
'Downloading status',
  '不支持压缩功能',
'Nonsupport compress function',
  '当前正在压缩状态',
'Compressing status',
  '压缩文件失败',
'Compress file failure',
  '不支持解缩功能',
'Nonsupport unzip function',
  '当前正在解压状态',
'Unzipping status',
  '解压文件失败',
'Unzip the file failed',
  '文件不存在',
'File didn’t exist',
  '目录已存在',
'Directory already exist',
  '文件已存在',
'File already exist',
  '无需重复添加,请打开文件.map/conf.keys',
'No need to append again, please open file .map/conf.keys',
  '有一个任务正在进行',
'One mission is running',
// server/teide/touch/FileActionService.js
  // ##
  '请以正确的格式输入',
'Please refer to the correct format input',
  '支持',
'Support',
  '支持FTP与SFTP协议',
'Support FTP and SFTP protocol',
  '服务器域名或IP地址',
'Server’s domain name or IP address',
  '服务端口默认FTP为21,SFTP为22',
'Default server’s port: ftp 21, sftp 22',
  '默认为用户根目录',
'Default as user’s root directory ',
  '默认为匿名',
'default as anonymous',
  '密码',
'Password',
  // ##  
  '支持ssh协议',
'Support ssh protocol',
  '服务端口默认ssh为22',
'Default server’s port: ssh 22',
  '用户名',
'Username',
  '此处输入命令,点击三角按钮可运行',
'Here the input command, click the triangle button run',
// server/teide/touch/FileMappingEntity.js
  '无法合并本地目录与线上文件,请先删除本地目录',
'Can’t combine local directory and online file, please delete local directory.',
  '目录存在冲突,这个目录被其它映射占用无法更新',
'directory exists conflict, it was occupied by other reflection, can not updates',
  '文件不存在',
'File does not exist.',
  '写入文件到服务错误,服务器有新版本请先更新这个文件',
'Writing to server error, a new version must be updated in the server first',
  '写入文件到服务错误,服务器文件已更改过请先更新文件',
'Writing to server error, file in server already updated, please renew it first.',
  '写入文件到服务错误,服务器文件已被删除请更新文件所在的目录',
'Writing to server error, file in server already deleted, please update it in the directory',
  '删除服务器文件错误,文件已改变请更新文件所在的目录',
'Delete the file error in server, file already changed, please update it in the directory',
  '非法文件名',
'Invalid file name',
  '目标不是目录',
'Target is not a directory.',
// server/teide/touch/JavascriptContext.js
  '暂不支持Javascript运行',
'Nonsupport Javascript environment running',
  '只有Ph与Pro版本才有此功能',
'Only Ph and Pro version has this function.',
  '已经开始运行',
'Already run',
// server/teide/touch/MFTP.js
  '连接到FTP服务器异常',
'Connect FTP server error',
  '目录无法读取',
'Can not read directory',
  '无法读取文件属性',
'Can not read file attributes',
// server/teide/touch/RemoteScriptContext.js
  '已经开始运行',
'Already run',
  '暂时只支持SSH类型协议',
'Only support ssh protocol type',
// server/teide/touch/ScriptService.js
  '同时只能运行一个脚本文件',
'Only can run one script file in the same time',
  '无法运行的文件类型',
'Can not run this type of file',
  '运行异常详情请见控制台日志',
'Abnormal operation details please see console log',
  '当前没有运行任何脚本文件',
'No any script file running',
//  
  '更新文件版本冲突',
'Update file version conflict',
  '不能压缩.map文件',
'Can not be compress .map file',
  '现在无法使用此功能',
"Can't use this functional now",
  '请购买Ph版或Pro版或将此软件推荐给5个好友可免费激活',
'Please buy the Ph/Pro version or recommend this software to five friends can be free to activate',
  '请购买Ph版或Pro版',
'Please buy the Ph/Pro version',
]);

