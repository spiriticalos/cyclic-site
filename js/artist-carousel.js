(function () {
  'use strict';

  var grid = document.querySelector('.artists-grid');
  if (!grid) return;
  var cards = Array.from(grid.querySelectorAll('.artist-card'));
  if (cards.length < 2) return;
  var SLOTS = cards.length;

  // Sursa unica: data/artists.json (toti artistii). Fara lista hardcodata care
  // se desincronizeaza. Cardurile statice din HTML raman ca fallback (SEO / fara-JS).
  var ARTISTS = null;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var showing = []; // numele afisate acum, ca sa evitam repetarea exacta a setului
  function pick() {
    if (ARTISTS.length <= SLOTS) return ARTISTS.slice(0, SLOTS);
    var set, key, guard = 0;
    do {
      set = shuffle(ARTISTS.slice()).slice(0, SLOTS);
      key = set.map(function (a) { return a.name; }).sort().join('|');
      guard++;
    } while (key === showing.join('|') && guard < 8);
    showing = set.map(function (a) { return a.name; }).sort();
    return set;
  }

  function render(sel, animate) {
    function paint() {
      cards.forEach(function (card, i) {
        var a = sel[i % sel.length];
        var img = card.querySelector('.artist-card__image');
        var name = card.querySelector('.artist-card__name');
        var genre = card.querySelector('.artist-card__genre');
        if (img) { img.src = a.img; img.alt = a.name + ' at Cyclic event'; }
        if (name) name.textContent = a.name;
        if (genre) genre.textContent = a.genre;
        card.setAttribute('aria-label', 'Artist: ' + a.name);
      });
      cards.forEach(function (card) { card.classList.remove('is-fading'); });
    }
    if (animate) {
      cards.forEach(function (card) { card.classList.add('is-fading'); });
      setTimeout(paint, 450);
    } else {
      paint();
    }
  }

  fetch('data/artists.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      ARTISTS = data.map(function (a) {
        return { name: a.name, genre: a.genre, img: 'images/artists/' + a.slug + '.webp' };
      });
      if (!ARTISTS.length) return;
      render(pick(), false);              // set random de la prima incarcare
      setInterval(function () {
        render(pick(), true);             // alt set random la fiecare 20s
      }, 20000);
    })
    .catch(function () { /* fetch esuat: raman cardurile statice din HTML */ });
})();
