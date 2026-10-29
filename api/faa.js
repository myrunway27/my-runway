// Vercel serverless function: GET /api/faa
// Proxies the free, keyless FAA NAS airport status feed (XML, no CORS) and returns parsed JSON.
// Short timeout; on any failure answers { ok:false } so the app shows a fallback message.
import { parseFaaStatus } from "../src/lib/faaStatus.js";

const FEED = "https://nasstatus.faa.gov/api/airport-status-information";
const TTL_MS = 2 * 60 * 1000;
let cache = null; // warm-instance cache

function send(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cacheSeconds ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}` : "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res, { fetchImpl = fetch, timeoutMs = 4000 } = {}) {
  if (cache && Date.now() - cache.at < TTL_MS) return send(res, 200, cache.body, 120);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(FEED, { headers: { Accept: "application/xml, text/xml" }, signal: ctl.signal });
    if (!r.ok) return send(res, 200, { ok: false, error: `upstream_${r.status}` });
    const parsed = parseFaaStatus(await r.text());
    const body = { ok: true, source: "FAA NAS Status", ...parsed, fetchedAt: new Date().toISOString() };
    cache = { at: Date.now(), body };
    return send(res, 200, body, 120);
  } catch (e) {
    return send(res, 200, { ok: false, error: e?.name === "AbortError" ? "timeout" : "network" });
  } finally { clearTimeout(t); }
}
