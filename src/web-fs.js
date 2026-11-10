/* Ascandir RP-Manager – Anbindung an den Docker-Server (nur wenn über http/https geladen) */
(function () {
  'use strict';
  if (window.iamFS || !/^https?:$/.test(location.protocol)) return;
  let info = null;
  try {
    const x = new XMLHttpRequest(); x.open('GET', 'api/info', false); x.send();
    if (x.status === 200) info = JSON.parse(x.responseText);
  } catch (e) { /* kein Server vorhanden */ }
  if (!info || !info.server) return;
  const enc = encodeURIComponent;
  const ok = r => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r; };
  window.iamFS = {
    server: true,
    appInfo: async () => info,
    list: dir => fetch(`api/files/${dir}`).then(ok).then(r => r.json()),
    read: (dir, file) => fetch(`api/files/${dir}/${enc(file)}`).then(r => r.status === 404 ? null : ok(r).text()),
    save: (dir, file, content) => fetch(`api/files/${dir}/${enc(file)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: content }).then(async r => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(j.error || (r.status + ' ' + r.statusText)), { status: r.status, body: j });
      return Object.assign({ ok: true }, j); // z.B. { ok, rev } bei Karten
    }),
    remove: (dir, file) => fetch(`api/files/${dir}/${enc(file)}`, { method: 'DELETE' }).then(ok).then(() => true),
    openFolder: async () => { alert(info.dataDir ? 'Server-Datenordner: ' + info.dataDir : 'Server'); return true; },
    onChange: cb => {
      const connect = () => {
        const es = new EventSource('api/events');
        es.onmessage = ev => { try { const d = JSON.parse(ev.data); cb(d.dir, d.file); } catch (e) { } };
        es.onerror = () => { es.close(); setTimeout(connect, 5000); };
      };
      connect();
    },
    info: () => info,
    login: async (user, password) => {
      const r = await fetch('api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || r.statusText);
      return true;
    },
    logout: () => fetch('api/logout', { method: 'POST' }).then(() => true),
    desktop: !!window.iamDesktop,
    updCheck: window.iamDesktop ? window.iamDesktop.updCheck : async () => ({ state: 'docker' }),
    updDownload: window.iamDesktop ? window.iamDesktop.updDownload : async () => true,
    updInstall: window.iamDesktop ? window.iamDesktop.updInstall : async () => true,
    onUpdate: window.iamDesktop ? window.iamDesktop.onUpdate : () => { }
  };
})();
