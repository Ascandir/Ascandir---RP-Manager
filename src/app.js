/* =========================================================================
   Ascandir InteractiveMap · Anwendung
   ========================================================================= */
(function () {
  'use strict';
  const { t } = window.I18N;
  const SW = window.IAM_WORLDS.starwars;
  const GEO = SW.GEO; // Galaxie-Form (auch für eigene Sci-Fi-Welten)
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = p => p + Math.random().toString(36).slice(2, 9);
  const clone = o => JSON.parse(JSON.stringify(o));
  const FS = window.iamFS || null;
  let dataVersion = 0, editVersion = 0, interactUntil = 0, interactTimer = null;
  const bump = () => { dataVersion++; };
  function interacting() {
    interactUntil = performance.now() + 220;
    clearTimeout(interactTimer); interactTimer = setTimeout(() => draw(), 240);
  }
  const APP_REPO = 'https://github.com/Ascandir/Ascandir---SWGM/releases';

  // ------------------------------------------------------------- Welttypen
  const WORLD_TYPES = {
    scifi: { types: ['sun', 'planet', 'moon', 'station'], child: ['moon', 'station'], order: { sun: 0, planet: 1, moon: 2, station: 3 } },
    fantasy: { types: ['capital', 'city', 'village', 'fortress', 'landmark'], child: [], order: { capital: 0, city: 1, fortress: 2, village: 3, landmark: 4 } }
  };
  const FANTASY_SIZE = { w: 2300, h: 1700 };
  const GERMAN_REGION = { 'Tiefkern': 'deepcore', 'Kern': 'core', 'Kolonien': 'colonies', 'Innerer Rand': 'innerrim', 'Expansionsregion': 'expansion', 'Mittlerer Rand': 'midrim', 'Äußerer Rand': 'outerrim', 'Wilder Raum': 'wildspace', 'Unbekannte Regionen': 'unknown', 'Huttenraum': 'huttspace' };

  // ------------------------------------------------------------- Einstellungen
  const STORE_SET = 'iam.settings.v2';
  function loadJSON(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } }
  const oldSet = loadJSON('swgm.settings.v1', {});
  const settings = Object.assign({
    lang: (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en',
    theme: 'auto', mapStyle: 'atlas', autoUpdate: true, terrStyle: 'borders', activeWorld: 'starwars', activeTl: {}, years: {},
    types: Object.assign({ sun: true, planet: true, moon: true, station: true, capital: true, city: true, village: true, fortress: true, landmark: true }, oldSet.types || {}),
    opts: Object.assign({ influence: true, regions: true, grid: false, names: true, routes: true, sectors: true, atlas: true }, oldSet.opts || {}),
    hiddenFactions: oldSet.hiddenFactions || [],
    planner: { stops: ['', ''], cls: 1, stay: 0, mode: 'horse', km: 1 }
  }, loadJSON(STORE_SET, {}));
  window.I18N.setLang(settings.lang);

  // ------------------------------------------------------------- Zustand
  const state = {
    worlds: [], timelines: [], world: null, tl: null, year: 0,
    hiddenFactions: new Set(settings.hiddenFactions),
    mode: 'view', tool: 'select', activeFaction: null, brush: 90,
    newType: null, newName: '', attach: true, routeDraft: null,
    selected: null, hover: null,
    view: { cx: GEO.center.x, cy: GEO.center.y, z: 0.35 },
    track: { a: -100, b: 100 },
    undo: [], appInfo: { version: 'dev', packaged: false }, upd: null,
    plannerOpen: false, pick: null, plan: null
  };
  const wtype = () => WORLD_TYPES[state.world.type] || WORLD_TYPES.scifi;
  // Gast = Server-Version mit Passwort, aber nicht angemeldet -> nur ansehen
  const srvInfo = () => (FS && FS.server && FS.info) ? FS.info() : null;
  const isGuest = () => { const i = srvInfo(); return !!(i && i.loginRequired && !i.user); };
  const isAdminUser = () => { const i = srvInfo(); return !i || !i.loginRequired || !!i.admin; };
  const canCreate = (w = state.world) => { const i = srvInfo(); return !isGuest() && (isAdminUser() || ((i.worldAccess || {})[w.id] === 'edit')); };
  const canEditTl = (tl = state.tl) => !!tl && !tl.readonly && tl._editable !== false && !isGuest();
  const isSW = () => state.world.geometry === 'galaxy-sw';
  const worldName = w => w.builtin ? (w.name[window.I18N.lang] || w.name.de) : w.name;
  const editable = () => state.mode === 'edit' && canEditTl();
  const facById = id => state.tl.factions.find(f => f.id === id);
  const typeOrder = o => wtype().order[o.type] ?? 9;
  const typeLabel = ty => t('types.' + ty);
  const regionLabel = r => r ? (isSW() ? t('regions.' + r) : r) : '–';

  // ------------------------------------------------------------- Jahre & Zeitalter
  function yearFmt() {
    const w = state.world;
    if (w.builtin) return w.yearFmt[window.I18N.lang] || w.yearFmt.de;
    return w.yearFmt || { neg: '', pos: '' };
  }
  function fmtYear(y) {
    if (y == null || y === '' || isNaN(y)) return '–';
    y = Math.round(+y);
    const f = yearFmt();
    const loc = window.I18N.lang === 'en' ? 'en-US' : 'de-DE';
    if (y < 0 && f.neg) return `${(-y).toLocaleString(loc)} ${f.neg}`;
    if (y >= 0 && f.pos) return `${y.toLocaleString(loc)} ${f.pos}`;
    return y.toLocaleString(loc);
  }
  function parseYear(str) {
    const s = String(str).trim().replace(/[.,\s](?=\d{3}\b)/g, '');
    const m = s.match(/^([+-]?\d+)\s*(.*)$/); if (!m) return null;
    let n = parseInt(m[1], 10);
    const suf = m[2].trim().toLowerCase();
    if (suf) {
      const negs = ['vsy', 'bby', 'v. z.', 'v.z.', 'bc', 'v. chr.', 'v.chr.'];
      const f = yearFmt();
      if (f.neg && suf === f.neg.toLowerCase() || negs.includes(suf)) n = -Math.abs(n);
    }
    return n;
  }
  const sortedEras = () => state.tl.eras.slice().sort((a, b) => a.year - b.year);
  function eraAt(y) { let cur = null; for (const e of sortedEras()) { if (e.year <= y) cur = e; else break; } return cur; }
  const era = () => eraAt(state.year);
  function eraEnd(e) { const s = sortedEras(); const i = s.indexOf(e); return i >= 0 && i < s.length - 1 ? s[i + 1].year - 1 : null; }
  function existsNow(o) {
    const y = state.year;
    return (o.from == null || o.from === '' || y >= +o.from) && (o.to == null || o.to === '' || y <= +o.to);
  }

  // ------------------------------------------------------------- Daten laden / speichern
  const lastWritten = {};
  const serialize = obj => { const c = Object.assign({}, obj); delete c._file; delete c.readonly; delete c.builtin; return JSON.stringify(c, null, 2); };
  const slugify = n => (String(n || 'unbenannt').normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'unbenannt').slice(0, 60);
  function fileFor(obj, list) {
    if (obj._file) return obj._file;
    const used = new Set(list.map(x => x._file).filter(Boolean));
    const base = slugify(obj.name); let f = base + '.json', i = 2;
    while (used.has(f)) f = `${base}_${i++}.json`;
    return (obj._file = f);
  }
  function normalizeTimeline(tl) {
    const tlx = tl.timeline || tl;
    if (!Array.isArray(tlx.objects) || !Array.isArray(tlx.eras) || !Array.isArray(tlx.factions)) throw new Error('"objects", "eras", "factions" fehlen / missing');
    tlx.world ||= 'starwars';
    tlx.routes = Array.isArray(tlx.routes) ? tlx.routes : [];
    const mapRegion = r => GERMAN_REGION[r] || r;
    tlx.objects.forEach(o => { o.id ||= uid('o'); o.x = +o.x || 0; o.y = +o.y || 0; o.region = mapRegion(o.region); o.name ??= '?'; });
    tlx.factions.forEach(f => { f.id ||= uid('f'); f.color ||= '#888888'; f.reach = +f.reach || 120; f.name ??= '?'; });
    tlx.eras.forEach(e => {
      e.id ||= uid('era'); e.year = +e.year || 0; e.control ||= {}; e.zones ||= [];
      const rc = {}; for (const [k, v] of Object.entries(e.regionClaims || {})) rc[mapRegion(k)] = v; e.regionClaims = rc;
    });
    tlx.routes.forEach(r => { r.id ||= uid('r'); r.points ||= []; r.kind ||= 'minor'; });
    tlx.eras.sort((a, b) => a.year - b.year);
    tlx.id ||= uid('tl'); tlx.name ||= t('withoutName'); tlx.readonly = false;
    return tlx;
  }
  function parseTimeline(text) {
    const j = JSON.parse(text);
    if (j && j.type === 'FeatureCollection') return normalizeTimeline(fromGeoJSON(j));
    return normalizeTimeline(j);
  }
  function normalizeWorld(w) {
    if (!w || !w.id || !w.name) throw new Error('id/name missing');
    w.type = WORLD_TYPES[w.type] ? w.type : 'scifi';
    w.yearFmt ||= { neg: '', pos: '' };
    w.builtin = false; w.geometry = w.type === 'scifi' ? 'galaxy' : 'land';
    return w;
  }

  async function loadData() {
    state.worlds = [SW];
    state.timelines = [SW.canonTimeline(settings.lang)];
    const bad = [];
    if (FS) {
      for (const { file, content, error } of await FS.list('worlds')) {
        try { if (error) throw new Error(error); const w = normalizeWorld(JSON.parse(content)); w._file = file; lastWritten['worlds/' + file] = content; state.worlds.push(w); }
        catch (e) { bad.push(`worlds/${file}: ${e.message}`); }
      }
      for (const { file, content, error, editable } of await FS.list('timelines')) {
        try {
          if (error) throw new Error(error);
          const tl = parseTimeline(content); tl._file = file; lastWritten['timelines/' + file] = content;
          if (editable === false) tl._editable = false;
          if (state.timelines.some(x => x.id === tl.id)) tl.id = uid('tl');
          state.timelines.push(tl);
        } catch (e) { bad.push(`timelines/${file}: ${e.message}`); }
      }
    } else {
      for (const w of loadJSON('iam.worlds.v1', [])) try { state.worlds.push(normalizeWorld(w)); } catch { }
      const tls = loadJSON('iam.timelines.v2', null) || loadJSON('swgm.timelines.v1', []);
      for (const tl of tls) try { state.timelines.push(normalizeTimeline(tl)); } catch { }
    }
    // Zeitlinien ohne bekannte Welt -> Star Wars
    for (const tl of state.timelines) if (!state.worlds.some(w => w.id === tl.world)) tl.world = 'starwars';
    // Server mit Rechten: Star Wars (Kanon) ausblenden, wenn kein Zugriff
    const si = srvInfo();
    if (si && si.loginRequired && !si.admin && (si.worldAccess || {}).starwars === 'none') {
      state.timelines = state.timelines.filter(x => x.id !== 'canon');
      if (!state.timelines.some(x => x.world === 'starwars')) state.worlds = state.worlds.filter(w => w.id !== 'starwars');
    }
    if (bad.length) setTimeout(() => alert(t('badFiles', bad.join('\n'))), 400);
  }

  let saveTimer = null;
  function saveSoon() {
    bump();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      settings.hiddenFactions = [...state.hiddenFactions];
      settings.activeWorld = state.world.id;
      settings.activeTl[state.world.id] = state.tl.id;
      settings.years[state.tl.id] = state.year;
      try { localStorage.setItem(STORE_SET, JSON.stringify(settings)); } catch { }
      if (!FS) {
        try {
          localStorage.setItem('iam.worlds.v1', JSON.stringify(state.worlds.filter(w => !w.builtin).map(w => JSON.parse(serialize(w)))));
          localStorage.setItem('iam.timelines.v2', JSON.stringify(state.timelines.filter(x => !x.readonly).map(x => JSON.parse(serialize(x)))));
        } catch (e) { console.error(e); }
        return;
      }
      if (isGuest()) return;
      const customWorlds = state.worlds.filter(w => !w.builtin);
      if (isAdminUser()) for (const w of customWorlds) await writeFile('worlds', fileFor(w, customWorlds), serialize(w));
      const tls = state.timelines.filter(x => !x.readonly);
      for (const x of tls) { const f = fileFor(x, tls); if (x._editable === false) { lastWritten['timelines/' + f] ??= serialize(x); continue; } await writeFile('timelines', f, serialize(x)); }
    }, 300);
  }
  async function writeFile(dir, file, content) {
    const key = dir + '/' + file;
    if (lastWritten[key] === content) return;
    lastWritten[key] = content;
    try { await FS.save(dir, file, content); } catch (e) { console.error(e); toast(t('saveFailed', e.message)); }
  }
  async function onExternalChange(dir, file) {
    let content; try { content = await FS.read(dir, file); } catch { return; }
    const key = dir + '/' + file;
    if (content != null && content === lastWritten[key]) return;
    if (dir === 'worlds') {
      const i = state.worlds.findIndex(w => w._file === file);
      if (content == null) { if (i >= 0) { state.worlds.splice(i, 1); if (state.world._file === file) switchWorld('starwars'); else renderAll(); } return; }
      try { const w = normalizeWorld(JSON.parse(content)); w._file = file; lastWritten[key] = content; if (i >= 0) { const act = state.world === state.worlds[i]; state.worlds[i] = w; if (act) state.world = w; } else state.worlds.push(w); applyTheme(); renderAll(); toast(t('reloaded', w.name)); }
      catch (e) { toast(t('fileError', file, e.message)); }
      return;
    }
    const i = state.timelines.findIndex(x => x._file === file);
    if (content == null) {
      if (i < 0) return;
      const act = state.timelines[i] === state.tl; state.timelines.splice(i, 1); delete lastWritten[key];
      if (act) selectTimeline(timelinesOfWorld()[0].id); else renderAll();
      toast(t('removedFile', file)); return;
    }
    try {
      const tl = parseTimeline(content); tl._file = file; lastWritten[key] = content;
      if (!state.worlds.some(w => w.id === tl.world)) tl.world = 'starwars';
      if (i >= 0) { tl.id = state.timelines[i].id; if (state.timelines[i]._editable === false) tl._editable = false; const act = state.timelines[i] === state.tl; state.timelines[i] = tl; if (act) state.tl = tl; }
      else { if (state.timelines.some(x => x.id === tl.id)) tl.id = uid('tl'); state.timelines.push(tl); }
      renderAll(); toast(t('reloaded', tl.name));
    } catch (e) { toast(t('fileError', file, e.message)); }
  }

  function pushUndo() { editVersion++; state.undo.push(JSON.stringify({ id: state.tl.id, data: state.tl })); if (state.undo.length > 60) state.undo.shift(); }
  function undo() {
    const s = state.undo.pop(); if (!s) return;
    const { id, data } = JSON.parse(s);
    const i = state.timelines.findIndex(x => x.id === id); if (i < 0) return;
    state.timelines[i] = data; if (state.tl.id === id) state.tl = data;
    renderAll(true);
  }

  // ------------------------------------------------------------- Welt & Zeitlinie wechseln
  const timelinesOfWorld = (w = state.world) => state.timelines.filter(x => x.world === w.id);
  function switchWorld(id) {
    state.world = state.worlds.find(w => w.id === id) || state.worlds[0] || SW;
    let tls = timelinesOfWorld();
    if (!tls.length) { const tl = emptyTimeline(t('mainTimeline')); state.timelines.push(tl); tls = [tl]; }
    const tlId = settings.activeTl[state.world.id];
    state.tl = tls.find(x => x.id === tlId) || tls[0];
    state.newType = wtype().types[1] || wtype().types[0];
    state.selected = null; state.routeDraft = null; state.undo = [];
    applyTheme();
    initYear(); fitView(); fitTrack();
    renderAll(true);
  }
  function selectTimeline(id) {
    const tl = state.timelines.find(x => x.id === id); if (!tl) return;
    state.tl = tl; state.selected = null; state.routeDraft = null;
    if (!eraAt(state.year) && tl.eras.length) initYear();
    fitTrack(); renderAll(true);
  }
  function initYear() {
    const saved = settings.years[state.tl.id];
    const eras = sortedEras();
    state.year = saved != null ? saved : state.tl.id === 'canon' ? 0 : (eras.length ? eras[0].year : 0);
  }
  function emptyTimeline(name) {
    return { id: uid('tl'), world: state.world.id, name, readonly: false, factions: [], objects: [], routes: [],
      eras: [{ id: uid('era'), name: t('eraN', 1), year: 0, desc: '', control: {}, regionClaims: {}, zones: [] }] };
  }

  // ------------------------------------------------------------- Design
  function applyTheme() {
    const th = settings.theme === 'auto' ? (state.world.type === 'fantasy' ? 'fantasy' : 'scifi') : settings.theme;
    document.body.dataset.theme = th;
    document.body.classList.toggle('is-sw', isSW());
    state.theme = th;
  }

  // ------------------------------------------------------------- Canvas
  const canvas = $('#map'), ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const off = document.createElement('canvas'), offCtx = off.getContext('2d');
  const ero = document.createElement('canvas'), eroCtx = ero.getContext('2d');
  const inf = document.createElement('canvas'), infCtx = inf.getContext('2d');
  const glow = document.createElement('canvas');
  const base = document.createElement('canvas'), baseCtx = base.getContext('2d');
  let baseKey = '';
  const paper = document.createElement('canvas');

  function resize() {
    const r = canvas.getBoundingClientRect();
    DPR = window.devicePixelRatio || 1; W = r.width; H = r.height;
    for (const c of [canvas, base]) { c.width = Math.max(1, Math.round(W * DPR)); c.height = Math.max(1, Math.round(H * DPR)); }
    baseKey = '';
    resizeTrack(); draw();
  }

  let rngSeed = 7;
  const rnd = () => (rngSeed = (rngSeed * 16807) % 2147483647) / 2147483647;
  const stars = [];
  (function genStars() {
    for (let i = 0; i < 6500; i++) {
      const arm = i % 4, tt = Math.pow(rnd(), 0.7);
      const r = 40 + tt * 1100, th = arm * Math.PI / 2 + tt * 5.2 + (rnd() - 0.5) * 0.9 * (1 - tt * 0.4), s = GEO.scale(th);
      stars.push({ x: GEO.center.x + Math.cos(th) * r * s + (rnd() - .5) * 60, y: GEO.center.y + Math.sin(th) * r * s + (rnd() - .5) * 60, b: 0.25 + rnd() * 0.75, c: rnd() });
    }
    for (let i = 0; i < 1500; i++) stars.push({ x: -500 + rnd() * 3300, y: -500 + rnd() * 3200, b: 0.15 + rnd() * 0.5, c: rnd() });
  })();
  (function genGlow() {
    const S = 0.5; glow.width = 2600 * S; glow.height = 2600 * S;
    const g = glow.getContext('2d'); g.scale(S, S); g.translate(150, 150);
    const C = GEO.center;
    g.beginPath(); shapePath(g, GEO.edge * 1.05, false, 180);
    const grad = g.createRadialGradient(C.x, C.y, 0, C.x, C.y, 1150);
    grad.addColorStop(0, 'rgba(255,236,190,0.55)'); grad.addColorStop(0.08, 'rgba(255,214,150,0.32)');
    grad.addColorStop(0.3, 'rgba(120,140,220,0.14)'); grad.addColorStop(0.75, 'rgba(70,90,170,0.07)'); grad.addColorStop(1, 'rgba(40,50,120,0)');
    g.fillStyle = grad; g.fill();
    g.globalCompositeOperation = 'lighter';
    for (let arm = 0; arm < 4; arm++) for (let tt = 0; tt < 1; tt += 0.004) {
      const r = 60 + tt * 1050, th = arm * Math.PI / 2 + tt * 5.2, s = GEO.scale(th);
      const x = C.x + Math.cos(th) * r * s, y = C.y + Math.sin(th) * r * s, rad = 40 + 70 * tt;
      const gg = g.createRadialGradient(x, y, 0, x, y, rad);
      gg.addColorStop(0, `rgba(110,140,230,${0.05 * (1 - tt * 0.6)})`); gg.addColorStop(1, 'rgba(110,140,230,0)');
      g.fillStyle = gg; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
  })();
  (function genPaper() {
    paper.width = paper.height = 512;
    const g = paper.getContext('2d');
    g.fillStyle = '#e8d8b2'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
      const x = rnd() * 512, y = rnd() * 512, r = 4 + rnd() * 40;
      g.fillStyle = `rgba(${rnd() < 0.5 ? '120,90,40' : '255,250,235'},${0.012 + rnd() * 0.03})`;
      for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, Math.PI * 2); g.fill(); }
    }
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(90,60,20,${rnd() * 0.06})`; g.fillRect(rnd() * 512, rnd() * 512, 1, 1); }
  })();

  function shapePath(c, r, reverse, N) {
    N = N || (state.view.z > 3 ? 1440 : state.view.z > 1 ? 480 : 180);
    for (let i = 0; i <= N; i++) {
      const k = reverse ? N - i : i, th = (k / N) * Math.PI * 2, s = GEO.scale(th);
      const x = GEO.center.x + Math.cos(th) * r * s, y = GEO.center.y + Math.sin(th) * r * s;
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.closePath();
  }
  function wedgePath(c) {
    const w = GEO.unknownWedge, N = state.view.z > 3 ? 320 : 60;
    for (let i = 0; i <= N; i++) { const th = w.from + (w.to - w.from) * i / N, s = GEO.scale(th); const x = GEO.center.x + Math.cos(th) * GEO.edge * s, y = GEO.center.y + Math.sin(th) * GEO.edge * s; i === 0 ? c.moveTo(x, y) : c.lineTo(x, y); }
    for (let i = N; i >= 0; i--) { const th = w.from + (w.to - w.from) * i / N, s = GEO.scale(th); c.lineTo(GEO.center.x + Math.cos(th) * w.r0 * s, GEO.center.y + Math.sin(th) * w.r0 * s); }
    c.closePath();
  }
  function huttCircle() {
    const n = state.tl.objects.find(o => o.id === 'nalhutta') || state.tl.objects.find(o => o.region === 'huttspace' && o.type === 'planet');
    const p = n ? posOf(n) : { x: 1950, y: 1150 };
    return { x: p.x, y: p.y, r: GEO.huttR || 190 };
  }
  function fillRegion(c, key) {
    if (key === 'unknown') { c.beginPath(); wedgePath(c); c.fill(); return; }
    if (key === 'huttspace') { const h = huttCircle(); c.beginPath(); c.arc(h.x, h.y, h.r, 0, Math.PI * 2); c.fill(); return; }
    const b = GEO.bands.find(b => b.key === key); if (!b) return;
    c.save();
    if (b.r1 > GEO.unknownWedge.r0) { c.beginPath(); c.rect(-5000, -5000, 12000, 12000); wedgePath(c); c.clip('evenodd'); }
    c.beginPath(); shapePath(c, b.r1); if (b.r0 > 0) shapePath(c, b.r0, true);
    c.fill('evenodd'); c.restore();
  }
  function regionAt(x, y) {
    if (!isSW()) return null;
    const h = huttCircle(); if (Math.hypot(x - h.x, y - h.y) <= h.r) return 'huttspace';
    const dx = x - GEO.center.x, dy = y - GEO.center.y, th = Math.atan2(dy, dx), dn = Math.hypot(dx, dy) / GEO.scale(th);
    if (dn > GEO.edge) return null;
    if (SW.inWedge(th) && dn >= GEO.unknownWedge.r0) return 'unknown';
    const b = GEO.bands.find(b => dn >= b.r0 && dn < b.r1); return b ? b.key : null;
  }

  // ------------------------------------------------------------- Positionen
  let posCache = {}, childrenOf = {}, objMap = {};
  // ---- Galaxie-Atlas: ~6.500 weitere offizielle Systeme als Zusatzebene (werden nicht in Zeitlinien gespeichert)
  let atlasState = { key: '', list: [], buckets: new Map(), sectors: [] };
  const AB = 50, bkey = (x, y) => Math.floor(x / AB) + ',' + Math.floor(y / AB);
  function atlasObjs() {
    if (!isSW() || !SW.atlas || !state.tl) return [];
    const key = state.tl.id + '|' + editVersion + '|' + state.tl.objects.length;
    if (atlasState.key === key) return atlasState.list;
    const names = new Set(), ids = new Set();
    for (const o of state.tl.objects) { names.add(SW.normName(o.name)); ids.add(o.id); }
    const list = SW.atlas().filter(a => !ids.has(a.id) && !names.has(SW.normName(a.name)));
    const buckets = new Map();
    for (const a of list) { const k = bkey(a.x, a.y); let b = buckets.get(k); if (!b) buckets.set(k, b = []); b.push(a); }
    // Sektor-Beschriftungen: Schwerpunkt aller Systeme eines Sektors
    const g = {};
    for (const o of list.concat(state.tl.objects.filter(o => !o.parent))) if (o.sector) { const q = (g[o.sector] ||= { n: 0, x: 0, y: 0 }); q.n++; q.x += o.x; q.y += o.y; }
    const sectors = Object.entries(g).map(([name, q]) => ({ name, n: q.n, x: q.x / q.n, y: q.y / q.n })).sort((a, b) => b.n - a.n);
    atlasState = { key, list, buckets, sectors };
    return list;
  }
  const atlasOn = () => isSW() && settings.opts.atlas !== false && settings.types.planet !== false;
  const ATLAS_Z = 0.25, ATLAS_HIT_Z = 0.9, ATLAS_LABEL_Z = 2.4;
  function atlasInView(pad = 20) {
    const a = s2w(-pad, -pad), b = s2w(W + pad, H + pad), out = [];
    atlasObjs();
    const x0 = Math.floor(a.x / AB), x1 = Math.floor(b.x / AB), y0 = Math.floor(a.y / AB), y1 = Math.floor(b.y / AB);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 6000) { for (const o of atlasState.list) if (o.x >= a.x && o.x <= b.x && o.y >= a.y && o.y <= b.y) out.push(o); return out; }
    for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) { const bk = atlasState.buckets.get(ix + ',' + iy); if (bk) for (const o of bk) out.push(o); }
    return out;
  }
  function rebuildTree() {
    childrenOf = {}; objMap = {};
    if (isSW()) for (const a of atlasObjs()) objMap[a.id] = a;
    for (const o of state.tl.objects) objMap[o.id] = o;
    for (const o of state.tl.objects) if (o.parent && objMap[o.parent]) (childrenOf[o.parent] ||= []).push(o);
    for (const k in childrenOf) childrenOf[k].sort((a, b) => typeOrder(a) - typeOrder(b) || a.name.localeCompare(b.name));
  }
  function computePositions() {
    posCache = {};
    const calc = (o, depth) => {
      if (posCache[o.id]) return posCache[o.id];
      const p = o.parent && objMap[o.parent] && depth < 8 ? objMap[o.parent] : null;
      if (!p) return (posCache[o.id] = { x: o.x, y: o.y });
      const pp = calc(p, depth + 1), sib = childrenOf[p.id] || [], k = sib.indexOf(o);
      const ang = (-40 + 62 * k) * Math.PI / 180;
      const grand = p.parent && objMap[p.parent];
      const orbit = grand ? 0.45 + 0.22 * k : 1.8 + 0.8 * k;
      const dist = Math.max((13 + 5 * k) / state.view.z, orbit);
      return (posCache[o.id] = { x: pp.x + Math.cos(ang) * dist, y: pp.y + Math.sin(ang) * dist });
    };
    for (const o of state.tl.objects) calc(o, 0);
  }
  const posOf = o => posCache[o.id] || { x: o.x, y: o.y };
  function rootOf(o) { let c = o, n = 0; while (c.parent && objMap[c.parent] && n++ < 8) c = objMap[c.parent]; return c; }
  function controlKey(o) {
    let c = o, n = 0;
    while (wtype().child.includes(c.type) && c.parent && objMap[c.parent] && n++ < 8) c = objMap[c.parent];
    return c.id;
  }
  function controllerOf(o) {
    const e = era(); if (!e) return null;
    let f = e.control[controlKey(o)];
    if (!f && o.type === 'sun') { const ch = (childrenOf[o.id] || []).find(c => e.control[c.id]); if (ch) f = e.control[ch.id]; }
    if (!f && o.atlas) f = territoryAt(o.x, o.y);
    return f ? facById(f) : null;
  }
  // Welche Fraktion beansprucht diesen Punkt laut berechneten Grenzen?
  const hitCtx = document.createElement('canvas').getContext('2d');
  function territoryAt(x, y) {
    if (!settings.opts.influence) return null;
    const paths = territories();
    for (const f of state.tl.factions) if (paths[f.id] && !state.hiddenFactions.has(f.id) && hitCtx.isPointInPath(paths[f.id], x, y, 'evenodd')) return f.id;
    return null;
  }

  // ------------------------------------------------------------- Zeichnen
  const w2s = (x, y) => ({ x: (x - state.view.cx) * state.view.z + W / 2, y: (y - state.view.cy) * state.view.z + H / 2 });
  const s2w = (x, y) => ({ x: (x - W / 2) / state.view.z + state.view.cx, y: (y - H / 2) / state.view.z + state.view.cy });
  function worldTransform(c) { const z = state.view.z; c.setTransform(DPR * z, 0, 0, DPR * z, DPR * (W / 2 - state.view.cx * z), DPR * (H / 2 - state.view.cy * z)); }
  let drawQueued = false;
  function draw() { if (!drawQueued) { drawQueued = true; requestAnimationFrame(() => { drawQueued = false; render(); }); } }
  const visibleObj = o => settings.types[o.type] !== false && existsNow(o);
  const fantasy = () => state.theme === 'fantasy';

  function render() {
    if (!W || !state.tl) return;
    const lowRes = performance.now() < interactUntil;
    const v = state.view;
    const key = [v.cx, v.cy, v.z, W, H, DPR, state.year, dataVersion, state.tl.id, state.world.id, state.theme, state.selected, lowRes,
      JSON.stringify(settings.opts), JSON.stringify(settings.types), settings.terrStyle, settings.mapStyle, [...state.hiddenFactions].join(','), window.I18N.lang].join('|');
    if (key !== baseKey) {
      rebuildTree(); computePositions();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (state.world.type === 'fantasy') drawParchment(); else drawSpace();
      if (isSW() && settings.opts.regions) { if (atlasStyle()) drawRegionsAtlas(); else drawRegions(); }
      if (settings.opts.influence && era()) { if (settings.terrStyle === 'bubbles') drawInfluence(lowRes); else drawTerritories(); }
      if (settings.opts.grid) drawGrid();
      if (settings.opts.routes) drawRoutes();
      if (isSW() && settings.opts.sectors) drawSectors();
      if (atlasOn()) drawAtlasDots();
      drawObjects();
      if (atlasStyle() && settings.opts.grid) drawGridLabels();
      baseCtx.setTransform(1, 0, 0, 1, 0, 0); baseCtx.clearRect(0, 0, base.width, base.height); baseCtx.drawImage(canvas, 0, 0);
      baseKey = key;
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0);
    }
    drawHover();
    drawPlan();
    drawRouteDraft();
    drawBrush();
  }
  // ------------------------------------------------------------- Reiseplaner
  const TR = window.IAM_TRAVEL;
  function drawPlan() {
    const r = state.plannerOpen && state.plan; if (!r || !r.ok) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const fan = fantasy(), col = fan ? '#8b1e1e' : '#59e1ff';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const leg of r.legs) {
      const pts = leg.points.map(p => w2s(p.x, p.y)); if (pts.length < 2) continue;
      ctx.strokeStyle = fan ? 'rgba(139,30,30,0.25)' : 'rgba(89,225,255,0.25)'; ctx.lineWidth = 9;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash(leg.offLaneShare > 0.5 ? [8, 6] : []);
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
    }
    const marks = [r.legs[0].points[0]].concat(r.legs.map(l => l.points[l.points.length - 1]));
    marks.forEach((m, i) => {
      const p = w2s(m.x, m.y);
      ctx.fillStyle = i === 0 ? '#3ddc84' : i === marks.length - 1 ? '#ff5a5a' : (fan ? '#8b1e1e' : '#f5b83d');
      ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0b111c'; ctx.font = 'bold 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i === 0 ? 'A' : i === marks.length - 1 ? 'Z' : String(i), p.x, p.y + 0.5);
    });
    ctx.textBaseline = 'alphabetic';
  }
  function computePlan() {
    const P = settings.planner, stops = P.stops.map(x => (x || '').trim());
    if (stops.filter(Boolean).length < 2 || !stops[0] || !stops[stops.length - 1]) { state.plan = null; return; }
    state.plan = TR.plan(withAtlasStops(state.tl, stops), { stops: stops.filter(Boolean), year: state.year, worldType: state.world.type, hyperClass: P.cls, stayHours: P.stay, mode: P.mode, kmPerUnit: P.km });
  }
  // Atlas-Systeme, die als Halt angegeben sind, für die Berechnung ergänzen
  function withAtlasStops(tl, stops) {
    if (!isSW()) return tl;
    const has = new Set(tl.objects.map(o => o.name.toLowerCase())), extra = [];
    for (const q of stops) {
      const s = (q || '').toLowerCase(); if (!s || has.has(s) || tl.objects.some(o => o.id === q)) continue;
      const a = SW.atlas().find(o => o.name.toLowerCase() === s || o.id === q) || SW.atlas().find(o => o.name.toLowerCase().startsWith(s));
      if (a && !extra.includes(a)) extra.push(a);
    }
    return extra.length ? Object.assign({}, tl, { objects: tl.objects.concat(extra) }) : tl;
  }
  const dur = h => TR.fmtDuration(h, settings.lang);
  function planText() {
    const r = state.plan; if (!r || !r.ok) return '';
    const L = [`${t('planner')}: ${r.stops.join(' → ')} (${fmtYear(state.year)})`];
    L.push(state.world.type === 'fantasy' ? `${t('plMode')}: ${t('modes.' + r.mode)}` : `${t('plClass')}: ${String(r.hyperClass).replace('.', ',')}`);
    r.legs.forEach((l, i) => L.push(`${i + 1}. ${l.from} → ${l.to}: ${dur(l.hours)}${l.lanes.length ? ' · ' + l.lanes.join(', ') : ''}${l.via.length ? ' · ' + t('plVia') + ' ' + l.via.join(', ') : ''}`));
    L.push(`${t('plTotal')}: ${dur(r.totalHours)}${r.stayHours ? ` (${t('plStayTotal')} ${dur(r.stayHours)})` : ''} · ${r.lightYears != null ? '≈ ' + r.lightYears.toLocaleString() + ' ' + t('plLy') : '≈ ' + r.km.toLocaleString() + ' km'}`);
    return L.join('\n');
  }
  function renderPlanner() {
    const box = $('#planner');
    $('#btnPlanner').textContent = '🧭 ' + t('planner');
    $('#btnPlanner').classList.toggle('active', state.plannerOpen);
    box.hidden = !state.plannerOpen;
    $('#info').hidden = state.plannerOpen || state.mode === 'story' || state.mode === 'chars';
    $('#chars').hidden = state.plannerOpen || state.mode !== 'chars';
    $('#story').hidden = state.plannerOpen || state.mode !== 'story';
    if (!state.plannerOpen) return;
    const P = settings.planner, fan = state.world.type === 'fantasy';
    computePlan();
    const r = state.plan;
    const label = i => i === 0 ? t('plStart') : i === P.stops.length - 1 ? t('plDest') : t('plStop') + ' ' + i;
    box.innerHTML = `
      <h3>🧭 ${esc(t('planner'))} <button id="plClose" title="${esc(t('close'))}">✕</button></h3>
      <p class="hint" style="margin-top:0">${esc(t('plHint'))}</p>
      ${P.stops.map((v, i) => `
        <div class="pl-row ${state.pick === i ? 'picking' : ''}">
          <span class="pl-dot ${i === 0 ? 'a' : i === P.stops.length - 1 ? 'z' : ''}">${i === 0 ? 'A' : i === P.stops.length - 1 ? 'Z' : i}</span>
          <input class="pl-in" data-i="${i}" list="searchList" placeholder="${esc(label(i))}" value="${esc(v)}">
          <button class="pl-pick fixed" data-i="${i}" title="${esc(t('plPick'))}">📍</button>
          ${i > 0 && i < P.stops.length - 1 ? `<button class="pl-del fixed" data-i="${i}">✕</button>` : ''}
        </div>`).join('')}
      <div class="row" style="margin:6px 0 10px"><button id="plAdd">＋ ${esc(t('plAdd'))}</button><button id="plSwap" class="fixed" title="${esc(t('plSwap'))}">⇅</button></div>
      ${fan ? `
        <div class="row">
          <label class="field"><span>${esc(t('plMode'))}</span><select id="plMode">${Object.keys(TR.TRAVEL_MODES).map(k => `<option value="${k}" ${k === P.mode ? 'selected' : ''}>${esc(t('modes.' + k))}</option>`).join('')}</select></label>
          <label class="field fixed" style="width:110px"><span>${esc(t('plKm'))}</span><input id="plKm" type="number" min="0.01" step="0.1" value="${P.km}"></label>
        </div>` : `
        <label class="field"><span>${esc(t('plClass'))}</span><select id="plCls">${TR.HYPER_CLASSES.map(c => `<option value="${c}" ${+c === +P.cls ? 'selected' : ''}>${esc(t('plClassN', String(c).replace('.', settings.lang === 'en' ? '.' : ',')))}${esc(classHint(c))}</option>`).join('')}</select></label>`}
      <label class="field"><span>${esc(t('plStay'))}</span><input id="plStay" type="number" min="0" step="1" value="${P.stay}"></label>
      <div id="plResult">${planResultHtml(r)}</div>`;
    $('#plClose').onclick = () => { state.plannerOpen = false; state.pick = null; renderPlanner(); renderStory(); renderChars(); draw(); };
    $$('.pl-in').forEach(inp => inp.addEventListener('change', () => { P.stops[+inp.dataset.i] = inp.value; saveSoon(); renderPlanner(); draw(); }));
    $$('.pl-pick').forEach(b => b.addEventListener('click', () => { state.pick = state.pick === +b.dataset.i ? null : +b.dataset.i; renderPlanner(); if (state.pick != null) { toast(t('plPickHint')); if (isMobile()) setSheet(false); } }));
    $$('.pl-del').forEach(b => b.addEventListener('click', () => { P.stops.splice(+b.dataset.i, 1); saveSoon(); renderPlanner(); draw(); }));
    $('#plAdd').onclick = () => { P.stops.splice(P.stops.length - 1, 0, ''); saveSoon(); renderPlanner(); };
    $('#plSwap').onclick = () => { P.stops.reverse(); saveSoon(); renderPlanner(); draw(); };
    const bindNum = (id, key, cast) => { const el = $(id); if (el) el.addEventListener('change', () => { P[key] = cast(el.value); saveSoon(); renderPlanner(); draw(); }); };
    bindNum('#plCls', 'cls', Number); bindNum('#plStay', 'stay', v => Math.max(0, +v || 0)); bindNum('#plKm', 'km', v => Math.max(0.01, +v || 1));
    const pm = $('#plMode'); if (pm) pm.addEventListener('change', () => { P.mode = pm.value; saveSoon(); renderPlanner(); draw(); });
    const cp = $('#plCopy'); if (cp) cp.onclick = () => { navigator.clipboard.writeText(planText()).then(() => toast(t('plCopied'))).catch(() => alert(planText())); };
    const fit = $('#plFit'); if (fit) fit.onclick = () => { fitPlan(); if (isMobile()) setSheet(false); };
  }
  function classHint(c) {
    const k = c <= 0.5 ? 'cls05' : c <= 1 ? 'cls1' : c <= 2 ? 'cls2' : c <= 4 ? 'cls4' : 'cls10';
    return ' – ' + t(k);
  }
  function planResultHtml(r) {
    if (!r) return `<p class="hint">${esc(t('plEmpty'))}</p>`;
    if (!r.ok) return `<p class="warn">${esc(r.error === 'notFound' ? t('plNotFound', r.missing.join(', ')) : t('plEmpty'))}</p>`;
    return `
      <div class="pl-total"><div class="big">${esc(dur(r.totalHours))}</div>
        <div class="dim">${r.lightYears != null ? '≈ ' + r.lightYears.toLocaleString() + ' ' + esc(t('plLy')) : '≈ ' + r.km.toLocaleString() + ' km'}${r.jumps && state.world.type !== 'fantasy' ? ' · ' + r.jumps + ' ' + esc(t('plJumps')) : ''}${r.stayHours ? ' · ' + esc(t('plStayTotal')) + ' ' + esc(dur(r.stayHours)) : ''}</div></div>
      <ol class="pl-legs">${r.legs.map(l => `<li><b>${esc(l.from)} → ${esc(l.to)}</b> <span class="dur">${esc(dur(l.hours))}</span>
        ${l.lanes.length ? `<div class="dim">${esc(l.lanes.join(', '))}</div>` : ''}${l.offLaneShare > 0.5 ? `<div class="dim">${esc(t('plOffLane'))}</div>` : ''}
        ${l.via.length ? `<div class="dim">${esc(t('plVia'))} ${esc(l.via.slice(0, 8).join(', '))}${l.via.length > 8 ? ' …' : ''}</div>` : ''}</li>`).join('')}</ol>
      <div class="row"><button id="plFit">${esc(t('plShow'))}</button><button id="plCopy">${esc(t('plCopy'))}</button></div>
      <p class="hint">${esc(t('plNote'))}</p>`;
  }
  function fitPlan() {
    const r = state.plan; if (!r || !r.ok) return;
    const pts = r.legs.flatMap(l => l.points); const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    state.view.cx = (x0 + x1) / 2; state.view.cy = (y0 + y1) / 2;
    state.view.z = Math.max(0.2, Math.min(6, Math.min(W / (x1 - x0 + 160), H / (y1 - y0 + 160)))); draw();
  }
  $('#btnPlanner').addEventListener('click', () => { state.plannerOpen = !state.plannerOpen; state.pick = null; renderPlanner(); draw(); });

  function drawHover() {
    if (!state.hover || state.hover === state.selected) return;
    const o = objMap[state.hover]; if (!o || !visibleObj(o)) return;
    const p = w2s(posOf(o).x, posOf(o).y), sizeF = Math.max(0.8, Math.min(4, Math.pow(state.view.z, 0.35) * 1.3));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.strokeStyle = fantasy() ? '#3b271599' : '#ffffff99'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, 10 * sizeF, 0, Math.PI * 2); ctx.stroke();
  }

  const atlasStyle = () => isSW() && !fantasy() && settings.mapStyle !== 'classic';
  function drawSpace() {
    const z = state.view.z, at = atlasStyle();
    if (at) {
      // Atlas-Stil: tiefes Nachtblau statt Schwarz, ruhigerer Galaxiekern
      const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.75);
      g.addColorStop(0, '#0b1a2e'); g.addColorStop(1, '#040a14');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else { ctx.fillStyle = fantasy() ? '#1d1810' : '#04060c'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    worldTransform(ctx);
    ctx.globalAlpha = (z > 3 ? Math.max(0.35, 3 / z) : 1) * (at ? 0.55 : 1);
    ctx.drawImage(glow, -150, -150, 2600, 2600);
    ctx.globalAlpha = 1;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (const s of stars) {
      const p = w2s(s.x, s.y);
      if (p.x < -2 || p.y < -2 || p.x > W + 2 || p.y > H + 2) continue;
      const sz = Math.max(0.6, Math.min(2, 0.5 + z * 0.6)) * (s.b > 0.85 ? 1.6 : 1);
      const sb = at ? s.b * 0.55 : s.b;
      ctx.fillStyle = s.c < 0.15 ? `rgba(255,210,160,${sb})` : s.c > 0.85 ? `rgba(170,200,255,${sb})` : `rgba(235,240,255,${sb * 0.85})`;
      ctx.fillRect(p.x, p.y, sz, sz);
    }
    if (z > 0.9) drawDeepStars();
  }
  function hash3(a, b, c) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function drawDeepStars() {
    const z = state.view.z, tl = s2w(0, 0), br = s2w(W, H);
    for (let L = 0; L <= Math.floor(Math.log2(z)); L++) {
      const cell = 120 / Math.pow(2, L);
      if (cell * z > 400) continue;
      const alpha = Math.min(1, (cell * z - 30) / 60); if (alpha <= 0) continue;
      const x0 = Math.floor(tl.x / cell), x1 = Math.ceil(br.x / cell), y0 = Math.floor(tl.y / cell), y1 = Math.ceil(br.y / cell);
      if ((x1 - x0) * (y1 - y0) > 4000) continue;
      for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
        const cx = (ix + 0.5) * cell, cy = (iy + 0.5) * cell, dx = cx - GEO.center.x, dy = cy - GEO.center.y, th = Math.atan2(dy, dx);
        const dn = Math.hypot(dx, dy) / GEO.scale(th), dens = dn > GEO.edge ? 0.15 : 0.35 + 0.65 * (1 - dn / GEO.edge);
        for (let k = 0; k < 3; k++) {
          if (hash3(ix, iy, L * 7 + k) > dens) continue;
          const p = w2s((ix + hash3(ix, iy, L * 7 + k + 101)) * cell, (iy + hash3(ix, iy, L * 7 + k + 211)) * cell);
          const b = (0.3 + 0.7 * hash3(ix, iy, L * 7 + k + 307)) * alpha, tt = hash3(ix, iy, L * 7 + k + 401);
          ctx.fillStyle = tt < 0.15 ? `rgba(255,210,160,${b})` : tt > 0.85 ? `rgba(170,200,255,${b})` : `rgba(235,240,255,${b * 0.85})`;
          ctx.fillRect(p.x, p.y, 0.7 + hash3(ix, iy, k + 503) * 1.1, 0.7 + hash3(ix, iy, k + 503) * 1.1);
        }
      }
    }
  }
  let paperPattern = null;
  function drawParchment() {
    ctx.fillStyle = '#3a2e1f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    worldTransform(ctx);
    paperPattern ||= ctx.createPattern(paper, 'repeat');
    ctx.fillStyle = paperPattern;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, FANTASY_SIZE.w, FANTASY_SIZE.h); ctx.clip();
    ctx.fill();
    const g = ctx.createRadialGradient(FANTASY_SIZE.w / 2, FANTASY_SIZE.h / 2, FANTASY_SIZE.h * 0.3, FANTASY_SIZE.w / 2, FANTASY_SIZE.h / 2, FANTASY_SIZE.w * 0.75);
    g.addColorStop(0, 'rgba(255,245,220,0)'); g.addColorStop(1, 'rgba(110,70,25,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, FANTASY_SIZE.w, FANTASY_SIZE.h);
    ctx.restore();
    ctx.lineWidth = 6 / Math.max(1, state.view.z * 0.5); ctx.strokeStyle = '#5a3d1e';
    ctx.strokeRect(0, 0, FANTASY_SIZE.w, FANTASY_SIZE.h);
    ctx.lineWidth = 1.5 / state.view.z; ctx.strokeRect(14, 14, FANTASY_SIZE.w - 28, FANTASY_SIZE.h - 28);
    // Windrose
    const p = { x: FANTASY_SIZE.w - 150, y: FANTASY_SIZE.h - 150 }, r = 70;
    ctx.strokeStyle = 'rgba(90,61,30,0.6)'; ctx.fillStyle = 'rgba(90,61,30,0.55)'; ctx.lineWidth = 1.5 / state.view.z;
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.75, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 - Math.PI / 2, len = i % 2 ? r * 0.6 : r;
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * len, p.y + Math.sin(a) * len);
      ctx.lineTo(p.x + Math.cos(a + 0.25) * r * 0.18, p.y + Math.sin(a + 0.25) * r * 0.18);
      ctx.lineTo(p.x + Math.cos(a - 0.25) * r * 0.18, p.y + Math.sin(a - 0.25) * r * 0.18); ctx.closePath(); ctx.fill();
    }
  }

  function drawRegions() {
    const z = state.view.z;
    worldTransform(ctx);
    ctx.lineWidth = 1 / z; ctx.strokeStyle = 'rgba(140,170,220,0.22)'; ctx.setLineDash([6 / z, 6 / z]);
    for (const b of GEO.bands) {
      ctx.save();
      if (b.r1 > GEO.unknownWedge.r0) { ctx.beginPath(); ctx.rect(-5000, -5000, 12000, 12000); wedgePath(ctx); ctx.clip('evenodd'); }
      ctx.beginPath(); shapePath(ctx, b.r1); ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = 'rgba(160,120,220,0.35)'; ctx.beginPath(); wedgePath(ctx); ctx.stroke();
    const h = huttCircle();
    ctx.strokeStyle = 'rgba(200,170,90,0.3)'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.font = `600 ${Math.max(9, Math.min(13, 9 + z * 3))}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(170,195,235,0.42)';
    const th = -1.2;
    for (const b of GEO.bands) {
      if (b.key === 'deepcore' && z < 0.6) continue;
      const r = b.key === 'deepcore' ? 0 : (b.r0 + b.r1) / 2, s = GEO.scale(th);
      const p = w2s(GEO.center.x + Math.cos(th) * r * s, GEO.center.y + Math.sin(th) * r * s);
      ctx.fillText(t('regions.' + b.key).toUpperCase(), p.x, p.y);
    }
    ctx.fillStyle = 'rgba(190,160,240,0.5)';
    let p = w2s(GEO.center.x - 720 * GEO.scale(Math.PI), GEO.center.y); ctx.fillText(t('regions.unknown').toUpperCase(), p.x, p.y);
    ctx.fillStyle = 'rgba(220,190,110,0.5)';
    p = w2s(h.x, h.y + h.r - 14); ctx.fillText(t('regions.huttspace').toUpperCase(), p.x, p.y);
  }

  // Atlas-Stil: Regionsringe als ruhige, leicht getönte Flächen mit feinen Linien und gesperrter Beschriftung
  const ATLAS_TINT = { deepcore: 'rgba(150,200,255,0.10)', core: 'rgba(120,180,245,0.085)', colonies: 'rgba(110,170,240,0.07)', innerrim: 'rgba(100,160,235,0.06)',
    expansion: 'rgba(90,150,230,0.05)', midrim: 'rgba(80,140,225,0.04)', outerrim: 'rgba(70,130,220,0.03)', wildspace: 'rgba(60,110,200,0.02)' };
  function drawRegionsAtlas() {
    const z = state.view.z;
    worldTransform(ctx);
    for (const b of GEO.bands) { ctx.fillStyle = ATLAS_TINT[b.key] || 'transparent'; fillRegion(ctx, b.key); }
    ctx.fillStyle = 'rgba(140,110,220,0.05)'; fillRegion(ctx, 'unknown');
    ctx.fillStyle = 'rgba(220,180,90,0.05)'; fillRegion(ctx, 'huttspace');
    ctx.lineWidth = 1 / z; ctx.strokeStyle = 'rgba(150,200,255,0.20)';
    for (const b of GEO.bands) {
      ctx.save();
      if (b.r1 > GEO.unknownWedge.r0) { ctx.beginPath(); ctx.rect(-5000, -5000, 12000, 12000); wedgePath(ctx); ctx.clip('evenodd'); }
      ctx.beginPath(); shapePath(ctx, b.r1); ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = 'rgba(170,140,240,0.32)'; ctx.beginPath(); wedgePath(ctx); ctx.stroke();
    const h = huttCircle();
    ctx.strokeStyle = 'rgba(230,190,100,0.32)'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
    // Beschriftung entlang der Ringe (oben), Buchstaben einzeln gesetzt
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const fs = Math.max(9, Math.min(15, 8 + z * 4));
    ctx.font = `600 ${fs}px "Segoe UI", "Bahnschrift", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const arcText = (txt, r, th0, color) => {
      const s = GEO.scale(th0), rr = r * s * z; if (rr < 30) return;
      const sp = fs * 0.32, chars = [...txt]; let tot = 0; const ws = chars.map(c => { const w = ctx.measureText(c).width + sp; tot += w; return w; });
      let a = th0 - (tot / rr) / 2; ctx.fillStyle = color;
      chars.forEach((c, i) => {
        const am = a + ws[i] / rr / 2, sc = GEO.scale(am);
        const p = w2s(GEO.center.x + Math.cos(am) * r * sc, GEO.center.y + Math.sin(am) * r * sc);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(am + Math.PI / 2); ctx.fillText(c, 0, 0); ctx.restore();
        a += ws[i] / rr;
      });
    };
    for (const b of GEO.bands) {
      if (b.key === 'deepcore') { if (z < 0.9) continue; const p = w2s(GEO.center.x, GEO.center.y); ctx.fillStyle = 'rgba(190,220,255,0.45)'; ctx.fillText(t('regions.deepcore').toUpperCase(), p.x, p.y); continue; }
      arcText(t('regions.' + b.key).toUpperCase(), b.r1 - Math.min(26, (b.r1 - b.r0) * 0.35), -Math.PI / 2, 'rgba(170,205,245,0.42)');
    }
    ctx.fillStyle = 'rgba(195,170,245,0.5)';
    let p = w2s(GEO.center.x - 720 * GEO.scale(Math.PI), GEO.center.y); ctx.fillText(t('regions.unknown').toUpperCase(), p.x, p.y);
    ctx.fillStyle = 'rgba(235,200,120,0.55)';
    p = w2s(h.x, h.y + h.r - 16); ctx.fillText(t('regions.huttspace').toUpperCase(), p.x, p.y);
    ctx.textBaseline = 'alphabetic';
  }
  function drawAtlasDots() {
    const z = state.view.z; if (z < ATLAS_Z) return;
    const a = Math.min(1, 0.5 + (z - ATLAS_Z) * 0.5), r = Math.max(0.55, Math.min(2.6, 0.35 + z * 0.4));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = fantasy() ? `rgba(60,40,20,${0.7 * a})` : `rgba(175,205,240,${0.8 * a})`;
    ctx.beginPath();
    const vis = atlasInView();
    if (r < 1.1) for (const o of vis) { const p = w2s(o.x, o.y); ctx.rect(p.x - r, p.y - r, r * 2, r * 2); }
    else for (const o of vis) { const p = w2s(o.x, o.y); ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); }
    ctx.fill();
    if (state.selected && objMap[state.selected] && objMap[state.selected].atlas) {
      const o = objMap[state.selected], p = w2s(o.x, o.y);
      ctx.strokeStyle = '#f5b83d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // Beschriftungen der Atlas-Systeme nach den Hauptobjekten, nur wo Platz ist
  function drawAtlasLabels(boxes) {
    const z = state.view.z; if (z < ATLAS_LABEL_Z || performance.now() < interactUntil) return;
    const vis = atlasInView(60); if (vis.length > 1500) return;
    ctx.font = `400 ${z > 6 ? 11 : 10}px "Segoe UI", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    let n = 0;
    for (const o of vis) {
      if (n > 450) break;
      const p = w2s(o.x, o.y), w = ctx.measureText(o.name).width, x = p.x + 5, y = p.y;
      const box = [x - 1, y - 6, x + w + 1, y + 6];
      if (boxes.some(b => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))) continue;
      boxes.push(box); n++;
      ctx.fillStyle = 'rgba(4,8,16,0.7)'; ctx.fillText(o.name, x + 1, y + 1);
      ctx.fillStyle = 'rgba(175,195,220,0.85)'; ctx.fillText(o.name, x, y);
    }
    ctx.textBaseline = 'alphabetic';
  }
  // Raster-Beschriftung am Bildrand (bleibt beim Verschieben sichtbar)
  function drawGridLabels() {
    const c = GEO.gridCell;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = 'rgba(6,14,26,0.72)'; ctx.fillRect(0, 0, W, 16); ctx.fillRect(0, 16, 22, H - 16);
    ctx.font = '600 10px "Segoe UI", sans-serif'; ctx.fillStyle = 'rgba(160,200,240,0.8)'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    for (let i = 0; i < 24; i++) { const m = w2s((i + 0.5) * c, 0); if (m.x > 24 && m.x < W - 6) ctx.fillText(String.fromCharCode(65 + i), m.x, 8); }
    for (let j = 0; j < 22; j++) { const m = w2s(0, (j + 0.5) * c); if (m.y > 18 && m.y < H - 4) ctx.fillText(String(j + 1), 11, m.y); }
    ctx.textBaseline = 'alphabetic';
  }

  function drawInfluence(lowRes) {
    const e = era();
    // Einflussflächen in CSS-Pixel-Auflösung (bei Interaktion halbe Auflösung) berechnen – deutlich schneller
    const IR = lowRes ? 0.5 : 1, ow = Math.max(1, Math.round(W * IR)), oh = Math.max(1, Math.round(H * IR));
    if (off.width !== ow || off.height !== oh) { off.width = ero.width = inf.width = ow; off.height = ero.height = inf.height = oh; }
    infCtx.setTransform(1, 0, 0, 1, 0, 0); infCtx.globalAlpha = 1; infCtx.clearRect(0, 0, ow, oh);
    let any = false;
    const z = state.view.z, offTransform = c => c.setTransform(IR * z, 0, 0, IR * z, IR * (W / 2 - state.view.cx * z), IR * (H / 2 - state.view.cy * z));
    const sh = Math.max(1, 2 * IR);
    const shifts = lowRes ? [[sh, 0], [-sh, 0], [0, sh], [0, -sh]] : [[sh, 0], [-sh, 0], [0, sh], [0, -sh], [sh * .75, sh * .75], [-sh * .75, sh * .75], [sh * .75, -sh * .75], [-sh * .75, -sh * .75]];
    for (const f of state.tl.factions) {
      if (state.hiddenFactions.has(f.id)) continue;
      const keys = Object.keys(e.control).filter(k => e.control[k] === f.id);
      const regs = isSW() ? Object.keys(e.regionClaims || {}).filter(r => e.regionClaims[r] === f.id) : [];
      const zones = (e.zones || []).filter(zn => zn.faction === f.id);
      if (!keys.length && !regs.length && !zones.length) continue;
      offCtx.setTransform(1, 0, 0, 1, 0, 0); offCtx.globalCompositeOperation = 'source-over';
      offCtx.clearRect(0, 0, off.width, off.height);
      offTransform(offCtx); offCtx.fillStyle = f.color;
      for (const r of regs) fillRegion(offCtx, r);
      offCtx.beginPath();
      const reach = +f.reach || 120;
      for (const k of keys) {
        const o = objMap[k]; if (!o || !existsNow(o)) continue;
        const p = posOf(o); offCtx.moveTo(p.x + reach, p.y); offCtx.arc(p.x, p.y, reach, 0, Math.PI * 2);
      }
      for (const zn of zones) {
        if (Array.isArray(zn.poly) && zn.poly.length > 2) { zn.poly.forEach(([x, y], i) => i ? offCtx.lineTo(x, y) : offCtx.moveTo(x, y)); offCtx.closePath(); }
        else { offCtx.moveTo(zn.x + zn.r, zn.y); offCtx.arc(zn.x, zn.y, zn.r, 0, Math.PI * 2); }
      }
      offCtx.fill('nonzero');
      any = true;
      infCtx.globalAlpha = fantasy() ? 0.26 : 0.2; infCtx.drawImage(off, 0, 0); infCtx.globalAlpha = 1;
      if (lowRes) continue; // beim Verschieben/Zoomen nur Flächen, Umrisse danach
      eroCtx.setTransform(1, 0, 0, 1, 0, 0); eroCtx.globalCompositeOperation = 'source-over';
      eroCtx.clearRect(0, 0, ero.width, ero.height); eroCtx.drawImage(off, 0, 0);
      eroCtx.globalCompositeOperation = 'destination-in';
      for (const [dx, dy] of shifts) eroCtx.drawImage(off, dx, dy);
      offCtx.setTransform(1, 0, 0, 1, 0, 0); offCtx.globalCompositeOperation = 'destination-out';
      offCtx.drawImage(ero, 0, 0); offCtx.globalCompositeOperation = 'source-over';
      infCtx.globalAlpha = 0.85; infCtx.drawImage(off, 0, 0); infCtx.globalAlpha = 1;
    }
    if (any) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(inf, 0, 0, canvas.width, canvas.height); }
  }

  // ------------------------------------------------------------- Territorien mit Grenzen
  let terrCache = { key: '', rings: {}, paths: {} };
  function territories() {
    const e = era(); if (!e) return {};
    const timed = state.tl.objects.filter(o => (o.from != null && o.from !== '') || (o.to != null && o.to !== '')).filter(existsNow).map(o => o.id).join(',');
    const key = [state.tl.id, e.id, editVersion, state.world.id, timed].join('|');
    if (terrCache.key === key) return terrCache.paths;
    const fan = state.world.type === 'fantasy';
    const points = [];
    for (const [k, f] of Object.entries(e.control)) { const o = objMap[k]; if (!o || !existsNow(o)) continue; const r = rootOf(o); points.push({ x: r.x, y: r.y, f }); }
    const zones = (e.zones || []).map(z => ({ f: z.faction, x: z.x, y: z.y, r: z.r, poly: z.poly }));
    const bounds = fan ? { x0: 0, y0: 0, x1: FANTASY_SIZE.w, y1: FANTASY_SIZE.h } : { x0: 140, y0: 180, x1: 2160, y1: 2200 };
    const inside = fan ? null : (x, y) => { const dx = x - GEO.center.x, dy = y - GEO.center.y, th = Math.atan2(dy, dx); return Math.hypot(dx, dy) / GEO.scale(th) <= GEO.edge * 1.02; };
    const rings = window.IAM_TERRITORY.compute({ bounds, cell: 9, inside, regionAt: isSW() ? regionAt : null, regionClaims: isSW() ? (e.regionClaims || {}) : null,
      factions: state.tl.factions, points, zones });
    const paths = {};
    for (const [fid, rs] of Object.entries(rings)) { const p = new Path2D(); for (const ring of rs) { ring.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); } paths[fid] = p; }
    terrCache = { key, rings, paths };
    return paths;
  }
  function drawTerritories() {
    const paths = territories(), z = state.view.z, fan = fantasy();
    worldTransform(ctx);
    for (const f of state.tl.factions) {
      const p = paths[f.id]; if (!p || state.hiddenFactions.has(f.id)) continue;
      ctx.globalAlpha = fan ? 0.24 : atlasStyle() ? 0.16 : 0.2; ctx.fillStyle = f.color; ctx.fill(p, 'evenodd');
    }
    ctx.globalAlpha = 1; ctx.lineJoin = 'round';
    for (const f of state.tl.factions) {
      const p = paths[f.id]; if (!p || state.hiddenFactions.has(f.id)) continue;
      ctx.strokeStyle = fan ? 'rgba(40,25,10,0.55)' : 'rgba(0,0,0,0.55)'; ctx.lineWidth = 4 / z; ctx.stroke(p);
    }
    for (const f of state.tl.factions) {
      const p = paths[f.id]; if (!p || state.hiddenFactions.has(f.id)) continue;
      ctx.strokeStyle = f.color; ctx.lineWidth = 1.8 / z; ctx.globalAlpha = 0.95; ctx.stroke(p);
    }
    ctx.globalAlpha = 1;
  }

  function drawGrid() {
    const c = GEO.gridCell, cols = state.world.type === 'fantasy' ? Math.ceil(FANTASY_SIZE.w / c) : 24, rows = state.world.type === 'fantasy' ? Math.ceil(FANTASY_SIZE.h / c) : 22;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const at = atlasStyle();
    ctx.strokeStyle = fantasy() ? 'rgba(90,61,30,0.18)' : at ? 'rgba(120,180,240,0.16)' : 'rgba(120,160,220,0.13)'; ctx.lineWidth = 1;
    if (at) ctx.fillStyle = 'transparent';
    ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillStyle = fantasy() ? 'rgba(90,61,30,0.75)' : 'rgba(160,190,230,0.6)';
    for (let i = 0; i <= cols; i++) {
      const a = w2s(i * c, 0), b = w2s(i * c, rows * c);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (i < cols && !at) { const m = w2s((i + 0.5) * c, 0); ctx.textAlign = 'center'; ctx.fillText(String.fromCharCode(65 + i), m.x, Math.max(12, a.y - 4)); }
    }
    for (let j = 0; j <= rows; j++) {
      const a = w2s(0, j * c), b = w2s(cols * c, j * c);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (j < rows && !at) { const m = w2s(0, (j + 0.5) * c); ctx.textAlign = 'right'; ctx.fillText(String(j + 1), Math.max(18, a.x - 4), m.y + 3); }
    }
  }

  function routePts(r) { return r.points.map(id => objMap[id]).filter(o => o && existsNow(o)).map(o => w2s(posOf(rootOf(o)).x, posOf(rootOf(o)).y)); }
  function drawRoutes() {
    const z = state.view.z, fan = fantasy();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const r of state.tl.routes || []) {
      const pts = routePts(r); if (pts.length < 2) continue;
      const major = r.kind === 'major';
      ctx.strokeStyle = fan ? (major ? 'rgba(110,50,20,0.75)' : 'rgba(110,70,30,0.55)') : (major ? 'rgba(110,200,255,0.55)' : 'rgba(150,190,230,0.32)');
      ctx.lineWidth = major ? Math.min(3.5, 1.4 + z * 0.6) : 1.2;
      ctx.setLineDash(major ? (fan ? [8, 4] : []) : [5, 5]);
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      ctx.setLineDash([]);
      if (settings.opts.names && z > 0.55 && (major || z > 1.1)) {
        let best = null, bl = 0;
        for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); if (l > bl) { bl = l; best = [pts[i - 1], pts[i]]; } }
        if (best && bl > 140) {
          let a = Math.atan2(best[1].y - best[0].y, best[1].x - best[0].x);
          if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI;
          ctx.save(); ctx.translate((best[0].x + best[1].x) / 2, (best[0].y + best[1].y) / 2); ctx.rotate(a);
          ctx.font = `italic ${major ? 11 : 10}px ${fan ? 'Georgia, serif' : '"Segoe UI", sans-serif'}`; ctx.textAlign = 'center';
          ctx.fillStyle = fan ? 'rgba(90,40,15,0.85)' : 'rgba(150,215,255,0.8)'; ctx.fillText(r.name, 0, -5); ctx.restore();
        }
      }
    }
  }
  function drawSectors() {
    const z = state.view.z; if (z < 1.0) return;
    if (atlasOn()) {
      atlasObjs();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.font = `italic 600 ${Math.min(13, 8 + z * 1.2)}px "Segoe UI", sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = atlasStyle() ? 'rgba(140,190,240,0.33)' : 'rgba(200,215,240,0.32)';
      const boxes = [], minN = z < 1.6 ? 25 : z < 2.5 ? 10 : z < 4 ? 4 : 1, suf = t('sector') === 'Sektor' ? '-Sektor' : ' sector';
      for (const q of atlasState.sectors) {
        if (q.n < minN) continue;
        const p = w2s(q.x, q.y); if (p.x < -150 || p.y < -20 || p.x > W + 150 || p.y > H + 20) continue;
        const txt = (q.name + suf).toUpperCase(), w = ctx.measureText(txt).width, box = [p.x - w / 2, p.y - 8, p.x + w / 2, p.y + 6];
        if (boxes.some(b => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))) continue;
        boxes.push(box); ctx.fillText(txt, p.x, p.y);
      }
      return;
    }
    const groups = {};
    for (const o of state.tl.objects) if (o.sector && !o.parent) (groups[o.sector] ||= []).push(posOf(o));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.font = `italic ${Math.min(14, 9 + z * 1.5)}px "Segoe UI", sans-serif`; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200,215,240,0.35)';
    for (const [name, ps] of Object.entries(groups)) {
      const cx = ps.reduce((s, p) => s + p.x, 0) / ps.length, cy = ps.reduce((s, p) => s + p.y, 0) / ps.length;
      const p = w2s(cx, cy + 22 + 8 / z);
      if (p.x < -100 || p.y < -20 || p.x > W + 100 || p.y > H + 20) continue;
      ctx.fillText((name + (t('sector') === 'Sektor' ? '-Sektor' : ' sector')).toUpperCase(), p.x, p.y);
    }
  }

  function drawSymbol(o, p, sizeF, fac) {
    const fan = fantasy();
    if (o.type === 'sun') {
      const r = 5 * sizeF, g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
      g.addColorStop(0, '#fffbe6'); g.addColorStop(0.3, '#ffc64a'); g.addColorStop(1, 'rgba(255,150,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2); ctx.fill();
    } else if (o.type === 'planet') {
      const r = 4 * sizeF;
      ctx.fillStyle = fan ? '#4a3420' : '#d4deea'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (fac) { ctx.strokeStyle = fac.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, r + 2.2, 0, Math.PI * 2); ctx.stroke(); }
    } else if (o.type === 'moon') {
      const r = 2.3 * sizeF;
      ctx.fillStyle = fan ? '#6a5640' : '#98a6b6'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      if (fac && !o.parent) { ctx.strokeStyle = fac.color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, r + 1.8, 0, Math.PI * 2); ctx.stroke(); }
    } else if (o.type === 'station') {
      const r = 3.6 * sizeF;
      ctx.fillStyle = fan ? '#2c5a6a' : '#7fe3ff'; ctx.beginPath();
      ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r, p.y); ctx.closePath(); ctx.fill();
      if (fac && !o.parent) { ctx.strokeStyle = fac.color; ctx.lineWidth = 1.5; ctx.stroke(); }
    } else {
      // Fantasy-Symbole
      const ink = fan ? '#3b2715' : '#e8eef6', r = 4.5 * sizeF;
      ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
      if (o.type === 'capital') {
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.35, 0, Math.PI * 2); ctx.stroke();
        star(p.x, p.y, r * 1.05, r * 0.45); ctx.fillStyle = fac ? fac.color : (fan ? '#8b1e1e' : '#f5b83d'); ctx.fill(); ctx.stroke();
      } else if (o.type === 'city') {
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = fac ? fac.color : ink; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.38, 0, Math.PI * 2); ctx.fillStyle = fan ? '#f1e4c4' : '#0b111c'; ctx.fill();
      } else if (o.type === 'village') {
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = fac ? fac.color : ink; ctx.fill();
      } else if (o.type === 'fortress') {
        const s = r * 1.1; ctx.beginPath();
        ctx.moveTo(p.x - s, p.y + s); ctx.lineTo(p.x - s, p.y - s * 0.6); ctx.lineTo(p.x - s * 0.5, p.y - s * 0.6); ctx.lineTo(p.x - s * 0.5, p.y - s * 0.2);
        ctx.lineTo(p.x, p.y - s * 0.2); ctx.lineTo(p.x, p.y - s * 0.6); ctx.lineTo(p.x + s * 0.5, p.y - s * 0.6); ctx.lineTo(p.x + s * 0.5, p.y - s * 0.2);
        ctx.lineTo(p.x + s, p.y - s * 0.2); ctx.lineTo(p.x + s, p.y + s); ctx.closePath();
        ctx.fillStyle = fac ? fac.color : ink; ctx.fill(); ctx.stroke();
      } else if (o.type === 'landmark') {
        const s = r * 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s, p.y + s * 0.7); ctx.lineTo(p.x - s, p.y + s * 0.7); ctx.closePath();
        ctx.fillStyle = fac ? fac.color : (fan ? '#6b4a26' : '#9fb3c8'); ctx.fill(); ctx.stroke();
      }
    }
  }
  function star(x, y, R, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }

  function drawObjects() {
    const z = state.view.z, fan = fantasy();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const vis = state.tl.objects.filter(visibleObj).sort((a, b) => typeOrder(a) - typeOrder(b));
    const sizeF = Math.max(0.8, Math.min(4, Math.pow(z, 0.35) * 1.3));
    for (const o of vis) {
      const p = w2s(posOf(o).x, posOf(o).y);
      if (p.x < -20 || p.y < -20 || p.x > W + 20 || p.y > H + 20) continue;
      drawSymbol(o, p, sizeF, controllerOf(o));
      if (state.selected === o.id) {
        ctx.strokeStyle = fan ? '#8b1e1e' : '#f5b83d'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, 10 * sizeF, 0, Math.PI * 2); ctx.stroke();
      }
    }
    if (!settings.opts.names) return;
    const boxes = [];
    const minZ = { planet: 0.3, sun: 1.1, moon: 1.2, station: 0.9, capital: 0, city: 0.15, fortress: 0.2, village: 0.55, landmark: 0.35 };
    const rank = o => o.id === state.selected ? -1 : ({ capital: 0, planet: 0, city: 1, fortress: 2, station: 3, landmark: 3, village: 4, moon: 5, sun: 6 }[o.type] ?? 7);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const o of vis.slice().sort((a, b) => rank(a) - rank(b))) {
      if (z < (minZ[o.type] ?? 0.5) && o.id !== state.selected && !(o.type === 'station' && !o.parent && z > 0.45)) continue;
      const p = w2s(posOf(o).x, posOf(o).y);
      if (p.x < -60 || p.y < -20 || p.x > W + 60 || p.y > H + 20) continue;
      const big = o.type === 'planet' || o.type === 'capital' || o.type === 'city';
      ctx.font = fan ? `${big ? 'bold ' : ''}${o.type === 'capital' ? 14 : big ? 12.5 : 11.5}px "Palatino Linotype", "Book Antiqua", Georgia, serif`
        : `${big ? 600 : 400} ${big ? 12 : 11}px "Segoe UI", sans-serif`;
      const w = ctx.measureText(o.name).width, x = p.x + 8 + (o.type === 'capital' ? 4 : 0), y = p.y;
      const box = [x - 2, y - 8, x + w + 2, y + 8];
      if (o.id !== state.selected && boxes.some(b => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))) continue;
      boxes.push(box);
      if (fan) {
        ctx.fillStyle = 'rgba(241,228,196,0.85)'; ctx.fillText(o.name, x + 1, y + 1);
        ctx.fillStyle = '#2e1e0f';
      } else {
        ctx.fillStyle = 'rgba(4,6,12,0.75)'; ctx.fillText(o.name, x + 1, y + 1);
        ctx.fillStyle = o.type === 'planet' ? '#e8eef6' : o.type === 'station' ? '#a5ecff' : o.type === 'sun' ? '#ffd98a' : '#b7c2cf';
      }
      ctx.fillText(o.name, x, y);
    }
    ctx.textBaseline = 'alphabetic';
    if (atlasOn()) drawAtlasLabels(boxes);
  }

  let mouse = { x: 0, y: 0, in: false };
  function drawBrush() {
    if (!editable() || !mouse.in || !['paint', 'erase'].includes(state.tool)) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const f = facById(state.activeFaction);
    ctx.strokeStyle = state.tool === 'erase' ? '#e5534b' : (f ? f.color : '#fff');
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, state.brush * state.view.z, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawRouteDraft() {
    if (!state.routeDraft || !state.routeDraft.length) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const pts = state.routeDraft.map(id => objMap[id]).filter(Boolean).map(o => w2s(posOf(rootOf(o)).x, posOf(rootOf(o)).y));
    if (mouse.in) pts.push({ x: mouse.x, y: mouse.y });
    ctx.strokeStyle = fantasy() ? '#8b1e1e' : '#f5b83d'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
  }

  // ------------------------------------------------------------- Interaktion Karte
  function hitTest(sx, sy) {
    let best = null, bd = 12;
    for (const o of state.tl.objects) {
      if (!visibleObj(o)) continue;
      const p = w2s(posOf(o).x, posOf(o).y), d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bd || (d === bd && best && typeOrder(o) > typeOrder(best))) { bd = d; best = o; }
    }
    if (!best && atlasOn() && state.view.z >= ATLAS_HIT_Z) {
      const w = s2w(sx, sy), rad = 9 / state.view.z; let ad = 9;
      atlasObjs();
      for (let ix = Math.floor((w.x - rad) / AB); ix <= Math.floor((w.x + rad) / AB); ix++) for (let iy = Math.floor((w.y - rad) / AB); iy <= Math.floor((w.y + rad) / AB); iy++) {
        for (const o of atlasState.buckets.get(ix + ',' + iy) || []) { const p = w2s(o.x, o.y), d = Math.hypot(p.x - sx, p.y - sy); if (d < ad) { ad = d; best = o; } }
      }
    }
    return best;
  }
  function nearest(sx, sy, types, maxPx) {
    let best = null, bd = maxPx;
    for (const o of state.tl.objects) {
      if (!types.includes(o.type) || !existsNow(o)) continue;
      const p = w2s(posOf(o).x, posOf(o).y), d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  function needEra() { if (era()) return true; toast(t('hintNoEra')); return false; }

  let drag = null;
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  // Touch: zwei Finger = Pinch-Zoom/Verschieben
  const pointers = new Map(); let pinch = null;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', e => {
    try { canvas.setPointerCapture(e.pointerId); } catch { }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    if (pointers.size === 2) {
      if (drag && drag.kind === 'move' && !drag.moved) state.undo.pop();
      drag = null; canvas.classList.remove('dragging');
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      return;
    }
    if (pointers.size > 2) return;
    onDown(e);
  });
  function onDown(e) {
    const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, w = s2w(sx, sy);
    if (e.button === 1 || e.button === 2 || !editable() || state.tool === 'select') {
      const hit = e.button === 0 ? hitTest(sx, sy) : null;
      if (hit && !hit.atlas && editable() && state.tool === 'select') { const root = rootOf(hit); pushUndo(); drag = { kind: 'move', obj: root, ox: w.x - root.x, oy: w.y - root.y, moved: false, hit }; }
      else drag = { kind: 'pan', sx, sy, cx: state.view.cx, cy: state.view.cy, moved: false, hit };
      canvas.classList.add('dragging'); return;
    }
    if (state.tool === 'assign') {
      let hit = hitTest(sx, sy); if (!hit || !needEra()) return;
      pushUndo(); if (hit.atlas) hit = adoptAtlas(hit, true); const key = controlKey(hit);
      if (state.activeFaction) era().control[key] = state.activeFaction; else delete era().control[key];
      state.selected = hit.id; afterEdit();
    } else if (state.tool === 'region') {
      const reg = regionAt(w.x, w.y); if (!reg || !needEra()) return;
      pushUndo(); const rc = (era().regionClaims ||= {});
      if (!state.activeFaction || rc[reg] === state.activeFaction) delete rc[reg]; else rc[reg] = state.activeFaction;
      toast(t('regionSet', regionLabel(reg), rc[reg] ? facById(rc[reg]).name : t('neutral'))); afterEdit();
    } else if (state.tool === 'paint') {
      if (!state.activeFaction) { toast(t('firstSelectFaction')); return; }
      if (!needEra()) return;
      pushUndo(); drag = { kind: 'paint', last: null }; paintAt(w);
    } else if (state.tool === 'erase') {
      if (!needEra()) return; pushUndo(); drag = { kind: 'erase' }; eraseAt(w);
    } else if (state.tool === 'add') addObjectAt(w, sx, sy);
    else if (state.tool === 'route') {
      let hit = hitTest(sx, sy); if (!hit) return;
      if (hit.atlas) { pushUndo(); hit = adoptAtlas(hit, true); }
      state.routeDraft ||= [];
      if (state.routeDraft[state.routeDraft.length - 1] !== hit.id) state.routeDraft.push(hit.id);
      renderEditor(); draw();
    }
  }
  window.addEventListener('pointermove', e => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const r = canvas.getBoundingClientRect();
      state.view.cx -= (mx - pinch.mx) / state.view.z; state.view.cy -= (my - pinch.my) / state.view.z;
      if (pinch.d > 0 && d > 0) zoomAt(mx - r.left, my - r.top, d / pinch.d);
      pinch = { d, mx, my }; interacting(); draw(); return;
    }
    if (e.pointerType === 'touch' && !drag) return;
    const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
    mouse = { x: sx, y: sy, in: sx >= 0 && sy >= 0 && sx <= W && sy <= H && state.mode !== 'settings' };
    if (trackDrag) return;
    if (drag) {
      const w = s2w(sx, sy);
      if (drag.kind === 'pan') {
        if (Math.abs(sx - drag.sx) + Math.abs(sy - drag.sy) > (e.pointerType === 'touch' ? 10 : 3)) drag.moved = true;
        state.view.cx = drag.cx - (sx - drag.sx) / state.view.z; state.view.cy = drag.cy - (sy - drag.sy) / state.view.z;
        if (drag.moved) interacting();
      } else if (drag.kind === 'move') { drag.moved = true; drag.obj.x = Math.round(w.x - drag.ox); drag.obj.y = Math.round(w.y - drag.oy); bump(); interacting(); }
      else if (drag.kind === 'paint') { paintAt(w); bump(); }
      else if (drag.kind === 'erase') { eraseAt(w); bump(); }
      draw(); return;
    }
    const tt = $('#tooltip');
    if (!mouse.in) { tt.hidden = true; if (state.hover) { state.hover = null; draw(); } return; }
    if (performance.now() < interactUntil) return;
    const hit = hitTest(sx, sy);
    if (hit && e.pointerType !== 'touch') {
      const fac = controllerOf(hit);
      tt.innerHTML = `<b>${esc(hit.name)}</b> <span class="dim">· ${esc(typeLabel(hit.type))}</span>${fac ? `<br><span style="color:${esc(fac.color)}">■</span> ${esc(fac.name)}` : ''}`;
      tt.style.left = (sx + 14) + 'px'; tt.style.top = (sy + 12) + 'px'; tt.hidden = false;
    } else tt.hidden = true;
    const nh = hit ? hit.id : null, cursorTool = editable() && (state.tool === 'paint' || state.tool === 'erase' || (state.tool === 'route' && state.routeDraft));
    if (nh !== state.hover || cursorTool) { state.hover = nh; draw(); }
  });
  const pointerEnd = e => {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; return; }
    if (trackDrag) { trackDrag = false; return; }
    if (!drag) return;
    const d = drag; drag = null; canvas.classList.remove('dragging');
    if (d.kind === 'pan' && !d.moved && e.button === 0 && state.pick != null && d.hit) {
      settings.planner.stops[state.pick] = d.hit.name; state.pick = null; saveSoon(); renderPlanner(); draw(); if (isMobile()) setSheet(true);
    } else if (d.kind === 'pan' && !d.moved && e.button === 0) { state.selected = d.hit ? d.hit.id : null; renderInfo(); draw(); if (isMobile()) setSheet(!!d.hit || state.plannerOpen || state.mode === 'edit'); }
    else if (d.kind === 'move') {
      if (!d.moved) { state.undo.pop(); state.selected = d.hit.id; renderInfo(); draw(); }
      else { if (isSW()) d.obj.region = regionAt(d.obj.x, d.obj.y) || d.obj.region; state.selected = d.hit.id; afterEdit(); }
    } else if (d.kind === 'paint' || d.kind === 'erase') afterEdit();
  };
  window.addEventListener('pointerup', pointerEnd);
  window.addEventListener('pointercancel', pointerEnd);
  canvas.addEventListener('wheel', e => { e.preventDefault(); const r = canvas.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  function zoomAt(sx, sy, f) {
    rebuildTree(); computePositions();
    let anchor = null, bd = 30;
    for (const o of state.tl.objects) {
      if (!visibleObj(o)) continue;
      const p = w2s(posOf(o).x, posOf(o).y), d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bd) { bd = d; anchor = { o, sx: p.x, sy: p.y }; }
    }
    const before = s2w(sx, sy);
    state.view.z = Math.max(0.12, Math.min(120, state.view.z * f));
    interacting();
    const after = s2w(sx, sy);
    state.view.cx += before.x - after.x; state.view.cy += before.y - after.y;
    if (anchor) { computePositions(); const np = w2s(posOf(anchor.o).x, posOf(anchor.o).y); state.view.cx += (np.x - anchor.sx) / state.view.z; state.view.cy += (np.y - anchor.sy) / state.view.z; }
    draw();
  }
  function fitView() {
    if (!W) return;
    if (state.world.type === 'fantasy') { state.view.cx = FANTASY_SIZE.w / 2; state.view.cy = FANTASY_SIZE.h / 2; state.view.z = Math.min(W / (FANTASY_SIZE.w + 100), H / (FANTASY_SIZE.h + 100)); }
    else { state.view.cx = GEO.center.x; state.view.cy = GEO.center.y + 90; state.view.z = Math.min(W / 2400, H / 2150); }
    draw();
  }
  function centerOn(o, z) {
    if (z) state.view.z = Math.max(state.view.z, z);
    rebuildTree(); computePositions();
    const p = posOf(o); state.view.cx = p.x; state.view.cy = p.y;
    state.selected = o.id; renderInfo(); draw();
  }
  function paintAt(w) {
    if (drag.last && Math.hypot(w.x - drag.last.x, w.y - drag.last.y) < state.brush * 0.45) return;
    (era().zones ||= []).push({ id: uid('z'), faction: state.activeFaction, x: Math.round(w.x), y: Math.round(w.y), r: state.brush });
    drag.last = w; draw();
  }
  function pointInPoly(x, y, poly) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
  function eraseAt(w) {
    const e = era(); if (!e || !e.zones) return;
    const n = e.zones.length;
    e.zones = e.zones.filter(z => Array.isArray(z.poly) ? !pointInPoly(w.x, w.y, z.poly) : Math.hypot(z.x - w.x, z.y - w.y) > state.brush + z.r * 0.3);
    if (e.zones.length !== n) draw();
  }
  function addObjectAt(w, sx, sy) {
    const type = state.newType || wtype().types[0];
    let parent = null;
    if (state.attach && state.world.type === 'scifi') {
      const pTypes = type === 'moon' ? ['planet'] : type === 'station' ? ['planet', 'moon'] : ['sun'];
      parent = nearest(sx, sy, pTypes, 45);
    }
    pushUndo();
    const count = state.tl.objects.filter(o => o.type === type).length + 1;
    const name = state.newName.trim() || `${typeLabel(type)} ${count}`;
    const o = { id: uid('o'), name, type, x: Math.round(parent ? parent.x : w.x), y: Math.round(parent ? parent.y : w.y),
      region: parent ? parent.region : regionAt(w.x, w.y), sector: parent ? parent.sector || null : null, desc: '', parent: parent ? parent.id : null, from: null, to: null };
    state.tl.objects.push(o); state.selected = o.id; state.newName = '';
    const inp = $('#newName'); if (inp) inp.value = '';
    afterEdit(true);
    toast(t('created', typeLabel(type), name) + (parent ? t('createdAt', parent.name) : ''));
  }
  function finishRoute() {
    const d = state.routeDraft;
    if (!d || d.length < 2) { state.routeDraft = null; renderEditor(); draw(); return; }
    modal(t('newRoute'), `
      <label class="field"><span>${esc(t('routeName'))}</span><input id="mRouteName" value="${esc(t('newRoute'))}"></label>
      <label class="field"><span>${esc(t('routeKind'))}</span><select id="mRouteKind"><option value="major">${esc(t('routeMajor'))}</option><option value="minor" selected>${esc(t('routeMinor'))}</option></select></label>`,
      () => {
        pushUndo();
        (state.tl.routes ||= []).push({ id: uid('r'), name: $('#mRouteName').value.trim() || t('newRoute'), kind: $('#mRouteKind').value, points: d.slice() });
        state.routeDraft = null; afterEdit(true);
      });
    setTimeout(() => { $('#mRouteName').focus(); $('#mRouteName').select(); }, 0);
  }

  window.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { if (!typing && !isGuest()) { e.preventDefault(); undo(); } return; }
    if (typing || !$('#modal').hidden || state.mode === 'settings') return;
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setYear(state.year - step); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setYear(state.year + step); }
    else if (e.key === 'PageUp') { e.preventDefault(); jumpEra(-1); }
    else if (e.key === 'PageDown') { e.preventDefault(); jumpEra(1); }
    else if (e.key === 'Enter' && state.routeDraft) finishRoute();
    else if (e.key === 'Delete' && editable() && state.selected) deleteObject(state.selected);
    else if (e.key === 'Escape') { if (state.routeDraft) { state.routeDraft = null; renderEditor(); } else { state.selected = null; renderInfo(); } draw(); }
  });

  let toastTimer;
  function toast(msg) {
    const el = $('#toolHint'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; updateToolHint(); }, 2400);
  }
  const TOOL_HINT = { select: 'hintSelect', assign: 'hintAssign', region: 'hintRegion', paint: 'hintPaint', erase: 'hintErase', add: 'hintAdd', route: 'hintRoute' };
  function updateToolHint() {
    const el = $('#toolHint');
    if (editable()) { el.textContent = t(TOOL_HINT[state.tool]); el.hidden = false; } else el.hidden = true;
    canvas.classList.toggle('tool', editable() && state.tool !== 'select');
  }

  // ------------------------------------------------------------- Zeitleiste
  const track = $('#track'), tctx = track.getContext('2d');
  let TW = 0, TH = 0, trackDrag = false;
  function resizeTrack() {
    const r = track.getBoundingClientRect(); TW = r.width; TH = r.height;
    track.width = Math.max(1, Math.round(TW * DPR)); track.height = Math.max(1, Math.round(TH * DPR)); drawTrack();
  }
  // all=false: auf die Zeitalter rund um das eingestellte Jahr zoomen (vorheriges, aktuelles, nächstes);
  // all=true: komplette Zeitlinie zeigen (Doppelklick)
  function fitTrack(all) {
    const eras = sortedEras();
    let ys = eras.map(e => e.year);
    if (!all && ys.length > 2) {
      const cur = era(); let i = cur ? eras.indexOf(cur) : -1;
      const prev = i > 0 ? eras[i - 1].year : (cur ? cur.year : state.year) - 20;
      let next = i >= 0 && i < eras.length - 1 ? eras[i + 1].year : (i < 0 ? eras[0].year : (cur.year + 20));
      if (i >= 0 && i < eras.length - 2 && eras[i + 2].year - next < (next - prev) * 2) next = eras[i + 2].year;
      ys = [prev, state.year, next];
      if (next - prev > 600) ys = [cur ? cur.year : state.year - 50, state.year, Math.min(next, (cur ? cur.year : state.year) + 120)];
    }
    if (!ys.length) ys = state.tl.objects.flatMap(o => [o.from, o.to]).filter(v => v != null && v !== '').map(Number);
    let a = ys.length ? Math.min(...ys) : -100, b = ys.length ? Math.max(...ys) : 100;
    const pad = Math.max(2, (b - a) * 0.06); a -= pad; b += pad;
    if (b - a < 24) { const m = (a + b) / 2; a = m - 12; b = m + 12; }
    state.track = { a, b };
    ensureYearVisible(); drawTrack();
  }
  function ensureYearVisible() {
    const { a, b } = state.track, span = b - a;
    if (state.year < a) state.track = { a: state.year - span * 0.1, b: state.year + span * 0.9 };
    else if (state.year > b) state.track = { a: state.year - span * 0.9, b: state.year + span * 0.1 };
  }
  const tx = y => (y - state.track.a) / (state.track.b - state.track.a) * TW;
  const tyear = x => state.track.a + x / TW * (state.track.b - state.track.a);
  function niceStep(span) {
    const target = span / Math.max(2, TW / 80);
    const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, target))));
    for (const m of [1, 2, 5, 10]) if (m * p >= target) return Math.max(1, m * p);
    return Math.max(1, 10 * p);
  }
  function eraColor(i) { return state.theme === 'fantasy' ? ['rgba(255,217,138,0.22)', 'rgba(244,231,200,0.12)'][i % 2] : ['rgba(245,184,61,0.14)', 'rgba(89,195,255,0.12)'][i % 2]; }
  function drawTrack() {
    if (!TW || !state.tl) return;
    const fan = state.theme === 'fantasy';
    tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    tctx.clearRect(0, 0, TW, TH);
    tctx.fillStyle = fan ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.03)'; tctx.fillRect(0, 0, TW, TH);
    const eras = sortedEras(), barY = 6, barH = 30;
    eras.forEach((e, i) => {
      const x0 = Math.max(0, tx(e.year)), x1 = Math.min(TW, i < eras.length - 1 ? tx(eras[i + 1].year) : TW);
      if (x1 <= 0 || x0 >= TW) return;
      tctx.fillStyle = eraColor(i); tctx.fillRect(x0, barY, x1 - x0, barH);
      tctx.fillStyle = fan ? 'rgba(255,217,138,0.85)' : 'rgba(245,184,61,0.8)'; tctx.fillRect(tx(e.year), barY, 2, barH);
      tctx.save(); tctx.beginPath(); tctx.rect(x0 + 4, barY, Math.max(0, x1 - x0 - 6), barH); tctx.clip();
      tctx.font = `600 13px ${fan ? 'Georgia, serif' : '"Segoe UI", sans-serif'}`; tctx.fillStyle = fan ? '#f4e7c8' : '#dbe4ee'; tctx.textBaseline = 'middle'; tctx.textAlign = 'left';
      tctx.fillText(e.name, x0 + 6, barY + barH / 2); tctx.restore();
    });
    const span = state.track.b - state.track.a, step = niceStep(span);
    tctx.font = `11.5px ${fan ? 'Georgia, serif' : '"Segoe UI", sans-serif'}`; tctx.textAlign = 'center'; tctx.textBaseline = 'alphabetic';
    tctx.strokeStyle = fan ? 'rgba(244,231,200,0.5)' : 'rgba(160,180,210,0.45)'; tctx.fillStyle = fan ? '#e3cfa6' : '#8a99ad';
    const minor = step >= 10 ? step / (step % 5 === 0 && step / 5 >= 1 ? 5 : 2) : (step > 1 ? 1 : 0);
    if (minor) { tctx.globalAlpha = 0.5; for (let y = Math.ceil(state.track.a / minor) * minor; y <= state.track.b; y += minor) { const x = tx(y); tctx.beginPath(); tctx.moveTo(x, barY + barH + 2); tctx.lineTo(x, barY + barH + 4); tctx.stroke(); } tctx.globalAlpha = 1; }
    for (let y = Math.ceil(state.track.a / step) * step; y <= state.track.b; y += step) {
      const x = tx(y); tctx.beginPath(); tctx.moveTo(x, barY + barH + 2); tctx.lineTo(x, barY + barH + 7); tctx.stroke();
      tctx.fillText(fmtYear(y), x, TH - 3);
    }
    const mx = tx(state.year);
    if (mx >= -2 && mx <= TW + 2) {
      tctx.fillStyle = fan ? '#ffd98a' : '#f5b83d';
      tctx.fillRect(mx - 1, 0, 2, barY + barH + 8);
      tctx.beginPath(); tctx.moveTo(mx - 6, 0); tctx.lineTo(mx + 6, 0); tctx.lineTo(mx, 7); tctx.closePath(); tctx.fill();
    }
  }
  track.style.touchAction = 'none';
  // Klick = Jahr setzen · Ziehen = Zeitleiste verschieben · Marker ziehen = Jahr scrubben
  track.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.button !== 1) return;
    trackDrag = true; try { track.setPointerCapture(e.pointerId); } catch { }
    const r = track.getBoundingClientRect(), x0 = e.clientX - r.left;
    const scrub = e.button === 0 && Math.abs(x0 - tx(state.year)) <= (e.pointerType === 'touch' ? 18 : 10);
    const start = { x: e.clientX, a: state.track.a, b: state.track.b }; let moved = false;
    track.style.cursor = scrub ? 'ew-resize' : 'grabbing';
    const move = ev => {
      if (!trackDrag) return;
      const rr = track.getBoundingClientRect(), dx = ev.clientX - start.x;
      if (Math.abs(dx) > 4) moved = true;
      if (scrub) { setYear(Math.round(tyear(Math.max(0, Math.min(TW, ev.clientX - rr.left)))), true); return; }
      if (!moved) return;
      const dy = dx / TW * (start.b - start.a); state.track = { a: start.a - dy, b: start.b - dy }; drawTrack();
    };
    const up = ev => {
      trackDrag = false; track.style.cursor = '';
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (!scrub && !moved && ev.type === 'pointerup' && e.button === 0) { const rr = track.getBoundingClientRect(); setYear(Math.round(tyear(ev.clientX - rr.left)), true); }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
  track.addEventListener('dblclick', () => fitTrack(true));
  function zoomTrack(f) { const m = state.year, span = state.track.b - state.track.a, ns = Math.max(4, Math.min(1e6, span * f)), r = (m - state.track.a) / span; state.track = { a: m - r * ns, b: m - r * ns + ns }; drawTrack(); }
  $('#trkIn').addEventListener('click', () => zoomTrack(1 / 2));
  $('#trkOut').addEventListener('click', () => zoomTrack(2));
  $('#trkEra').addEventListener('click', () => fitTrack(false));
  $('#trkAll').addEventListener('click', () => fitTrack(true));
  track.addEventListener('wheel', e => {
    e.preventDefault();
    const r = track.getBoundingClientRect(), x = e.clientX - r.left, span = state.track.b - state.track.a;
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const d = (e.deltaX || e.deltaY) / TW * span; state.track = { a: state.track.a + d, b: state.track.b + d };
    } else {
      const f = Math.exp(e.deltaY * 0.0015), ym = tyear(x);
      let ns = Math.max(4, Math.min(1e6, span * f));
      const a = ym - (x / TW) * ns; state.track = { a, b: a + ns };
    }
    drawTrack();
  }, { passive: false });
  track.addEventListener('mousemove', e => {
    const r = track.getBoundingClientRect(), x = e.clientX - r.left; track.title = `${fmtYear(Math.round(tyear(x)))} — ${t('trackHint')}`;
    if (!trackDrag) track.style.cursor = Math.abs(x - tx(state.year)) <= 10 ? 'ew-resize' : 'grab';
  });

  let lastEraId = null;
  function setYear(y, fromTrack) {
    y = Math.round(+y); if (isNaN(y)) return;
    state.year = y;
    if (!fromTrack) ensureYearVisible();
    const e = era(), eid = e ? e.id : null;
    renderYear();
    if (eid !== lastEraId) { lastEraId = eid; renderFactionFilter(); if (state.mode === 'edit') renderEditor(); }
    if (state.plannerOpen) renderPlanner();
    if (state.mode === 'story' && !storyEditing) renderStory();
    renderInfo(); saveSoon(); draw();
  }
  function jumpEra(dir) {
    const eras = sortedEras(); if (!eras.length) return;
    if (dir < 0) { const prev = eras.filter(e => e.year < state.year); const cur = era(); const tgt = cur && cur.year < state.year ? cur : prev[prev.length - 1]; if (tgt) { setYear(tgt.year); fitTrack(); } }
    else { const nx = eras.find(e => e.year > state.year); if (nx) { setYear(nx.year); fitTrack(); } }
  }
  function renderYear() {
    const inp = $('#yearInput'); if (document.activeElement !== inp) inp.value = fmtYear(state.year);
    const e = era();
    $('#eraName').textContent = e ? e.name : t('noEra');
    const end = e ? eraEnd(e) : null;
    $('#eraYear').textContent = e ? `${fmtYear(e.year)}${end != null ? ' – ' + fmtYear(end) : ''}` : '';
    $('#eraDesc').textContent = e ? (e.desc || '').replace(/\*\*|\*/g, '').replace(/\s*\n+\s*/g, ' · ') : t('beforeFirstEra');
    drawTrack();
  }
  $('#yearInput').addEventListener('keydown', e => { if (e.key === 'Enter') { const y = parseYear(e.target.value); if (y != null) { setYear(y); fitTrack(); } e.target.blur(); } else if (e.key === 'Escape') e.target.blur(); });
  $('#yearInput').addEventListener('blur', e => { const y = parseYear(e.target.value); if (y != null && y !== state.year) setYear(y); else renderYear(); });
  let yearWheelAcc = 0;
  $('#yearInput').addEventListener('wheel', e => {
    if (document.activeElement !== e.target) return; // nur wenn das Feld angeklickt ist
    e.preventDefault(); yearWheelAcc += e.deltaY;
    if (Math.abs(yearWheelAcc) < 60) return; // Touchpads liefern viele kleine Schritte
    const steps = Math.trunc(yearWheelAcc / 60); yearWheelAcc -= steps * 60;
    setYear(state.year - steps * (e.shiftKey ? 10 : 1));
  }, { passive: false });
  $('#yearPrev').addEventListener('click', e => setYear(state.year - (e.shiftKey ? 10 : 1)));
  $('#yearNext').addEventListener('click', e => setYear(state.year + (e.shiftKey ? 10 : 1)));
  $('#eraPrev').addEventListener('click', () => jumpEra(-1));
  $('#eraNext').addEventListener('click', () => jumpEra(1));

  // ------------------------------------------------------------- Linke Leiste
  function renderLeft() {
    $('#typeFilter').innerHTML = wtype().types.map(ty => `
      <label class="chk"><input type="checkbox" data-type="${ty}" ${settings.types[ty] !== false ? 'checked' : ''}><span class="ico ${ty}"></span>${esc(t('typesPl.' + ty))}</label>`).join('');
    $$('#typeFilter input').forEach(cb => cb.addEventListener('change', () => { settings.types[cb.dataset.type] = cb.checked; saveSoon(); draw(); }));
    $$('#left input[data-opt]').forEach(cb => { cb.checked = !!settings.opts[cb.dataset.opt]; });
    $('#lblRoutes').textContent = state.world.type === 'fantasy' ? t('optRoutesFan') : t('optRoutesSci');
  }
  $$('#left input[data-opt]').forEach(cb => cb.addEventListener('change', () => { settings.opts[cb.dataset.opt] = cb.checked; saveSoon(); draw(); }));
  $('#facAll').addEventListener('click', e => { e.preventDefault(); state.hiddenFactions.clear(); renderFactionFilter(); saveSoon(); draw(); });
  $('#facNone').addEventListener('click', e => { e.preventDefault(); state.tl.factions.forEach(f => state.hiddenFactions.add(f.id)); renderFactionFilter(); saveSoon(); draw(); });
  function renderFactionFilter() {
    const e = era(), present = new Set();
    if (e) { Object.values(e.control).forEach(f => present.add(f)); Object.values(e.regionClaims || {}).forEach(f => present.add(f)); (e.zones || []).forEach(z => present.add(z.faction)); }
    $('#factionFilter').innerHTML = state.tl.factions.map(f => `
      <label class="chk ${present.has(f.id) ? '' : 'absent'}"><input type="checkbox" data-fac="${esc(f.id)}" ${state.hiddenFactions.has(f.id) ? '' : 'checked'}>
      <span class="swatch" style="background:${esc(f.color)}"></span>${esc(f.name)}</label>`).join('') || `<p class="hint">${esc(t('noFactions'))}</p>`;
    $$('#factionFilter input').forEach(cb => cb.addEventListener('change', () => { cb.checked ? state.hiddenFactions.delete(cb.dataset.fac) : state.hiddenFactions.add(cb.dataset.fac); saveSoon(); draw(); }));
  }
  function renderSearchList() {
    const own = state.tl.objects.slice().sort((a, b) => a.name.localeCompare(b.name)).map(o => `<option value="${esc(o.name)}">${esc(typeLabel(o.type))}</option>`);
    const atl = atlasOn() ? atlasObjs().slice().sort((a, b) => a.name.localeCompare(b.name)).map(o => `<option value="${esc(o.name)}">${esc(t('atlasSystem'))} · ${esc(o.grid)}</option>`) : [];
    $('#searchList').innerHTML = own.concat(atl).join('');
  }
  $('#search').addEventListener('change', () => {
    const q = $('#search').value.trim().toLowerCase(); if (!q) return;
    const cands = state.tl.objects.filter(o => o.name.toLowerCase() === q);
    const atl = atlasOn() ? atlasObjs() : [];
    const o = cands.sort((a, b) => typeOrder(a) === 1 ? -1 : typeOrder(b) === 1 ? 1 : 0)[0] || atl.find(o => o.name.toLowerCase() === q)
      || state.tl.objects.find(o => o.name.toLowerCase().includes(q)) || atl.find(o => o.name.toLowerCase().startsWith(q)) || atl.find(o => o.name.toLowerCase().includes(q));
    if (o) { if (settings.types[o.type] === false) { settings.types[o.type] = true; renderLeft(); } if (!existsNow(o) && o.from != null) setYear(+o.from); centerOn(o, o.atlas ? 3 : 1.4); if (isMobile()) { setDrawer(false); setSheet(true); $('#search').blur(); } }
  });
  $('#search').addEventListener('keydown', e => { if (e.key === 'Enter') $('#search').dispatchEvent(new Event('change')); });

  // ------------------------------------------------------------- Eckdaten & Bild
  const PL = window.IAM_PLANETS;
  const FACT_KEYS = ['pop', 'climate', 'terrain', 'species', 'capital'];
  // Für Star-Wars-Zeitlinien: fehlende Angaben aus dem Kanon ergänzen (eigene Angaben haben Vorrang)
  let canonCache = null;
  function canonObj(o) {
    if (state.world.id !== 'starwars' || state.tl.id === 'canon') return null;
    const c = state.timelines.find(x => x.id === 'canon'); if (!c) return null;
    if (!canonCache || canonCache.tl !== c) canonCache = { tl: c, map: Object.fromEntries(c.objects.map(x => [x.id, x])) };
    return canonCache.map[o.id] || null;
  }
  const biomeOf = o => o.biome || (canonObj(o) || {}).biome || null;
  const factsOf = o => Object.assign({}, (canonObj(o) || {}).facts || {}, o.facts || {});
  const descOf = o => o.desc || (canonObj(o) || {}).desc || '';
  // Beschreibungstext: Zeilenumbrüche, **fett**, *kursiv*
  const rich = txt => esc(txt).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<i>$2</i>');
  function hasImage(o) { if (o.image) return true; const b = biomeOf(o); return state.world.type === 'scifi' && (o.type === 'sun' || ((o.type === 'planet' || o.type === 'moon') && b && PL.BIOMES[b])); }
  function imgHtml(o) {
    if (!hasImage(o)) return '';
    if (o.image) return `<figure class="planet-img own"><img src="${esc(o.image)}" alt=""><figcaption>${esc(t('imgOwn'))}</figcaption></figure>`;
    return `<figure class="planet-img"><img src="${PL.render(o, biomeOf(o) || 'barren')}" alt=""><figcaption>${esc(t('imgNote'))}</figcaption></figure>`;
  }
  function tempText(o, ownOnly) {
    const f = ownOnly ? (o.facts || {}) : factsOf(o);
    if (f.temp) return f.temp;
    const bk = biomeOf(o), b = bk && PL.BIOMES[bk];
    return b && b.temp && o.type !== 'sun' ? t('tempTypical', b.temp[0], b.temp[1]) : '';
  }
  function factsRows(o) {
    const f = factsOf(o), rows = [], bk = biomeOf(o);
    if (bk && PL.BIOMES[bk]) rows.push([t('biome'), t('biomes.' + bk)]);
    const tt = tempText(o); if (tt) rows.push([t('temp'), tt]);
    for (const k of FACT_KEYS) if (f[k]) rows.push([t(k), f[k]]);
    for (const [l, v] of (f.extra || [])) if (l || v) rows.push([l, v]);
    return rows.map(([k, v]) => `<span class="k">${esc(k)}</span><span>${esc(v)}</span>`).join('');
  }

  // ------------------------------------------------------------- Info-Panel
  function renderInfo() {
    const box = $('#info'); if (!state.tl) return;
    const o = objMap[state.selected] || state.tl.objects.find(x => x.id === state.selected);
    if (!o) {
      box.innerHTML = `<p class="hint">${esc(t('infoEmpty'))}<br><br><b>${esc(t('controls'))}:</b> ${esc(t('controlsText'))}${state.mode === 'edit' ? esc(t('controlsEdit')) : ''}</p>
        ${state.tl.readonly ? `<p class="hint">${esc(t('approxNote'))}</p>` : ''}
        ${isGuest() ? `<p class="hint">🔒 ${esc(t('guestHint'))}</p>` : ''}`;
      return;
    }
    rebuildTree();
    const fac = controllerOf(o), parent = o.parent && objMap[o.parent], kids = childrenOf[o.id] || [], e = era();
    const gridRow = isSW() && o.type !== 'sun' ? `<span class="k">${esc(t('gridSquare'))}</span><span>${esc(o.grid || SW.gridOf(posOf(o).x, posOf(o).y))}</span>` : '';
    if (o.atlas) {
      box.innerHTML = `
        <div class="info-title">${esc(o.name)}</div>
        <div class="info-type">${esc(t('atlasSystem'))}</div>
        <div class="kv">
          <span class="k">${esc(t('region'))}</span><span>${esc(regionLabel(o.region))}</span>
          ${o.sector ? `<span class="k">${esc(t('sector'))}</span><span>${esc(o.sector)}${o.subsector ? ` <span class="dim">(${esc(o.subsector)})</span>` : ''}</span>` : ''}
          ${gridRow}
          <span class="k">${esc(t('control'))}</span><span>${fac ? `<span style="color:${esc(fac.color)}">■</span> ${esc(fac.name)} <span class="dim">(${esc(t('byBorders'))})</span>` : esc(t('neutral'))}</span>
        </div>
        <p class="hint">${esc(t('atlasHint'))}</p>
        <div class="row">${canEditTl() ? `<button id="atAdopt" class="primary">＋ ${esc(t('atlasAdopt'))}</button>` : ''}<button id="atPlan">🧭 ${esc(t('plAsDest'))}</button></div>`;
      const ad = $('#atAdopt'); if (ad) ad.onclick = () => { pushUndo(); const n = adoptAtlas(o); state.selected = n.id; if (state.mode !== 'edit') setMode('edit'); afterEdit(true); };
      $('#atPlan').onclick = () => { const P = settings.planner; P.stops[P.stops.length - 1] = o.name; state.plannerOpen = true; saveSoon(); renderPlanner(); draw(); };
      return;
    }
    if (!editable()) {
      box.innerHTML = `
        <div class="info-title">${esc(o.name)}</div>
        <div class="info-type">${esc(typeLabel(o.type))}${existsNow(o) ? '' : ` · <span class="warn">${esc(t('notExisting'))}</span>`}</div>
        ${imgHtml(o)}
        <div class="kv">
          ${o.region ? `<span class="k">${esc(t('region'))}</span><span>${esc(regionLabel(o.region))}</span>` : ''}
          ${o.sector ? `<span class="k">${esc(t('sector'))}</span><span>${esc(o.sector)}</span>` : ''}
          ${gridRow}
          <span class="k">${esc(t('control'))}</span><span>${fac ? `<span style="color:${esc(fac.color)}">■</span> ${esc(fac.name)}` : esc(t('neutral'))}</span>
          ${parent ? `<span class="k">${esc(t('belongsTo'))}</span><span><a href="#" data-go="${esc(parent.id)}">${esc(parent.name)}</a></span>` : ''}
          ${kids.length ? `<span class="k">${esc(t('contains'))}</span><span>${kids.map(k => `<a href="#" data-go="${esc(k.id)}">${esc(k.name)}</a>`).join(', ')}</span>` : ''}
          ${(o.from != null && o.from !== '') || (o.to != null && o.to !== '') ? `<span class="k">${esc(t('exists'))}</span><span>${fmtYear(o.from)} ${esc(t('to'))} ${fmtYear(o.to)}</span>` : ''}
        </div>
        <div class="desc">${rich(descOf(o))}</div>
        ${charsAt(o).length ? `<div class="chars-here"><b>👤 ${esc(t('charsHere'))}:</b> ${charsAt(o).map(c => `<a href="#" data-char="${esc(c.id)}">${esc(c.name)}</a>`).join(', ')}</div>` : ''}
        ${factsRows(o) ? `<h3 class="facts-h">${esc(t('facts'))}</h3><div class="kv facts">${factsRows(o)}</div>` : ''}
        ${factsOf(o).notable ? `<div class="notable"><b>${esc(t('notable'))}:</b> ${rich(factsOf(o).notable)}</div>` : ''}`;
      box.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); centerOn(objMap[a.dataset.go]); }));
      box.querySelectorAll('[data-char]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); openChar(a.dataset.char); }));
      return;
    }
    const parentOpts = state.tl.objects.filter(x => x.id !== o.id && !isDescendant(x, o)).sort((a, b) => a.name.localeCompare(b.name))
      .map(x => `<option value="${esc(x.id)}" ${x.id === o.parent ? 'selected' : ''}>${esc(x.name)} (${esc(typeLabel(x.type))})</option>`).join('');
    const facOpts = `<option value="">${esc(t('neutralOpt'))}</option>` + state.tl.factions.map(f => `<option value="${esc(f.id)}" ${fac && fac.id === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
    const regionField = isSW()
      ? `<select id="oRegion">${SW.REGION_KEYS.map(r => `<option value="${r}" ${r === o.region ? 'selected' : ''}>${esc(t('regions.' + r))}</option>`).join('')}</select>`
      : `<input id="oRegion" value="${esc(o.region || '')}">`;
    box.innerHTML = `
      <h3>${esc(t('editObject'))}</h3>
      <label class="field"><span>${esc(t('name'))}</span><input id="oName" value="${esc(o.name)}"></label>
      <div class="row">
        <label class="field"><span>${esc(t('type'))}</span><select id="oType">${wtype().types.map(k => `<option value="${k}" ${k === o.type ? 'selected' : ''}>${esc(typeLabel(k))}</option>`).join('')}</select></label>
        <label class="field"><span>${esc(t('region'))}</span>${regionField}</label>
      </div>
      <label class="field"><span>${esc(t('sector'))}</span><input id="oSector" value="${esc(o.sector || '')}"></label>
      <label class="field"><span>${esc(t('parentField'))}</span><select id="oParent"><option value="">${esc(t('freeSpace'))}</option>${parentOpts}</select></label>
      <label class="field"><span>${esc(t('controlIn'))} „${esc(e ? e.name : t('noEra'))}“${wtype().child.includes(o.type) && o.parent ? esc(t('systemWide')) : ''}</span><select id="oFac" ${e ? '' : 'disabled'}>${facOpts}</select></label>
      <div class="row">
        <label class="field"><span>${esc(t('existsFrom'))}</span><input id="oFrom" type="number" value="${o.from ?? ''}" placeholder="${esc(t('always'))}"></label>
        <label class="field"><span>${esc(t('existsTo'))}</span><input id="oTo" type="number" value="${o.to ?? ''}" placeholder="${esc(t('always'))}"></label>
      </div>
      <label class="field"><span>${esc(t('description'))}</span><textarea id="oDesc">${esc(o.desc || '')}</textarea></label>
      <h3 class="facts-h">${esc(t('facts'))}</h3>
      ${imgHtml(o)}
      <div class="row" style="margin-bottom:8px"><button id="imgUp">🖼 ${esc(t(o.image ? 'imgChange' : 'imgUpload'))}</button>${o.image ? `<button id="imgDel" class="fixed danger">✕</button>` : ''}<input type="file" id="imgFile" accept="image/*" hidden></div>
      ${state.world.type === 'scifi' && (o.type === 'planet' || o.type === 'moon') ? `<label class="field"><span>${esc(t('biome'))}</span><select id="oBiome"><option value="">${esc(canonObj(o) && canonObj(o).biome ? t('biomeCanon', t('biomes.' + canonObj(o).biome)) : t('biomeUnknown'))}</option>${PL.keys.map(k => `<option value="${k}" ${k === o.biome ? 'selected' : ''}>${esc(t('biomes.' + k))}</option>`).join('')}</select></label>` : ''}
      <label class="field"><span>${esc(t('temp'))}</span><input id="fTemp" value="${esc((o.facts || {}).temp || '')}" placeholder="${esc(tempText(o) || t('tempPh'))}"></label>
      ${FACT_KEYS.map(k => `<label class="field"><span>${esc(t(k))}</span><input data-fact="${k}" value="${esc((o.facts || {})[k] || '')}" placeholder="${esc(((canonObj(o) || {}).facts || {})[k] || '')}"></label>`).join('')}
      <label class="field"><span>${esc(t('notable'))}</span><textarea data-fact="notable" placeholder="${esc(((canonObj(o) || {}).facts || {}).notable || '')}">${esc((o.facts || {}).notable || '')}</textarea></label>
      <div id="factExtra">${((o.facts || {}).extra || []).map(([l, v], i) => `<div class="row extra" data-i="${i}"><input class="exL" placeholder="${esc(t('factLabel'))}" value="${esc(l)}"><input class="exV" placeholder="${esc(t('factValue'))}" value="${esc(v)}"><button class="exDel fixed">✕</button></div>`).join('')}</div>
      <button id="addFact" style="margin:4px 0 8px">${esc(t('addFact'))}</button>
      <p class="hint">${esc(t('factsHint'))}</p>
      <div class="row"><button id="oCenter">${esc(t('center'))}</button><button id="oDelete" class="danger">${esc(t('delete'))}</button></div>`;
    let pushed = false; const mark = () => { if (!pushed) { pushUndo(); pushed = true; } };
    const bind = (id, ev, fn) => $(id).addEventListener(ev, fn);
    bind('#oName', 'input', ev => { mark(); o.name = ev.target.value; saveSoon(); draw(); renderSearchList(); });
    bind('#oType', 'change', ev => { mark(); o.type = ev.target.value; afterEdit(); });
    bind('#oRegion', 'change', ev => { mark(); o.region = ev.target.value || null; afterEdit(); });
    bind('#oSector', 'change', ev => { mark(); o.sector = ev.target.value.trim() || null; afterEdit(); });
    bind('#oParent', 'change', ev => {
      mark(); const p = objMap[ev.target.value];
      if (!p) { const cur = posOf(o); o.x = Math.round(cur.x); o.y = Math.round(cur.y); o.parent = null; } else { o.parent = p.id; o.region = p.region; }
      afterEdit();
    });
    bind('#oFac', 'change', ev => { if (!e) return; mark(); const k = controlKey(o); if (ev.target.value) e.control[k] = ev.target.value; else delete e.control[k]; afterEdit(); });
    bind('#oFrom', 'change', ev => { mark(); o.from = ev.target.value === '' ? null : +ev.target.value; afterEdit(); });
    bind('#oTo', 'change', ev => { mark(); o.to = ev.target.value === '' ? null : +ev.target.value; afterEdit(); });
    bind('#oDesc', 'input', ev => { mark(); o.desc = ev.target.value; saveSoon(); });
    const facts = () => (o.facts ||= {});
    bind('#imgUp', 'click', () => $('#imgFile').click());
    bind('#imgFile', 'change', ev => {
      const file = ev.target.files[0]; if (!file) return;
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 512, sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        mark(); o.image = c.toDataURL('image/jpeg', 0.85); renderInfo(); saveSoon();
      };
      img.onerror = () => alert(t('imgError'));
      img.src = url;
    });
    const idl = $('#imgDel'); if (idl) idl.addEventListener('click', () => { mark(); delete o.image; renderInfo(); saveSoon(); });
    const ob = $('#oBiome'); if (ob) ob.addEventListener('change', ev => { mark(); o.biome = ev.target.value || null; renderInfo(); saveSoon(); });
    bind('#fTemp', 'change', ev => { mark(); facts().temp = ev.target.value.trim() || undefined; saveSoon(); });
    $$('#info [data-fact]').forEach(el => el.addEventListener('change', ev => { mark(); facts()[el.dataset.fact] = ev.target.value.trim() || undefined; saveSoon(); }));
    $$('#factExtra .extra').forEach(row => {
      const i = +row.dataset.i;
      row.querySelector('.exL').addEventListener('change', ev => { mark(); facts().extra[i][0] = ev.target.value; saveSoon(); });
      row.querySelector('.exV').addEventListener('change', ev => { mark(); facts().extra[i][1] = ev.target.value; saveSoon(); });
      row.querySelector('.exDel').addEventListener('click', () => { mark(); facts().extra.splice(i, 1); renderInfo(); saveSoon(); });
    });
    bind('#addFact', 'click', () => { mark(); (facts().extra ||= []).push(['', '']); renderInfo(); const rows = $$('#factExtra .exL'); if (rows.length) rows[rows.length - 1].focus(); saveSoon(); });
    bind('#oCenter', 'click', () => centerOn(o));
    bind('#oDelete', 'click', () => deleteObject(o.id));
  }
  // Atlas-System als echtes Objekt in die Zeitlinie übernehmen (danach frei bearbeitbar)
  function adoptAtlas(a, quiet) {
    const n = { id: a.id, name: a.name, type: 'planet', x: a.x, y: a.y, region: a.region, sector: a.sector || null, grid: a.grid, desc: '', parent: null, from: null, to: null };
    state.tl.objects.push(n); editVersion++; rebuildTree();
    if (!quiet) toast(t('atlasAdopted', a.name));
    return n;
  }
  function isDescendant(x, o) { let c = x, n = 0; while (c && c.parent && n++ < 10) { if (c.parent === o.id) return true; c = objMap[c.parent]; } return false; }
  function deleteObject(id) {
    const o = state.tl.objects.find(x => x.id === id); if (!o) return;
    const kids = state.tl.objects.filter(x => x.parent === id);
    if (!confirm(t('confirmDeleteObj', o.name) + (kids.length ? t('confirmDeleteObjKids', kids.length) : ''))) return;
    pushUndo(); rebuildTree(); computePositions();
    for (const k of kids) { const p = posOf(k); k.x = Math.round(p.x); k.y = Math.round(p.y); k.parent = o.parent || null; }
    state.tl.objects = state.tl.objects.filter(x => x.id !== id);
    for (const e of state.tl.eras) delete e.control[id];
    for (const r of state.tl.routes || []) r.points = r.points.filter(p => p !== id);
    state.selected = null; afterEdit(true);
  }

  // ------------------------------------------------------------- Editor
  function renderEditor() {
    const ed = $('#editor');
    if (state.mode !== 'edit') { ed.hidden = true; return; }
    ed.hidden = false;
    if (!canEditTl()) {
      const cc = canCreate();
      ed.innerHTML = `<div class="readonly-note"><b>${esc(t(state.tl.readonly ? 'readonlyTitle' : 'noEditRights'))}</b><br>${esc(t(cc ? 'readonlyText' : 'askAdmin'))}</div>
        ${cc ? `<button id="edCopy" class="primary wide">${esc(t('makeCopy'))}</button>
        <button id="edNew" class="wide" style="margin-top:6px">${esc(t('makeEmpty'))}</button>` : ''}`;
      if (cc) { $('#edCopy').addEventListener('click', duplicateTimeline); $('#edNew').addEventListener('click', newTimelineDialog); }
      return;
    }
    const tl = state.tl, cur = era(), eras = sortedEras();
    if (state.activeFaction && !facById(state.activeFaction)) state.activeFaction = null;
    if (!state.activeFaction && tl.factions[0]) state.activeFaction = tl.factions[0].id;
    const tools = ['select', 'assign'].concat(isSW() ? ['region'] : [], ['paint', 'erase', 'add', 'route']);
    const toolKey = { select: 'toolSelect', assign: 'toolAssign', region: 'toolRegion', paint: 'toolPaint', erase: 'toolErase', add: 'toolAdd', route: 'toolRoute' };
    ed.innerHTML = `
      <div class="ed-block">
        <h3>${esc(t('timeline'))}</h3>
        <label class="field"><span>${esc(t('name'))}</span><input id="tlName" value="${esc(tl.name)}"></label>
      </div>
      <div class="ed-block">
        <h3>${esc(t('eras'))} <button id="eraAdd" title="${esc(t('eraAdd'))}">＋ ${esc(fmtYear(state.year))}</button></h3>
        <div class="list" id="eraList">${eras.map(x => `
          <div class="list-item ${x === cur ? 'cur' : ''}" data-id="${esc(x.id)}">
            <input type="number" class="eraYear" value="${x.year}" title="${esc(fmtYear(x.year))}">
            <input type="text" class="eraName" value="${esc(x.name)}">
            <button class="eraDel" title="${esc(t('delete'))}">✕</button>
          </div>`).join('')}</div>
        ${cur ? `<label class="field" style="margin-top:6px"><span>${esc(t('eraDescOf', cur.name))}</span><textarea id="eraDescIn">${esc(cur.desc || '')}</textarea></label>` : `<p class="hint">${esc(t('hintNoEra'))}</p>`}
      </div>
      <div class="ed-block">
        <h3>${esc(t('factions'))} <button id="facAdd" title="${esc(t('factionAdd'))}">＋</button></h3>
        <div class="list" id="facList">${tl.factions.map(f => `
          <div class="list-item ${f.id === state.activeFaction ? 'cur' : ''}" data-id="${esc(f.id)}">
            <input type="color" class="facColor" value="${esc(f.color)}">
            <input type="text" class="facName" value="${esc(f.name)}">
            <input type="number" class="facReach" value="${f.reach}" min="10" max="600" step="10">
            <button class="facDel" title="${esc(t('delete'))}">✕</button>
          </div>`).join('') || `<p class="hint">${esc(t('noFactionYet'))}</p>`}</div>
        <p class="hint">${esc(t('reachHint'))}</p>
      </div>
      <div class="ed-block">
        <h3>${esc(t('tools'))}</h3>
        <label class="field"><span>${esc(t('activeFaction'))}</span><select id="activeFac"><option value="">${esc(t('neutralRemove'))}</option>${tl.factions.map(f => `<option value="${esc(f.id)}" ${f.id === state.activeFaction ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>
        <div class="tools">${tools.map(k => `<button data-tool="${k}" class="${k === state.tool ? 'active' : ''}">${esc(t(toolKey[k]))}</button>`).join('')}</div>
        <div id="toolOpts"></div>
        <p class="hint">${esc(t('undoHint'))}</p>
      </div>
      <div class="ed-block">
        <h3>${esc(t('routes'))}</h3>
        <div class="list" id="routeList">${(tl.routes || []).map(r => `
          <div class="list-item" data-id="${esc(r.id)}">
            <input type="text" class="routeName" value="${esc(r.name)}">
            <select class="routeKind"><option value="major" ${r.kind === 'major' ? 'selected' : ''}>${esc(t('routeMajor'))}</option><option value="minor" ${r.kind !== 'major' ? 'selected' : ''}>${esc(t('routeMinor'))}</option></select>
            <button class="routeDel" title="${esc(t('delete'))}">✕</button>
          </div>`).join('') || `<p class="hint">${esc(t('noRoutes'))}</p>`}</div>
      </div>`;
    $('#tlName').addEventListener('change', ev => { pushUndo(); tl.name = ev.target.value || t('withoutName'); renderTopbar(); saveSoon(); });
    $('#eraAdd').addEventListener('click', () => {
      if (tl.eras.some(x => x.year === state.year)) { toast(t('eraExists')); return; }
      pushUndo();
      const base = era();
      const ne = base ? clone(base) : { control: {}, regionClaims: {}, zones: [] };
      ne.id = uid('era'); ne.name = t('newEra'); ne.year = state.year; ne.desc = '';
      tl.eras.push(ne); tl.eras.sort((a, b) => a.year - b.year);
      afterEdit(true);
      setTimeout(() => { const inp = document.querySelector(`#eraList [data-id="${ne.id}"] .eraName`); if (inp) { inp.focus(); inp.select(); } }, 0);
    });
    $$('#eraList .list-item').forEach(row => {
      const x = tl.eras.find(q => q.id === row.dataset.id);
      row.addEventListener('click', ev => { if (ev.target.tagName !== 'INPUT' && ev.target.tagName !== 'BUTTON') setYear(x.year); });
      row.querySelector('.eraName').addEventListener('change', ev => { pushUndo(); x.name = ev.target.value; renderYear(); saveSoon(); });
      row.querySelector('.eraYear').addEventListener('change', ev => { pushUndo(); x.year = Math.round(+ev.target.value || 0); tl.eras.sort((a, b) => a.year - b.year); setYear(x.year); afterEdit(true); });
      row.querySelector('.eraDel').addEventListener('click', () => {
        if (tl.eras.length <= 1) { alert(t('minOneEra')); return; }
        if (!confirm(t('confirmDeleteEra', x.name))) return;
        pushUndo(); tl.eras = tl.eras.filter(q => q !== x); afterEdit(true);
      });
    });
    const de = $('#eraDescIn');
    if (de) { let p = false; de.addEventListener('input', ev => { if (!p) { pushUndo(); p = true; } cur.desc = ev.target.value; renderYear(); saveSoon(); }); }
    $('#facAdd').addEventListener('click', () => {
      pushUndo();
      const f = { id: uid('f'), name: t('newFaction'), color: hslHex(Math.floor(Math.random() * 360), 70, state.theme === 'fantasy' ? 40 : 55), reach: 120 };
      tl.factions.push(f); state.activeFaction = f.id; afterEdit(true);
      setTimeout(() => { const inp = document.querySelector(`#facList [data-id="${f.id}"] .facName`); if (inp) { inp.focus(); inp.select(); } }, 0);
    });
    $$('#facList .list-item').forEach(row => {
      const f = facById(row.dataset.id);
      row.addEventListener('click', ev => { if (ev.target.tagName === 'BUTTON' || ev.target.type === 'color') return; state.activeFaction = f.id; $$('#facList .list-item').forEach(r => r.classList.toggle('cur', r === row)); $('#activeFac').value = f.id; draw(); });
      row.querySelector('.facColor').addEventListener('input', ev => { f.color = ev.target.value; renderFactionFilter(); saveSoon(); draw(); });
      row.querySelector('.facName').addEventListener('change', ev => { pushUndo(); f.name = ev.target.value || t('withoutName'); renderFactionFilter(); renderInfo(); saveSoon(); renderEditor(); });
      row.querySelector('.facReach').addEventListener('change', ev => { pushUndo(); f.reach = Math.max(10, +ev.target.value || 120); saveSoon(); draw(); });
      row.querySelector('.facDel').addEventListener('click', () => {
        if (!confirm(t('confirmDeleteFaction', f.name))) return;
        pushUndo(); tl.factions = tl.factions.filter(x => x.id !== f.id);
        for (const x of tl.eras) {
          for (const k in x.control) if (x.control[k] === f.id) delete x.control[k];
          for (const k in (x.regionClaims || {})) if (x.regionClaims[k] === f.id) delete x.regionClaims[k];
          x.zones = (x.zones || []).filter(z => z.faction !== f.id);
        }
        afterEdit(true);
      });
    });
    $('#activeFac').addEventListener('change', ev => { state.activeFaction = ev.target.value || null; $$('#facList .list-item').forEach(r => r.classList.toggle('cur', r.dataset.id === state.activeFaction)); draw(); });
    $$('[data-tool]').forEach(b => b.addEventListener('click', () => { state.tool = b.dataset.tool; if (state.tool !== 'route') state.routeDraft = null; renderEditor(); updateToolHint(); draw(); }));
    $$('#routeList .list-item').forEach(row => {
      const r = tl.routes.find(x => x.id === row.dataset.id);
      row.querySelector('.routeName').addEventListener('change', ev => { pushUndo(); r.name = ev.target.value; saveSoon(); draw(); });
      row.querySelector('.routeKind').addEventListener('change', ev => { pushUndo(); r.kind = ev.target.value; saveSoon(); draw(); });
      row.querySelector('.routeDel').addEventListener('click', () => { pushUndo(); tl.routes = tl.routes.filter(x => x !== r); afterEdit(true); });
    });
    renderToolOpts();
  }
  function renderToolOpts() {
    const box = $('#toolOpts'); if (!box) return;
    if (state.tool === 'paint' || state.tool === 'erase') {
      box.innerHTML = `<label class="field" style="margin-top:8px"><span>${esc(t('brushSize'))}: <b id="brushVal">${state.brush}</b></span><input type="range" id="brush" min="20" max="400" step="5" value="${state.brush}"></label>`;
      $('#brush').addEventListener('input', e => { state.brush = +e.target.value; $('#brushVal').textContent = state.brush; draw(); });
    } else if (state.tool === 'add') {
      if (!wtype().types.includes(state.newType)) state.newType = wtype().types[1] || wtype().types[0];
      box.innerHTML = `
        <div class="row" style="margin-top:8px">
          <label class="field fixed" style="width:120px"><span>${esc(t('type'))}</span><select id="newType">${wtype().types.map(k => `<option value="${k}" ${k === state.newType ? 'selected' : ''}>${esc(typeLabel(k))}</option>`).join('')}</select></label>
          <label class="field"><span>${esc(t('name'))}</span><input id="newName" placeholder="${esc(t('optional'))}" value="${esc(state.newName)}"></label>
        </div>
        ${state.world.type === 'scifi' ? `<label class="chk"><input type="checkbox" id="attach" ${state.attach ? 'checked' : ''}>${esc(t('attach'))}</label>` : ''}`;
      $('#newType').addEventListener('change', e => state.newType = e.target.value);
      $('#newName').addEventListener('input', e => state.newName = e.target.value);
      const at = $('#attach'); if (at) at.addEventListener('change', e => state.attach = e.target.checked);
    } else if (state.tool === 'route') {
      const n = state.routeDraft ? state.routeDraft.length : 0;
      box.innerHTML = `<p class="hint">${esc(t('routePoints', n))}</p>
        <div class="row"><button id="routeFinish" class="primary" ${n < 2 ? 'disabled' : ''}>${esc(t('routeFinish'))}</button><button id="routeCancel">${esc(t('routeCancel'))}</button></div>`;
      $('#routeFinish').addEventListener('click', finishRoute);
      $('#routeCancel').addEventListener('click', () => { state.routeDraft = null; renderEditor(); draw(); });
    } else box.innerHTML = '';
  }
  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
    return '#' + f(0) + f(8) + f(4);
  }

  // ------------------------------------------------------------- Kopfzeile, Welten, Zeitlinien
  function renderTopbar() {
    $('#worldSelect').innerHTML = state.worlds.map(w => `<option value="${esc(w.id)}" ${w === state.world ? 'selected' : ''}>${esc(worldName(w))}${w.builtin ? ' ★' : ''}</option>`).join('');
    $('#tlSelect').innerHTML = timelinesOfWorld().map(x => `<option value="${esc(x.id)}" ${x === state.tl ? 'selected' : ''}>${esc(x.name)}${x.readonly ? ' 🔒' : ''}</option>`).join('');
    $('#btnDelTl').disabled = !!state.tl.readonly;
    $('#tabView').classList.toggle('active', state.mode === 'view');
    $('#tabEdit').classList.toggle('active', state.mode === 'edit');
    $('#tabSettings').classList.toggle('active', state.mode === 'settings');
    $('#tabStory').classList.toggle('active', state.mode === 'story');
    $('#tabChars').classList.toggle('active', state.mode === 'chars');
    $$('#langSwitch button').forEach(b => { b.classList.toggle('active', b.dataset.l === settings.lang); b.title = window.I18N.langs[b.dataset.l]; });
    const guest = isGuest(), si = srvInfo();
    for (const id of ['#tabEdit', '#tabSettings']) $(id).hidden = guest;
    $('#btnNewWorld').hidden = !isAdminUser() || guest;
    for (const id of ['#btnNewTl', '#btnDupTl', '#btnImport']) $(id).hidden = !canCreate();
    $('#btnDelTl').hidden = guest; $('#btnDelTl').disabled = !canEditTl();
    $('#btnJson').hidden = !canEditTl();
    $('#btnFolder').hidden = guest || !isAdminUser();
    $('#btnLogin').hidden = !guest;
    const bu = $('#btnUser'); bu.hidden = !(si && si.loginRequired && si.user); if (!bu.hidden) bu.textContent = '👤 ' + si.user.name;
    $('#btnTools').classList.toggle('active', !$('#tlTools').hidden);
    $('#btnLogin').textContent = '🔒 ' + t('login');
  }
  function loginDialog() {
    modal(t('loginTitle'), `
      <p class="hint" style="margin-top:0">${esc(t('loginHint'))}</p>
      <label class="field"><span>${esc(t('user'))}</span><input id="mUser" autocomplete="username"></label>
      <label class="field"><span>${esc(t('password'))}</span><input id="mPass" type="password" autocomplete="current-password"></label>
      <div id="mLoginErr" class="hint warn"></div>`,
      () => {
        FS.login($('#mUser').value.trim(), $('#mPass').value)
          .then(() => location.reload())
          .catch(e => { $('#modal').hidden = false; $('#mLoginErr').textContent = e.message || t('loginFailed'); });
        return false;
      }, { ok: t('login') });
    setTimeout(() => $('#mUser').focus(), 0);
  }
  $('#btnLogin').addEventListener('click', loginDialog);
  $('#btnUser').addEventListener('click', () => {
    const si = srvInfo();
    modal(t('account'), `<p>${esc(t('loggedInAs', si.user.name))}${si.user.admin ? ' · Admin' : ''}</p>`, () => { FS.logout().then(() => location.reload()); }, { ok: t('logout') });
  });
  $('#btnTools').addEventListener('click', () => { $('#tlTools').hidden = !$('#tlTools').hidden; $('#btnTools').classList.toggle('active', !$('#tlTools').hidden); });
  $$('#langSwitch button').forEach(b => b.addEventListener('click', () => { if (b.dataset.l !== settings.lang) setLang(b.dataset.l); }));
  $('#worldSelect').addEventListener('change', e => switchWorld(e.target.value));
  $('#tlSelect').addEventListener('change', e => selectTimeline(e.target.value));
  $('#btnNewWorld').addEventListener('click', () => {
    modal(t('newWorldTitle'), `
      <label class="field"><span>${esc(t('worldName'))}</span><input id="mWName" value="${esc(t('myWorld'))}"></label>
      <span class="dim">${esc(t('worldType'))}</span>
      <label class="radio"><input type="radio" name="mWType" value="scifi" checked><span>${esc(t('typeScifi'))}</span></label>
      <label class="radio"><input type="radio" name="mWType" value="fantasy"><span>${esc(t('typeFantasy'))}</span></label>`,
      () => {
        const type = document.querySelector('input[name=mWType]:checked').value;
        const w = normalizeWorld({ id: uid('w'), name: $('#mWName').value.trim() || t('myWorld'), type, yearFmt: { neg: '', pos: '' } });
        state.worlds.push(w);
        state.world = w;
        const tl = emptyTimeline(t('mainTimeline')); state.timelines.push(tl);
        settings.activeTl[w.id] = tl.id;
        state.mode = 'edit';
        switchWorld(w.id); saveSoon(); toast(t('worldCreated', w.name));
      });
    setTimeout(() => { $('#mWName').focus(); $('#mWName').select(); }, 0);
  });
  function duplicateTimeline() {
    const copy = clone(state.tl); copy.id = uid('tl'); copy.readonly = false; delete copy._file;
    copy.name = state.tl.readonly ? t('myTimeline') : state.tl.name + ' (2)';
    state.timelines.push(copy); state.tl = copy; state.mode = 'edit';
    renderAll(true); saveSoon(); toast(t('copyCreated'));
  }
  function newTimelineDialog() {
    const sw = isSW();
    modal(t('newTlTitle'), `
      <label class="field"><span>${esc(t('name'))}</span><input id="mTlName" value="${esc(t('myTimeline'))}"></label>
      ${sw ? `<label class="radio"><input type="radio" name="mStart" value="objects" checked><span><b>${esc(t('startWithObjects'))}</b><br><span class="dim">${esc(t('startWithObjectsDesc'))}</span></span></label>` : ''}
      <label class="radio"><input type="radio" name="mStart" value="copy" ${sw ? '' : 'checked'}><span><b>${esc(t('startCopy'))}</b><br><span class="dim">${esc(t('startCopyDesc'))}</span></span></label>
      <label class="radio"><input type="radio" name="mStart" value="empty"><span><b>${esc(t('startEmpty'))}</b><br><span class="dim">${esc(t('startEmptyDesc'))}</span></span></label>`,
      () => {
        const name = $('#mTlName').value.trim() || t('myTimeline'), mode = document.querySelector('input[name=mStart]:checked').value;
        let tl;
        if (mode === 'copy') tl = clone(state.tl);
        else { tl = emptyTimeline(name); if (mode === 'objects') { const c = SW.canonTimeline(settings.lang); tl.objects = c.objects; tl.routes = c.routes; } }
        tl.id = uid('tl'); tl.name = name; tl.readonly = false; tl.world = state.world.id; delete tl._file;
        state.timelines.push(tl); state.tl = tl; state.mode = 'edit'; renderAll(true); saveSoon();
      });
    setTimeout(() => { $('#mTlName').focus(); $('#mTlName').select(); }, 0);
  }
  $('#btnNewTl').addEventListener('click', newTimelineDialog);
  $('#btnFile').addEventListener('click', e => { e.stopPropagation(); $('#fileMenu').hidden = !$('#fileMenu').hidden; });
  document.addEventListener('click', () => { $('#fileMenu').hidden = true; });
  $('#btnDupTl').addEventListener('click', duplicateTimeline);
  $('#btnDelTl').addEventListener('click', () => {
    if (state.tl.readonly || !confirm(t('confirmDeleteTl', state.tl.name))) return;
    removeTimelineFile(state.tl);
    state.timelines = state.timelines.filter(x => x !== state.tl);
    if (!timelinesOfWorld().length) state.timelines.push(emptyTimeline(t('mainTimeline')));
    state.tl = timelinesOfWorld()[0]; state.selected = null; state.undo = []; renderAll(true); saveSoon();
  });
  function removeTimelineFile(tl) { if (FS && tl._file) { lastWritten['timelines/' + tl._file] = null; FS.remove('timelines', tl._file).catch(() => { }); } }

  // ------------------------------------------------------------- Export / Import / JSON
  function download(name, text, mime) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const GJ = 15;
  const GC = () => state.world.type === 'fantasy' ? { x: FANTASY_SIZE.w / 2, y: FANTASY_SIZE.h / 2 } : GEO.center;
  const toGJ = (x, y) => [+((x - GC().x) / GJ).toFixed(4), +((GC().y - y) / GJ).toFixed(4)];
  const fromGJ = ([lon, lat]) => [Math.round(GC().x + lon * GJ), Math.round(GC().y - lat * GJ)];
  function toGeoJSON(tl) {
    const features = [];
    for (const o of tl.objects) features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: toGJ(o.x, o.y) },
      properties: { kind: 'object', id: o.id, name: o.name, type: o.type, region: o.region || null, sector: o.sector || null, parent: o.parent || null, from: o.from ?? null, to: o.to ?? null, desc: o.desc || '', biome: o.biome || null, facts: o.facts || null } });
    for (const r of tl.routes || []) {
      const coords = r.points.map(id => tl.objects.find(o => o.id === id)).filter(Boolean).map(o => toGJ(o.x, o.y));
      if (coords.length > 1) features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { kind: 'route', id: r.id, name: r.name, routeKind: r.kind, points: r.points } });
    }
    for (const e of tl.eras) for (const z of (e.zones || [])) {
      const f = tl.factions.find(x => x.id === z.faction);
      const props = { kind: 'zone', era: e.id, eraName: e.name, faction: z.faction, factionName: f ? f.name : '', fill: f ? f.color : '#888', 'fill-opacity': 0.3, stroke: f ? f.color : '#888' };
      if (Array.isArray(z.poly) && z.poly.length > 2) { const ring = z.poly.map(([x, y]) => toGJ(x, y)); ring.push(ring[0]); features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: props }); }
      else features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: toGJ(z.x, z.y) }, properties: Object.assign(props, { radius: +(z.r / GJ).toFixed(3) }) });
    }
    return { type: 'FeatureCollection',
      iam: { format: 'interactivemap-geojson', version: 2, world: tl.world, name: tl.name, factions: tl.factions,
        eras: tl.eras.map(e => ({ id: e.id, name: e.name, year: e.year, desc: e.desc || '', control: e.control, regionClaims: e.regionClaims || {} })) },
      features };
  }
  function fromGeoJSON(g) {
    const meta = g.iam || g.swgm || {};
    const tl = { id: uid('tl'), world: meta.world || state.world.id, name: meta.name || 'GeoJSON', factions: meta.factions || [], objects: [], routes: [], eras: [] };
    tl.eras = (meta.eras || []).map(e => ({ id: e.id || uid('era'), name: e.name || 'Era', year: +e.year || 0, desc: e.desc || '', control: e.control || {}, regionClaims: e.regionClaims || {}, zones: [] }));
    if (!tl.eras.length) tl.eras.push({ id: uid('era'), name: t('eraN', 1), year: 0, desc: '', control: {}, regionClaims: {}, zones: [] });
    for (const ft of g.features || []) {
      const p = ft.properties || {}, geo = ft.geometry || {}, kind = p.kind || (geo.type === 'Point' ? 'object' : geo.type === 'LineString' ? 'route' : 'zone');
      if (kind === 'object' && geo.type === 'Point') {
        const [x, y] = fromGJ(geo.coordinates);
        tl.objects.push({ id: p.id || uid('o'), name: p.name || '?', type: p.type || 'planet', x, y, region: p.region || null, sector: p.sector || null, parent: p.parent || null, from: p.from ?? null, to: p.to ?? null, desc: p.desc || '', biome: p.biome || null, facts: p.facts || undefined });
      } else if (kind === 'route' && geo.type === 'LineString') {
        tl.routes.push({ id: p.id || uid('r'), name: p.name || t('newRoute'), kind: p.routeKind || 'minor', points: Array.isArray(p.points) ? p.points : [] });
      } else if (kind === 'zone') {
        const e = tl.eras.find(x => x.id === p.era) || tl.eras.find(x => x.name === p.eraName) || tl.eras[0];
        let fid = p.faction;
        if (!tl.factions.some(f => f.id === fid)) {
          const byName = p.factionName && tl.factions.find(f => f.name === p.factionName);
          if (byName) fid = byName.id; else { fid = uid('f'); tl.factions.push({ id: fid, name: p.factionName || 'Faction ' + (tl.factions.length + 1), color: p.fill || '#888888', reach: 120 }); }
        }
        if (geo.type === 'Polygon' || geo.type === 'MultiPolygon') {
          for (const poly of geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates) { const ring = (poly[0] || []).map(fromGJ); if (ring.length > 3) e.zones.push({ id: uid('z'), faction: fid, poly: ring.slice(0, -1) }); }
        } else if (geo.type === 'Point') { const [x, y] = fromGJ(geo.coordinates); e.zones.push({ id: uid('z'), faction: fid, x, y, r: Math.round((+p.radius || 6) * GJ) }); }
      }
    }
    return tl;
  }
  $('#btnExport').addEventListener('click', () => {
    modal(t('exportTitle'), `
      <label class="radio"><input type="radio" name="mExp" value="json" checked><span><b>JSON</b> (.iam.json)<br><span class="dim">${esc(t('exportJson'))}</span></span></label>
      <label class="radio"><input type="radio" name="mExp" value="geojson"><span><b>GeoJSON</b> (.geojson)<br><span class="dim">${esc(t('exportGeo'))}</span></span></label>`,
      () => {
        const fmt = document.querySelector('input[name=mExp]:checked').value, base = slugify(state.tl.name);
        if (fmt === 'json') download(base + '.iam.json', serialize(state.tl), 'application/json');
        else download(base + '.geojson', JSON.stringify(toGeoJSON(state.tl), null, 2), 'application/geo+json');
      });
  });
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    try {
      const tl = parseTimeline(await file.text());
      tl.id = uid('tl'); delete tl._file;
      if (tl.world !== state.world.id) { if (!state.worlds.some(w => w.id === tl.world)) { tl.world = state.world.id; toast(t('importWrongWorld')); } }
      if (state.timelines.some(x => x.name === tl.name && x.world === tl.world)) tl.name += ' (Import)';
      state.timelines.push(tl);
      if (tl.world !== state.world.id) { settings.activeTl[tl.world] = tl.id; switchWorld(tl.world); } else { state.tl = tl; fitTrack(); renderAll(true); }
      saveSoon(); toast(t('imported', tl.name));
    } catch (err) { alert(t('importFailed', err.message)); }
  });
  $('#btnJson').addEventListener('click', () => {
    if (state.tl.readonly) { alert(t('jsonReadonly')); return; }
    modal(t('jsonTitle', state.tl.name), `<p class="hint" style="margin-top:0">${esc(t('jsonHint'))}</p><textarea id="jsonText" spellcheck="false"></textarea><div id="jsonErr" class="hint warn"></div>`,
      () => {
        let tl; try { tl = parseTimeline($('#jsonText').value); } catch (err) { $('#jsonErr').textContent = t('error') + ': ' + err.message; return false; }
        pushUndo(); const i = state.timelines.indexOf(state.tl);
        tl.id = state.tl.id; tl._file = state.tl._file; tl.world = state.world.id;
        state.timelines[i] = tl; state.tl = tl; renderAll(true); saveSoon(); toast(t('jsonApplied'));
      }, { wide: true, ok: t('apply') });
    $('#jsonText').value = serialize(state.tl);
  });
  $('#btnFolder').addEventListener('click', () => {
    if (!FS) { alert(t('folderOnlyApp')); return; }
    if (state.tl.readonly) FS.openFolder('timelines', null); else { saveSoon(); setTimeout(() => FS.openFolder('timelines', fileFor(state.tl, state.timelines.filter(x => !x.readonly))), 400); }
  });

  // ------------------------------------------------------------- Modus & Einstellungen
  function setMode(m) {
    if (m !== 'view' && m !== 'story' && m !== 'chars' && isGuest()) { loginDialog(); return; }
    state.mode = m;
    if (isMobile()) setSheet(m === 'edit' || m === 'story' || m === 'chars');
    $('#settingsView').hidden = m !== 'settings';
    if (m === 'settings') renderSettings();
    renderAll(true);
    renderUpdStatus();
  }
  $('#tabView').addEventListener('click', () => setMode('view'));
  $('#tabEdit').addEventListener('click', () => setMode('edit'));
  $('#tabStory').addEventListener('click', () => setMode(state.mode === 'story' ? 'view' : 'story'));
  $('#tabChars').addEventListener('click', () => setMode(state.mode === 'chars' ? 'view' : 'chars'));
  $('#eraDesc').addEventListener('click', () => setMode('story'));
  $('#eraName').addEventListener('click', () => setMode('story'));
  $('#tabSettings').addEventListener('click', () => setMode(state.mode === 'settings' ? 'view' : 'settings'));

  function renderSettings() {
    const v = $('#settingsView'), w = state.world, info = state.appInfo;
    const tlCount = timelinesOfWorld(w).filter(x => !x.readonly).length;
    v.innerHTML = `<div class="settings-inner">
      <div class="settings-head"><h2>${esc(t('settings'))}</h2><button id="setBack">${esc(t('back'))}</button></div>
      <section class="card"><h3>${esc(t('theme'))}</h3>
        <div class="seg">${['auto', 'scifi', 'fantasy'].map(k => `<button data-theme="${k}" class="${settings.theme === k ? 'active' : ''}">${esc(t(k === 'auto' ? 'themeAuto' : k === 'scifi' ? 'themeScifi' : 'themeFantasy'))}</button>`).join('')}</div>
        ${isSW() ? `<h4>${esc(t('mapStyle'))}</h4><div class="seg">${['atlas', 'classic'].map(k => `<button data-mapstyle="${k}" class="${(settings.mapStyle || 'atlas') === k ? 'active' : ''}">${esc(t(k === 'atlas' ? 'mapAtlas' : 'mapClassic'))}</button>`).join('')}</div>` : ''}</section>
      ${window.iamDesktop ? `<section class="card"><h3>☁ ${esc(t('srvTitle'))}</h3>
        ${FS && FS.server ? `<p>${esc(t('srvConnected', location.origin))}</p><button id="srvOff">${esc(t('srvDisconnect'))}</button>`
          : `<p class="hint">${esc(t('srvHint'))}</p><div class="row"><input id="srvUrl" placeholder="https://map.example.com"><button id="srvOn" class="fixed primary">${esc(t('srvConnect'))}</button></div>`}
      </section>` : ''}
      <section class="card"><h3>${esc(t('terrStyle'))}</h3>
        <div class="seg">${['borders', 'bubbles'].map(k => `<button data-terr="${k}" class="${settings.terrStyle === k ? 'active' : ''}">${esc(t(k === 'borders' ? 'terrBorders' : 'terrBubbles'))}</button>`).join('')}</div></section>
      ${isAdminUser() ? `<section class="card"><h3>${esc(t('updates'))}</h3>
        <div class="kv"><span class="k">${esc(t('currentVersion'))}</span><span><b>${esc(info.version)}</b></span></div>
        ${FS && FS.server && !FS.desktop ? (info.updateAvailable ? `<p class="warn"><b>${esc(t('updDockerNew', info.latest))}</b></p>` : '') + `<p class="hint">${esc(t('updDocker'))}</p>` : `<label class="chk"><input type="checkbox" id="setAuto" ${settings.autoUpdate ? 'checked' : ''}>${esc(t('autoCheck'))}</label>
        <div class="row" style="margin-top:8px"><button id="setCheck" class="fixed">${esc(t('checkNow'))}</button><span id="setUpdStatus" class="dim"></span></div>`}
        <p class="hint"><a href="#" id="setReleases">${esc(t('releases'))}</a></p></section>` : ''}
      ${FS && FS.server && srvInfo().loginRequired && isAdminUser() ? `<section class="card" id="usersCard"><h3>👥 ${esc(t('users'))}</h3><div id="usersBox" class="hint">…</div></section>` : ''}
      <section class="card"><h3>${esc(t('worldSettings'))}: ${esc(worldName(w))}</h3>
        ${w.builtin ? `<p class="hint">${esc(t('builtinWorld'))}</p>${isSW() && SW.atlasCount ? `<h4>🗺 ${esc(t('atlasTitle'))}</h4><p class="hint">${esc(t('atlasInfo', SW.atlasCount.toLocaleString()))}</p>
          ${canEditTl() ? `<p class="hint">${esc(t('atlasSyncHint'))}</p><button id="setAtlasSync">${esc(t('atlasSync'))}: ${esc(state.tl.name)}</button>` : ''}` : ''}` : !isAdminUser() ? `<p class="hint">${esc(t('adminOnly'))}</p>` : `
        <label class="field"><span>${esc(t('worldName'))}</span><input id="setWName" value="${esc(w.name)}"></label>
        <div class="row">
          <label class="field"><span>${esc(t('yearSuffixNeg'))}</span><input id="setNeg" value="${esc(w.yearFmt.neg)}"></label>
          <label class="field"><span>${esc(t('yearSuffixPos'))}</span><input id="setPos" value="${esc(w.yearFmt.pos)}"></label>
        </div><p class="hint">${esc(t('yearSuffixHint'))}</p>
        <button id="setDelWorld" class="danger">${esc(t('deleteWorld'))}</button>`}
      </section>
      ${FS && FS.server && isAdminUser() ? `<section class="card"><h3>${esc(t('apiTitle'))}</h3><p class="hint">${esc(t('apiHint'))}</p>
        <code class="path">${esc(location.origin + location.pathname.replace(/index\.html$/, '') + 'api/v1/summary?year=' + state.year + (state.tl.readonly ? '' : '&timeline=' + encodeURIComponent(state.tl.name)) + '&lang=' + settings.lang)}</code>
        <a href="api/v1" target="_blank">api/v1</a>
        <h4>${esc(t('mcpTitle'))}</h4><p class="hint">${esc(t('mcpHint'))}</p>
        <code class="path">${esc(location.origin + location.pathname.replace(/index\.html$/, '') + 'mcp/<IAM_API_TOKEN>')}</code>
        <p class="hint">${esc(t('mcpRead'))}: <code>${esc(location.origin + location.pathname.replace(/index\.html$/, '') + 'mcp')}</code></p></section>` : ''}
      ${isAdminUser() ? `<section class="card"><h3>${esc(t('dataFolder'))}</h3>
        <p class="hint">${esc(t('dataHint'))}</p>
        ${info.dataDir ? `<code class="path">${esc(info.dataDir)}</code>` : ''}
        <button id="setFolder">${esc(t('openFolder'))}</button></section>` : ''}
      ${FS && FS.server && FS.info().loginRequired ? `<section class="card"><h3>${esc(t('account'))}</h3><button id="setLogout">${esc(t('logout'))}</button></section>` : ''}
      <section class="card"><h3>${esc(t('about'))}</h3><p class="hint">Ascandir InteractiveMap ${esc(info.version)} – ${esc(t('aboutText'))}</p></section>
    </div>`;
    $('#setBack').addEventListener('click', () => setMode('view'));
    const lo = $('#setLogout'); if (lo) lo.addEventListener('click', () => FS.logout().then(() => location.reload()));
    const so = $('#srvOn'); if (so) so.onclick = async () => {
      const u = $('#srvUrl').value.trim(); if (!u) return;
      try { const r = await fetch(u.replace(/\/?$/, '/') + 'api/info'); const j = await r.json(); if (!j.server) throw new Error('kein InteractiveMap-Server'); }
      catch (e) { if (!confirm(t('srvCheckFailed', e.message))) return; }
      window.iamDesktop.setServer(u).catch(e => alert(e.message));
    };
    const sf = $('#srvOff'); if (sf) sf.onclick = () => { if (confirm(t('srvDisconnectQ'))) window.iamDesktop.setServer(null); };
    if (window.iamDesktop && !(FS && FS.server) && $('#srvUrl')) window.iamDesktop.getServer().then(u => {
      if (!u || !$('#srvUrl')) return;
      const card = $('#srvUrl').closest('.card');
      card.innerHTML = `<h3>☁ ${esc(t('srvTitle'))}</h3><p class="warn">${esc(t('srvOffline', u))}</p>
        <div class="row"><button id="srvRetry2" class="primary">${esc(t('srvRetry'))}</button><button id="srvOff2">${esc(t('srvDisconnect'))}</button></div>`;
      $('#srvRetry2').onclick = () => window.iamDesktop.setServer(u);
      $('#srvOff2').onclick = () => window.iamDesktop.setServer(null);
    });
    $$('.seg [data-mapstyle]').forEach(b => b.addEventListener('click', () => { settings.mapStyle = b.dataset.mapstyle; saveSoon(); renderSettings(); draw(); }));
    const asy = $('#setAtlasSync'); if (asy) asy.addEventListener('click', atlasSync);
    $$('.seg [data-terr]').forEach(b => b.addEventListener('click', () => { settings.terrStyle = b.dataset.terr; saveSoon(); renderSettings(); draw(); }));
    $$('.seg [data-theme]').forEach(b => b.addEventListener('click', () => { settings.theme = b.dataset.theme; applyTheme(); saveSoon(); renderSettings(); renderAll(true); }));
    if ($('#usersBox')) renderUsers();
    if ($('#setAuto')) { $('#setAuto').addEventListener('change', e => { settings.autoUpdate = e.target.checked; saveSoon(); }); $('#setCheck').addEventListener('click', () => checkUpdates(true)); }
    const rl = $('#setReleases'); if (rl) rl.addEventListener('click', e => { e.preventDefault(); window.open(APP_REPO, '_blank'); });
    const fo = $('#setFolder'); if (fo) fo.addEventListener('click', () => FS ? FS.openFolder('', null) : alert(t('folderOnlyApp')));
    if (!w.builtin && $('#setWName')) {
      $('#setWName').addEventListener('change', e => { w.name = e.target.value.trim() || t('myWorld'); renderTopbar(); saveSoon(); });
      $('#setNeg').addEventListener('change', e => { w.yearFmt.neg = e.target.value.trim(); renderAll(true); saveSoon(); });
      $('#setPos').addEventListener('change', e => { w.yearFmt.pos = e.target.value.trim(); renderAll(true); saveSoon(); });
      $('#setDelWorld').addEventListener('click', () => {
        if (!confirm(t('confirmDeleteWorld', w.name, tlCount))) return;
        for (const tl of timelinesOfWorld(w)) removeTimelineFile(tl);
        state.timelines = state.timelines.filter(x => x.world !== w.id);
        state.worlds = state.worlds.filter(x => x !== w);
        if (FS && w._file) { lastWritten['worlds/' + w._file] = null; FS.remove('worlds', w._file).catch(() => { }); }
        switchWorld('starwars'); setMode('settings'); saveSoon();
      });
    }
    renderUpdStatus();
  }
  // Ältere Star-Wars-Zeitlinien auf die offiziellen Rasterfelder umstellen (mit Sicherungskopie)
  function atlasSync() {
    const tl = state.tl; if (!isSW() || !canEditTl(tl)) return;
    const canon = SW.canonTimeline(settings.lang), cm = Object.fromEntries(canon.objects.map(o => [o.id, o]));
    const byId = Object.fromEntries(tl.objects.map(o => [o.id, o]));
    const plan = [];
    for (const o of tl.objects) {
      if (o.parent && byId[o.parent]) continue;
      const c = cm[o.id]; if (!c || (c.parent && cm[c.parent])) continue;
      if (c.x !== o.x || c.y !== o.y || c.region !== o.region || (c.grid && c.grid !== o.grid)) plan.push([o, c]);
    }
    let zones = 0;
    for (const e of tl.eras) for (const z of e.zones || []) { const m = SW.moveZone(z); if (m.x !== z.x || m.y !== z.y) zones++; }
    if (!plan.length && !zones) { toast(t('atlasSyncNone')); return; }
    if (!confirm(t('atlasSyncQ', tl.name))) return;
    const copy = clone(tl); copy.id = uid('tl'); copy.readonly = false; delete copy._file; copy.name = tl.name + ' – ' + t('backupSuffix');
    state.timelines.push(copy);
    pushUndo();
    const kidsOf = id => tl.objects.filter(x => x.parent === id);
    for (const [o, c] of plan) {
      o.x = c.x; o.y = c.y; o.region = c.region; if (c.sector) o.sector = c.sector; if (c.grid) o.grid = c.grid;
      const stack = kidsOf(o.id); let n = 0;
      while (stack.length && n++ < 500) { const k = stack.pop(); k.x = c.x; k.y = c.y; k.region = c.region; if (c.sector && !k.sector) k.sector = c.sector; stack.push(...kidsOf(k.id)); }
    }
    for (const e of tl.eras) e.zones = (e.zones || []).map(z => SW.moveZone(z));
    editVersion++; terrCache.key = '';
    renderAll(true); saveSoon(); toast(t('atlasSynced', plan.length, zones, copy.name));
  }
  // ------------------------------------------------------------- Benutzerverwaltung (Server, nur Admins)
  const api = (path, method = 'GET', body) => fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
    .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText); return j; });
  async function renderUsers() {
    const box = $('#usersBox'); if (!box) return;
    let d; try { d = await api('api/users'); } catch (e) { box.textContent = e.message; return; }
    box.classList.remove('hint');
    box.innerHTML = `
      <div class="user-row"><b>${esc(d.env)}</b><span class="badge">Admin</span><span class="dim">${esc(t('envAdmin'))}</span></div>
      ${d.users.map(u => `<div class="user-row" data-id="${esc(u.id)}"><b>${esc(u.name)}</b><span class="badge">${u.role === 'admin' ? 'Admin' : esc(t('roleUser'))}</span>
        <span class="grow"></span>${u.role !== 'admin' ? `<button class="uPerm">${esc(t('perms'))}</button>` : ''}<button class="uRole">${esc(t(u.role === 'admin' ? 'makeUser' : 'makeAdmin'))}</button><button class="uPw">${esc(t('changePw'))}</button><button class="uDel danger">✕</button></div>`).join('')}
      <div class="user-row"><b>${esc(t('guests'))}</b><span class="dim">${esc(t('guestsDesc'))}</span><span class="grow"></span><button id="guestPerm">${esc(t('perms'))}</button></div>
      <h4>${esc(t('addUser'))}</h4>
      <div class="row"><input id="nuName" placeholder="${esc(t('user'))}"><input id="nuPw" type="password" placeholder="${esc(t('password'))}">
        <select id="nuRole" class="fixed"><option value="user">${esc(t('roleUser'))}</option><option value="admin">Admin</option></select><button id="nuAdd" class="fixed primary">＋</button></div>
      <p class="hint">${esc(t('usersHint'))}</p>`;
    const byId = id => d.users.find(u => u.id === id);
    box.querySelectorAll('.user-row[data-id]').forEach(row => {
      const u = byId(row.dataset.id);
      const pb = row.querySelector('.uPerm'); if (pb) pb.onclick = () => permsDialog(u.name, u.perms, perms => api('api/users/' + u.id, 'PUT', { perms }).then(renderUsers));
      row.querySelector('.uRole').onclick = () => api('api/users/' + u.id, 'PUT', { role: u.role === 'admin' ? 'user' : 'admin' }).then(renderUsers).catch(e => alert(e.message));
      row.querySelector('.uPw').onclick = () => modal(t('changePw') + ': ' + u.name, `<label class="field"><span>${esc(t('newPw'))}</span><input id="mNewPw" type="password"></label><div id="mPwErr" class="hint warn"></div>`,
        () => { api('api/users/' + u.id, 'PUT', { password: $('#mNewPw').value }).then(() => { $('#modal').hidden = true; toast(t('saved')); }).catch(e => { $('#mPwErr').textContent = e.message; }); return false; });
      row.querySelector('.uDel').onclick = () => { if (confirm(t('deleteUserQ', u.name))) api('api/users/' + u.id, 'DELETE').then(renderUsers); };
    });
    $('#guestPerm').onclick = () => permsDialog(t('guests'), d.guest, perms => api('api/guest', 'PUT', perms).then(renderUsers));
    $('#nuAdd').onclick = () => api('api/users', 'POST', { name: $('#nuName').value, password: $('#nuPw').value, role: $('#nuRole').value, perms: { worlds: { '*': 'view' }, timelines: {} } })
      .then(u => { toast(t('saved')); renderUsers().then(() => { if (u.role !== 'admin') permsDialog(u.name, u.perms, perms => api('api/users/' + u.id, 'PUT', { perms }).then(renderUsers)); }); }).catch(e => alert(e.message));
  }
  function permsDialog(name, perms, onSave) {
    perms = JSON.parse(JSON.stringify(perms || { worlds: {}, timelines: {} })); perms.worlds ||= {}; perms.timelines ||= {};
    const opt = (val, cur, label) => `<option value="${val}" ${cur === val ? 'selected' : ''}>${esc(label)}</option>`;
    const sel = (kind, id, cur, allowEdit, inheritLabel) => `<select data-k="${kind}" data-id="${esc(id)}">
      ${inheritLabel ? opt('', cur ?? '', inheritLabel) : ''}${opt('none', cur, t('noAccess'))}${opt('view', cur, t('viewAccess'))}${allowEdit ? opt('edit', cur, t('editAccess')) : ''}</select>`;
    const rows = state.worlds.map(w => {
      const tls = state.timelines.filter(x => x.world === w.id);
      return `<tr class="pw"><td>🌐 <b>${esc(worldName(w))}</b></td><td>${sel('worlds', w.id, perms.worlds[w.id], true, t('inheritAll'))}</td></tr>` +
        tls.map(x => `<tr><td class="ind">${esc(x.name)}${x.readonly ? ' 🔒' : ''}</td><td>${sel('timelines', x.id, perms.timelines[x.id], !x.readonly, t('inheritWorld'))}</td></tr>`).join('');
    }).join('');
    modal(t('permsTitle', name), `<p class="hint" style="margin-top:0">${esc(t('permsHint'))}</p>
      <table class="perm-table"><tr class="pw"><td><b>${esc(t('allWorlds'))}</b></td><td>${sel('worlds', '*', perms.worlds['*'] || 'none', true, null)}</td></tr>${rows}</table>`,
      () => {
        const out = { worlds: {}, timelines: {} };
        $$('.perm-table select').forEach(s2 => { if (s2.value) out[s2.dataset.k][s2.dataset.id] = s2.value; });
        onSave(out).then(() => toast(t('saved'))).catch(e => alert(e.message));
      }, { wide: true, ok: t('apply') });
  }

  function setLang(l) {
    settings.lang = l; window.I18N.setLang(l); document.documentElement.lang = l;
    // Kanon-Zeitlinie in neuer Sprache erzeugen
    const i = state.timelines.findIndex(x => x.id === 'canon');
    const fresh = SW.canonTimeline(l);
    if (i >= 0) { const act = state.tl === state.timelines[i]; state.timelines[i] = fresh; if (act) state.tl = fresh; }
    applyStaticI18n(); saveSoon(); renderAll(true); if (state.mode === 'settings') renderSettings();
  }
  function applyStaticI18n() {
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $('#modalCancel').textContent = t('cancel');
  }

  // ------------------------------------------------------------- Updater
  function renderUpdStatus() {
    const u = state.upd, el = $('#setUpdStatus'), banner = $('#updBanner');
    let text = '', html = '';
    if (!u) text = '';
    else if (u.state === 'dev') text = t('updDev');
    else if (u.state === 'docker') text = t('updDocker');
    else if (u.state === 'dockerNew') { text = t('updDockerNew', u.version); html = `<b>${esc(text)}</b> <button id="updLater">${esc(t('updLater'))}</button>`; }
    else if (u.state === 'checking') text = t('updChecking');
    else if (u.state === 'none') text = t('updNone');
    else if (u.state === 'error') text = t('updError', u.message || '');
    else if (u.state === 'available') { text = t('updAvailable', u.version); html = `<b>${esc(text)}</b> <button id="updDl" class="primary">${esc(t('updDownload'))}</button> <button id="updLater">${esc(t('updLater'))}</button>`; }
    else if (u.state === 'progress') { text = t('updProgress', Math.round(u.percent || 0)); html = `${esc(text)}<div class="bar"><i style="width:${Math.round(u.percent || 0)}%"></i></div>`; }
    else if (u.state === 'downloaded') { text = t('updReady', u.version); html = `<b>${esc(text)}</b> <button id="updInst" class="primary">${esc(t('updInstall'))}</button>`; }
    // In den Einstellungen dieselben Knöpfe direkt anzeigen
    if (el) el.innerHTML = html ? html.replace(/ id="upd(Dl|Later|Inst)"/g, ' data-upd="$1"').replace(/<button data-upd="Later"[^>]*>[^<]*<\/button>/, '') : esc(text);
    if (html && !state.updDismissed && state.mode !== 'settings') { banner.innerHTML = html; banner.hidden = false; } else banner.hidden = true;
    const act = { Dl: () => FS && FS.updDownload(), Inst: () => FS && FS.updInstall(), Later: () => { state.updDismissed = true; renderUpdStatus(); } };
    for (const k of Object.keys(act)) {
      const b1 = $('#upd' + k); if (b1) b1.onclick = act[k];
      $$(`[data-upd="${k}"]`).forEach(b2 => { b2.onclick = act[k]; });
    }
  }
  function checkUpdates(manual) {
    if (!FS || !FS.updCheck) { state.upd = { state: 'dev' }; renderUpdStatus(); return; }
    if (manual) state.updDismissed = false;
    FS.updCheck().then(r => { if (r && r.state === 'dev') { state.upd = r; renderUpdStatus(); } }).catch(e => { state.upd = { state: 'error', message: e.message }; renderUpdStatus(); });
  }

  // ------------------------------------------------------------- Modal
  function modal(title, html, onOk, opt = {}) {
    $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html; $('#modal').hidden = false;
    $('#modal .modal-box').classList.toggle('wide', !!opt.wide);
    $('#modalOk').textContent = opt.ok || t('ok'); $('#modalCancel').textContent = t('cancel');
    const close = () => { $('#modal').hidden = true; $('#modalOk').onclick = $('#modalCancel').onclick = null; };
    $('#modalCancel').onclick = close;
    $('#modalOk').onclick = () => { let r; try { r = onOk(); } catch (e) { alert(e.message); } if (r !== false) close(); };
    $('#modalBody').onkeydown = e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') $('#modalOk').click(); };
  }

  // ------------------------------------------------------------- Mobilansicht
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
  function setSheet(open) { document.body.classList.toggle('sheet-open', !!open); }
  function setDrawer(open) { document.body.classList.toggle('drawer-open', !!open); $('#backdrop').hidden = !open; }
  $('#mobFilter').addEventListener('click', () => setDrawer(!document.body.classList.contains('drawer-open')));
  $('#backdrop').addEventListener('click', () => setDrawer(false));
  $('#mobPanel').addEventListener('click', () => setSheet(!document.body.classList.contains('sheet-open')));
  $('#mobPlanner').addEventListener('click', () => { state.plannerOpen = true; state.pick = null; renderPlanner(); setSheet(true); draw(); });
  $('#sheetClose').addEventListener('click', () => setSheet(false));
  window.matchMedia('(max-width: 900px)').addEventListener('change', () => { setSheet(false); setDrawer(false); setTimeout(resize, 50); });

  $('#zoomIn').addEventListener('click', () => zoomAt(W / 2, H / 2, 1.4));
  $('#zoomOut').addEventListener('click', () => zoomAt(W / 2, H / 2, 1 / 1.4));
  $('#zoomFit').addEventListener('click', fitView);

  // ------------------------------------------------------------- Gesamt-Render
  function afterEdit(full) { editVersion++; rebuildTree(); if (full) renderAll(true); else { renderFactionFilter(); renderInfo(); renderYear(); updateToolHint(); draw(); } saveSoon(); }
  let storyEditing = false, secEdit = null;
  const storyOf = (from, to) => (state.tl.story || []).filter(x => (from == null || x.year >= from) && (to == null || x.year <= to))
    .sort((a, b) => chapRank(a) - chapRank(b) || storySortFn(a, b));
  const chapRank = x => { const l = chapters(), i = l.findIndex(c => c.id === x.chapter); return i; };
  const storySortFn = (a, b) => a.year - b.year || (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.created || '').localeCompare(String(b.created || ''));
  const chapters = () => (state.tl.chapters ||= []).slice().sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
  let chapEdit = null;
  const chapClean = v => String(v || '').trim().replace(/^(kapitel|chapter)\s*\d+\s*[:.\-–]\s*/i, '').trim();
  // Abschnitt innerhalb desselben Jahres um eine Position verschieben
  function moveSection(id, dir) {
    const x = (state.tl.story || []).find(q => q.id === id); if (!x) return;
    const same = state.tl.story.filter(q => q.year === x.year && (q.chapter || '') === (x.chapter || '')).sort(storySortFn), i = same.indexOf(x), j = i + dir;
    if (j < 0 || j >= same.length) return;
    pushUndo(); same.splice(i, 1); same.splice(j, 0, x); same.forEach((q, n) => { q.order = n; }); afterEdit(); renderStory();
  }
  function renderStory() {
    const box = $('#story');
    const show = state.mode === 'story' && !state.plannerOpen;
    box.hidden = !show; if (state.mode === 'story' && !state.plannerOpen) $('#info').hidden = true;
    if (!show) { storyEditing = false; return; }
    const e = era(), eras = sortedEras(), can = canEditTl() && e;
    const end = e ? eraEnd(e) : null, all = settings.storyScope !== 'era', canS = canEditTl();
    const secs = all ? storyOf(null, null) : e ? storyOf(e.year, end) : storyOf(null, eras.length ? eras[0].year - 1 : null);
    const chs = chapters(), chIds = new Set(chs.map(c => c.id));
    const chapOpts = sel => `<option value="">${esc(t('chapNone'))}</option>${chs.map((c, i) => `<option value="${esc(c.id)}" ${c.id === sel ? 'selected' : ''}>${i + 1}. ${esc(c.title)}</option>`).join('')}`;
    const secForm = (x, chap) => `<div class="story-sec editing">
      <input id="secTitle" placeholder="${esc(t('storySecTitle'))}" value="${esc(x ? x.title : '')}">
      <div class="row"><label class="field"><span>${esc(t('storySecYear'))}</span><input id="secYear" value="${esc(fmtYear(x ? x.year : (secs.length ? secs[secs.length - 1].year : state.year)))}"></label>
        <label class="field"><span>${esc(t('chapter'))}</span><select id="secChap">${chapOpts(x ? x.chapter : chap)}</select></label></div>
      <label class="field"><span>${esc(t('storySecPlaces'))}</span><input id="secPlaces" value="${esc(x ? (x.places || []).join(', ') : '')}"></label>
      <textarea id="secText" class="story-edit" placeholder="${esc(t('storyFmt'))}">${esc(x ? x.text : '')}</textarea>
      <div class="row"><button id="secSave" class="primary">${esc(t('ok'))}</button><button id="secCancel">${esc(t('cancel'))}</button></div></div>`;
    const sameGrp = (q, x) => q !== x && q.year === x.year && (q.chapter || '') === (x.chapter || '');
    const secHtml = x => secEdit === x.id ? secForm(x) : `
        <article class="story-sec" data-sid="${esc(x.id)}">
          <div class="sec-head"><b>${esc(x.title)}</b><span class="y">${esc(fmtYear(x.year))}</span>
            ${canS ? `<span class="sec-btns"><button class="fixed sec-up" title="${esc(t('storyUp'))}" ${secs.some(q => sameGrp(q, x) && storySortFn(q, x) < 0) ? '' : 'disabled'}>↑</button><button class="fixed sec-dn" title="${esc(t('storyDown'))}" ${secs.some(q => sameGrp(q, x) && storySortFn(q, x) > 0) ? '' : 'disabled'}>↓</button><button class="fixed sec-ed" title="${esc(t('storyEdit'))}">✎</button><button class="fixed danger sec-del" title="${esc(t('delete'))}">✕</button></span>` : ''}</div>
          ${(x.places || []).length ? `<div class="dim sec-pl">📍 ${esc(x.places.join(', '))}</div>` : ''}
          <div class="story-text">${rich(x.text || '')}</div>
        </article>`;
    const addBtn = cid => secEdit === 'new:' + cid ? secForm(null, cid) : canS ? `<button class="sec-add" data-chap="${esc(cid)}">＋ ${esc(t('storyAddSection'))}</button>` : '';
    const loose = secs.filter(x => !x.chapter || !chIds.has(x.chapter));
    const blocks = [];
    if (loose.length || !chs.length) blocks.push(`${chs.length ? `<div class="chap-head none"><span class="chap-nr">${esc(t('chapNone'))}</span></div>` : ''}${loose.map(secHtml).join('')}${!chs.length ? addBtn('') : ''}`);
    chs.forEach((c, i) => {
      const items = secs.filter(x => x.chapter === c.id);
      const anyAt = (state.tl.story || []).some(x => x.chapter === c.id);
      if (!items.length && anyAt && !all) return; // Kapitel liegt komplett in einem anderen Zeitalter
      blocks.push(chapEdit === c.id ? `<div class="chap-edit" data-chid="${esc(c.id)}"><input id="chapTitle" value="${esc(c.title)}" placeholder="${esc(t('chapTitle'))}">
          <textarea id="chapSum" rows="3" placeholder="${esc(t('chapSummary'))}">${esc(c.summary || '')}</textarea>
          <div class="row"><button id="chapSave" class="primary">${esc(t('ok'))}</button><button id="chapCancel">${esc(t('cancel'))}</button><button id="chapDel" class="danger">${esc(t('delete'))}</button></div></div>`
        : `<div class="chap-head" data-chid="${esc(c.id)}"><span class="chap-nr">${esc(t('chapter'))} ${i + 1}</span><b>${esc(c.title)}</b>
          ${canS ? `<span class="chap-btns"><button class="fixed ch-up" ${i ? '' : 'disabled'}>↑</button><button class="fixed ch-dn" ${i < chs.length - 1 ? '' : 'disabled'}>↓</button><button class="fixed ch-ed">✎</button></span>` : ''}</div>
          ${c.summary ? `<div class="chap-sum">${rich(c.summary)}</div>` : ''}`);
      blocks.push(items.map(secHtml).join('') + (items.length ? '' : `<p class="hint">${esc(t('chapEmpty'))}</p>`) + addBtn(c.id));
    });
    box.innerHTML = `
      <div class="story-head">
        <div class="story-kicker">📖 ${esc(t('tabStory'))} · ${esc(state.tl.name)}</div>
        <h2>${esc(e ? e.name : t('noEra'))}</h2>
        ${e ? `<div class="story-years">${esc(fmtYear(e.year))}${end != null ? ' – ' + esc(fmtYear(end)) : ''} · ${esc(t('storyNow'))} ${esc(fmtYear(state.year))}</div>` : ''}
      </div>
      ${storyEditing ? `<textarea id="storyText" class="story-edit">${esc(e.desc || '')}</textarea>
        <div class="row"><button id="storySave" class="primary">${esc(t('ok'))}</button><button id="storyCancel">${esc(t('cancel'))}</button></div>
        <p class="hint">${esc(t('storyFmt'))}</p>`
      : `<div class="story-text">${e && e.desc ? rich(e.desc) : `<p class="hint">${esc(e ? t('storyEmpty') : t('beforeFirstEra'))}</p>`}</div>
        ${can ? `<button id="storyEditBtn">✎ ${esc(t('storyEdit'))}</button>` : ''}`}
      <div class="story-bar"><h3>${esc(t('storySections'))} <span class="dim">(${secs.length})</span></h3>
        <div class="seg small"><button data-scope="all" class="${all ? 'active' : ''}">${esc(t('storyAll'))}</button><button data-scope="era" class="${all ? '' : 'active'}">${esc(t('storyThisEra'))}</button></div></div>
      <div class="story-secs">${blocks.join('')}
        ${!secs.length && !chs.length ? `<p class="hint">${esc(t('storyNoSections'))}</p>` : ''}
        ${canS ? `<button id="chapAdd">＋ ${esc(t('chapAdd'))}</button>` : ''}</div>
      <h3 style="margin-top:18px">${esc(t('storyChapters'))}</h3>
      <ol class="story-chapters">${eras.map(x => { const n = storyOf(x.year, eraEnd(x)).length; return `<li data-id="${esc(x.id)}" class="${x === e ? 'cur' : ''}"><span class="y">${esc(fmtYear(x.year))}</span> ${esc(x.name)}${n ? ` <span class="dim">· ${n}</span>` : ''}</li>`; }).join('')}</ol>`;
    box.querySelectorAll('[data-scope]').forEach(b => b.onclick = () => { settings.storyScope = b.dataset.scope; saveSoon(); renderStory(); });
    box.querySelectorAll('.sec-add').forEach(b => b.onclick = () => { secEdit = 'new:' + b.dataset.chap; renderStory(); $('#secTitle').focus(); });
    const cid = el => el.closest('[data-chid]').dataset.chid;
    const reorderCh = (id, dir) => { const l = chapters(), i = l.findIndex(c => c.id === id), j = i + dir; if (j < 0 || j >= l.length) return; pushUndo(); const [c] = l.splice(i, 1); l.splice(j, 0, c); l.forEach((q, n) => { q.order = n; }); afterEdit(); renderStory(); };
    box.querySelectorAll('.ch-up').forEach(b => b.onclick = () => reorderCh(cid(b), -1));
    box.querySelectorAll('.ch-dn').forEach(b => b.onclick = () => reorderCh(cid(b), 1));
    box.querySelectorAll('.ch-ed').forEach(b => b.onclick = () => { chapEdit = cid(b); renderStory(); $('#chapTitle').focus(); });
    const ca = $('#chapAdd'); if (ca) ca.onclick = () => { const n = prompt(t('chapTitle')); if (!n || !n.trim()) return; pushUndo(); const l = chapters(); state.tl.chapters.push({ id: uid('kap'), title: chapClean(n), summary: '', order: l.length }); afterEdit(); renderStory(); };
    const cs = $('#chapSave'); if (cs) cs.onclick = () => { const c = state.tl.chapters.find(q => q.id === chapEdit); if (c) { pushUndo(); c.title = chapClean($('#chapTitle').value) || c.title; c.summary = $('#chapSum').value; } chapEdit = null; afterEdit(); renderStory(); };
    const cc = $('#chapCancel'); if (cc) cc.onclick = () => { chapEdit = null; renderStory(); };
    const cd = $('#chapDel'); if (cd) cd.onclick = () => { const c = state.tl.chapters.find(q => q.id === chapEdit); if (!c || !confirm(t('chapDelQ', c.title))) return; pushUndo(); state.tl.chapters = state.tl.chapters.filter(q => q !== c); for (const x of state.tl.story || []) if (x.chapter === c.id) x.chapter = ''; chapEdit = null; afterEdit(); renderStory(); };
    const sid = el => el.closest('[data-sid]').dataset.sid;
    box.querySelectorAll('.sec-ed').forEach(b => b.onclick = () => { secEdit = sid(b); renderStory(); });
    box.querySelectorAll('.sec-up').forEach(b => b.onclick = () => moveSection(sid(b), -1));
    box.querySelectorAll('.sec-dn').forEach(b => b.onclick = () => moveSection(sid(b), 1));
    box.querySelectorAll('.sec-del').forEach(b => b.onclick = () => { const x = (state.tl.story || []).find(q => q.id === sid(b)); if (!x || !confirm(t('storyDelQ', x.title))) return; pushUndo(); state.tl.story = state.tl.story.filter(q => q !== x); afterEdit(); renderStory(); });
    const ss = $('#secSave'); if (ss) ss.onclick = () => {
      const y = parseYear($('#secYear').value); const title = $('#secTitle').value.trim(), text = $('#secText').value;
      if (!title && !text.trim()) return;
      pushUndo(); const list = (state.tl.story ||= []), now = new Date().toISOString();
      let x = list.find(q => q.id === secEdit);
      if (!x) { x = { id: uid('st'), created: now, places: [] }; list.push(x); } else x.updated = now;
      const oldY = x.year, oldC = x.chapter || ''; x.title = title || t('storySection') + ' ' + list.length; x.text = text; x.year = y != null ? y : state.year;
      x.chapter = $('#secChap').value;
      if (oldY !== x.year || oldC !== x.chapter) x.order = Math.max(-1, ...list.filter(q => q !== x && q.year === x.year && (q.chapter || '') === (x.chapter || '')).map(q => q.order ?? -1)) + 1;
      x.places = $('#secPlaces').value.split(',').map(v => v.trim()).filter(Boolean);
      secEdit = null; afterEdit(); renderStory();
    };
    const sx = $('#secCancel'); if (sx) sx.onclick = () => { secEdit = null; renderStory(); };
    const eb = $('#storyEditBtn'); if (eb) eb.onclick = () => { storyEditing = true; renderStory(); $('#storyText').focus(); };
    const sv = $('#storySave'); if (sv) sv.onclick = () => { pushUndo(); e.desc = $('#storyText').value; storyEditing = false; afterEdit(); renderStory(); };
    const sc = $('#storyCancel'); if (sc) sc.onclick = () => { storyEditing = false; renderStory(); };
    box.querySelectorAll('.story-chapters li').forEach(li => li.onclick = () => { const x = state.tl.eras.find(q => q.id === li.dataset.id); if (x) { setYear(x.year); fitTrack(); } });
  }

  // ------------------------------------------------------------- Charaktere
  let charSel = null, charEdit = false, charQ = '', charGroupF = '', groupsEdit = false;
  const GROUP_COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4dd0e1', '#f06292', '#aed581', '#ffd54f', '#90a4ae'];
  const grpOf = c => c && c.group ? (state.tl.charGroups || []).find(g => g.id === c.group) : null;
  const grpTag = g => g ? `<span class="gtag" style="--gc:${esc(g.color)}">${esc(g.name)}</span>` : '';
  // Gliederung des Steckbriefs: [Abschnitt, kurze Felder, Textfelder]
  const CH_SECTIONS = [['secIdentity', ['species', 'age', 'gender', 'homeworld'], []], ['secLooks', [], ['appearance']], ['secPersonality', [], ['personality']],
    ['secBackground', [], ['bio']], ['secAffil', ['faction', 'title', 'organization', 'master'], []], ['secAbilities', [], ['abilities']],
    ['secRelations', [], []], ['secKnowledge', [], ['knowledge']], ['secCurrent', ['location', 'status'], ['threads']], ['secNotes', [], ['notes']]];
  const REL_KINDS = ['ally', 'enemy', 'family', 'contact', 'other'];
  const REL_COL = { ally: '#81c784', enemy: '#e57373', family: '#ffb74d', contact: '#64b5f6', other: '#90a4ae' };
  const charsAt = o => (state.tl.characters || []).filter(c => { const n = o.name.toLowerCase(); return (c.location || '').toLowerCase() === n || (c.homeworld || '').toLowerCase() === n; });
  function openChar(id) { charSel = id; charEdit = false; if (state.plannerOpen) state.plannerOpen = false; setMode('chars'); }
  const placeByName = n => { const q = String(n || '').toLowerCase().trim(); return q && (state.tl.objects.find(o => o.name.toLowerCase() === q) || (isSW() ? atlasObjs().find(o => o.name.toLowerCase() === q) : null)); };
  function charLink(name) { if (!name) return ''; const o = (state.tl.characters || []).find(x => x.name.toLowerCase() === String(name).toLowerCase()); return o ? `<a href="#" data-cid="${esc(o.id)}">${esc(name)}</a>` : esc(name); }
  function charImgBox(src, cls) { return src ? `<img class="${cls}" src="${esc(src)}" alt="" data-zoom="${esc(src)}">` : `<div class="${cls} ph">👤</div>`; }
  function zoomImg(src, cap) {
    const d = document.createElement('div'); d.className = 'lightbox';
    d.innerHTML = `<img src="${esc(src)}" alt="">${cap ? `<div class="cap">${esc(cap)}</div>` : ''}`; d.onclick = () => d.remove(); document.body.appendChild(d);
  }
  function resizeImage(file, max) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { const sc = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.86)); };
      img.onerror = () => rej(new Error(t('imgError'))); img.src = url;
    });
  }
  function renderChars(force) {
    const box = $('#chars'), show = state.mode === 'chars' && !state.plannerOpen;
    box.hidden = !show; if (show) $('#info').hidden = true;
    if (!show) { charEdit = false; return; }
    if (charEdit && $('#chForm') && !force) return; // Eingaben beim Bearbeiten nicht überschreiben
    const list = (state.tl.characters ||= []), can = canEditTl(), c = list.find(x => x.id === charSel);
    if (c && charEdit && can) return charForm(box, c);
    if (c) return charDetail(box, c, can);
    charSel = null;
    const q = charQ.toLowerCase(), groups = (state.tl.charGroups ||= []);
    const shown = list.filter(x => (!q || JSON.stringify([x.name, x.title, x.location, x.tags]).toLowerCase().includes(q)) && (!charGroupF || (charGroupF === '-' ? !grpOf(x) : x.group === charGroupF)))
      .sort((a, b) => a.name.localeCompare(b.name));
    const card = x => { const f = x.faction && facById(x.faction), g = grpOf(x); return `
        <div class="char-card" data-id="${esc(x.id)}" ${g ? `style="--gc:${esc(g.color)}"` : ''}>${charImgBox(x.image, 'thumb')}
          <div class="cc-main"><b>${esc(x.name)}</b> ${grpTag(g)}${x.title ? `<div class="dim">${esc(x.title)}</div>` : ''}
            <div class="dim small">${f ? `<span style="color:${esc(f.color)}">■</span> ${esc(f.name)}` : x.faction && !f ? esc(x.faction) : ''}${x.location ? ` · 📍 ${esc(x.location)}` : ''}${x.status ? ` · ${esc(x.status)}` : ''}</div></div></div>`; };
    const sections = groups.map(g => ({ g, items: shown.filter(x => x.group === g.id) })).filter(s => s.items.length);
    const rest = shown.filter(x => !grpOf(x));
    box.innerHTML = `
      <div class="story-kicker">👤 ${esc(t('tabChars'))} · ${esc(state.tl.name)}</div>
      <div class="row" style="margin:8px 0"><input id="chSearch" placeholder="${esc(t('charSearch'))}" value="${esc(charQ)}">${can ? `<button id="chNew" class="fixed primary" title="${esc(t('charNew'))}">＋</button>` : ''}</div>
      ${groups.length || can ? `<div class="gfilter"><button data-gf="" class="${!charGroupF ? 'active' : ''}">${esc(t('allG'))}</button>${groups.map(g => `<button data-gf="${esc(g.id)}" class="${charGroupF === g.id ? 'active' : ''}" style="--gc:${esc(g.color)}"><i></i>${esc(g.name)}</button>`).join('')}
        ${groups.length ? `<button data-gf="-" class="${charGroupF === '-' ? 'active' : ''}">${esc(t('charNoGroup'))}</button>` : ''}${can ? `<button id="grpEdit" title="${esc(t('charGroupsEdit'))}">⚙ ${esc(t('charGroups'))}</button>` : ''}</div>` : ''}
      ${groupsEdit && can ? `<div class="grp-edit">${groups.map(g => `<div class="row" data-gid="${esc(g.id)}"><input type="color" class="gcol fixed" value="${esc(g.color)}"><input class="gname" value="${esc(g.name)}"><button class="gdel2 fixed danger">✕</button></div>`).join('')}
        <div class="row"><button id="grpAdd">＋ ${esc(t('charGroupAdd'))}</button><button id="grpDone" class="fixed primary">${esc(t('ok'))}</button></div></div>` : ''}
      <div class="char-list">${shown.length ? sections.map(s => `<div class="grp-head" style="--gc:${esc(s.g.color)}"><i></i>${esc(s.g.name)} <span class="dim">${s.items.length}</span></div>${s.items.map(card).join('')}`).join('')
        + (rest.length ? (sections.length ? `<div class="grp-head"><i></i>${esc(t('charNoGroup'))} <span class="dim">${rest.length}</span></div>` : '') + rest.map(card).join('') : '')
        : `<p class="hint">${esc(list.length ? t('charNoMatch') : t('charEmpty'))}</p>`}</div>`;
    box.querySelectorAll('[data-gf]').forEach(b => b.onclick = () => { charGroupF = b.dataset.gf; renderChars(); });
    const ge = $('#grpEdit'); if (ge) ge.onclick = () => { groupsEdit = !groupsEdit; renderChars(); };
    const gd = $('#grpDone'); if (gd) gd.onclick = () => { groupsEdit = false; renderChars(); };
    const ga = $('#grpAdd'); if (ga) ga.onclick = () => { const n = prompt(t('charGroupName')); if (!n || !n.trim()) return; pushUndo(); groups.push({ id: uid('cg'), name: n.trim(), color: GROUP_COLORS[groups.length % GROUP_COLORS.length] }); afterEdit(); renderChars(); };
    box.querySelectorAll('.grp-edit [data-gid]').forEach(row => {
      const g = groups.find(x => x.id === row.dataset.gid); if (!g) return;
      row.querySelector('.gcol').onchange = e => { pushUndo(); g.color = e.target.value; afterEdit(); renderChars(); };
      row.querySelector('.gname').onchange = e => { if (!e.target.value.trim()) return; pushUndo(); g.name = e.target.value.trim(); afterEdit(); renderChars(); };
      row.querySelector('.gdel2').onclick = () => { if (!confirm(t('charGroupDelQ', g.name))) return; pushUndo(); state.tl.charGroups = groups.filter(x => x !== g); for (const c of list) if (c.group === g.id) c.group = ''; if (charGroupF === g.id) charGroupF = ''; afterEdit(); renderChars(); };
    });
    $('#chSearch').addEventListener('input', e => { charQ = e.target.value; const pos = e.target.selectionStart; renderChars(); const el = $('#chSearch'); el.focus(); el.setSelectionRange(pos, pos); });
    box.querySelectorAll('.char-card').forEach(el => el.onclick = () => { charSel = el.dataset.id; renderChars(); });
    const nb = $('#chNew'); if (nb) nb.onclick = () => {
      const name = prompt(t('charNewName')); if (!name || !name.trim()) return;
      pushUndo(); const n = { id: uid('ch'), name: name.trim(), created: new Date().toISOString() }; list.push(n); charSel = n.id; charEdit = true; afterEdit(); renderChars(true);
    };
  }
  function charDetail(box, c, can) {
    const f = c.faction && facById(c.faction), pl = placeByName(c.location), hw = placeByName(c.homeworld);
    const val = k => k === 'location' && pl ? `<a href="#" data-place="${esc(pl.id)}">📍 ${esc(c.location)}</a>` : k === 'homeworld' && hw ? `<a href="#" data-place="${esc(hw.id)}">${esc(c.homeworld)}</a>`
      : k === 'faction' ? (f ? `<span style="color:${esc(f.color)}">■</span> ${esc(f.name)}` : esc(c.faction)) : k === 'master' ? charLink(c.master) : esc(c[k]);
    const rels = c.relations || [];
    const relHtml = REL_KINDS.map(k => { const r = rels.filter(x => (x.kind || 'other') === k); return r.length ? `<span class="k"><span class="rk" style="--gc:${REL_COL[k]}"></span>${esc(t('rel_' + k))}</span><span>${r.map(x => `${charLink(x.name)}${x.relation ? ` <span class="dim">(${esc(x.relation)})</span>` : ''}`).join(', ')}</span>` : ''; }).join('');
    const sec = ([key, info, texts]) => {
      if (key === 'secRelations') return relHtml ? `<h3 class="facts-h">${esc(t(key))}</h3><div class="kv">${relHtml}</div>` : '';
      const iv = info.filter(k => c[k]), tv = texts.filter(k => c[k]); if (!iv.length && !tv.length) return '';
      return `<h3 class="facts-h">${esc(t(key))}</h3>${iv.length ? `<div class="kv">${iv.map(k => `<span class="k">${esc(t('ch_' + k))}</span><span>${val(k)}</span>`).join('')}</div>` : ''}
        ${tv.map(k => `${texts.length > 1 || info.length ? `<div class="k sub">${esc(t('ch_' + k))}</div>` : ''}<div class="story-text">${rich(c[k])}</div>`).join('')}`;
    };
    box.innerHTML = `
      <div class="row" style="margin-bottom:8px"><button id="chBack" class="fixed">← ${esc(t('tabChars'))}</button>${can ? `<button id="chEdit">✎ ${esc(t('charEdit'))}</button>` : ''}</div>
      <div class="char-head">${charImgBox(c.image, 'portrait')}
        <div><div class="info-title">${esc(c.name)}</div>${grpTag(grpOf(c))}${c.title ? `<div class="info-type">${esc(c.title)}</div>` : ''}
          ${f ? `<div><span style="color:${esc(f.color)}">■</span> ${esc(f.name)}</div>` : c.faction ? `<div>${esc(c.faction)}</div>` : ''}
          ${c.status ? `<div class="dim">${esc(c.status)}</div>` : ''}
          ${(c.tags || []).length ? `<div style="margin-top:4px">${c.tags.map(x => `<span class="tag">${esc(x)}</span>`).join(' ')}</div>` : ''}</div></div>
      ${CH_SECTIONS.map(sec).join('')}
      ${(c.gallery || []).length ? `<h3 class="facts-h">${esc(t('charGallery'))}</h3><div class="char-gallery">${c.gallery.map(g => `<figure><img src="${esc(g.src)}" alt="" data-zoom="${esc(g.src)}" data-cap="${esc(g.caption || '')}">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure>`).join('')}</div>` : ''}`;
    $('#chBack').onclick = () => { charSel = null; renderChars(); };
    const eb = $('#chEdit'); if (eb) eb.onclick = () => { charEdit = true; renderChars(true); };
    box.querySelectorAll('[data-zoom]').forEach(im => im.onclick = () => zoomImg(im.dataset.zoom, im.dataset.cap));
    box.querySelectorAll('[data-place]').forEach(a => a.onclick = ev => { ev.preventDefault(); const o = objMap[a.dataset.place] || placeByName(a.textContent.replace('📍', '').trim()); if (o) { centerOn(o, o.atlas ? 3 : 1.4); if (isMobile()) setSheet(false); } });
    box.querySelectorAll('[data-cid]').forEach(a => a.onclick = ev => { ev.preventDefault(); charSel = a.dataset.cid; renderChars(); });
  }
  function charForm(box, c) {
    const fld = k => `<label class="field"><span>${esc(t('ch_' + k))}</span><input data-f="${k}" ${k === 'location' || k === 'homeworld' ? 'list="searchList"' : ''} value="${esc(c[k] || '')}" placeholder="${esc(t('ph_' + k) === 'ph_' + k ? '' : t('ph_' + k))}"></label>`;
    const area = (k, rows, head) => `<label class="field"><span>${esc(t(head || ('ch_' + k)))}</span><textarea data-f="${k}" rows="${rows}" placeholder="${esc(t('ph_' + k) === 'ph_' + k ? '' : t('ph_' + k))}">${esc(c[k] || '')}</textarea></label>`;
    box.innerHTML = `<div id="chForm">
      <h3>✎ ${esc(c.name)}</h3>
      <div class="char-head">${charImgBox(c.image, 'portrait')}<div class="col">
        <button id="chImg">🖼 ${esc(t(c.image ? 'imgChange' : 'imgUpload'))}</button>${c.image ? `<button id="chImgDel" class="danger">✕ ${esc(t('charImgRemove'))}</button>` : ''}
        <input type="file" id="chImgFile" accept="image/*" hidden></div></div>
      <label class="field"><span>${esc(t('name'))}</span><input data-f="name" value="${esc(c.name)}"></label>
      <label class="field"><span>${esc(t('charGroup'))}</span><select data-f="group"><option value="">–</option>${(state.tl.charGroups || []).map(g => `<option value="${esc(g.id)}" ${g.id === c.group ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}<option value="__new">＋ ${esc(t('charGroupAdd'))}…</option></select></label>
      <h4>${esc(t('secIdentity'))}</h4>
      <div class="row">${['species', 'age'].map(fld).join('')}</div><div class="row">${['gender', 'homeworld'].map(fld).join('')}</div>
      ${area('appearance', 3, 'secLooks')}${area('personality', 3, 'secPersonality')}${area('bio', 5, 'secBackground')}
      <h4>${esc(t('secAffil'))}</h4>
      <label class="field"><span>${esc(t('ch_faction'))}</span><select data-f="faction"><option value="">–</option>${state.tl.factions.map(f => `<option value="${esc(f.id)}" ${f.id === c.faction ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}
        ${c.faction && !facById(c.faction) ? `<option value="${esc(c.faction)}" selected>${esc(c.faction)}</option>` : ''}</select></label>
      <div class="row">${['title', 'organization'].map(fld).join('')}</div>${fld('master')}
      ${area('abilities', 3, 'secAbilities')}
      <label class="field"><span>${esc(t('secRelations'))} <span class="dim">(${esc(t('charRelHint'))})</span></span><textarea data-f="relations" rows="4">${esc((c.relations || []).map(r => `${r.name}${r.relation ? ': ' + r.relation : ''}${r.kind && r.kind !== 'other' ? ' [' + t('rel1_' + r.kind) + ']' : ''}`).join('\n'))}</textarea></label>
      ${area('knowledge', 4, 'secKnowledge')}
      <h4>${esc(t('secCurrent'))}</h4>
      <div class="row">${['location', 'status'].map(fld).join('')}</div>${area('threads', 3)}
      ${area('notes', 3, 'secNotes')}
      <label class="field"><span>Tags <span class="dim">(${esc(t('commaSep'))})</span></span><input data-f="tags" value="${esc((c.tags || []).join(', '))}"></label>
      <h3 class="facts-h">${esc(t('charGallery'))}</h3>
      <div class="char-gallery edit">${(c.gallery || []).map((g, i) => `<figure><img src="${esc(g.src)}" alt=""><input class="gcap" data-i="${i}" placeholder="${esc(t('charCaption'))}" value="${esc(g.caption || '')}">
        <div class="row"><button class="gport fixed" data-i="${i}" title="${esc(t('charAsPortrait'))}">👤</button><button class="gdel fixed danger" data-i="${i}">✕</button></div></figure>`).join('')}</div>
      <div class="row" style="margin:6px 0 10px"><button id="chGalAdd">＋ ${esc(t('charAddImage'))}</button><input type="file" id="chGalFile" accept="image/*" multiple hidden></div>
      <p class="hint">${esc(t('storyFmt'))}</p>
      <div class="row"><button id="chDone" class="primary">${esc(t('ok'))}</button><button id="chDel" class="danger">${esc(t('delete'))}</button></div></div>`;
    let pushed = false; const mark = () => { if (!pushed) { pushUndo(); pushed = true; } };
    const touch = () => { c.updated = new Date().toISOString(); saveSoon(); };
    box.querySelectorAll('[data-f]').forEach(el => el.addEventListener('change', () => {
      mark(); const k = el.dataset.f, v = el.value;
      if (k === 'tags') c.tags = v.split(',').map(x => x.trim()).filter(Boolean);
      else if (k === 'relations') c.relations = v.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
        let kind = 'other'; const km = l.match(/\[([^\]]+)\]\s*$/);
        if (km) { const w = km[1].trim().toLowerCase(); kind = REL_KINDS.find(x => x === w || t('rel1_' + x).toLowerCase() === w || t('rel_' + x).toLowerCase() === w) || 'other'; l = l.slice(0, km.index).trim(); }
        const i = l.indexOf(':'); return i > 0 ? { name: l.slice(0, i).trim(), relation: l.slice(i + 1).trim(), kind } : { name: l, relation: '', kind };
      });
      else if (k === 'name') { if (v.trim()) c.name = v.trim(); }
      else if (k === 'group' && v === '__new') { const n = prompt(t('charGroupName')); const gs = (state.tl.charGroups ||= []); if (n && n.trim()) { const g = { id: uid('cg'), name: n.trim(), color: GROUP_COLORS[gs.length % GROUP_COLORS.length] }; gs.push(g); c.group = g.id; } touch(); renderChars(true); return; }
      else c[k] = v;
      touch();
    }));
    $('#chImg').onclick = () => $('#chImgFile').click();
    $('#chImgFile').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { const d = await resizeImage(f, 768); mark(); c.image = d; touch(); renderChars(true); } catch (e) { alert(e.message); } };
    const idl = $('#chImgDel'); if (idl) idl.onclick = () => { mark(); delete c.image; touch(); renderChars(true); };
    $('#chGalAdd').onclick = () => $('#chGalFile').click();
    $('#chGalFile').onchange = async ev => { const fs = [...ev.target.files]; if (!fs.length) return; mark(); for (const f of fs) { try { (c.gallery ||= []).push({ src: await resizeImage(f, 1280), caption: '' }); } catch (e) { alert(e.message); } } touch(); renderChars(true); };
    box.querySelectorAll('.gcap').forEach(el => el.onchange = () => { mark(); c.gallery[+el.dataset.i].caption = el.value; touch(); });
    box.querySelectorAll('.gdel').forEach(b => b.onclick = () => { mark(); c.gallery.splice(+b.dataset.i, 1); touch(); renderChars(true); });
    box.querySelectorAll('.gport').forEach(b => b.onclick = () => { mark(); c.image = c.gallery[+b.dataset.i].src; touch(); renderChars(true); });
    $('#chDone').onclick = () => { if (document.activeElement && document.activeElement.dispatchEvent) document.activeElement.dispatchEvent(new Event('change')); charEdit = false; afterEdit(); renderChars(true); };
    $('#chDel').onclick = () => { if (!confirm(t('charDelQ', c.name))) return; pushUndo(); state.tl.characters = state.tl.characters.filter(x => x !== c); charSel = null; charEdit = false; afterEdit(); renderChars(true); };
  }

  function renderAll() {
    editVersion++;
    rebuildTree();
    document.body.classList.toggle('is-sw', isSW());
    renderTopbar(); renderLeft(); renderFactionFilter(); renderSearchList(); renderEditor(); renderInfo(); renderPlanner(); renderStory(); renderChars();
    lastEraId = era() ? era().id : null; renderYear(); updateToolHint(); draw();
  }

  window.addEventListener('resize', resize);
  (async function boot() {
    document.documentElement.lang = settings.lang;
    applyStaticI18n();
    if (FS && FS.appInfo) try { state.appInfo = await FS.appInfo(); } catch { }
    try { await loadData(); } catch (e) { console.error(e); state.worlds = [SW]; state.timelines = [SW.canonTimeline(settings.lang)]; if (isGuest()) setTimeout(loginDialog, 300); }
    if (FS) {
      FS.onChange(onExternalChange);
      if (FS.onUpdate) FS.onUpdate(u => { state.upd = u; if (u.state === 'available' || u.state === 'downloaded') state.updDismissed = false; renderUpdStatus(); });
    }
    if (!state.worlds.length) { state.worlds = [SW]; state.timelines = [SW.canonTimeline(settings.lang)]; if (isGuest()) setTimeout(loginDialog, 300); }
    state.world = state.worlds.find(w => w.id === settings.activeWorld) || state.worlds[0];
    resize();
    switchWorld(state.world.id);
    saveSoon();
    if (settings.autoUpdate && FS && (!FS.server || FS.desktop)) setTimeout(() => checkUpdates(false), 2500);
    if (FS && FS.server && !FS.desktop && state.appInfo.updateAvailable && !isGuest()) setTimeout(() => { state.upd = { state: 'dockerNew', version: state.appInfo.latest }; renderUpdStatus(); }, 1500);
    const off = new URLSearchParams(location.search).get('offline');
    if (off) setTimeout(() => { let b = $('#offBanner'); if (!b) { b = document.createElement('div'); b.id = 'offBanner'; $('#mapWrap').appendChild(b); } b.innerHTML = `<b>☁</b> ${esc(t('srvOffline', off))} <button id="offRetry" class="primary">${esc(t('srvRetry'))}</button> <button id="offClose">${esc(t('close'))}</button>`; b.hidden = false;
      $('#offRetry').onclick = () => window.iamDesktop && window.iamDesktop.getServer().then(u => u && window.iamDesktop.setServer(u)); $('#offClose').onclick = () => { b.hidden = true; }; }, 600);
  })();
  window.__iam = { state, setYear, regionAt, settings, setLang, switchWorld, fmtYear, parseYear, draw, renderInfo, atlasObjs };
})();
