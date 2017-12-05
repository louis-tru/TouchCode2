

var NodeVirtualMachine = process.binding('node_virtual_machine').NodeVirtualMachine;

console.log('test node context ok', NodeVirtualMachine);

console.log(process.argv);


var ctx = new NodeVirtualMachine('node', '-e', 'console.log("ABCDEFG")');

ctx.onException = function (err){
   console.error('onException ***************************************', '\n', err);
};

ctx.start();

console.log("eval result", ctx.eval("console.log('Eval')"));
console.log("eval result", ctx.eval("(1 + 1)"));

var i = 0;

var a = setInterval(function (){
  console.log('test setInterval', i++);

  if(i == 10){
    // process.exit();
    ctx.stop();
  }
  if(i == 5){
    process.exit();
    //clearInterval(a);
  }
}, 1000);

