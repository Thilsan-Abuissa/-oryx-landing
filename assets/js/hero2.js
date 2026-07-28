/* =============================================================
   ORYX — DESIGN 02 hero scene
   Shaded 3D ribbons tracing the swoosh from the logo. Solid, lit
   geometry on a transparent canvas so the paper background shows —
   deliberately the opposite of design 01's dark particle field.
   ============================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('ribbon');
  if (!canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bail() { canvas.style.display = 'none'; document.body.classList.add('no-gl'); }
  if (typeof THREE === 'undefined') { bail(); return; }
  try {
    var probe = document.createElement('canvas');
    if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) { bail(); return; }
  } catch (e) { bail(); return; }

  var RIBBONS = 5;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9.2);

  var group = new THREE.Group();
  group.rotation.z = -0.08;
  scene.add(group);

  /* ---------- light: one key from upper right, one cool fill ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  var key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 6, 6);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xd9c9cc, 0.5);
  fill.position.set(-6, -2, 3);
  scene.add(fill);

  /* ---------- materials ---------- */
  function mat(hex, rough, metal) {
    return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  }
  var MATS = [
    mat(0x7a1f2e, 0.34, 0.22),
    mat(0xb9bfc4, 0.26, 0.55),
    mat(0x9a3243, 0.38, 0.18),
    mat(0x58101c, 0.32, 0.26),
    mat(0xcfd4d8, 0.3, 0.45)
  ];

  /* ---------- ribbons ---------- */
  function makeCurve(i) {
    var pts = [];
    for (var s = 0; s <= 6; s++) {
      var t = s / 6;
      var x = -5.2 + t * 10.4;
      var y = Math.sin(t * Math.PI * 0.95 + i * 0.52) * (1.45 + i * 0.15)
            + (i - (RIBBONS - 1) / 2) * 0.62 - 0.25;
      var z = Math.cos(t * Math.PI * 0.8 + i * 0.72) * 1.35;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.42);
  }

  var tubes = [];
  for (var i = 0; i < RIBBONS; i++) {
    var r = 0.075 + (i % 2 === 0 ? 0.095 : 0.035);
    var geo = new THREE.TubeGeometry(makeCurve(i), 190, r, 16, false);
    var mesh = new THREE.Mesh(geo, MATS[i % MATS.length]);
    group.add(mesh);
    tubes.push({ geo: geo, total: geo.index ? geo.index.count : 0, delay: i * 0.16 });
    if (geo.index) geo.setDrawRange(0, 0);   // drawn on during the intro
  }

  /* ---------- interaction ---------- */
  var mouse = { x: 0, y: 0 }, ease = { x: 0, y: 0 };
  var visible = true, last = 0, t0 = null, scrollP = 0;

  window.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });

  window.addEventListener('scroll', function () {
    scrollP = Math.min(1, Math.max(0, window.pageYOffset / (window.innerHeight || 800)));
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; },
      { threshold: 0 }).observe(canvas);
  }

  function resize() {
    var w = canvas.clientWidth || 400, h = canvas.clientHeight || 400;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 620 ? 54 : 45;
    camera.updateProjectionMatrix();
    if (reduced) drawStatic();
  }
  window.addEventListener('resize', resize);

  function drawStatic() {
    tubes.forEach(function (t) { if (t.total) t.geo.setDrawRange(0, t.total); });
    group.rotation.y = 0.12;
    renderer.render(scene, camera);
  }

  function step(now) {
    requestAnimationFrame(step);
    if (!visible) { last = now; t0 = t0 === null ? now : t0; return; }
    if (t0 === null) t0 = now;
    last = now;

    var el = (now - t0) / 1000;
    var tm = now * 0.001;

    // intro draw-on, staggered per ribbon
    for (var i = 0; i < tubes.length; i++) {
      var tb = tubes[i];
      if (!tb.total) continue;
      var p = Math.min(1, Math.max(0, (el - tb.delay) / 1.6));
      p = 1 - Math.pow(1 - p, 3);
      tb.geo.setDrawRange(0, Math.floor(tb.total * p));
    }

    ease.x += (mouse.x - ease.x) * 0.05;
    ease.y += (mouse.y - ease.y) * 0.05;

    group.rotation.y = 0.42 + ease.x * 0.34 + Math.sin(tm * 0.16) * 0.1;
    group.rotation.x = -ease.y * 0.2 + Math.sin(tm * 0.12) * 0.05;
    group.rotation.z = -0.08 - scrollP * 0.24;
    group.position.y = scrollP * 0.9;

    renderer.render(scene, camera);
  }

  resize();
  if (reduced) drawStatic();
  else requestAnimationFrame(step);
})();
