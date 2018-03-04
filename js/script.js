var id = null;
var canvas, ctx;
var socket;
var mapPosition;
var WIDTH, HEIGHT;
var players = {};
var objectives = {};
var scoreboard = [];
var mousedown = false;
var moveto = null;

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
        players = data.players;
        objectives = data.objectives;
        scoreboard = data.scoreboard;
        draw();
        setInterval(loop, 1000/60);
    });

    //new player has joined the game
    socket.on('newplayer',function(data){
        //new player has joined
        players[data.id] = data.player;
        draw();
    });

    //player left
    socket.on('playerleft',function(data){
        delete players[data.id];
        scoreboard = data.scoreboard;
        // draw();
    });

    //updated positions of any players that moved
    socket.on('playerpositions',function(data){
        for (var id in data){
            players[id].position = data[id].position;
        }
        // draw();
    });

    //objective has been completed
    socket.on('objectivecomplete',function(data){
        delete objectives[data.id];
        scoreboard = data.scoreboard;
        // draw();
    });

    //new objective has been announced
    socket.on('newobjective',function(data){
        objectives[data.id] = data.objective;
        // draw();
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
    if(moveto != null && mousedown){
        // console.log(moveto);
        norm = normaliseVec(moveto,4);
        players[id].position.x += norm.x;
        players[id].position.y += norm.y;
    }
    draw();
}


function draw(){
    mapPosition = {x:-players[id].position.x,y:-players[id].position.y};
    ctx.fillStyle='gray';
    ctx.clearRect(0,0,WIDTH,HEIGHT);

    //draw gridlines

    drawGridlines(16,'#e0e0e0');
    drawGridlines(128,'#cccccc');
    drawGridlines(256,'#aaaaaa');



    //draw objectives
    for (var o in objectives){
        if(objectives.hasOwnProperty(o)){
            drawObjective(objectives[o],'blue');
        }
    }

    //draw players
    for (var player in players) {
        if( players.hasOwnProperty(player) ) {
            if(player == id){
                drawPlayer(players[player],'red');
            }else{
                drawPlayer(players[player],'green');
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
            ctx.fillText(scoreboard[i][0] + ": " + scoreboard[i][1],30,50 + (i*20));
            ctx.fillStyle='black';
        }else{
            ctx.fillText(scoreboard[i][0] + ": " + scoreboard[i][1],30,50 + (i*20));
        }
    }
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

function drawObjective(objective,color){
    pos = drawPosition(objective.position);
    if(isOnScreen(pos)){
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x,pos.y,20,0,2*Math.PI);
        ctx.closePath();
        ctx.fill();
    }else{
        //player outside, draw dot on border
        offscreen = getOffscreenPosition(pos);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(offscreen.x,offscreen.y,15,0,2*Math.PI);
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
        ctx.arc(pos.x,pos.y,10,0,2*Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.font = '15pt Calibri';
        ctx.textAlign = 'center';
        ctx.fillText(player.name,pos.x,pos.y-20);
    }else{
        //player outside, draw dot on border
        offscreen = getOffscreenPosition(pos);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(offscreen.x,offscreen.y,10,0,2*Math.PI);
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
