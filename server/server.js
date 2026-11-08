/* =========================================================================
   Ascandir InteractiveMap – Webserver für Docker
   - liefert die App (Ordner src/) im Browser aus
   - speichert Welten & Zeitlinien als JSON in DATA_DIR (Docker-Volume)
   - Live-Updates per Server-Sent Events
   - Lese-API für Story-KIs unter /api/v1
   Keine externen Abhängigkeiten (nur Node.js).
   ========================================================================= */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const PORT = +process.env.PORT || 8080;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
const SRC_DIR = path.resolve(process.env.SRC_DIR || path.join(__dirname, '..', 'src'));
const USER = process.env.IAM_USER || 'admin';
const PASSWORD = process.env.IAM_PASSWORD || '';
const API_TOKEN = process.env.IAM_API_TOKEN || '';
const READONLY = /^(1|true|yes)$/i.test(process.env.IAM_READONLY || '');
const VERSION = (() => { try { return require(path.join(__dirname, '..', 'package.json')).version; } catch { return 'docker'; } })();
const DIRS = ['worlds', 'timelines'];
for (const d of DIRS) fs.mkdirSync(path.join(DATA_DIR, d), { recursive: true });

// ---------------------------------------------------------------- Kanon-Daten aus den Browser-Skripten laden
const sandbox = { window: {}, navigator: { language: 'de' }, console };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
for (const f of ['i18n.js', 'worlds/starwars.js', 'worlds/starwars-facts.js']) {
  vm.runInContext(fs.readFileSync(path.join(SRC_DIR, f), 'utf8'), sandbox, { filename: f });
}
const SW = sandbox.window.IAM_WORLDS.starwars;
const I18N = sandbox.window.I18N;

