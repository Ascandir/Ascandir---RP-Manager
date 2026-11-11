// Tests für die Housing-Logik (Räume im Raster, Wände, Prüfung)
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const H = require('../src/housing-core.js');

function ship() {
  const h = H.newHousing({ name: 'Talon', kind: 'ship' }), d = h.decks[0];
  const a = { id: 'a', name: 'A', rects: [] }, b = { id: 'b', name: 'B', rects: [] };
  H.applyRoom(d, a, { rects: [[0, 0, 4, 4]] }); H.applyRoom(d, b, { rects: [[4, 0, 4, 4], [4, 4, 2, 2]] }); d.rooms.push(a, b);
  return { h, d, a, b };
}
test('Räume prüfen: Rand, ganze Zahlen, Form nötig', () => {
  const { d } = ship(), r = { id: 'x', name: 'X', rects: [] };
  assert.throws(() => H.applyRoom(d, r, { rects: [[38, 0, 5, 1]] }), /Rand/);
  assert.throws(() => H.applyRoom(d, r, { rects: [[1.5, 0, 2, 2]] }), /ganze Zahl/);
  assert.throws(() => H.applyRoom(d, { id: 'y', name: 'Y' }, { description: 'x' }), /Fläche/);
  assert.throws(() => H.applyRoom(d, r, { color: 'red' }), /color/);
  assert.doesNotThrow(() => H.applyRoom(d, r, { pin: [3.25, 4] }));
});
test('Wände: Außenwände zusammengefasst, L-Form', () => {
  const { b } = ship();
  assert.equal(H.areaOf(b), 20);
  assert.equal(H.wallsOf(b).length, 6, 'L-Form hat 6 Wandstücke');
});
test('Wand verschieben mit und ohne Nachbarn, Rücknahme bei Fehler', () => {
  let s = ship();
  assert.deepEqual(H.moveWall(s.d, s.a, 'right', 1, true), ['a', 'b']);
  assert.deepEqual(s.a.rects, [[0, 0, 5, 4]]); assert.deepEqual(s.b.rects[0], [5, 0, 3, 4]);
  s = ship(); H.moveWall(s.d, s.a, 'right', 1, false);
  assert.deepEqual(s.b.rects[0], [4, 0, 4, 4], 'ohne Nachbarn bleibt B'); assert.equal(H.overlaps(s.d).length, 1);
  s = ship(); const before = JSON.stringify(s.d.rooms);
  assert.throws(() => H.moveWall(s.d, s.a, 'right', 4, true), /verschwinden/);
  assert.equal(JSON.stringify(s.d.rooms), before, 'nichts teilweise geändert');
  assert.throws(() => H.moveWall(s.d, s.a, 'left', -1, true), /Rand/);
});
test('Einzelne Kante (L-Form) verschieben', () => {
  const s = ship();
  H.moveRectEdge(s.d, s.b, 1, 'bottom', 3, true);
  assert.deepEqual(s.b.rects[1], [4, 4, 2, 5]);
});
test('Raster ans Bild anpassen und alte Daten reparieren', () => {
  const { d } = ship();
  H.setImage(d, { src: 'images/img1.png', w: 2000, h: 1000 });
  assert.equal(d.rows, 20);
  assert.throws(() => H.setImage(d, { src: 'javascript:alert(1)', w: 1, h: 1 }), /Bildquelle/);
  const fixed = H.normalize([{ name: 'Alt', decks: [{ rooms: [{ name: 'R', rects: [[1, 1, 2, 2], 'kaputt'] }] }] }, null]);
  assert.equal(fixed.length, 1); assert.deepEqual(fixed[0].decks[0].rooms[0].rects, [[1, 1, 2, 2]]); assert.ok(fixed[0].decks[0].rooms[0].color);
});
