/* Bumpeaza ?v= pentru un asset peste tot: toate paginile HTML + build-artists.js.
   Elimina capcana cache-ului immutable (asseturile /css/ /js/ sunt cache-uite 1 an,
   deci ORICE modificare de continut cere bump sincronizat peste tot).
   Folosire:  node scripts/bump-version.js main.css --write
   Fara --write: dry-run (arata ce ar face). Validatorul CI verifica consecventa. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const asset = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!asset || !/^[a-z0-9-]+\.(css|js)$/.test(asset)) {
  console.error('Folosire: node scripts/bump-version.js <asset.css|asset.js> [--write]');
  process.exit(1);
}

const re = new RegExp(asset.replace('.', '\\.') + '\\?v=(\\d+)', 'g');
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

// versiunea curenta (trebuie sa fie unica — altfel refuz)
const vers = new Set();
for (const f of files) for (const m of fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(re)) vers.add(m[1]);
if (!vers.size) { console.error(`${asset}: nicio referinta ?v= gasita`); process.exit(1); }
if (vers.size > 1) { console.error(`${asset}: versiuni amestecate (v=${[...vers].join(', v=')}) — repara intai`); process.exit(1); }
const cur = [...vers][0], next = String(parseInt(cur, 10) + 1);

let pages = 0, hits = 0;
for (const f of files) {
  const p = path.join(ROOT, f);
  const s = fs.readFileSync(p, 'utf8');
  const n = (s.match(re) || []).length;
  if (!n) continue;
  pages++; hits += n;
  if (WRITE) fs.writeFileSync(p, s.replace(re, `${asset}?v=${next}`), 'utf8');
}

// generatorul de artisti: CSS_V pentru main.css, literal pentru restul
const gp = path.join(ROOT, 'scripts', 'build-artists.js');
let g = fs.readFileSync(gp, 'utf8'), genTouched = false;
if (asset === 'main.css') {
  const g2 = g.replace(/const CSS_V = 'v=\d+'/, `const CSS_V = 'v=${next}'`);
  genTouched = g2 !== g; g = g2;
} else {
  const g2 = g.replace(re, `${asset}?v=${next}`);
  genTouched = g2 !== g; g = g2;
}
if (WRITE && genTouched) fs.writeFileSync(gp, g, 'utf8');

console.log(`${asset}: v=${cur} -> v=${next} | ${hits} referinte in ${pages} pagini | generator: ${genTouched ? 'da' : 'neafectat'}${WRITE ? '' : ' (dry-run)'}`);
if (WRITE && genTouched) console.log('NU uita: node scripts/build-artists.js (regenereaza paginile de artist)');
