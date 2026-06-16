/**
 * Wait until our Vite dev server writes `.dev-server-port` and responds.
 * Does NOT probe 5173 blindly — avoids connecting to zombie servers.
 */
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const portFile = path.join(__dirname, '..', '.dev-server-port')
const maxWait = 60_000
const start = Date.now()

function tryPort(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: '127.0.0.1', port, path: '/', family: 4, timeout: 800 },
      (res) => {
        resolve(true)
        res.resume()
      }
    )
    req.on('error', () => resolve(false))
    req.setTimeout(800, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function wait() {
  while (Date.now() - start < maxWait) {
    if (fs.existsSync(portFile)) {
      const port = Number(fs.readFileSync(portFile, 'utf8').trim())
      if (port && (await tryPort(port))) process.exit(0)
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  console.error('[timelens] Vite dev server did not start within 60s')
  process.exit(1)
}

wait()
