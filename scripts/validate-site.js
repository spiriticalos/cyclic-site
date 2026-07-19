/* Validator de site — ruleaza in CI la fiecare push (.github/workflows/validate.yml)
   si local cu: node scripts/validate-site.js
   Consolideaza verificarile care au prins bug-uri reale in iulie 2026:
   linkuri rupte, JSON-LD invalid, hreflang nereciproc, sitemap cu pagini noindex,
   versiuni de asseturi desincronizate (capcana cache-ului immutable), mojibake,
   FAQ schema != text vizibil. Iese cu cod 1 la orice eroare. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const errors = [];
const err = (m) => errors.push(m);

// 1. linkuri interne + imagini locale
for (const f of files) {
  const s = read(f);
  for (const h of new Set([...s.matchAll(/href="([a-z0-9-]+\.html)/g)].map((m) => m[1])))
    if (!fs.existsSync(path.join(ROOT, h))) err(`link rupt: ${f} -> ${h}`);
  for (const src of new Set([...s.matchAll(/(?:src|content)="(images\/[^"]+)"/g)].map((m) => m[1])))
    if (!fs.existsSync(path.join(ROOT, src))) err(`imagine lipsa: ${f} -> ${src}`);
}

// 2. JSON-LD valid
for (const f of files)
  for (const b of [...read(f).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)])
    try { JSON.parse(b[1]); } catch (e) { err(`JSON-LD invalid in ${f}: ${e.message.slice(0, 60)}`); }

// 3. hreflang reciproc (fara ancore)
for (const f of files) {
  const s = read(f);
  for (const [, , t] of s.matchAll(/hreflang="(ro|en)" href="https:\/\/cyclic\.ro\/([^"#]*)"/g)) {
    const tf = t === '' ? 'index.html' : t;
    if (!fs.existsSync(path.join(ROOT, tf))) { err(`hreflang spre pagina inexistenta: ${f} -> ${tf}`); continue; }
    if (tf === f) continue;
    const back = [...read(tf).matchAll(/hreflang="(ro|en)" href="https:\/\/cyclic\.ro\/([^"#]*)"/g)]
      .some((m) => (m[2] === '' ? 'index.html' : m[2]) === f);
    if (!back) err(`hreflang nereciproc: ${f} -> ${tf}`);
  }
}

// 4. toggle de limba reciproc
for (const f of files) {
  const s = read(f);
  const tog = (s.match(/<a href="([^"#]+)[^"]*" class="lang-toggle"/) || [])[1];
  if (!tog) continue;
  if (!fs.existsSync(path.join(ROOT, tog))) { err(`toggle spre pagina inexistenta: ${f} -> ${tog}`); continue; }
  const back = (read(tog).match(/<a href="([^"#]+)[^"]*" class="lang-toggle"/) || [])[1];
  if (back !== f) err(`toggle nereciproc: ${f} -> ${tog} -> ${back}`);
}

// 5. sitemap: exista, indexabile, xhtml:link valide, XML balansat
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
if ((sm.match(/<url>/g) || []).length !== (sm.match(/<\/url>/g) || []).length) err('sitemap: <url> nebalansat');
for (const m of sm.matchAll(/<loc>https:\/\/cyclic\.ro\/([^<]*)<\/loc>/g)) {
  const f = m[1] || 'index.html';
  if (!fs.existsSync(path.join(ROOT, f))) { err(`sitemap: pagina inexistenta ${f}`); continue; }
  if (/content="noindex/.test(read(f))) err(`sitemap: pagina noindex ${f}`);
}
for (const m of sm.matchAll(/xhtml:link[^>]*href="https:\/\/cyclic\.ro\/([^"#]*)"/g)) {
  const f = m[1] || 'index.html';
  if (!fs.existsSync(path.join(ROOT, f))) err(`sitemap xhtml:link rupt: ${f}`);
}

// 6. exact 1 h1 / nav / footer per pagina
for (const f of files) {
  const s = read(f);
  for (const [what, re] of [['h1', /<h1[ >]/g], ['nav principal', /<nav class="nav"/g], ['footer', /<footer /g]]) {
    const n = (s.match(re) || []).length;
    if (n !== 1) err(`${f}: ${n}x ${what} (astept 1)`);
  }
}

// 7. versiuni de asseturi consecvente (capcana cache immutable)
const gen = fs.readFileSync(path.join(ROOT, 'scripts', 'build-artists.js'), 'utf8');
for (const asset of ['main.css', 'main.js', 'effects.js', 'cookie-banner.js', 'analytics.js', 'fonts.css', 'rentals.css']) {
  const vers = new Set();
  for (const f of files)
    for (const m of read(f).matchAll(new RegExp(asset.replace('.', '\\.') + '\\?v=(\\d+)', 'g'))) vers.add(m[1]);
  if (vers.size > 1) err(`versiuni amestecate pentru ${asset}: v=${[...vers].join(', v=')}`);
  const gm = [...gen.matchAll(new RegExp(asset.replace('.', '\\.') + '\\?(?:v=(\\d+)|\' \\+ CSS_V)', 'g'))];
  if (asset === 'main.css') {
    const cssv = (gen.match(/const CSS_V = 'v=(\d+)'/) || [])[1];
    if (cssv && vers.size && !vers.has(cssv)) err(`build-artists.js CSS_V=v=${cssv} dar site-ul e pe v=${[...vers][0]}`);
  } else if (gm.length && gm[0][1] && vers.size && !vers.has(gm[0][1])) {
    err(`build-artists.js are ${asset}?v=${gm[0][1]} dar site-ul e pe v=${[...vers][0]}`);
  }
}

// 8. mojibake (diacritice corupte)
for (const f of files) if (/È™|Ã®|â€|Ãƒ/.test(read(f))) err(`mojibake in ${f}`);

// 9. FAQ: raspunsurile din schema apar si vizibil
const norm = (x) => x.replace(/&amp;/g, '&').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
for (const f of files) {
  const s = read(f);
  if (!s.includes('"FAQPage"')) continue;
  for (const b of [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]) {
    let j; try { j = JSON.parse(b[1]); } catch (e) { continue; }
    const fp = j['@type'] === 'FAQPage' ? j : null;
    if (!fp) continue;
    const vis = norm(s.replace(/<script[\s\S]*?<\/script>/g, ''));
    for (const q of fp.mainEntity)
      if (!vis.includes(norm(q.acceptedAnswer.text).slice(0, 80)))
        err(`${f}: raspuns FAQ din schema fara echivalent vizibil ("${q.name.slice(0, 50)}")`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} erori:`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log(`✓ ${files.length} pagini validate, 0 erori`);
