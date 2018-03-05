module.exports = function(playercount){
    this.size = Math.max(Math.round(Math.sqrt(playercount) * 70),70);
    this.update = function(playercount){
        var preferredSize = Math.max(Math.round(Math.sqrt(playercount) * 70),70);
        if(this.size < preferredSize - 1){
            this.size += 0.05;
        }else if(this.size > preferredSize + 1){
            this.size -= 0.05;
        }
    };
};