// ---------------------------------------------------------------- Hilfen
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function send(res, code, body, type = 'application/json; charset=utf-8', extra = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body, null, 2);
  res.writeHead(code, Object.assign({ 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra));
  res.end(data);
}
function safeFile(dir, file) {
  if (!DIRS.includes(dir)) throw Object.assign(new Error('unknown dir'), { code: 404 });
  const b = path.basename(String(file || ''));
  if (!/^[^<>:"/\\|?*]+\.json$/i.test(b) || b !== file) throw Object.assign(new Error('invalid file name'), { code: 400 });
  return path.join(DATA_DIR, dir, b);
}
function readBody(req, limit = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
const tsEqual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
function authorized(req, url) {
  if (!PASSWORD && !API_TOKEN) return true;
  const h = req.headers.authorization || '';
  if (API_TOKEN) {
    if (h.startsWith('Bearer ') && tsEqual(h.slice(7).trim(), API_TOKEN)) return true;
    if (url.searchParams.get('token') && tsEqual(url.searchParams.get('token'), API_TOKEN)) return true;
  }
  if (PASSWORD && h.startsWith('Basic ')) {
    const [u, ...p] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
    if (tsEqual(u, USER) && tsEqual(p.join(':'), PASSWORD)) return true;
  }
  return !PASSWORD && !url.pathname.startsWith('/api/v1'); // nur Token gesetzt: Oberfläche offen, KI-API geschützt
}

// ---------------------------------------------------------------- Live-Updates (SSE)
const clients = new Set();
const timers = {};
for (const d of DIRS) {
  fs.watch(path.join(DATA_DIR, d), (_e, f) => {
    if (!f || !f.toLowerCase().endsWith('.json')) return;
    const key = d + '/' + f; clearTimeout(timers[key]);
    timers[key] = setTimeout(() => { for (const c of clients) c.write(`data: ${JSON.stringify({ dir: d, file: f })}\n\n`); }, 300);
  });
}
setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 25000);

// ---------------------------------------------------------------- Daten für die API
function listJson(dir) {
  return fs.readdirSync(path.join(DATA_DIR, dir)).filter(f => f.toLowerCase().endsWith('.json')).map(f => {
    try { return Object.assign(JSON.parse(fs.readFileSync(path.join(DATA_DIR, dir, f), 'utf8')), { _file: f }); } catch { return null; }
  }).filter(Boolean);
}
function allWorlds(lang) {
  return [{ id: 'starwars', name: SW.name[lang] || SW.name.de, type: 'scifi', builtin: true }]
    .concat(listJson('worlds').map(w => ({ id: w.id, name: w.name, type: w.type, builtin: false, yearFmt: w.yearFmt })));
}
function allTimelines(lang) {
  const canon = SW.canonTimeline(lang);
  return [canon].concat(listJson('timelines').map(t => { t.world ||= 'starwars'; t.routes ||= []; return t; }));
}
function findTimeline(q, lang) {
  const tls = allTimelines(lang);
  if (!q) return tls[0];
  const ql = String(q).toLowerCase();
  return tls.find(t => t.id === q) || tls.find(t => (t.name || '').toLowerCase() === ql) || tls.find(t => (t._file || '').toLowerCase() === ql || (t._file || '').toLowerCase() === ql + '.json');
}
function worldOf(tl, lang) { return allWorlds(lang).find(w => w.id === tl.world) || allWorlds(lang)[0]; }
function yearFmt(tl, lang) {
  if (tl.world === 'starwars') return SW.yearFmt[lang] || SW.yearFmt.de;
  const w = listJson('worlds').find(x => x.id === tl.world); return (w && w.yearFmt) || { neg: '', pos: '' };
}
function fmtYear(y, f) { if (y == null || y === '') return null; y = Math.round(+y); if (y < 0 && f.neg) return `${-y} ${f.neg}`; if (y >= 0 && f.pos) return `${y} ${f.pos}`; return String(y); }
function parseYear(s, f) {
  if (s == null || s === '') return null;
  const m = String(s).trim().replace(/[.,\s](?=\d{3}\b)/g, '').match(/^([+-]?\d+)\s*(.*)$/); if (!m) return null;
  let n = parseInt(m[1], 10); const suf = m[2].trim().toLowerCase();
  if (suf && (['vsy', 'bby', 'v. z.', 'v.z.', 'bc'].includes(suf) || (f.neg && suf === f.neg.toLowerCase()))) n = -Math.abs(n);
  return n;
}
function eraAt(tl, y) { let cur = null; for (const e of tl.eras.slice().sort((a, b) => a.year - b.year)) { if (e.year <= y) cur = e; else break; } return cur; }
function exists(o, y) { return (o.from == null || o.from === '' || y >= +o.from) && (o.to == null || o.to === '' || y <= +o.to); }
const CHILD = ['moon', 'station'];

function snapshot(tl, year, lang) {
  I18N.setLang(lang);
  const f = yearFmt(tl, lang), e = eraAt(tl, year), byId = Object.fromEntries(tl.objects.map(o => [o.id, o]));
  const ctrlKey = o => { let c = o, n = 0; while (CHILD.includes(c.type) && c.parent && byId[c.parent] && n++ < 8) c = byId[c.parent]; return c.id; };
  const controller = o => { if (!e) return null; const fid = e.control[ctrlKey(o)]; return fid ? tl.factions.find(x => x.id === fid) || null : null; };
  const regionName = r => r ? (tl.world === 'starwars' ? I18N.t('regions.' + r) : r) : null;
  const factions = tl.factions.map(fa => {
    const systems = e ? Object.keys(e.control).filter(k => e.control[k] === fa.id).map(k => byId[k]).filter(o => o && exists(o, year))
      .sort((a, b) => ((b.desc ? 2 : 0) + (b.facts ? 1 : 0)) - ((a.desc ? 2 : 0) + (a.facts ? 1 : 0))) : [];
    const regions = e ? Object.keys(e.regionClaims || {}).filter(r => e.regionClaims[r] === fa.id).map(regionName) : [];
    const zones = e ? (e.zones || []).filter(z => z.faction === fa.id).length : 0;
    return { id: fa.id, name: fa.name, color: fa.color, regions, places: systems.map(o => o.name), placeCount: systems.length, paintedAreas: zones };
  }).filter(x => x.placeCount || x.regions.length || x.paintedAreas);
  return { e, f, byId, controller, regionName, factions };
}
function placeInfo(tl, o, year, lang, snap) {
  const { f, byId, controller, regionName } = snap || snapshot(tl, year, lang);
  // fehlende Angaben in Star-Wars-Zeitlinien aus dem Kanon ergänzen
  const c = tl.world === 'starwars' && tl.id !== 'canon' ? SW.canonTimeline(lang).objects.find(x => x.id === o.id) : null;
  if (c) o = Object.assign({}, o, { desc: o.desc || c.desc, biome: o.biome || c.biome, facts: Object.assign({}, c.facts || {}, o.facts || {}) });
  const fac = controller(o);
  const kids = tl.objects.filter(x => x.parent === o.id && exists(x, year)).map(x => x.name);
  return {
    id: o.id, name: o.name, type: o.type, typeLabel: I18N.t('types.' + o.type), region: regionName(o.region), sector: o.sector || null,
    orbits: o.parent && byId[o.parent] ? byId[o.parent].name : null, contains: kids,
    existsInYear: exists(o, year), existsFrom: fmtYear(o.from, f), existsTo: fmtYear(o.to, f),
    controlledBy: fac ? fac.name : null, description: o.desc || '', biome: o.biome ? I18N.t('biomes.' + o.biome) : null,
    facts: o.facts || {}
  };
}
function findPlace(tl, name) {
  const q = String(name || '').toLowerCase().trim(); if (!q) return null;
  const cands = tl.objects.filter(o => o.name.toLowerCase() === q || o.id.toLowerCase() === q);
  return cands.sort((a, b) => (a.type === 'planet' ? -1 : 0) - (b.type === 'planet' ? -1 : 0))[0] || tl.objects.find(o => o.name.toLowerCase().includes(q)) || null;
}
function summaryText(tl, year, lang, placeNames, maxPlaces) {
  I18N.setLang(lang);
  const snap = snapshot(tl, year, lang), { e, f } = snap, de = lang !== 'en', L = [];
  const w = worldOf(tl, lang);
  L.push(de ? `Welt: ${w.name} · Zeitlinie: ${tl.name}` : `World: ${w.name} · Timeline: ${tl.name}`);
  L.push(de ? `Jahr: ${fmtYear(year, f)}` : `Year: ${fmtYear(year, f)}`);
  if (e) L.push((de ? 'Zeitalter: ' : 'Era: ') + `${e.name} (${de ? 'seit' : 'since'} ${fmtYear(e.year, f)})` + (e.desc ? ` – ${e.desc}` : ''));
  else L.push(de ? 'Zeitalter: keines (vor dem ersten Zeitalter)' : 'Era: none (before the first era)');
  if (snap.factions.length) {
    L.push(de ? 'Mächte und Gebiete:' : 'Powers and territories:');
    for (const fa of snap.factions) {
      const parts = [];
      if (fa.regions.length) parts.push((de ? 'Regionen: ' : 'regions: ') + fa.regions.join(', '));
      if (fa.placeCount) parts.push((de ? 'Orte: ' : 'places: ') + fa.places.slice(0, maxPlaces).join(', ') + (fa.placeCount > maxPlaces ? (de ? ` u. ${fa.placeCount - maxPlaces} weitere` : ` and ${fa.placeCount - maxPlaces} more`) : ''));
      L.push(`- ${fa.name}: ${parts.join('; ') || (de ? 'eigene Einflussgebiete' : 'own spheres of influence')}`);
    }
  }
  for (const pn of placeNames) {
    const o = findPlace(tl, pn); if (!o) { L.push((de ? 'Unbekannter Ort: ' : 'Unknown place: ') + pn); continue; }
    const p = placeInfo(tl, o, year, lang, snap), fx = p.facts, rows = [];
    rows.push(`${p.name} (${p.typeLabel}${p.region ? ', ' + p.region : ''}${p.sector ? ', ' + (de ? 'Sektor ' : 'sector ') + p.sector : ''})`);
    if (!p.existsInYear) rows.push(de ? '  existiert in diesem Jahr nicht' : '  does not exist in this year');
    rows.push((de ? '  Kontrolle: ' : '  Control: ') + (p.controlledBy || (de ? 'neutral/unbekannt' : 'neutral/unknown')));
    if (p.description) rows.push('  ' + p.description);
    const labels = de ? { biome: 'Biom', temp: 'Temperatur', pop: 'Bevölkerung', climate: 'Klima', terrain: 'Gelände', species: 'Bewohner', capital: 'Hauptort', notable: 'Besonderheiten' }
      : { biome: 'Biome', temp: 'Temperature', pop: 'Population', climate: 'Climate', terrain: 'Terrain', species: 'Inhabitants', capital: 'Capital', notable: 'Notable' };
    if (p.biome) rows.push(`  ${labels.biome}: ${p.biome}`);
    for (const k of ['temp', 'pop', 'climate', 'terrain', 'species', 'capital', 'notable']) if (fx[k]) rows.push(`  ${labels[k]}: ${fx[k]}`);
    for (const [l, v] of fx.extra || []) if (l || v) rows.push(`  ${l}: ${v}`);
    if (p.orbits) rows.push((de ? '  Umkreist: ' : '  Orbits: ') + p.orbits);
    if (p.contains.length) rows.push((de ? '  Umfasst: ' : '  Contains: ') + p.contains.join(', '));
    L.push(rows.join('\n'));
  }
  return L.join('\n');
}

// ---------------------------------------------------------------- Schreib-API (für ChatGPT-Actions u. a.)
const uid = p => p + crypto.randomBytes(5).toString('hex');
function slug(n) { return (String(n || 'zeitlinie').normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'zeitlinie').slice(0, 60); }
function writableTimeline(q, lang) {
  const t = findTimeline(q, lang);
  if (!t) throw Object.assign(new Error('timeline not found'), { code: 404 });
  if (t.readonly || !t._file) throw Object.assign(new Error('Die Kanon-Zeitlinie ist schreibgeschützt. Lege mit POST /api/v1/timeline/copy eine Kopie an. / The canon timeline is read-only, create a copy first.'), { code: 409 });
  return t;
}
function saveTimeline(t) {
  const file = t._file; const c = Object.assign({}, t); delete c._file; delete c.readonly;
  const p = safeFile('timelines', file), tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(c, null, 2), 'utf8'); fs.renameSync(tmp, p);
}
const findFaction = (t, n) => { const q = String(n || '').toLowerCase().trim(); return t.factions.find(f => f.id === n || f.name.toLowerCase() === q) || null; };
function eraForWrite(t, b, lang) {
  if (b.era) { const q = String(b.era).toLowerCase(); const e = t.eras.find(x => x.id === b.era || x.name.toLowerCase() === q); if (e) return e; }
  const y = parseYear(b.year, yearFmt(t, lang));
  if (y == null) throw Object.assign(new Error('year or era required'), { code: 400 });
  const e = eraAt(t, y); if (!e) throw Object.assign(new Error('no era at this year – create one with POST /api/v1/era'), { code: 400 });
  return e;
}
const TYPES = ['sun', 'planet', 'moon', 'station', 'capital', 'city', 'village', 'fortress', 'landmark'];
async function apiWrite(req, res, url, parts) {
  if (!API_TOKEN) return send(res, 403, { error: 'Schreibzugriff deaktiviert: setze IAM_API_TOKEN im Container. / Write access disabled: set IAM_API_TOKEN.' });
  if (READONLY) return send(res, 403, { error: 'read-only' });
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7).trim() : url.searchParams.get('token');
  if (!tok || !tsEqual(tok, API_TOKEN)) return send(res, 401, { error: 'API token required (Authorization: Bearer …)' });
  const raw = await readBody(req); let b = {};
  if (raw.trim()) b = JSON.parse(raw);
  const q = url.searchParams, lang = (b.lang || q.get('lang')) === 'en' ? 'en' : 'de';
  const tlName = b.timeline || q.get('timeline');
  const ep = parts.join('/');

  if (ep === 'timeline/copy' && req.method === 'POST') {
    const src = findTimeline(b.from || 'canon', lang); if (!src) return send(res, 404, { error: 'source timeline not found' });
    const c = JSON.parse(JSON.stringify(src)); delete c._file; delete c.readonly;
    c.id = uid('tl'); c.name = b.name || (src.name + ' (Kopie)');
    let f = slug(c.name) + '.json', i = 2; while (fs.existsSync(path.join(DATA_DIR, 'timelines', f))) f = `${slug(c.name)}_${i++}.json`;
    c._file = f; saveTimeline(c); return send(res, 201, { ok: true, id: c.id, name: c.name, file: f });
  }
  if (ep === 'timeline' && req.method === 'PUT') {
    const t = writableTimeline(tlName, lang), nt = b.timeline && b.objects === undefined ? b.timeline : b;
    if (!Array.isArray(nt.objects) || !Array.isArray(nt.eras) || !Array.isArray(nt.factions)) return send(res, 400, { error: 'objects, eras and factions arrays required' });
    nt.id = t.id; nt.world = nt.world || t.world; nt._file = t._file; delete nt.timeline; saveTimeline(nt); return send(res, 200, { ok: true });
  }
  const t = writableTimeline(tlName, lang);
  const byName = n => findPlace(t, n);

  if (ep === 'place' && (req.method === 'POST' || req.method === 'PATCH')) {
    if (!b.name) return send(res, 400, { error: 'name required' });
    let o = (b.id && t.objects.find(x => x.id === b.id)) || t.objects.find(x => x.name.toLowerCase() === String(b.name).toLowerCase());
    const created = !o;
    if (!o) { o = { id: uid('o'), name: b.name, type: 'planet', x: 0, y: 0, region: null, sector: null, desc: '', parent: null, from: null, to: null }; t.objects.push(o); }
    if (b.newName) o.name = b.newName;
    if (b.type && TYPES.includes(b.type)) o.type = b.type;
    if (b.orbits !== undefined) { const p = b.orbits ? byName(b.orbits) : null; if (b.orbits && !p) return send(res, 404, { error: 'orbits: place not found' }); o.parent = p ? p.id : null; if (p) { o.x = p.x; o.y = p.y; o.region = o.region || p.region; o.sector = o.sector || p.sector; } }
    if (b.near) { const p = byName(b.near); if (!p) return send(res, 404, { error: 'near: place not found' }); const a = Math.random() * Math.PI * 2, d = +b.distance || 40; o.x = Math.round(p.x + Math.cos(a) * d); o.y = Math.round(p.y + Math.sin(a) * d); o.region = o.region || p.region; o.sector = o.sector || p.sector; }
    if (b.grid && /^[A-Za-z]\d{1,2}$/.test(b.grid)) { o.x = Math.round((b.grid.toUpperCase().charCodeAt(0) - 64.5) * 100 + (Math.random() - 0.5) * 60); o.y = Math.round((+b.grid.slice(1) - 0.5) * 100 + (Math.random() - 0.5) * 60); }
    if (b.x != null) o.x = Math.round(+b.x); if (b.y != null) o.y = Math.round(+b.y);
    for (const k of ['region', 'sector', 'biome']) if (b[k] !== undefined) o[k] = b[k] || null;
    if (b.description !== undefined) o.desc = b.description;
    const f = yearFmt(t, lang);
    if (b.existsFrom !== undefined) o.from = b.existsFrom === null || b.existsFrom === '' ? null : parseYear(b.existsFrom, f);
    if (b.existsTo !== undefined) o.to = b.existsTo === null || b.existsTo === '' ? null : parseYear(b.existsTo, f);
    if (b.facts && typeof b.facts === 'object') {
      o.facts = Object.assign({}, o.facts || {});
      for (const [k, v] of Object.entries(b.facts)) {
        if (k === 'extra' && Array.isArray(v)) { o.facts.extra = o.facts.extra || []; for (const [l, val] of v) { const ex = o.facts.extra.find(e => e[0] === l); if (ex) ex[1] = val; else o.facts.extra.push([l, val]); } }
        else if (v === null || v === '') delete o.facts[k]; else o.facts[k] = String(v);
      }
    }
    if (created && !b.orbits && !b.near && !b.grid && b.x == null) { o.x = 1150; o.y = 950; }
    saveTimeline(t); return send(res, created ? 201 : 200, { ok: true, created, place: o });
  }
  if (ep === 'place' && req.method === 'DELETE') {
    const o = byName(b.name || q.get('name')); if (!o) return send(res, 404, { error: 'place not found' });
    for (const k of t.objects) if (k.parent === o.id) k.parent = o.parent || null;
    t.objects = t.objects.filter(x => x !== o); for (const e of t.eras) delete e.control[o.id];
    for (const r of t.routes || []) r.points = r.points.filter(p => p !== o.id);
    saveTimeline(t); return send(res, 200, { ok: true });
  }
  if (ep === 'faction' && (req.method === 'POST' || req.method === 'PATCH')) {
    if (!b.name) return send(res, 400, { error: 'name required' });
    let f = findFaction(t, b.id || b.name), created = !f;
    if (!f) { f = { id: uid('f'), name: b.name, color: '#888888', reach: 120 }; t.factions.push(f); }
    if (b.newName) f.name = b.newName; if (b.color) f.color = b.color; if (b.reach) f.reach = +b.reach;
    saveTimeline(t); return send(res, created ? 201 : 200, { ok: true, created, faction: f });
  }
  if (ep === 'era' && (req.method === 'POST' || req.method === 'PATCH')) {
    const f = yearFmt(t, lang), y = parseYear(b.year, f);
    let e = b.id ? t.eras.find(x => x.id === b.id) : (b.name ? t.eras.find(x => x.name.toLowerCase() === String(b.name).toLowerCase()) : null);
    if (!e && y != null) e = t.eras.find(x => x.year === y);
    const created = !e;
    if (!e) {
      if (y == null) return send(res, 400, { error: 'year required for a new era' });
      const base = eraAt(t, y); e = base ? JSON.parse(JSON.stringify(base)) : { control: {}, regionClaims: {}, zones: [] };
      e.id = uid('era'); e.name = b.name || 'Era'; e.year = y; e.desc = ''; t.eras.push(e);
    }
    if (b.name && !created) e.name = b.newName || e.name; if (b.newName) e.name = b.newName;
    if (y != null && !created) e.year = y; if (b.description !== undefined) e.desc = b.description;
    t.eras.sort((a, c) => a.year - c.year);
    saveTimeline(t); return send(res, created ? 201 : 200, { ok: true, created, era: { id: e.id, name: e.name, year: e.year, label: fmtYear(e.year, f) } });
  }
  if (ep === 'control' && req.method === 'POST') {
    const e = eraForWrite(t, b, lang), o = byName(b.place); if (!o) return send(res, 404, { error: 'place not found' });
    const bid = Object.fromEntries(t.objects.map(x => [x.id, x])); let k = o, n = 0; while (CHILD.includes(k.type) && k.parent && bid[k.parent] && n++ < 8) k = bid[k.parent];
    if (!b.faction) delete e.control[k.id];
    else { const f = findFaction(t, b.faction); if (!f) return send(res, 404, { error: 'faction not found – create it with POST /api/v1/faction' }); e.control[k.id] = f.id; }
    saveTimeline(t); return send(res, 200, { ok: true, era: e.name, place: k.name, faction: b.faction || null });
  }
  return send(res, 404, { error: 'unknown write endpoint' });
}

