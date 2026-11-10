/* Ascandir RP-Manager – prozedurale Planetenbilder nach Biom (keine fremden Bilder) */
(function () {
  'use strict';

  // Biome: Farbverlauf (niedrig -> hoch), Wolken, Atmosphäre, typische Temperatur (°C)
  const BIOMES = {
    desert:    { stops: [[0, '#8a5a2b'], [0.45, '#c8964f'], [0.7, '#e3bf7d'], [1, '#f1dcaa']], clouds: 0.05, atmo: 'rgba(255,200,140,', temp: [20, 60] },
    reddesert: { stops: [[0, '#5e2316'], [0.45, '#9b3d22'], [0.75, '#c86a3c'], [1, '#e2a170']], clouds: 0.03, atmo: 'rgba(255,150,110,', temp: [15, 55] },
    ice:       { stops: [[0, '#7fa6c9'], [0.4, '#bcd6ea'], [0.7, '#e7f2fb'], [1, '#ffffff']], clouds: 0.25, atmo: 'rgba(190,225,255,', temp: [-70, -10] },
    tundra:    { stops: [[0, '#4f5d55'], [0.45, '#7d8a7a'], [0.7, '#b7c2b5'], [1, '#eef3f0']], clouds: 0.3, atmo: 'rgba(200,220,235,', temp: [-30, 10] },
    ocean:     { stops: [[0, '#0b2c5a'], [0.55, '#14549a'], [0.62, '#2f86c4'], [0.66, '#d8c98f'], [0.75, '#4f8f45'], [1, '#2f6a35']], clouds: 0.45, atmo: 'rgba(120,180,255,', temp: [5, 30] },
    islands:   { stops: [[0, '#0d4f7a'], [0.6, '#1d87b8'], [0.7, '#49c1d6'], [0.73, '#f0e2a8'], [0.8, '#4cab52'], [1, '#2c7a35']], clouds: 0.35, atmo: 'rgba(130,210,255,', temp: [24, 35] },
    forest:    { stops: [[0, '#1c4a7a'], [0.4, '#2a5e8c'], [0.44, '#4f8a3f'], [0.7, '#2a6130'], [1, '#173a1c']], clouds: 0.4, atmo: 'rgba(150,200,255,', temp: [0, 25] },
    redforest: { stops: [[0, '#3a0f12'], [0.4, '#6e1e22'], [0.7, '#a0383a'], [1, '#d07a6a']], clouds: 0.25, atmo: 'rgba(255,140,140,', temp: [5, 30] },
    jungle:    { stops: [[0, '#0d3313'], [0.4, '#1d5e22'], [0.7, '#2f8a33'], [1, '#6fbf4f']], clouds: 0.55, atmo: 'rgba(160,230,180,', temp: [25, 40] },
    swamp:     { stops: [[0, '#1e2a17'], [0.45, '#3a4a26'], [0.6, '#4e5a35'], [0.7, '#5b6b48'], [1, '#7a7d5a']], clouds: 0.6, atmo: 'rgba(170,190,150,', temp: [15, 35] },
    grassland: { stops: [[0, '#1b4a7a'], [0.42, '#2a6aa0'], [0.46, '#cdbb7c'], [0.55, '#7fa84a'], [0.8, '#a3b85a'], [1, '#d8d0a0']], clouds: 0.4, atmo: 'rgba(150,200,255,', temp: [5, 30] },
    mountains: { stops: [[0, '#2f4f6e'], [0.4, '#3f6a8c'], [0.45, '#6f7f56'], [0.65, '#7a6a55'], [0.85, '#a8a39b'], [1, '#f2f2f2']], clouds: 0.35, atmo: 'rgba(160,200,255,', temp: [-10, 20] },
    volcanic:  { stops: [[0, '#ff7a1a'], [0.3, '#c2300e'], [0.42, '#3a1a14'], [0.7, '#241512'], [1, '#4a3a33']], glow: true, clouds: 0.08, atmo: 'rgba(255,110,60,', temp: [30, 90] },
    city:      { stops: [[0, '#3c4250'], [0.5, '#5d6474'], [0.8, '#8a8f9a'], [1, '#b7bbc3']], lights: true, clouds: 0.2, atmo: 'rgba(180,200,255,', temp: [10, 30] },
    gas:       { gas: ['#c99a62', '#e8c99a', '#a8743f', '#f1dfbf', '#8d5b31'], atmo: 'rgba(255,220,170,', temp: [-150, -50] },
    gasblue:   { gas: ['#5b84b8', '#9cc0e2', '#3e6596', '#c9dcef', '#2c4c78'], atmo: 'rgba(170,210,255,', temp: [-180, -80] },
    barren:    { stops: [[0, '#3d3a37'], [0.45, '#6b6560'], [0.7, '#8d8780'], [1, '#bcb6ae']], clouds: 0, atmo: null, temp: [-80, 60] },
    salt:      { stops: [[0, '#7a1f1f'], [0.4, '#b23a2c'], [0.55, '#e9e4dc'], [1, '#ffffff']], clouds: 0.05, atmo: 'rgba(255,230,230,', temp: [-20, 15] },
    toxic:     { stops: [[0, '#3a3a10'], [0.4, '#6d6a1c'], [0.7, '#9da433'], [1, '#d0d77a']], clouds: 0.5, cloudColor: '210,220,120', atmo: 'rgba(200,230,90,', temp: [20, 70] },
    crystal:   { stops: [[0, '#2a2f6a'], [0.4, '#4b5bb0'], [0.7, '#8fa4e8'], [1, '#e2e8ff']], sparkle: true, clouds: 0.15, atmo: 'rgba(170,180,255,', temp: [-40, 20] },
    storm:     { stops: [[0, '#14161c'], [0.45, '#2a2d36'], [0.7, '#43474f'], [1, '#6a6e78']], clouds: 0.7, cloudColor: '120,125,140', lightning: true, atmo: 'rgba(140,150,200,', temp: [-20, 20] },
    neon:      { stops: [[0, '#1c1a22'], [0.5, '#34313c'], [0.8, '#4a4652'], [1, '#6a6570']], lights: true, neon: true, clouds: 0.35, cloudColor: '150,140,105', atmo: 'rgba(255,140,220,', temp: [15, 35] },
    machine:   { stops: [[0, '#2b3036'], [0.5, '#4a525c'], [0.8, '#6e7884'], [1, '#9aa4ae']], lights: true, grid: true, clouds: 0, atmo: 'rgba(140,220,255,', temp: [-50, 50] }
  };
  const PICK = ['desert', 'ice', 'ocean', 'forest', 'jungle', 'swamp', 'grassland', 'mountains', 'barren', 'tundra', 'volcanic', 'toxic', 'gas'];

  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let s = seed || 1; return () => (s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), ((s ^= s >>> 16) >>> 0) / 4294967296); }

  // 3D-Wertrauschen
  function makeNoise(seed) {
    const r = rng(seed), P = new Uint8Array(512), V = new Float32Array(256);
    for (let i = 0; i < 256; i++) { P[i] = i; V[i] = r(); }
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [P[i], P[j]] = [P[j], P[i]]; }
    for (let i = 0; i < 256; i++) P[i + 256] = P[i];
    const f = t => t * t * (3 - 2 * t);
    const h = (x, y, z) => V[P[P[P[x & 255] + (y & 255)] + (z & 255)]];
    function n(x, y, z) {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = f(xf), v = f(yf), w = f(zf);
      const l = (a, b, t) => a + (b - a) * t;
      return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), u), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
        l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
    }
    return (x, y, z, oct = 5) => { let a = 0.5, s = 0, fr = 1, norm = 0; for (let i = 0; i < oct; i++) { s += a * n(x * fr, y * fr, z * fr); norm += a; a *= 0.5; fr *= 2.03; } return s / norm; };
  }
  function hex(c) { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function grad(stops, t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], k = (t - t0) / ((t1 - t0) || 1), a = hex(c0), b = hex(c1);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    return hex(stops[stops.length - 1][1]);
  }

  const cache = {};
  function render(obj, biomeKey, size = 220) {
    const key = obj.id + '|' + biomeKey + '|' + obj.type + '|' + size;
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), seed = hashStr(obj.id), R = size * 0.38, cx = size / 2, cy = size / 2;
    g.fillStyle = '#05070d'; g.fillRect(0, 0, size, size);
    const sr = rng(seed ^ 0x9e37);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + sr() * 0.6})`; g.fillRect(sr() * size, sr() * size, sr() < 0.9 ? 1 : 2, 1); }

    if (obj.type === 'sun') {
      const hue = [['#fff7d6', '#ffcf5a', '#ff8a1e'], ['#ffffff', '#cfe3ff', '#6fa0ff'], ['#ffe2c8', '#ff8a5a', '#c2301a']][seed % 3];
      const gg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9);
      gg.addColorStop(0, hue[0]); gg.addColorStop(0.35, hue[1]); gg.addColorStop(0.55, hue[2] + 'cc'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gg; g.beginPath(); g.arc(cx, cy, R * 1.9, 0, Math.PI * 2); g.fill();
      return (cache[key] = c.toDataURL());
    }

    const B = BIOMES[biomeKey] || BIOMES.barren, noise = makeNoise(seed), cl = makeNoise(seed ^ 0xabc);
    const img = g.getImageData(0, 0, size, size), d = img.data;
    const tilt = (sr() - 0.5) * 0.6, rot = sr() * 10;
    const L = [-0.62, -0.42, 0.66];
    const pole = 0.2 + sr() * 0.2;
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
      const x = (px - cx) / R, y = (py - cy) / R, rr = x * x + y * y;
      if (rr > 1) continue;
      const z = Math.sqrt(1 - rr);
      // gekippte Kugelkoordinaten
      const yt = y * Math.cos(tilt) - z * Math.sin(tilt), zt = y * Math.sin(tilt) + z * Math.cos(tilt);
      const lat = yt; let col;
      const sx = x * Math.cos(rot) - zt * Math.sin(rot), sz = x * Math.sin(rot) + zt * Math.cos(rot);
      if (B.gas) {
        const warp = noise(sx * 2, yt * 2, sz * 2, 3) * 2.4;
        const band = (Math.sin(lat * 9 + warp * 2.2) + 1) / 2, idx = band * (B.gas.length - 1), i0 = Math.floor(idx), k = idx - i0;
        const a = hex(B.gas[i0]), b = hex(B.gas[Math.min(B.gas.length - 1, i0 + 1)]);
        col = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      } else {
        let n = noise(sx * 1.8 + 3, yt * 1.8, sz * 1.8);
        n = Math.max(0, Math.min(1, (n - 0.5) * 1.9 + 0.5));
        if (B.swap) n = 1 - n;
        col = grad(B.stops, n);
        if (B.grid) { const gx = Math.abs(Math.sin(sx * 30)), gy = Math.abs(Math.sin(yt * 30)); if (gx < 0.08 || gy < 0.08) col = [col[0] * 0.6, col[1] * 0.6, col[2] * 0.6]; }
        if (B.sparkle && noise(sx * 20, yt * 20, sz * 20, 2) > 0.72) col = [230, 235, 255];
        // Polkappen für bewohnbare Biome
        if (['ocean', 'forest', 'grassland', 'mountains', 'tundra', 'jungle', 'islands'].includes(biomeKey) && Math.abs(lat) > 1 - pole + noise(sx * 4, yt * 4, sz * 4, 2) * 0.12) col = [240, 246, 250];
      }
      // Beleuchtung
      const ndl = x * L[0] + y * L[1] + z * L[2];
      let light = Math.max(0, ndl) * 0.95 + 0.06;
      let r = col[0] * light, gr = col[1] * light, b = col[2] * light;
      if (B.glow) { const n2 = noise(sx * 3 + 9, yt * 3, sz * 3); if (n2 < 0.38) { const k = (0.38 - n2) * 4; r += 255 * k; gr += 90 * k; b += 10 * k; } }
      if (B.neon) { const n4 = noise(sx * 30, yt * 30, sz * 30, 2); if (n4 > 0.6) { const k = Math.min(1, (n4 - 0.6) * 4) * (ndl < 0.1 ? 1 : 0.18); const hue = noise(sx * 6 + 7, yt * 6, sz * 6, 1); const c = hue < 0.4 ? [255, 60, 200] : hue < 0.6 ? [60, 220, 255] : [255, 190, 60]; r += c[0] * k; gr += c[1] * k; b += c[2] * k; } }
      if (B.lights && ndl < 0.15) { const n3 = noise(sx * 25, yt * 25, sz * 25, 2); if (n3 > 0.55) { const k = Math.min(1, (n3 - 0.55) * 4) * Math.min(1, (0.15 - ndl) * 4); r += 255 * k; gr += 200 * k; b += 110 * k; } }
      // Wolken
      if (B.clouds) {
        const cv = cl(sx * 2.4 + 5, yt * 3.2, sz * 2.4, 4), th = 1 - B.clouds * 0.75;
        if (cv > th) {
          const a = Math.min(0.85, (cv - th) * 5) * Math.max(0.15, light);
          const cc = (B.cloudColor || '245,248,252').split(',').map(Number);
          r = r * (1 - a) + cc[0] * a; gr = gr * (1 - a) + cc[1] * a; b = b * (1 - a) + cc[2] * a;
          if (B.lightning && cv > th + 0.12 && noise(sx * 40, yt * 40, sz * 40, 1) > 0.93) { r = 220; gr = 220; b = 255; }
        }
      }
      // Randabdunklung
      const limb = 0.65 + 0.35 * z; r *= limb; gr *= limb; b *= limb;
      const o = (py * size + px) * 4;
      d[o] = Math.min(255, r); d[o + 1] = Math.min(255, gr); d[o + 2] = Math.min(255, b); d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    if (B.atmo) {
      const ag = g.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
      ag.addColorStop(0, B.atmo + '0.0)'); ag.addColorStop(0.35, B.atmo + '0.45)'); ag.addColorStop(1, B.atmo + '0)');
      g.fillStyle = ag; g.beginPath(); g.arc(cx, cy, R * 1.18, 0, Math.PI * 2); g.fill();
    }
    return (cache[key] = c.toDataURL());
  }

  function autoBiome(obj) { return PICK[hashStr(obj.id) % PICK.length]; }
  window.IAM_PLANETS = { BIOMES, render, autoBiome, keys: Object.keys(BIOMES) };
})();
