// Integrationstest: MCP-Schemas, Rechte, Bild-Uploads (Weltbild, Charakterbild)
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
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'iam-test-'));
const hash = t => crypto.createHash('sha256').update(t).digest('hex');
const TOK = { admin: 'MasterToken123', editor: 'EditorToken456', viewer: 'ViewerToken789' };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
let srv;

function seed() {
  for (const d of ['worlds', 'timelines']) fs.mkdirSync(path.join(DATA, d), { recursive: true });
  fs.writeFileSync(path.join(DATA, 'worlds', 'Eldoria.json'), JSON.stringify({ id: 'w1', name: 'Eldoria', type: 'fantasy', yearFmt: { neg: 'v.K.', pos: 'n.K.' } }));
  fs.writeFileSync(path.join(DATA, 'timelines', 'Haupt.json'), JSON.stringify({ id: 't1', name: 'Haupt', world: 'w1', eras: [{ id: 'e1', name: 'Anfang', year: 0, control: {}, zones: [] }], factions: [], objects: [{ id: 'p1', name: 'Nordhafen', type: 'city', x: 100, y: 100 }], routes: [] }));
  fs.writeFileSync(path.join(DATA, 'users.json'), JSON.stringify({
    users: [
      { id: 'u1', name: 'editor', role: 'user', perms: { worlds: { w1: 'edit' }, timelines: {} }, apiToken: hash(TOK.editor) },
      { id: 'u2', name: 'viewer', role: 'user', perms: { worlds: { w1: 'view' }, timelines: {} }, apiToken: hash(TOK.viewer) }
    ],
    guest: { worlds: { '*': 'none' }, timelines: {} }
  }));
}
let rpcId = 1;
async function rpc(tok, method, params) {
  const r = await fetch(`${BASE}/mcp/${tok}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: rpcId++, method, params }) });
  return (await r.json()).result;
}
async function mcp(tok, name, args) {
  const res = await rpc(tok, 'tools/call', { name, arguments: args });
  const txt = res.content[0].text; let data = null; try { data = JSON.parse(txt); } catch { }
  return { isError: res.isError, text: txt, data };
}

test.before(async () => {
  seed();
  srv = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')], { env: Object.assign({}, process.env, { PORT: String(PORT), DATA_DIR: DATA, IAM_PASSWORD: 'geheim', IAM_API_TOKEN: TOK.admin, IAM_PUBLIC_VIEW: 'false', IAM_FETCH_ALLOW: '127.0.0.2' }), stdio: ['ignore', 'ignore', 'pipe'] });
  srv.stderr.on('data', d => process.stderr.write(d));
  for (let i = 0; i < 100; i++) { try { const r = await fetch(BASE + '/api/info'); if (r.ok) return; } catch { } await new Promise(r => setTimeout(r, 100)); }
  throw new Error('Server startet nicht');
});
test.after(() => { if (srv) srv.kill(); fs.rmSync(DATA, { recursive: true, force: true }); });

test('MCP: alle Werkzeug-Schemas sind vollständig typisiert (Voraussetzung für ChatGPT)', async () => {
  const tools = (await rpc(TOK.admin, 'tools/list')).tools;
  const bad = [];
  const walk = (sc, p) => {
    if (!sc.type) bad.push(p + ': kein type');
    if (sc.type === 'array') { if (!sc.items || !sc.items.type) bad.push(p + ': array ohne items.type'); else walk(sc.items, p + '[]'); }
    if (sc.type === 'object' && sc.properties) for (const [k, v] of Object.entries(sc.properties)) walk(v, p + '.' + k);
  };
  for (const t of tools) { assert.match(t.name, /^[a-z_]{1,64}$/); walk(t.inputSchema, t.name); }
  assert.deepEqual(bad, []);
  assert.ok(tools.some(t => t.name === 'set_world_image'));
  assert.ok(!tools.some(t => /map/.test(t.name)), 'keine Zeichenwerkzeuge mehr');
  const ro = (await rpc(TOK.viewer, 'tools/list')).tools.map(t => t.name);
  assert.ok(ro.includes('get_summary') && !ro.includes('set_world_image'), 'Leser bekommt nur lesende Werkzeuge');
});

test('Weltbild setzen nur als Welt-Admin, übrige Weltdaten bleiben', async () => {
  const no = await mcp(TOK.editor, 'set_world_image', { world: 'Eldoria', data: PNG });
  assert.ok(no.isError && /Admins/.test(no.text));
  const ok = await mcp(TOK.admin, 'set_world_image', { world: 'Eldoria', data: PNG, opacity: 0.8 });
  assert.ok(!ok.isError, ok.text);
  const w = JSON.parse(fs.readFileSync(path.join(DATA, 'worlds', 'Eldoria.json'), 'utf8'));
  assert.match(w.mapImage.src, /^images\/img[0-9a-f]+\.png$/); assert.equal(w.mapImage.h, 1700); assert.equal(w.mapImage.opacity, 0.8);
  assert.equal(w.name, 'Eldoria'); assert.deepEqual(w.yearFmt, { neg: 'v.K.', pos: 'n.K.' });
  assert.ok(fs.existsSync(path.join(DATA, w.mapImage.src)));
  const img = await fetch(BASE + '/' + w.mapImage.src); assert.equal(img.headers.get('content-type'), 'image/png');
  const sw = await mcp(TOK.admin, 'set_world_image', { world: 'starwars', data: PNG });
  assert.ok(sw.isError);
  const clr = await mcp(TOK.admin, 'set_world_image', { world: 'Eldoria', clear: true });
  assert.ok(!clr.isError); assert.equal(JSON.parse(fs.readFileSync(path.join(DATA, 'worlds', 'Eldoria.json'), 'utf8')).mapImage, undefined);
});

test('Bild-Uploads: nur echte Bilder, keine Downloads aus dem lokalen Netz', async () => {
  const c = await mcp(TOK.editor, 'upsert_character', { timeline: 'Haupt', name: 'Arin' });
  assert.ok(!c.isError, c.text);
  const ok = await mcp(TOK.editor, 'add_character_image', { timeline: 'Haupt', name: 'Arin', data: PNG, portrait: true });
  assert.ok(!ok.isError, ok.text); assert.match(ok.data.src, /^images\/.*\.png$/);
  const fake = await mcp(TOK.editor, 'add_character_image', { timeline: 'Haupt', name: 'Arin', data: Buffer.from('<svg onload=alert(1)>').toString('base64') });
  assert.ok(fake.isError && /not a supported image/.test(fake.text));
  const ssrf = await mcp(TOK.editor, 'add_character_image', { timeline: 'Haupt', name: 'Arin', url: `http://127.0.0.1:${PORT}/api/info` });
  assert.ok(ssrf.isError && /lokalen Netz/.test(ssrf.text));
  const priv = await mcp(TOK.editor, 'add_character_image', { timeline: 'Haupt', name: 'Arin', url: 'http://192.168.178.1/bild.png' });
  assert.ok(priv.isError && /lokalen Netz/.test(priv.text));
});

