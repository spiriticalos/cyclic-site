(function () {
  var hub = document.querySelector('.prd-hub');
  if (!hub) return;
  new IntersectionObserver(function (entries, obs) {
    if (entries[0].isIntersecting) {
      hub.classList.add('is-active');
      obs.disconnect();
    }
  }, { threshold: 0.12 }).observe(hub);
  hub.querySelectorAll('.prd-tag').forEach(function (tag) {
    tag.addEventListener('click', function () {
      var href = tag.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var card = document.querySelector(href);
      if (!card) return;
      card.classList.remove('pulse');
      void card.offsetWidth;
      card.classList.add('pulse');
    });
  });
})();
