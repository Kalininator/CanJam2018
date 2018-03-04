var io;
var util = require('./utils');
var Player = require('./Player');
var Objective = require('./Objective');
var players = {};
var objectives = {};
var objectiveCount = 0;

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
        sendObjectiveList();
    });



    setInterval(loop, 1000/60);
    setInterval(sendLoop,1000/30);
    setInterval(spawnLoop,1000);
};

function loop(){
    //do movement updates
    for(var p in players){
        //update position
        players[p].update();

        //check if got any objectves
        for(var o in objectives){
            var dist = util.distance(objectives[o].position,players[p].position);
            if(dist < 20 + 10){
                //chnage to player size + objective size
                //got objective :)
                players[p].points += objectives[o].points;
                // io.emit('removeObjective',o);
                sendObjectiveList();
                delete objectives[o];
                objectiveCount --;
            }
        }
    }

}
function sendLoop(){
    //send update to clients
    sendPlayerUpdate();
}
function spawnLoop(){
    if(objectiveCount < Object.keys(players).length * 2){
        addObjective({x:util.rand(-500,500),y:util.rand(-500,500)},600);
    }
}

function addObjective(position,points){
    var o = new Objective(position,points);
    var guid = util.guid();
    objectives[guid] = o;
    io.sockets.emit('newObjective',{id:objectiveCount,objective:o});
    objectiveCount ++;
}

function sendObjectiveList(){
    io.sockets.emit('objectives',objectives);
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
