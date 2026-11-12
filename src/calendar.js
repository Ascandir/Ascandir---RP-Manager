/* Ascandir RP-Manager – Kalender pro Zeitlinie (Monate und Tage)
   timeline.calendar = { enabled, preset, months: [{ name, days }] }
   Datumsangaben bleiben rückwärtskompatibel: year (Zahl, wie bisher) + optional month (1…n) + day (1…Tage des Monats).
   Keine Abhängigkeiten; im Browser window.IAM_CAL, in Node module.exports. */
(function (root) {
  'use strict';
  const greg = { de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
  const gregDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Galaktischer Standardkalender (Star Wars Legends): 10 Monate à 35 Tage, dazu 3 Festwochen (je 5 Tage, eine Woche hat 5 Tage) und 3 Feiertage = 368 Tage
  // (Lage und Namen der Festwochen sind in den Quellen nicht eindeutig – neutral benannt, in den Einstellungen umbenennbar)
  const gsc = [['Festwoche 1', 5], ['Elona', 35], ['Kelona', 35], ['Selona', 35], ['Telona', 35], ['Nelona', 35], ['Festwoche 2', 5], ['Helona', 35], ['Melona', 35], ['Yelona', 35], ['Festwoche 3', 5], ['Relona', 35], ['Welona', 35], ['Feiertage', 3]];
  const PRESETS = {
    gsc: lang => gsc.map(([name, days]) => ({ name: lang === 'en' ? name.replace('Festwoche', 'Fete Week').replace('Feiertage', 'Holidays') : name, days })),
    gsc10: () => ['Elona', 'Kelona', 'Selona', 'Telona', 'Nelona', 'Helona', 'Melona', 'Yelona', 'Relona', 'Welona'].map(name => ({ name, days: 35 })),
    gregorian: lang => (greg[lang] || greg.de).map((name, i) => ({ name, days: gregDays[i] })),
    custom: () => [{ name: 'Monat 1', days: 30 }]
  };
  const LIMITS = { months: 40, days: 400, name: 40 };
  class CalError extends Error { constructor(m) { super(m); this.code = 400; } }
  const fail = m => { throw new CalError(m); };

  function normCal(c, lang) {
    if (!c || typeof c !== 'object') return { enabled: false, preset: 'gregorian', months: PRESETS.gregorian(lang) };
    const preset = PRESETS[c.preset] ? c.preset : 'custom';
    let months = Array.isArray(c.months) && c.months.length ? c.months : PRESETS[preset](lang);
    if (months.length > LIMITS.months) fail(`max. ${LIMITS.months} Monate`);
    months = months.map((m, i) => {
      const name = String(m && m.name != null ? m.name : '').trim().slice(0, LIMITS.name) || `${lang === 'en' ? 'Month' : 'Monat'} ${i + 1}`;
      const days = Math.round(Number(m && m.days)); if (!(days >= 1 && days <= LIMITS.days)) fail(`Monat „${name}“: Tage 1…${LIMITS.days}`);
      return { name, days };
    });
    return { enabled: !!c.enabled, preset, months };
  }
  const on = c => !!(c && c.enabled && Array.isArray(c.months) && c.months.length);
  // Monat als Zahl (1…n) oder Name (auch Anfang des Namens) → Nummer
  function monthNo(c, v) {
    if (v == null || v === '') return null;
    const n = Number(v); if (Number.isInteger(n)) { if (n < 1 || n > c.months.length) fail(`Monat 1…${c.months.length}`); return n; }
    const s = String(v).trim().toLowerCase();
    let i = c.months.findIndex(m => m.name.toLowerCase() === s); if (i < 0) i = c.months.findIndex(m => m.name.toLowerCase().startsWith(s));
    if (i < 0) fail(`Monat „${v}“ unbekannt (${c.months.map(m => m.name).join(', ')})`);
    return i + 1;
  }
  // Monat/Tag prüfen; Ergebnis { month, day } (null = nicht angegeben)
  function normMD(c, month, day) {
    if (!on(c)) return { month: null, day: null };
    const m = monthNo(c, month);
    if (day == null || day === '') return { month: m, day: null };
    if (m == null) fail('Tag ohne Monat');
    const d = Number(day), max = c.months[m - 1].days; if (!Number.isInteger(d) || d < 1 || d > max) fail(`Tag 1…${max} (${c.months[m - 1].name})`);
    return { month: m, day: d };
  }
  // Sortierschlüssel: Jahr, dann Monat, dann Tag (fehlende Angaben zählen als Anfang)
  const key = (y, m, d) => (Number(y) || 0) * 10000 + (m || 0) * 100 + (d || 0);
  const keyOf = o => key(o.year, o.month, o.day);
  // Ende eines Zeitraums: Jahr ohne Monat = ganzes Jahr, Monat ohne Tag = ganzer Monat
  const endKey = (y, m, d) => key(y, m == null ? 99 : m, d == null ? 99 : d);
  function fmt(c, y, m, d, fmtYear) {
    const ys = fmtYear(y); if (ys == null) return ys;
    if (!on(c) || !m || !c.months[m - 1]) return ys;
    return `${d ? d + '. ' : ''}${c.months[m - 1].name} ${ys}`;
  }
  // „12. Elona 3640 VSY“, „Elona 3640 VSY“, „12.3.3640 VSY“, „12.3. 3640“ oder nur Jahr
  function parse(c, s, parseYear) {
    if (s == null || String(s).trim() === '') return null;
    const str = String(s).trim();
    if (on(c)) {
      let m = str.match(/^(\d{1,3})\s*\.\s*(\d{1,2})\s*\.\s*(.+)$/);
      if (m) { const y = parseYear(m[3]); if (y != null) { const md = normMD(c, +m[2], +m[1]); return { year: y, month: md.month, day: md.day }; } }
      m = str.match(/^(?:(\d{1,3})\s*\.?\s+)?([^\d\s.][^\d]*?)\s+([+-]?\d.*)$/);
      if (m) {
        let mo = null; try { mo = monthNo(c, m[2].trim()); } catch { mo = null; }
        if (mo != null) { const y = parseYear(m[3]); if (y != null) { const md = normMD(c, mo, m[1] ? +m[1] : null); return { year: y, month: md.month, day: md.day }; } }
      }
    }
    const y = parseYear(str); return y == null ? null : { year: y, month: null, day: null };
  }
  const daysInYear = c => on(c) ? c.months.reduce((n, m) => n + m.days, 0) : 0;
  // ---------------------------------------------------------------- Rechnen mit Daten (Jahre linear als ganze Zahlen, Monat/Tag nach Kalender)
  function dayOfYear(c, m, d) { let n = 0; for (let i = 0; i < (m || 1) - 1; i++) n += c.months[i].days; return n + (d || 1); }
  function toDays(c, o) { const N = daysInYear(c); if (!N) fail('Kein Kalender mit Monaten/Tagen aktiv'); return Math.round(o.year) * N + dayOfYear(c, o.month, o.day) - 1; }
  function fromDays(c, n) {
    const N = daysInYear(c), y = Math.floor(n / N); let r = n - y * N;
    for (let i = 0; i < c.months.length; i++) { if (r < c.months[i].days) return { year: y, month: i + 1, day: r + 1 }; r -= c.months[i].days; }
    return { year: y + 1, month: 1, day: 1 };
  }
  // Datum verschieben: Jahre, Monate, Tage (in dieser Reihenfolge); Tag wird bei kürzeren Monaten begrenzt
  function add(c, o, k) {
    k = k || {}; let r = { year: Math.round(o.year) + Math.round(k.years || 0), month: o.month || null, day: o.day || null };
    if (k.months || k.days) { if (!on(c)) fail('Monate/Tage rechnen geht nur mit aktivem Kalender'); if (!r.month) r.month = 1; if (!r.day) r.day = 1; }
    if (k.months) { const M = c.months.length, t = r.year * M + (r.month - 1) + Math.round(k.months); r.year = Math.floor(t / M); r.month = t - r.year * M + 1; r.day = Math.min(r.day, c.months[r.month - 1].days); }
    if (k.days) r = fromDays(c, toDays(c, r) + Math.round(k.days));
    return r;
  }
  const diffDays = (c, a, b) => toDays(c, b) - toDays(c, a);
  // Alter in Jahren zum Datum now (Jahre linear, Geburtstag im Jahr berücksichtigt, sofern Monat/Tag bekannt)
  function ageOf(birth, now) {
    if (!birth || birth.year == null || !now || now.year == null) return null;
    let a = Math.round(now.year) - Math.round(birth.year);
    if (birth.month && now.month && (now.month < birth.month || (now.month === birth.month && (now.day || 1) < (birth.day || 1)))) a--;
    return a;
  }
  // Tage bis zum nächsten Jahrestag (Geburtstag); 0 = heute; null, wenn Monat fehlt oder kein Kalender aktiv
  function daysUntilAnniversary(c, birth, now) {
    if (!on(c) || !birth || !birth.month || !now || !now.month || !c.months[birth.month - 1]) return null;
    const md = { month: birth.month, day: Math.min(birth.day || 1, c.months[birth.month - 1].days) }, cur = { year: now.year, month: now.month, day: now.day || 1 };
    let next = Object.assign({ year: now.year }, md); if (toDays(c, next) < toDays(c, cur)) next = Object.assign({ year: now.year + 1 }, md);
    return toDays(c, next) - toDays(c, cur);
  }
  const API = { PRESETS, LIMITS, CalError, normCal, on, monthNo, normMD, key, keyOf, endKey, fmt, parse, daysInYear, dayOfYear, toDays, fromDays, add, diffDays, ageOf, daysUntilAnniversary };
  root.IAM_CAL = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
