/* =============================================================
   ORYX — DESIGN 03 interactions
   No WebGL here by design. Motion comes from clip-path wipes, a
   cursor-tracked preview, a drawn timeline and marquees.
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

  /* ================= PRELOADER ================= */
  (function () {
    var n = qs('#ldN'), body = document.body, p = 0, done = false, loaded = false;
    window.addEventListener('load', function () { loaded = true; });
    function finish() {
      if (done) return;
      done = true; clearInterval(t);
      body.classList.add('ld-out'); body.classList.remove('is-loading');
      setTimeout(function () { body.classList.add('ld-gone'); start(); }, 800);
    }
    var t = setInterval(function () {
      p += loaded ? 11 + Math.random() * 16 : 3 + Math.random() * 7;
      if (p > 100) p = 100;
      if (n) n.textContent = Math.round(p);
      if (p >= 100) setTimeout(finish, 180);
    }, 90);
    setTimeout(finish, 5000);
  })();

  /* ================= MOBILE SHEET ================= */
  (function () {
    var b = qs('#bar3b'), sheet = qs('#sheet');
    if (!b || !sheet) return;
    function close() {
      document.body.classList.remove('sheet-on');
      b.setAttribute('aria-expanded', 'false');
      sheet.setAttribute('aria-hidden', 'true');
    }
    b.addEventListener('click', function () {
      var on = document.body.classList.toggle('sheet-on');
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
      sheet.setAttribute('aria-hidden', on ? 'false' : 'true');
      b.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    });
    qsa('a', sheet).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  /* ================= REVEALS ================= */
  function initUp() {
    var items = qsa('[data-up]').concat(qsa('.poster__h .ln'));
    items.forEach(function (el) {
      if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay + 'ms');
    });
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('on'); });
      return;
    }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
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

  /* ================= WIPE PANELS + DRAWN TIMELINE =================
     Driven from the scroll loop, NOT IntersectionObserver. The panels start
     at clip-path: inset(0 0 100% 0), and a clipped element reports zero
     intersection area — so an observer waiting for it to become visible can
     never fire. getBoundingClientRect ignores clip-path, so it can. */
  var wipes = [], flowEl = null;
  function initWipe() {
    wipes = qsa('[data-wipe]').map(function (el) { return { el: el, done: false }; });
    flowEl = qs('#flowl');
    if (reduced) {
      wipes.forEach(function (w) { w.el.classList.add('on'); w.done = true; });
      if (flowEl) flowEl.classList.add('drawn');
      wipes = []; flowEl = null;
    }
  }
  function runWipe() {
    var vh = window.innerHeight, live = false;
    for (var i = 0; i < wipes.length; i++) {
      var w = wipes[i];
      if (w.done) continue;
      live = true;
      var r = w.el.getBoundingClientRect();
      if (r.top < vh - 90 && r.bottom > 0) { w.el.classList.add('on'); w.done = true; }
    }
    if (!live) wipes = [];

    if (flowEl) {
      var fr = flowEl.getBoundingClientRect();
      if (fr.top < vh - 120 && fr.bottom > 0) { flowEl.classList.add('drawn'); flowEl = null; }
    }
  }

  /* ================= CURSOR PREVIEW OVER THE TRADE INDEX ================= */
  function initPeek() {
    var peek = qs('#peek'), list = qs('#idxl');
    if (!peek || !list || !fine || reduced) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function loop() {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      peek.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px) translate(-50%,-50%)';
      raf = requestAnimationFrame(loop);
    }

    qsa('li', list).forEach(function (li) {
      li.addEventListener('pointerenter', function () {
        var img = li.dataset.img;
        if (img) peek.style.backgroundImage = "url('" + img + "')";
        document.body.classList.add('peek-on');
      });
    });
    list.addEventListener('pointerleave', function () {
      document.body.classList.remove('peek-on');
    });
    list.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) { cx = tx; cy = ty; loop(); }
    });
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
        var t0 = now(), dur = 1500;
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

  /* ================= RAIL ACTIVE STATE ================= */
  function initRail() {
    if (!('IntersectionObserver' in window)) return;
    var links = qsa('.rail3__nav a');
    var map = {};
    links.forEach(function (l) { map[l.dataset.r] = l; });
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

  /* ================= QUOTE ROTATOR ================= */
  function initSay() {
    var track = qs('#say3t'), dots = qs('#say3d');
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
      items.forEach(function (el, k) { el.classList.toggle('is-live', k === i); });
      btns.forEach(function (el, k) { el.classList.toggle('on', k === i); });
    }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(function () { go(i + 1); }, 6500); }
    restart();
    track.addEventListener('pointerenter', function () { clearInterval(timer); });
    track.addEventListener('pointerleave', restart);
  }

  /* ================= FORM ================= */
  function initForm() {
    var form = qs('#f3'); if (!form) return;
    var st = qs('#f3s');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = qs('#n3'), p = qs('#p3'), ok = true;
      [n, p].forEach(function (f) {
        var bad = !f.value.trim();
        f.parentNode.classList.toggle('bad', bad);
        if (bad) ok = false;
      });
      if (!ok) { st.textContent = 'Please add your name and phone number.'; return; }

      var text = encodeURIComponent([
        'New enquiry — Oryx for Car Accessories',
        'Name: ' + n.value.trim(),
        'Phone: ' + p.value.trim(),
        'Car: ' + (qs('#c3').value.trim() || '—'),
        'Service: ' + qs('#s3').value,
        'Details: ' + (qs('#m3').value.trim() || '—')
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
      f.addEventListener('input', function () { f.parentNode.classList.remove('bad'); });
    });
  }

  /* ================= ANCHORS ================= */
  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function initAnchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        window.scrollTo({ top: docTop(t) - (window.innerWidth <= 1024 ? 70 : 0), behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ================= LOOP ================= */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      document.body.classList.toggle('deep', window.pageYOffset > 520);
      runWipe(); runCount();
      ticking = false;
    });
  }

  /* ================= BOOT ================= */
  var started = false;
  function start() {
    if (started) return;
    started = true;

    initMarquee('.strip__t', 'span', 58);
    initUp(); initWipe(); initPeek(); initCount();
    initRail(); initSay(); initForm(); initAnchors();

    var y = qs('#yr3'); if (y) y.textContent = new Date().getFullYear();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    document.body.classList.toggle('deep', window.pageYOffset > 520);
    runWipe(); runCount();
  }
})();
