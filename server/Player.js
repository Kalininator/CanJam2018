var utils = require('./utils');
module.exports = function(position){
    this.position = position;
    this.mousedown = false;
    this.moveto = null;
    this.positionChanged = false;
    this.buffed = false;
    this.stunned = false;
    this.speed = 4;
    this.radius = 10;
    this.points = 0;
    this.name = utils.playerguid();
    this.update = function(){
        //movement
        if (this.moveto != null && this.mousedown && !this.stunned){
            norm = utils.normaliseVec(this.moveto,this.speed);
            this.position.x += norm.x;
            this.position.y += norm.y;
            this.positionChanged = true;
        }
    };
    this.setBuffed = function(duration){
        this.buffed = true;
        var self = this;
        setTimeout(function(){
            self.buffed = false;
        },duration);
    }
};