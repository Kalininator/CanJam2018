module.exports = function(playercount){
    this.size = Math.round(Math.sqrt(playercount) * 50);
    this.update = function(playercount){
        var preferredSize = Math.round(Math.sqrt(playercount) * 50);
        if(this.size < preferredSize - 1){
            this.size += 0.2;
        }else if(this.size > preferredSize + 1){
            this.size -= 0.2;
        }
    };
};