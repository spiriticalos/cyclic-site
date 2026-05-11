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

    function updateGridColumns() {
      if (!eventsGrid) return;
      const visible = [...eventsGrid.querySelectorAll('[data-genre]')].filter(el => el.style.display !== 'none').length;
      eventsGrid.style.gridTemplateColumns =
        visible === 1 ? '1fr' :
        visible === 2 ? 'repeat(2, 1fr)' : '';
    }

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
  const artistCards = document.querySelectorAll('[data-type]');
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

  /* ── PREFERS REDUCED MOTION CHECK ── */
  window.REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

})();
