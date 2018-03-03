var utils = require('./utils');
module.exports = function(position){
    this.position = position;
    this.mousedown = false;
    this.moveto = null;
    this.positionChanged = false;
    this.update = function(){
        //movement
        if (this.moveto != null && this.mousedown){
            norm = utils.normaliseVec(this.moveto,10);
            this.position.x += norm.x;
            this.position.y += norm.y;
            this.positionChanged = true;
        }
    }
};