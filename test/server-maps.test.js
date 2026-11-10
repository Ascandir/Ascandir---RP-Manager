// Integrationstest: Server-API, Rechte und MCP-Werkzeuge für gezeichnete Karten
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'iam-maps-'));
const hash = t => crypto.createHash('sha256').update(t).digest('hex');
const TOK = { admin: 'MasterToken123', editor: 'EditorToken456', viewer: 'ViewerToken789', tlEditor: 'TlEditorToken000' };
let srv;

function seed() {
  for (const d of ['worlds', 'timelines', 'maps']) fs.mkdirSync(path.join(DATA, d), { recursive: true });
  fs.writeFileSync(path.join(DATA, 'worlds', 'Eldoria.json'), JSON.stringify({ id: 'w1', name: 'Eldoria', type: 'fantasy', yearFmt: { neg: 'v.K.', pos: 'n.K.' } }));
  fs.writeFileSync(path.join(DATA, 'worlds', 'Andere.json'), JSON.stringify({ id: 'w2', name: 'Andere', type: 'fantasy' }));
  const tl = (id, name, world) => ({ id, name, world, eras: [{ id: 'e1', name: 'Anfang', year: 0, control: {}, zones: [] }], factions: [], objects: [{ id: 'p_hafen', name: 'Nordhafen', type: 'city', x: 100, y: 100 }], routes: [] });
  fs.writeFileSync(path.join(DATA, 'timelines', 'Haupt.json'), JSON.stringify(tl('t1', 'Haupt', 'w1')));
  fs.writeFileSync(path.join(DATA, 'timelines', 'Fremd.json'), JSON.stringify(tl('t2', 'Fremd', 'w2')));
  fs.writeFileSync(path.join(DATA, 'users.json'), JSON.stringify({
    users: [
      { id: 'u1', name: 'editor', role: 'user', perms: { worlds: { w1: 'edit' }, timelines: {} }, apiToken: hash(TOK.editor) },
      { id: 'u2', name: 'viewer', role: 'user', perms: { worlds: { w1: 'view' }, timelines: {} }, apiToken: hash(TOK.viewer) },
      { id: 'u3', name: 'tl', role: 'user', perms: { worlds: { w1: 'view' }, timelines: { t1: 'edit' } }, apiToken: hash(TOK.tlEditor) }
    ],
    guest: { worlds: { '*': 'none' }, timelines: {} }
  }));
}
async function call(method, p, body, tok) {
  const r = await fetch(BASE + p, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}), body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text(); let json = null; try { json = JSON.parse(txt); } catch { }
  return { status: r.status, json, text: txt, type: r.headers.get('content-type') };
}
let rpcId = 1;
async function mcp(tok, name, args) {
  const r = await fetch(`${BASE}/mcp/${tok}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: rpcId++, method: 'tools/call', params: { name, arguments: args } }) });
  const j = await r.json(); if (j.error) return { error: j.error };
  const txt = j.result.content[0].text; let data = null; try { data = JSON.parse(txt); } catch { }
  return { isError: j.result.isError, text: txt, data };
}

test.before(async () => {
  seed();
  srv = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')], { env: Object.assign({}, process.env, { PORT: String(PORT), DATA_DIR: DATA, IAM_PASSWORD: 'geheim', IAM_API_TOKEN: TOK.admin, IAM_PUBLIC_VIEW: 'false' }), stdio: ['ignore', 'pipe', 'pipe'] });
  srv.stderr.on('data', d => process.stderr.write(d));
  for (let i = 0; i < 100; i++) { try { const r = await fetch(BASE + '/api/info'); if (r.ok) return; } catch { } await new Promise(r => setTimeout(r, 100)); }
  throw new Error('Server startet nicht');
});
test.after(() => { if (srv) srv.kill(); fs.rmSync(DATA, { recursive: true, force: true }); });

let mapId, riverId;
test('MCP: Werkzeuge werden nach Rechten angeboten', async () => {
  const list = async tok => (await (await fetch(`${BASE}/mcp/${tok}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) })).json()).result.tools.map(t => t.name);
  const ed = await list(TOK.editor), vw = await list(TOK.viewer);
  for (const n of ['upload_map_asset', 'delete_map_asset', 'set_world_image', 'list_maps', 'get_map', 'find_map_features', 'export_map', 'create_map', 'update_map', 'add_map_features', 'update_map_features', 'delete_map_features']) assert.ok(ed.includes(n), n);
  assert.ok(vw.includes('get_map') && !vw.includes('add_map_features'), 'Leser bekommt nur lesende Werkzeuge');
  assert.ok(!ed.includes('delete_map'), 'ganze Karten können per Connector nicht gelöscht werden');
});

