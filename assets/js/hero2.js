/* =============================================================
   ORYX — DESIGN 02 hero scene
   A real 3D car — the Khronos "ToyCar" sample asset (CC0), lit with
   a studio environment for genuine PBR paint/clearcoat/glass
   reflections — replacing the earlier wire-outline sketch with an
   actual dimensional model. Rendered on a transparent canvas so the
   paper background shows through.
   ============================================================= */
import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/environments/RoomEnvironment.js';

(async function () {
  'use strict';

  var canvas = document.getElementById('ribbon');
  if (!canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bail() { canvas.style.display = 'none'; document.body.classList.add('no-gl'); }

  try {
    var probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { bail(); return; }
  } catch (e) { bail(); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) { bail(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.5, 8.4);
  camera.lookAt(0, -0.1, 0);

  var group = new THREE.Group();
  group.rotation.z = -0.05;
  scene.add(group);

  /* ---------- studio environment, for reflections a flat directional
     light can't give PBR paint/glass/clearcoat ---------- */
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  var key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(4, 6, 6);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xd9c9cc, 0.4);
  fill.position.set(-6, -1, 4);
  scene.add(fill);

  /* ---------- contact shadow ----------
     A soft blurred ellipse under the car, facing the camera — keeps
     it grounded without a full ground-plane/shadow-map setup. */
  function makeShadowTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(20,14,16,0.55)');
    g.addColorStop(0.6, 'rgba(20,14,16,0.22)');
    g.addColorStop(1, 'rgba(20,14,16,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  var shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.0, 1.8),
    new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false })
  );
  shadowMesh.position.set(0, -0.95, -0.4);
  scene.add(shadowMesh);

  /* ---------- load the car ----------
     Khronos "ToyCar" sample asset (CC0, khronos glTF-Sample-Assets).
     Auto-fit into the scene: recenter on its own bounding box, then
     scale so its length maps to a fixed number of world units
     regardless of the source model's native (real-world-metre)
     scale. */
  var rig = new THREE.Group();
  group.add(rig);

  var loader = new GLTFLoader();
  var model;
  try {
    var gltf = await loader.loadAsync('assets/models/toycar.glb');
    // the source scene also bundles a photo-backdrop "Fabric" plane and
    // unused camera rigs alongside the actual car nodes — keep only the
    // car body and its glass
    model = new THREE.Group();
    var carNode = gltf.scene.getObjectByName('ToyCar');
    var glassNode = gltf.scene.getObjectByName('Glass');
    if (carNode) model.add(carNode);
    if (glassNode) model.add(glassNode);
    if (!model.children.length) { bail(); return; }
  } catch (e) { bail(); return; }

  var box = new THREE.Box3().setFromObject(model);
  var size = new THREE.Vector3(); box.getSize(size);
  var center = new THREE.Vector3(); box.getCenter(center);
  model.position.sub(center);
  model.rotation.y = Math.PI * -0.14;   // front-3/4 angle (rear-facing default + 180°)

  var TARGET_LEN = 5.3;
  var footprint = Math.max(size.x, size.z);
  var scale = footprint > 0 ? TARGET_LEN / footprint : 1;
  rig.scale.setScalar(scale);
  var restY = (size.y / 2) * scale - 0.85;
  rig.position.y = restY;
  rig.add(model);

  // fade + rise on the way in, same easing feel as the rest of the hero
  var mats = [];
  model.traverse(function (o) {
    if (o.isMesh && o.material) {
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.opacity = 0;
      mats.push(o.material);

      // the source paint job is green with an orange stripe — recolour
      // just the saturated (painted) texels to the brand red in-shader,
      // leaving the chrome trim and black tyres (already near-neutral,
      // low-saturation pixels in the same texture) alone
      if (o.material.name === 'ToyCar') {
        o.material.onBeforeCompile = function (shader) {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            '#include <map_fragment>\n' +
            '{\n' +
            '  float mx = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b);\n' +
            '  float mn = min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b);\n' +
            '  float sat = mx > 0.0001 ? (mx - mn) / mx : 0.0;\n' +
            '  if (sat > 0.22) {\n' +
            '    float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));\n' +
            '    vec3 brand = vec3(0.478, 0.122, 0.180) * (0.55 + luma);\n' +
            '    diffuseColor.rgb = mix(diffuseColor.rgb, brand, 0.92);\n' +
            '  }\n' +
            '}\n'
          );
        };
      }
    }
  });
  rig.position.y = restY - 0.4;

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
    camera.fov = w < 620 ? 46 : 40;
    camera.updateProjectionMatrix();
    if (reduced) drawStatic();
  }
  window.addEventListener('resize', resize);

  function drawStatic() {
    mats.forEach(function (m) { m.opacity = 1; });
    rig.position.y = restY;
    group.rotation.y = 0.32;
    renderer.render(scene, camera);
  }

  function step(now) {
    requestAnimationFrame(step);
    if (!visible) { last = now; t0 = t0 === null ? now : t0; return; }
    if (t0 === null) t0 = now;
    last = now;

    var el = (now - t0) / 1000;
    var tm = now * 0.001;

    var p = Math.min(1, el / 1.1);
    p = 1 - Math.pow(1 - p, 3);
    mats.forEach(function (m) { m.opacity = p; });
    rig.position.y = restY - (1 - p) * 0.4;

    ease.x += (mouse.x - ease.x) * 0.08;
    ease.y += (mouse.y - ease.y) * 0.08;

    // perpetual sway so the car keeps moving even without the cursor
    // over it — bounded oscillation only, with the mouse-follow
    // (ease.x/y) and scroll layer riding on top
    group.rotation.y = 0.32 + ease.x * 0.22 + Math.sin(tm * 0.5) * 0.16;
    group.rotation.x = -ease.y * 0.16 + Math.sin(tm * 0.38) * 0.08;
    group.rotation.z = -0.05 - scrollP * 0.18 + Math.sin(tm * 0.24) * 0.04;
    group.position.y = scrollP * 0.6 + Math.sin(tm * 0.42) * 0.1;
    group.position.x = Math.sin(tm * 0.28) * 0.06;
    shadowMesh.position.x = group.position.x * 0.6;
    shadowMesh.position.y = -0.95 + group.position.y * 0.15;

    renderer.render(scene, camera);
  }

  resize();
  if (reduced) drawStatic();
  else requestAnimationFrame(step);
})();
