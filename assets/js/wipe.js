/* Avant / après : la photo « phase travaux » est posée derrière une vitre légèrement dépolie.
   On l'essuie au doigt ou à la souris pour découvrir la « phase finale ». Curseur clavier en secours. */
(function () {
  'use strict';
  function Wipe(el) {
    this.el = el;
    this.top = el.querySelector('[data-wipe-top]');
    this.wrap = el.parentElement;
    this.range = this.wrap.querySelector('[data-wipe-range]');
    this.all = this.wrap.querySelector('[data-wipe-all]');
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.last = null;
    var self = this;
    var go = function () { self.setup(); };
    if (!this.top) return;
    if (this.top.complete && this.top.naturalWidth) go(); else this.top.addEventListener('load', go, { once: true });
  }
  Wipe.prototype.setup = function () {
    var self = this;
    this.el.insertBefore(this.canvas, this.top.nextSibling);
    this.top.style.visibility = 'hidden';
    this.resize();
    var ro = window.ResizeObserver ? new ResizeObserver(function () { self.resize(); }) : null;
    if (ro) ro.observe(this.el); else window.addEventListener('resize', function () { self.resize(); });
    var move = function (e) {
      var r = self.el.getBoundingClientRect();
      var p = { x: (e.clientX - r.left) * self.dpr, y: (e.clientY - r.top) * self.dpr };
      if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'touch' || e.pointerType === 'pen') self.brush(p);
    };
    this.el.addEventListener('pointermove', move);
    this.el.addEventListener('pointerdown', move);
    this.el.addEventListener('pointerleave', function () { self.last = null; });
    if (this.range) this.range.addEventListener('input', function () { self.linear(this.value / 100); });
    if (this.all) this.all.addEventListener('click', function () {
      var o = { v: self.range ? self.range.value / 100 : 0 };
      if (window.gsap && !(window.SCS && window.SCS.calm)) window.gsap.to(o, { v: 1, duration: 1.2, ease: 'power2.inOut', onUpdate: function () { self.linear(o.v); if (self.range) self.range.value = Math.round(o.v * 100); } });
      else { self.linear(1); if (self.range) self.range.value = 100; }
    });
  };
  Wipe.prototype.resize = function () {
    var r = this.el.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
    this.paint();
    if (this.range && this.range.value > 0) this.linear(this.range.value / 100);
  };
  Wipe.prototype.paint = function () {
    var c = this.ctx, w = this.canvas.width, h = this.canvas.height, img = this.top;
    var ir = img.naturalWidth / img.naturalHeight, cr = w / h, sw, sh, sx, sy;
    if (ir > cr) { sh = img.naturalHeight; sw = sh * cr; sx = (img.naturalWidth - sw) / 2; sy = 0; } else { sw = img.naturalWidth; sh = sw / cr; sx = 0; sy = (img.naturalHeight - sh) / 2; }
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, w, h);
    c.filter = 'blur(' + (0.8 * this.dpr) + 'px) saturate(0.9)';
    c.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    c.filter = 'none';
    c.fillStyle = 'rgba(236, 242, 241, 0.26)';
    c.fillRect(0, 0, w, h);
    var g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0.3, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.16)'); g.addColorStop(0.5, 'rgba(255,255,255,0.04)'); g.addColorStop(0.62, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(250,252,252,0.42)';
    c.fillRect(0, h * 0.6, w, h * 0.07);
  };
  Wipe.prototype.brush = function (p) {
    var c = this.ctx, rad = Math.max(40, this.canvas.width * 0.075);
    c.globalCompositeOperation = 'destination-out';
    var from = this.last || p, steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / (rad * 0.25)));
    for (var i = 1; i <= steps; i++) {
      var x = from.x + (p.x - from.x) * i / steps, y = from.y + (p.y - from.y) * i / steps;
      var g = c.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.6, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
    }
    this.last = p;
    if (!this.el.classList.contains('is-used')) this.el.classList.add('is-used');
  };
  Wipe.prototype.linear = function (v) {
    this.paint();
    var c = this.ctx, w = this.canvas.width, h = this.canvas.height, edge = w * 0.08, x = v * (w + edge) - edge;
    c.globalCompositeOperation = 'destination-out';
    var g = c.createLinearGradient(x, 0, x + edge, 0);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = '#000'; c.fillRect(0, 0, Math.max(0, x), h);
    c.fillStyle = g; c.fillRect(x, 0, edge, h);
    c.globalCompositeOperation = 'source-over';
    if (v > 0) this.el.classList.add('is-used');
  };
  window.Wipe = Wipe;
})();
