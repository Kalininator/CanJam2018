var io;
var util = require('./utils');
var Player = require('./Player');
var Objective = require('./Objective');
var Buff = require('./Buff');
var Map = require('./Map');
var map;
var players = {};
var objectives = {};
var buffs = {};
var objectiveCount = 0;

module.exports = function listen(server){
    map = new Map(2);
    io = require('socket.io').listen(server);

    for(var i = 0; i < 2*Math.PI; i += Math.PI/4){
        // var b = new Buff(i,3,5000);
        buffs[util.guid()] = new Buff(i,3.5,10,4000);
    }


    io.on('connection', connection);



    setInterval(loop, 1000/60);
    setInterval(sendLoop,1000/30);
    spawnLoop();
};

function connection(socket){
    //register new player

    player = new Player(util.randMapPosition(map.size * 2.5,map.size*2.5));
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
    var blist = {};
    for (var b in buffs){
        blist[b] = {
            angle:buffs[b].angle,
            distanceMod:buffs[b].distanceMod,
            size:buffs[b].size,
            up:buffs[b].up
        }
    }
    socket.emit('register',{
        id:socket.id,
        mapsize: map.size,
        players: plist,
        buffs:blist,
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

    //player name set
    socket.on('setname',function(data){
        players[socket.id].name = data;
        //tell everyone this guy changed his name
        io.sockets.emit('namechange',{
            id:socket.id,
            name:players[socket.id].name
        });
    });


}

function loop(){

    map.update(Object.keys(players).length);
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
        //check if hit a buff
        for(var b in buffs){
            if(buffs[b].up){
                var pos = util.anlePos(buffs[b].angle,buffs[b].distanceMod * map.size);
                var buffrect = {
                    x:pos.x-(buffs[b].size/2),
                    y:pos.y-(buffs[b].size/2),
                    w:buffs[b].size,
                    h:buffs[b].size
                };
                if(util.collideRectCircle(buffrect,{
                        x:players[p].position.x,
                        y:players[p].position.y,
                        r:players[p].radius
                    }) && !players[p].buffed){
                    console.log("collide and not buffed");
                    //buff activate
                    players[p].speed += 3;
                    players[p].setBuffed(buffs[b].durationMod * map.size);
                    setTimeout(function(){
                        players[p].speed -= 3;
                    },buffs[b].durationMod * map.size);
                    io.sockets.emit('speedbuff',{
                        id:p,
                        amount:3,
                        durationMod:buffs[b].durationMod,
                        buffid:b,
                        cooldown:buffs[b].cooldown
                    });
                    buffs[b].goDown();
                }
            }
        }
    }
    var d = new Date();
    var currenttime = d.getTime();
    for (var o in objectives){
        if(currenttime > objectives[o].expiretime){
            expireObjective(o);
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
function expireObjective(o_id){
    delete objectives[o_id];
    io.sockets.emit('objectivecomplete',{
        id:o_id
    });
    objectiveCount --;
}

function sendLoop(){
    //send update to clients
    sendMapUpdate();
}
function spawnLoop(){
    var playercount = Object.keys(players).length;
    if(objectiveCount < Math.max(playercount +1,2)){
        if(Math.random() > 0.75){
            //spawn big
            addObjective(util.randMapPosition(map.size*6 + 30,map.size*7 - 30),util.rand(600,1000),map.size*50);
        }else{
            //spawn small objective
            addObjective(util.randMapPosition(0,map.size*2 - 20),util.rand(50,300),3000);
        }

    }
    setTimeout(spawnLoop,1000/(playercount/2))
}

function addObjective(position,points,duration){
    var o = new Objective(position,points,duration);
    var guid = util.guid();
    objectives[guid] = o;
    io.sockets.emit('newobjective',{id:guid,objective:o});
    objectiveCount ++;
}

function sendMapUpdate(){
    var out = {};
    for (var id in players){
        if (players[id].positionChanged){
            out[id] = {position:players[id].position};
            players[id].positionChanged = false;
        }
    }
    io.sockets.emit('mapupdate',{
        mapsize:map.size,
        players:out
    });
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

    // if(sortable.length > 0)
    // {
    //     var top = sortable[0][1];
    //     for(var i = 0; i < sortable.length; i ++){
    //         sortable[i][1] = Math.round((sortable[i][1]/top)*100);
    //     }
    // }
    return sortable;
}
