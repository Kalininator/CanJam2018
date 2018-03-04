var io;
var util = require('./utils');
var Player = require('./Player');
var Objective = require('./Objective');
var players = {};
var objectives = {};
var objectiveCount = 0;

module.exports = function listen(server){
    io = require('socket.io').listen(server);

    io.on('connection', connection);

    setInterval(loop, 1000/60);
    setInterval(sendLoop,1000/30);
    spawnLoop();
};

function connection(socket){
    //register new player

    player = new Player({x:util.rand(-400,400),y:util.rand(-400,400)});
    players[socket.id] = player;


    //give client initial info
    var plist = {};
    for (var p in players){
        plist[p] = {
            position:players[p].position,
            name: players[p].name
        };
    }
    socket.emit('register',{
        id:socket.id,
        players: plist,
        objectives: objectives,
        scoreboard: getScoreboard()
    });

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


}

function loop(){
    //do movement updates
    for(var p in players){
        //update position
        players[p].update();


    }

    for (var p in players){
        //check if got any objectves
        for(var o in objectives){
            var dist = util.distance(objectives[o].position,players[p].position);
            if(dist < 20 + 10){
                //chnage to player size + objective size
                //got objective :)
                players[p].points += objectives[o].points;
                // io.emit('removeObjective',o);
                delete objectives[o];
                sendObjectiveList();
                objectiveCount --;
                sendScoreboard();
            }
        }
    }
}
function sendLoop(){
    //send update to clients
    sendPlayerUpdate();
}
function spawnLoop(){
    var playercount = Object.keys(players).length;
    if(objectiveCount < Math.max(playercount - 1,2)){
        addObjective({x:util.rand(-500,500),y:util.rand(-500,500)},600);
    }
    setTimeout(spawnLoop,1000/(playercount/2))
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
            players[id].positionChanged = false;
        }
    }
    io.sockets.emit('playerUpdates',out);
}

function getScoreboard(){
    var sortable = [];
    for (var p in players){
        sortable.push([players[p].name,players[p].points])
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    return sortable;
}
function sendScoreboard(){
    io.sockets.emit('scoreboard',getScoreboard());
}
