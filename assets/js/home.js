/* Accueil : ouverture, vitre, coupe axonométrique, réalisations, méthode bord à bord, carte du Léman. */
(function () {
  'use strict';
  var d = document, SCS = window.SCS, gsap = window.gsap, ST = window.ScrollTrigger;
  var calm = SCS.calm;
  var mm = gsap ? gsap.matchMedia() : null;
  var sound = function () { return window.SCSSound; };

  /* ---------- Coupe axonométrique */
  var isoSvg = d.getElementById('iso-home');
  var room = (isoSvg && window.IsoRoom) ? new window.IsoRoom(isoSvg) : null;
  d.querySelectorAll('[data-config] .chip').forEach(function (ch) {
    ch.addEventListener('click', function () {
      d.querySelectorAll('[data-config] .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === ch ? 'true' : 'false'); });
      if (room) { if (room.revealed && !room.revealed.cloisons) room.reveal('cloisons'); room.setType(ch.getAttribute('data-type'), !calm); }
    });
  });

  /* ---------- Avant / après */
  d.querySelectorAll('[data-wipe]').forEach(function (el) { if (window.Wipe) new window.Wipe(el); });

  /* ---------- Carte schématique du Léman (coordonnées géographiques approximatives) */
  drawMap(d.getElementById('carte'));

  /* ---------- Secteurs */
  var rot = d.querySelector('[data-rotate]');

  SCS.boot.then(function () {
    if (!gsap || !ST || calm) {
      if (room) room.showAll();
      SCS.introDone = true;
      return;
    }
    intro();
    hero();
    manifeste();
    metiers();
    reals();
    methode();
    confiance();
    carteAnim();
    cta();
  });

  function intro() {
    var loader = d.querySelector('.loader');
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    var title = d.querySelector('.hero__title');
    var split = window.SplitText ? window.SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'ln' }) : null;
    gsap.set('.hero__media', { scale: 1.08 });
    var seen = false;
    try { seen = window.sessionStorage.getItem('scs-intro') === '1'; window.sessionStorage.setItem('scs-intro', '1'); } catch (e) { /* rien */ }
    if (loader && !SCS.swept && !seen && window.location.hash.length < 2) {
      var path = loader.querySelector('path');
      var len = path.getTotalLength();
      var cnt = loader.querySelector('.loader__count');
      var o = { v: 0 };
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(path, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, 0)
        .to(o, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: function () { cnt.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
        .from(loader.querySelector('.loader__name'), { y: 14, opacity: 0, duration: 0.8, ease: 'expo.out' }, 0.55)
        .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut' }, 1.35)
        .set(loader, { display: 'none' });
    } else if (loader) {
      loader.style.display = 'none';
    }
    var at = (loader && loader.style.display !== 'none' && !SCS.swept && !seen) ? 1.55 : 0.2;
    tl.call(function () { SCS.introDone = true; window.dispatchEvent(new CustomEvent('scs:intro')); }, null, at - 0.2)
      .to('.hero__media', { scale: 1, duration: 2.2, ease: 'expo.out' }, at - 0.3);
    if (split) tl.from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.1 }, at);
    tl.from('.hero .eyebrow, .hero .lead, .hero__actions > *, .hero .cote, .hero__scroll', { y: 24, opacity: 0, duration: 1, stagger: 0.07 }, at + 0.25)
      .from('.hd__in', { y: -30, opacity: 0, duration: 1 }, at + 0.1);
  }

  function hero() {
    var h = d.getElementById('hero');
    ST.create({
      trigger: h, start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: function (s) {
        if (SCS.glass) SCS.glass.setClose(Math.min(1, s.progress * 1.4));
        if (sound()) sound().setOpen(1 - Math.min(1, s.progress * 1.6));
      }
    });
    gsap.to('.hero__content', { yPercent: -12, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: true } });
    var v = d.querySelector('.hero__vitre');
    if (v && SCS.fine) {
      var xTo = gsap.quickTo(v, 'left', { duration: 1.2, ease: 'power3' });
      h.addEventListener('pointermove', function (e) { var r = h.getBoundingClientRect(); xTo(Math.min(70, Math.max(10, ((e.clientX - r.left) / r.width) * 100 - 17)) + '%'); });
    }
  }

  function manifeste() {
    var p = d.querySelector('[data-words]');
    if (p && window.SplitText) {
      var s = window.SplitText.create(p, { type: 'words', wordsClass: 'w' });
      gsap.fromTo(s.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    }
    gsap.from('.atout', { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.atouts', start: 'top 80%', once: true } });
    gsap.fromTo('.manif__bg img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.manif', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  function metiers() {
    if (!room) return;
    room.prime();
    var legend = d.querySelectorAll('.stage__legend span');
    var setLegend = function (k) { legend.forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-layer') === k || k === 'sav'); }); };
    var map = { cloisons: 'cloisons', plafonds: 'plafond', planchers: 'plancher', sav: 'sav' };
    d.querySelectorAll('.step').forEach(function (st, i) {
      var layer = map[st.getAttribute('data-step')];
      ST.create({
        trigger: st, start: 'top 62%', end: 'bottom 38%',
        onToggle: function (s) {
          if (!s.isActive) return;
          var order = ['cloisons', 'plafond', 'plancher'];
          order.slice(0, layer === 'sav' ? 3 : order.indexOf(layer) + 1).forEach(function (k) { room.reveal(k); });
          if (layer === 'sav') room.scan();
          room.focus(layer);
          setLegend(layer);
        },
        onUpdate: layer === 'plafond' ? function (s) { if (sound()) sound().setAbsorb(s.progress); } : undefined
      });
      gsap.from(st.querySelectorAll('.step__num, .h3, p, .chips'), { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: st, start: 'top 75%', once: true } });
    });
    ST.create({ trigger: '.metiers', start: 'bottom 60%', onEnter: function () { room.focus(null); }, onLeaveBack: function () { room.focus('sav'); } });
  }

  function reals() {
    var track = d.querySelector('[data-hscroll]');
    if (!track) return;
    var bar = d.querySelector('[data-reals-bar]'), num = d.querySelector('[data-reals-n]');
    var cards = track.querySelectorAll('.card');
    var prog = function (p) {
      if (bar) bar.style.setProperty('--p', p.toFixed(3));
      if (num) num.textContent = String(Math.min(cards.length, Math.floor(p * (cards.length - 1) + 0.5) + 1)).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
    };
    mm.add('(min-width: 761px)', function () {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tw = gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: '.reals__pin', start: 'top 14%', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: function (st) { prog(st.progress); } } });
      track.querySelectorAll('.card').forEach(function (card) {
        var img = card.querySelector('img');
        gsap.set(img, { scale: 1.18 });
        gsap.fromTo(img, { xPercent: 7 }, { xPercent: -7, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
    });
    mm.add('(max-width: 760px)', function () {
      var onS = function () { var m = track.scrollWidth - track.clientWidth; prog(m > 0 ? track.scrollLeft / m : 1); };
      track.addEventListener('scroll', onS, { passive: true });
      gsap.from(track.querySelectorAll('.card'), { x: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: track, start: 'top 85%', once: true } });
    });
  }

  function methode() {
    var stage = d.querySelector('[data-methode]');
    if (!stage) return;
    var panels = stage.querySelectorAll('.panneau');
    var rail = stage.querySelector('.rail');
    mm.add('(min-width: 961px)', function () {
      var tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 22%', end: '+=130%', pin: '.methode', scrub: 0.7, anticipatePin: 1 } });
      tl.fromTo(rail, { '--k': 0 }, { '--k': 1, duration: 0.6, ease: 'none' });
      panels.forEach(function (p, i) {
        tl.fromTo(p, { xPercent: 130 + (4 - i) * 30, opacity: 0, rotateY: -18 }, { xPercent: 0, opacity: 1, rotateY: 0, duration: 1, ease: 'power3.out', transformPerspective: 1200 }, 0.1 + i * 0.6)
          .call(function () { if (sound()) sound().tink(0.9 + i * 0.05); }, null, 1.05 + i * 0.6);
      });
    });
    mm.add('(max-width: 960px)', function () {
      gsap.fromTo(rail, { '--k': 0 }, { '--k': 1, duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: rail, start: 'top 85%', once: true } });
      panels.forEach(function (p) { gsap.from(p, { x: 80, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } }); });
    });
  }

  function confiance() {
    var q = d.querySelector('[data-quote]');
    if (q) {
      SCS.splitLines(q.querySelector('span'), { scrollTrigger: { trigger: q, start: 'top 80%', once: true }, stagger: 0.12, duration: 1.3 });
      gsap.fromTo(q, { '--sx': '-100%' }, { '--sx': '100%', ease: 'none', scrollTrigger: { trigger: q, start: 'top 85%', end: 'bottom 20%', scrub: true } });
    }
    if (rot) {
      rot.classList.add('is-rot');
      var words = rot.querySelectorAll('span'), i = 0;
      gsap.set(words, { yPercent: 100, opacity: 0 });
      gsap.set(words[0], { yPercent: 0, opacity: 1 });
      setInterval(function () {
        var a = words[i]; i = (i + 1) % words.length; var b = words[i];
        gsap.to(a, { yPercent: -100, opacity: 0, duration: 0.6, ease: 'expo.inOut' });
        gsap.fromTo(b, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.inOut' });
      }, 2200);
    }
    gsap.from('.logo-tile', { y: 30, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: '.logos', start: 'top 85%', once: true } });
  }

  function carteAnim() {
    var svg = d.getElementById('carte');
    if (!svg || !svg.__lake) return;
    var lake = svg.__lake, len = lake.getTotalLength();
    gsap.set(lake, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
    var tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 75%', once: true } });
    tl.to(lake, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' })
      .to(lake, { fillOpacity: 1, duration: 1 }, '-=0.6')
      .from(svg.querySelectorAll('.ville'), { opacity: 0, y: 6, stagger: 0.08, duration: 0.5 }, '-=0.8')
      .from(svg.querySelectorAll('.region'), { opacity: 0, duration: 0.8, stagger: 0.15 }, '-=0.4')
      .from(svg.querySelector('.pin'), { scale: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(3)' }, '-=0.6');
    svg.querySelectorAll('.pulse').forEach(function (c, i) {
      gsap.fromTo(c, { attr: { r: 8 }, opacity: 0.9 }, { attr: { r: 60 }, opacity: 0, duration: 2.6, ease: 'power2.out', repeat: -1, delay: i * 0.85 });
    });
  }

  function cta() {
    var s = d.getElementById('contact');
    gsap.fromTo('[data-door="l"]', { xPercent: 0 }, { xPercent: -100, ease: 'none', scrollTrigger: { trigger: s, start: 'top 85%', end: 'top 15%', scrub: true } });
    gsap.fromTo('[data-door="r"]', { xPercent: 0 }, { xPercent: 100, ease: 'none', scrollTrigger: { trigger: s, start: 'top 85%', end: 'top 15%', scrub: true } });
    gsap.fromTo('.cta__media img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  function drawMap(svg) {
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    var proj = function (lon, lat) { return [(lon - 5.92) * 720 * 0.69, (46.6 - lat) * 720]; };
    var shore = [[6.152, 46.207], [6.163, 46.255], [6.17, 46.285], [6.195, 46.312], [6.235, 46.36], [6.258, 46.383], [6.31, 46.42], [6.35, 46.455], [6.41, 46.47], [6.5, 46.505], [6.57, 46.513], [6.63, 46.507], [6.69, 46.503], [6.76, 46.483], [6.84, 46.462], [6.9, 46.432], [6.928, 46.398], [6.89, 46.385], [6.82, 46.388], [6.75, 46.398], [6.66, 46.4], [6.59, 46.405], [6.53, 46.388], [6.48, 46.375], [6.4, 46.37], [6.33, 46.372], [6.3, 46.355], [6.255, 46.32], [6.235, 46.285], [6.2, 46.25], [6.175, 46.218], [6.155, 46.205]];
    var pts = shore.map(function (p) { return proj(p[0], p[1]); });
    var path = 'M' + pts[0].map(function (n) { return n.toFixed(1); }).join(',');
    for (var i = 0; i < pts.length; i++) {
      var p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      path += ' C' + c1[0].toFixed(1) + ',' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ',' + c2[1].toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    var mk = function (tag, attrs, parent) { var e = d.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
    var grid = mk('g', { 'class': 'trame-carte' });
    for (var x = 0; x <= 700; x += 58.3) mk('line', { x1: x, y1: 0, x2: x, y2: 430 }, grid);
    var lake = mk('path', { d: path, 'class': 'lac' });
    svg.__lake = lake;
    var T = function (k, fr) { return SCS.t(k, fr); };
    var reg = [['carte.ge', 'Canton de Genève', 6.0, 46.1, 'start'], ['carte.vd', 'Canton de Vaud', 6.6, 46.58], ['carte.fr', 'France voisine', 6.58, 46.3]];
    reg.forEach(function (r) { var p = proj(r[2], r[3]); var t = mk('text', { x: p[0].toFixed(0), y: p[1].toFixed(0), 'class': 'region', 'text-anchor': r[4] || 'middle' }); t.textContent = T(r[0], r[1]); });
    var villes = [['Genève', 6.143, 46.204, -8, -10, 'end'], ['Nyon', 6.239, 46.383, -8, -4, 'end'], ['Lausanne', 6.632, 46.519, 0, -10, 'middle'], ['Montreux', 6.911, 46.433, 8, -6, 'start'], ['Annemasse', 6.235, 46.193, 8, 14, 'start'], ['Thonon', 6.479, 46.371, 0, 18, 'middle'], ['Évian', 6.59, 46.401, 8, 16, 'start'], ['Morges', 6.498, 46.511, -6, -10, 'end']];
    villes.forEach(function (v) {
      var p = proj(v[1], v[2]);
      var g = mk('g', { 'class': 'ville' });
      mk('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 2.6 }, g);
      var t = mk('text', { x: (p[0] + v[3]).toFixed(1), y: (p[1] + v[4]).toFixed(1), 'text-anchor': v[5] }, g); t.textContent = v[0];
    });
    var c = proj(6.14, 46.183);
    mk('circle', { cx: c[0], cy: c[1], r: 8, 'class': 'pulse' }); mk('circle', { cx: c[0], cy: c[1], r: 8, 'class': 'pulse' }); mk('circle', { cx: c[0], cy: c[1], r: 8, 'class': 'pulse' });
    var pin = mk('g', { 'class': 'pin' });
    mk('circle', { cx: c[0], cy: c[1], r: 6.5 }, pin);
    mk('circle', { cx: c[0], cy: c[1], r: 2.2, fill: '#F3F2EE' }, pin);
    var lab = mk('text', { x: c[0] - 14, y: c[1] + 22, 'text-anchor': 'end', 'class': 'region', style: 'fill: var(--vert); letter-spacing: .08em' }, pin); lab.textContent = 'Carouge · SCS';
    var e = mk('g', { 'class': 'echelle', transform: 'translate(580 400)' });
    var km10 = 10 / 77.5 * 720 * 0.69 * 0.98;
    mk('line', { x1: 0, y1: 0, x2: km10, y2: 0 }, e); mk('line', { x1: 0, y1: -4, x2: 0, y2: 4 }, e); mk('line', { x1: km10, y1: -4, x2: km10, y2: 4 }, e);
    var et = mk('text', { x: km10 / 2, y: -8, 'text-anchor': 'middle' }, e); et.textContent = '10 km';
  }
})();
