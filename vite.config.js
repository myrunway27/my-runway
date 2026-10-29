import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Serves api/*.js (Vercel-style functions) during `vite dev`, so the client
// code path is identical locally and on Vercel. Keys come from .env (no VITE_ prefix),
// so they stay server-side.
function localApi(mode) {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      const env = loadEnv(mode, process.cwd(), '')
      for (const k of ['FLIGHTAWARE_API_KEY', 'AERODATABOX_RAPIDAPI_KEY', 'AVIATIONSTACK_API_KEY']) {
        if (env[k] && !process.env[k]) process.env[k] = env[k]
      }
      server.middlewares.use('/api/flight', async (req, res) => {
        try {
          const mod = await server.ssrLoadModule('/api/flight.js')
          req.url = req.originalUrl || req.url
          await mod.default(req, res)
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'local_api_error', message: String(e?.message || e) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), localApi(mode)],
  test: { include: ['src/**/*.test.js', 'api/**/*.test.js'] },
}))
