import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Analytics } from '@vercel/analytics/react'
import * as Sentry from '@sentry/react'

// Sentry is optional: only initialised when VITE_SENTRY_DSN is set at build time.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  })
}

const Fallback = () => (
  <div role="alert" style={{ padding: 24, textAlign: 'center' }}>
    <p>Something went wrong. Please reload the page.</p>
    <button onClick={() => window.location.reload()}>Reload</button>
  </div>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<Fallback />}>
      <App />
    </Sentry.ErrorBoundary>
    <Analytics />
  </StrictMode>,
)

// Offline support: register the network-first service worker in production only,
// so the Vite dev server never serves cached files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
