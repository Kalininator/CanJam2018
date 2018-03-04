
module.exports = function(angle,distanceMod,points, duration){
    this.angle = angle;
    this.distanceMod = distanceMod;
    this.points = points;
    this.radius = this.points/30;
    var d = new Date().getTime();
    this.duration = duration;
    this.expiretime = d + duration;
};