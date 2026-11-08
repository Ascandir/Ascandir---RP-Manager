// Ascandir InteractiveMap · Electron-Start
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Alle Nutzerdaten liegen im Unterordner "data" des Installationsverzeichnisses.
// Ist der Ordner nicht beschreibbar (z.B. C:\Programme), wird auf AppData ausgewichen.
if (app.isPackaged) {
  const dataDir = path.join(path.dirname(process.execPath), 'data');
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.accessSync(dataDir, fs.constants.W_OK);
    app.setPath('userData', dataDir);
  } catch (e) {
    console.warn('Installationsordner nicht beschreibbar, nutze AppData:', e.message);
  }
}

let win = null;
// ---------------------------------------------------------------- Server-Verbindung (optional)
function configPath() { return path.join(app.getPath('userData'), 'config.json'); }
function readConfig() { try { return JSON.parse(fs.readFileSync(configPath(), 'utf8')); } catch { return {}; } }
function writeConfig(c) { fs.writeFileSync(configPath(), JSON.stringify(c, null, 2), 'utf8'); }
const serverUrl = () => readConfig().serverUrl || null;
function loadUi() {
  const u = serverUrl();
  if (u) win.loadURL(u); else win.loadFile(path.join(__dirname, 'src', 'index.html'));
}
function send(ch, ...args) { if (win && !win.isDestroyed()) win.webContents.send(ch, ...args); }

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 950, minWidth: 1280, minHeight: 680,
    backgroundColor: '#070a12', title: 'Ascandir – InteractiveMap',
    icon: path.join(__dirname, 'build', 'icon.png'), autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, 'preload.js') }
  });
  Menu.setApplicationMenu(null);
  loadUi();
  // Server nicht erreichbar -> lokale Version mit Hinweis
  win.webContents.on('did-fail-load', (_e, code, desc, url, isMain) => {
    if (!isMain || !serverUrl() || url.startsWith('file:')) return;
    win.loadFile(path.join(__dirname, 'src', 'index.html'), { query: { offline: serverUrl() } });
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') win.setFullScreen(!win.isFullScreen());
    if (input.key === 'F12') win.webContents.toggleDevTools();
  });
}

// ---------------------------------------------------------------- Dateien
// data/worlds/*.json  = eigene Welten, data/timelines/*.json = Zeitlinien
const DIRS = ['worlds', 'timelines'];
let base = null;
function dirPath(dir) {
  if (!DIRS.includes(dir)) throw new Error('Unbekannter Ordner: ' + dir);
  return path.join(base, dir);
}
function filePath(dir, f) {
  const b = path.basename(String(f || ''));
  if (!/^[^<>:"/\\|?*]+\.json$/i.test(b)) throw new Error('Ungültiger Dateiname: ' + b);
  return path.join(dirPath(dir), b);
}
function setupFiles() {
  base = app.getPath('userData');
  for (const d of DIRS) fs.mkdirSync(path.join(base, d), { recursive: true });
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), packaged: app.isPackaged, dataDir: base }));
  ipcMain.handle('app:getServer', () => serverUrl());
  ipcMain.handle('app:setServer', (_e, url) => {
    const c = readConfig();
    if (url) {
      let u; try { u = new URL(String(url).trim()); } catch { throw new Error('Ungültige Adresse'); }
      if (!/^https?:$/.test(u.protocol)) throw new Error('Adresse muss mit http:// oder https:// beginnen');
      c.serverUrl = u.origin + (u.pathname.endsWith('/') ? u.pathname : u.pathname + '/');
    } else delete c.serverUrl;
    writeConfig(c); setImmediate(loadUi); return c.serverUrl || null;
  });
  ipcMain.handle('fs:list', (_e, dir) => fs.readdirSync(dirPath(dir)).filter(f => f.toLowerCase().endsWith('.json')).map(f => {
    try { return { file: f, content: fs.readFileSync(path.join(dirPath(dir), f), 'utf8') }; } catch (err) { return { file: f, error: err.message }; }
  }));
  ipcMain.handle('fs:read', (_e, dir, f) => { const p = filePath(dir, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; });
  ipcMain.handle('fs:save', (_e, dir, f, content) => { const p = filePath(dir, f); const tmp = p + '.tmp'; fs.writeFileSync(tmp, content, 'utf8'); fs.renameSync(tmp, p); return true; });
  ipcMain.handle('fs:delete', (_e, dir, f) => { const p = filePath(dir, f); if (fs.existsSync(p)) fs.unlinkSync(p); return true; });
  ipcMain.handle('fs:open', (_e, dir, f) => {
    if (!dir) { shell.openPath(base); return true; }
    if (f) shell.showItemInFolder(filePath(dir, f)); else shell.openPath(dirPath(dir));
    return true;
  });
  const timers = {};
  for (const d of DIRS) {
    try {
      fs.watch(dirPath(d), (_ev, f) => {
        if (!f || !f.toLowerCase().endsWith('.json')) return;
        const key = d + '/' + f; clearTimeout(timers[key]);
        timers[key] = setTimeout(() => send('fs:changed', d, f), 350);
      });
    } catch (err) { console.warn('Ordnerüberwachung nicht möglich:', err.message); }
  }
}

// ---------------------------------------------------------------- Updater (GitHub Releases)
function setupUpdater() {
  let autoUpdater = null;
  if (app.isPackaged) {
    try {
      autoUpdater = require('electron-updater').autoUpdater;
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.on('checking-for-update', () => send('upd:status', { state: 'checking' }));
      autoUpdater.on('update-available', i => send('upd:status', { state: 'available', version: i.version }));
      autoUpdater.on('update-not-available', () => send('upd:status', { state: 'none' }));
      autoUpdater.on('download-progress', p => send('upd:status', { state: 'progress', percent: p.percent }));
      autoUpdater.on('update-downloaded', i => send('upd:status', { state: 'downloaded', version: i.version }));
      autoUpdater.on('error', err => send('upd:status', { state: 'error', message: String(err && err.message || err).split('\n')[0] }));
    } catch (err) { console.warn('Updater nicht verfügbar:', err.message); autoUpdater = null; }
  }
  ipcMain.handle('upd:check', async () => {
    if (!autoUpdater) return { state: 'dev' };
    try { await autoUpdater.checkForUpdates(); } catch (err) { send('upd:status', { state: 'error', message: String(err.message || err).split('\n')[0] }); }
    return { state: 'started' };
  });
  ipcMain.handle('upd:download', async () => { if (autoUpdater) { send('upd:status', { state: 'progress', percent: 0 }); try { await autoUpdater.downloadUpdate(); } catch (err) { send('upd:status', { state: 'error', message: String(err.message || err).split('\n')[0] }); } } return true; });
  ipcMain.handle('upd:install', () => { if (autoUpdater) setImmediate(() => autoUpdater.quitAndInstall(false, true)); return true; });
}

app.whenReady().then(() => { setupFiles(); setupUpdater(); createWindow(); });
app.on('window-all-closed', () => app.quit());
