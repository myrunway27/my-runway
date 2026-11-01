// Free, dependency-free abuse protection shared by the /api functions.
// (Leading underscore: Vercel does not expose files like this as routes.)
//
// IMPORTANT: the rate limiter is in-memory, so limits apply PER SERVERLESS INSTANCE and reset on
// cold starts. Vercel can run several instances at once, so this is best effort only: it slows
// down a single noisy client but is not a hard global quota. A shared store (e.g. Redis/KV)
// would be needed for that, which this project deliberately avoids (no paid services).

/** Sliding-window log limiter: at most `limit` hits per `windowMs` per key. */
export function createRateLimiter({ limit, windowMs = 60_000, maxKeys = 5000, now = () => Date.now() }) {
  const hits = new Map(); // key -> sorted timestamps
  return {
    check(key) {
      const t = now();
      const from = t - windowMs;
      const list = (hits.get(key) || []).filter(x => x > from);
      if (list.length >= limit) {
        hits.set(key, list);
        const retryAfterSec = Math.max(1, Math.ceil((list[0] + windowMs - t) / 1000));
        return { ok: false, remaining: 0, retryAfterSec };
      }
      list.push(t);
      hits.delete(key); hits.set(key, list); // refresh insertion order (LRU-ish)
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value); // bound memory
      return { ok: true, remaining: limit - list.length, retryAfterSec: 0 };
    },
    size: () => hits.size,
    reset: () => hits.clear(),
  };
}

const header = (req, name) => {
  const v = req?.headers?.[name] ?? req?.headers?.[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
};

/** Best-effort client IP: Vercel sets x-forwarded-for / x-real-ip. */
export function clientIp(req) {
  const xff = header(req, "x-forwarded-for");
  if (xff) return String(xff).split(",")[0].trim();
  return String(header(req, "x-real-ip") || req?.socket?.remoteAddress || "unknown");
}

// Hosts allowed to call the API from a browser.
export const ALLOWED_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\]|(www\.)?myrunwayapp\.co|my-runway-runway\.vercel\.app|my-runway-runway-[a-z0-9-]+-myrunway27-2445s-projects\.vercel\.app)$/i;
// Only this Vercel project: production, per-deploy previews and git-branch previews.

function hostOf(u) {
  try { return new URL(u).hostname; } catch { return null; }
}

/**
 * Same-origin / Referer check. If the browser tells us where the call came from (Origin or Referer),
 * that host must be allowed. If neither header is sent (curl, privacy extensions) we fall back to
 * Sec-Fetch-Site when present, and otherwise allow: the rate limit still applies.
 */
export function originAllowed(req) {
  const src = header(req, "origin") || header(req, "referer");
  if (src && src !== "null") {
    const h = hostOf(src);
    return !!h && ALLOWED_HOST_RE.test(h);
  }
  const site = header(req, "sec-fetch-site");
  if (site && !["same-origin", "none"].includes(String(site))) return false;
  return true;
}

export const IDENT_RE = /^[A-Z0-9]{2}\d{1,4}[A-Z]?$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_DAYS = 3;

/** Strict /api/flight input validation. Returns { ok, ident, date, sched } or { ok:false, error }. */
export function validateFlightQuery(q, { now = new Date(), maxDays = MAX_DAYS } = {}) {
  const ident = String(q.get("ident") || "").toUpperCase().replace(/\s+/g, "");
  const date = String(q.get("date") || "");
  const sched = q.get("sched");
  if (!IDENT_RE.test(ident)) return { ok: false, error: "bad_ident" };
  if (!DATE_RE.test(date)) return { ok: false, error: "bad_date" };
  const day = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== date) return { ok: false, error: "bad_date" };
  const today = Date.parse(now.toISOString().slice(0, 10) + "T00:00:00Z");
  if (Math.abs(day - today) > maxDays * 86400000) return { ok: false, error: "date_out_of_range" };
  if (sched !== null && sched !== undefined && sched !== "") {
    const s = Date.parse(sched);
    if (sched.length > 40 || !Number.isFinite(s) || Math.abs(s - day) > 2 * 86400000) return { ok: false, error: "bad_sched" };
  }
  return { ok: true, ident, date, sched: sched || null };
}

/** Apply origin + rate-limit guards. Returns true if the request may proceed; otherwise it has already been answered. */
export function guard(req, res, limiter, send) {
  if (!originAllowed(req)) { send(res, 403, { error: "forbidden_origin" }); return false; }
  const r = limiter.check(clientIp(req));
  if (!r.ok) {
    res.setHeader("Retry-After", String(r.retryAfterSec));
    send(res, 429, { error: "rate_limited", retryAfterSec: r.retryAfterSec });
    return false;
  }
  return true;
}
