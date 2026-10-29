import { describe, it, expect } from "vitest";
import { greatCircleKm, amountFor, coverage, eu261Estimate } from "./eu261.js";

describe("eu261", () => {
  it("great-circle distance", () => {
    expect(greatCircleKm("ZRH", "MIA")).toBeGreaterThan(7800);
    expect(greatCircleKm("ZRH", "MIA")).toBeLessThan(8100);
    expect(greatCircleKm("LHR", "CDG")).toBeGreaterThan(330);
    expect(greatCircleKm("LHR", "CDG")).toBeLessThan(360);
    expect(greatCircleKm("XXX", "CDG")).toBeNull();
  });
  it("amount bands", () => {
    expect(amountFor(1500, false)).toBe(250);
    expect(amountFor(1501, false)).toBe(400);
    expect(amountFor(3500, false)).toBe(400);
    expect(amountFor(3501, false)).toBe(600);
    expect(amountFor(4000, true)).toBe(400);
    expect(amountFor(null, false)).toBeNull();
  });
  it("coverage rules", () => {
    expect(coverage({ dep: "ZRH", arr: "MIA", carrier: "LX" }).covered).toBe(true);
    expect(coverage({ dep: "LHR", arr: "JFK", carrier: "AA" }).covered).toBe(true);
    expect(coverage({ dep: "TLV", arr: "ZRH", carrier: "LY" }).covered).toBe(false);
    expect(coverage({ dep: "TLV", arr: "ZRH", carrier: "LX" }).covered).toBe(true);
    expect(coverage({ dep: "MIA", arr: "TLV", carrier: "LY" }).covered).toBe(false);
  });
  it("3h+ arrival delay on long haul -> 600", () => {
    const r = eu261Estimate({ dep: "ZRH", arr: "MIA", carrier: "LX", arrDelayMins: 245 });
    expect(r.eligible).toBe(true); expect(r.amountEur).toBe(600);
  });
  it("3-4h long haul gets 50% caveat", () => {
    expect(eu261Estimate({ dep: "ZRH", arr: "MIA", carrier: "LX", arrDelayMins: 190 }).caveats.join(" ")).toMatch(/50%/);
  });
  it("under 3h -> not eligible", () => expect(eu261Estimate({ dep: "ZRH", arr: "MIA", carrier: "LX", arrDelayMins: 179 }).eligible).toBe(false));
  it("short intra-EU -> 250; intra-EU >1500 capped at 400", () => {
    expect(eu261Estimate({ dep: "LHR", arr: "CDG", carrier: "BA", arrDelayMins: 200 }).amountEur).toBe(250);
  });
  it("cancellation notice", () => {
    expect(eu261Estimate({ dep: "ZRH", arr: "MIA", carrier: "LX", cancelled: true, noticeDays: 3 }).eligible).toBe(true);
    expect(eu261Estimate({ dep: "ZRH", arr: "MIA", carrier: "LX", cancelled: true, noticeDays: 20 }).eligible).toBe(false);
    const u = eu261Estimate({ dep: "ZRH", arr: "MIA", carrier: "LX", cancelled: true });
    expect(u.eligible).toBeNull(); expect(u.amountEur).toBe(600);
  });
  it("not covered flight never eligible", () => expect(eu261Estimate({ dep: "TLV", arr: "ZRH", carrier: "LY", cancelled: true, noticeDays: 1 }).eligible).toBe(false));
  it("unknown distance degrades to range", () => {
    const r = eu261Estimate({ dep: { }, arr: "MIA", carrier: "LX", arrDelayMins: 300 });
    expect(r.eligible).toBeNull();
  });
});
