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

Weather uses Open-Meteo (no key). Git author in this repo is a local placeholder
(`asaf@myrunway.local`) — amend before pushing if you want your real identity.
