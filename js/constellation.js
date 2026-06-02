/* ============================================================
   CYCLIC AGENCY — CONSTELLATION
   Interactive particle network behind the page hero.
   Dots drift, connect to neighbours, and react to the cursor
   (lines drawn + gentle attraction). Cyclic green/purple palette.
   Self-mounts into .page-hero — just include the script.
   ============================================================ */

(function () {
  'use strict';

  var host = document.querySelector('.page-hero');
  if (!host) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Palette (Cyclic): green, purple, white ──
  var COLORS = [
    [150, 204, 0],   // accent green
    [150, 204, 0],
    [123, 47, 255],  // purple
    [184, 157, 255], // light purple
    [255, 255, 255]  // white
  ];

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:1';
  host.appendChild(canvas);
  // keep host gradient layered correctly
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var W = 0, H = 0;
  var particles = [];

  // Tuning — "prominent"
  var LINK_DIST = 150;      // neighbour link distance (px)
  var CURSOR_R  = 230;      // cursor influence radius (px)
  var MAX_SPEED = 0.45;

  function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }

  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeParticles() {
    var area = W * H;
    var density = isMobile() ? 14000 : 8500; // 1 particle per N px²
    var count = Math.max(24, Math.min(130, Math.round(area / density)));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rand(-MAX_SPEED, MAX_SPEED),
        vy: rand(-MAX_SPEED, MAX_SPEED),
        r: rand(1.4, 3.0),
        c: COLORS[(Math.random() * COLORS.length) | 0]
      });
    }
  }

  function resize() {
    var w = host.offsetWidth;
    var h = host.offsetHeight;
    if (!w || !h) return;
    W = w; H = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeParticles();
    if (reduce) draw(); // single static frame
  }

  // ── Cursor ──
  var mouse = { x: -9999, y: -9999, active: false };

  function pointerMove(clientX, clientY) {
    var rect = host.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var pad = 60;
    if (x >= -pad && x <= W + pad && y >= -pad && y <= H + pad) {
      mouse.x = x; mouse.y = y; mouse.active = true;
    } else {
      mouse.active = false;
    }
  }

  window.addEventListener('mousemove', function (e) { pointerMove(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse.active = false; }, { passive: true });
  host.addEventListener('mouseleave', function () { mouse.active = false; });
  host.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches[0]) pointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  host.addEventListener('touchend', function () { mouse.active = false; }, { passive: true });

  function step() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // cursor attraction — the web leans toward the pointer
      if (mouse.active) {
        var dx = mouse.x - p.x;
        var dy = mouse.y - p.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < CURSOR_R * CURSOR_R && d2 > 1) {
          var d = Math.sqrt(d2);
          var f = (1 - d / CURSOR_R) * 0.06;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }

      // drift + damping
      p.vx *= 0.985;
      p.vy *= 0.985;
      // keep a minimum wander so it never freezes
      p.vx += rand(-0.012, 0.012);
      p.vy += rand(-0.012, 0.012);

      // clamp speed
      var sp = Math.hypot(p.vx, p.vy);
      if (sp > MAX_SPEED) { p.vx = (p.vx / sp) * MAX_SPEED; p.vy = (p.vy / sp) * MAX_SPEED; }

      p.x += p.vx;
      p.y += p.vy;

      // bounce off edges
      if (p.x < 0) { p.x = 0; p.vx = -p.vx; }
      else if (p.x > W) { p.x = W; p.vx = -p.vx; }
      if (p.y < 0) { p.y = 0; p.vy = -p.vy; }
      else if (p.y > H) { p.y = H; p.vy = -p.vy; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // ── neighbour links ──
    for (var i = 0; i < particles.length; i++) {
      var a = particles[i];
      for (var j = i + 1; j < particles.length; j++) {
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.hypot(dx, dy);
        if (dist < LINK_DIST) {
          var alpha = (1 - dist / LINK_DIST) * 0.5;
          ctx.strokeStyle = 'rgba(150,204,0,' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // ── cursor links (brighter, thicker) ──
    if (mouse.active) {
      for (var k = 0; k < particles.length; k++) {
        var p = particles[k];
        var mdx = p.x - mouse.x;
        var mdy = p.y - mouse.y;
        var md = Math.hypot(mdx, mdy);
        if (md < CURSOR_R) {
          var ma = (1 - md / CURSOR_R) * 0.85;
          ctx.strokeStyle = 'rgba(150,204,0,' + ma.toFixed(3) + ')';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
    }

    // ── dots (with soft glow) ──
    for (var n = 0; n < particles.length; n++) {
      var d = particles[n];
      var c = d.c;
      // glow
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.12)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 2.6, 0, Math.PI * 2);
      ctx.fill();
      // core
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.95)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Loop with visibility + viewport gating ──
  var running = false;
  var inView = true;

  function frame() {
    if (!running) return;
    step();
    draw();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce || !inView || document.hidden) return;
    running = true;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  try {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) start(); else stop();
    }, { threshold: 0 }).observe(host);
  } catch (e) { inView = true; }

  try { new ResizeObserver(resize).observe(host); } catch (e) {}
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  window.addEventListener('load', resize);

  resize();
  if (!reduce) start();
})();
