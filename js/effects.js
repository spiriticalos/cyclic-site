/* ============================================================
   CYCLIC AGENCY — EFFECTS JS
   Custom cursor, magnetic buttons, parallax, scroll animations
   ============================================================ */

(function () {
  'use strict';

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ════════════════════════════════════════════
     1. INTERSECTION OBSERVER — SCROLL ANIMATIONS
     ════════════════════════════════════════════ */
  const fadeEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');

  if (!prefersReduced && fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    fadeEls.forEach(el => observer.observe(el));
  } else {
    // Reduce motion: show everything immediately
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ════════════════════════════════════════════
     2. CUSTOM CURSOR (desktop with hover only)
     ════════════════════════════════════════════ */
  if (supportsHover && !prefersReduced) {
    const cursor    = document.querySelector('.cursor');
    const cursorDot = document.querySelector('.cursor-dot');

    if (cursor && cursorDot) {
      let mouseX = -100, mouseY = -100;
      let curX = -100, curY = -100;
      let raf;

      document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top  = mouseY + 'px';
      });

      // Lerp outer ring for smooth follow
      function lerp(a, b, t) { return a + (b - a) * t; }
      function loop() {
        curX = lerp(curX, mouseX, 0.12);
        curY = lerp(curY, mouseY, 0.12);
        cursor.style.left = curX + 'px';
        cursor.style.top  = curY + 'px';
        raf = requestAnimationFrame(loop);
      }
      loop();

      // Cursor states
      const hoverTargets = document.querySelectorAll('a, button, .magnetic, .artist-card, .event-card, .label-card, .card');
      hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
      });

      document.addEventListener('mousedown', () => {
        cursor.classList.add('cursor--click');
        cursorDot.style.transform = 'translate(-50%, -50%) scale(2)';
      });
      document.addEventListener('mouseup', () => {
        cursor.classList.remove('cursor--click');
        cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
      });

      // Hide cursor when leaving window
      document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; cursorDot.style.opacity = '0'; });
      document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; cursorDot.style.opacity = '1'; });
    }
  }

  /* ════════════════════════════════════════════
     3. MAGNETIC BUTTON EFFECT
     ════════════════════════════════════════════ */
  if (supportsHover && !prefersReduced) {
    const magneticEls = document.querySelectorAll('.magnetic');

    magneticEls.forEach(el => {
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) * 0.35;
        const dy = (e.clientY - cy) * 0.35;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => { el.style.transition = ''; }, 500);
      });
    });
  }

  /* ════════════════════════════════════════════
     4. HERO PARALLAX
     ════════════════════════════════════════════ */
  if (!isMobile && !prefersReduced) {
    const heroBg = document.querySelector('.hero__bg');
    const heroContent = document.querySelector('.hero__content');

    if (heroBg) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = window.scrollY;
            heroBg.style.transform = `translateY(${y * 0.35}px)`;
            if (heroContent) heroContent.style.transform = `translateY(${y * 0.12}px)`;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  /* ════════════════════════════════════════════
     5. COUNTER ANIMATION (stats)
     ════════════════════════════════════════════ */
  function animateCounter(el, target, duration) {
    const start = performance.now();
    const isDecimal = String(target).includes('.');

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = eased * target;
      el.textContent = isDecimal
        ? current.toFixed(1)
        : Math.floor(current) + (el.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target + (el.dataset.suffix || '');
    }
    requestAnimationFrame(update);
  }

  const counterEls = document.querySelectorAll('[data-count]');
  if (counterEls.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = '1';
          const target = parseFloat(entry.target.dataset.count);
          animateCounter(entry.target, target, prefersReduced ? 0 : 1800);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterEls.forEach(el => {
      el.textContent = '0' + (el.dataset.suffix || '');
      counterObserver.observe(el);
    });
  }

  /* ════════════════════════════════════════════
     6. STAGGER CHILDREN on scroll
     ════════════════════════════════════════════ */
  const staggerParents = document.querySelectorAll('.stagger-children');
  if (!prefersReduced && staggerParents.length) {
    staggerParents.forEach(parent => {
      const children = Array.from(parent.children);
      children.forEach((child, i) => {
        child.style.transitionDelay = `${i * 0.08}s`;
        child.classList.add('fade-in');
      });
    });

    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
          staggerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    staggerParents.forEach(p => staggerObs.observe(p));
  }

  /* ════════════════════════════════════════════
     7. WAVEFORM CANVAS ANIMATION
     ════════════════════════════════════════════ */
  function initWaveforms() {
    if (prefersReduced) return;

    const targets = document.querySelectorAll(
      '.hero__bg, .section--dark, .cta-section, .page-hero'
    );

    targets.forEach(section => {
      // ensure positioning context
      const pos = getComputedStyle(section).position;
      if (pos === 'static') section.style.position = 'relative';

      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = [
        'position:absolute',
        'inset:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:1',
        'opacity:1'
      ].join(';');

      section.insertBefore(canvas, section.firstChild);

      const ctx = canvas.getContext('2d');
      let W, H, rafId, tick = 0;

      // Three wave configs: amp factor, freq, phase offset, speed, opacity, lineWidth
      const waves = [
        { ampF: 0.07, freq: 0.006, phaseOff: 0,    speed: 0.018, alpha: 0.13, lw: 1.5 },
        { ampF: 0.04, freq: 0.011, phaseOff: 2.1,  speed: 0.011, alpha: 0.08, lw: 1.0 },
        { ampF: 0.10, freq: 0.004, phaseOff: 4.4,  speed: 0.007, alpha: 0.06, lw: 2.0 },
      ];

      function resize() {
        W = canvas.width  = section.offsetWidth;
        H = canvas.height = section.offsetHeight || window.innerHeight;
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        const cy = H / 2;

        waves.forEach(w => {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(186,255,41,${w.alpha})`;
          ctx.lineWidth   = w.lw;
          ctx.lineJoin    = 'round';
          ctx.lineCap     = 'round';

          for (let x = 0; x <= W; x += 2) {
            const y = cy + Math.sin(x * w.freq + tick * w.speed + w.phaseOff) * (H * w.ampF);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        tick++;
        rafId = requestAnimationFrame(draw);
      }

      const ro = new ResizeObserver(resize);
      ro.observe(section);
      resize();
      draw();
    });
  }

  initWaveforms();

  /* ════════════════════════════════════════════
     8. BPM TYPOGRAPHY — rhythmic background text
     ════════════════════════════════════════════ */
  function initBpmTypography() {
    if (prefersReduced) return;

    const WORDS   = ['128','BPM','Hz','140','BAR','4/4','SUB','DROP','kHz','120','BEAT','33','145','FREQ'];
    const BPM     = 128;
    const BEAT_MS = (60 / BPM) * 1000; // ≈ 468.75ms

    // On mobile: fewer elements, smaller font, skip hero__bg to avoid layout issues
    const PER_SECTION = isMobile ? 3 : 6;
    const MAX_SIZE    = isMobile ? 52 : 182;
    const MIN_SIZE    = isMobile ? 36 : 72;

    const targets = document.querySelectorAll(
      isMobile
        ? '.section--dark, .cta-section'
        : '.hero__bg, .section--dark, .cta-section, .page-hero'
    );

    const items = [];

    targets.forEach(section => {
      // Ensure clipping
      section.style.overflow = 'hidden';

      for (let i = 0; i < PER_SECTION; i++) {
        const el = document.createElement('span');
        el.setAttribute('aria-hidden', 'true');
        el.textContent = WORDS[Math.floor(Math.random() * WORDS.length)];

        const size = MIN_SIZE + Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE));
        // Keep positions safe from edges to avoid overflow
        const leftPct = 15 + Math.random() * 65;
        const topPct  = 10 + Math.random() * 75;

        el.style.cssText = [
          'position:absolute',
          `font-family:'Bebas Neue',sans-serif`,
          `font-size:${size}px`,
          'color:#BAFF29',
          'pointer-events:none',
          'z-index:0',
          'user-select:none',
          `left:${leftPct}%`,
          `top:${topPct}%`,
          'transform:translate(-50%,-50%)',
          'opacity:0',
          'letter-spacing:0.06em',
          'line-height:1',
          'white-space:nowrap',
          'max-width:90%',
          'overflow:hidden',
          'text-overflow:clip'
        ].join(';');

        section.appendChild(el);

        items.push({
          el,
          phase:    Math.random() * BEAT_MS * 8,
          interval: BEAT_MS * (2 + Math.floor(Math.random() * 7)),
          pulseDur: BEAT_MS * 0.38,
          baseOp:   0.025 + Math.random() * 0.03,
          peakOp:   0.08  + Math.random() * 0.07,
        });
      }
    });

    function tick(now) {
      items.forEach(item => {
        const t       = (now + item.phase) % item.interval;
        const inPulse = t < item.pulseDur;

        let op;
        if (inPulse) {
          // Triangle envelope: rise 40%, fall 60%
          const p   = t / item.pulseDur;
          const env = p < 0.4 ? p / 0.4 : 1 - (p - 0.4) / 0.6;
          op = item.baseOp + (item.peakOp - item.baseOp) * env;
        } else {
          op = item.baseOp * 0.25; // nearly invisible between beats
        }

        item.el.style.opacity = op;
      });
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  initBpmTypography();

  /* ════════════════════════════════════════════
     9. IMAGE LAZY LOAD with fade
     ════════════════════════════════════════════ */
  if ('IntersectionObserver' in window) {
    const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
    lazyImgs.forEach(img => {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.5s ease';
      img.addEventListener('load', () => { img.style.opacity = '1'; });
      if (img.complete) img.style.opacity = '1';
    });
  }

  /* ════════════════════════════════════════════
     10. PARTICLE NETWORK
     Dots connected by lines; cursor repels nearby particles
     ════════════════════════════════════════════ */
  function initParticleNetwork() {
    if (prefersReduced) return;

    const hero = document.querySelector('.hero__bg');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0';
    hero.insertBefore(canvas, hero.firstChild);

    const ctx    = canvas.getContext('2d');
    const COUNT  = isMobile ? 45 : 90;
    const MAXD   = isMobile ? 110 : 160;   // max connection distance (px)
    const MAXD2  = MAXD * MAXD;
    const MRAD   = 180;                     // mouse influence radius (px)
    const MFORCE = 0.055;
    const SPEED  = 0.45;

    let W = 0, H = 0;
    const mouse = { x: -9999, y: -9999 };
    let particles = [];

    function resize() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight || window.innerHeight;
      particles.forEach(p => {
        if (p.x > W) p.x = Math.random() * W;
        if (p.y > H) p.y = Math.random() * H;
      });
    }

    function spawn() {
      particles = Array.from({ length: COUNT }, () => ({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r:  Math.random() * 1.4 + 0.7,
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      // ── update & draw dots ──
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];

        // cursor repulsion
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const md  = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < MRAD && md > 0) {
          const f = ((MRAD - md) / MRAD) * MFORCE;
          p.vx += (mdx / md) * f;
          p.vy += (mdy / md) * f;
        }

        // friction + speed cap
        p.vx *= 0.97;
        p.vy *= 0.97;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 2) { p.vx *= 2 / spd; p.vy *= 2 / spd; }

        p.x += p.vx;
        p.y += p.vy;

        // wrap edges
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(186,255,41,0.45)';
        ctx.fill();
      }

      // ── draw connections ──
      ctx.lineWidth = 0.8;
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MAXD2) {
            const dist  = Math.sqrt(d2);
            const alpha = (1 - dist / MAXD) * 0.18;
            ctx.strokeStyle = `rgba(186,255,41,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(tick);
    }

    // ── mouse / touch tracking relative to hero ──
    let heroRect = hero.getBoundingClientRect();
    const refreshRect = () => { heroRect = hero.getBoundingClientRect(); };
    window.addEventListener('resize', refreshRect, { passive: true });
    window.addEventListener('scroll', refreshRect, { passive: true });

    document.addEventListener('mousemove', e => {
      mouse.x = e.clientX - heroRect.left;
      mouse.y = e.clientY - heroRect.top;
    }, { passive: true });

    document.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    document.addEventListener('touchmove', e => {
      const t = e.touches[0];
      mouse.x = t.clientX - heroRect.left;
      mouse.y = t.clientY - heroRect.top;
    }, { passive: true });

    document.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });

    new ResizeObserver(resize).observe(hero);

    resize();
    spawn();
    tick();
  }

  initParticleNetwork();

})();
