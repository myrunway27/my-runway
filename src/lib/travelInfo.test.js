import { describe, it, expect } from "vitest";
import { isUsInternationalArrival, searchItems, BRING_ITEMS } from "./travelInfo.js";

describe("travel info", () => {
  it("US international arrival", () => {
    expect(isUsInternationalArrival({ dep: "ZRH", arr: "MIA" })).toBe(true);
    expect(isUsInternationalArrival({ dep: "JFK", arr: "MIA" })).toBe(false);
    expect(isUsInternationalArrival({ dep: "MIA", arr: "TLV" })).toBe(false);
    expect(isUsInternationalArrival({ dep: "ZZZ", arr: "MIA" })).toBe(false);
  });
  it("search", () => {
    expect(searchItems("")).toHaveLength(BRING_ITEMS.length);
    expect(searchItems("power bank")[0].checked).toBe("no");
    expect(searchItems("KNIVES")).toHaveLength(1);
    expect(searchItems("zzzz")).toHaveLength(0);
  });
});
