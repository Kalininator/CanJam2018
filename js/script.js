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
        setInterval(loop, 1000/30);
    });
    socket.on('players',function(data){
        // console.log(data);
        players = data;
        mapPosition = {x:-players[id].position.x,y:-players[id].position.y};
        drawPlayers();
        drawPlayer(players[id],'red');
    });
    socket.on('playermoved',function(data){
        players[data.id].position = data.position;
        mapPosition = {x:-players[id].position.x,y:-players[id].position.y};
        drawPlayers();
    });


    canvas.addEventListener('mousedown',function(evt){
        mousedown = true;
        moveto = getMousePos(canvas,evt);
    },false);
    canvas.addEventListener('mouseup',function(evt){
        mousedown = false;
    },false);
    canvas.addEventListener('mousemove',function(evt){
        moveto = getMousePos(canvas,evt)
    },false);
    
    // canvas.addEventListener('click', function(evt) {
    //     var mousePos = getMousePos(canvas, evt);
    //     mousePos.x -= WIDTH/2;
    //     mousePos.y -= HEIGHT/2;
    //     console.log(mousePos);
    // }, false);
});

function loop(){
    //move player if mouse down
    if(moveto != null && mousedown){
        // console.log(moveto);
        Move(moveto);
    }
}

function Move(vec){
    norm = normaliseVec(vec,5);
    players[id].position.x += norm.x;
    players[id].position.y += norm.y;
    drawPlayers();
    //tell server ya moved
    socket.emit('moved',players[id].position);
}

function drawPlayers(){
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
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x,pos.y,10,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();
}

function drawPosition(position){
    var newx = (WIDTH/2) + mapPosition.x + position.x;
    var newy = (HEIGHT/2) + mapPosition.y + position.y;
    return {x:newx,y:newy};
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left - (WIDTH/2),
        y: evt.clientY - rect.top - (HEIGHT/2)
    };
}
function normaliseVec(vec,speed){
    // multi = (vec.x + vec.y) / len;
    // return {x:vec.x*multi,y:vec.y*multi};
    //get current len
    var len = Math.sqrt((vec.x*vec.x)+(vec.y*vec.y));
    var multi = len / speed;
    return {x:vec.x/multi,y:vec.y/multi};
}
