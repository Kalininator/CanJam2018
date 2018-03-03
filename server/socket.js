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
        socket.on('changemousedown',function(data){
            players[socket.id].mousedown = data;
        });
        socket.on('changemoveto',function(data){
            players[socket.id].moveto = data;
        });

        //inform client of their id
        socket.emit('register',socket.id);
        sendPlayerList();
    });

    setInterval(loop, 1000/60);
    setInterval(sendLoop,1000/30);
};

function loop(){
    //do movement updates
    for(var p in players){
        players[p].update();
    }
}
function sendLoop(){
    //send update to clients
    sendPlayerUpdate();
}

function sendPlayerList(){
    io.sockets.emit('players',players);
}
function sendPlayerUpdate(){
    var out = {};
    for (var id in players){
        if (players[id].positionChanged){
            out[id] = {position:players[id].position};
        }
    }
    io.sockets.emit('playerUpdates',out);
}
