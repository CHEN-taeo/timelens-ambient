const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('timelens', {
  version: '0.1.0',
  quit: () => ipcRenderer.send('app:quit'),
  fitWindow: (width, height) => ipcRenderer.send('window:fit', { width, height }),
  getAnchor: () => ipcRenderer.invoke('window:getAnchor'),
  setWindowMode: (mode, width, height, screenX, screenY) =>
    ipcRenderer.send('window:setMode', { mode, width, height, screenX, screenY }),
  onSoundToggled: (callback) => {
    const handler = (_evt, enabled) => callback(enabled)
    ipcRenderer.on('sound:toggle', handler)
    return () => ipcRenderer.removeListener('sound:toggle', handler)
  },
  getSoundEnabled: () => ipcRenderer.invoke('sound:get'),
  setSoundEnabled: (enabled) => ipcRenderer.send('sound:set', enabled),
})
