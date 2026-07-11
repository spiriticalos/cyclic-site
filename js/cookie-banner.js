/* ============================================================
   CYCLIC AGENCY — COOKIE CONSENT (opt-in, categorised)
   Stores: localStorage 'cookie_consent_v2' = JSON
     { necessary: true, analytics: bool, ts: number, v: 2 }
   Public API on window.CyclicConsent
   Events:
     'cyclic-consent-changed' — fired on every save, detail = consent
     'cyclic-consent-analytics' — fired when analytics turns on
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'cookie_consent_v2';
  var CURRENT_VERSION = 2;
  var MAX_AGE_MS = 183 * 24 * 60 * 60 * 1000; // ~6 luni — după atât se cere din nou consimțământul

  var RO = (document.documentElement.lang || '').toLowerCase().indexOf('ro') === 0;
  var T = RO ? {
    aria: 'Consimțământ cookies',
    text: 'Folosim stocare esențială pentru ca site-ul să funcționeze. Cu acordul tău, putem folosi și analytics ca să înțelegem cum e utilizat site-ul și să-l îmbunătățim. ',
    cookiePolicy: 'Politică Cookies', privacyPolicy: 'Politică Confidențialitate',
    reject: 'Refuz tot', customize: 'Personalizează', accept: 'Accept tot',
    necTitle: 'Strict necesare',
    necDesc: 'Necesare pentru funcționarea site-ului — rețin alegerea ta de cookies și preferințele de interfață. Nu pot fi dezactivate.',
    anTitle: 'Analytics',
    anDesc: 'Ne ajută să înțelegem cum e folosit site-ul (pagini vizitate, timp pe pagină, sursa traficului) ca să-l îmbunătățim. Fără reclame sau tracking cross-site.',
    save: 'Salvează preferințele'
  } : {
    aria: 'Cookie consent',
    text: 'We use essential storage to make the site work. With your consent, we may also use analytics to understand how visitors use the site so we can improve it. ',
    cookiePolicy: 'Cookie Policy', privacyPolicy: 'Privacy Policy',
    reject: 'Reject all', customize: 'Customize', accept: 'Accept all',
    necTitle: 'Strictly necessary',
    necDesc: 'Required for the site to function — remembers your cookie choice and UI preferences. Cannot be turned off.',
    anTitle: 'Analytics',
    anDesc: 'Helps us understand how visitors use the site (pages viewed, time on page, traffic source) so we can improve it. No advertising or cross-site tracking.',
    save: 'Save preferences'
  };

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== CURRENT_VERSION) return null;
      // Consimțământul expiră după ~6 luni → tratat ca inexistent (reapare banner-ul)
      if (typeof parsed.ts === 'number' && Date.now() - parsed.ts > MAX_AGE_MS) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function write(state) {
    var prev = read();
    var payload = {
      v: CURRENT_VERSION,
      ts: Date.now(),
      necessary: true,
      analytics: !!state.analytics
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}

    window.dispatchEvent(new CustomEvent('cyclic-consent-changed', { detail: payload }));
    if (payload.analytics && !(prev && prev.analytics)) {
      window.dispatchEvent(new CustomEvent('cyclic-consent-analytics', { detail: payload }));
    }
    return payload;
  }

  // Public API — accessible to analytics scripts and the footer "Cookie Settings" link
  window.CyclicConsent = {
    has: function (cat) {
      if (cat === 'necessary') return true;
      var c = read();
      return !!(c && c[cat]);
    },
    get: function () { return read(); },
    set: function (state) { return write(state || {}); },
    show: function () { renderBanner(read() || { analytics: false }, false); },
    acceptAll: function () { write({ analytics: true }); closeBanner(); },
    rejectAll: function () { write({ analytics: false }); closeBanner(); }
  };

  var bannerEl = null;

  function closeBanner() {
    if (!bannerEl) return;
    bannerEl.classList.remove('visible');
    var el = bannerEl;
    bannerEl = null;
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
  }

  function renderBanner(current, animateIn) {
    if (bannerEl) {
      try { bannerEl.parentNode && bannerEl.parentNode.removeChild(bannerEl); } catch (e) {}
      bannerEl = null;
    }

    var analyticsChecked = current && current.analytics ? 'checked' : '';

    bannerEl = document.createElement('div');
    bannerEl.className = 'cookie-banner';
    bannerEl.setAttribute('role', 'dialog');
    bannerEl.setAttribute('aria-modal', 'false');
    bannerEl.setAttribute('aria-label', T.aria);
    bannerEl.innerHTML =
      '<div class="container cookie-banner__inner">' +
        '<div class="cookie-banner__main">' +
          '<p class="cookie-banner__text">' +
            T.text +
            '<a href="cookie-policy.html">' + T.cookiePolicy + '</a> &middot; <a href="privacy-policy.html">' + T.privacyPolicy + '</a>' +
          '</p>' +
          '<div class="cookie-banner__actions">' +
            '<button type="button" class="cookie-banner__btn cookie-banner__btn--ghost" data-action="reject">' + T.reject + '</button>' +
            '<button type="button" class="cookie-banner__btn cookie-banner__btn--ghost" data-action="customize" aria-expanded="false">' + T.customize + '</button>' +
            '<button type="button" class="cookie-banner__btn cookie-banner__btn--accept" data-action="accept">' + T.accept + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="cookie-banner__details" hidden>' +
          '<label class="cookie-banner__cat">' +
            '<input type="checkbox" checked disabled aria-describedby="cat-nec-desc">' +
            '<span class="cookie-banner__cat-text">' +
              '<strong>' + T.necTitle + '</strong>' +
              '<span id="cat-nec-desc">' + T.necDesc + '</span>' +
            '</span>' +
          '</label>' +
          '<label class="cookie-banner__cat">' +
            '<input type="checkbox" data-cat="analytics" ' + analyticsChecked + ' aria-describedby="cat-an-desc">' +
            '<span class="cookie-banner__cat-text">' +
              '<strong>' + T.anTitle + '</strong>' +
              '<span id="cat-an-desc">' + T.anDesc + '</span>' +
            '</span>' +
          '</label>' +
          '<div class="cookie-banner__details-actions">' +
            '<button type="button" class="cookie-banner__btn cookie-banner__btn--accept" data-action="save">' + T.save + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(bannerEl);

    if (animateIn) {
      setTimeout(function () { bannerEl && bannerEl.classList.add('visible'); }, 200);
    } else {
      bannerEl.classList.add('visible');
    }

    bannerEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'accept') { write({ analytics: true }); closeBanner(); return; }
      if (action === 'reject') { write({ analytics: false }); closeBanner(); return; }
      if (action === 'customize') {
        var details = bannerEl.querySelector('.cookie-banner__details');
        var expanded = !details.hasAttribute('hidden');
        if (expanded) { details.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }
        else { details.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); }
        return;
      }
      if (action === 'save') {
        var input = bannerEl.querySelector('input[data-cat="analytics"]');
        write({ analytics: !!(input && input.checked) });
        closeBanner();
      }
    });
  }

  // Footer "Cookie Settings" trigger (event delegation, no inline handlers => CSP-safe)
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.js-cookie-settings');
    if (!trigger) return;
    e.preventDefault();
    window.CyclicConsent.show();
  });

  // Only show on first visit (no saved consent in current version)
  if (!read()) {
    renderBanner({ analytics: false }, true);
  }
})();
