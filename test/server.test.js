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
  srv = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')], { env: Object.assign({}, process.env, { PORT: String(PORT), DATA_DIR: DATA, IAM_PASSWORD: 'geheim', IAM_API_TOKEN: TOK.admin, IAM_PUBLIC_VIEW: 'false' }), stdio: ['ignore', 'ignore', 'pipe'] });
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
