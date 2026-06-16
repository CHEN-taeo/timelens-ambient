import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const preferredPort = Number(process.env.VITE_DEV_PORT) || 5173
const portFile = path.join(__dirname, '.dev-server-port')

/** Persist the bound port so Electron can connect when 5173 is zombie-occupied. */
function writeDevPortPlugin() {
  return {
    name: 'timelens-write-dev-port',
    configureServer(server) {
      try {
        fs.unlinkSync(portFile)
      } catch {
        /* fresh start */
      }
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address()
        const port = typeof addr === 'object' && addr ? addr.port : preferredPort
        fs.writeFileSync(portFile, String(port))
        console.log(`[timelens] dev server → http://localhost:${port}`)
      })
    },
  }
}

// Renderer build. base './' so Electron can load via file:// in production.
export default defineConfig({
  plugins: [react(), writeDevPortPlugin()],
  base: './',
  server: {
    port: preferredPort,
    strictPort: false,
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
