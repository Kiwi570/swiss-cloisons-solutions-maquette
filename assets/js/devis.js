/* Demande de devis en 5 étapes (démonstration : rien n'est envoyé).
   Le schéma du plateau se construit selon les travaux choisis ; brouillon gardé sur l'appareil. */
(function () {
  'use strict';
  var d = document, SCS = window.SCS, gsap = window.gsap, calm = SCS.calm;
  var form = d.getElementById('devis-form');
  if (!form) return;
  var steps = Array.prototype.slice.call(form.querySelectorAll('.form-step'));
  var etapes = d.querySelectorAll('.etapes li');
  var prev = form.querySelector('[data-prev]'), next = form.querySelector('[data-next]'), submit = form.querySelector('[data-submit]');
  var okBox = d.querySelector('[data-ok]');
  var KEY = 'scs-devis-brouillon';
  var cur = 0;
  var room = window.IsoRoom ? new window.IsoRoom(d.getElementById('iso-devis')) : null;
  if (room) { room.showAll(); room.setLayers({}, false); }
  var T = SCS.t;

  var $$ = function (sel) { return Array.prototype.slice.call(form.querySelectorAll(sel)); };
  var checked = function (name) { return $$('[name="' + name + '"]').filter(function (i) { return i.checked; }); };
  var labelOf = function (input) { var l = input.closest('label'); var s = l && l.querySelector('span, b'); return s ? s.textContent.trim() : input.value; };
  var trades = function () { return checked('travaux').map(function (i) { return i.value; }); };
  var tradeLabels = function () { return checked('travaux').map(function (i) { return i.closest('label').querySelector('b').textContent.trim(); }); };

  function conditional() {
    var t = trades();
    $$('[data-for]').forEach(function (q) { q.hidden = t.indexOf(q.getAttribute('data-for')) < 0; });
  }
  var TYPE = { 'Vitrées': 'vitree', 'Bord à bord': 'bord', 'Amovibles': 'amovible', 'Mobiles': 'mobile', 'Plâtrerie': 'platrerie', 'Pleines': 'pleine', 'Coupe-feu': 'coupefeu' };
  function preview(animate) {
    var t = trades();
    if (room) {
      room.setLayers({ cloisons: t.indexOf('cloisons') >= 0, plafond: t.indexOf('plafonds') >= 0, plancher: t.indexOf('planchers') >= 0, sav: t.indexOf('sav') >= 0 }, animate && !calm && !!gsap);
      var tc = checked('type_cloisons');
      var ty = tc.length ? TYPE[tc[tc.length - 1].value] : 'vitree';
      if (room.type !== ty) room.setType(ty, animate && !calm);
    }
    var sum = d.querySelector('[data-sum]');
    var s = form.elements.surface.value;
    sum.textContent = t.length ? tradeLabels().join(' · ') + ' — ' + s + ' m²' : T('dv.sumvide', 'Choisissez vos travaux : le schéma se construit.');
  }

  /* ---------- Brouillon */
  function save() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'file') return;
      if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) (data[el.name] = data[el.name] || []).push(el.value); }
      else data[el.name] = el.value;
    });
    data.__step = cur;
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* stockage indisponible */ }
  }
  function restore() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { return false; }
    if (!raw) return false;
    var data; try { data = JSON.parse(raw); } catch (e) { return false; }
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'file' || !(el.name in data)) return;
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = [].concat(data[el.name]).indexOf(el.value) >= 0;
      else el.value = data[el.name];
    });
    return true;
  }
  function clearDraft() { try { window.localStorage.removeItem(KEY); } catch (e) { /* rien */ } }
  var draftNote = d.querySelector('[data-draft]');
  if (restore()) { draftNote.hidden = false; }
  // Les radios « checked » par défaut sont réappliquées si le brouillon n'en contenait pas
  d.querySelector('[data-draft-clear]').addEventListener('click', function () { clearDraft(); form.reset(); syncSurface(form.elements.surface.value); conditional(); preview(true); draftNote.hidden = true; go(0); });

  /* ---------- Surface */
  var range = d.getElementById('surface-range');
  function syncSurface(v) { range.value = Math.min(3000, Math.max(10, v || 10)); }
  range.addEventListener('input', function () { form.elements.surface.value = range.value; preview(false); });
  form.elements.surface.addEventListener('input', function () { syncSurface(this.value); preview(false); });
  syncSurface(form.elements.surface.value);

  /* ---------- Fichiers (restent locaux) */
  var plans = d.getElementById('plans'), filesOut = d.querySelector('[data-files]');
  var filesDefault = filesOut.textContent;
  plans.addEventListener('change', function () {
    var names = Array.prototype.map.call(plans.files, function (f) { return f.name; });
    filesOut.textContent = names.length ? names.join(', ') + ' — ' + T('dv.local', 'restent sur votre appareil') : filesDefault;
  });

  form.addEventListener('change', function (e) {
    if (e.target.name === 'travaux' || e.target.name === 'type_cloisons') { conditional(); preview(true); }
    save();
  });
  form.addEventListener('input', function () { save(); });

  /* ---------- Validation */
  function setErr(id, msg) {
    var e = d.getElementById(id + '-err');
    if (e) e.textContent = msg || '';
    var f = d.getElementById(id);
    var box = f && f.closest('.field');
    if (box) box.classList.toggle('has-err', !!msg);
    if (f) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate(i) {
    var bad = null;
    if (i === 0) {
      var ok = trades().length > 0;
      d.getElementById('travaux-err').textContent = ok ? '' : T('dv.e.travaux', 'Choisissez au moins un type de travaux.');
      if (!ok) bad = d.getElementById('t-cloisons');
    }
    if (i === 3) {
      var req = [['entreprise', T('dv.e.entreprise', "Indiquez le nom de l’entreprise.")], ['prenom', T('dv.e.prenom', 'Indiquez votre prénom.')], ['nom', T('dv.e.nom', 'Indiquez votre nom.')], ['email', ''], ['tel', ''], ['objet', T('dv.e.objet', "Indiquez l’objet de votre demande.")], ['message', T('dv.e.message', 'Décrivez votre besoin en quelques mots.')]];
      req.forEach(function (r) {
        var el = d.getElementById(r[0]), v = el.value.trim(), msg = '';
        if (r[0] === 'email') msg = !v ? T('dv.e.email0', 'Indiquez votre e-mail.') : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : T('dv.e.email', "Cet e-mail semble incomplet, par exemple nom@entreprise.ch."));
        else if (r[0] === 'tel') msg = !v ? T('dv.e.tel0', 'Indiquez un numéro de téléphone.') : (v.replace(/\D/g, '').length >= 8 ? '' : T('dv.e.tel', 'Ce numéro semble trop court : au moins 8 chiffres.'));
        else if (!v) msg = r[1];
        setErr(r[0], msg);
        if (msg && !bad) bad = el;
      });
      var c = d.getElementById('consent');
      d.getElementById('consent-err').textContent = c.checked ? '' : T('dv.e.consent', 'Cochez la case pour que nous puissions traiter votre demande.');
      if (!c.checked && !bad) bad = c;
    }
    if (bad) { bad.focus(); if (gsap && !calm) gsap.fromTo(steps[i], { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }); }
    return !bad;
  }

  /* ---------- Récapitulatif */
  function recap() {
    var dl = form.querySelector('[data-recap]');
    var F = form.elements;
    var types = checked('type_cloisons').concat(checked('type_plafonds'), checked('type_planchers')).map(labelOf);
    var loc = checked('locaux')[0], occ = checked('occupes')[0];
    var sel = function (s) { return s.options[s.selectedIndex].textContent; };
    var rows = [
      [T('dv.r.travaux', 'Travaux'), tradeLabels().join(', '), 0],
      [T('dv.r.precisions', 'Précisions'), types.length ? types.join(', ') : '—', 1],
      [T('dv.r.surface', 'Surface'), F.surface.value + ' m²', 1],
      [T('dv.r.locaux', 'Locaux'), (loc ? labelOf(loc) : '—') + (occ ? ' · ' + T('dv.r.occupes', 'occupés pendant les travaux') + ' : ' + labelOf(occ).toLowerCase() : ''), 1],
      [T('dv.r.lieu', 'Lieu'), sel(F.lieu) + (F.localite.value ? ', ' + F.localite.value : ''), 2],
      [T('dv.r.debut', 'Début'), sel(F.debut), 2],
      [T('dv.r.fichiers', 'Fichiers'), plans.files.length ? Array.prototype.map.call(plans.files, function (f) { return f.name; }).join(', ') : '—', 2],
      [T('dv.r.entreprise', 'Entreprise'), F.entreprise.value, 3],
      [T('dv.r.contact', 'Contact'), F.prenom.value + ' ' + F.nom.value + ' · ' + F.email.value + ' · ' + F.indicatif.value + ' ' + F.tel.value, 3],
      [T('dv.r.objet', 'Objet'), F.objet.value, 3],
      [T('dv.r.message', 'Message'), F.message.value, 3]
    ];
    dl.innerHTML = '';
    rows.forEach(function (r) {
      var div = d.createElement('div');
      var dt = d.createElement('dt'); dt.textContent = r[0];
      var dd = d.createElement('dd'); dd.textContent = r[1];
      var b = d.createElement('button'); b.type = 'button'; b.textContent = T('dv.modifier', 'Modifier'); b.setAttribute('aria-label', T('dv.modifier', 'Modifier') + ' : ' + r[0]);
      b.addEventListener('click', function () { go(r[2]); });
      div.appendChild(dt); div.appendChild(dd); div.appendChild(b); dl.appendChild(div);
    });
  }

  /* ---------- Navigation */
  function go(i, fromNext) {
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, k) { s.hidden = k !== cur; });
    etapes.forEach(function (li, k) { li.classList.toggle('is-done', k < cur); li.classList.toggle('is-current', k === cur); if (k === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); var bt = li.querySelector('button'); if (bt) bt.disabled = !(k < cur); });
    prev.hidden = cur === 0;
    next.hidden = cur === steps.length - 1;
    submit.hidden = cur !== steps.length - 1;
    if (cur === 3 && !form.elements.objet.value) form.elements.objet.value = T('dv.objetauto', 'Devis') + ' : ' + tradeLabels().join(', ');
    if (cur === 4) recap();
    if (gsap && !calm) gsap.from(steps[cur].querySelectorAll('legend, .q, .field, .recap, .tiles'), { y: 18, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 });
    if (fromNext) {
      var top = d.querySelector('.etapes');
      if (SCS.lenis) SCS.lenis.scrollTo(top, { offset: -110 }); else top.scrollIntoView({ block: 'start' });
      var lg = steps[cur].querySelector('legend .h3');
      if (lg) { lg.setAttribute('tabindex', '-1'); lg.focus({ preventScroll: true }); }
      if (window.SCSSound) window.SCSSound.tink(0.9 + cur * 0.05);
    }
    save();
  }
  next.addEventListener('click', function () { if (validate(cur)) go(cur + 1, true); });
  d.querySelectorAll('.etapes [data-goto]').forEach(function (bt) { bt.addEventListener('click', function () { var k = +bt.getAttribute('data-goto'); if (k < cur) go(k, true); }); });
  prev.addEventListener('click', function () { go(cur - 1, true); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio' && cur < steps.length - 1) { e.preventDefault(); next.click(); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    for (var i = 0; i < steps.length - 1; i++) { if (!(i === 0 || i === 3) ) continue; if (!validate(i)) { go(i); validate(i); return; } }
    var prenom = form.elements.prenom.value.trim();
    okBox.querySelector('[data-ok-title]').textContent = T('dv.merci', 'Merci') + (prenom ? ', ' + prenom : '') + '.';
    form.hidden = true;
    d.querySelector('.etapes').hidden = true;
    okBox.hidden = false;
    okBox.focus();
    clearDraft();
    if (room) room.scan();
    if (window.SCSSound) window.SCSSound.tink(1.2);
    if (gsap && !calm) { gsap.from(okBox, { y: 30, opacity: 0, duration: 0.8, ease: 'expo.out' }); var p = okBox.querySelector('path'); var L = p.getTotalLength(); gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.2 }); }
  });
  d.querySelector('[data-restart]').addEventListener('click', function () {
    form.reset(); syncSurface(form.elements.surface.value); plans.dispatchEvent(new Event('change'));
    okBox.hidden = true; form.hidden = false; d.querySelector('.etapes').hidden = false;
    conditional(); preview(true); go(0, true);
  });

  conditional();
  preview(false);
  var startStep = 0;
  try { var dd0 = JSON.parse(window.localStorage.getItem(KEY) || '{}'); startStep = Math.min(dd0.__step || 0, 3); } catch (e) { /* rien */ }
  go(startStep);

  SCS.boot.then(function () {
    if (!gsap || calm) return;
    var h1 = d.querySelector('.devis-hero h1');
    if (h1) SCS.splitLines(h1, { delay: SCS.swept ? 0.4 : 0.1 });
    gsap.from('.devis-hero .eyebrow, .devis-hero .lead, .demo-note, .etapes, .devis__aside > *', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: SCS.swept ? 0.5 : 0.2 });
    gsap.from('.hd__in', { y: -30, opacity: 0, duration: 1, ease: 'expo.out' });
  });
})();
