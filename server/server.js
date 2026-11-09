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
const PUBLIC_VIEW = !/^(0|false|no)$/i.test(process.env.IAM_PUBLIC_VIEW || 'true'); // Gäste dürfen ansehen
const VERSION = (() => { try { return require(path.join(__dirname, '..', 'package.json')).version; } catch { return 'docker'; } })();
const DIRS = ['worlds', 'timelines'];
for (const d of DIRS) fs.mkdirSync(path.join(DATA_DIR, d), { recursive: true });

// ---------------------------------------------------------------- Benutzer & Rechte
// data/users.json: { users: [{id,name,pass,role:'admin'|'user',perms:{worlds:{},timelines:{}}}], guest: {worlds:{},timelines:{}} }
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEVEL = { none: 0, view: 1, edit: 2 };
function loadUsers() {
  let d = {}; try { d = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { }
  d.users = Array.isArray(d.users) ? d.users : [];
  d.guest = d.guest || { worlds: { '*': PUBLIC_VIEW ? 'view' : 'none' }, timelines: {} };
  return d;
}
function saveUsers(d) { const tmp = USERS_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(d, null, 2), { mode: 0o600 }); fs.renameSync(tmp, USERS_FILE); }
function hashPw(pw) { const salt = crypto.randomBytes(16).toString('hex'); return `scrypt$${salt}$${crypto.scryptSync(String(pw), salt, 32).toString('hex')}`; }
function checkPw(pw, stored) { const [, salt, h] = String(stored || '').split('$'); if (!salt || !h) return false; return tsEqual(crypto.scryptSync(String(pw), salt, 32).toString('hex'), h); }

// ---------------------------------------------------------------- Sitzungen (signiertes Cookie, übersteht Neustarts)
const SECRET = (() => {
  const f = path.join(DATA_DIR, '.session-secret');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch { const s = crypto.randomBytes(32).toString('hex'); try { fs.writeFileSync(f, s, { mode: 0o600 }); } catch { } return s; }
})();
// Signatur hängt am Passwort-Hash -> Passwortänderung oder Löschen beendet alte Sitzungen
const userKey = uid => uid === 'env' ? 'env|' + PASSWORD : ((loadUsers().users.find(u => u.id === uid) || {}).pass || null);
const sign = (v, uid) => { const k = userKey(uid); return k ? crypto.createHmac('sha256', SECRET + '|' + k).update(v).digest('hex') : null; };
function makeSession(uid) { const v = `${uid}|${Date.now() + 30 * 864e5}`; return `${v}.${sign(v, uid)}`; }
function cookieOf(req, name) { const m = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(name + '=')); return m ? decodeURIComponent(m.slice(name.length + 1)) : null; }
function sessionUser(req) {
  const c = cookieOf(req, 'iam_session'); if (!c) return null;
  const i = c.lastIndexOf('.'), v = c.slice(0, i), sig = c.slice(i + 1); const [uid, exp] = v.split('|');
  if (!uid || !exp || +exp < Date.now()) return null;
  const good = sign(v, uid); if (!good || !tsEqual(sig, good)) return null;
  return uid;
}
function basicOk(req) {
  const h = req.headers.authorization || ''; if (!PASSWORD || !h.startsWith('Basic ')) return false;
  const [u, ...p] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
  return tsEqual(u, USER) && tsEqual(p.join(':'), PASSWORD);
}
// Wer fragt an? -> { id, name, admin, perms }
function whoIs(req, url) {
  if (!PASSWORD) return { id: 'open', name: 'admin', admin: true };
  if (url && tokenOk(req, url)) return { id: 'token', name: 'api', admin: true };
  if (basicOk(req)) return { id: 'env', name: USER, admin: true };
  const uid = sessionUser(req);
  if (uid === 'env') return { id: 'env', name: USER, admin: true };
  if (uid) { const u = loadUsers().users.find(x => x.id === uid); if (u) return { id: u.id, name: u.name, admin: u.role === 'admin', perms: u.perms || { worlds: {}, timelines: {} } }; }
  return { id: 'guest', name: null, guest: true, admin: false, perms: loadUsers().guest };
}
function level(who, worldId, tlId, readonly) {
  if (who.admin) return readonly ? 'view' : 'edit';
  const p = who.perms || { worlds: {}, timelines: {} };
  let l = tlId && p.timelines && p.timelines[tlId] != null ? p.timelines[tlId] : (p.worlds && (p.worlds[worldId] ?? p.worlds['*'])) || 'none';
  if (readonly && l === 'edit') l = 'view';
  return LEVEL[l] != null ? l : 'none';
}
const canView = (who, w, t, ro) => LEVEL[level(who, w, t, ro)] >= 1;
const canEdit = (who, w, t) => LEVEL[level(who, w, t, false)] >= 2;
const isAdmin = req => whoIs(req).admin;
const secureReq = req => (req.headers['x-forwarded-proto'] || '').startsWith('https');
const loginAttempts = new Map();

