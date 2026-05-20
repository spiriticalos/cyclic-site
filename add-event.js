#!/usr/bin/env node
// add-event.js — adaugă eveniment nou pe site
// Rulare: node add-event.js <url-kompostor>
// Exemplu: node add-event.js "https://www.kompostor.ro/evenimente/13698-cyclic-toy-tonics"

const fs   = require('fs');
const path = require('path');
const rl   = require('readline').createInterface({ input: process.stdin, output: process.stdout });
const sharp = require('sharp');

const ask = (q) => new Promise(res => rl.question(q, res));

async function downloadImage(kompostorUrl) {
  // Încearcă să extragă URL-ul imaginii din pagina kompostor
  const pageRes = await fetch(kompostorUrl);
  const html    = await pageRes.text();

  const m = html.match(/files\/event\/\d+\/poster_file\/[a-f0-9]+\.(png|jpg|jpeg)/i);
  if (!m) throw new Error('Nu am găsit imaginea pe pagina kompostor. Verifică URL-ul.');

  const imgUrl = 'https://www.kompostor.ro/' + m[0] + '?operation=resize&width=600';
  console.log('Imagine găsită:', imgUrl);

  const imgRes = await fetch(imgUrl);
  if (!imgRes.ok) throw new Error('Download imagine eșuat: ' + imgRes.status);
  return Buffer.from(await imgRes.arrayBuffer());
}

function slug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function monthNum(mon) {
  return { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 }[mon.toLowerCase().slice(0,3)] || 1;
}

function pad(n) { return String(n).padStart(2,'0'); }

async function main() {
  const kompostorUrl = process.argv[2];
  if (!kompostorUrl || !kompostorUrl.includes('kompostor.ro')) {
    console.error('Folosire: node add-event.js <url-kompostor>');
    console.error('Ex:       node add-event.js "https://www.kompostor.ro/evenimente/13698-..."');
    process.exit(1);
  }

  console.log('\n── Adaugă eveniment nou ──\n');

  const name   = await ask('Nume eveniment (ex: Toy Tonics Rooftop Jam): ');
  const day    = await ask('Ziua (ex: 16): ');
  const month  = await ask('Luna (ex: May): ');
  const year   = await ask('Anul (ex: 2026): ');
  const venue  = await ask('Venue (ex: Grand Hotel Bucharest, Terasa Etaj 2): ');
  const price  = await ask('Preț de la (ex: 69 RON): ');
  const tags   = await ask('Taguri separate cu virgulă (ex: House,Rooftop,Bucharest): ');
  const genre  = await ask('Culoare gen - purple sau accent (ex: purple): ');

  rl.close();

  console.log('\nDescarc imaginea...');
  let imgBuffer;
  try {
    imgBuffer = await downloadImage(kompostorUrl);
  } catch(e) {
    console.error('Eroare:', e.message);
    process.exit(1);
  }

  const eventSlug = 'event-' + slug(name);
  const outPath   = path.join('images', eventSlug + '.webp');
  const info      = await sharp(imgBuffer).webp({ quality: 82 }).toFile(outPath);
  console.log(`Salvat: ${outPath} (${info.width}x${info.height}, ${Math.round(info.size/1024)}KB)\n`);

  // Generează taguri HTML
  const tagList = tags.split(',').map((t, i) => {
    if (i === 0) return `<span class="tag tag--${genre || 'purple'}">${t.trim()}</span>`;
    return `<span class="tag">${t.trim()}</span>`;
  }).join('');

  const isoDate = `${year}-${pad(monthNum(month))}-${pad(Number(day))}`;
  const ariaLabel = `${name} — ${venue} ${month} ${day}`;

  const card = `
          <article class="event-card fade-in" aria-label="${ariaLabel}">
            <div class="event-card__image-wrap">
              <img src="${outPath.replace(/\\/g,'/')}"
                   alt="${name} ${venue} ${month} ${day} ${year}"
                   width="${info.width}" height="${info.height}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
              <div class="event-card__date-badge">
                <span class="day">${day}</span>
                <span class="month">${month}</span>
              </div>
            </div>
            <div class="event-card__body">
              <div class="tags">${tagList}</div>
              <h3 class="event-card__title">${name}</h3>
              <p class="event-card__venue">${venue}</p>
              <div class="event-card__footer">
                <p class="event-card__price">From <strong>${price}</strong></p>
                <a href="${kompostorUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--accent btn--sm magnetic">Tickets →</a>
              </div>
            </div>
          </article>`;

  const jsonLd = `      {
        "@type": "MusicEvent",
        "position": X,
        "name": "Cyclic: ${name}",
        "startDate": "${isoDate}",
        "location": { "@type": "Place", "name": "${venue}" },
        "organizer": { "@type": "Organization", "name": "Cyclic Agency", "url": "https://cyclic.ro" },
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
      }`;

  console.log('═══════════════════════════════════════════════');
  console.log('CARD HTML — pastează în index.html și events.html (în .events-grid):');
  console.log('═══════════════════════════════════════════════');
  console.log(card);
  console.log('\n═══════════════════════════════════════════════');
  console.log('JSON-LD — pastează în <script type="application/ld+json"> din index.html:');
  console.log('═══════════════════════════════════════════════');
  console.log(jsonLd);
  console.log('\nDone! Nu uita: git add images/' + eventSlug + '.webp && git add index.html events.html && git commit && git push');
}

main().catch(e => { console.error(e); process.exit(1); });
