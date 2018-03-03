var id = null;
var canvas, ctx;
var socket;
var mapPosition;
var WIDTH, HEIGHT;
var players;
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
    socket.on('register',function(data){
        id = data;
        console.log("socket id: " + id);
        setInterval(loop, 1000/60);
    });
    socket.on('players',function(data){
        players = data;
        drawPlayers();
    });
    socket.on('playerUpdates',function(data){
        for (var id in data){
            players[id].position = data[id].position;
        }
        drawPlayers();
    });
    // socket.on('playermoved',function(data){
    //     players[data.id].position = data.position;
    //     drawPlayers();
    // });

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
        norm = normaliseVec(moveto,5);
        players[id].position.x += norm.x;
        players[id].position.y += norm.y;
        drawPlayers();
    }
}


function drawPlayers(){
    mapPosition = {x:-players[id].position.x,y:-players[id].position.y};
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    for (var player in players) {
        if( players.hasOwnProperty(player) ) {
            if(player == id){
                drawPlayer(players[player],'red');
            }else{
                drawPlayer(players[player],'black');
            }
        }
    }

}

function drawPlayer(player,color){
    pos = drawPosition(player.position);
    if(pos.x >= 0 && pos.x <= WIDTH && pos.y >= 0 && pos.y <= HEIGHT){
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x,pos.y,10,0,2*Math.PI);
        ctx.closePath();
        ctx.fill();
    }else{
        //player outside, draw dot on border
        drawOffscreenIndicator(pos, 5, 'green');
    }
}

function drawOffscreenIndicator(pos, radius, color){
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

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,radius,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();


    ctx.font = '15pt Calibri';
    ctx.textBaseline = 'middle';
    var tx;
    if(x == WIDTH){
        ctx.textAlign='right';
        tx = WIDTH - 10;
    }else if(x == 0){
        ctx.textAlign='left';
        tx = 10;
    }else{
        ctx.textAlign = 'center';
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
    var distance = Math.abs(dx) + Math.abs(dy);
    ctx.fillText(Math.round(distance/10) + "m",tx,ty);

}

function drawPosition(position){
    var newx = (WIDTH/2) + mapPosition.x + position.x;
    var newy = (HEIGHT/2) + mapPosition.y + position.y;
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
