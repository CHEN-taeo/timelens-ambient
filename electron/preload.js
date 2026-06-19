const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('timelens', {
  version: '0.1.0',
  quit: () => ipcRenderer.send('app:quit'),
  fitWindow: (width, height, centerTop = true, dragW = 6, dewW = null) =>
    ipcRenderer.send('window:fit', { width, height, centerTop, dragW, dewW }),
  centerTop: (width, height, dragW = 6, dewW = null) =>
    ipcRenderer.send('window:centerTop', { width, height, dragW, dewW }),
  getAnchor: () => ipcRenderer.invoke('window:getAnchor'),
  setWindowMode: (mode, width, height, screenX, screenY, dragW, dewW) =>
    ipcRenderer.send('window:setMode', { mode, width, height, screenX, screenY, dragW, dewW }),
  onSoundToggled: (callback) => {
    const handler = (_evt, enabled) => callback(enabled)
    ipcRenderer.on('sound:toggle', handler)
    return () => ipcRenderer.removeListener('sound:toggle', handler)
  },
  getSoundEnabled: () => ipcRenderer.invoke('sound:get'),
  setSoundEnabled: (enabled) => ipcRenderer.send('sound:set', enabled),
})
