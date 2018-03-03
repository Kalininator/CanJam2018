var io;
var utils = require('./utils');
var players = {};


module.exports = function listen(server){
    io = require('socket.io').listen(server);

    io.on('connection', function(socket) {
        //register new player
        players[socket.id] = new Player({x:utils.rand(-400,400),y:utils.rand(-400,400)});
        //unregister player
        socket.on('disconnect',function(){
            console.log("disconnect: " + socket.id);
            delete players[socket.id];
            sendPlayerList();
        });
        socket.on('moved',function(data){
           players[socket.id].position = data;
           playerPositionUpdate(socket.id);
           // sendPlayerList();
        });

        //inform client of their id
        socket.emit('register',socket.id);
        sendPlayerList();
    });
};

function sendPlayerList(){
    io.sockets.emit('players',players);
}
function playerPositionUpdate(id){
    io.sockets.emit('playermoved',{id:id,position:players[id].position})
}

function Player(position){
    this.position = position;
}