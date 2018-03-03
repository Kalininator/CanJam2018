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
    socket.on('playermoved',function(data){
        players[data.id].position = data.position;
        drawPlayers();
    });

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
    }
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
