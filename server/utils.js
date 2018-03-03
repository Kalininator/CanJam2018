module.exports = {
    rand: function(min,max){
        return Math.floor(Math.random() * (max-min)) + min
    }
};