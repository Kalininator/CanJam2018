module.exports = function(angle, distanceMod, durationMulti, cooldown){
    this.angle = angle;
    this.distanceMod = distanceMod;
    this.up = true;
    this.size = 30;
    this.cooldown = cooldown;
    this.durationMod = durationMulti;
    this.goDown = function(){
        this.up = false;
        var self = this;
        setTimeout(function(){
            self.up = true;
        },this.cooldown);
    }
};