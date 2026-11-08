/* Ascandir InteractiveMap – Territorien mit Grenzen
   Jede Rasterzelle gehört höchstens einer Fraktion: der mit der stärksten Nähe
   (Abstand / Reichweite) zu einem kontrollierten Objekt, gemalten Gebiet oder beanspruchten Region.
   Aus den Zellen werden per Marching Squares glatte Umriss-Polygone erzeugt. */
(function (root) {
  'use strict';

  /**
   * input: { bounds:{x0,y0,x1,y1}, cell, inside(x,y)->bool, regionAt(x,y)->key|null,
   *          factions:[{id,reach}], points:[{x,y,f}], zones:[{f,x,y,r}|{f,poly}], regionClaims:{key:f} }
   * returns { [factionId]: [[x,y],...][] }  (geschlossene Polygone in Weltkoordinaten)
   */
  function compute(input) {
    const { bounds, cell } = input;
    const gw = Math.ceil((bounds.x1 - bounds.x0) / cell), gh = Math.ceil((bounds.y1 - bounds.y0) / cell);
    const reach = {}; input.factions.forEach((f, i) => { reach[f.id] = +f.reach || 120; });
    const fIndex = {}; input.factions.forEach((f, i) => { fIndex[f.id] = i + 1; });
    const owner = new Uint16Array(gw * gh);

    // Punkte in Behälter einsortieren (schnelle Nachbarsuche)
    const B = 120, maxReach = Math.max(60, ...Object.values(reach), ...input.zones.filter(z => z.r).map(z => z.r));
    const bins = new Map();
    const addBin = p => { const k = Math.floor(p.x / B) + ',' + Math.floor(p.y / B); (bins.get(k) || bins.set(k, []).get(k)).push(p); };
    for (const p of input.points) if (fIndex[p.f]) addBin({ x: p.x, y: p.y, f: p.f, r: reach[p.f] });
    for (const z of input.zones) if (fIndex[z.f] && z.r) addBin({ x: z.x, y: z.y, f: z.f, r: z.r });
    const polys = input.zones.filter(z => fIndex[z.f] && Array.isArray(z.poly) && z.poly.length > 2);
    const rs = Math.ceil(maxReach / B);
    const inPoly = (x, y, poly) => { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };

    for (let j = 0; j < gh; j++) {
      const y = bounds.y0 + (j + 0.5) * cell;
      for (let i = 0; i < gw; i++) {
        const x = bounds.x0 + (i + 0.5) * cell;
        if (input.inside && !input.inside(x, y)) continue;
        let best = null, bs = Infinity;
        // gemalte Polygone sind sehr stark
        for (const z of polys) if (inPoly(x, y, z.poly)) { if (0.4 < bs) { bs = 0.4; best = z.f; } }
        const bx = Math.floor(x / B), by = Math.floor(y / B);
        for (let dx = -rs; dx <= rs; dx++) for (let dy = -rs; dy <= rs; dy++) {
          const arr = bins.get((bx + dx) + ',' + (by + dy)); if (!arr) continue;
          for (const p of arr) { const d = Math.hypot(p.x - x, p.y - y); if (d > p.r) continue; const s = d / p.r; if (s < bs) { bs = s; best = p.f; } }
        }
        if (bs > 0.97 && input.regionClaims && input.regionAt) {
          const rk = input.regionAt(x, y), rf = rk && input.regionClaims[rk];
          if (rf && fIndex[rf] && bs > 0.97) { best = rf; bs = 0.97; }
        }
        if (best) owner[j * gw + i] = fIndex[best];
      }
    }

    // Umrisse je Fraktion (Marching Squares + Verketten + Glätten)
    const out = {};
    for (const f of input.factions) {
      const id = fIndex[f.id];
      const at = (i, j) => (i >= 0 && j >= 0 && i < gw && j < gh && owner[j * gw + i] === id) ? 1 : 0;
      let any = false; for (let k = 0; k < owner.length; k++) if (owner[k] === id) { any = true; break; }
      if (!any) continue;
      const segs = [];
      const px = i => bounds.x0 + (i + 0.5) * cell, py = j => bounds.y0 + (j + 0.5) * cell;
      for (let j = -1; j < gh; j++) for (let i = -1; i < gw; i++) {
        const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
        const code = a * 8 + b * 4 + c * 2 + d;
        if (code === 0 || code === 15) continue;
        const T = [(px(i) + px(i + 1)) / 2, py(j)], R = [px(i + 1), (py(j) + py(j + 1)) / 2], Bm = [(px(i) + px(i + 1)) / 2, py(j + 1)], L = [px(i), (py(j) + py(j + 1)) / 2];
        switch (code) {
          case 1: case 14: segs.push([L, Bm]); break;
          case 2: case 13: segs.push([Bm, R]); break;
          case 3: case 12: segs.push([L, R]); break;
          case 4: case 11: segs.push([T, R]); break;
          case 5: segs.push([L, T]); segs.push([Bm, R]); break;
          case 6: case 9: segs.push([T, Bm]); break;
          case 7: case 8: segs.push([L, T]); break;
          case 10: segs.push([T, R]); segs.push([L, Bm]); break;
        }
      }
      // Segmente zu geschlossenen Ringen verketten
      const key = p => Math.round(p[0] * 4) + ',' + Math.round(p[1] * 4);
      const map = new Map();
      segs.forEach((s, k) => { for (const p of s) { const kk = key(p); (map.get(kk) || map.set(kk, []).get(kk)).push(k); } });
      const used = new Uint8Array(segs.length), rings = [];
      for (let k = 0; k < segs.length; k++) {
        if (used[k]) continue;
        used[k] = 1; const ring = [segs[k][0], segs[k][1]];
        let cur = segs[k][1], guard = 0;
        while (guard++ < 200000) {
          const cand = (map.get(key(cur)) || []).find(n => !used[n]);
          if (cand == null) break;
          used[cand] = 1; const s = segs[cand];
          const nxt = key(s[0]) === key(cur) ? s[1] : s[0];
          if (key(nxt) === key(ring[0])) break;
          ring.push(nxt); cur = nxt;
        }
        if (ring.length > 3) rings.push(smooth(ring, 2));
      }
      out[f.id] = rings;
    }
    return out;
  }

  // Chaikin-Glättung für geschlossene Ringe
  function smooth(pts, it) {
    let p = pts;
    for (let k = 0; k < it; k++) {
      const q = [];
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      p = q;
    }
    return p;
  }

  root.IAM_TERRITORY = { compute };
})(typeof window !== 'undefined' ? window : globalThis);
