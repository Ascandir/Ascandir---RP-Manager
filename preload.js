// Brücke zwischen Oberfläche und Dateisystem / Updater / Server-Verbindung
const { contextBridge, ipcRenderer } = require('electron');

// Desktop-Funktionen (immer verfügbar): Updater und Server-Verbindung
contextBridge.exposeInMainWorld('iamDesktop', {
  appInfo: () => ipcRenderer.invoke('app:info'),
  getServer: () => ipcRenderer.invoke('app:getServer'),
  setServer: url => ipcRenderer.invoke('app:setServer', url),
  updCheck: () => ipcRenderer.invoke('upd:check'),
  updDownload: () => ipcRenderer.invoke('upd:download'),
  updInstall: () => ipcRenderer.invoke('upd:install'),
  onUpdate: cb => ipcRenderer.on('upd:status', (_e, s) => cb(s))
});

// Lokale Dateien nur, wenn die lokale Oberfläche geladen ist (nicht bei Server-Verbindung)
if (location.protocol === 'file:') {
  contextBridge.exposeInMainWorld('iamFS', {
    appInfo: () => ipcRenderer.invoke('app:info'),
    list: dir => ipcRenderer.invoke('fs:list', dir),
    read: (dir, file) => ipcRenderer.invoke('fs:read', dir, file),
    save: (dir, file, content) => ipcRenderer.invoke('fs:save', dir, file, content),
    remove: (dir, file) => ipcRenderer.invoke('fs:delete', dir, file),
    openFolder: (dir, file) => ipcRenderer.invoke('fs:open', dir, file),
    onChange: cb => ipcRenderer.on('fs:changed', (_e, dir, file) => cb(dir, file)),
    updCheck: () => ipcRenderer.invoke('upd:check'),
    updDownload: () => ipcRenderer.invoke('upd:download'),
    updInstall: () => ipcRenderer.invoke('upd:install'),
    onUpdate: cb => ipcRenderer.on('upd:status', (_e, s) => cb(s))
  });
}
