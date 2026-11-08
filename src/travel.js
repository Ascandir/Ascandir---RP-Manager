/* Ascandir InteractiveMap – Reiseplaner (läuft im Browser und auf dem Server)
   Spielfreundliche Schätzung, keine offizielle Kanon-Berechnung. */
(function (root) {
  'use strict';

  // Sci-Fi: 1 Karteneinheit ≈ 52 Lichtjahre (Galaxie-Radius ≈ 1150 Einheiten ≈ 60.000 Lj)
  const LY_PER_UNIT = 52;
  // Klasse-1-Antrieb auf einer Haupt-Hyperraumroute: ca. 225 Einheiten pro Tag
  const UNITS_PER_DAY_CLASS1 = 225;
  const HYPER_CLASSES = [0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
  // Fantasy: km pro Tag je Reiseart
  const TRAVEL_MODES = { foot: 30, horse: 60, carriage: 45, ship: 150, flying: 250 };

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /**
   * tl: Zeitlinie, opts: { stops: [Name/ID...] (mind. 2), year, worldType, hyperClass, stayHours, mode, kmPerUnit }
   */
  function plan(tl, opts) {
    const fantasy = opts.worldType === 'fantasy';
    const year = opts.year;
    const byId = {}; for (const o of tl.objects) byId[o.id] = o;
    const exists = o => year == null || ((o.from == null || o.from === '' || year >= +o.from) && (o.to == null || o.to === '' || year <= +o.to));
    const rootOf = o => { let c = o, n = 0; while (c.parent && byId[c.parent] && n++ < 8) c = byId[c.parent]; return c; };
    const find = q => {
      if (!q) return null; const s = String(q).toLowerCase().trim();
      const c = tl.objects.filter(o => o.id === q || o.name.toLowerCase() === s);
      return c.sort((a, b) => (a.type === 'planet' || a.type === 'city' || a.type === 'capital' ? -1 : 0) - (b.type === 'planet' || b.type === 'city' || b.type === 'capital' ? -1 : 0))[0]
        || tl.objects.find(o => o.name.toLowerCase().startsWith(s)) || tl.objects.find(o => o.name.toLowerCase().includes(s)) || null;
    };
    const stops = (opts.stops || []).map(q => ({ q, obj: find(q) }));
    const missing = stops.filter(s => !s.obj).map(s => s.q);
    if (missing.length) return { ok: false, error: 'notFound', missing };
    if (stops.length < 2) return { ok: false, error: 'tooFew' };

    // Knoten = Wurzelobjekte (Systeme), die im Jahr existieren
    const nodes = [], idx = {};
    for (const o of tl.objects) { if (o.parent && byId[o.parent]) continue; if (!exists(o)) continue; idx[o.id] = nodes.length; nodes.push(o); }
    for (const s of stops) { const r = rootOf(s.obj); if (idx[r.id] == null) { idx[r.id] = nodes.length; nodes.push(r); } s.root = r; }
    const N = nodes.length, adj = Array.from({ length: N }, () => []);
    // Anzeigename: Sonnen mit Planeten heißen wie ihr (erster) Planet
    const label = {}; for (const o of tl.objects) if (o.parent && byId[o.parent] && byId[o.parent].type === 'sun' && o.type === 'planet' && !label[o.parent]) label[o.parent] = o.name;
    const nm = o => label[o.id] || o.name;
    const addEdge = (a, b, f, lane) => { if (a === b) return; const d = dist(nodes[a], nodes[b]); adj[a].push({ to: b, d, cost: d * f, lane }); adj[b].push({ to: a, d, cost: d * f, lane }); };
    // Routen (Hyperraumrouten / Straßen)
    for (const r of tl.routes || []) {
      const pts = r.points.map(id => byId[id]).filter(Boolean).map(rootOf).filter(o => idx[o.id] != null);
      const f = r.kind === 'major' ? 1 : 1.35;
      for (let i = 1; i < pts.length; i++) addEdge(idx[pts[i - 1].id], idx[pts[i].id], f, r.name);
    }
    // Freie Sprünge zwischen nahen Systemen (abseits der Routen langsamer)
    const R = fantasy ? 320 : 280, offF = fantasy ? 1.6 : 2.2;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = dist(nodes[i], nodes[j]); if (d <= R) addEdge(i, j, offF, null); }

    function dijkstra(s, t) {
      const D = new Float64Array(N).fill(Infinity), P = new Int32Array(N).fill(-1), PE = new Array(N), done = new Uint8Array(N);
      D[s] = 0;
      for (let k = 0; k < N; k++) {
        let u = -1, best = Infinity;
        for (let i = 0; i < N; i++) if (!done[i] && D[i] < best) { best = D[i]; u = i; }
        if (u < 0 || u === t) break;
        done[u] = 1;
        for (const e of adj[u]) { const nd = D[u] + e.cost; if (nd < D[e.to]) { D[e.to] = nd; P[e.to] = u; PE[e.to] = e; } }
      }
      if (!isFinite(D[t])) return null;
      const path = []; let c = t; while (c !== -1) { path.unshift(c); c = P[c]; }
      const edges = []; for (let i = 1; i < path.length; i++) edges.push(PE[path[i]]);
      return { path, edges };
    }

    const legs = [];
    let totalHours = 0, totalUnits = 0, jumps = 0;
    const hyper = +opts.hyperClass || 1;
    const speedPerDay = fantasy ? (TRAVEL_MODES[opts.mode] || 60) / (+opts.kmPerUnit || 1) : UNITS_PER_DAY_CLASS1;
    for (let i = 1; i < stops.length; i++) {
      const a = idx[stops[i - 1].root.id], b = idx[stops[i].root.id];
      let res = a === b ? { path: [a], edges: [] } : dijkstra(a, b);
      if (!res) { // keine Verbindung: Direktsprung
        const d = dist(nodes[a], nodes[b]);
        res = { path: [a, b], edges: [{ to: b, d, cost: d * (offF + 0.4), lane: null }] };
      }
      const cost = res.edges.reduce((s, e) => s + e.cost, 0), units = res.edges.reduce((s, e) => s + e.d, 0);
      let hours = cost / speedPerDay * 24 * (fantasy ? 1 : hyper);
      if (!fantasy) hours += res.edges.length * 0.5; // Navcomputer, Ein- und Austritt pro Sprung
      jumps += res.edges.length;
      const lanes = [...new Set(res.edges.map(e => e.lane).filter(Boolean))];
      const offLane = res.edges.filter(e => !e.lane).reduce((s, e) => s + e.d, 0);
      legs.push({
        from: stops[i - 1].obj.name, to: stops[i].obj.name, hours, units,
        lightYears: fantasy ? null : Math.round(units * LY_PER_UNIT), km: fantasy ? Math.round(units * (+opts.kmPerUnit || 1)) : null,
        via: res.path.slice(1, -1).map(k => nm(nodes[k])), lanes, offLaneShare: units ? offLane / units : 0,
        points: res.path.map(k => ({ x: nodes[k].x, y: nodes[k].y, name: nm(nodes[k]) }))
      });
      totalHours += hours; totalUnits += units;
    }
    const stay = Math.max(0, +opts.stayHours || 0) * Math.max(0, stops.length - 2);
    return {
      ok: true, legs, stops: stops.map(s => s.obj.name), travelHours: totalHours, stayHours: stay, totalHours: totalHours + stay, jumps,
      lightYears: fantasy ? null : Math.round(totalUnits * LY_PER_UNIT), km: fantasy ? Math.round(totalUnits * (+opts.kmPerUnit || 1)) : null,
      hyperClass: fantasy ? null : hyper, mode: fantasy ? (opts.mode || 'horse') : null
    };
  }

  function fmtDuration(h, lang) {
    const de = lang !== 'en';
    if (h < 1) return de ? `${Math.max(1, Math.round(h * 60))} Min.` : `${Math.max(1, Math.round(h * 60))} min`;
    const H = Math.round(h), d = Math.floor(H / 24), r = H - d * 24;
    const dd = d ? (de ? `${d} ${d === 1 ? 'Tag' : 'Tage'}` : `${d} ${d === 1 ? 'day' : 'days'}`) : '';
    const hh = r ? (de ? `${r} Std.` : `${r} h`) : '';
    return [dd, hh].filter(Boolean).join(' ') || (de ? '0 Std.' : '0 h');
  }

  root.IAM_TRAVEL = { plan, fmtDuration, HYPER_CLASSES, TRAVEL_MODES, LY_PER_UNIT };
})(typeof window !== 'undefined' ? window : globalThis);
