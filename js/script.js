var id = null;
var canvas, ctx;
var socket;
var mapPosition;
var WIDTH, HEIGHT;
var players = {};
var objectives = {};
var buffs = {};
var traps = {};
var scoreboard = [];
var mousedown = false;
var moveto = null;
var mapsize = 400;
var stopwatch = new Image();
stopwatch.src = 'res/stopwatch.png';
var flashbang = new Image();
flashbang.src= 'res/flashbang.png';

$(function(){
    canvas = $("#canvas")[0];
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    mapPosition = {x:0,y:0};

    socket = io();

    //server sends required data to start drawing
    socket.on('register',function(data){
        id = data.id;
        mapSize = data.mapsize;
        players = data.players;
        buffs = data.buffs;
        traps = data.traps;
        objectives = data.objectives;
        scoreboard = data.scoreboard;
        draw();
        setInterval(loop, 1000/60);

        //try setting name
        var name = location.search.split('name=')[1];
        if(name){
            socket.emit('setname',name);
        }else{
            //try get name from local storage
            var localName = localStorage.getItem('name');
            if (localName != null){
                console.log(localName);
                socket.emit('setname',localName);
            }
        }

    });

    //new player has joined the game
    socket.on('newplayer',function(data){
        //new player has joined
        players[data.id] = data.player;
        draw();
    });

    //player changed name
    socket.on('namechange',function(data){
        players[data.id].name = data.name;
        if(data.id == id){
            //my name was approved, save in local
            localStorage.setItem('name',data.name);
        }
    });

    //player left
    socket.on('playerleft',function(data){
        delete players[data.id];
        scoreboard = data.scoreboard;
        // draw();
    });

    //updated positions of any players that moved
    socket.on('mapupdate',function(data){
        mapsize = data.mapsize;
        for (var id in data.players){
            players[id].position = data.players[id].position;
            players[id].speed = data.players[id].speed;
        }
    });

    //objective has been completed
    socket.on('objectivecomplete',function(data){
        delete objectives[data.id];
        if(data.hasOwnProperty('scoreboard')){
            scoreboard = data.scoreboard;
        }
    });

    //new objective has been announced
    socket.on('newobjective',function(data){
        objectives[data.id] = data.objective;
        // draw();
    });

    socket.on('speedbuff',function(data){
       if(data.id == id){
           players[id].speed += data.amount;
           var duration = data.durationMod*mapsize;
           setTimeout(function(){
               players[id].speed -= data.amount;
           },duration);
       }
       buffs[data.buffid].up = false;
       setTimeout(function(){
           buffs[data.buffid].up = true;
       },data.cooldown);
    });

    socket.on('stunnedplayers',function(data){
        console.log(data.players);
        if(data.players.includes(id)){
            //stunned
            console.log('im stunned');
            players[id].stunned = true;
            setTimeout(function(){
                players[id].stunned = false;
                console.log('unstunned');
            },data.duration);
        }
        traps[data.trapid].up = false;
        setTimeout(function(){
            traps[data.trapid].up = true;
        },Math.max(2000,data.cooldownMod-mapsize));
    });
    //listeners for movement controls
    $(canvas).on('mousedown touchstart',function(){
        mousedown = true;
        socket.emit('changemousedown',true);
    });
    $(canvas).on('mouseup touchend',function(){
        mousedown = false;
        socket.emit('changemousedown',false);
    });
    $(canvas).on("mousemove touchmove", function(evt){
        moveto = getTouchPos(evt);
        socket.emit('changemoveto',moveto);
    });
});

function loop(){
    //movement updates
    if(moveto != null && mousedown && !players[id].stunned){
        // console.log(moveto);
        norm = normaliseVec(moveto,players[id].speed);
        players[id].position.x += norm.x;
        players[id].position.y += norm.y;
    }
    draw();
}


function draw(){
    mapPosition = {x:-players[id].position.x,y:-players[id].position.y};

    drawMap();


    //draw objectives
    for (var o in objectives){
        if(objectives.hasOwnProperty(o)){
            drawObjective(objectives[o],'blue');
        }
    }

    //draw buffs
    for (var buff in buffs){
        if(buffs.hasOwnProperty(buff)){
            if(buffs[buff].up){
                drawBuff(buffs[buff],'purple');
            }
        }
    }

    //draw traps
    for (var trap in traps){
        if(traps.hasOwnProperty(trap)){
            if(traps[trap].up){
                drawTrap(traps[trap],'red');
            }
        }
    }

    //draw players
    for (var player in players) {
        if( players.hasOwnProperty(player) ) {
            if(player == id){
                drawPlayer(players[player],'green');
            }else{
                drawPlayer(players[player],'red');
            }
        }
    }

    //draw scoreboard
    // ctx.fillStyle = 'white';
    // ctx.fillRect(20,20,170,(scoreboard.length + 2)*20);
    ctx.fillStyle = 'black';
    ctx.textAlign='left';
    ctx.textBaseline = 'top';
    ctx.fillText('Scores:',30,30);
    //draw scores
    for(var i = 0; i < scoreboard.length; i ++){
        if(scoreboard[i][0] == players[id].name){
            ctx.fillStyle='red';
            ctx.fillText(i + ". " + scoreboard[i][0] + ": " + scoreboard[i][1],30,50 + (i*20));
            ctx.fillStyle='black';
        }else{
            ctx.fillText(i + ". " + scoreboard[i][0] + ": " + scoreboard[i][1],30,50 + (i*20));
        }
    }
}