test('MCP: alle Werkzeug-Schemas sind vollständig typisiert (Voraussetzung für ChatGPT)', async () => {
  const tools = (await (await fetch(`${BASE}/mcp/${TOK.admin}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) })).json()).result.tools;
  const bad = [];
  const walk = (sc, p) => {
    if (!sc.type) bad.push(p + ': kein type');
    if (sc.type === 'array') { if (!sc.items || !sc.items.type) bad.push(p + ': array ohne items.type'); else walk(sc.items, p + '[]'); }
    if (sc.type === 'object' && sc.properties) for (const [k, v] of Object.entries(sc.properties)) walk(v, p + '.' + k);
  };
  for (const t of tools) { assert.match(t.name, /^[a-z_]{1,64}$/); walk(t.inputSchema, t.name); }
  assert.deepEqual(bad, []);
});

test('Karte anlegen – nur für eigene Welten, nur mit Schreibrecht, keine Dubletten', async () => {
  const r = await mcp(TOK.editor, 'create_map', { world: 'Eldoria', name: 'Weltkarte' });
  assert.ok(!r.isError, r.text); mapId = r.data.id; assert.equal(r.data.rev, 1);
  assert.ok(fs.existsSync(path.join(DATA, 'maps', mapId + '.json')));
  const dup = await mcp(TOK.editor, 'create_map', { world: 'w1', name: 'weltkarte' });
  assert.ok(dup.isError && /schon eine Karte/.test(dup.text));
  const sw = await mcp(TOK.admin, 'create_map', { world: 'starwars', name: 'X' });
  assert.ok(sw.isError && /eigene Welten/.test(sw.text));
  const other = await mcp(TOK.editor, 'create_map', { world: 'w2', name: 'X' });
  assert.ok(other.isError, 'fremde Welt ist nicht sichtbar/beschreibbar');
});

test('Beispiel: Gebirgskette + Fluss, dann nur die Flussfarbe per ID ändern', async () => {
  const r = await mcp(TOK.editor, 'add_map_features', { world: 'Eldoria', features: [
    { type: 'land', geometry: { type: 'polygon', coordinates: [[200, 200], [1600, 180], [1700, 1300], [300, 1400]], holes: [[[800, 800], [900, 800], [850, 900]]] }, label: { text: 'Eldoria' } },
    { type: 'mountains', name: 'Graukamm', geometry: { type: 'group', coordinates: [[600, 400], [650, 390], [700, 410], [750, 395], [800, 415]] } },
    { type: 'river', geometry: { type: 'line', coordinates: [[700, 430], [760, 600], [820, 900], [880, 1380]] }, label: { text: 'Silberlauf' } },
    { type: 'city', geometry: { type: 'point', coordinates: [[880, 1300]] }, label: { text: 'Mündungsstadt' }, placeId: 'Nordhafen' }
  ] });
  assert.ok(!r.isError, r.text);
  assert.equal(r.data.added.length, 4); assert.equal(r.data.rev, 2);
  riverId = r.data.added[2];
  const city = await mcp(TOK.editor, 'find_map_features', { map: mapId, type: ['city'], geometry: true });
  assert.equal(city.data.features[0].placeId, 'p_hafen', 'Ortsname wurde zur Orts-ID aufgelöst');
  const before = await mcp(TOK.editor, 'get_map', { map: mapId, detail: 'full' });
  const u = await mcp(TOK.editor, 'update_map_features', { map: mapId, updates: [{ id: riverId, style: { stroke: '#2a6f97' } }] });
  assert.ok(!u.isError, u.text); assert.deepEqual(u.data.updated, [riverId]);
  const after = await mcp(TOK.editor, 'get_map', { map: mapId, detail: 'full' });
  const strip = m => m.map.features.filter(f => f.id !== riverId);
  assert.deepEqual(strip(after.data), strip(before.data), 'andere Objekte unverändert');
  assert.equal(after.data.map.features.find(f => f.id === riverId).style.stroke, '#2a6f97');
});

test('Ungültige Eingaben werden mit Pfadangabe abgelehnt, nichts wird teilweise gespeichert', async () => {
  const before = JSON.parse(fs.readFileSync(path.join(DATA, 'maps', mapId + '.json'), 'utf8'));
  const r = await mcp(TOK.editor, 'add_map_features', { map: mapId, features: [{ type: 'city', geometry: { type: 'point', coordinates: [1, 1] } }, { type: 'city', geometry: { type: 'point', coordinates: [1, 1] }, style: { fill: 'javascript:alert(1)' } }] });
  assert.ok(r.isError); assert.match(r.text, /features\[1\]\.style\.fill|ops\[1\]/);
  const now = JSON.parse(fs.readFileSync(path.join(DATA, 'maps', mapId + '.json'), 'utf8'));
  assert.equal(now.features.length, before.features.length); assert.equal(now.rev, before.rev);
  const del = await mcp(TOK.editor, 'delete_map_features', { map: mapId, ids: [] });
  assert.ok(del.isError, 'leere Löschliste wird abgelehnt');
  const stale = await mcp(TOK.editor, 'update_map_features', { map: mapId, expectRev: 1, updates: [{ id: riverId, style: { width: 5 } }] });
  assert.ok(stale.isError && /inzwischen geändert/.test(stale.text), 'veraltete rev -> Konflikt');
});

test('Rechte: Leser sieht, darf aber nicht schreiben; Zeitlinien-Editor nur Zeitlinienkarte', async () => {
  const g = await mcp(TOK.viewer, 'get_map', { world: 'Eldoria' });
  assert.ok(!g.isError); assert.equal(g.data.id, mapId);
  const w = await call('POST', '/api/v1/map/features', { map: mapId, features: [{ type: 'city', geometry: { type: 'point', coordinates: [1, 1] } }] }, TOK.viewer);
  assert.equal(w.status, 401); // Leser hat nirgends Schreibrechte
  const t = await call('POST', '/api/v1/map/features', { map: mapId, features: [{ type: 'city', geometry: { type: 'point', coordinates: [1, 1] } }] }, TOK.tlEditor);
  assert.equal(t.status, 403, 'Weltkarte braucht Schreibrecht auf die Welt');
  const c = await mcp(TOK.tlEditor, 'create_map', { world: 'Eldoria', timeline: 'Haupt', name: 'Feldzug' });
  assert.ok(!c.isError, c.text);
  const a = await mcp(TOK.tlEditor, 'add_map_features', { map: c.data.id, features: [{ type: 'border', geometry: { type: 'line', coordinates: [[0, 0], [100, 100]] } }] });
  assert.ok(!a.isError, a.text);
  const guest = await call('GET', '/api/v1/maps');
  assert.equal(guest.status, 401);
});

test('Dateien-API: Prüfung, rev-Konflikte, Dateiname, Löschen nur für Admins', async () => {
  const file = `/api/files/maps/${mapId}.json`;
  const cur = await call('GET', file, null, TOK.editor);
  assert.equal(cur.status, 200);
  const m = JSON.parse(cur.text);
  m.features.push({ id: 'neu1', type: 'village', geometry: { type: 'point', coordinates: [500, 500] } });
  const ok = await call('PUT', file, m, TOK.editor);
  assert.equal(ok.status, 200, ok.text); assert.equal(ok.json.rev, m.rev + 1);
  const stale = await call('PUT', file, m, TOK.editor);
  assert.equal(stale.status, 409); assert.equal(stale.json.conflict, true);
  const bad = await call('PUT', file, Object.assign({}, m, { rev: ok.json.rev, features: [{ type: 'city', geometry: { type: 'point', coordinates: ['x', 0] } }] }), TOK.editor);
  assert.equal(bad.status, 400); assert.ok(bad.json.path);
  const wrongName = await call('PUT', '/api/files/maps/anders.json', Object.assign({}, m, { rev: ok.json.rev }), TOK.editor);
  assert.equal(wrongName.status, 400);
  const moveWorld = await call('PUT', file, Object.assign({}, m, { rev: ok.json.rev, world: 'w2' }), TOK.admin);
  assert.equal(moveWorld.status, 409);
  const del = await call('DELETE', file, null, TOK.editor);
  assert.equal(del.status, 403, 'Löschen nur für Admins der Welt');
  const list = await call('GET', '/api/files/maps', null, TOK.viewer);
  assert.ok(list.json.every(x => JSON.parse(x.content).world === 'w1'));
  assert.ok(list.json.every(x => x.editable === false));
});

test('Export als SVG und Übersicht als Text', async () => {
  const e = await mcp(TOK.viewer, 'export_map', { map: mapId, inline: true });
  assert.ok(!e.isError, e.text); assert.match(e.data.url, /\/api\/v1\/map\/svg\?map=/); assert.match(e.data.svg, /<svg/);
  const s = await call('GET', `/api/v1/map/svg?map=${mapId}`, null, TOK.viewer);
  assert.equal(s.status, 200); assert.match(s.type, /image\/svg\+xml/);
  const txt = await call('GET', `/api/v1/map?map=${mapId}&format=text`, null, TOK.viewer);
  assert.match(txt.text, /Silberlauf/);
  const bb = await mcp(TOK.viewer, 'find_map_features', { map: mapId, bbox: [550, 350, 850, 450] });
  assert.ok(bb.data.features.some(f => f.name === 'Graukamm'));
});

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
test('MCP: PNG als Karten-Asset hochladen, platzieren und exportieren', async () => {
  const r = await mcp(TOK.editor, 'upload_map_asset', { map: mapId, name: 'Wappen', data: PNG, place: { x: 1000, y: 600, width: 80, rotation: 15, label: { text: 'Burg' } } });
  assert.ok(!r.isError, r.text);
  assert.match(r.data.asset.src, /^images\/img[0-9a-f]+\.png$/); assert.equal(r.data.asset.w, 1); assert.ok(r.data.featureId);
  assert.ok(fs.existsSync(path.join(DATA, r.data.asset.src)));
  const again = await mcp(TOK.editor, 'add_map_features', { map: mapId, features: [{ type: 'image', asset: r.data.asset.id, geometry: { type: 'point', coordinates: [1200, 700] }, style: { size: 40 } }] });
  assert.ok(!again.isError, again.text);
  const g = await mcp(TOK.viewer, 'get_map', { map: mapId });
  assert.equal(g.data.assets[0].name, 'Wappen');
  const svg = await call('GET', `/api/v1/map/svg?map=${mapId}`, null, TOK.viewer);
  assert.match(svg.text, /<image href="data:image\/png;base64,/, 'Bild ist im SVG eingebettet');
  const del = await mcp(TOK.editor, 'delete_map_asset', { map: mapId, id: r.data.asset.id });
  assert.ok(del.isError && /verwendet/.test(del.text));
  const fake = await mcp(TOK.editor, 'upload_map_asset', { map: mapId, name: 'x', data: Buffer.from('<svg onload=alert(1)>').toString('base64') });
  assert.ok(fake.isError && /not a supported image/.test(fake.text), 'nur echte Bilder');
  const ssrf = await mcp(TOK.editor, 'upload_map_asset', { map: mapId, name: 'x', url: 'http://127.0.0.1:' + PORT + '/api/info' });
  assert.ok(ssrf.isError && /lokalen Netz/.test(ssrf.text), 'keine Downloads aus dem lokalen Netz');
  const viewer = await call('POST', '/api/v1/map/asset', { map: mapId, name: 'x', data: PNG }, TOK.tlEditor);
  assert.equal(viewer.status, 403);
});

test('MCP: Weltbild setzen nur als Welt-Admin', async () => {
  const no = await mcp(TOK.editor, 'set_world_image', { world: 'Eldoria', data: PNG });
  assert.ok(no.isError && /Admins/.test(no.text));
  const ok = await mcp(TOK.admin, 'set_world_image', { world: 'Eldoria', data: PNG, opacity: 0.8 });
  assert.ok(!ok.isError, ok.text);
  const w = JSON.parse(fs.readFileSync(path.join(DATA, 'worlds', 'Eldoria.json'), 'utf8'));
  assert.match(w.mapImage.src, /^images\//); assert.equal(w.mapImage.h, 1700); assert.equal(w.mapImage.opacity, 0.8);
  assert.equal(w.name, 'Eldoria', 'übrige Weltdaten bleiben');
  const clr = await mcp(TOK.admin, 'set_world_image', { world: 'Eldoria', clear: true });
  assert.ok(!clr.isError); assert.equal(JSON.parse(fs.readFileSync(path.join(DATA, 'worlds', 'Eldoria.json'), 'utf8')).mapImage, undefined);
});

test('Bestehende Daten bleiben unberührt', async () => {
  const tl = JSON.parse(fs.readFileSync(path.join(DATA, 'timelines', 'Haupt.json'), 'utf8'));
  assert.equal(tl.objects.length, 1); assert.equal(tl.name, 'Haupt');
  const w = JSON.parse(fs.readFileSync(path.join(DATA, 'worlds', 'Eldoria.json'), 'utf8'));
  assert.deepEqual(Object.keys(w).filter(k => k !== 'mapImage').sort(), ['id', 'name', 'type', 'yearFmt']);
  const tls = await call('GET', '/api/v1/timelines', null, TOK.admin);
  assert.equal(tls.status, 200);
});
