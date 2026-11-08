/* =========================================================================
   Ascandir – Star Wars Galaxy Map
   Kanon-Datensatz. Alle Positionen sind ANGENÄHERT (an das bekannte
   Galaxie-Raster angelehnt), Fraktions-Einflüsse sind grobe Vereinfachungen.
   ========================================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------------- Geometrie
  const GEO = {
    center: { x: 1150, y: 950 },
    // Galaxie ist nach "Norden" gestaucht (wie auf den bekannten Karten)
    scale(theta) { return 0.82 + 0.2 * Math.sin(theta); },
    unknownWedge: { from: (145 * Math.PI) / 180, to: (215 * Math.PI) / 180, r0: 330 },
    edge: 1150,
    bands: [
      { key: 'Tiefkern', r0: 0, r1: 90 },
      { key: 'Kern', r0: 90, r1: 200 },
      { key: 'Kolonien', r0: 200, r1: 300 },
      { key: 'Innerer Rand', r0: 300, r1: 400 },
      { key: 'Expansionsregion', r0: 400, r1: 500 },
      { key: 'Mittlerer Rand', r0: 500, r1: 700 },
      { key: 'Äußerer Rand', r0: 700, r1: 1000 },
      { key: 'Wilder Raum', r0: 1000, r1: 1150 }
    ],
    gridCell: 100
  };
  const REGIONS = GEO.bands.map(b => b.key).concat(['Unbekannte Regionen', 'Huttenraum']);

  function inWedge(theta) {
    let t = theta < 0 ? theta + 2 * Math.PI : theta;
    return t >= GEO.unknownWedge.from && t <= GEO.unknownWedge.to;
  }

  // Raster-Koordinate (z.B. "R", 16) + Region -> Weltposition
  function place(col, row, region) {
    const ci = col.charCodeAt(0) - 65;
    const gx = (ci + 0.5) * GEO.gridCell, gy = (row - 0.5) * GEO.gridCell;
    const dx = gx - GEO.center.x, dy = gy - GEO.center.y;
    let theta = Math.atan2(dy, dx);
    const s = GEO.scale(theta);
    let dn = Math.hypot(dx, dy) / s;
    let band = GEO.bands.find(b => b.key === region);
    if (region === 'Huttenraum') band = { r0: 720, r1: 960 };
    if (region === 'Unbekannte Regionen') {
      band = { r0: 380, r1: 1100 };
      if (!inWedge(theta)) {
        // Winkel in den Westkeil ziehen
        const t = theta < 0 ? theta + 2 * Math.PI : theta;
        theta = t < Math.PI ? GEO.unknownWedge.from + 0.08 : GEO.unknownWedge.to - 0.08;
      }
    }
    if (band) dn = Math.min(band.r1 - 15, Math.max(band.r0 + 15, dn));
    const s2 = GEO.scale(theta);
    return {
      x: Math.round(GEO.center.x + Math.cos(theta) * dn * s2),
      y: Math.round(GEO.center.y + Math.sin(theta) * dn * s2)
    };
  }

  // ---------------------------------------------------------------- Planeten
  // [id, Name, Spalte, Zeile, Region, Beschreibung]
  const P = [
    ['byss', 'Byss', 'L', 10, 'Tiefkern', 'Abgelegene Welt im Tiefkern, Rückzugsort imperialer Kräfte.'],
    ['tython', 'Tython', 'M', 9, 'Tiefkern', 'Uralte Welt, mit den Anfängen der Jedi verbunden.'],
    ['coruscant', 'Coruscant', 'L', 9, 'Kern', 'Stadtplanet und jahrtausendelang Hauptstadt der Galaxis.'],
    ['chandrila', 'Chandrila', 'L', 8, 'Kern', 'Grüne Kernwelt, erste Hauptstadt der Neuen Republik.'],
    ['alderaan', 'Alderaan', 'M', 10, 'Kern', 'Friedliche Kernwelt, 0 VSY vom Todesstern zerstört.'],
    ['corellia', 'Corellia', 'M', 11, 'Kern', 'Werftwelt und Heimat berühmter Piloten.'],
    ['kuat', 'Kuat', 'N', 10, 'Kern', 'Sitz der Kuat-Triebwerkswerften.'],
    ['hosnian', 'Hosnian Prime', 'K', 10, 'Kern', 'Spätere Hauptstadt der Neuen Republik.'],
    ['corulag', 'Corulag', 'K', 9, 'Kolonien', 'Kolonialwelt mit imperialer Akademie.'],
    ['catoneimoidia', 'Cato Neimoidia', 'N', 12, 'Kolonien', 'Heimat der Neimoidianer, Hochburg der Handelsföderation.'],
    ['jakku', 'Jakku', 'G', 11, 'Innerer Rand', 'Wüstenwelt in den Westlichen Weiten, Schiffsfriedhof.'],
    ['onderon', 'Onderon', 'N', 8, 'Innerer Rand', 'Dschungelwelt mit eigenständiger Monarchie.'],
    ['umbara', 'Umbara', 'K', 6, 'Expansionsregion', 'Dunkle Welt im Geisternebel.'],
    ['kashyyyk', 'Kashyyyk', 'P', 9, 'Mittlerer Rand', 'Waldwelt der Wookiees.'],
    ['naboo', 'Naboo', 'O', 17, 'Mittlerer Rand', 'Heimat von Padmé Amidala und Palpatine.'],
    ['malastare', 'Malastare', 'N', 17, 'Mittlerer Rand', 'Bekannt für Podrennen.'],
    ['ordmantell', 'Ord Mantell', 'L', 7, 'Mittlerer Rand', 'Raue Handelswelt.'],
    ['takodana', 'Takodana', 'I', 12, 'Mittlerer Rand', 'Neutrale Welt, Maz Kanatas Schloss.'],
    ['kijimi', 'Kijimi', 'J', 5, 'Mittlerer Rand', 'Eisige Diebeswelt.'],
    ['tatooine', 'Tatooine', 'R', 16, 'Äußerer Rand', 'Wüstenwelt mit zwei Sonnen.'],
    ['geonosis', 'Geonosis', 'R', 15, 'Äußerer Rand', 'Droidenfabriken; Beginn der Klonkriege.'],
    ['ryloth', 'Ryloth', 'S', 17, 'Äußerer Rand', 'Heimatwelt der Twi\'leks.'],
    ['christophsis', 'Christophsis', 'Q', 16, 'Äußerer Rand', 'Kristallwelt, Schauplatz früher Schlachten.'],
    ['hoth', 'Hoth', 'K', 18, 'Äußerer Rand', 'Eisplanet, Echo-Basis der Rebellen.'],
    ['bespin', 'Bespin', 'K', 19, 'Äußerer Rand', 'Gasriese mit der Wolkenstadt.'],
    ['dagobah', 'Dagobah', 'M', 19, 'Äußerer Rand', 'Sumpfwelt, Yodas Exil.'],
    ['mustafar', 'Mustafar', 'L', 19, 'Äußerer Rand', 'Vulkanwelt, Vaders Festung.'],
    ['sullust', 'Sullust', 'M', 17, 'Äußerer Rand', 'Vulkanwelt, Sammelpunkt vor Endor.'],
    ['utapau', 'Utapau', 'N', 19, 'Äußerer Rand', 'Dolinenwelt.'],
    ['crait', 'Crait', 'N', 20, 'Äußerer Rand', 'Salzwelt mit alter Rebellenbasis.'],
    ['endor', 'Endor', 'H', 16, 'Äußerer Rand', 'Gasriese; Waldmond mit den Ewoks.'],
    ['yavin', 'Yavin', 'P', 6, 'Äußerer Rand', 'Gasriese; auf Yavin 4 lag die Rebellenbasis.'],
    ['mandalore', 'Mandalore', 'O', 7, 'Äußerer Rand', 'Heimat der Mandalorianer.'],
    ['dathomir', 'Dathomir', 'O', 5, 'Äußerer Rand', 'Welt der Nachtschwestern.'],
    ['felucia', 'Felucia', 'R', 6, 'Äußerer Rand', 'Pilzdschungelwelt.'],
    ['moncala', 'Mon Cala', 'U', 7, 'Äußerer Rand', 'Ozeanwelt, Werften der Mon Calamari.'],
    ['dantooine', 'Dantooine', 'L', 3, 'Äußerer Rand', 'Grasland, frühe Rebellenbasis.'],
    ['mygeeto', 'Mygeeto', 'J', 3, 'Äußerer Rand', 'Kristallwelt des Bankenclans.'],
    ['kessel', 'Kessel', 'T', 11, 'Äußerer Rand', 'Gewürzminen.'],
    ['lothal', 'Lothal', 'R', 13, 'Äußerer Rand', 'Grasland, Wiege eines frühen Aufstands.'],
    ['atollon', 'Atollon', 'S', 14, 'Äußerer Rand', 'Versteckte Basis der Phoenix-Zelle.'],
    ['scarif', 'Scarif', 'T', 15, 'Äußerer Rand', 'Tropische Welt mit imperialer Zitadelle.'],
    ['nevarro', 'Nevarro', 'P', 18, 'Äußerer Rand', 'Vulkanwelt, Kopfgeldjäger-Gilde.'],
    ['dqar', 'D\'Qar', 'T', 8, 'Äußerer Rand', 'Basis des Widerstands.'],
    ['ajankloss', 'Ajan Kloss', 'P', 3, 'Äußerer Rand', 'Dschungelbasis des Widerstands.'],
    ['batuu', 'Batuu', 'F', 15, 'Äußerer Rand', 'Grenzwelt am Rand des Bekannten.'],
    ['kamino', 'Kamino', 'S', 18, 'Wilder Raum', 'Ozeanwelt der Klonkrieger.'],
    ['nalhutta', 'Nal Hutta', 'S', 12, 'Huttenraum', 'Thronwelt der Hutten.'],
    ['ilum', 'Ilum', 'G', 7, 'Unbekannte Regionen', 'Kyberkristall-Welt, später Starkiller-Basis.'],
    ['ahchto', 'Ahch-To', 'D', 6, 'Unbekannte Regionen', 'Ozeanwelt mit dem ersten Jedi-Tempel.'],
    ['exegol', 'Exegol', 'C', 11, 'Unbekannte Regionen', 'Verborgene Welt der Sith.'],
    ['csilla', 'Csilla', 'B', 9, 'Unbekannte Regionen', 'Eiswelt der Chiss.']
  ];

  const objects = [];
  for (const [id, name, c, r, region, desc] of P) {
    const pos = place(c, r, region);
    objects.push({ id, name, type: 'planet', x: pos.x, y: pos.y, region, desc, parent: null, from: null, to: null });
  }

  // Sonnen: Planet wird zum "Kind" seiner Sonne
  const SUNS = [
    ['tatoo1', 'Tatoo I', 'tatooine'], ['tatoo2', 'Tatoo II', 'tatooine'],
    ['coruscantprime', 'Coruscant Prime', 'coruscant'], ['corell', 'Corell', 'corellia'],
    ['yavinprime', 'Yavin Prime', 'yavin'], ['hothstar', 'Hoth (Stern)', 'hoth']
  ];
  const byId = Object.fromEntries(objects.map(o => [o.id, o]));
  for (const [id, name, planetId] of SUNS) {
    const p = byId[planetId];
    objects.push({ id, name, type: 'sun', x: p.x, y: p.y, region: p.region, desc: 'Stern des ' + p.name + '-Systems.', parent: null, from: null, to: null });
  }
  // Planeten an ihre (erste) Sonne hängen; zweite Sonne an die erste
  byId.tatooine.parent = 'tatoo1';
  byId.coruscant.parent = 'coruscantprime';
  byId.corellia.parent = 'corell';
  byId.yavin.parent = 'yavinprime';
  byId.hoth.parent = 'hothstar';
  objects.find(o => o.id === 'tatoo2').parent = 'tatoo1';

  // Monde
  const MOONS = [
    ['yavin4', 'Yavin 4', 'yavin', 'Dschungelmond mit Massassi-Tempeln, Rebellenbasis.'],
    ['endormoon', 'Waldmond Endor', 'endor', 'Heimat der Ewoks; Schildgenerator des zweiten Todessterns.'],
    ['narshaddaa', 'Nar Shaddaa', 'nalhutta', 'Der "Schmugglermond".'],
    ['concordia', 'Concordia', 'mandalore', 'Bergbaumond von Mandalore.'],
    ['ohmadun', 'Ohma-D\'un', 'naboo', 'Mond von Naboo.'],
    ['rori', 'Rori', 'naboo', 'Sumpfiger Mond von Naboo.'],
    ['ghomrassen', 'Ghomrassen', 'tatooine', 'Mond von Tatooine.'],
    ['guermessa', 'Guermessa', 'tatooine', 'Mond von Tatooine.'],
    ['chenini', 'Chenini', 'tatooine', 'Mond von Tatooine.']
  ];
  for (const [id, name, parent, desc] of MOONS) {
    const p = byId[parent];
    objects.push({ id, name, type: 'moon', x: p.x, y: p.y, region: p.region, desc, parent, from: null, to: null });
  }
  // Jedha: Mond ohne erfassten Mutterplaneten
  const jp = place('O', 13, 'Mittlerer Rand');
  objects.push({ id: 'jedha', name: 'Jedha', type: 'moon', x: jp.x, y: jp.y, region: 'Mittlerer Rand', desc: 'Heiliger Wüstenmond, 0 VSY vom Todesstern verwüstet.', parent: null, from: null, to: 0 });

  // Stationen
  const sb = place('R', 10, 'Äußerer Rand');
  const ds = place('Q', 5, 'Äußerer Rand');
  const STATIONS = [
    { id: 'cloudcity', name: 'Wolkenstadt', parent: 'bespin', desc: 'Tibanna-Gasmine über Bespin.', from: null, to: null },
    { id: 'kdy', name: 'Kuat-Triebwerkswerften', parent: 'kuat', desc: 'Orbitalwerften für Sternzerstörer.', from: null, to: null },
    { id: 'cec', name: 'Corellianische Werften', parent: 'corellia', desc: 'Orbitalwerften der Corellian Engineering Corporation.', from: null, to: null },
    { id: 'starlight', name: 'Starlight Beacon', parent: null, x: sb.x, y: sb.y, region: 'Äußerer Rand', desc: 'Leuchtfeuer der Hohen Republik im Äußeren Rand.', from: -235, to: -230 },
    { id: 'deathstar', name: 'Todesstern', parent: null, x: ds.x, y: ds.y, region: 'Äußerer Rand', desc: 'Kampfstation des Imperiums, bei Yavin zerstört.', from: -19, to: 0 },
    { id: 'deathstar2', name: 'Todesstern II', parent: 'endor', desc: 'Zweite Kampfstation, bei Endor zerstört.', from: 1, to: 4 },
    { id: 'starkiller', name: 'Starkiller-Basis', parent: 'ilum', desc: 'In einen Planeten gebaute Superwaffe der Ersten Ordnung.', from: 9, to: 34 }
  ];
  for (const s of STATIONS) {
    const p = s.parent ? byId[s.parent] : null;
    objects.push({
      id: s.id, name: s.name, type: 'station',
      x: p ? p.x : s.x, y: p ? p.y : s.y, region: p ? p.region : s.region,
      desc: s.desc, parent: s.parent, from: s.from, to: s.to
    });
  }

  // ---------------------------------------------------------------- Fraktionen
  const factions = [
    { id: 'rep', name: 'Galaktische Republik', color: '#e2b13c', reach: 140 },
    { id: 'nihil', name: 'Nihil', color: '#8e44ad', reach: 120 },
    { id: 'tf', name: 'Handelsföderation', color: '#c07a3a', reach: 110 },
    { id: 'kus', name: 'Konföderation unabhängiger Systeme', color: '#3d7be0', reach: 130 },
    { id: 'mando', name: 'Mandalore (neutral)', color: '#2ecc71', reach: 110 },
    { id: 'emp', name: 'Galaktisches Imperium', color: '#8f9aa6', reach: 140 },
    { id: 'reb', name: 'Rebellenallianz', color: '#f0802e', reach: 120 },
    { id: 'nr', name: 'Neue Republik', color: '#3fb6d9', reach: 140 },
    { id: 'imprest', name: 'Imperiale Überreste', color: '#5d6b78', reach: 120 },
    { id: 'fo', name: 'Erste Ordnung', color: '#d32f2f', reach: 140 },
    { id: 'res', name: 'Widerstand', color: '#ffb74d', reach: 120 },
    { id: 'sith', name: 'Sith Eternal', color: '#c2185b', reach: 120 },
    { id: 'hutt', name: 'Huttenkartell', color: '#9ccc65', reach: 120 },
    { id: 'chiss', name: 'Chiss-Aszendenz', color: '#1e88e5', reach: 130 }
  ];

  // ---------------------------------------------------------------- Zeitalter
  const INNER = ['Tiefkern', 'Kern', 'Kolonien', 'Innerer Rand', 'Expansionsregion'];
  const UPTO_MID = INNER.concat(['Mittlerer Rand']);
  const ALL_KNOWN = UPTO_MID.concat(['Äußerer Rand', 'Wilder Raum']);
  function regs(list, f) { const o = {}; list.forEach(r => (o[r] = f)); return o; }

  const ERA_DEFS = [
    {
      name: 'Hohe Republik', year: -232,
      desc: 'Goldenes Zeitalter der Republik und der Jedi. Die Republik dehnt sich mit Starlight Beacon in den Äußeren Rand aus; die Nihil plündern an der Grenze.',
      regions: Object.assign(regs(UPTO_MID, 'rep'), { 'Huttenraum': 'hutt' }),
      set: { nalhutta: 'hutt', tatooine: 'hutt', starlight: 'rep', ryloth: 'rep', kamino: null },
      zones: [{ f: 'nihil', x: 1980, y: 1250, r: 170 }, { f: 'nihil', x: 1880, y: 1420, r: 130 }]
    },
    {
      name: 'Untergang der Republik', year: -32,
      desc: 'Die Republik ist träge geworden. Die Handelsföderation blockiert Naboo, im Äußeren Rand herrschen die Hutten.',
      regions: Object.assign(regs(UPTO_MID, 'rep'), { 'Huttenraum': 'hutt' }),
      set: { tatooine: 'hutt', nalhutta: 'hutt', catoneimoidia: 'tf', ryloth: null, kessel: null, kamino: null, moncala: 'rep', mandalore: 'mando' },
      zones: []
    },
    {
      name: 'Klonkriege', year: -20,
      desc: 'Republik gegen Separatisten. Mandalore bleibt neutral, die Hutten spielen beide Seiten gegeneinander aus.',
      regions: Object.assign(regs(UPTO_MID, 'rep'), { 'Huttenraum': 'hutt' }),
      set: {
        geonosis: 'kus', mustafar: 'kus', utapau: 'kus', felucia: 'kus', mygeeto: 'kus', catoneimoidia: 'kus',
        ryloth: 'kus', sullust: 'kus', umbara: 'kus', onderon: 'kus', christophsis: 'rep', kamino: 'rep',
        moncala: 'rep', dantooine: 'rep', mandalore: 'mando', concordia: 'mando', tatooine: 'hutt', nalhutta: 'hutt'
      },
      zones: [{ f: 'kus', x: 1820, y: 640, r: 150 }]
    },
    {
      name: 'Aufstieg des Imperiums', year: -5,
      desc: 'Das Imperium kontrolliert die bekannte Galaxis. Erste Rebellenzellen formieren sich im Äußeren Rand.',
      regions: Object.assign(regs(ALL_KNOWN, 'emp'), { 'Huttenraum': 'hutt', 'Unbekannte Regionen': null }),
      set: { tatooine: 'hutt', nalhutta: 'hutt', atollon: 'reb', csilla: 'chiss' },
      zones: [{ f: 'chiss', x: 230, y: 900, r: 200 }]
    },
    {
      name: 'Schlacht von Yavin', year: 0,
      desc: 'Die Rebellenallianz zerstört den ersten Todesstern von Yavin 4 aus.',
      regions: Object.assign(regs(ALL_KNOWN, 'emp'), { 'Huttenraum': 'hutt', 'Unbekannte Regionen': null }),
      set: { tatooine: 'hutt', nalhutta: 'hutt', yavin: 'reb', yavin4: 'reb', csilla: 'chiss' },
      zones: [{ f: 'chiss', x: 230, y: 900, r: 200 }]
    },
    {
      name: 'Schlacht von Endor', year: 4,
      desc: 'Der Imperator fällt bei Endor. Die Rebellion gewinnt Verbündete wie Mon Cala und Sullust.',
      regions: Object.assign(regs(ALL_KNOWN, 'emp'), { 'Huttenraum': 'hutt', 'Unbekannte Regionen': null }),
      set: { tatooine: null, nalhutta: 'hutt', endor: 'reb', moncala: 'reb', sullust: 'reb', chandrila: 'reb', csilla: 'chiss' },
      zones: [{ f: 'reb', x: 1700, y: 380, r: 160 }, { f: 'chiss', x: 230, y: 900, r: 200 }]
    },
    {
      name: 'Zeit der Neuen Republik', year: 9,
      desc: 'Die Neue Republik regiert den Kern; der Äußere Rand ist gesetzlos, imperiale Überreste halten sich im Tiefkern und an der Peripherie.',
      regions: Object.assign(regs(['Kern', 'Kolonien', 'Innerer Rand', 'Expansionsregion', 'Mittlerer Rand'], 'nr'), { 'Tiefkern': 'imprest', 'Huttenraum': 'hutt' }),
      set: { nevarro: 'imprest', jakku: null, tatooine: null, mandalore: null, nalhutta: 'hutt', exegol: 'sith', csilla: 'chiss', ilum: 'imprest' },
      zones: [{ f: 'chiss', x: 230, y: 900, r: 200 }]
    },
    {
      name: 'Erste Ordnung', year: 34,
      desc: 'Die Erste Ordnung bricht aus den Unbekannten Regionen hervor und vernichtet das Hosnian-System.',
      regions: Object.assign(regs(['Kern', 'Kolonien', 'Innerer Rand', 'Expansionsregion', 'Mittlerer Rand'], 'nr'), { 'Huttenraum': 'hutt' }),
      set: { ilum: 'fo', starkiller: 'fo', jakku: 'fo', takodana: null, dqar: 'res', exegol: 'sith', nalhutta: 'hutt', csilla: 'chiss', hosnian: 'nr' },
      zones: [{ f: 'fo', x: 520, y: 760, r: 260 }, { f: 'fo', x: 600, y: 1150, r: 220 }, { f: 'chiss', x: 230, y: 900, r: 160 }]
    },
    {
      name: 'Endgültige Ordnung', year: 35,
      desc: 'Die Erste Ordnung beherrscht die Galaxis, Sith Eternal erhebt sich auf Exegol, der Widerstand sammelt sich auf Ajan Kloss.',
      regions: Object.assign(regs(ALL_KNOWN, 'fo'), { 'Huttenraum': 'hutt' }),
      set: { ajankloss: 'res', exegol: 'sith', nalhutta: 'hutt', csilla: 'chiss', ilum: 'fo', takodana: null },
      zones: [{ f: 'fo', x: 520, y: 760, r: 260 }, { f: 'sith', x: 200, y: 1150, r: 150 }, { f: 'chiss', x: 230, y: 900, r: 160 }]
    }
  ];

  let zoneSeq = 0;
  function buildEra(def, idx) {
    const control = {};
    for (const o of objects) {
      if (o.parent && o.type !== 'station') continue; // Kinder erben vom Elternobjekt
      if (o.type === 'sun') continue;
      if (o.type === 'station' && o.parent) continue;
      const f = def.regions[o.region];
      if (f) control[o.id] = f;
    }
    // Planeten mit Sonne als Eltern zählen als Systeme
    for (const o of objects) {
      if (o.type === 'planet' && o.parent) {
        const f = def.regions[o.region];
        if (f) control[o.id] = f;
      }
    }
    for (const [k, v] of Object.entries(def.set)) {
      if (v) control[k] = v; else delete control[k];
    }
    // Regionen, die komplett beansprucht werden (für die Flächenfüllung)
    const regionClaims = {};
    for (const [r, f] of Object.entries(def.regions)) if (f) regionClaims[r] = f;
    return {
      id: 'era' + idx, name: def.name, year: def.year, desc: def.desc,
      control, regionClaims,
      zones: def.zones.map(z => ({ id: 'z' + (++zoneSeq), faction: z.f, x: z.x, y: z.y, r: z.r }))
    };
  }

  function canonTimeline() {
    return {
      id: 'canon', name: 'Kanon (vorinstalliert)', readonly: true,
      factions: JSON.parse(JSON.stringify(factions)),
      objects: JSON.parse(JSON.stringify(objects)),
      eras: ERA_DEFS.map(buildEra)
    };
  }

  window.SWGM_DATA = { GEO, REGIONS, inWedge, canonTimeline };
})();
