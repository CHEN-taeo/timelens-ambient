const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('timelens', {
  version: '0.2.0',
  quit: () => ipcRenderer.send('app:quit'),
  fitWindow: (width, height, centerTop = true, dragW = 6, dewW = null) =>
    ipcRenderer.send('window:fit', { width, height, centerTop, dragW, dewW }),
  centerTop: (width, height, dragW = 6, dewW = null) =>
    ipcRenderer.send('window:centerTop', { width, height, dragW, dewW }),
  getWorkArea: () => ipcRenderer.invoke('display:workArea'),
  getAnchor: () => ipcRenderer.invoke('window:getAnchor'),
  moveWindow: (screenX, screenY, snap = true) =>
    ipcRenderer.send('window:move', { screenX, screenY, snap }),
  setWindowMode: (mode, width, height, screenX, screenY, dragW, dewW) =>
    ipcRenderer.send('window:setMode', { mode, width, height, screenX, screenY, dragW, dewW }),
  setMousePassthrough: (passthrough) =>
    ipcRenderer.send('window:setMousePassthrough', passthrough),
  runCoach: (body) => ipcRenderer.invoke('coach:run', body),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
  onTriggerFix: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('thread:triggerFix', handler)
    return () => ipcRenderer.removeListener('thread:triggerFix', handler)
  },
  onSoundToggled: (callback) => {
    const handler = (_evt, enabled) => callback(enabled)
    ipcRenderer.on('sound:toggle', handler)
    return () => ipcRenderer.removeListener('sound:toggle', handler)
  },
  getSoundEnabled: () => ipcRenderer.invoke('sound:get'),
  setSoundEnabled: (enabled) => ipcRenderer.send('sound:set', enabled),
})
