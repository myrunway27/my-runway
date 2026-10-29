import { describe, it, expect } from "vitest";
import { AIRPORTS, airport, regionOf } from "./airports.js";
import { greatCircleKm } from "./eu261.js";

describe("airports table", () => {
  it("covers ~150+ busy airports with complete fields", () => {
    const list = Object.values(AIRPORTS);
    expect(list.length).toBeGreaterThanOrEqual(150);
    for (const a of list) {
      expect(a.code).toMatch(/^[A-Z]{3}$/);
      expect(typeof a.lat).toBe("number");
      expect(typeof a.lon).toBe("number");
      expect(a.country).toMatch(/^[A-Z]{2}$/);
      expect(a.tz).toMatch(/\//);
      expect(a.name && a.city).toBeTruthy();
    }
  });
  it("tags EU/UK regions", () => {
    expect(regionOf("LHR")).toBe("UK");
    expect(regionOf("MAN")).toBe("UK");
    expect(regionOf("CDG")).toBe("EU");
    expect(regionOf("OSL")).toBe("EEA");
    expect(regionOf("ZRH")).toBe("CH");
    expect(regionOf("JFK")).toBe(null);
    expect(regionOf("XXX")).toBe(null);
  });
  it("has usable coordinates (DXB-LHR ~5500 km)", () => {
    const km = greatCircleKm(airport("DXB"), airport("LHR"));
    expect(km).toBeGreaterThan(5400);
    expect(km).toBeLessThan(5600);
  });
});
