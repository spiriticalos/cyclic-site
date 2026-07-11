/* ============================================================
   CYCLIC AGENCY — MAGIC RINGS
   Port vanilla WebGL (fără three.js) al efectului "Magic Rings"
   de pe reactbits.dev — concentric rings care pulsează și
   încadrează titlul. Rulează în CSP-ul strict (script-src 'self').
   Randează în [data-magic-rings]; interacțiunea (parallax/hover)
   e pe .page-hero părinte. Gate-uri de perf ca la threads.js.
   ============================================================ */
(function () {
  'use strict';

  var mount = document.querySelector('[data-magic-rings]');
  if (!mount) return;
  var hero = mount.closest('.page-hero') || mount;

  // Config — valorile personalizate de user (reactbits customize)
  var CFG = {
    color: '#10b981', colorTwo: '#208661', speed: 1, ringCount: 7, attenuation: 10,
    lineThickness: 2, baseRadius: 0.35, radiusStep: 0.1, scaleRate: 0.1, opacity: 1,
    blur: 0, noiseAmount: 0.1, rotation: 0, ringGap: 1.5, fadeIn: 0.7, fadeOut: 0.5,
    followMouse: false, mouseInfluence: 0.2, hoverScale: 1.2, parallax: 0.05
  };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  if (CFG.blur > 0) canvas.style.filter = 'blur(' + CFG.blur + 'px)';
  mount.appendChild(canvas);

  var glOpts = { alpha: true, premultipliedAlpha: false, antialias: !isMobile };
  var gl = canvas.getContext('webgl', glOpts) || canvas.getContext('experimental-webgl', glOpts);
  if (!gl) { mount.removeChild(canvas); return; }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  var VS = 'attribute vec2 position; void main(){ gl_Position = vec4(position, 0.0, 1.0); }';

  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform float uTime, uAttenuation, uLineThickness;',
    'uniform float uBaseRadius, uRadiusStep, uScaleRate;',
    'uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;',
    'uniform float uFadeIn, uFadeOut;',
    'uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;',
    'uniform vec2 uResolution, uMouse;',
    'uniform vec3 uColor, uColorTwo;',
    'uniform int uRingCount;',
    'const float HP = 1.5707963;',
    'const float CYCLE = 3.45;',
    'float fade(float t) {',
    '  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);',
    '}',
    'float ring(vec2 p, float ri, float cut, float t0, float px) {',
    '  float t = mod(uTime + t0, CYCLE);',
    '  float r = ri + t / CYCLE * uScaleRate;',
    '  float d = abs(length(p) - r);',
    '  float a = atan(abs(p.y), abs(p.x)) / HP;',
    '  float th = max(1.0 - a, 0.5) * px * uLineThickness;',
    '  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;',
    '  d += pow(cut * a, 3.0) * r;',
    '  return h * exp(-uAttenuation * d) * fade(t);',
    '}',
    'void main() {',
    '  float px = 1.0 / min(uResolution.x, uResolution.y);',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;',
    '  float cr = cos(uRotation), sr = sin(uRotation);',
    '  p = mat2(cr, -sr, sr, cr) * p;',
    '  p -= uMouse * uMouseInfluence;',
    '  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;',
    '  p /= sc;',
    '  vec3 c = vec3(0.0);',
    '  float rcf = max(float(uRingCount) - 1.0, 1.0);',
    '  for (int i = 0; i < 10; i++) {',
    '    if (i >= uRingCount) break;',
    '    float fi = float(i);',
    '    vec2 pr = p - fi * uParallax * uMouse;',
    '    vec3 rc = mix(uColor, uColorTwo, fi / rcf);',
    '    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));',
    '  }',
    '  c *= 1.0 + uBurst * 2.0;',
    '  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);',
    '  c += (n - 0.5) * uNoiseAmount;',
    '  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VS);
  var fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { mount.removeChild(canvas); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { mount.removeChild(canvas); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  function U(n) { return gl.getUniformLocation(prog, n); }
  var u = {
    time: U('uTime'), res: U('uResolution'), mouse: U('uMouse'),
    hoverAmount: U('uHoverAmount')
  };

  function hex(h) {
    h = h.replace('#', '');
    return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
  }

  // Uniforme statice (nu se schimbă în timp)
  var col = hex(CFG.color), col2 = hex(CFG.colorTwo);
  gl.uniform3f(U('uColor'), col[0], col[1], col[2]);
  gl.uniform3f(U('uColorTwo'), col2[0], col2[1], col2[2]);
  gl.uniform1f(U('uAttenuation'), CFG.attenuation);
  gl.uniform1f(U('uLineThickness'), CFG.lineThickness);
  gl.uniform1f(U('uBaseRadius'), CFG.baseRadius);
  gl.uniform1f(U('uRadiusStep'), CFG.radiusStep);
  gl.uniform1f(U('uScaleRate'), CFG.scaleRate);
  gl.uniform1i(U('uRingCount'), CFG.ringCount);
  gl.uniform1f(U('uOpacity'), CFG.opacity);
  gl.uniform1f(U('uNoiseAmount'), CFG.noiseAmount);
  gl.uniform1f(U('uRotation'), CFG.rotation * Math.PI / 180);
  gl.uniform1f(U('uRingGap'), CFG.ringGap);
  gl.uniform1f(U('uFadeIn'), CFG.fadeIn);
  gl.uniform1f(U('uFadeOut'), CFG.fadeOut);
  gl.uniform1f(U('uMouseInfluence'), CFG.followMouse ? CFG.mouseInfluence : 0);
  gl.uniform1f(U('uHoverScale'), CFG.hoverScale);
  gl.uniform1f(U('uParallax'), CFG.parallax);
  gl.uniform1f(U('uBurst'), 0);

  function resize() {
    var w = mount.clientWidth || hero.clientWidth;
    var h = mount.clientHeight || hero.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    var bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    canvas.width = bw; canvas.height = bh;
    gl.viewport(0, 0, bw, bh);
    gl.uniform2f(u.res, bw, bh);
    if (reduce) drawFrame(1000); // un cadru static, la mijloc de ciclu
  }

  // Mouse — pe hero (nu pe canvas) ca să meargă și peste text
  var target = [0, 0], cur = [0, 0], hoverT = 0, isHover = false;
  hero.addEventListener('mousemove', function (e) {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    target[0] = (e.clientX - r.left) / r.width - 0.5;
    target[1] = -((e.clientY - r.top) / r.height - 0.5);
  }, { passive: true });
  hero.addEventListener('mouseenter', function () { isHover = true; });
  hero.addEventListener('mouseleave', function () { isHover = false; target[0] = 0; target[1] = 0; });

  function drawFrame(t) {
    cur[0] += (target[0] - cur[0]) * 0.08;
    cur[1] += (target[1] - cur[1]) * 0.08;
    hoverT += ((isHover ? 1 : 0) - hoverT) * 0.08;
    gl.uniform1f(u.time, t * 0.001 * CFG.speed);
    gl.uniform2f(u.mouse, cur[0], cur[1]);
    gl.uniform1f(u.hoverAmount, hoverT);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Gating — nu arde GPU offscreen / tab ascuns / reduced-motion
  var rafId = 0, running = false, inView = true;
  function loop(t) { if (!running) return; drawFrame(t); rafId = requestAnimationFrame(loop); }
  function start() { if (running || reduce || !inView || document.hidden) return; running = true; rafId = requestAnimationFrame(loop); }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

  try { new ResizeObserver(resize).observe(mount); } catch (e) {}
  window.addEventListener('resize', resize);
  resize();

  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  try {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  } catch (e) { inView = true; }

  if (reduce) drawFrame(1000);
  else start();
})();
