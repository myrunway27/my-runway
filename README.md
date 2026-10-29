# My Runway — Know Before You Go

Flight-day companion for the Israel family trip (MIA → TLV → ZRH → MIA).
Vite + React 19 single-page app with one serverless proxy (`api/flight.js`).

**Golden rule:** the booking is the source of truth. Live data (FlightAware /
AeroDataBox / AviationStack) is only ever shown as an overlay ("What changed"),
and the app works fully with no API keys at all.

## Run locally

```bash
npm install
cp .env.example .env   # optional; leave blank to run booking-only
npm run dev            # http://localhost:5173 (dev middleware serves /api/flight)
```

URL helpers (demo only):

| Param | Effect |
|---|---|
| `?clock=2026-07-01T23:40:00Z` | pin the demo clock (default replays travel day, 2:40 AM Tel Aviv) |
| `?demo=delay` / `ontime` / `cancel` | simulated live overlay |
| `?onboarding=0` | skip onboarding |

The demo clock and scenario can also be switched in Settings → Demo.

## Test

```bash
npm run lint     # oxlint src api
npm test         # vitest: trip logic, ics, weather, api proxy
npm run build
npm run dev &  npm run e2e -- mytag   # Playwright smoke, mobile 390x844 + desktop 1280x800
```

The smoke test clicks through every screen, saves screenshots to `screenshots/`,
and exits non-zero on any console error/warning or page error.

## Going live (not done — needs the owner)

1. **Rotate the old keys.** The original source files had three provider keys
   hardcoded in the browser bundle (AeroDataBox via RapidAPI, AviationStack,
   FlightAware AeroAPI). Treat them as leaked: regenerate all three.
2. **Create a GitHub repo** and push this repo (`.env` is git-ignored).
3. **Import into Vercel** (framework: Vite). Add Environment Variables
   (Production + Preview), server-side only, no `VITE_` prefix:
   - `FLIGHTAWARE_API_KEY` (primary)
   - `AERODATABOX_RAPIDAPI_KEY` (fallback)
   - `AVIATIONSTACK_API_KEY` (last fallback)
   Any subset works; with none, `/api/flight` answers `{configured:false}` and the
   app shows the booking only.
4. Optional: turn off the demo clock (Settings → Demo) or remove `DEMO_ANCHOR`
   in `src/App.jsx` once there's a real upcoming trip.

## Free extras (no keys, no paid APIs)

- **Late-plane alert** (`src/lib/lateInbound.js`): flight card warns when the inbound aircraft lands too late for a normal turn (40 min narrowbody / 75 min widebody).
- **EU261 estimate** (`src/lib/eu261.js`): chip on delayed (3h+) or cancelled EU/UK-covered flights. Estimate only, not legal advice.
- **US customs reminder**: chip on US international arrivals linking CBP Mobile Passport Control.
- **Can I bring this?** (`src/lib/travelInfo.js`) and **data export** (JSON/CSV) in the More sheet.
- **US airport status**: `/api/faa` proxies the FAA NAS status feed (XML, no key) and `src/lib/faaStatus.js` parses it.

Weather uses Open-Meteo (no key). Git author in this repo is a local placeholder
(`asaf@myrunway.local`) — amend before pushing if you want your real identity.

## API abuse protection (free, best effort)

`api/flight.js` and `api/faa.js` share `api/_guard.js`:

- **Rate limit:** per-IP sliding window, 30 req/min for `/api/flight` and 60 req/min for `/api/faa`. Over the limit you get `429` with `Retry-After`.
  **The counters live in memory, so they are per serverless instance and reset on cold starts.** Vercel can run several instances, so this is best effort against a single noisy client, not a global quota. A hard quota would need a shared store (e.g. Vercel KV/Upstash), which is intentionally not used here.
- **Origin check:** if a request carries `Origin`/`Referer`, the host must be `myrunwayapp.co` (or `www.`), `*.vercel.app`, or localhost; otherwise `403`. Requests without those headers are allowed (they are still rate-limited).
- **Input validation (`/api/flight`):** ident must match `^[A-Z0-9]{2}\d{1,4}[A-Z]?$`, date must be a real `YYYY-MM-DD` within ±3 days of today (UTC), `sched` must be an ISO time within 2 days of that date. Anything else is `400`.
- **Caching:** `/api/faa` answers with `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=60`, so Vercel's edge serves most clients for ~60s without invoking the function.
