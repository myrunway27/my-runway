import { describe, it, expect } from "vitest";
import { greatCircleKm, amountFor, coverage, eu261Estimate, noticeDaysBetween, fmtComp } from "./eu261.js";

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
    expect(eu261Estimate({ dep: "CDG", arr: "AMS", carrier: "AF", arrDelayMins: 200 }).amountEur).toBe(250);
    expect(eu261Estimate({ dep: "CDG", arr: "TLV", carrier: "AF", arrDelayMins: 200 }).amountEur).toBe(400);
  });
  describe("UK261 (GBP)", () => {
    it("UK departures use GBP bands 220/350/520", () => {
      const s = eu261Estimate({ dep: "LHR", arr: "CDG", carrier: "AF", arrDelayMins: 200 });
      expect(s.scheme).toBe("UK261"); expect(s.currency).toBe("GBP"); expect(s.amount).toBe(220); expect(s.amountEur).toBeNull();
      expect(eu261Estimate({ dep: "LHR", arr: "ATH", carrier: "A3", arrDelayMins: 200 }).amount).toBe(350);
      expect(eu261Estimate({ dep: "LHR", arr: "JFK", carrier: "AA", arrDelayMins: 300 }).amount).toBe(520);
    });
    it("UK carrier into the UK is UK261; non-UK carrier into the UK is not covered", () => {
      const s = eu261Estimate({ dep: "JFK", arr: "LHR", carrier: "BA", arrDelayMins: 300 });
      expect(s.scheme).toBe("UK261"); expect(s.amount).toBe(520);
      expect(eu261Estimate({ dep: "JFK", arr: "LHR", carrier: "AA", arrDelayMins: 300 }).covered).toBe(false);
      expect(eu261Estimate({ dep: "JFK", arr: "LHR", carrier: "AF", arrDelayMins: 300 }).covered).toBe(false);
    });
    it("EU departures on UK carriers stay EU261 in euros; non-UK stays EUR", () => {
      const s = eu261Estimate({ dep: "CDG", arr: "LHR", carrier: "BA", arrDelayMins: 200 });
      expect(s.scheme).toBe("EU261"); expect(s.currency).toBe("EUR"); expect(s.amountEur).toBe(250);
      expect(eu261Estimate({ dep: "JFK", arr: "CDG", carrier: "BA", arrDelayMins: 300 }).covered).toBe(false);
    });
    it("unknown-notice UK cancellation shows a GBP amount, possibly owed", () => {
      const s = eu261Estimate({ dep: "LHR", arr: "JFK", carrier: "BA", cancelled: true });
      expect(s.eligible).toBeNull(); expect(s.amount).toBe(520); expect(s.reasons.join(" ")).toMatch(/Possibly owed/);
    });
  });
  it("noticeDaysBetween + exact 14-day rule", () => {
    expect(noticeDaysBetween("2026-06-18", "2026-07-02")).toBe(14);
    expect(noticeDaysBetween("2026-06-19", "2026-07-02")).toBe(13);
    expect(noticeDaysBetween("bad", "2026-07-02")).toBeNull();
    const d14 = noticeDaysBetween("2026-06-18", "2026-07-02"), d13 = noticeDaysBetween("2026-06-19", "2026-07-02");
    expect(eu261Estimate({ dep: "ZRH", arr: "MIA", carrier: "LX", cancelled: true, noticeDays: d14 }).eligible).toBe(false);
    expect(eu261Estimate({ dep: "ZRH", arr: "MIA", carrier: "LX", cancelled: true, noticeDays: d13 }).eligible).toBe(true);
  });
  it("fmtComp", () => { expect(fmtComp(350, "GBP")).toBe("£350"); expect(fmtComp(400, "EUR")).toBe("€400"); });
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
