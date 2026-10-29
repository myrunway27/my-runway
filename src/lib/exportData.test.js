import { describe, it, expect } from "vitest";
import { csvCell, toCsv, buildTripsCsv, buildTripsJson } from "./exportData.js";

describe("csv", () => {
  it("leaves plain values alone", () => { expect(csvCell("LY 347")).toBe("LY 347"); expect(csvCell(35)).toBe("35"); expect(csvCell(null)).toBe(""); });
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("Zurich, CH")).toBe('"Zurich, CH"');
    expect(csvCell('the "big" one')).toBe('"the ""big"" one"');
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell("a\r\nb")).toBe('"a\r\nb"');
  });
  it("guards formula injection but keeps negative numbers", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-5")).toBe("-5");
    expect(csvCell("@x,y")).toBe("\"'@x,y\"");
  });
  it("builds header + CRLF rows", () => {
    expect(toCsv([{ a: 1, b: "x,y" }], ["a", "b"])).toBe('a,b\r\n1,"x,y"\r\n');
  });
  it("trip csv includes live overlay", () => {
    const f = { id: "f2", iata: "LY 347", airline: "El Al, Israel", dep: "TLV", arr: "ZRH", depDate: "2026-07-02", depTime: "8:00 AM", arrTime: "11:20 AM" };
    const csv = buildTripsCsv([f], () => ({ status: "Delayed", depDelayMins: 35 }));
    const [head, row] = csv.trim().split("\r\n");
    expect(head.startsWith("id,flight,airline")).toBe(true);
    expect(row).toContain('"El Al, Israel"');
    expect(row).toContain("Delayed,35");
  });
  it("json round-trips", () => {
    const j = JSON.parse(buildTripsJson([{ id: "f1" }], { trip: { name: "T" }, now: new Date("2026-01-01T00:00:00Z") }));
    expect(j.flights[0]).toEqual({ id: "f1", live: null }); expect(j.exportedAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
