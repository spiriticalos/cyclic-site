/* ============================================================
   CYCLIC AGENCY — GOOGLE ANALYTICS 4 (consent-gated)

   ► HOW TO ENABLE:
     1. Get your GA4 Measurement ID from analytics.google.com
        (looks like  G-XXXXXXXXXX)
     2. Paste it as GA_MEASUREMENT_ID below.
     3. In vercel.json, uncomment the two GA entries in the CSP value
        (script-src + connect-src).
     4. Redeploy.

   ► WHAT HAPPENS:
     - With empty GA_MEASUREMENT_ID, this file does nothing.
     - With a valid ID, GA is loaded ONLY for visitors who explicitly
       accept the "Analytics" category in the cookie banner.
     - We force IP anonymisation, no Google Signals, no ad
       personalisation — the most privacy-respecting GA4 config.
     - If the visitor revokes consent (via Cookie Settings), GA stops
       loading on subsequent page views. Existing _ga cookies can be
       cleared from the browser.
   ============================================================ */

(function () {
  'use strict';

  var GA_MEASUREMENT_ID = ''; // ← put your G-XXXXXXXXXX here to turn analytics on

  if (!GA_MEASUREMENT_ID) return;

  function loadGA() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  // Already consented (returning visitor) — load immediately
  if (window.CyclicConsent && window.CyclicConsent.has('analytics')) {
    loadGA();
    return;
  }

  // First-time opt-in — load as soon as the user accepts Analytics
  window.addEventListener('cyclic-consent-analytics', loadGA);
})();
