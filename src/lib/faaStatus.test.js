import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseFaaStatus, statusFor, toMinutes, describe as describeEv } from "./faaStatus.js";
import handler from "../../api/faa.js";
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
  });
});
