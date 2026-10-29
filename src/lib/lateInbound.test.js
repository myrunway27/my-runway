import { describe, it, expect } from "vitest";
import { lateInbound, minTurnMins } from "./lateInbound.js";
const dep = new Date("2026-07-02T05:00:00Z");
const at = m => new Date(dep.getTime() + m * 60000).toISOString();

describe("lateInbound", () => {
  it("none without inbound data", () => expect(lateInbound({ inbound: null, ourDep: dep }).level).toBe("none"));
  it("turn time by aircraft", () => { expect(minTurnMins("Boeing 737-800")).toBe(40); expect(minTurnMins("Boeing 777-300ER")).toBe(75); });
  it("ok with plenty of slack", () => {
    const r = lateInbound({ inbound: { estArr: at(-120) }, ourDep: dep, turnMins: 40 });
    expect(r.level).toBe("ok"); expect(r.slackMins).toBe(80);
  });
  it("tight when slack under 15", () => expect(lateInbound({ inbound: { estArr: at(-50) }, ourDep: dep, turnMins: 40 }).level).toBe("tight"));
  it("late when arrival is past departure minus turn", () => {
    const r = lateInbound({ inbound: { ident: "LY 346", origin: "ZRH", estArr: at(-10) }, ourDep: dep, turnMins: 40 });
    expect(r.level).toBe("late"); expect(r.slackMins).toBe(-30); expect(r.message).toMatch(/30 min/);
  });
  it("late when arrival is after departure", () => expect(lateInbound({ inbound: { estArr: at(20) }, ourDep: dep, aircraft: "737" }).level).toBe("late"));
  it("watch without ETA but big delay; ok if small", () => {
    expect(lateInbound({ inbound: { delayMins: 40 }, ourDep: dep }).level).toBe("watch");
    expect(lateInbound({ inbound: { delayMins: 5 }, ourDep: dep }).level).toBe("ok");
  });
  it("landed is ok regardless of ETA", () => expect(lateInbound({ inbound: { status: "Landed", estArr: at(10) }, ourDep: dep }).level).toBe("ok"));
});
