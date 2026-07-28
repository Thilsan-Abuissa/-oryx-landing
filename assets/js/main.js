/* =============================================================
   ORYX — interactions
   preloader · cursor · header · menu · reveal · split · parallax
   counters · tilt · magnetic · pinned process · slider · form
   ============================================================= */
(function () {
  'use strict';

  /* -----------------------------------------------------------
     CONFIG — change these two values and the whole page follows
     ----------------------------------------------------------- */
  var CONFIG = {
    whatsapp: '97433122200',                    // digits only, with country code
    email:    'info@oryxcaraccessories.qa'      // fallback if WhatsApp is blocked
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs  = function (s, c) { return (c || document).querySelector(s); };
  var qsa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ================= 1. PRELOADER ================= */
  (function preloader() {
    var fill = qs('#preFill'), num = qs('#preNum'), body = document.body;
    var p = 0, done = false, loaded = false;

    window.addEventListener('load', function () { loaded = true; });

    var tick = setInterval(function () {
      p += loaded ? 9 + Math.random() * 14 : 2.5 + Math.random() * 6;
      if (p >= 100) { p = 100; }
      if (fill) fill.style.width = p + '%';
      if (num) num.textContent = Math.round(p);
      if (p >= 100 && !done) {
        done = true;
        clearInterval(tick);
        setTimeout(function () {
          body.classList.add('is-done');
          body.classList.remove('is-loading');
          setTimeout(function () { body.classList.add('is-gone'); start(); }, 950);
        }, 220);
      }
    }, 90);

    // hard safety net
    setTimeout(function () {
      if (!done) {
        done = true; clearInterval(tick);
        body.classList.add('is-done'); body.classList.remove('is-loading');
        setTimeout(function () { body.classList.add('is-gone'); start(); }, 900);
      }
    }, 5200);
  })();

  /* ================= 2. CUSTOM CURSOR ================= */
  (function cursor() {
    if (!window.matchMedia('(pointer: fine)').matches || reduced) return;
    var el = qs('#cursor'); if (!el) return;
    var dot = qs('.cursor__dot', el), ring = qs('.cursor__ring', el);
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my, woke = false;

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      if (!woke) { woke = true; rx = mx; ry = my; document.body.classList.add('cursor-on'); }
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    var hot = 'a,button,[data-tilt],input,select,textarea,.says__box';
    document.addEventListener('pointerover', function (e) {
      if (e.target.closest && e.target.closest(hot)) document.body.classList.add('cursor-hot');
    });
    document.addEventListener('pointerout', function (e) {
      if (e.target.closest && e.target.closest(hot)) document.body.classList.remove('cursor-hot');
    });
  })();

  /* ================= 3. HEADER + SCROLL PROGRESS ================= */
  var header = qs('#header'), bar = qs('#scrollBar');
  var lastY = 0;

  function onScrollChrome() {
    var y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > 420 && y > lastY && !document.body.classList.contains('menu-open'));
    }
    document.body.classList.toggle('is-scrolled-far', y > 600);
    lastY = y;
  }

  /* ================= 4. MOBILE MENU ================= */
  (function menu() {
    var burger = qs('#burger'), menuEl = qs('#menu');
    if (!burger || !menuEl) return;
    function close() {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      menuEl.setAttribute('aria-hidden', 'true');
    }
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuEl.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    qsa('a', menuEl).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  /* ================= 5. SPLIT HEADINGS ================= */
  function splitWords(el) {
    if (el.dataset.split === 'done') return;
    var out = [], idx = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (piece) {
          if (!piece.trim()) { out.push(' '); return; }
          out.push('<span class="w" style="--wi:' + (idx++) + '"><span>' + piece + '</span></span>');
        });
      } else if (node.nodeType === 1) {
        out.push('<span class="w" style="--wi:' + (idx++) + '"><span>' + node.outerHTML + '</span></span>');
      }
    });
    el.innerHTML = out.join('');
    el.dataset.split = 'done';
  }

  /* ================= 6. REVEAL ON SCROLL ================= */
  function initReveal() {
    var items = qsa('[data-reveal],[data-split]');
    items.forEach(function (el) {
      if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay + 'ms');
      if (el.hasAttribute('data-split')) splitWords(el);
    });

    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ================= 6b. IN-VIEW FLAG =================
     Adds .is-inview with no styling of its own — for animations that need a
     trigger but must not depend on it to be visible (e.g. the SVG draw-on). */
  function initInView() {
    var els = qsa('[data-inview]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('is-inview'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-inview'); io.unobserve(en.target); }
      });
    }, { threshold: 0.18 });
    els.forEach(function (e) { io.observe(e); });
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

  /* ================= 7. PARALLAX =================
     Positions are measured from the offsetTop chain, not getBoundingClientRect —
     rects include the transform we just wrote, which would feed back on itself. */
  var parallaxEls = [];
  function docTop(el) {
    var y = 0;
    while (el) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }
  function measureParallax() {
    parallaxEls.forEach(function (p) {
      p.top = docTop(p.el);
      p.h = p.el.offsetHeight;
    });
  }
  function initParallax() {
    if (reduced) return;
    parallaxEls = qsa('[data-parallax]').map(function (el) {
      return { el: el, k: parseFloat(el.dataset.parallax) || 0.08, top: 0, h: 0 };
    });
    measureParallax();
    window.addEventListener('load', measureParallax);
  }
  function runParallax() {
    var vh = window.innerHeight, y = window.pageYOffset;
    for (var i = 0; i < parallaxEls.length; i++) {
      var p = parallaxEls[i];
      var top = p.top - y;                       // viewport-relative, transform-free
      if (top + p.h < -220 || top > vh + 220) continue;
      var mid = top + p.h / 2 - vh / 2;
      p.el.style.transform = 'translate3d(0,' + (mid * p.k).toFixed(2) + 'px,0)';
    }
  }

  /* ================= 8. COUNTERS =================
     Driven from the scroll loop rather than an observer — one code path that
     also covers "already on screen at load". */
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
        // Clock comes from performance.now(), never from the rAF argument —
        // an undefined timestamp made p NaN, which printed "NaN%" and stalled.
        var t0 = (window.performance && performance.now) ? performance.now() : +new Date();
        var dur = 1500;
        function now() { return (window.performance && performance.now) ? performance.now() : +new Date(); }
        function anim() {
          var p = clamp((now() - t0) / dur, 0, 1);
          if (!isFinite(p)) p = 1;
          c.el.textContent = Math.round(c.to * (1 - Math.pow(1 - p, 3))) + c.sfx;
          if (p < 1) requestAnimationFrame(anim);
        }
        anim();
        // rAF is paused in background tabs, so guarantee the final value lands
        setTimeout(function () { c.el.textContent = c.to + c.sfx; }, dur + 400);
      })(c);
    }
    if (!alive) counters = [];
  }

  /* ================= 9. CARD TILT + GLOW ================= */
  function initTilt() {
    if (!window.matchMedia('(pointer: fine)').matches || reduced) return;
    qsa('[data-tilt]').forEach(function (card) {
      var raf = null;
      card.addEventListener('pointerenter', function () {
        // override the slow reveal transition so the tilt tracks the pointer
        card.style.transition = 'transform .3s cubic-bezier(.16,1,.3,1), box-shadow .5s cubic-bezier(.16,1,.3,1)';
      });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          card.style.transform =
            'perspective(900px) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg) rotateY(' +
            ((px - 0.5) * 8).toFixed(2) + 'deg) translateY(-4px)';
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ================= 10. MAGNETIC BUTTONS ================= */
  function initMagnetic() {
    if (!window.matchMedia('(pointer: fine)').matches || reduced) return;
    qsa('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * 0.22).toFixed(1) + 'px,' + (y * 0.3).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ================= 11. PINNED PROCESS ================= */
  var processCtx = null;
  function initProcess() {
    var sec = qs('#process');
    var steps = qsa('.pstep', qs('#processSteps'));
    if (!sec || !steps.length) return;
    processCtx = { sec: sec, steps: steps, fill: qs('#processFill'), num: qs('#processNum'), current: -1 };
  }
  function runProcess() {
    if (!processCtx) return;
    var c = processCtx;
    var r = c.sec.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return;
    var p = clamp(-r.top / total, 0, 1);
    c.sec.style.setProperty('--pp', p.toFixed(3));   // background glow follows progress
    var idx = clamp(Math.floor(p * c.steps.length), 0, c.steps.length - 1);
    if (idx !== c.current) {
      c.current = idx;
      c.steps.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      if (c.num) c.num.textContent = '0' + (idx + 1);
    }
    if (c.fill) c.fill.style.width = (((idx + 1) / c.steps.length) * 100) + '%';
  }

  /* ================= 12. ACTIVE NAV ================= */
  function initActiveNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = qsa('.nav__link');
    var map = {};
    links.forEach(function (l) { map[l.dataset.nav] = l; });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          if (map[en.target.id]) map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });

    // light header over light sections
    var lightIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) header.classList.add('is-light');
      });
    }, { rootMargin: '-1px 0px -99% 0px' });
    qsa('.section:not(.section--dark), .process, .footer').forEach(function (s) { lightIo.observe(s); });

    var darkIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) header.classList.remove('is-light');
      });
    }, { rootMargin: '-1px 0px -99% 0px' });
    qsa('.hero, .section--dark, .marquee').forEach(function (s) { darkIo.observe(s); });
  }

  /* ================= 13. TESTIMONIAL SLIDER ================= */
  function initSays() {
    var track = qs('#saysTrack'), dots = qs('#saysDots');
    if (!track || !dots) return;
    var items = qsa('.says__item', track);
    var idx = 0, timer;

    items.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', function () { go(i); restart(); });
      dots.appendChild(b);
    });
    var btns = qsa('button', dots);

    function go(i) {
      idx = (i + items.length) % items.length;
      items.forEach(function (el, n) { el.classList.toggle('is-active', n === idx); });
      btns.forEach(function (el, n) { el.classList.toggle('is-active', n === idx); });
    }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(function () { go(idx + 1); }, 6500); }
    restart();

    var box = qs('.says__box');
    box.addEventListener('pointerenter', function () { clearInterval(timer); });
    box.addEventListener('pointerleave', restart);
  }

  /* ================= 14. QUOTE FORM → WHATSAPP ================= */
  function initForm() {
    var form = qs('#quoteForm'); if (!form) return;
    var status = qs('#formStatus');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = qs('#fName'), phone = qs('#fPhone');
      var ok = true;
      [name, phone].forEach(function (f) {
        var bad = !f.value.trim();
        f.parentNode.classList.toggle('has-error', bad);
        if (bad) ok = false;
      });
      if (!ok) { status.textContent = 'Please add your name and phone number.'; return; }

      var lines = [
        'New enquiry — Oryx for Car Accessories',
        'Name: ' + name.value.trim(),
        'Phone: ' + phone.value.trim(),
        'Car: ' + (qs('#fCar').value.trim() || '—'),
        'Service: ' + qs('#fService').value,
        'Details: ' + (qs('#fMsg').value.trim() || '—')
      ];
      var text = encodeURIComponent(lines.join('\n'));

      status.textContent = 'Opening WhatsApp…';
      var win = window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + text, '_blank', 'noopener');
      if (!win) {
        window.location.href = 'mailto:' + CONFIG.email +
          '?subject=' + encodeURIComponent('Quote request — ' + name.value.trim()) +
          '&body=' + text;
      }
      setTimeout(function () { status.textContent = 'Thanks — we\'ll reply shortly.'; }, 1200);
    });

    qsa('input,textarea', form).forEach(function (f) {
      f.addEventListener('input', function () { f.parentNode.classList.remove('has-error'); });
    });
  }

  /* ================= 15. SMOOTH ANCHORS ================= */
  function initAnchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        var y = t.getBoundingClientRect().top + window.pageYOffset - (id === '#home' ? 0 : 10);
        window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ================= 16. RAF LOOP ================= */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollChrome();
      runParallax();
      runProcess();
      runCounters();
      ticking = false;
    });
  }

  /* ================= BOOT ================= */
  var started = false;
  function start() {
    if (started) return;
    started = true;

    initMarquee('.marquee__track', '.marquee__set', 44);
    initReveal();
    initInView();
    initParallax();
    initCounters();
    initTilt();
    initMagnetic();
    initProcess();
    initActiveNav();
    initSays();
    initForm();
    initAnchors();

    var y = qs('#year'); if (y) y.textContent = new Date().getFullYear();

    var rt;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measureParallax(); onScroll(); }, 120);
      onScroll();
    });
    onScrollChrome(); runParallax(); runProcess(); runCounters();
  }

  // expose for the preloader callback
  window.__oryxStart = start;
  document.addEventListener('DOMContentLoaded', function () {
    // if the preloader was skipped for any reason, boot anyway after a beat
    setTimeout(function () { if (!started && !document.body.classList.contains('is-loading')) start(); }, 100);
  });
})();
