import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { statSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// Serves api/*.js (Vercel-style functions) during `vite dev`, so the client
// code path is identical locally and on Vercel. Keys come from .env (no VITE_ prefix),
// so they stay server-side.
const ROUTES = ['/api/flight', '/api/faa']
// Plain Node import (cache-busted by mtime) rather than server.ssrLoadModule: the api
// functions are plain ESM, and ssrLoadModule could stall when the browser requested the
// same shared src/lib module at the same moment.
async function load(route) {
  const file = resolve(process.cwd(), `.${route}.js`)
  return import(`${pathToFileURL(file).href}?t=${statSync(file).mtimeMs}`)
}

function mount(server) {
  for (const route of ROUTES) {
    server.middlewares.use(route, async (req, res) => {
      try {
        const mod = await load(route)
        req.url = req.originalUrl || req.url
        await mod.default(req, res)
      } catch (e) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'local_api_error', message: String(e?.message || e) }))
      }
    })
  }
}

function loadKeys(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  for (const k of ['FLIGHTAWARE_API_KEY', 'AERODATABOX_RAPIDAPI_KEY', 'AVIATIONSTACK_API_KEY']) {
    if (env[k] && !process.env[k]) process.env[k] = env[k]
  }
}

function localApi(mode) {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      loadKeys(mode)
      mount(server)
    },
    // `vite preview` too, so the built app can be checked locally with the same /api routes
    configurePreviewServer(server) {
      loadKeys(mode)
      mount(server)
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), localApi(mode)],
  test: { include: ["src/**/*.test.js", "api/**/*.test.js"] },
}))
