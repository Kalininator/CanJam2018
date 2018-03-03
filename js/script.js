var id = null;
var canvas, ctx;
var socket;
var mapPosition;
var windowSize;
var players;

$(function(){
    canvas = $("#canvas")[0];
    ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    windowSize = {x:canvas.width,y:canvas.height};

    mapPosition = {x:0,y:0};

    socket = io();
    socket.on('register',function(data){
        id = data;
        console.log("socket id: " + id);
        // setInterval(loop, 1000/60);
    });
    socket.on('players',function(data){
        console.log(data);
        players = data;
        mapPosition = {x:-players[id].position.x,y:-players[id].position.y};
        drawPlayers();
        drawPlayer(players[id],'red');
    });
});

// function loop(){
//
// }

function drawPlayers(){
    ctx.clearRect(0,0,windowSize.x,windowSize.y);
    //draw mid point
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(windowSize.x/2,windowSize.y/2,2,0,2*Math.PI);
    ctx.closePath();
    ctx.fill();
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
    var newx = (windowSize.x/2) + mapPosition.x + position.x;
    var newy = (windowSize.y/2) + mapPosition.y + position.y;
    return {x:newx,y:newy};
}