// ---------------------------------------------------------------- Kanon-Daten aus den Browser-Skripten laden
const sandbox = { window: {}, navigator: { language: 'de' }, console };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
for (const f of ['i18n.js', 'worlds/starwars-atlas.js', 'worlds/starwars.js', 'worlds/starwars-facts.js', 'travel.js']) {
  vm.runInContext(fs.readFileSync(path.join(SRC_DIR, f), 'utf8'), sandbox, { filename: f });
}
const SW = sandbox.window.IAM_WORLDS.starwars;
const I18N = sandbox.window.I18N;
const TRAVEL = sandbox.window.IAM_TRAVEL;

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
function tokenOk(req, url) {
  if (!API_TOKEN) return false;
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ') && tsEqual(h.slice(7).trim(), API_TOKEN)) return true;
  return !!(url.searchParams.get('token') && tsEqual(url.searchParams.get('token'), API_TOKEN));
}
// Lesen: öffentlich (wenn IAM_PUBLIC_VIEW) – Schreiben: nur mit Anmeldung bzw. API-Token
function canRead(req, url) {
  if (!PASSWORD || tokenOk(req, url)) return true;
  const who = whoIs(req, url);
  if (!who.guest) return true;
  // Gast: nur wenn Gäste überhaupt etwas sehen dürfen (oder Anmeldeseite / statische Dateien)
  const g = who.perms, any = Object.values(g.worlds || {}).concat(Object.values(g.timelines || {})).some(l => LEVEL[l] >= 1);
  return any || !url.pathname.startsWith('/api/');
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
let VIEWER = { admin: true };   // wird pro API-Aufruf gesetzt (synchron)
function allWorlds(lang, viewer = VIEWER) {
  const tls = allTimelines(lang, viewer);
  return [{ id: 'starwars', name: SW.name[lang] || SW.name.de, type: 'scifi', builtin: true }]
    .concat(listJson('worlds').map(w => ({ id: w.id, name: w.name, type: w.type, builtin: false, yearFmt: w.yearFmt })))
    .filter(w => viewer.admin || canView(viewer, w.id, null) || tls.some(t => t.world === w.id));
}
function allTimelines(lang, viewer = VIEWER) {
  const canon = SW.canonTimeline(lang);
  return [canon].concat(listJson('timelines').map(t => { t.world ||= 'starwars'; t.routes ||= []; return t; }))
    .filter(t => canView(viewer, t.world, t.id, !!t.readonly));
}
function findTimeline(q, lang) {
  const tls = allTimelines(lang);
  if (!q) return tls[0];
  const ql = String(q).toLowerCase();
  return tls.find(t => t.id === q) || tls.find(t => (t.name || '').toLowerCase() === ql) || tls.find(t => (t._file || '').toLowerCase() === ql || (t._file || '').toLowerCase() === ql + '.json');
}
function worldOf(tl, lang) { const ws = allWorlds(lang, { admin: true }); return ws.find(w => w.id === tl.world) || ws[0]; }
function yearFmt(tl, lang) {
  if (tl.world === 'starwars' || !tl.world) return SW.yearFmt[lang] || SW.yearFmt.de;
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
    grid: o.grid || (tl.world === 'starwars' && SW.gridOf ? SW.gridOf(o.x, o.y) : undefined), atlasOnly: o.atlas ? true : undefined,
    subsector: o.subsector || undefined,
    controlledBy: fac ? fac.name : (o.atlas ? undefined : null), description: o.desc || '', biome: o.biome ? I18N.t('biomes.' + o.biome) : null,
    facts: o.facts || {}
  };
}
// Galaxie-Atlas: weitere offizielle Systeme, die nicht in der Zeitlinie stehen
function atlasFor(tl) {
  if ((tl.world || 'starwars') !== 'starwars' || !SW.atlas) return [];
  const names = new Set(tl.objects.map(o => SW.normName(o.name))), ids = new Set(tl.objects.map(o => o.id));
  return SW.atlas().filter(a => !ids.has(a.id) && !names.has(SW.normName(a.name)));
}
function withAtlasStops(tl, stops) {
  const atl = atlasFor(tl); if (!atl.length) return tl;
  const extra = [];
  for (const q of stops) { const s = String(q).toLowerCase(); if (tl.objects.some(o => o.id === q || o.name.toLowerCase() === s)) continue;
    const a = atl.find(o => o.name.toLowerCase() === s || o.id === q) || atl.find(o => o.name.toLowerCase().startsWith(s)); if (a && !extra.includes(a)) extra.push(a); }
  return extra.length ? Object.assign({}, tl, { objects: tl.objects.concat(extra) }) : tl;
}
function findPlace(tl, name) {
  const q = String(name || '').toLowerCase().trim(); if (!q) return null;
  const cands = tl.objects.filter(o => o.name.toLowerCase() === q || o.id.toLowerCase() === q);
  const atl = () => atlasFor(tl);
  return cands.sort((a, b) => (a.type === 'planet' ? -1 : 0) - (b.type === 'planet' ? -1 : 0))[0] || atl().find(o => o.name.toLowerCase() === q || o.id === q)
    || tl.objects.find(o => o.name.toLowerCase().includes(q)) || atl().find(o => o.name.toLowerCase().startsWith(q)) || null;
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
  const st = (tl.story || []).filter(e => e.year <= year).sort(storySort);
  const chs = tl.characters || [];
  if (chs.length) L.push((de ? 'Charaktere: ' : 'Characters: ') + chs.slice(0, 20).map(c => `${c.name}${c.title ? ' (' + c.title + ')' : ''}${c.location ? ' @ ' + c.location : ''}`).join(' · ') + (chs.length > 20 ? ' …' : ''));
  if (st.length) L.push((de ? `Story bisher (${st.length} Abschnitte, neueste zuletzt): ` : `Story so far (${st.length} sections, latest last): `) + st.slice(-5).map(e => `${e.title} (${fmtYear(e.year, f)})`).join(' · '));
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
// ---------------------------------------------------------------- Story-Abschnitte (tl.story)
// Reihenfolge: Jahr, dann Position innerhalb des Jahres (order), dann Anlagezeit
const storySort = (a, b) => a.year - b.year || (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.created || '').localeCompare(String(b.created || ''));
// Abschnitt e innerhalb seines Jahres hinter "after" (oder an Index pos) einordnen und Positionen neu durchzählen
function storyPlace(t, e, after) {
  const same = t.story.filter(x => x.year === e.year && x !== e).sort(storySort);
  let i = same.length;
  if (after === 'start') i = 0; else if (after) { const k = same.findIndex(x => x.id === after); if (k >= 0) i = k + 1; }
  same.splice(i, 0, e); same.forEach((x, n) => { x.order = n; });
}
function storyList(t, lang, o = {}) {
  const f = yearFmt(t, lang), from = o.from != null ? parseYear(o.from, f) : null, to = o.to != null ? parseYear(o.to, f) : null;
  const q = String(o.q || '').toLowerCase().trim();
  let list = (t.story || []).slice().sort(storySort);
  if (from != null) list = list.filter(e => e.year >= from);
  if (to != null) list = list.filter(e => e.year <= to);
  if (o.era) { const er = t.eras.find(x => x.name.toLowerCase() === String(o.era).toLowerCase() || x.id === o.era); if (er) { const s2 = t.eras.slice().sort((a, b) => a.year - b.year), nx = s2[s2.indexOf(er) + 1]; list = list.filter(e => e.year >= er.year && (!nx || e.year < nx.year)); } }
  if (q) list = list.filter(e => (e.title + ' ' + e.text + ' ' + (e.places || []).join(' ')).toLowerCase().includes(q));
  return list.map((e, i) => ({ id: e.id, nr: i + 1, year: e.year, yearLabel: fmtYear(e.year, f), era: (eraAt(t, e.year) || {}).name || null, title: e.title, text: e.text, places: e.places || [], created: e.created, updated: e.updated }));
}
function storyText(t, lang, list) {
  const de = lang !== 'en';
  if (!list.length) return de ? `Noch keine Story-Abschnitte in „${t.name}“.` : `No story sections in "${t.name}" yet.`;
  return list.map(e => `## ${e.title} (${e.yearLabel}${e.era ? ' · ' + e.era : ''}) [id: ${e.id}]\n${e.places.length ? (de ? 'Orte: ' : 'Places: ') + e.places.join(', ') + '\n' : ''}${e.text}`).join('\n\n');
}
// ---------------------------------------------------------------- Charaktere (tl.characters)
const CHAR_TEXT = ['title', 'species', 'gender', 'age', 'homeworld', 'organization', 'master', 'location', 'status', 'appearance', 'personality', 'bio', 'abilities', 'knowledge', 'threads', 'notes'];
const REL_KINDS = ['ally', 'enemy', 'family', 'contact', 'other'];
const findChar = (t, n) => { const q = String(n || '').toLowerCase().trim(); return (t.characters || []).find(c => c.id === n || c.name.toLowerCase() === q) || (q ? (t.characters || []).find(c => c.name.toLowerCase().includes(q)) : null) || null; };
const GROUP_COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4dd0e1', '#f06292', '#aed581', '#ffd54f', '#90a4ae'];
function groupFor(t, name, color) {
  const q = String(name || '').trim(); if (!q) return null;
  t.charGroups = t.charGroups || [];
  let g = t.charGroups.find(x => x.id === q || x.name.toLowerCase() === q.toLowerCase());
  if (!g) { g = { id: uid('cg'), name: q, color: color || GROUP_COLORS[t.charGroups.length % GROUP_COLORS.length] }; t.charGroups.push(g); }
  else if (color) g.color = color;
  return g;
}
function charOut(t, c, full) {
  const fac = c.faction ? t.factions.find(f => f.id === c.faction) : null, grp = c.group ? (t.charGroups || []).find(g => g.id === c.group) : null;
  const base = { id: c.id, name: c.name, group: grp ? grp.name : '', title: c.title || '', faction: fac ? fac.name : (c.faction || ''), location: c.location || '', status: c.status || '', image: c.image || null };
  if (!full) return base;
  return Object.assign(base, { species: c.species || '', gender: c.gender || '', age: c.age || '', homeworld: c.homeworld || '', appearance: c.appearance || '', personality: c.personality || '',
    abilities: c.abilities || '', bio: c.bio || '', notes: c.notes || '', organization: c.organization || '', master: c.master || '', knowledge: c.knowledge || '', threads: c.threads || '', tags: c.tags || [], relations: c.relations || [], gallery: (c.gallery || []).map(g => ({ src: g.src && g.src.startsWith('data:') ? '(eingebettetes Bild)' : g.src, caption: g.caption || '' })), updated: c.updated || null });
}
function charText(t, c, lang) {
  const de = lang !== 'en', o = charOut(t, c, true), L = [`# ${o.name}${o.title ? ' – ' + o.title : ''} [id: ${o.id}]`];
  const lab = de ? { species: 'Spezies', gender: 'Geschlecht', age: 'Alter', homeworld: 'Herkunftswelt', faction: 'Fraktion', title: 'Rang/Rolle', organization: 'Organisation', master: 'Meister/Mentor', location: 'Aufenthaltsort', status: 'Status',
      appearance: 'Erscheinungsbild', personality: 'Persönlichkeit', bio: 'Hintergrund', abilities: 'Fähigkeiten', knowledge: 'Wissen', threads: 'Laufende Handlungsstränge', notes: 'Notizen',
      secId: 'Identität', secAff: 'Zugehörigkeit', secNow: 'Aktueller Stand', rel: 'Beziehungen', kinds: { ally: 'Verbündete', enemy: 'Feinde', family: 'Familie', contact: 'Kontakte', other: 'Sonstige' } }
    : { species: 'Species', gender: 'Gender', age: 'Age', homeworld: 'Homeworld', faction: 'Faction', title: 'Rank/role', organization: 'Organisation', master: 'Master/mentor', location: 'Location', status: 'Status',
      appearance: 'Appearance', personality: 'Personality', bio: 'Background', abilities: 'Abilities', knowledge: 'Knowledge', threads: 'Ongoing storylines', notes: 'Notes',
      secId: 'Identity', secAff: 'Affiliation', secNow: 'Current state', rel: 'Relations', kinds: { ally: 'Allies', enemy: 'Enemies', family: 'Family', contact: 'Contacts', other: 'Other' } };
  const block = (head, keys) => { const r = keys.filter(k => o[k]).map(k => `${lab[k]}: ${o[k]}`); if (r.length) L.push(`\n## ${head}\n` + r.join('\n')); };
  if (o.group) L.push((de ? 'Gruppe: ' : 'Group: ') + o.group);
  if (o.tags.length) L.push('Tags: ' + o.tags.join(', '));
  block(lab.secId, ['species', 'age', 'gender', 'homeworld']);
  for (const k of ['appearance', 'personality', 'bio']) if (o[k]) L.push(`\n## ${lab[k]}\n${o[k]}`);
  block(lab.secAff, ['faction', 'title', 'organization', 'master']);
  if (o.abilities) L.push(`\n## ${lab.abilities}\n${o.abilities}`);
  if (o.relations.length) {
    L.push(`\n## ${lab.rel}`);
    for (const k of REL_KINDS) { const r = o.relations.filter(x => (x.kind || 'other') === k); if (r.length) L.push(`${lab.kinds[k]}: ` + r.map(x => `${x.name}${x.relation ? ' (' + x.relation + ')' : ''}`).join(', ')); }
  }
  if (o.knowledge) L.push(`\n## ${lab.knowledge}\n${o.knowledge}`);
  const now = ['location', 'status'].filter(k => o[k]).map(k => `${lab[k]}: ${o[k]}`);
  if (now.length || o.threads) L.push(`\n## ${lab.secNow}\n` + now.join('\n') + (o.threads ? (now.length ? '\n' : '') + `${lab.threads}:\n${o.threads}` : ''));
  if (o.notes) L.push(`\n## ${lab.notes}\n${o.notes}`);
  const imgs = (o.image ? 1 : 0) + o.gallery.length; if (imgs) L.push(`\n${de ? 'Bilder' : 'Images'}: ${imgs}`);
  return L.join('\n');
}
// Bilder für Charaktere: Download (URL) oder Base64 -> Datei in DATA_DIR/images, ausgeliefert unter /images/<datei>
const IMG_DIR = path.join(DATA_DIR, 'images');
const IMG_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
async function storeImage(b) {
  let buf, type;
  if (b.data) {
    const m = String(b.data).match(/^data:(image\/[a-z+]+);base64,(.*)$/s); type = m ? m[1] : (b.mime || 'image/png');
    buf = Buffer.from(m ? m[2] : String(b.data), 'base64');
  } else if (b.url) {
    if (!/^https?:\/\//i.test(b.url)) throw Object.assign(new Error('url must start with http(s)://'), { code: 400 });
    let r; try { r = await fetch(b.url, { redirect: 'follow', signal: AbortSignal.timeout(20000) }); } catch (e) { throw Object.assign(new Error('image download failed: ' + e.message), { code: 400 }); }
    if (!r.ok) throw Object.assign(new Error('image download failed: HTTP ' + r.status), { code: 400 });
    type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    buf = Buffer.from(await r.arrayBuffer());
  } else throw Object.assign(new Error('url or data required'), { code: 400 });
  if (!IMG_EXT[type]) throw Object.assign(new Error('not a supported image (jpeg, png, webp, gif): ' + (type || 'unknown')), { code: 400 });
  if (buf.length > 10 * 1024 * 1024) throw Object.assign(new Error('image larger than 10 MB'), { code: 400 });
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const name = uid('img') + IMG_EXT[type]; fs.writeFileSync(path.join(IMG_DIR, name), buf);
  return 'images/' + name;
}
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
  // Atlas-Systeme werden beim ersten Schreibzugriff als echtes Objekt in die Zeitlinie übernommen
  const adopt = a => { const n = { id: a.id, name: a.name, type: 'planet', x: a.x, y: a.y, region: a.region, sector: a.sector || null, grid: a.grid, desc: '', parent: null, from: null, to: null }; t.objects.push(n); return n; };
  const byName = n => { const o = findPlace(t, n); return o && o.atlas ? adopt(o) : o; };

  if (ep === 'place' && (req.method === 'POST' || req.method === 'PATCH')) {
    if (!b.name) return send(res, 400, { error: 'name required' });
    let o = (b.id && t.objects.find(x => x.id === b.id)) || t.objects.find(x => x.name.toLowerCase() === String(b.name).toLowerCase());
    if (!o) { const a = atlasFor(t).find(x => x.name.toLowerCase() === String(b.name).toLowerCase()); if (a) o = adopt(a); }
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
    const o = findPlace(t, b.name || q.get('name')); if (!o || o.atlas) return send(res, 404, { error: 'place not found' });
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
  if (ep === 'character/image' && req.method === 'POST') {
    const c = findChar(t, b.id || b.name); if (!c) return send(res, 404, { error: 'character not found' });
    const src = await storeImage(b);
    if (b.portrait || !c.image) c.image = src;
    if (!b.portrait || b.gallery) (c.gallery = c.gallery || []).push({ src, caption: String(b.caption || '') });
    c.updated = new Date().toISOString();
    saveTimeline(t); return send(res, 201, { ok: true, src, portrait: c.image === src });
  }
  if (ep === 'character' && (req.method === 'POST' || req.method === 'PATCH')) {
    if (!b.name && !b.id) return send(res, 400, { error: 'name required' });
    t.characters = t.characters || [];
    let c = b.id ? t.characters.find(x => x.id === b.id) : t.characters.find(x => x.name.toLowerCase() === String(b.name).toLowerCase());
    const created = !c;
    if (!c) { if (!b.name) return send(res, 404, { error: 'character not found (id)' }); c = { id: uid('ch'), name: String(b.name), created: new Date().toISOString() }; t.characters.push(c); }
    if (b.newName) c.name = String(b.newName);
    const app = Array.isArray(b.append) ? b.append : [];
    for (const k of CHAR_TEXT) if (b[k] !== undefined) c[k] = app.includes(k) && c[k] ? c[k] + '\n\n' + String(b[k]) : String(b[k] ?? '');
    if (b.faction !== undefined) { const f = b.faction ? findFaction(t, b.faction) : null; c.faction = f ? f.id : (b.faction || ''); }
    if (Array.isArray(b.tags)) c.tags = b.tags.map(String).filter(Boolean);
    if (b.group !== undefined) { const g = groupFor(t, b.group, b.groupColor); c.group = g ? g.id : ''; }
    const rel = r => ({ name: String(r.name), relation: String(r.relation || ''), kind: REL_KINDS.includes(r.kind) ? r.kind : 'other' });
    if (Array.isArray(b.relations)) c.relations = b.relations.filter(r => r && r.name).map(rel);
    if (Array.isArray(b.addRelations)) { c.relations = c.relations || []; for (const r of b.addRelations.filter(r => r && r.name)) { const ex = c.relations.find(x => x.name.toLowerCase() === String(r.name).toLowerCase()); if (ex) Object.assign(ex, rel(Object.assign({}, ex, r))); else c.relations.push(rel(r)); } }
    c.updated = new Date().toISOString();
    saveTimeline(t); return send(res, created ? 201 : 200, { ok: true, created, character: charOut(t, c, true) });
  }
  if (ep === 'character' && req.method === 'DELETE') {
    const c = findChar(t, b.id || b.name || q.get('name')); if (!c || (c.name.toLowerCase() !== String(b.name || q.get('name') || '').toLowerCase() && c.id !== b.id)) return send(res, 404, { error: 'character not found (exact name or id)' });
    t.characters = t.characters.filter(x => x !== c); saveTimeline(t); return send(res, 200, { ok: true });
  }
  if (ep === 'story' && (req.method === 'POST' || req.method === 'PATCH')) {
    const f = yearFmt(t, lang); t.story = t.story || [];
    let e = b.id ? t.story.find(x => x.id === b.id) : null;
    if (req.method === 'PATCH' && !e) return send(res, 404, { error: 'story section not found (id)' });
    const now = new Date().toISOString(), y = b.year != null && b.year !== '' ? parseYear(b.year, f) : null;
    if (!e) {
      if (!b.title && !b.text) return send(res, 400, { error: 'title or text required' });
      const aft = b.after && b.after !== 'start' ? t.story.find(x => x.id === b.after) : null;
      const last = aft || t.story.slice().sort(storySort)[t.story.length - 1];
      const s2 = t.eras.slice().sort((a, c) => a.year - c.year);
      e = { id: uid('st'), year: y != null ? y : last ? last.year : s2.length ? s2[s2.length - 1].year : 0, title: String(b.title || '').trim() || (lang === 'en' ? 'Section' : 'Abschnitt') + ' ' + (t.story.length + 1), text: String(b.text || ''), places: [], created: now };
      t.story.push(e); storyPlace(t, e, b.after);
    } else {
      if (y != null && y !== e.year) { e.year = y; storyPlace(t, e, b.after); }
      else if (b.after) storyPlace(t, e, b.after);
      if (b.title !== undefined) e.title = String(b.title);
      if (b.text !== undefined) e.text = b.append ? (e.text ? e.text + '\n\n' : '') + String(b.text) : String(b.text);
      e.updated = now;
    }
    if (Array.isArray(b.places)) e.places = b.places.map(String).filter(Boolean);
    saveTimeline(t); return send(res, req.method === 'POST' && !b.id ? 201 : 200, { ok: true, section: storyList(t, lang).find(x => x.id === e.id) });
  }
  if (ep === 'story/order' && req.method === 'POST') {
    const ids = Array.isArray(b.ids) ? b.ids.map(String) : []; if (!ids.length) return send(res, 400, { error: 'ids required (story section ids in chronological order)' });
    t.story = t.story || []; const rank = new Map(ids.map((id, i) => [id, i])), unknown = ids.filter(id => !t.story.some(x => x.id === id));
    const f = yearFmt(t, lang), warn = [];
    if (b.adjustYears) { // Jahre absteigender Einträge an den Vorgänger angleichen
      let prev = null; for (const id of ids) { const e = t.story.find(x => x.id === id); if (!e) continue; if (prev && e.year < prev.year) { warn.push(`${e.title}: ${fmtYear(e.year, f)} → ${fmtYear(prev.year, f)}`); e.year = prev.year; } prev = e; }
    }
    const years = [...new Set(t.story.map(x => x.year))];
    for (const y of years) {
      const grp = t.story.filter(x => x.year === y).sort((a, c) => (rank.has(a.id) ? rank.get(a.id) : 1e6 + (a.order ?? 1e5)) - (rank.has(c.id) ? rank.get(c.id) : 1e6 + (c.order ?? 1e5)) || storySort(a, c));
      grp.forEach((x, n) => { x.order = n; });
    }
    const conflicts = []; let prev = null;
    if (!b.adjustYears) for (const id of ids) { const e = t.story.find(x => x.id === id); if (!e) continue; if (prev && e.year < prev.year) conflicts.push(`„${e.title}“ (${fmtYear(e.year, f)}) soll nach „${prev.title}“ (${fmtYear(prev.year, f)}) kommen – Jahr passt nicht; mit adjustYears=true angleichen oder per update_story_entry ändern`); prev = e; }
    saveTimeline(t);
    return send(res, 200, { ok: true, unknownIds: unknown, yearChanges: warn, conflicts, order: storyList(t, lang).map(e => `${e.nr}. ${e.title} (${e.yearLabel})`) });
  }
  if (ep === 'story' && req.method === 'DELETE') {
    const id = b.id || q.get('id'); const n = (t.story || []).length;
    t.story = (t.story || []).filter(x => x.id !== id); if (t.story.length === n) return send(res, 404, { error: 'story section not found' });
    saveTimeline(t); return send(res, 200, { ok: true });
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
      '/api/v1/travel': { get: { operationId: 'planTravel', summary: 'Reisezeit und Route zwischen Orten berechnen (bevorzugt Hyperraumrouten)', parameters: [qp('from', 'Start', 'Nar Shaddaa', true), qp('to', 'Ziel', 'Dromund Kaas', true), { name: 'via', in: 'query', description: 'Zwischenstopps (mehrfach möglich)', schema: { type: 'array', items: { type: 'string' } }, style: 'form', explode: true }, qp('class', 'Hyperantrieb-Klasse, z.B. 0.5, 1, 2', '1'), qp('stay', 'Aufenthalt pro Zwischenstopp in Stunden', '0'), tlP, yP, lP, qp('format', '"text" für reinen Text')], responses: ok } },
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
  VIEWER = req.iamViewer || whoIs(req, url);
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
      'GET /api/v1/characters?timeline=&q=&faction=&place=&format=text': 'Charaktere auflisten',
      'GET /api/v1/character?timeline=&name=&format=text': 'Charakter mit allen Details',
      'GET /api/v1/story?timeline=&from=&to=&era=&q=&last=&format=text': 'Story-Abschnitte lesen',
      'GET /api/v1/summary?timeline=&year=&place=&place=&lang=&max=': 'Fertiger Text für den KI-Kontext (text/plain)',
      'GET /api/v1/travel?from=&to=&via=&class=&stay=&timeline=&year=&format=text': 'Reiseplaner: Route und Reisezeit (Hyperantrieb-Klasse)',
      'GET /api/v1/openapi.json': 'OpenAPI-Beschreibung (z.B. für ChatGPT-Actions)',
      'POST /api/v1/timeline/copy': 'Zeitlinie kopieren (Schreibzugriff mit IAM_API_TOKEN)',
      'POST /api/v1/place | DELETE /api/v1/place': 'Ort anlegen/ändern/löschen',
      'POST /api/v1/faction': 'Fraktion anlegen/ändern',
      'POST /api/v1/era': 'Zeitalter anlegen/ändern',
      'POST /api/v1/control': 'Kontrolle über einen Ort setzen',
      'POST /api/v1/character | DELETE /api/v1/character': 'Charakter anlegen/ändern (name + Felder, append) / löschen',
      'POST /api/v1/character/image': 'Bild hinzufügen (name, url oder data, caption, portrait)',
      'POST /api/v1/story/order': 'Story-Abschnitte sortieren (ids, adjustYears)',
      'POST /api/v1/story | PATCH /api/v1/story | DELETE /api/v1/story': 'Story-Abschnitt anlegen (title, text, year, places) / ändern (id, append) / löschen (id)',
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
  if (ep === 'characters') {
    const t = tl(), qq = (q.get('q') || '').toLowerCase(), fq = (q.get('faction') || '').toLowerCase(), pq = (q.get('place') || '').toLowerCase();
    let list = (t.characters || []).slice().sort((a, b) => a.name.localeCompare(b.name));
    if (qq) list = list.filter(c => JSON.stringify([c.name, c.title, c.tags, c.bio, c.notes]).toLowerCase().includes(qq));
    if (fq) list = list.filter(c => { const f = t.factions.find(x => x.id === c.faction); return (f ? f.name : c.faction || '').toLowerCase().includes(fq); });
    if (pq) list = list.filter(c => (c.location || '').toLowerCase().includes(pq) || (c.homeworld || '').toLowerCase().includes(pq));
    const gq = (q.get('group') || '').toLowerCase(); if (gq) list = list.filter(c => { const g = (t.charGroups || []).find(x => x.id === c.group); return g && g.name.toLowerCase().includes(gq); });
    if (q.get('format') === 'text') return send(res, 200, list.length ? list.map(c => { const o = charOut(t, c); return `- ${o.name}${o.group ? ' [' + o.group + ']' : ''}${o.title ? ' – ' + o.title : ''}${o.faction ? ' · ' + o.faction : ''}${o.location ? ' · ' + o.location : ''}${o.status ? ' · ' + o.status : ''} [id: ${o.id}]`; }).join('\n') : (lang === 'en' ? 'No characters yet.' : 'Noch keine Charaktere.'), 'text/plain; charset=utf-8');
    return send(res, 200, { timeline: t.name, count: list.length, characters: list.map(c => charOut(t, c)) });
  }
  if (ep === 'character') {
    const t = tl(), c = findChar(t, q.get('name') || q.get('id')); if (!c) return send(res, 404, { error: 'character not found' });
    if (q.get('format') === 'text') return send(res, 200, charText(t, c, lang), 'text/plain; charset=utf-8');
    return send(res, 200, charOut(t, c, true));
  }
  if (ep === 'story') {
    const t = tl(), list = storyList(t, lang, { from: q.get('from'), to: q.get('to'), era: q.get('era'), q: q.get('q') });
    const lim = +q.get('last') || 0, out = lim > 0 ? list.slice(-lim) : list;
    if (q.get('format') === 'text') return send(res, 200, storyText(t, lang, out), 'text/plain; charset=utf-8');
    return send(res, 200, { timeline: t.name, count: list.length, sections: out });
  }
  if (ep === 'search') {
    const t = tl(), qq = (q.get('q') || '').toLowerCase();
    const own = t.objects.filter(o => !qq || o.name.toLowerCase().includes(qq)).slice(0, 100).map(o => ({ id: o.id, name: o.name, type: o.type, region: o.region || null, sector: o.sector || null }));
    const atl = qq ? atlasFor(t).filter(o => o.name.toLowerCase().includes(qq)).slice(0, Math.max(0, 100 - own.length))
      .map(o => ({ id: o.id, name: o.name, type: o.type, region: o.region, sector: o.sector || null, grid: o.grid, atlas: true })) : [];
    return send(res, 200, own.concat(atl));
  }
  if (ep === 'travel') {
    const t = tl(), y = year(t), stops = [q.get('from')].concat(q.getAll('via'), [q.get('to')]).filter(Boolean);
    const wtype = (allWorlds(lang, { admin: true }).find(w => w.id === t.world) || {}).type || 'scifi';
    const r = TRAVEL.plan(withAtlasStops(t, stops), { stops, year: y, worldType: wtype, hyperClass: +q.get('class') || 1, stayHours: +q.get('stay') || 0, mode: q.get('mode') || 'horse', kmPerUnit: +q.get('km') || 1 });
    if (!r.ok) return send(res, r.error === 'notFound' ? 404 : 400, r);
    const de = lang !== 'en', d = h => TRAVEL.fmtDuration(h, lang);
    const text = [`${de ? 'Reise' : 'Journey'}: ${r.stops.join(' → ')}`]
      .concat(r.legs.map((l, i) => `${i + 1}. ${l.from} → ${l.to}: ${d(l.hours)}${l.lanes.length ? ' (' + l.lanes.join(', ') + ')' : ''}${l.via.length ? (de ? ' über ' : ' via ') + l.via.join(', ') : ''}`))
      .concat([`${de ? 'Gesamt' : 'Total'}: ${d(r.totalHours)}${r.lightYears != null ? ` · ≈ ${r.lightYears.toLocaleString(de ? 'de-DE' : 'en-US')} ${de ? 'Lichtjahre' : 'light-years'}` : ` · ≈ ${r.km.toLocaleString(de ? 'de-DE' : 'en-US')} km`}${r.hyperClass ? ` · ${de ? 'Hyperantrieb Klasse' : 'hyperdrive class'} ${r.hyperClass}` : ''}`]).join('\n');
    if (q.get('format') === 'text') return send(res, 200, text, 'text/plain; charset=utf-8');
    r.legs.forEach(l => { delete l.points; l.duration = d(l.hours); });
    return send(res, 200, Object.assign({ year: y, totalDuration: d(r.totalHours), text }, r));
  }
  if (ep === 'summary') {
    const t = tl(), y = year(t);
    return send(res, 200, summaryText(t, y, lang, q.getAll('place').filter(Boolean), Math.max(3, Math.min(200, +q.get('max') || 25))), 'text/plain; charset=utf-8');
  }
  return send(res, 404, { error: 'unknown endpoint' });
}

// ---------------------------------------------------------------- MCP-Server (für ChatGPT-Plugins, Claude u. a.)
// POST /mcp            -> nur lesende Werkzeuge
// POST /mcp/<API-Token> -> zusätzlich schreibende Werkzeuge
const { Readable } = require('stream');
function internalCall(method, pathname, params, body, viewer) {
  return new Promise(resolve => {
    const u = new URL('http://internal' + pathname);
    for (const [k, v] of Object.entries(params || {})) {
      if (v == null || v === '') continue;
      if (Array.isArray(v)) v.forEach(x => u.searchParams.append(k, String(x))); else u.searchParams.set(k, String(v));
    }
    const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
    req.method = method; req.headers = API_TOKEN ? { authorization: 'Bearer ' + API_TOKEN, host: 'internal' } : { host: 'internal' };
    req.iamViewer = viewer || { admin: true };
    const res = { code: 200, writeHead(c) { this.code = c; }, end(d) { resolve({ code: this.code, body: d == null ? '' : d.toString() }); }, write() { } };
    Promise.resolve(apiV1(req, res, u)).catch(e => resolve({ code: 500, body: JSON.stringify({ error: e.message }) }));
  });
}
const S = (props, required = []) => ({ type: 'object', properties: props, required });
const str = d => ({ type: 'string', description: d });
const TL = str('Zeitlinie (Name oder ID). Leer = Kanon (schreibgeschützt).'), YR = str('Jahr, z.B. "3640 BBY", "4 ABY" oder "-3640"'), LG = { type: 'string', enum: ['de', 'en'], description: 'Sprache der Antwort' };
const REL = { type: 'object', properties: { name: { type: 'string' }, relation: { type: 'string', description: 'z.B. Schwester, Rivale, Informant' }, kind: { type: 'string', enum: ['ally', 'enemy', 'family', 'contact', 'other'] } }, required: ['name'] };
const MCP_TOOLS = [
  { name: 'list_timelines', title: 'Zeitlinien auflisten', description: 'Alle Welten-Zeitlinien mit ihren Zeitaltern.', ro: true, inputSchema: S({ lang: LG }), run: (a, v) => internalCall('GET', '/api/v1/timelines', a, null, v) },
  { name: 'get_summary', title: 'Lage der Galaxis', description: 'Kurzer Text zum Stand in einem Jahr: Zeitalter, Mächte und ihre Gebiete, optional Eckdaten zu Orten. Ideal als Kontext für Geschichten.', ro: true,
    inputSchema: S({ timeline: TL, year: YR, places: { type: 'array', items: { type: 'string' }, description: 'Orte, zu denen Eckdaten geliefert werden' }, lang: LG }),
    run: (a, v) => internalCall('GET', '/api/v1/summary', { timeline: a.timeline, year: a.year, place: a.places || [], lang: a.lang }, null, v) },
  { name: 'get_state', title: 'Mächte und Gebiete (JSON)', description: 'Zeitalter und Fraktionen mit kontrollierten Orten in einem Jahr.', ro: true, inputSchema: S({ timeline: TL, year: YR, lang: LG }), run: (a, v) => internalCall('GET', '/api/v1/state', a, null, v) },
  { name: 'get_place', title: 'Ort abfragen', description: 'Eckdaten (Bevölkerung, Klima, Bewohner …), Beschreibung und Kontrolle eines Ortes in einem Jahr.', ro: true, inputSchema: S({ name: str('Name des Ortes'), timeline: TL, year: YR, lang: LG }, ['name']), run: (a, v) => internalCall('GET', '/api/v1/place', a, null, v) },
  { name: 'search_places', title: 'Orte suchen', description: 'Orte nach Namensteil suchen (inkl. der ~6.500 Systeme des Galaxie-Atlas mit Rasterfeld, Region und Sektor).', ro: true, inputSchema: S({ query: str('Suchtext'), timeline: TL }, ['query']), run: (a, v) => internalCall('GET', '/api/v1/search', { q: a.query, timeline: a.timeline }, null, v) },
  { name: 'plan_travel', title: 'Reise planen', description: 'Route und Reisezeit zwischen Orten (bevorzugt Hyperraumrouten). Hyperantrieb-Klasse 0.5 = sehr schnell, 1 = schnell, 2 = übliche Frachter.', ro: true,
    inputSchema: S({ from: str('Start'), to: str('Ziel'), via: { type: 'array', items: { type: 'string' }, description: 'Zwischenstopps' }, hyperdrive_class: { type: 'number', description: 'Klasse, Standard 1' }, stay_hours: { type: 'number', description: 'Aufenthalt pro Zwischenstopp in Stunden' }, timeline: TL, year: YR, lang: LG }, ['from', 'to']),
    run: (a, v) => internalCall('GET', '/api/v1/travel', { from: a.from, to: a.to, via: a.via || [], class: a.hyperdrive_class, stay: a.stay_hours, timeline: a.timeline, year: a.year, lang: a.lang, format: 'text' }, null, v) },
  // schreibend
  { name: 'copy_timeline', title: 'Zeitlinie kopieren', description: 'Kopiert eine Zeitlinie (leer = Kanon) als neue, bearbeitbare Zeitlinie.', inputSchema: S({ from: str('Quelle'), name: str('Name der neuen Zeitlinie') }, ['name']), run: a => internalCall('POST', '/api/v1/timeline/copy', {}, a) },
  { name: 'upsert_place', title: 'Ort anlegen/ändern', description: 'Legt einen Ort an oder ändert ihn (nur eigene Zeitlinien). Position über near (bei Ort X), orbits (umkreist X) oder grid (z.B. R16).',
    inputSchema: S({ timeline: TL, name: str('Name'), newName: str('Neuer Name'), type: { type: 'string', enum: ['sun', 'planet', 'moon', 'station', 'capital', 'city', 'village', 'fortress', 'landmark'] }, near: str('In der Nähe dieses Ortes'), orbits: str('Umkreist diesen Ort'), grid: str('Rasterfeld'), region: str('Region-Schlüssel, z.B. outerrim'), sector: str('Sektor'),
      biome: str('desert, ice, ocean, forest, jungle, swamp, grassland, mountains, volcanic, city, neon, gas, barren, toxic, crystal, storm …'), description: str('Beschreibung (Zeilenumbrüche, **fett** erlaubt)'), existsFrom: YR, existsTo: YR,
      facts: { type: 'object', description: 'Eckdaten: pop, temp, climate, terrain, species, capital, notable, extra=[["Bezeichnung","Wert"]]; null löscht ein Feld' } }, ['timeline', 'name']),
    run: a => internalCall('POST', '/api/v1/place', {}, a) },
  { name: 'delete_place', title: 'Ort löschen', description: 'Löscht einen Ort aus einer eigenen Zeitlinie.', destructive: true, inputSchema: S({ timeline: TL, name: str('Name') }, ['timeline', 'name']), run: a => internalCall('DELETE', '/api/v1/place', {}, a) },
  { name: 'upsert_faction', title: 'Fraktion anlegen/ändern', description: 'Legt eine Fraktion an oder ändert Name, Farbe (#rrggbb) oder Reichweite.', inputSchema: S({ timeline: TL, name: str('Name'), newName: str('Neuer Name'), color: str('Farbe #rrggbb'), reach: { type: 'number' } }, ['timeline', 'name']), run: a => internalCall('POST', '/api/v1/faction', {}, a) },
  { name: 'list_story', title: 'Story lesen', description: 'Story-Abschnitte einer Zeitlinie lesen (chronologisch). Vor dem Weiterschreiben aufrufen. Filter: Jahresbereich, Zeitalter, Suchtext oder nur die letzten N Abschnitte.', ro: true,
    inputSchema: S({ timeline: TL, from: str('ab Jahr, z.B. "3641 BBY"'), to: str('bis Jahr'), era: str('nur dieses Zeitalter (Name)'), query: str('Suchtext'), last: { type: 'number', description: 'nur die letzten N Abschnitte' }, lang: LG }, ['timeline']),
    run: (a, v) => internalCall('GET', '/api/v1/story', { timeline: a.timeline, from: a.from, to: a.to, era: a.era, q: a.query, last: a.last, lang: a.lang, format: 'text' }, null, v) },
  { name: 'add_story_entry', title: 'Story-Abschnitt anlegen', description: 'Neuen Story-Abschnitt anlegen (erscheint im Story-Reiter). Ein Abschnitt pro Szene/Ereignis. Ohne Jahr wird das Jahr des letzten Abschnitts verwendet.',
    inputSchema: S({ timeline: TL, title: str('kurzer Titel'), text: str('Text (Leerzeile = Absatz, **fett**, *kursiv*)'), year: YR, after: str('optional: id des Abschnitts, hinter dem eingefügt wird ("start" = an den Anfang des Jahres)'), places: { type: 'array', items: { type: 'string' }, description: 'beteiligte Orte' } }, ['timeline', 'title', 'text']), run: a => internalCall('POST', '/api/v1/story', {}, a) },
  { name: 'update_story_entry', title: 'Story-Abschnitt ändern', description: 'Abschnitt per id ändern. append=true hängt den Text an statt ihn zu ersetzen.',
    inputSchema: S({ timeline: TL, id: str('id aus list_story'), title: str('neuer Titel'), text: str('Text'), append: { type: 'boolean', description: 'Text anhängen' }, year: YR, after: str('optional: hinter diesen Abschnitt verschieben (id oder "start")'), places: { type: 'array', items: { type: 'string' } } }, ['timeline', 'id']), run: a => internalCall('PATCH', '/api/v1/story', {}, a) },
  { name: 'reorder_story', title: 'Story sortieren', description: 'Story-Abschnitte in chronologische Reihenfolge bringen: ids in der gewünschten Reihenfolge übergeben (alle oder ein Teil). Sortiert wird nach Jahr und innerhalb eines Jahres nach dieser Reihenfolge. adjustYears=true setzt Abschnitte, die laut Reihenfolge später kommen, aber ein früheres Jahr haben, auf das Jahr ihres Vorgängers.',
    inputSchema: S({ timeline: TL, ids: { type: 'array', items: { type: 'string' }, description: 'Abschnitts-ids in chronologischer Reihenfolge' }, adjustYears: { type: 'boolean' } }, ['timeline', 'ids']), run: a => internalCall('POST', '/api/v1/story/order', {}, a) },
  { name: 'delete_story_entry', title: 'Story-Abschnitt löschen', description: 'Abschnitt per id löschen.', inputSchema: S({ timeline: TL, id: str('id aus list_story') }, ['timeline', 'id']), run: a => internalCall('DELETE', '/api/v1/story', {}, a) },
  { name: 'list_characters', title: 'Charaktere auflisten', description: 'Charaktere einer Zeitlinie (Name, Rolle, Fraktion, Ort, Status). Filter: Suchtext, Fraktion, Ort.', ro: true,
    inputSchema: S({ timeline: TL, query: str('Suchtext'), faction: str('Fraktion'), place: str('Ort/Heimatwelt'), group: str('Gruppe'), lang: LG }, ['timeline']),
    run: (a, v) => internalCall('GET', '/api/v1/characters', { timeline: a.timeline, q: a.query, faction: a.faction, place: a.place, group: a.group, lang: a.lang, format: 'text' }, null, v) },
  { name: 'get_character', title: 'Charakter lesen', description: 'Alle Details eines Charakters (Steckbrief, Aussehen, Persönlichkeit, Hintergrund, Beziehungen).', ro: true,
    inputSchema: S({ timeline: TL, name: str('Name oder id'), lang: LG }, ['timeline', 'name']), run: (a, v) => internalCall('GET', '/api/v1/character', { timeline: a.timeline, name: a.name, lang: a.lang, format: 'text' }, null, v) },
  { name: 'upsert_character', title: 'Charakter anlegen/ändern', description: 'Charakter anlegen oder Felder ändern (nur angegebene Felder werden geändert). Gliederung: Identität (species, age, gender, homeworld), Erscheinungsbild (appearance: Gesicht, Haare, Augen, Körperbau, Kleidung), Persönlichkeit (personality: Züge, Verhalten, Eigenheiten), Hintergrund (bio: Herkunft, Ausbildung, Vergangenheit), Zugehörigkeit (faction, title=Rang, organization, master), Fähigkeiten (abilities: Machtfähigkeiten, Kampfstil, Fachwissen), Beziehungen (relations/addRelations mit kind ally|enemy|family|contact|other), Wissen (knowledge: was die Person über Tim und andere weiß), Aktueller Stand (location, status, threads = laufende Handlungsstränge). append: Liste von Textfeldern, an die angehängt statt ersetzt wird (z.B. ["knowledge","threads"]). Texte dürfen **fett**/*kursiv* und Leerzeilen enthalten.',
    inputSchema: S({ timeline: TL, name: str('Name (Schlüssel)'), newName: str('neuer Name'),
      group: str('Gruppe, z.B. "Crew der Trailblazer" (wird bei Bedarf angelegt; leer = keine)'), groupColor: str('Farbe der Gruppe, z.B. "#e57373"'),
      species: str('Spezies'), age: str('Alter, z.B. "34" oder "geb. 3674 BBY"'), gender: str('Geschlecht'), homeworld: str('Herkunftswelt'),
      appearance: str('Erscheinungsbild: Gesicht, Haare, Augen, Körperbau, Kleidung'), personality: str('Charakterzüge, Verhalten, Eigenheiten'), bio: str('Herkunft, Ausbildung, Vergangenheit'),
      faction: str('Fraktion (Name)'), title: str('Rang/Rolle'), organization: str('Organisation/Orden/Einheit'), master: str('Meister oder Mentor'),
      abilities: str('Machtfähigkeiten, Kampfstil, Fachwissen'), knowledge: str('Was weiß die Person über Tim und andere?'),
      location: str('aktueller Aufenthaltsort'), status: str('z.B. lebt, verletzt, tot, vermisst'), threads: str('laufende Handlungsstränge'), notes: str('sonstige Notizen'),
      tags: { type: 'array', items: { type: 'string' } },
      relations: { type: 'array', items: REL, description: 'ersetzt die komplette Beziehungsliste' },
      addRelations: { type: 'array', items: REL, description: 'ergänzt/aktualisiert einzelne Beziehungen (per Name), Rest bleibt' },
      append: { type: 'array', items: { type: 'string' }, description: 'Felder, an die angehängt wird' } }, ['timeline', 'name']), run: a => internalCall('POST', '/api/v1/character', {}, a) },
  { name: 'add_character_image', title: 'Bild zu Charakter', description: 'Bild per öffentlicher URL (wird heruntergeladen und dauerhaft gespeichert) oder Base64 zum Charakter hinzufügen. portrait=true setzt es als Porträt, sonst kommt es in die Galerie.',
    inputSchema: S({ timeline: TL, name: str('Charakter'), url: str('https-Link zum Bild'), data: str('alternativ: Base64 oder data:-URL'), caption: str('Bildunterschrift'), portrait: { type: 'boolean' } }, ['timeline', 'name']),
    run: a => internalCall('POST', '/api/v1/character/image', {}, a) },
  { name: 'delete_character', title: 'Charakter löschen', description: 'Charakter löschen (exakter Name oder id).', inputSchema: S({ timeline: TL, name: str('exakter Name oder id') }, ['timeline', 'name']), run: a => internalCall('DELETE', '/api/v1/character', {}, Object.assign({}, a, { id: a.name })) },
  { name: 'upsert_era', title: 'Zeitalter anlegen/ändern', description: 'Neues Zeitalter ab einem Jahr (übernimmt den Stand davor) oder Name/Beschreibung ändern.', inputSchema: S({ timeline: TL, name: str('Name'), newName: str('Neuer Name'), year: YR, description: str('Beschreibung') }, ['timeline']), run: a => internalCall('POST', '/api/v1/era', {}, a) },
  { name: 'set_control', title: 'Kontrolle setzen', description: 'Legt fest, welche Fraktion einen Ort ab dem Zeitalter des angegebenen Jahres kontrolliert (faction leer = neutral).', inputSchema: S({ timeline: TL, place: str('Ort'), faction: str('Fraktion'), year: YR, era: str('oder Name des Zeitalters') }, ['timeline', 'place']), run: a => internalCall('POST', '/api/v1/control', {}, a) }
];
const MCP_INSTRUCTIONS = 'Ascandir InteractiveMap: interaktive Karte (Star Wars u. eigene Welten) mit Zeitlinien, Zeitaltern, Fraktionen und Orten. ' +
  'Der Kanon ist schreibgeschützt – Änderungen nur in eigenen Zeitlinien (vorher list_timelines oder copy_timeline). Jahre als "3640 BBY"/"4 ABY". ' +
  'Vor Änderungen den Stand mit get_place/get_state lesen. Beschreibungen kurz und ohne Präfixe. ' +
  'Personen werden als Charaktere gepflegt (list_characters/get_character lesen, upsert_character ändern, add_character_image für Bilder). ' +
  'Die laufende Geschichte wird in Story-Abschnitten dokumentiert: vor dem Weitererzählen list_story lesen (z.B. last=5), neue Ereignisse mit add_story_entry als eigenen Abschnitt anlegen. Zeitalter (upsert_era) nur für größere Wendepunkte der Machtverhältnisse.';
async function handleMcp(req, res, url, writeAllowed) {
  if (req.method === 'GET') {
    if ((req.headers.accept || '').includes('text/event-stream')) return send(res, 405, { error: 'Use POST (Streamable HTTP)' }, 'application/json', { Allow: 'POST' });
    // Statusanzeige für den Browser (zur Fehlersuche)
    return send(res, 200, { status: 'ok', server: 'Ascandir InteractiveMap MCP', version: VERSION, transport: 'streamable-http (POST)',
      access: writeAllowed ? 'lesen + schreiben (Token korrekt)' : 'nur lesen',
      ...(writeAllowed ? {} : { hinweis: 'Hier ist kein Token angekommen (Adresse: ' + url.pathname + (url.search ? ' + Parameter' : '') + '). Enthält der Token Zeichen wie # ? & % / oder Leerzeichen, schneidet der Browser ihn ab – dann einen Token nur aus Buchstaben und Zahlen verwenden.' }),
      tools: MCP_TOOLS.filter(t => t.ro || (writeAllowed && !READONLY)).map(t => t.name) });
  }
  if (req.method === 'DELETE') return send(res, 200, { ok: true });
  if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
  let msg; try { msg = JSON.parse(await readBody(req, 2e6)); } catch { return send(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  const tools = MCP_TOOLS.filter(t => t.ro || (writeAllowed && !READONLY));
  async function one(m) {
    const id = m.id, isNote = id === undefined;
    const ok = result => ({ jsonrpc: '2.0', id, result }), err = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
    try {
      switch (m.method) {
        case 'initialize': return ok({ protocolVersion: (m.params && m.params.protocolVersion) || '2025-06-18', capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'ascandir-interactivemap', title: 'Ascandir InteractiveMap', version: VERSION }, instructions: MCP_INSTRUCTIONS });
        case 'ping': return ok({});
        case 'tools/list': return ok({ tools: tools.map(t => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema,
          annotations: { title: t.title, readOnlyHint: !!t.ro, destructiveHint: !!t.destructive, idempotentHint: !!t.ro, openWorldHint: false } })) });
        case 'tools/call': {
          const t = tools.find(x => x.name === (m.params || {}).name);
          if (!t) return err(-32602, 'Unknown tool' + (writeAllowed ? '' : ' (schreibende Werkzeuge nur über /mcp/<token>)'));
          const viewer = writeAllowed ? { admin: true } : whoIs({ headers: {} }, null);
          const r = await t.run((m.params || {}).arguments || {}, viewer);
          return ok({ content: [{ type: 'text', text: r.body }], isError: r.code >= 400 });
        }
        case 'resources/list': return ok({ resources: [] });
        case 'prompts/list': return ok({ prompts: [] });
        default: return isNote ? null : err(-32601, 'Method not found');
      }
    } catch (e) { return err(-32603, e.message); }
  }
  if (Array.isArray(msg)) { const out = (await Promise.all(msg.map(one))).filter(Boolean); return out.length ? send(res, 200, out) : (res.writeHead(202), res.end()); }
  const r = await one(msg);
  if (!r) { res.writeHead(202); return res.end(); }
  return send(res, 200, r);
}

// ---------------------------------------------------------------- Neue Version auf GitHub? (alle 30 Min.)
let latestRelease = null;
const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
async function checkLatest() {
  try {
    const r = await fetch('https://api.github.com/repos/Ascandir/Ascandir---SWGM/releases/latest', { headers: { 'User-Agent': 'ascandir-interactivemap', Accept: 'application/vnd.github+json' } });
    if (r.ok) { const j = await r.json(); latestRelease = String(j.tag_name || '').replace(/^v/, '') || null; }
  } catch { /* offline – egal */ }
}
if (!/^(0|false|no)$/i.test(process.env.IAM_UPDATE_CHECK || 'true')) { checkLatest(); setInterval(checkLatest, 30 * 60 * 1000); }

// ---------------------------------------------------------------- Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/health') return send(res, 200, { ok: true });
    const im = url.pathname.match(/^\/images\/([A-Za-z0-9_-]+\.(?:jpg|png|webp|gif))$/);
    if (im) { const fp = path.join(IMG_DIR, im[1]); if (!fs.existsSync(fp)) return send(res, 404, 'Not found', 'text/plain');
      const ext = path.extname(fp); return send(res, 200, fs.readFileSync(fp), { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' }[ext], { 'Cache-Control': 'public, max-age=31536000, immutable' }); }
    if (url.pathname === '/api/v1/openapi.json') return send(res, 200, openApi(req));
    const mm = url.pathname.match(/^\/mcp(?:\/([^/]+))?\/?$/);
    if (mm) {
      const tokenGiven = mm[1] ? decodeURIComponent(mm[1]) : null;
      if (tokenGiven && !(API_TOKEN && tsEqual(tokenGiven, API_TOKEN))) return send(res, 401, { error: 'invalid token' });
      if (!tokenGiven && !PUBLIC_VIEW && !tokenOk(req, url)) return send(res, 401, { error: 'unauthorized' });
      return await handleMcp(req, res, url, !!tokenGiven || tokenOk(req, url));
    }
    if (url.pathname === '/api/login' && req.method === 'POST') {
      const ip = (req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '?');
      const a = loginAttempts.get(ip) || { n: 0, t: 0 };
      if (a.n >= 5 && Date.now() - a.t < 60000) return send(res, 429, { error: 'Zu viele Versuche – bitte 1 Minute warten.' });
      const b = JSON.parse((await readBody(req, 10000)) || '{}');
      let uid = null;
      if (!PASSWORD || (tsEqual(b.user || '', USER) && tsEqual(b.password || '', PASSWORD))) uid = 'env';
      else { const u = loadUsers().users.find(x => x.name.toLowerCase() === String(b.user || '').toLowerCase()); if (u && checkPw(b.password || '', u.pass)) uid = u.id; }
      if (uid) {
        loginAttempts.delete(ip);
        return send(res, 200, { ok: true }, 'application/json', { 'Set-Cookie': `iam_session=${makeSession(uid)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${secureReq(req) ? '; Secure' : ''}` });
      }
      loginAttempts.set(ip, { n: a.n + 1, t: Date.now() });
      return send(res, 401, { error: 'Benutzername oder Passwort falsch.' });
    }
    if (url.pathname === '/api/logout') return send(res, 200, { ok: true }, 'application/json', { 'Set-Cookie': 'iam_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' });
    if (url.pathname === '/api/info') { const who = whoIs(req, url); const ws = allWorlds('de', { admin: true }).map(w => w.id);
      return send(res, 200, { version: VERSION, packaged: true, server: true, readonly: READONLY, loginRequired: !!PASSWORD, admin: who.admin, user: who.guest ? null : { name: who.name, admin: who.admin },
      worldAccess: Object.fromEntries(ws.map(w => [w, level(who, w, null)])), publicView: PUBLIC_VIEW, latest: who.admin ? latestRelease : null, updateAvailable: who.admin && !!(latestRelease && cmpVer(latestRelease, VERSION) > 0), latestShown: who.admin ? latestRelease : null, dataDir: who.admin ? DATA_DIR : null }, 'application/json; charset=utf-8', { 'Access-Control-Allow-Origin': '*' }); }
    if (!canRead(req, url)) {
      if (url.pathname.startsWith('/api/')) return send(res, 401, { error: 'unauthorized' }, 'application/json', { 'WWW-Authenticate': 'Basic realm="InteractiveMap", charset="UTF-8"' });
      return send(res, 401, 'Anmeldung erforderlich', 'text/plain; charset=utf-8', { 'WWW-Authenticate': 'Basic realm="InteractiveMap", charset="UTF-8"' });
    }
    if (url.pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write(': connected\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    const m = url.pathname.match(/^\/api\/files\/([a-z]+)(?:\/([^/]+))?$/);
    if (m) {
      const dir = m[1], file = m[2] ? decodeURIComponent(m[2]) : null, who = whoIs(req, url);
      if (!DIRS.includes(dir)) return send(res, 404, { error: 'unknown dir' });
      const meta = content => { try { const j = JSON.parse(content); return dir === 'worlds' ? { world: j.id, tl: null } : { world: j.world || 'starwars', tl: j.id }; } catch { return null; } };
      const viewOk = mt => mt && (dir === 'worlds' ? (who.admin || canView(who, mt.world, null) || listJson('timelines').some(t => (t.world || 'starwars') === mt.world && canView(who, t.world || 'starwars', t.id))) : canView(who, mt.world, mt.tl));
      const editOk = mt => mt && (dir === 'worlds' ? who.admin || canEdit(who, mt.world, null) : canEdit(who, mt.world, mt.tl));
      if (!file && req.method === 'GET') {
        const out = [];
        for (const f of fs.readdirSync(path.join(DATA_DIR, dir)).filter(f => f.toLowerCase().endsWith('.json'))) {
          let content; try { content = fs.readFileSync(path.join(DATA_DIR, dir, f), 'utf8'); } catch (err) { if (who.admin) out.push({ file: f, error: err.message }); continue; }
          const mt = meta(content);
          if (!mt) { if (who.admin) out.push({ file: f, content }); continue; }
          if (viewOk(mt)) out.push({ file: f, content, editable: editOk(mt) });
        }
        return send(res, 200, out);
      }
      const p = safeFile(dir, file);
      const existing = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
      if (req.method === 'GET') return existing != null && viewOk(meta(existing)) ? send(res, 200, existing) : send(res, 404, { error: 'not found' });
      if (READONLY) return send(res, 403, { error: 'read-only' });
      if (who.guest) return send(res, 401, { error: 'login required' });
      if (req.method === 'PUT') {
        const body = await readBody(req); const mt = meta(body); if (!mt) return send(res, 400, { error: 'invalid JSON' });
        if (existing != null) { if (!editOk(meta(existing)) || !editOk(mt)) return send(res, 403, { error: 'Keine Bearbeitungsrechte / no edit permission' }); }
        else if (dir === 'worlds' ? !who.admin : !canEdit(who, mt.world, null) && !canEdit(who, mt.world, mt.tl)) return send(res, 403, { error: 'Keine Rechte zum Anlegen / no permission to create' });
        const tmp = p + '.tmp'; fs.writeFileSync(tmp, body, 'utf8'); fs.renameSync(tmp, p); return send(res, 200, { ok: true });
      }
      if (req.method === 'DELETE') {
        if (existing != null && !(dir === 'worlds' ? who.admin : editOk(meta(existing)))) return send(res, 403, { error: 'no permission' });
        if (existing != null) fs.unlinkSync(p); return send(res, 200, { ok: true });
      }
      return send(res, 405, { error: 'method not allowed' });
    }
    // Benutzerverwaltung (nur Admins)
    if (url.pathname === '/api/users' || url.pathname.startsWith('/api/users/') || url.pathname === '/api/guest') {
      const who = whoIs(req, url);
      if (!who.admin || who.id === 'token') return send(res, 403, { error: 'admin only' });
      const d = loadUsers(), pub = u => ({ id: u.id, name: u.name, role: u.role, perms: u.perms || { worlds: {}, timelines: {} } });
      const clean = p => { const o = { worlds: {}, timelines: {} }; for (const k of ['worlds', 'timelines']) for (const [id, l] of Object.entries((p || {})[k] || {})) if (LEVEL[l] != null) o[k][String(id)] = l; return o; };
      if (url.pathname === '/api/users' && req.method === 'GET') return send(res, 200, { env: USER, users: d.users.map(pub), guest: d.guest });
      if (url.pathname === '/api/guest' && req.method === 'PUT') { d.guest = clean(JSON.parse(await readBody(req, 1e6))); saveUsers(d); return send(res, 200, { ok: true }); }
      if (url.pathname === '/api/users' && req.method === 'POST') {
        const b = JSON.parse(await readBody(req, 1e6)), name = String(b.name || '').trim();
        if (!/^[\w.\-@ ]{2,40}$/.test(name)) return send(res, 400, { error: 'Ungültiger Benutzername (2–40 Zeichen)' });
        if (!b.password || String(b.password).length < 6) return send(res, 400, { error: 'Passwort mindestens 6 Zeichen' });
        if (name.toLowerCase() === USER.toLowerCase() || d.users.some(u => u.name.toLowerCase() === name.toLowerCase())) return send(res, 409, { error: 'Benutzername existiert bereits' });
        const u = { id: 'u' + crypto.randomBytes(5).toString('hex'), name, pass: hashPw(b.password), role: b.role === 'admin' ? 'admin' : 'user', perms: clean(b.perms) };
        d.users.push(u); saveUsers(d); return send(res, 201, pub(u));
      }
      const um = url.pathname.match(/^\/api\/users\/([\w]+)$/); const u = um && d.users.find(x => x.id === um[1]);
      if (um && !u) return send(res, 404, { error: 'not found' });
      if (u && req.method === 'PUT') {
        const b = JSON.parse(await readBody(req, 1e6));
        if (b.password) { if (String(b.password).length < 6) return send(res, 400, { error: 'Passwort mindestens 6 Zeichen' }); u.pass = hashPw(b.password); }
        if (b.role) u.role = b.role === 'admin' ? 'admin' : 'user';
        if (b.perms) u.perms = clean(b.perms);
        saveUsers(d); return send(res, 200, pub(u));
      }
      if (u && req.method === 'DELETE') { d.users = d.users.filter(x => x !== u); saveUsers(d); return send(res, 200, { ok: true }); }
      return send(res, 405, { error: 'method not allowed' });
    }
    if (url.pathname.startsWith('/api/v1')) return await apiV1(req, res, url);

    // statische Dateien
    let rel = decodeURIComponent(url.pathname); if (rel === '/') rel = '/index.html';
    const fp = path.resolve(SRC_DIR, '.' + rel);
    if (!fp.startsWith(SRC_DIR + path.sep) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) return send(res, 404, 'Not found', 'text/plain');
    // Kein Zwischenspeichern (auch nicht bei Cloudflare). In index.html bekommen Skripte/CSS die Version als
    // Parameter, damit nach einem Update nie alte Dateien aus einem Cache mit neuer Seite gemischt werden.
    const noCache = { 'Cache-Control': 'no-store, max-age=0', 'CDN-Cache-Control': 'no-store', 'Cloudflare-CDN-Cache-Control': 'no-store' };
    if (rel === '/index.html') {
      const html = fs.readFileSync(fp, 'utf8').replace(/(src|href)="([^":?#]+\.(?:js|css))"/g, (_, a, f) => `${a}="${f}?v=${encodeURIComponent(VERSION)}"`);
      return send(res, 200, html, 'text/html; charset=utf-8', noCache);
    }
    return send(res, 200, fs.readFileSync(fp), MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', noCache);
  } catch (err) {
    return send(res, err.code && Number.isInteger(err.code) ? err.code : (err instanceof SyntaxError ? 400 : 500), { error: err.message });
  }
});
server.listen(PORT, () => {
  console.log(`Ascandir InteractiveMap ${VERSION} läuft auf Port ${PORT} · Daten: ${DATA_DIR}`);
  if (!PASSWORD) console.warn('WARNUNG: Kein IAM_PASSWORD gesetzt – die Oberfläche ist ohne Passwort erreichbar.');
});
