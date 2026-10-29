import { describe, it, expect, beforeEach } from "vitest";
import handler from "./flight.js";

function call(url) {
  return new Promise(resolve => {
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(body) { resolve({ status: this.statusCode, headers: this.headers, body: JSON.parse(body) }); },
    };
    handler({ url, method: "GET", headers: {} }, res);
  });
}

describe("/api/flight proxy", () => {
  beforeEach(() => {
    delete process.env.FLIGHTAWARE_API_KEY; delete process.env.AERODATABOX_RAPIDAPI_KEY; delete process.env.AVIATIONSTACK_API_KEY;
  });
  it("rejects bad input", async () => {
    const r = await call("/api/flight?ident=../../etc&date=2026-07-02");
    expect(r.status).toBe(400);
  });
  it("reports configured:false (not an error) when no keys are set", async () => {
    const r = await call("/api/flight?ident=LY347&date=2026-07-02");
    expect(r.status).toBe(200);
    expect(r.body.configured).toBe(false);
  });
});
