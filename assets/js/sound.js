/* Ambiance sonore synthétisée (aucun fichier) : un open space qui s'étouffe derrière la vitre,
   puis que le plafond acoustique absorbe. Démarre uniquement après un clic du visiteur. */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master, lp, pre, dry, wet, conv, ui;
  var voices = [], timers = [], on = false;
  var state = { open: 1, absorb: 0 };

  function noise(sec) {
    var len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
    return buf;
  }
  function impulse(sec, decay) {
    var len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = buf.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  function build() {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 11000; lp.Q.value = 0.4;
    pre = ctx.createGain(); dry = ctx.createGain(); dry.gain.value = 0.85;
    conv = ctx.createConvolver(); conv.buffer = impulse(2.6, 2.4);
    wet = ctx.createGain(); wet.gain.value = 0.38;
    pre.connect(dry); pre.connect(conv); conv.connect(wet);
    dry.connect(lp); wet.connect(lp); lp.connect(master); master.connect(ctx.destination);
    ui = ctx.createGain(); ui.gain.value = 0.22; ui.connect(ctx.destination);
    // bruit de fond de la pièce (ventilation)
    var bed = ctx.createBufferSource(); bed.buffer = noise(5); bed.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.5;
    var g = ctx.createGain(); g.gain.value = 0.5;
    bed.connect(bp); bp.connect(g); g.connect(pre); bed.start();
    // murmures : bruit filtré par des formants, modulé comme des syllabes
    for (var i = 0; i < 5; i++) {
      var s = ctx.createBufferSource(); s.buffer = noise(3 + i * 0.37); s.loop = true;
      var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 420 + i * 150; f1.Q.value = 5;
      var f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1200 + i * 240; f2.Q.value = 7;
      var env = ctx.createGain(); env.gain.value = 0;
      var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      s.connect(f1); s.connect(f2); f1.connect(env); f2.connect(env);
      if (pan) { pan.pan.value = (i / 4) * 1.6 - 0.8; env.connect(pan); pan.connect(pre); } else env.connect(pre);
      s.start();
      voices.push({ env: env, f1: f1, f2: f2, talk: Math.random() < 0.5 });
    }
  }
  function tickVoices() {
    var t = ctx.currentTime;
    voices.forEach(function (v) {
      if (Math.random() < 0.04) v.talk = !v.talk;
      var target = v.talk && Math.random() < 0.7 ? 0.5 + Math.random() * 0.9 : 0;
      v.env.gain.setTargetAtTime(target, t, 0.035);
      if (Math.random() < 0.15) { v.f1.frequency.setTargetAtTime(350 + Math.random() * 500, t, 0.05); v.f2.frequency.setTargetAtTime(1000 + Math.random() * 1400, t, 0.05); }
    });
  }
  function key() {
    var t = ctx.currentTime, n = 1 + Math.floor(Math.random() * 6);
    for (var k = 0; k < n; k++) {
      var src = ctx.createBufferSource(); src.buffer = noise(0.03);
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
      var g = ctx.createGain(); var at = t + k * (0.09 + Math.random() * 0.06);
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.35, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
      src.connect(hp); hp.connect(g); g.connect(pre); src.start(at); src.stop(at + 0.06);
    }
    timers.push(setTimeout(key, 700 + Math.random() * 2600));
  }
  function apply() {
    if (!ctx) return;
    var t = ctx.currentTime;
    lp.frequency.setTargetAtTime(260 + Math.pow(state.open, 2.2) * 11000, t, 0.08);
    wet.gain.setTargetAtTime(0.04 + 0.38 * (1 - state.absorb), t, 0.25);
    if (on) master.gain.setTargetAtTime(0.32 + 0.5 * state.open, t, 0.3);
  }
  function enable() {
    if (!AC) return false;
    if (!ctx) build();
    if (ctx.state === 'suspended') ctx.resume();
    on = true;
    timers.push(setInterval(tickVoices, 95));
    key();
    apply();
    return true;
  }
  function disable() {
    on = false;
    timers.forEach(function (x) { clearTimeout(x); clearInterval(x); });
    timers = [];
    if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.15); setTimeout(function () { if (!on && ctx) ctx.suspend(); }, 700); }
    return false;
  }
  window.SCSSound = {
    toggle: function () { return on ? disable() : enable(); },
    enable: enable,
    disable: disable,
    get on() { return on; },
    setOpen: function (v) { state.open = Math.max(0, Math.min(1, v)); apply(); },
    setAbsorb: function (v) { state.absorb = Math.max(0, Math.min(1, v)); apply(); },
    tink: function (pitch) {
      if (!on || !ctx) return;
      var t = ctx.currentTime, p = pitch || 1;
      [2637, 4186, 5274].forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f * p;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 / (i + 1), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5 - i * 0.12);
        o.connect(g); g.connect(ui); o.start(t); o.stop(t + 0.55);
      });
    }
  };
})();
