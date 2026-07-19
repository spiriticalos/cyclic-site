/* Injecteaza nav-ul centralizat (scripts/layout.js) in paginile scrise de mana,
   intre markeri <!-- NAV:START/END -->. Parametrii per pagina (activ, toggle, CTA)
   sunt EXTRASI din nav-ul existent, deci semantica fiecarei pagini se pastreaza.
   SIGURANTA: (1) remainder byte-identic; (2) activ/toggle/CTA/linkuri identice
   inainte si dupa. Dry-run implicit; scrie doar cu --write. */
const fs = require('fs');
const path = require('path');
const { nav } = require('./layout');

const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');

const NAV_RE = /  <nav class="nav"[\s\S]*?<\/nav>\s*(?:<!--[^>]*-->\s*)?<div class="nav__mobile"[\s\S]*?<\/div>/;
const MARKER_RE = /<!-- NAV:START \(scripts\/layout\.js\) -->[\s\S]*?<!-- NAV:END -->/;

function params(block) {
  return {
    active: (block.match(/href="([^"]+)"\s+class="nav__link active"/) || [])[1] || null,
    ctaHref: (block.match(/<a href="([^"]+)" class="btn btn--accent nav__cta/) || [])[1],
    ctaLabel: ((block.match(/nav__cta[^>]*>([^<]*)/) || [])[1] || '').trim(),
    toggleHref: (block.match(/<a href="([^"]+)" class="lang-toggle"/) || [])[1] || null,
    links: [...block.matchAll(/<li><a href="([^"]+)"/g)].map((m) => m[1]).join(','),
  };
}

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !/^artist-/.test(f));
let ok = 0, fail = 0;
const toWrite = [];

for (const f of pages) {
  const p = path.join(ROOT, f);
  const src = fs.readFileSync(p, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const hasMarkers = MARKER_RE.test(src);
  const targetRe = hasMarkers ? MARKER_RE : NAV_RE;
  const m = src.match(targetRe);
  if (!m) { console.log(`  SKIP ${f}: nav negasit`); continue; }

  const lang = (src.match(/<html lang="([a-z]+)"/) || [])[1] || 'ro';
  const P = params(m[0]);
  if (!P.ctaHref || !P.toggleHref) { console.log(`  FAIL ${f}: parametri incompleti (cta=${P.ctaHref}, toggle=${P.toggleHref})`); fail++; continue; }

  const newNav = nav(lang, P);
  const injected = '<!-- NAV:START (scripts/layout.js) -->' + eol +
    newNav.replace(/\n/g, eol) + eol +
    '  <!-- NAV:END -->';
  const out = src.replace(targetRe, injected);

  // guard 1: restul paginii byte-identic
  const remOld = src.replace(targetRe, '§NAV§');
  const remNew = out.replace(MARKER_RE, '§NAV§');
  if (remOld !== remNew) { console.log(`  FAIL ${f}: remainder DIFERIT`); fail++; continue; }

  // guard 2: semantica pastrata (extrag din nav-ul generat si compar)
  const P2 = params(newNav);
  const diffs = [];
  for (const k of ['active', 'ctaHref', 'ctaLabel', 'toggleHref', 'links']) {
    if (String(P[k]) !== String(P2[k])) diffs.push(`${k}: "${P[k]}" -> "${P2[k]}"`);
  }
  if (diffs.length) { console.log(`  FAIL ${f}: semantica schimbata — ${diffs.join('; ')}`); fail++; continue; }

  ok++;
  toWrite.push([p, out]);
}

console.log(`\n${ok}/${pages.length} OK, ${fail} FAIL`);
if (WRITE && fail === 0) {
  for (const [p, out] of toWrite) fs.writeFileSync(p, out, 'utf8');
  console.log(`SCRIS ${toWrite.length} pagini.`);
} else if (!WRITE) {
  console.log('(dry-run — ruleaza cu --write)');
} else {
  console.log('NU s-a scris nimic — exista FAIL-uri.');
}
