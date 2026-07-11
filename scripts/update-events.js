#!/usr/bin/env node
/* ============================================================
   CYCLIC — sincronizare evenimente din Kompostor
   Rulare: node scripts/update-events.js
   - Caută pe kompostor.ro/evenimente linkurile care conțin "cyclic"
   - Extrage titlu/dată/oraș/preț din <title> + prețuri din pagină
   - Descarcă posterul -> images/events-auto/<id>.webp (600px, sharp)
   - Rescrie blocul dintre markerii AUTO-EVENTS din evenimente.html
     (RO) și events.html (EN)
   - Detalii curatoriate manual (venue, lineup, gen, taguri) vin din
     data/events-overrides.json, cheie = ID-ul kompostor
   Rulat săptămânal de .github/workflows/update-events.yml
   ============================================================ */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'images', 'events-auto');
const OVERRIDES_FILE = path.join(ROOT, 'data', 'events-overrides.json');
const LIST_PAGES = 5;

const MONTHS_RO_FULL = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
const MONTHS_RO_ABBR = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Noi','Dec'];
const MONTHS_EN_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
          .replace(/&#8211;/g, '–').replace(/&nbsp;/g, ' ').trim();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'cyclic-site-events-sync' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

async function discoverEventUrls() {
  const urls = new Set();
  for (let p = 1; p <= LIST_PAGES; p++) {
    const listUrl = p === 1 ? 'https://www.kompostor.ro/evenimente' : `https://www.kompostor.ro/evenimente?page=${p}`;
    let html;
    try { html = await fetchText(listUrl); } catch (e) { break; }
    for (const m of html.matchAll(/href="(https:\/\/www\.kompostor\.ro\/evenimente\/\d+[^"]*cyclic[^"]*)"/gi)) {
      urls.add(m[1]);
    }
  }
  return [...urls];
}

async function parseEvent(url, overrides) {
  const html = await fetchText(url);
  const id = (url.match(/\/evenimente\/(\d+)/) || [])[1];

  // <title>Bilete: NUME, 26 iulie 2026, 15.00, Brașov</title>
  const t = html.match(/<title>\s*Bilete:\s*(.+?),\s*(\d{1,2})\s+([a-zăâîșț]+)\s+(\d{4}),\s*(\d{1,2})[.:](\d{2}),\s*([^<,]+?)\s*<\/title>/i);
  if (!t) { console.warn(`SKIP (titlu neparsabil): ${url}`); return null; }

  const name = decodeEntities(t[1]);
  const day = parseInt(t[2], 10);
  const monthIdx = MONTHS_RO_FULL.indexOf(t[3].toLowerCase());
  const year = parseInt(t[4], 10);
  const hour = t[5].padStart(2, '0'), min = t[6];
  const city = decodeEntities(t[7]);
  if (monthIdx === -1) { console.warn(`SKIP (luna necunoscuta "${t[3]}"): ${url}`); return null; }
  const date = new Date(year, monthIdx, day);

  // Prețul minim afișat pe pagină (suma și "RON" pot fi în tag-uri separate)
  const text = html.replace(/<[^>]+>/g, ' ');
  const prices = [...text.matchAll(/(\d+(?:\.\d{2})?)\s*RON/g)].map(m => parseFloat(m[1])).filter(v => v > 0);
  const price = prices.length ? Math.round(Math.min(...prices)) : null;

  // Poster (același pattern ca add-event.js)
  const img = html.match(/files\/event\/\d+\/poster_file\/[a-f0-9]+\.(png|jpg|jpeg)/i);

  const o = overrides[id] || {};
  return {
    id, url, date, price,
    city: o.city || city,
    startIso: `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hour}:${min}:00+03:00`,
    title: o.title || name.replace(/^Cyclic\s*(&[^ ]+\s*)?(x\s+\S+\s+)?presents?\s+/i, '').replace(/^Cyclic\s+/i, ''),
    venue: o.venue || city,
    lineup: o.lineup || '',
    genre: o.genre || 'other',
    tags: o.tags || [city],
    posterUrl: img ? 'https://www.kompostor.ro/' + img[0] + '?operation=resize&width=600' : null
  };
}

async function savePoster(ev) {
  if (!ev.posterUrl) return null;
  const out = path.join(IMG_DIR, `${ev.id}.webp`);
  if (fs.existsSync(out)) return `images/events-auto/${ev.id}.webp`;
  const res = await fetch(ev.posterUrl);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(IMG_DIR, { recursive: true });
  await sharp(buf).resize({ width: 600 }).webp({ quality: 82 }).toFile(out);
  return `images/events-auto/${ev.id}.webp`;
}

function cardHtml(ev, imgPath, lang) {
  const ro = lang === 'ro';
  const month = (ro ? MONTHS_RO_ABBR : MONTHS_EN_ABBR)[ev.date.getMonth()];
  const tags = ev.tags.map(t => {
    const cls = t === 'Techno' || t === 'Melodic' ? ' tag--accent' : (t === 'House' ? ' tag--purple' : '');
    return `<span class="tag${cls}">${t}</span>`;
  }).join('');
  const img = imgPath || 'images/placeholder.svg';
  const alt = `${ev.title} — ${ev.venue}, ${ev.date.getDate()} ${month} ${ev.date.getFullYear()}`;
  const price = ev.price
    ? `<p class="event-card__price">${ro ? 'De la' : 'From'} <strong>${ev.price} RON</strong></p>`
    : '<p class="event-card__price"></p>';
  return `
          <article class="event-card" data-genre="${ev.genre}" aria-label="${alt}">
            <div class="event-card__image-wrap">
              <img src="${img}"
                   alt="${alt}"
                   width="600" height="600" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
              <div class="event-card__date-badge">
                <span class="day">${ev.date.getDate()}</span>
                <span class="month">${month}</span>
              </div>
            </div>
            <div class="event-card__body">
              <div class="tags">${tags}</div>
              <h3 class="event-card__title">${ev.title}</h3>
              <p class="event-card__venue">${ev.venue}</p>
              ${ev.lineup ? `<p class="event-card__desc" style="font-size:13px; color:rgba(255,255,255,0.5); margin:8px 0;">${ev.lineup}</p>` : ''}
              <div class="event-card__footer">
                ${price}
                <a href="${ev.url}" target="_blank" rel="noopener noreferrer" class="btn btn--accent btn--sm magnetic">${ro ? 'Bilete' : 'Tickets'} →</a>
              </div>
            </div>
          </article>`;
}

function ldJson(events) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Cyclic Agency Upcoming Events',
    itemListElement: events.map((ev, i) => ({
      '@type': 'MusicEvent', position: i + 1,
      name: `Cyclic: ${ev.title}`,
      startDate: ev.startIso,
      url: ev.url,
      location: { '@type': 'Place', name: ev.venue.split(',')[0].trim(), address: { '@type': 'PostalAddress', addressLocality: ev.city, addressCountry: 'RO' } },
      performer: ev.lineup ? ev.lineup.split('·').map(n => ({ '@type': 'Person', name: n.trim() })) : undefined,
      offers: ev.price ? { '@type': 'Offer', price: ev.price, priceCurrency: 'RON', url: ev.url, availability: 'https://schema.org/InStock' } : undefined,
      organizer: { '@type': 'Organization', name: 'Cyclic Agency', url: 'https://cyclic.ro' },
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
    }))
  }, null, 2);
}

