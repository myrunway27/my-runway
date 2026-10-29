// Vercel serverless function: GET /api/flight?ident=LY347&date=2026-07-02&sched=2026-07-02T05:00:00.000Z
//
// Keeps every flight-data API key on the server. The browser never sees them.
// Env vars (set in Vercel > Project > Settings > Environment Variables, or a local .env):
//   FLIGHTAWARE_API_KEY        FlightAware AeroAPI   (primary: status, gates, delays, inbound aircraft)
//   AERODATABOX_RAPIDAPI_KEY   AeroDataBox via RapidAPI (gates, terminals, baggage belt)
//   AVIATIONSTACK_API_KEY      AviationStack          (fallback status)
//
// Golden rule: this endpoint only returns a day-of overlay (status / gate / delay / estimates).
// It never returns "the schedule" for the client to overwrite booked times with.

const CACHE = new Map(); // warm-instance cache
const TTL_MS = 5 * 60 * 1000;

const IDENT_RE = /^[A-Z0-9]{2}\d{1,4}[A-Z]?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function send(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (cacheSeconds > 0) res.setHeader("Cache-Control", `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`);
  else res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function getJson(url, headers, timeoutMs = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers, signal: ctl.signal });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    return { data: await r.json() };
  } catch (e) {
    return { error: e.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(t);
  }
}

function closest(list, getIso, sched) {
  if (!Array.isArray(list) || !list.length) return null;
  if (!sched) return list[0];
  const target = Date.parse(sched);
  let best = null, bestD = Infinity;
  for (const f of list) {
    const ts = Date.parse(getIso(f) || "");
    if (Number.isNaN(ts)) continue;
    const d = Math.abs(ts - target);
    if (d < bestD) { best = f; bestD = d; }
  }
  // must be the same operating instance (within 6h of the booked departure)
  return bestD <= 6 * 3600 * 1000 ? best : null;
}

function normFaStatus(s = "") {
  if (/cancel/i.test(s)) return "Cancelled";
  if (/divert/i.test(s)) return "Diverted";
  if (/arrived|landed/i.test(s)) return "Landed";
  if (/en route|departed/i.test(s)) return "In Air";
  if (/delayed/i.test(s)) return "Delayed";
  if (/scheduled/i.test(s)) return "Scheduled";
  return s || null;
}

async function fromFlightAware(ident, date, sched, key) {
  const day = Date.parse(`${date}T00:00:00Z`);
  // widen the UTC window by a day each side so local-date flights in any zone are found
  const start = new Date(day - 86400000).toISOString().slice(0, 19) + "Z";
  const end = new Date(day + 2 * 86400000).toISOString().slice(0, 19) + "Z";
  const h = { "x-apikey": key, Accept: "application/json; charset=UTF-8" };
  const r = await getJson(`https://aeroapi.flightaware.com/aeroapi/flights/${ident}?start=${start}&end=${end}&max_pages=1`, h);
  if (r.error) return { error: r.error };
  const f = closest(r.data?.flights, x => x.scheduled_out || x.scheduled_off, sched);
  if (!f) return { notFound: true };
  const out = {
    status: normFaStatus(f.status) || (f.cancelled ? "Cancelled" : null),
    depGate: f.gate_origin || null,
    arrGate: f.gate_destination || null,
    depTerminal: f.terminal_origin || null,
    arrTerminal: f.terminal_destination || null,
    baggage: f.baggage_claim || null,
    estDep: f.estimated_out || null,   // full ISO UTC strings; client converts per airport zone
    estArr: f.estimated_in || null,
    actDep: f.actual_out || null,
    actArr: f.actual_in || null,
    depDelayMins: f.departure_delay ? Math.round(f.departure_delay / 60) : 0,
    arrDelayMins: f.arrival_delay ? Math.round(f.arrival_delay / 60) : 0,
  };
  if (f.cancelled) out.status = "Cancelled";
  // Inbound aircraft (field is inbound_fa_flight_id; the old client code read a misspelled field)
  if (f.inbound_fa_flight_id) {
    const ir = await getJson(`https://aeroapi.flightaware.com/aeroapi/flights/${encodeURIComponent(f.inbound_fa_flight_id)}`, h);
    const inf = ir.data?.flights?.[0];
    if (inf) out.inbound = {
      ident: inf.ident_iata || inf.ident || null,
      origin: inf.origin?.code_iata || inf.origin?.code || null,
      status: normFaStatus(inf.status),
      estArr: inf.estimated_in || null,
      delayMins: inf.arrival_delay ? Math.round(inf.arrival_delay / 60) : 0,
    };
  }
  return { flight: out };
}

