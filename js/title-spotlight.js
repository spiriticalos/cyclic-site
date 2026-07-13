/* ============================================================
   CYCLIC AGENCY — TITLE SPOTLIGHT
   A soft light follows the cursor and "illuminates" a title
   (.ch__title / .rh__title / .cta-section__title) via a radial
   gradient clipped to the text. When idle / on touch devices it
   drifts on its own so the title is never dead. Each matched
   title is tracked independently and drives its own --mx / --my.
   ============================================================ */

(function () {
  'use strict';

  var titles = document.querySelectorAll('.ch__title, .rh__title, .cta-section__title, .spotlight-title');
  if (!titles.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Build per-title state
  var items = [];
  titles.forEach(function (el) {
    items.push({
      el: el,
      hero: el.closest('.ch, .rh, .cta-section, .why, .qf') || el,
      target: { x: 32, y: 42 },
      cur: { x: 32, y: 42 },
      lastMove: -9999,
      inView: true
    });
  });

  var t0 = performance.now();

  function setVars(it) {
    it.el.style.setProperty('--mx', it.cur.x.toFixed(2) + '%');
    it.el.style.setProperty('--my', it.cur.y.toFixed(2) + '%');
  }

  function onMove(e) {
    var now = performance.now();
    items.forEach(function (it) {
      if (!it.inView) return;
      var r = it.el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var x = ((e.clientX - r.left) / r.width) * 100;
      var y = ((e.clientY - r.top) / r.height) * 100;
      it.target.x = Math.max(-15, Math.min(115, x));
      it.target.y = Math.max(-60, Math.min(160, y));
      it.lastMove = now;
    });
  }

  // Touch / no-hover devices and reduced-motion: light one fixed, pleasant spot
  // and skip the animation loop entirely — no perpetual repaint, no battery drain.
  if (!hasHover || reduce) { items.forEach(setVars); return; }

  // Listen on window (not the hero) so stacking/overlays never swallow the event.
  window.addEventListener('mousemove', onMove, { passive: true });

  var running = false;

  function loop(now) {
    if (!running) return;
    var t = (now - t0) / 1000;
    items.forEach(function (it) {
      if (!it.inView) return;
      if ((now - it.lastMove) > 1600) {
        // slow Lissajous drift — light keeps sweeping the title
        it.target.x = 50 + Math.cos(t * 0.45) * 40;
        it.target.y = 50 + Math.sin(t * 0.62) * 34;
      }
      it.cur.x += (it.target.x - it.cur.x) * 0.07;
      it.cur.y += (it.target.y - it.cur.y) * 0.07;
      setVars(it);
    });
    requestAnimationFrame(loop);
  }

  function anyInView() {
    return items.some(function (it) { return it.inView; });
  }

  function start() {
    if (running || reduce || document.hidden || !anyInView()) return;
    running = true;
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  try {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var it = items.find(function (i) { return i.hero === entry.target; });
        if (it) it.inView = entry.isIntersecting;
      });
      if (anyInView()) start(); else stop();
    }, { threshold: 0 });
    items.forEach(function (it) { io.observe(it.hero); });
  } catch (e) { /* observer unsupported: leave all inView = true */ }

  items.forEach(setVars);  // place each light at its resting spot
  start();
})();
