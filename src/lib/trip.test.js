import { describe, it, expect } from "vitest";
import { zonedToUtc, fmtClock, parseClock } from "./time.js";
import { identOf, schedule, computeLeaveBy, leaveState, connectionRisk, diffBookingVsLive, checkinWindow, liveTimes } from "./trip.js";
import { buildTripIcs } from "./ics.js";
import { mockLive } from "./liveData.js";

const LY347 = { id: "f2", iata: "LY 347", code: "LY", airline: "El Al", dep: "TLV", arr: "ZRH", depDate: "2026-07-02", depTime: "8:00 AM", arrTime: "11:20 AM", gate: "TBD", terminal: "Terminal 3" };
const LX064 = { id: "f3", iata: "LX 064", code: "LX", airline: "Swiss", dep: "ZRH", arr: "MIA", depDate: "2026-07-02", depTime: "1:00 PM", arrTime: "5:25 PM", gate: "E26", terminal: "Terminal 2", arrGate: "J18" };

describe("time", () => {
  it("parses clocks", () => {
    expect(parseClock("12:05 AM")).toEqual({ h: 0, m: 5 });
    expect(parseClock("1:00 PM")).toEqual({ h: 13, m: 0 });
  });
  it("converts wall time to UTC with zone (IDT = UTC+3 in July)", () => {
    expect(zonedToUtc("2026-07-02", "8:00 AM", "Asia/Jerusalem").toISOString()).toBe("2026-07-02T05:00:00.000Z");
    expect(zonedToUtc("2026-07-02", "5:25 PM", "America/New_York").toISOString()).toBe("2026-07-02T21:25:00.000Z");
    expect(fmtClock(new Date("2026-07-02T09:20:00Z"), "Europe/Zurich")).toBe("11:20 AM");
  });
});

describe("LY 347 schedule (verified 8:00 AM, not 7:00)", () => {
  it("is 4h20m block time", () => {
    const s = schedule(LY347);
    expect((s.arr - s.dep) / 60000).toBe(260);
  });
});

describe("leave-by", () => {
  it("is departure - 3h intl buffer - 45 drive - 15 traffic", () => {
    const lb = computeLeaveBy(LY347, null);
    expect(fmtClock(lb.leaveBy, "Asia/Jerusalem")).toBe("4:00 AM");
    expect(lb.shiftMins).toBe(0);
  });
  it("shifts later with a 35 min delay", () => {
    const lb = computeLeaveBy(LY347, mockLive(LY347, "delay"));
    expect(lb.shiftMins).toBe(35);
    expect(fmtClock(lb.leaveBy, "Asia/Jerusalem")).toBe("4:35 AM");
  });
  it("states", () => {
    const lb = computeLeaveBy(LY347, null);
    expect(leaveState(new Date("2026-07-01T23:30:00Z"), lb)).toBe("ok");
    expect(leaveState(new Date("2026-07-02T00:30:00Z"), lb)).toBe("soon");
    expect(leaveState(new Date("2026-07-02T01:05:00Z"), lb)).toBe("now");
    expect(leaveState(new Date("2026-07-02T06:00:00Z"), lb)).toBe("gone");
  });
});

describe("connection risk", () => {
  const opts = { terminalChange: true, withKids: true };
  it("100 min ZRH layover with re-screen + kids is tight", () => {
    const r = connectionRisk(LY347, LX064, null, null, opts);
    expect(r.mins).toBe(100);
    expect(r.mct).toBe(85);
    expect(r.level).toBe("tight");
  });
  it("relaxed without extra factors on time", () => {
    expect(connectionRisk(LY347, LX064, null, null, {}).level).toBe("tight"); // 100-60 = 40 < 45
  });
  it("delay pushes to at risk", () => {
    const r = connectionRisk(LY347, LX064, mockLive(LY347, "delay"), mockLive(LX064, "delay"), opts);
    expect(r.mins).toBe(70);
    expect(r.level).toBe("at-risk");
  });
  it("cancellation is at risk", () => {
    expect(connectionRisk(LY347, LX064, null, mockLive(LX064, "cancel"), opts).level).toBe("at-risk");
  });
});

describe("what changed", () => {
  it("reports delay and gate changes", () => {
    const d = diffBookingVsLive(LY347, mockLive(LY347, "delay"));
    expect(d.map(x => x.kind)).toEqual(["dep-time", "arr-time", "dep-gate"]);
    expect(d[0].text).toContain("8:35 AM");
    const d2 = diffBookingVsLive(LX064, mockLive(LX064, "delay"));
    expect(d2[0].text).toBe("ZRH gate changed: E26 → E31");
  });
  it("is empty without live data and for matching data", () => {
    expect(diffBookingVsLive(LX064, null)).toEqual([]);
    expect(diffBookingVsLive(LX064, { depGate: "E26", depTerminal: "Terminal 2" })).toEqual([]);
  });
  it("live never changes booked times", () => {
    const live = mockLive(LY347, "delay");
    const t = liveTimes(LY347, live);
    expect(t.schedDep.toISOString()).toBe("2026-07-02T05:00:00.000Z");
    expect(LY347.depTime).toBe("8:00 AM");
  });
});

describe("check-in + ics", () => {
  it("opens 24h before", () => {
    const w = checkinWindow(LY347, new Date("2026-07-01T04:00:00Z"));
    expect(w.state).toBe("upcoming");
    expect(w.minsToOpen).toBe(60);
    expect(checkinWindow(LY347, new Date("2026-07-02T00:00:00Z")).state).toBe("open");
  });
  it("builds a valid calendar", () => {
    const ics = buildTripIcs([LY347, LX064], { now: new Date("2026-06-01T00:00:00Z") });
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect((ics.match(/BEGIN:VEVENT/g) || []).length).toBe(4);
    expect(ics).toContain("DTSTART:20260702T050000Z");
    expect(ics).toContain("DTSTART:20260701T050000Z"); // check-in opens
    expect(ics.split("\r\n").every(l => l.length <= 75)).toBe(true);
  });
});

describe("ident", () => {
  it("strips spaces and leading zeros", () => {
    expect(identOf({ iata: "LX 064" })).toBe("LX64");
    expect(identOf({ iata: "LY 018" })).toBe("LY18");
    expect(identOf({ iata: "LY 347" })).toBe("LY347");
  });
});
