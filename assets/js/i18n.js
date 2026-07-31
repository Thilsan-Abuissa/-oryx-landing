/* =============================================================
   ORYX — English ⇄ Arabic switch
   The Arabic lives in the markup (data-ar for text, data-ar-<attr>
   for attributes); the English already in the DOM is cached on the
   first pass, so no copy is written twice.

   Loaded BEFORE main2.js on purpose: the marquee, the counters and
   the horizontal track all measure the text they are given, so the
   right language has to be in place before they initialise.
   ============================================================= */
(function () {
  'use strict';

  var KEY  = 'oryx-lang';
  var html = document.documentElement;
  var qsa  = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var lang = 'en';
  var booted = false;

  /* status messages main2.js writes at runtime */
  var STRINGS = {
    'Please add your name and phone number.': 'الرجاء إدخال الاسم ورقم الهاتف.',
    'Opening WhatsApp…': 'جارٍ فتح واتساب…',
    'Thanks — we\'ll reply shortly.': 'شكرًا لك — سنرد عليك قريبًا.'
  };
  window.ORYX_T = function (en) { return (lang === 'ar' && STRINGS[en]) || en; };

  /* the WhatsApp prefill follows the language too — the customer
     should not have to send an English sentence about an Arabic card */
  var WA = {
    en: 'Hi Oryx, I\'d like to ask about the {name}.',
    ar: 'مرحبًا أوريكس، أرغب في الاستفسار عن {name}.'
  };

  /* ---------- what to translate ---------- */
  var texts = qsa('[data-ar]');
  texts.forEach(function (el) { el.__en = el.innerHTML; });

  var attrs = [];
  qsa('*').forEach(function (el) {
    var en = null;
    for (var i = 0; i < el.attributes.length; i++) {
      var n = el.attributes[i].name;
      if (n.indexOf('data-ar-') !== 0) continue;
      var t = n.slice(8);
      if (t === 'doctitle') continue;               // handled as document.title
      if (t === 'suffix') t = 'data-suffix';        // counters read data-suffix
      (en = en || {})[t] = el.getAttribute(t);
    }
    if (en) attrs.push({ el: el, en: en });
  });

  var arTitle = html.getAttribute('data-ar-doctitle');
  var enTitle = document.title;

  /* main2.js wraps every [data-mask] line in an <i> so it can slide up
     behind its own edge — write inside that wrapper, never over it. */
  function host(el) {
    var f = el.firstElementChild;
    return (f && f.tagName === 'I' && el.children.length === 1 && el.matches('[data-mask] span')) ? f : el;
  }

  function fire(name) {
    var e;
    try { e = new Event(name); }
    catch (err) { e = document.createEvent('Event'); e.initEvent(name, true, true); }
    window.dispatchEvent(e);
  }

  /* ---------- apply ---------- */
  function apply(next) {
    lang = next === 'ar' ? 'ar' : 'en';
    var ar = lang === 'ar';

    texts.forEach(function (el) {
      host(el).innerHTML = ar ? el.getAttribute('data-ar') : el.__en;
    });

    attrs.forEach(function (rec) {
      Object.keys(rec.en).forEach(function (t) {
        var src = 'data-ar-' + (t === 'data-suffix' ? 'suffix' : t);
        var v = ar ? rec.el.getAttribute(src) : rec.en[t];
        if (v === null) rec.el.removeAttribute(t); else rec.el.setAttribute(t, v);
      });
    });

    /* a counter that has already counted up keeps the old suffix — one
       still sitting at its starting 0 is left to animate in cleanly */
    if (booted) {
      qsa('[data-count]').forEach(function (el) {
        var n = parseFloat(el.textContent);
        if (n > 0) el.textContent = n + (el.getAttribute('data-suffix') || '');
      });
    }

    /* rebuild every product enquiry link from its translated name */
    qsa('.pcard').forEach(function (card) {
      var cta = card.querySelector('.pcard__cta');
      var nm  = card.querySelector('.pcard__name');
      if (!cta || !nm) return;
      var base = (cta.__base || (cta.__base = cta.getAttribute('href').split('?')[0]));
      cta.setAttribute('href', base + '?text=' +
        encodeURIComponent(WA[lang].replace('{name}', nm.textContent.trim())));
    });

    html.lang = ar ? 'ar' : 'en';
    html.dir  = ar ? 'rtl' : 'ltr';
    document.body.classList.toggle('is-ar', ar);
    if (arTitle) document.title = ar ? arTitle : enTitle;

    qsa('.lang__o').forEach(function (o) {
      var on = o.getAttribute('data-lang') === lang;
      o.classList.toggle('is-on', on);
      o.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    try { localStorage.setItem(KEY, lang); } catch (e) {}

    /* marquee width, track distance and accordion heights are all
       measured from the copy — let main2.js re-measure */
    fire('resize');
  }

  /* ---------- boot ---------- */
  qsa('.lang__o').forEach(function (o) {
    o.addEventListener('click', function () {
      var want = o.getAttribute('data-lang');
      if (want !== lang) apply(want);
    });
  });

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  apply(saved === 'ar' ? 'ar' : 'en');
  booted = true;
})();
