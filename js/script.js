
$(function(){
    var canvas = $("#canvas")[0];
    var ctx = canvas.getContext('2d');
    ctx.fillRect(20,20,20,20);

    var socket = io();
    socket.on('welcome', function(data) {
        console.log(data);

        // Respond with a message including this clients' id sent from the server
        // socket.emit('i am client', {data: 'foo!', id: data.id});
    });
});