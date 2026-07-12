#!/usr/bin/env node
/* ============================================================
   CYCLIC — generator pagini individuale de artist
   Rulare:
     node scripts/build-artists.js optick    -> doar Optick (RO+EN)
     node scripts/build-artists.js            -> toți artiștii
   Sursa datelor: data/artists.json
   Output: artist-<slug>.html (RO) + artist-<slug>-en.html (EN)
   ============================================================ */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CSS_V = 'v=8';

const artists = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'artists.json'), 'utf8'));
const only = process.argv[2];
const list = only ? artists.filter(a => a.slug === only) : artists;
if (!list.length) { console.error('Niciun artist:', only); process.exit(1); }

function esc(s) { return String(s).replace(/&/g, '&amp;'); }
function jesc(s) { return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

function linkLabel(url) {
  if (/soundcloud/.test(url)) return 'SoundCloud';
  if (/instagram/.test(url)) return 'Instagram';
  if (/facebook/.test(url)) return 'Facebook';
  if (/tiktok/.test(url)) return 'TikTok';
  if (/spotify/.test(url)) return 'Spotify';
  if (/youtu/.test(url)) return 'YouTube';
  if (/ra\.co|residentadvisor/.test(url)) return 'Resident Advisor';
  return 'Link';
}

function nav(a, lang) {
  var ro = lang === 'ro';
  var other = ro ? ('artist-' + a.slug + '-en.html') : ('artist-' + a.slug + '.html');
  var toggle = ro
    ? '<a href="' + other + '" class="lang-toggle" hreflang="en" aria-label="Switch to English"><span class="lang-toggle__flag" aria-hidden="true">🇬🇧</span> EN</a>'
    : '<a href="' + other + '" class="lang-toggle" hreflang="ro" aria-label="Schimbă în română"><span class="lang-toggle__flag" aria-hidden="true">🇷🇴</span> RO</a>';
  var L = ro
    ? [['index.html', 'Acasă'], ['evenimente.html', 'Evenimente'], ['artisti.html', 'Artiști'], ['inchiriere-echipamente.html', 'Închirieri'], ['label-uri.html', 'Label-uri'], ['despre-noi.html', 'Despre noi']]
    : [['index.html', 'Home'], ['events.html', 'Events'], ['artists.html', 'Artists'], ['rentals.html', 'Rentals'], ['labels.html', 'Labels'], ['about.html', 'About Us']];
  var active = ro ? 'artisti.html' : 'artists.html';
  var lis = L.map(function (x) { return '        <li><a href="' + x[0] + '" class="nav__link' + (x[0] === active ? ' active' : '') + '">' + x[1] + '</a></li>'; }).join('\n');
  var mob = L.map(function (x) { return '    <a href="' + x[0] + '" class="nav__link">' + x[1] + '</a>'; }).join('\n');
  var cta = ro ? ['evenimente.html', 'Bilete'] : ['events.html', 'Get Tickets'];
  return '  <nav class="nav" id="nav" role="navigation" aria-label="' + (ro ? 'Navigare principală' : 'Main navigation') + '">\n' +
    '    <div class="nav__inner container">\n' +
    '      <a href="index.html" class="nav__logo"><img src="images/cyclic-logo-white.png" alt="Cyclic Agency" class="nav__logo-img" width="80" height="24"></a>\n' +
    '      <ul class="nav__links" role="list">\n' + lis + '\n      </ul>\n' +
    '      <a href="' + cta[0] + '" class="btn btn--accent nav__cta magnetic">' + cta[1] + ' <span class="arrow">→</span></a>\n' +
    '      ' + toggle + '\n' +
    '      <button class="nav__burger" aria-label="' + (ro ? 'Deschide meniu' : 'Toggle navigation') + '" aria-expanded="false"><span></span><span></span><span></span></button>\n' +
    '    </div>\n  </nav>\n\n' +
    '  <div class="nav__mobile" role="dialog" aria-label="' + (ro ? 'Navigare mobilă' : 'Mobile navigation') + '" aria-modal="true">\n' +
    mob + '\n    <a href="' + cta[0] + '" class="btn btn--accent magnetic">' + cta[1] + ' →</a>\n    ' + toggle + '\n  </div>';
}

function footer(lang) {
  var ro = lang === 'ro';
  var pages = ro
    ? '<li><a href="index.html">Acasă</a></li><li><a href="evenimente.html">Evenimente</a></li><li><a href="artisti.html">Artiști</a></li><li><a href="inchiriere-echipamente.html">Închirieri</a></li><li><a href="label-uri.html">Label-uri</a></li><li><a href="despre-noi.html">Despre noi</a></li>'
    : '<li><a href="index.html">Home</a></li><li><a href="events.html">Events</a></li><li><a href="artists.html">Artists</a></li><li><a href="rentals.html">Rentals</a></li><li><a href="labels.html">Labels</a></li><li><a href="about.html">About Us</a></li>';
  return '  <footer class="footer" role="contentinfo">\n    <div class="container">\n      <div class="footer__grid">\n' +
    '        <div class="footer__brand">\n          <p class="footer__logo">cyclic</p>\n' +
    '          <p class="footer__tagline">' + (ro ? 'Underground-ul României. Ridicat.<br>Evenimente de muzică electronică din 2009.' : 'Romania\'s Underground. Elevated.<br>Electronic music events since 2009.') + '</p>\n' +
    '          <nav class="footer__social" aria-label="' + (ro ? 'Linkuri social media' : 'Social media links') + '">\n' +
    '            <a href="https://facebook.com/cyclicagency" class="footer__social-link" target="_blank" rel="noopener noreferrer">Facebook</a>\n' +
    '            <a href="https://instagram.com/cyclic_music" class="footer__social-link" target="_blank" rel="noopener noreferrer">Instagram</a>\n' +
    '            <a href="https://tiktok.com/@cyclic_music" class="footer__social-link" target="_blank" rel="noopener noreferrer">TikTok</a>\n' +
    '          </nav>\n        </div>\n' +
    '        <nav class="footer__nav" aria-label="' + (ro ? 'Navigare footer' : 'Footer navigation') + '">\n          <h4>' + (ro ? 'Pagini' : 'Pages') + '</h4>\n          <ul>' + pages + '</ul>\n        </nav>\n' +
    '        <address class="footer__contact" style="font-style:normal;">\n          <h4>Contact</h4>\n' +
    '          <div class="footer__contact-block">\n            <p class="footer__contact-role">' + (ro ? 'Director Evenimente' : 'Director of Events') + '</p>\n            <p class="footer__contact-name">Ionuț Hupcă</p>\n            <a href="mailto:ionut@cyclic.ro">ionut@cyclic.ro</a>\n            <a href="https://wa.me/40721381922" target="_blank" rel="noopener">+40 721 381 922</a>\n          </div>\n        </address>\n' +
    '      </div>\n      <div class="footer__bottom">\n        <p>© <span class="js-year">2026</span> Cyclic Agency. ' + (ro ? 'Toate drepturile rezervate.' : 'All rights reserved.') + '</p>\n      </div>\n' +
    '      <div class="footer__legal">\n        <div class="footer__legal-links">\n          <a href="privacy-policy.html">' + (ro ? 'Politică Confidențialitate' : 'Privacy Policy') + '</a>\n          <a href="cookie-policy.html">' + (ro ? 'Politică Cookies' : 'Cookie Policy') + '</a>\n          <a href="terms.html">' + (ro ? 'Termeni &amp; Condiții' : 'Terms &amp; Conditions') + '</a>\n          <a href="#" class="js-cookie-settings">' + (ro ? 'Setări Cookies' : 'Cookie Settings') + '</a>\n        </div>\n        <div class="footer__legal-info">\n          <span><strong>CYCLIC MUSIC S.R.L.</strong></span>\n          <span>CUI: 36792785</span>\n          <span>Reg. Com.: J40/15762/2016</span>\n        </div>\n      </div>\n    </div>\n  </footer>';
}

function page(a, lang) {
  var ro = lang === 'ro';
  var url = 'https://cyclic.ro/artist-' + a.slug + (ro ? '' : '-en') + '.html';
  var urlRo = 'https://cyclic.ro/artist-' + a.slug + '.html';
  var urlEn = 'https://cyclic.ro/artist-' + a.slug + '-en.html';
  var img = 'https://cyclic.ro/images/artists/' + a.slug + '.webp';
  var typeLabel = ro ? (a.type === 'local' ? 'Artist local' : 'Internațional') : (a.type === 'local' ? 'Local Artist' : 'International');
  var bio = ro ? a.bio_ro : a.bio_en;
  var title = a.name + ' — ' + a.genre + (ro ? ' | Cyclic Agency' : ' | Cyclic Agency');
  var desc = ro
    ? (a.name + ', ' + a.genre.toLowerCase() + '. ' + bio)
    : (a.name + ', ' + a.genre.toLowerCase() + '. ' + bio);
  desc = esc(desc.replace(/\s+/g, ' ').slice(0, 300));

  var links = a.links.map(function (u) {
    return '            <a href="' + esc(u) + '" class="btn btn--outline btn--sm" target="_blank" rel="noopener noreferrer">' + linkLabel(u) + '</a>';
  }).join('\n');

  var sameAs = a.links.length ? ('\n    "sameAs": [' + a.links.map(function (u) { return '"' + jesc(u) + '"'; }).join(', ') + '],') : '';

  var ld = '{\n' +
    '    "@context": "https://schema.org",\n    "@type": "MusicGroup",\n' +
    '    "name": "' + jesc(a.name) + '",\n    "genre": "' + jesc(a.genre) + '",\n' +
    '    "image": "' + img + '",\n    "url": "' + url + '",' + sameAs + '\n' +
    '    "memberOf": { "@type": "Organization", "name": "Cyclic Agency", "url": "https://cyclic.ro" }\n  }';

  var crumb = '{\n    "@context": "https://schema.org",\n    "@type": "BreadcrumbList",\n    "itemListElement": [\n' +
    '      {"@type": "ListItem", "position": 1, "name": "' + (ro ? 'Acasă' : 'Home') + '", "item": "https://cyclic.ro/"},\n' +
    '      {"@type": "ListItem", "position": 2, "name": "' + (ro ? 'Artiști' : 'Artists') + '", "item": "https://cyclic.ro/' + (ro ? 'artisti' : 'artists') + '.html"},\n' +
    '      {"@type": "ListItem", "position": 3, "name": "' + jesc(a.name) + '", "item": "' + url + '"}\n    ]\n  }';

  var back = ro ? '← Toți artiștii' : '← All artists';
  var bookingLabel = ro ? 'Contact pentru booking' : 'Contact for booking';
  var followLabel = ro ? 'Ascultă &amp; urmărește' : 'Listen &amp; follow';

  return '<!DOCTYPE html>\n<html lang="' + (ro ? 'ro' : 'en') + '">\n<head>\n' +
    '  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + esc(title) + '</title>\n' +
    '  <meta name="description" content="' + desc + '">\n' +
    '  <meta name="robots" content="index, follow">\n' +
    '  <link rel="canonical" href="' + url + '">\n' +
    '  <meta property="og:type" content="profile">\n' +
    '  <meta property="og:title" content="' + esc(title) + '">\n' +
    '  <meta property="og:description" content="' + desc + '">\n' +
    '  <meta property="og:image" content="' + img + '">\n' +
    '  <meta property="og:url" content="' + url + '">\n' +
    '  <meta property="og:site_name" content="Cyclic Agency">\n' +
    '  <meta property="og:locale" content="' + (ro ? 'ro_RO' : 'en_US') + '">\n' +
    '  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:site" content="@cyclic_music">\n' +
    '  <link rel="icon" type="image/svg+xml" href="/favicon.svg">\n  <meta name="theme-color" content="#0a0a0a">\n' +
    '  <link rel="alternate" hreflang="ro" href="' + urlRo + '">\n' +
    '  <link rel="alternate" hreflang="en" href="' + urlEn + '">\n' +
    '  <link rel="alternate" hreflang="x-default" href="' + urlEn + '">\n\n' +
    '  <style>\n    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\n    body{font-family:\'Eurostile\',sans-serif;background:#0a0a0a;color:#fff;overflow-x:hidden}\n    .nav{position:fixed;top:0;left:0;right:0;z-index:1000;height:72px}\n  </style>\n\n' +
    '  <link rel="stylesheet" href="css/fonts.css?v=2">\n  <link rel="stylesheet" href="css/main.css?' + CSS_V + '">\n\n' +
    '  <script type="application/ld+json">\n  ' + ld + '\n  </script>\n' +
    '  <script type="application/ld+json">\n  ' + crumb + '\n  </script>\n' +
    '</head>\n<body>\n  <div class="cursor" aria-hidden="true"></div>\n  <div class="cursor-dot" aria-hidden="true"></div>\n\n' +
    nav(a, lang) + '\n\n' +
    '  <main>\n    <section class="artist-detail">\n      <div class="container artist-detail__grid">\n' +
    '        <div class="artist-detail__media">\n          <img src="images/artists/' + a.slug + '.webp" alt="' + esc(a.name) + ' — ' + esc(a.genre) + ' ' + (ro ? 'Cyclic Agency' : 'Cyclic Agency') + '" width="900" height="1200">\n        </div>\n' +
    '        <div class="artist-detail__info">\n' +
    '          <a href="' + (ro ? 'artisti.html' : 'artists.html') + '" class="artist-detail__back">' + back + '</a>\n' +
    '          <p class="section-label artist-detail__genre">' + esc(a.genre) + ' · ' + typeLabel + '</p>\n' +
    '          <h1 class="display-lg">' + esc(a.name) + '<span class="text-accent">.</span></h1>\n' +
    '          <p class="artist-detail__bio">' + esc(bio) + '</p>\n' +
    (a.links.length ? ('          <p class="section-label" style="margin-bottom:10px;">' + followLabel + '</p>\n          <div class="artist-detail__links">\n' + links + '\n          </div>\n') : '') +
    '          <a href="mailto:ionut@cyclic.ro?subject=Booking%20' + encodeURIComponent(a.name) + '" class="btn btn--accent magnetic">' + bookingLabel + ' <span class="arrow">→</span></a>\n' +
    '        </div>\n      </div>\n    </section>\n  </main>\n\n' +
    footer(lang) + '\n\n' +
    '  <script src="js/main.js?v=3" defer></script>\n  <script src="js/effects.js?v=2" defer></script>\n  <script src="js/cookie-banner.js?v=3" defer></script>\n  <script src="js/analytics.js?v=2" defer></script>\n</body>\n</html>\n';
}

var n = 0;
for (var i = 0; i < list.length; i++) {
  var a = list[i];
  fs.writeFileSync(path.join(ROOT, 'artist-' + a.slug + '.html'), page(a, 'ro'));
  fs.writeFileSync(path.join(ROOT, 'artist-' + a.slug + '-en.html'), page(a, 'en'));
  n++;
  console.log('  ' + a.name + ' -> artist-' + a.slug + '.html (+ -en), linkuri: ' + a.links.length);
}
console.log(n + ' artisti generati (x2 limbi)');
