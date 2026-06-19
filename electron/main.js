const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, ipcMain, screen } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'

let win = null
let tray = null
let savedCompactBounds = null

const INITIAL_WIDTH = 140
const INITIAL_HEIGHT = 30
const TOP_MARGIN = 12

function compactTopMargin() {
  const workArea = screen.getPrimaryDisplay().workArea
  return Math.max(10, Math.round(workArea.height * 0.016))
}

/** 露珠水平居中于工作区，垂直贴顶（中上） */
function centerTopBounds(width, height, dragW = 6, dewW = null) {
  if (!win || win.isDestroyed()) return
  const workArea = screen.getPrimaryDisplay().workArea
  const w = Math.max(80, Math.round(width))
  const h = Math.max(28, Math.round(height))
  const strip = Math.max(0, Math.round(dragW))
  const dew = Math.max(48, Math.round(dewW ?? w - strip))
  const topMargin = Math.max(10, Math.round(workArea.height * 0.016))
  const screenCenterX = workArea.x + workArea.width / 2
  const x = Math.round(screenCenterX - strip - dew / 2)
  win.setBounds({
    x,
    y: workArea.y + topMargin,
    width: w,
    height: h,
  })
}

/** Resize compact pill — keeps vertical position, centers horizontally. */
function anchorResize(width, height) {
  if (!win || win.isDestroyed()) return
  const bounds = win.getBounds()
  const w = Math.max(80, Math.round(width))
  const h = Math.max(28, Math.round(height))
  const center = bounds.x + bounds.width / 2
  win.setBounds({
    x: Math.round(center - w / 2),
    y: bounds.y,
    width: w,
    height: h,
  })
}

function setOverlayExpanded() {
  if (!win || win.isDestroyed()) return
  const workArea = screen.getPrimaryDisplay().workArea
  win.setBounds({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
  })
}

function createWindow() {
  const workArea = screen.getPrimaryDisplay().workArea
  const topMargin = compactTopMargin()
  const dragW = 6
  const screenCenterX = workArea.x + workArea.width / 2
  const startX = Math.round(screenCenterX - dragW - (INITIAL_WIDTH - dragW) / 2)

  win = new BrowserWindow({
    width: INITIAL_WIDTH,
    height: INITIAL_HEIGHT,
    x: startX,
    y: workArea.y + topMargin,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    thickFrame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (isDev) {
    let devPort = process.env.VITE_DEV_PORT
    if (!devPort) {
      try {
        devPort = fs.readFileSync(path.join(__dirname, '../.dev-server-port'), 'utf8').trim()
      } catch {
        devPort = '5173'
      }
    }
    win.loadURL(`http://localhost:${devPort}`)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

ipcMain.handle('window:getAnchor', () => {
  if (!win || win.isDestroyed()) {
    return { x: 0, y: TOP_MARGIN, screenX: 0, screenY: TOP_MARGIN }
  }
  const bounds = win.getBounds()
  const workArea = screen.getPrimaryDisplay().workArea
  return {
    x: bounds.x - workArea.x,
    y: bounds.y - workArea.y,
    screenX: bounds.x,
    screenY: bounds.y,
  }
})

ipcMain.on('window:setMode', (_evt, { mode, width, height, screenX, screenY, dragW, dewW }) => {
  if (mode === 'expanded') {
    savedCompactBounds = win.getBounds()
    setOverlayExpanded()
    return
  }

  const w = Math.max(80, Math.round(width || 100))
  const h = Math.max(28, Math.round(height || 36))

  if (screenX != null && screenY != null) {
    win.setBounds({ x: Math.round(screenX), y: Math.round(screenY), width: w, height: h })
  } else {
    centerTopBounds(w, h, dragW, dewW)
  }
  savedCompactBounds = null
})

ipcMain.on('window:fit', (_evt, { width, height, centerTop, dragW, dewW }) => {
  if (centerTop !== false) centerTopBounds(width, height, dragW, dewW)
  else anchorResize(width, height)
})

ipcMain.on('window:centerTop', (_evt, { width, height, dragW, dewW }) => {
  centerTopBounds(
    width ?? win?.getBounds().width ?? INITIAL_WIDTH,
    height ?? win?.getBounds().height ?? INITIAL_HEIGHT,
    dragW,
    dewW
  )
})

let soundEnabled = true

ipcMain.handle('sound:get', () => soundEnabled)

ipcMain.on('sound:set', (_evt, enabled) => {
  soundEnabled = enabled
  if (tray) rebuildTrayMenu()
})

function rebuildTrayMenu() {
  if (!tray) return
  const menu = Menu.buildFromTemplate([
    { label: 'TimeLens Ambient', enabled: false },
    { type: 'separator' },
    {
      label: `音效：${soundEnabled ? '开' : '关'}`,
      click: () => {
        soundEnabled = !soundEnabled
        win?.webContents.send('sound:toggle', soundEnabled)
        rebuildTrayMenu()
      },
    },
    {
      label: 'Show / Hide',
      click: () => {
        if (!win) return
        win.isVisible() ? win.hide() : win.show()
      },
    },
    { label: 'Quit  (Ctrl+Shift+Q)', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
}

function createTray() {
  try {
    tray = new Tray(nativeImage.createEmpty())
    tray.setToolTip('TimeLens Ambient')
    rebuildTrayMenu()
  } catch (err) {
    console.warn('Tray init failed:', err.message)
  }
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit())
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (!win) return
    win.isVisible() ? win.hide() : win.show()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.on('app:quit', () => app.quit())

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
