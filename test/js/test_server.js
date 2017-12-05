

include('tesla/web/Server.js');


var server = tesla.web.Server.get();

server.root = te.format('../');

server.start();

