import { describe, it, expect, vi, afterEach } from "vitest";
import { inLiveWindow, fetchLive, verifyFlight } from "./liveData.js";

afterEach(() => vi.unstubAllGlobals());

describe("live window (matches /api/flight ±3 days)", () => {
  const now = new Date("2026-10-29T15:00:00Z");
  it("inLiveWindow", () => {
    expect(inLiveWindow("2026-10-29", now)).toBe(true);
    expect(inLiveWindow("2026-11-01", now)).toBe(true);
    expect(inLiveWindow("2026-10-26", now)).toBe(true);
    expect(inLiveWindow("2026-11-02", now)).toBe(false);
    expect(inLiveWindow("bad", now)).toBe(false);
  });
  it("does not call the API for flights outside the window", async () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    const r = await fetchLive({ iata: "LY 347", depDate: "2026-07-02", depTime: "8:00 AM", arrTime: "11:20 AM", dep: "TLV", arr: "ZRH" }, now);
    expect(r).toMatchObject({ configured: false, outOfWindow: true });
    expect((await verifyFlight("LY 347", "2026-07-02", now)).error).toMatch(/±3 days/);
    expect(f).not.toHaveBeenCalled();
  });
});
