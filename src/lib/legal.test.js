import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PRIVACY, TERMS, STORED_KEYS } from "./legal.js";

const text = d => d.sections.flatMap(([h, ps]) => [h, ...ps]).join("\n");

describe("legal drafts", () => {
  it("lists exactly the localStorage keys the app actually uses", () => {
    const app = readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
    const used = [...app.matchAll(/usePersistentState\("([^"]+)"/g)].map(m => m[1]).sort();
    expect(STORED_KEYS.map(([k]) => k).sort()).toEqual([...new Set(used)]);
  });
  it("privacy covers the key promises", () => {
    const t = text(PRIVACY);
    for (const re of [/no accounts/i, /don't sell/i, /\/api\/flight/, /FlightAware/, /AeroDataBox/, /AviationStack/, /FAA/, /service worker/i, /Export/, /Delete/]) expect(t).toMatch(re);
  });
  it("terms cover informational-only data and EU261/UK261 not legal advice", () => {
    const t = text(TERMS);
    expect(t).toMatch(/information only/i);
    expect(t).toMatch(/not legal advice/i);
    expect(t).toMatch(/Airlines decide/);
    expect(t).toMatch(/as is/i);
  });
});
