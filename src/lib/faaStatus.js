// Parser for the free FAA NAS status feed (nasstatus.faa.gov/api/airport-status-information).
// The feed is XML and may contain several <AIRPORT_STATUS_INFORMATION> roots back to back,
// so it is parsed with small regexes instead of a DOM (works in Node and the browser).

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = s => String(s || "")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&(amp|lt|gt|quot|apos);/g, (_, n) => ENT[n])
  .replace(/\s+/g, " ").trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : null; };
const all = (xml, name) => [...xml.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "g"))].map(m => m[1]);

/** "1 hour and 3 minutes" -> 63 */
export function toMinutes(s) {
  if (!s) return null;
  const h = /(\d+)\s*hour/i.exec(s), m = /(\d+)\s*min/i.exec(s);
  if (!h && !m) return null;
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
}

/**
 * @returns {{ updatedAt: string|null, airports: Record<string, Array<{type:"ground_delay"|"ground_stop"|"delay"|"closure", reason, ...}>> }}
 * Closures that only affect non-scheduled general aviation are flagged gaOnly (not relevant to airline passengers).
 */
export function parseFaaStatus(xml) {
  const out = { updatedAt: null, airports: {} };
  if (typeof xml !== "string" || !xml.includes("<")) return out;
  out.updatedAt = tag(xml, "Update_Time");
  const add = (code, item) => { if (!code) return; (out.airports[code] ||= []).push(item); };
  for (const dt of all(xml, "Delay_type")) {
    for (const g of all(dt, "Ground_Delay")) {
      add(tag(g, "ARPT"), { type: "ground_delay", reason: tag(g, "Reason"), avg: tag(g, "Avg"), max: tag(g, "Max"), avgMins: toMinutes(tag(g, "Avg")), maxMins: toMinutes(tag(g, "Max")) });
    }
    for (const p of all(dt, "Program")) {
      add(tag(p, "ARPT"), { type: "ground_stop", reason: tag(p, "Reason"), endTime: tag(p, "End_Time") });
    }
    for (const d of all(dt, "Delay")) {
      const code = tag(d, "ARPT"), reason = tag(d, "Reason");
      for (const m of d.matchAll(/<Arrival_Departure(?:\s+Type="([^"]*)")?[^>]*>([\s\S]*?)<\/Arrival_Departure>/g)) {
        const body = m[2];
        add(code, { type: "delay", direction: (m[1] || "").toLowerCase() || null, reason, min: tag(body, "Min"), max: tag(body, "Max"), trend: tag(body, "Trend"), minMins: toMinutes(tag(body, "Min")), maxMins: toMinutes(tag(body, "Max")) });
      }
    }
    for (const a of all(dt, "Airport")) {
      const reason = tag(a, "Reason");
      const w = notamWindow(reason);
      add(tag(a, "ARPT"), { type: "closure", reason, start: tag(a, "Start"), reopen: tag(a, "Reopen"), gaOnly: /NON SKED TRANSIENT GA/i.test(reason || ""), windowStart: w?.start || null, windowEnd: w?.end || null });
    }
  }
  return out;
}

/** NOTAM validity "YYMMDDhhmm-YYMMDDhhmm" (UTC) at the end of the text -> ISO strings, or null. */
export function notamWindow(text) {
  const m = [...String(text || "").matchAll(/\b(\d{10})-(\d{10}|PERM)\b/g)].pop();
  if (!m) return null;
  const iso = x => { const [, y, mo, d, h, mi] = x.match(/(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/); return `20${y}-${mo}-${d}T${h}:${mi}:00.000Z`; };
  return { start: iso(m[1]), end: m[2] === "PERM" ? null : iso(m[2]) };
}

const localHour = (iso, tz) => {
  try { return +new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz || "UTC" }).format(new Date(iso)); }
  catch { return new Date(iso).getUTCHours(); }
};

/**
 * Routine / scheduled closures that don't concern an airline passenger:
 * recurring schedules (DLY, DAILY, NIGHTLY, weekday ranges) or a planned overnight
 * window (<= 10h, starting 21:00–03:00 and ending by 08:00 local).
 */
