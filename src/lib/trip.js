// Pure trip logic: booked schedule + optional live overlay -> derived facts.
// Golden rule: booked times are the source of truth; live data only adds an overlay.
import { airport, isDomesticPair } from "./airports.js";
import { zonedToUtc, addMinutes, diffMinutes, fmtClock, fmtDuration } from "./time.js";

/** "LX 064" -> "LX64" (ident format the flight-data APIs expect) */
export function identOf(f) {
  const m = String(f.iata || "").toUpperCase().replace(/\s+/g, "").match(/^([A-Z0-9]{2})0*(\d{1,4}[A-Z]?)$/);
  return m ? m[1] + m[2] : String(f.iata || "").replace(/\s+/g, "");
}

export function tzOf(code) {
  return airport(code)?.tz || "UTC";
}

/** Booked departure/arrival instants. */
export function schedule(f) {
  return {
    dep: zonedToUtc(f.depDate, f.depTime, tzOf(f.dep)),
    arr: zonedToUtc(f.arrDate || f.depDate, f.arrTime, tzOf(f.arr)),
  };
}

const parseIso = s => (s ? new Date(s) : null);
const valid = d => d && !Number.isNaN(d.getTime());

/** Booked + live => estimated times and delays (minutes). */
export function liveTimes(f, live) {
  const s = schedule(f);
  let estDep = valid(parseIso(live?.actDep)) ? parseIso(live.actDep) : valid(parseIso(live?.estDep)) ? parseIso(live.estDep) : null;
  let estArr = valid(parseIso(live?.actArr)) ? parseIso(live.actArr) : valid(parseIso(live?.estArr)) ? parseIso(live.estArr) : null;
  if (!estDep) estDep = addMinutes(s.dep, live?.depDelayMins || 0);
  if (!estArr) estArr = addMinutes(s.arr, live?.arrDelayMins ?? live?.depDelayMins ?? 0);
  return {
    schedDep: s.dep, schedArr: s.arr, estDep, estArr,
    depDelay: diffMinutes(estDep, s.dep),
    arrDelay: diffMinutes(estArr, s.arr),
    cancelled: live?.status === "Cancelled",
  };
}

export function isInternational(f) {
  return !isDomesticPair(f.dep, f.arr);
}

/** Phase of a flight relative to `now`. */
export function flightPhase(f, live, now) {
  const t = liveTimes(f, live);
  if (t.cancelled) return "cancelled";
  if (now >= t.estArr) return "completed";
  if (now >= t.estDep) return "in-air";
  return "upcoming";
}

export const DEFAULT_PREFS = { driveMins: 45, trafficMins: 15, intlBufferMins: 180, domesticBufferMins: 120 };

/**
 * Leave-by: estimated departure - airport buffer - drive - traffic pad.
 * Delays of 15+ min shift the leave-by later; smaller ones are ignored (they recover).
 */
export function computeLeaveBy(f, live, prefs = {}) {
  const p = { ...DEFAULT_PREFS, ...prefs };
  const t = liveTimes(f, live);
  const buffer = isInternational(f) ? p.intlBufferMins : p.domesticBufferMins;
  const total = buffer + p.driveMins + p.trafficMins;
  const original = addMinutes(t.schedDep, -total);
  const shift = !t.cancelled && t.depDelay >= 15 ? t.depDelay : 0;
  const leaveBy = addMinutes(original, shift);
  return {
    leaveBy, original, shiftMins: shift, bufferMins: buffer,
    driveMins: p.driveMins, trafficMins: p.trafficMins,
    securityMins: airport(f.dep)?.securityMins ?? null,
    depAt: t.estDep,
  };
}

/** "ok" (> 60 min to go) | "soon" (<= 60) | "now" (time to go) | "gone" (flight departed) */
export function leaveState(now, lb) {
  if (now >= lb.depAt) return "gone";
  const mins = diffMinutes(lb.leaveBy, now);
  if (mins <= 0) return "now";
  if (mins <= 60) return "soon";
  return "ok";
}

/**
 * Connection risk from inbound arrival vs. outbound departure (live-aware).
 * MCT heuristic: 45 domestic / 60 international, +15 terminal change or security re-screen,
 * +10 travelling with children. Slack >= 45 relaxed, >= 0 tight, < 0 at risk.
 */
