
module.exports = function(position,points, duration){
    this.position = position;
    this.points = points;
    this.radius = this.points/30;
    var d = new Date().getTime();
    this.expiretime = d + duration*1000;
};