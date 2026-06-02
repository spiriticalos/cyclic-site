/* ============================================================
   CYCLIC AGENCY — TITLE SPOTLIGHT
   A soft light follows the cursor and "illuminates" the hero
   title (.ch__title) via a radial gradient clipped to the text.
   When idle / on touch devices it drifts on its own so the
   title is never dead. Drives --mx / --my CSS vars.
   ============================================================ */

(function () {
  'use strict';

  var title = document.querySelector('.ch__title, .rh__title');
  if (!title) return;

  var hero = title.closest('.ch, .rh') || title;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // positions in % of the title box
  var target = { x: 32, y: 42 };
  var cur = { x: 32, y: 42 };
  var lastMove = -9999;
  var t0 = performance.now();

  function setVars() {
    title.style.setProperty('--mx', cur.x.toFixed(2) + '%');
    title.style.setProperty('--my', cur.y.toFixed(2) + '%');
  }

  function onMove(e) {
    var r = title.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var x = ((e.clientX - r.left) / r.width) * 100;
    var y = ((e.clientY - r.top) / r.height) * 100;
    // allow a little overshoot so the corners can catch the light
    target.x = Math.max(-15, Math.min(115, x));
    target.y = Math.max(-60, Math.min(160, y));
    lastMove = performance.now();
  }

  // Touch / no-hover devices and reduced-motion: light one fixed, pleasant spot
  // and skip the animation loop entirely — no perpetual repaint, no battery
  // drain on phones.
  if (!hasHover || reduce) { setVars(); return; }

  // Desktop: listen on window (not the hero) so stacking/overlays never swallow
  // the event — e.g. the hub's sticky z-indexed hero. Coords stay relative to title.
  window.addEventListener('mousemove', onMove, { passive: true });

  var running = false;
  var inView = true;

  function loop(now) {
    if (!running) return;

    var idle = (now - lastMove) > 1600;
    if (idle) {
      // slow Lissajous drift — light keeps sweeping the title
      var t = (now - t0) / 1000;
      target.x = 50 + Math.cos(t * 0.45) * 40;
      target.y = 50 + Math.sin(t * 0.62) * 34;
    }

    cur.x += (target.x - cur.x) * 0.07;
    cur.y += (target.y - cur.y) * 0.07;
    setVars();
    requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduce || !inView || document.hidden) return;
    running = true;
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  try {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  } catch (e) { inView = true; }

  setVars();      // place the light at its resting spot
  start();
})();
