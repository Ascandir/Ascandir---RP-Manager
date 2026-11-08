// Ascandir – Star Wars Galaxy Map · Electron-Start
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Alle Nutzerdaten (Zeitlinien, Einstellungen) liegen im Unterordner "data"
// des Installationsverzeichnisses. Ist der Ordner nicht beschreibbar
// (z.B. unter C:\Programme), wird auf den Standard-AppData-Ordner ausgewichen.
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

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1280,
    minHeight: 650,
    backgroundColor: '#070a12',
    title: 'Ascandir – Galaxiekarte',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, 'preload.js') }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  // Externe Links im Standardbrowser öffnen
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // F11 Vollbild, F12 Entwicklerwerkzeuge
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') win.setFullScreen(!win.isFullScreen());
    if (input.key === 'F12') win.webContents.toggleDevTools();
  });
}

// ---------------------------------------------------------------- Zeitlinien-Dateien
// Jede eigene Zeitlinie liegt als lesbare JSON-Datei in data/timelines/
let tlDir = null;
const safe = f => {
  const b = path.basename(String(f || ''));
  if (!/^[^<>:"/\\|?*]+\.json$/i.test(b)) throw new Error('Ungültiger Dateiname: ' + b);
  return path.join(tlDir, b);
};
function setupTimelineFiles() {
  tlDir = path.join(app.getPath('userData'), 'timelines');
  fs.mkdirSync(tlDir, { recursive: true });
  ipcMain.handle('tl:dir', () => tlDir);
  ipcMain.handle('tl:list', () => fs.readdirSync(tlDir).filter(f => f.toLowerCase().endsWith('.json')).map(f => {
    try { return { file: f, content: fs.readFileSync(path.join(tlDir, f), 'utf8') }; } catch (e) { return { file: f, error: e.message }; }
  }));
  ipcMain.handle('tl:read', (_e, f) => { const p = safe(f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; });
  ipcMain.handle('tl:save', (_e, f, content) => { const p = safe(f); const tmp = p + '.tmp'; fs.writeFileSync(tmp, content, 'utf8'); fs.renameSync(tmp, p); return true; });
  ipcMain.handle('tl:delete', (_e, f) => { const p = safe(f); if (fs.existsSync(p)) fs.unlinkSync(p); return true; });
  ipcMain.handle('tl:open', (_e, f) => { if (f) shell.showItemInFolder(safe(f)); else shell.openPath(tlDir); return true; });
  // Änderungen von außen (Texteditor) melden
  const timers = {};
  try {
    fs.watch(tlDir, (_ev, f) => {
      if (!f || !f.toLowerCase().endsWith('.json')) return;
      clearTimeout(timers[f]);
      timers[f] = setTimeout(() => BrowserWindow.getAllWindows().forEach(w => w.webContents.send('tl:changed', f)), 350);
    });
  } catch (e) { console.warn('Ordnerüberwachung nicht möglich:', e.message); }
}

app.whenReady().then(() => { setupTimelineFiles(); createWindow(); });
app.on('window-all-closed', () => app.quit());