function openApi(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0], host = req.headers['x-forwarded-host'] || req.headers.host;
  const str = (d, ex) => Object.assign({ type: 'string', description: d }, ex ? { example: ex } : {});
  const qp = (name, d, ex, req2) => ({ name, in: 'query', required: !!req2, description: d, schema: { type: 'string' }, ...(ex ? { example: ex } : {}) });
  const tlP = qp('timeline', 'Name oder ID der Zeitlinie (leer = Kanon, schreibgeschützt)', 'Meine Zeitlinie'), yP = qp('year', 'Jahr, z.B. "3640 VSY", "3640 BBY", "-3640", "4 NSY"', '3640 BBY'), lP = qp('lang', 'de oder en', 'de');
  const body = (props, required) => ({ required: true, content: { 'application/json': { schema: { type: 'object', properties: props, required } } } });
  const ok = { 200: { description: 'OK' } };
  return {
    openapi: '3.1.0',
    info: { title: 'Ascandir InteractiveMap', version: VERSION, description: 'Interaktive Karte (Star Wars & eigene Welten). Lesen: Zustand der Galaxis in einem Jahr, Orte, Fraktionen. Schreiben: Orte, Fraktionen, Zeitalter und Kontrolle in einer eigenen (kopierten) Zeitlinie ändern.' },
    servers: [{ url: `${proto}://${host}` }],
    components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } } },
    security: [{ bearer: [] }],
    paths: {
      '/api/v1/timelines': { get: { operationId: 'listTimelines', summary: 'Alle Zeitlinien mit ihren Zeitaltern', parameters: [qp('world', 'Welt-ID'), lP], responses: ok } },
      '/api/v1/summary': { get: { operationId: 'getSummary', summary: 'Kurzer Text zum Zustand in einem Jahr (Zeitalter, Mächte, optional Orte)', parameters: [tlP, yP, lP, { name: 'place', in: 'query', description: 'Ortsname (mehrfach möglich)', schema: { type: 'array', items: { type: 'string' } }, style: 'form', explode: true }], responses: ok } },
      '/api/v1/state': { get: { operationId: 'getState', summary: 'Zeitalter und Fraktionen mit Gebieten in einem Jahr (JSON)', parameters: [tlP, yP, lP], responses: ok } },
      '/api/v1/place': {
        get: { operationId: 'getPlace', summary: 'Eckdaten und Kontrolle eines Ortes', parameters: [qp('name', 'Ortsname', 'Tatooine', true), tlP, yP, lP], responses: ok },
        post: { operationId: 'upsertPlace', summary: 'Ort anlegen oder ändern (nur eigene Zeitlinien)', requestBody: body({
          timeline: str('Zeitlinie (Name/ID)'), name: str('Name des Ortes', 'Neu-Taris'), newName: str('Neuer Name (Umbenennen)'),
          type: { type: 'string', enum: TYPES }, orbits: str('Umkreist diesen Ort (Mond → Planet, Planet → Sonne)'), near: str('In der Nähe dieses Ortes platzieren'),
          grid: str('Rasterfeld der Galaxiekarte, z.B. R16'), x: { type: 'number' }, y: { type: 'number' }, region: str('Region, z.B. outerrim, midrim, core, unknown'), sector: str('Sektor'),
          biome: { type: 'string', enum: ['desert', 'reddesert', 'ice', 'tundra', 'ocean', 'islands', 'forest', 'redforest', 'jungle', 'swamp', 'grassland', 'mountains', 'volcanic', 'city', 'gas', 'gasblue', 'barren', 'salt', 'toxic', 'crystal', 'storm', 'machine'] },
          description: str('Beschreibung'), existsFrom: str('Existiert ab Jahr'), existsTo: str('Existiert bis Jahr'),
          facts: { type: 'object', description: 'Eckdaten; null löscht ein Feld', properties: { pop: { type: 'string' }, temp: { type: 'string' }, climate: { type: 'string' }, terrain: { type: 'string' }, species: { type: 'string' }, capital: { type: 'string' }, notable: { type: 'string' }, extra: { type: 'array', items: { type: 'array', items: { type: 'string' } }, description: 'Eigene Zeilen [["Herrscher","…"]]' } } }
        }, ['timeline', 'name']), responses: ok },
        delete: { operationId: 'deletePlace', summary: 'Ort löschen', parameters: [qp('name', 'Ortsname', null, true), qp('timeline', 'Zeitlinie', null, true)], responses: ok }
      },
      '/api/v1/faction': { post: { operationId: 'upsertFaction', summary: 'Fraktion anlegen oder ändern', requestBody: body({ timeline: str('Zeitlinie'), name: str('Name'), newName: str('Neuer Name'), color: str('Farbe #rrggbb'), reach: { type: 'number', description: 'Einflussradius (Standard 120)' } }, ['timeline', 'name']), responses: ok } },
      '/api/v1/era': { post: { operationId: 'upsertEra', summary: 'Zeitalter anlegen (übernimmt den Stand davor) oder ändern', requestBody: body({ timeline: str('Zeitlinie'), name: str('Name'), newName: str('Neuer Name'), year: str('Startjahr, z.B. 3640 BBY'), description: str('Beschreibung') }, ['timeline']), responses: ok } },
      '/api/v1/control': { post: { operationId: 'setControl', summary: 'Legt fest, welche Fraktion einen Ort in einem Zeitalter kontrolliert (faction leer = neutral)', requestBody: body({ timeline: str('Zeitlinie'), place: str('Ortsname'), faction: str('Fraktionsname'), year: str('Jahr (wählt das Zeitalter)'), era: str('oder Name des Zeitalters') }, ['timeline', 'place']), responses: ok } },
      '/api/v1/timeline/copy': { post: { operationId: 'copyTimeline', summary: 'Zeitlinie kopieren (z.B. Kanon → eigene, bearbeitbare Zeitlinie)', requestBody: body({ from: str('Quelle (leer = Kanon)'), name: str('Name der neuen Zeitlinie') }, ['name']), responses: ok } }
    }
  };
}

