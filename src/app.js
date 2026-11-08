/* =========================================================================
   Ascandir – Star Wars Galaxy Map · Anwendung
   ========================================================================= */
(function () {
  'use strict';
  const { GEO, REGIONS, inWedge, canonTimeline } = window.SWGM_DATA;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TYPE_LABEL = { sun: 'Sonne', planet: 'Planet', moon: 'Mond', station: 'Station' };
  const TYPE_ORDER = { sun: 0, planet: 1, moon: 2, station: 3 };
  const fmtYear = y => (y == null || y === '') ? '–' : (y < 0 ? `${-y} VSY` : `${y} NSY`);
  const uid = p => p + Math.random().toString(36).slice(2, 9);

  // ------------------------------------------------------------- Speicher
  const STORE_TL = 'swgm.timelines.v1';
  const STORE_SET = 'swgm.settings.v1';
  function loadJSON(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } }
  const FS = window.swgmFS || null; // nur in der installierten App vorhanden
  const lastWritten = {};            // Datei -> zuletzt geschriebener Inhalt
  const serialize = t => { const c = Object.assign({}, t); delete c._file; delete c.readonly; return JSON.stringify(c, null, 2); };
  const slugify = n => (String(n || 'zeitlinie').normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'zeitlinie').slice(0, 60);
  function fileFor(t) {
    if (t._file) return t._file;
    const used = new Set(state.timelines.map(x => x._file).filter(Boolean));
    let base = slugify(t.name), f = base + '.json', i = 2;
    while (used.has(f)) f = `${base}_${i++}.json`;
    return (t._file = f);
  }
  async function writeTimelines() {
    for (const t of state.timelines) {
      if (t.readonly) continue;
      const f = fileFor(t), c = serialize(t);
      if (lastWritten[f] === c) continue;
      lastWritten[f] = c;
      try { await FS.save(f, c); } catch (e) { console.error(e); toast('Speichern fehlgeschlagen: ' + e.message); }
    }
  }
  function parseTimeline(text) {
    const j = JSON.parse(text);
    if (j && j.type === 'FeatureCollection') return fromGeoJSON(j);
    const t = j.timeline || j;
    if (!Array.isArray(t.objects) || !Array.isArray(t.eras) || !Array.isArray(t.factions)) throw new Error('Es fehlen "objects", "eras" oder "factions".');
    t.eras.forEach(x => { x.control ||= {}; x.regionClaims ||= {}; x.zones ||= []; x.id ||= uid('era'); x.year = +x.year || 0; });
    t.objects.forEach(o => { o.id ||= uid('o'); o.type = TYPE_LABEL[o.type] ? o.type : 'planet'; o.x = +o.x || 0; o.y = +o.y || 0; });
    t.factions.forEach(f => { f.id ||= uid('f'); f.color ||= '#888888'; f.reach = +f.reach || 120; });
    t.eras.sort((a, b) => a.year - b.year);
    t.id ||= uid('tl'); t.name ||= 'Ohne Namen'; t.readonly = false;
    return t;
  }
  async function loadFromFS() {
    const files = await FS.list();
    const bad = [];
    for (const { file, content, error } of files) {
      try {
        if (error) throw new Error(error);
        const t = parseTimeline(content); t._file = file; lastWritten[file] = content;
        if (state.timelines.some(x => x.id === t.id)) t.id = uid('tl');
        state.timelines.push(t);
      } catch (e) { bad.push(`${file}: ${e.message}`); }
    }
    // Einmalige Übernahme alter, im Browser-Speicher liegender Zeitlinien
    if (!files.length) for (const t of loadJSON(STORE_TL, [])) { t.readonly = false; state.timelines.push(t); }
    if (bad.length) setTimeout(() => alert('Diese Zeitlinien-Dateien konnten nicht gelesen werden:\n\n' + bad.join('\n')), 300);
  }
  async function onExternalChange(file) {
    let content;
    try { content = await FS.read(file); } catch { return; }
    if (content != null && content === lastWritten[file]) return; // eigene Änderung
    const i = state.timelines.findIndex(t => t._file === file);
    if (content == null) { // Datei gelöscht
      if (i < 0) return;
      const wasActive = state.timelines[i] === state.tl;
      state.timelines.splice(i, 1); delete lastWritten[file];
      if (wasActive) { state.tl = state.timelines[0]; state.eraIdx = 0; state.selected = null; }
      afterChange(true); toast(`„${file}“ wurde entfernt`); return;
    }
    try {
      const t = parseTimeline(content); t._file = file; lastWritten[file] = content;
      if (i >= 0) { t.id = state.timelines[i].id; const wasActive = state.timelines[i] === state.tl; state.timelines[i] = t; if (wasActive) state.tl = t; }
      else { if (state.timelines.some(x => x.id === t.id)) t.id = uid('tl'); state.timelines.push(t); }
      if (state.eraIdx >= state.tl.eras.length) state.eraIdx = Math.max(0, state.tl.eras.length - 1);
      afterChange(true); toast(`„${t.name}“ neu geladen`);
    } catch (e) { toast(`${file}: Fehler in der Datei – ${e.message}`); }
  }

  let saveTimer = null;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        if (FS) writeTimelines(); else localStorage.setItem(STORE_TL, JSON.stringify(state.timelines.filter(t => !t.readonly)));
        localStorage.setItem(STORE_SET, JSON.stringify({
          active: state.tl.id, eraIdx: state.eraIdx, types: state.types, opts: state.opts, hiddenFactions: [...state.hiddenFactions]
        }));
      } catch (e) { console.error(e); }
    }, 250);
  }

  // ------------------------------------------------------------- Zustand
  const settings = loadJSON(STORE_SET, {});
  const state = {
    timelines: [canonTimeline(), ...(window.swgmFS ? [] : loadJSON(STORE_TL, []))],
    tl: null, eraIdx: settings.eraIdx || 0,
    types: Object.assign({ sun: true, planet: true, moon: true, station: true }, settings.types),
    opts: Object.assign({ influence: true, regions: true, grid: false, names: true }, settings.opts),
    hiddenFactions: new Set(settings.hiddenFactions || []),
    mode: 'view', tool: 'select', activeFaction: null, brush: 90,
    newType: 'planet', newName: '', attach: true,
    selected: null, hover: null,
    view: { cx: GEO.center.x, cy: GEO.center.y, z: 0.35 },
    undo: []
  };
  state.tl = state.timelines[0];

  const era = () => state.tl.eras[state.eraIdx];
  const editable = () => state.mode === 'edit' && !state.tl.readonly;
  const objById = () => { const m = {}; for (const o of state.tl.objects) m[o.id] = o; return m; };
  const facById = id => state.tl.factions.find(f => f.id === id);
  function existsNow(o) {
    const y = era() ? era().year : 0;
    return (o.from == null || o.from === '' || y >= +o.from) && (o.to == null || o.to === '' || y <= +o.to);
  }
  function pushUndo() {
    state.undo.push(JSON.stringify({ id: state.tl.id, data: state.tl }));
    if (state.undo.length > 60) state.undo.shift();
  }
  function undo() {
    const s = state.undo.pop(); if (!s) return;
    const { id, data } = JSON.parse(s);
    const i = state.timelines.findIndex(t => t.id === id);
    if (i < 0) return;
    state.timelines[i] = data;
    if (state.tl.id === id) state.tl = data;
    if (state.eraIdx >= state.tl.eras.length) state.eraIdx = state.tl.eras.length - 1;
    afterChange(true);
  }

  // ------------------------------------------------------------- Canvas
  const canvas = $('#map');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const off = document.createElement('canvas'), offCtx = off.getContext('2d');
  const ero = document.createElement('canvas'), eroCtx = ero.getContext('2d');
  const glow = document.createElement('canvas');

  function resize() {
    const r = canvas.getBoundingClientRect();
    DPR = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    for (const c of [canvas, off, ero]) { c.width = Math.max(1, Math.round(W * DPR)); c.height = Math.max(1, Math.round(H * DPR)); }
    draw();
  }

  // Sterne + Galaxie-Leuchten (einmalig)
  let rngSeed = 7;
  const rnd = () => (rngSeed = (rngSeed * 16807) % 2147483647) / 2147483647;
  const stars = [];
  (function genStars() {
    for (let i = 0; i < 5200; i++) {
      // Spiralarme
      const arm = i % 4, t = Math.pow(rnd(), 0.7) * 1.0;
      const r = 40 + t * 1100;
      const th = arm * Math.PI / 2 + t * 5.2 + (rnd() - 0.5) * 0.9 * (1 - t * 0.4);
      const s = GEO.scale(th);
      stars.push({ x: GEO.center.x + Math.cos(th) * r * s + (rnd() - .5) * 60, y: GEO.center.y + Math.sin(th) * r * s + (rnd() - .5) * 60, b: 0.25 + rnd() * 0.75, c: rnd() });
    }
    for (let i = 0; i < 1500; i++) stars.push({ x: -500 + rnd() * 3300, y: -500 + rnd() * 3200, b: 0.15 + rnd() * 0.5, c: rnd() });
  })();
  (function genGlow() {
    const S = 0.5; glow.width = 2600 * S; glow.height = 2600 * S;
    const g = glow.getContext('2d');
    g.scale(S, S); g.translate(150, 150);
    const C = GEO.center;
    g.save();
    g.beginPath(); shapePath(g, GEO.edge * 1.05);
    const grad = g.createRadialGradient(C.x, C.y, 0, C.x, C.y, 1150);
    grad.addColorStop(0, 'rgba(255,236,190,0.55)'); grad.addColorStop(0.08, 'rgba(255,214,150,0.32)');
    grad.addColorStop(0.3, 'rgba(120,140,220,0.14)'); grad.addColorStop(0.75, 'rgba(70,90,170,0.07)'); grad.addColorStop(1, 'rgba(40,50,120,0)');
    g.fillStyle = grad; g.fill(); g.restore();
    g.globalCompositeOperation = 'lighter';
    for (let arm = 0; arm < 4; arm++) {
      for (let t = 0; t < 1; t += 0.004) {
        const r = 60 + t * 1050, th = arm * Math.PI / 2 + t * 5.2, s = GEO.scale(th);
        const x = C.x + Math.cos(th) * r * s, y = C.y + Math.sin(th) * r * s;
        const rad = 40 + 70 * t;
        const gg = g.createRadialGradient(x, y, 0, x, y, rad);
        gg.addColorStop(0, `rgba(110,140,230,${0.05 * (1 - t * 0.6)})`); gg.addColorStop(1, 'rgba(110,140,230,0)');
        g.fillStyle = gg; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      }
    }
  })();

  // Galaxie-Formpfad bei normiertem Radius r
  function shapePath(c, r, reverse) {
    const N = state.view.z > 3 ? 1440 : state.view.z > 1 ? 480 : 180;
    for (let i = 0; i <= N; i++) {
      const k = reverse ? N - i : i;
      const th = (k / N) * Math.PI * 2;
      const s = GEO.scale(th);
      const x = GEO.center.x + Math.cos(th) * r * s, y = GEO.center.y + Math.sin(th) * r * s;
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.closePath();
  }
  function wedgePath(c) {
    const w = GEO.unknownWedge, N = state.view.z > 3 ? 320 : 60;
    for (let i = 0; i <= N; i++) {
      const th = w.from + (w.to - w.from) * i / N, s = GEO.scale(th);
      const x = GEO.center.x + Math.cos(th) * GEO.edge * s, y = GEO.center.y + Math.sin(th) * GEO.edge * s;
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const th = w.from + (w.to - w.from) * i / N, s = GEO.scale(th);
      c.lineTo(GEO.center.x + Math.cos(th) * w.r0 * s, GEO.center.y + Math.sin(th) * w.r0 * s);
    }
    c.closePath();
  }
  function huttCircle() {
    const n = state.tl.objects.find(o => o.id === 'nalhutta' || o.region === 'Huttenraum');
    const p = n ? posOf(n) : { x: 1950, y: 1150 };
    return { x: p.x, y: p.y, r: 170 };
  }
  // Füllt eine Region (Pfad + ggf. Ausschluss des Westkeils) im aktuellen Kontext
  function fillRegion(c, key) {
    if (key === 'Unbekannte Regionen') { c.beginPath(); wedgePath(c); c.fill(); return; }
    if (key === 'Huttenraum') { const h = huttCircle(); c.beginPath(); c.arc(h.x, h.y, h.r, 0, Math.PI * 2); c.fill(); return; }
    const b = GEO.bands.find(b => b.key === key); if (!b) return;
    c.save();
    if (b.r1 > GEO.unknownWedge.r0) {
      c.beginPath(); c.rect(-5000, -5000, 12000, 12000); wedgePath(c); c.clip('evenodd');
    }
    c.beginPath(); shapePath(c, b.r1); if (b.r0 > 0) shapePath(c, b.r0, true);
    c.fill('evenodd');
    c.restore();
  }
  function regionAt(x, y) {
    const h = huttCircle();
    if (Math.hypot(x - h.x, y - h.y) <= h.r) return 'Huttenraum';
    const dx = x - GEO.center.x, dy = y - GEO.center.y, th = Math.atan2(dy, dx);
    const dn = Math.hypot(dx, dy) / GEO.scale(th);
    if (dn > GEO.edge) return null;
    if (inWedge(th) && dn >= GEO.unknownWedge.r0) return 'Unbekannte Regionen';
    const b = GEO.bands.find(b => dn >= b.r0 && dn < b.r1);
    return b ? b.key : null;
  }

  // ------------------------------------------------------------- Positionen
  let posCache = {}, childrenOf = {};
  function rebuildTree() {
    childrenOf = {};
    const m = objById();
    for (const o of state.tl.objects) if (o.parent && m[o.parent]) (childrenOf[o.parent] ||= []).push(o);
    for (const k in childrenOf) childrenOf[k].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name));
  }
  function computePositions() {
    posCache = {};
    const m = objById();
    const calc = (o, depth) => {
      if (posCache[o.id]) return posCache[o.id];
      const p = o.parent && m[o.parent] && depth < 8 ? m[o.parent] : null;
      if (!p) return (posCache[o.id] = { x: o.x, y: o.y });
      const pp = calc(p, depth + 1);
      const sib = childrenOf[p.id] || [];
      const k = sib.indexOf(o);
      const ang = (-40 + 62 * k) * Math.PI / 180;
      // Kleiner Zoom: fester Bildschirmabstand · großer Zoom: feste Umlaufbahn in Weltkoordinaten
      const grand = p.parent && m[p.parent];
      const orbit = grand ? 0.45 + 0.22 * k : 1.8 + 0.8 * k;
      const dist = Math.max((13 + 5 * k) / state.view.z, orbit);
      return (posCache[o.id] = { x: pp.x + Math.cos(ang) * dist, y: pp.y + Math.sin(ang) * dist });
    };
    for (const o of state.tl.objects) calc(o, 0);
  }
  const posOf = o => posCache[o.id] || { x: o.x, y: o.y };
  function rootOf(o) { const m = objById(); let c = o, n = 0; while (c.parent && m[c.parent] && n++ < 8) c = m[c.parent]; return c; }
  // Schlüssel, unter dem die Kontrolle eines Objekts gespeichert ist
  function controlKey(o) {
    const m = objById(); let c = o, n = 0;
    while ((c.type === 'moon' || c.type === 'station') && c.parent && m[c.parent] && n++ < 8) c = m[c.parent];
    return c.id;
  }
  function controllerOf(o) {
    const e = era(); if (!e) return null;
    let f = e.control[controlKey(o)];
    if (!f && o.type === 'sun') { const ch = (childrenOf[o.id] || []).find(c => e.control[c.id]); if (ch) f = e.control[ch.id]; }
    return f ? facById(f) : null;
  }

  // ------------------------------------------------------------- Zeichnen
  const w2s = (x, y) => ({ x: (x - state.view.cx) * state.view.z + W / 2, y: (y - state.view.cy) * state.view.z + H / 2 });
  const s2w = (x, y) => ({ x: (x - W / 2) / state.view.z + state.view.cx, y: (y - H / 2) / state.view.z + state.view.cy });
  function worldTransform(c) {
    const z = state.view.z;
    c.setTransform(DPR * z, 0, 0, DPR * z, DPR * (W / 2 - state.view.cx * z), DPR * (H / 2 - state.view.cy * z));
  }
  let drawQueued = false;
  function draw() { if (!drawQueued) { drawQueued = true; requestAnimationFrame(() => { drawQueued = false; render(); }); } }

  function visibleObj(o) { return state.types[o.type] && existsNow(o); }

  function render() {
    if (!W) return;
    rebuildTree(); computePositions();
    const z = state.view.z;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Galaxie
    worldTransform(ctx);
    ctx.globalAlpha = z > 3 ? Math.max(0.35, 3 / z) : 1;
    ctx.drawImage(glow, -150, -150, 2600, 2600);
    ctx.globalAlpha = 1;
    // Sterne (in Bildschirmkoordinaten, damit sie scharf bleiben)
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (const s of stars) {
      const p = w2s(s.x, s.y);
      if (p.x < -2 || p.y < -2 || p.x > W + 2 || p.y > H + 2) continue;
      const sz = Math.max(0.6, Math.min(2, 0.5 + z * 0.6)) * (s.b > 0.85 ? 1.6 : 1);
      ctx.fillStyle = s.c < 0.15 ? `rgba(255,210,160,${s.b})` : s.c > 0.85 ? `rgba(170,200,255,${s.b})` : `rgba(235,240,255,${s.b * 0.85})`;
      ctx.fillRect(p.x, p.y, sz, sz);
    }

    if (z > 0.9) drawDeepStars();
    // Regionen
    if (state.opts.regions) drawRegions();
    // Einfluss
    if (state.opts.influence && era()) drawInfluence();
    // Raster
    if (state.opts.grid) drawGrid();
    // Pinsel-Vorschau
    drawObjects();
    drawBrush();
  }

  // Prozedurale Zusatz-Sterne beim tiefen Hineinzoomen (deterministisch je Rasterzelle)
  function hash(a, b, c) {
    let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function drawDeepStars() {
    const z = state.view.z;
    const tl = s2w(0, 0), br = s2w(W, H);
    for (let L = 0; L <= Math.floor(Math.log2(z)); L++) {
      const cell = 120 / Math.pow(2, L);
      if (cell * z > 400) continue; // zu grob für diese Zoomstufe
      const alpha = Math.min(1, (cell * z - 30) / 60);
      if (alpha <= 0) continue;
      const x0 = Math.floor(tl.x / cell), x1 = Math.ceil(br.x / cell), y0 = Math.floor(tl.y / cell), y1 = Math.ceil(br.y / cell);
      if ((x1 - x0) * (y1 - y0) > 4000) continue;
      for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
        const cx = (ix + 0.5) * cell, cy = (iy + 0.5) * cell;
        const dx = cx - GEO.center.x, dy = cy - GEO.center.y, th = Math.atan2(dy, dx);
        const dn = Math.hypot(dx, dy) / GEO.scale(th);
        const dens = dn > GEO.edge ? 0.15 : 0.35 + 0.65 * (1 - dn / GEO.edge);
        for (let k = 0; k < 3; k++) {
          if (hash(ix, iy, L * 7 + k) > dens) continue;
          const p = w2s((ix + hash(ix, iy, L * 7 + k + 101)) * cell, (iy + hash(ix, iy, L * 7 + k + 211)) * cell);
          const b = (0.3 + 0.7 * hash(ix, iy, L * 7 + k + 307)) * alpha;
          const t = hash(ix, iy, L * 7 + k + 401);
          ctx.fillStyle = t < 0.15 ? `rgba(255,210,160,${b})` : t > 0.85 ? `rgba(170,200,255,${b})` : `rgba(235,240,255,${b * 0.85})`;
          const sz = 0.7 + hash(ix, iy, k + 503) * 1.1;
          ctx.fillRect(p.x, p.y, sz, sz);
        }
      }
    }
  }

  function drawRegions() {
    const z = state.view.z;
    worldTransform(ctx);
    ctx.lineWidth = 1 / z;
    ctx.strokeStyle = 'rgba(140,170,220,0.22)';
    ctx.setLineDash([6 / z, 6 / z]);
    for (const b of GEO.bands) {
      ctx.save();
      if (b.r1 > GEO.unknownWedge.r0) { ctx.beginPath(); ctx.rect(-5000, -5000, 12000, 12000); wedgePath(ctx); ctx.clip('evenodd'); }
      ctx.beginPath(); shapePath(ctx, b.r1); ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = 'rgba(160,120,220,0.35)';
    ctx.beginPath(); wedgePath(ctx); ctx.stroke();
    const h = huttCircle();
    ctx.strokeStyle = 'rgba(200,170,90,0.3)';
    ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // Beschriftungen
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.font = `600 ${Math.max(9, Math.min(13, 9 + z * 3))}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(170,195,235,0.42)';
    const th = -1.2;
    for (const b of GEO.bands) {
      const r = b.key === 'Tiefkern' ? 0 : (b.r0 + b.r1) / 2, s = GEO.scale(th);
      const p = w2s(GEO.center.x + Math.cos(th) * r * s, GEO.center.y + Math.sin(th) * r * s);
      if (b.key === 'Tiefkern' && z < 0.6) continue;
      ctx.fillText(b.key.toUpperCase(), p.x, p.y);
    }
    ctx.fillStyle = 'rgba(190,160,240,0.5)';
    let p = w2s(GEO.center.x - 720 * GEO.scale(Math.PI), GEO.center.y);
    ctx.fillText('UNBEKANNTE REGIONEN', p.x, p.y);
    ctx.fillStyle = 'rgba(220,190,110,0.5)';
    p = w2s(h.x, h.y + h.r - 14);
    ctx.fillText('HUTTENRAUM', p.x, p.y);
  }

  function drawInfluence() {
    const e = era(), z = state.view.z;
    const objs = state.tl.objects;
    const shifts = [[2, 0], [-2, 0], [0, 2], [0, -2], [1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5]].map(a => a.map(v => v * DPR));
    for (const f of state.tl.factions) {
      if (state.hiddenFactions.has(f.id)) continue;
      const keys = Object.keys(e.control).filter(k => e.control[k] === f.id);
      const regs = Object.keys(e.regionClaims || {}).filter(r => e.regionClaims[r] === f.id);
      const zones = (e.zones || []).filter(zn => zn.faction === f.id);
      if (!keys.length && !regs.length && !zones.length) continue;
      offCtx.setTransform(1, 0, 0, 1, 0, 0);
      offCtx.globalCompositeOperation = 'source-over';
      offCtx.clearRect(0, 0, off.width, off.height);
      worldTransform(offCtx);
      offCtx.fillStyle = f.color;
      for (const r of regs) fillRegion(offCtx, r);
      offCtx.beginPath();
      const reach = +f.reach || 120;
      for (const k of keys) {
        const o = objs.find(x => x.id === k); if (!o || !existsNow(o)) continue;
        const p = posOf(o); offCtx.moveTo(p.x + reach, p.y); offCtx.arc(p.x, p.y, reach, 0, Math.PI * 2);
      }
      for (const zn of zones) {
        if (Array.isArray(zn.poly) && zn.poly.length > 2) { zn.poly.forEach(([x, y], i) => i ? offCtx.lineTo(x, y) : offCtx.moveTo(x, y)); offCtx.closePath(); }
        else { offCtx.moveTo(zn.x + zn.r, zn.y); offCtx.arc(zn.x, zn.y, zn.r, 0, Math.PI * 2); }
      }
      offCtx.fill('nonzero');
      // Fläche
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.2; ctx.drawImage(off, 0, 0); ctx.globalAlpha = 1;
      // Umriss = Fläche minus erodierte Fläche
      eroCtx.setTransform(1, 0, 0, 1, 0, 0);
      eroCtx.globalCompositeOperation = 'source-over';
      eroCtx.clearRect(0, 0, ero.width, ero.height);
      eroCtx.drawImage(off, 0, 0);
      eroCtx.globalCompositeOperation = 'destination-in';
      for (const [dx, dy] of shifts) eroCtx.drawImage(off, dx, dy);
      offCtx.setTransform(1, 0, 0, 1, 0, 0);
      offCtx.globalCompositeOperation = 'destination-out';
      offCtx.drawImage(ero, 0, 0);
      offCtx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.85; ctx.drawImage(off, 0, 0); ctx.globalAlpha = 1;
    }
  }

  function drawGrid() {
    const c = GEO.gridCell;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.strokeStyle = 'rgba(120,160,220,0.13)'; ctx.lineWidth = 1;
    ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillStyle = 'rgba(160,190,230,0.6)';
    for (let i = 0; i <= 24; i++) {
      const a = w2s(i * c, 0), b = w2s(i * c, 22 * c);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (i < 24) { const m = w2s((i + 0.5) * c, 0); ctx.textAlign = 'center'; ctx.fillText(String.fromCharCode(65 + i), m.x, Math.max(12, a.y - 4)); }
    }
    for (let j = 0; j <= 22; j++) {
      const a = w2s(0, j * c), b = w2s(24 * c, j * c);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (j < 22) { const m = w2s(0, (j + 0.5) * c); ctx.textAlign = 'right'; ctx.fillText(String(j + 1), Math.max(18, a.x - 4), m.y + 3); }
    }
  }

  function drawObjects() {
    const z = state.view.z;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const vis = state.tl.objects.filter(visibleObj).sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
    const sizeF = Math.max(0.8, Math.min(4, Math.pow(z, 0.35) * 1.3));
    for (const o of vis) {
      const p = w2s(posOf(o).x, posOf(o).y);
      if (p.x < -20 || p.y < -20 || p.x > W + 20 || p.y > H + 20) continue;
      const fac = controllerOf(o);
      if (o.type === 'sun') {
        const r = 5 * sizeF;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
        g.addColorStop(0, '#fffbe6'); g.addColorStop(0.3, '#ffc64a'); g.addColorStop(1, 'rgba(255,150,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2); ctx.fill();
      } else if (o.type === 'planet') {
        const r = 4 * sizeF;
        ctx.fillStyle = '#d4deea'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        if (fac) { ctx.strokeStyle = fac.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, r + 2.2, 0, Math.PI * 2); ctx.stroke(); }
      } else if (o.type === 'moon') {
        const r = 2.3 * sizeF;
        ctx.fillStyle = '#98a6b6'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        if (fac && !o.parent) { ctx.strokeStyle = fac.color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, r + 1.8, 0, Math.PI * 2); ctx.stroke(); }
      } else if (o.type === 'station') {
        const r = 3.6 * sizeF;
        ctx.fillStyle = '#7fe3ff'; ctx.beginPath();
        ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r, p.y); ctx.closePath(); ctx.fill();
        if (fac && !o.parent) { ctx.strokeStyle = fac.color; ctx.lineWidth = 1.5; ctx.stroke(); }
      }
      if (state.selected === o.id || state.hover === o.id) {
        ctx.strokeStyle = state.selected === o.id ? '#f5b83d' : '#ffffff99'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, 10 * sizeF, 0, Math.PI * 2); ctx.stroke();
      }
    }
    if (!state.opts.names) return;
    // Beschriftung mit einfacher Kollisionsvermeidung
    const boxes = [];
    const minZ = { planet: 0.22, sun: 1.1, moon: 1.2, station: 0.9 };
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const order = vis.slice().sort((a, b) => (a.id === state.selected ? -1 : b.id === state.selected ? 1 : 0) || TYPE_ORDER[a.type === 'sun' ? 'moon' : a.type] - TYPE_ORDER[b.type === 'sun' ? 'moon' : b.type]);
    for (const o of order) {
      if (z < minZ[o.type] && o.id !== state.selected && !(o.type !== 'planet' && !o.parent && z > 0.45)) continue;
      const p = w2s(posOf(o).x, posOf(o).y);
      if (p.x < -50 || p.y < -20 || p.x > W + 50 || p.y > H + 20) continue;
      const big = o.type === 'planet';
      ctx.font = `${big ? 600 : 400} ${big ? 12 : 11}px "Segoe UI", sans-serif`;
      const w = ctx.measureText(o.name).width, x = p.x + 8, y = p.y;
      const box = [x - 2, y - 8, x + w + 2, y + 8];
      if (boxes.some(b => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3])) && o.id !== state.selected) continue;
      boxes.push(box);
      ctx.fillStyle = 'rgba(4,6,12,0.75)'; ctx.fillText(o.name, x + 1, y + 1);
      ctx.fillStyle = o.type === 'planet' ? '#e8eef6' : o.type === 'station' ? '#a5ecff' : o.type === 'sun' ? '#ffd98a' : '#b7c2cf';
      ctx.fillText(o.name, x, y);
    }
    ctx.textBaseline = 'alphabetic';
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

  // ------------------------------------------------------------- Interaktion
  function hitTest(sx, sy) {
    let best = null, bd = 12;
    for (const o of state.tl.objects) {
      if (!visibleObj(o)) continue;
      const p = w2s(posOf(o).x, posOf(o).y);
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bd || (d === bd && best && TYPE_ORDER[o.type] > TYPE_ORDER[best.type])) { bd = d; best = o; }
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

  let drag = null;
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
    const w = s2w(sx, sy);
    if (e.button === 1 || e.button === 2 || !editable() || state.tool === 'select') {
      const hit = e.button === 0 ? hitTest(sx, sy) : null;
      if (hit && editable() && state.tool === 'select') {
        const root = rootOf(hit);
        pushUndo();
        drag = { kind: 'move', obj: root, ox: w.x - root.x, oy: w.y - root.y, moved: false, hit };
      } else {
        drag = { kind: 'pan', sx, sy, cx: state.view.cx, cy: state.view.cy, moved: false, hit };
      }
      canvas.classList.add('dragging');
      return;
    }
    // Editor-Werkzeuge
    if (state.tool === 'assign') {
      const hit = hitTest(sx, sy); if (!hit) return;
      pushUndo();
      const key = controlKey(hit);
      if (state.activeFaction) era().control[key] = state.activeFaction; else delete era().control[key];
      state.selected = hit.id; afterChange();
    } else if (state.tool === 'region') {
      const reg = regionAt(w.x, w.y); if (!reg) return;
      pushUndo();
      const rc = (era().regionClaims ||= {});
      if (!state.activeFaction || rc[reg] === state.activeFaction) delete rc[reg]; else rc[reg] = state.activeFaction;
      toast(`${reg}: ${rc[reg] ? facById(rc[reg]).name : 'neutral'}`);
      afterChange();
    } else if (state.tool === 'paint') {
      if (!state.activeFaction) { toast('Erst eine Fraktion wählen'); return; }
      pushUndo();
      drag = { kind: 'paint', last: null }; paintAt(w);
    } else if (state.tool === 'erase') {
      pushUndo();
      drag = { kind: 'erase' }; eraseAt(w);
    } else if (state.tool === 'add') {
      addObjectAt(w, sx, sy);
    }
  });
  window.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
    mouse = { x: sx, y: sy, in: sx >= 0 && sy >= 0 && sx <= W && sy <= H };
    if (drag) {
      const w = s2w(sx, sy);
      if (drag.kind === 'pan') {
        if (Math.abs(sx - drag.sx) + Math.abs(sy - drag.sy) > 3) drag.moved = true;
        state.view.cx = drag.cx - (sx - drag.sx) / state.view.z;
        state.view.cy = drag.cy - (sy - drag.sy) / state.view.z;
      } else if (drag.kind === 'move') {
        drag.moved = true;
        drag.obj.x = Math.round(w.x - drag.ox); drag.obj.y = Math.round(w.y - drag.oy);
      } else if (drag.kind === 'paint') paintAt(w);
      else if (drag.kind === 'erase') eraseAt(w);
      draw(); return;
    }
    if (!mouse.in) { $('#tooltip').hidden = true; if (state.hover) { state.hover = null; draw(); } return; }
    const hit = hitTest(sx, sy);
    const id = hit ? hit.id : null;
    const tt = $('#tooltip');
    if (hit) {
      const fac = controllerOf(hit);
      tt.innerHTML = `<b>${esc(hit.name)}</b> <span class="dim">· ${TYPE_LABEL[hit.type]}</span>${fac ? `<br><span style="color:${fac.color}">■</span> ${esc(fac.name)}` : ''}`;
      tt.style.left = (sx + 14) + 'px'; tt.style.top = (sy + 12) + 'px'; tt.hidden = false;
    } else tt.hidden = true;
    if (id !== state.hover) { state.hover = id; }
    draw();
  });
  window.addEventListener('mouseup', e => {
    if (!drag) return;
    const d = drag; drag = null;
    canvas.classList.remove('dragging');
    if (d.kind === 'pan' && !d.moved && e.button === 0) {
      state.selected = d.hit ? d.hit.id : null; renderInfo(); draw();
    } else if (d.kind === 'move') {
      if (!d.moved) { state.undo.pop(); state.selected = d.hit.id; renderInfo(); draw(); }
      else { d.obj.region = regionAt(d.obj.x, d.obj.y) || d.obj.region; state.selected = d.hit.id; afterChange(); }
    } else if (d.kind === 'paint' || d.kind === 'erase') afterChange();
    else saveSoon();
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
    zoomAt(sx, sy, Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });
  function zoomAt(sx, sy, f) {
    rebuildTree(); computePositions();
    // Objekt unter dem Mauszeiger bleibt beim Zoomen exakt an seinem Platz
    let anchor = null, bd = 30;
    for (const o of state.tl.objects) {
      if (!visibleObj(o)) continue;
      const p = w2s(posOf(o).x, posOf(o).y), d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bd) { bd = d; anchor = { o, sx: p.x, sy: p.y }; }
    }
    const before = s2w(sx, sy);
    state.view.z = Math.max(0.15, Math.min(120, state.view.z * f));
    const after = s2w(sx, sy);
    state.view.cx += before.x - after.x; state.view.cy += before.y - after.y;
    if (anchor) {
      computePositions();
      const np = w2s(posOf(anchor.o).x, posOf(anchor.o).y);
      state.view.cx += (np.x - anchor.sx) / state.view.z; state.view.cy += (np.y - anchor.sy) / state.view.z;
    }
    draw();
  }
  function fitView() {
    state.view.cx = GEO.center.x; state.view.cy = GEO.center.y + 90;
    state.view.z = Math.min(W / 2400, H / 2150) || 0.35; draw();
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
  function eraseAt(w) {
    const e = era(); if (!e.zones) return;
    const n = e.zones.length;
    e.zones = e.zones.filter(z => Array.isArray(z.poly) ? !pointInPoly(w.x, w.y, z.poly) : Math.hypot(z.x - w.x, z.y - w.y) > state.brush + z.r * 0.3);
    if (e.zones.length !== n) draw();
  }
  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function addObjectAt(w, sx, sy) {
    const type = state.newType;
    let parent = null;
    if (state.attach) {
      const pTypes = type === 'moon' || type === 'station' ? ['planet', 'moon'] : type === 'planet' ? ['sun'] : ['sun'];
      const n = nearest(sx, sy, pTypes, 45);
      if (n && n.type !== 'moon') parent = n;
      else if (n && type === 'station') parent = n;
    }
    pushUndo();
    const count = state.tl.objects.filter(o => o.type === type).length + 1;
    const name = state.newName.trim() || `Neue${type === 'planet' ? 'r Planet' : type === 'moon' ? 'r Mond' : type === 'sun' ? ' Sonne' : ' Station'} ${count}`;
    const o = {
      id: uid('o'), name, type, x: Math.round(parent ? parent.x : w.x), y: Math.round(parent ? parent.y : w.y),
      region: parent ? parent.region : (regionAt(w.x, w.y) || 'Wilder Raum'), desc: '', parent: parent ? parent.id : null, from: null, to: null
    };
    state.tl.objects.push(o);
    state.selected = o.id; state.newName = '';
    const inp = $('#newName'); if (inp) inp.value = '';
    afterChange(true);
    toast(`${TYPE_LABEL[type]} „${name}“ angelegt${parent ? ' bei ' + parent.name : ''}`);
  }

  window.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { if (tag !== 'input' && tag !== 'textarea') { e.preventDefault(); undo(); } return; }
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.key === 'ArrowLeft') setEra(state.eraIdx - 1);
    else if (e.key === 'ArrowRight') setEra(state.eraIdx + 1);
    else if ((e.key === 'Delete') && editable() && state.selected) deleteObject(state.selected);
    else if (e.key === 'Escape') { state.selected = null; renderInfo(); draw(); }
  });

  let toastTimer;
  function toast(msg) {
    const t = $('#toolHint'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; updateToolHint(); }, 2200);
  }
  const TOOL_HINTS = {
    select: 'Ziehen: Objekt verschieben · Klick: auswählen',
    assign: 'Klick auf ein Objekt: der aktiven Fraktion zuweisen',
    region: 'Klick in eine Region: ganze Region der Fraktion geben / entziehen',
    paint: 'Klicken & ziehen: Einflussgebiet malen',
    erase: 'Klicken & ziehen: gemalte Einflussgebiete radieren',
    add: 'Klick auf die Karte: neues Objekt setzen'
  };
  function updateToolHint() {
    const t = $('#toolHint');
    if (editable()) { t.textContent = TOOL_HINTS[state.tool]; t.hidden = false; } else t.hidden = true;
    canvas.classList.toggle('tool', editable() && state.tool !== 'select');
  }

  // ------------------------------------------------------------- UI: Filter
  document.querySelectorAll('#left input[data-type]').forEach(cb => {
    cb.checked = !!state.types[cb.dataset.type];
    cb.addEventListener('change', () => { state.types[cb.dataset.type] = cb.checked; saveSoon(); draw(); });
  });
  [['#optInfluence', 'influence'], ['#optRegions', 'regions'], ['#optGrid', 'grid'], ['#optNames', 'names']].forEach(([sel, key]) => {
    const cb = $(sel); cb.checked = !!state.opts[key];
    cb.addEventListener('change', () => { state.opts[key] = cb.checked; saveSoon(); draw(); });
  });
  $('#facAll').addEventListener('click', e => { e.preventDefault(); state.hiddenFactions.clear(); renderFactionFilter(); saveSoon(); draw(); });
  $('#facNone').addEventListener('click', e => { e.preventDefault(); state.tl.factions.forEach(f => state.hiddenFactions.add(f.id)); renderFactionFilter(); saveSoon(); draw(); });

  function renderFactionFilter() {
    const e = era();
    const present = new Set();
    if (e) { Object.values(e.control).forEach(f => present.add(f)); Object.values(e.regionClaims || {}).forEach(f => present.add(f)); (e.zones || []).forEach(z => present.add(z.faction)); }
    $('#factionFilter').innerHTML = state.tl.factions.map(f => `
      <label class="chk ${present.has(f.id) ? '' : 'absent'}"><input type="checkbox" data-fac="${esc(f.id)}" ${state.hiddenFactions.has(f.id) ? '' : 'checked'}>
      <span class="swatch" style="background:${esc(f.color)}"></span>${esc(f.name)}</label>`).join('') || '<p class="hint">Keine Fraktionen angelegt.</p>';
    document.querySelectorAll('#factionFilter input').forEach(cb => cb.addEventListener('change', () => {
      cb.checked ? state.hiddenFactions.delete(cb.dataset.fac) : state.hiddenFactions.add(cb.dataset.fac);
      saveSoon(); draw();
    }));
  }

  function renderSearchList() {
    $('#searchList').innerHTML = state.tl.objects.slice().sort((a, b) => a.name.localeCompare(b.name))
      .map(o => `<option value="${esc(o.name)}">${TYPE_LABEL[o.type]}</option>`).join('');
  }
  $('#search').addEventListener('change', () => {
    const q = $('#search').value.trim().toLowerCase(); if (!q) return;
    const o = state.tl.objects.find(o => o.name.toLowerCase() === q) || state.tl.objects.find(o => o.name.toLowerCase().includes(q));
    if (o) { if (!state.types[o.type]) { state.types[o.type] = true; document.querySelector(`#left input[data-type=${o.type}]`).checked = true; } centerOn(o, 1.4); }
  });
  $('#search').addEventListener('keydown', e => { if (e.key === 'Enter') $('#search').dispatchEvent(new Event('change')); });

  // ------------------------------------------------------------- UI: Zeitleiste
  function setEra(i) {
    if (!state.tl.eras.length) return;
    state.eraIdx = Math.max(0, Math.min(state.tl.eras.length - 1, i));
    renderTimebar(); renderFactionFilter(); renderInfo(); if (state.mode === 'edit') renderEditor(); saveSoon(); draw();
  }
  $('#eraSlider').addEventListener('input', e => setEra(+e.target.value));
  $('#eraPrev').addEventListener('click', () => setEra(state.eraIdx - 1));
  $('#eraNext').addEventListener('click', () => setEra(state.eraIdx + 1));
  function renderTimebar() {
    const eras = state.tl.eras, s = $('#eraSlider');
    s.max = Math.max(0, eras.length - 1); s.value = state.eraIdx; s.disabled = eras.length < 2;
    $('#eraTicks').innerHTML = eras.map((e, i) => {
      const left = eras.length > 1 ? (i / (eras.length - 1)) * 100 : 50;
      const label = i === state.eraIdx || eras.length <= 9 ? fmtYear(e.year) : '·';
      return `<span data-i="${i}" class="${i === state.eraIdx ? 'cur' : ''}" style="left:${left}%" title="${esc(e.name)}">${label}</span>`;
    }).join('');
    $('#eraTicks').querySelectorAll('span').forEach(sp => sp.addEventListener('click', () => setEra(+sp.dataset.i)));
    const e = era();
    $('#eraName').textContent = e ? e.name : 'Kein Zeitalter';
    $('#eraYear').textContent = e ? fmtYear(e.year) : '';
    $('#eraDesc').textContent = e ? (e.desc || '') : 'Lege im Editor ein Zeitalter an.';
  }

  // ------------------------------------------------------------- UI: Info
  function renderInfo() {
    const box = $('#info');
    const o = state.tl.objects.find(x => x.id === state.selected);
    if (!o) {
      box.innerHTML = `<p class="hint">Klicke ein Objekt auf der Karte an, um Details zu sehen.<br><br>
        <b>Steuerung:</b> Mausrad = Zoom · Ziehen = Karte bewegen · ←/→ = Zeitalter wechseln${state.mode === 'edit' ? ' · Strg+Z = Rückgängig · Entf = Objekt löschen' : ''}</p>
        <p class="hint">Positionen und Einflussgebiete der Kanon-Zeitlinie sind Annäherungen.</p>`;
      return;
    }
    const m = objById();
    const fac = controllerOf(o);
    const parent = o.parent && m[o.parent];
    const kids = (childrenOf[o.id] || []);
    if (!editable()) {
      box.innerHTML = `
        <div class="info-title">${esc(o.name)}</div>
        <div class="info-type">${TYPE_LABEL[o.type]}${existsNow(o) ? '' : ' · <span style="color:#e5534b">existiert in diesem Zeitalter nicht</span>'}</div>
        <div class="kv">
          <span class="k">Region</span><span>${esc(o.region || '–')}</span>
          <span class="k">Kontrolle</span><span>${fac ? `<span style="color:${esc(fac.color)}">■</span> ${esc(fac.name)}` : 'neutral / unbekannt'}</span>
          ${parent ? `<span class="k">Gehört zu</span><span><a href="#" data-go="${esc(parent.id)}">${esc(parent.name)}</a></span>` : ''}
          ${kids.length ? `<span class="k">Umfasst</span><span>${kids.map(k => `<a href="#" data-go="${esc(k.id)}">${esc(k.name)}</a>`).join(', ')}</span>` : ''}
          ${(o.from != null && o.from !== '') || (o.to != null && o.to !== '') ? `<span class="k">Existiert</span><span>${fmtYear(o.from)} bis ${fmtYear(o.to)}</span>` : ''}
        </div>
        <p>${esc(o.desc || '')}</p>`;
      box.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); centerOn(m[a.dataset.go]); }));
      return;
    }
    const parentOpts = state.tl.objects.filter(x => x.id !== o.id && !isDescendant(x, o)).sort((a, b) => a.name.localeCompare(b.name))
      .map(x => `<option value="${esc(x.id)}" ${x.id === o.parent ? 'selected' : ''}>${esc(x.name)} (${TYPE_LABEL[x.type]})</option>`).join('');
    const facOpts = `<option value="">— neutral —</option>` + state.tl.factions.map(f => `<option value="${esc(f.id)}" ${fac && fac.id === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
    box.innerHTML = `
      <h3>Objekt bearbeiten</h3>
      <label class="field"><span>Name</span><input id="oName" value="${esc(o.name)}"></label>
      <div class="row">
        <label class="field"><span>Typ</span><select id="oType">${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}" ${k === o.type ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Region</span><select id="oRegion">${REGIONS.map(r => `<option ${r === o.region ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>Gehört zu (umkreist)</span><select id="oParent"><option value="">— frei im Raum —</option>${parentOpts}</select></label>
      <label class="field"><span>Kontrolle im Zeitalter „${esc(era() ? era().name : '')}“${o.type === 'moon' || o.type === 'station' ? (o.parent ? ' (gilt fürs ganze System)' : '') : ''}</span><select id="oFac">${facOpts}</select></label>
      <div class="row">
        <label class="field"><span>Existiert ab (Jahr, VSY = minus)</span><input id="oFrom" type="number" value="${o.from ?? ''}" placeholder="immer"></label>
        <label class="field"><span>bis</span><input id="oTo" type="number" value="${o.to ?? ''}" placeholder="immer"></label>
      </div>
      <label class="field"><span>Beschreibung</span><textarea id="oDesc">${esc(o.desc || '')}</textarea></label>
      <div class="row"><button id="oCenter">Zentrieren</button><button id="oDelete" class="danger">Löschen</button></div>`;
    const bind = (id, ev, fn) => $(id).addEventListener(ev, fn);
    let undoPushed = false;
    const mark = () => { if (!undoPushed) { pushUndo(); undoPushed = true; } };
    bind('#oName', 'input', e => { mark(); o.name = e.target.value; saveSoon(); draw(); renderSearchList(); });
    bind('#oType', 'change', e => { mark(); o.type = e.target.value; afterChange(); });
    bind('#oRegion', 'change', e => { mark(); o.region = e.target.value; afterChange(); });
    bind('#oParent', 'change', e => {
      mark(); const p = m[e.target.value];
      if (!p) { const cur = posOf(o); o.x = Math.round(cur.x); o.y = Math.round(cur.y); o.parent = null; }
      else { o.parent = p.id; o.region = p.region; }
      afterChange();
    });
    bind('#oFac', 'change', e => {
      mark(); const k = controlKey(o);
      if (e.target.value) era().control[k] = e.target.value; else delete era().control[k];
      afterChange();
    });
    bind('#oFrom', 'change', e => { mark(); o.from = e.target.value === '' ? null : +e.target.value; afterChange(); });
    bind('#oTo', 'change', e => { mark(); o.to = e.target.value === '' ? null : +e.target.value; afterChange(); });
    bind('#oDesc', 'input', e => { mark(); o.desc = e.target.value; saveSoon(); });
    bind('#oCenter', 'click', () => centerOn(o));
    bind('#oDelete', 'click', () => deleteObject(o.id));
  }
  function isDescendant(x, o) { const m = objById(); let c = x, n = 0; while (c && c.parent && n++ < 10) { if (c.parent === o.id) return true; c = m[c.parent]; } return false; }
  function deleteObject(id) {
    const o = state.tl.objects.find(x => x.id === id); if (!o) return;
    const kids = state.tl.objects.filter(x => x.parent === id);
    if (!confirm(`„${o.name}“ löschen?${kids.length ? `\n${kids.length} zugehörige Objekte bleiben an derselben Stelle erhalten.` : ''}`)) return;
    pushUndo();
    rebuildTree(); computePositions();
    for (const k of kids) { const p = posOf(k); k.x = Math.round(p.x); k.y = Math.round(p.y); k.parent = o.parent || null; }
    state.tl.objects = state.tl.objects.filter(x => x.id !== id);
    for (const e of state.tl.eras) delete e.control[id];
    state.selected = null; afterChange(true);
  }

  // ------------------------------------------------------------- UI: Editor
  function renderEditor() {
    const ed = $('#editor');
    if (state.mode !== 'edit') { ed.hidden = true; return; }
    ed.hidden = false;
    if (state.tl.readonly) {
      ed.innerHTML = `<div class="readonly-note"><b>Die Kanon-Zeitlinie ist schreibgeschützt.</b><br>
        Lege eine Kopie an, um Fraktionen, Einflussgebiete, Zeitalter und Himmelskörper frei zu bearbeiten.</div>
        <button id="edCopy" class="primary" style="width:100%">Bearbeitbare Kopie anlegen</button>
        <button id="edNew" style="width:100%;margin-top:6px">Leere Zeitlinie anlegen</button>`;
      $('#edCopy').addEventListener('click', () => duplicateTimeline());
      $('#edNew').addEventListener('click', () => newTimelineDialog());
      return;
    }
    const tl = state.tl, e = era();
    if (state.activeFaction && !facById(state.activeFaction)) state.activeFaction = null;
    if (!state.activeFaction && tl.factions[0]) state.activeFaction = tl.factions[0].id;
    ed.innerHTML = `
      <div class="ed-block">
        <h3>Zeitlinie</h3>
        <label class="field"><span>Name</span><input id="tlName" value="${esc(tl.name)}"></label>
      </div>
      <div class="ed-block">
        <h3>Zeitalter <button id="eraAdd" title="Neues Zeitalter (übernimmt das aktuelle)">＋</button></h3>
        <div class="list" id="eraList">${tl.eras.map((x, i) => `
          <div class="list-item ${i === state.eraIdx ? 'cur' : ''}" data-i="${i}">
            <input type="number" class="eraYear" value="${x.year}" title="Jahr (negativ = VSY)">
            <input type="text" class="eraName" value="${esc(x.name)}">
            <button class="eraDel" title="Löschen">✕</button>
          </div>`).join('')}</div>
        ${e ? `<label class="field" style="margin-top:6px"><span>Beschreibung von „${esc(e.name)}“</span><textarea id="eraDescIn">${esc(e.desc || '')}</textarea></label>` : ''}
      </div>
      <div class="ed-block">
        <h3>Fraktionen <button id="facAdd" title="Neue Fraktion">＋</button></h3>
        <div class="list" id="facList">${tl.factions.map(f => `
          <div class="list-item ${f.id === state.activeFaction ? 'cur' : ''}" data-id="${esc(f.id)}" title="Klicken = als aktive Fraktion für Werkzeuge wählen">
            <input type="color" class="facColor" value="${esc(f.color)}">
            <input type="text" class="facName" value="${esc(f.name)}">
            <input type="number" class="facReach" value="${f.reach}" min="20" max="600" step="10" title="Einflussradius um kontrollierte Systeme">
            <button class="facDel" title="Löschen">✕</button>
          </div>`).join('') || '<p class="hint">Noch keine Fraktion – lege eine mit ＋ an.</p>'}</div>
        <p class="hint">Zahl = Einflussradius um jedes kontrollierte System.</p>
      </div>
      <div class="ed-block">
        <h3>Werkzeuge</h3>
        <label class="field"><span>Aktive Fraktion</span><select id="activeFac"><option value="">— neutral (entfernen) —</option>${tl.factions.map(f => `<option value="${esc(f.id)}" ${f.id === state.activeFaction ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>
        <div class="tools">
          <button data-tool="select">✥ Auswählen/Verschieben</button>
          <button data-tool="assign">⚑ System zuweisen</button>
          <button data-tool="region">◍ Region zuweisen</button>
          <button data-tool="paint">✎ Einfluss malen</button>
          <button data-tool="erase">⌫ Radieren</button>
          <button data-tool="add">＋ Objekt anlegen</button>
        </div>
        <div id="toolOpts"></div>
        <p class="hint">Strg+Z macht den letzten Schritt rückgängig.</p>
      </div>`;
    // Zeitlinie
    $('#tlName').addEventListener('change', ev => { pushUndo(); tl.name = ev.target.value || 'Ohne Namen'; renderTlSelect(); saveSoon(); });
    // Zeitalter
    $('#eraAdd').addEventListener('click', () => {
      pushUndo();
      const base = era();
      const ne = base ? JSON.parse(JSON.stringify(base)) : { control: {}, regionClaims: {}, zones: [], desc: '' };
      ne.id = uid('era'); ne.name = 'Neues Zeitalter'; ne.year = base ? base.year + 1 : 0; ne.desc = '';
      tl.eras.push(ne); sortEras(); state.eraIdx = tl.eras.indexOf(ne); afterChange(true);
    });
    ed.querySelectorAll('#eraList .list-item').forEach(row => {
      const i = +row.dataset.i, x = tl.eras[i];
      row.addEventListener('click', ev => { if (ev.target.tagName !== 'INPUT' && ev.target.tagName !== 'BUTTON') setEra(i); });
      row.querySelector('.eraName').addEventListener('focus', () => { if (state.eraIdx !== i) { state.eraIdx = i; renderTimebar(); renderFactionFilter(); draw(); highlightEraRow(); } });
      row.querySelector('.eraName').addEventListener('change', ev => { pushUndo(); x.name = ev.target.value; renderTimebar(); saveSoon(); renderEditor(); });
      row.querySelector('.eraYear').addEventListener('change', ev => { pushUndo(); x.year = +ev.target.value || 0; sortEras(); state.eraIdx = tl.eras.indexOf(x); afterChange(true); });
      row.querySelector('.eraDel').addEventListener('click', () => {
        if (tl.eras.length <= 1) { alert('Mindestens ein Zeitalter muss bestehen bleiben.'); return; }
        if (!confirm(`Zeitalter „${x.name}“ löschen?`)) return;
        pushUndo(); tl.eras.splice(i, 1); state.eraIdx = Math.min(state.eraIdx, tl.eras.length - 1); afterChange(true);
      });
    });
    const ed2 = $('#eraDescIn');
    if (ed2) { let p = false; ed2.addEventListener('input', ev => { if (!p) { pushUndo(); p = true; } e.desc = ev.target.value; renderTimebar(); saveSoon(); }); }
    // Fraktionen
    $('#facAdd').addEventListener('click', () => {
      pushUndo();
      const hue = Math.floor(Math.random() * 360);
      const f = { id: uid('f'), name: 'Neue Fraktion', color: hslHex(hue, 70, 55), reach: 120 };
      tl.factions.push(f); state.activeFaction = f.id; afterChange(true);
      setTimeout(() => { const inp = document.querySelector(`#facList [data-id="${f.id}"] .facName`); if (inp) { inp.focus(); inp.select(); } }, 0);
    });
    ed.querySelectorAll('#facList .list-item').forEach(row => {
      const f = facById(row.dataset.id);
      row.addEventListener('click', ev => { if (ev.target.tagName === 'BUTTON' || ev.target.type === 'color') return; state.activeFaction = f.id; ed.querySelectorAll('#facList .list-item').forEach(r => r.classList.toggle('cur', r === row)); $('#activeFac').value = f.id; draw(); });
      row.querySelector('.facColor').addEventListener('input', ev => { f.color = ev.target.value; renderFactionFilter(); saveSoon(); draw(); });
      row.querySelector('.facColor').addEventListener('change', () => { renderInfo(); });
      row.querySelector('.facName').addEventListener('change', ev => { pushUndo(); f.name = ev.target.value || 'Ohne Namen'; renderFactionFilter(); renderInfo(); saveSoon(); renderEditor(); });
      row.querySelector('.facReach').addEventListener('change', ev => { pushUndo(); f.reach = Math.max(10, +ev.target.value || 120); saveSoon(); draw(); });
      row.querySelector('.facDel').addEventListener('click', () => {
        if (!confirm(`Fraktion „${f.name}“ löschen? Ihre Gebiete werden in allen Zeitaltern entfernt.`)) return;
        pushUndo();
        tl.factions = tl.factions.filter(x => x.id !== f.id);
        for (const x of tl.eras) {
          for (const k in x.control) if (x.control[k] === f.id) delete x.control[k];
          for (const k in (x.regionClaims || {})) if (x.regionClaims[k] === f.id) delete x.regionClaims[k];
          x.zones = (x.zones || []).filter(z => z.faction !== f.id);
        }
        afterChange(true);
      });
    });
    $('#activeFac').addEventListener('change', ev => { state.activeFaction = ev.target.value || null; ed.querySelectorAll('#facList .list-item').forEach(r => r.classList.toggle('cur', r.dataset.id === state.activeFaction)); draw(); });
    ed.querySelectorAll('[data-tool]').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === state.tool);
      b.addEventListener('click', () => { state.tool = b.dataset.tool; renderEditor(); updateToolHint(); draw(); });
    });
    renderToolOpts();
  }
  function highlightEraRow() { document.querySelectorAll('#eraList .list-item').forEach(r => r.classList.toggle('cur', +r.dataset.i === state.eraIdx)); }
  function renderToolOpts() {
    const box = $('#toolOpts'); if (!box) return;
    if (state.tool === 'paint' || state.tool === 'erase') {
      box.innerHTML = `<label class="field" style="margin-top:8px"><span>Pinselgröße: <b id="brushVal">${state.brush}</b></span><input type="range" id="brush" min="20" max="400" step="5" value="${state.brush}"></label>`;
      $('#brush').addEventListener('input', e => { state.brush = +e.target.value; $('#brushVal').textContent = state.brush; draw(); });
    } else if (state.tool === 'add') {
      box.innerHTML = `
        <div class="row" style="margin-top:8px">
          <label class="field fixed" style="width:110px"><span>Typ</span><select id="newType">${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}" ${k === state.newType ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="field"><span>Name</span><input id="newName" placeholder="optional" value="${esc(state.newName)}"></label>
        </div>
        <label class="chk"><input type="checkbox" id="attach" ${state.attach ? 'checked' : ''}>an nahes Objekt hängen (Mond → Planet, Planet → Sonne)</label>`;
      $('#newType').addEventListener('change', e => state.newType = e.target.value);
      $('#newName').addEventListener('input', e => state.newName = e.target.value);
      $('#attach').addEventListener('change', e => state.attach = e.target.checked);
    } else box.innerHTML = '';
  }
  function sortEras() { state.tl.eras.sort((a, b) => a.year - b.year); }
  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
    return '#' + f(0) + f(8) + f(4);
  }

  // ------------------------------------------------------------- Zeitlinien-Verwaltung
  function renderTlSelect() {
    $('#tlSelect').innerHTML = state.timelines.map(t => `<option value="${esc(t.id)}" ${t.id === state.tl.id ? 'selected' : ''}>${esc(t.name)}${t.readonly ? ' 🔒' : ''}</option>`).join('');
    $('#btnDelTl').disabled = !!state.tl.readonly;
  }
  function switchTimeline(id) {
    const t = state.timelines.find(x => x.id === id); if (!t) return;
    state.tl = t; state.eraIdx = Math.min(state.eraIdx, Math.max(0, t.eras.length - 1));
    state.selected = null; afterChange(true);
  }
  $('#tlSelect').addEventListener('change', e => switchTimeline(e.target.value));
  function duplicateTimeline() {
    const copy = JSON.parse(JSON.stringify(state.tl));
    copy.id = uid('tl'); copy.readonly = false; delete copy._file;
    copy.name = (state.tl.readonly ? 'Meine Zeitlinie' : state.tl.name + ' (Kopie)');
    state.timelines.push(copy); state.tl = copy;
    state.mode = 'edit'; afterChange(true); setModeButtons();
    toast('Kopie angelegt – du kannst jetzt alles bearbeiten');
  }
  function newTimelineDialog() {
    modal('Neue Zeitlinie', `
      <label class="field"><span>Name</span><input id="mTlName" value="Meine Zeitlinie"></label>
      <label class="radio"><input type="radio" name="mStart" value="objects" checked><span><b>Mit Kanon-Himmelskörpern</b><br><span class="dim">Alle Planeten, Sonnen, Monde & Stationen – aber keine Fraktionen und nur ein leeres Zeitalter.</span></span></label>
      <label class="radio"><input type="radio" name="mStart" value="copy"><span><b>Kopie der aktuellen Zeitlinie</b><br><span class="dim">Alles übernehmen und abändern.</span></span></label>
      <label class="radio"><input type="radio" name="mStart" value="empty"><span><b>Komplett leer</b><br><span class="dim">Eigene Galaxis von Grund auf.</span></span></label>`,
      () => {
        const name = $('#mTlName').value.trim() || 'Meine Zeitlinie';
        const mode = document.querySelector('input[name=mStart]:checked').value;
        let t;
        if (mode === 'copy') { t = JSON.parse(JSON.stringify(state.tl)); }
        else {
          t = { factions: [], objects: mode === 'objects' ? JSON.parse(JSON.stringify(canonTimeline().objects)) : [], eras: [{ id: uid('era'), name: 'Zeitalter 1', year: 0, desc: '', control: {}, regionClaims: {}, zones: [] }] };
        }
        t.id = uid('tl'); t.name = name; t.readonly = false; delete t._file;
        state.timelines.push(t); state.tl = t; state.eraIdx = 0; state.mode = 'edit'; setModeButtons(); afterChange(true);
      });
    setTimeout(() => { $('#mTlName').focus(); $('#mTlName').select(); }, 0);
  }
  $('#btnNewTl').addEventListener('click', newTimelineDialog);
  $('#btnDupTl').addEventListener('click', duplicateTimeline);
  $('#btnDelTl').addEventListener('click', () => {
    if (state.tl.readonly) return;
    if (!confirm(`Zeitlinie „${state.tl.name}“ wirklich löschen? Das kann nicht rückgängig gemacht werden.\nTipp: Vorher exportieren.`)) return;
    if (FS && state.tl._file) { const f = state.tl._file; lastWritten[f] = null; FS.remove(f).catch(() => {}); }
    state.timelines = state.timelines.filter(t => t !== state.tl);
    state.tl = state.timelines[0]; state.eraIdx = 0; state.selected = null; state.undo = []; afterChange(true);
  });
  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  // GeoJSON: Galaxie-Koordinaten werden so skaliert, dass sie in gültige Längen/Breiten passen
  // (Zentrum = 0/0, 1 Einheit = 15 Kartenpixel, Norden = oben). So lassen sich die Daten auch
  // in geojson.io oder QGIS öffnen und bearbeiten.
  const GJ = 15;
  const toGJ = (x, y) => [+((x - GEO.center.x) / GJ).toFixed(4), +((GEO.center.y - y) / GJ).toFixed(4)];
  const fromGJ = ([lon, lat]) => [Math.round(GEO.center.x + lon * GJ), Math.round(GEO.center.y - lat * GJ)];
  function toGeoJSON(t) {
    rebuildTree(); computePositions();
    const features = [];
    for (const o of t.objects) {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: toGJ(o.x, o.y) },
        properties: { kind: 'object', id: o.id, name: o.name, type: o.type, region: o.region || null, parent: o.parent || null, from: o.from ?? null, to: o.to ?? null, desc: o.desc || '' } });
    }
    for (const e of t.eras) for (const z of (e.zones || [])) {
      const f = t.factions.find(x => x.id === z.faction);
      const props = { kind: 'zone', era: e.id, eraName: e.name, faction: z.faction, factionName: f ? f.name : '', fill: f ? f.color : '#888', 'fill-opacity': 0.3, stroke: f ? f.color : '#888' };
      if (Array.isArray(z.poly) && z.poly.length > 2) {
        const ring = z.poly.map(([x, y]) => toGJ(x, y)); ring.push(ring[0]);
        features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: props });
      } else {
        features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: toGJ(z.x, z.y) }, properties: Object.assign(props, { radius: +(z.r / GJ).toFixed(3) }) });
      }
    }
    return {
      type: 'FeatureCollection',
      swgm: {
        format: 'swgm-geojson', version: 1, name: t.name,
        hinweis: 'Punkte (kind=object) sind Himmelskörper, kind=zone sind gemalte Einflussgebiete (Polygon oder Punkt+radius). Fraktionen, Zeitalter und Kontrolle stehen hier unter swgm.',
        factions: t.factions,
        eras: t.eras.map(e => ({ id: e.id, name: e.name, year: e.year, desc: e.desc || '', control: e.control, regionClaims: e.regionClaims || {} }))
      },
      features
    };
  }
  function fromGeoJSON(g) {
    const meta = g.swgm || {};
    const t = { id: uid('tl'), name: meta.name || 'GeoJSON-Import', factions: meta.factions || [], objects: [], eras: [] };
    t.eras = (meta.eras || []).map(e => ({ id: e.id || uid('era'), name: e.name || 'Zeitalter', year: +e.year || 0, desc: e.desc || '', control: e.control || {}, regionClaims: e.regionClaims || {}, zones: [] }));
    if (!t.eras.length) t.eras.push({ id: uid('era'), name: 'Zeitalter 1', year: 0, desc: '', control: {}, regionClaims: {}, zones: [] });
    const facByName = n => t.factions.find(f => f.name === n);
    for (const ft of g.features || []) {
      const p = ft.properties || {}, geo = ft.geometry || {};
      const kind = p.kind || (geo.type === 'Point' ? 'object' : 'zone');
      if (kind === 'object' && geo.type === 'Point') {
        const [x, y] = fromGJ(geo.coordinates);
        t.objects.push({ id: p.id || uid('o'), name: p.name || 'Unbenannt', type: TYPE_LABEL[p.type] ? p.type : 'planet', x, y,
          region: p.region || regionAt(x, y) || 'Wilder Raum', parent: p.parent || null, from: p.from ?? null, to: p.to ?? null, desc: p.desc || '' });
      } else if (kind === 'zone') {
        let era = t.eras.find(e => e.id === p.era) || t.eras.find(e => e.name === p.eraName) || t.eras[0];
        let fid = p.faction;
        if (!t.factions.some(f => f.id === fid)) {
          const byName = p.factionName && facByName(p.factionName);
          if (byName) fid = byName.id;
          else { fid = uid('f'); t.factions.push({ id: fid, name: p.factionName || 'Fraktion ' + (t.factions.length + 1), color: p.fill || '#888888', reach: 120 }); }
        }
        if (geo.type === 'Polygon' || geo.type === 'MultiPolygon') {
          const polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
          for (const poly of polys) { const ring = (poly[0] || []).map(fromGJ); if (ring.length > 3) era.zones.push({ id: uid('z'), faction: fid, poly: ring.slice(0, -1) }); }
        } else if (geo.type === 'Point') {
          const [x, y] = fromGJ(geo.coordinates);
          era.zones.push({ id: uid('z'), faction: fid, x, y, r: Math.round((+p.radius || 6) * GJ) });
        }
      }
    }
    t.eras.sort((a, b) => a.year - b.year);
    return t;
  }

  $('#btnExport').addEventListener('click', () => {
    modal('Zeitlinie exportieren', `
      <label class="radio"><input type="radio" name="mExp" value="json" checked><span><b>JSON</b> (.swgm.json)<br><span class="dim">Vollständige Sicherung, zum Teilen oder Bearbeiten im Texteditor.</span></span></label>
      <label class="radio"><input type="radio" name="mExp" value="geojson"><span><b>GeoJSON</b> (.geojson)<br><span class="dim">Für geojson.io, QGIS & Co. Einflussgebiete können dort als Polygone gezeichnet werden.</span></span></label>`,
      () => {
        const fmt = document.querySelector('input[name=mExp]:checked').value;
        const base = slugify(state.tl.name);
        if (fmt === 'json') download(base + '.swgm.json', serialize(state.tl), 'application/json');
        else download(base + '.geojson', JSON.stringify(toGeoJSON(state.tl), null, 2), 'application/geo+json');
      });
  });
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    try {
      const t = parseTimeline(await file.text());
      t.id = uid('tl'); delete t._file;
      if (state.timelines.some(x => x.name === t.name)) t.name += ' (Import)';
      state.timelines.push(t); state.tl = t; state.eraIdx = 0; afterChange(true);
      toast(`„${t.name}“ importiert`);
    } catch (err) { alert('Import fehlgeschlagen: ' + err.message); }
  });

  // JSON direkt in der App bearbeiten
  $('#btnJson').addEventListener('click', () => {
    if (state.tl.readonly) { alert('Die Kanon-Zeitlinie ist schreibgeschützt. Lege zuerst eine Kopie an (Editor → „Bearbeitbare Kopie anlegen“).'); return; }
    modal(`JSON bearbeiten – ${state.tl.name}`, `
      <p class="hint" style="margin-top:0">Hier steht die komplette Zeitlinie. Änderungen werden beim Klick auf „Übernehmen“ geprüft und gespeichert.
      Koordinaten: x nach rechts, y nach unten, Galaxiezentrum bei ${GEO.center.x}/${GEO.center.y}. Jahre: negativ = VSY.</p>
      <textarea id="jsonText" spellcheck="false"></textarea><div id="jsonErr" class="hint" style="color:#e5534b"></div>`,
      () => {
        let t;
        try { t = parseTimeline($('#jsonText').value); }
        catch (err) { $('#jsonErr').textContent = 'Fehler: ' + err.message; return false; }
        pushUndo();
        const i = state.timelines.indexOf(state.tl);
        t.id = state.tl.id; t._file = state.tl._file;
        state.timelines[i] = t; state.tl = t;
        if (state.eraIdx >= t.eras.length) state.eraIdx = t.eras.length - 1;
        afterChange(true); toast('JSON übernommen');
      }, { wide: true, ok: 'Übernehmen' });
    $('#jsonText').value = serialize(state.tl);
  });
  $('#btnFolder').addEventListener('click', () => {
    if (!FS) { alert('Der Datenordner ist nur in der installierten App verfügbar.'); return; }
    FS.openFolder(state.tl.readonly ? null : fileFor(state.tl));
    if (!state.tl.readonly) saveSoon();
  });

  // ------------------------------------------------------------- Modus
  function setModeButtons() {
    $('#tabView').classList.toggle('active', state.mode === 'view');
    $('#tabEdit').classList.toggle('active', state.mode === 'edit');
  }
  $('#tabView').addEventListener('click', () => { state.mode = 'view'; setModeButtons(); afterChange(true); });
  $('#tabEdit').addEventListener('click', () => { state.mode = 'edit'; setModeButtons(); afterChange(true); });

  // ------------------------------------------------------------- Modal
  function modal(title, html, onOk, opt = {}) {
    $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html; $('#modal').hidden = false;
    $('#modal .modal-box').classList.toggle('wide', !!opt.wide);
    $('#modalOk').textContent = opt.ok || 'OK';
    const close = () => { $('#modal').hidden = true; $('#modalOk').onclick = $('#modalCancel').onclick = null; };
    $('#modalCancel').onclick = close;
    $('#modalOk').onclick = () => { let r; try { r = onOk(); } catch (e) { alert(e.message); } if (r !== false) close(); };
    $('#modalBody').onkeydown = e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') $('#modalOk').click(); };
  }

  // ------------------------------------------------------------- Zoom-Knöpfe
  $('#zoomIn').addEventListener('click', () => zoomAt(W / 2, H / 2, 1.4));
  $('#zoomOut').addEventListener('click', () => zoomAt(W / 2, H / 2, 1 / 1.4));
  $('#zoomFit').addEventListener('click', fitView);

  // ------------------------------------------------------------- Gesamt-Update
  function afterChange(full) {
    rebuildTree();
    if (full) { renderTlSelect(); renderTimebar(); renderSearchList(); renderEditor(); }
    else if (state.mode === 'edit') { renderTimebar(); }
    renderFactionFilter(); renderInfo(); updateToolHint(); saveSoon(); draw();
  }

  window.addEventListener('resize', resize);
  (async function boot() {
    if (FS) {
      try { await loadFromFS(); } catch (e) { console.error(e); }
      FS.onChange(onExternalChange);
    }
    state.tl = state.timelines.find(t => t.id === settings.active) || state.timelines[0];
    if (state.eraIdx >= state.tl.eras.length) state.eraIdx = 0;
    setModeButtons();
    afterChange(true);
    resize();
    fitView();
    if (FS) writeTimelines(); // übernommene Altdaten als Dateien ablegen
  })();
  // Für Tests
  window.__swgm = { state, setEra, regionAt };
})();
