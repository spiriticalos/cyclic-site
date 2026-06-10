/* ============================================================
   CYCLIC AGENCY — MAIN JS
   Navigation, mobile menu, active links, smooth behaviours
   ============================================================ */

(function () {
  'use strict';

  /* ── NAV SCROLL BEHAVIOUR ── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── LANGUAGE TOGGLE + RO NAV AUTO-TRANSLATE ── */
  (function injectLangToggle() {
    const html = document.documentElement;
    const pageLang = (html.lang || 'en').toLowerCase().startsWith('ro') ? 'ro' : 'en';
    const otherLang = pageLang === 'ro' ? 'en' : 'ro';

    // If page is RO, auto-translate nav text + hrefs (for pages that still carry EN chrome)
    if (pageLang === 'ro') {
      const textMap = {
        'Home': 'Acasă',
        'Events': 'Evenimente',
        'Artists': 'Artiști',
        'Rentals': 'Închirieri',
        'Labels': 'Label-uri',
        'About Us': 'Despre noi',
        'About': 'Despre',
        'Get Tickets': 'Bilete',
        'Get Tickets →': 'Bilete →',
        'Get a Quote': 'Cere ofertă',
        'Get a Quote →': 'Cere ofertă →'
      };
      const hrefMap = {
        'events.html': 'evenimente.html',
        'artists.html': 'artisti.html',
        'rentals.html': 'inchiriere-echipamente.html',
        'labels.html': 'label-uri.html',
        'about.html': 'despre-noi.html'
      };
      document.querySelectorAll('.nav .nav__link, .nav__mobile .nav__link, .nav .nav__cta, .nav__mobile .btn').forEach(el => {
        // Translate first matching text node — replace() preserves surrounding whitespace
        // (critical for CTAs like "Get Tickets <span>→</span>" where the text node is "Get Tickets ")
        const raw = el.textContent.replace(/\s+/g, ' ').trim();
        for (const src in textMap) {
          if (raw === src || raw.startsWith(src + ' ')) {
            for (const node of el.childNodes) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(src)) {
                node.textContent = node.textContent.replace(src, textMap[src]);
                break;
              }
            }
            break;
          }
        }
        // Rewrite href if it's a known EN page with a RO equivalent
        const href = el.getAttribute('href');
        if (href && hrefMap[href]) {
          el.setAttribute('href', hrefMap[href]);
        }
      });
    }

    // Resolve target: prefer hreflang alternate, fall back to category root
    const altLink = document.querySelector('link[rel="alternate"][hreflang="' + otherLang + '"]');
    const fallback = otherLang === 'ro' ? 'inchiriere-echipamente.html' : 'rentals.html';
    const targetUrl = altLink ? altLink.getAttribute('href') : fallback;

    const label = otherLang === 'ro' ? 'RO' : 'EN';
    const flag = otherLang === 'ro' ? '🇷🇴' : '🇬🇧';
    const labelLong = otherLang === 'ro' ? 'Română' : 'English';
    const aria = otherLang === 'ro' ? 'Versiunea română' : 'Switch to English';

    // Desktop nav — insert before burger (or append if no burger)
    const navInner = document.querySelector('.nav__inner');
    if (navInner && !navInner.querySelector('.lang-toggle')) {
      const toggle = document.createElement('a');
      toggle.href = targetUrl;
      toggle.className = 'lang-toggle';
      toggle.setAttribute('hreflang', otherLang);
      toggle.setAttribute('aria-label', aria);
      toggle.innerHTML = '<span class="lang-toggle__flag" aria-hidden="true">' + flag + '</span> ' + label;
      const burger = navInner.querySelector('.nav__burger');
      if (burger) navInner.insertBefore(toggle, burger);
      else navInner.appendChild(toggle);
    }

    // Mobile drawer — insert before primary CTA (.btn--accent), else append
    const navMobile = document.querySelector('.nav__mobile');
    if (navMobile && !navMobile.querySelector('.lang-toggle')) {
      const mToggle = document.createElement('a');
      mToggle.href = targetUrl;
      mToggle.className = 'lang-toggle';
      mToggle.setAttribute('hreflang', otherLang);
      mToggle.setAttribute('aria-label', aria);
      mToggle.innerHTML = '<span class="lang-toggle__flag" aria-hidden="true">' + flag + '</span> ' + labelLong;
      const mCta = navMobile.querySelector('.btn--accent');
      if (mCta) navMobile.insertBefore(mToggle, mCta);
      else navMobile.appendChild(mToggle);
    }
  })();

  /* ── MOBILE MENU ── */
  const burger  = document.querySelector('.nav__burger');
  const mobileMenu = document.querySelector('.nav__mobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && burger.classList.contains('open')) {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── ACTIVE NAV LINK ── */
  const currentPath = (window.location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop().replace(/\.html$/, '');
    if (href && href === currentPath) link.classList.add('active');
  });

  /* ── EVENT FILTER (events.html) ── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const eventRows  = document.querySelectorAll('[data-genre]');
  if (filterBtns.length && eventRows.length) {
    const eventsGrid = document.querySelector('.events-grid');
    const mobileQ = window.matchMedia('(max-width: 580px)');

    function updateGridColumns() {
      if (!eventsGrid) return;
      const visible = [...eventsGrid.querySelectorAll('[data-genre]')].filter(el => el.style.display !== 'none').length;
      // Don't override on mobile — CSS handles single-column layout
      if (mobileQ.matches || visible >= 3 || visible === 0) {
        eventsGrid.style.gridTemplateColumns = '';
      } else {
        eventsGrid.style.gridTemplateColumns = visible === 1 ? '1fr' : 'repeat(2, 1fr)';
      }
    }

    mobileQ.addEventListener('change', updateGridColumns);

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const genre = btn.dataset.filter;
        eventRows.forEach(row => {
          const show = genre === 'all' || row.dataset.genre === genre;
          row.style.display = show ? '' : 'none';
        });
        updateGridColumns();
      });
    });
  }

  /* ── ARTIST FILTER (artists.html) ── */
  const artistFilterBtns = document.querySelectorAll('.artist-filter-btn');
  // Exclude the filter buttons themselves — they also carry data-type
  const artistCards = document.querySelectorAll('[data-type]:not(.artist-filter-btn)');
  if (artistFilterBtns.length && artistCards.length) {
    artistFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        artistFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        artistCards.forEach(card => {
          const show = type === 'all' || card.dataset.type === type;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ── FOOTER YEAR ── */
  const yearEls = document.querySelectorAll('.js-year');
  yearEls.forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ── SMOOTH ANCHOR SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = nav ? nav.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── AUTO-HIDE EXPIRED EVENTS ── */
  (function hideExpiredEvents() {
    const MONTHS = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today — event visible all day, disappears at midnight

    function eventDate(monthStr, dayStr) {
      const m = MONTHS[monthStr];
      if (m === undefined) return null;
      // Multi-day events ("18–21") → use last day, stays visible through the final day
      const d = parseInt(String(dayStr).split(/[–\-]/).pop());
      if (isNaN(d)) return null;
      let date = new Date(today.getFullYear(), m, d);
      // Dates carry no year. If the date lands more than ~6 months in the past,
      // it belongs to next year (e.g. a Feb lineup announced the previous autumn)
      // rather than being a stale event to hide — roll it forward so it isn't
      // silently removed. Anything within 6 months past is treated as expired.
      if ((today - date) / 86400000 > 183) date = new Date(today.getFullYear() + 1, m, d);
      return date;
    }

    // Event cards (featured grid)
    document.querySelectorAll('.event-card').forEach(card => {
      const dayEl   = card.querySelector('.event-card__date-badge .day');
      const monthEl = card.querySelector('.event-card__date-badge .month');
      if (!dayEl || !monthEl) return;
      const d = eventDate(monthEl.textContent.trim(), dayEl.textContent.trim());
      if (d && d < today) card.remove();
    });

    // Event rows (list)
    document.querySelectorAll('.event-row').forEach(row => {
      const dateEl = row.querySelector('.event-row__date');
      if (!dateEl) return;
      const text = (dateEl.childNodes[0]?.textContent || '').trim(); // "Jun 07"
      const [monthStr, dayStr] = text.split(/\s+/);
      const d = eventDate(monthStr, dayStr);
      if (d && d < today) row.remove();
    });

    // Adjust grid columns after removal
    const grid = document.querySelector('.events-grid');
    if (grid) {
      const remaining = grid.querySelectorAll('.event-card').length;
      const setColumns = () => {
        const mobile = window.matchMedia('(max-width: 580px)').matches;
        // Single event on a wide screen → centred capped card (CSS .events-grid--solo),
        // so a portrait poster isn't stretched/cropped full-width.
        grid.classList.toggle('events-grid--solo', !mobile && remaining === 1);
        if (mobile || remaining >= 3 || remaining === 0 || remaining === 1) {
          grid.style.gridTemplateColumns = '';
        } else {
          grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        }
      };
      setColumns();
      window.addEventListener('resize', setColumns, { passive: true });

      if (remaining === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding: clamp(60px,8vw,100px) 0;">
            <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:16px;">No upcoming events</p>
            <p style="font-family:var(--font-display);font-size:clamp(28px,4vw,48px);margin-bottom:24px;">New events coming soon<span style="color:var(--accent)">.</span></p>
            <a href="mailto:ionut@cyclic.ro" class="btn btn--outline">Get notified →</a>
          </div>`;
      }
    }
  })();

  /* ── NEWSLETTER STICKY BAR ── */
  (function initNewsletterBar() {
    if (localStorage.getItem('nl_dismissed')) return;

    function showBar() {
      if (document.querySelector('.newsletter-bar')) return;

      const bar = document.createElement('div');
      bar.className = 'newsletter-bar';
      bar.setAttribute('role', 'complementary');
      bar.setAttribute('aria-label', 'Subscribe to Cyclic newsletter');
      bar.innerHTML = `
        <div class="container newsletter-bar__inner">
          <div class="newsletter-bar__text">
            <strong>Never miss a Cyclic event</strong>
            <span>Early access · Exclusive offers</span>
          </div>
          <form class="newsletter-bar__form" novalidate>
            <input type="email" class="newsletter-bar__input" placeholder="your@email.com" aria-label="Email address" autocomplete="email" required>
            <button type="submit" class="btn btn--accent newsletter-bar__submit">Subscribe →</button>
          </form>
          <p class="newsletter-bar__consent">By subscribing you agree to our <a href="privacy-policy.html">Privacy Policy</a>.</p>
          <button class="newsletter-bar__close" aria-label="Close">✕</button>
        </div>`;
      document.body.appendChild(bar);

      setTimeout(() => bar.classList.add('visible'), 600);

      bar.querySelector('.newsletter-bar__close').addEventListener('click', () => {
        bar.classList.remove('visible');
        setTimeout(() => bar.remove(), 450);
        localStorage.setItem('nl_dismissed', '1');
      });

      bar.querySelector('.newsletter-bar__form').addEventListener('submit', e => {
        e.preventDefault();
        const input = bar.querySelector('.newsletter-bar__input');
        if (!input.value.trim() || !input.value.includes('@')) {
          input.classList.add('error');
          input.addEventListener('input', () => input.classList.remove('error'), { once: true });
          return;
        }
        bar.querySelector('.newsletter-bar__inner').innerHTML =
          `<p style="width:100%;text-align:center;font-size:15px;">
             <strong style="color:var(--accent);font-family:var(--font-display);">✓ You're in.</strong>
             &nbsp;We'll hit you with early access and exclusive offers.
           </p>`;
        setTimeout(() => { bar.classList.remove('visible'); setTimeout(() => bar.remove(), 450); }, 2800);
        localStorage.setItem('nl_dismissed', '1');
      });
    }

    // Defer behind cookie banner so the two don't stack on first visit
    function consentGiven() {
      try { return !!JSON.parse(localStorage.getItem('cookie_consent_v2') || 'null'); }
      catch (e) { return false; }
    }

    if (consentGiven()) {
      setTimeout(showBar, 1800);
    } else {
      window.addEventListener('cyclic-consent-changed', () => setTimeout(showBar, 600), { once: true });
    }
  })();

  /* ── PREFERS REDUCED MOTION CHECK ── */
  window.REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

})();
