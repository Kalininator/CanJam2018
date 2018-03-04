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
            name: players[p].name,
            speed: players[p].speed,
            radius: players[p].radius
        };
    }
    socket.emit('register',{
        id:socket.id,
        players: plist,
        objectives: objectives,
        scoreboard: getScoreboard()
    });

    //tell other clients new player has joined

    io.sockets.emit('newplayer',{
        id:socket.id,
        player:plist[socket.id]
    });

    //unregister player
    socket.on('disconnect',function(){
        console.log("disconnect: " + socket.id);
        delete players[socket.id];
        //tell other clients you left
        io.sockets.emit('playerleft',{
            id:socket.id,
            scoreboard:getScoreboard()
        });
        // sendPlayerList();
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
            if(dist < players[p].radius + objectives[o].radius){
                completeObjective(p,o);
            }
        }
    }
}
function completeObjective(p_id,o_id){
    players[p_id].points += objectives[o_id].points;
    delete objectives[o_id];
    //tell clients this objective is complete, and new scoreboard
    io.sockets.emit('objectivecomplete',{
        id:o_id,
        scoreboard:getScoreboard()
    });
    objectiveCount --;
}


function sendLoop(){
    //send update to clients
    sendPlayerUpdate();
}
function spawnLoop(){
    var playercount = Object.keys(players).length;
    if(objectiveCount < Math.max(playercount - 1,2)){
        addObjective({x:util.rand(-500,500),y:util.rand(-500,500)},util.rand(100,1000));
    }
    setTimeout(spawnLoop,1000/(playercount/2))
}

function addObjective(position,points){
    var o = new Objective(position,points);
    var guid = util.guid();
    objectives[guid] = o;
    io.sockets.emit('newobjective',{id:guid,objective:o});
    objectiveCount ++;
}

function sendPlayerUpdate(){
    var out = {};
    for (var id in players){
        if (players[id].positionChanged){
            out[id] = {position:players[id].position};
            players[id].positionChanged = false;
        }
    }
    io.sockets.emit('playerpositions',out);
}

function getScoreboard(){
    var sortable = [];
    for (var p in players){
        if(players[p].points > 0){
            sortable.push([players[p].name,players[p].points])
        }
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    return sortable;
}
