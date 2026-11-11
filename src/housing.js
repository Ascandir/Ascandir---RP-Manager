/* Ascandir RP-Manager – Housing-Oberfläche: Grundriss im Raster (Räume aus Rechteck-Flächen, Wände ziehen)
   oder Grundriss-Bild mit markierten Räumen. Daten liegen in der Zeitlinie (timeline.housing), Logik in housing-core.js. */
(function () {
  'use strict';
  const H = window.IAM_HOUSING; if (!H) return;
  const TXT = {
    de: {
      tab: 'Housing', none: 'In dieser Zeitlinie gibt es noch kein Raumschiff, Haus oder Basis.', create: 'Neu anlegen', newName: 'Name (z. B. dein Raumschiff)',
      kinds: { ship: 'Raumschiff', house: 'Haus', base: 'Basis', station: 'Station', vehicle: 'Fahrzeug', other: 'Sonstiges' }, kind: 'Art',
      props: 'Eigenschaften', name: 'Name', owners: 'Besitzer', place: 'Ort', noPlace: '– kein Ort –', desc: 'Beschreibung', del: 'Löschen',
      delQ: n => `„${n}“ mit allen Decks und Räumen löschen?`, deck: 'Deck / Etage', addDeck: '＋ Deck', deckSet: 'Deck-Einstellungen', cols: 'Breite (Felder)', rows: 'Höhe (Felder)', unit: '1 Feld =',
      img: 'Grundriss-Bild', imgUp: '🖼 Bild als Vorlage', imgDel: 'Bild entfernen', opacity: 'Deckkraft', fit: 'Raster ans Bild anpassen', delDeck: 'Deck löschen', delDeckQ: n => `Deck „${n}“ mit allen Räumen löschen?`,
      rooms: 'Räume', noRooms: 'Noch keine Räume. Mit „▭ Raum“ ein Rechteck aufziehen oder mit „📍 Markierung“ einen Raum auf dem Bild markieren.',
      room: 'Raum', color: 'Farbe', furnishing: 'Einrichtung', items: 'Gegenstände', itemName: 'Gegenstand', itemNote: 'Notiz', addItem: '＋ Gegenstand', notes: 'Notizen',
      areas: 'Flächen', area: (q, i) => `Fläche ${i + 1}: x ${q[0]}, y ${q[1]}, ${q[2]}×${q[3]}`, pin: 'Markierung', delRoom: 'Raum löschen', delRoomQ: n => `Raum „${n}“ löschen?`,
      tSel: '⬚ Auswählen', tRoom: '▭ Raum', tAdd: '＋▭ Fläche', tPin: '📍 Markierung', tFit: '⌂', tFitT: 'Ganzen Grundriss zeigen',
      hSel: 'Raum anklicken · Raum ziehen = verschieben · Kante ziehen = Wand verschieben (Nachbarräume wandern mit, Alt = nur dieser Raum) · Entf = löschen · rechte Maustaste/Mausrad = schieben/zoomen',
      hRoom: 'Rechteck aufziehen = neuer Raum', hAdd: 'Rechteck aufziehen = Fläche an den ausgewählten Raum anfügen (für L- oder U-Formen)', hAddNo: 'Erst einen Raum auswählen',
      hPin: 'Klicken = Raum auf dem Grundriss-Bild markieren (bzw. Markierung des ausgewählten Raums setzen)',
      readOnly: 'Nur ansehen – keine Schreibrechte für diese Zeitlinie.', roomN: n => `Raum ${n}`, cell: (x, y) => `Feld x ${x}, y ${y}`, err: 'Fehler'
    },
    en: {
      tab: 'Housing', none: 'This timeline has no ship, house or base yet.', create: 'Create', newName: 'Name (e.g. your ship)',
      kinds: { ship: 'Starship', house: 'House', base: 'Base', station: 'Station', vehicle: 'Vehicle', other: 'Other' }, kind: 'Kind',
      props: 'Properties', name: 'Name', owners: 'Owners', place: 'Location', noPlace: '– no location –', desc: 'Description', del: 'Delete',
      delQ: n => `Delete “${n}” with all decks and rooms?`, deck: 'Deck / floor', addDeck: '＋ Deck', deckSet: 'Deck settings', cols: 'Width (cells)', rows: 'Height (cells)', unit: '1 cell =',
      img: 'Floor plan image', imgUp: '🖼 Image as template', imgDel: 'Remove image', opacity: 'Opacity', fit: 'Fit grid to image', delDeck: 'Delete deck', delDeckQ: n => `Delete deck “${n}” with all rooms?`,
      rooms: 'Rooms', noRooms: 'No rooms yet. Drag a rectangle with “▭ Room” or mark a room on the image with “📍 Pin”.',
      room: 'Room', color: 'Color', furnishing: 'Furnishing', items: 'Items', itemName: 'Item', itemNote: 'Note', addItem: '＋ Item', notes: 'Notes',
      areas: 'Areas', area: (q, i) => `Area ${i + 1}: x ${q[0]}, y ${q[1]}, ${q[2]}×${q[3]}`, pin: 'Pin', delRoom: 'Delete room', delRoomQ: n => `Delete room “${n}”?`,
      tSel: '⬚ Select', tRoom: '▭ Room', tAdd: '＋▭ Area', tPin: '📍 Pin', tFit: '⌂', tFitT: 'Show whole plan',
      hSel: 'Click a room · drag room = move · drag an edge = move wall (neighbours follow, Alt = this room only) · Del = delete · right mouse/wheel = pan/zoom',
      hRoom: 'Drag a rectangle = new room', hAdd: 'Drag a rectangle = add an area to the selected room (L or U shapes)', hAddNo: 'Select a room first',
      hPin: 'Click = mark a room on the floor plan image (or set the pin of the selected room)',
      readOnly: 'View only – no write access to this timeline.', roomN: n => `Room ${n}`, cell: (x, y) => `cell x ${x}, y ${y}`, err: 'Error'
    }
  };

  window.IAM_HOUSING_UI = function create(app) {
    const L = () => TXT[app.lang()] || TXT.de, esc = app.esc;
    const st = { hid: null, did: null, rid: null, tool: 'select', view: null, drag: null, hover: null, fitted: null };
    const cv = document.getElementById('hvCanvas'), ctx = cv.getContext('2d'), wrap = document.getElementById('housingView');
    const imgs = new Map();
    const tl = () => app.tl();
    const list = () => { const t = tl(); if (!t) return []; t.housing = H.normalize(t.housing); return t.housing; };
    const cur = () => { const ls = list(); return ls.find(h => h.id === st.hid) || ls[0] || null; };
    const deck = () => { const h = cur(); return h ? (h.decks.find(d => d.id === st.did) || h.decks[0]) : null; };
    const room = () => { const d = deck(); return d ? d.rooms.find(r => r.id === st.rid) || null : null; };
    const canEdit = () => app.canEdit();
    // jede Änderung: Rückgängig-Punkt, ändern, speichern, neu zeichnen
    function change(fn, keepPanel) {
      if (!canEdit()) return false;
      app.pushUndo();
      try { fn(); } catch (e) { app.undo(); app.toast(L().err + ': ' + e.message); return false; }
      const h = cur(); if (h) h.updated = new Date().toISOString();
      app.save(); draw(); if (!keepPanel) render();
      return true;
    }

    // ------------------------------------------------------------- Ansicht
    let W = 0, Hh = 0, DPR = 1;
    function resize() { const r = wrap.getBoundingClientRect(); DPR = window.devicePixelRatio || 1; W = r.width; Hh = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(Hh * DPR); cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; }
    function fit() { const d = deck(); if (!d || !W) return; const z = Math.min((W - 60) / d.cols, (Hh - 90) / d.rows); st.view = { z, x: d.cols / 2, y: d.rows / 2 }; st.fitted = d.id; draw(); }
    const w2s = (x, y) => ({ x: W / 2 + (x - st.view.x) * st.view.z, y: Hh / 2 + 25 + (y - st.view.y) * st.view.z });
    const s2w = (x, y) => ({ x: st.view.x + (x - W / 2) / st.view.z, y: st.view.y + (y - Hh / 2 - 25) / st.view.z });
    function img(src) {
      let im = imgs.get(src); if (!im) { im = new Image(); im.onload = () => draw(); im.src = src; imgs.set(src, im); }
      return im.complete && im.naturalWidth ? im : null;
    }
    function draw() {
      if (wrap.hidden) return;
      if (!W) resize();
      const d = deck();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg') || '#111'; ctx.fillRect(0, 0, W, Hh);
      if (!d) return;
      if (!st.view || st.fitted !== d.id) { fit(); return; }
      const z = st.view.z, o = w2s(0, 0);
      ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * o.x, DPR * o.y);
      // Fläche + Bild
      ctx.fillStyle = '#ece6d6'; ctx.fillRect(0, 0, d.cols, d.rows);
      if (d.image) { const im = img(d.image.src); if (im) { ctx.globalAlpha = d.imageOpacity; ctx.drawImage(im, 0, 0, d.cols, d.rows); ctx.globalAlpha = 1; } }
      // Raster
      if (z > 6) {
        ctx.strokeStyle = d.image ? 'rgba(40,40,60,0.18)' : 'rgba(40,40,60,0.14)'; ctx.lineWidth = 1 / z; ctx.beginPath();
        for (let x = 0; x <= d.cols; x++) { ctx.moveTo(x, 0); ctx.lineTo(x, d.rows); }
        for (let y = 0; y <= d.rows; y++) { ctx.moveTo(0, y); ctx.lineTo(d.cols, y); }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(40,40,60,0.5)'; ctx.lineWidth = 2 / z; ctx.strokeRect(0, 0, d.cols, d.rows);
      const rooms = previewRooms(d);
      // Böden
      for (const r of rooms) { ctx.fillStyle = r.color; ctx.globalAlpha = d.image ? 0.42 : 0.75; for (const [x, y, w, h] of r.rects) ctx.fillRect(x, y, w, h); }
      ctx.globalAlpha = 1;
      // Wände
      const ww = Math.max(2.5 / z, 0.16);
      ctx.strokeStyle = '#2b2622'; ctx.lineWidth = ww; ctx.lineCap = 'square'; ctx.beginPath();
      for (const r of rooms) for (const [x1, y1, x2, y2] of H.wallsOf(r)) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
      ctx.stroke();
      // Auswahl & Griffe
      const sel = rooms.find(r => r.id === st.rid);
      if (sel) {
        ctx.strokeStyle = '#1f6fd1'; ctx.lineWidth = 3 / z; ctx.setLineDash([6 / z, 4 / z]);
        for (const [x, y, w, h] of sel.rects) ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
        if (canEdit() && st.tool === 'select') { ctx.fillStyle = '#1f6fd1'; for (const e of edgesOf(sel)) { const t = 5 / z, m = e.horiz ? [(e.a + e.b) / 2, e.pos] : [e.pos, (e.a + e.b) / 2]; ctx.fillRect(m[0] - (e.horiz ? 3 * t : t), m[1] - (e.horiz ? t : 3 * t), e.horiz ? 6 * t : 2 * t, e.horiz ? 2 * t : 6 * t); } }
      }
      // Beschriftungen & Markierungen
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const r of rooms) {
        let at = null, maxW = 0;
        if (r.rects.length) { const big = r.rects.slice().sort((a, b) => b[2] * b[3] - a[2] * a[3])[0]; at = [big[0] + big[2] / 2, big[1] + big[3] / 2]; maxW = big[2]; }
        if (r.pin) {
          const [px, py] = r.pin, rr = Math.max(7 / z, 0.35);
          ctx.fillStyle = r.id === st.rid ? '#1f6fd1' : '#b33a2a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 / z;
          ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          if (!at) { at = [px, py + rr * 2.4]; maxW = 40 / z * 4; }
        }
        if (!at) continue;
        const fs = Math.min(Math.max(12 / z, 0.45), 1.1);
        ctx.font = `600 ${fs}px "Segoe UI", Arial, sans-serif`;
        let tx = r.name; while (tx.length > 3 && ctx.measureText(tx).width > maxW * 0.95) tx = tx.slice(0, -2) + '…';
        if (ctx.measureText(tx).width > maxW && !r.pin) continue;
        ctx.lineWidth = fs * 0.3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineJoin = 'round'; ctx.strokeText(tx, at[0], at[1]);
        ctx.fillStyle = '#1d1a17'; ctx.fillText(tx, at[0], at[1]);
      }
      // Entwurf
      const dr = st.drag;
      if (dr && dr.kind === 'rect' && dr.r) { ctx.fillStyle = 'rgba(31,111,209,0.18)'; ctx.strokeStyle = '#1f6fd1'; ctx.lineWidth = 2 / z; ctx.fillRect(...dr.r); ctx.strokeRect(...dr.r); }
      // Status
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (st.hover) { const T = L(); ctx.font = '12px "Segoe UI", Arial'; ctx.fillStyle = 'rgba(0,0,0,0.55)'; const s = T.cell(st.hover[0], st.hover[1]) + (d.unit ? ' · 1 = ' + d.unit : ''); const w = ctx.measureText(s).width + 14; ctx.fillRect(W - w - 8, Hh - 28, w, 20); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(s, W - w - 1, Hh - 18); }
    }
    // beim Ziehen eine Vorschau statt der echten Daten zeichnen
    function previewRooms(d) { return st.drag && st.drag.preview ? st.drag.preview : d.rooms; }
    // Außenkanten der einzelnen Flächen eines Raums (für das Ziehen von Wänden)
    function edgesOf(r) {
      const out = [], cells = H.cellsOf(r);
      r.rects.forEach((q, idx) => {
        const [x, y, w, h] = q;
        const outer = (side) => { // Kante zählt, wenn mindestens ein Feld dahinter nicht zum Raum gehört
          for (let i = 0; i < (side === 'left' || side === 'right' ? h : w); i++) {
            const c = side === 'left' ? [x - 1, y + i] : side === 'right' ? [x + w, y + i] : side === 'top' ? [x + i, y - 1] : [x + i, y + h];
            if (!cells.has(c[0] + ',' + c[1])) return true;
          } return false;
        };
        for (const side of ['left', 'right', 'top', 'bottom']) if (outer(side)) {
          const horiz = side === 'top' || side === 'bottom';
          out.push({ idx, side, horiz, pos: side === 'left' ? x : side === 'right' ? x + w : side === 'top' ? y : y + h, a: horiz ? x : y, b: horiz ? x + w : y + h });
        }
      });
      return out;
    }

    // ------------------------------------------------------------- Maus
    const cellAt = (wx, wy, d) => [Math.max(0, Math.min(d.cols - 1, Math.floor(wx))), Math.max(0, Math.min(d.rows - 1, Math.floor(wy)))];
    function roomAt(wx, wy) {
      const d = deck(); if (!d) return null; const k = Math.floor(wx) + ',' + Math.floor(wy);
      for (let i = d.rooms.length - 1; i >= 0; i--) { const r = d.rooms[i]; if (r.pin && Math.hypot(r.pin[0] - wx, r.pin[1] - wy) < Math.max(9 / st.view.z, 0.45)) return r; }
      for (let i = d.rooms.length - 1; i >= 0; i--) if (H.cellsOf(d.rooms[i]).has(k)) return d.rooms[i];
      return null;
    }
    function edgeAt(sx, sy) {
      const r = room(); if (!r || !canEdit() || st.tool !== 'select') return null;
      for (const e of edgesOf(r)) {
        const p = e.horiz ? w2s(e.a, e.pos) : w2s(e.pos, e.a), q = e.horiz ? w2s(e.b, e.pos) : w2s(e.pos, e.b);
        if (e.horiz ? (Math.abs(sy - p.y) < 6 && sx > p.x + 2 && sx < q.x - 2) : (Math.abs(sx - p.x) < 6 && sy > p.y + 2 && sy < q.y - 2)) return e;
      }
      return null;
    }
    const pos = e => { const b = cv.getBoundingClientRect(); return { sx: e.clientX - b.left, sy: e.clientY - b.top }; };
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => {
      e.preventDefault(); if (!st.view) return; const { sx, sy } = pos(e), w = s2w(sx, sy), k = Math.exp(-e.deltaY * 0.0015);
      st.view.z = Math.max(2, Math.min(200, st.view.z * k)); const w2 = s2w(sx, sy); st.view.x += w.x - w2.x; st.view.y += w.y - w2.y; draw();
    }, { passive: false });
    cv.addEventListener('pointerdown', e => {
      const d = deck(); if (!d || !st.view) return; const { sx, sy } = pos(e), w = s2w(sx, sy);
      cv.setPointerCapture(e.pointerId);
      if (e.button !== 0 || !canEdit()) { st.drag = { kind: 'pan', sx, sy, vx: st.view.x, vy: st.view.y }; if (!canEdit() && e.button === 0) { const r = roomAt(w.x, w.y); st.rid = r ? r.id : null; render(); draw(); } return; }
      const c = cellAt(w.x, w.y, d);
      if (st.tool === 'room' || st.tool === 'add') {
        if (st.tool === 'add' && !room()) { app.toast(L().hAddNo); return; }
        st.drag = { kind: 'rect', start: c, r: [c[0], c[1], 1, 1] }; draw(); return;
      }
      if (st.tool === 'pin') {
        const p = [Math.round(w.x * 10) / 10, Math.round(w.y * 10) / 10];
        if (p[0] < 0 || p[1] < 0 || p[0] > d.cols || p[1] > d.rows) return;
        const r = room();
        change(() => { if (r) H.applyRoom(d, r, { pin: p }); else { const n = newRoom(d); H.applyRoom(d, n, { pin: p }); d.rooms.push(n); st.rid = n.id; } });
        focusName(); return;
      }
      const edge = edgeAt(sx, sy);
      if (edge) { st.drag = { kind: 'edge', edge, start: edge.horiz ? w.y : w.x, by: 0, solo: e.altKey }; return; }
      const r = roomAt(w.x, w.y);
      st.rid = r ? r.id : null; render();
      if (r) st.drag = { kind: 'move', start: [w.x, w.y], dx: 0, dy: 0 };
      else st.drag = { kind: 'pan', sx, sy, vx: st.view.x, vy: st.view.y };
      draw();
    });
    cv.addEventListener('pointermove', e => {
      const d = deck(); if (!d || !st.view) return; const { sx, sy } = pos(e), w = s2w(sx, sy), dr = st.drag;
      const hc = w.x >= 0 && w.y >= 0 && w.x < d.cols && w.y < d.rows ? cellAt(w.x, w.y, d) : null;
      if (String(hc) !== String(st.hover)) { st.hover = hc; if (!dr) draw(); }
      if (!dr) { const ed = edgeAt(sx, sy); cv.style.cursor = ed ? (ed.horiz ? 'ns-resize' : 'ew-resize') : st.tool === 'select' ? (roomAt(w.x, w.y) && canEdit() ? 'move' : 'grab') : 'crosshair'; return; }
      if (dr.kind === 'pan') { st.view.x = dr.vx - (sx - dr.sx) / st.view.z; st.view.y = dr.vy - (sy - dr.sy) / st.view.z; draw(); return; }
      if (dr.kind === 'rect') { const c = cellAt(w.x, w.y, d), x0 = Math.min(c[0], dr.start[0]), y0 = Math.min(c[1], dr.start[1]); dr.r = [x0, y0, Math.abs(c[0] - dr.start[0]) + 1, Math.abs(c[1] - dr.start[1]) + 1]; draw(); return; }
      if (dr.kind === 'move') {
        const dx = Math.round(w.x - dr.start[0]), dy = Math.round(w.y - dr.start[1]); if (dx === dr.dx && dy === dr.dy) return;
        dr.dx = dx; dr.dy = dy; const pv = JSON.parse(JSON.stringify(d.rooms)), r = pv.find(x => x.id === st.rid);
        r.rects.forEach(q => { q[0] += dx; q[1] += dy; }); if (r.pin) r.pin = [r.pin[0] + dx, r.pin[1] + dy];
        dr.ok = r.rects.every(q => q[0] >= 0 && q[1] >= 0 && q[0] + q[2] <= d.cols && q[1] + q[3] <= d.rows);
        dr.preview = dr.ok ? pv : null; draw(); return;
      }
      if (dr.kind === 'edge') {
        const by = Math.round((dr.edge.horiz ? w.y : w.x) - dr.start); if (by === dr.by) return; dr.by = by;
        const pv = { cols: d.cols, rows: d.rows, rooms: JSON.parse(JSON.stringify(d.rooms)) }, r = pv.rooms.find(x => x.id === st.rid);
        try { H.moveRectEdge(pv, r, dr.edge.idx, dr.edge.side, by, !dr.solo); dr.preview = pv.rooms; dr.ok = true; } catch { dr.ok = false; }
        draw();
      }
    });
    function pointerEnd() {
      const dr = st.drag; st.drag = null; const d = deck(); if (!dr || !d) return;
      if (dr.kind === 'rect') {
        const q = dr.r;
        if (st.tool === 'room') { change(() => { const n = newRoom(d); H.applyRoom(d, n, { rects: [q] }); d.rooms.push(n); st.rid = n.id; }); focusName(); }
        else { const r = room(); if (r) change(() => H.applyRoom(d, r, { addRects: [q] })); }
        return;
      }
      if (dr.kind === 'move' && (dr.dx || dr.dy) && dr.ok) { const r = room(); change(() => { r.rects.forEach(q => { q[0] += dr.dx; q[1] += dr.dy; }); if (r.pin) r.pin = [r.pin[0] + dr.dx, r.pin[1] + dr.dy]; }, true); render(); return; }
      if (dr.kind === 'edge' && dr.by && dr.ok) { const r = room(); change(() => H.moveRectEdge(d, r, dr.edge.idx, dr.edge.side, dr.by, !dr.solo)); return; }
      draw();
    }
    cv.addEventListener('pointerup', pointerEnd);
    cv.addEventListener('pointercancel', () => { st.drag = null; draw(); });
    cv.addEventListener('pointerleave', () => { st.hover = null; if (!st.drag) draw(); });
    function newRoom(d) { const T = L(); let n = d.rooms.length + 1; while (d.rooms.some(r => r.name === T.roomN(n))) n++; return { id: H.uid('rm'), name: T.roomN(n), color: H.COLORS[d.rooms.length % H.COLORS.length], rects: [], pin: null, description: '', furnishing: '', items: [], notes: '' }; }
    function focusName() { setTimeout(() => { const el = document.getElementById('hsRoomName'); if (el) { el.focus(); el.select(); } }, 30); }
    function key(e, typing) {
      if (app.mode() !== 'housing' || typing) return false;
      const k = e.key;
      if (k === 'Escape') { st.rid = null; st.drag = null; render(); draw(); return true; }
      if ((k === 'Delete' || k === 'Backspace') && room() && canEdit()) { e.preventDefault(); delRoom(); return true; }
      if (k.startsWith('Arrow') || k === 'PageUp' || k === 'PageDown') return true; // kein Jahreswechsel im Grundriss
      return false;
    }
    function delRoom() { const r = room(), d = deck(); if (!r || !confirm(L().delRoomQ(r.name))) return; change(() => { d.rooms = d.rooms.filter(x => x !== r); st.rid = null; }); }

    // ------------------------------------------------------------- Seitenleiste
    function setTool(t) { st.tool = t; render(); draw(); }
    function hint() {
      const T = L(), el = document.getElementById('hvHint'); if (!el) return;
      el.textContent = !canEdit() ? T.readOnly : st.tool === 'room' ? T.hRoom : st.tool === 'add' ? (room() ? T.hAdd : T.hAddNo) : st.tool === 'pin' ? T.hPin : T.hSel;
    }
    function toolbar() {
      const T = L(), tb = document.getElementById('hvTools'), d = deck();
      if (!d) { tb.innerHTML = ''; return; }
      const b = (id, label, title) => `<button data-ht="${id}" class="${st.tool === id ? 'active' : ''}" ${title ? `title="${esc(title)}"` : ''}>${label}</button>`;
      tb.innerHTML = `<div class="hv-row">${canEdit() ? b('select', T.tSel) + b('room', T.tRoom) + b('add', T.tAdd) + b('pin', T.tPin) : ''}<button id="hvFit" title="${esc(T.tFitT)}">${T.tFit}</button></div><div id="hvHint" class="hv-hint"></div>`;
      tb.querySelectorAll('[data-ht]').forEach(x => x.onclick = () => setTool(x.dataset.ht));
      document.getElementById('hvFit').onclick = fit; hint();
    }
    const opt = (v, label, sel) => `<option value="${esc(v)}" ${sel ? 'selected' : ''}>${esc(label)}</option>`;
    function render() {
      const box = document.getElementById('housing'), show = app.mode() === 'housing';
      box.hidden = !show; wrap.hidden = !show;
      if (!show) return;
      const T = L(), t = tl(), ed = canEdit(), ls = list(), h = cur();
      if (h) st.hid = h.id;
      if (!h) {
        box.innerHTML = `<h3>🏠 ${esc(T.tab)}</h3><p class="hint">${esc(T.none)}</p>${ed ? newForm() : `<div class="readonly-note">${esc(T.readOnly)}</div>`}`;
        wireNew(); toolbar(); resize(); draw(); return;
      }
      const d = deck(); st.did = d.id; const r = room();
      const chars = (t.characters || []).slice().sort((a, b) => a.name.localeCompare(b.name)), places = (t.objects || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      const dis = ed ? '' : 'disabled';
      let s = `<div class="hs-head"><select id="hsSel">${ls.map(x => opt(x.id, x.name + ' · ' + T.kinds[x.kind], x === h)).join('')}</select>${ed ? `<button id="hsNewBtn" title="${esc(T.create)}">＋</button>` : ''}</div>
        <div id="hsNewBox" hidden>${ed ? newForm() : ''}</div>
        <details class="hs-sec" ${st.openProps ? 'open' : ''} id="hsProps"><summary>${esc(T.props)}</summary>
          <label>${esc(T.name)}<input id="hsName" value="${esc(h.name)}" ${dis}></label>
          <label>${esc(T.kind)}<select id="hsKind" ${dis}>${H.KINDS.map(k => opt(k, T.kinds[k], k === h.kind)).join('')}</select></label>
          <label>${esc(T.owners)}<select id="hsOwners" multiple size="${Math.min(5, Math.max(2, chars.length))}" ${dis}>${chars.map(c => opt(c.id, c.name, h.owners.includes(c.id))).join('')}</select></label>
          <label>${esc(T.place)}<select id="hsPlace" ${dis}>${opt('', T.noPlace, !h.place)}${places.map(o => opt(o.id, o.name, o.id === h.place)).join('')}</select></label>
          <label>${esc(T.desc)}<textarea id="hsDesc" rows="3" ${dis}>${esc(h.description)}</textarea></label>
          ${ed ? `<button id="hsDel" class="danger">🗑 ${esc(T.del)}</button>` : ''}
        </details>
        <div class="hs-decks">${h.decks.map(x => `<button data-dk="${esc(x.id)}" class="${x === d ? 'active' : ''}">${esc(x.name)}</button>`).join('')}${ed ? `<button id="hsAddDeck">${T.addDeck}</button>` : ''}</div>
        <details class="hs-sec" ${st.openDeck ? 'open' : ''} id="hsDeckSec"><summary>${esc(T.deckSet)}</summary>
          <label>${esc(T.name)}<input id="dkName" value="${esc(d.name)}" ${dis}></label>
          <div class="hs-two"><label>${esc(T.cols)}<input id="dkCols" type="number" min="4" max="200" value="${d.cols}" ${dis}></label><label>${esc(T.rows)}<input id="dkRows" type="number" min="4" max="200" value="${d.rows}" ${dis}></label></div>
          <label>${esc(T.unit)}<input id="dkUnit" value="${esc(d.unit)}" placeholder="1 m" ${dis}></label>
          <div class="hs-sub">${esc(T.img)}</div>
          ${ed ? `<div class="row"><button id="dkImgBtn">${T.imgUp}</button>${d.image ? `<button id="dkImgDel" class="danger">${esc(T.imgDel)}</button>` : ''}<input type="file" id="dkImgFile" accept="image/*" hidden></div>` : ''}
          ${d.image ? `<label>${esc(T.opacity)}<input id="dkOp" type="range" min="0.1" max="1" step="0.05" value="${d.imageOpacity}" ${dis}></label>${ed ? `<button id="dkFit">${esc(T.fit)}</button>` : ''}` : ''}
          ${ed && h.decks.length > 1 ? `<button id="dkDel" class="danger">🗑 ${esc(T.delDeck)}</button>` : ''}
        </details>
        <div class="hs-sub">${esc(T.rooms)}</div>
        <div class="hs-rooms">${d.rooms.length ? d.rooms.map(x => `<button data-rm="${esc(x.id)}" class="${x === r ? 'active' : ''}"><span class="hs-chip" style="background:${esc(x.color)}"></span>${esc(x.name)}<span class="dim small">${x.rects.length ? H.areaOf(x) : '📍'}</span></button>`).join('') : `<p class="hint">${esc(T.noRooms)}</p>`}</div>`;
      if (r) {
        s += `<div class="hs-room">
          <div class="hs-two"><label>${esc(T.room)}<input id="hsRoomName" value="${esc(r.name)}" ${dis}></label><label>${esc(T.color)}<input id="hsRoomColor" type="color" value="${esc(r.color)}" ${dis}></label></div>
          <label>${esc(T.desc)}<textarea id="hsRoomDesc" rows="4" ${dis}>${esc(r.description || '')}</textarea></label>
          <label>${esc(T.furnishing)}<textarea id="hsRoomFurn" rows="3" ${dis}>${esc(r.furnishing || '')}</textarea></label>
          <div class="hs-sub">${esc(T.items)}</div>
          <div id="hsItems">${(r.items || []).map((it, i) => `<div class="hs-item"><input data-iname="${i}" value="${esc(it.name)}" placeholder="${esc(T.itemName)}" ${dis}><input data-inote="${i}" value="${esc(it.note || '')}" placeholder="${esc(T.itemNote)}" ${dis}>${ed ? `<button data-idel="${i}" class="fixed">✕</button>` : ''}</div>`).join('')}</div>
          ${ed ? `<button id="hsAddItem">${T.addItem}</button>` : ''}
          <label>${esc(T.notes)}<textarea id="hsRoomNotes" rows="2" ${dis}>${esc(r.notes || '')}</textarea></label>
          <div class="hs-sub">${esc(T.areas)}</div>
          ${r.rects.map((q, i) => `<div class="hs-area"><span class="small">${esc(T.area(q, i))}</span>${ed && (r.rects.length > 1 || r.pin) ? `<button data-adel="${i}" class="fixed">✕</button>` : ''}</div>`).join('')}
          ${r.pin ? `<div class="hs-area"><span class="small">📍 ${esc(T.pin)}: ${r.pin.join(', ')}</span>${ed && r.rects.length ? `<button id="hsPinDel" class="fixed">✕</button>` : ''}</div>` : ''}
          ${ed ? `<button id="hsRoomDel" class="danger">🗑 ${esc(T.delRoom)}</button>` : ''}
        </div>`;
      }
      box.innerHTML = s;
      wire(h, d, r);
      toolbar(); resize(); draw();
    }
    function newForm() {
      const T = L();
      return `<div class="hs-new"><input id="hsNewName" placeholder="${esc(T.newName)}" maxlength="100"><select id="hsNewKind">${H.KINDS.map(k => opt(k, T.kinds[k], k === (app.isSW() ? 'ship' : 'house'))).join('')}</select><button id="hsCreate" class="primary">${esc(T.create)}</button></div>`;
    }
    function wireNew() {
      const b = document.getElementById('hsCreate'); if (!b) return;
      const go = () => {
        const name = document.getElementById('hsNewName').value.trim(); if (!name) { document.getElementById('hsNewName').focus(); return; }
        const kind = document.getElementById('hsNewKind').value;
        change(() => { const h = H.newHousing({ name, kind }); h.decks[0].name = kind === 'ship' ? (app.lang() === 'en' ? 'Main deck' : 'Hauptdeck') : (app.lang() === 'en' ? 'Ground floor' : 'Erdgeschoss'); list().push(h); st.hid = h.id; st.did = h.decks[0].id; st.rid = null; st.fitted = null; });
      };
      b.onclick = go; document.getElementById('hsNewName').onkeydown = e => { if (e.key === 'Enter') go(); };
    }
    function wire(h, d, r) {
      const $ = id => document.getElementById(id), on = (id, ev, fn) => { const el = $(id); if (el) el[ev] = fn; };
      const T = L();
      on('hsSel', 'onchange', e => { st.hid = e.target.value; st.did = null; st.rid = null; st.fitted = null; render(); });
      on('hsNewBtn', 'onclick', () => { $('hsNewBox').hidden = !$('hsNewBox').hidden; wireNew(); if (!$('hsNewBox').hidden) $('hsNewName').focus(); });
      on('hsProps', 'ontoggle', e => { st.openProps = e.target.open; });
      on('hsDeckSec', 'ontoggle', e => { st.openDeck = e.target.open; });
      on('hsName', 'onchange', e => change(() => { h.name = e.target.value.trim().slice(0, 100) || h.name; }));
      on('hsKind', 'onchange', e => change(() => { h.kind = e.target.value; }));
      on('hsOwners', 'onchange', e => change(() => { h.owners = [...e.target.selectedOptions].map(o => o.value); }, true));
      on('hsPlace', 'onchange', e => change(() => { h.place = e.target.value; }, true));
      on('hsDesc', 'onchange', e => change(() => { h.description = e.target.value; }, true));
      on('hsDel', 'onclick', () => { if (!confirm(T.delQ(h.name))) return; change(() => { const t = tl(); t.housing = t.housing.filter(x => x !== h); st.hid = null; st.rid = null; st.fitted = null; }); });
      document.querySelectorAll('[data-dk]').forEach(b => b.onclick = () => { st.did = b.dataset.dk; st.rid = null; st.fitted = null; render(); });
      on('hsAddDeck', 'onclick', () => change(() => { const n = H.newDeck({ name: (app.lang() === 'en' ? 'Deck ' : 'Deck ') + (h.decks.length + 1), cols: d.cols, rows: d.rows, unit: d.unit }); h.decks.push(n); st.did = n.id; st.rid = null; st.fitted = null; }));
      on('dkName', 'onchange', e => change(() => { d.name = e.target.value.trim().slice(0, 100) || d.name; }));
      on('dkCols', 'onchange', e => change(() => { H.applyDeck(d, { cols: +e.target.value }); st.fitted = null; }));
      on('dkRows', 'onchange', e => change(() => { H.applyDeck(d, { rows: +e.target.value }); st.fitted = null; }));
      on('dkUnit', 'onchange', e => change(() => { d.unit = e.target.value.slice(0, 60); }, true));
      on('dkOp', 'oninput', e => { d.imageOpacity = +e.target.value; draw(); });
      on('dkOp', 'onchange', e => change(() => { d.imageOpacity = +e.target.value; }, true));
      on('dkImgBtn', 'onclick', () => $('dkImgFile').click());
      on('dkImgFile', 'onchange', async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        try {
          const src = await app.resizeImage(f, 2000, f.type === 'image/png' ? 'image/png' : 'image/jpeg');
          const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Bild')); i.src = src; });
          change(() => { H.setImage(d, { src, w: im.naturalWidth, h: im.naturalHeight }, true); st.fitted = null; });
        } catch (err) { app.toast(T.err + ': ' + err.message); }
      });
      on('dkImgDel', 'onclick', () => change(() => H.setImage(d, null)));
      on('dkFit', 'onclick', () => change(() => { H.setImage(d, d.image, true); st.fitted = null; }));
      on('dkDel', 'onclick', () => { if (!confirm(T.delDeckQ(d.name))) return; change(() => { h.decks = h.decks.filter(x => x !== d); st.did = null; st.rid = null; st.fitted = null; }); });
      document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { st.rid = st.rid === b.dataset.rm ? null : b.dataset.rm; render(); });
      if (!r) return;
      on('hsRoomName', 'onchange', e => change(() => H.applyRoom(d, r, { name: e.target.value })));
      on('hsRoomColor', 'onchange', e => change(() => H.applyRoom(d, r, { color: e.target.value })));
      on('hsRoomDesc', 'onchange', e => change(() => { r.description = e.target.value; }, true));
      on('hsRoomFurn', 'onchange', e => change(() => { r.furnishing = e.target.value; }, true));
      on('hsRoomNotes', 'onchange', e => change(() => { r.notes = e.target.value; }, true));
      document.querySelectorAll('[data-iname]').forEach(i => i.onchange = () => change(() => { r.items[+i.dataset.iname].name = i.value; }, true));
      document.querySelectorAll('[data-inote]').forEach(i => i.onchange = () => change(() => { r.items[+i.dataset.inote].note = i.value; }, true));
      document.querySelectorAll('[data-idel]').forEach(b => b.onclick = () => change(() => { r.items.splice(+b.dataset.idel, 1); }));
      on('hsAddItem', 'onclick', () => { change(() => { r.items = r.items || []; r.items.push({ name: '', note: '' }); }); setTimeout(() => { const ins = document.querySelectorAll('[data-iname]'); if (ins.length) ins[ins.length - 1].focus(); }, 30); });
      document.querySelectorAll('[data-adel]').forEach(b => b.onclick = () => change(() => { r.rects.splice(+b.dataset.adel, 1); }));
      on('hsPinDel', 'onclick', () => change(() => { r.pin = null; }));
      on('hsRoomDel', 'onclick', delRoom);
    }
    window.addEventListener('resize', () => { if (!wrap.hidden) { resize(); draw(); } });
    return { render, draw, key, reset: () => { st.hid = null; st.did = null; st.rid = null; st.fitted = null; } };
  };
})();
