import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseFaaStatus, statusFor, toMinutes, describe as describeEv , notamWindow, isRoutineClosure, appliesToFlight, relevantEvents } from "./faaStatus.js";
import handler, { limiter as faaLimiter } from "../../api/faa.js";
const fx = n => readFileSync(new URL(`./__fixtures__/${n}`, import.meta.url), "utf8");

describe("FAA NAS status parser", () => {
  const p = parseFaaStatus(fx("faa-mixed.xml"));
  it("minutes", () => { expect(toMinutes("1 hour and 3 minutes")).toBe(63); expect(toMinutes("45 minutes")).toBe(45); expect(toMinutes("")).toBeNull(); });
  it("ground delay", () => expect(statusFor(p, "SFO")[0]).toMatchObject({ type: "ground_delay", avgMins: 63, maxMins: 121, reason: "low ceilings" }));
  it("ground stop", () => expect(statusFor(p, "MIA")[0]).toMatchObject({ type: "ground_stop", endTime: "3:30 pm EDT" }));
  it("arrival/departure delays with entity decoding", () => {
    expect(statusFor(p, "ORD")[0]).toMatchObject({ type: "delay", direction: "departure", minMins: 16, maxMins: 30, trend: "Increasing" });
    expect(statusFor(p, "JFK")[0].reason).toBe("VOL:Volume & traffic");
    expect(describeEv(statusFor(p, "JFK")[0])).toMatch(/^Arrival delays 31 minutes–45 minutes/);
  });
  it("closures across multiple roots; GA-only hidden by default", () => {
    expect(statusFor(p, "LGA")[0]).toMatchObject({ type: "closure", gaOnly: false });
    expect(statusFor(p, "LAX")).toHaveLength(0);
    expect(statusFor(p, "LAX", { includeGaOnly: true })).toHaveLength(1);
    expect(p.updatedAt).toBe("Thu Jul 02 14:05:00 2026 GMT");
  });
  it("real captured feed parses", () => {
    const r = parseFaaStatus(fx("faa-closures-live-2026-10-29.xml"));
    expect(statusFor(r, "LGA")[0].reason).toMatch(/CLSD/);
    expect(statusFor(r, "SNA")).toHaveLength(1);
  });
  it("garbage is empty, not a throw", () => { expect(parseFaaStatus("not xml").airports).toEqual({}); expect(parseFaaStatus(null).airports).toEqual({}); });
});

function mockRes() { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, end(b) { r.body = JSON.parse(b); } }; return r; }
describe("api/faa", () => {
  it("falls back gracefully on upstream failure", async () => {
    const res = mockRes();
    await handler({ url: "/api/faa" }, res, { fetchImpl: async () => { throw new Error("boom"); } });
    expect(res.statusCode).toBe(200); expect(res.body).toEqual({ ok: false, error: "network" });
  });
  it("parses upstream XML", async () => {
    const res = mockRes();
    await handler({ url: "/api/faa" }, res, { fetchImpl: async () => ({ ok: true, text: async () => fx("faa-mixed.xml") }) });
    expect(res.body.ok).toBe(true); expect(res.body.airports.MIA[0].type).toBe("ground_stop");
    expect(res.headers["Cache-Control"]).toMatch(/s-maxage=60\b/);
  });
  it("blocks foreign origins and rate-limits at 60/min per IP", async () => {
    const res = mockRes();
    await handler({ url: "/api/faa", headers: { origin: "https://evil.example" } }, res);
    expect(res.statusCode).toBe(403);
    faaLimiter.reset();
    let last;
    for (let i = 0; i < 61; i++) { last = mockRes(); await handler({ url: "/api/faa", headers: { "x-forwarded-for": "192.0.2.1" } }, last, { fetchImpl: async () => ({ ok: true, text: async () => fx("faa-mixed.xml") }) }); }
    expect(last.statusCode).toBe(429); expect(Number(last.headers["Retry-After"])).toBeGreaterThan(0);
    faaLimiter.reset();
  });
});