export function isRoutineClosure(ev, { tz } = {}) {
  if (ev?.type !== "closure") return false;
  const r = ev.reason || "";
  if (/\b(DLY|DAILY|NIGHTLY|EVERY|WKLY|WEEKLY)\b|\b(MON|TUE|WED|THU|FRI|SAT|SUN)-(MON|TUE|WED|THU|FRI|SAT|SUN)\b/i.test(r)) return true;
  if (ev.windowStart && ev.windowEnd) {
    const hrs = (Date.parse(ev.windowEnd) - Date.parse(ev.windowStart)) / 3600000;
    const sh = localHour(ev.windowStart, tz), eh = localHour(ev.windowEnd, tz);
    if (hrs > 0 && hrs <= 10 && (sh >= 21 || sh <= 3) && eh <= 8) return true;
  }
  return false;
}

const sameLocalDay = (a, b, tz) => {
  const f = d => new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC" }).format(d);
  try { return f(a) === f(b); } catch { return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10); }
};

/**
 * Does an event matter for a flight touching this airport during [from, to]?
 * Closures with a NOTAM window: only if the window overlaps the flight's window.
 * Live conditions (delays, ground stops/delay programs, closures without a window): only if the
 * flight is today (airport-local) or `now` is inside the flight's window.
 */
export function appliesToFlight(ev, { now, from, to, tz }) {
  if (ev.type === "closure" && ev.windowStart) {
    const s = Date.parse(ev.windowStart), e = ev.windowEnd ? Date.parse(ev.windowEnd) : Infinity;
    return s < +to && e > +from;
  }
  return sameLocalDay(now, from, tz) || (+now >= +from && +now <= +to);
}

/** Events worth a chip on a flight: no GA-only, no routine closures, only in the flight's date/time window. */
export function relevantEvents(parsed, code, { now, from, to, tz }) {
  return statusFor(parsed, code).filter(ev => !isRoutineClosure(ev, { tz }) && appliesToFlight(ev, { now, from, to, tz }));
}

/** FAA uses 3-letter codes; for US airports these match IATA. */
export function statusFor(parsed, code, { includeGaOnly = false } = {}) {
  const list = (parsed?.airports?.[code] || []).filter(x => includeGaOnly || !x.gaOnly);
  return list;
}

/** One human line per event. */
export function describe(ev) {
  if (ev.type === "ground_stop") return `Ground stop${ev.endTime ? ` until ${ev.endTime}` : ""}${ev.reason ? ` · ${ev.reason}` : ""}`;
  if (ev.type === "ground_delay") return `Ground delay program · avg ${ev.avg || "?"}${ev.max ? `, max ${ev.max}` : ""}${ev.reason ? ` · ${ev.reason}` : ""}`;
  if (ev.type === "delay") return `${ev.direction ? ev.direction[0].toUpperCase() + ev.direction.slice(1) + " delays" : "Delays"} ${ev.min || ""}${ev.max ? `–${ev.max}` : ""}${ev.trend ? ` (${ev.trend.toLowerCase()})` : ""}${ev.reason ? ` · ${ev.reason}` : ""}`;
  if (ev.type === "closure") return `Closure notice${ev.reopen ? ` · reopens ${ev.reopen.replace(/\.$/, "")}` : ""}`;
  return "Status notice";
}

/** Client: fetch via our proxy. Never throws. Concurrent callers share one request. */
let inflight = null;
export function fetchFaaStatus(opts) {
  if (!inflight) inflight = loadFaa(opts).finally(() => { inflight = null; });
  return inflight;
}
async function loadFaa({ timeoutMs = 6000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch("/api/faa", { signal: ctl.signal, cache: "no-store" });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.includes("application/json")) return { ok: false, error: r.ok ? "unavailable" : `HTTP ${r.status}` };
    const j = await r.json();
    return j.ok ? j : { ok: false, error: j.error || "unavailable" };
  } catch (e) {
    return { ok: false, error: e?.name === "AbortError" ? "timeout" : "network" };
  } finally { clearTimeout(t); }
}
