module.exports = {
    rand: function(min,max){
        return Math.floor(Math.random() * (max-min)) + min
    },
    normaliseVec: function (vec,speed){
        var len = Math.sqrt((vec.x*vec.x)+(vec.y*vec.y));
        var multi = len / speed;
        return {x:vec.x/multi,y:vec.y/multi};
    }
};