// ---------------------------------------------------------------- API v1 (für Story-KIs)
async function apiV1(req, res, url) {
  const q = url.searchParams, lang = q.get('lang') === 'en' ? 'en' : 'de', parts = url.pathname.split('/').filter(Boolean).slice(2);
  const tl = () => { const t = findTimeline(q.get('timeline'), lang); if (!t) throw Object.assign(new Error('timeline not found'), { code: 404 }); return t; };
  const year = t => { const y = parseYear(q.get('year'), yearFmt(t, lang)); if (y != null) return y; const s = t.eras.slice().sort((a, b) => a.year - b.year); return s.length ? s[s.length - 1].year : 0; };
  if (parts[0] === 'openapi.json') return send(res, 200, openApi(req));
  if (req.method !== 'GET') return apiWrite(req, res, url, parts);
  if (!parts.length) return send(res, 200, {
    name: 'Ascandir InteractiveMap API', version: VERSION,
    endpoints: {
      'GET /api/v1/worlds': 'Alle Welten',
      'GET /api/v1/timelines?world=': 'Zeitlinien (optional nach Welt gefiltert)',
      'GET /api/v1/timeline?timeline=&lang=': 'Komplette Zeitlinie als JSON',
      'GET /api/v1/state?timeline=&year=&lang=': 'Zeitalter + Fraktionen mit Gebieten im Jahr',
      'GET /api/v1/place?name=&timeline=&year=&lang=': 'Eckdaten und Kontrolle eines Ortes im Jahr',
      'GET /api/v1/search?q=&timeline=': 'Orte suchen',
      'GET /api/v1/summary?timeline=&year=&place=&place=&lang=&max=': 'Fertiger Text für den KI-Kontext (text/plain)',
      'GET /api/v1/openapi.json': 'OpenAPI-Beschreibung (z.B. für ChatGPT-Actions)',
      'POST /api/v1/timeline/copy': 'Zeitlinie kopieren (Schreibzugriff mit IAM_API_TOKEN)',
      'POST /api/v1/place | DELETE /api/v1/place': 'Ort anlegen/ändern/löschen',
      'POST /api/v1/faction': 'Fraktion anlegen/ändern',
      'POST /api/v1/era': 'Zeitalter anlegen/ändern',
      'POST /api/v1/control': 'Kontrolle über einen Ort setzen',
      'PUT /api/v1/timeline?timeline=': 'Komplette Zeitlinie ersetzen'
    },
    hints: { year: 'z.B. "3640 VSY", "3640 BBY", "-3640", "4 NSY"', timeline: 'ID, Name oder Dateiname; leer = Kanon' }
  });
  const ep = parts[0];
  if (ep === 'worlds') return send(res, 200, allWorlds(lang));
  if (ep === 'timelines') return send(res, 200, allTimelines(lang).filter(t => !q.get('world') || t.world === q.get('world'))
    .map(t => ({ id: t.id, name: t.name, world: t.world, readonly: !!t.readonly, file: t._file || null, eras: t.eras.map(e => ({ name: e.name, year: e.year, label: fmtYear(e.year, yearFmt(t, lang)) })) })));
  if (ep === 'timeline') { const t = tl(); const c = Object.assign({}, t); delete c._file; return send(res, 200, c); }
  if (ep === 'state') {
    const t = tl(), y = year(t), s = snapshot(t, y, lang);
    return send(res, 200, { timeline: t.name, world: worldOf(t, lang).name, year: y, yearLabel: fmtYear(y, s.f),
      era: s.e ? { name: s.e.name, since: fmtYear(s.e.year, s.f), description: s.e.desc || '' } : null, factions: s.factions });
  }
  if (ep === 'place') {
    const t = tl(), y = year(t), o = findPlace(t, q.get('name'));
    if (!o) return send(res, 404, { error: 'place not found' });
    return send(res, 200, Object.assign({ year: y, yearLabel: fmtYear(y, yearFmt(t, lang)) }, placeInfo(t, o, y, lang)));
  }
  if (ep === 'search') {
    const t = tl(), qq = (q.get('q') || '').toLowerCase();
    return send(res, 200, t.objects.filter(o => !qq || o.name.toLowerCase().includes(qq)).slice(0, 100).map(o => ({ id: o.id, name: o.name, type: o.type, region: o.region || null, sector: o.sector || null })));
  }
  if (ep === 'summary') {
    const t = tl(), y = year(t);
    return send(res, 200, summaryText(t, y, lang, q.getAll('place').filter(Boolean), Math.max(3, Math.min(200, +q.get('max') || 25))), 'text/plain; charset=utf-8');
  }
  return send(res, 404, { error: 'unknown endpoint' });
}