describe("FAA relevance filtering", () => {
  const live = parseFaaStatus(readFileSync(new URL("./__fixtures__/faa-closures-live-2026-10-29.xml", import.meta.url), "utf8"));
  const LA = "America/Los_Angeles", NY = "America/New_York";
  it("parses NOTAM windows", () => {
    expect(notamWindow("X 2610290359-2610291000")).toEqual({ start: "2026-10-29T03:59:00.000Z", end: "2026-10-29T10:00:00.000Z" });
    expect(notamWindow("X 2610290359-PERM").end).toBeNull();
    expect(notamWindow("no window")).toBeNull();
    expect(live.airports.LGA[0].windowStart).toBe("2026-10-29T03:59:00.000Z");
  });
  it("flags recurring closures as routine, not one-off overnight ones", () => {
    expect(isRoutineClosure(live.airports.SNA[0], { tz: LA })).toBe(true); // DLY 0630-1315
    expect(isRoutineClosure(live.airports.LGA[0], { tz: NY })).toBe(false); // one-off 23:59-06:00 local
    expect(isRoutineClosure({ type: "closure", reason: "AD AP CLSD NIGHTLY 0400-1000" }, {})).toBe(true);
    expect(isRoutineClosure({ type: "closure", reason: "AD AP CLSD MON-FRI 0400-1000" }, {})).toBe(true);
    const daytime = { type: "closure", reason: "X", windowStart: "2026-10-29T15:00:00.000Z", windowEnd: "2026-10-29T18:00:00.000Z" };
    expect(isRoutineClosure(daytime, { tz: NY })).toBe(false);
    const long = { type: "closure", reason: "X", windowStart: "2026-10-29T03:00:00.000Z", windowEnd: "2026-10-30T12:00:00.000Z" };
    expect(isRoutineClosure(long, { tz: NY })).toBe(false);
    expect(isRoutineClosure({ type: "delay" }, {})).toBe(false);
  });
  it("only applies a notice inside the flight's window or on the flight's day", () => {
    const closure = { type: "closure", windowStart: "2026-10-29T15:00:00.000Z", windowEnd: "2026-10-29T18:00:00.000Z" };
    const now = new Date("2026-10-29T12:00:00Z");
    expect(appliesToFlight(closure, { now, from: new Date("2026-10-29T16:00:00Z"), to: new Date("2026-10-29T17:00:00Z"), tz: NY })).toBe(true);
    expect(appliesToFlight(closure, { now, from: new Date("2026-11-05T16:00:00Z"), to: new Date("2026-11-05T17:00:00Z"), tz: NY })).toBe(false);
    const delay = { type: "delay" };
    expect(appliesToFlight(delay, { now, from: new Date("2026-10-29T20:00:00Z"), to: new Date("2026-10-29T21:00:00Z"), tz: NY })).toBe(true);
    expect(appliesToFlight(delay, { now, from: new Date("2026-11-02T20:00:00Z"), to: new Date("2026-11-02T21:00:00Z"), tz: NY })).toBe(false);
  });
  it("relevantEvents drops routine + out-of-window notices", () => {
    const now = new Date("2026-10-29T08:00:00Z");
    // one-off overnight LGA closure (03:59Z-10:00Z): shown when it overlaps the flight, hidden otherwise
    expect(relevantEvents(live, "LGA", { now, from: new Date("2026-10-29T05:00:00Z"), to: new Date("2026-10-29T06:00:00Z"), tz: NY })).toHaveLength(1);
    expect(relevantEvents(live, "LGA", { now, from: new Date("2026-10-29T14:00:00Z"), to: new Date("2026-10-29T15:00:00Z"), tz: NY })).toEqual([]);
    expect(relevantEvents(live, "SNA", { now, from: new Date("2026-10-29T08:00:00Z"), to: new Date("2026-10-29T09:00:00Z"), tz: LA })).toEqual([]);
  });
});
