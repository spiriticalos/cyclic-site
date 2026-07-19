/* Recalculeaza varsta companiei ("17 ani" / "17 years") din anul fondarii (2009).
   Ruleaza saptamanal din update-events.yml — in ianuarie site-ul se corecteaza singur,
   inclusiv meta description si JSON-LD (text static, nu JS pe client).
   Starea (varsta curenta afisata) e in data/site-age.json: inlocuim DOAR numarul
   anterior urmat de ani/years, ca sa nu atingem "16 ani" (varsta minima legala din
   Termeni) sau "2 ani" (durate cookies).
   Optiuni: --dry-run (doar raport), YEAR=2027 (test). */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STATE = path.join(ROOT, 'data', 'site-age.json');
const FOUNDED = 2009;
const DRY = process.argv.includes('--dry-run');

const year = parseInt(process.env.YEAR || new Date().getFullYear(), 10);
const age = year - FOUNDED;
const state = JSON.parse(fs.readFileSync(STATE, 'utf8'));

if (age === state.current) {
  console.log(`varsta ${age} (an ${year}) — deja la zi, nimic de facut`);
  process.exit(0);
}
if (age < state.current) {
  console.error(`an ${year} < starea ${state.current} — refuz (ceas gresit?)`);
  process.exit(1);
}

const re = new RegExp(`\\b${state.current}(\\+?) (ani|Ani|years|Years)\\b`, 'g');
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
files.push('llms.txt');

let total = 0;
for (const f of files) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  const n = (s.match(re) || []).length;
  if (!n) continue;
  total += n;
  console.log(`  ${f}: ${n}`);
  if (!DRY) fs.writeFileSync(p, s.replace(re, `${age}$1 $2`), 'utf8');
}
console.log(`${state.current} -> ${age}: ${total} inlocuiri in ${files.length} fisiere scanate${DRY ? ' (dry-run)' : ''}`);
if (!DRY) fs.writeFileSync(STATE, JSON.stringify({ current: age, founded: FOUNDED }, null, 2) + '\n', 'utf8');
