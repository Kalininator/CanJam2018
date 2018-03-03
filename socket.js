

module.exports = function listen(server){
    var io = require('socket.io').listen(server);

    io.on('connection', function(socket) {
        // Use socket to communicate with this particular client only, sending it it's own id
        socket.emit('position', { x:30,y:50 });
    });
};