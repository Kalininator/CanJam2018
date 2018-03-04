$(function(){
    $("#start").click(function(){
        var name = $('#name').val();
        if(name != ""){
            window.open('/game?name='+$('#name').val(),'_self',false)
        }else{
            window.open('/game','_self',false)
        }
    });
});