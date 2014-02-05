$.fn.teletype = function(opts){
    var $this = this,
        defaults = {
            animDelay: 50
        },
    settings = $.extend(defaults, opts);

    settings.that.addClass("pause");
    settings.that.attr("src","img/glyphicons/png/glyphicons_174_pause.png");
    settings.that.removeClass("play");
    $.each(settings.text.split(''), function(i, letter){
        setTimeout(function(){
            $this.html($this.html() + letter);
           if (i+1 == settings.text.length) {
               settings.that.addClass("play");
               settings.that.removeClass("pause");
               settings.that.attr("src","img/glyphicons/png/glyphicons_173_play.png");
               $('#doPresentation').css("cursor", "pointer");
           }
        }, settings.animDelay * i);

    });

};