
console.log(process.argv);

var zlib = require('zlib');
var crypto = require('crypto');

zlib.gzip('ABCD', function (err, data) {        //gzip
          
  console.log(err, data);
          
  var md5 = new crypto.Hash('md5');
  
  md5.update('ABCD');
  
  console.log(md5.digest('base64'));
          
});


