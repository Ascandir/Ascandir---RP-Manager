/* =========================================================================
   Ascandir RP-Manager – Webserver für Docker
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
// Selbst-Update per Webhook, z.B. Watchtower-HTTP-API (http://<updater>:8080/v1/update) oder ein Portainer-Webhook
const UPDATE_HOOK = process.env.IAM_UPDATE_WEBHOOK || '';
const UPDATE_HOOK_TOKEN = process.env.IAM_UPDATE_WEBHOOK_TOKEN || '';
const PUBLIC_VIEW = !/^(0|false|no)$/i.test(process.env.IAM_PUBLIC_VIEW || 'true'); // Gäste dürfen ansehen
const VERSION = (() => { try { return require(path.join(__dirname, '..', 'package.json')).version; } catch { return 'docker'; } })();
const DIRS = ['worlds', 'timelines'];
const HOUSING = require(path.join(SRC_DIR, 'housing-core.js'));
for (const d of DIRS) fs.mkdirSync(path.join(DATA_DIR, d), { recursive: true });

// ---------------------------------------------------------------- Benutzer & Rechte
// data/users.json: { users: [{id,name,pass,role:'admin'|'user',perms:{worlds:{},timelines:{}}}], guest: {worlds:{},timelines:{}} }
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEVEL = { none: 0, view: 1, edit: 2, admin: 3 };  // admin = darf Zeitlinien anlegen und Rechte vergeben
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
  if (url || req.headers.authorization) { const tv = viewerForToken(reqToken(req, url)); if (tv) return tv; }
  if (basicOk(req)) return { id: 'env', name: USER, admin: true };
  const uid = sessionUser(req);
  if (uid === 'env') return { id: 'env', name: USER, admin: true };
  if (uid) { const u = loadUsers().users.find(x => x.id === uid); if (u) return { id: u.id, name: u.name, admin: u.role === 'admin', perms: u.perms || { worlds: {}, timelines: {} } }; }
  return { id: 'guest', name: null, guest: true, admin: false, perms: loadUsers().guest };
}
function level(who, worldId, tlId, readonly) {
  if (who.admin) return readonly ? 'view' : 'admin';
  const p = who.perms || { worlds: {}, timelines: {} };
  const wl = (p.worlds && (p.worlds[worldId] ?? p.worlds['*'])) || 'none';
  // Welt-Admins sind automatisch Admin aller Zeitlinien ihrer Welt
  let l = tlId && wl !== 'admin' && p.timelines && p.timelines[tlId] != null ? p.timelines[tlId] : wl;
  if (readonly && LEVEL[l] >= 2) l = 'view';
  return LEVEL[l] != null ? l : 'none';
}
const canView = (who, w, t, ro) => LEVEL[level(who, w, t, ro)] >= 1;
const canEdit = (who, w, t) => LEVEL[level(who, w, t, false)] >= 2;
const canAdmin = (who, w, t) => LEVEL[level(who, w, t, false)] >= 3;
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
// Persönliche API-Tokens: jeder Benutzer kann sich einen Token erzeugen, der an seinen Rechten hängt.
// Gespeichert wird nur ein SHA-256-Hash (Tokens sind lange Zufallswerte).
const tokHash = tok => crypto.createHash('sha256').update(String(tok)).digest('hex');
function viewerForToken(tok) {
  if (!tok) return null;
  if (API_TOKEN && tsEqual(tok, API_TOKEN)) return { id: 'token', name: 'api', admin: true, api: true };
  const h = tokHash(tok), d = loadUsers();
  if (d.env && d.env.apiToken && tsEqual(d.env.apiToken, h)) return { id: 'env', name: USER, admin: true, api: true };
  const u = d.users.find(x => x.apiToken && tsEqual(x.apiToken, h));
  return u ? { id: u.id, name: u.name, admin: u.role === 'admin', perms: u.perms || { worlds: {}, timelines: {} }, api: true } : null;
}
const reqToken = (req, url) => { const h = req.headers.authorization || ''; return h.startsWith('Bearer ') ? h.slice(7).trim() : (url && url.searchParams.get('token')) || null; };
// Darf dieser Betrachter irgendwo schreiben?
function canWriteAny(v) {
  if (!v || v.guest) return false; if (v.admin) return true;
  const p = v.perms || {}; return Object.values(p.worlds || {}).concat(Object.values(p.timelines || {})).some(l => LEVEL[l] >= 2);
}
// Lesen: öffentlich (wenn IAM_PUBLIC_VIEW) – Schreiben: nur mit Anmeldung bzw. API-Token
function canRead(req, url) {
  if (!PASSWORD || tokenOk(req, url) || viewerForToken(reqToken(req, url))) return true;
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
// ---------------------------------------------------------------- Konfliktzonen (gestrichelt auf der Karte, eigene Laufzeit von–bis)
// timeline.conflicts = [{ id, name, from, to, factions: [ids], places: [ids], x, y, r, desc, color }]
const conflictActive = (c, y) => (c.from == null || y >= c.from) && (c.to == null || y <= c.to);
function conflictsAt(tl, y) { return (tl.conflicts || []).filter(c => conflictActive(c, y)); }
function conflictLine(tl, c, f, de) {
  const fac = (c.factions || []).map(id => (tl.factions.find(x => x.id === id) || {}).name).filter(Boolean);
  const pl = (c.places || []).map(id => (tl.objects.find(o => o.id === id) || (atlasFor(tl).find(o => o.id === id)) || {}).name).filter(Boolean);
  const when = `${c.from != null ? fmtYear(c.from, f) : '?'} – ${c.to != null ? fmtYear(c.to, f) : (de ? 'andauernd' : 'ongoing')}`;
  return `${c.name} [${when}]${fac.length ? (de ? ' · Parteien: ' : ' · sides: ') + fac.join(' vs. ') : ''}${pl.length ? (de ? ' · um ' : ' · around ') + pl.join(', ') : ''}${c.desc ? ' – ' + String(c.desc).replace(/\s*\n\s*/g, ' ') : ''}`;
}
function placeInConflict(tl, o, c) {
  if ((c.places || []).includes(o.id)) return true;
  const byId = Object.fromEntries(tl.objects.map(x => [x.id, x])); let k = o, n = 0; while (CHILD.includes(k.type) && k.parent && byId[k.parent] && n++ < 8) k = byId[k.parent];
  return c.r > 0 && Number.isFinite(k.x) && Math.hypot(k.x - c.x, k.y - c.y) <= c.r;
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
  const cfs = conflictsAt(tl, year);
  if (cfs.length) { L.push(de ? 'Aktive Konfliktzonen (offene Kämpfe – nicht jede Grenze ist Krieg):' : 'Active conflict zones (open fighting – not every border is war):'); for (const c of cfs) L.push('- ' + conflictLine(tl, c, f, de)); }
  const st = (tl.story || []).filter(e => e.year <= year).sort(storySortT(tl));
  const rls = rulesOf(tl).filter(r => r.active !== false);
  if (rls.length) L.splice(1, 0, (de ? 'WELTREGELN (gelten immer): ' : 'WORLD RULES (always apply): ') + rls.map((r, i) => `${i + 1}. ${r.title}${r.text ? ': ' + String(r.text).replace(/\s*\n\s*/g, ' ') : ''}`).join(' | '));
  const wns = tl.worldNotes || [];
  const wnsNow = wns.filter(n => wnAt(n, year));
  if (wnsNow.length) L.push((de ? `Weltnotizen (${wnsNow.length}): ` : `World notes (${wnsNow.length}): `) + [...new Set(wnsNow.slice().sort(wnSort).map(n => n.category))].join(' · ') + (de ? ' – Details mit list_world_notes' : ' – details via list_world_notes'));
  const chs = tl.characters || [];
  if (chs.length) L.push((de ? 'Charaktere: ' : 'Characters: ') + chs.slice(0, 20).map(c => `${c.name}${c.title ? ' (' + c.title + ')' : ''}${c.location ? ' @ ' + c.location : ''}`).join(' · ') + (chs.length > 20 ? ' …' : ''));
  if (st.length) L.push((de ? `Story bisher (${st.length} Abschnitte, neueste zuletzt): ` : `Story so far (${st.length} sections, latest last): `) + st.slice(-5).map(e => `${e.title} (${fmtYear(e.year, f)})`).join(' · '));
  for (const pn of placeNames) {
    const o = findPlace(tl, pn); if (!o) { L.push((de ? 'Unbekannter Ort: ' : 'Unknown place: ') + pn); continue; }
    const p = placeInfo(tl, o, year, lang, snap), fx = p.facts, rows = [];
    rows.push(`${p.name} (${p.typeLabel}${p.region ? ', ' + p.region : ''}${p.sector ? ', ' + (de ? 'Sektor ' : 'sector ') + p.sector : ''})`);
    if (!p.existsInYear) rows.push(de ? '  existiert in diesem Jahr nicht' : '  does not exist in this year');
    rows.push((de ? '  Kontrolle: ' : '  Control: ') + (p.controlledBy || (de ? 'neutral/unbekannt' : 'neutral/unknown')));
    const inC = cfs.filter(c => placeInConflict(tl, o, c)); if (inC.length) rows.push((de ? '  Liegt in Konfliktzone: ' : '  Inside conflict zone: ') + inC.map(c => c.name).join(', '));
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
// Kapitel (tl.chapters) kommen zuerst: Abschnitte ohne Kapitel vorne, dann Kapitel in ihrer Reihenfolge
const storySort = (a, b) => a.year - b.year || (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.created || '').localeCompare(String(b.created || ''));
const chapSorted = t => (t.chapters || []).slice().sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
function storySortT(t) {
  const rk = new Map(chapSorted(t).map((c, i) => [c.id, i]));
  const r = e => (e.chapter && rk.has(e.chapter) ? rk.get(e.chapter) : -1);
  return (a, b) => r(a) - r(b) || storySort(a, b);
}
function chapterFor(t, v, create) {
  const q = String(v || '').trim().replace(/^(kapitel|chapter)\s*\d+\s*[:.\-–]\s*/i, '').trim(); if (!q) return null;
  t.chapters = t.chapters || [];
  let c = t.chapters.find(x => x.id === q || x.title.toLowerCase() === q.toLowerCase());
  if (!c && create) { c = { id: uid('kap'), title: q, summary: '', order: Math.max(-1, ...t.chapters.map(x => x.order ?? -1)) + 1 }; t.chapters.push(c); }
  return c || null;
}
// Abschnitt e innerhalb seines Jahres hinter "after" (oder an Index pos) einordnen und Positionen neu durchzählen
function storyPlace(t, e, after) {
  const same = t.story.filter(x => x.year === e.year && x !== e && (x.chapter || '') === (e.chapter || '')).sort(storySort);
  let i = same.length;
  if (after === 'start') i = 0; else if (after) { const k = same.findIndex(x => x.id === after); if (k >= 0) i = k + 1; }
  same.splice(i, 0, e); same.forEach((x, n) => { x.order = n; });
}
function storyList(t, lang, o = {}) {
  const f = yearFmt(t, lang), from = o.from != null ? parseYear(o.from, f) : null, to = o.to != null ? parseYear(o.to, f) : null;
  const q = String(o.q || '').toLowerCase().trim();
  let list = (t.story || []).slice().sort(storySortT(t));
  if (o.chapter) { const c = chapterFor(t, o.chapter); list = list.filter(e => c ? e.chapter === c.id : false); }
  if (from != null) list = list.filter(e => e.year >= from);
  if (to != null) list = list.filter(e => e.year <= to);
  if (o.era) { const er = t.eras.find(x => x.name.toLowerCase() === String(o.era).toLowerCase() || x.id === o.era); if (er) { const s2 = t.eras.slice().sort((a, b) => a.year - b.year), nx = s2[s2.indexOf(er) + 1]; list = list.filter(e => e.year >= er.year && (!nx || e.year < nx.year)); } }
  if (q) list = list.filter(e => (e.title + ' ' + e.text + ' ' + (e.places || []).join(' ')).toLowerCase().includes(q));
  const cm = new Map(chapSorted(t).map((c, i) => [c.id, { nr: i + 1, title: c.title }]));
  return list.map((e, i) => ({ id: e.id, nr: i + 1, chapter: cm.get(e.chapter) ? cm.get(e.chapter).title : null, chapterNr: cm.get(e.chapter) ? cm.get(e.chapter).nr : null, year: e.year, yearLabel: fmtYear(e.year, f), era: (eraAt(t, e.year) || {}).name || null, title: e.title, text: e.text, places: e.places || [], created: e.created, updated: e.updated }));
}
function storyText(t, lang, list) {
  const de = lang !== 'en';
  if (!list.length) return de ? `Noch keine Story-Abschnitte in „${t.name}“.` : `No story sections in "${t.name}" yet.`;
  let cur; const out = [];
  for (const e of list) {
    if (e.chapter !== cur) { cur = e.chapter; out.push(e.chapter ? `# ${de ? 'Kapitel' : 'Chapter'} ${e.chapterNr}: ${e.chapter}` + (() => { const c = chapterFor(t, e.chapter); return c && c.summary ? '\n' + c.summary : ''; })() : `# ${de ? 'Ohne Kapitel' : 'No chapter'}`); }
    out.push(`## ${e.title} (${e.yearLabel}${e.era ? ' · ' + e.era : ''}) [id: ${e.id}]\n${e.places.length ? (de ? 'Orte: ' : 'Places: ') + e.places.join(', ') + '\n' : ''}${e.text}`);
  }
  const chs = chapSorted(t); if (chs.length) out.unshift((de ? 'Kapitel: ' : 'Chapters: ') + chs.map((c, i) => `${i + 1}. ${c.title} [id: ${c.id}]`).join(' · '));
  return out.join('\n\n');
}
// ---------------------------------------------------------------- Weltregeln (tl.rules): feste Regeln, die immer gelten
const rulesOf = t => (t.rules || []).slice().sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
function rulesText(t, lang, all) {
  const de = lang !== 'en', list = rulesOf(t).filter(r => all || r.active !== false);
  if (!list.length) return de ? `Keine Weltregeln in „${t.name}“.` : `No world rules in "${t.name}".`;
  return (de ? `Weltregeln für „${t.name}“ – gelten immer und haben Vorrang:` : `World rules for "${t.name}" – always apply and take precedence:`) + '\n' +
    list.map((r, i) => `${i + 1}. ${r.title}${r.active === false ? (de ? ' (deaktiviert)' : ' (disabled)') : ''} [id: ${r.id}]${r.text ? '\n   ' + String(r.text).replace(/\n/g, '\n   ') : ''}`).join('\n');
}
function ruleFind(t, b) { const L = t.rules || []; if (b.id) return L.find(x => x.id === b.id) || null; const q = String(b.title || '').toLowerCase().trim(); return q ? L.find(x => x.title.toLowerCase() === q) || null : null; }
// ---------------------------------------------------------------- Weltnotizen (tl.worldNotes): aktueller Zustand der Welt
const WN_CATS = ['Galaktische Lage', 'Sith-Imperium', 'Galaktische Republik', 'Planeten & Regionen', 'Organisationen', 'Offene Handlungsstränge', 'Gesicherte Erkenntnisse'];
const WN_CERT = ['confirmed', 'suspected', 'rumor'];
const wnCatRank = c => { const i = WN_CATS.findIndex(x => x.toLowerCase() === String(c || '').toLowerCase()); return i < 0 ? 100 : i; };
const wnSort = (a, b) => wnCatRank(a.category) - wnCatRank(b.category) || String(a.category || '').localeCompare(String(b.category || '')) || (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.title).localeCompare(String(b.title));
// Jede Notiz hat Stände pro Jahr (revs). Angezeigt wird der letzte Stand mit Jahr <= gewähltem Jahr.
function wnRevs(n) {
  if (!Array.isArray(n.revs)) { n.revs = [{ year: null, text: n.text || '', certainty: n.certainty || 'confirmed', updated: n.updated || n.created || null }]; delete n.text; delete n.certainty; }
  n.revs.sort((a, b) => (a.year ?? -Infinity) - (b.year ?? -Infinity)); return n.revs;
}
function wnAt(n, year) {
  const r = wnRevs(n); if (year == null) return r[r.length - 1];
  if (n.until != null && year > n.until) return null;
  let cur = null; for (const x of r) if (x.year == null || x.year <= year) cur = x; return cur;
}
// Standardjahr = Jahr des neuesten Story-Abschnitts (aktueller RP-Stand), sonst Beginn des letzten Zeitalters
function rpYear(t) {
  const st = (t.story || []).slice().sort(storySortT(t)); if (st.length) return st[st.length - 1].year;
  const er = t.eras.slice().sort((a, b) => a.year - b.year); return er.length ? er[er.length - 1].year : 0;
}
function wnFind(t, b) {
  const L = t.worldNotes || []; if (b.id) return L.find(x => x.id === b.id) || null;
  const q = String(b.title || '').toLowerCase().trim(); if (!q) return null;
  return L.find(x => x.title.toLowerCase() === q && (!b.category || String(x.category).toLowerCase() === String(b.category).toLowerCase())) || L.find(x => x.title.toLowerCase() === q) || null;
}
function wnText(t, lang, list, year, history) {
  const de = lang !== 'en', f = yearFmt(t, lang), C = { confirmed: de ? 'gesichert' : 'confirmed', suspected: de ? 'Vermutung' : 'suspected', rumor: de ? 'Gerücht' : 'rumour' };
  const out = [de ? 'Hinweis: Weltnotizen beschreiben den Zustand der Welt – nicht, was einzelne Charaktere wissen (dafür: Wissen in den Charakterakten).' : 'Note: world notes describe the state of the world – not what individual characters know (see character knowledge).',
    year != null ? (de ? `Stand: ${fmtYear(year, f)}` : `As of: ${fmtYear(year, f)}`) : (de ? 'Stand: jeweils neuester Eintrag' : 'As of: latest entry')];
  const rows = list.map(n => ({ n, r: wnAt(n, year) })).filter(x => x.r);
  if (!rows.length) { out.push(de ? `Keine Weltnotizen für diesen Stand in „${t.name}“.` : `No world notes for this point in "${t.name}".`); return out.join('\n'); }
  let cur;
  for (const { n, r } of rows) {
    if (n.category !== cur) { cur = n.category; out.push(`\n# ${cur || (de ? 'Allgemein' : 'General')}`); }
    const since = r.year != null ? (de ? ` seit ${fmtYear(r.year, f)}` : ` since ${fmtYear(r.year, f)}`) : '';
    const until = n.until != null ? (de ? `, bis ${fmtYear(n.until, f)}` : `, until ${fmtYear(n.until, f)}`) : '';
    out.push(`## ${n.title} [${C[r.certainty] || C.confirmed}${since}${until}] [id: ${n.id}]\n${(n.places || []).length ? (de ? 'Orte: ' : 'Places: ') + n.places.join(', ') + '\n' : ''}${r.text || ''}`);
    if (history) for (const h of wnRevs(n)) if (h !== r) out.push(`  – ${h.year != null ? fmtYear(h.year, f) : (de ? 'Anfang' : 'start')}: [${C[h.certainty] || C.confirmed}] ${String(h.text || '').replace(/\n+/g, ' ')}`);
  }
  return out.join('\n');
}
// ---------------------------------------------------------------- Charaktere (tl.characters)
const CHAR_TEXT = ['title', 'species', 'gender', 'age', 'homeworld', 'organization', 'master', 'location', 'status', 'appearance', 'personality', 'bio', 'abilities', 'knowledge', 'threads', 'notes'];
const REL_KINDS = ['ally', 'enemy', 'family', 'contact', 'other'];
const defCurrency = t => ((loadWorlds().find(w => w.id === (t.world || 'starwars')) || {}).type === 'fantasy' ? 'Gold' : 'Credits');
// Inventar ändern: add/update per Name (qty oder qtyDelta), remove per Name; Menge <= 0 entfernt den Gegenstand
function applyInventory(c, b) {
  c.inventory = c.inventory || [];
  const find = n => c.inventory.find(i => i.name.toLowerCase() === String(n).toLowerCase());
  for (const it of b.items || b.add || []) {
    if (!it || !it.name) continue; let i = find(it.name);
    if (!i) { i = { id: uid('it'), name: String(it.name), qty: 1, type: 'gear' }; c.inventory.push(i); }
    if (it.newName) i.name = String(it.newName);
    if (it.qty != null) i.qty = Number(it.qty); if (it.qtyDelta != null) i.qty = (Number(i.qty) || 0) + Number(it.qtyDelta);
    if (it.type) i.type = it.type === 'property' ? 'property' : 'gear';
    for (const k of ['location', 'note']) if (it[k] !== undefined) i[k] = String(it[k]);
    if (it.important !== undefined) i.important = !!it.important;
  }
  for (const n of b.remove || []) { const i = find(n); if (i) c.inventory = c.inventory.filter(x => x !== i); }
  c.inventory = c.inventory.filter(i => !(Number(i.qty) <= 0));
}
const loadWorlds = () => listJson('worlds');
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
    money: c.money ?? null, currency: c.currency || '', moneyLog: (c.moneyLog || []).slice(-20), inventory: (c.inventory || []).map(i => ({ name: i.name, qty: i.qty ?? 1, type: i.type || 'gear', location: i.location || '', important: !!i.important, note: i.note || '' })),
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
  if (o.money != null || o.inventory.length) {
    const cur = o.currency || defCurrency(t);
    L.push(`\n## ${de ? 'Besitz & Inventar' : 'Possessions & inventory'}`);
    if (o.money != null) L.push(`${de ? 'Geld' : 'Money'}: ${Number(o.money).toLocaleString(de ? 'de-DE' : 'en-GB')} ${cur}`);
    const ml = (c.moneyLog || []).slice(-5); if (ml.length) L.push((de ? 'Letzte Geldbewegungen: ' : 'Recent transactions: ') + ml.map(m => `${m.delta != null ? (m.delta > 0 ? '+' : '') + m.delta : '–'}${m.reason ? ' (' + m.reason + ')' : ''}`).join(', '));
    for (const ty of ['gear', 'property']) { const it = o.inventory.filter(i => i.type === ty); if (!it.length) continue;
      L.push(ty === 'gear' ? (de ? 'Ausrüstung / trägt bei sich:' : 'Gear / carried:') : (de ? 'Eigentum:' : 'Property:'));
      for (const i of it) L.push(`- ${i.important ? '⭐ ' : ''}${i.name}${i.qty !== 1 ? ' ×' + i.qty : ''}${i.location ? ' (' + i.location + ')' : ''}${i.note ? ' – ' + i.note : ''}`); }
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
// Bildtyp und -größe am Inhalt erkennen (nicht am angegebenen Typ) – so landen nur echte PNG/JPEG/WebP/GIF im Datenordner
function sniffImage(buf) {
  try {
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { type: 'image/png', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (buf.length > 10 && buf.toString('ascii', 0, 4) === 'GIF8') return { type: 'image/gif', w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
    if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const k = buf.toString('ascii', 12, 16);
      if (k === 'VP8X') return { type: 'image/webp', w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
      if (k === 'VP8 ') return { type: 'image/webp', w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (k === 'VP8L') { const b = buf.readUInt32LE(21); return { type: 'image/webp', w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
    }
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const mk = buf[i + 1], len = buf.readUInt16BE(i + 2);
        if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) return { type: 'image/jpeg', w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
        i += 2 + len;
      }
      return { type: 'image/jpeg', w: 0, h: 0 };
    }
  } catch { }
  return null;
}
// Downloads nur von öffentlichen Adressen (kein Zugriff auf das Heimnetz/Docker-Netz über den Server)
const dnsP = require('dns').promises, net = require('net');
function privateIp(ip) {
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase(); if (l.startsWith('::ffff:')) return privateIp(l.slice(7));
    return l === '::1' || l === '::' || /^f[cd]/.test(l) || /^fe[89ab]/.test(l);
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
async function safeFetch(u, hops = 0) {
  let url; try { url = new URL(u); } catch { throw Object.assign(new Error('ungültige URL'), { code: 400 }); }
  if (!/^https?:$/.test(url.protocol)) throw Object.assign(new Error('url must start with http(s)://'), { code: 400 });
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addrs = net.isIP(host) ? [host] : (await dnsP.lookup(host, { all: true }).catch(() => [])).map(a => a.address);
  if (!addrs.length) throw Object.assign(new Error('Adresse nicht gefunden: ' + host), { code: 400 });
  const allow = (process.env.IAM_FETCH_ALLOW || '').split(',').map(x => x.trim()).filter(Boolean); // nur für Tests
  if (addrs.some(a => privateIp(a) && !allow.includes(a))) throw Object.assign(new Error('Bilder aus dem lokalen Netz können nicht geladen werden – bitte öffentliche URL oder Base64 verwenden'), { code: 400 });
  const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AscandirRP-Manager/1.0; +https://github.com/Ascandir)', Accept: 'image/png,image/jpeg,image/webp,image/gif,image/*;q=0.9,text/html;q=0.5,*/*;q=0.3' } });
  if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
    if (hops >= 4) throw Object.assign(new Error('zu viele Weiterleitungen'), { code: 400 });
    return safeFetch(new URL(r.headers.get('location'), url).toString(), hops + 1);
  }
  return r;
}
const IMG_MAX = 10 * 1024 * 1024;
async function storeImageInfo(b) {
  let buf;
  if (b.data) {
    const m = String(b.data).match(/^data:[^;,]*;base64,(.*)$/s);
    buf = Buffer.from((m ? m[1] : String(b.data)).replace(/\s+/g, ''), 'base64');
  } else if (b.url) {
    const get = async u => {
      let r; try { r = await safeFetch(u); } catch (e) { throw Object.assign(new Error('image download failed: ' + e.message), { code: 400 }); }
      if (!r.ok) throw Object.assign(new Error('image download failed: HTTP ' + r.status + (r.status === 403 ? ' (die Seite erlaubt keine Downloads – bitte direkten Bildlink oder Base64 verwenden)' : '')), { code: 400 });
      if (+r.headers.get('content-length') > IMG_MAX) throw Object.assign(new Error('image larger than 10 MB'), { code: 400 });
      return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') || '' };
    };
    let got = await get(String(b.url));
    // Link zu einer Webseite statt zum Bild: Vorschaubild (og:image / twitter:image) bzw. bei Wikis das Originalbild nehmen
    if (!sniffImage(got.buf) && /html/i.test(got.type)) {
      const html = got.buf.toString('utf8', 0, Math.min(got.buf.length, 2e6));
      const meta = k => { const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*>`, 'i')); const c = m && m[0].match(/content=["']([^"']+)["']/i); return c && c[1]; };
      const wiki = (html.match(/<a[^>]+href=["']([^"']+)["'][^>]*class=["'][^"']*internal[^"']*["']/i) || html.match(/<div class="fullImageLink"[^>]*>\s*<a href=["']([^"']+)["']/i) || [])[1];
      const cand = wiki || meta('og:image') || meta('og:image:url') || meta('twitter:image');
      if (!cand) throw Object.assign(new Error('Die URL ist eine Webseite ohne erkennbares Bild – bitte den direkten Bildlink (endet meist auf .png/.jpg) verwenden'), { code: 400 });
      got = await get(new URL(cand.replace(/&amp;/g, '&'), String(b.url)).toString());
    }
    buf = got.buf;
  } else throw Object.assign(new Error('url or data required'), { code: 400 });
  if (buf.length > IMG_MAX) throw Object.assign(new Error('image larger than 10 MB'), { code: 400 });
  const info = sniffImage(buf);
  if (!info) throw Object.assign(new Error('not a supported image (png, jpeg, webp, gif)'), { code: 400 });
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const name = uid('img') + IMG_EXT[info.type]; fs.writeFileSync(path.join(IMG_DIR, name), buf);
  return { src: 'images/' + name, type: info.type, w: info.w || 512, h: info.h || 512, bytes: buf.length };
}
const storeImage = async b => (await storeImageInfo(b)).src;
function findWorldQ(q, lang) {
  if (!q) return null; const ql = String(q).toLowerCase();
  const ws = allWorlds(lang); return ws.find(w => w.id === q) || ws.find(w => String(w.name || '').toLowerCase() === ql) || null;
}
function grantCreator(who, tlId) {
  if (!who || who.admin || !tlId || !who.id || who.id === 'guest') return;
  const d = loadUsers(), u = d.users.find(x => x.id === who.id); if (!u) return;
  u.perms = u.perms || { worlds: {}, timelines: {} }; u.perms.timelines = u.perms.timelines || {};
  u.perms.timelines[tlId] = 'admin'; saveUsers(d);
}
function writableTimeline(q, lang) {
  const t = findTimeline(q, lang);
  if (!t) throw Object.assign(new Error('timeline not found'), { code: 404 });
  if (!t.readonly && !canEdit(VIEWER, t.world || 'starwars', t.id)) throw Object.assign(new Error('Keine Bearbeitungsrechte für diese Zeitlinie / no edit permission for this timeline'), { code: 403 });
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
  if (READONLY) return send(res, 403, { error: 'read-only' });
  // Schreibrechte kommen vom Betrachter: Master-Token (IAM_API_TOKEN), persönlicher Token oder angemeldeter Benutzer
  const viewer = VIEWER; // VIEWER ist global – nach dem asynchronen Lesen wieder herstellen
  if (!canWriteAny(viewer)) return send(res, 401, { error: 'API token required (Authorization: Bearer …) – persönlichen Token in den Einstellungen erzeugen' });
  const raw = await readBody(req); VIEWER = viewer; let b = {};
  if (raw.trim()) b = JSON.parse(raw);
  const q = url.searchParams, lang = (b.lang || q.get('lang')) === 'en' ? 'en' : 'de';
  const tlName = b.timeline || q.get('timeline');
  const ep = parts.join('/');
  if (ep === 'world/image' && (req.method === 'POST' || req.method === 'DELETE')) { // Hintergrundbild einer eigenen Welt
    const w = findWorldQ(b.world, lang); if (!w) return send(res, 404, { error: 'world not found' });
    if (w.builtin) return send(res, 409, { error: 'Die eingebaute Star-Wars-Galaxie hat kein eigenes Weltbild' });
    if (!canAdmin(VIEWER, w.id, null)) return send(res, 403, { error: 'Weltbild ändern dürfen nur Admins der Welt / world admins only' });
    const wf = listJson('worlds').find(x => x.id === w.id), file = safeFile('worlds', wf._file);
    const saveWorld = o => { const c = Object.assign({}, o); delete c._file; const tmp = file + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(c, null, 2), 'utf8'); fs.renameSync(tmp, file); };
    if (req.method === 'DELETE') { delete wf.mapImage; saveWorld(wf); return send(res, 200, { ok: true, removed: true }); }
    const img = await storeImageInfo(b); VIEWER = viewer;
    const fresh = listJson('worlds').find(x => x.id === w.id) || wf;
    const box = fresh.type === 'fantasy' ? { w: 2300, h: 1700 } : { w: 2300, h: 1900 }, sc = Math.min(box.w / img.w, box.h / img.h);
    const op = b.opacity != null ? Math.max(0.05, Math.min(1, +b.opacity || 1)) : 1;
    fresh.mapImage = { src: img.src, w: Math.round(img.w * sc), h: Math.round(img.h * sc), x: Math.round((box.w - img.w * sc) / 2), y: Math.round((box.h - img.h * sc) / 2), opacity: op };
    saveWorld(fresh); return send(res, 201, { ok: true, world: w.id, image: fresh.mapImage });
  }

  if (ep === 'timeline/copy' && req.method === 'POST') {
    const src = findTimeline(b.from || 'canon', lang); if (!src) return send(res, 404, { error: 'source timeline not found' });
    if (!canAdmin(VIEWER, src.world || 'starwars', null)) return send(res, 403, { error: 'Neue Zeitlinien darf nur ein Admin der Welt anlegen / only world admins can create timelines' });
    const c = JSON.parse(JSON.stringify(src)); delete c._file; delete c.readonly;
    c.id = uid('tl'); c.name = b.name || (src.name + ' (Kopie)');
    let f = slug(c.name) + '.json', i = 2; while (fs.existsSync(path.join(DATA_DIR, 'timelines', f))) f = `${slug(c.name)}_${i++}.json`;
    c._file = f; saveTimeline(c); grantCreator(VIEWER, c.id); return send(res, 201, { ok: true, id: c.id, name: c.name, file: f });
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
  if (ep === 'rule' && (req.method === 'POST' || req.method === 'PATCH')) {
    t.rules = t.rules || []; let r = ruleFind(t, b); const created = !r;
    if (!r) { if (req.method === 'PATCH' || !b.title) return send(res, b.title ? 404 : 400, { error: b.title ? 'rule not found' : 'title required' }); r = { id: uid('rl'), title: String(b.title).trim(), text: '', created: new Date().toISOString() }; t.rules.push(r); rulesOf(t).forEach((x, n) => { x.order = n; }); }
    if (b.newTitle) r.title = String(b.newTitle);
    if (b.text !== undefined) r.text = b.append && r.text ? r.text + '\n' + String(b.text) : String(b.text);
    if (b.active !== undefined) r.active = !!b.active;
    if (b.after !== undefined) { const L = rulesOf(t).filter(x => x !== r); let i = L.length; if (b.after === 'start') i = 0; else { const k = L.findIndex(x => x.id === b.after || x.title.toLowerCase() === String(b.after).toLowerCase()); if (k >= 0) i = k + 1; } L.splice(i, 0, r); L.forEach((x, n) => { x.order = n; }); }
    r.updated = new Date().toISOString();
    saveTimeline(t); return send(res, created ? 201 : 200, { ok: true, created, rule: { nr: rulesOf(t).indexOf(r) + 1, id: r.id, title: r.title, text: r.text, active: r.active !== false } });
  }
  if (ep === 'rule' && req.method === 'DELETE') {
    const r = ruleFind(t, b); if (!r) return send(res, 404, { error: 'rule not found (id or exact title)' });
    t.rules = t.rules.filter(x => x !== r); saveTimeline(t); return send(res, 200, { ok: true });
  }
  if (ep === 'worldnote' && (req.method === 'POST' || req.method === 'PATCH')) {
    t.worldNotes = t.worldNotes || []; const f = yearFmt(t, lang), now = new Date().toISOString();
    let n = wnFind(t, b); const created = !n;
    const year = b.year === 'always' ? null : b.year != null && b.year !== '' ? parseYear(b.year, f) : rpYear(t);
    if (!n) { if (req.method === 'PATCH' || !b.title) return send(res, b.title ? 404 : 400, { error: b.title ? 'note not found' : 'title required' }); n = { id: uid('wn'), title: String(b.title).trim(), category: String(b.category || WN_CATS[0]), places: [], revs: [], created: now }; t.worldNotes.push(n); }
    const revs = wnRevs(n);
    if (b.newTitle) n.title = String(b.newTitle);
    if (b.category !== undefined && !created) n.category = String(b.category);
    if (Array.isArray(b.places)) n.places = b.places.map(String).filter(Boolean);
    if (b.until !== undefined) n.until = b.until === null || b.until === '' ? null : parseYear(b.until, f);
    let action = null;
    if (b.text !== undefined || b.certainty !== undefined) {
      // Stand für dieses Jahr ändern oder neuen Stand ab diesem Jahr anlegen (alte Stände bleiben als Verlauf erhalten)
      let r = revs.find(x => (x.year ?? null) === year);
      const prev = wnAt(n, year);
      if (!r) { r = { year, text: prev ? prev.text : '', certainty: prev ? prev.certainty : 'confirmed' }; revs.push(r); action = created ? 'created' : 'new state from ' + (year != null ? fmtYear(year, f) : 'start'); }
      else action = 'updated state ' + (year != null ? fmtYear(year, f) : 'start');
      if (b.text !== undefined) r.text = b.append && r.text ? r.text + '\n\n' + String(b.text) : String(b.text);
      if (b.certainty !== undefined) r.certainty = WN_CERT.includes(b.certainty) ? b.certainty : 'confirmed';
      r.updated = now; wnRevs(n);
    }
    if (!revs.length) revs.push({ year, text: '', certainty: 'confirmed', updated: now });
    n.updated = now;
    saveTimeline(t); return send(res, created ? 201 : 200, { ok: true, created, action, note: { id: n.id, title: n.title, category: n.category, until: n.until ?? null, revisions: revs.map(r => ({ year: r.year != null ? fmtYear(r.year, f) : null, certainty: r.certainty, text: r.text })) } });
  }
  if (ep === 'worldnote' && req.method === 'DELETE') {
    const n = wnFind(t, b); if (!n) return send(res, 404, { error: 'note not found (id or exact title)' });
    t.worldNotes = t.worldNotes.filter(x => x !== n); saveTimeline(t); return send(res, 200, { ok: true });
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
    // Geld mit Verlauf (moneyLog): jede Änderung mit Zeitpunkt, RP-Jahr, Betrag, neuem Stand und Grund
    const before = c.money ?? null;
    if (b.money !== undefined) c.money = b.money === null || b.money === '' ? null : Number(b.money);
    if (b.moneyDelta != null) c.money = (Number(c.money) || 0) + Number(b.moneyDelta);
    if ((c.money ?? null) !== before) {
      c.moneyLog = (c.moneyLog || []).concat([{ at: new Date().toISOString(), year: b.moneyYear != null && b.moneyYear !== '' ? parseYear(b.moneyYear, yearFmt(t, lang)) : rpYear(t),
        delta: c.money == null ? null : (Number(c.money) || 0) - (Number(before) || 0), balance: c.money ?? null, reason: String(b.moneyReason || ''), by: VIEWER && VIEWER.api ? 'API' : (VIEWER && VIEWER.name) || '' }]).slice(-500);
    }
    if (b.currency !== undefined) c.currency = String(b.currency);
    if (b.inventory || b.removeItems) applyInventory(c, { items: b.inventory, remove: b.removeItems });
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
  // ---------------------------------------------------------------- Housing (Raumschiffe, Häuser, Basen)
  if (ep.startsWith('housing')) {
    const H = HOUSING, hErr = e => e instanceof H.HousingError ? send(res, e.code, { error: e.message }) : Promise.reject(e);
    t.housing = H.normalize(t.housing);
    const now = new Date().toISOString();
    const getH = () => { const h = H.findBy(t.housing, b.housing || b.id || b.name); if (!h) throw new H.HousingError('housing not found (Name oder id)', 404); return h; };
    const getD = h => { const d = b.deck ? H.findBy(h.decks, b.deck) : h.decks[0]; if (!d) throw new H.HousingError('deck not found', 404); return d; };
    try {
      if (ep === 'housing' && (req.method === 'POST' || req.method === 'PATCH')) {
        let h = b.id ? t.housing.find(x => x.id === b.id) : H.findBy(t.housing, b.name);
        if (h && !b.id && h.name.toLowerCase() !== String(b.name || '').toLowerCase()) h = null; // nur exakter Name zählt als vorhanden
        const created = !h;
        if (!h) { if (!b.name) return send(res, 400, { error: 'name required' }); if (t.housing.length >= H.LIMITS.housing) return send(res, 413, { error: 'zu viele Einträge' }); h = H.newHousing({ name: b.name, kind: b.kind }); t.housing.push(h); }
        if (b.newName) h.name = String(b.newName).slice(0, H.LIMITS.name);
        if (b.kind && H.KINDS.includes(b.kind)) h.kind = b.kind;
        if (b.description != null) h.description = String(b.description).slice(0, H.LIMITS.text);
        if (Array.isArray(b.owners)) {
          const ids = []; for (const n of b.owners) { const c = findChar(t, n); if (!c) throw new H.HousingError(`Charakter „${n}“ nicht gefunden`, 404); ids.push(c.id); }
          h.owners = [...new Set(ids)];
        }
        if (b.place !== undefined) { if (!b.place) h.place = ''; else { const o = findPlace(t, b.place); if (!o) throw new H.HousingError(`Ort „${b.place}“ nicht gefunden`, 404); h.place = o.id; } }
        h.updated = now; saveTimeline(t);
        return send(res, created ? 201 : 200, { ok: true, created, id: h.id, name: h.name, decks: h.decks.map(d => ({ id: d.id, name: d.name, cols: d.cols, rows: d.rows })) });
      }
      if (ep === 'housing' && req.method === 'DELETE') {
        const h = t.housing.find(x => x.id === b.id || (b.name && x.name.toLowerCase() === String(b.name).toLowerCase()));
        if (!h) return send(res, 404, { error: 'housing not found (exakter Name oder id)' });
        t.housing = t.housing.filter(x => x !== h); saveTimeline(t); return send(res, 200, { ok: true, deleted: h.id });
      }
      if (ep === 'housing/deck' && (req.method === 'POST' || req.method === 'PATCH')) {
        const h = getH(); let d = b.deckId ? h.decks.find(x => x.id === b.deckId) : (b.deck ? h.decks.find(x => x.id === b.deck || x.name.toLowerCase() === String(b.deck).toLowerCase()) : null);
        const created = !d;
        if (!d) { if (h.decks.length >= H.LIMITS.decks) return send(res, 413, { error: 'zu viele Decks' }); d = H.newDeck({ name: b.newName || b.deck || 'Deck ' + (h.decks.length + 1), cols: b.cols, rows: b.rows, unit: b.unit }); h.decks.push(d); }
        else H.applyDeck(d, { name: b.newName, cols: b.cols, rows: b.rows, unit: b.unit, imageOpacity: b.imageOpacity });
        if (created && b.imageOpacity != null) H.applyDeck(d, { imageOpacity: b.imageOpacity });
        h.updated = now; saveTimeline(t); return send(res, created ? 201 : 200, { ok: true, created, deck: { id: d.id, name: d.name, cols: d.cols, rows: d.rows } });
      }
      if (ep === 'housing/deck' && req.method === 'DELETE') {
        const h = getH(), d = h.decks.find(x => x.id === b.deck || x.name.toLowerCase() === String(b.deck || '').toLowerCase());
        if (!d) return send(res, 404, { error: 'deck not found (exakter Name oder id)' });
        if (h.decks.length === 1) return send(res, 409, { error: 'Das letzte Deck kann nicht gelöscht werden' });
        h.decks = h.decks.filter(x => x !== d); h.updated = now; saveTimeline(t); return send(res, 200, { ok: true, deleted: d.id });
      }
      if (ep === 'housing/deck/image') {
        const h = getH(), d = getD(h);
        if (req.method === 'DELETE' || b.clear) { H.setImage(d, null); h.updated = now; saveTimeline(t); return send(res, 200, { ok: true, removed: true }); }
        const img = await storeImageInfo(b); VIEWER = viewer;
        H.setImage(d, img, b.fitGrid !== false);
        if (b.imageOpacity != null) H.applyDeck(d, { imageOpacity: b.imageOpacity });
        h.updated = now; saveTimeline(t); return send(res, 201, { ok: true, deck: d.id, image: d.image, cols: d.cols, rows: d.rows });
      }
      if (ep === 'housing/room' && (req.method === 'POST' || req.method === 'PATCH')) {
        const h = getH(), d = getD(h);
        let r = b.roomId ? d.rooms.find(x => x.id === b.roomId) : (b.room ? d.rooms.find(x => x.id === b.room || x.name.toLowerCase() === String(b.room).toLowerCase()) : null);
        if (b.roomId && !r) return send(res, 404, { error: 'room not found (id)' });
        const created = !r;
        if (!r) {
          if (d.rooms.length >= H.LIMITS.rooms) return send(res, 413, { error: 'zu viele Räume' });
          r = { id: H.uid('rm'), name: String(b.newName || b.room || b.name || 'Raum'), color: H.COLORS[d.rooms.length % H.COLORS.length], rects: [], pin: null, description: '', furnishing: '', items: [], notes: '' };
        }
        const draft = JSON.parse(JSON.stringify(r));
        H.applyRoom(d, draft, Object.assign({}, b, { name: b.newName != null ? b.newName : (created ? draft.name : undefined) }));
        if (created) d.rooms.push(draft); else Object.assign(r, draft);
        h.updated = now; saveTimeline(t);
        const ov = H.overlaps(d).filter(p => p.includes(draft.id)).map(p => d.rooms.find(x => x.id === p.find(id => id !== draft.id)).name);
        return send(res, created ? 201 : 200, Object.assign({ ok: true, created, room: { id: draft.id, name: draft.name, rects: draft.rects, pin: draft.pin, area: H.areaOf(draft) } }, ov.length ? { warning: 'überlappt mit: ' + ov.join(', ') } : {}));
      }
      if (ep === 'housing/room' && req.method === 'DELETE') {
        const h = getH(), d = getD(h), r = d.rooms.find(x => x.id === b.room || x.name.toLowerCase() === String(b.room || '').toLowerCase());
        if (!r) return send(res, 404, { error: 'room not found (exakter Name oder id)' });
        d.rooms = d.rooms.filter(x => x !== r); h.updated = now; saveTimeline(t); return send(res, 200, { ok: true, deleted: r.id });
      }
      if (ep === 'housing/wall' && req.method === 'POST') {
        const h = getH(), d = getD(h), r = H.findBy(d.rooms, b.room); if (!r) return send(res, 404, { error: 'room not found' });
        const touched = H.moveWall(d, r, b.side, b.by, b.neighbors !== false);
        h.updated = now; saveTimeline(t);
        return send(res, 200, { ok: true, changed: touched.map(id => { const x = d.rooms.find(q => q.id === id); return { id, name: x.name, rects: x.rects }; }) });
      }
    } catch (e) { return hErr(e); }
    return send(res, 404, { error: 'unknown endpoint' });
  }
  if (ep === 'story' && (req.method === 'POST' || req.method === 'PATCH')) {
    const f = yearFmt(t, lang); t.story = t.story || [];
    let e = b.id ? t.story.find(x => x.id === b.id) : null;
    if (req.method === 'PATCH' && !e) return send(res, 404, { error: 'story section not found (id)' });
    const now = new Date().toISOString(), y = b.year != null && b.year !== '' ? parseYear(b.year, f) : null;
    if (!e) {
      if (!b.title && !b.text) return send(res, 400, { error: 'title or text required' });
      const aft = b.after && b.after !== 'start' ? t.story.find(x => x.id === b.after) : null;
      const last = aft || t.story.slice().sort(storySortT(t))[t.story.length - 1];
      const s2 = t.eras.slice().sort((a, c) => a.year - c.year);
      e = { id: uid('st'), year: y != null ? y : last ? last.year : s2.length ? s2[s2.length - 1].year : 0, title: String(b.title || '').trim() || (lang === 'en' ? 'Section' : 'Abschnitt') + ' ' + (t.story.length + 1), text: String(b.text || ''), places: [], created: now };
      // Kapitel: angegeben (wird bei Bedarf angelegt), sonst das des Vorgängers
      const ch = b.chapter ? chapterFor(t, b.chapter, true) : null; e.chapter = ch ? ch.id : (last && last.chapter) || '';
      t.story.push(e); storyPlace(t, e, b.after);
    } else {
      if (b.chapter !== undefined) { const ch = b.chapter ? chapterFor(t, b.chapter, true) : null; const nid = ch ? ch.id : ''; if (nid !== (e.chapter || '')) { e.chapter = nid; if (y != null) e.year = y; storyPlace(t, e, b.after); } }
      if (y != null && y !== e.year) { e.year = y; storyPlace(t, e, b.after); }
      else if (b.after) storyPlace(t, e, b.after);
      if (b.title !== undefined) e.title = String(b.title);
      if (b.text !== undefined) e.text = b.append ? (e.text ? e.text + '\n\n' : '') + String(b.text) : String(b.text);
      e.updated = now;
    }
    if (Array.isArray(b.places)) e.places = b.places.map(String).filter(Boolean);
    saveTimeline(t); return send(res, req.method === 'POST' && !b.id ? 201 : 200, { ok: true, section: storyList(t, lang).find(x => x.id === e.id) });
  }
  if (ep === 'chapter' && (req.method === 'POST' || req.method === 'PATCH')) {
    t.chapters = t.chapters || [];
    let c = chapterFor(t, b.id || b.title);
    const created = !c; if (!c) { if (!b.title) return send(res, 400, { error: 'title required' }); c = chapterFor(t, b.title, true); }
    if (b.newTitle) c.title = String(b.newTitle).trim().replace(/^(kapitel|chapter)\s*\d+\s*[:.\-–]\s*/i, '').trim() || c.title;
    if (b.summary !== undefined) c.summary = String(b.summary);
    if (b.after !== undefined) { const list = chapSorted(t).filter(x => x !== c); let i = list.length; if (b.after === 'start') i = 0; else { const k = list.findIndex(x => x.id === b.after || x.title.toLowerCase() === String(b.after).toLowerCase()); if (k >= 0) i = k + 1; } list.splice(i, 0, c); list.forEach((x, n) => { x.order = n; }); }
    if (Array.isArray(b.sections)) for (const id of b.sections) { const e = (t.story || []).find(x => x.id === id); if (e) { e.chapter = c.id; storyPlace(t, e); } }
    saveTimeline(t); return send(res, created ? 201 : 200, { ok: true, created, chapter: { id: c.id, nr: chapSorted(t).indexOf(c) + 1, title: c.title, summary: c.summary || '' } });
  }
  if (ep === 'chapter' && req.method === 'DELETE') {
    const c = chapterFor(t, b.id || b.title || q.get('title')); if (!c) return send(res, 404, { error: 'chapter not found' });
    t.chapters = t.chapters.filter(x => x !== c); for (const e of t.story || []) if (e.chapter === c.id) e.chapter = '';
    chapSorted(t).forEach((x, n) => { x.order = n; }); saveTimeline(t); return send(res, 200, { ok: true, note: 'sections kept without chapter' });
  }
  if (ep === 'chapter/order' && req.method === 'POST') {
    const ids = Array.isArray(b.ids) ? b.ids : []; const cs = ids.map(id => chapterFor(t, id)).filter(Boolean);
    const rest = chapSorted(t).filter(x => !cs.includes(x)); cs.concat(rest).forEach((x, n) => { x.order = n; });
    saveTimeline(t); return send(res, 200, { ok: true, order: chapSorted(t).map((c, i) => `${i + 1}. ${c.title}`) });
  }
  if (ep === 'story/order' && req.method === 'POST') {
    const ids = Array.isArray(b.ids) ? b.ids.map(String) : []; if (!ids.length) return send(res, 400, { error: 'ids required (story section ids in chronological order)' });
    t.story = t.story || []; const rank = new Map(ids.map((id, i) => [id, i])), unknown = ids.filter(id => !t.story.some(x => x.id === id));
    const f = yearFmt(t, lang), warn = [];
    if (b.adjustYears) { // Jahre absteigender Einträge an den Vorgänger angleichen
      let prev = null; for (const id of ids) { const e = t.story.find(x => x.id === id); if (!e) continue; if (prev && e.year < prev.year) { warn.push(`${e.title}: ${fmtYear(e.year, f)} → ${fmtYear(prev.year, f)}`); e.year = prev.year; } prev = e; }
    }
    const keys = [...new Set(t.story.map(x => x.year + '|' + (x.chapter || '')))];
    for (const ky of keys) {
      const grp = t.story.filter(x => x.year + '|' + (x.chapter || '') === ky).sort((a, c) => (rank.has(a.id) ? rank.get(a.id) : 1e6 + (a.order ?? 1e5)) - (rank.has(c.id) ? rank.get(c.id) : 1e6 + (c.order ?? 1e5)) || storySort(a, c));
      grp.forEach((x, n) => { x.order = n; });
    }
    const conflicts = []; let prev = null;
    if (!b.adjustYears) for (const id of ids) { const e = t.story.find(x => x.id === id); if (!e) continue; if (prev && e.year < prev.year) conflicts.push(`„${e.title}“ (${fmtYear(e.year, f)}) soll nach „${prev.title}“ (${fmtYear(prev.year, f)}) kommen – Jahr passt nicht; mit adjustYears=true angleichen oder per update_story_entry ändern`); prev = e; }
    saveTimeline(t);
    return send(res, 200, { ok: true, unknownIds: unknown, yearChanges: warn, conflicts, order: storyList(t, lang).map(e => `${e.nr}. ${e.chapter ? '[' + e.chapter + '] ' : ''}${e.title} (${e.yearLabel})`) });
  }
  if (ep === 'story' && req.method === 'DELETE') {
    const id = b.id || q.get('id'); const n = (t.story || []).length;
    t.story = (t.story || []).filter(x => x.id !== id); if (t.story.length === n) return send(res, 404, { error: 'story section not found' });
    saveTimeline(t); return send(res, 200, { ok: true });
  }
  if (ep === 'conflict' && (req.method === 'POST' || req.method === 'PATCH')) {
    t.conflicts = Array.isArray(t.conflicts) ? t.conflicts : [];
    const f = yearFmt(t, lang), q = String(b.name || '').toLowerCase().trim();
    let c = t.conflicts.find(x => (b.id && x.id === b.id) || x.id === b.name) || t.conflicts.find(x => x.name.toLowerCase() === q);
    const created = !c;
    if (!c && b.to !== undefined && !Array.isArray(b.places) && b.x == null) return send(res, 404, { error: 'conflict not found (Name oder id) – list_conflicts mit all=true zeigt alle' });
    if (!c) { if (!b.name) return send(res, 400, { error: 'name required' }); c = { id: uid('cf'), name: String(b.name).trim().slice(0, 120), from: rpYear(t), to: null, factions: [], places: [], x: 0, y: 0, r: 0, desc: '', color: '#e0453a' }; }
    if (b.newName) c.name = String(b.newName).trim().slice(0, 120);
    const yr = (v, k) => { if (v === undefined) return; if (v === null || v === '' || /^(open|offen|andauernd|ongoing)$/i.test(String(v))) { c[k] = null; return; } const y = parseYear(v, f); if (y == null) throw Object.assign(new Error(`${k}: Jahr nicht erkannt (z.B. "3640 VSY")`), { code: 400 }); c[k] = y; };
    yr(b.from, 'from'); yr(b.to, 'to');
    if (c.from != null && c.to != null && c.to < c.from) return send(res, 400, { error: 'to liegt vor from' });
    if (Array.isArray(b.factions)) { const ids = []; for (const n of b.factions) { const fa = findFaction(t, n); if (!fa) return send(res, 404, { error: `Fraktion „${n}“ nicht gefunden` }); ids.push(fa.id); } c.factions = [...new Set(ids)]; }
    if (b.description !== undefined) c.desc = String(b.description || '').slice(0, 5000);
    if (b.color && /^#[0-9a-fA-F]{6}$/.test(b.color)) c.color = b.color;
    // Fläche: aus Orten berechnen (Kreis um alle genannten Orte) oder direkt x/y/radius
    if (Array.isArray(b.places) && b.places.length) {
      const byId = Object.fromEntries(t.objects.map(x => [x.id, x])), pts = [], ids = [];
      for (const n of b.places) {
        let o = findPlace(t, n); if (!o) return send(res, 404, { error: `Ort „${n}“ nicht gefunden` });
        ids.push(o.id); let k = o, i = 0; while (CHILD.includes(k.type) && k.parent && byId[k.parent] && i++ < 8) k = byId[k.parent];
        if (Number.isFinite(k.x) && Number.isFinite(k.y)) pts.push([k.x, k.y]);
      }
      if (!pts.length) return send(res, 400, { error: 'Die Orte haben keine Kartenposition' });
      const pad = { small: 30, medium: 55, large: 95 }[b.size] || (b.padding > 0 ? Math.min(400, +b.padding) : 55);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      c.x = Math.round(cx); c.y = Math.round(cy); c.r = Math.round(Math.max(...pts.map(p => Math.hypot(p[0] - cx, p[1] - cy))) + pad); c.places = [...new Set(ids)];
    } else if (b.x != null && b.y != null && b.radius != null) {
      const x = +b.x, y = +b.y, r = +b.radius; if (![x, y, r].every(Number.isFinite) || r < 5 || r > 3000) return send(res, 400, { error: 'x, y, radius ungültig' });
      c.x = Math.round(x); c.y = Math.round(y); c.r = Math.round(r); if (Array.isArray(b.places)) c.places = [];
    }
    if (created) { if (!c.r) return send(res, 400, { error: 'Fläche fehlt: places (Ortsnamen) oder x, y, radius angeben' }); t.conflicts.push(c); }
    saveTimeline(t);
    return send(res, created ? 201 : 200, { ok: true, created, conflict: { id: c.id, name: c.name, from: fmtYear(c.from, f), to: c.to == null ? null : fmtYear(c.to, f), x: c.x, y: c.y, radius: c.r, factions: c.factions.map(id => (t.factions.find(x => x.id === id) || {}).name) } });
  }
  if (ep === 'conflict' && req.method === 'DELETE') {
    const q = String(b.name || '').toLowerCase().trim(), c = (t.conflicts || []).find(x => x.id === b.id || x.id === b.name || x.name.toLowerCase() === q);
    if (!c) return send(res, 404, { error: 'conflict not found (exakter Name oder id)' });
    t.conflicts = t.conflicts.filter(x => x !== c); saveTimeline(t); return send(res, 200, { ok: true, deleted: c.id });
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
    info: { title: 'Ascandir RP-Manager', version: VERSION, description: 'Interaktive Karte (Star Wars & eigene Welten). Lesen: Zustand der Galaxis in einem Jahr, Orte, Fraktionen. Schreiben: Orte, Fraktionen, Zeitalter und Kontrolle in einer eigenen (kopierten) Zeitlinie ändern.' },
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
    name: 'Ascandir RP-Manager API', version: VERSION,
    endpoints: {
      'GET /api/v1/worlds': 'Alle Welten',
      'GET /api/v1/timelines?world=': 'Zeitlinien (optional nach Welt gefiltert)',
      'GET /api/v1/timeline?timeline=&lang=': 'Komplette Zeitlinie als JSON',
      'GET /api/v1/state?timeline=&year=&lang=': 'Zeitalter + Fraktionen mit Gebieten im Jahr',
      'GET /api/v1/place?name=&timeline=&year=&lang=': 'Eckdaten und Kontrolle eines Ortes im Jahr',
      'GET /api/v1/search?q=&timeline=': 'Orte suchen',
      'GET /api/v1/rules?timeline=&all=&format=text': 'Weltregeln lesen',
      'POST /api/v1/rule | DELETE /api/v1/rule': 'Weltregel anlegen/ändern (title/id, newTitle, text, append, active, after) / löschen',
      'GET /api/v1/worldnotes?timeline=&category=&q=&place=&format=text': 'Weltnotizen lesen',
      'POST /api/v1/worldnote | DELETE /api/v1/worldnote': 'Weltnotiz anlegen/aktualisieren (title/id, category, text, append, certainty, places) / löschen',
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
      'POST /api/v1/chapter | DELETE /api/v1/chapter | POST /api/v1/chapter/order': 'Kapitel anlegen/ändern (title, newTitle, summary, after, sections) / löschen / sortieren',
      'POST /api/v1/story/order': 'Story-Abschnitte sortieren (ids, adjustYears)',
      'POST /api/v1/story | PATCH /api/v1/story | DELETE /api/v1/story': 'Story-Abschnitt anlegen (title, text, year, places) / ändern (id, append) / löschen (id)',
      'PUT /api/v1/timeline?timeline=': 'Komplette Zeitlinie ersetzen',
      'GET /api/v1/housings?timeline= | GET /api/v1/housing?timeline=&name=&format=text': 'Housing (Raumschiffe, Häuser) lesen',
      'POST|DELETE /api/v1/housing, /housing/deck, /housing/deck/image, /housing/room · POST /api/v1/housing/wall': 'Housing, Decks, Grundriss-Bild, Räume ändern; Wand verschieben (room, side, by)',
      'POST /api/v1/world/image | DELETE /api/v1/world/image': 'Weltbild einer eigenen Welt setzen (world, url oder data, opacity) / entfernen'
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
  if (ep === 'rules') {
    const t = tl(), all = q.get('all') === '1' || q.get('all') === 'true';
    if (q.get('format') === 'text') return send(res, 200, rulesText(t, lang, all), 'text/plain; charset=utf-8');
    return send(res, 200, { timeline: t.name, rules: rulesOf(t).filter(r => all || r.active !== false).map((r, i) => ({ nr: i + 1, id: r.id, title: r.title, text: r.text || '', active: r.active !== false })) });
  }
  if (ep === 'worldnotes') {
    const t = tl(), cq = (q.get('category') || '').toLowerCase(), qq = (q.get('q') || '').toLowerCase(), pq = (q.get('place') || '').toLowerCase();
    let list = (t.worldNotes || []).slice().sort(wnSort);
    if (cq) list = list.filter(n => String(n.category || '').toLowerCase().includes(cq));
    const txt = n => n.title + ' ' + wnRevs(n).map(r => r.text).join(' ');
    if (qq) list = list.filter(n => txt(n).toLowerCase().includes(qq));
    if (pq) list = list.filter(n => (n.places || []).some(p => p.toLowerCase().includes(pq)) || txt(n).toLowerCase().includes(pq));
    const yq = q.get('year'), year = yq === 'latest' ? null : yq ? parseYear(yq, yearFmt(t, lang)) : rpYear(t);
    if (q.get('format') === 'text') return send(res, 200, wnText(t, lang, list, year, q.get('history') === '1' || q.get('history') === 'true'), 'text/plain; charset=utf-8');
    const f = yearFmt(t, lang);
    return send(res, 200, { timeline: t.name, year, yearLabel: year != null ? fmtYear(year, f) : null, notes: list.map(n => { const r = wnAt(n, year); return r ? { id: n.id, title: n.title, category: n.category, places: n.places || [], until: n.until ?? null, text: r.text, certainty: r.certainty, since: r.year, sinceLabel: r.year != null ? fmtYear(r.year, f) : null, revisions: wnRevs(n).length } : null; }).filter(Boolean) });
  }
  if (ep === 'housings' || ep === 'housing') {
    const t = tl(), list = HOUSING.normalize(JSON.parse(JSON.stringify(t.housing || [])));
    const ctx = { charName: id => { const c = (t.characters || []).find(x => x.id === id); return c && c.name; }, placeName: id => { const o = t.objects.find(x => x.id === id); return o && o.name; } };
    if (ep === 'housings') {
      const out = list.map(h => ({ id: h.id, name: h.name, kind: h.kind, owners: h.owners.map(id => ctx.charName(id) || id), place: h.place ? ctx.placeName(h.place) || h.place : '', decks: h.decks.map(d => ({ id: d.id, name: d.name, rooms: d.rooms.length, image: !!d.image })) }));
      if (q.get('format') === 'text') return send(res, 200, out.length ? out.map(h => `- ${h.name} [id: ${h.id}] (${h.kind})${h.owners.length ? ' – ' + h.owners.join(', ') : ''}${h.place ? ' @ ' + h.place : ''} · ${h.decks.map(d => d.name + ': ' + d.rooms + ' Räume').join(', ')}`).join('\n') : (lang === 'en' ? 'No housing yet.' : 'Noch keine Unterkünfte/Schiffe.'), 'text/plain; charset=utf-8');
      return send(res, 200, { timeline: t.name, housing: out });
    }
    const h = HOUSING.findBy(list, q.get('name') || q.get('id')); if (!h) return send(res, 404, { error: 'housing not found' });
    if (q.get('format') === 'text') return send(res, 200, HOUSING.textOf(h, ctx, lang), 'text/plain; charset=utf-8');
    return send(res, 200, h);
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
    const t = tl(), list = storyList(t, lang, { chapter: q.get('chapter'), from: q.get('from'), to: q.get('to'), era: q.get('era'), q: q.get('q') });
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
  if (ep === 'conflicts') {
    const t = tl(), f = yearFmt(t, lang), de = lang !== 'en', all = q.get('all') === '1' || q.get('all') === 'true';
    const y = q.get('year') ? year(t) : rpYear(t), list = all ? (t.conflicts || []) : conflictsAt(t, y);
    if (q.get('format') === 'text') return send(res, 200, list.length ? list.map(c => `- ${conflictLine(t, c, f, de)} [id: ${c.id}]`).join('\n') : (de ? 'Keine ' + (all ? '' : 'aktiven ') + 'Konfliktzonen.' : 'No ' + (all ? '' : 'active ') + 'conflict zones.'), 'text/plain; charset=utf-8');
    return send(res, 200, { year: fmtYear(y, f), conflicts: list });
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
let MCP_VIEWER = null; // Betrachter des laufenden MCP-Werkzeugaufrufs (wird synchron gesetzt)
function internalCall(method, pathname, params, body, viewer) {
  return new Promise(resolve => {
    const u = new URL('http://internal' + pathname);
    for (const [k, v] of Object.entries(params || {})) {
      if (v == null || v === '') continue;
      if (Array.isArray(v)) v.forEach(x => u.searchParams.append(k, String(x))); else u.searchParams.set(k, String(v));
    }
    const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
    req.method = method; req.headers = { host: 'internal' };
    req.iamViewer = viewer || MCP_VIEWER || { guest: true, perms: { worlds: {}, timelines: {} } };
    const res = { code: 200, writeHead(c) { this.code = c; }, end(d) { resolve({ code: this.code, body: d == null ? '' : d.toString() }); }, write() { } };
    Promise.resolve(apiV1(req, res, u)).catch(e => resolve({ code: Number.isInteger(e.code) ? e.code : (e instanceof SyntaxError ? 400 : 500), body: JSON.stringify({ error: e.message }) }));
  });
}
const S = (props, required = []) => ({ type: 'object', properties: props, required });
const str = d => ({ type: 'string', description: d });
const TL = str('Zeitlinie (Name oder ID). Leer = Kanon (schreibgeschützt).'), YR = str('Jahr, z.B. "3640 BBY", "4 ABY" oder "-3640"'), LG = { type: 'string', enum: ['de', 'en'], description: 'Sprache der Antwort' };
const ITEM = { type: 'object', properties: { name: { type: 'string' }, newName: { type: 'string' }, qty: { type: 'number' }, qtyDelta: { type: 'number' }, type: { type: 'string', enum: ['gear', 'property'], description: 'gear = Ausrüstung/trägt bei sich, property = Eigentum (Schiff, Wohnung …)' },
  location: { type: 'string', description: 'wo, z.B. "am Gürtel", "auf der Trailblazer"' }, important: { type: 'boolean', description: 'storyrelevant' }, note: { type: 'string' } }, required: ['name'] };
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
    inputSchema: S({ timeline: TL, chapter: str('nur dieses Kapitel (Titel/id)'), from: str('ab Jahr, z.B. "3641 BBY"'), to: str('bis Jahr'), era: str('nur dieses Zeitalter (Name)'), query: str('Suchtext'), last: { type: 'number', description: 'nur die letzten N Abschnitte' }, lang: LG }, ['timeline']),
    run: (a, v) => internalCall('GET', '/api/v1/story', { timeline: a.timeline, chapter: a.chapter, from: a.from, to: a.to, era: a.era, q: a.query, last: a.last, lang: a.lang, format: 'text' }, null, v) },
  { name: 'add_story_entry', title: 'Story-Abschnitt anlegen', description: 'Neuen Story-Abschnitt anlegen (erscheint im Story-Reiter). Ein Abschnitt pro Szene/Ereignis. Ohne Jahr wird das Jahr des letzten Abschnitts verwendet.',
    inputSchema: S({ timeline: TL, title: str('kurzer Titel'), text: str('Text (Leerzeile = Absatz, **fett**, *kursiv*)'), year: YR, after: str('optional: id des Abschnitts, hinter dem eingefügt wird ("start" = an den Anfang des Jahres)'), chapter: str('Kapitel (Titel oder id; wird bei Bedarf angelegt). Ohne Angabe: Kapitel des vorherigen Abschnitts'), places: { type: 'array', items: { type: 'string' }, description: 'beteiligte Orte' } }, ['timeline', 'title', 'text']), run: a => internalCall('POST', '/api/v1/story', {}, a) },
  { name: 'update_story_entry', title: 'Story-Abschnitt ändern', description: 'Abschnitt per id ändern. append=true hängt den Text an statt ihn zu ersetzen.',
    inputSchema: S({ timeline: TL, id: str('id aus list_story'), title: str('neuer Titel'), text: str('Text'), append: { type: 'boolean', description: 'Text anhängen' }, year: YR, after: str('optional: hinter diesen Abschnitt verschieben (id oder "start")'), chapter: str('in dieses Kapitel verschieben (Titel/id, "" = ohne Kapitel)'), places: { type: 'array', items: { type: 'string' } } }, ['timeline', 'id']), run: a => internalCall('PATCH', '/api/v1/story', {}, a) },
  { name: 'upsert_chapter', title: 'Kapitel anlegen/ändern', description: 'Story-Kapitel anlegen oder ändern: Titel, Kurzbeschreibung (summary), Position (after = Kapitel-id/-titel oder "start"), sections = Abschnitts-ids, die in dieses Kapitel gehören. Umbenennen über newTitle.',
    inputSchema: S({ timeline: TL, title: str('Kapiteltitel (Schlüssel)'), id: str('alternativ: Kapitel-id'), newTitle: str('neuer Titel'), summary: str('kurze Zusammenfassung des Kapitels'), after: str('hinter dieses Kapitel setzen oder "start"'), sections: { type: 'array', items: { type: 'string' }, description: 'Abschnitts-ids, die diesem Kapitel zugeordnet werden' } }, ['timeline']),
    run: a => internalCall('POST', '/api/v1/chapter', {}, a) },
  { name: 'reorder_chapters', title: 'Kapitel sortieren', description: 'Kapitel in die gewünschte Reihenfolge bringen (ids oder Titel).',
    inputSchema: S({ timeline: TL, ids: { type: 'array', items: { type: 'string' } } }, ['timeline', 'ids']), run: a => internalCall('POST', '/api/v1/chapter/order', {}, a) },
  { name: 'delete_chapter', title: 'Kapitel löschen', description: 'Kapitel löschen; die Abschnitte bleiben erhalten (ohne Kapitel).', inputSchema: S({ timeline: TL, title: str('Titel oder id') }, ['timeline', 'title']), run: a => internalCall('DELETE', '/api/v1/chapter', {}, a) },
  { name: 'reorder_story', title: 'Story sortieren', description: 'Story-Abschnitte in chronologische Reihenfolge bringen: ids in der gewünschten Reihenfolge übergeben (alle oder ein Teil). Sortiert wird nach Jahr und innerhalb eines Jahres nach dieser Reihenfolge. adjustYears=true setzt Abschnitte, die laut Reihenfolge später kommen, aber ein früheres Jahr haben, auf das Jahr ihres Vorgängers.',
    inputSchema: S({ timeline: TL, ids: { type: 'array', items: { type: 'string' }, description: 'Abschnitts-ids in chronologischer Reihenfolge' }, adjustYears: { type: 'boolean' } }, ['timeline', 'ids']), run: a => internalCall('POST', '/api/v1/story/order', {}, a) },
  { name: 'delete_story_entry', title: 'Story-Abschnitt löschen', description: 'Abschnitt per id löschen.', inputSchema: S({ timeline: TL, id: str('id aus list_story') }, ['timeline', 'id']), run: a => internalCall('DELETE', '/api/v1/story', {}, a) },
  { name: 'list_rules', title: 'Weltregeln lesen', description: 'Feste Regeln der Welt/Zeitlinie, die IMMER gelten und Vorrang haben (z.B. Erzählregeln, Kanon-Vorgaben, Machtsystem). Vor dem Erzählen und vor Änderungen lesen und strikt einhalten.', ro: true,
    inputSchema: S({ timeline: TL, all: { type: 'boolean', description: 'auch deaktivierte Regeln zeigen' }, lang: LG }, ['timeline']),
    run: (a, v) => internalCall('GET', '/api/v1/rules', { timeline: a.timeline, all: a.all ? '1' : undefined, lang: a.lang, format: 'text' }, null, v) },
  { name: 'upsert_rule', title: 'Weltregel anlegen/ändern', description: 'Weltregel anlegen oder ändern (per Titel oder id). NUR auf ausdrücklichen Wunsch des Nutzers – Regeln gibt der Nutzer vor. active=false deaktiviert, after = Position (Regel-id/-titel oder "start").',
    inputSchema: S({ timeline: TL, title: str('Titel (Schlüssel)'), id: str('alternativ: id'), newTitle: str('neuer Titel'), text: str('Regeltext'), append: { type: 'boolean' }, active: { type: 'boolean' }, after: str('Position') }, ['timeline']),
    run: a => internalCall('POST', '/api/v1/rule', {}, a) },
  { name: 'delete_rule', title: 'Weltregel löschen', description: 'Weltregel löschen (nur auf ausdrücklichen Wunsch des Nutzers).', inputSchema: S({ timeline: TL, title: str('Titel'), id: str('id') }, ['timeline']), run: a => internalCall('DELETE', '/api/v1/rule', {}, a) },
  { name: 'list_world_notes', title: 'Weltnotizen lesen', description: 'Aktueller Zustand der Welt (unabhängig von der Spieler-Story): Galaktische Lage, Fraktionen, Planeten & Regionen, Organisationen, offene Handlungsstränge, gesicherte Erkenntnisse. Weltnotizen sind NICHT das Wissen aller Charaktere – das steht in den Charakterakten.', ro: true,
    inputSchema: S({ timeline: TL, year: str('Stand zu diesem Jahr (Standard: Jahr des neuesten Story-Abschnitts; "latest" = jeweils neuester Stand)'), history: { type: 'boolean', description: 'frühere Stände mit ausgeben' }, category: str('nur diese Kategorie'), query: str('Suchtext'), place: str('Ort'), lang: LG }, ['timeline']),
    run: (a, v) => internalCall('GET', '/api/v1/worldnotes', { timeline: a.timeline, year: a.year, history: a.history ? '1' : undefined, category: a.category, q: a.query, place: a.place, lang: a.lang, format: 'text' }, null, v) },
  { name: 'upsert_world_note', title: 'Weltnotiz anlegen/aktualisieren', description: 'Weltnotiz anlegen oder aktualisieren. Notizen sind an Jahre gebunden: Text/Einstufung gelten ab year (Standard: Jahr des neuesten Story-Abschnitts). Gibt es für dieses Jahr schon einen Stand, wird er geändert; sonst entsteht ein neuer Stand ab diesem Jahr, frühere bleiben als Verlauf erhalten (wichtig für Rückblicke). until = Jahr, ab dem die Notiz nicht mehr gilt. Bestehende Notizen bevorzugt aktualisieren (per id oder Titel) statt für jede Kleinigkeit eine neue anzulegen. Kategorien (frei, empfohlen): ' + WN_CATS.join(', ') + '. certainty: confirmed (gesichert), suspected (Vermutung), rumor (Gerücht). append=true hängt Text an.',
    inputSchema: S({ timeline: TL, title: str('Titel (Schlüssel)'), id: str('alternativ: id'), category: str('Kategorie'), newTitle: str('neuer Titel'), text: str('Inhalt (Markdown: **fett**, *kursiv*, Leerzeile = Absatz)'),
      year: str('gilt ab diesem Jahr, z.B. "3640 BBY" ("always" = von Anfang an)'), until: str('gilt bis zu diesem Jahr (leer = offen)'),
      append: { type: 'boolean' }, certainty: { type: 'string', enum: WN_CERT }, places: { type: 'array', items: { type: 'string' }, description: 'betroffene Orte' } }, ['timeline']),
    run: a => internalCall('POST', '/api/v1/worldnote', {}, a) },
  { name: 'delete_world_note', title: 'Weltnotiz löschen', description: 'Weltnotiz löschen (id oder exakter Titel).', inputSchema: S({ timeline: TL, title: str('Titel'), id: str('id') }, ['timeline']), run: a => internalCall('DELETE', '/api/v1/worldnote', {}, a) },
  { name: 'list_characters', title: 'Charaktere auflisten', description: 'Charaktere einer Zeitlinie (Name, Rolle, Fraktion, Ort, Status). Filter: Suchtext, Fraktion, Ort.', ro: true,
    inputSchema: S({ timeline: TL, query: str('Suchtext'), faction: str('Fraktion'), place: str('Ort/Heimatwelt'), group: str('Gruppe'), lang: LG }, ['timeline']),
    run: (a, v) => internalCall('GET', '/api/v1/characters', { timeline: a.timeline, q: a.query, faction: a.faction, place: a.place, group: a.group, lang: a.lang, format: 'text' }, null, v) },
  { name: 'get_character', title: 'Charakter lesen', description: 'Alle Details eines Charakters (Steckbrief, Aussehen, Persönlichkeit, Hintergrund, Beziehungen).', ro: true,
    inputSchema: S({ timeline: TL, name: str('Name oder id'), lang: LG }, ['timeline', 'name']), run: (a, v) => internalCall('GET', '/api/v1/character', { timeline: a.timeline, name: a.name, lang: a.lang, format: 'text' }, null, v) },
  { name: 'upsert_character', title: 'Charakter anlegen/ändern', description: 'Charakter anlegen oder Felder ändern (nur angegebene Felder werden geändert). Gliederung: Identität (species, age, gender, homeworld), Erscheinungsbild (appearance: Gesicht, Haare, Augen, Körperbau, Kleidung), Persönlichkeit (personality: Züge, Verhalten, Eigenheiten), Hintergrund (bio: Herkunft, Ausbildung, Vergangenheit), Zugehörigkeit (faction, title=Rang, organization, master), Fähigkeiten (abilities: Machtfähigkeiten, Kampfstil, Fachwissen), Besitz & Inventar (money/moneyDelta mit moneyReason für den Geldverlauf, currency, inventory mit type gear|property, important = storyrelevant, removeItems), Beziehungen (relations/addRelations mit kind ally|enemy|family|contact|other), Wissen (knowledge: was die Person über Tim und andere weiß), Aktueller Stand (location, status, threads = laufende Handlungsstränge). append: Liste von Textfeldern, an die angehängt statt ersetzt wird (z.B. ["knowledge","threads"]). Texte dürfen **fett**/*kursiv* und Leerzeilen enthalten.',
    inputSchema: S({ timeline: TL, name: str('Name (Schlüssel)'), newName: str('neuer Name'),
      group: str('Gruppe, z.B. "Crew der Trailblazer" (wird bei Bedarf angelegt; leer = keine)'), groupColor: str('Farbe der Gruppe, z.B. "#e57373"'),
      species: str('Spezies'), age: str('Alter, z.B. "34" oder "geb. 3674 BBY"'), gender: str('Geschlecht'), homeworld: str('Herkunftswelt'),
      appearance: str('Erscheinungsbild: Gesicht, Haare, Augen, Körperbau, Kleidung'), personality: str('Charakterzüge, Verhalten, Eigenheiten'), bio: str('Herkunft, Ausbildung, Vergangenheit'),
      faction: str('Fraktion (Name)'), title: str('Rang/Rolle'), organization: str('Organisation/Orden/Einheit'), master: str('Meister oder Mentor'),
      abilities: str('Machtfähigkeiten, Kampfstil, Fachwissen'),
      money: { type: 'number', description: 'Geld (setzt den Betrag)' }, moneyDelta: { type: 'number', description: 'Geld ändern, z.B. -500 oder 1200' },
      moneyReason: str('Grund der Geldänderung für den Verlauf, z.B. "Treibstoff auf Nar Shaddaa"'), moneyYear: str('RP-Jahr der Geldänderung (Standard: Jahr des neuesten Story-Abschnitts)'), currency: str('Währung (Standard: Credits bzw. Gold)'),
      inventory: { type: 'array', items: ITEM, description: 'Gegenstände/Eigentum anlegen oder ändern (per Name); qtyDelta ändert die Menge, Menge 0 entfernt' },
      removeItems: { type: 'array', items: { type: 'string' }, description: 'Gegenstände entfernen (Namen)' },
      knowledge: str('Was weiß die Person über Tim und andere?'),
      location: str('aktueller Aufenthaltsort'), status: str('z.B. lebt, verletzt, tot, vermisst'), threads: str('laufende Handlungsstränge'), notes: str('sonstige Notizen'),
      tags: { type: 'array', items: { type: 'string' } },
      relations: { type: 'array', items: REL, description: 'ersetzt die komplette Beziehungsliste' },
      addRelations: { type: 'array', items: REL, description: 'ergänzt/aktualisiert einzelne Beziehungen (per Name), Rest bleibt' },
      append: { type: 'array', items: { type: 'string' }, description: 'Felder, an die angehängt wird' } }, ['timeline', 'name']), run: a => internalCall('POST', '/api/v1/character', {}, a) },
  { name: 'add_character_image', title: 'Bild zu Charakter', description: 'Bild per öffentlicher URL (wird heruntergeladen und dauerhaft gespeichert) oder Base64 zum Charakter hinzufügen. portrait=true setzt es als Porträt, sonst kommt es in die Galerie.',
    inputSchema: S({ timeline: TL, name: str('Charakter'), url: str('https-Link zum Bild'), data: str('alternativ: Base64 oder data:-URL'), caption: str('Bildunterschrift'), portrait: { type: 'boolean' } }, ['timeline', 'name']),
    run: a => internalCall('POST', '/api/v1/character/image', {}, a) },
  { name: 'delete_character', title: 'Charakter löschen', description: 'Charakter löschen (exakter Name oder id).', inputSchema: S({ timeline: TL, name: str('exakter Name oder id') }, ['timeline', 'name']), run: a => internalCall('DELETE', '/api/v1/character', {}, Object.assign({}, a, { id: a.name })) },
  // Housing
  { name: 'list_housing', title: 'Housing auflisten', description: 'Raumschiffe, Häuser, Basen usw. einer Zeitlinie mit Besitzern, Ort und Decks.', ro: true,
    inputSchema: S({ timeline: TL, lang: LG }, ['timeline']), run: (a, v) => internalCall('GET', '/api/v1/housings', { timeline: a.timeline, lang: a.lang, format: 'text' }, null, v) },
  { name: 'get_housing', title: 'Housing lesen', description: 'Komplettes Objekt mit allen Decks und Räumen: Flächen im Raster ([x, y, Breite, Höhe], 0/0 = oben links), Beschreibung, Einrichtung, Gegenstände, Notizen. Vor Änderungen aufrufen.', ro: true,
    inputSchema: S({ timeline: TL, housing: str('Name oder id'), lang: LG }, ['timeline', 'housing']), run: (a, v) => internalCall('GET', '/api/v1/housing', { timeline: a.timeline, name: a.housing, lang: a.lang, format: 'text' }, null, v) },
  { name: 'upsert_housing', title: 'Housing anlegen/ändern', description: 'Raumschiff, Haus, Basis o.ä. anlegen oder ändern (nur angegebene Felder). Neu angelegte Objekte haben ein erstes Deck mit Raster 40×28. owners = Charakternamen, place = Ort der Karte.',
    inputSchema: S({ timeline: TL, name: str('Name (Schlüssel), z.B. "Ebon Talon"'), newName: str('neuer Name'), kind: { type: 'string', enum: HOUSING.KINDS, description: 'ship = Raumschiff, house = Haus, base, station, vehicle, other' }, description: str('Beschreibung'), owners: { type: 'array', items: { type: 'string' }, description: 'Namen der Besitzer (Charaktere)' }, place: str('Ort, an dem es sich befindet (leer = keiner)') }, ['timeline', 'name']),
    run: a => internalCall('POST', '/api/v1/housing', {}, a) },
  { name: 'upsert_deck', title: 'Deck/Etage anlegen/ändern', description: 'Deck bzw. Etage anlegen oder ändern: Name, Rastergröße (cols × rows Felder), Maßeinheit (z.B. "1 m"), Deckkraft des Grundriss-Bildes.',
    inputSchema: S({ timeline: TL, housing: str('Name oder id'), deck: str('Name oder id des Decks (neu, falls nicht vorhanden)'), newName: str('neuer Name'), cols: { type: 'number', description: 'Breite in Feldern (4–200)' }, rows: { type: 'number', description: 'Höhe in Feldern (4–200)' }, unit: str('z.B. "1 m" oder "1,5 m"'), imageOpacity: { type: 'number', description: '0–1' } }, ['timeline', 'housing', 'deck']),
    run: a => internalCall('POST', '/api/v1/housing/deck', {}, a) },
  { name: 'set_deck_image', title: 'Grundriss-Bild setzen', description: 'Setzt ein Bild als Grundriss-Vorlage unter das Raster eines Decks. Typischer Ablauf: per Websuche einen passenden Grundriss/Deckplan finden (z.B. „<Schiffsklasse> deck plan“), dann hier die URL übergeben – am besten den direkten Bildlink; bei einer Webseiten-URL (z.B. Wiki-Dateiseite) nimmt der Server das Haupt- bzw. Vorschaubild. Danach Räume mit upsert_room als Flächen oder Markierungen (pin) passend zum Bild eintragen (öffentliche URL oder Base64; PNG/JPEG/WebP/GIF, max. 10 MB). Das Raster wird ans Seitenverhältnis angepasst (fitGrid=false verhindert das). Darauf lassen sich Räume als Flächen oder Markierungen (pin) einzeichnen. clear=true entfernt das Bild.',
    inputSchema: S({ timeline: TL, housing: str('Name oder id'), deck: str('Deck (leer = erstes)'), url: str('öffentliche https-URL'), data: str('alternativ Base64/data:-URL'), fitGrid: { type: 'boolean' }, imageOpacity: { type: 'number' }, clear: { type: 'boolean' } }, ['timeline', 'housing']),
    run: a => internalCall(a.clear ? 'DELETE' : 'POST', '/api/v1/housing/deck/image', {}, a) },
  { name: 'upsert_room', title: 'Raum anlegen/ändern', description: 'Raum anlegen oder ändern (nur angegebene Felder). Form: rects = Liste rechteckiger Flächen [x, y, Breite, Höhe] in Rasterfeldern (mehrere Flächen ergeben L-/U-Formen, ersetzt die bisherige Form), addRects hängt Flächen an; pin = [x, y] markiert einen Raum auf einem Grundriss-Bild ohne eigene Fläche. Inhalt: description (Beschreibung/Atmosphäre), furnishing (Einrichtung), items (Gegenstände [{name, note}], ersetzt die Liste), notes. Texte dürfen **fett**/*kursiv* enthalten.',
    inputSchema: S({ timeline: TL, housing: str('Name oder id'), deck: str('Deck (leer = erstes)'), room: str('Raumname (Schlüssel) oder id; neu, falls nicht vorhanden'), newName: str('neuer Name'), color: str('#rrggbb'),
      rects: { type: 'array', items: { type: 'array', items: { type: 'number' } }, description: '[[x, y, Breite, Höhe], …]' }, addRects: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
      pin: { type: 'array', items: { type: 'number' }, description: '[x, y]' }, description: str('Beschreibung'), furnishing: str('Einrichtung'), notes: str('Notizen'),
      items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, note: { type: 'string' } }, required: ['name'] } } }, ['timeline', 'housing', 'room']),
    run: a => internalCall('POST', '/api/v1/housing/room', {}, a) },
  { name: 'move_wall', title: 'Wand verschieben', description: 'Verschiebt eine Außenwand eines Raums: side = left|right|top|bottom, by = Felder (positiv = nach rechts bzw. unten, negativ = nach links bzw. oben). Angrenzende Räume werden standardmäßig mitgezogen (neighbors=false nur diesen Raum ändern). Beispiel: Küche um 2 Felder nach rechts vergrößern → side "right", by 2.',
    inputSchema: S({ timeline: TL, housing: str('Name oder id'), deck: str('Deck (leer = erstes)'), room: str('Raum'), side: { type: 'string', enum: ['left', 'right', 'top', 'bottom'] }, by: { type: 'number' }, neighbors: { type: 'boolean' } }, ['timeline', 'housing', 'room', 'side', 'by']),
    run: a => internalCall('POST', '/api/v1/housing/wall', {}, a) },
  { name: 'delete_room', title: 'Raum löschen', description: 'Löscht einen Raum (exakter Name oder id).', destructive: true,
    inputSchema: S({ timeline: TL, housing: str('Name oder id'), deck: str('Deck (leer = erstes)'), room: str('exakter Name oder id') }, ['timeline', 'housing', 'room']), run: a => internalCall('DELETE', '/api/v1/housing/room', {}, a) },
  { name: 'delete_deck', title: 'Deck löschen', description: 'Löscht ein Deck samt Räumen (exakter Name oder id; das letzte Deck bleibt immer).', destructive: true,
    inputSchema: S({ timeline: TL, housing: str('Name oder id'), deck: str('exakter Name oder id') }, ['timeline', 'housing', 'deck']), run: a => internalCall('DELETE', '/api/v1/housing/deck', {}, a) },
  { name: 'delete_housing', title: 'Housing löschen', description: 'Löscht ein Raumschiff/Haus komplett (exakter Name oder id). Nur auf ausdrücklichen Wunsch.', destructive: true,
    inputSchema: S({ timeline: TL, name: str('exakter Name oder id') }, ['timeline', 'name']), run: a => internalCall('DELETE', '/api/v1/housing', {}, { timeline: a.timeline, name: a.name, id: a.name }) },
  { name: 'upsert_era', title: 'Zeitalter anlegen/ändern', description: 'Neues Zeitalter ab einem Jahr (übernimmt den Stand davor) oder Name/Beschreibung ändern.', inputSchema: S({ timeline: TL, name: str('Name'), newName: str('Neuer Name'), year: YR, description: str('Beschreibung') }, ['timeline']), run: a => internalCall('POST', '/api/v1/era', {}, a) },
  { name: 'list_conflicts', title: 'Konfliktzonen', description: 'Aktive Konfliktzonen (offene Kämpfe) in einem Jahr bzw. mit all=true alle, mit Parteien, Laufzeit und Orten. Grenzen allein bedeuten keinen Krieg – nur Konfliktzonen markieren direkte Kämpfe.', ro: true,
    inputSchema: S({ timeline: TL, year: YR, all: { type: 'boolean' }, lang: LG }, ['timeline']), run: (a, v) => internalCall('GET', '/api/v1/conflicts', { timeline: a.timeline, year: a.year, all: a.all ? '1' : '', lang: a.lang, format: 'text' }, null, v) },
  { name: 'upsert_conflict', title: 'Konfliktzone markieren', description: 'Markiert eine Konfliktzone (gestrichelte, schraffierte Fläche auf der Karte) für direkte Kämpfe zwischen Fraktionen – z.B. Front, Belagerung, umkämpftes System. Fläche: places = Orte/Systeme, um die ein Kreis gelegt wird (size small|medium|large für den Rand), alternativ x, y, radius in Kartenkoordinaten. from/to = Laufzeit (to leer/"open" = andauernd; Standard from = aktuelles RP-Jahr). Bestehende Zonen (gleicher Name) werden geändert.',
    inputSchema: S({ timeline: TL, name: str('Name, z.B. "Schlacht um Korriban"'), newName: str('neuer Name'), factions: { type: 'array', items: { type: 'string' }, description: 'beteiligte Fraktionen' }, places: { type: 'array', items: { type: 'string' }, description: 'Orte/Systeme im Kampfgebiet' }, size: { type: 'string', enum: ['small', 'medium', 'large'] },
      x: { type: 'number' }, y: { type: 'number' }, radius: { type: 'number' }, from: str('Beginn, z.B. "3640 VSY"'), to: str('Ende (leer oder "open" = andauernd)'), description: str('Lage, Verlauf'), color: str('#rrggbb (Standard Rot)') }, ['timeline', 'name']),
    run: a => internalCall('POST', '/api/v1/conflict', {}, a) },
  { name: 'end_conflict', title: 'Konflikt beenden', description: 'Beendet eine Konfliktzone zu einem Jahr (bis einschließlich dieses Jahres sichtbar). Die Zone bleibt für frühere Jahre erhalten.',
    inputSchema: S({ timeline: TL, name: str('Name oder id'), year: YR }, ['timeline', 'name', 'year']), run: a => internalCall('POST', '/api/v1/conflict', {}, { timeline: a.timeline, name: a.name, to: a.year }) },
  { name: 'delete_conflict', title: 'Konfliktzone löschen', description: 'Löscht eine Konfliktzone komplett (auch rückwirkend). Zum zeitlichen Beenden end_conflict verwenden.', destructive: true,
    inputSchema: S({ timeline: TL, name: str('exakter Name oder id') }, ['timeline', 'name']), run: a => internalCall('DELETE', '/api/v1/conflict', {}, a) },
  { name: 'set_control', title: 'Kontrolle setzen', description: 'Legt fest, welche Fraktion einen Ort ab dem Zeitalter des angegebenen Jahres kontrolliert (faction leer = neutral).', inputSchema: S({ timeline: TL, place: str('Ort'), faction: str('Fraktion'), year: YR, era: str('oder Name des Zeitalters') }, ['timeline', 'place']), run: a => internalCall('POST', '/api/v1/control', {}, a) },
  { name: 'set_world_image', title: 'Weltbild setzen', description: 'Setzt ein Bild (z.B. eine gemalte Kontinentkarte als PNG/JPEG) als Hintergrund einer eigenen Welt; es wird eingepasst. Nur für Admins der Welt. clear=true entfernt das Weltbild.',
    inputSchema: S({ world: str('Welt (id oder Name)'), url: str('öffentliche https-URL'), data: str('alternativ: Base64 oder data:-URL'), opacity: { type: 'number', description: '0.05–1, Standard 1' }, clear: { type: 'boolean' } }, ['world']),
    run: a => internalCall(a.clear ? 'DELETE' : 'POST', '/api/v1/world/image', {}, a) }
];
const MCP_INSTRUCTIONS = 'Ascandir RP-Manager: interaktive Karte (Star Wars u. eigene Welten) mit Zeitlinien, Zeitaltern, Fraktionen und Orten. ' +
  'Der Kanon ist schreibgeschützt – Änderungen nur in eigenen Zeitlinien (vorher list_timelines oder copy_timeline). Jahre als "3640 BBY"/"4 ABY". ' +
  'Vor Änderungen den Stand mit get_place/get_state lesen. Beschreibungen kurz und ohne Präfixe. ' +
  'WICHTIG: Jede Zeitlinie kann feste Weltregeln haben (list_rules). Sie gelten immer, haben Vorrang vor allem anderen und werden zu Beginn mit list_rules oder get_summary gelesen; ändern nur auf ausdrücklichen Wunsch des Nutzers. ' +
  'Drei getrennte Quellen: Story-Chronik (was ist passiert, chronologisch), Charakterakten (wer ist wer, wo, was weiß die Person) und Weltnotizen (aktueller Zustand der Welt; list_world_notes/upsert_world_note – lieber aktualisieren als neu anlegen; Weltnotizen ≠ Wissen der Charaktere). ' +
  'Personen werden als Charaktere gepflegt (list_characters/get_character lesen, upsert_character ändern, add_character_image für Bilder). ' +
  'Die laufende Geschichte wird in Story-Abschnitten dokumentiert, die in Kapiteln mit Titel gruppiert sind: vor dem Weitererzählen list_story lesen (z.B. last=5), neue Ereignisse mit add_story_entry als eigenen Abschnitt anlegen, neue Kapitel mit upsert_chapter bzw. chapter beim Abschnitt. Zeitalter (upsert_era) nur für größere Wendepunkte der Machtverhältnisse. Konfliktzonen: Grenzen bedeuten nicht automatisch Krieg; direkte Kämpfe als Konfliktzone markieren (upsert_conflict mit places, factions, from), beendete Kämpfe mit end_conflict abschließen, list_conflicts zeigt aktive. Housing (Raumschiffe, Häuser, Basen) pro Zeitlinie: list_housing/get_housing lesen, upsert_housing, upsert_deck, set_deck_image (Grundriss-Bild), upsert_room (Räume als Rasterflächen oder Markierung, mit Beschreibung, Einrichtung, Gegenständen), move_wall (Wände verschieben); vorher get_housing aufrufen. Eigene Welten können ein Weltbild (z.B. gemalte Kontinentkarte) als Hintergrund haben: set_world_image (Bild per URL oder Base64).';
async function handleMcp(req, res, url, tv) {
  // tv = Betrachter aus dem Token (null = Gast). Sichtbar ist nur, was dieser Benutzer sehen darf.
  const viewerOf = () => tv || whoIs({ headers: {} }, null);
  const writeAllowed = canWriteAny(tv);
  if (req.method === 'GET') {
    if ((req.headers.accept || '').includes('text/event-stream')) return send(res, 405, { error: 'Use POST (Streamable HTTP)' }, 'application/json', { Allow: 'POST' });
    // Statusanzeige für den Browser (zur Fehlersuche)
    return send(res, 200, { status: 'ok', server: 'Ascandir RP-Manager MCP', version: VERSION, transport: 'streamable-http (POST)',
      access: writeAllowed ? 'lesen + schreiben (Token korrekt)' : tv ? 'nur lesen (Token korrekt, Benutzer hat nur Leserechte)' : 'nur lesen',
      ...(tv ? { user: tv.name, timelines: allTimelines('de', tv).map(t => t.name) } : {}),
      ...(tv ? {} : { hinweis: 'Hier ist kein Token angekommen (Adresse: ' + url.pathname + (url.search ? ' + Parameter' : '') + '). Enthält der Token Zeichen wie # ? & % / oder Leerzeichen, schneidet der Browser ihn ab – dann einen Token nur aus Buchstaben und Zahlen verwenden.' }),
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
          serverInfo: { name: 'ascandir-rp-manager', title: 'Ascandir RP-Manager', version: VERSION },
          instructions: MCP_INSTRUCTIONS + (tv && !tv.admin ? ` Zugriff als Benutzer „${tv.name}“ – verfügbare Zeitlinien: ${allTimelines('de', tv).map(t => t.name).join(', ') || 'keine'}.` : '') });
        case 'ping': return ok({});
        case 'tools/list': return ok({ tools: tools.map(t => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema,
          annotations: { title: t.title, readOnlyHint: !!t.ro, destructiveHint: !!t.destructive, idempotentHint: !!t.ro, openWorldHint: false } })) });
        case 'tools/call': {
          const t = tools.find(x => x.name === (m.params || {}).name);
          if (!t) return err(-32602, 'Unknown tool' + (writeAllowed ? '' : ' (schreibende Werkzeuge nur mit einem Token mit Schreibrechten: /mcp/<token>)'));
          const viewer = viewerOf();
          MCP_VIEWER = viewer; const pr = t.run((m.params || {}).arguments || {}, viewer); MCP_VIEWER = null;
          const r = await pr;
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
    const r = await fetch('https://api.github.com/repos/Ascandir/Ascandir---RP-Manager/releases/latest', { headers: { 'User-Agent': 'ascandir-rp-manager', Accept: 'application/vnd.github+json' } });
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
      const tokenGiven = mm[1] ? decodeURIComponent(mm[1]) : reqToken(req, url);
      const tv = tokenGiven ? viewerForToken(tokenGiven) : null;
      if (tokenGiven && !tv) return send(res, 401, { error: 'invalid token' });
      if (!tv && !PUBLIC_VIEW) return send(res, 401, { error: 'unauthorized' });
      return await handleMcp(req, res, url, tv);
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
      worldAccess: Object.fromEntries(ws.map(w => [w, level(who, w, null)])), publicView: PUBLIC_VIEW, latest: who.admin ? latestRelease : null, updateAvailable: who.admin && !!(latestRelease && cmpVer(latestRelease, VERSION) > 0), latestShown: who.admin ? latestRelease : null, updateHook: who.admin && !!UPDATE_HOOK, dataDir: who.admin ? DATA_DIR : null }, 'application/json; charset=utf-8', { 'Access-Control-Allow-Origin': '*' }); }
    if (!canRead(req, url)) {
      if (url.pathname.startsWith('/api/')) return send(res, 401, { error: 'unauthorized' }, 'application/json', { 'WWW-Authenticate': 'Basic realm="RP-Manager", charset="UTF-8"' });
      return send(res, 401, 'Anmeldung erforderlich', 'text/plain; charset=utf-8', { 'WWW-Authenticate': 'Basic realm="RP-Manager", charset="UTF-8"' });
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
      const editOk = mt => mt && (dir === 'worlds' ? who.admin || canAdmin(who, mt.world, null) : canEdit(who, mt.world, mt.tl));
      const adminOk = mt => mt && (dir === 'worlds' ? who.admin || canAdmin(who, mt.world, null) : canAdmin(who, mt.world, mt.tl));
      if (!file && req.method === 'GET') {
        const out = [];
        for (const f of fs.readdirSync(path.join(DATA_DIR, dir)).filter(f => f.toLowerCase().endsWith('.json'))) {
          let content; try { content = fs.readFileSync(path.join(DATA_DIR, dir, f), 'utf8'); } catch (err) { if (who.admin) out.push({ file: f, error: err.message }); continue; }
          const mt = meta(content);
          if (!mt) { if (who.admin) out.push({ file: f, content }); continue; }
          if (viewOk(mt)) out.push({ file: f, content, editable: editOk(mt), admin: adminOk(mt) });
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
        else if (dir === 'worlds' ? !who.admin : !canAdmin(who, mt.world, null)) return send(res, 403, { error: 'Neue Zeitlinien darf nur ein Admin der Welt anlegen / only world admins can create timelines' });
        const tmp = p + '.tmp'; fs.writeFileSync(tmp, body, 'utf8'); fs.renameSync(tmp, p);
        // Wer eine Zeitlinie anlegt, wird ihr Admin
        if (existing == null && dir === 'timelines') grantCreator(who, mt.tl);
        return send(res, 200, { ok: true });
      }
      if (req.method === 'DELETE') {
        if (existing != null && !adminOk(meta(existing))) return send(res, 403, { error: 'Löschen nur für Admins / admins only' });
        if (existing != null) fs.unlinkSync(p); return send(res, 200, { ok: true });
      }
      return send(res, 405, { error: 'method not allowed' });
    }
    // Update auslösen (nur Admins, nur mit IAM_UPDATE_WEBHOOK)
    if (url.pathname === '/api/admin/update' && req.method === 'POST') {
      const who = whoIs(req, url);
      if (!who.admin || who.api) return send(res, 403, { error: 'admin only' });
      if (!UPDATE_HOOK) return send(res, 400, { error: 'IAM_UPDATE_WEBHOOK ist nicht gesetzt' });
      // Der Updater stoppt diesen Container – daher nicht auf das Ende warten
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 4000);
      try {
        const r = await fetch(UPDATE_HOOK, { method: 'POST', headers: UPDATE_HOOK_TOKEN ? { Authorization: 'Bearer ' + UPDATE_HOOK_TOKEN } : {}, signal: ctrl.signal });
        clearTimeout(timer);
        if (!r.ok) return send(res, 502, { error: 'Updater antwortet mit HTTP ' + r.status + (r.status === 401 ? ' (Token falsch?)' : '') });
        return send(res, 200, { ok: true, started: true, done: true, version: VERSION });
      } catch (e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') return send(res, 202, { ok: true, started: true, version: VERSION });
        return send(res, 502, { error: 'Updater nicht erreichbar: ' + e.message });
      }
    }
    // Eigener API-Token (für angemeldete Benutzer)
    if (url.pathname === '/api/me/token') {
      const who = whoIs(req, url);
      if (who.guest || who.api || who.id === 'open') return send(res, 401, { error: 'login required' });
      const d = loadUsers(), rec = who.id === 'env' ? (d.env = d.env || {}) : d.users.find(u => u.id === who.id);
      if (!rec) return send(res, 404, { error: 'user not found' });
      if (req.method === 'GET') return send(res, 200, { hasToken: !!rec.apiToken, hint: rec.apiTokenHint || null, created: rec.apiTokenCreated || null });
      if (req.method === 'POST') {
        const tok = crypto.randomBytes(24).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 32);
        rec.apiToken = tokHash(tok); rec.apiTokenHint = tok.slice(-4); rec.apiTokenCreated = new Date().toISOString(); saveUsers(d);
        return send(res, 201, { token: tok, hint: rec.apiTokenHint, created: rec.apiTokenCreated });
      }
      if (req.method === 'DELETE') { delete rec.apiToken; delete rec.apiTokenHint; delete rec.apiTokenCreated; saveUsers(d); return send(res, 200, { ok: true }); }
      return send(res, 405, { error: 'method not allowed' });
    }
    // Speicherbedarf: pro Welt/Zeitlinie (nur was der Betrachter sehen darf), Gesamtgröße nur für Admins
    if (url.pathname === '/api/storage') {
      const who = whoIs(req, url);
      const fsize = f => { try { return fs.statSync(f).size; } catch { return 0; } };
      const du = d => { let n = 0; try { for (const e of fs.readdirSync(d, { withFileTypes: true })) n += e.isDirectory() ? du(path.join(d, e.name)) : fsize(path.join(d, e.name)); } catch { } return n; };
      const imgRe = /images\/([A-Za-z0-9_-]+\.(?:jpg|png|webp|gif))/g;
      const worlds = [{ id: 'starwars', name: SW.name.de, file: null }].concat(listJson('worlds').map(w => ({ id: w.id, name: w.name, file: w._file })));
      const out = [];
      for (const w of worlds) {
        if (!canView(who, w.id, null) && !allTimelines('de', who).some(t => (t.world || 'starwars') === w.id)) continue;
        const tls = [];
        for (const f of fs.readdirSync(path.join(DATA_DIR, 'timelines')).filter(f => f.toLowerCase().endsWith('.json'))) {
          const fp = path.join(DATA_DIR, 'timelines', f); let raw; try { raw = fs.readFileSync(fp, 'utf8'); } catch { continue; }
          let t; try { t = JSON.parse(raw); } catch { continue; }
          if ((t.world || 'starwars') !== w.id || !canView(who, w.id, t.id)) continue;
          const imgs = new Set([...raw.matchAll(imgRe)].map(m => m[1])); let ib = 0; for (const i of imgs) ib += fsize(path.join(IMG_DIR, i));
          tls.push({ id: t.id, name: t.name, bytes: Buffer.byteLength(raw), images: imgs.size, imageBytes: ib });
        }
        out.push({ id: w.id, name: w.name, bytes: w.file ? fsize(path.join(DATA_DIR, 'worlds', w.file)) : 0, timelines: tls.sort((a, b) => (b.bytes + b.imageBytes) - (a.bytes + a.imageBytes)) });
      }
      const res2 = { worlds: out };
      if (who.admin && !who.api) {
        res2.total = du(DATA_DIR); res2.dataDir = DATA_DIR;
        res2.parts = { worlds: du(path.join(DATA_DIR, 'worlds')), timelines: du(path.join(DATA_DIR, 'timelines')), images: du(IMG_DIR) };
        try { const st = fs.statfsSync(DATA_DIR); res2.diskFree = st.bavail * st.bsize; res2.diskSize = st.blocks * st.bsize; } catch { }
      }
      return send(res, 200, res2);
    }
    // Rechte einer Welt verwalten: Welt-Admins (für Welt + Zeitlinien) und Zeitlinien-Admins (für ihre Zeitlinien)
    if (url.pathname === '/api/perms') {
      const who = whoIs(req, url), wid = url.searchParams.get('world') || 'starwars';
      if (who.guest || who.api) return send(res, 401, { error: 'login required' });
      const tls = allTimelines('de', { admin: true }).filter(t => (t.world || 'starwars') === wid && !t.readonly);
      const wAdm = canAdmin(who, wid, null), tAdm = tls.filter(t => canAdmin(who, wid, t.id));
      if (!wAdm && !tAdm.length) return send(res, 403, { error: 'Keine Admin-Rechte in dieser Welt / not an admin of this world' });
      const d = loadUsers(), ok = LV => LV === '' || LEVEL[LV] != null;
      if (req.method === 'GET') {
        const row = p => ({ world: (p.worlds || {})[wid] ?? '', all: (p.worlds || {})['*'] ?? '', timelines: Object.fromEntries(tls.map(t => [t.id, (p.timelines || {})[t.id] ?? ''])) });
        return send(res, 200, { world: wid, canAdminWorld: wAdm, timelines: tls.map(t => ({ id: t.id, name: t.name, canAdmin: canAdmin(who, wid, t.id) })),
          users: d.users.filter(u => u.role !== 'admin' && u.id !== who.id).map(u => Object.assign({ id: u.id, name: u.name }, row(u.perms || {}))),
          guest: row(d.guest || {}) });
      }
      if (req.method === 'PUT') {
        const b = JSON.parse(await readBody(req, 1e6));
        let target;
        if (b.user === 'guest') target = (d.guest = d.guest || { worlds: {}, timelines: {} });
        else { const u = d.users.find(x => x.id === b.user && x.role !== 'admin' && x.id !== who.id); if (!u) return send(res, 404, { error: 'user not found' }); target = (u.perms = u.perms || { worlds: {}, timelines: {} }); }
        target.worlds = target.worlds || {}; target.timelines = target.timelines || {};
        if (b.world !== undefined) {
          if (!wAdm) return send(res, 403, { error: 'Nur Welt-Admins ändern die Rechte für die Welt' });
          if (!ok(b.world) || (b.user === 'guest' && LEVEL[b.world] >= 2)) return send(res, 400, { error: 'invalid level' });
          if (b.world === '') delete target.worlds[wid]; else target.worlds[wid] = b.world;
        }
        for (const [tid, lv] of Object.entries(b.timelines || {})) {
          const t = tls.find(x => x.id === tid); if (!t || !canAdmin(who, wid, tid)) return send(res, 403, { error: 'Keine Admin-Rechte für Zeitlinie ' + tid });
          if (!ok(lv) || (b.user === 'guest' && LEVEL[lv] >= 2)) return send(res, 400, { error: 'invalid level' });
          if (lv === '') delete target.timelines[tid]; else target.timelines[tid] = lv;
        }
        saveUsers(d); return send(res, 200, { ok: true });
      }
      return send(res, 405, { error: 'method not allowed' });
    }
    // Benutzerverwaltung (nur Admins)
    if (url.pathname === '/api/users' || url.pathname.startsWith('/api/users/') || url.pathname === '/api/guest') {
      const who = whoIs(req, url);
      if (!who.admin || who.api) return send(res, 403, { error: 'admin only' });
      const d = loadUsers(), pub = u => ({ id: u.id, name: u.name, role: u.role, perms: u.perms || { worlds: {}, timelines: {} }, apiToken: u.apiToken ? { hint: u.apiTokenHint, created: u.apiTokenCreated } : null });
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
        if (b.revokeToken) { delete u.apiToken; delete u.apiTokenHint; delete u.apiTokenCreated; }
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
  console.log(`Ascandir RP-Manager ${VERSION} läuft auf Port ${PORT} · Daten: ${DATA_DIR}`);
  if (!PASSWORD) console.warn('WARNUNG: Kein IAM_PASSWORD gesetzt – die Oberfläche ist ohne Passwort erreichbar.');
});
