/* Ascandir RP-Manager – Housing (Raumschiffe, Häuser, Basen)
   Gemeinsame Logik für Oberfläche und Server: Datenmodell, Prüfung, Wände/Räume im Raster, Textübersicht.
   Gespeichert wird in der Zeitlinie: timeline.housing = [ Objekt, … ]
   Objekt: { id, name, kind, owners: [Charakter-ids], place: Orts-id, description, decks: [Deck], created, updated }
   Deck:   { id, name, cols, rows, unit, image: { src, w, h } | null, imageOpacity, rooms: [Raum] }
   Raum:   { id, name, color, rects: [[x, y, w, h], …] (Rasterfelder), pin: [x, y] | null, description, furnishing, items: [{ name, note }], notes }
   Koordinaten: ganze Rasterfelder, x nach rechts, y nach unten, 0/0 = oben links. Keine Abhängigkeiten. */
(function (root) {
  'use strict';
  const KINDS = ['ship', 'house', 'base', 'station', 'vehicle', 'other'];
  const LIMITS = { housing: 100, decks: 20, rooms: 300, rects: 40, items: 200, cols: 200, rows: 200, name: 100, text: 20000, short: 500 };
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const COLORS = ['#c9b38a', '#9fb8c9', '#b7c99f', '#d1a3a3', '#c2a9d1', '#d6c27a', '#9fc9bd', '#c9a77a', '#a9b0bd', '#d1b3c4'];
  const IMG_RE = /^(images\/[A-Za-z0-9_-]{1,80}\.(png|jpg|webp|gif)|data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+)$/;

  class HousingError extends Error { constructor(msg, code) { super(msg); this.code = code || 400; } }
  const fail = (m, code) => { throw new HousingError(m, code); };
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 10);
  const text = (v, max, what) => { if (v == null) return ''; const s = String(v); if (s.length > max) fail(`${what}: zu lang (max. ${max} Zeichen)`); return s; };
  const int = (v, min, max, what) => { const n = Number(v); if (!Number.isFinite(n) || Math.round(n) !== n) fail(`${what}: ganze Zahl erwartet`); if (n < min || n > max) fail(`${what}: erlaubt ${min}…${max}`); return n; };
  const findBy = (list, q) => { if (q == null || q === '') return null; const s = String(q).toLowerCase().trim(); return list.find(x => x.id === q) || list.find(x => String(x.name).toLowerCase() === s) || list.find(x => String(x.name).toLowerCase().includes(s)) || null; };

  // ---------------------------------------------------------------- Räume
  function normRect(r, deck, what) {
    if (r && !Array.isArray(r) && typeof r === 'object') r = [r.x, r.y, r.w, r.h];
    if (!Array.isArray(r) || r.length !== 4) fail(`${what}: Rechteck als [x, y, Breite, Höhe] erwartet`);
    const x = int(r[0], 0, deck.cols - 1, what + ' x'), y = int(r[1], 0, deck.rows - 1, what + ' y');
    const w = int(r[2], 1, deck.cols - x, what + ' Breite (ragt über den Rand?)'), h = int(r[3], 1, deck.rows - y, what + ' Höhe (ragt über den Rand?)');
    return [x, y, w, h];
  }
  function normItems(list) {
    if (!Array.isArray(list)) fail('items: Liste erwartet');
    if (list.length > LIMITS.items) fail(`items: max. ${LIMITS.items}`);
    return list.filter(i => i && (i.name || typeof i === 'string')).map(i => typeof i === 'string' ? { name: text(i, LIMITS.name, 'Gegenstand'), note: '' } : { name: text(i.name, LIMITS.name, 'Gegenstand'), note: text(i.note || '', LIMITS.short, 'Notiz') });
  }
  // Raum anlegen/ändern; nur angegebene Felder werden geändert
  function applyRoom(deck, room, b) {
    if (b.name != null) { room.name = text(b.name, LIMITS.name, 'Name').trim(); if (!room.name) fail('Name darf nicht leer sein'); }
    if (b.color != null) { if (!COLOR_RE.test(b.color)) fail('color: #rrggbb erwartet'); room.color = b.color; }
    if (b.rects != null) {
      if (!Array.isArray(b.rects)) fail('rects: Liste von [x, y, Breite, Höhe] erwartet');
      if (b.rects.length > LIMITS.rects) fail(`rects: max. ${LIMITS.rects} Flächen pro Raum`);
      room.rects = b.rects.map((r, i) => normRect(r, deck, `rects[${i}]`));
    }
    if (Array.isArray(b.addRects)) { const add = b.addRects.map((r, i) => normRect(r, deck, `addRects[${i}]`)); room.rects = (room.rects || []).concat(add); if (room.rects.length > LIMITS.rects) fail(`max. ${LIMITS.rects} Flächen pro Raum`); }
    if (b.pin !== undefined) {
      if (b.pin === null) room.pin = null;
      else { if (!Array.isArray(b.pin) || b.pin.length !== 2) fail('pin: [x, y] erwartet'); const px = Number(b.pin[0]), py = Number(b.pin[1]); if (!(px >= 0 && px <= deck.cols && py >= 0 && py <= deck.rows)) fail(`pin: innerhalb 0…${deck.cols} / 0…${deck.rows}`); room.pin = [Math.round(px * 10) / 10, Math.round(py * 10) / 10]; }
    }
    for (const k of ['description', 'furnishing', 'notes']) if (b[k] != null) room[k] = text(b[k], LIMITS.text, k);
    if (b.items != null) room.items = normItems(b.items);
    if (!room.rects) room.rects = [];
    if (!room.rects.length && !room.pin) fail('Ein Raum braucht eine Fläche (rects) oder eine Markierung (pin)');
    return room;
  }
  function cellsOf(room) { const s = new Set(); for (const [x, y, w, h] of room.rects || []) for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) s.add(i + ',' + j); return s; }
  function bboxOf(room) {
    if (!room.rects || !room.rects.length) return room.pin ? [room.pin[0], room.pin[1], room.pin[0], room.pin[1]] : null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y, w, h] of room.rects) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h); }
    return [x0, y0, x1, y1];
  }
  const areaOf = room => cellsOf(room).size;
  // Außenwände eines Raums als Liner-Segmente [x1, y1, x2, y2] (zusammengefasst)
  function wallsOf(room) {
    const c = cellsOf(room), h = [], v = [];
    for (const k of c) {
      const [x, y] = k.split(',').map(Number);
      if (!c.has(x + ',' + (y - 1))) h.push([y, x]); if (!c.has(x + ',' + (y + 1))) h.push([y + 1, x]);
      if (!c.has((x - 1) + ',' + y)) v.push([x, y]); if (!c.has((x + 1) + ',' + y)) v.push([x + 1, y]);
    }
    const merge = (list, horiz) => {
      list.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const out = [];
      for (const [line, p] of list) { const last = out[out.length - 1]; if (last && last.line === line && last.to === p) last.to = p + 1; else out.push({ line, from: p, to: p + 1 }); }
      return out.map(s => horiz ? [s.from, s.line, s.to, s.line] : [s.line, s.from, s.line, s.to]);
    };
    return merge(h, true).concat(merge(v, false));
  }
  // Überlappungen zwischen Räumen (für Hinweise)
  function overlaps(deck) {
    const owner = new Map(), out = new Set();
    for (const r of deck.rooms) for (const k of cellsOf(r)) { if (owner.has(k) && owner.get(k) !== r.id) out.add([owner.get(k), r.id].sort().join('|')); else owner.set(k, r.id); }
    return [...out].map(s => s.split('|'));
  }

  // Wand verschieben: Seite eines Raums (left|right|top|bottom) um by Felder (positiv = nach rechts/unten).
  // Mit neighbors=true werden angrenzende Wände anderer Räume mitgezogen, damit keine Lücke/Überlappung entsteht.
  const EDGE = { left: r => r[0], right: r => r[0] + r[2], top: r => r[1], bottom: r => r[1] + r[3] };
  const OPP = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
  function moveWall(deck, room, side, by, neighbors) {
    if (!['left', 'right', 'top', 'bottom'].includes(side)) fail('side: left, right, top oder bottom');
    const bb = bboxOf(room); if (!bb || !room.rects || !room.rects.length) fail('Der Raum hat keine Fläche');
    const edge = side === 'left' ? bb[0] : side === 'right' ? bb[2] : side === 'top' ? bb[1] : bb[3];
    return shiftEdge(deck, room, room.rects.filter(r => EDGE[side](r) === edge), side, edge, by, neighbors);
  }
  // eine einzelne Kante (Fläche idx eines Raums) verschieben – für das Ziehen in der Oberfläche
  function moveRectEdge(deck, room, idx, side, by, neighbors) {
    const r = room.rects && room.rects[idx]; if (!r) fail('Fläche nicht gefunden');
    if (!EDGE[side]) fail('side: left, right, top oder bottom');
    return shiftEdge(deck, room, [r], side, EDGE[side](r), by, neighbors);
  }
  function shiftEdge(deck, room, moved, side, edge, by, neighbors) {
    by = int(by, -LIMITS.cols, LIMITS.cols, 'by'); if (!by) return [];
    const horiz = side === 'left' || side === 'right', opp = OPP[side];
    const shift = (r, s) => { if (s === 'left') { r[0] += by; r[2] -= by; } else if (s === 'right') r[2] += by; else if (s === 'top') { r[1] += by; r[3] -= by; } else r[3] += by; };
    const span = r => horiz ? [r[1], r[1] + r[3]] : [r[0], r[0] + r[2]];
    const touched = [room.id], before = JSON.stringify(deck.rooms.map(o => o.rects));
    try {
      if (neighbors) for (const o of deck.rooms) {
        if (o === room) continue; let hit = false;
        for (const r of o.rects || []) if (EDGE[opp](r) === edge && moved.some(m => { const a = span(m), b = span(r); return a[0] < b[1] && b[0] < a[1]; })) { shift(r, opp); hit = true; }
        if (hit) touched.push(o.id);
      }
      for (const r of moved) shift(r, side);
      for (const o of deck.rooms) if (touched.includes(o.id)) o.rects.forEach((r, i) => {
        if (r[2] < 1 || r[3] < 1) fail(`Raum „${o.name}“ würde dadurch verschwinden (Fläche ${i + 1})`);
        if (r[0] < 0 || r[1] < 0 || r[0] + r[2] > deck.cols || r[1] + r[3] > deck.rows) fail('Die Wand würde über den Rand des Grundrisses hinaus wandern');
      });
    } catch (e) { const old = JSON.parse(before); deck.rooms.forEach((o, i) => { o.rects = old[i]; }); throw e; }
    return touched;
  }

  // ---------------------------------------------------------------- Decks & Objekte
  function newDeck(o) {
    o = o || {};
    return { id: uid('dk'), name: text(o.name || 'Deck 1', LIMITS.name, 'Name'), cols: o.cols ? int(o.cols, 4, LIMITS.cols, 'cols') : 40, rows: o.rows ? int(o.rows, 4, LIMITS.rows, 'rows') : 28, unit: text(o.unit || '', 60, 'unit'), image: null, imageOpacity: 0.85, rooms: [] };
  }
  function applyDeck(deck, b) {
    if (b.name != null) { deck.name = text(b.name, LIMITS.name, 'Name').trim() || deck.name; }
    if (b.unit != null) deck.unit = text(b.unit, 60, 'unit');
    if (b.imageOpacity != null) { const o = Number(b.imageOpacity); if (!(o >= 0 && o <= 1)) fail('imageOpacity: 0…1'); deck.imageOpacity = o; }
    if (b.cols != null || b.rows != null) {
      const cols = b.cols != null ? int(b.cols, 4, LIMITS.cols, 'cols') : deck.cols, rows = b.rows != null ? int(b.rows, 4, LIMITS.rows, 'rows') : deck.rows;
      for (const r of deck.rooms) for (const [x, y, w, h] of r.rects || []) if (x + w > cols || y + h > rows) fail(`Raum „${r.name}“ liegt außerhalb des neuen Rasters ${cols}×${rows}`);
      deck.cols = cols; deck.rows = rows;
    }
    return deck;
  }
  function setImage(deck, img, fit) {
    if (!img) { deck.image = null; return deck; }
    if (!IMG_RE.test(img.src || '')) fail('Bildquelle ungültig');
    deck.image = { src: img.src, w: int(img.w, 1, 50000, 'Bildbreite'), h: int(img.h, 1, 50000, 'Bildhöhe') };
    // Raster ans Seitenverhältnis des Bildes anpassen (nur, wenn noch keine Räume darüber hinausragen)
    if (fit !== false) { const rows = Math.max(4, Math.min(LIMITS.rows, Math.round(deck.cols * img.h / img.w))); if (!deck.rooms.some(r => (r.rects || []).some(q => q[1] + q[3] > rows))) deck.rows = rows; }
    return deck;
  }
  function newHousing(o) {
    const now = new Date().toISOString();
    return { id: uid('hs'), name: text(o.name, LIMITS.name, 'Name').trim() || 'Unterkunft', kind: KINDS.includes(o.kind) ? o.kind : 'other', owners: [], place: '', description: '', decks: [newDeck({ name: o.deckName || (o.kind === 'ship' ? 'Hauptdeck' : 'Erdgeschoss') })], created: now, updated: now };
  }
  // Beim Laden fehlerhafte/alte Einträge reparieren, ohne Daten wegzuwerfen
  function normalize(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(h => h && typeof h === 'object').map(h => {
      h.id = h.id || uid('hs'); h.name = String(h.name || 'Unterkunft'); h.kind = KINDS.includes(h.kind) ? h.kind : 'other';
      h.owners = Array.isArray(h.owners) ? h.owners.map(String) : []; h.place = h.place ? String(h.place) : ''; h.description = String(h.description || '');
      h.decks = Array.isArray(h.decks) && h.decks.length ? h.decks : [newDeck()];
      for (const d of h.decks) {
        d.id = d.id || uid('dk'); d.name = String(d.name || 'Deck'); d.cols = Math.max(4, Math.min(LIMITS.cols, Math.round(+d.cols || 40))); d.rows = Math.max(4, Math.min(LIMITS.rows, Math.round(+d.rows || 28)));
        d.unit = String(d.unit || ''); d.imageOpacity = d.imageOpacity == null ? 0.85 : +d.imageOpacity; d.image = d.image && IMG_RE.test(d.image.src || '') ? d.image : null;
        d.rooms = Array.isArray(d.rooms) ? d.rooms.filter(r => r && typeof r === 'object') : [];
        d.rooms.forEach((r, i) => { r.id = r.id || uid('rm'); r.name = String(r.name || 'Raum'); r.color = COLOR_RE.test(r.color || '') ? r.color : COLORS[i % COLORS.length]; r.rects = Array.isArray(r.rects) ? r.rects.filter(q => Array.isArray(q) && q.length === 4 && q.every(Number.isFinite)) : []; r.items = Array.isArray(r.items) ? r.items : []; });
      }
      return h;
    });
  }

  // ---------------------------------------------------------------- Text für ChatGPT
  function textOf(h, ctx, lang) {
    ctx = ctx || {}; const de = lang !== 'en';
    const kindName = (de ? { ship: 'Raumschiff', house: 'Haus', base: 'Basis', station: 'Station', vehicle: 'Fahrzeug', other: 'Sonstiges' } : { ship: 'Ship', house: 'House', base: 'Base', station: 'Station', vehicle: 'Vehicle', other: 'Other' })[h.kind];
    const L = [`# ${h.name} [id: ${h.id}] – ${kindName}`];
    if (h.owners.length) L.push((de ? 'Besitzer: ' : 'Owners: ') + h.owners.map(id => (ctx.charName && ctx.charName(id)) || id).join(', '));
    if (h.place) L.push((de ? 'Ort: ' : 'Location: ') + ((ctx.placeName && ctx.placeName(h.place)) || h.place));
    if (h.description) L.push('', h.description);
    for (const d of h.decks) {
      L.push('', `## ${d.name} [id: ${d.id}] – ${de ? 'Raster' : 'grid'} ${d.cols}×${d.rows}${d.unit ? ' (1 ' + (de ? 'Feld' : 'cell') + ' = ' + d.unit + ')' : ''}${d.image ? (de ? ' · mit Grundriss-Bild' : ' · with floor plan image') : ''}`);
      if (!d.rooms.length) L.push(de ? '(noch keine Räume)' : '(no rooms yet)');
      for (const r of d.rooms) {
        const bb = bboxOf(r);
        L.push(`### ${r.name} [id: ${r.id}]` + (r.rects.length ? ` – ${de ? 'Flächen' : 'areas'} ${r.rects.map(q => `[${q.join(',')}]`).join(' ')} · ${areaOf(r)} ${de ? 'Felder' : 'cells'} · ${de ? 'Rahmen' : 'bounds'} x ${bb[0]}–${bb[2]}, y ${bb[1]}–${bb[3]}` : '') + (r.pin ? ` · ${de ? 'Markierung' : 'pin'} [${r.pin.join(',')}]` : ''));
        if (r.description) L.push(r.description);
        if (r.furnishing) L.push((de ? 'Einrichtung: ' : 'Furnishing: ') + r.furnishing);
        if (r.items && r.items.length) L.push((de ? 'Gegenstände: ' : 'Items: ') + r.items.map(i => i.name + (i.note ? ` (${i.note})` : '')).join(', '));
        if (r.notes) L.push((de ? 'Notizen: ' : 'Notes: ') + r.notes);
      }
      const ov = overlaps(d); if (ov.length) L.push((de ? 'Achtung, überlappende Räume: ' : 'Warning, overlapping rooms: ') + ov.map(p => p.map(id => (d.rooms.find(r => r.id === id) || {}).name).join(' / ')).join('; '));
    }
    return L.join('\n');
  }

  const API = { KINDS, LIMITS, COLORS, HousingError, uid, findBy, normRect, applyRoom, cellsOf, bboxOf, areaOf, wallsOf, overlaps, moveWall, moveRectEdge, newDeck, applyDeck, setImage, newHousing, normalize, textOf };
  root.IAM_HOUSING = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
