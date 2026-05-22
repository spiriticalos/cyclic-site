(function () {
  'use strict';

  if (localStorage.getItem('cookies_acknowledged')) return;

  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie consent notice');
  banner.innerHTML =
    '<div class="container cookie-banner__inner">' +
      '<p class="cookie-banner__text">' +
        'This site uses only essential local storage to remember your preferences (newsletter dismissal, this banner). ' +
        'We do not use analytics, advertising or any third-party trackers. ' +
        '<a href="cookie-policy.html">Cookie Policy</a> &middot; <a href="privacy-policy.html">Privacy Policy</a>' +
      '</p>' +
      '<div class="cookie-banner__actions">' +
        '<button type="button" class="cookie-banner__btn cookie-banner__btn--accept">Got it</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(banner);
  setTimeout(function () { banner.classList.add('visible'); }, 250);

  banner.querySelector('.cookie-banner__btn--accept').addEventListener('click', function () {
    banner.classList.remove('visible');
    try { localStorage.setItem('cookies_acknowledged', '1'); } catch (e) {}
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 400);
    window.dispatchEvent(new CustomEvent('cookies-acknowledged'));
  });
})();
