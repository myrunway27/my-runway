import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Serves api/*.js (Vercel-style functions) during `vite dev`, so the client
// code path is identical locally and on Vercel. Keys come from .env (no VITE_ prefix),
// so they stay server-side.
const ROUTES = ['/api/flight', '/api/faa']
function mount(server, load) {
  for (const route of ROUTES) {
    server.middlewares.use(route, async (req, res) => {
      try {
        const mod = await load(`${route}.js`)
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
      mount(server, server.ssrLoadModule.bind(server))
    },
    // `vite preview` too, so the built app can be checked locally with the same /api routes
    async configurePreviewServer(server) {
      const { createServer } = await import('vite')
      const ssr = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
      loadKeys(mode)
      mount(server, ssr.ssrLoadModule.bind(ssr))
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), localApi(mode)],
  test: { include: ["src/**/*.test.js", "api/**/*.test.js"] },
}))
