module.exports = function(angle, distanceMod, cooldown){
    this.angle = angle;
    this.distanceMod = distanceMod;
    this.up = true;
    this.size = 30;
    this.cooldown = cooldown;
    this.duration = 1000;
    this.goDown = function(){
        this.up = false;
        var self = this;
        setTimeout(function(){
            self.up = true;
        },this.cooldown);
    }
};