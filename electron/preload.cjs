const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openMiniTimer: () => ipcRenderer.send('open-mini-timer'),
  closeMiniTimer: () => ipcRenderer.send('close-mini-timer'),
  toggleMiniTimer: () => ipcRenderer.send('toggle-mini-timer'),
  onMiniTimerStatus: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('mini-timer-status', subscription);
    return () => ipcRenderer.removeListener('mini-timer-status', subscription);
  },
  isElectron: true,
});
