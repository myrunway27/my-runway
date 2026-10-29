// Late-plane alert: is the aircraft that will fly our flight (the "inbound") arriving too late
// to turn around in time? Pure function over the inbound data /api/flight already returns
// (FlightAware inbound_fa_flight_id -> live.inbound { ident, origin, status, estArr, delayMins }).

const WIDEBODY = /\b(7[4-8]7|A3[3-8]\d|A350|A380|777|787|767|747)\b/i;

/** Typical minimum turn time: ~40 min narrowbody, ~75 min widebody. */
export function minTurnMins(aircraft) {
  return WIDEBODY.test(String(aircraft || "")) ? 75 : 40;
}

/**
 * @param {{ inbound?: object|null, ourDep: Date, aircraft?: string, turnMins?: number }} p
 * @returns {{ level:"none"|"ok"|"tight"|"late"|"watch", slackMins:number|null, eta:Date|null, turnMins:number, message:string|null }}
 *   none  - no inbound data
 *   ok    - lands with at least the turn time to spare
 *   tight - lands with less than turn time + 15 min to spare
 *   late  - lands after (our departure - turn time): our flight will likely leave late
 *   watch - no ETA, but the inbound reports 30+ min of delay
 */
export function lateInbound({ inbound, ourDep, aircraft, turnMins }) {
  const turn = Number.isFinite(turnMins) ? turnMins : minTurnMins(aircraft);
  const base = { level: "none", slackMins: null, eta: null, turnMins: turn, message: null };
  if (!inbound || !(ourDep instanceof Date) || Number.isNaN(ourDep.getTime())) return base;
  const who = `${inbound.ident ? inbound.ident + " " : "Your plane "}from ${inbound.origin || "its origin"}`;
  if (/landed|arrived/i.test(inbound.status || "")) return { ...base, level: "ok", message: `${who} has landed.` };
  const eta = inbound.estArr ? new Date(inbound.estArr) : null;
  if (!eta || Number.isNaN(eta.getTime())) {
    const d = inbound.delayMins || 0;
    return d >= 30
      ? { ...base, level: "watch", message: `${who} is running ${d} min late. Watch for a knock-on delay.` }
      : { ...base, level: "ok" };
  }
  const slack = Math.round((ourDep.getTime() - eta.getTime()) / 60000) - turn;
  const r = { ...base, eta, slackMins: slack };
  if (slack < 0) return { ...r, level: "late", message: `${who} lands too late for a normal ${turn}-min turn. Expect about ${-slack} min of delay.` };
  if (slack < 15) return { ...r, level: "tight", message: `${who} lands with only ${slack} min to spare over a ${turn}-min turn.` };
  return { ...r, level: "ok" };
}
