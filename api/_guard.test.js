import { describe, it, expect } from "vitest";
import { createRateLimiter, clientIp, originAllowed, validateFlightQuery } from "./_guard.js";

describe("sliding-window rate limiter", () => {
  it("allows `limit` per window, then 429s with a Retry-After, then recovers", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => t });
    expect([rl.check("a").ok, rl.check("a").ok, rl.check("a").ok]).toEqual([true, true, true]);
    t = 10_000;
    const r = rl.check("a");
    expect(r.ok).toBe(false); expect(r.retryAfterSec).toBe(50);
    expect(rl.check("b").ok).toBe(true); // separate key
    t = 60_001;
    expect(rl.check("a").ok).toBe(true); // window slid
  });
  it("is sliding, not fixed-window", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    rl.check("k"); t = 900; rl.check("k");
    t = 1001; expect(rl.check("k").ok).toBe(true); // first hit expired
    t = 1100; expect(rl.check("k").ok).toBe(false); // 900 and 1001 still in window
  });
  it("bounds memory", () => {
    const rl = createRateLimiter({ limit: 1, maxKeys: 10 });
    for (let i = 0; i < 50; i++) rl.check(`ip${i}`);
    expect(rl.size()).toBeLessThanOrEqual(10);
  });
});

describe("clientIp / originAllowed", () => {
  it("reads the first x-forwarded-for hop", () => {
    expect(clientIp({ headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } })).toBe("1.2.3.4");
    expect(clientIp({ headers: { "x-real-ip": "5.6.7.8" } })).toBe("5.6.7.8");
  });
  it("allows our hosts and localhost, blocks others", () => {
    const ok = o => originAllowed({ headers: { origin: o } });
    expect(ok("https://myrunwayapp.co")).toBe(true);
    expect(ok("https://www.myrunwayapp.co")).toBe(true);
    expect(ok("https://my-runway-runway.vercel.app")).toBe(true);
    expect(ok("https://my-runway-runway-dhsf15pq8-myrunway27-2445s-projects.vercel.app")).toBe(true);
    expect(ok("https://my-runway-runway-git-launch-prep-myrunway27-2445s-projects.vercel.app")).toBe(true);
    expect(ok("https://my-runway-git-x.vercel.app")).toBe(false);
    expect(ok("https://evil.vercel.app")).toBe(false);
    expect(ok("https://my-runway-runway-x-otherteam-projects.vercel.app")).toBe(false);
    expect(ok("http://localhost:5173")).toBe(true);
    expect(ok("https://evil.example")).toBe(false);
    expect(ok("https://myrunwayapp.co.evil.example")).toBe(false);
    expect(originAllowed({ headers: { referer: "https://evil.example/page" } })).toBe(false);
    expect(originAllowed({ headers: { "sec-fetch-site": "cross-site" } })).toBe(false);
    expect(originAllowed({ headers: {} })).toBe(true); // no browser hints: rate limit still applies
  });
});

describe("validateFlightQuery", () => {
  const now = new Date("2026-10-29T15:00:00Z");
  const v = s => validateFlightQuery(new URLSearchParams(s), { now });
  it("accepts a well-formed query within ±3 days", () => {
    expect(v("ident=ly 347&date=2026-10-29")).toMatchObject({ ok: true, ident: "LY347" });
    expect(v("ident=LY347&date=2026-11-01").ok).toBe(true);
    expect(v("ident=LY347&date=2026-10-26").ok).toBe(true);
  });
  it("rejects bad idents, dates, ranges and sched", () => {
    expect(v("ident=../x&date=2026-10-29").error).toBe("bad_ident");
    expect(v("ident=LY34777&date=2026-10-29").error).toBe("bad_ident");
    expect(v("ident=LY347&date=2026-02-31").error).toBe("bad_date");
    expect(v("ident=LY347&date=29-10-2026").error).toBe("bad_date");
    expect(v("ident=LY347&date=2026-11-02").error).toBe("date_out_of_range");
    expect(v("ident=LY347&date=2026-10-25").error).toBe("date_out_of_range");
    expect(v("ident=LY347&date=2026-10-29&sched=2027-01-01T00:00:00Z").error).toBe("bad_sched");
    expect(v("ident=LY347&date=2026-10-29&sched=2026-10-29T08:00:00Z").ok).toBe(true);
  });
});
