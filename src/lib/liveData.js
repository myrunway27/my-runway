// Client side of live data. Talks only to our own /api/flight proxy (no keys in the browser).
// Every failure path returns { configured:false } or { error }, and the UI falls back to the booking.
import { schedule, identOf } from "./trip.js";

// /api/flight only answers for dates within ±3 days of today (UTC); don't call it for others.
export const LIVE_WINDOW_DAYS = 3;
export function inLiveWindow(date, now = new Date()) {
  const d = Date.parse(`${date}T00:00:00Z`);
  const today = Date.parse(now.toISOString().slice(0, 10) + "T00:00:00Z");
  return Number.isFinite(d) && Math.abs(d - today) <= LIVE_WINDOW_DAYS * 86400000;
}

export async function fetchLive(f, now = new Date()) {
  if (!inLiveWindow(f.depDate, now)) return { configured: false, outOfWindow: true }; // nothing to ask: providers only cover ±3 days
  const s = schedule(f);
  const qs = new URLSearchParams({ ident: identOf(f), date: f.depDate, dep: f.dep, sched: s.dep.toISOString() });
  try {
    const r = await fetch(`/api/flight?${qs}`);
    const type = r.headers.get("content-type") || "";
    if (!type.includes("application/json")) return { configured: false }; // static hosting / no API route
    const j = await r.json();
    if (r.status === 503 || j.configured === false) return { configured: false };
    if (!r.ok) return { configured: true, error: j.error || `HTTP ${r.status}` };
    return { configured: true, found: j.found, live: j.flight, sources: j.sources, updatedAt: j.updatedAt };
  } catch {
    return { configured: false, error: "network" };
  }
}

export const MOCK_SCENARIOS = [
  { id: "off", label: "Off (real live data only)" },
  { id: "delay", label: "LY 347 late 35 min + gate changes" },
  { id: "ontime", label: "All on time, gates + belt assigned" },
  { id: "cancel", label: "LX 064 cancelled" },
];

const iso = (d, mins) => new Date(d.getTime() + mins * 60000).toISOString();

/** Deterministic mock overlays for demos/tests. Mirrors the /api/flight response shape. */
export function mockLive(f, scenario) {
  if (!scenario || scenario === "off") return null;
  const s = schedule(f);
  const base = { source: "mock" };
  if (scenario === "ontime") {
    if (f.id === "f2") return { ...base, status: "Scheduled", depGate: "C4", depTerminal: "3", estDep: iso(s.dep, 0), estArr: iso(s.arr, 0) };
    if (f.id === "f3") return { ...base, status: "Scheduled", depGate: "E26", arrGate: "J18", baggage: "12", estDep: iso(s.dep, 0), estArr: iso(s.arr, -5) };
    return null;
  }
  if (scenario === "delay") {
    if (f.id === "f2") return { ...base, status: "Delayed", depGate: "C7", depDelayMins: 35, arrDelayMins: 30, estDep: iso(s.dep, 35), estArr: iso(s.arr, 30),
      inbound: { ident: "LY 346", origin: "ZRH", status: "In Air", delayMins: 40, estArr: iso(s.dep, -25) } };
    if (f.id === "f3") return { ...base, status: "Scheduled", depGate: "E31", arrGate: "J18", estDep: iso(s.dep, 0), estArr: iso(s.arr, 0) };
    return null;
  }
  if (scenario === "cancel") {
    if (f.id === "f3") return { ...base, status: "Cancelled" };
    return null;
  }
  return null;
}

/** Used by "Add flight": does live data know this flight on this date? Never invents schedule data. */
export async function verifyFlight(iata, date, now = new Date()) {
  const ident = identOf({ iata });
  if (!inLiveWindow(date, now)) return { configured: true, error: "live data only covers ±3 days from today" };
  try {
    const r = await fetch(`/api/flight?${new URLSearchParams({ ident, date })}`);
    const type = r.headers.get("content-type") || "";
    if (!type.includes("application/json")) return { configured: false };
    const j = await r.json();
    if (r.status === 503 || j.configured === false) return { configured: false };
    if (!r.ok) return { configured: true, error: j.error || `HTTP ${r.status}` };
    return { configured: true, found: !!j.found, live: j.flight };
  } catch {
    return { configured: false, error: "network" };
  }
}
