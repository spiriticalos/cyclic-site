/* ============================================================
   CYCLIC AGENCY — GRID DISTORTION
   Abstract brand-colour mesh + faint grid, warped under the
   cursor (port of reactbits.dev "Grid Distortion", no Three.js —
   raw WebGL to match threads.js's footprint). No photo needed:
   the "image" is a generated canvas in the Cyclic palette.
   Self-mounts into .page-hero — just include the script.
   ============================================================ */

(function () {
  'use strict';

  var host = document.querySelector('.page-hero');
  if (!host) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  var GRID = isMobile ? 14 : 21;          // distortion data-texture resolution
  var MOUSE_R = 0.13;                     // grid-space radius of cursor influence
  var STRENGTH = isMobile ? 0.10 : 0.15;  // distortion impulse strength
  var RELAXATION = 0.9;                   // per-frame decay of the distortion field
  var RENDER_SCALE = isMobile ? 0.65 : 1; // internal buffer downscale

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:1';
  host.appendChild(canvas);
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  var gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
        || canvas.getContext('experimental-webgl');
  if (!gl) { host.removeChild(canvas); return; }

  /* ── Generate the "image" being distorted: dark base + green/purple
     mesh blobs (same palette as the homepage hero) + a faint grid so
     the warp is actually visible. No external photo required. ── */
  var bg = document.createElement('canvas');
  bg.width = 768; bg.height = 768;
  var bctx = bg.getContext('2d');
  bctx.fillStyle = '#0a0a0a';
  bctx.fillRect(0, 0, bg.width, bg.height);

  var blobA = bctx.createRadialGradient(bg.width * 0.18, bg.height * 0.22, 0, bg.width * 0.18, bg.height * 0.22, bg.width * 0.58);
  blobA.addColorStop(0, 'rgba(150,204,0,0.38)');
  blobA.addColorStop(1, 'rgba(150,204,0,0)');
  bctx.fillStyle = blobA;
  bctx.fillRect(0, 0, bg.width, bg.height);

  var blobB = bctx.createRadialGradient(bg.width * 0.85, bg.height * 0.82, 0, bg.width * 0.85, bg.height * 0.82, bg.width * 0.62);
  blobB.addColorStop(0, 'rgba(123,47,255,0.34)');
  blobB.addColorStop(1, 'rgba(123,47,255,0)');
  bctx.fillStyle = blobB;
  bctx.fillRect(0, 0, bg.width, bg.height);

  bctx.strokeStyle = 'rgba(255,255,255,0.08)';
  bctx.lineWidth = 1;
  var step = bg.width / 16;
  for (var gx = 0; gx <= bg.width; gx += step) {
    bctx.beginPath(); bctx.moveTo(gx + 0.5, 0); bctx.lineTo(gx + 0.5, bg.height); bctx.stroke();
  }
  for (var gy = 0; gy <= bg.height; gy += step) {
    bctx.beginPath(); bctx.moveTo(0, gy + 0.5); bctx.lineTo(bg.width, gy + 0.5); bctx.stroke();
  }

  var VS = [
    'attribute vec2 position;',
    'void main() {',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'uniform sampler2D uTexture;',
    'uniform sampler2D uDataTexture;',
    'uniform vec2 iResolution;',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / iResolution.xy;',
    '  vec4 off = texture2D(uDataTexture, uv);',
    '  vec2 offset = off.rg * 255.0 - 128.0;',
    '  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset);',
    '}'
  ].join('\n');

  function compileShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }

  var vs = compileShader(gl.VERTEX_SHADER, VS);
  var fs = compileShader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { host.removeChild(canvas); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { host.removeChild(canvas); return; }
  gl.useProgram(prog);

  var posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  var uRes  = gl.getUniformLocation(prog, 'iResolution');
  var uTex  = gl.getUniformLocation(prog, 'uTexture');
  var uData = gl.getUniformLocation(prog, 'uDataTexture');

  // ── Background texture (static) ──
  var bgTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, bgTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bg);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  // ── Data texture (dynamic distortion field, Uint8 — no float-texture extension needed) ──
  var state = new Float32Array(GRID * GRID * 2);     // accumulated x/y offset per grid cell
  var dataBytes = new Uint8Array(GRID * GRID * 4);
  for (var i = 0; i < GRID * GRID; i++) { dataBytes[i * 4 + 3] = 255; }

  var dataTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, dataTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRID, GRID, 0, gl.RGBA, gl.UNSIGNED_BYTE, dataBytes);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  function resize() {
    var w = host.offsetWidth || window.innerWidth;
    var h = host.offsetHeight || window.innerHeight;
    if (!w || !h) return;
    var bw = Math.max(1, Math.round(w * RENDER_SCALE));
    var bh = Math.max(1, Math.round(h * RENDER_SCALE));
    canvas.width = bw;
    canvas.height = bh;
    gl.viewport(0, 0, bw, bh);
    gl.uniform2f(uRes, bw, bh);
    if (reduce) render();
  }

  // ── Mouse (host-relative, y-up to match uv convention) ──
  var mouse = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, vx: 0, vy: 0 };

  function pointerMove(clientX, clientY) {
    var rect = host.getBoundingClientRect();
    var x = (clientX - rect.left) / rect.width;
    var y = 1 - (clientY - rect.top) / rect.height;
    mouse.vx = x - mouse.prevX;
    mouse.vy = y - mouse.prevY;
    mouse.x = x; mouse.y = y; mouse.prevX = x; mouse.prevY = y;
  }
  host.addEventListener('mousemove', function (e) { pointerMove(e.clientX, e.clientY); }, { passive: true });
  host.addEventListener('mouseleave', function () { mouse.vx = 0; mouse.vy = 0; });
  host.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches[0]) pointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  function stepDistortion() {
    var size = GRID;
    for (var i = 0; i < size * size; i++) {
      state[i * 2]     *= RELAXATION;
      state[i * 2 + 1] *= RELAXATION;
    }

    var gx = size * mouse.x;
    var gy = size * mouse.y;
    var maxDist = size * MOUSE_R;

    for (var ix = 0; ix < size; ix++) {
      for (var iy = 0; iy < size; iy++) {
        var dx = gx - ix, dy = gy - iy;
        var distSq = dx * dx + dy * dy;
        if (distSq < maxDist * maxDist) {
          var idx = ix + size * iy;
          var power = Math.min(maxDist / Math.sqrt(distSq || 0.0001), 10);
          state[idx * 2]     += STRENGTH * 100 * mouse.vx * power;
          state[idx * 2 + 1] -= STRENGTH * 100 * mouse.vy * power;
        }
      }
    }

    for (var k = 0; k < size * size; k++) {
      dataBytes[k * 4]     = Math.max(0, Math.min(255, 128 + state[k * 2]));
      dataBytes[k * 4 + 1] = Math.max(0, Math.min(255, 128 + state[k * 2 + 1]));
    }

    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GRID, GRID, gl.RGBA, gl.UNSIGNED_BYTE, dataBytes);
  }

  function render() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bgTexture);
    gl.uniform1i(uTex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    gl.uniform1i(uData, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ── Gating — same pattern as threads.js: stop when offscreen/hidden,
  //    and flag body.hero-in-view so the fixed nav skips its backdrop-blur
  //    (blurring a live-redrawing canvas every frame is what causes scroll
  //    stutter — see js/threads.js for the matching fix on the homepage). ──
  var rafId = 0, running = false, inView = true;
  function loop() {
    if (!running) return;
    stepDistortion();
    render();
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduce || !inView || document.hidden) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  try {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      document.body.classList.toggle('hero-in-view', inView);
      if (inView) start(); else stop();
    }, { threshold: 0 }).observe(host);
  } catch (e) { inView = true; }

  try { new ResizeObserver(resize).observe(host); } catch (e) {}
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  window.addEventListener('load', resize);

  resize();
  if (reduce) render();
  else start();
})();
