/* =============================================================
   CarePlus — catalogue grid
   The cards are built from products.json, so a new product is one
   JSON entry and nothing else.

   i18n.js caches every [data-ar] element and main2.js collects every
   [data-rise] the moment they run, so both are loaded from here —
   after the cards exist — rather than with a <script> tag of their
   own. Ordering is the whole point; do not move them back.
   ============================================================= */
(function () {
  'use strict';

  var SRC   = 'products.json';
  var IMG   = 'assets/img/product-img/';
  var MAIL  = 'mailto:info@careplus.qa';
  var AFTER = ['assets/js/i18n.js', 'assets/js/main2.js'];
  var PER   = 12;   // 4 rows of 3 on a desktop grid
  var WIN= 7;   // page buttons shown before the list starts eliding

  var grid = document.getElementById('pgrid');
  var nav  = document.getElementById('pnav');
  var cards = [], pages = 1, page = 1;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* "Lighting – Off-Road & Auxiliary Lights" -> "lighting-off-road-auxiliary-lights",
     kept on the card as data-cat so a filter can hook onto it later */
  function slug(s) {
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function card(p, i) {
    var name   = p.title || '';
    var nameAr = p.title_ar || name;
    var cat    = p.category || '';
    var catAr  = p.category_ar || cat;
    var subj   = MAIL + '?subject=' + encodeURIComponent('Enquiry: ' + name);

    return '' +
      '<article class="pcard" data-cat="' + esc(slug(cat)) + '" data-rise' +
        (i % 3 ? ' data-delay="' + (i % 3) * 80 + '"' : '') + '>' +
        '<div class="pcard__img">' +
          '<img src="' + esc(IMG + p.image_url) + '" alt="' + esc(name) +
          '" data-ar-alt="' + esc(nameAr) + '" loading="lazy">' +
        '</div>' +
        '<div class="pcard__info">' +
          '<div class="pcard__meta">' +
            '<p class="pcard__tag" data-ar="' + esc(catAr) + '">' + esc(cat) + '</p>' +
            '<h3 class="pcard__name" data-ar="' + esc(nameAr) + '">' + esc(name) + '</h3>' +
          '</div>' +
          '<a class="pcard__cta" target="_blank" rel="noopener"' +
            ' aria-label="Enquire about ' + esc(name) + '"' +
            ' data-ar-aria-label="' + esc('استفسر عن ' + nameAr) + '"' +
            ' href="' + esc(subj) + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>' +
          '</a>' +
        '</div>' +
      '</article>';
  }

  /* in order, so i18n.js is parsed and run before main2.js as it was
     when both sat in the markup */
  function boot(srcs) {
    if (!srcs.length) return;
    var s = document.createElement('script');
    s.src = srcs[0];
    s.onload = s.onerror = function () { boot(srcs.slice(1)); };
    document.body.appendChild(s);
  }

  /* ---------------- pagination ----------------
     Every card stays in the DOM and pages are shown by toggling
     .is-hidden: i18n.js caches each [data-ar] element once, as it
     boots, so rebuilding the grid on a page change would strip the
     Arabic off every card. Hidden cards cost nothing — they are
     display:none, so the browser never fetches their lazy images.

     The buttons are built once, for the same reason, and a page
     change only toggles their state. */

  var ARROW = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6l-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>'
  };

  function buildNav() {
    if (!nav || pages < 2) return;

    var h = '<button class="pnav__btn" type="button" data-go="prev"' +
            ' aria-label="Previous page" data-ar-aria-label="الصفحة السابقة">' +
            ARROW.prev + '</button>';

    for (var i = 1; i <= pages; i++) {
      /* the elisions sit inside the run — after the first number and
         before the last — so a hidden stretch reads "1 … 8 9 10 … 17" */
      if (i === pages) h += '<span class="pnav__gap" data-gap="hi" aria-hidden="true">…</span>';
      h += '<button class="pnav__btn" type="button" data-page="' + i + '"' +
           ' aria-label="Page ' + i + '" data-ar-aria-label="الصفحة ' + i + '">' +
           i + '</button>';
      if (i === 1) h += '<span class="pnav__gap" data-gap="lo" aria-hidden="true">…</span>';
    }

    h += '<button class="pnav__btn" type="button" data-go="next"' +
         ' aria-label="Next page" data-ar-aria-label="الصفحة التالية">' +
         ARROW.next + '</button>' +
         '<p class="pnav__count" data-range aria-live="polite"></p>';

    nav.innerHTML = h;
    nav.hidden = false;

    nav.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.pnav__btn') : null;
      if (!b || b.disabled) return;
      var go = b.getAttribute('data-go');
      go ? show(page + (go === 'next' ? 1 : -1), true)
         : show(parseInt(b.getAttribute('data-page'), 10), true);
    });
  }

  /* which page numbers to show: always the first, the last and the
     current with a neighbour either side, eliding the rest */
  function visible(n) {
    if (pages <= WIN) return null;
    var lo = Math.max(2, Math.min(n - 1, pages - 3));
    var hi = Math.min(pages - 1, Math.max(n + 1, 4));
    return { lo: lo, hi: hi };
  }

  function paint() {
    if (!nav || pages < 2) return;
    var win = visible(page);

    Array.prototype.forEach.call(nav.querySelectorAll('[data-page]'), function (b) {
      var n = parseInt(b.getAttribute('data-page'), 10);
      var on = n === page;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
      b.hidden = !!win && n !== 1 && n !== pages && (n < win.lo || n > win.hi);
    });

    nav.querySelector('[data-gap="lo"]').hidden  = !win || win.lo <= 2;
    nav.querySelector('[data-gap="hi"]').hidden  = !win || win.hi >= pages - 1;

    nav.querySelector('[data-go="prev"]').disabled = page === 1;
    nav.querySelector('[data-go="next"]').disabled = page === pages;

    var from = (page - 1) * PER + 1;
    var to   = Math.min(page * PER, cards.length);
    nav.querySelector('[data-range]').textContent = from + '–' + to + ' / ' + cards.length;
  }

  function show(n, moveFocus) {
    n = Math.min(Math.max(n || 1, 1), pages);
    page = n;

    var from = (n - 1) * PER, to = from + PER;
    cards.forEach(function (c, i) {
      c.classList.toggle('is-hidden', i < from || i >= to);
    });

    paint();

    if (moveFocus) {
      /* land on the head of the catalogue, not wherever the button was,
         or page 2 opens halfway down its own grid */
      var head = document.querySelector('.pcat__head');
      if (head) {
        var y = window.pageYOffset + head.getBoundingClientRect().top - 110;
        window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
      }
      try {
        history.replaceState(null, '', n === 1 ? location.pathname : '?page=' + n);
      } catch (e) {}
    }
  }

  function startPage() {
    var m = /[?&]page=(\d+)/.exec(location.search);
    return m ? parseInt(m[1], 10) : 1;
  }

  function render(list) {
    if (grid) {
      grid.innerHTML = list.map(card).join('');
      grid.removeAttribute('aria-busy');
      cards = Array.prototype.slice.call(grid.querySelectorAll('.pcard'));
      pages = Math.max(1, Math.ceil(cards.length / PER));
      buildNav();
      show(startPage(), false);
    }
    boot(AFTER);
  }

  /* products.json is the source of truth. A browser will not fetch it
     over file://, though, so opening the page straight off the disk
     falls back to products-data.js — the same array written out as a
     script by tools/build-products-data.mjs. Over http the JSON always
     wins, so the fallback can never serve a stale catalogue live. */
  function fallback() {
    var s = document.createElement('script');
    s.src = 'assets/js/products-data.js';
    s.onload = function () {
      if (Array.isArray(window.PRODUCTS)) {
        if (window.console) {
          console.warn('products.json could not be fetched (file:// blocks it) — ' +
                       'using assets/js/products-data.js. Serve the folder over ' +
                       'http to read the JSON directly.');
        }
        render(window.PRODUCTS);
      } else {
        fail();
      }
    };
    s.onerror = fail;
    document.body.appendChild(s);
  }

  /* the rest of the page still has to come up — the loading class is
     cleared by main2.js, so it is started either way */
  function fail() {
    if (grid) {
      grid.removeAttribute('aria-busy');
      grid.innerHTML = '<p class="pcat__note" data-ar="تعذّر تحميل الكتالوج. ' +
        'يرجى تحديث الصفحة أو مراسلتنا على info@careplus.qa.">' +
        'The catalogue could not be loaded. Please refresh, or email us at ' +
        '<a href="' + MAIL + '">info@careplus.qa</a>.</p>';
    }
    boot(AFTER);
  }

  fetch(SRC)
    .then(function (r) {
      if (!r.ok) throw new Error('products.json: ' + r.status);
      return r.json();
    })
    .then(function (list) {
      render(Array.isArray(list) ? list : []);
    })
    .catch(function (err) {
      if (window.console) console.warn(err);
      fallback();
    });
})();
