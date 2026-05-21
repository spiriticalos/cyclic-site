(function () {
  'use strict';

  var ARTISTS = [
    { name: 'Optick',         genre: 'Techno',              img: 'images/artists/optick.webp' },
    { name: 'Rhem',           genre: 'Techno',              img: 'images/artists/rhem.webp' },
    { name: 'Dobrikan',       genre: 'Melodic Techno',      img: 'images/artists/dobrikan.webp' },
    { name: 'Adrian Eftimie', genre: 'House',               img: 'images/artists/adrian-eftimie.webp' },
    { name: 'Afgo & Lemon',   genre: 'Progressive / House', img: 'images/artists/afgo-lemon.webp' },
    { name: 'Deny',           genre: 'Techno',              img: 'images/artists/deny.webp' },
    { name: 'Emann',          genre: 'Techno',              img: 'images/artists/emann.webp' },
    { name: 'Efi',            genre: 'House',               img: 'images/artists/efi.webp' },
    { name: 'Eleez',          genre: 'Techno',              img: 'images/artists/eleez.webp' },
    { name: 'Kristopher',     genre: 'House',               img: 'images/artists/kristopher.webp' },
    { name: 'Oscar',          genre: 'Electronic',          img: 'images/artists/oscar.webp' },
    { name: 'Pascal Junior',  genre: 'House',               img: 'images/artists/pascal-junior.webp' },
    { name: 'Sabo',           genre: 'Techno',              img: 'images/artists/sabo.webp' },
    { name: 'Zamfirov',       genre: 'Electronic',          img: 'images/artists/zamfirov.webp' },
    { name: 'Brad Brunner',   genre: 'Techno',              img: 'images/artists/brad-brunner.webp' },
    { name: 'Hraach',         genre: 'Techno',              img: 'images/artists/hraach.webp' },
    { name: 'Sahar Z',        genre: 'Techno',              img: 'images/artists/sahar-z.webp' },
    { name: 'Shai T',         genre: 'Techno',              img: 'images/artists/shai-t.webp' }
  ];

  var grid = document.querySelector('.artists-grid');
  if (!grid) return;

  var cards = Array.from(grid.querySelectorAll('.artist-card'));
  if (cards.length < 2) return;

  var SLOTS = cards.length;
  var offset = 0; // matches static HTML (artists 0-3 already shown)

  function updateCards() {
    cards.forEach(function (card) { card.classList.add('is-fading'); });

    setTimeout(function () {
      cards.forEach(function (card, i) {
        var a = ARTISTS[(offset + i) % ARTISTS.length];
        var img  = card.querySelector('.artist-card__image');
        var name = card.querySelector('.artist-card__name');
        var genre = card.querySelector('.artist-card__genre');
        if (img)   { img.src = a.img; img.alt = a.name + ' at Cyclic event'; }
        if (name)  name.textContent = a.name;
        if (genre) genre.textContent = a.genre;
        card.setAttribute('aria-label', 'Artist: ' + a.name);
      });
      cards.forEach(function (card) { card.classList.remove('is-fading'); });
    }, 450);
  }

  setInterval(function () {
    offset = (offset + SLOTS) % ARTISTS.length;
    updateCards();
  }, 20000);
})();
