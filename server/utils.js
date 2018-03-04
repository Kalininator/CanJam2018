module.exports = {
    rand: function(min,max){
        return Math.floor(Math.random() * (max-min)) + min
    },
    normaliseVec: function (vec,speed){
        var len = Math.sqrt((vec.x*vec.x)+(vec.y*vec.y));
        var multi = len / speed;
        return {x:vec.x/multi,y:vec.y/multi};
    },
    distance: function(a,b){
        return Math.abs(a.x-b.x) + Math.abs(a.y-b.y);
    },
    guid: function(){
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
};