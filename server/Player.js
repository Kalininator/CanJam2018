var utils = require('./utils');
module.exports = function(position){
    this.position = position;
    this.mousedown = false;
    this.moveto = null;
    this.positionChanged = false;
    this.speed = 5;
    this.update = function(){
        //movement
        if (this.moveto != null && this.mousedown){
            norm = utils.normaliseVec(this.moveto,this.speed);
            this.position.x += norm.x;
            this.position.y += norm.y;
            this.positionChanged = true;
        }
    }
};