var io;
var util = require('./utils');
var Player = require('./Player');
var players = {};

module.exports = function listen(server){
    io = require('socket.io').listen(server);

    io.on('connection', function(socket) {
        //register new player

        player = new Player({x:util.rand(-400,400),y:util.rand(-400,400)});
        players[socket.id] = player;
        //unregister player
        socket.on('disconnect',function(){
            console.log("disconnect: " + socket.id);
            delete players[socket.id];
            sendPlayerList();
        });
        socket.on('moved',function(data){
           players[socket.id].position = data;
           playerPositionUpdate(socket.id);
        });


        //inform client of their id
        socket.emit('register',socket.id);
        sendPlayerList();
    });

    setInterval(loop, 1000/30);
};

function loop(){
    for(p in players){
        players[p].update();
    }
    sendPlayerList();
}

function sendPlayerList(){
    io.sockets.emit('players',players);
}
function playerPositionUpdate(id){
    io.sockets.emit('playermoved',{id:id,position:players[id].position})
}
