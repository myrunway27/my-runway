import { describe, it, expect, beforeEach } from "vitest";
import handler, { limiter } from "./flight.js";

const NOW = new Date("2026-07-01T12:00:00Z");
function call(url, headers = {}) {
  return new Promise(resolve => {
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(body) { resolve({ status: this.statusCode, headers: this.headers, body: JSON.parse(body) }); },
    };
    handler({ url, method: "GET", headers: { "x-forwarded-for": "203.0.113.9", ...headers } }, res, { now: NOW });
  });
}

describe("/api/flight proxy", () => {
  beforeEach(() => {
    limiter.reset?.();
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
  it("rejects dates outside ±3 days and bad sched", async () => {
    expect((await call("/api/flight?ident=LY347&date=2026-07-09")).body.error).toBe("date_out_of_range");
    expect((await call("/api/flight?ident=LY347&date=2026-07-02&sched=nope")).body.error).toBe("bad_sched");
  });
  it("blocks foreign origins, allows our hosts", async () => {
    expect((await call("/api/flight?ident=LY347&date=2026-07-02", { origin: "https://evil.example" })).status).toBe(403);
    expect((await call("/api/flight?ident=LY347&date=2026-07-02", { referer: "https://myrunwayapp.co/" })).status).toBe(200);
  });
  it("returns 429 with Retry-After after 30/min from one IP", async () => {
    let last;
    for (let i = 0; i < 31; i++) last = await call("/api/flight?ident=LY347&date=2026-07-02", { "x-forwarded-for": "198.51.100.7" });
    expect(last.status).toBe(429);
    expect(Number(last.headers["retry-after"])).toBeGreaterThan(0);
    expect((await call("/api/flight?ident=LY347&date=2026-07-02", { "x-forwarded-for": "198.51.100.8" })).status).toBe(200);
  });
});
