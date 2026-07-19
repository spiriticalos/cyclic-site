/* ============================================================
   CYCLIC — sursa unica pentru layout partajat (footer, [nav urmeaza]).
   Folosit de build-footer.js (paginile scrise de mana) si — ulterior —
   de build-artists.js. Injecteaza intre markeri <!-- FOOTER:START/END -->.
   ============================================================ */

// navVariant: 'site' (6 linkuri site) | 'rentals' (4 linkuri inchirieri)
function footer(lang, navVariant, indent) {
  var ro = lang === 'ro';
  var I = indent || '  ';

  var tagline = ro
    ? 'Fiecare moment, construit pentru tine.<br>Evenimente de muzică electronică din 2009.'
    : 'Built On Moments Curated For You.<br>Electronic music events since 2009.';

  var navAria = ro ? 'Navigare footer' : 'Footer navigation';
  var navH4 = navVariant === 'rentals' ? (ro ? 'Închirieri' : 'Rentals') : (ro ? 'Pagini' : 'Pages');

  var siteLinks = ro
    ? [['index.html', 'Acasă'], ['evenimente.html', 'Evenimente'], ['artisti.html', 'Artiști'], ['inchiriere-echipamente.html', 'Închirieri'], ['label-uri.html', 'Label-uri'], ['despre-noi.html', 'Despre noi']]
    : [['index.html', 'Home'], ['events.html', 'Events'], ['artists.html', 'Artists'], ['rentals.html', 'Rentals'], ['labels.html', 'Labels'], ['about.html', 'About Us']];
  var rentalLinks = ro
    ? [['inchiriere-echipamente.html', 'Toate închirierile'], ['inchiriere-sonorizare.html', 'Închiriere sonorizare'], ['inchiriere-dj.html', 'Închiriere pupitre DJ &amp; mixere'], ['inchiriere-lumini.html', 'Închiriere lumini &amp; schelă']]
    : [['rentals.html', 'All rentals'], ['sound-system-rental.html', 'Sound system rental'], ['dj-equipment-rental.html', 'DJ booth &amp; mixer rental'], ['lighting-rental.html', 'Lighting &amp; truss rental']];
  var links = (navVariant === 'rentals' ? rentalLinks : siteLinks)
    .map(function (x) { return '<li><a href="' + x[0] + '">' + x[1] + '</a></li>'; }).join('');

  var roleDir = ro ? 'Director Evenimente' : 'Director of Events';
  var roleCoord = ro ? 'Coordonator Evenimente' : 'Event Coordinator';
  var copyright = ro ? 'Toate drepturile rezervate.' : 'All rights reserved.';
  var seoLine = ro ? 'Evenimente de muzică electronică în România din 2009.' : 'Electronic music events Romania since 2009.';

  var legalLinks = ro
    ? '          <a href="politica-confidentialitate.html">Politică Confidențialitate</a>\n          <a href="politica-cookies.html">Politică Cookies</a>\n          <a href="termeni-si-conditii.html">Termeni &amp; Condiții</a>\n          <a href="#" class="js-cookie-settings">Setări Cookies</a>'
    : '          <a href="privacy-policy.html">Privacy Policy</a>\n          <a href="cookie-policy.html">Cookie Policy</a>\n          <a href="terms.html">Terms &amp; Conditions</a>\n          <a href="#" class="js-cookie-settings">Cookie Settings</a>';

  var lines = [
    I + '<footer class="footer" role="contentinfo">',
    '    <div class="container">',
    '      <div class="footer__grid">',
    '        <div class="footer__brand">',
    '          <p class="footer__logo">cyclic</p>',
    '          <p class="footer__tagline">' + tagline + '</p>',
    '          <nav class="footer__social" aria-label="' + (ro ? 'Linkuri social media' : 'Social media links') + '">',
    '            <a href="https://facebook.com/cyclicagency" class="footer__social-link" target="_blank" rel="noopener noreferrer">Facebook</a>',
    '            <a href="https://instagram.com/cyclic_music" class="footer__social-link" target="_blank" rel="noopener noreferrer">Instagram</a>',
    '            <a href="https://tiktok.com/@cyclic_music" class="footer__social-link" target="_blank" rel="noopener noreferrer">TikTok</a>',
    '            <a href="https://ra.co/promoters/140514" class="footer__social-link" target="_blank" rel="noopener noreferrer">Resident Advisor</a>',
    '          </nav>',
    '        </div>',
    '        <nav class="footer__nav" aria-label="' + navAria + '">',
    '          <h4>' + navH4 + '</h4>',
    '          <ul>' + links + '</ul>',
    '        </nav>',
    '        <address class="footer__contact" style="font-style:normal;">',
    '          <h4>Contact</h4>',
    '          <div class="footer__contact-block">',
    '            <p class="footer__contact-role">' + roleDir + '</p>',
    '            <p class="footer__contact-name">Ionuț Hupcă</p>',
    '            <a href="mailto:ionut@cyclic.ro">ionut@cyclic.ro</a>',
    '            <a href="https://wa.me/40721381922" target="_blank" rel="noopener">+40 721 381 922</a>',
    '          </div>',
    '          <div class="footer__contact-block">',
    '            <p class="footer__contact-role">' + roleCoord + '</p>',
    '            <p class="footer__contact-name">Coman Vlad</p>',
    '            <a href="mailto:vlad.coman@cyclic.ro">vlad.coman@cyclic.ro</a>',
    '            <a href="https://wa.me/40765483450" target="_blank" rel="noopener">+40 765 483 450</a>',
    '          </div>',
    '        </address>',
    '      </div>',
    '      <div class="footer__bottom">',
    '        <p>© <span class="js-year">2026</span> Cyclic Agency. ' + copyright + '</p>',
    '        <p>' + seoLine + '</p>',
    '      </div>',
    '      <div class="footer__legal">',
    '        <div class="footer__legal-links">',
    legalLinks,
    '        </div>',
    '        <div class="footer__legal-info">',
    '          <span><strong>CYCLIC MUSIC S.R.L.</strong></span>',
    '          <span>CUI: 36792785</span>',
    '          <span>Reg. Com.: J40/15762/2016</span>',
    '          <span>Str. Fabrica de Chibrituri 24-26, Sector 5, București, 050183</span>',
    '        </div>',
    '      </div>',
    '    </div>',
    '  </footer>'
  ];
  return lines.join('\n');
}

module.exports = { footer: footer };
