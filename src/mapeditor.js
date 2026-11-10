/* Ascandir RP-Manager – Zeichenfläche für Fantasy-Karten
   Verwaltet die Karten (data/maps/*.json bzw. localStorage), zeichnet die aktive Karte in die Kartenansicht
   und stellt im Reiter „Zeichnen“ den Editor bereit (Werkzeuge, Ebenen, Stil, Rückgängig, Export).
   Datenmodell, Prüfung und Darstellung kommen aus fantasymap.js (IAM_FMAP). */
(function () {
  'use strict';
  const F = window.IAM_FMAP;
  if (!F) return;

  const TXT = {
    de: {
      tab: 'Zeichnen', noMap: 'Für diese Welt gibt es noch keine gezeichnete Karte.', create: 'Neue Karte', createFirst: 'Karte anlegen',
      onlyCustom: 'Karten können für eigene Welten gezeichnet werden. Lege oben über ⚙ eine eigene Welt an.',
      readOnly: 'Nur ansehen – keine Bearbeitungsrechte für diese Karte.', map: 'Karte', worldMap: 'Weltkarte', tlMap: 'nur Zeitlinie',
      settings: 'Karteneinstellungen', del: 'Karte löschen', exportPng: 'PNG', exportSvg: 'SVG', export: 'Export',
      tools: 'Werkzeuge', select: 'Auswählen', drawT: 'Zeichnen', labelT: 'Text', pan: 'Verschieben',
      undo: 'Rückgängig (Strg+Z)', redo: 'Wiederholen (Strg+Y)', grid: 'Raster', snap: 'Am Raster ausrichten', fit: 'Ganze Karte',
      freehand: 'Freihand', geom: { point: 'Punkt', line: 'Linie', polygon: 'Fläche', group: 'Symbolkette' },
      palette: 'Symbole & Formen', layers: 'Ebenen', legend: 'Legende', sel: 'Auswahl', none: 'Nichts ausgewählt. Klicke ein Objekt an (Umschalt = mehrere, Ziehen auf leerer Fläche = Rahmen).',
      selMany: n => `${n} Objekte ausgewählt`, name: 'Name', type: 'Typ', layer: 'Ebene', place: 'Verknüpfter Ort', noPlace: '– kein Ort –',
      label: 'Beschriftung', text: 'Text', size: 'Größe', color: 'Farbe', align: 'Ausrichtung', italic: 'kursiv', caps: 'Versalien', angle: 'Winkel',
      style: 'Stil', fill: 'Füllung', stroke: 'Linie', width: 'Linienstärke', dash: 'Strich', opacity: 'Deckkraft', symSize: 'Symbolgröße', density: 'Dichte', smooth: 'geglättet', noFill: 'keine',
      front: 'Nach vorne', back: 'Nach hinten', delete: 'Löschen', bigger: 'Größer', smaller: 'Kleiner', reset: 'Stil zurücksetzen',
      hintPoly: 'Klicken = Punkt setzen · Doppelklick/Enter = fertig · Rücktaste = letzten Punkt entfernen · Esc = abbrechen',
      hintFree: 'Mit gedrückter Maustaste zeichnen, loslassen = fertig', hintPoint: 'Klicken = setzen', hintGroup: 'Klicken oder ziehen = Symbole setzen (ein Zug = eine Kette)',
      hintSelect: 'Klicken = auswählen · Ziehen = verschieben · Eckpunkte ziehen = Form ändern (Alt+Klick löscht Punkt) · Griff unten rechts = skalieren · Entf = löschen',
      hintLabel: 'Klicken = Beschriftung setzen', askLabel: 'Beschriftung', saved: 'Karte gespeichert', saveFail: m => 'Karte nicht gespeichert: ' + m,
      conflictT: 'Karte wurde woanders geändert', conflict: 'Die Karte wurde inzwischen an anderer Stelle (z. B. durch ChatGPT oder eine zweite Person) geändert.',
      reload: 'Neu laden (meine letzten Änderungen verwerfen)', keepMine: 'Meine Version behalten', extChanged: n => `Karte „${n}“ wurde aktualisiert`,
      delQ: n => `Karte „${n}“ wirklich löschen? Das kann nicht rückgängig gemacht werden.\nZur Bestätigung den Namen eingeben:`, deleted: n => `Karte „${n}“ gelöscht`,
      mName: 'Name', mScope: 'Gilt für', mStyle: 'Stil', mW: 'Breite', mH: 'Höhe', mBg: 'Meer/Hintergrund', mTransparent: 'durchsichtig (Weltbild/Pergament darunter sichtbar)',
      mBorder: 'Zierrahmen', mPrimary: 'Hauptkarte der Welt', styles: { parchment: 'Pergament', ink: 'Tusche' }, nameTaken: 'Name ist schon vergeben',
      err: 'Fehler', confirmMany: n => `${n} Objekte löschen?`, scale: 'Skalieren', exported: 'Export gestartet', pngScale: 'Auflösung',
      vis: 'sichtbar', lock: 'gesperrt', count: n => `${n} Obj.`, linkHint: 'Verknüpft das Objekt mit einem Ort der Zeitlinie (für ChatGPT & Suche).',
      assets: 'Eigene Bilder', upload: 'Bild hochladen', uploading: 'Lade hoch…', assetHint: 'PNG mit Transparenz eignet sich für eigene Symbole. Bild anklicken, dann auf die Karte klicken. ChatGPT kann Bilder per upload_map_asset hinzufügen.', hintImage: 'Klicken = Bild setzen', asset: 'Bild', rotation: 'Drehung', imgWidth: 'Breite', delAsset: 'Bild entfernen', assetUsed: 'Das Bild wird noch verwendet.', noAssets: 'Noch keine eigenen Bilder.',
      types: { image: 'Bild', land: 'Land / Küste', island: 'Insel', area: 'Gebiet', mountains: 'Gebirge', mountain: 'Berg', hills: 'Hügel', lake: 'See', river: 'Fluss', forest: 'Wald', swamp: 'Sumpf', desert: 'Wüste', road: 'Straße', path: 'Pfad', line: 'Linie', border: 'Grenze', region: 'Reich / Region', city: 'Stadt', town: 'Kleinstadt', village: 'Dorf', fortress: 'Festung', tower: 'Turm', ruin: 'Ruine', label: 'Beschriftung', compass: 'Windrose', ship: 'Schiff', serpent: 'Seeschlange', cartouche: 'Titelkartusche', symbol: 'Symbol' },
      layerNames: { terrain: 'Gelände', water: 'Wasser', vegetation: 'Vegetation', routes: 'Wege', borders: 'Grenzen', places: 'Orte', labels: 'Beschriftungen', decor: 'Dekoration' },
      aligns: { left: 'links', center: 'Mitte', right: 'rechts' }, dashes: { solid: 'durchgezogen', dashed: 'gestrichelt', dotted: 'gepunktet', dashdot: 'Strich-Punkt', long: 'lang' }
    },
    en: {
      tab: 'Draw', noMap: 'This world has no drawn map yet.', create: 'New map', createFirst: 'Create map',
      onlyCustom: 'Maps can be drawn for your own worlds. Create a world via ⚙ at the top.',
      readOnly: 'View only – no permission to edit this map.', map: 'Map', worldMap: 'World map', tlMap: 'timeline only',
      settings: 'Map settings', del: 'Delete map', exportPng: 'PNG', exportSvg: 'SVG', export: 'Export',
      tools: 'Tools', select: 'Select', drawT: 'Draw', labelT: 'Text', pan: 'Pan',
      undo: 'Undo (Ctrl+Z)', redo: 'Redo (Ctrl+Y)', grid: 'Grid', snap: 'Snap to grid', fit: 'Whole map',
      freehand: 'Freehand', geom: { point: 'Point', line: 'Line', polygon: 'Area', group: 'Symbol chain' },
      palette: 'Symbols & shapes', layers: 'Layers', legend: 'Legend', sel: 'Selection', none: 'Nothing selected. Click an object (Shift = several, drag on empty space = box).',
      selMany: n => `${n} objects selected`, name: 'Name', type: 'Type', layer: 'Layer', place: 'Linked place', noPlace: '– no place –',
      label: 'Label', text: 'Text', size: 'Size', color: 'Color', align: 'Alignment', italic: 'italic', caps: 'caps', angle: 'Angle',
      style: 'Style', fill: 'Fill', stroke: 'Line', width: 'Line width', dash: 'Dash', opacity: 'Opacity', symSize: 'Symbol size', density: 'Density', smooth: 'smoothed', noFill: 'none',
      front: 'Bring to front', back: 'Send to back', delete: 'Delete', bigger: 'Bigger', smaller: 'Smaller', reset: 'Reset style',
      hintPoly: 'Click = add point · double-click/Enter = finish · Backspace = remove last point · Esc = cancel',
      hintFree: 'Hold the mouse button and draw, release = done', hintPoint: 'Click = place', hintGroup: 'Click or drag = place symbols (one stroke = one chain)',
      hintSelect: 'Click = select · drag = move · drag vertices = reshape (Alt+click removes a vertex) · handle bottom right = scale · Del = delete',
      hintLabel: 'Click = place label', askLabel: 'Label', saved: 'Map saved', saveFail: m => 'Map not saved: ' + m,
      conflictT: 'Map changed elsewhere', conflict: 'The map was changed elsewhere in the meantime (e.g. by ChatGPT or another person).',
      reload: 'Reload (discard my latest changes)', keepMine: 'Keep my version', extChanged: n => `Map “${n}” was updated`,
      delQ: n => `Really delete map “${n}”? This cannot be undone.\nType the name to confirm:`, deleted: n => `Map “${n}” deleted`,
      mName: 'Name', mScope: 'Applies to', mStyle: 'Style', mW: 'Width', mH: 'Height', mBg: 'Sea/background', mTransparent: 'transparent (world image/parchment shows through)',
      mBorder: 'Decorative frame', mPrimary: 'Main map of the world', styles: { parchment: 'Parchment', ink: 'Ink' }, nameTaken: 'Name already taken',
      err: 'Error', confirmMany: n => `Delete ${n} objects?`, scale: 'Scale', exported: 'Export started', pngScale: 'Resolution',
      vis: 'visible', lock: 'locked', count: n => `${n} obj.`, linkHint: 'Links the object to a place of the timeline (for ChatGPT & search).',
      assets: 'Own images', upload: 'Upload image', uploading: 'Uploading…', assetHint: 'Transparent PNGs work well as custom symbols. Click an image, then click on the map. ChatGPT can add images via upload_map_asset.', hintImage: 'Click = place image', asset: 'Image', rotation: 'Rotation', imgWidth: 'Width', delAsset: 'Remove image', assetUsed: 'The image is still in use.', noAssets: 'No own images yet.',
      types: { image: 'Image', land: 'Land / coast', island: 'Island', area: 'Area', mountains: 'Mountains', mountain: 'Mountain', hills: 'Hills', lake: 'Lake', river: 'River', forest: 'Forest', swamp: 'Swamp', desert: 'Desert', road: 'Road', path: 'Path', line: 'Line', border: 'Border', region: 'Realm / region', city: 'City', town: 'Town', village: 'Village', fortress: 'Fortress', tower: 'Tower', ruin: 'Ruin', label: 'Label', compass: 'Compass rose', ship: 'Ship', serpent: 'Sea serpent', cartouche: 'Title cartouche', symbol: 'Symbol' },
      layerNames: { terrain: 'Terrain', water: 'Water', vegetation: 'Vegetation', routes: 'Routes', borders: 'Borders', places: 'Places', labels: 'Labels', decor: 'Decoration' },
      aligns: { left: 'left', center: 'center', right: 'right' }, dashes: { solid: 'solid', dashed: 'dashed', dotted: 'dotted', dashdot: 'dash-dot', long: 'long' }
    }
  };
  const DEFAULT_GEOM = { mountains: 'group', hills: 'group', forest: 'polygon', border: 'line' };
  const SAVE_DELAY = 1500;

  window.IAM_MAPEDITOR = function create(app) {
    const L = () => TXT[app.lang()] || TXT.de;
    const esc = app.esc;
    const st = {
      maps: [], chosen: loadJSON('iam.mapSel.v1', {}), ver: 1,
      tool: 'select', drawType: 'land', asset: null, geom: {}, freehand: false, grid: false, snap: false,
      sel: [], draft: null, drag: null, hoverPt: null,
      undo: [], redo: [], dirty: new Set(), saveTimer: null, baseRev: {}, lastWritten: {}, saving: false,
      primCache: new Map(), cacheFor: null, prims: null, pathCache: new WeakMap()
    };
    function loadJSON(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } }
    const FS = app.FS;

    // ------------------------------------------------------------- Laden & Speichern
    async function load() {
      st.maps = [];
      if (FS) {
        let list = []; try { list = await FS.list('maps'); } catch (e) { console.warn('maps', e); }
        for (const { file, content, editable, admin } of list) {
          try {
            const m = F.normalizeMap(JSON.parse(content)); m._file = file;
            if (editable === false) m._editable = false; if (admin === false) m._admin = false;
            st.lastWritten[file] = content; st.baseRev[m.id] = m.rev; st.maps.push(m);
          } catch (e) { console.warn('Karte ' + file + ': ' + e.message); }
        }
      } else {
        for (const raw of loadJSON('iam.maps.v1', [])) { try { const m = F.normalizeMap(raw); st.baseRev[m.id] = m.rev; st.maps.push(m); } catch { } }
      }
      changed();
    }
    const fileOf = m => m._file || (m._file = m.id + '.json');
    const serialize = m => { const c = Object.assign({}, m); delete c._file; delete c._editable; delete c._admin; c.rev = st.baseRev[m.id] || 1; return JSON.stringify(c); };
    function scheduleSave(m) { st.dirty.add(m.id); clearTimeout(st.saveTimer); st.saveTimer = setTimeout(flush, SAVE_DELAY); }
    async function flush() {
      clearTimeout(st.saveTimer); st.saveTimer = null;
      if (!FS) {
        try { localStorage.setItem('iam.maps.v1', JSON.stringify(st.maps.map(m => JSON.parse(serialize(m))))); } catch (e) { app.toast(L().saveFail(e.message)); }
        st.dirty.clear(); return;
      }
      if (st.saving) { st.saveTimer = setTimeout(flush, 400); return; }
      st.saving = true;
      try {
        for (const id of [...st.dirty]) {
          const m = st.maps.find(x => x.id === id); st.dirty.delete(id); if (!m) continue;
          const content = serialize(m), file = fileOf(m);
          if (st.lastWritten[file] === content) continue;
          st.lastWritten[file] = content;
          try {
            const r = await FS.save('maps', file, content);
            st.baseRev[m.id] = r && r.rev ? r.rev : (st.baseRev[m.id] || 1) + (FS.server ? 0 : 1); m.rev = st.baseRev[m.id];
          } catch (e) {
            delete st.lastWritten[file];
            if (e.status === 409 && e.body && e.body.conflict) conflict(m, e.body.rev);
            else { st.dirty.add(id); app.toast(L().saveFail(e.message)); }
          }
        }
      } finally { st.saving = false; }
    }
    function conflict(m, serverRev) {
      const T = L();
      app.modal(T.conflictT, `<p>${esc(T.conflict)}</p><label class="chk"><input type="radio" name="mcf" value="reload" checked> ${esc(T.reload)}</label><label class="chk"><input type="radio" name="mcf" value="keep"> ${esc(T.keepMine)}</label>`, () => {
        const v = (document.querySelector('input[name=mcf]:checked') || {}).value;
        if (v === 'keep') { st.baseRev[m.id] = serverRev; scheduleSave(m); flush(); } else reloadMap(m._file || m.id + '.json', true);
        return true;
      }, { noCancel: true });
    }
    async function reloadMap(file, force) {
      let content = null; try { content = await FS.read('maps', file); } catch { return; }
      const i = st.maps.findIndex(x => fileOf(x) === file);
      if (content == null) { if (i >= 0) { st.maps.splice(i, 1); st.sel = []; changed(); } return; }
      let m; try { m = F.normalizeMap(JSON.parse(content)); } catch (e) { console.warn(e); return; }
      const old = i >= 0 ? st.maps[i] : null;
      if (old && !force && m.rev <= (st.baseRev[m.id] || 0)) { st.lastWritten[file] = content; return; } // eigene Speicherung
      if (old && !force && st.dirty.has(m.id)) { conflict(old, m.rev); return; }
      m._file = file; if (old) { m._editable = old._editable; m._admin = old._admin; }
      st.lastWritten[file] = content; st.baseRev[m.id] = m.rev;
      if (i >= 0) st.maps[i] = m; else st.maps.push(m);
      st.sel = st.sel.filter(id => m.features.some(f => f.id === id));
      if (active() && active().id === m.id) { st.undo = []; st.redo = []; }
      changed(); if (old) app.toast(L().extChanged(m.name));
    }
    function external(file) { if (!FS) return; if (st.saving) { setTimeout(() => external(file), 600); return; } reloadMap(file, false); }

    // ------------------------------------------------------------- Aktive Karte
    function mapsHere() {
      const w = app.world(), tl = app.tl(); if (!w || w.builtin) return [];
      return st.maps.filter(m => m.world === w.id && (!m.timeline || (tl && m.timeline === tl.id)));
    }
    function active() {
      const list = mapsHere(); if (!list.length) return null;
      const w = app.world(), tl = app.tl(), ch = list.find(m => m.id === st.chosen[w.id]);
      if (ch) return ch;
      return (tl && list.find(m => m.timeline === tl.id)) || list.find(m => m.primary && !m.timeline) || list.find(m => !m.timeline) || list[0];
    }
    function choose(id) { const w = app.world(); st.chosen[w.id] = id; try { localStorage.setItem('iam.mapSel.v1', JSON.stringify(st.chosen)); } catch { } st.sel = []; st.draft = null; st.undo = []; st.redo = []; changed(); }
    const canEdit = m => !!m && m._editable !== false && app.canEditMap(m);
    const canAdmin = m => !!m && m._admin !== false && app.canAdminMap(m);
    const opaque = m => !(m.background === 'none' || m.background === 'transparent');
    function changed(noPanel) { st.ver++; st.prims = null; app.redraw(); if (!noPanel && app.mode() === 'draw') render(); }

    // ------------------------------------------------------------- Darstellung
    // Primitive pro Objekt zwischenspeichern: beim Ziehen wird nur das geänderte Objekt neu aufgebaut
    function primsOf(m) {
      if (st.prims && st.cacheFor === m) return st.prims;
      const pal = JSON.stringify([m.style, m.palette, m.background, m.layers, m.assets]);
      const order = m.features.map((f, i) => ({ f, i })).sort((a, b) => F.LAYERS.indexOf(a.f.layer) - F.LAYERS.indexOf(b.f.layer) || a.i - b.i);
      const out = [], next = new Map(), hidden = new Set(F.LAYERS.filter(l => m.layers[l] && m.layers[l].visible === false));
      for (const { f } of order) {
        if (hidden.has(f.layer)) continue;
        const key = pal + JSON.stringify(f);
        let p = st.primCache.get(key);
        if (!p) p = F.build(Object.assign({}, m, { features: [f] }));
        next.set(key, p); for (const x of p) out.push(x);
      }
      st.primCache = next; st.cacheFor = m; st.prims = out;
      return out;
    }
    const imgCache = new Map();
    function imgOf(src) {
      let im = imgCache.get(src);
      if (!im) { im = new Image(); im.onload = () => { st.ver++; app.redraw(); }; im.src = src; imgCache.set(src, im); if (imgCache.size > 300) imgCache.delete(imgCache.keys().next().value); }
      return im;
    }
    const loadImg = src => { const im = imgOf(src); return im.complete && im.naturalWidth ? im : null; };
    const whenLoaded = srcs => Promise.all(srcs.map(src => new Promise(r => { const im = imgOf(src); if (im.complete) r(); else { im.addEventListener('load', r); im.addEventListener('error', r); } })));
    function drawMap(ctx, m, opt) {
      const bg = F.backgroundPrims(m);
      F.drawPrims(ctx, bg.filter(p => p.layer === '_bg'), st.pathCache);
      F.drawPrims(ctx, opt && opt.prims || primsOf(m), st.pathCache, loadImg);
      F.drawPrims(ctx, bg.filter(p => p.layer === '_frame'), st.pathCache);
    }
    function drawBase(ctx) { const m = active(); if (!m) return; app.worldTransform(ctx); ctx.save(); if (st.preview && st.preview.id === m.id) drawMap(ctx, st.preview, { prims: st.previewPrims }); else drawMap(ctx, m); ctx.restore(); }

    // ------------------------------------------------------------- Änderungen
    function commit(ops, keepSel) {
      const m = active(); if (!m || !canEdit(m)) return null;
      let r; try { r = F.applyOps(m, ops); } catch (e) { app.toast(L().err + ': ' + e.message); return null; }
      st.undo.push(JSON.stringify(m)); if (st.undo.length > 80) st.undo.shift(); st.redo = [];
      replace(m, r.map);
      if (!keepSel) st.sel = st.sel.filter(id => r.map.features.some(f => f.id === id));
      changed(); return r.result;
    }
    function replace(m, n) {
      n._file = m._file; n._editable = m._editable; n._admin = m._admin; n.rev = st.baseRev[m.id] || m.rev;
      const i = st.maps.indexOf(m); if (i >= 0) st.maps[i] = n; else st.maps.push(n);
      scheduleSave(n);
    }
    function undoRedo(fromStack, toStack) {
      const m = active(); if (!m || !fromStack.length || !canEdit(m)) return;
      const prev = JSON.parse(fromStack.pop()); toStack.push(JSON.stringify(m));
      prev.updated = new Date().toISOString(); replace(m, prev);
      st.sel = st.sel.filter(id => prev.features.some(f => f.id === id)); changed();
    }
    const undo = () => undoRedo(st.undo, st.redo), redo = () => undoRedo(st.redo, st.undo);
    function saveMeta(m, meta) {
      let n; try { n = F.normMeta(m, meta); } catch (e) { app.toast(L().err + ': ' + e.message); return false; }
      st.undo.push(JSON.stringify(m)); st.redo = []; n.updated = new Date().toISOString();
      if (n.primary && !n.timeline) for (const o of st.maps) if (o !== m && o.world === n.world && !o.timeline && o.primary) { o.primary = false; scheduleSave(o); }
      replace(m, n); changed(); return true;
    }

    // ------------------------------------------------------------- Karten anlegen / Einstellungen / löschen
    function mapForm(m) {
      const T = L(), w = app.world(), tl = app.tl(), box = app.worldBox(w);
      const bg = m ? (m.background || F.PRESETS[m.style].sea) : F.PRESETS.parchment.sea, tr = m ? !opaque(m) : false;
      return `<div class="form-grid">
        <label>${esc(T.mName)}<input id="mfName" value="${esc(m ? m.name : (w.name + ' – ' + T.map))}" maxlength="100"></label>
        ${m ? '' : `<label>${esc(T.mScope)}<select id="mfScope"><option value="world">${esc(T.worldMap)} (${esc(w.name)})</option>${tl && !tl.readonly && app.canEditTlMap(tl) ? `<option value="tl">${esc(T.tlMap)}: ${esc(tl.name)}</option>` : ''}</select></label>`}
        <label>${esc(T.mStyle)}<select id="mfStyle">${Object.keys(F.PRESETS).map(k => `<option value="${k}" ${(m ? m.style : 'parchment') === k ? 'selected' : ''}>${esc(T.styles[k] || k)}</option>`).join('')}</select></label>
        <label>${esc(T.mW)}<input id="mfW" type="number" min="100" max="50000" value="${m ? m.width : box.w}"></label>
        <label>${esc(T.mH)}<input id="mfH" type="number" min="100" max="50000" value="${m ? m.height : box.h}"></label>
        <label>${esc(T.mBg)}<span class="row"><input id="mfBg" type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(bg) ? bg : '#cdd7cc')}"> <label class="chk"><input id="mfTr" type="checkbox" ${tr ? 'checked' : ''}> ${esc(T.mTransparent)}</label></span></label>
        <label class="chk"><input id="mfBorder" type="checkbox" ${!m || m.border ? 'checked' : ''}> ${esc(T.mBorder)}</label>
        <label class="chk"><input id="mfPrimary" type="checkbox" ${m ? (m.primary ? 'checked' : '') : (!st.maps.some(x => x.world === w.id && !x.timeline) ? 'checked' : '')}> ${esc(T.mPrimary)}</label>
      </div>`;
    }
    const val = id => document.getElementById(id);
    function formMeta() {
      return { name: val('mfName').value.trim(), style: val('mfStyle').value, width: +val('mfW').value, height: +val('mfH').value,
        background: val('mfTr').checked ? 'transparent' : val('mfBg').value, border: val('mfBorder').checked, primary: val('mfPrimary').checked };
    }
    function newMap() {
      const T = L(), w = app.world();
      app.modal(T.create, mapForm(null), () => {
        const meta = formMeta(), tl = val('mfScope').value === 'tl' ? app.tl() : null;
        if (!meta.name) throw new Error(T.mName + '?');
        if (st.maps.some(x => x.world === w.id && (x.timeline || null) === (tl ? tl.id : null) && x.name.toLowerCase() === meta.name.toLowerCase())) throw new Error(T.nameTaken);
        const m = F.createMap(Object.assign({}, meta, { world: w.id, timeline: tl ? tl.id : null, primary: tl ? false : meta.primary }));
        if (meta.background) m.background = meta.background;
        if (m.primary) for (const o of st.maps) if (o.world === w.id && !o.timeline && o.primary) { o.primary = false; scheduleSave(o); }
        st.baseRev[m.id] = 1; st.maps.push(m); scheduleSave(m); flush();
        choose(m.id); app.fit(); return true;
      });
    }
    function editMap() {
      const m = active(); if (!m) return; const T = L();
      app.modal(T.settings, mapForm(m), () => {
        const meta = formMeta(); if (!meta.name) throw new Error(T.mName + '?');
        if (st.maps.some(x => x !== m && x.world === m.world && (x.timeline || null) === (m.timeline || null) && x.name.toLowerCase() === meta.name.toLowerCase())) throw new Error(T.nameTaken);
        if (m.timeline) meta.primary = false;
        return saveMeta(m, meta);
      });
    }
    function deleteMap() {
      const m = active(); if (!m || !canAdmin(m)) return; const T = L();
      app.modal(T.del, `<p style="white-space:pre-line">${esc(T.delQ(m.name))}</p><input id="mdName" autocomplete="off">`, () => {
        if (val('mdName').value.trim() !== m.name) return false;
        doDelete(m); return true;
      }, { ok: T.delete });
      setTimeout(() => val('mdName') && val('mdName').focus(), 0);
    }
    async function doDelete(m) {
      const T = L();
      st.maps = st.maps.filter(x => x !== m); st.dirty.delete(m.id); st.sel = [];
      if (FS) { delete st.lastWritten[fileOf(m)]; try { await FS.remove('maps', fileOf(m)); } catch (e) { app.toast(L().saveFail(e.message)); } } else flush();
      changed(); app.toast(T.deleted(m.name));
    }
    // Welt gelöscht -> deren Karten mitlöschen (bei Server: nur, was man darf)
    function removeWorld(worldId) {
      for (const m of st.maps.filter(x => x.world === worldId)) { if (FS) { if (canAdmin(m)) FS.remove('maps', fileOf(m)).catch(() => { }); } }
      st.maps = st.maps.filter(x => x.world !== worldId); if (!FS) flush(); changed(true);
    }

    // ------------------------------------------------------------- Export
    function download(blob, name) {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }
    const fname = m => (String(m.name).normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'karte');
    const toDataUrl = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
    async function exportSvg() {
      const m = active(); if (!m) return;
      const emb = {}; // Bilder einbetten, damit die SVG-Datei für sich allein vollständig ist
      for (const a of m.assets || []) { if (a.src.startsWith('data:')) { emb[a.src] = a.src; continue; } try { emb[a.src] = await toDataUrl(await (await fetch(a.src)).blob()); } catch { emb[a.src] = a.src; } }
      download(new Blob([F.toSVG(m, { resolveImage: src => emb[src] || src })], { type: 'image/svg+xml' }), fname(m) + '.svg');
    }
    function exportPng(scale) {
      const m = active(); if (!m) return;
      const k = Math.max(0.25, Math.min(4, scale || 1)), maxPx = 16000;
      const s = Math.min(k, maxPx / m.width, maxPx / m.height);
      const c = document.createElement('canvas'); c.width = Math.round(m.width * s); c.height = Math.round(m.height * s);
      const x = c.getContext('2d'); x.setTransform(s, 0, 0, s, 0, 0);
      whenLoaded((m.assets || []).map(a => a.src)).then(() => { drawMap(x, m, { prims: F.build(m) }); c.toBlob(b => { if (b) download(b, fname(m) + '.png'); else app.toast(L().err); }, 'image/png'); });
    }
    // ------------------------------------------------------------- Eigene Bilder (Assets)
    const readFile = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Datei nicht lesbar')); r.readAsDataURL(f); });
    const loadDims = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('kein unterstütztes Bild')); im.src = src; });
    async function shrink(dataUrl, max, mime) {
      const im = await loadDims(dataUrl); let w = im.naturalWidth, h = im.naturalHeight;
      if (Math.max(w, h) <= max) return { src: dataUrl, w, h };
      const k = max / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
      return { src: c.toDataURL(mime), w, h };
    }
    async function uploadAsset(file) {
      const T = L(), m = active(); if (!m || !canEdit(m) || !file) return;
      if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { app.toast(T.err + ': PNG, JPEG, WebP, GIF'); return; }
      app.toast(T.uploading);
      try {
        const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        let img = await shrink(await readFile(file), FS && FS.server ? 2048 : 1024, mime);
        if (FS && FS.server) {
          const r = await fetch('api/v1/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: img.src }) });
          const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText);
          img = { src: j.src, w: j.w, h: j.h };
        }
        const res = commit([{ op: 'addAsset', asset: { name: file.name.replace(/\.[^.]+$/, '').slice(0, 100) || 'Bild', src: img.src, w: img.w, h: img.h } }]);
        if (res && res.assetsAdded) { st.asset = res.assetsAdded[0]; setTool('draw', 'image'); }
      } catch (e) { app.toast(T.err + ': ' + e.message); }
    }

    // ------------------------------------------------------------- Eingabe
    const z = () => app.view().z;
    const snapPt = p => st.snap ? [Math.round(p[0] / 25) * 25, Math.round(p[1] / 25) * 25] : [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
    const geomOf = type => { const g = F.TYPES[type].geoms; return g.includes(st.geom[type]) ? st.geom[type] : (DEFAULT_GEOM[type] && g.includes(DEFAULT_GEOM[type]) ? DEFAULT_GEOM[type] : g[0]); };
    function hit(wx, wy) {
      const m = active(); if (!m) return null; const tol = 6 / z();
      for (let i = m.features.length - 1; i >= 0; i--) {
        const f = m.features[i], ly = m.layers[f.layer] || {};
        if (ly.visible === false || ly.locked) continue;
        if (F.featureDistance(f, wx, wy, m) <= tol) return f;
      }
      return null;
    }
    const selFeatures = () => { const m = active(); return m ? m.features.filter(f => st.sel.includes(f.id)) : []; };
    function selBBox() {
      const m = active(), fs = selFeatures(); if (!fs.length) return null;
      const b = [Infinity, Infinity, -Infinity, -Infinity];
      for (const f of fs) { const x = F.featureBBox(f, m); b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[2]); b[3] = Math.max(b[3], x[3]); }
      return b;
    }
    function vertices(f) { if (!f) return []; const g = f.geometry; if (g.type === 'polygon') return g.coordinates.flatMap((r, ri) => r.map((p, pi) => ({ p, ri, pi }))); if (g.type === 'point') return []; return g.coordinates.map((p, pi) => ({ p, ri: -1, pi })); }
    function vertexAt(sx, sy) {
      if (st.sel.length !== 1) return null; const f = selFeatures()[0];
      for (const v of vertices(f)) { const s = app.w2s(v.p[0], v.p[1]); if (Math.hypot(s.x - sx, s.y - sy) < 7) return Object.assign({ f }, v); }
      return null;
    }
    function scaleHandleAt(sx, sy) { const b = selBBox(); if (!b || (b[2] - b[0]) * z() < 36 && (b[3] - b[1]) * z() < 36) return false; const s = app.w2s(b[2], b[3]); return Math.abs(s.x - sx) < 8 && Math.abs(s.y - sy) < 8; }
    // Ziehen: Vorschau in einer Kopie der Karte (nur geänderte Objekte werden neu aufgebaut), gespeichert wird erst beim Loslassen
    function previewMap(fn) {
      const m = active(), cp = Object.assign({}, m, { features: m.features.map(f => st.sel.includes(f.id) || (st.drag && st.drag.fid === f.id) ? fn(f) : f) });
      st.preview = cp; st.previewPrims = primsOf(cp); st.ver++; app.redraw();
    }
    function pointerDown(e, sx, sy, w) {
      const m = active(); if (!m || !canEdit(m) || e.button !== 0) return false;
      const p = snapPt([w.x, w.y]);
      if (st.tool === 'select') {
        const v = vertexAt(sx, sy);
        if (v) {
          if (e.altKey) { removeVertex(v); return true; }
          st.drag = { kind: 'vertex', v, fid: v.f.id, start: p, cur: p }; return true;
        }
        if (scaleHandleAt(sx, sy)) { const b = selBBox(); st.drag = { kind: 'scale', origin: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], d0: Math.max(1, Math.hypot(w.x - (b[0] + b[2]) / 2, w.y - (b[1] + b[3]) / 2)), k: 1 }; return true; }
        const f = hit(w.x, w.y);
        if (f) {
          if (e.shiftKey) { st.sel = st.sel.includes(f.id) ? st.sel.filter(x => x !== f.id) : st.sel.concat(f.id); render(); app.redraw(); return true; }
          if (!st.sel.includes(f.id)) st.sel = [f.id];
          st.drag = { kind: 'move', start: [w.x, w.y], dx: 0, dy: 0 }; render(); app.redraw(); return true;
        }
        st.drag = { kind: 'box', start: [w.x, w.y], cur: [w.x, w.y], add: e.shiftKey }; if (!e.shiftKey) st.sel = []; render(); return true;
      }
      if (st.tool === 'label') { addLabel(p); return true; }
      if (st.drawType === 'image') { if (!F.assetOf(m, st.asset)) { app.toast(L().noAssets); return true; } addFeature({ type: 'image', asset: st.asset, geometry: { type: 'point', coordinates: p } }); return true; }
      const type = st.drawType, g = geomOf(type);
      if (g === 'point') { addFeature(Object.assign({ type, geometry: { type: 'point', coordinates: p } }, type === 'cartouche' ? { label: { text: m.name } } : {})); return true; }
      if (g === 'group') { st.draft = { type, geom: 'group', pts: [p] }; st.drag = { kind: 'stamp' }; app.redraw(); return true; }
      if (st.freehand) { st.draft = { type, geom: g, pts: [p] }; st.drag = { kind: 'free' }; return true; }
      if (!st.draft) st.draft = { type, geom: g, pts: [] };
      const last = st.draft.pts[st.draft.pts.length - 1];
      if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 0.5 / z()) st.draft.pts.push(p);
      app.redraw(); return true;
    }
    function pointerMove(sx, sy, w) {
      const d = st.drag; if (!d) { st.hoverPt = snapPt([w.x, w.y]); if (st.draft || st.tool !== 'select') app.redraw(); return; }
      const p = snapPt([w.x, w.y]);
      if (d.kind === 'move') { d.dx = w.x - d.start[0]; d.dy = w.y - d.start[1]; if (st.snap) { d.dx = Math.round(d.dx / 25) * 25; d.dy = Math.round(d.dy / 25) * 25; } previewMap(f => Object.assign({}, f, { geometry: F.mapPoints(f.geometry, q => [q[0] + d.dx, q[1] + d.dy]) })); }
      else if (d.kind === 'vertex') { d.cur = p; previewMap(f => f.id !== d.fid ? f : Object.assign({}, f, { geometry: setVertex(f.geometry, d.v, p) })); }
      else if (d.kind === 'scale') { d.k = Math.max(0.05, Math.min(20, Math.hypot(w.x - d.origin[0], w.y - d.origin[1]) / d.d0)); previewMap(f => Object.assign({}, f, { geometry: F.mapPoints(f.geometry, q => [d.origin[0] + (q[0] - d.origin[0]) * d.k, d.origin[1] + (q[1] - d.origin[1]) * d.k]) })); }
      else if (d.kind === 'box') { d.cur = [w.x, w.y]; app.redraw(); }
      else if (d.kind === 'free') { const l = st.draft.pts[st.draft.pts.length - 1]; if (Math.hypot(l[0] - p[0], l[1] - p[1]) > 3 / z()) { st.draft.pts.push(p); app.redraw(); } }
      else if (d.kind === 'stamp') {
        const size = (F.styleOf({ type: st.draft.type, geometry: { type: 'group' } }, active()).size || 24) * 0.55, l = st.draft.pts[st.draft.pts.length - 1];
        if (Math.hypot(l[0] - p[0], l[1] - p[1]) >= size) { st.draft.pts.push(p); app.redraw(); }
      }
    }
    function pointerUp() {
      const d = st.drag; st.drag = null; if (!d) return;
      st.preview = null; st.previewPrims = null;
      if (d.kind === 'move') { if (Math.abs(d.dx) + Math.abs(d.dy) > 0) commit(st.sel.map(id => ({ op: 'update', id, translate: [Math.round(d.dx * 100) / 100, Math.round(d.dy * 100) / 100] })), true); else changed(true); }
      else if (d.kind === 'vertex') { if (d.cur !== d.start) commit([{ op: 'update', id: d.fid, geometry: setVertex(d.v.f.geometry, d.v, d.cur) }], true); else changed(true); }
      else if (d.kind === 'scale') { if (Math.abs(d.k - 1) > 0.001) commit(st.sel.map(id => ({ op: 'update', id, scale: { factor: Math.round(d.k * 1000) / 1000, origin: d.origin } })), true); else changed(true); }
      else if (d.kind === 'box') {
        const m = active(), b = [d.start[0], d.start[1], d.cur[0], d.cur[1]];
        if (Math.abs(b[2] - b[0]) * z() > 4 || Math.abs(b[3] - b[1]) * z() > 4) {
          const x0 = Math.min(b[0], b[2]), x1 = Math.max(b[0], b[2]), y0 = Math.min(b[1], b[3]), y1 = Math.max(b[1], b[3]);
          const ids = m.features.filter(f => { const ly = m.layers[f.layer] || {}; if (ly.visible === false || ly.locked) return false; const fb = F.featureBBox(f, m); return fb[0] >= x0 && fb[2] <= x1 && fb[1] >= y0 && fb[3] <= y1; }).map(f => f.id);
          st.sel = d.add ? [...new Set(st.sel.concat(ids))] : ids;
        }
        render(); app.redraw();
      } else if (d.kind === 'free') finishDraft();
      else if (d.kind === 'stamp') { const dr = st.draft; st.draft = null; if (dr && dr.pts.length) addFeature(dr.pts.length === 1 && F.TYPES[dr.type].geoms.includes('point') ? { type: dr.type, geometry: { type: 'point', coordinates: dr.pts[0] } } : { type: dr.type, geometry: { type: 'group', coordinates: dr.pts } }); }
    }
    function setVertex(g, v, p) { const c = JSON.parse(JSON.stringify(g.coordinates)); if (g.type === 'polygon') c[v.ri][v.pi] = p; else c[v.pi] = p; return { type: g.type, coordinates: c, ...(g.sizes ? { sizes: g.sizes } : {}) }; }
    function removeVertex(v) {
      const g = v.f.geometry, c = JSON.parse(JSON.stringify(g.coordinates));
      if (g.type === 'polygon') { if (c[v.ri].length <= 3) return; c[v.ri].splice(v.pi, 1); }
      else { if (c.length <= (g.type === 'line' ? 2 : 1)) return; c.splice(v.pi, 1); }
      const ng = { type: g.type, coordinates: c }; if (g.sizes) { ng.sizes = g.sizes.slice(); ng.sizes.splice(v.pi, 1); }
      commit([{ op: 'update', id: v.f.id, geometry: ng }], true);
    }
    function finishDraft() {
      const d = st.draft; if (!d) return; st.draft = null;
      let pts = d.pts; if (st.freehand || pts.length > 40) pts = F.simplify(pts, 1.6 / z());
      const min = d.geom === 'polygon' ? 3 : 2;
      if (pts.length < min) { app.redraw(); return; }
      addFeature({ type: d.type, geometry: d.geom === 'polygon' ? { type: 'polygon', coordinates: [pts] } : { type: d.geom, coordinates: pts } });
    }
    function addFeature(feat) {
      const r = commit([{ op: 'add', feature: feat }]);
      if (r && r.added[0]) { st.sel = [r.added[0]]; render(); }
    }
    function addLabel(p) {
      const T = L();
      app.modal(T.askLabel, `<label>${esc(T.text)}<input id="mlText" maxlength="200" autofocus></label>`, () => {
        const text = val('mlText').value.trim(); if (!text) return true;
        addFeature({ type: 'label', geometry: { type: 'point', coordinates: p }, label: { text } }); return true;
      });
      setTimeout(() => val('mlText') && val('mlText').focus(), 0);
    }
    function dblclick() { if (st.draft && st.draft.geom !== 'group') { st.draft.pts.pop(); finishDraft(); return true; } return false; }
    function deleteSel() {
      if (!st.sel.length) return; const T = L();
      if (st.sel.length > 20 && !confirm(T.confirmMany(st.sel.length))) return;
      commit(st.sel.map(id => ({ op: 'delete', id }))); st.sel = []; render();
    }
    function key(e, typing) {
      if (app.mode() !== 'draw') return false;
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if (typing) return false;
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return true; }
      if (mod && k === 'y') { e.preventDefault(); redo(); return true; }
      if (k === 'escape') { if (st.draft) st.draft = null; else st.sel = []; render(); app.redraw(); return true; }
      if (k === 'enter' && st.draft) { finishDraft(); return true; }
      if (k === 'backspace' && st.draft) { e.preventDefault(); st.draft.pts.pop(); if (!st.draft.pts.length) st.draft = null; app.redraw(); return true; }
      if ((k === 'delete' || k === 'backspace') && st.sel.length) { e.preventDefault(); deleteSel(); return true; }
      if (st.sel.length && k.startsWith('arrow')) {
        e.preventDefault(); const s = e.shiftKey ? 10 : 1, dx = k === 'arrowleft' ? -s : k === 'arrowright' ? s : 0, dy = k === 'arrowup' ? -s : k === 'arrowdown' ? s : 0;
        commit(st.sel.map(id => ({ op: 'update', id, translate: [dx, dy] })), true); return true;
      }
      if (!mod && (k === 'v' || k === 's')) { setTool('select'); return true; }
      return false;
    }

    // ------------------------------------------------------------- Overlay (Auswahl, Entwurf, Raster)
    function drawOverlay(ctx) {
      const m = active(); if (!m) return;
      const inDraw = app.mode() === 'draw';
      if (!inDraw) return;
      const zz = z();
      app.worldTransform(ctx);
      if (st.grid) {
        ctx.strokeStyle = 'rgba(60,40,20,0.18)'; ctx.lineWidth = 1 / zz; ctx.beginPath();
        const step = zz > 1.5 ? 25 : 100;
        for (let x = 0; x <= m.width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, m.height); }
        for (let y = 0; y <= m.height; y += step) { ctx.moveTo(0, y); ctx.lineTo(m.width, y); }
        ctx.stroke();
      }
      const cm = st.preview || m;
      ctx.lineWidth = 1.5 / zz; ctx.setLineDash([5 / zz, 4 / zz]); ctx.strokeStyle = '#1f6fd1';
      for (const f of cm.features.filter(f => st.sel.includes(f.id))) { const b = F.featureBBox(f, cm); ctx.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }
      ctx.setLineDash([]);
      if (st.sel.length && !st.drag) {
        const b = selBBox(); if (b && ((b[2] - b[0]) * zz >= 36 || (b[3] - b[1]) * zz >= 36)) { ctx.fillStyle = '#1f6fd1'; const s = 9 / zz; ctx.fillRect(b[2] - s / 2, b[3] - s / 2, s, s); }
        if (st.sel.length === 1) {
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1f6fd1'; ctx.lineWidth = 1.5 / zz;
          for (const v of vertices(selFeatures()[0])) { ctx.beginPath(); ctx.arc(v.p[0], v.p[1], 4 / zz, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        }
      }
      if (st.drag && st.drag.kind === 'box') { const d = st.drag; ctx.strokeStyle = '#1f6fd1'; ctx.fillStyle = 'rgba(31,111,209,0.08)'; ctx.lineWidth = 1 / zz; ctx.fillRect(d.start[0], d.start[1], d.cur[0] - d.start[0], d.cur[1] - d.start[1]); ctx.strokeRect(d.start[0], d.start[1], d.cur[0] - d.start[0], d.cur[1] - d.start[1]); }
      if (st.draft) {
        const d = st.draft;
        if (d.geom === 'group') {
          const tmp = Object.assign({}, m, { features: [{ id: 'draft', type: d.type, layer: F.TYPES[d.type].layer, geometry: { type: 'group', coordinates: d.pts } }] });
          ctx.globalAlpha = 0.8; F.drawPrims(ctx, F.build(tmp)); ctx.globalAlpha = 1;
        } else {
          const pts = d.pts.concat(!st.drag && st.hoverPt ? [st.hoverPt] : []);
          ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2 / zz; ctx.setLineDash(d.geom === 'polygon' ? [] : [6 / zz, 4 / zz]);
          ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (d.geom === 'polygon' && pts.length > 2) ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
          if (d.geom === 'polygon' && pts.length > 2) { ctx.fillStyle = 'rgba(192,57,43,0.08)'; ctx.fill(); }
          ctx.fillStyle = '#c0392b'; for (const p of d.pts) { ctx.beginPath(); ctx.arc(p[0], p[1], 3 / zz, 0, Math.PI * 2); ctx.fill(); }
        }
      }
    }

    // ------------------------------------------------------------- Symbole für Palette & Legende (echte Kartensymbole als SVG)
    const iconCache = {};
    function icon(type, style) {
      const k = type + '|' + style; if (iconCache[k]) return iconCache[k];
      const m = F.createMap({ name: 'i', style, border: false }); m.width = 60; m.height = 44; m.background = F.PRESETS[style].paper;
      const g = F.TYPES[type].geoms, P = (x, y) => [x, y];
      let geom;
      if (g.includes('point')) geom = { type: 'point', coordinates: P(30, 22) };
      else if (type === 'mountains' || type === 'hills') geom = { type: 'group', coordinates: [P(17, 26), P(31, 20), P(45, 27)] };
      else if (g[0] === 'line') geom = { type: 'line', coordinates: [P(6, 32), P(22, 14), P(38, 30), P(54, 12)] };
      else geom = { type: 'polygon', coordinates: [[P(8, 10), P(50, 6), P(54, 36), P(12, 38)]] };
      const st0 = {};
      if (g.includes('point')) st0.size = type === 'compass' ? 40 : type === 'cartouche' ? 0.25 : 30;
      if (type === 'mountains') st0.size = 22; if (type === 'hills') st0.size = 18; if (type === 'forest' || type === 'swamp' || type === 'desert') st0.size = 11;
      m.features.push({ id: 'i', type, layer: F.TYPES[type].layer, geometry: geom, style: st0, ...(type === 'label' ? { label: { text: 'Aa', size: 22 } } : type === 'cartouche' ? { label: { text: 'Titel', size: 40 } } : {}) });
      try { iconCache[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(F.toSVG(m)); } catch { iconCache[k] = ''; }
      return iconCache[k];
    }

    // ------------------------------------------------------------- Panel
    function setTool(t, type) {
      st.tool = t; if (type) st.drawType = type; st.draft = null;
      if (t !== 'select') st.sel = [];
      render(); app.redraw(); hint();
    }
    function hint() {
      const T = L(); if (app.mode() !== 'draw') return;
      const m = active(); if (!m || !canEdit(m)) { app.hint(null); return; }
      if (st.tool === 'select') return app.hint(T.hintSelect);
      if (st.tool === 'label') return app.hint(T.hintLabel);
      if (st.drawType === 'image') return app.hint(T.hintImage);
      const g = geomOf(st.drawType);
      app.hint(g === 'point' ? T.hintPoint : g === 'group' ? T.hintGroup : st.freehand ? T.hintFree : T.hintPoly);
    }
    function colorInput(id, v, allowNone) {
      const ok = /^#[0-9a-f]{6}$/i.test(v || ''), none = !v || v === 'none';
      return `<span class="row"><input type="color" id="${id}" value="${ok ? v : '#888888'}" ${allowNone && none ? 'data-none="1"' : ''}>${allowNone ? `<label class="chk"><input type="checkbox" id="${id}N" ${none ? 'checked' : ''}> ${esc(L().noFill)}</label>` : ''}${!ok && !none ? `<span class="dim small">${esc(v)}</span>` : ''}</span>`;
    }
    const openSec = loadJSON('iam.mapSec.v1', {});
    const isOpen = (k, def) => (openSec[k] ?? def) ? 'open' : '';
    function render() {
      const box = document.getElementById('mapedit'); if (!box) return;
      const show = app.mode() === 'draw'; box.hidden = !show;
      const tb = document.getElementById('tabDraw'); if (tb) tb.classList.toggle('active', show);
      if (!show) return;
      const T = L(), w = app.world();
      if (!w || w.builtin) { box.innerHTML = `<div class="readonly-note">${esc(T.onlyCustom)}</div>`; app.hint(null); return; }
      const list = mapsHere(), m = active();
      const mayCreate = app.canEditWorldMap(w) || (app.tl() && !app.tl().readonly && app.canEditTlMap(app.tl()));
      if (!m) {
        box.innerHTML = `<h3>${esc(T.tab)}</h3><p class="hint">${esc(T.noMap)}</p>${mayCreate ? `<button id="meNew" class="primary wide">${esc(T.createFirst)}</button>` : `<div class="readonly-note">${esc(T.readOnly)}</div>`}`;
        const b = document.getElementById('meNew'); if (b) b.onclick = newMap; app.hint(null); return;
      }
      const ed = canEdit(m), fs = selFeatures();
      const sel = m.features.length;
      let h = `<div class="me-head"><select id="meMap">${list.map(x => `<option value="${esc(x.id)}" ${x === m ? 'selected' : ''}>${esc(x.name)}${x.timeline ? ' · ' + esc(T.tlMap) : x.primary ? ' ★' : ''}</option>`).join('')}</select>
        ${mayCreate ? `<button id="meNew" title="${esc(T.create)}">＋</button>` : ''}${ed ? `<button id="meSet" title="${esc(T.settings)}">⚙</button>` : ''}${canAdmin(m) ? `<button id="meDel" title="${esc(T.del)}">🗑</button>` : ''}</div>
        <div class="me-row"><span class="dim small">${esc(T.export)}:</span> <button id="meSvg">${T.exportSvg}</button> <button id="mePng">${T.exportPng}</button>
          <select id="mePngScale" title="${esc(T.pngScale)}"><option value="1">1×</option><option value="2" selected>2×</option><option value="4">4×</option></select> <span class="dim small">${m.width}×${m.height} · ${esc(T.count(sel))}</span></div>`;
      if (!ed) h += `<div class="readonly-note">${esc(T.readOnly)}</div>`;
      else {
        h += `<div class="me-tools">
          <button data-tool="select" class="${st.tool === 'select' ? 'active' : ''}" title="V">⬚ ${esc(T.select)}</button>
          <button data-tool="draw" class="${st.tool === 'draw' ? 'active' : ''}">✎ ${esc(T.drawT)}</button>
          <button data-tool="label" class="${st.tool === 'label' ? 'active' : ''}">Ａ ${esc(T.labelT)}</button>
          <button id="meUndo" title="${esc(T.undo)}" ${st.undo.length ? '' : 'disabled'}>↶</button><button id="meRedo" title="${esc(T.redo)}" ${st.redo.length ? '' : 'disabled'}>↷</button>
        </div>
        <div class="me-row"><label class="chk"><input type="checkbox" id="meGrid" ${st.grid ? 'checked' : ''}> ${esc(T.grid)}</label> <label class="chk"><input type="checkbox" id="meSnap" ${st.snap ? 'checked' : ''}> ${esc(T.snap)}</label> <button id="meFit">⌂ ${esc(T.fit)}</button></div>`;
        if (st.tool === 'draw' && st.drawType !== 'image') {
          const g = F.TYPES[st.drawType].geoms;
          h += `<div class="me-row">${g.length > 1 ? g.map(x => `<button data-geom="${x}" class="${geomOf(st.drawType) === x ? 'active' : ''}">${esc(T.geom[x])}</button>`).join('') : ''}
            ${['line', 'polygon'].includes(geomOf(st.drawType)) ? `<label class="chk"><input type="checkbox" id="meFree" ${st.freehand ? 'checked' : ''}> ${esc(T.freehand)}</label>` : ''}</div>`;
        }
        h += `<details class="me-sec" data-sec="palette" ${isOpen('palette', true)}><summary>${esc(T.palette)}</summary>`;
        for (const ly of F.LAYERS) {
          const types = Object.keys(F.TYPES).filter(k => F.TYPES[k].layer === ly && k !== 'image'); if (!types.length) continue;
          h += `<div class="me-pal-h">${esc(T.layerNames[ly])}</div><div class="me-pal">` + types.map(k => `<button class="me-sym ${st.tool === 'draw' && st.drawType === k ? 'active' : ''}" data-type="${k}" title="${esc(T.types[k])}"><img src="${icon(k, m.style)}" alt=""><span>${esc(T.types[k])}</span></button>`).join('') + '</div>';
        }
        h += '</details>';
        const assets = m.assets || [];
        h += `<details class="me-sec" data-sec="assets" ${isOpen('assets', true)}><summary>${esc(T.assets)} (${assets.length})</summary>
          <div class="me-pal">${assets.map(a => `<span class="me-asset-w"><button class="me-sym ${st.tool === 'draw' && st.drawType === 'image' && st.asset === a.id ? 'active' : ''}" data-asset="${esc(a.id)}" title="${esc(a.name)} (${a.w}×${a.h})"><img src="${esc(a.src)}" alt="" style="object-fit:contain"><span>${esc(a.name)}</span></button><button class="me-adel" data-adel="${esc(a.id)}" title="${esc(T.delAsset)}">×</button></span>`).join('') || `<p class="hint">${esc(T.noAssets)}</p>`}</div>
          <label class="me-upload"><input type="file" id="meUpload" accept="image/png,image/jpeg,image/webp,image/gif" hidden><span class="btn">⤒ ${esc(T.upload)}</span></label>
          <p class="hint small">${esc(T.assetHint)}</p></details>`;
      }
      // Auswahl
      if (ed) {
        h += `<details class="me-sec" data-sec="sel" ${isOpen('sel', true)}><summary>${esc(T.sel)}</summary>`;
        if (!fs.length) h += `<p class="hint">${esc(T.none)}</p>`;
        else if (fs.length > 1) h += `<p>${esc(T.selMany(fs.length))}</p><div class="me-row"><button id="meBig">＋ ${esc(T.bigger)}</button><button id="meSmall">－ ${esc(T.smaller)}</button><button id="meDelSel" class="danger">🗑 ${esc(T.delete)}</button></div>`;
        else h += inspector(fs[0], m);
        h += '</details>';
      }
      // Ebenen
      const cnt = {}; for (const f of m.features) cnt[f.layer] = (cnt[f.layer] || 0) + 1;
      h += `<details class="me-sec" data-sec="layers" ${isOpen('layers', false)}><summary>${esc(T.layers)}</summary>` + F.LAYERS.map(ly => `<div class="me-layer"><label class="chk" title="${esc(T.vis)}"><input type="checkbox" data-lvis="${ly}" ${m.layers[ly].visible !== false ? 'checked' : ''} ${ed ? '' : 'disabled'}> ${esc(T.layerNames[ly])}</label><span class="dim small">${cnt[ly] || 0}</span>${ed ? `<label class="chk small" title="${esc(T.lock)}"><input type="checkbox" data-llock="${ly}" ${m.layers[ly].locked ? 'checked' : ''}> 🔒</label>` : ''}</div>`).join('') + '</details>';
      // Legende
      const used = [...new Set(m.features.map(f => f.type))].filter(k => k !== 'label' && k !== 'cartouche' && k !== 'compass' && k !== 'image');
      if (used.length) h += `<details class="me-sec" data-sec="legend" ${isOpen('legend', false)}><summary>${esc(T.legend)}</summary><div class="me-legend">` + used.map(k => `<div><img src="${icon(k, m.style)}" alt=""> ${esc(T.types[k])}</div>`).join('') + '</div></details>';
      box.innerHTML = h;
      wire(box, m, fs);
      hint();
    }
    function inspector(f, m) {
      const T = L(), s = F.styleOf(f, m), lb = f.label || {}, g = f.geometry.type;
      const isImg = f.type === 'image';
      const types = isImg ? ['image'] : Object.keys(F.TYPES).filter(k => F.TYPES[k].geoms.includes(g) && k !== 'image');
      const places = (app.places() || []);
      const hasFill = g === 'polygon' || g === 'point' || g === 'group';
      return `<div class="form-grid me-insp">
        <label>${esc(T.type)}<select id="miType">${types.map(k => `<option value="${k}" ${k === f.type ? 'selected' : ''}>${esc(T.types[k])}</option>`).join('')}</select></label>
        <label>${esc(T.layer)}<select id="miLayer">${F.LAYERS.map(k => `<option value="${k}" ${k === f.layer ? 'selected' : ''}>${esc(T.layerNames[k])}</option>`).join('')}</select></label>
        <label>${esc(T.name)}<input id="miName" value="${esc(f.name || '')}" maxlength="100"></label>
        <label title="${esc(T.linkHint)}">${esc(T.place)}<select id="miPlace"><option value="">${esc(T.noPlace)}</option>${places.map(o => `<option value="${esc(o.id)}" ${o.id === f.placeId ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}${f.placeId && !places.some(o => o.id === f.placeId) ? `<option value="${esc(f.placeId)}" selected>${esc(f.placeId)}</option>` : ''}</select></label>
        <div class="me-sub">${esc(T.label)}</div>
        <label>${esc(T.text)}<input id="miText" value="${esc(lb.text || '')}" maxlength="200"></label>
        <label>${esc(T.size)}<input id="miLSize" type="number" min="2" max="600" value="${lb.size || ''}" placeholder="auto"></label>
        <label>${esc(T.color)}${colorInput('miLColor', lb.color || '#3b2a1a')}</label>
        <label>${esc(T.align)}<select id="miAlign"><option value="">auto</option>${['left', 'center', 'right'].map(a => `<option value="${a}" ${lb.align === a ? 'selected' : ''}>${esc(T.aligns[a])}</option>`).join('')}</select></label>
        <label>${esc(T.angle)}<input id="miAngle" type="number" min="-360" max="360" value="${lb.angle ?? ''}" placeholder="auto"></label>
        <span class="row"><label class="chk"><input type="checkbox" id="miItalic" ${lb.italic ? 'checked' : ''}> ${esc(T.italic)}</label><label class="chk"><input type="checkbox" id="miCaps" ${lb.caps ? 'checked' : ''}> ${esc(T.caps)}</label></span>
        <div class="me-sub">${esc(T.style)}</div>
        ${isImg ? `<label>${esc(T.asset)}<select id="miAsset">${(m.assets || []).map(a => `<option value="${esc(a.id)}" ${a.id === f.asset ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
        <label>${esc(T.imgWidth)}<input id="miSize" type="number" min="1" max="1000" value="${Math.round(s.size || Math.min((F.assetOf(m, f.asset) || { w: 300 }).w, 300))}"></label>
        <label>${esc(T.rotation)}<input id="miRot" type="number" min="-360" max="360" value="${s.rotation || 0}"></label>
        <label>${esc(T.opacity)}<input id="miOpacity" type="range" min="0.05" max="1" step="0.05" value="${s.opacity ?? 1}"></label>` : `
        ${hasFill ? `<label>${esc(T.fill)}${colorInput('miFill', s.fill, true)}</label>` : ''}
        <label>${esc(T.stroke)}${colorInput('miStroke', s.stroke, true)}</label>
        <label>${esc(T.width)}<input id="miWidth" type="number" min="0" max="200" step="0.1" value="${s.width ?? ''}"></label>
        <label>${esc(T.dash)}<select id="miDash">${Object.keys(F.DASHES).map(d => `<option value="${d}" ${(s.dash || 'solid') === d ? 'selected' : ''}>${esc(T.dashes[d])}</option>`).join('')}</select></label>
        <label>${esc(T.opacity)}<input id="miOpacity" type="range" min="0.05" max="1" step="0.05" value="${s.opacity ?? 1}"></label>
        ${g !== 'line' || ['mountains', 'hills', 'forest'].includes(f.type) ? `<label>${esc(T.symSize)}<input id="miSize" type="number" min="1" max="1000" value="${s.size ?? ''}"></label>` : ''}
        ${g === 'polygon' && ['mountains', 'hills', 'forest', 'swamp', 'desert'].includes(f.type) ? `<label>${esc(T.density)}<input id="miDensity" type="range" min="0.3" max="3" step="0.1" value="${s.density ?? 1}"></label>` : ''}
        ${g === 'line' || g === 'polygon' ? `<label class="chk"><input type="checkbox" id="miSmooth" ${s.smooth ? 'checked' : ''}> ${esc(T.smooth)}</label>` : ''}`}
      </div>
      <div class="me-row"><button id="miFront">⇡ ${esc(T.front)}</button><button id="miBack">⇣ ${esc(T.back)}</button><button id="meBig">＋</button><button id="meSmall">－</button><button id="miReset">${esc(T.reset)}</button><button id="meDelSel" class="danger">🗑 ${esc(T.delete)}</button></div>
      <p class="dim small">id: ${esc(f.id)}</p>`;
    }
    function wire(box, m, fs) {
      const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el[ev] = fn; };
      on('meMap', 'onchange', e => choose(e.target.value));
      on('meNew', 'onclick', newMap); on('meSet', 'onclick', editMap); on('meDel', 'onclick', deleteMap);
      on('meSvg', 'onclick', exportSvg); on('mePng', 'onclick', () => exportPng(+document.getElementById('mePngScale').value));
      on('meUndo', 'onclick', undo); on('meRedo', 'onclick', redo);
      on('meGrid', 'onchange', e => { st.grid = e.target.checked; app.redraw(); });
      on('meSnap', 'onchange', e => { st.snap = e.target.checked; });
      on('meFree', 'onchange', e => { st.freehand = e.target.checked; hint(); });
      on('meFit', 'onclick', () => app.fit());
      box.querySelectorAll('details[data-sec]').forEach(d => d.ontoggle = () => { openSec[d.dataset.sec] = d.open; try { localStorage.setItem('iam.mapSec.v1', JSON.stringify(openSec)); } catch { } });
      box.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
      box.querySelectorAll('[data-asset]').forEach(b => b.onclick = () => { st.asset = b.dataset.asset; setTool('draw', 'image'); });
      box.querySelectorAll('[data-adel]').forEach(b => b.onclick = () => { if (m.features.some(f => f.asset === b.dataset.adel)) { app.toast(L().assetUsed); return; } if (st.asset === b.dataset.adel) st.asset = null; commit([{ op: 'removeAsset', id: b.dataset.adel }]); });
      on('meUpload', 'onchange', e => { const f = e.target.files[0]; e.target.value = ''; uploadAsset(f); });
      box.querySelectorAll('[data-type]').forEach(b => b.onclick = () => setTool('draw', b.dataset.type));
      box.querySelectorAll('[data-geom]').forEach(b => b.onclick = () => { st.geom[st.drawType] = b.dataset.geom; st.draft = null; render(); });
      box.querySelectorAll('[data-lvis]').forEach(c => c.onchange = () => { const ly = c.dataset.lvis; saveMeta(m, { layers: { [ly]: { visible: c.checked, locked: !!m.layers[ly].locked } } }); });
      box.querySelectorAll('[data-llock]').forEach(c => c.onchange = () => { const ly = c.dataset.llock; saveMeta(m, { layers: { [ly]: { visible: m.layers[ly].visible !== false, locked: c.checked } } }); if (c.checked) { st.sel = st.sel.filter(id => (m.features.find(f => f.id === id) || {}).layer !== ly); render(); } });
      const scaleSel = k => commit(st.sel.map(id => ({ op: 'update', id, scale: k })), true);
      on('meBig', 'onclick', () => scaleSel(1.15)); on('meSmall', 'onclick', () => scaleSel(1 / 1.15));
      on('meDelSel', 'onclick', deleteSel);
      if (fs.length !== 1) return;
      const f = fs[0], upd = o => commit([Object.assign({ op: 'update', id: f.id }, o)], true);
      on('miType', 'onchange', e => upd({ type: e.target.value }));
      on('miLayer', 'onchange', e => upd({ layer: e.target.value }));
      on('miName', 'onchange', e => upd({ name: e.target.value.trim() || null }));
      on('miPlace', 'onchange', e => upd({ placeId: e.target.value || null }));
      on('miText', 'onchange', e => upd({ label: e.target.value.trim() ? { text: e.target.value.trim() } : (f.type === 'label' ? { text: f.label.text } : null) }));
      const num = (id, k, wrap) => on(id, 'onchange', e => { const v = e.target.value === '' ? null : +e.target.value; upd(wrap === 'label' ? { label: { [k]: v } } : { style: { [k]: v } }); });
      num('miRot', 'rotation');
      on('miAsset', 'onchange', e => upd({ asset: e.target.value }));
      num('miLSize', 'size', 'label'); num('miAngle', 'angle', 'label'); num('miWidth', 'width'); num('miSize', 'size'); num('miDensity', 'density'); num('miOpacity', 'opacity');
      on('miAlign', 'onchange', e => upd({ label: { align: e.target.value || null } }));
      on('miItalic', 'onchange', e => upd({ label: { italic: e.target.checked } }));
      on('miCaps', 'onchange', e => upd({ label: { caps: e.target.checked } }));
      on('miLColor', 'onchange', e => upd({ label: { color: e.target.value } }));
      on('miDash', 'onchange', e => upd({ style: { dash: e.target.value } }));
      on('miSmooth', 'onchange', e => upd({ style: { smooth: e.target.checked } }));
      for (const k of ['Fill', 'Stroke']) {
        const key = k.toLowerCase();
        on('mi' + k, 'onchange', e => upd({ style: { [key]: e.target.value } }));
        on('mi' + k + 'N', 'onchange', e => upd({ style: { [key]: e.target.checked ? 'none' : document.getElementById('mi' + k).value } }));
      }
      on('miFront', 'onclick', () => upd({ order: 'front' })); on('miBack', 'onclick', () => upd({ order: 'back' }));
      on('miReset', 'onclick', () => upd({ style: null }));
    }

    return {
      load, flush, external, active, opaque, ver: () => st.ver, drawBase, drawOverlay, render, removeWorld,
      pointerDown, pointerMove, pointerUp, dblclick, key, hint, isDragging: () => !!st.drag,
      get maps() { return st.maps; }, _st: st
    };
  };
})();
