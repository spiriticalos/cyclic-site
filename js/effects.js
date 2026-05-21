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
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ════════════════════════════════════════════
     2. CUSTOM CURSOR (desktop with hover only)
     ════════════════════════════════════════════ */
  if (supportsHover && !prefersReduced) {
    const cursor    = document.querySelector('.cursor');
    const cursorDot = document.querySelector('.cursor-dot');

    if (cursor && cursorDot && getComputedStyle(cursor).display !== 'none') {
      let mouseX = -100, mouseY = -100;
      let curX = -100, curY = -100;
      let raf;

      document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top  = mouseY + 'px';
      });

      function lerp(a, b, t) { return a + (b - a) * t; }
      function loop() {
        curX = lerp(curX, mouseX, 0.12);
        curY = lerp(curY, mouseY, 0.12);
        cursor.style.left = curX + 'px';
        cursor.style.top  = curY + 'px';
        raf = requestAnimationFrame(loop);
      }
      loop();

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
      let leaveTimer;

      el.addEventListener('mousemove', e => {
        clearTimeout(leaveTimer);
        el.style.transition = '';
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
        leaveTimer = setTimeout(() => { el.style.transition = ''; }, 500);
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
     7. IMAGE LAZY LOAD with fade
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

})();
