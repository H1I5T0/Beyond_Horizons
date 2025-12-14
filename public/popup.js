$('.open-popup').click(function(e) {
    e.preventDefault();
    $('.popup-bg').fadeIn(800);
    $('html').addClass('no-scroll');
});

$('.close-popup').click(function() {
    $('.popup-bg').fadeOut(800);
    $('html').removeClass('no-scroll');
});

$('.popup-bg').click(function(e) {
    if ($(e.target).hasClass('popup-bg')) {
        $('.popup-bg').fadeOut(800);
        $('html').removeClass('no-scroll');
    }
});

$('.popup').click(function(e) {
    e.stopPropagation();
});