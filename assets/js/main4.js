/* =============================================================
   ORYX — DESIGN 04 interactions
   Glass: blur-in reveals, cursor light across panels, a 3D-tilting
   hero pane, a glowing process line, counters. No WebGL.
   ============================================================= */
(function () {
  'use strict';

  var CONFIG = {
    whatsapp: '97433122200',                 // digits only, with country code
    email:    'info@oryxcaraccessories.qa'
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var qs  = function (s, c) { return (c || document).querySelector(s); };
  var qsa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var now = function () { return (window.performance && performance.now) ? performance.now() : +new Date(); };
  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }

  /* ================= PRELOADER ================= */
  (function () {
    var fill = qs('#bootFill'), body = document.body, p = 0, done = false, loaded = false;
    window.addEventListener('load', function () { loaded = true; });
    function finish() {
      if (done) return;
      done = true; clearInterval(t);
      body.classList.add('boot-out'); body.classList.remove('is-loading');
      setTimeout(function () { body.classList.add('boot-gone'); start(); }, 720);
    }
    var t = setInterval(function () {
      p += loaded ? 11 + Math.random() * 15 : 3 + Math.random() * 6;
      if (p > 100) p = 100;
      if (fill) fill.style.width = p + '%';
      if (p >= 100) setTimeout(finish, 180);
    }, 90);
    setTimeout(finish, 5000);
  })();

  /* ================= NAV ================= */
  var nav = qs('#nav4'), lastY = 0;
  function chrome() {
    var y = window.pageYOffset;
    if (nav) nav.classList.toggle('up', y > 460 && y > lastY && !document.body.classList.contains('drop-on'));
    document.body.classList.toggle('low', y > 520);
    lastY = y;
  }

  (function () {
    var b = qs('#nav4b'), drop = qs('#drop');
    if (!b || !drop) return;
    function close() {
      document.body.classList.remove('drop-on');
      b.setAttribute('aria-expanded', 'false');
      drop.setAttribute('aria-hidden', 'true');
    }
    b.addEventListener('click', function () {
      var on = document.body.classList.toggle('drop-on');
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
      drop.setAttribute('aria-hidden', on ? 'false' : 'true');
      b.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    });
    qsa('a', drop).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  /* ================= BLUR-IN REVEALS ================= */
  function initFade() {
    var items = qsa('[data-fade]').concat(qsa('.rise'));
    items.forEach(function (el) {
      if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay + 'ms');
    });
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }


  /* ================= MARQUEE =================
     Two copies of the text is not enough on a wide screen: after travelling
     -50% the strip runs out and leaves a blank gap. Clone until half the
     track is comfortably wider than the viewport, and set the duration from
     the distance so the speed stays the same at every screen size. */
  function initMarquee(trackSel, setSel, pxPerSec) {
    var track = qs(trackSel);
    if (!track) return;
    var seed = qs(setSel, track);
    if (!seed) return;

    function fill() {
      var one = seed.getBoundingClientRect().width;
      if (!one) return;
      // must stay even — the animation travels exactly half the track
      var want = Math.max(2, Math.ceil((window.innerWidth * 1.15) / one) * 2);
      var have = qsa(setSel, track).length;
      for (var i = have; i < want; i++) track.appendChild(seed.cloneNode(true));
      while (qsa(setSel, track).length > want) track.removeChild(track.lastChild);
      var travel = (qsa(setSel, track).length / 2) * one;
      track.style.animationDuration = (travel / pxPerSec).toFixed(1) + 's';
    }
    fill();
    window.addEventListener('resize', fill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fill);
  }

  /* ================= CURSOR LIGHT ACROSS GLASS ================= */
  function initLit() {
    if (!fine || reduced) return;
    qsa('[data-lit]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      });
    });
  }

  /* ================= 3D TILT ON THE HERO PANE ================= */
  function initTilt() {
    var card = qs('[data-tilt4]');
    if (!card || !fine || reduced) return;
    var host = qs('#pane'), raf = null;
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        card.style.transform = 'rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' +
          (-py * 5).toFixed(2) + 'deg) translateZ(0)';
      });
    });
    host.addEventListener('pointerleave', function () { card.style.transform = ''; });
  }

  /* ================= PARALLAX ON GALLERY IMAGES ================= */
  var slides = [];
  function initSlide() {
    if (reduced) return;
    slides = qsa('[data-slide]').map(function (el) {
      return { el: el, k: parseFloat(el.dataset.slide) || 0.03, top: 0, h: 0 };
    });
    measure();
    window.addEventListener('load', measure);
  }
  function measure() { slides.forEach(function (s) { s.top = docTop(s.el); s.h = s.el.offsetHeight; }); }
  function runSlide() {
    var vh = window.innerHeight, y = window.pageYOffset;
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i], t = s.top - y;
      if (t + s.h < -200 || t > vh + 200) continue;
      s.el.style.transform = 'translate3d(0,' + ((t + s.h / 2 - vh / 2) * s.k).toFixed(2) + 'px,0)';
    }
  }

  /* ================= PROCESS LINE ================= */
  var lineHost = null, lineFill = null;
  function initLine() {
    lineHost = qs('#line4'); lineFill = qs('#line4fill');
    if (reduced && lineFill) lineFill.style.height = '100%';
  }
  function runLine() {
    if (!lineHost || !lineFill || reduced) return;
    var r = lineHost.getBoundingClientRect(), vh = window.innerHeight;
    // fills as the panel travels from the lower third up past the middle
    var p = clamp((vh * 0.78 - r.top) / (r.height + vh * 0.24), 0, 1);
    lineFill.style.height = (p * 100).toFixed(1) + '%';
  }

  /* ================= COUNTERS ================= */
  var counters = [];
  function initCount() {
    counters = qsa('[data-count]').map(function (el) {
      return { el: el, to: parseFloat(el.dataset.count) || 0, sfx: el.dataset.suffix || '', run: false };
    });
  }
  function runCount() {
    if (!counters.length) return;
    var vh = window.innerHeight, alive = false;
    for (var i = 0; i < counters.length; i++) {
      var c = counters[i];
      if (c.run) continue;
      alive = true;
      var r = c.el.getBoundingClientRect();
      if (r.top > vh - 60 || r.bottom < 0) continue;
      c.run = true;
      if (reduced) { c.el.textContent = c.to + c.sfx; continue; }
      (function (c) {
        var t0 = now(), dur = 1600;
        function anim() {
          var p = clamp((now() - t0) / dur, 0, 1);
          if (!isFinite(p)) p = 1;
          c.el.textContent = Math.round(c.to * (1 - Math.pow(1 - p, 3))) + c.sfx;
          if (p < 1) requestAnimationFrame(anim);
        }
        anim();
        setTimeout(function () { c.el.textContent = c.to + c.sfx; }, dur + 400);
      })(c);
    }
    if (!alive) counters = [];
  }

  /* ================= NAV ACTIVE ================= */
  function initNavState() {
    if (!('IntersectionObserver' in window)) return;
    var links = qsa('.nav4__links a'), map = {};
    links.forEach(function (l) {
      var id = l.getAttribute('href').slice(1);
      if (id) map[id] = l;
    });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('on'); });
        if (map[e.target.id]) map[e.target.id].classList.add('on');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id); if (s) io.observe(s);
    });
  }

  /* ================= WORDS ROTATOR ================= */
  function initWords() {
    var track = qs('#wordsT'), dots = qs('#wordsD');
    if (!track || !dots) return;
    var items = qsa('blockquote', track), i = 0, timer;
    items.forEach(function (_, n) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Testimonial ' + (n + 1));
      if (n === 0) b.classList.add('on');
      b.addEventListener('click', function () { go(n); restart(); });
      dots.appendChild(b);
    });
    var btns = qsa('button', dots);
    function go(n) {
      i = (n + items.length) % items.length;
      items.forEach(function (el, k) { el.classList.toggle('live', k === i); });
      btns.forEach(function (el, k) { el.classList.toggle('on', k === i); });
    }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(function () { go(i + 1); }, 7000); }
    restart();
    track.addEventListener('pointerenter', function () { clearInterval(timer); });
    track.addEventListener('pointerleave', restart);
  }

  /* ================= FORM ================= */
  function initForm() {
    var form = qs('#f4'); if (!form) return;
    var st = qs('#f4s');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = qs('#n4'), p = qs('#p4'), ok = true;
      [n, p].forEach(function (f) {
        var bad = !f.value.trim();
        f.parentNode.classList.toggle('no', bad);
        if (bad) ok = false;
      });
      if (!ok) { st.textContent = 'Please add your name and phone number.'; return; }

      var text = encodeURIComponent([
        'New enquiry — Oryx for Car Accessories',
        'Name: ' + n.value.trim(),
        'Phone: ' + p.value.trim(),
        'Car: ' + (qs('#c4').value.trim() || '—'),
        'Service: ' + qs('#s4').value,
        'Details: ' + (qs('#m4').value.trim() || '—')
      ].join('\n'));

      st.textContent = 'Opening WhatsApp…';
      var w = window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + text, '_blank', 'noopener');
      if (!w) {
        window.location.href = 'mailto:' + CONFIG.email +
          '?subject=' + encodeURIComponent('Quote request — ' + n.value.trim()) + '&body=' + text;
      }
      setTimeout(function () { st.textContent = 'Thanks — we\'ll reply shortly.'; }, 1200);
    });
    qsa('input,textarea', form).forEach(function (f) {
      f.addEventListener('input', function () { f.parentNode.classList.remove('no'); });
    });
  }

  /* ================= ANCHORS ================= */
  function initAnchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        window.scrollTo({ top: docTop(t) - 80, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ================= LOOP ================= */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      chrome(); runSlide(); runLine(); runCount();
      ticking = false;
    });
  }

  /* ================= BOOT ================= */
  var started = false;
  function start() {
    if (started) return;
    started = true;

    initMarquee('.belt__t', 'span', 38);
    initFade(); initLit(); initTilt(); initSlide(); initLine();
    initCount(); initNavState(); initWords(); initForm(); initAnchors();

    var y = qs('#yr4'); if (y) y.textContent = new Date().getFullYear();

    var rt;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); onScroll(); }, 120);
      onScroll();
    });
    chrome(); runSlide(); runLine(); runCount();
  }
})();
