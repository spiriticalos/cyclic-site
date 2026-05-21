(function () {
  var cards = document.querySelectorAll('.team-card');
  if (!cards.length) return;

  function clamp(v, mn, mx) { return Math.min(Math.max(v, mn === undefined ? 0 : mn), mx === undefined ? 1 : mx); }
  function round(v, p) { return parseFloat(v.toFixed(p === undefined ? 3 : p)); }

  function createEngine(el) {
    var rafId = null, running = false, lastTs = 0;
    var cx = 0, cy = 0, tx = 0, ty = 0;
    var DEFAULT_TAU = 0.14, INITIAL_TAU = 0.6, initialUntil = 0;

    function setVars(x, y) {
      var w = el.clientWidth || 1;
      var h = el.clientHeight || 1;
      var px = clamp((100 / w) * x, 0, 100);
      var py = clamp((100 / h) * y, 0, 100);
      el.style.setProperty('--pointer-x', px + '%');
      el.style.setProperty('--pointer-y', py + '%');
      el.style.setProperty('--rotate-x', round(-(px - 50) / 5) + 'deg');
      el.style.setProperty('--rotate-y', round((py - 50) / 4) + 'deg');
    }

    function step(ts) {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      var dt = (ts - lastTs) / 1000;
      lastTs = ts;
      var tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      var k = 1 - Math.exp(-dt / tau);
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      setVars(cx, cy);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false; lastTs = 0; rafId = null;
      }
    }

    function start() {
      if (running) return;
      running = true; lastTs = 0;
      rafId = requestAnimationFrame(step);
    }

    return {
      setImmediate: function (x, y) { cx = x; cy = y; setVars(x, y); },
      setTarget: function (x, y) { tx = x; ty = y; start(); },
      toCenter: function () { this.setTarget(el.clientWidth / 2, el.clientHeight / 2); },
      beginInitial: function (ms) { initialUntil = performance.now() + ms; start(); },
      getCurrent: function () { return { x: cx, y: cy, tx: tx, ty: ty }; },
      cancel: function () { if (rafId) cancelAnimationFrame(rafId); rafId = null; running = false; lastTs = 0; }
    };
  }

  cards.forEach(function (card) {
    var engine = createEngine(card);
    var leaveRaf = null, enterTimer = null;

    engine.setImmediate(card.clientWidth - 70, 60);
    engine.toCenter();
    engine.beginInitial(1200);

    card.addEventListener('pointerenter', function (e) {
      card.classList.add('active', 'entering');
      clearTimeout(enterTimer);
      enterTimer = setTimeout(function () { card.classList.remove('entering'); }, 180);
      var r = card.getBoundingClientRect();
      engine.setTarget(e.clientX - r.left, e.clientY - r.top);
    });

    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      engine.setTarget(e.clientX - r.left, e.clientY - r.top);
    });

    card.addEventListener('pointerleave', function () {
      engine.toCenter();
      function check() {
        var s = engine.getCurrent();
        if (Math.hypot(s.tx - s.x, s.ty - s.y) < 0.6) {
          card.classList.remove('active');
          leaveRaf = null;
        } else {
          leaveRaf = requestAnimationFrame(check);
        }
      }
      if (leaveRaf) cancelAnimationFrame(leaveRaf);
      leaveRaf = requestAnimationFrame(check);
    });
  });
})();
