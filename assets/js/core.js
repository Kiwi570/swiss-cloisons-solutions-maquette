/* Swiss Cloisons Solutions — socle commun : langue, préférences, défilement, curseur, transitions. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var calm = html.classList.contains('calm');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  };
  var lang = html.classList.contains('lang-en') ? 'en' : 'fr';
  var dict = (window.SCS_I18N && window.SCS_I18N.en) || {};
  var SCS = window.SCS = { calm: calm, fine: fine, lang: lang, store: store, lenis: null };
  SCS.t = function (k, fr) { return (lang === 'en' && dict[k] != null) ? dict[k] : fr; };

  /* ---------- Traduction */
  if (lang === 'en') {
    d.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n')];
      if (v != null) el.innerHTML = v;
    });
    d.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        if (p.length === 2 && dict[p[1]] != null) el.setAttribute(p[0], dict[p[1]]);
      });
    });
    var tt = dict['title.' + d.body.getAttribute('data-page')];
    if (tt) d.title = tt;
  }

  /* ---------- Transition de page (vitre qui balaie) */
  var sweep = d.querySelector('.sweep');
  var swept = false;
  try { swept = window.sessionStorage.getItem('scs-sweep') === '1'; window.sessionStorage.removeItem('scs-sweep'); } catch (e) { /* rien */ }
  SCS.swept = swept;
  if (sweep && gsap && !calm && swept) {
    gsap.set(sweep, { xPercent: 0, x: 0 });
    gsap.to(sweep, { xPercent: 101, duration: 0.85, ease: 'power3.inOut', delay: 0.05, onComplete: function () { gsap.set(sweep, { xPercent: -101 }); } });
  }
  function leave(href) {
    var go = function () { if (href) window.location.href = href; else window.location.reload(); };
    try { window.sessionStorage.setItem('scs-sweep', '1'); } catch (e) { /* rien */ }
    if (calm || !gsap || !sweep) return go();
    gsap.fromTo(sweep, { xPercent: -101 }, { xPercent: 0, duration: 0.6, ease: 'power3.inOut', onComplete: go });
  }
  SCS.leave = leave;
  window.addEventListener('pageshow', function (e) { if (e.persisted && sweep && gsap) gsap.set(sweep, { xPercent: -101 }); });

  /* ---------- Préférences : langue, animations */
  d.querySelectorAll('[data-lang]').forEach(function (b) {
    b.textContent = lang === 'en' ? 'FR' : 'EN';
    b.setAttribute('aria-label', lang === 'en' ? 'Version française' : 'English version');
    b.addEventListener('click', function () { store.set('scs-lang', lang === 'en' ? 'fr' : 'en'); leave(null); });
  });
  d.querySelectorAll('[data-calm]').forEach(function (b) {
    b.setAttribute('aria-pressed', calm ? 'true' : 'false');
    b.textContent = calm ? SCS.t('tool.full', 'Animations complètes') : SCS.t('tool.calm', 'Réduire les animations');
    b.addEventListener('click', function () { store.set('scs-calm', calm ? '0' : '1'); leave(null); });
  });

  /* ---------- Son (uniquement après un clic) */
  d.querySelectorAll('[data-sound]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!window.SCSSound) return;
      var on = window.SCSSound.toggle();
      d.querySelectorAll('[data-sound]').forEach(function (x) { x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    });
  });

  /* ---------- GSAP et défilement fluide */
  if (gsap && ST) {
    gsap.registerPlugin(ST);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);
    ST.config({ ignoreMobileResize: true });
  }
  if (!calm && gsap && ST && window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    SCS.lenis = lenis;
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Menu */
  var menu = d.getElementById('menu');
  var burger = d.querySelector('[data-burger]');
  var menuOpen = false;
  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    window.requestAnimationFrame(function () { menu.classList.add('is-open'); });
    burger.setAttribute('aria-expanded', 'true');
    burger.querySelector('span').textContent = SCS.t('tool.close', 'Fermer');
    menuOpen = true;
    if (SCS.lenis) SCS.lenis.stop();
    var first = menu.querySelector('a, button');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function closeMenu(noFocus) {
    if (!menuOpen) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.querySelector('span').textContent = SCS.t('tool.menu', 'Menu');
    menuOpen = false;
    if (SCS.lenis) SCS.lenis.start();
    setTimeout(function () { if (!menuOpen) menu.hidden = true; }, 720);
    if (!noFocus) burger.focus();
  }
  if (burger) burger.addEventListener('click', function () { if (menuOpen) closeMenu(); else openMenu(); });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) closeMenu();
    if (e.key === 'Tab' && menuOpen) {
      var f = [burger].concat(Array.prototype.slice.call(menu.querySelectorAll('a, button')));
      var i = f.indexOf(d.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Liens : ancres en douceur, pages avec transition */
  function scrollToEl(t) {
    if (SCS.lenis) SCS.lenis.scrollTo(t, { offset: 0, duration: 1.4 });
    else t.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  }
  SCS.scrollToEl = scrollToEl;
  d.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || e.defaultPrevented) return;
    var href = a.getAttribute('href');
    if (href.charAt(0) === '#' && href.length > 1) {
      var t = d.getElementById(href.slice(1));
      if (t) { e.preventDefault(); closeMenu(true); scrollToEl(t); }
      return;
    }
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    var samePage = url.pathname.replace(/(index)?(\.html)?$/, '') === window.location.pathname.replace(/(index)?(\.html)?$/, '');
    if (samePage && url.hash) {
      var t2 = d.getElementById(url.hash.slice(1));
      if (t2) { e.preventDefault(); closeMenu(true); scrollToEl(t2); }
      return;
    }
    e.preventDefault();
    closeMenu(true);
    leave(url.href);
  });
  if (window.location.hash.length > 1) {
    var h0 = d.getElementById(window.location.hash.slice(1));
    if (h0) setTimeout(function () { scrollToEl(h0); }, 400);
  }

  /* ---------- En-tête : se cache en descendant, change de teinte sur fond sombre */
  var hd = d.querySelector('[data-hd]');
  var dock = d.querySelector('[data-dock]');
  var foot = d.querySelector('.ft');
  var ctaSec = d.getElementById('contact');
  var themed = Array.prototype.slice.call(d.querySelectorAll('[data-hd-theme]'));
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (hd) {
      hd.classList.toggle('is-hidden', y > 320 && y > lastY + 2 && !menuOpen);
      if (y < lastY - 2) hd.classList.remove('is-hidden');
      var probe = 40, dark = false;
      for (var i = 0; i < themed.length; i++) {
        var r = themed[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { dark = themed[i].getAttribute('data-hd-theme') === 'dark'; }
      }
      hd.classList.toggle('is-dark', dark);
    }
    if (dock) {
      var vh = window.innerHeight, hide = false;
      if (foot && foot.getBoundingClientRect().top < vh) hide = true;
      if (ctaSec) { var rc = ctaSec.getBoundingClientRect(); if (rc.top < vh * 0.55 && rc.bottom > 0) hide = true; }
      dock.classList.toggle('is-on', y > vh * 0.6 && !hide && !menuOpen);
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Curseur-lentille */
  var cursor = d.querySelector('.cursor');
  if (cursor && fine && !calm && gsap) {
    html.classList.add('has-cursor');
    var label = cursor.querySelector('span');
    var defLabel = label ? label.textContent : '';
    var xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    var yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { xTo(e.clientX); yTo(e.clientY); cursor.style.opacity = 1; }, { passive: true });
    d.addEventListener('pointerover', function (e) {
      var t = e.target;
      if (!t.closest) return;
      var lens = t.closest('[data-lens]');
      cursor.classList.toggle('is-lens', !!lens);
      cursor.classList.toggle('is-link', !lens && !!t.closest('a, button, label.chip, .tile-opt, [data-wipe]'));
      cursor.classList.toggle('on-dark', !!t.closest('.on-dark'));
      if (label) label.textContent = (lens && lens.getAttribute('data-lens-label')) || defLabel;
    });
    d.documentElement.addEventListener('mouseleave', function () { cursor.style.opacity = 0; });
  }

  /* ---------- Boutons magnétiques et inclinaisons */
  if (fine && !calm && gsap) {
    d.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      var my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.28); my((e.clientY - r.top - r.height / 2) * 0.38); });
      el.addEventListener('pointerleave', function () { mx(0); my(0); });
    });
    var tilt = function (el, target, max) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(target, { rotateY: px * max, rotateX: -py * max, transformPerspective: 900, duration: 0.6, ease: 'power3' });
      });
      el.addEventListener('pointerleave', function () { gsap.to(target, { rotateX: 0, rotateY: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }); });
    };
    d.querySelectorAll('[data-tilt]').forEach(function (el) { tilt(el, el, 6); });
    d.querySelectorAll('[data-tilt-card]').forEach(function (el) { var m = el.querySelector('.card__media'); if (m) tilt(el, m, 9); });
  }

  /* ---------- Visuels provisoires : un badge honnête */
  d.querySelectorAll('img.is-illus').forEach(function (img) {
    var box = img.closest('.media');
    if (!box) return;
    var b = d.createElement('span');
    b.className = 'badge-illus';
    b.textContent = SCS.t('illus', 'Illustration');
    box.appendChild(b);
  });
  d.querySelectorAll('img.is-provisoire').forEach(function (img) {
    var box = img.closest('.media');
    if (!box) return;
    var b = d.createElement('span');
    b.className = 'badge-prov';
    b.textContent = SCS.t('prov', 'Visuel provisoire · image Grok à venir');
    box.appendChild(b);
  });

  /* ---------- Copier */
  d.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.getAttribute('data-copy');
      var orig = b.textContent;
      var done = function () { b.textContent = SCS.t('copied', 'Copié'); setTimeout(function () { b.textContent = orig; }, 1600); };
      var fallback = function () {
        var prev = b.previousElementSibling;
        if (!prev) return;
        var range = d.createRange(); range.selectNodeContents(prev);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        b.textContent = SCS.t('selected', 'Sélectionné');
        setTimeout(function () { b.textContent = orig; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback);
      else fallback();
    });
  });

  /* ---------- Animations communes */
  var fontsReady = (d.fonts && d.fonts.ready) ? d.fonts.ready : Promise.resolve();
  SCS.boot = Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1800); })]);

  SCS.splitLines = function (el, vars) {
    if (!window.SplitText || !gsap) return null;
    return window.SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, Object.assign({ yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.09 }, vars || {}));
      }
    });
  };

  SCS.boot.then(function () {
    if (!gsap || !ST || calm) return;
    d.querySelectorAll('[data-split]').forEach(function (el) {
      if (el.closest('.hero') || el.closest('.fiche-hero')) return;
      SCS.splitLines(el, { scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    d.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    d.querySelectorAll('[data-img-reveal]').forEach(function (el) {
      var img = el.querySelector('img');
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      tl.from(el, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' });
      if (img) tl.from(img, { scale: 1.28, duration: 1.8, ease: 'expo.out' }, 0);
    });
    d.querySelectorAll('[data-parallax]').forEach(function (el) {
      var v = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      gsap.fromTo(el, { yPercent: -v * 50 }, { yPercent: v * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    d.querySelectorAll('[data-count]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-CH'); } });
    });
    d.querySelectorAll('.cote__l').forEach(function (el) {
      gsap.fromTo(el, { '--k': 0 }, { '--k': 1, duration: 1.4, ease: 'expo.inOut', delay: el.closest('.hero') ? 1.6 : 0, scrollTrigger: el.closest('.hero') ? null : { trigger: el, start: 'top 92%', once: true } });
    });
    d.querySelectorAll('[data-marquee]').forEach(function (el) {
      gsap.fromTo(el, { x: 0 }, { x: function () { return -(el.scrollWidth - window.innerWidth) * 0.9; }, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
    });
    window.addEventListener('load', function () { ST.refresh(); });
  });

  /* ---------- Section en cours dans la navigation (créé après les épinglages des pages) */
  SCS.boot.then(function () {
    setTimeout(function () {
      if (!ST) return;
      d.querySelectorAll('.hd__nav a[href^="#"]').forEach(function (a) {
        var sec = d.getElementById(a.getAttribute('href').slice(1));
        if (!sec) return;
        ST.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: function (st) {
          a.classList.toggle('is-active', st.isActive);
          if (st.isActive) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        } });
      });
    }, 0);
  });

  if (calm) {
    d.querySelectorAll('[data-marquee]').forEach(function (el) { el.style.overflowX = 'auto'; el.style.width = 'auto'; });
  }
})();