export function connectionRisk(inbound, outbound, liveIn, liveOut, opts = {}) {
  const a = liveTimes(inbound, liveIn);
  const b = liveTimes(outbound, liveOut);
  const scheduledMins = diffMinutes(b.schedDep, a.schedArr);
  const mins = diffMinutes(b.estDep, a.estArr);
  const intl = isInternational(inbound) || isInternational(outbound);
  const factors = [{ label: intl ? "International connection" : "Domestic connection", mins: intl ? 60 : 45 }];
  if (opts.terminalChange) factors.push({ label: "Terminal change / security re-screen", mins: 15 });
  if (opts.withKids) factors.push({ label: "Travelling with kids", mins: 10 });
  const mct = factors.reduce((s, x) => s + x.mins, 0);
  const slack = mins - mct;
  let level = slack >= 45 ? "relaxed" : slack >= 0 ? "tight" : "at-risk";
  if (a.cancelled || b.cancelled) level = "at-risk";
  return { mins, scheduledMins, mct, slack, level, factors, arrAt: a.estArr, depAt: b.estDep, changed: mins !== scheduledMins };
}

export const RISK_COPY = {
  relaxed: { label: "RELAXED", color: "green", text: "Plenty of time for this connection." },
  tight: { label: "TIGHT", color: "yellow", text: "Doable, but go straight to the next gate." },
  "at-risk": { label: "AT RISK", color: "red", text: "You may miss this connection. Check alternatives now." },
};

const norm = v => String(v || "").replace(/^terminal\s*/i, "").trim().toUpperCase();
const isTbd = v => !v || /^(tbd|tba|-|—)$/i.test(String(v).trim());

/** Booking vs. live: list of human-readable changes. */
export function diffBookingVsLive(f, live) {
  if (!live) return [];
  const out = [];
  const t = liveTimes(f, live);
  const depTz = tzOf(f.dep), arrTz = tzOf(f.arr);
  if (live.status === "Cancelled") {
    out.push({ kind: "cancelled", severity: "red", text: `${f.iata} is cancelled` });
    return out;
  }
  if (live.status === "Diverted") out.push({ kind: "diverted", severity: "red", text: `${f.iata} was diverted` });
  if (Math.abs(t.depDelay) >= 5) {
    out.push({ kind: "dep-time", severity: t.depDelay > 0 ? "yellow" : "accent",
      text: `Departs ${fmtDuration(Math.abs(t.depDelay))} ${t.depDelay > 0 ? "late" : "early"}: ${fmtClock(t.estDep, depTz)} (booked ${f.depTime})` });
  }
  if (Math.abs(t.arrDelay) >= 5 && Math.abs(t.arrDelay - t.depDelay) >= 5) {
    out.push({ kind: "arr-time", severity: t.arrDelay > 0 ? "yellow" : "accent",
      text: `Lands ${fmtClock(t.estArr, arrTz)} (booked ${f.arrTime})` });
  }
  const gateRow = (bookedV, liveV, label, kind) => {
    if (isTbd(liveV) || norm(bookedV) === norm(liveV)) return;
    out.push(isTbd(bookedV)
      ? { kind, severity: "accent", text: `${label} assigned: ${liveV}` }
      : { kind, severity: "yellow", text: `${label} changed: ${bookedV} → ${liveV}` });
  };
  gateRow(f.gate, live.depGate, `${f.dep} gate`, "dep-gate");
  gateRow(f.terminal, live.depTerminal, `${f.dep} terminal`, "dep-terminal");
  gateRow(f.arrGate, live.arrGate, `${f.arr} arrival gate`, "arr-gate");
  if (live.baggage) out.push({ kind: "baggage", severity: "accent", text: `${f.arr} baggage belt ${live.baggage}` });
  return out;
}

export const CHECKIN_RULES = {
  LY: { hours: 24, closeMins: 60, url: "https://www.elal.com/eng/online-services" },
  LX: { hours: 24, closeMins: 60, url: "https://www.swiss.com/us/en/fly/check-in/online-check-in" },
};

/** Online check-in window for a flight (booked departure based). */
export function checkinWindow(f, now) {
  const rule = CHECKIN_RULES[f.code] || { hours: 24, closeMins: 60, url: null };
  const { dep } = schedule(f);
  const opensAt = addMinutes(dep, -rule.hours * 60);
  const closesAt = addMinutes(dep, -rule.closeMins);
  const state = now < opensAt ? "upcoming" : now < closesAt ? "open" : "closed";
  return { opensAt, closesAt, state, minsToOpen: diffMinutes(opensAt, now), url: rule.url, hours: rule.hours };
}