test('Kanon bleibt schreibgeschützt, Orte bleiben erhalten', async () => {
  const r = await mcp(TOK.admin, 'upsert_place', { timeline: 'Kanon', name: 'Testwelt' });
  assert.ok(r.isError);
  const tl = JSON.parse(fs.readFileSync(path.join(DATA, 'timelines', 'Haupt.json'), 'utf8'));
  assert.equal(tl.objects.length, 1); assert.equal(tl.objects[0].name, 'Nordhafen');
});

// ---------------------------------------------------------------- Housing
const http = require('node:http');
let web;
test('Housing über MCP: Schiff anlegen, Räume, Wand verschieben, lesen', async () => {
  const h = await mcp(TOK.editor, 'upsert_housing', { timeline: 'Haupt', name: 'Ebon Talon', kind: 'ship', owners: ['Arin'], place: 'Nordhafen', description: 'Leichter Frachter' });
  assert.ok(!h.isError, h.text); assert.equal(h.data.created, true);
  const a = await mcp(TOK.editor, 'upsert_room', { timeline: 'Haupt', housing: 'Ebon Talon', room: 'Cockpit', rects: [[2, 10, 6, 8]], description: 'Zwei Sitze', items: [{ name: 'Navicomputer' }] });
  assert.ok(!a.isError, a.text);
  const b = await mcp(TOK.editor, 'upsert_room', { timeline: 'Haupt', housing: 'Ebon Talon', room: 'Lounge', rects: [[8, 8, 12, 12], [8, 20, 4, 3]], furnishing: 'Dejarik-Tisch, Sofa' });
  assert.ok(!b.isError, b.text); assert.equal(b.data.room.area, 156);
  const w = await mcp(TOK.editor, 'move_wall', { timeline: 'Haupt', housing: 'Ebon Talon', room: 'Cockpit', side: 'right', by: 2 });
  assert.ok(!w.isError, w.text);
  assert.deepEqual(w.data.changed.find(x => x.name === 'Cockpit').rects, [[2, 10, 8, 8]]);
  assert.deepEqual(w.data.changed.find(x => x.name === 'Lounge').rects[0], [10, 8, 10, 12], 'Nachbarwand wandert mit');
  const ov = await mcp(TOK.editor, 'upsert_room', { timeline: 'Haupt', housing: 'Ebon Talon', room: 'Kabine', rects: [[15, 10, 3, 3]] });
  assert.match(ov.data.warning, /Lounge/);
  const bad = await mcp(TOK.editor, 'upsert_room', { timeline: 'Haupt', housing: 'Ebon Talon', room: 'Zu groß', rects: [[38, 0, 5, 5]] });
  assert.ok(bad.isError && /Rand/.test(bad.text));
  const tooFar = await mcp(TOK.editor, 'move_wall', { timeline: 'Haupt', housing: 'Ebon Talon', room: 'Cockpit', side: 'right', by: 15 });
  assert.ok(tooFar.isError);
  const g = await mcp(TOK.viewer, 'get_housing', { timeline: 'Haupt', housing: 'Ebon Talon' });
  assert.match(g.text, /Besitzer: Arin/); assert.match(g.text, /Ort: Nordhafen/); assert.match(g.text, /Navicomputer/); assert.match(g.text, /überlappende/);
  const ls = await mcp(TOK.viewer, 'list_housing', { timeline: 'Haupt' });
  assert.match(ls.text, /Ebon Talon/);
  const del = await mcp(TOK.editor, 'delete_room', { timeline: 'Haupt', housing: 'Ebon Talon', room: 'Kabine' });
  assert.ok(!del.isError);
  const vw = await rpc(TOK.viewer, 'tools/list');
  assert.ok(!vw.tools.some(t => t.name === 'upsert_room'), 'Leser kann nicht ändern');
});

