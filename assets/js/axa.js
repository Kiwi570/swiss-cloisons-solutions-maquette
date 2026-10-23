/* Fiche réalisation AXA : ouverture, lots dessinés, frise du chantier, avant/après, mosaïque et visionneuse. */
(function () {
  'use strict';
  var d = document, SCS = window.SCS, gsap = window.gsap, ST = window.ScrollTrigger;
  var calm = SCS.calm;
  var mm = gsap ? gsap.matchMedia() : null;

  d.querySelectorAll('[data-wipe]').forEach(function (el) { if (window.Wipe) new window.Wipe(el); });
  lightbox();

  var strip = d.querySelector('[data-strip]');
  var bar = d.querySelector('[data-progress]');
  var cnt = d.querySelector('[data-progress-n]');
  var items = strip ? strip.querySelectorAll('.strip__item') : [];
  Array.prototype.forEach.call(items, function (fig) { var im = fig.querySelector('img'), m = fig.querySelector('.media'); if (im && m && im.getAttribute('width')) m.style.aspectRatio = im.getAttribute('width') + ' / ' + im.getAttribute('height'); });
  var setProgress = function (p) {
    if (bar) bar.style.setProperty('--p', p.toFixed(3));
    if (cnt && items.length) cnt.textContent = String(Math.min(items.length, Math.floor(p * (items.length - 1)) + 1)).padStart(2, '0') + ' / ' + items.length;
  };
  if (strip && (calm || window.matchMedia('(max-width: 760px)').matches)) {
    strip.addEventListener('scroll', function () { var m = strip.scrollWidth - strip.clientWidth; setProgress(m > 0 ? strip.scrollLeft / m : 1); }, { passive: true });
  }

  SCS.boot.then(function () {
    if (!gsap || !ST || calm) { SCS.introDone = true; return; }
    var title = d.querySelector('.fiche-hero__title');
    var tl = gsap.timeline({ delay: SCS.swept ? 0.45 : 0.1, defaults: { ease: 'expo.out' } });
    var split = window.SplitText ? window.SplitText.create(title, { type: 'chars,lines', mask: 'lines' }) : null;
    gsap.set('.fiche-hero .hero__media', { scale: 1.08 });
    tl.call(function () { SCS.introDone = true; window.dispatchEvent(new CustomEvent('scs:intro')); })
      .to('.fiche-hero .hero__media', { scale: 1, duration: 2.2 }, 0);
    if (split) tl.from(split.chars, { yPercent: 115, duration: 1.2, stagger: 0.03 }, 0.15);
    tl.from('.fiche-hero .retour, .fiche-hero .eyebrow, .meta > div', { y: 24, opacity: 0, duration: 1, stagger: 0.06 }, 0.35)
      .from('.hd__in', { y: -30, opacity: 0, duration: 1 }, 0.1);

    var hero = d.querySelector('.fiche-hero');
    ST.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: function (s) { if (SCS.glass) SCS.glass.setClose(Math.min(1, s.progress * 1.4)); if (window.SCSSound) window.SCSSound.setOpen(1 - s.progress); } });

    d.querySelectorAll('[data-lot]').forEach(function (lot) {
      var paths = lot.querySelectorAll('.lot__ico path');
      paths.forEach(function (p) { var L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
      var t = gsap.timeline({ scrollTrigger: { trigger: lot, start: 'top 85%', once: true } });
      t.to(paths, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.12 })
        .from(lot.querySelectorAll('h3, p, .lot__num'), { y: 20, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.1)
        .from(lot.querySelector('.lot__img'), { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.15);
    });

    if (strip) {
      mm.add('(min-width: 761px)', function () {
        var dist = function () { return Math.max(0, strip.scrollWidth - window.innerWidth); };
        gsap.to(strip, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: '.strip__pin', start: 'top 12%', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: function (s) { setProgress(s.progress); } } });
      });
      mm.add('(max-width: 760px)', function () {
        strip.addEventListener('scroll', function () { var m = strip.scrollWidth - strip.clientWidth; setProgress(m > 0 ? strip.scrollLeft / m : 1); }, { passive: true });
      });
    }

    gsap.utils.toArray('[data-mosaic] button').forEach(function (b, i) {
      gsap.from(b, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', delay: (i % 4) * 0.06, scrollTrigger: { trigger: b, start: 'top 95%', once: true } });
    });
  });

  function lightbox() {
    var lb = d.querySelector('[data-lightbox]');
    var btns = Array.prototype.slice.call(d.querySelectorAll('[data-mosaic] button'));
    if (!lb || !btns.length) return;
    var img = lb.querySelector('[data-lb-img]'), count = lb.querySelector('[data-lb-count]'), alt = lb.querySelector('[data-lb-alt]');
    var i = 0, opener = null;
    var show = function (k) {
      i = (k + btns.length) % btns.length;
      var src = btns[i].querySelector('img');
      var set = (src.getAttribute('srcset') || '').split(',').map(function (x) { return x.trim().split(' ')[0]; });
      img.src = set[set.length - 1] || src.src;
      img.alt = src.alt;
      alt.textContent = src.alt;
      count.textContent = String(i + 1).padStart(2, '0') + ' / ' + btns.length;
    };
    var open = function (k) { opener = btns[k]; show(k); lb.hidden = false; if (SCS.lenis) SCS.lenis.stop(); lb.querySelector('[data-lb-close]').focus(); if (gsap && !calm) gsap.from(img, { scale: 0.96, opacity: 0, duration: 0.5, ease: 'expo.out' }); };
    var close = function () { lb.hidden = true; if (SCS.lenis) SCS.lenis.start(); if (opener) opener.focus(); };
    btns.forEach(function (b, k) {
      b.setAttribute('aria-label', SCS.t('lb.ouvrir', 'Agrandir la photo') + ' : ' + b.querySelector('img').alt);
      b.addEventListener('click', function () { open(k); });
    });
    lb.querySelector('[data-lb-close]').addEventListener('click', close);
    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { show(i - 1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { show(i + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__img')) close(); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'Tab') {
        var f = Array.prototype.slice.call(lb.querySelectorAll('button'));
        var idx = f.indexOf(d.activeElement);
        if (e.shiftKey && idx <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && idx === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
})();
