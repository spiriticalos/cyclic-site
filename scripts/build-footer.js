/* Injecteaza footerul centralizat (scripts/layout.js) in paginile scrise de mana,
   intre markeri <!-- FOOTER:START/END -->. Paginile de artist au footerul lor in
   build-artists.js si NU sunt atinse aici.
   SIGURANTA: dupa injectie, restul paginii (fara footer) trebuie sa fie byte-identic
   cu originalul — asta dovedeste ca s-a atins chirurgical doar footerul.
   Ruleaza cu --write ca sa scrie; fara, e dry-run (raport). */
const fs = require('fs');
const path = require('path');
const { footer } = require('./layout');

const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');

const RENTALS = new Set([
  'inchiriere-echipamente.html', 'inchiriere-sonorizare.html', 'inchiriere-dj.html', 'inchiriere-lumini.html',
  'rentals.html', 'sound-system-rental.html', 'dj-equipment-rental.html', 'lighting-rental.html',
]);

const FOOTER_RE = /  <footer class="footer"[\s\S]*?<\/footer>/;
const MARKER_RE = /<!-- FOOTER:START \(scripts\/layout\.js\) -->[\s\S]*?<!-- FOOTER:END -->/;

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !/^artist-/.test(f));

let okCount = 0, failCount = 0, changedFooters = [];
const toWrite = [];

for (const f of pages) {
  const p = path.join(ROOT, f);
  const src = fs.readFileSync(p, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';

  // idempotent: daca markerii exista deja, inlocuim blocul dintre ei;
  // altfel, inlocuim footerul brut si adaugam markerii.
  const hasMarkers = MARKER_RE.test(src);
  const targetRe = hasMarkers ? MARKER_RE : FOOTER_RE;
  const m = src.match(targetRe);
  if (!m) { console.log(`  SKIP ${f}: fara <footer class="footer">`); continue; }
  const oldFooter = m[0];

  const lang = (src.match(/<html lang="([a-z]+)"/) || [])[1] || 'ro';
  const navVariant = RENTALS.has(f) ? 'rentals' : 'site';
  const newFooter = footer(lang, navVariant, '  ');
  const injected = '<!-- FOOTER:START (scripts/layout.js) -->' + eol +
    newFooter.replace(/\n/g, eol) + eol +
    '  <!-- FOOTER:END -->';

  const out = src.replace(targetRe, injected);

  // --- remainder-diff: mascam footerul din ambele si comparam restul ---
  const remOld = src.replace(targetRe, '§FOOTER§');
  const remNew = out.replace(MARKER_RE, '§FOOTER§');
  const surgical = remOld === remNew;

  // --- footer semantic changed? ---
  const norm = (x) => x.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '|').replace(/\s+/g, ' ').trim();
  const footerChanged = norm(oldFooter) !== norm(newFooter);

  if (!surgical) {
    console.log(`  FAIL ${f}: remainder DIFERIT — nu s-a atins doar footerul!`);
    failCount++;
    continue;
  }
  okCount++;
  if (footerChanged) changedFooters.push(f);
  toWrite.push([p, out, eol]);
}

console.log(`\nremainder byte-identic: ${okCount}/${pages.length} OK, ${failCount} FAIL`);
console.log(`footere cu CONTINUT schimbat (nu doar whitespace): ${changedFooters.length}`);
changedFooters.forEach((f) => console.log('   • ' + f));

if (WRITE && failCount === 0) {
  for (const [p, out] of toWrite) fs.writeFileSync(p, out, 'utf8');
  console.log(`\nSCRIS ${toWrite.length} pagini.`);
} else if (!WRITE) {
  console.log('\n(dry-run — nimic scris; ruleaza cu --write)');
} else {
  console.log('\nNU s-a scris nimic — exista FAIL-uri.');
}