async function fromAeroDataBox(ident, date, sched, key) {
  const r = await getJson(`https://aerodatabox.p.rapidapi.com/flights/number/${ident}/${date}?withAircraftImage=false&withLocation=false`, {
    "x-rapidapi-key": key, "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
  });
  if (r.error) return { error: r.error };
  const list = Array.isArray(r.data) ? r.data : [r.data];
  const f = closest(list, x => (x.departure?.scheduledTime?.utc || "").replace(" ", "T").replace(/Z?$/, "Z"), sched);
  if (!f) return { notFound: true };
  const iso = t => (t?.utc ? t.utc.replace(" ", "T").replace(/Z?$/, "Z") : null);
  return { flight: {
    status: f.status === "Canceled" || f.status === "CanceledUncertain" ? "Cancelled" : (f.status || null),
    depGate: f.departure?.gate || null,
    depTerminal: f.departure?.terminal || null,
    arrGate: f.arrival?.gate || null,
    arrTerminal: f.arrival?.terminal || null,
    baggage: f.arrival?.baggageBelt || null,
    estDep: iso(f.departure?.revisedTime) || iso(f.departure?.predictedTime),
    estArr: iso(f.arrival?.revisedTime) || iso(f.arrival?.predictedTime),
  } };
}

async function fromAviationStack(ident, date, key) {
  const r = await getJson(`https://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}&flight_iata=${ident}&flight_date=${date}&limit=1`, {});
  if (r.error) return { error: r.error };
  const f = r.data?.data?.[0];
  if (!f) return { notFound: true };
  const map = { active: "In Air", landed: "Landed", cancelled: "Cancelled", incident: "Delayed", diverted: "Diverted", scheduled: "Scheduled" };
  return { flight: {
    status: map[f.flight_status] || null,
    depGate: f.departure?.gate || null,
    depTerminal: f.departure?.terminal || null,
    arrGate: f.arrival?.gate || null,
    arrTerminal: f.arrival?.terminal || null,
    baggage: f.arrival?.baggage || null,
    // AviationStack labels local times as +00:00, so only its delay minutes are trusted
    depDelayMins: f.departure?.delay || 0,
    arrDelayMins: f.arrival?.delay || 0,
  } };
}

// Merge: FlightAware wins, AeroDataBox fills gaps, AviationStack last.
function merge(parts) {
  const out = {};
  for (const p of parts) {
    if (!p) continue;
    for (const [k, v] of Object.entries(p)) {
      if (v === null || v === undefined || v === "") continue;
      if (out[k] === undefined || ((k === "depDelayMins" || k === "arrDelayMins") && !out[k])) out[k] = v;
    }
  }
  return out;
}

export default async function handler(req, res) {
  const q = new URL(req.url, "http://localhost").searchParams;
  const ident = String(q.get("ident") || "").toUpperCase().replace(/\s+/g, "");
  const date = String(q.get("date") || "");
  const sched = q.get("sched");
  if (!IDENT_RE.test(ident) || !DATE_RE.test(date) || (sched && Number.isNaN(Date.parse(sched)))) {
    return send(res, 400, { error: "bad_request", hint: "ident=LY347&date=YYYY-MM-DD[&sched=ISO]" });
  }

  const env = process.env;
  const keys = {
    fa: env.FLIGHTAWARE_API_KEY,
    adb: env.AERODATABOX_RAPIDAPI_KEY,
    avs: env.AVIATIONSTACK_API_KEY,
  };
  if (!keys.fa && !keys.adb && !keys.avs) {
    // 200, not 503: "no keys yet" is a normal state and the app quietly falls back to the booking
    return send(res, 200, { configured: false, error: "live_data_not_configured" });
  }

  const cacheKey = `${ident}|${date}|${sched || ""}`;
  const hit = CACHE.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return send(res, 200, hit.body, 300);

  const [fa, adb, avs] = await Promise.all([
    keys.fa ? fromFlightAware(ident, date, sched, keys.fa) : null,
    keys.adb ? fromAeroDataBox(ident, date, sched, keys.adb) : null,
    keys.avs ? fromAviationStack(ident, date, keys.avs) : null,
  ]);
  const sources = {
    flightaware: fa ? (fa.flight ? "ok" : fa.error || "not_found") : "not_configured",
    aerodatabox: adb ? (adb.flight ? "ok" : adb.error || "not_found") : "not_configured",
    aviationstack: avs ? (avs.flight ? "ok" : avs.error || "not_found") : "not_configured",
  };
  const parts = [fa?.flight, adb?.flight, avs?.flight].filter(Boolean);
  const body = {
    configured: true,
    found: parts.length > 0,
    flight: parts.length ? merge(parts) : null,
    sources,
    updatedAt: new Date().toISOString(),
  };
  CACHE.set(cacheKey, { at: Date.now(), body });
  return send(res, 200, body, 300);
}
