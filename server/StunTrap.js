module.exports = function(angle, distanceMod, cooldownMod){
    this.angle = angle;
    this.distanceMod = distanceMod;
    this.up = true;
    this.size = 30;
    this.cooldownMod = cooldownMod;
    this.goDown = function(mapsize){
        this.up = false;
        var self = this;
        setTimeout(function(){
            self.up = true;
        },Math.max(2000,this.cooldownMod-mapsize));
    };
};