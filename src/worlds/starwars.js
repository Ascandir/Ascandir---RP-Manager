/* =========================================================================
   Ascandir RP-Manager – eingebaute Welt "Star Wars"
   Alle Positionen sind ANGENÄHERT (an das bekannte Galaxie-Raster angelehnt).
   Fraktions-Einflüsse sind bewusst vereinfacht.
   ========================================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------------- Geometrie
  const GEO = {
    center: { x: 1150, y: 950 },
    scale(theta) { return 0.82 + 0.2 * Math.sin(theta); },   // Galaxie nach "Norden" gestaucht
    unknownWedge: { from: (145 * Math.PI) / 180, to: (215 * Math.PI) / 180, r0: 330 },
    edge: 1150,
    bands: [
      { key: 'deepcore', r0: 0, r1: 90 },
      { key: 'core', r0: 90, r1: 200 },
      { key: 'colonies', r0: 200, r1: 300 },
      { key: 'innerrim', r0: 300, r1: 400 },
      { key: 'expansion', r0: 400, r1: 500 },
      { key: 'midrim', r0: 500, r1: 700 },
      { key: 'outerrim', r0: 700, r1: 1000 },
      { key: 'wildspace', r0: 1000, r1: 1150 }
    ],
    gridCell: 100,
    huttR: 220
  };
  const REGION_KEYS = GEO.bands.map(b => b.key).concat(['unknown', 'huttspace']);
  const REGION_CODES = { dc: 'deepcore', co: 'core', cl: 'colonies', ir: 'innerrim', ex: 'expansion', mr: 'midrim', or: 'outerrim', ws: 'wildspace', ur: 'unknown', hs: 'huttspace' };

  function inWedge(theta) {
    const t = theta < 0 ? theta + 2 * Math.PI : theta;
    return t >= GEO.unknownWedge.from && t <= GEO.unknownWedge.to;
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }

  // Raster-Feld (z.B. "R16") + Region -> Weltposition (mit fester Streuung je Name innerhalb des Feldes).
  // Liegt das Feld nur teilweise in der Region, wird der Punkt weich in den Regionsring gezogen.
  function place(grid, region, id) {
    const col = grid.charCodeAt(0) - 65, row = parseInt(grid.slice(1), 10);
    let gx = (col + 0.5) * GEO.gridCell + (hash(id + 'x') - 0.5) * 86;
    let gy = (row - 0.5) * GEO.gridCell + (hash(id + 'y') - 0.5) * 86;
    const dx = gx - GEO.center.x, dy = gy - GEO.center.y;
    let theta = Math.atan2(dy, dx);
    let dn = Math.hypot(dx, dy) / GEO.scale(theta);
    let band = GEO.bands.find(b => b.key === region);
    if (region === 'huttspace') band = { r0: 620, r1: 1000 };
    if (region === 'unknown') {
      band = { r0: GEO.unknownWedge.r0, r1: 1110 };
      if (!inWedge(theta)) {
        const t = theta < 0 ? theta + 2 * Math.PI : theta;
        theta = t < Math.PI ? GEO.unknownWedge.from + 0.04 + hash(id) * 0.12 : GEO.unknownWedge.to - 0.04 - hash(id) * 0.12;
      }
    }
    if (band) {
      const w = band.r1 - band.r0, m = Math.min(10, w * 0.1), spread = Math.min(45, w * 0.4) * hash(id + 'r');
      if (dn < band.r0 + m) dn = band.r0 + m + spread;
      else if (dn > band.r1 - m) dn = band.r1 - m - spread;
    }
    const s2 = GEO.scale(theta);
    return { x: Math.round(GEO.center.x + Math.cos(theta) * dn * s2), y: Math.round(GEO.center.y + Math.sin(theta) * dn * s2) };
  }
  // Hutt-Raum ist auf der Karte ein Kreis um Nal Hutta: Punkte außerhalb hineinziehen
  function huttPull(p, id, c) {
    const d = Math.hypot(p.x - c.x, p.y - c.y), lim = GEO.huttR - 18;
    if (d <= lim) return p;
    const r = lim * (0.55 + 0.45 * hash(id + 'h')), a = Math.atan2(p.y - c.y, p.x - c.x);
    return { x: Math.round(c.x + Math.cos(a) * r), y: Math.round(c.y + Math.sin(a) * r) };
  }

  // ---------------------------------------------------------------- Galaxie-Atlas (offizielles Systemverzeichnis)
  const normName = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const ATLAS = String((window.IAM_WORLDS && window.IAM_WORLDS.starwarsAtlasData) || '').trim().split('\n').filter(Boolean).map(l => {
    const [name, sector, rc, grid] = l.split('|'); return { name, sector: sector || null, rc, grid };
  });
  const atlasByName = {};
  ATLAS.forEach((e, i) => { const k = normName(e.name); if (!(k in atlasByName)) atlasByName[k] = i; });
  // Namen, die im Atlas anders heißen
  const ATLAS_ALIAS = { korriban: 'Moraband', onderon: 'Onderon Japrael' };
  const atlasUsed = new Set();
  function atlasMatch(id, name) {
    let i = atlasByName[normName(ATLAS_ALIAS[id] || name)];
    if (i == null) i = atlasByName[normName(name)];
    return i == null ? null : i;
  }
  const gridOf = (x, y) => String.fromCharCode(65 + Math.max(0, Math.min(25, Math.floor(x / GEO.gridCell)))) + Math.max(1, Math.floor(y / GEO.gridCell) + 1);

  // ---------------------------------------------------------------- Systeme
  // id | Name | Rasterfeld | Region | Sektor   (Name EN nur falls abweichend: "Name DE/Name EN")
  const SYSTEMS = `
byss|Byss|L10|dc|
prakith|Prakith|L10|dc|
empressteta|Empress Teta|L9|dc|Koros
tython|Tython|M9|dc|
ojom|Ojom|M10|dc|
khomm|Khomm|L10|dc|
vulpter|Vulpter|L9|dc|
vjun|Vjun|M10|dc|
kalist|Kalist|L10|dc|
coruscant|Coruscant|L9|co|Corusca
alsakan|Alsakan|L9|co|
anaxes|Anaxes|L9|co|
chandrila|Chandrila|L8|co|Bormea
corulag|Corulag|K9|co|Bormea
hosnian|Hosnian Prime|K10|co|
brentaal|Brentaal|K9|co|
esseles|Esseles|K10|co|
ralltiir|Ralltiir|L10|co|
alderaan|Alderaan|M10|co|Alderaan
kuat|Kuat|N10|co|Kuat
corellia|Corellia|M11|co|Corellian
drall|Drall|M11|co|Corellian
selonia|Selonia|M11|co|Corellian
talus|Talus|M11|co|Corellian
tralus|Tralus|M11|co|Corellian
duro|Duro|L12|co|Duro
abregadorae|Abregado-rae|L11|co|
metellos|Metellos|L9|co|
axum|Axum|L10|co|
humbarine|Humbarine|K9|co|
rhinnal|Rhinnal|M10|co|
skako|Skako|L9|co|
gatalenta|Gatalenta|M10|co|
nubia|Nubia|M11|co|
arkania|Arkania|L8|co|
ghorman|Ghorman|K11|cl|
catoneimoidia|Cato Neimoidia|N12|cl|
neimoidia|Neimoidia|N12|cl|
carida|Carida|N11|cl|
commenor|Commenor|M12|cl|
fondor|Fondor|L12|cl|
balmorra|Balmorra|K11|cl|
thyferra|Thyferra|M12|cl|
rendili|Rendili|L11|cl|
obroaskai|Obroa-skai|J10|cl|
ixtlar|Ixtlar|L8|cl|
bandomeer|Bandomeer|N9|cl|
corsin|Corsin|J11|cl|
jakku|Jakku|G11|ir|Western Reaches
onderon|Onderon|N8|ir|Japrael
caamas|Caamas|M13|ir|
denon|Denon|N11|ir|
lantillies|Lantillies|M8|ir|
hapes|Hapes|O9|ir|Hapes
pantolomin|Pantolomin|L13|ir|
contruum|Contruum|J9|ir|
ordibanna|Ord Ibanna|K13|ir|
kalarba|Kalarba|K8|ir|
yinchorr|Yinchorr|N13|ir|
umbara|Umbara|K6|ex|Ghost Nebula
dorin|Dorin|K7|ex|
kalee|Kalee|O12|ex|
ordcestus|Ord Cestus|N14|ex|
lianna|Lianna|J13|ex|
borleias|Borleias|L7|ex|
bpfassh|Bpfassh|O8|ex|
mongazza|Mon Gazza|L14|ex|
woostri|Woostri|I9|ex|
zeltros|Zeltros|P12|ex|
kashyyyk|Kashyyyk|P9|mr|Mytaranor
trandosha|Trandosha|P9|mr|Mytaranor
naboo|Naboo|O17|mr|Chommell
malastare|Malastare|N17|mr|Dustig
ordmantell|Ord Mantell|L7|mr|Bright Jewel
takodana|Takodana|I12|mr|Western Reaches
kijimi|Kijimi|J5|mr|
ithor|Ithor|M7|mr|Lazerian
bothawui|Bothawui|R14|mr|Both
iridonia|Iridonia|N8|mr|
mimban|Mimban|J9|mr|
wobani|Wobani|L14|mr|
bracca|Bracca|N14|mr|
castilon|Castilon|H13|mr|
ruusan|Ruusan|N7|mr|
pasaana|Pasaana|J14|mr|
vandor|Vandor|O15|mr|
numidian|Numidian Prime|M15|mr|
taanab|Taanab|M8|mr|
qiilura|Qiilura|I14|mr|
devaron|Devaron|N9|mr|
chalacta|Chalacta|O14|mr|
cerea|Cerea|M14|mr|
zygerria|Zygerria|P14|mr|
falleen|Falleen|Q13|mr|
gamorr|Gamorr|Q14|mr|
gyndine|Gyndine|O13|mr|
champala|Champala|N16|mr|Chommell
glee|Glee Anselm|J12|mr|
iego|Iego|L15|mr|
ordradama|Ord Radama|P13|mr|
toprawa|Toprawa|O15|mr|
wayland|Wayland|L13|mr|
manaan|Manaan|L15|mr|
aldhani|Aldhani|H11|mr|
makeb|Makeb|R12|mr|
tatooine|Tatooine|R16|or|Arkanis
geonosis|Geonosis|R15|or|Arkanis
ryloth|Ryloth|S17|or|Gaulus
rodia|Rodia|R16|or|Tyrius
christophsis|Christophsis|Q16|or|Savareen
saleucami|Saleucami|Q15|or|
savareen|Savareen|Q17|or|Savareen
hoth|Hoth|K18|or|Anoat
bespin|Bespin|K19|or|Anoat
anoat|Anoat|K18|or|Anoat
dagobah|Dagobah|M19|or|Sluis
sluisvan|Sluis Van|M19|or|Sluis
mustafar|Mustafar|L19|or|Atravis
eriadu|Eriadu|M18|or|Seswenna
sullust|Sullust|M17|or|
utapau|Utapau|N19|or|Tarabba
crait|Crait|N20|or|
endor|Endor|H16|or|Moddell
bakura|Bakura|G16|or|
polismassa|Polis Massa|K19|or|Subterrel
koboh|Koboh|N18|or|
morak|Morak|L18|or|
sorgan|Sorgan|O19|or|
arvala|Arvala-7|Q19|or|
nevarro|Nevarro|P18|or|
cantonica|Cantonica|S18|or|
belsavis|Belsavis|P18|or|
yavin|Yavin|P6|or|Gordian Reach
mandalore|Mandalore|O7|or|Mandalore
concorddawn|Concord Dawn|O7|or|Mandalore
kalevala|Kalevala|O6|or|Mandalore
dathomir|Dathomir|O5|or|Quelii
felucia|Felucia|R6|or|
moncala|Mon Cala|U7|or|Calamari
dantooine|Dantooine|L3|or|Raioballo
mygeeto|Mygeeto|J3|or|
muunilinst|Muunilinst|K4|or|
scipio|Scipio|K3|or|
kessel|Kessel|T10|or|Kessel
lothal|Lothal|R13|or|Lothal
garel|Garel|R13|or|Lothal
atollon|Atollon|S14|or|Lothal
scarif|Scarif|T15|or|Abrion
eadu|Eadu|S16|or|
lahmu|Lah'mu|S15|or|
dqar|D'Qar|T8|or|Ileenium
ajankloss|Ajan Kloss|P3|or|
batuu|Batuu|F15|or|
korriban|Korriban|R5|or|Esstran
dromundkaas|Dromund Kaas|S5|or|Esstran
ziost|Ziost|R4|or|Esstran
taris|Taris|M5|or|Ojoster
voss|Voss|K15|or|
oricon|Oricon|P4|or|
ossus|Ossus|Q6|or|Auril
raxus|Raxus|N4|or|
serenno|Serenno|O4|or|
ferrix|Ferrix|P16|or|
niamos|Niamos|P17|or|
narkina|Narkina 5|Q18|or|
jabiim|Jabiim|M4|or|
maridun|Maridun|Q7|or|
nelvaan|Nelvaan|N3|or|
rhenvar|Rhen Var|L4|or|
alzoc|Alzoc III|L17|or|
abafar|Abafar|Q4|or|
florrum|Florrum|R9|or|
orto|Orto Plutonia|S6|or|
pantora|Pantora|S6|or|
raxusprime|Raxus Prime|P5|or|
malachor|Malachor|S8|or|
quarzite|Quarzite|Q5|or|
agamar|Agamar|O20|or|
socorro|Socorro|I17|or|
tund|Tund|H17|or|
roche|Roche|N20|or|
bilbringi|Bilbringi|M16|or|
yagdhul|Yag'Dhul|M16|or|
dellalt|Dellalt|S9|or|
bonadan|Bonadan|R18|or|
ando|Ando|K4|or|
mechis|Mechis III|N16|or|
nkllon|Nkllon|K17|or|
honoghr|Honoghr|S10|or|
drongar|Drongar|Q8|or|
kothlis|Kothlis|R14|or|
mirial|Mirial|O18|or|
rattatak|Rattatak|S7|or|
xagobah|Xagobah|Q17|or|
zolan|Zolan|U9|or|
lwhekk|Lwhekk|T7|or|
ukio|Ukio|K12|or|
haruunkal|Haruun Kal|N18|or|
ansion|Ansion|K6|or|
belderone|Belderone|R17|or|
bimmisaari|Bimmisaari|N6|or|
sernpidal|Sernpidal|L18|or|
dubrillion|Dubrillion|J4|or|
nar_kreeta|Nar Kreeta|T11|hs|
nalhutta|Nal Hutta|S11|hs|Y'Toub
ylesia|Ylesia|S11|hs|
toydaria|Toydaria|S11|hs|
klatooine|Klatooine|S12|hs|
sriluur|Sriluur|S12|hs|
ubrikkia|Ubrikkia|S13|hs|
varl|Varl|S12|hs|
quesh|Quesh|T12|hs|
rishi|Rishi|T14|or|
kamino|Kamino|S15|ws|
teth|Teth|U12|ws|
iokath|Iokath|U9|ws|
odessen|Odessen|T4|ws|
zakuul|Zakuul|V6|ws|
lehon|Lehon|C10|ur|
ilum|Ilum|G7|ur|
ahchto|Ahch-To|D6|ur|
exegol|Exegol|C11|ur|
csilla|Csilla|B9|ur|Chiss
naporar|Naporar|B8|ur|Chiss
rhigar|Rhigar|B10|ur|Chiss
nirauan|Nirauan|D12|ur|
myrkr|Myrkr|E9|ur|
nzoth|N'zoth|D8|ur|
lwotil|Sarvchi|C8|ur|Chiss
`.trim().split('\n').map(l => l.split('|'));

  // Beschreibungen (zweisprachig) nur für bekannte Welten
  const DESC = {
    coruscant: ['Stadtplanet und jahrtausendelang Hauptstadt der Galaxis.', 'City-covered world and galactic capital for millennia.'],
    chandrila: ['Grüne Kernwelt, erste Hauptstadt der Neuen Republik.', 'Green Core world, first capital of the New Republic.'],
    alderaan: ['Friedliche Kernwelt, 0 VSY vom Todesstern zerstört.', 'Peaceful Core world, destroyed by the Death Star in 0 BBY.'],
    corellia: ['Werftwelt und Heimat berühmter Piloten.', 'Shipbuilding world, home of famous pilots.'],
    kuat: ['Sitz der Kuat-Triebwerkswerften.', 'Home of Kuat Drive Yards.'],
    hosnian: ['Spätere Hauptstadt der Neuen Republik.', 'Later capital of the New Republic.'],
    byss: ['Abgelegene Welt im Tiefkern, Rückzugsort imperialer Kräfte.', 'Remote Deep Core world, refuge of Imperial forces.'],
    tython: ['Uralte Welt, mit den Anfängen der Jedi verbunden.', 'Ancient world tied to the origins of the Jedi.'],
    jakku: ['Wüstenwelt in den Westlichen Weiten, Schiffsfriedhof.', 'Desert world in the Western Reaches, a starship graveyard.'],
    kashyyyk: ['Waldwelt der Wookiees.', 'Forest homeworld of the Wookiees.'],
    naboo: ['Heimat von Padmé Amidala und Palpatine.', 'Home of Padmé Amidala and Palpatine.'],
    tatooine: ['Wüstenwelt mit zwei Sonnen.', 'Desert world with twin suns.'],
    geonosis: ['Droidenfabriken; Beginn der Klonkriege.', 'Droid foundries; the Clone Wars began here.'],
    hoth: ['Eisplanet, Echo-Basis der Rebellen.', 'Ice planet, site of the Rebels\' Echo Base.'],
    bespin: ['Gasriese mit der Wolkenstadt.', 'Gas giant with Cloud City.'],
    dagobah: ['Sumpfwelt, Yodas Exil.', 'Swamp world, Yoda\'s exile.'],
    mustafar: ['Vulkanwelt, Vaders Festung.', 'Volcanic world, Vader\'s fortress.'],
    endor: ['Gasriese; Waldmond mit den Ewoks.', 'Gas giant; its forest moon is home to the Ewoks.'],
    yavin: ['Gasriese; auf Yavin 4 lag die Rebellenbasis.', 'Gas giant; the Rebel base was on Yavin 4.'],
    mandalore: ['Heimat der Mandalorianer.', 'Homeworld of the Mandalorians.'],
    dathomir: ['Welt der Nachtschwestern.', 'World of the Nightsisters.'],
    moncala: ['Ozeanwelt, Werften der Mon Calamari.', 'Ocean world with Mon Calamari shipyards.'],
    kessel: ['Gewürzminen.', 'Spice mines.'],
    lothal: ['Grasland, Wiege eines frühen Aufstands.', 'Grasslands, cradle of an early rebellion.'],
    scarif: ['Tropische Welt mit imperialer Zitadelle.', 'Tropical world with an Imperial citadel.'],
    kamino: ['Ozeanwelt der Klonkrieger.', 'Ocean world of the clone troopers.'],
    nalhutta: ['Thronwelt der Hutten.', 'Throne world of the Hutts.'],
    ilum: ['Kyberkristall-Welt, später Starkiller-Basis.', 'Kyber crystal world, later Starkiller Base.'],
    ahchto: ['Ozeanwelt mit dem ersten Jedi-Tempel.', 'Ocean world with the first Jedi Temple.'],
    exegol: ['Verborgene Welt der Sith.', 'Hidden world of the Sith.'],
    csilla: ['Eiswelt der Chiss.', 'Ice world of the Chiss.'],
    korriban: ['Uralte Grabwelt der Sith (auch Moraband).', 'Ancient Sith tomb world (also Moraband).'],
    dromundkaas: ['Hauptstadt des Sith-Imperiums zur Zeit der Alten Republik.', 'Capital of the Sith Empire in the Old Republic era.'],
    ziost: ['Alte Sith-Welt.', 'Ancient Sith world.'],
    taris: ['Stadtwelt im Äußeren Rand, mehrfach verwüstet.', 'Outer Rim ecumenopolis, devastated more than once.'],
    ossus: ['Alte Jedi-Bibliothekswelt.', 'Ancient Jedi library world.'],
    ryloth: ['Heimatwelt der Twi\'leks.', 'Homeworld of the Twi\'leks.'],
    takodana: ['Neutrale Welt, Maz Kanatas Schloss.', 'Neutral world, home of Maz Kanata\'s castle.'],
    crait: ['Salzwelt mit alter Rebellenbasis.', 'Salt world with an old Rebel base.'],
    dqar: ['Basis des Widerstands.', 'Base of the Resistance.'],
    ajankloss: ['Dschungelbasis des Widerstands.', 'Jungle base of the Resistance.'],
    nevarro: ['Vulkanwelt, Kopfgeldjäger-Gilde.', 'Volcanic world of the Bounty Hunters\' Guild.'],
    sullust: ['Vulkanwelt, Sammelpunkt vor Endor.', 'Volcanic world, staging point before Endor.'],
    utapau: ['Dolinenwelt.', 'World of giant sinkholes.'],
    batuu: ['Grenzwelt am Rand des Bekannten.', 'Frontier world on the edge of known space.']
  };

  const objects = [];
  const byId = {};
  function add(o) { objects.push(o); byId[o.id] = o; return o; }
  for (const row of SYSTEMS) {
    let [id, name, grid, code, sector] = row;
    // offizielle Rasterfelder, Regionen und Sektoren aus dem Atlas übernehmen
    const ai = atlasMatch(id, name);
    if (ai != null) { const a = ATLAS[ai]; atlasUsed.add(ai); grid = a.grid; code = a.rc; if (a.sector) sector = a.sector.replace(/\s*\(.*\)$/, ''); }
    const region = REGION_CODES[code];
    const p = place(grid, region, id);
    const d = DESC[id];
    add({ id, name, type: 'planet', x: p.x, y: p.y, region, sector: sector || null, grid, desc: d ? d[0] : '', descEn: d ? d[1] : '', parent: null, from: null, to: null });
  }
  const HUTT_C = { x: byId.nalhutta.x, y: byId.nalhutta.y };
  for (const o of objects) if (o.region === 'huttspace' && o.id !== 'nalhutta') Object.assign(o, huttPull(o, o.id, HUTT_C));

  // Sonnen (Planet wird Kind der Sonne)
  const SUNS = [['tatoo1', 'Tatoo I', 'tatooine'], ['tatoo2', 'Tatoo II', 'tatooine'], ['coruscantprime', 'Coruscant Prime', 'coruscant'],
    ['corell', 'Corell', 'corellia'], ['yavinprime', 'Yavin Prime', 'yavin'], ['hothstar', 'Hoth (Stern)/Hoth (star)', 'hoth'], ['kesselstar', 'Kessel (Stern)/Kessel (star)', 'kessel'],
    ['endorstar', 'Endor I', 'endor'], ['alderaanstar', 'Alderaan (Stern)/Alderaan (star)', 'alderaan'], ['nabooStar', 'Naboo (Stern)/Naboo (star)', 'naboo']];
  for (const [id, nm, pid] of SUNS) {
    const p = byId[pid]; const [name, nameEn] = nm.split('/');
    add({ id, name, nameEn: nameEn || name, type: 'sun', x: p.x, y: p.y, region: p.region, sector: p.sector, desc: '', descEn: '', parent: null, from: null, to: null });
  }
  byId.tatooine.parent = 'tatoo1'; byId.tatoo2.parent = 'tatoo1';
  byId.coruscant.parent = 'coruscantprime'; byId.corellia.parent = 'corell'; byId.yavin.parent = 'yavinprime';
  byId.hoth.parent = 'hothstar'; byId.kessel.parent = 'kesselstar'; byId.endor.parent = 'endorstar';
  byId.alderaan.parent = 'alderaanstar'; byId.naboo.parent = 'nabooStar';
  // Corellianisches System: Schwesterwelten umkreisen Corell
  for (const k of ['drall', 'selonia', 'talus', 'tralus']) byId[k].parent = 'corell';

  // Monde
  const MOONS = [
    ['yavin4', 'Yavin 4', 'yavin', ['Dschungelmond mit Massassi-Tempeln, Rebellenbasis.', 'Jungle moon with Massassi temples, Rebel base.']],
    ['endormoon', 'Waldmond Endor/Forest Moon of Endor', 'endor', ['Heimat der Ewoks.', 'Home of the Ewoks.']],
    ['kefbir', 'Kef Bir', 'endor', ['Ozeanmond mit Trümmern des zweiten Todessterns.', 'Ocean moon with wreckage of the second Death Star.']],
    ['narshaddaa', 'Nar Shaddaa', 'nalhutta', ['Der "Schmugglermond".', 'The "Smugglers\' Moon".']],
    ['concordia', 'Concordia', 'mandalore', null],
    ['ohmadun', 'Ohma-D\'un', 'naboo', null], ['rori', 'Rori', 'naboo', null],
    ['ghomrassen', 'Ghomrassen', 'tatooine', null], ['guermessa', 'Guermessa', 'tatooine', null], ['chenini', 'Chenini', 'tatooine', null],
    ['dxun', 'Dxun', 'onderon', null], ['rishimoon', 'Rishi-Mond/Rishi Moon', 'rishi', null],
    ['ordomoon', 'Kalevala-Mond/Kalevala Moon', 'kalevala', null], ['lothalmoon', 'Lothal-Mond/Lothal Moon', 'lothal', null],
    ['belsalus', 'Bespin-Mond/Bespin Moon', 'bespin', null]
  ];
  for (const [id, name, parent, d] of MOONS) {
    const p = byId[parent];
    const [de, en] = name.split('/');
    add({ id, name: de, nameEn: en || de, type: 'moon', x: p.x, y: p.y, region: p.region, sector: p.sector, desc: d ? d[0] : '', descEn: d ? d[1] : '', parent, from: null, to: null });
  }
  const jp = place('O13', 'midrim', 'jedha');
  add({ id: 'jedha', name: 'Jedha', type: 'moon', x: jp.x, y: jp.y, region: 'midrim', sector: null, desc: 'Heiliger Wüstenmond, 0 VSY vom Todesstern verwüstet.', descEn: 'Holy desert moon, devastated by the Death Star in 0 BBY.', parent: null, from: null, to: null });

  // Stationen
  const sb = place('R10', 'outerrim', 'starlight'), ds = place('Q5', 'outerrim', 'deathstar'), kf = place('O16', 'midrim', 'kafrene');
  const STATIONS = [
    ['cloudcity', 'Wolkenstadt/Cloud City', 'bespin', null, null, null, ['Tibanna-Gasmine über Bespin.', 'Tibanna gas mine above Bespin.']],
    ['kdy', 'Kuat-Triebwerkswerften/Kuat Drive Yards', 'kuat', null, null, null, ['Orbitalwerften für Sternzerstörer.', 'Orbital shipyards for Star Destroyers.']],
    ['cec', 'Corellianische Werften/Corellian Shipyards', 'corellia', null, null, null, ['Werften der Corellian Engineering Corporation.', 'Shipyards of the Corellian Engineering Corporation.']],
    ['fondoryards', 'Fondor-Werften/Fondor Shipyards', 'fondor', null, null, null, null],
    ['starlight', 'Starlight Beacon', null, sb, -235, -230, ['Leuchtfeuer der Hohen Republik im Äußeren Rand.', 'High Republic beacon in the Outer Rim.']],
    ['deathstar', 'Todesstern/Death Star', null, ds, -19, 0, ['Kampfstation des Imperiums, bei Yavin zerstört.', 'Imperial battle station, destroyed at Yavin.']],
    ['deathstar2', 'Todesstern II/Death Star II', 'endor', null, 1, 4, ['Zweite Kampfstation, bei Endor zerstört.', 'Second battle station, destroyed at Endor.']],
    ['starkiller', 'Starkiller-Basis/Starkiller Base', 'ilum', null, 9, 34, ['In einen Planeten gebaute Superwaffe der Ersten Ordnung.', 'First Order superweapon built into a planet.']],
    ['kafrene', 'Ring von Kafrene/Ring of Kafrene', null, kf, null, null, ['Handelsposten zwischen zwei Asteroiden.', 'Trading outpost between two asteroids.']],
    ['echobase', 'Echo-Basis/Echo Base', 'hoth', null, 0, 3, null],
    ['scarifcitadel', 'Zitadelle von Scarif/Citadel Tower', 'scarif', null, -10, 0, null]
  ];
  for (const [id, name, parent, pos, from, to, d] of STATIONS) {
    const p = parent ? byId[parent] : null;
    const [de, en] = name.split('/');
    add({ id, name: de, nameEn: en || de, type: 'station', x: p ? p.x : pos.x, y: p ? p.y : pos.y, region: p ? p.region : 'outerrim', sector: p ? p.sector : null,
      desc: d ? d[0] : '', descEn: d ? d[1] : '', parent, from, to });
  }

  // ---------------------------------------------------------------- Hyperraumrouten (angenähert)
  const ROUTES = [
    ['perlemian', 'Perlemianische Handelsroute/Perlemian Trade Route', 'major', 'coruscant chandrila ixtlar lantillies taanab ordmantell ossus korriban'],
    ['hydian', 'Hydianischer Weg/Hydian Way', 'major', 'mygeeto ando kijimi umbara borleias brentaal corulag esseles corsin ordibanna wobani eriadu bilbringi sernpidal'],
    ['corellianrun', 'Corellianischer Lauf/Corellian Run', 'major', 'coruscant ralltiir corellia nubia caamas cerea christophsis rodia ryloth'],
    ['tradespine', 'Corellianische Handelsader/Corellian Trade Spine', 'major', 'corellia duro mongazza ordcestus yagdhul anoat bespin'],
    ['rimma', 'Rimma-Handelsroute/Rimma Trade Route', 'major', 'abregadorae thyferra yinchorr cerea sullust eriadu sluisvan dagobah'],
    ['triellus', 'Triellus-Handelsroute/Triellus Trade Route', 'minor', 'nalhutta klatooine falleen christophsis tatooine savareen'],
    ['kesselrun', 'Kessel-Route/Kessel Run', 'minor', 'kessel dellalt honoghr nar_kreeta'],
    ['hydianwest', 'Westliche Weiten-Route/Western Reaches Route', 'minor', 'corulag obroaskai contruum woostri jakku takodana castilon'],
    ['sithroute', 'Sith-Handelsroute/Sith Trade Route', 'minor', 'korriban ziost dromundkaas taris'],
    ['shiningway', 'Gordische Route/Gordian Route', 'minor', 'ordmantell bimmisaari yavin maridun felucia dathomir'],
    ['mandaloreroute', 'Mandalorianische Route/Mandalorian Route', 'minor', 'ordmantell mandalore concorddawn kalevala'],
    ['shipwrights', 'Werftenroute/Shipwrights\' Trace', 'minor', 'kuat bpfassh devaron kashyyyk'],
    ['hutt', 'Hutten-Route/Hutt Route', 'minor', 'nalhutta ylesia toydaria makeb florrum dellalt']
  ].map(([id, name, kind, pts]) => { const [de, en] = name.split('/'); return { id, name: de, nameEn: en, kind, points: pts.split(' ').filter(k => byId[k]) }; });

  // ---------------------------------------------------------------- Fraktionen
  const factions = [
    ['rep', 'Galaktische Republik/Galactic Republic', '#e2b13c', 140],
    ['sithemp', 'Sith-Imperium/Sith Empire', '#b3261e', 140],
    ['nihil', 'Nihil/Nihil', '#8e44ad', 120],
    ['tf', 'Handelsföderation/Trade Federation', '#c07a3a', 110],
    ['kus', 'Konföderation unabhängiger Systeme/Confederacy of Independent Systems', '#3d7be0', 130],
    ['mando', 'Mandalore (neutral)/Mandalore (neutral)', '#2ecc71', 110],
    ['emp', 'Galaktisches Imperium/Galactic Empire', '#8f9aa6', 140],
    ['reb', 'Rebellenallianz/Rebel Alliance', '#f0802e', 120],
    ['nr', 'Neue Republik/New Republic', '#3fb6d9', 140],
    ['imprest', 'Imperiale Überreste/Imperial Remnants', '#5d6b78', 120],
    ['fo', 'Erste Ordnung/First Order', '#ff3d3d', 140],
    ['res', 'Widerstand/Resistance', '#ffb74d', 120],
    ['sith', 'Sith Eternal/Sith Eternal', '#c2185b', 120],
    ['hutt', 'Huttenkartell/Hutt Cartel', '#9ccc65', 120],
    ['chiss', 'Chiss-Aszendenz/Chiss Ascendancy', '#1e88e5', 130],
    ['zakuul', 'Ewiges Imperium (Zakuul)/Eternal Empire (Zakuul)', '#d9d4ff', 140],
    ['alliance', 'Allianz von Odessen/Odessen Alliance', '#26c6da', 120]
  ].map(([id, name, color, reach]) => { const [de, en] = name.split('/'); return { id, name: de, nameEn: en, color, reach }; });

  // ---------------------------------------------------------------- Zeitalter
  const INNER = ['core', 'colonies', 'innerrim', 'expansion'];
  const UPTO_MID = ['deepcore'].concat(INNER, ['midrim']);
  const ALL_KNOWN = UPTO_MID.concat(['outerrim', 'wildspace']);
  const regs = (list, f) => Object.fromEntries(list.map(r => [r, f]));
  const CHISS = { f: 'chiss', x: 230, y: 900, r: 200 };
  // Gemeinsame Grundlage der Alten-Republik-Zeitalter (Legends/SWTOR)
  const OR_BASE = { korriban: 'sithemp', dromundkaas: 'sithemp', ziost: 'sithemp', balmorra: 'sithemp', oricon: 'sithemp', raxusprime: 'sithemp',
    taris: 'rep', ordmantell: 'rep', belsavis: 'rep', tython: 'rep', coruscant: 'rep', alderaan: 'rep', corellia: 'rep', kashyyyk: 'rep', naboo: 'rep',
    ossus: 'rep', ryloth: 'rep', moncala: 'rep', quesh: 'hutt', makeb: 'hutt', nalhutta: 'hutt', tatooine: null, hoth: null, voss: null, rishi: null,
    mandalore: 'mando', concorddawn: 'mando', csilla: 'chiss', naporar: 'chiss', rhigar: 'chiss' };

  const ERA_DEFS = [
    {
      name: ['Großer Galaktischer Krieg', 'Great Galactic War'], year: -3681,
      desc: ['Legends/SWTOR (Jahre angenähert): Das Sith-Imperium kehrt aus dem Unbekannten zurück und überrollt große Teile des Äußeren Randes.',
        'Legends/SWTOR (approximate years): the Sith Empire returns from the unknown and overruns much of the Outer Rim.'],
      regions: Object.assign(regs(['deepcore', 'core', 'colonies', 'innerrim', 'expansion', 'midrim'], 'rep'), { huttspace: 'hutt' }),
      set: Object.assign({}, OR_BASE, { balmorra: 'sithemp', taris: 'sithemp', ordmantell: null, corellia: 'rep' }),
      zones: [{ f: 'sithemp', x: 1480, y: 300, r: 260 }, { f: 'sithemp', x: 1700, y: 360, r: 200 }, { f: 'sithemp', x: 1300, y: 260, r: 170 }, CHISS]
    },
    {
      name: ['Vertrag von Coruscant / Kalter Krieg', 'Treaty of Coruscant / Cold War'], year: -3653,
      desc: ['Legends/SWTOR: Nach der Plünderung Coruscants wird der Vertrag geschlossen. Republik und Sith-Imperium belauern sich in einem Kalten Krieg.',
        'Legends/SWTOR: after the Sacking of Coruscant the treaty is signed. Republic and Sith Empire face off in a cold war.'],
      regions: Object.assign(regs(['deepcore', 'core', 'colonies', 'innerrim', 'expansion'], 'rep'), { huttspace: 'hutt' }),
      set: Object.assign({}, OR_BASE),
      zones: [{ f: 'sithemp', x: 1480, y: 300, r: 230 }, { f: 'sithemp', x: 1700, y: 360, r: 170 }, CHISS]
    },
    {
      name: ['Galaktischer Krieg (SWTOR)', 'Galactic War (SWTOR)'], year: -3642,
      desc: ['Legends/SWTOR: Der Krieg bricht erneut offen aus – Schlachten um Corellia, Ilum und Belsavis. Zeit der Klassengeschichten.',
        'Legends/SWTOR: open war breaks out again – battles for Corellia, Ilum and Belsavis. Time of the class stories.'],
      regions: Object.assign(regs(['deepcore', 'core', 'colonies', 'innerrim', 'expansion'], 'rep'), { huttspace: 'hutt' }),
      set: Object.assign({}, OR_BASE, { taris: 'rep', ilum: 'sithemp', corellia: 'rep', makeb: 'hutt', voss: null, hoth: null }),
      zones: [{ f: 'sithemp', x: 1480, y: 300, r: 240 }, { f: 'sithemp', x: 1700, y: 360, r: 180 }, { f: 'sithemp', x: 1180, y: 300, r: 120 }, CHISS]
    },
    {
      name: ['Schatten von Revan', 'Shadow of Revan'], year: -3637,
      desc: ['Legends/SWTOR: Die Revaniter bedrohen beide Seiten; Republik und Imperium kämpfen auf Rishi und Yavin 4 Seite an Seite. 3636 VSY wird Ziost ausgelöscht.',
        'Legends/SWTOR: the Revanites threaten both sides; Republic and Empire fight together on Rishi and Yavin 4. In 3636 BBY Ziost is wiped out.'],
      regions: Object.assign(regs(['deepcore', 'core', 'colonies', 'innerrim', 'expansion'], 'rep'), { huttspace: 'hutt' }),
      set: Object.assign({}, OR_BASE, { taris: 'rep', ilum: 'sithemp', rishi: null, yavin: null, makeb: 'hutt' }),
      zones: [{ f: 'sithemp', x: 1480, y: 300, r: 240 }, { f: 'sithemp', x: 1700, y: 360, r: 180 }, CHISS]
    },
    {
      name: ['Ewiges Imperium von Zakuul', 'Eternal Empire of Zakuul'], year: -3636,
      desc: ['Legends/SWTOR: Das Ewige Imperium aus dem Wilden Raum unterwirft Republik und Sith-Imperium, beide zahlen Tribut.',
        'Legends/SWTOR: the Eternal Empire from Wild Space subjugates both the Republic and the Sith Empire, which pay tribute.'],
      regions: Object.assign(regs(['deepcore', 'core', 'colonies', 'innerrim', 'expansion'], 'rep'), { huttspace: 'hutt', wildspace: 'zakuul' }),
      set: Object.assign({}, OR_BASE, { zakuul: 'zakuul', iokath: 'zakuul', odessen: null, ziost: null }),
      zones: [{ f: 'sithemp', x: 1480, y: 300, r: 220 }, { f: 'zakuul', x: 1950, y: 560, r: 260 }, { f: 'zakuul', x: 2050, y: 900, r: 220 }, CHISS]
    },
    {
      name: ['Allianz gegen Zakuul', 'Alliance against Zakuul'], year: -3631,
      desc: ['Legends/SWTOR: Der Fremdling gründet auf Odessen die Allianz und stürzt schließlich den Ewigen Thron.',
        'Legends/SWTOR: the Outlander founds the Alliance on Odessen and finally overthrows the Eternal Throne.'],
      regions: Object.assign(regs(['deepcore', 'core', 'colonies', 'innerrim', 'expansion'], 'rep'), { huttspace: 'hutt', wildspace: 'zakuul' }),
      set: Object.assign({}, OR_BASE, { zakuul: 'zakuul', iokath: 'zakuul', odessen: 'alliance', ziost: null }),
      zones: [{ f: 'sithemp', x: 1480, y: 300, r: 220 }, { f: 'zakuul', x: 1950, y: 560, r: 240 }, { f: 'alliance', x: 1780, y: 260, r: 150 }, CHISS]
    },
    {
      name: ['Ansturm – neuer Krieg', 'Onslaught – war renewed'], year: -3629,
      desc: ['Legends/SWTOR: Nach dem Fall Zakuuls flammt der Krieg zwischen Republik und Sith-Imperium wieder auf; die Allianz zerfällt. Kämpfe um Onderon, Mek-Sha und Ossus.',
        'Legends/SWTOR: after Zakuul falls, war between Republic and Sith Empire flares up again and the Alliance breaks apart. Fighting over Onderon, Mek-Sha and Ossus.'],
      regions: Object.assign(regs(['deepcore', 'core', 'colonies', 'innerrim', 'expansion'], 'rep'), { huttspace: 'hutt' }),
      set: Object.assign({}, OR_BASE, { onderon: 'sithemp', ossus: 'rep', odessen: 'alliance', zakuul: null, ziost: null }),
      zones: [{ f: 'sithemp', x: 1480, y: 300, r: 240 }, { f: 'sithemp', x: 1700, y: 360, r: 180 }, CHISS]
    },
    {
      name: ['Hohe Republik', 'High Republic'], year: -232,
      desc: ['Goldenes Zeitalter der Republik und der Jedi. Starlight Beacon bringt die Republik in den Äußeren Rand, die Nihil plündern an der Grenze.',
        'Golden age of the Republic and the Jedi. Starlight Beacon extends the Republic into the Outer Rim while the Nihil raid the frontier.'],
      regions: Object.assign(regs(UPTO_MID, 'rep'), { huttspace: 'hutt' }),
      set: { nalhutta: 'hutt', tatooine: 'hutt', starlight: 'rep', ryloth: 'rep', kamino: null, mandalore: 'mando' },
      zones: [{ f: 'nihil', x: 1980, y: 1250, r: 170 }, { f: 'nihil', x: 1880, y: 1420, r: 130 }]
    },
    {
      name: ['Untergang der Republik', 'Fall of the Republic'], year: -32,
      desc: ['Die Republik ist träge geworden. Die Handelsföderation blockiert Naboo, im Äußeren Rand herrschen die Hutten.',
        'The Republic has grown stagnant. The Trade Federation blockades Naboo; the Hutts rule much of the Outer Rim.'],
      regions: Object.assign(regs(UPTO_MID, 'rep'), { huttspace: 'hutt' }),
      set: { tatooine: 'hutt', nalhutta: 'hutt', catoneimoidia: 'tf', neimoidia: 'tf', ryloth: null, kessel: null, kamino: null, moncala: 'rep', mandalore: 'mando', concorddawn: 'mando', kalevala: 'mando' },
      zones: []
    },
    {
      name: ['Klonkriege', 'Clone Wars'], year: -22,
      desc: ['Republik gegen Separatisten. Mandalore bleibt neutral, die Hutten spielen beide Seiten gegeneinander aus.',
        'Republic versus Separatists. Mandalore stays neutral while the Hutts play both sides.'],
      regions: Object.assign(regs(UPTO_MID, 'rep'), { huttspace: 'hutt' }),
      set: {
        geonosis: 'kus', mustafar: 'kus', utapau: 'kus', felucia: 'kus', mygeeto: 'kus', muunilinst: 'kus', scipio: 'kus', catoneimoidia: 'kus', neimoidia: 'kus',
        ryloth: 'kus', sullust: 'kus', umbara: 'kus', onderon: 'kus', raxus: 'kus', serenno: 'kus', raxusprime: 'kus', saleucami: 'kus', christophsis: 'rep', kamino: 'rep',
        moncala: 'rep', dantooine: 'rep', mandalore: 'mando', concorddawn: 'mando', kalevala: 'mando', tatooine: 'hutt', nalhutta: 'hutt', zygerria: 'kus', abafar: 'kus'
      },
      zones: [{ f: 'kus', x: 1820, y: 640, r: 150 }, { f: 'kus', x: 1300, y: 330, r: 160 }]
    },
    {
      name: ['Herrschaft des Imperiums', 'Reign of the Empire'], year: -19,
      desc: ['Palpatine ruft das Galaktische Imperium aus. Die Jedi sind fast ausgelöscht.',
        'Palpatine proclaims the Galactic Empire. The Jedi are all but wiped out.'],
      regions: Object.assign(regs(ALL_KNOWN, 'emp'), { huttspace: 'hutt' }),
      set: { tatooine: 'hutt', nalhutta: 'hutt', csilla: 'chiss', naporar: 'chiss', rhigar: 'chiss' },
      zones: [CHISS]
    },
    {
      name: ['Frühe Rebellion', 'Early Rebellion'], year: -5,
      desc: ['Erste Rebellenzellen wie die Phoenix-Staffel formieren sich im Äußeren Rand.',
        'The first rebel cells such as Phoenix Squadron form in the Outer Rim.'],
      regions: Object.assign(regs(ALL_KNOWN, 'emp'), { huttspace: 'hutt' }),
      set: { tatooine: 'hutt', nalhutta: 'hutt', atollon: 'reb', csilla: 'chiss', naporar: 'chiss', rhigar: 'chiss' },
      zones: [CHISS]
    },
    {
      name: ['Schlacht von Yavin', 'Battle of Yavin'], year: 0,
      desc: ['Die Rebellenallianz zerstört den ersten Todesstern von Yavin 4 aus.', 'The Rebel Alliance destroys the first Death Star from Yavin 4.'],
      regions: Object.assign(regs(ALL_KNOWN, 'emp'), { huttspace: 'hutt' }),
      set: { tatooine: 'hutt', nalhutta: 'hutt', yavin: 'reb', yavin4: 'reb', csilla: 'chiss', naporar: 'chiss', rhigar: 'chiss' },
      zones: [CHISS]
    },
    {
      name: ['Schlacht von Hoth', 'Battle of Hoth'], year: 3,
      desc: ['Das Imperium zerschlägt die Echo-Basis; die Rebellenflotte zerstreut sich.', 'The Empire crushes Echo Base; the Rebel fleet scatters.'],
      regions: Object.assign(regs(ALL_KNOWN, 'emp'), { huttspace: 'hutt' }),
      set: { tatooine: 'hutt', nalhutta: 'hutt', hoth: 'reb', csilla: 'chiss', naporar: 'chiss', rhigar: 'chiss' },
      zones: [CHISS]
    },
    {
      name: ['Schlacht von Endor', 'Battle of Endor'], year: 4,
      desc: ['Der Imperator fällt bei Endor. Die Rebellion gewinnt Verbündete wie Mon Cala und Sullust.', 'The Emperor falls at Endor. The Rebellion gains allies such as Mon Cala and Sullust.'],
      regions: Object.assign(regs(ALL_KNOWN, 'emp'), { huttspace: 'hutt' }),
      set: { tatooine: null, nalhutta: 'hutt', endor: 'reb', moncala: 'reb', sullust: 'reb', chandrila: 'reb', csilla: 'chiss', naporar: 'chiss', rhigar: 'chiss' },
      zones: [{ f: 'reb', x: 1700, y: 380, r: 160 }, CHISS]
    },
    {
      name: ['Neue Republik', 'New Republic'], year: 5,
      desc: ['Nach Jakku regiert die Neue Republik den Kern; der Äußere Rand ist gesetzlos, imperiale Überreste halten sich im Tiefkern und an der Peripherie.',
        'After Jakku the New Republic rules the Core; the Outer Rim is lawless and Imperial remnants hold out in the Deep Core and on the fringe.'],
      regions: Object.assign(regs(['core', 'colonies', 'innerrim', 'expansion', 'midrim'], 'nr'), { deepcore: 'imprest', huttspace: 'hutt' }),
      set: { nevarro: 'imprest', morak: 'imprest', jakku: null, tatooine: null, mandalore: null, nalhutta: 'hutt', exegol: 'sith', csilla: 'chiss', naporar: 'chiss', rhigar: 'chiss', ilum: 'imprest' },
      zones: [CHISS]
    },
    {
      name: ['Erste Ordnung', 'First Order'], year: 34,
      desc: ['Die Erste Ordnung bricht aus den Unbekannten Regionen hervor und vernichtet das Hosnian-System.', 'The First Order bursts out of the Unknown Regions and destroys the Hosnian system.'],
      regions: Object.assign(regs(['core', 'colonies', 'innerrim', 'expansion', 'midrim'], 'nr'), { huttspace: 'hutt' }),
      set: { ilum: 'fo', starkiller: 'fo', jakku: 'fo', takodana: null, dqar: 'res', exegol: 'sith', nalhutta: 'hutt', csilla: 'chiss', naporar: 'chiss', hosnian: 'nr', kijimi: null },
      zones: [{ f: 'fo', x: 520, y: 760, r: 260 }, { f: 'fo', x: 600, y: 1150, r: 220 }, { f: 'chiss', x: 230, y: 900, r: 160 }]
    },
    {
      name: ['Endgültige Ordnung', 'Final Order'], year: 35,
      desc: ['Die Erste Ordnung beherrscht die Galaxis, Sith Eternal erhebt sich auf Exegol, der Widerstand sammelt sich auf Ajan Kloss.',
        'The First Order dominates the galaxy, Sith Eternal rises on Exegol and the Resistance gathers on Ajan Kloss.'],
      regions: Object.assign(regs(ALL_KNOWN, 'fo'), { huttspace: 'hutt' }),
      set: { ajankloss: 'res', exegol: 'sith', nalhutta: 'hutt', csilla: 'chiss', naporar: 'chiss', ilum: 'fo', takodana: null },
      zones: [{ f: 'fo', x: 520, y: 760, r: 260 }, { f: 'sith', x: 200, y: 1150, r: 150 }, { f: 'chiss', x: 230, y: 900, r: 160 }]
    }
  ];

  // Seit v0.12 liegen viele Welten auf ihren offiziellen Rasterfeldern. Gemalte Einflusszonen
  // der eingebauten Zeitalter wurden entsprechend verschoben: [Fraktion, alt x, alt y, neu x, neu y]
  const ZONE_MOVES = [
    ['sithemp', 1480, 300, 1610, 470], ['sithemp', 1700, 360, 1730, 570], ['sithemp', 1300, 260, 1440, 380], ['sithemp', 1180, 300, 1330, 430],
    ['zakuul', 1950, 560, 400, 1190], ['zakuul', 2050, 900, 390, 990], ['alliance', 1780, 260, 360, 1390],
    ['chiss', 230, 900, 545, 790], ['sith', 200, 1150, 560, 660], ['reb', 1700, 380, 1810, 660],
    ['kus', 1820, 640, 1720, 600], ['kus', 1300, 330, 1520, 460]
  ];
  function moveZone(z) {
    const m = ZONE_MOVES.find(([f, x, y]) => f === (z.f || z.faction) && x === z.x && y === z.y);
    return m ? Object.assign({}, z, { x: m[3], y: m[4] }) : z;
  }

  function buildEra(def, idx, en) {
    const control = {};
    for (const o of objects) {
      if (o.type === 'sun') continue;
      if ((o.type === 'moon' || o.type === 'station') && o.parent) continue;
      const f = def.regions[o.region];
      if (f) control[o.id] = f;
    }
    for (const [k, v] of Object.entries(def.set)) { if (!byId[k]) continue; if (v) control[k] = v; else delete control[k]; }
    const regionClaims = {};
    for (const [r, f] of Object.entries(def.regions)) if (f) regionClaims[r] = f;
    let z = 0;
    return {
      id: 'era' + idx, name: def.name[en ? 1 : 0], year: def.year, desc: def.desc[en ? 1 : 0],
      control, regionClaims, zones: def.zones.map(moveZone).map(q => ({ id: 'z' + idx + '_' + (++z), faction: q.f, x: q.x, y: q.y, r: q.r }))
    };
  }

  function canonTimeline(lang) {
    const en = lang === 'en';
    const loc = o => {
      const c = Object.assign({}, o);
      if (en) { if (c.nameEn) c.name = c.nameEn; if (c.descEn) c.desc = c.descEn; }
      delete c.nameEn; delete c.descEn; return c;
    };
    const facts = window.IAM_WORLDS.starwarsFacts ? window.IAM_WORLDS.starwarsFacts(lang) : {};
    const withFacts = o => { const c = loc(o); const f = facts[c.id]; if (f) { const { biome, ...rest } = f; if (biome) c.biome = biome; if (Object.keys(rest).length) c.facts = rest; } return c; };
    return {
      id: 'canon', world: 'starwars', name: en ? 'Canon (built-in)' : 'Kanon (vorinstalliert)', readonly: true,
      factions: factions.map(loc), objects: objects.map(withFacts), routes: ROUTES.map(loc),
      eras: ERA_DEFS.map((d, i) => buildEra(d, i, en))
    };
  }

  // Alle übrigen Atlas-Systeme als leichte Zusatzebene (nicht Teil der Zeitlinien-Dateien)
  let atlasCache = null;
  function atlas() {
    if (atlasCache) return atlasCache;
    const out = [], seen = new Set(objects.map(o => o.id));
    ATLAS.forEach((e, i) => {
      if (atlasUsed.has(i)) return;
      let id = 'ga_' + (normName(e.name) || 'x' + i); if (seen.has(id)) id += '_' + e.grid.toLowerCase(); if (seen.has(id)) id += '_' + i; seen.add(id);
      const region = REGION_CODES[e.rc] || 'outerrim';
      let p = place(e.grid, region, id);
      if (region === 'huttspace') p = huttPull(p, id, HUTT_C);
      const sm = e.sector && e.sector.match(/^(.*?)\s*\((.*)\)$/);
      out.push({ id, name: e.name, type: 'planet', x: p.x, y: p.y, region, sector: sm ? sm[1] : e.sector, subsector: sm ? sm[2] : null, grid: e.grid, atlas: true });
    });
    return (atlasCache = out);
  }

  window.IAM_WORLDS = window.IAM_WORLDS || {};
  window.IAM_WORLDS.starwars = {
    id: 'starwars', builtin: true, type: 'scifi', geometry: 'galaxy-sw',
    name: { de: 'Star Wars', en: 'Star Wars' },
    yearFmt: { de: { neg: 'VSY', pos: 'NSY' }, en: { neg: 'BBY', pos: 'ABY' } },
    GEO, REGION_KEYS, inWedge, canonTimeline, atlas, normName, gridOf, moveZone, atlasCount: ATLAS.length
  };
})();