// ---------------------------------------------------------------- Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/health') return send(res, 200, { ok: true });
    if (url.pathname === '/api/v1/openapi.json') return send(res, 200, openApi(req));
    if (!authorized(req, url)) return send(res, 401, { error: 'unauthorized' }, 'application/json', { 'WWW-Authenticate': 'Basic realm="InteractiveMap", charset="UTF-8"' });

    if (url.pathname === '/api/info') return send(res, 200, { version: VERSION, packaged: true, server: true, readonly: READONLY, dataDir: DATA_DIR });
    if (url.pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write(': connected\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    const m = url.pathname.match(/^\/api\/files\/([a-z]+)(?:\/([^/]+))?$/);
    if (m) {
      const dir = m[1], file = m[2] ? decodeURIComponent(m[2]) : null;
      if (!DIRS.includes(dir)) return send(res, 404, { error: 'unknown dir' });
      if (!file && req.method === 'GET') {
        return send(res, 200, fs.readdirSync(path.join(DATA_DIR, dir)).filter(f => f.toLowerCase().endsWith('.json')).map(f => {
          try { return { file: f, content: fs.readFileSync(path.join(DATA_DIR, dir, f), 'utf8') }; } catch (err) { return { file: f, error: err.message }; }
        }));
      }
      const p = safeFile(dir, file);
      if (req.method === 'GET') return fs.existsSync(p) ? send(res, 200, fs.readFileSync(p, 'utf8')) : send(res, 404, { error: 'not found' });
      if (READONLY) return send(res, 403, { error: 'read-only' });
      if (req.method === 'PUT') { const body = await readBody(req); JSON.parse(body); const tmp = p + '.tmp'; fs.writeFileSync(tmp, body, 'utf8'); fs.renameSync(tmp, p); return send(res, 200, { ok: true }); }
      if (req.method === 'DELETE') { if (fs.existsSync(p)) fs.unlinkSync(p); return send(res, 200, { ok: true }); }
      return send(res, 405, { error: 'method not allowed' });
    }
    if (url.pathname.startsWith('/api/v1')) return await apiV1(req, res, url);

    // statische Dateien
    let rel = decodeURIComponent(url.pathname); if (rel === '/') rel = '/index.html';
    const fp = path.resolve(SRC_DIR, '.' + rel);
    if (!fp.startsWith(SRC_DIR + path.sep) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) return send(res, 404, 'Not found', 'text/plain');
    return send(res, 200, fs.readFileSync(fp), MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', { 'Cache-Control': 'no-cache' });
  } catch (err) {
    return send(res, err.code && Number.isInteger(err.code) ? err.code : (err instanceof SyntaxError ? 400 : 500), { error: err.message });
  }
});
server.listen(PORT, () => {
  console.log(`Ascandir InteractiveMap ${VERSION} läuft auf Port ${PORT} · Daten: ${DATA_DIR}`);
  if (!PASSWORD) console.warn('WARNUNG: Kein IAM_PASSWORD gesetzt – die Oberfläche ist ohne Passwort erreichbar.');
});
