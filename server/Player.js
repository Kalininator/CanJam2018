var utils = require('./utils');
module.exports = function(position){
    this.position = position;
    this.mousedown = false;
    this.moveto = null;
    this.update = function(){
        //movement
        if (moveto != null && mousedown){
            norm = normaliseVec(this.moveto,5);
            this.position.x += norm.x;
            this.position.y += norm.y;
        }
    }
};