// Tests für das gemeinsame Kartenmodul (Datenmodell, Validierung, Batch-Änderungen, Export)
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const F = require('../src/fantasymap.js');

const base = () => F.createMap({ name: 'Testkarte', world: 'w1' });
const land = { type: 'land', geometry: { type: 'polygon', coordinates: [[100, 100], [900, 120], [1000, 800], [200, 900]] } };

test('createMap liefert gültige, versionierte Karte', () => {
  const m = base();
  assert.equal(m.format, 'ascandir-map'); assert.equal(m.version, F.VERSION);
  assert.equal(m.width, 2300); assert.equal(m.height, 1700); assert.equal(m.rev, 1);
  assert.deepEqual(Object.keys(m.layers), F.LAYERS);
  assert.doesNotThrow(() => F.normalizeMap(m));
});

test('Gebirgskette, Fluss und gezielte Farbänderung per ID (Beispiel aus der Anforderung)', () => {
  let m = base();
  const r1 = F.applyOps(m, [
    { op: 'add', feature: land },
    { op: 'add', feature: { type: 'mountains', name: 'Graukamm', geometry: { type: 'group', coordinates: [[300, 300], [340, 290], [380, 305], [420, 295], [460, 310]] } } },
    { op: 'add', feature: { type: 'river', geometry: { type: 'line', coordinates: [[380, 320], [450, 480], [520, 700], [610, 905]] }, label: { text: 'Silberlauf' } } }
  ]);
  assert.equal(r1.result.added.length, 3);
  m = r1.map;
  const river = m.features.find(f => f.type === 'river');
  assert.equal(F.styleOf(river, m).smooth, true, 'Flüsse sind standardmäßig geglättet');
  const before = JSON.stringify(m.features.filter(f => f.id !== river.id));
  const r2 = F.applyOps(m, [{ op: 'update', id: river.id, style: { stroke: '#2a6f97' } }]);
  assert.deepEqual(r2.result.updated, [river.id]);
  assert.equal(r2.map.features.find(f => f.id === river.id).style.stroke, '#2a6f97');
  assert.equal(JSON.stringify(r2.map.features.filter(f => f.id !== river.id)), before, 'andere Objekte bleiben unverändert');
  assert.deepEqual(r2.map.features.find(f => f.id === river.id).geometry, river.geometry, 'Geometrie bleibt verlustfrei');
  assert.equal(r2.map.rev, m.rev + 1);
});

test('Batches sind atomar: ein Fehler verwirft alles', () => {
  const m = base();
  assert.throws(() => F.applyOps(m, [{ op: 'add', feature: land }, { op: 'delete', id: 'gibtsnicht' }]), e => e.code === 404);
  assert.equal(m.features.length, 0, 'Original unverändert');
  assert.throws(() => F.applyOps(m, []), /keine Änderungen/);
  assert.throws(() => F.applyOps(m, new Array(F.LIMITS.batch + 1).fill({ op: 'add', feature: land })), /max\. 500/);
});

test('Validierung nicht vertrauenswürdiger Eingaben', () => {
  const m = base();
  const bad = [
    [{ type: 'unbekannt', geometry: { type: 'point', coordinates: [1, 1] } }, /unbekannter Typ/],
    [{ type: 'city', geometry: { type: 'line', coordinates: [[1, 1], [2, 2]] } }, /passt nicht/],
    [{ type: 'city', geometry: { type: 'point', coordinates: [1e9, 1] } }, /außerhalb/],
    [{ type: 'city', geometry: { type: 'point', coordinates: ['x', 1] } }, /Zahl erwartet/],
    [{ type: 'city', geometry: { type: 'point', coordinates: [1, 1] }, style: { fill: 'red;background:url(x)' } }, /Farbe/],
    [{ type: 'city', geometry: { type: 'point', coordinates: [1, 1] }, style: { onclick: 'x' } }, /unbekannte Stil/],
    [{ type: 'city', id: '../../etc', geometry: { type: 'point', coordinates: [1, 1] } }, /id:/],
    [{ type: 'label', geometry: { type: 'point', coordinates: [1, 1] } }, /label\.text/],
    [{ type: 'city', geometry: { type: 'point', coordinates: [1, 1] }, label: { text: 'x'.repeat(201) } }, /zu lang/],
    [{ type: 'river', geometry: { type: 'line', coordinates: [[1, 1]] } }, /mindestens 2/],
    [{ type: 'lake', geometry: { type: 'polygon', coordinates: [[[1, 1], [2, 2]]] } }, /mindestens 3/]
  ];
  for (const [f, re] of bad) assert.throws(() => F.applyOps(m, [{ op: 'add', feature: f }]), re, JSON.stringify(f));
  // doppelte ID
  const r = F.applyOps(m, [{ op: 'add', feature: Object.assign({ id: 'kueste' }, land) }]);
  assert.throws(() => F.applyOps(r.map, [{ op: 'add', feature: Object.assign({ id: 'kueste' }, land) }]), e => e.code === 409);
});