function drawMap(){
    ctx.fillStyle='gray';
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    // draw gridlines

    drawGridlines(16,'#e0e0e0');
    drawGridlines(128,'#cccccc');
    drawGridlines(256,'#aaaaaa');
    drawArclines(mapsize*6,'#e0e0e0',36);
    //draw map circles
    // var playercount = Object.keys(players).length;
    var center = drawPosition({x:0,y:0});

    //bounty area
    ctx.fillStyle = '#ccffcc';
    ctx.beginPath();
    ctx.arc(center.x,center.y,mapsize*7,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();

    //trap area
    ctx.fillStyle = '#ffb3b3';
    ctx.beginPath();
    ctx.arc(center.x,center.y,mapsize*6,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();

    //spawn area
    ctx.fillStyle = '#ccffff';
    ctx.beginPath();
    ctx.arc(center.x,center.y,mapsize*4,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();

    //easy area
    ctx.fillStyle = '#e6ffcc';
    ctx.beginPath();
    ctx.arc(center.x,center.y,mapsize*2,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();

    drawArclines(mapsize*7,'#e0e0e0',12);
    drawArclines(mapsize*7,'#cccccc',4);
}

function drawGridlines(dist, color){
    var min = getMapPosition({x:0,y:0});
    var max = getMapPosition({x:WIDTH,y:HEIGHT});
    var offset = {x:-min.x%dist,y:-min.y%dist};
    var count = {
        x:Math.floor((max.x-min.x)/dist)+1,
        y:Math.floor((max.y-min.y)/dist)+1
    };
    ctx.strokeStyle = color;
    ctx.beginPath();
    for(var x = 0; x < count.x; x ++){
        var xpos = (x*dist)+offset.x;
        ctx.moveTo(xpos+0.5,0.5);
        ctx.lineTo(xpos+0.5,HEIGHT+0.5);
    }

    for(var y = 0; y < count.y; y ++){
        var ypos = (y*dist)+offset.y;
        ctx.moveTo(0.5,ypos+0.5);
        ctx.lineTo(WIDTH+0.5,ypos+0.5);
    }

    ctx.closePath();
    ctx.stroke();
}
function drawArclines(dist,color,qty){
    var center = drawPosition({x:0,y:0});
    ctx.strokeStyle = color;
    ctx.beginPath();
    for(var i = 0; i < 2*Math.PI; i += (2*Math.PI)/qty){
        ctx.moveTo(center.x,center.y);
        var x = Math.cos(i) * dist;
        var y = Math.sin(i) * dist;
        var drawCoords = drawPosition({x:x+0.5,y:y+0.5});
        ctx.lineTo(drawCoords.x,drawCoords.y);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawBuff(buff,color){
    var angpos = anglePos(buff.angle,buff.distanceMod*mapsize);
    pos = drawPosition(angpos);
    // ctx.fillStyle = color;
    // ctx.fillRect(pos.x-(buff.size/2),pos.y-(buff.size/2),buff.size,buff.size);
    ctx.drawImage(stopwatch,pos.x-(buff.size/2),pos.y-(buff.size/2));
}
function drawTrap(trap,color){
    var angpos = anglePos(trap.angle,trap.distanceMod*mapsize);
    pos = drawPosition(angpos);
    // ctx.fillStyle = color;
    // ctx.fillRect(pos.x-(trap.size/2),pos.y-(trap.size/2),trap.size,trap.size);
    ctx.drawImage(flashbang,pos.x-(trap.size/2),pos.y-(trap.size/2));
}

function drawObjective(objective,color){
    pos = drawPosition(anglePos(objective.angle,objective.distanceMod * mapsize));
    if(isOnScreen(pos)){
        var currentTime = new Date().getTime();
        if((objective.expiretime - currentTime) > 0){
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pos.x,pos.y,objective.radius*0.9,0,2*Math.PI);
            ctx.closePath();
            ctx.lineWidth = objective.radius*0.4;
            ctx.strokeStyle=color;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(pos.x,pos.y,objective.radius*0.9,Math.PI / 2,(Math.PI/2) + (Math.PI * 2) * ((objective.expiretime - currentTime) / objective.duration));
            ctx.lineTo(pos.x,pos.y);
            ctx.closePath();

            ctx.fill();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(objective.points,pos.x,pos.y - objective.radius)
        }
    }else{
        //player outside, draw dot on border
        offscreen = getOffscreenPosition(pos);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(offscreen.x,offscreen.y,objective.radius * 0.75,0,2*Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.font = '15pt Calibri';
        ctx.textAlign = offscreen.textAlign;
        ctx.textBaseline = offscreen.textBaseline;
        // ctx.fillText(objective.points + "pts",offscreen.text_x,offscreen.text_y);
        ctx.fillText(offscreen.distance + "m",offscreen.text_x,offscreen.text_y);
    }
}

// function strokeStar(x, y, r, n, inset) {
//     ctx.save();
//     ctx.beginPath();
//     ctx.translate(x, y);
//     ctx.moveTo(0,0-r);
//     for (var i = 0; i < n; i++) {
//         ctx.rotate(Math.PI / n);
//         ctx.lineTo(0, 0 - (r*inset));
//         ctx.rotate(Math.PI / n);
//         ctx.lineTo(0, 0 - r);
//     }
//     ctx.closePath();
//     ctx.fill();
//     ctx.restore();
// }

function drawPlayer(player,color){
    pos = drawPosition(player.position);
    if(isOnScreen(pos)){
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x,pos.y,player.radius,0,2*Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.font = '15pt Calibri';
        ctx.textAlign = 'center';
        ctx.textBaseline='bottom';
        ctx.fillText(player.name,pos.x,pos.y-10);
    }else{
        //player outside, draw dot on border
        offscreen = getOffscreenPosition(pos);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(offscreen.x,offscreen.y,player.radius*0.7,0,2*Math.PI);
        ctx.closePath();
        ctx.fill();
        // ctx.font = '15pt Calibri';
        // ctx.textAlign = offscreen.textAlign;
        // ctx.textBaseline = offscreen.textBaseline;
        // ctx.fillText(offscreen.distance + "m",offscreen.text_x,offscreen.text_y + 15);
    }
}

function isOnScreen(pos){
    return pos.x >= 0 && pos.x <= WIDTH && pos.y >= 0 && pos.y <= HEIGHT;
}

function getOffscreenPosition(pos){
    var out = {};
    var dx = pos.x - WIDTH/2;
    var dy = pos.y - HEIGHT/2;
    // var dx = WIDTH/2 - pos.x;
    // var dy = HEIGHT/2 - pos.y;
    var m = dy/dx;
    //calc c from center
    var c = pos.y - (m * pos.x);

    var x, y;

    var x1,x2, y1,y2;
    x1 = (-c) / m;
    x2 = (HEIGHT-c)/m;

    y1 = c;
    y2 = (m * WIDTH) + c;

    if(pos.x <= 0){
        //left side use y1
        if (y1 >= 0 && y1 <= HEIGHT){
            x = 0;
            y = y1;
        }else{
            if(y1 < 0){
                x = x1;
                y = 0;
            }else{
                x = x2;
                y = HEIGHT;
            }
        }
    }else if(pos.x >= WIDTH){
        //right side use y2
        if(y2 >= 0 && y2 <= HEIGHT){
            x = WIDTH;
            y = y2;
        }else{
            if(y2 < 0){
                x = x1;
                y = 0;
            }else{
                x = x2;
                y = HEIGHT;
            }
        }
    }else{
        //between
        if(pos.y <= 0){
            x = x1;
            y = 0;
        }else{
            x = x2;
            y = HEIGHT;
        }
    }


    var tx;
    if(x == WIDTH){
        out.textAlign='right';
        tx = WIDTH - 10;
    }else if(x == 0){
        out.textAlign='left';
        tx = 10;
    }else{
        out.textAlign = 'center';
        tx = x;
    }
    var ty;
    if(y <= 20){
        ty = 20;
    }else if(y >= (HEIGHT - 20)){
        ty = HEIGHT - 20;
    }else{
        ty = y;
    }

    out.distance = Math.round((Math.abs(dx) + Math.abs(dy))/10);
    out.x = x;
    out.y = y;
    out.text_x = tx;
    out.text_y = ty;
    out.textBaseline = 'middle';
    return out;
}

function drawPosition(position){
    var newx = (WIDTH/2) + mapPosition.x + position.x;
    var newy = (HEIGHT/2) + mapPosition.y + position.y;
    return {x:newx,y:newy};
}
function getMapPosition(position){
    var newx = position.x - mapPosition.x - (WIDTH/2);
    var newy = position.y - mapPosition.y - (HEIGHT/2);
    return {x:newx,y:newy};
}
function anglePos(angle,distance){
    return {
        x:Math.cos(angle) * distance,
        y:Math.sin(angle) * distance
    }
}

function getTouchPos(evt) {
    var rect = canvas.getBoundingClientRect();
    if(evt.touches == null){
        return {
            x: evt.clientX - rect.left - (WIDTH/2),
            y: evt.clientY - rect.top - (HEIGHT/2)
        };
    }else{
        var touch = evt.touches[0];
        return {
            x: touch.clientX - rect.left - (WIDTH/2),
            y: touch.clientY - rect.top - (HEIGHT/2)
        };
    }
}
function normaliseVec(vec,speed){
    var len = Math.sqrt((vec.x*vec.x)+(vec.y*vec.y));
    var multi = len / speed;
    return {x:vec.x/multi,y:vec.y/multi};
}
