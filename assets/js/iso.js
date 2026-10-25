/* Axonométrie éclatée d'un plateau de bureaux : plancher technique, cloisons, faux-plafond.
   Dessin en SVG calculé (schéma illustratif). Utilisée sur l'accueil et sur la demande de devis. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var C30 = Math.cos(Math.PI / 6), S30 = 0.5, U = 34;
  var W = 8, D = 6, H = 4.2, ZF = -1.3, ZC = H + 1.3;
  var COL = {
    tile: '#2B3135', tileS: '#4E575D', side: '#20252A', ped: '#79848A', hole: '#111417',
    glass: 'rgba(143,194,186,.22)', glassS: '#B3BBBE', band: 'rgba(243,242,238,.34)', joint: 'rgba(255,255,255,.42)',
    ceil: 'rgba(243,242,238,.05)', ceilS: '#5C666C', light: '#F6F6F2', guide: '#4E575D', text: '#A7AFB2',
    opaque: '#3C4449', opaqueS: '#818B90', plaster: '#C9CED0', plasterSide: '#8E979B', fireS: '#C09068', dot: '#8FC2BA'
  };
  function P(x, y, z) { return [(x - y) * C30 * U, (x + y) * S30 * U - z * U]; }
  function pts(arr) { return arr.map(function (p) { var q = P(p[0], p[1], p[2]); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function line(a, b, attrs, parent) { var p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]); return el('line', Object.assign({ x1: p[0].toFixed(1), y1: p[1].toFixed(1), x2: q[0].toFixed(1), y2: q[1].toFixed(1) }, attrs), parent); }
  var T = function (k, fr) { return (window.SCS && window.SCS.t) ? window.SCS.t(k, fr) : fr; };

  var WALLS = [
    { a: [4, 0], b: [4, 3], door: [1] },
    { a: [6, 0], b: [6, 3], door: [] },
    { a: [0, 3], b: [8, 3], door: [2, 5, 7] }
  ];
  var LIGHTS = [[1, 1], [5, 1], [1, 4], [5, 4], [3, 2.5]];

  function IsoRoom(svg, opts) {
    this.svg = svg; this.opts = opts || {}; this.type = 'vitree'; this.gsap = window.gsap; this.id = svg.id || ('iso' + Math.random().toString(36).slice(2, 7));
    svg.innerHTML = '';
    var defs = el('defs', {}, svg);
    var f = el('filter', { id: this.id + '-glow', x: '-60%', y: '-200%', width: '220%', height: '500%' }, defs);
    el('feGaussianBlur', { stdDeviation: '3.5', result: 'b' }, f);
    var m = el('feMerge', {}, f); el('feMergeNode', { in: 'b' }, m); el('feMergeNode', { in: 'SourceGraphic' }, m);
    var pat = el('pattern', { id: this.id + '-hatch', width: '7', height: '7', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: '7', height: '7', fill: '#463C35' }, pat);
    el('line', { x1: '0', y1: '0', x2: '0', y2: '7', stroke: '#9A7558', 'stroke-width': '2.2' }, pat);
    this.root = el('g', {}, svg);
    this.g = {
      guides: el('g', { 'class': 'l-guides' }, this.root),
      plancher: el('g', { 'class': 'l-plancher' }, this.root),
      cloisons: el('g', { 'class': 'l-cloisons' }, this.root),
      plafond: el('g', { 'class': 'l-plafond' }, this.root),
      sav: el('g', { 'class': 'l-sav' }, this.root),
      labels: el('g', { 'class': 'l-labels' }, this.root)
    };
    this.buildGuides(); this.buildFloor(); this.buildPanes(); this.buildCeiling(); this.buildSav(); this.buildLabels();
    var bb = [P(0, D, ZF - 1.1), P(W, 0, ZC), P(0, 0, ZC), P(W, D, ZF - 1.1), P(W, 0, ZF - 1), P(0, D, ZC)];
    var xs = bb.map(function (p) { return p[0]; }), ys = bb.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs) - 24, maxX = Math.max.apply(null, xs) + 110, minY = Math.min.apply(null, ys) - 20, maxY = Math.max.apply(null, ys) + 20;
    svg.setAttribute('viewBox', [minX, minY, maxX - minX, maxY - minY].map(function (n) { return n.toFixed(0); }).join(' '));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  IsoRoom.prototype.buildGuides = function () {
    var g = this.g.guides;
    [[0, 0], [W, 0], [0, D], [W, D]].forEach(function (c) {
      line([c[0], c[1], ZF - 0.9], [c[0], c[1], ZC], { stroke: COL.guide, 'stroke-width': 1, 'stroke-dasharray': '3 5' }, g);
    });
  };

  IsoRoom.prototype.buildFloor = function () {
    var g = this.g.plancher, self = this;
    this.peds = [];
    var pg = el('g', {}, g);
    for (var i = 0; i <= W; i++) this.peds.push(this.ped(i, D, pg));
    for (var j = 0; j < D; j++) this.peds.push(this.ped(W, j, pg));
    el('polygon', { points: pts([[0, D, ZF], [W, D, ZF], [W, D, ZF - 0.14], [0, D, ZF - 0.14]]), fill: COL.side }, g);
    el('polygon', { points: pts([[W, 0, ZF], [W, D, ZF], [W, D, ZF - 0.14], [W, 0, ZF - 0.14]]), fill: '#1A1E22' }, g);
    this.hole = el('polygon', { points: pts([[5, 4, ZF], [6, 4, ZF], [6, 5, ZF], [5, 5, ZF]]), fill: COL.hole, opacity: 0 }, g);
    this.floorTiles = [];
    for (var y = 0; y < D; y++) for (var x = 0; x < W; x++) {
      var t = el('polygon', { 'class': 'tile', points: pts([[x, y, ZF], [x + 1, y, ZF], [x + 1, y + 1, ZF], [x, y + 1, ZF]]), fill: COL.tile, stroke: COL.tileS }, g);
      t.__xy = [x, y];
      if (x === 5 && y === 4) self.liftTile = t;
      this.floorTiles.push(t);
    }
  };
  IsoRoom.prototype.ped = function (x, y, g) {
    var grp = el('g', { 'class': 'ped' }, g);
    line([x, y, ZF - 0.95], [x, y, ZF - 0.1], { stroke: COL.ped, 'stroke-width': 1.4 }, grp);
    var b = P(x, y, ZF - 0.95);
    el('ellipse', { cx: b[0].toFixed(1), cy: b[1].toFixed(1), rx: 5, ry: 2.6, fill: 'none', stroke: COL.ped, 'stroke-width': 1 }, grp);
    return grp;
  };

  IsoRoom.prototype.buildPanes = function () {
    var g = this.g.cloisons, self = this;
    this.panes = [];
    WALLS.forEach(function (w, wi) {
      var len = Math.round(Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]));
      var ux = (w.b[0] - w.a[0]) / len, uy = (w.b[1] - w.a[1]) / len;
      for (var k = 0; k < len; k++) {
        var pg = el('g', { 'class': 'pane' }, g);
        pg.__seg = { a: [w.a[0] + ux * k, w.a[1] + uy * k], b: [w.a[0] + ux * (k + 1), w.a[1] + uy * (k + 1)], u: [ux, uy], door: w.door.indexOf(k) >= 0, first: k === 0, last: k === len - 1, wall: wi };
        self.panes.push(pg);
      }
    });
    this.track = el('g', { 'class': 'track', opacity: 0 }, g);
    WALLS.forEach(function (w) { line([w.a[0], w.a[1], H], [w.b[0], w.b[1], H], { stroke: COL.glassS, 'stroke-width': 1, 'stroke-dasharray': '2 3' }, self.track); });
    this.fireTag = el('text', { x: P(8.3, 3, 2.6)[0].toFixed(0), y: P(8.3, 3, 2.6)[1].toFixed(0), fill: COL.fireS, opacity: 0 }, g);
    this.fireTag.textContent = T('iso.fire', 'Classement EI : à compléter');
    this.renderPanes();
  };
  IsoRoom.prototype.renderPanes = function () {
    var type = this.type, self = this;
    this.track.setAttribute('opacity', type === 'mobile' ? 1 : 0);
    this.fireTag.setAttribute('opacity', type === 'coupefeu' ? 1 : 0);
    this.panes.forEach(function (pg) {
      while (pg.firstChild) pg.removeChild(pg.firstChild);
      var s = pg.__seg, a = s.a, b = s.b;
      var quad = function (p, q, z0, z1) { return pts([[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]]); };
      if (type === 'mobile') {
        var c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], th = 1.05, ux = s.u[0], uy = s.u[1];
        var rx = ux * Math.cos(th) - uy * Math.sin(th), ry = ux * Math.sin(th) + uy * Math.cos(th);
        var p1 = [c[0] - rx * 0.46, c[1] - ry * 0.46], p2 = [c[0] + rx * 0.46, c[1] + ry * 0.46];
        el('polygon', { points: quad(p1, p2, 0.05, H - 0.15), fill: COL.opaque, stroke: COL.opaqueS, 'stroke-width': 1 }, pg);
        line([p1[0], p1[1], H - 0.15], [p2[0], p2[1], H - 0.15], { stroke: COL.glassS, 'stroke-width': 1.6 }, pg);
        line([c[0], c[1], H - 0.15], [c[0], c[1], H], { stroke: COL.glassS, 'stroke-width': 1 }, pg);
        return;
      }
      if (type === 'platrerie') {
        var nx = -s.u[1] * 0.16, ny = s.u[0] * 0.16;
        el('polygon', { points: quad([a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], 0, H), fill: COL.plasterSide }, pg);
        el('polygon', { points: pts([[a[0], a[1], H], [b[0], b[1], H], [b[0] + nx, b[1] + ny, H], [a[0] + nx, a[1] + ny, H]]), fill: '#E3E6E7' }, pg);
        el('polygon', { points: quad(a, b, 0, H), fill: COL.plaster, stroke: '#9AA3A7', 'stroke-width': 0.8 }, pg);
        if (s.door) self.door(pg, a, b, '#6F797E');
        return;
      }
      var opaque = type === 'pleine' || type === 'amovible' || type === 'coupefeu';
      var fill = type === 'coupefeu' ? 'url(#' + self.id + '-hatch)' : (opaque ? COL.opaque : COL.glass);
      el('polygon', { points: quad(a, b, 0, H), fill: fill, stroke: 'none' }, pg);
      if (!opaque) el('polygon', { points: quad(a, b, 2.0, 2.35), fill: COL.band }, pg);
      var rail = type === 'amovible' ? 2.6 : 1.6;
      line([a[0], a[1], 0], [b[0], b[1], 0], { stroke: type === 'coupefeu' ? COL.fireS : COL.glassS, 'stroke-width': rail }, pg);
      line([a[0], a[1], H], [b[0], b[1], H], { stroke: type === 'coupefeu' ? COL.fireS : COL.glassS, 'stroke-width': rail }, pg);
      var post = function (p, strong) { line([p[0], p[1], 0], [p[0], p[1], H], { stroke: strong ? (type === 'coupefeu' ? COL.fireS : COL.glassS) : COL.joint, 'stroke-width': strong ? 1.4 : 0.8 }, pg); };
      if (type === 'bord') { post(a, s.first); if (s.last) post(b, true); }
      else { post(a, true); if (s.last) post(b, true); }
      if (type === 'amovible') { line([a[0], a[1], 1.4], [b[0], b[1], 1.4], { stroke: COL.opaqueS, 'stroke-width': 0.6 }, pg); line([a[0], a[1], 2.8], [b[0], b[1], 2.8], { stroke: COL.opaqueS, 'stroke-width': 0.6 }, pg); }
      if (s.door) self.door(pg, a, b, opaque ? COL.opaqueS : COL.glassS);
    });
  };
  IsoRoom.prototype.door = function (pg, a, b, stroke) {
    var i = function (t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
    var p = i(0.12), q = i(0.88);
    el('polyline', { points: pts([[p[0], p[1], 0], [p[0], p[1], 3.5], [q[0], q[1], 3.5], [q[0], q[1], 0]]), fill: 'none', stroke: stroke, 'stroke-width': 1.1 }, pg);
    var h = i(0.78);
    line([h[0], h[1], 1.55], [h[0], h[1], 2.05], { stroke: stroke, 'stroke-width': 2 }, pg);
  };

  IsoRoom.prototype.buildCeiling = function () {
    var g = this.g.plafond, self = this;
    this.ceilTiles = [];
    for (var y = 0; y < D; y++) for (var x = 0; x < W; x++) {
      this.ceilTiles.push(el('polygon', { 'class': 'tile', points: pts([[x, y, ZC], [x + 1, y, ZC], [x + 1, y + 1, ZC], [x, y + 1, ZC]]), fill: COL.ceil, stroke: COL.ceilS }, g));
    }
    this.lights = LIGHTS.map(function (l) {
      return el('polygon', { points: pts([[l[0] + 0.1, l[1] + 0.38, ZC], [l[0] + 1.9, l[1] + 0.38, ZC], [l[0] + 1.9, l[1] + 0.62, ZC], [l[0] + 0.1, l[1] + 0.62, ZC]]), fill: COL.light, opacity: 0.12, filter: 'url(#' + self.id + '-glow)' }, g);
    });
  };

  IsoRoom.prototype.buildSav = function () {
    var g = this.g.sav;
    this.path = [[1, 4.6], [3.4, 3.6], [4.6, 1.6], [6.6, 1.4], [7.2, 4.4], [2.2, 4.8]];
    var p0 = P(this.path[0][0], this.path[0][1], 0);
    this.ring = el('circle', { cx: p0[0], cy: p0[1], r: 6, fill: 'none', stroke: COL.dot, 'stroke-width': 1.2, opacity: 0 }, g);
    this.dot = el('circle', { cx: p0[0], cy: p0[1], r: 4.5, fill: COL.dot, opacity: 0 }, g);
  };

  IsoRoom.prototype.buildLabels = function () {
    var g = this.g.labels;
    var mk = function (k, fr, z, layer) {
      var p = P(W + 0.5, 0, z);
      var t = el('text', { x: (p[0] + 6).toFixed(0), y: (p[1] + 4).toFixed(0), fill: COL.text, 'data-layer': layer }, g);
      t.textContent = T(k, fr);
      line([W + 0.12, 0, z], [W + 0.45, 0, z], { stroke: COL.text, 'stroke-width': 1 }, g);
      return t;
    };
    this.labels = { plafond: mk('leg.plafond', 'Faux-plafond', ZC, 'plafond'), cloisons: mk('leg.cloisons', 'Cloisons', H / 2, 'cloisons'), plancher: mk('leg.plancher', 'Faux-plancher', ZF, 'plancher') };
  };

  /* ---------- États et animations */
  IsoRoom.prototype.prime = function () {
    var g = this.gsap; if (!g) return;
    g.set(this.floorTiles, { opacity: 0, y: -26 });
    g.set(this.peds, { opacity: 0 });
    g.set(this.panes, { opacity: 0, x: 26, y: 15 });
    g.set(this.ceilTiles, { opacity: 0 });
    g.set(this.lights, { opacity: 0.08 });
    g.set(this.g.guides, { opacity: 0.25 });
    this.revealed = {};
  };
  IsoRoom.prototype.reveal = function (layer) {
    var g = this.gsap; this.revealed = this.revealed || {};
    if (!g || this.revealed[layer]) return null;
    this.revealed[layer] = true;
    var tl = g.timeline();
    if (layer === 'cloisons') {
      tl.to(this.panes, { opacity: 1, x: 0, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, onStart: function () { if (window.SCSSound) window.SCSSound.tink(1); } });
    } else if (layer === 'plafond') {
      tl.to(this.ceilTiles, { opacity: 1, duration: 0.35, ease: 'power1.out', stagger: { each: 0.012, from: 'start' } })
        .to(this.lights, { opacity: 1, duration: 0.25, ease: 'steps(3)', stagger: 0.18 }, '-=0.2');
    } else if (layer === 'plancher') {
      var tiles = this.floorTiles.slice().sort(function (p, q) { return (p.__xy[0] + p.__xy[1]) - (q.__xy[0] + q.__xy[1]); });
      tl.to(this.peds, { opacity: 1, duration: 0.4, stagger: 0.02 })
        .to(tiles, { opacity: 1, y: 0, duration: 0.6, ease: 'bounce.out', stagger: 0.018 }, 0.1)
        .to(this.hole, { opacity: 1, duration: 0.2 }, '+=0.1')
        .to(this.liftTile, { y: -34, duration: 0.6, ease: 'power3.out' }, '<')
        .to(this.liftTile, { y: 0, duration: 0.7, ease: 'bounce.out' }, '+=0.9')
        .to(this.hole, { opacity: 0, duration: 0.2 }, '>-0.1');
    } else if (layer === 'sav') {
      this.scan();
    }
    return tl;
  };
  IsoRoom.prototype.scan = function () {
    var g = this.gsap; if (!g) return;
    if (this.scanTl) { this.scanTl.restart(); return; }
    var self = this, tl = g.timeline({ repeat: 2, repeatDelay: 0.4 });
    g.set([this.dot, this.ring], { opacity: 1 });
    this.path.forEach(function (pt, i) {
      var p = P(pt[0], pt[1], 0);
      if (i > 0) tl.to([self.dot, self.ring], { attr: { cx: p[0], cy: p[1] }, duration: 0.7, ease: 'power2.inOut' });
      tl.fromTo(self.ring, { attr: { r: 5 }, opacity: 1 }, { attr: { r: 22 }, opacity: 0, duration: 0.6, ease: 'power2.out' });
    });
    tl.to(this.dot, { opacity: 0, duration: 0.3 });
    this.scanTl = tl;
  };
  IsoRoom.prototype.focus = function (layer) {
    var g = this.gsap, self = this;
    ['plancher', 'cloisons', 'plafond'].forEach(function (k) {
      var o = (layer === 'sav' || layer === k || !layer) ? 1 : 0.32;
      if (g) g.to(self.g[k], { opacity: o, duration: 0.6 }); else self.g[k].setAttribute('opacity', o);
      if (self.labels[k]) self.labels[k].setAttribute('fill', (layer === k) ? '#F3F2EE' : COL.text);
    });
  };
  IsoRoom.prototype.setType = function (type, animate) {
    this.type = type;
    this.renderPanes();
    if (animate && this.gsap) {
      this.gsap.fromTo(this.panes, { opacity: 0.2, y: -6 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.03 });
      if (window.SCSSound) window.SCSSound.tink(type === 'vitree' || type === 'bord' ? 1.06 : 0.8);
    }
  };
  IsoRoom.prototype.showAll = function () {
    var g = this.gsap;
    var all = [].concat(this.floorTiles, this.peds, this.panes, this.ceilTiles);
    if (g) { g.set(all, { opacity: 1, x: 0, y: 0 }); g.set(this.lights, { opacity: 1 }); }
    else { all.forEach(function (e) { e.removeAttribute('opacity'); }); this.lights.forEach(function (e) { e.setAttribute('opacity', 1); }); }
  };
  /* Devis : couches activées selon les travaux choisis */
  IsoRoom.prototype.setLayers = function (on, animate) {
    var g = this.gsap, self = this;
    ['plancher', 'cloisons', 'plafond'].forEach(function (k) {
      var vis = !!on[k];
      var o = vis ? 1 : 0.1;
      if (g && animate) {
        g.to(self.g[k], { opacity: o, duration: 0.5 });
        if (vis && !self['_was' + k]) {
          if (k === 'cloisons') g.fromTo(self.panes, { opacity: 0, x: 20, y: 12 }, { opacity: 1, x: 0, y: 0, stagger: 0.04, duration: 0.7, ease: 'expo.out' });
          if (k === 'plafond') g.fromTo(self.lights, { opacity: 0.1 }, { opacity: 1, stagger: 0.12, duration: 0.2, ease: 'steps(3)' });
          if (k === 'plancher') g.fromTo(self.floorTiles, { y: -14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.008, duration: 0.5, ease: 'bounce.out' });
        }
      } else self.g[k].setAttribute('opacity', o);
      self['_was' + k] = vis;
      if (self.labels[k]) self.labels[k].setAttribute('fill', vis ? '#F3F2EE' : COL.text);
    });
    if (on.sav && !this._wassav) this.scan();
    this._wassav = !!on.sav;
  };

  window.IsoRoom = IsoRoom;
})();
