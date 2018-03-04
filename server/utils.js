module.exports = {
    rand: function(min,max){
        return Math.floor(Math.random() * (max-min)) + min
    },
    randMapPosition: function(min,max){
        var distance = Math.floor(Math.random() * (max-min)) + min;
        var angle = Math.random() * 2 * Math.PI;
        return {
            x:Math.cos(angle) * distance,
            y:Math.sin(angle) * distance
        };
    },
    normaliseVec: function (vec,speed){
        var len = Math.sqrt((vec.x*vec.x)+(vec.y*vec.y));
        var multi = len / speed;
        return {x:vec.x/multi,y:vec.y/multi};
    },
    distance: function(a,b){
        var dx = Math.abs(a.x-b.x);
        var dy = Math.abs(a.y-b.y);
        return Math.sqrt((dx * dx) + (dy * dy));
    },
    guid: function(){
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    playerguid: function(){
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return "anon-" + s4();
    },
    collideRectCircle: function(rect,circle){
        var distX = Math.abs(circle.x - rect.x-rect.w/2);
        var distY = Math.abs(circle.y - rect.y-rect.h/2);

        if (distX > (rect.w/2 + circle.r)) { return false; }
        if (distY > (rect.h/2 + circle.r)) { return false; }

        if (distX <= (rect.w/2)) { return true; }
        if (distY <= (rect.h/2)) { return true; }

        var dx=distX-rect.w/2;
        var dy=distY-rect.h/2;
        return (dx*dx+dy*dy<=(circle.r*circle.r));
    },
    anlePos: function(angle,distance){
        return {
            x:Math.cos(angle) * distance,
            y:Math.sin(angle) * distance
        }
    }
};