

var Ftp = require('ftp');
var ftp = new Ftp();

ftp.on('ready', function () {
  
  // ftp.list('www', function (err, ls){
  //   if(err){
  //     return console.error(err);
  //   }
  //   console.log(ls);
  // });
  
  // www/client/static/chrome-devtools/DevTools.js

  // ftp.get('www/start_ddns.sh', function (err, socket){
  //   if(err){
  //     return console.error(err);
  //   }
  //   socket.on('data', function (data){
  //     console.log(data.toString('utf-8'));
  //   });
  //   socket.on('end', function (){
  //     console.log('END');
  //   });
  //   socket.on('error', function (){
  //     console.log('ERROR');
  //   });
  // });
  
  // var input = 
  //   '/home/louis/www/jsxdev/work/3e069fffcd40b6a3ebd6fb74214f7161/trunk/cbb7d2b82e5cb8cd926154f7c615fcd9/log.txt';
  // var path = 'tmp/log2.txt';
  
  
  // ftp.list('tmp', function (err, ls){
    
  //   if(err){
  //     return console.error(err);
  //   }
    
  //   console.log(ls);
    
  //   ftp.put(input, path, function (err, data){
      
  //     //debugger;
      
  //     if(err){
  //       return console.error(err);
  //     }
  //     console.log('put ok');
  //   });
  // });
  
  ftp.rmdir('tmp/dir1', true, function (err){
    if(err){
      return console.error(err);
    }
    console.log('del ok');
  });
  
});


ftp.on('error', function (err) {
  console.log(err);
}); 

ftp.connect({
  host: 'mooogame.com',
  // user: 'anonymous',
  // password: 'anonymous@',
  user: 'louis',
  password: '***'
});

