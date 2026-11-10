/* Ascandir RP-Manager – Fantasy-Karten (Vektor)
   Gemeinsames Modul für Oberfläche und Server:
   - versioniertes Datenmodell (format "ascandir-map") mit Migration
   - Validierung nicht vertrauenswürdiger Eingaben (Typen, Koordinaten, Farben, Größen, IDs)
   - atomare Batch-Änderungen (anlegen/ändern/verschieben/skalieren/löschen per ID)
   - räumliche Abfragen
   - Darstellung: baut aus Geometrie + Stil eine Liste von Zeichen-Primitiven (SVG-Pfade + Texte).
     Dieselben Primitive werden im Browser als Path2D auf das Canvas gezeichnet und für den SVG-Export genutzt.
   Keine Abhängigkeiten. Läuft im Browser (window.IAM_FMAP) und in Node (globalThis.IAM_FMAP / module.exports). */
(function (root) {
  'use strict';

  const FORMAT = 'ascandir-map';
  const VERSION = 1;
  const LAYERS = ['terrain', 'water', 'vegetation', 'routes', 'borders', 'places', 'labels', 'decor'];
  const LIMITS = { assets: 200, assetDataUrl: 3000000, features: 20000, pointsPerFeature: 5000, pointsPerMap: 250000, batch: 500, text: 200, name: 100, meta: 2000, query: 500 };
  const DEFAULT_SIZE = { width: 2300, height: 1700 }; // = Koordinatensystem der Fantasy-Welten in der Karte

  // Typen: Standard-Ebene und erlaubte Geometrien
  const TYPES = {
    land: { layer: 'terrain', geoms: ['polygon'] },
    island: { layer: 'terrain', geoms: ['polygon'] },
    area: { layer: 'terrain', geoms: ['polygon'] },
    mountains: { layer: 'terrain', geoms: ['polygon', 'line', 'group'] },
    mountain: { layer: 'terrain', geoms: ['point'] },
    hills: { layer: 'terrain', geoms: ['polygon', 'line', 'group'] },
    lake: { layer: 'water', geoms: ['polygon'] },
    river: { layer: 'water', geoms: ['line'] },
    forest: { layer: 'vegetation', geoms: ['polygon', 'line', 'group'] },
    swamp: { layer: 'vegetation', geoms: ['polygon'] },
    desert: { layer: 'vegetation', geoms: ['polygon'] },
    road: { layer: 'routes', geoms: ['line'] },
    path: { layer: 'routes', geoms: ['line'] },
    line: { layer: 'routes', geoms: ['line'] },
    border: { layer: 'borders', geoms: ['line', 'polygon'] },
    region: { layer: 'borders', geoms: ['polygon'] },
    city: { layer: 'places', geoms: ['point'] },
    town: { layer: 'places', geoms: ['point'] },
    village: { layer: 'places', geoms: ['point'] },
    fortress: { layer: 'places', geoms: ['point'] },
    tower: { layer: 'places', geoms: ['point'] },
    ruin: { layer: 'places', geoms: ['point'] },
    label: { layer: 'labels', geoms: ['point'] },
    compass: { layer: 'decor', geoms: ['point'] },
    ship: { layer: 'decor', geoms: ['point'] },
    serpent: { layer: 'decor', geoms: ['point'] },
    cartouche: { layer: 'decor', geoms: ['point'] },
    symbol: { layer: 'decor', geoms: ['point', 'group'] },
    image: { layer: 'decor', geoms: ['point'] } // eigenes Bild/Asset (siehe map.assets)
  };
  const SYMBOLS = ['mountain', 'hill', 'tree', 'pine', 'tuft', 'dune', 'city', 'town', 'village', 'fortress', 'tower', 'ruin', 'compass', 'ship', 'serpent', 'marker', 'star', 'cave', 'bridge'];
  const DASHES = { solid: [], dashed: [6, 4], dotted: [1, 3], dashdot: [8, 3, 1, 3], long: [12, 6] };
  const FONTS = { serif: "'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif", sans: "'Segoe UI',Arial,sans-serif", script: "'Segoe Script','Brush Script MT',cursive", caps: "'Trajan Pro','Palatino Linotype',Georgia,serif" };

  // Stil-Paletten: Darstellung ist von der Geometrie getrennt (Karte -> palette -> Objekt.style)
  const PRESETS = {
    parchment: {
      paper: '#ecdfbd', sea: '#cdd7cc', ink: '#4a3826',
      types: {
        land: { fill: '#efe4c4', stroke: '#4a3826', width: 2.4, smooth: true, coast: true },
        island: { fill: '#efe4c4', stroke: '#4a3826', width: 2, smooth: true, coast: true },
        area: { fill: '#e2d3a8', stroke: '#6b5338', width: 1.2, smooth: true, opacity: 0.8 },
        mountains: { fill: '#f4ebd2', stroke: '#4a3826', width: 1.3, size: 40, density: 1 },
        mountain: { fill: '#f4ebd2', stroke: '#4a3826', width: 1.4, size: 42 },
        hills: { fill: 'none', stroke: '#6b5338', width: 1.2, size: 22, density: 1 },
        lake: { fill: '#b8cbcc', stroke: '#4f6670', width: 1.6, smooth: true, coast: true },
        river: { stroke: '#557a8c', width: 3, smooth: true },
        forest: { fill: 'rgba(98,122,62,0.16)', stroke: '#3f5a2c', width: 1.1, size: 16, density: 1, symbol: 'tree', smooth: true },
        swamp: { fill: 'rgba(110,120,70,0.18)', stroke: '#5a6b3c', width: 1, size: 14, density: 1, smooth: true },
        desert: { fill: 'rgba(214,180,110,0.30)', stroke: '#a6824c', width: 1, size: 14, density: 1, smooth: true },
        road: { stroke: '#7a5536', width: 2.2, dash: 'dashed', smooth: true },
        path: { stroke: '#8a6a48', width: 1.4, dash: 'dotted', smooth: true },
        line: { stroke: '#4a3826', width: 1.6, smooth: false },
        border: { stroke: '#8b2c2c', width: 3, dash: 'dashdot', opacity: 0.75, fill: 'none' },
        region: { fill: 'rgba(139,44,44,0.10)', stroke: '#8b2c2c', width: 2, dash: 'dashed', opacity: 0.9, smooth: true },
        city: { fill: '#b33a2a', stroke: '#3a2a1a', width: 1.4, size: 34 },
        town: { fill: '#c8644a', stroke: '#3a2a1a', width: 1.2, size: 26 },
        village: { fill: '#d8a070', stroke: '#3a2a1a', width: 1, size: 18 },
        fortress: { fill: '#e8dcc0', stroke: '#3a2a1a', width: 1.4, size: 32 },
        tower: { fill: '#e8dcc0', stroke: '#3a2a1a', width: 1.3, size: 28 },
        ruin: { fill: '#d9ccab', stroke: '#5a4632', width: 1.2, size: 26 },
        label: { stroke: 'none' },
        compass: { fill: '#e8dcc0', stroke: '#4a3826', width: 1.4, size: 140 },
        ship: { fill: '#e8dcc0', stroke: '#4a3826', width: 1.3, size: 46 },
        serpent: { fill: '#9fb39a', stroke: '#3c4a3a', width: 1.3, size: 70 },
        cartouche: { fill: '#f1e6c8', stroke: '#4a3826', width: 2, size: 1 },
        symbol: { fill: '#e8dcc0', stroke: '#4a3826', width: 1.2, size: 26, symbol: 'marker' }
      },
      label: { color: '#3b2a1a', halo: '#efe4c4' }
    },
    ink: {
      paper: '#f2ead7', sea: '#f2ead7', ink: '#2e2418',
      types: {
        land: { fill: '#f6efdd', stroke: '#2e2418', width: 2.4, smooth: true, coast: true },
        island: { fill: '#f6efdd', stroke: '#2e2418', width: 2, smooth: true, coast: true },
        lake: { fill: '#e6dcc4', stroke: '#2e2418', width: 1.5, smooth: true, coast: true },
        river: { stroke: '#2e2418', width: 2.4, smooth: true },
        forest: { fill: 'none', stroke: '#2e2418', width: 1, size: 16, density: 1, symbol: 'tree', smooth: true },
        swamp: { fill: 'none', stroke: '#2e2418', width: 1, size: 14, density: 1, smooth: true },
        desert: { fill: 'none', stroke: '#2e2418', width: 1, size: 14, density: 1, smooth: true },
        border: { stroke: '#2e2418', width: 2.4, dash: 'dashdot', opacity: 0.8, fill: 'none' },
        region: { fill: 'none', stroke: '#2e2418', width: 1.6, dash: 'dashed', smooth: true },
        city: { fill: '#2e2418', stroke: '#2e2418', width: 1.4, size: 34 },
        town: { fill: '#6a5a44', stroke: '#2e2418', width: 1.2, size: 26 },
        village: { fill: '#a89878', stroke: '#2e2418', width: 1, size: 18 },
        serpent: { fill: '#f6efdd', stroke: '#2e2418', width: 1.3, size: 70 }
      },
      label: { color: '#2e2418', halo: '#f6efdd' }
    }
  };

  class MapError extends Error {
    constructor(message, path, code) { super(message); this.name = 'MapError'; this.path = path || null; this.code = code || 400; }
  }
  const fail = (msg, p, code) => { throw new MapError(msg + (p ? ` (${p})` : ''), p, code); };

  // ---------------------------------------------------------------- Hilfen
  const ID_RE = /^[A-Za-z0-9_-]{1,48}$/;
  const COLOR_RE = /^(none|transparent|#[0-9a-fA-F]{3}|#[0-9a-fA-F]{4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/;
  function newId(prefix) {
    let s = ''; const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 10; i++) s += a[Math.floor(Math.random() * a.length)];
    return (prefix || 'f') + '_' + s;
  }
  const r2 = v => Math.round(v * 100) / 100;
  const clone = o => JSON.parse(JSON.stringify(o));
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  function str(v, max, p, allowEmpty = true) {
    if (v == null) return '';
    if (typeof v !== 'string' && typeof v !== 'number') fail('Text erwartet', p);
    const s = String(v); if (s.length > max) fail(`Text zu lang (max. ${max} Zeichen)`, p);
    if (!allowEmpty && !s.trim()) fail('Text darf nicht leer sein', p);
    return s;
  }
  function num(v, min, max, p) {
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    if (typeof n !== 'number' || !isFinite(n)) fail('Zahl erwartet', p);
    if (n < min || n > max) fail(`Zahl außerhalb des erlaubten Bereichs ${min}…${max}`, p);
    return n;
  }
  function color(v, p) { if (typeof v !== 'string' || !COLOR_RE.test(v.trim())) fail('Ungültige Farbe (erlaubt: #rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), none)', p); return v.trim(); }

  // ---------------------------------------------------------------- Geometrie
  function coordBounds(map) { const w = map.width, h = map.height; return { x0: -w, y0: -h, x1: 2 * w, y1: 2 * h }; }
  function pt(v, map, p) {
    if (!Array.isArray(v) || v.length < 2) fail('Koordinate [x, y] erwartet', p);
    const b = coordBounds(map);
    return [r2(num(v[0], b.x0, b.x1, p + '[0]')), r2(num(v[1], b.y0, b.y1, p + '[1]'))];
  }
  function ptList(v, min, map, p) {
    if (!Array.isArray(v)) fail('Liste von Koordinaten erwartet', p);
    if (v.length < min) fail(`mindestens ${min} Punkte nötig`, p);
    if (v.length > LIMITS.pointsPerFeature) fail(`zu viele Punkte (max. ${LIMITS.pointsPerFeature})`, p);
    return v.map((q, i) => pt(q, map, `${p}[${i}]`));
  }
  function normGeometry(g, type, map, p) {
    if (!isObj(g)) fail('geometry fehlt', p);
    const kind = String(g.type || '').toLowerCase();
    const allowed = TYPES[type].geoms;
    if (!allowed.includes(kind)) fail(`Geometrie "${kind || '?'}" passt nicht zu Typ "${type}" (erlaubt: ${allowed.join(', ')})`, p + '.type');
    if (kind === 'point') { let c = g.coordinates; if (Array.isArray(c) && c.length === 1 && Array.isArray(c[0])) c = c[0]; return { type: 'point', coordinates: pt(c, map, p + '.coordinates') }; }
    if (kind === 'line') return { type: 'line', coordinates: ptList(g.coordinates, 2, map, p + '.coordinates') };
    if (kind === 'group') {
      const out = { type: 'group', coordinates: ptList(g.coordinates, 1, map, p + '.coordinates') };
      if (g.sizes != null) {
        if (!Array.isArray(g.sizes) || g.sizes.length !== out.coordinates.length) fail('sizes muss genauso lang sein wie coordinates', p + '.sizes');
        out.sizes = g.sizes.map((s, i) => r2(num(s, 1, 500, `${p}.sizes[${i}]`)));
      }
      return out;
    }
    // polygon: Liste von Ringen (erster = Außenrand, weitere = Löcher); ein einzelner Ring als [[x,y],...] wird akzeptiert
    let rings = g.coordinates;
    if (Array.isArray(rings) && rings.length && Array.isArray(rings[0]) && typeof rings[0][0] === 'number') rings = [rings];
    if (Array.isArray(g.holes) && Array.isArray(rings)) rings = rings.concat(g.holes); // Löcher als eigene Liste (vereinfachte Schreibweise)
    if (!Array.isArray(rings) || !rings.length) fail('Polygon braucht mindestens einen Ring', p + '.coordinates');
    if (rings.length > 50) fail('zu viele Ringe (max. 50)', p + '.coordinates');
    return { type: 'polygon', coordinates: rings.map((r, i) => { const pts = ptList(r, 3, map, `${p}.coordinates[${i}]`); const a = pts[0], z = pts[pts.length - 1]; if (pts.length > 3 && a[0] === z[0] && a[1] === z[1]) pts.pop(); return pts; }) };
  }
  const pointCount = g => g.type === 'point' ? 1 : g.type === 'polygon' ? g.coordinates.reduce((n, r) => n + r.length, 0) : g.coordinates.length;
  function eachPoint(g, fn) {
    if (g.type === 'point') fn(g.coordinates);
    else if (g.type === 'polygon') g.coordinates.forEach(r => r.forEach(fn));
    else g.coordinates.forEach(fn);
  }
  function mapPoints(g, fn) {
    const m = q => { const r = fn(q); return [r2(r[0]), r2(r[1])]; };
    if (g.type === 'point') return Object.assign({}, g, { coordinates: m(g.coordinates) });
    if (g.type === 'polygon') return Object.assign({}, g, { coordinates: g.coordinates.map(r => r.map(m)) });
    return Object.assign({}, g, { coordinates: g.coordinates.map(m) });
  }
  function geomBBox(g) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    eachPoint(g, q => { if (q[0] < x0) x0 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[0] > x1) x1 = q[0]; if (q[1] > y1) y1 = q[1]; });
    return [x0, y0, x1, y1];
  }
  function featureBBox(f, map) {
    const b = geomBBox(f.geometry), st = styleOf(f, map);
    let pad = f.geometry.type === 'polygon' ? (st.width || 0) : Math.max(st.size || 0, st.width || 0) / 2 + 2;
    if (f.type === 'label' && f.label) { const w = (f.label.text || '').length * (f.label.size || 24) * 0.55; pad = Math.max(pad, w / 2, (f.label.size || 24)); }
    if (f.type === 'cartouche') pad = Math.max(pad, 160);
    if (f.type === 'image') { const s = imageSize(f, map), c = f.geometry.coordinates, r = (st.rotation || 0) * Math.PI / 180, hw = (Math.abs(Math.cos(r)) * s.w + Math.abs(Math.sin(r)) * s.h) / 2, hh = (Math.abs(Math.sin(r)) * s.w + Math.abs(Math.cos(r)) * s.h) / 2; return [c[0] - hw, c[1] - hh, c[0] + hw, c[1] + hh]; }
    return [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad];
  }
  const centerOf = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  function pointInRing(x, y, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  const pointInPolygon = (x, y, rings) => pointInRing(x, y, rings[0]) && !rings.slice(1).some(h => pointInRing(x, y, h));
  function distSeg(px, py, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
  }
  // Abstand eines Punkts zu einem Objekt (für Auswahl); 0 = innen
  function featureDistance(f, x, y, map) {
    const g = f.geometry, st = styleOf(f, map);
    if (g.type === 'point') {
      if (f.type === 'label' || f.type === 'cartouche' || f.type === 'image') { const b = featureBBox(f, map); return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] ? 0 : Math.hypot(x - g.coordinates[0], y - g.coordinates[1]); }
      return Math.max(0, Math.hypot(x - g.coordinates[0], y - g.coordinates[1]) - (st.size || 10) / 2);
    }
    if (g.type === 'group') return Math.max(0, Math.min(...g.coordinates.map(q => Math.hypot(x - q[0], y - q[1]))) - (st.size || 10) / 2);
    if (g.type === 'line') { let d = Infinity; for (let i = 1; i < g.coordinates.length; i++) d = Math.min(d, distSeg(x, y, g.coordinates[i - 1], g.coordinates[i])); return Math.max(0, d - (st.width || 1) / 2); }
    if (pointInPolygon(x, y, g.coordinates)) return 0;
    let d = Infinity; for (const r of g.coordinates) for (let i = 0; i < r.length; i++) d = Math.min(d, distSeg(x, y, r[i], r[(i + 1) % r.length]));
    return d;
  }
  // Ramer-Douglas-Peucker: vereinfacht freihand gezeichnete Linien
  function simplify(pts, tol) {
    if (pts.length < 3) return pts.slice();
    const keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop(); let md = 0, mi = -1;
      for (let i = a + 1; i < b; i++) { const d = distSeg(pts[i][0], pts[i][1], pts[a], pts[b]); if (d > md) { md = d; mi = i; } }
      if (md > tol && mi > 0) { keep[mi] = true; stack.push([a, mi], [mi, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  // ---------------------------------------------------------------- Stil
  function presetOf(map) { return PRESETS[map && map.style] || PRESETS.parchment; }
  function styleOf(f, map) {
    const pr = presetOf(map), base = PRESETS.parchment.types[f.type] || {};
    return Object.assign({}, base, pr.types[f.type] || {}, (map && map.palette && map.palette[f.type]) || {}, f.style || {});
  }
  const STYLE_KEYS = {
    fill: v => v, stroke: v => v, width: v => v, dash: v => v, opacity: v => v, size: v => v, symbol: v => v, density: v => v, smooth: v => v, coast: v => v, rotation: v => v
  };
  function normStyle(s, p) {
    if (s == null) return {};
    if (!isObj(s)) fail('style muss ein Objekt sein', p);
    const o = {};
    for (const [k, v] of Object.entries(s)) {
      if (!(k in STYLE_KEYS)) fail(`unbekannte Stil-Eigenschaft "${k}" (erlaubt: ${Object.keys(STYLE_KEYS).join(', ')})`, p);
      if (v === null) { o[k] = null; continue; }
      const q = `${p}.${k}`;
      if (k === 'fill' || k === 'stroke') o[k] = color(v, q);
      else if (k === 'width') o[k] = r2(num(v, 0, 200, q));
      else if (k === 'opacity') o[k] = r2(num(v, 0, 1, q));
      else if (k === 'size') o[k] = r2(num(v, 1, 1000, q));
      else if (k === 'density') o[k] = r2(num(v, 0.1, 5, q));
      else if (k === 'dash') { if (!(v in DASHES)) fail(`dash: ${Object.keys(DASHES).join(', ')}`, q); o[k] = v; }
      else if (k === 'symbol') { if (!SYMBOLS.includes(v)) fail(`symbol: ${SYMBOLS.join(', ')}`, q); o[k] = v; }
      else if (k === 'smooth' || k === 'coast') o[k] = !!v;
      else if (k === 'rotation') o[k] = r2(num(v, -360, 360, q));
    }
    return o;
  }
  function normLabel(l, p) {
    if (l == null) return null;
    if (typeof l === 'string') l = { text: l };
    if (!isObj(l)) fail('label muss ein Objekt oder Text sein', p);
    const o = {};
    for (const [k, v] of Object.entries(l)) {
      const q = `${p}.${k}`;
      if (v === null) { o[k] = null; continue; }
      if (k === 'text') o.text = str(v, LIMITS.text, q);
      else if (k === 'size') o.size = r2(num(v, 2, 600, q));
      else if (k === 'color' || k === 'halo') o[k] = color(v, q);
      else if (k === 'align') { if (!['left', 'center', 'right'].includes(v)) fail('align: left, center, right', q); o.align = v; }
      else if (k === 'angle') o.angle = r2(num(v, -360, 360, q));
      else if (k === 'font') { if (!(v in FONTS)) fail(`font: ${Object.keys(FONTS).join(', ')}`, q); o.font = v; }
      else if (k === 'italic' || k === 'caps' || k === 'bold') o[k] = !!v;
      else if (k === 'spacing') o.spacing = r2(num(v, 0, 3, q));
      else if (k === 'dx' || k === 'dy') o[k] = r2(num(v, -2000, 2000, q));
      else fail(`unbekannte Beschriftungs-Eigenschaft "${k}"`, p);
    }
    return o;
  }
  const merge = (a, b) => { const o = Object.assign({}, a || {}); for (const [k, v] of Object.entries(b || {})) { if (v === null) delete o[k]; else o[k] = v; } return o; };

  // ---------------------------------------------------------------- Assets (eigene Bilder, z.B. per MCP hochgeladen)
  const ASSET_SRC_RE = /^images\/[A-Za-z0-9_-]{1,80}\.(png|jpg|webp|gif)$/;
  const ASSET_DATA_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
  function normAsset(a, p, existingIds) {
    if (!isObj(a)) fail('Asset muss ein Objekt sein', p);
    let id = a.id;
    if (id != null) { if (typeof id !== 'string' || !ID_RE.test(id)) fail('id: 1–48 Zeichen aus A–Z, a–z, 0–9, _ und -', p + '.id'); if (existingIds && existingIds.has(id)) fail(`Asset-id "${id}" ist bereits vergeben`, p + '.id', 409); }
    else id = newId('a');
    const src = String(a.src || '');
    if (!(ASSET_SRC_RE.test(src) || (src.length <= LIMITS.assetDataUrl && ASSET_DATA_RE.test(src)))) fail('src: gespeichertes Bild (images/…) oder data:image/png|jpeg|webp|gif;base64', p + '.src');
    return { id, name: str(a.name || 'Bild', LIMITS.name, p + '.name', false), src, w: Math.round(num(a.w, 1, 20000, p + '.w')), h: Math.round(num(a.h, 1, 20000, p + '.h')) };
  }
  const assetOf = (map, id) => (map && map.assets || []).find(a => a.id === id) || null;
  function imageSize(f, map) { const a = assetOf(map, f.asset), st = styleOf(f, map); if (!a) return { w: st.size || 40, h: st.size || 40 }; const w = st.size || Math.min(a.w, 300); return { w, h: w * a.h / a.w }; }

  // ---------------------------------------------------------------- Objekte
  function normFeature(input, map, p, existingIds) {
    if (!isObj(input)) fail('Objekt erwartet', p);
    const type = String(input.type || '');
    if (!TYPES[type]) fail(`unbekannter Typ "${type}" (erlaubt: ${Object.keys(TYPES).join(', ')})`, p + '.type');
    let id = input.id;
    if (id != null) { if (typeof id !== 'string' || !ID_RE.test(id)) fail('id: 1–48 Zeichen aus A–Z, a–z, 0–9, _ und -', p + '.id'); if (existingIds && existingIds.has(id)) fail(`id "${id}" ist bereits vergeben`, p + '.id', 409); }
    else id = newId('f');
    const layer = input.layer == null ? TYPES[type].layer : String(input.layer);
    if (!LAYERS.includes(layer)) fail(`layer: ${LAYERS.join(', ')}`, p + '.layer');
    const f = { id, type, layer, geometry: normGeometry(input.geometry, type, map, p + '.geometry') };
    if (input.name != null) f.name = str(input.name, LIMITS.name, p + '.name');
    const st = normStyle(input.style, p + '.style'); for (const k in st) if (st[k] === null) delete st[k]; if (Object.keys(st).length) f.style = st;
    const lb = normLabel(input.label, p + '.label'); if (lb) { for (const k in lb) if (lb[k] === null) delete lb[k]; if (Object.keys(lb).length) f.label = lb; }
    if (input.placeId != null) { if (typeof input.placeId !== 'string' || input.placeId.length > 80) fail('placeId ungültig', p + '.placeId'); f.placeId = input.placeId; }
    if (input.meta != null) { if (!isObj(input.meta) || JSON.stringify(input.meta).length > LIMITS.meta) fail(`meta: Objekt, max. ${LIMITS.meta} Zeichen`, p + '.meta'); f.meta = clone(input.meta); }
    if (type === 'label' && !(f.label && f.label.text)) fail('Beschriftung braucht label.text', p + '.label');
    if (type === 'image') {
      if (typeof input.asset !== 'string' || !assetOf(map, input.asset)) fail(`asset: id eines Bildes aus map.assets erwartet${(map.assets || []).length ? ' (vorhanden: ' + map.assets.slice(0, 20).map(a => a.id).join(', ') + ')' : ' – zuerst ein Bild hochladen (upload_map_asset)'}`, p + '.asset');
      f.asset = input.asset;
    }
    return f;
  }

  // ---------------------------------------------------------------- Karte
  function createMap(o) {
    o = o || {};
    const now = new Date().toISOString();
    const m = {
      format: FORMAT, version: VERSION, id: o.id && ID_RE.test(o.id) ? o.id : newId('map'),
      name: str(o.name || 'Karte', LIMITS.name, 'name', false), world: String(o.world || ''), timeline: o.timeline || null,
      width: o.width ? Math.round(num(o.width, 100, 50000, 'width')) : DEFAULT_SIZE.width,
      height: o.height ? Math.round(num(o.height, 100, 50000, 'height')) : DEFAULT_SIZE.height,
      style: PRESETS[o.style] ? o.style : 'parchment', palette: {}, border: o.border !== false, primary: !!o.primary,
      layers: Object.fromEntries(LAYERS.map(l => [l, { visible: true }])),
      created: now, updated: now, rev: 1, assets: [], features: []
    };
    if (o.background) m.background = color(o.background, 'background');
    return m;
  }
  // Ältere/abweichende Formate auf die aktuelle Version bringen
  const MIGRATIONS = {
    // v0: Entwurfsformat ohne "version": Objekte unter "objects", Geometrie unter "geom"/"points", Stil flach am Objekt
    0: m => {
      const out = Object.assign({}, m); out.features = (m.features || m.objects || []).map(f => {
        const g = f.geometry || f.geom || (f.points ? { type: f.kind || (f.closed ? 'polygon' : 'line'), coordinates: f.closed ? [f.points] : f.points } : null);
        const style = Object.assign({}, f.style || {});
        for (const k of ['fill', 'stroke', 'width', 'dash', 'opacity', 'size', 'symbol']) if (f[k] != null && style[k] == null) style[k] = f[k];
        return { id: f.id, type: f.type, layer: f.layer, geometry: g, style, label: f.label || (f.text ? { text: f.text } : undefined), name: f.name, placeId: f.placeId, meta: f.meta };
      });
      delete out.objects; out.version = 1; out.format = FORMAT; return out;
    }
  };
  function migrate(raw) {
    let m = clone(raw); let v = typeof m.version === 'number' ? m.version : 0;
    if (v > VERSION) fail(`Kartenformat v${v} ist neuer als diese Programmversion (v${VERSION}) – bitte Programm aktualisieren`, 'version', 409);
    while (v < VERSION) { if (!MIGRATIONS[v]) fail('keine Migration für Version ' + v, 'version'); m = MIGRATIONS[v](m); v = m.version; }
    return m;
  }
  // Komplette Karte prüfen und normalisieren (z.B. beim Laden oder wenn die Oberfläche die ganze Datei speichert)
  function normalizeMap(raw) {
    if (!isObj(raw)) fail('Karte muss ein JSON-Objekt sein');
    const m0 = migrate(raw);
    if (m0.format !== FORMAT) fail('kein Ascandir-Kartenformat', 'format');
    if (typeof m0.id !== 'string' || !ID_RE.test(m0.id)) fail('id ungültig', 'id');
    const m = {
      format: FORMAT, version: VERSION, id: m0.id, name: str(m0.name || 'Karte', LIMITS.name, 'name', false),
      world: str(m0.world || '', 80, 'world'), timeline: m0.timeline ? str(m0.timeline, 80, 'timeline') : null,
      width: Math.round(num(m0.width || DEFAULT_SIZE.width, 100, 50000, 'width')), height: Math.round(num(m0.height || DEFAULT_SIZE.height, 100, 50000, 'height')),
      style: PRESETS[m0.style] ? m0.style : 'parchment', palette: {}, border: m0.border !== false, primary: !!m0.primary,
      layers: {}, created: m0.created || new Date().toISOString(), updated: m0.updated || new Date().toISOString(), rev: Math.max(1, Math.floor(Number(m0.rev) || 1)), features: []
    };
    if (m0.background) m.background = color(m0.background, 'background');
    for (const l of LAYERS) m.layers[l] = { visible: !(m0.layers && m0.layers[l] && m0.layers[l].visible === false), locked: !!(m0.layers && m0.layers[l] && m0.layers[l].locked) };
    if (isObj(m0.palette)) for (const [k, v] of Object.entries(m0.palette)) { if (!TYPES[k]) fail(`palette: unbekannter Typ "${k}"`, 'palette'); m.palette[k] = normStyle(v, 'palette.' + k); }
    m.assets = [];
    if (m0.assets != null) {
      if (!Array.isArray(m0.assets)) fail('assets muss eine Liste sein', 'assets');
      if (m0.assets.length > LIMITS.assets) fail(`zu viele Bilder (max. ${LIMITS.assets})`, 'assets');
      const aids = new Set(); m0.assets.forEach((a, i) => { const n = normAsset(a, `assets[${i}]`, aids); aids.add(n.id); m.assets.push(n); });
    }
    const feats = m0.features || [];
    if (!Array.isArray(feats)) fail('features muss eine Liste sein', 'features');
    if (feats.length > LIMITS.features) fail(`zu viele Objekte (max. ${LIMITS.features})`, 'features');
    const ids = new Set(); let pts = 0;
    feats.forEach((f, i) => { const n = normFeature(f, m, `features[${i}]`, ids); ids.add(n.id); pts += pointCount(n.geometry); m.features.push(n); });
    if (pts > LIMITS.pointsPerMap) fail(`zu viele Punkte in der Karte (max. ${LIMITS.pointsPerMap})`, 'features');
    return m;
  }
  function normMeta(map, o) {
    const m = clone(map);
    if (o.name != null) m.name = str(o.name, LIMITS.name, 'name', false);
    if (o.width != null) m.width = Math.round(num(o.width, 100, 50000, 'width'));
    if (o.height != null) m.height = Math.round(num(o.height, 100, 50000, 'height'));
    if (o.style != null) { if (!PRESETS[o.style]) fail(`style: ${Object.keys(PRESETS).join(', ')}`, 'style'); m.style = o.style; }
    if (o.background !== undefined) { if (o.background === null) delete m.background; else m.background = color(o.background, 'background'); }
    if (o.border != null) m.border = !!o.border;
    if (o.primary != null) m.primary = !!o.primary;
    if (o.palette != null) {
      if (!isObj(o.palette)) fail('palette muss ein Objekt sein', 'palette');
      for (const [k, v] of Object.entries(o.palette)) { if (!TYPES[k]) fail(`palette: unbekannter Typ "${k}"`, 'palette'); if (v === null) delete m.palette[k]; else m.palette[k] = merge(m.palette[k], normStyle(v, 'palette.' + k)); }
    }
    if (o.layers != null) {
      if (!isObj(o.layers)) fail('layers muss ein Objekt sein', 'layers');
      for (const [k, v] of Object.entries(o.layers)) { if (!LAYERS.includes(k)) fail(`layers: ${LAYERS.join(', ')}`, 'layers'); m.layers[k] = { visible: !(v && v.visible === false), locked: !!(v && v.locked) }; }
    }
    return m;
  }

  // ---------------------------------------------------------------- Änderungen (atomar)
  // ops: { op: 'add', feature } | { op: 'update', id, ...änderungen } | { op: 'delete', id }
  function applyOps(map, ops) {
    if (!Array.isArray(ops)) fail('Liste von Änderungen erwartet', 'ops');
    if (ops.length === 0) fail('keine Änderungen übergeben', 'ops');
    if (ops.length > LIMITS.batch) fail(`zu viele Änderungen in einem Aufruf (max. ${LIMITS.batch})`, 'ops');
    const m = clone(map), byId = new Map(m.features.map((f, i) => [f.id, i]));
    const ids = new Set(byId.keys()), res = { added: [], updated: [], deleted: [] };
    ops.forEach((o, i) => {
      const p = `ops[${i}]`;
      if (!isObj(o)) fail('Objekt erwartet', p);
      if (o.op === 'add') {
        if (m.features.length >= LIMITS.features) fail(`Karte ist voll (max. ${LIMITS.features} Objekte)`, p, 413);
        const f = normFeature(o.feature, m, p + '.feature', ids); ids.add(f.id); byId.set(f.id, m.features.length); m.features.push(f); res.added.push(f.id);
      } else if (o.op === 'update') {
        const idx = byId.get(o.id); if (idx == null || !m.features[idx]) fail(`Objekt "${o.id}" nicht gefunden`, p + '.id', 404);
        m.features[idx] = updateFeature(m.features[idx], o, m, p); res.updated.push(o.id);
        if (o.order != null) { // Zeichenreihenfolge innerhalb der Karte: front | back
          if (o.order !== 'front' && o.order !== 'back') fail('order: front oder back', p + '.order');
          const f = m.features[idx]; m.features[idx] = null; if (o.order === 'front') m.features.push(f); else m.features.unshift(f);
          m.features = m.features.filter(Boolean); byId.clear(); m.features.forEach((x, j) => byId.set(x.id, j));
        }
      } else if (o.op === 'delete') {
        const idx = byId.get(o.id); if (idx == null || !m.features[idx]) fail(`Objekt "${o.id}" nicht gefunden`, p + '.id', 404);
        m.features[idx] = null; byId.delete(o.id); ids.delete(o.id); res.deleted.push(o.id);
      } else if (o.op === 'addAsset') {
        m.assets = m.assets || [];
        if (m.assets.length >= LIMITS.assets) fail(`zu viele Bilder (max. ${LIMITS.assets})`, p, 413);
        const a = normAsset(o.asset, p + '.asset', new Set(m.assets.map(x => x.id))); m.assets.push(a); (res.assetsAdded = res.assetsAdded || []).push(a.id);
      } else if (o.op === 'removeAsset') {
        if (!assetOf(m, o.id)) fail(`Bild "${o.id}" nicht gefunden`, p + '.id', 404);
        const users = m.features.filter(f => f && f.asset === o.id).map(f => f.id);
        if (users.length) fail(`Bild "${o.id}" wird noch verwendet von: ${users.slice(0, 10).join(', ')}`, p + '.id', 409);
        m.assets = m.assets.filter(a => a.id !== o.id); (res.assetsRemoved = res.assetsRemoved || []).push(o.id);
      } else fail('op muss "add", "update", "delete", "addAsset" oder "removeAsset" sein', p + '.op');
    });
    m.features = m.features.filter(Boolean);
    let pts = 0; for (const f of m.features) pts += pointCount(f.geometry);
    if (pts > LIMITS.pointsPerMap) fail(`zu viele Punkte in der Karte (max. ${LIMITS.pointsPerMap})`, 'ops', 413);
    m.rev = (m.rev || 1) + 1; m.updated = new Date().toISOString();
    return { map: m, result: res };
  }
  function updateFeature(f0, o, map, p) {
    let f = clone(f0);
    if (o.type != null) {
      if (!TYPES[o.type]) fail(`unbekannter Typ "${o.type}"`, p + '.type');
      if (!TYPES[o.type].geoms.includes((o.geometry && o.geometry.type) || f.geometry.type)) fail(`Typ "${o.type}" passt nicht zur Geometrie`, p + '.type');
      if (o.layer == null && f.layer === TYPES[f.type].layer) f.layer = TYPES[o.type].layer;
      f.type = o.type;
    }
    if (o.layer != null) { if (!LAYERS.includes(o.layer)) fail(`layer: ${LAYERS.join(', ')}`, p + '.layer'); f.layer = o.layer; }
    if (o.geometry != null) f.geometry = normGeometry(o.geometry, f.type, map, p + '.geometry');
    if (o.translate != null) {
      if (!Array.isArray(o.translate) || o.translate.length !== 2) fail('translate: [dx, dy]', p + '.translate');
      const dx = num(o.translate[0], -100000, 100000, p + '.translate[0]'), dy = num(o.translate[1], -100000, 100000, p + '.translate[1]');
      f.geometry = mapPoints(f.geometry, q => [q[0] + dx, q[1] + dy]);
    }
    if (o.scale != null) {
      const sc = isObj(o.scale) ? o.scale : { factor: o.scale, origin: o.scaleOrigin };
      const k = num(sc.factor, 0.01, 100, p + '.scale.factor');
      const c = sc.origin ? pt(sc.origin, map, p + '.scale.origin') : centerOf(geomBBox(f.geometry));
      f.geometry = mapPoints(f.geometry, q => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k]);
      if (f.geometry.type === 'point' || f.geometry.type === 'group') { const st = styleOf(f, map); f.style = Object.assign({}, f.style, { size: r2(Math.min(1000, Math.max(1, (st.size || 20) * k))) }); if (f.geometry.sizes) f.geometry.sizes = f.geometry.sizes.map(s => r2(Math.min(500, Math.max(1, s * k)))); }
      if (f.label && f.label.size) f.label.size = r2(Math.min(600, Math.max(2, f.label.size * k)));
    }
    if (o.rotate != null) {
      const a = num(o.rotate, -360, 360, p + '.rotate') * Math.PI / 180, c = centerOf(geomBBox(f.geometry)), cs = Math.cos(a), sn = Math.sin(a);
      f.geometry = mapPoints(f.geometry, q => [c[0] + (q[0] - c[0]) * cs - (q[1] - c[1]) * sn, c[1] + (q[0] - c[0]) * sn + (q[1] - c[1]) * cs]);
      if (f.type === 'label' || f.type === 'cartouche') f.label = Object.assign({}, f.label, { angle: r2(((f.label && f.label.angle) || 0) + o.rotate) });
    }
    if (o.style !== undefined) { if (o.style === null) delete f.style; else { f.style = merge(f.style, normStyle(o.style, p + '.style')); if (!Object.keys(f.style).length) delete f.style; } }
    if (o.label !== undefined) { if (o.label === null) delete f.label; else { f.label = merge(f.label, normLabel(o.label, p + '.label')); if (!Object.keys(f.label).length) delete f.label; } }
    if (o.asset !== undefined) f.asset = o.asset;
    if (o.name !== undefined) { if (o.name === null || o.name === '') delete f.name; else f.name = str(o.name, LIMITS.name, p + '.name'); }
    if (o.placeId !== undefined) { if (o.placeId === null || o.placeId === '') delete f.placeId; else { if (typeof o.placeId !== 'string' || o.placeId.length > 80) fail('placeId ungültig', p + '.placeId'); f.placeId = o.placeId; } }
    if (o.meta !== undefined) { if (o.meta === null) delete f.meta; else { if (!isObj(o.meta)) fail('meta muss ein Objekt sein', p + '.meta'); f.meta = merge(f.meta, o.meta); if (JSON.stringify(f.meta).length > LIMITS.meta) fail('meta zu groß', p + '.meta'); } }
    // Endprüfung des ganzen Objekts (z.B. Koordinaten nach Verschieben noch im erlaubten Bereich)
    return normFeature(f, map, p, null);
  }

  // ---------------------------------------------------------------- Abfragen
  function query(map, q) {
    q = q || {};
    let list = map.features;
    if (q.ids) { const s = new Set([].concat(q.ids).map(String)); list = list.filter(f => s.has(f.id)); }
    if (q.type) { const s = new Set([].concat(q.type)); list = list.filter(f => s.has(f.type)); }
    if (q.layer) { const s = new Set([].concat(q.layer)); list = list.filter(f => s.has(f.layer)); }
    if (q.text) { const t = String(q.text).toLowerCase(); list = list.filter(f => ((f.name || '') + ' ' + ((f.label && f.label.text) || '')).toLowerCase().includes(t)); }
    if (q.placeId) list = list.filter(f => f.placeId === q.placeId);
    if (q.bbox) {
      if (!Array.isArray(q.bbox) || q.bbox.length !== 4 || q.bbox.some(v => typeof v !== 'number' || !isFinite(v))) fail('bbox: [x1, y1, x2, y2]', 'bbox');
      const [a, b, c, d] = q.bbox, x0 = Math.min(a, c), x1 = Math.max(a, c), y0 = Math.min(b, d), y1 = Math.max(b, d);
      list = list.filter(f => { const bb = featureBBox(f, map); return bb[0] <= x1 && bb[2] >= x0 && bb[1] <= y1 && bb[3] >= y0; });
    }
    if (q.near) { const [x, y, r] = q.near; list = list.filter(f => featureDistance(f, x, y, map) <= (r || 0)); }
    const total = list.length, limit = Math.min(LIMITS.query, Math.max(1, Math.floor(q.limit || 100)));
    return { total, features: list.slice(0, limit), truncated: total > limit };
  }
  function brief(f, map, withGeom) {
    const b = featureBBox(f, map), o = { id: f.id, type: f.type, layer: f.layer, geometry: f.geometry.type, points: pointCount(f.geometry), bbox: b.map(v => Math.round(v)) };
    if (f.name) o.name = f.name; if (f.label && f.label.text) o.label = f.label.text; if (f.placeId) o.placeId = f.placeId;
    if (f.style) o.style = f.style;
    if (withGeom) o.geometryData = f.geometry;
    return o;
  }
  function summarize(map) {
    const byLayer = {}, byType = {};
    for (const f of map.features) { byLayer[f.layer] = (byLayer[f.layer] || 0) + 1; byType[f.type] = (byType[f.type] || 0) + 1; }
    const labels = map.features.filter(f => (f.label && f.label.text) || f.name).slice(0, 60).map(f => ({ id: f.id, type: f.type, text: (f.label && f.label.text) || f.name }));
    return { id: map.id, name: map.name, world: map.world, timeline: map.timeline, width: map.width, height: map.height, style: map.style, rev: map.rev, updated: map.updated,
      featureCount: map.features.length, byLayer, byType, labels, layers: map.layers, assets: (map.assets || []).map(a => ({ id: a.id, name: a.name, w: a.w, h: a.h })) };
  }

  // ---------------------------------------------------------------- Symbole (Einheitsgröße 1, Mittelpunkt 0/0, y nach unten)
  function circle(cx, cy, r) { const k = 0.5523 * r; return [['M', cx + r, cy], ['C', cx + r, cy + k, cx + k, cy + r, cx, cy + r], ['C', cx - k, cy + r, cx - r, cy + k, cx - r, cy], ['C', cx - r, cy - k, cx - k, cy - r, cx, cy - r], ['C', cx + k, cy - r, cx + r, cy - k, cx + r, cy], ['Z']]; }
  const rect = (x, y, w, h) => [['M', x, y], ['L', x + w, y], ['L', x + w, y + h], ['L', x, y + h], ['Z']];
  const house = (x, y, w, h) => [['M', x, y], ['L', x, y - h], ['L', x + w / 2, y - h - w * 0.55], ['L', x + w, y - h], ['L', x + w, y], ['Z']];
  // Teile: { d, fill: 'fill'|'stroke'|'paper'|'none', w: Strichfaktor }
  const GLYPHS = {
    mountain: v => { const a = v < 0.33 ? 0 : v < 0.66 ? 1 : 2; const peaks = [[[-0.55, 0.32], [-0.12, -0.42], [0.02, -0.22], [0.16, -0.46], [0.58, 0.32]], [[-0.55, 0.32], [-0.05, -0.48], [0.55, 0.32]], [[-0.58, 0.32], [-0.25, -0.18], [-0.1, -0.05], [0.12, -0.5], [0.6, 0.32]]][a];
      const d = peaks.map((q, i) => [i ? 'L' : 'M', q[0], q[1]]);
      const ti = peaks.reduce((m, q, i) => q[1] < peaks[m][1] ? i : m, 0), top = peaks[ti], base = peaks[peaks.length - 1];
      // Schraffur auf der Schattenseite (rechte Flanke), immer innerhalb des Umrisses
      const h = [];
      for (const t of [0.22, 0.45, 0.68]) { const x = top[0] + (base[0] - top[0]) * t, y = top[1] + (base[1] - top[1]) * t, len = (0.32 - y) * 0.55; h.push(['M', x - 0.02, y + 0.03], ['L', x - 0.02 - len * 0.35, y + 0.03 + len]); }
      return [{ d, fill: 'fill', w: 1 }, { d: h, fill: 'none', w: 0.7 }]; },
    hill: () => [{ d: [['M', -0.5, 0.15], ['Q', 0, -0.4, 0.5, 0.15]], fill: 'none', w: 1 }, { d: [['M', 0.05, -0.1], ['Q', 0.22, -0.02, 0.28, 0.1]], fill: 'none', w: 0.6 }],
    tree: v => { const s = 0.85 + v * 0.3; return [{ d: [['M', 0, 0.45], ['L', 0, 0.12]], fill: 'none', w: 1 }, { d: [['M', -0.32 * s, 0.14], ['C', -0.5 * s, 0.05, -0.42 * s, -0.3, -0.18 * s, -0.32], ['C', -0.12 * s, -0.55, 0.22 * s, -0.55, 0.24 * s, -0.3], ['C', 0.48 * s, -0.24, 0.48 * s, 0.1, 0.3 * s, 0.14], ['Z']], fill: 'fill', w: 1 }]; },
    pine: () => [{ d: [['M', 0, 0.45], ['L', 0, 0.25]], fill: 'none', w: 1 }, { d: [['M', -0.28, 0.28], ['L', 0, -0.5], ['L', 0.28, 0.28], ['Z']], fill: 'fill', w: 1 }],
    tuft: () => [{ d: [['M', -0.3, 0.2], ['L', -0.38, -0.15], ['M', -0.1, 0.2], ['L', -0.1, -0.3], ['M', 0.1, 0.2], ['L', 0.16, -0.22], ['M', 0.28, 0.2], ['L', 0.4, -0.08], ['M', -0.5, 0.24], ['L', 0.5, 0.24]], fill: 'none', w: 0.9 }],
    dune: () => [{ d: [['M', -0.5, 0.1], ['Q', -0.1, -0.25, 0.45, 0.08]], fill: 'none', w: 0.9 }, { d: circle(0.3, 0.3, 0.04), fill: 'stroke', w: 0 }, { d: circle(-0.25, 0.32, 0.035), fill: 'stroke', w: 0 }],
    city: () => [{ d: circle(0, 0.05, 0.5), fill: 'paper', w: 1 }, { d: house(-0.36, 0.3, 0.22, 0.26), fill: 'fill', w: 0.8 }, { d: house(-0.11, 0.3, 0.24, 0.42), fill: 'fill', w: 0.8 }, { d: house(0.16, 0.3, 0.2, 0.2), fill: 'fill', w: 0.8 }],
    town: () => [{ d: house(-0.3, 0.3, 0.26, 0.24), fill: 'fill', w: 0.9 }, { d: house(0.02, 0.3, 0.28, 0.36), fill: 'fill', w: 0.9 }, { d: [['M', -0.45, 0.32], ['L', 0.45, 0.32]], fill: 'none', w: 0.8 }],
    village: () => [{ d: house(-0.22, 0.28, 0.44, 0.3), fill: 'fill', w: 1 }],
    fortress: () => { const c = []; c.push(['M', -0.48, 0.35], ['L', -0.48, -0.1]); for (let i = 0; i < 5; i++) { const x = -0.48 + i * 0.2; c.push(['L', x, -0.22], ['L', x + 0.1, -0.22], ['L', x + 0.1, -0.1], ['L', x + 0.2, -0.1]); } c.push(['L', 0.52, 0.35], ['Z']);
      return [{ d: c, fill: 'paper', w: 1 }, { d: rect(-0.12, -0.5, 0.24, 0.85), fill: 'paper', w: 1 }, { d: [['M', -0.12, -0.5], ['L', 0, -0.68], ['L', 0.12, -0.5]], fill: 'fill', w: 1 }, { d: [['M', -0.06, 0.35], ['L', -0.06, 0.15], ['Q', 0, 0.08, 0.06, 0.15], ['L', 0.06, 0.35]], fill: 'stroke', w: 0.6 }]; },
    tower: () => [{ d: [['M', -0.16, 0.45], ['L', -0.12, -0.25], ['L', -0.2, -0.25], ['L', -0.2, -0.42], ['L', -0.1, -0.42], ['L', -0.1, -0.34], ['L', -0.03, -0.34], ['L', -0.03, -0.42], ['L', 0.04, -0.42], ['L', 0.04, -0.34], ['L', 0.11, -0.34], ['L', 0.11, -0.42], ['L', 0.2, -0.42], ['L', 0.2, -0.25], ['L', 0.12, -0.25], ['L', 0.16, 0.45], ['Z']], fill: 'paper', w: 1 }, { d: rect(-0.04, -0.1, 0.08, 0.14), fill: 'stroke', w: 0 }],
    ruin: () => [{ d: [['M', -0.45, 0.35], ['L', -0.45, -0.15], ['L', -0.35, -0.25], ['L', -0.3, -0.05], ['L', -0.2, -0.1], ['L', -0.2, 0.35], ['Z']], fill: 'paper', w: 1 }, { d: [['M', -0.05, 0.35], ['L', -0.05, -0.42], ['L', 0.05, -0.36], ['L', 0.08, -0.45], ['L', 0.12, 0.35], ['Z']], fill: 'paper', w: 1 }, { d: [['M', 0.25, 0.35], ['L', 0.25, 0.05], ['L', 0.4, -0.02], ['L', 0.45, 0.35], ['Z']], fill: 'paper', w: 1 }, { d: [['M', -0.55, 0.36], ['L', 0.55, 0.36]], fill: 'none', w: 0.8 }],
    compass: () => { const pts = (r1, r2, n, rot) => { const c = []; for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; c.push([i ? 'L' : 'M', Math.sin(a) * r, -Math.cos(a) * r]); } c.push(['Z']); return c; };
      return [{ d: circle(0, 0, 0.36), fill: 'paper', w: 0.8 }, { d: circle(0, 0, 0.3), fill: 'none', w: 0.5 }, { d: pts(0.32, 0.07, 4, Math.PI / 4), fill: 'paper', w: 0.7 }, { d: pts(0.48, 0.09, 4, 0), fill: 'fill', w: 0.9 }, { d: [['M', 0, -0.48], ['L', 0.09, -0.09], ['L', 0, 0], ['Z'], ['M', 0, 0.48], ['L', -0.09, 0.09], ['L', 0, 0], ['Z'], ['M', 0.48, 0], ['L', 0.09, 0.09], ['L', 0, 0], ['Z'], ['M', -0.48, 0], ['L', -0.09, -0.09], ['L', 0, 0], ['Z']], fill: 'stroke', w: 0 }]; },
    ship: () => [{ d: [['M', -0.48, 0.12], ['Q', 0, 0.4, 0.5, 0.1], ['L', 0.32, 0.12], ['L', -0.36, 0.12], ['Z']], fill: 'fill', w: 1 }, { d: [['M', 0, 0.12], ['L', 0, -0.5]], fill: 'none', w: 0.9 }, { d: [['M', 0.02, -0.45], ['Q', 0.32, -0.2, 0.04, 0.04], ['Z']], fill: 'paper', w: 0.8 }, { d: [['M', -0.02, -0.38], ['Q', -0.26, -0.18, -0.03, 0.02], ['Z']], fill: 'paper', w: 0.8 }, { d: [['M', -0.55, 0.3], ['Q', -0.4, 0.24, -0.25, 0.3], ['Q', -0.1, 0.36, 0.05, 0.3], ['Q', 0.2, 0.24, 0.35, 0.3]], fill: 'none', w: 0.6 }],
    serpent: () => [{ d: [['M', -0.5, 0.1], ['Q', -0.38, -0.25, -0.25, 0.1], ['Q', -0.12, 0.38, 0.02, 0.06], ['Q', 0.16, -0.3, 0.3, 0.02], ['Q', 0.36, -0.22, 0.48, -0.16], ['L', 0.52, -0.08], ['Q', 0.42, -0.1, 0.36, 0.06], ['Q', 0.2, -0.16, 0.08, 0.12], ['Q', -0.1, 0.48, -0.28, 0.16], ['Q', -0.38, -0.05, -0.44, 0.16], ['Z']], fill: 'fill', w: 0.9 }, { d: circle(0.45, -0.13, 0.015), fill: 'stroke', w: 0 }, { d: [['M', -0.6, 0.22], ['Q', -0.45, 0.16, -0.3, 0.22], ['M', 0.1, 0.24], ['Q', 0.25, 0.18, 0.4, 0.24]], fill: 'none', w: 0.6 }],
    marker: () => [{ d: circle(0, 0, 0.32), fill: 'fill', w: 1 }, { d: circle(0, 0, 0.1), fill: 'stroke', w: 0 }],
    star: () => { const c = []; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, r = i % 2 ? 0.2 : 0.48; c.push([i ? 'L' : 'M', Math.sin(a) * r, -Math.cos(a) * r]); } c.push(['Z']); return [{ d: c, fill: 'fill', w: 0.9 }]; },
    cave: () => [{ d: [['M', -0.45, 0.3], ['Q', -0.4, -0.4, 0, -0.42], ['Q', 0.4, -0.4, 0.45, 0.3], ['Z']], fill: 'paper', w: 1 }, { d: [['M', -0.18, 0.3], ['Q', -0.16, -0.12, 0, -0.14], ['Q', 0.16, -0.12, 0.18, 0.3], ['Z']], fill: 'stroke', w: 0 }],
    bridge: () => [{ d: [['M', -0.5, 0.05], ['Q', 0, -0.3, 0.5, 0.05], ['M', -0.5, 0.2], ['Q', 0, -0.15, 0.5, 0.2], ['M', -0.3, 0.12], ['L', -0.3, 0.3], ['M', 0.3, 0.12], ['L', 0.3, 0.3]], fill: 'none', w: 1 }]
  };
  const TYPE_SYMBOL = { mountain: 'mountain', mountains: 'mountain', hills: 'hill', forest: 'tree', swamp: 'tuft', desert: 'dune', city: 'city', town: 'town', village: 'village', fortress: 'fortress', tower: 'tower', ruin: 'ruin', compass: 'compass', ship: 'ship', serpent: 'serpent', symbol: 'marker' };

  // ---------------------------------------------------------------- Pfade
  const f2 = v => String(Math.round(v * 100) / 100);
  function cmdsToD(cmds) { let s = ''; for (const c of cmds) { s += c[0]; for (let i = 1; i < c.length; i++) s += (i > 1 ? ' ' : '') + f2(c[i]); } return s; }
  function glyphCmds(cmds, x, y, size, rot) {
    const cs = Math.cos(rot || 0), sn = Math.sin(rot || 0), out = [];
    for (const c of cmds) { const o = [c[0]]; for (let i = 1; i < c.length; i += 2) { const u = c[i] * size, v = c[i + 1] * size; o.push(x + u * cs - v * sn, y + u * sn + v * cs); } out.push(o); }
    return out;
  }
  // Catmull-Rom -> kubische Bézierkurven (geglättete Linien und Küsten)
  function smoothD(pts, closed) {
    const n = pts.length; if (n < 3) return linearD(pts, closed);
    const P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = 'M' + f2(pts[0][0]) + ' ' + f2(pts[0][1]); const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), t = 1 / 6;
      d += 'C' + f2(p1[0] + (p2[0] - p0[0]) * t) + ' ' + f2(p1[1] + (p2[1] - p0[1]) * t) + ' ' + f2(p2[0] - (p3[0] - p1[0]) * t) + ' ' + f2(p2[1] - (p3[1] - p1[1]) * t) + ' ' + f2(p2[0]) + ' ' + f2(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function linearD(pts, closed) { return pts.map((q, i) => (i ? 'L' : 'M') + f2(q[0]) + ' ' + f2(q[1])).join('') + (closed ? 'Z' : ''); }
  // Punkte entlang einer (ggf. geglätteten) Linie verteilen
  function densify(pts, closed, smooth) {
    if (!smooth || pts.length < 3) return closed ? pts.concat([pts[0]]) : pts;
    const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))], out = [], segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let s = 0; s < 8; s++) { const t = s / 8, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3))); }
    }
    out.push(closed ? pts[0] : pts[n - 1]); return out;
  }
  function alongLine(pts, spacing) {
    const out = []; let acc = spacing / 2;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc <= l) { const t = acc / l; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])]); acc += spacing; }
      acc -= l;
      if (out.length > 2000) break;
    }
    return out;
  }
  function polyArea(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); }
  function centroid(r) { let x = 0, y = 0, a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; x += (r[j][0] + r[i][0]) * f; y += (r[j][1] + r[i][1]) * f; a += f; } if (!a) return centerOf(geomBBox({ type: 'line', coordinates: r })); return [x / (3 * a), y / (3 * a)]; }

  // ---------------------------------------------------------------- Primitive
  // Ergebnis: [{ layer, d, fill, stroke, width, dash, opacity, rule, cap, join, fid } | { layer, text, x, y, size, color, halo, align, angle, font, italic, bold, spacing, fid }]
  function build(map, opt) {
    opt = opt || {};
    const pr = presetOf(map), prims = [];
    const visible = l => !(map.layers && map.layers[l] && map.layers[l].visible === false) && !(opt.hiddenLayers && opt.hiddenLayers.has(l));
    const order = (a, b) => LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer);
    const feats = map.features.map((f, i) => ({ f, i })).sort((a, b) => order(a.f, b.f) || a.i - b.i);
    const ink = pr.ink;
    for (const { f } of feats) {
      if (!visible(f.layer)) continue;
      const st = styleOf(f, map), g = f.geometry, L = f.layer, fid = f.id;
      const fill = st.fill && st.fill !== 'none' ? st.fill : null, stroke = st.stroke && st.stroke !== 'none' ? st.stroke : null;
      const op = st.opacity == null ? 1 : st.opacity, dash = DASHES[st.dash] || [];
      const sym = st.symbol || TYPE_SYMBOL[f.type];
      const glyph = (name, x, y, size, rot, seed) => {
        const fn = GLYPHS[name] || GLYPHS.marker, parts = fn(seed == null ? 0.5 : seed);
        for (const p of parts) {
          const d = cmdsToD(glyphCmds(p.d, x, y, size, rot));
          const pf = p.fill === 'fill' ? (fill || pr.paper) : p.fill === 'paper' ? pr.paper : p.fill === 'stroke' ? (stroke || ink) : null;
          prims.push({ layer: L, fid, d, fill: pf, stroke: p.w ? (stroke || ink) : null, width: (st.width || 1) * p.w, opacity: op, cap: 'round', join: 'round' });
        }
      };
      const scatter = (pts, size, seedBase) => {
        // von oben nach unten zeichnen, damit sich Symbole natürlich überlappen
        pts.sort((a, b) => a[1] - b[1]);
        const R = rng(hashStr(fid + seedBase));
        for (const q of pts) glyph(sym, q[0], q[1], size * (q[2] || (0.85 + R() * 0.3)), 0, R());
      };
      if (g.type === 'polygon') {
        const rings = g.coordinates, smooth = !!st.smooth;
        const d = rings.map(r => smooth ? smoothD(r, true) : linearD(r, true)).join('');
        if (st.coast) { // Küstenlinien: mehrere weiche Konturen im Wasser (klassische Kartenoptik)
          const sea = map.background || pr.sea;
          for (const [w, a] of [[16, 0.10], [10, 0.16], [5, 0.24]]) prims.push({ layer: L, fid, d, fill: null, stroke: stroke || ink, width: w * (st.width || 2) / 2.4, opacity: a * op, join: 'round', coast: true, sea });
        }
        if (fill) prims.push({ layer: L, fid, d, fill, stroke: null, opacity: op, rule: 'evenodd' });
        const areaGlyph = ['mountains', 'hills', 'forest', 'swamp', 'desert'].includes(f.type);
        if (areaGlyph) {
          const size = st.size || 20, dens = st.density || 1, outer = smooth ? densify(rings[0], true, true) : rings[0];
          const poly = [outer].concat(rings.slice(1)), bb = geomBBox({ type: 'polygon', coordinates: poly });
          let sp = size * (f.type === 'mountains' ? 0.75 : f.type === 'forest' ? 0.9 : 1.1) / dens;
          const est = ((bb[2] - bb[0]) * (bb[3] - bb[1])) / (sp * sp); if (est > 900) sp *= Math.sqrt(est / 900);
          const R = rng(hashStr(fid)), pts = [];
          for (let y = bb[1] + sp / 2, row = 0; y < bb[3]; y += sp * 0.8, row++) for (let x = bb[0] + (row % 2 ? sp / 2 : 0); x < bb[2]; x += sp) {
            const jx = x + (R() - 0.5) * sp * 0.7, jy = y + (R() - 0.5) * sp * 0.5;
            if (pointInPolygon(jx, jy + size * 0.25, poly) && pointInPolygon(jx, jy, poly)) pts.push([jx, jy]);
          }
          scatter(pts, size, 'a');
        }
        if (stroke && (st.width || 0) > 0 && !st.coast) prims.push({ layer: L, fid, d, fill: null, stroke, width: st.width, dash, opacity: op, join: 'round', cap: 'round' });
        else if (stroke && st.coast) prims.push({ layer: L, fid, d, fill: null, stroke, width: st.width || 2, opacity: op, join: 'round' });
        if (f.label && f.label.text) { const c = centroid(rings[0]); pushLabel(prims, f, st, pr, c[0], c[1], 'center'); }
      } else if (g.type === 'line') {
        const pts = g.coordinates, smooth = !!st.smooth;
        if (['mountains', 'hills', 'forest'].includes(f.type)) {
          const size = st.size || 24, path = densify(pts, false, smooth), dens = st.density || 1;
          const pos = alongLine(path, size * (f.type === 'forest' ? 0.5 : 0.62) / dens);
          const R = rng(hashStr(fid + 'l'));
          scatter(pos.map((q, i) => [q[0] + (R() - 0.5) * size * 0.25, q[1] + (i % 2 ? 1 : -1) * size * 0.12 * R(), 0.8 + R() * 0.45]), size, 'l');
        } else {
          const d = smooth ? smoothD(pts, false) : linearD(pts, false);
          if (f.type === 'river') prims.push({ layer: L, fid, d, fill: null, stroke: pr.paper, width: (st.width || 3) + 2.5, opacity: 0.5 * op, cap: 'round', join: 'round' });
          if (f.type === 'road' && !dash.length) prims.push({ layer: L, fid, d, fill: null, stroke: pr.paper, width: (st.width || 2) + 2, opacity: 0.6 * op, cap: 'round', join: 'round' });
          prims.push({ layer: L, fid, d, fill: null, stroke: stroke || ink, width: st.width || 2, dash, opacity: op, cap: 'round', join: 'round' });
        }
        if (f.label && f.label.text) {
          const path = densify(pts, false, smooth), mid = alongLine(path, 1e9).length ? null : null; void mid;
          let tot = 0; for (let i = 1; i < path.length; i++) tot += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
          let acc = 0, at = path[0], ang = 0;
          for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); if (acc + l >= tot / 2) { const t = (tot / 2 - acc) / (l || 1); at = [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t]; ang = Math.atan2(path[i][1] - path[i - 1][1], path[i][0] - path[i - 1][0]); break; } acc += l; }
          let deg = ang * 180 / Math.PI; if (deg > 90) deg -= 180; if (deg < -90) deg += 180;
          pushLabel(prims, f, st, pr, at[0], at[1] - (st.width || 2) - 2, 'center', f.label.angle != null ? f.label.angle : deg);
        }
      } else if (g.type === 'group') {
        const size = st.size || 24, R = rng(hashStr(fid + 'g'));
        const pts = g.coordinates.map((q, i) => [q[0], q[1], g.sizes ? g.sizes[i] / size : 0.85 + R() * 0.3]);
        scatter(pts, size, 'g');
        if (f.label && f.label.text) { const b = geomBBox(g); pushLabel(prims, f, st, pr, (b[0] + b[2]) / 2, b[3] + size * 0.6, 'center'); }
      } else { // point
        const [x, y] = g.coordinates, size = st.size || 24;
        if (f.type === 'label') { pushLabel(prims, f, st, pr, x, y, (f.label && f.label.align) || 'center'); continue; }
        if (f.type === 'cartouche') { pushCartouche(prims, f, st, pr, x, y); continue; }
        if (f.type === 'image') {
          const a = assetOf(map, f.asset); if (!a) continue;
          const s = imageSize(f, map);
          prims.push({ layer: L, fid, image: a.src, x, y, w: s.w, h: s.h, angle: st.rotation || 0, opacity: op });
          if (f.label && f.label.text) pushLabel(prims, f, st, pr, x, y + s.h / 2 + 4 + (f.label.size || 16) / 2, f.label.align || 'center');
          continue;
        }
        glyph(sym, x, y, size, 0, (hashStr(fid) % 1000) / 1000);
        if (f.type === 'compass') prims.push({ layer: L, fid, text: 'N', x, y: y - size * 0.52, size: size * 0.16, color: stroke || ink, align: 'center', font: 'serif', bold: true, baseline: 'bottom' });
        if (f.label && f.label.text) pushLabel(prims, f, st, pr, x + size * 0.55, y, f.label.align || 'left');
      }
    }
    return prims;
  }
  function pushLabel(prims, f, st, pr, x, y, align, angle) {
    const l = f.label, size = l.size || (f.layer === 'labels' ? 30 : f.type === 'city' ? 22 : f.geometry.type === 'polygon' ? 28 : 16);
    prims.push({ layer: f.layer === 'labels' ? 'labels' : f.layer, fid: f.id, text: l.caps ? String(l.text).toUpperCase() : String(l.text), x: x + (l.dx || 0), y: y + (l.dy || 0), size,
      color: l.color || (pr.label && pr.label.color) || pr.ink, halo: l.halo || (pr.label && pr.label.halo) || null, align: l.align || align, angle: l.angle != null ? l.angle : (angle || 0),
      font: l.font || 'serif', italic: l.italic != null ? l.italic : f.geometry.type === 'polygon' && ['lake', 'region', 'forest', 'swamp', 'desert'].includes(f.type) || f.type === 'river', bold: !!l.bold, spacing: l.spacing != null ? l.spacing : (l.caps ? 0.25 : 0), label: true });
  }
  function pushCartouche(prims, f, st, pr, x, y) {
    const l = f.label || {}, text = l.text || 'Karte', size = l.size || 44, w = Math.max(160, text.length * size * (0.62 + (l.spacing != null ? l.spacing : 0.2)) + size * 1.8), h = size * 2.1, sc = st.size || 1;
    const W2 = w * sc / 2, H2 = h * sc / 2, k = H2 * 0.5;
    const d = `M${f2(x - W2 + k)} ${f2(y - H2)}L${f2(x + W2 - k)} ${f2(y - H2)}Q${f2(x + W2)} ${f2(y - H2)} ${f2(x + W2)} ${f2(y - H2 + k)}L${f2(x + W2)} ${f2(y + H2 - k)}Q${f2(x + W2)} ${f2(y + H2)} ${f2(x + W2 - k)} ${f2(y + H2)}L${f2(x - W2 + k)} ${f2(y + H2)}Q${f2(x - W2)} ${f2(y + H2)} ${f2(x - W2)} ${f2(y + H2 - k)}L${f2(x - W2)} ${f2(y - H2 + k)}Q${f2(x - W2)} ${f2(y - H2)} ${f2(x - W2 + k)} ${f2(y - H2)}Z`;
    const ink = st.stroke || pr.ink;
    prims.push({ layer: f.layer, fid: f.id, d, fill: st.fill || pr.paper, stroke: ink, width: (st.width || 2), opacity: st.opacity == null ? 1 : st.opacity, join: 'round' });
    const i = 6 * sc, d2 = `M${f2(x - W2 + k + i)} ${f2(y - H2 + i)}L${f2(x + W2 - k - i)} ${f2(y - H2 + i)}L${f2(x + W2 - i)} ${f2(y)}L${f2(x + W2 - k - i)} ${f2(y + H2 - i)}L${f2(x - W2 + k + i)} ${f2(y + H2 - i)}L${f2(x - W2 + i)} ${f2(y)}Z`;
    prims.push({ layer: f.layer, fid: f.id, d: d2, fill: null, stroke: ink, width: (st.width || 2) * 0.5, opacity: st.opacity == null ? 1 : st.opacity, join: 'round' });
    prims.push({ layer: f.layer, fid: f.id, text: l.caps === false ? text : text.toUpperCase(), x, y: y + size * sc * 0.05, size: size * sc, color: l.color || ink, align: 'center', font: l.font || 'caps', spacing: l.spacing != null ? l.spacing : 0.2, angle: l.angle || 0, baseline: 'middle', label: true });
  }

  // ---------------------------------------------------------------- SVG-Export
  const xmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function backgroundPrims(map) {
    const pr = presetOf(map), W = map.width, H = map.height, out = [];
    out.push({ layer: '_bg', d: `M0 0H${W}V${H}H0Z`, fill: map.background || pr.sea, stroke: null });
    if (map.border) {
      out.push({ layer: '_frame', d: `M6 6H${W - 6}V${H - 6}H6Z`, fill: null, stroke: pr.ink, width: 4 });
      out.push({ layer: '_frame', d: `M16 16H${W - 16}V${H - 16}H16Z`, fill: null, stroke: pr.ink, width: 1.2 });
    }
    return out;
  }
  function toSVG(map, opt) {
    opt = opt || {};
    const prims = backgroundPrims(map).filter(p => p.layer === '_bg').concat(build(map, opt), backgroundPrims(map).filter(p => p.layer === '_frame'));
    const out = [`<?xml version="1.0" encoding="UTF-8"?>`, `<svg xmlns="http://www.w3.org/2000/svg" width="${map.width}" height="${map.height}" viewBox="0 0 ${map.width} ${map.height}">`, `<title>${xmlEsc(map.name)}</title>`];
    for (const p of prims) {
      if (p.image != null) {
        const href = opt.resolveImage ? opt.resolveImage(p.image) : p.image; if (!href) continue;
        out.push(`<image href="${xmlEsc(href)}" x="${f2(p.x - p.w / 2)}" y="${f2(p.y - p.h / 2)}" width="${f2(p.w)}" height="${f2(p.h)}" preserveAspectRatio="none"${p.opacity != null && p.opacity < 1 ? ` opacity="${f2(p.opacity)}"` : ''}${p.angle ? ` transform="rotate(${f2(p.angle)} ${f2(p.x)} ${f2(p.y)})"` : ''}/>`);
        continue;
      }
      if (p.text != null) {
        const anchor = p.align === 'left' ? 'start' : p.align === 'right' ? 'end' : 'middle';
        const fam = FONTS[p.font] || FONTS.serif;
        const attrs = [`x="${f2(p.x)}"`, `y="${f2(p.y)}"`, `font-size="${f2(p.size)}"`, `font-family="${xmlEsc(fam)}"`, `text-anchor="${anchor}"`, `fill="${xmlEsc(p.color)}"`,
          p.baseline === 'bottom' ? 'dominant-baseline="text-after-edge"' : 'dominant-baseline="middle"',
          p.italic ? 'font-style="italic"' : '', p.bold ? 'font-weight="bold"' : '', p.spacing ? `letter-spacing="${f2(p.spacing * p.size)}"` : '',
          p.halo ? `stroke="${xmlEsc(p.halo)}" stroke-width="${f2(p.size * 0.18)}" stroke-linejoin="round" paint-order="stroke"` : '',
          p.angle ? `transform="rotate(${f2(p.angle)} ${f2(p.x)} ${f2(p.y)})"` : ''].filter(Boolean).join(' ');
        out.push(`<text ${attrs}>${xmlEsc(p.text)}</text>`);
      } else {
        const a = [`d="${p.d}"`, `fill="${p.fill ? xmlEsc(p.fill) : 'none'}"`];
        if (p.stroke) a.push(`stroke="${xmlEsc(p.stroke)}"`, `stroke-width="${f2(p.width || 1)}"`, `stroke-linecap="${p.cap || 'butt'}"`, `stroke-linejoin="${p.join || 'miter'}"`);
        if (p.dash && p.dash.length) a.push(`stroke-dasharray="${p.dash.map(v => f2(v * Math.max(1, p.width || 1))).join(' ')}"`);
        if (p.opacity != null && p.opacity < 1) a.push(`opacity="${f2(p.opacity)}"`);
        if (p.rule) a.push(`fill-rule="${p.rule}"`);
        out.push(`<path ${a.join(' ')}/>`);
      }
    }
    out.push('</svg>');
    return out.join('\n');
  }

  // ---------------------------------------------------------------- Canvas-Zeichnung (Browser)
  // ctx muss bereits in Weltkoordinaten transformiert sein; prims einmal mit build() erzeugen und wiederverwenden
  // loadImage(src) -> geladenes Bild oder null (Aufrufer lädt nach und zeichnet neu)
  function drawPrims(ctx, prims, cache, loadImage) {
    for (const p of prims) {
      if (p.image != null) {
        const im = loadImage && loadImage(p.image); if (!im) continue;
        ctx.save(); ctx.globalAlpha = p.opacity == null ? 1 : p.opacity; ctx.translate(p.x, p.y); if (p.angle) ctx.rotate(p.angle * Math.PI / 180);
        ctx.drawImage(im, -p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); continue;
      }
      if (p.text != null) {
        ctx.save(); ctx.translate(p.x, p.y); if (p.angle) ctx.rotate(p.angle * Math.PI / 180);
        ctx.font = `${p.italic ? 'italic ' : ''}${p.bold ? 'bold ' : ''}${p.size}px ${FONTS[p.font] || FONTS.serif}`;
        ctx.textAlign = p.align || 'center'; ctx.textBaseline = p.baseline === 'bottom' ? 'bottom' : 'middle';
        if ('letterSpacing' in ctx) ctx.letterSpacing = p.spacing ? (p.spacing * p.size) + 'px' : '0px';
        if (p.halo) { ctx.strokeStyle = p.halo; ctx.lineWidth = p.size * 0.18; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.9; ctx.strokeText(p.text, 0, 0); }
        ctx.globalAlpha = 1; ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.restore(); continue;
      }
      let path = cache && cache.get(p); if (!path) { path = new Path2D(p.d); if (cache) cache.set(p, path); }
      ctx.globalAlpha = p.opacity == null ? 1 : p.opacity;
      if (p.fill && p.fill !== 'none' && p.fill !== 'transparent') { ctx.fillStyle = p.fill; ctx.fill(path, p.rule || 'nonzero'); }
      if (p.stroke) {
        ctx.strokeStyle = p.stroke; ctx.lineWidth = p.width || 1; ctx.lineCap = p.cap || 'butt'; ctx.lineJoin = p.join || 'miter';
        ctx.setLineDash(p.dash && p.dash.length ? p.dash.map(v => v * Math.max(1, p.width || 1)) : []);
        ctx.stroke(path); ctx.setLineDash([]);
      }
    }
    ctx.globalAlpha = 1;
  }

  const API = {
    FORMAT, VERSION, LAYERS, TYPES, SYMBOLS, DASHES, FONTS, PRESETS, LIMITS, DEFAULT_SIZE, MapError,
    newId, createMap, normAsset, assetOf, normalizeMap, migrate, normMeta, normFeature, normStyle, normLabel, applyOps, query, brief, summarize,
    styleOf, featureBBox, featureDistance, geomBBox, pointInPolygon, simplify, mapPoints, build, backgroundPrims, toSVG, drawPrims, polyArea
  };
  root.IAM_FMAP = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
