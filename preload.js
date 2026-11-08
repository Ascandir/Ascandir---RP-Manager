// Brücke zwischen Oberfläche und Dateisystem (nur Zeitlinien-Ordner)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('swgmFS', {
  list: () => ipcRenderer.invoke('tl:list'),
  read: file => ipcRenderer.invoke('tl:read', file),
  save: (file, content) => ipcRenderer.invoke('tl:save', file, content),
  remove: file => ipcRenderer.invoke('tl:delete', file),
  openFolder: file => ipcRenderer.invoke('tl:open', file),
  dir: () => ipcRenderer.invoke('tl:dir'),
  onChange: cb => ipcRenderer.on('tl:changed', (_e, file) => cb(file))
});
