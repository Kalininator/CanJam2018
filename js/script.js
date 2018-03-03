
$(function(){
    var canvas = $("#canvas")[0];
    var ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var socket = io();
    socket.on('position', function(data) {
        console.log(data);
        ctx.fillRect(data.x,data.y,20,20);
    });
});