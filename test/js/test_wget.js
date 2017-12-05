
var wget = require('wget');

// https://codeload.github.com/louis-tru/iscroll/zip/master
// iscroll-master.zip

// https://codeload.github.com/louis-tru/iscroll/zip/master

//var download = wget.download('https://raw.github.com/Fyrd/caniuse/master/data.json', 'README.md');
var download = wget.download(
	'https://codeload.github.com/louis-tru/iscroll/zip/master', 
	'iscroll-master.zip');

// with a proxy:
// var download = wget.download('https://raw.github.com/Fyrd/caniuse/master/data.json', '/tmp/README.md', {proxy: 'http://proxyhost:port'});

download.on('error', function (err) {
  console.log('wget error', err);
});

download.on('end', function (output) {
  console.log('wget end', output);
});

download.on('progress', function (progress) {
  console.log('wget progress', progress);
});

