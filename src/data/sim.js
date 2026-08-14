// Live-demo simulation engine. The store advances a virtual clock every
// TICK_MS; this module owns the scripted event timeline and the pure
// state-transition logic so the whole app feels live.
//
// Each scripted event carries:
//   type — the state mutation ("gate"|"risk"|"status"|"inbound"|"family"|"notify")
//   kind — the notification category ("gate"|"delay"|"cancel"|"info")
//   icon — an ICON NAME (components/icons.jsx), never emoji
// Notifications built in applyTick always include kind; a "cancel" kind
// flips the app bell red.

export const TICK_MS = 4000;      // real ms per tick
export const MIN_PER_TICK = 4;    // demo minutes advanced per tick

// Scripted events, keyed by tick number. Timeline (4 demo-min per 4s tick,
// clock starts 4:00 AM): tick 5 ≈ 4:20 AM, tick 30 ≈ 6:00 AM,
// tick 60 ≈ 8:00 AM — departure of LY 347 (depMin 240).
export const SCRIPT = [
  { at: 4, type: "gate", kind: "gate", flightId: "f1", gate: "B7", icon: "door", title: "Gate assigned — LY 347", body: "Departs from Gate B7, Terminal 3. Security interview lines are moving." },
  { at: 9, type: "notify", kind: "info", icon: "security", title: "TLV security wait rising", body: "Interview line is ~35 min and rising for the morning wave. Consider leaving 15 minutes earlier." },
  { at: 14, type: "family", kind: "info", personId: "p2", status: "Landed", eta: "Arrived", progress: 100, icon: "planeDown", title: "Jake landed at LAX", body: "SW 881 arrived 6 minutes early. Tap Family to send the pickup link." },
  { at: 20, type: "notify", kind: "info", icon: "plane", title: "Inbound aircraft confirmed — LY 347", body: "LY 8 from New York is parked at the gate. Your 787 slept at the gate — zero inbound risk." },
  { at: 26, type: "risk", kind: "delay", flightId: "f2", score: 34, addReason: { icon: "wind", label: "Föhn wind watch at ZRH", detail: "Afternoon gusts possible — arrivals may slow" }, icon: "trendUp", title: "Delay risk rising — LX 64", body: "Risk now MODERATE. Föhn winds may gust at Zurich this afternoon. We'll watch it for you." },
  { at: 33, type: "gate", kind: "gate", flightId: "f2", gate: "E24", icon: "door", title: "Gate assigned — LX 64", body: "Departs from Gate E24, Terminal E. Skymetro ride from arrivals is ~10 min." },
  { at: 42, type: "family", kind: "info", personId: "p3", status: "In Air", progress: 30, icon: "planeUp", title: "Sarah is in the air", body: "BA 178 departed London. ETA 8:00 PM into JFK." },
  { at: 55, type: "status", kind: "info", flightId: "f1", status: "Boarding", icon: "ticket", title: "LY 347 now boarding", body: "Boarding at Gate B7 — Zone C / GROUP 3, Seat 22C." },
  { at: 70, type: "family", kind: "cancel", personId: "p3", status: "Cancelled", eta: "—", progress: 0, icon: "siren", title: "Sarah's flight was cancelled", body: "BA 178 LHR→JFK cancelled by the airline. Help her rebook from the Family tab." },
];

// Pure tick transition. Returns { flights, family, employees, notifications }
// — new arrays only where something changed.
export function applyTick({ tick, now, flights, family, employees }, fmtClockFn) {
  const events = SCRIPT.filter((e) => e.at === tick);
  const notifications = [];

  let nextFlights = flights;
  let nextFamily = family;

  for (const e of events) {
    notifications.push({
      id: `n-${e.at}-${e.type}`,
      kind: e.kind, icon: e.icon, title: e.title, body: e.body,
      time: fmtClockFn(now), read: false,
    });
    if (e.type === "gate") {
      nextFlights = nextFlights.map((f) => (f.id === e.flightId ? { ...f, gate: e.gate, pass: f.pass ? { ...f.pass, gate: e.gate } : f.pass } : f));
    } else if (e.type === "risk") {
      nextFlights = nextFlights.map((f) => {
        if (f.id !== e.flightId) return f;
        const reasons = e.addReason ? [e.addReason, ...f.risk.reasons] : f.risk.reasons;
        return { ...f, risk: { ...f.risk, score: e.score, reasons } };
      });
    } else if (e.type === "status") {
      nextFlights = nextFlights.map((f) => (f.id === e.flightId ? { ...f, status: e.status } : f));
    } else if (e.type === "inbound") {
      nextFlights = nextFlights.map((f) => {
        if (f.id !== e.flightId) return f;
        const inbound = f.inbound.map((leg, i) => (i === e.legIndex ? { ...leg, status: e.status, progress: e.progress } : leg));
        return { ...f, inbound };
      });
    } else if (e.type === "family") {
      nextFamily = nextFamily.map((p) => (p.id === e.personId ? { ...p, ...(e.status && { status: e.status }), ...(e.eta && { eta: e.eta }), ...(e.progress != null && { progress: e.progress }) } : p));
    }
    // type "notify" mutates nothing — pure notification.
  }

  // Time-based flight state: once the clock passes depMin, flights take off
  // and progress toward arrMin (unless a scripted status like Cancelled holds).
  nextFlights = nextFlights.map((f) => {
    if (f.status === "Cancelled") return f;
    if (now >= f.depMin && now < f.arrMin) {
      const progress = Math.round(((now - f.depMin) / (f.arrMin - f.depMin)) * 100);
      return { ...f, status: "In Air", progress };
    }
    if (now >= f.arrMin) return { ...f, status: "Landed", progress: 100 };
    return f;
  });

  // Gentle progress creep for demo liveliness (never for cancelled trips).
  nextFamily = nextFamily.map((p) =>
    p.status !== "Cancelled" && p.progress > 0 && p.progress < 100 ? { ...p, progress: Math.min(99, p.progress + 1) } : p
  );
  const nextEmployees = employees.map((emp) =>
    emp.status !== "Cancelled" && emp.progress > 0 && emp.progress < 100 ? { ...emp, progress: Math.min(99, emp.progress + 1) } : emp
  );

  return { flights: nextFlights, family: nextFamily, employees: nextEmployees, notifications };
}