test('Housing: Grundriss-Bild per Base64 und per Webseiten-Link (Vorschaubild)', async () => {
  const png = Buffer.from(PNG.split(',')[1], 'base64');
  web = http.createServer((req, res) => {
    if (req.url === '/plan.png') { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(png); }
    res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html><head><meta property="og:image" content="/plan.png"></head><body>Deckplan</body></html>');
  });
  await new Promise(r => web.listen(0, '127.0.0.2', r));
  const base = `http://127.0.0.2:${web.address().port}`;
  const a = await mcp(TOK.editor, 'set_deck_image', { timeline: 'Haupt', housing: 'Ebon Talon', data: PNG });
  assert.ok(!a.isError, a.text); assert.match(a.data.image.src, /^images\//);
  const page = await mcp(TOK.editor, 'set_deck_image', { timeline: 'Haupt', housing: 'Ebon Talon', url: base + '/wiki/Datei:Plan' });
  assert.ok(!page.isError, page.text); assert.equal(page.data.image.w, 1);
  const pin = await mcp(TOK.editor, 'upsert_room', { timeline: 'Haupt', housing: 'Ebon Talon', room: 'Frachtraum', pin: [20, 20], description: 'Laderaum' });
  assert.ok(!pin.isError, pin.text);
  const clr = await mcp(TOK.editor, 'set_deck_image', { timeline: 'Haupt', housing: 'Ebon Talon', clear: true });
  assert.ok(!clr.isError);
  web.close();
  const tl = JSON.parse(fs.readFileSync(path.join(DATA, 'timelines', 'Haupt.json'), 'utf8'));
  assert.equal(tl.housing.length, 1); assert.equal(tl.housing[0].decks[0].image, null);
  assert.equal(tl.objects.length, 1, 'Orte unverändert'); assert.equal(tl.characters.length, 1, 'Charaktere unverändert');
});

// ---------------------------------------------------------------- Konfliktzonen
test('Konfliktzonen: GPT markiert, beendet und löscht', async () => {
  for (const [name, color] of [['Sith', '#aa0000'], ['Republik', '#0044aa']]) { const f = await mcp(TOK.editor, 'upsert_faction', { timeline: 'Haupt', name, color }); assert.ok(!f.isError, f.text); }
  const bad = await mcp(TOK.editor, 'upsert_conflict', { timeline: 'Haupt', name: 'X', places: ['Nordhafen'], factions: ['Unbekannt'] });
  assert.ok(bad.isError && /Fraktion/.test(bad.text));
  const noArea = await mcp(TOK.editor, 'upsert_conflict', { timeline: 'Haupt', name: 'Ohne Ort' });
  assert.ok(noArea.isError && /Fläche/.test(noArea.text));
  const c = await mcp(TOK.editor, 'upsert_conflict', { timeline: 'Haupt', name: 'Schlacht um Nordhafen', places: ['Nordhafen'], factions: ['Sith', 'Republik'], from: '5 n.K.', size: 'medium', description: 'Belagerung des Hafens' });
  assert.ok(!c.isError, c.text);
  assert.equal(c.data.conflict.x, 100); assert.equal(c.data.conflict.radius, 55); assert.deepEqual(c.data.conflict.factions, ['Sith', 'Republik']);
  const before = await mcp(TOK.viewer, 'list_conflicts', { timeline: 'Haupt', year: '4 n.K.' });
  assert.match(before.text, /Keine aktiven/);
  const during = await mcp(TOK.viewer, 'get_summary', { timeline: 'Haupt', year: '7 n.K.', places: ['Nordhafen'] });
  assert.match(during.text, /Aktive Konfliktzonen/); assert.match(during.text, /Schlacht um Nordhafen.*Sith vs\. Republik/); assert.match(during.text, /Liegt in Konfliktzone: Schlacht um Nordhafen/);
  const end = await mcp(TOK.editor, 'end_conflict', { timeline: 'Haupt', name: 'Schlacht um Nordhafen', year: '9 n.K.' });
  assert.ok(!end.isError, end.text);
  const after = await mcp(TOK.viewer, 'list_conflicts', { timeline: 'Haupt', year: '10 n.K.' });
  assert.match(after.text, /Keine aktiven/);
  const all = await mcp(TOK.viewer, 'list_conflicts', { timeline: 'Haupt', all: true });
  assert.match(all.text, /5 n\.K\. – 9 n\.K\./);
  const order = await mcp(TOK.editor, 'upsert_conflict', { timeline: 'Haupt', name: 'Schlacht um Nordhafen', to: '1 n.K.' });
  assert.ok(order.isError, 'Ende vor Beginn');
  const miss = await mcp(TOK.editor, 'end_conflict', { timeline: 'Haupt', name: 'Gibt es nicht', year: '9 n.K.' });
  assert.ok(miss.isError && /not found/.test(miss.text));
  const del = await mcp(TOK.editor, 'delete_conflict', { timeline: 'Haupt', name: 'Schlacht um Nordhafen' });
  assert.ok(!del.isError);
  const tl = JSON.parse(fs.readFileSync(path.join(DATA, 'timelines', 'Haupt.json'), 'utf8'));
  assert.equal(tl.conflicts.length, 0); assert.equal(tl.objects.length, 1); assert.ok(tl.eras[0].control, 'Gebiete unberührt');
});
