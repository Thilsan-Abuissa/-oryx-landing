/* =============================================================
   ORYX — hero WebGL scene
   Flowing particle streams that echo the swoosh lines in the logo.
   Colours: maroon #9A3243 → silver #C6CDD3 on near-black.
   Degrades to the CSS gradient/orb background if WebGL is absent.
   ============================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bail() { document.body.classList.add('no-webgl'); }

  if (typeof THREE === 'undefined') { bail(); return; }
  try {
    var probe = document.createElement('canvas');
    if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) { bail(); return; }
  } catch (e) { bail(); return; }

  /* ---------- config ---------- */
  var CURVES        = 9;     // number of flow lines
  var PER_CURVE     = 420;   // particles riding each line
  var SPARKS        = 22;    // bigger "head" particles per curve
  var SAMPLES       = 420;   // pre-baked points per curve (fast lookup)
  var DUST          = 520;   // ambient floating specks
  var BG            = 0x0b0c0f;

  var COL_MAROON = new THREE.Color(0x9a3243);
  var COL_ROSE   = new THREE.Color(0xd68c99);
  var COL_SILVER = new THREE.Color(0xc6cdd3);

  /* ---------- renderer / scene ---------- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(BG, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.042);

  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
  camera.position.set(0, 0, 13);

  var world = new THREE.Group();
  scene.add(world);

  /* ---------- curve geometry: long swooshes sweeping left → right ---------- */
  function buildCurve(i) {
    var pts = [];
    var base = (i - (CURVES - 1) / 2) * 1.45;
    for (var s = 0; s <= 7; s++) {
      var t = s / 7;
      var x = -20 + t * 40;
      var y = base
            + Math.sin(t * Math.PI * 1.15 + i * 0.62) * (1.9 + i * 0.13)
            - t * 1.1;
      var z = Math.sin(t * Math.PI * 0.9 + i * 0.75) * 3.4 - i * 0.24;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
  }

  var baked = [];   // Float32 flat arrays of sampled points per curve
  var lineGroup = new THREE.Group();
  world.add(lineGroup);

  for (var c = 0; c < CURVES; c++) {
    var curve = buildCurve(c);
    var sampled = curve.getSpacedPoints(SAMPLES - 1);
    var flat = new Float32Array(SAMPLES * 3);
    for (var s2 = 0; s2 < SAMPLES; s2++) {
      flat[s2 * 3]     = sampled[s2].x;
      flat[s2 * 3 + 1] = sampled[s2].y;
      flat[s2 * 3 + 2] = sampled[s2].z;
    }
    baked.push(flat);

    // faint guide line under the particles
    var lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(flat.slice(), 3));
    var lm = new THREE.LineBasicMaterial({
      color: c % 3 === 0 ? 0x9a3243 : 0x6f767c,
      transparent: true,
      opacity: c % 3 === 0 ? 0.28 : 0.13
    });
    lineGroup.add(new THREE.Line(lg, lm));
  }

  /* ---------- soft round sprite ---------- */
  function sprite() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    var g = cv.getContext('2d');
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.00, 'rgba(255,255,255,1)');
    grd.addColorStop(0.22, 'rgba(255,255,255,0.62)');
    grd.addColorStop(0.55, 'rgba(255,255,255,0.14)');
    grd.addColorStop(1.00, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(cv);
    if ('SRGBColorSpace' in THREE) { try { tex.colorSpace = THREE.SRGBColorSpace; } catch (e) {} }
    return tex;
  }
  var dotTex = sprite();

  /* ---------- particles riding the curves ----------
     Two layers: a dense fine mist, plus sparse bright "heads" that read as
     light travelling along the swoosh. PointsMaterial can't vary size per
     vertex, so the heads are their own object. */
  var tmp = new THREE.Color();

  function makeStream(perCurve, size, opacity, spread, bright) {
    var n = CURVES * perCurve;
    var S = {
      n: n,
      pos:   new Float32Array(n * 3),
      col:   new Float32Array(n * 3),
      curve: new Uint8Array(n),
      u:     new Float32Array(n),
      speed: new Float32Array(n),
      off:   new Float32Array(n * 3),
      phase: new Float32Array(n)
    };

    for (var i = 0; i < n; i++) {
      var ci = Math.floor(i / perCurve);
      S.curve[i] = ci;
      S.u[i]     = Math.random();
      S.speed[i] = 0.013 + Math.random() * 0.028;
      S.phase[i] = Math.random() * Math.PI * 2;

      S.off[i * 3]     = (Math.random() - 0.5) * spread * 0.7;
      S.off[i * 3 + 1] = (Math.random() - 0.5) * spread;
      S.off[i * 3 + 2] = (Math.random() - 0.5) * spread;

      // maroon dominates the lower streams, silver the upper ones — like the logo
      var mix = Math.random();
      var upper = ci / (CURVES - 1);
      if (mix < 0.18) tmp.copy(COL_ROSE);
      else if (mix < 0.18 + 0.56 * (1 - upper * 0.55)) tmp.copy(COL_MAROON);
      else tmp.copy(COL_SILVER);

      var shade = bright * (0.62 + Math.random() * 0.62);
      S.col[i * 3]     = tmp.r * shade;
      S.col[i * 3 + 1] = tmp.g * shade;
      S.col[i * 3 + 2] = tmp.b * shade;
    }

    S.geo = new THREE.BufferGeometry();
    S.geo.setAttribute('position', new THREE.BufferAttribute(S.pos, 3));
    S.geo.setAttribute('color',    new THREE.BufferAttribute(S.col, 3));

    world.add(new THREE.Points(S.geo, new THREE.PointsMaterial({
      size: size, map: dotTex, vertexColors: true, transparent: true,
      opacity: opacity, depthWrite: false, blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })));
    return S;
  }

  var streams = [
    makeStream(PER_CURVE, 0.19, 0.95, 0.46, 1.15),   // fine mist
    makeStream(SPARKS,    0.55, 0.85, 0.20, 1.55)    // bright heads
  ];

  /* ---------- ambient dust ---------- */
  var dPos = new Float32Array(DUST * 3);
  var dSpd = new Float32Array(DUST);
  for (var d = 0; d < DUST; d++) {
    dPos[d * 3]     = (Math.random() - 0.5) * 44;
    dPos[d * 3 + 1] = (Math.random() - 0.5) * 22;
    dPos[d * 3 + 2] = (Math.random() - 0.5) * 18 - 4;
    dSpd[d] = 0.004 + Math.random() * 0.012;
  }
  var dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  var dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
    size: 0.055, map: dotTex, color: 0x9aa2a9,
    transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  world.add(dust);

  /* ---------- interaction state ---------- */
  var mouse = { x: 0, y: 0 }, ease = { x: 0, y: 0 };
  var scrollP = 0;
  var visible = true;
  var last = 0;

  window.addEventListener('pointermove', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener('scroll', function () {
    var h = canvas.parentNode.offsetHeight || window.innerHeight;
    scrollP = Math.min(1, Math.max(0, window.pageYOffset / h));
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(canvas);
  }

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull the camera back on narrow screens so the streams still read
    camera.fov = w < 760 ? 68 : 55;
    camera.updateProjectionMatrix();
    // setSize clears the drawing buffer; the static (reduced-motion) path has
    // no render loop to repaint it, so redraw here or the hero goes black.
    if (reduced) drawStatic();
  }
  window.addEventListener('resize', resize);

  /* ---------- frame ---------- */
  function step(now) {
    requestAnimationFrame(step);
    if (!visible) { last = now; return; }

    var dt = Math.min((now - last) / 1000, 0.05) || 0.016;
    last = now;
    var t = now * 0.001;

    for (var si = 0; si < streams.length; si++) {
      var S = streams[si];
      for (var i = 0; i < S.n; i++) {
        var u = S.u[i] + S.speed[i] * dt;
        if (u >= 1) u -= 1;
        S.u[i] = u;

        var flat = baked[S.curve[i]];
        var f = u * (SAMPLES - 1);
        var i0 = f | 0;
        var i1 = i0 + 1 < SAMPLES ? i0 + 1 : i0;
        var m = f - i0;
        var a = i0 * 3, b = i1 * 3, o = i * 3;

        var wob = Math.sin(t * 0.9 + S.phase[i]) * 0.16;

        S.pos[o]     = flat[a]     + (flat[b]     - flat[a])     * m + S.off[o];
        S.pos[o + 1] = flat[a + 1] + (flat[b + 1] - flat[a + 1]) * m + S.off[o + 1] + wob;
        S.pos[o + 2] = flat[a + 2] + (flat[b + 2] - flat[a + 2]) * m + S.off[o + 2];
      }
      S.geo.attributes.position.needsUpdate = true;
    }

    for (var d2 = 0; d2 < DUST; d2++) {
      dPos[d2 * 3 + 1] += dSpd[d2];
      if (dPos[d2 * 3 + 1] > 11) dPos[d2 * 3 + 1] = -11;
    }
    dGeo.attributes.position.needsUpdate = true;

    // parallax + scroll dolly
    ease.x += (mouse.x - ease.x) * 0.045;
    ease.y += (mouse.y - ease.y) * 0.045;

    world.rotation.y = ease.x * 0.16 + Math.sin(t * 0.12) * 0.03;
    world.rotation.x = -ease.y * 0.10;
    world.rotation.z = -0.05 + ease.x * 0.02;
    world.position.y = 0.7 + scrollP * 2.6;

    camera.position.z = 13 + scrollP * 7;
    camera.position.x = ease.x * 0.8;
    camera.position.y = -ease.y * 0.5;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  /* one static, composed frame for prefers-reduced-motion */
  function drawStatic() {
    streams.forEach(function (S) {
      for (var k = 0; k < S.n; k++) {
        var fl = baked[S.curve[k]], k0 = ((S.u[k] * (SAMPLES - 1)) | 0) * 3, ko = k * 3;
        S.pos[ko]     = fl[k0]     + S.off[ko];
        S.pos[ko + 1] = fl[k0 + 1] + S.off[ko + 1];
        S.pos[ko + 2] = fl[k0 + 2] + S.off[ko + 2];
      }
      S.geo.attributes.position.needsUpdate = true;
    });
    world.position.y = 0.7;
    renderer.render(scene, camera);
  }

  resize();

  if (reduced) {
    drawStatic();
    // the preloader lifting changes layout without firing resize
    window.addEventListener('load', drawStatic);
    setTimeout(drawStatic, 2400);
  } else {
    requestAnimationFrame(step);
  }
})();
