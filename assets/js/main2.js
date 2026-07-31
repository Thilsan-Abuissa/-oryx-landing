/* =============================================================
   ORYX — DESIGN 02 interactions
   preloader · rail · header · index overlay · reveals · horizontal
   specialities · counters · accordion · quote · form · parallax
   ============================================================= */
(function () {
  'use strict';

  var CONFIG = {
    whatsapp: '97433122200',                  // digits only, with country code
    email:    'info@oryxcaraccessories.qa'
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs  = function (s, c) { return (c || document).querySelector(s); };
  var qsa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var now = function () { return (window.performance && performance.now) ? performance.now() : +new Date(); };
  /* i18n.js provides the lookup on the bilingual pages; elsewhere the
     English passes straight through */
  var T = function (s) { return window.ORYX_T ? window.ORYX_T(s) : s; };

  /* ================= PRELOADER ================= */
  (function () {
    var fill = qs('#preFill'), body = document.body;
    var p = 0, done = false, loaded = false;
    window.addEventListener('load', function () { loaded = true; });

    function finish() {
      if (done) return;
      done = true; clearInterval(tick);
      body.classList.add('pre-out');
      body.classList.remove('is-loading');
      setTimeout(function () { body.classList.add('pre-gone'); start(); }, 850);
    }
    var tick = setInterval(function () {
      p += loaded ? 10 + Math.random() * 15 : 3 + Math.random() * 6;
      if (p > 100) p = 100;
      if (fill) fill.style.width = p + '%';
      if (p >= 100) setTimeout(finish, 200);
    }, 90);
    setTimeout(finish, 5000);
  })();

  /* ================= HEADER + RAIL ================= */
  var top = qs('#top'), rail = qs('#railFill'), lastY = 0;
  function chrome() {
    var y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (rail) rail.style.height = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (top) {
      top.classList.toggle('is-solid', y > 30);
      top.classList.toggle('is-up', y > 420 && y > lastY && !document.body.classList.contains('idx-open'));
    }
    document.body.classList.toggle('far', y > 560);
    lastY = y;
  }

  /* ================= INDEX OVERLAY ================= */
  (function () {
    var b = qs('#menub'), idx = qs('#idx');
    if (!b || !idx) return;
    function close() {
      document.body.classList.remove('idx-open');
      b.setAttribute('aria-expanded', 'false');
      idx.setAttribute('aria-hidden', 'true');
    }
    b.addEventListener('click', function () {
      var open = document.body.classList.toggle('idx-open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      idx.setAttribute('aria-hidden', open ? 'false' : 'true');
      b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    qsa('a', idx).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  /* ================= REVEALS ================= */
  function initReveal() {
    // wrap each masked line so it can slide up behind its own edge
    qsa('[data-mask]').forEach(function (h) {
      qsa('span', h).forEach(function (s) {
        if (!qs('i', s)) s.innerHTML = '<i>' + s.innerHTML + '</i>';
      });
    });

    var items = qsa('[data-rise],[data-mask]');
    items.forEach(function (el) {
      if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay + 'ms');
    });

    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
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

  /* ================= PARALLAX (work images) ================= */
  var shifts = [];
  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function measure() { shifts.forEach(function (s) { s.top = docTop(s.el); s.h = s.el.offsetHeight; }); }
  function initShift() {
    if (reduced) return;
    shifts = qsa('[data-shift]').map(function (el) {
      return { el: el, k: parseFloat(el.dataset.shift) || 0.05, top: 0, h: 0 };
    });
    measure();
    window.addEventListener('load', measure);
  }
  function runShift() {
    var vh = window.innerHeight, y = window.pageYOffset;
    for (var i = 0; i < shifts.length; i++) {
      var s = shifts[i], t = s.top - y;
      if (t + s.h < -200 || t > vh + 200) continue;
      s.el.style.transform = 'translate3d(0,' + ((t + s.h / 2 - vh / 2) * s.k).toFixed(2) + 'px,0)';
    }
  }

  /* ================= HORIZONTAL SPECIALITIES ================= */
  var hz = null;
  function initHz() {
    var sec = qs('#services'), track = qs('#hTrack'), num = qs('#hNum');
    if (!sec || !track) return;
    hz = { sec: sec, track: track, num: num, cards: qsa('.hcard', track), last: -1 };
  }
  function runHz() {
    if (!hz) return;
    if (window.innerWidth <= 900) { hz.track.style.transform = ''; return; }
    var r = hz.sec.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return;
    var p = clamp(-r.top / total, 0, 1);
    var dist = hz.track.scrollWidth - window.innerWidth;
    if (dist < 0) dist = 0;
    // in Arabic the track is laid out from the right edge, so the cards
    // are revealed by travelling the other way
    var way = document.documentElement.dir === 'rtl' ? 1 : -1;
    hz.track.style.transform = 'translate3d(' + (way * p * dist).toFixed(1) + 'px,0,0)';
    if (hz.num) {
      var i = clamp(Math.round(p * (hz.cards.length - 1)), 0, hz.cards.length - 1);
      if (i !== hz.last) { hz.last = i; hz.num.textContent = '0' + (i + 1); }
    }
  }

  /* ================= COUNTERS ================= */
  var counters = [];
  function initCounters() {
    counters = qsa('[data-count]').map(function (el) {
      return { el: el, to: parseFloat(el.dataset.count) || 0, sfx: el.dataset.suffix || '', run: false };
    });
  }
  function runCounters() {
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

  /* ================= ACCORDION ================= */
  function initAcc() {
    var acc = qs('#acc'); if (!acc) return;
    var items = qsa('.acc__i', acc);

    function open(item) {
      items.forEach(function (it) {
        var on = it === item;
        var panel = qs('.acc__p', it), btn = qs('button', it);
        it.classList.toggle('is-open', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        panel.style.height = on ? panel.scrollHeight + 'px' : '0px';
      });
    }
    items.forEach(function (it) {
      qs('button', it).addEventListener('click', function () {
        open(it.classList.contains('is-open') ? null : it);
      });
    });
    open(qs('.acc__i.is-open', acc) || items[0]);
    window.addEventListener('resize', function () {
      var cur = qs('.acc__i.is-open', acc);
      if (!cur) return;
      // scrollHeight never reports less than the height already pinned on the
      // box, so release it first — otherwise a panel that needs less room than
      // last time (a narrower window, a shorter translation) stays too tall
      var panel = qs('.acc__p', cur);
      panel.style.height = 'auto';
      panel.style.height = panel.scrollHeight + 'px';
    });
  }

  /* ================= QUOTE SLIDER ================= */
  function initQuote() {
    var track = qs('#quoTrack'), dots = qs('#quoDots');
    if (!track || !dots) return;
    var items = qsa('.quo__i', track), idx = 0, timer;

    items.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      if (i === 0) b.classList.add('is-on');
      b.addEventListener('click', function () { go(i); restart(); });
      dots.appendChild(b);
    });
    var btns = qsa('button', dots);
    function go(i) {
      idx = (i + items.length) % items.length;
      items.forEach(function (el, n) { el.classList.toggle('is-on', n === idx); });
      btns.forEach(function (el, n) { el.classList.toggle('is-on', n === idx); });
    }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(function () { go(idx + 1); }, 6500); }
    restart();
    track.addEventListener('pointerenter', function () { clearInterval(timer); });
    track.addEventListener('pointerleave', restart);
  }

  /* ================= FORM → WHATSAPP ================= */
  function initForm() {
    var form = qs('#f2'); if (!form) return;
    var st = qs('#f2st');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = qs('#n2'), p = qs('#p2'), ok = true;
      [n, p].forEach(function (f) {
        var bad = !f.value.trim();
        f.parentNode.classList.toggle('err', bad);
        if (bad) ok = false;
      });
      if (!ok) { st.textContent = T('Please add your name and phone number.'); return; }

      var text = encodeURIComponent([
        'New enquiry — Oryx for Car Accessories',
        'Name: ' + n.value.trim(),
        'Phone: ' + p.value.trim(),
        'Car: ' + (qs('#c2').value.trim() || '—'),
        'Service: ' + qs('#s2').value,
        'Details: ' + (qs('#m2').value.trim() || '—')
      ].join('\n'));

      st.textContent = T('Opening WhatsApp…');
      var w = window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + text, '_blank', 'noopener');
      if (!w) {
        window.location.href = 'mailto:' + CONFIG.email +
          '?subject=' + encodeURIComponent('Quote request — ' + n.value.trim()) + '&body=' + text;
      }
      setTimeout(function () { st.textContent = T('Thanks — we\'ll reply shortly.'); }, 1200);
    });
    qsa('input,textarea', form).forEach(function (f) {
      f.addEventListener('input', function () { f.parentNode.classList.remove('err'); });
    });
  }

  /* ================= ACTIVE NAV + ANCHORS ================= */
  function initNavState() {
    if (!('IntersectionObserver' in window)) return;
    var links = qsa('.top__nav a');
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute('href').slice(1);
      if (id) map[id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-on'); });
        if (map[en.target.id]) map[en.target.id].classList.add('is-on');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id); if (s) io.observe(s);
    });
  }

  function initAnchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        window.scrollTo({ top: docTop(t) - 10, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ================= LOOP ================= */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      chrome(); runShift(); runHz(); runCounters();
      ticking = false;
    });
  }

  /* ================= BOOT ================= */
  var started = false;
  function start() {
    if (started) return;
    started = true;

    initMarquee('.tick__t', '.tick__s', 42);
    initReveal(); initShift(); initHz(); initCounters();
    initAcc(); initQuote(); initForm(); initNavState(); initAnchors();

    var y = qs('#yr2'); if (y) y.textContent = new Date().getFullYear();

    var rt;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); onScroll(); }, 120);
      onScroll();
    });
    chrome(); runShift(); runHz(); runCounters();
  }
})();
