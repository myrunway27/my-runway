// Vercel serverless function: GET /api/faa
// Proxies the free, keyless FAA NAS airport status feed (XML, no CORS) and returns parsed JSON.
// Short timeout; on any failure answers { ok:false } so the app shows a fallback message.
import { parseFaaStatus } from "../src/lib/faaStatus.js";
import { createRateLimiter, guard } from "./_guard.js";

// 60 requests/min per IP. In-memory: per serverless instance, best effort only (see _guard.js).
export const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
// Vercel's edge caches successful responses for ~60s, so most clients never reach this function.
const EDGE_SECONDS = 60;

const FEED = "https://nasstatus.faa.gov/api/airport-status-information";
const TTL_MS = 60 * 1000; // matches the edge cache
let cache = null; // warm-instance cache

function send(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cacheSeconds ? `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}` : "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res, { fetchImpl = fetch, timeoutMs = 4000 } = {}) {
  if (!guard(req, res, limiter, send)) return;
  if (cache && Date.now() - cache.at < TTL_MS) return send(res, 200, cache.body, EDGE_SECONDS);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(FEED, { headers: { Accept: "application/xml, text/xml" }, signal: ctl.signal });
    if (!r.ok) return send(res, 200, { ok: false, error: `upstream_${r.status}` });
    const parsed = parseFaaStatus(await r.text());
    const body = { ok: true, source: "FAA NAS Status", ...parsed, fetchedAt: new Date().toISOString() };
    cache = { at: Date.now(), body };
    return send(res, 200, body, EDGE_SECONDS);
  } catch (e) {
    return send(res, 200, { ok: false, error: e?.name === "AbortError" ? "timeout" : "network" });
  } finally { clearTimeout(t); }
}
