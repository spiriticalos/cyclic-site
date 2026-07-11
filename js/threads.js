(function () {
  'use strict';

  var hero = document.querySelector('.hero__bg');
  if (!hero) return;

  // Perf tiers — lighter on phones, static (no loop) when user prefers reduced motion.
  // Mobil: buffer aproape de rezoluția reală (altfel apare pixelat pe ecrane dense),
  // compensat cu jumătate din linii + cap la ~30fps => același buget GPU, imagine curată.
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;
  var LINE_COUNT = isMobile ? 16 : 40;       // shader loop iterations (per-pixel cost)
  var RENDER_SCALE = isMobile ? Math.min(window.devicePixelRatio || 1, 1.25) : 1;
  var FRAME_MS = isMobile ? 33 : 0;          // ~30fps pe mobil, nelimitat pe desktop
  var Y_BASE = isMobile ? 0.66 : 0.5;        // vertical centre of the bundle — lifted higher on phones

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:1';
  hero.appendChild(canvas);

  var glOpts = { alpha: true, antialias: !isMobile, premultipliedAlpha: false };
  var gl = canvas.getContext('webgl', glOpts) || canvas.getContext('experimental-webgl', glOpts);
  if (!gl) { hero.removeChild(canvas); return; }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  var VS = [
    'attribute vec2 position;',
    'void main() {',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform float iTime;',
    'uniform vec3 iResolution;',
    'uniform vec3 uColor;',
    'uniform float uAmplitude;',
    'uniform float uDistance;',
    'uniform vec2 uMouse;',
    '#define PI 3.1415926538',
    'const int u_line_count = ' + LINE_COUNT + ';',
    'const float u_line_width = 7.0;',
    'const float u_line_blur = 10.0;',
    'float Perlin2D(vec2 P) {',
    '  vec2 Pi = floor(P);',
    '  vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);',
    '  vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);',
    '  Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;',
    '  Pt += vec2(26.0, 161.0).xyxy;',
    '  Pt *= Pt;',
    '  Pt = Pt.xzxz * Pt.yyww;',
    '  vec4 hash_x = fract(Pt * (1.0 / 951.135664));',
    '  vec4 hash_y = fract(Pt * (1.0 / 642.949883));',
    '  vec4 grad_x = hash_x - 0.49999;',
    '  vec4 grad_y = hash_y - 0.49999;',
    '  vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)',
    '    * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);',
    '  grad_results *= 1.4142135623730950;',
    '  vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy',
    '    * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);',
    '  vec4 blend2 = vec4(blend, vec2(1.0 - blend));',
    '  return dot(grad_results, blend2.zxzx * blend2.wwyy);',
    '}',
    'float px(float count, vec2 res) {',
    '  return (1.0 / max(res.x, res.y)) * count;',
    '}',
    'float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {',
    '  float split_point = 0.1 + perc * 0.4;',
    '  float amplitude_normal = smoothstep(split_point, 0.7, st.x);',
    '  float finalAmplitude = amplitude_normal * 0.5 * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);',
    '  float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;',
    '  float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;',
    '  float xnoise = mix(',
    '    Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),',
    '    Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,',
    '    st.x * 0.3',
    '  );',
    '  float y = ' + Y_BASE.toFixed(3) + ' + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;',
    '  float line_start = smoothstep(',
    '    y + (width / 2.0) + (u_line_blur * px(1.0, iResolution.xy) * blur),',
    '    y, st.y',
    '  );',
    '  float line_end = smoothstep(',
    '    y,',
    '    y - (width / 2.0) - (u_line_blur * px(1.0, iResolution.xy) * blur),',
    '    st.y',
    '  );',
    '  return clamp((line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))), 0.0, 1.0);',
    '}',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / iResolution.xy;',
    '  float line_strength = 1.0;',
    '  for (int i = 0; i < u_line_count; i++) {',
    '    float p = float(i) / float(u_line_count);',
    '    line_strength *= (1.0 - lineFn(',
    '      uv,',
    '      u_line_width * px(1.0, iResolution.xy) * (1.0 - p),',
    '      p,',
    '      PI * p,',
    '      uMouse, iTime, uAmplitude, uDistance',
    '    ));',
    '  }',
    '  float colorVal = 1.0 - line_strength;',
    '  gl_FragColor = vec4(uColor * colorVal, colorVal);',
    '}'
  ].join('\n');

  function compileShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compileShader(gl.VERTEX_SHADER, VS);
  var fs = compileShader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { hero.removeChild(canvas); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { hero.removeChild(canvas); return; }
  gl.useProgram(prog);

  var posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  var uTime  = gl.getUniformLocation(prog, 'iTime');
  var uRes   = gl.getUniformLocation(prog, 'iResolution');
  var uCol   = gl.getUniformLocation(prog, 'uColor');
  var uAmp   = gl.getUniformLocation(prog, 'uAmplitude');
  var uDist  = gl.getUniformLocation(prog, 'uDistance');
  var uMouse = gl.getUniformLocation(prog, 'uMouse');

  gl.uniform3f(uCol, 1.0, 1.0, 1.0);
  gl.uniform1f(uAmp, 1.8);
  gl.uniform1f(uDist, 0.45);
  gl.uniform2f(uMouse, 0.5, 0.5);

  var targetMouse  = [0.5, 0.5];
  var currentMouse = [0.5, 0.5];

  function resize() {
    var w = hero.offsetWidth || hero.clientWidth || window.innerWidth;
    var h = hero.offsetHeight || hero.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    var bw = Math.max(1, Math.round(w * RENDER_SCALE));
    var bh = Math.max(1, Math.round(h * RENDER_SCALE));
    canvas.width  = bw;
    canvas.height = bh;
    gl.viewport(0, 0, bw, bh);
    gl.uniform3f(uRes, bw, bh, bw / (bh || 1));
    if (reduce) renderFrame(0);   // static single frame, no animation loop
  }

  // Multiple resize triggers — mobile layout can settle late (flex + 100svh + defer)
  try { new ResizeObserver(resize).observe(hero); } catch (e) {}
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  window.addEventListener('load', resize);
  resize();
  requestAnimationFrame(resize);
  setTimeout(resize, 250);

  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    targetMouse[0] = (e.clientX - r.left) / r.width;
    targetMouse[1] = 1.0 - (e.clientY - r.top) / (r.height || 1);
  });

  hero.addEventListener('mouseleave', function () {
    targetMouse[0] = 0.5;
    targetMouse[1] = 0.5;
  });

  function renderFrame(t) {
    currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
    currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
    gl.uniform2f(uMouse, currentMouse[0], currentMouse[1]);
    gl.uniform1f(uTime, t * 0.001);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Gating — don't burn GPU when the hero is offscreen or the tab is hidden.
  var rafId = 0, running = false, inView = true, lastFrame = 0;
  function loop(t) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    if (FRAME_MS && t - lastFrame < FRAME_MS) return;
    lastFrame = t;
    renderFrame(t);
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
    }, { threshold: 0 }).observe(hero);
  } catch (e) { inView = true; }

  if (reduce) renderFrame(0);   // one static frame
  else start();
})();