test('Verschieben, Skalieren, Drehen, Reihenfolge, Löschen per ID', () => {
  let m = F.applyOps(base(), [{ op: 'add', feature: Object.assign({ id: 'a' }, land) }, { op: 'add', feature: { id: 'c', type: 'city', geometry: { type: 'point', coordinates: [500, 500] }, style: { size: 30 } } }]).map;
  m = F.applyOps(m, [{ op: 'update', id: 'c', translate: [10, -5] }]).map;
  assert.deepEqual(m.features[1].geometry.coordinates, [510, 495]);
  m = F.applyOps(m, [{ op: 'update', id: 'c', scale: 2 }]).map;
  assert.equal(m.features[1].style.size, 60);
  m = F.applyOps(m, [{ op: 'update', id: 'a', scale: { factor: 0.5, origin: [100, 100] } }]).map;
  assert.deepEqual(m.features[0].geometry.coordinates[0][0], [100, 100]);
  assert.deepEqual(m.features[0].geometry.coordinates[0][1], [500, 110]);
  m = F.applyOps(m, [{ op: 'update', id: 'a', order: 'front' }]).map;
  assert.deepEqual(m.features.map(f => f.id), ['c', 'a']);
  m = F.applyOps(m, [{ op: 'update', id: 'a', label: { text: 'Eldoria', size: 40 } }, { op: 'update', id: 'a', label: { size: null } }]).map;
  assert.deepEqual(m.features[1].label, { text: 'Eldoria' });
  const r = F.applyOps(m, [{ op: 'delete', id: 'c' }]);
  assert.deepEqual(r.result.deleted, ['c']); assert.equal(r.map.features.length, 1);
});

test('Abfragen nach bbox, Typ, Text und Nähe', () => {
  const m = F.applyOps(base(), [
    { op: 'add', feature: { id: 'n', type: 'city', geometry: { type: 'point', coordinates: [100, 100] }, label: { text: 'Nordhafen' } } },
    { op: 'add', feature: { id: 's', type: 'village', geometry: { type: 'point', coordinates: [1500, 1400] }, name: 'Südweiler' } }
  ]).map;
  assert.deepEqual(F.query(m, { bbox: [0, 0, 300, 300] }).features.map(f => f.id), ['n']);
  assert.deepEqual(F.query(m, { type: 'village' }).features.map(f => f.id), ['s']);
  assert.deepEqual(F.query(m, { text: 'nord' }).features.map(f => f.id), ['n']);
  assert.deepEqual(F.query(m, { near: [1500, 1390, 20] }).features.map(f => f.id), ['s']);
  assert.equal(F.query(m, { limit: 1 }).truncated, true);
});

test('Migration v0 -> v1 und Schutz vor neueren Formaten', () => {
  const v0 = { format: 'ascandir-map', id: 'alt', name: 'Alt', world: 'w1', objects: [{ id: 'x', type: 'lake', points: [[1, 1], [50, 1], [25, 40]], closed: true, fill: '#336699' }] };
  const m = F.normalizeMap(v0);
  assert.equal(m.version, 1); assert.equal(m.features[0].geometry.type, 'polygon'); assert.equal(m.features[0].style.fill, '#336699');
  assert.throws(() => F.normalizeMap(Object.assign({}, m, { version: 99 })), e => e.code === 409);
});

test('SVG-Export ist gültig, skaliert und maskiert Texte', () => {
  const m = F.applyOps(base(), [
    { op: 'add', feature: land },
    { op: 'add', feature: { type: 'forest', geometry: { type: 'polygon', coordinates: [[[500, 200], [700, 200], [700, 400], [500, 400]]] } } },
    { op: 'add', feature: { type: 'label', geometry: { type: 'point', coordinates: [400, 400] }, label: { text: '<script>alert(1)</script> & Co' } } },
    { op: 'add', feature: { type: 'compass', geometry: { type: 'point', coordinates: [2000, 1500] } } },
    { op: 'add', feature: { type: 'cartouche', geometry: { type: 'point', coordinates: [1800, 200] }, label: { text: 'Eldoria' } } }
  ]).map;
  const svg = F.toSVG(m);
  assert.match(svg, /^<\?xml/); assert.match(svg, /viewBox="0 0 2300 1700"/);
  assert.ok(!svg.includes('<script>'), 'kein ungeschütztes HTML');
  assert.match(svg, /&lt;script&gt;/);
  assert.ok(svg.length < 3e6);
  // ausgeblendete Ebene erscheint nicht
  const hidden = F.toSVG(Object.assign({}, m, { layers: Object.assign({}, m.layers, { labels: { visible: false } }) }));
  assert.ok(!hidden.includes('&lt;script&gt;'));
});

test('Darstellung ist deterministisch (gleiche Karte = gleiche Symbole)', () => {
  const m = F.applyOps(base(), [{ op: 'add', feature: { id: 'w', type: 'forest', geometry: { type: 'polygon', coordinates: [[[0, 0], [300, 0], [300, 300], [0, 300]]] } } }]).map;
  assert.equal(JSON.stringify(F.build(m)), JSON.stringify(F.build(JSON.parse(JSON.stringify(m)))));
});
