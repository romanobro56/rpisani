function positionCards() {
  var cards = document.getElementsByClassName('card');
  var container = document.getElementById('cardContainer');
  var containerWidth = container.offsetWidth;
  var cardWidth = cards[0].offsetWidth;
  var cardHeight = cards[0].offsetHeight;
  var margin = 30;

  for (var i = 0; i < cards.length; i++) {
    var left = (containerWidth - cardWidth) / 2;
    var top = i * (cardHeight + margin);

    if (i % 2 == 0) {
      left -= cardWidth + margin;
    } else {
      left += margin;
    }

    cards[i].style.left = left + 'px';
    cards[i].style.top = top + 'px';
  }
}