function splice(file, block, ld) {
  const p = path.join(ROOT, file);
  const html = fs.readFileSync(p, 'utf8');
  const re = /(<!-- AUTO-EVENTS:START[^>]*-->)[\s\S]*?(\s*<!-- AUTO-EVENTS:END -->)/;
  if (!re.test(html)) { console.error(`${file}: markerii AUTO-EVENTS lipsesc!`); process.exitCode = 1; return false; }
  let next = html.replace(re, `$1${block}\n$2`);
  const reLd = /(<!-- AUTO-EVENTS-LD:START[^>]*-->\s*<script type="application\/ld\+json">)[\s\S]*?(<\/script>\s*<!-- AUTO-EVENTS-LD:END -->)/;
  if (reLd.test(next)) next = next.replace(reLd, `$1\n${ld}\n  $2`);
  if (next === html) return false;
  fs.writeFileSync(p, next);
  return true;
}

(async () => {
  const overrides = fs.existsSync(OVERRIDES_FILE) ? JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8')) : {};
  const urls = await discoverEventUrls();
  console.log(`Gasite ${urls.length} evenimente Cyclic pe Kompostor`);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const events = [];
  for (const url of urls) {
    const ev = await parseEvent(url, overrides);
    if (ev && ev.date >= today) events.push(ev);
  }
  events.sort((a, b) => a.date - b.date);
  console.log(events.map(e => ` - ${e.date.toISOString().slice(0, 10)} ${e.title} (${e.city})`).join('\n') || ' (niciunul viitor)');

  const withImg = [];
  for (const ev of events) withImg.push([ev, await savePoster(ev)]);

  const roBlock = withImg.map(([ev, img]) => cardHtml(ev, img, 'ro')).join('\n');
  const enBlock = withImg.map(([ev, img]) => cardHtml(ev, img, 'en')).join('\n');
  const ld = ldJson(events);

  const c1 = splice('evenimente.html', roBlock, ld);
  const c2 = splice('events.html', enBlock, ld);
  console.log(`evenimente.html: ${c1 ? 'actualizat' : 'neschimbat'} | events.html: ${c2 ? 'actualizat' : 'neschimbat'}`);
})().catch(e => { console.error(e); process.exit(1); });
