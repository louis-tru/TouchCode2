
var child_process = te.node.child_process;

var node = te.format('../node');
//var tesla = te.format('../node');

console.log('node path', node);

//var ps = child_process.spawn(node, [ tesla, 'IPhones.js', '--debug' ]);
var ps = child_process.spawn(node, [ '--eval', 'setInterval(function (){ console.log(process.argv) }, 1000)' ]);

ps.stdout.on('data', function (data){
 console.log('child_process', data + '');
});

ps.stderr.on('data', function (data){
 console.error('child_process', data + '');
});

ps.on('exit', function (){
 console.error('child_process exit');
});

ps.on('error', function (evt){
 console.error('child_process error', evt);
});




