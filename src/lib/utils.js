// Shared helpers for MyRunway.

// Status colors (identical across themes, matches original design).
export function sc(s) {
  if (s === "On Time" || s === "Scheduled") return { c: "#00e87a", bg: "rgba(0,232,122,0.1)", br: "rgba(0,232,122,0.25)" };
  if (s === "Departed" || s === "In Air" || s === "Boarding") return { c: "#00c8f0", bg: "rgba(0,200,240,0.1)", br: "rgba(0,200,240,0.25)" };
  if (s === "Delayed") return { c: "#ffc800", bg: "rgba(255,200,0,0.1)", br: "rgba(255,200,0,0.25)" };
  if (s === "Landed") return { c: "#00e87a", bg: "rgba(0,232,122,0.1)", br: "rgba(0,232,122,0.25)" };
  if (s === "Cancelled") return { c: "#ff3a54", bg: "rgba(255,58,84,0.1)", br: "rgba(255,58,84,0.25)" };
  if (s === "Gate Change") return { c: "#a78bfa", bg: "rgba(167,139,250,0.1)", br: "rgba(167,139,250,0.25)" };
  return { c: "#7a9ab8", bg: "rgba(78,112,144,0.1)", br: "rgba(78,112,144,0.25)" };
}

// Delay-risk levels (Flighty-style). score: 0-100.
export function riskInfo(score) {
  if (score < 30) return { level: "LOW", c: "#00e87a", bg: "rgba(0,232,122,0.08)", br: "rgba(0,232,122,0.22)", icon: "🟢" };
  if (score < 60) return { level: "MODERATE", c: "#ffc800", bg: "rgba(255,200,0,0.08)", br: "rgba(255,200,0,0.22)", icon: "🟡" };
  return { level: "HIGH", c: "#ff3a54", bg: "rgba(255,58,84,0.08)", br: "rgba(255,58,84,0.22)", icon: "🔴" };
}

// Airport health score → label/color. Higher = healthier.
export function healthInfo(score) {
  if (score >= 75) return { label: "SMOOTH", c: "#00e87a", bg: "rgba(0,232,122,0.08)", br: "rgba(0,232,122,0.22)" };
  if (score >= 55) return { label: "BUSY", c: "#ffc800", bg: "rgba(255,200,0,0.08)", br: "rgba(255,200,0,0.22)" };
  return { label: "DISRUPTED", c: "#ff3a54", bg: "rgba(255,58,84,0.08)", br: "rgba(255,58,84,0.22)" };
}

// ── Demo clock ────────────────────────────────────────────────
// The demo runs on a virtual clock counted in minutes from DEMO_START
// (4:00 AM, Wed Sep 2, 2026 — departure morning of the TLV→ZRH→MIA trip).
// Flight times in seed data are offsets (depMin/arrMin) from this origin.
// Note: offsets drive the sim only; displayed times (depTime/arrTime strings)
// come from the booking — the booking is the source of truth.
export const DEMO_ORIGIN_ABS = 4 * 60; // 4:00 AM in minutes-of-day
export const DEMO_DAY0 = 2; // September 2, 2026

// Format a demo-minute offset as a wall-clock string, e.g. 321 -> "3:51 PM".
export function fmtClock(demoMin) {
  const abs = DEMO_ORIGIN_ABS + Math.round(demoMin);
  const mod = ((abs % 1440) + 1440) % 1440;
  let h = Math.floor(mod / 60);
  const m = mod % 60;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

// Format as "Sep 3" for offsets that cross midnight.
export function fmtDay(demoMin) {
  const abs = DEMO_ORIGIN_ABS + Math.round(demoMin);
  const day = DEMO_DAY0 + Math.floor(abs / 1440);
  return day <= 30 ? `Sep ${day}` : `Oct ${day - 30}`;
}

// "2h 22m" / "48m"
export function fmtDur(mins) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

// ── Leave-by-home computation (door-to-gate, our differentiator) ──
// International departure out of TLV: 3h airport buffer (security interview).
export const DRIVE_MIN = 22, TRAFFIC_MIN = 8, AIRPORT_BUFFER_MIN = 180;

// Returns { leaveAtMin, minsLeft, phase } where phase is
// "later" | "soon" | "now" | "go" (past leave time).
export function computeLeave(flight, now) {
  const leaveAtMin = flight.depMin - AIRPORT_BUFFER_MIN - DRIVE_MIN - TRAFFIC_MIN;
  const minsLeft = leaveAtMin - now;
  const phase = minsLeft > 60 ? "later" : minsLeft > 20 ? "soon" : minsLeft > 0 ? "now" : "go";
  return { leaveAtMin, minsLeft, phase };
}

// Equirectangular projection of lat/lon into an SVG viewBox.
// bounds: {minLat, maxLat, minLon, maxLon}. Returns {x, y} in [0..w]/[0..h].
export function project(lat, lon, bounds, w, h, pad = 30) {
  const x = pad + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * (w - pad * 2);
  const y = pad + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (h - pad * 2);
  return { x, y };
}
