// Live Trip Mode — Moovit-inspired door-to-gate journey, MyRunway's flagship.
// Builds a stage-by-stage rail (home → drive → security → gate → fly → transit
// → fly → landed) from real booking numbers and the live demo clock.
import React from "react";
import { C } from "../theme.js";
import { useApp } from "../store.jsx";
import { Icon } from "../components/icons.jsx";
import { FullScreen } from "../components/ui.jsx";
import { SourceChip } from "./dataSource.jsx";
import { fmtClock, fmtDur, computeLeave, parseClock, fmtTimeOfDay, DRIVE_MIN, TRAFFIC_MIN } from "../lib/utils.js";

// Arrival-side stages are labelled in destination local time, derived from
// the booking arrival rather than the linear demo clock.
function bookingArrivalLabels(f) {
  const tod = parseClock(f.arrTime);
  return tod == null ? null : { start: f.arrTime, end: fmtTimeOfDay(tod + 30) };
}

export default function TripMode({ onClose }) {
  const { flights, now, settings, airports } = useApp();

  const livePill = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,232,122,0.08)", border: "1px solid rgba(0,232,122,0.25)", borderRadius: 20, padding: "4px 10px", flexShrink: 0 }}>
      <div className="mr-pulse" style={{ width: 7, height: 7, borderRadius: 4, background: C.green }} />
      <span style={{ fontSize: 10, fontWeight: 800, fontFamily: C.mono, letterSpacing: 1.5, color: C.green }}>LIVE</span>
    </div>
  );

  // Pick the outbound journey: earliest booked flight (fall back to any
  // upcoming flight), then the connecting flight = next departure after it.
  const sorted = [...flights].sort((a, b) => a.depMin - b.depMin);
  const booked = sorted.filter((f) => f.source === "booking");
  const pool = booked.length ? booked : sorted.filter((f) => f.arrMin > now);
  const f1 = pool[0] || null;
  const f2 = f1 ? pool.find((f) => f.id !== f1.id && f.depMin > f1.depMin) || null : null;

  if (!f1) {
    return (
      <FullScreen title="Live Trip Mode" onBack={onClose} right={livePill}>
        <div className="mr-in" style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="plane" size={30} color={C.muted} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: C.display, marginBottom: 6 }}>No upcoming trip</div>
          <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.6, marginBottom: 22 }}>
            Add a flight and Trip Mode will build your door-to-gate journey around it.
          </div>
          <div onClick={onClose} style={{ display: "inline-block", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 24px", fontSize: 13, fontWeight: 700, color: C.accent, cursor: "pointer" }}>
            Close
          </div>
        </div>
      </FullScreen>
    );
  }

  // ── Build stages from real numbers ─────────────────────────────
  const leave = computeLeave(f1, now);
  const depAirport = airports[f1.dep];
  const sec = depAirport && depAirport.security;

  const stages = [];
  let cursor = leave.leaveAtMin - 10;
  // labels (optional): { start, end } booking-time strings that override the
  // linear demo clock — required wherever the itinerary crosses timezones.
  const push = (title, icon, end, sub, labels) => {
    stages.push({ title, icon, end, sub, start: cursor, startLabel: labels && labels.start, endLabel: labels && labels.end });
    cursor = end;
  };

  push("Leave home", "home", leave.leaveAtMin, settings.homeAddress || "Set your home address in Settings");
  push(`Drive to ${f1.dep}`, "car", leave.leaveAtMin + DRIVE_MIN + TRAFFIC_MIN, `${DRIVE_MIN} min + ${TRAFFIC_MIN} traffic`);
  push("Check-in & security", "security", f1.depMin - 60, sec ? `${sec.checkpoint} · ~${sec.wait} min wait` : "Check-in & security screening");
  push("Walk to gate", "walk", f1.depMin - 35, `Gate ${f1.gate}`);
  push("Boarding", "ticket", f1.depMin, f1.pass ? `${f1.pass.group} · Seat ${f1.seat}` : `Seat ${f1.seat}`);
  push(`Fly to ${f1.arr}`, "plane", f1.arrMin, `${f1.iata} · ${f1.depTime} → ${f1.arrTime}`, { start: f1.depTime, end: f1.arrTime });
  if (f2) {
    push(`Transit at ${f2.dep}`, "walk", f2.depMin - 30, f2.conn ? `${f2.conn.walkMins} min walk · ${f2.conn.security}` : "Transfer to your connecting gate", { start: f1.arrTime });
    push(`Boarding ${f2.iata}`, "ticket", f2.depMin, `Gate ${f2.gate} · Seat ${f2.seat}`, { end: f2.depTime });
    push(`Fly home to ${f2.arr}`, "planeDown", f2.arrMin, `${f2.iata} · ${f2.depTime} → ${f2.arrTime}`, { start: f2.depTime, end: f2.arrTime });
    push("Landed — welcome home", "check", f2.arrMin + 30, `Baggage claim & arrivals · ${f2.arr} local time`, bookingArrivalLabels(f2));
  } else {
    push(`Landed at ${f1.arr}`, "check", f1.arrMin + 30, `Baggage claim & arrivals · ${f1.arr} local time`, bookingArrivalLabels(f1));
  }

  const activeIdx = stages.findIndex((s) => now < s.end);
  const allDone = activeIdx === -1;
  const cur = allDone ? stages[stages.length - 1] : stages[activeIdx];
  const next = !allDone && activeIdx < stages.length - 1 ? stages[activeIdx + 1] : null;
  const heroColor = allDone ? C.green : C.accent;
  const onFill = C.isDark ? "#03131c" : "#ffffff"; // icon color on solid green/accent dots

  return (
    <FullScreen title="Live Trip Mode" onBack={onClose} right={livePill}>
      {/* Hero — current stage */}
      <div className="mr-in" style={{ background: C.card, borderRadius: 20, border: `1px solid ${heroColor}44`, padding: "22px 18px 18px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: `${heroColor}16`, border: `1px solid ${heroColor}3a`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <Icon name={cur.icon} size={34} color={heroColor} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, fontFamily: C.mono, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>
          {allDone ? "JOURNEY COMPLETE" : "CURRENT STAGE"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: C.display, color: C.text, marginBottom: 4 }}>{cur.title}</div>
        {cur.sub && <div style={{ fontSize: 12.5, color: C.soft, marginBottom: 10 }}>{cur.sub}</div>}
        {allDone ? (
          <div style={{ fontSize: 30, fontFamily: C.display, color: C.green, lineHeight: 1 }}>Trip complete</div>
        ) : (
          <div style={{ fontSize: 30, fontFamily: C.display, color: C.orange, lineHeight: 1 }}>{fmtDur(cur.end - now)} left</div>
        )}
        {next && (
          <div style={{ fontSize: 12, color: C.soft, marginTop: 10 }}>
            Next: <b style={{ color: C.text }}>{next.title}</b> · <span style={{ fontFamily: C.mono }}>{next.startLabel || fmtClock(next.start)}</span>
          </div>
        )}
      </div>

      {/* Stage rail — subway-map style */}
      <div style={{ fontSize: 10, fontWeight: 700, fontFamily: C.mono, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>
        DOOR-TO-GATE JOURNEY
      </div>
      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: "16px 14px 8px" }}>
        {stages.map((s, i) => {
          const done = now >= s.end;
          const active = !allDone && i === activeIdx;
          const last = i === stages.length - 1;
          return (
            <div key={i} className="mr-in" style={{ display: "flex", gap: 12, animationDelay: `${i * 40}ms` }}>
              {/* Left rail: dot + connecting line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                <div
                  className={active ? "mr-pulse" : undefined}
                  style={{
                    width: 26, height: 26, borderRadius: 13, flexShrink: 0,
                    background: done ? C.green : active ? C.accent : "transparent",
                    border: done || active ? "none" : `2px solid ${C.border}`,
                    boxShadow: active ? `0 0 14px ${C.accent}99` : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name={done ? "check" : s.icon} size={13} strokeWidth={2.2} color={done || active ? onFill : C.muted} />
                </div>
                {!last && <div style={{ width: 2, flex: 1, minHeight: 16, background: done ? C.green : C.border, margin: "3px 0" }} />}
              </div>
              {/* Right: stage content */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 8 : 14 }}>
                <div style={{ background: active ? `${C.accent}12` : "transparent", border: `1px solid ${active ? `${C.accent}33` : "transparent"}`, borderRadius: 12, padding: active ? "10px 12px" : "2px 0 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: done ? C.muted : C.text, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                    {active && (
                      <span style={{ fontSize: 9, fontWeight: 800, fontFamily: C.mono, letterSpacing: 1, background: C.accent, color: onFill, borderRadius: 5, padding: "2px 6px", flexShrink: 0 }}>NOW</span>
                    )}
                  </div>
                  {s.sub && <div style={{ fontSize: 12, color: done ? C.muted : C.soft, marginTop: 2, lineHeight: 1.45 }}>{s.sub}</div>}
                  <div style={{ fontSize: 11, fontFamily: C.mono, color: C.muted, marginTop: 3 }}>{s.startLabel || fmtClock(s.start)}–{s.endLabel || fmtClock(s.end)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — data honesty */}
      <div className="mr-in" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, padding: "0 4px", animationDelay: `${stages.length * 40}ms` }}>
        <div style={{ flex: 1, fontSize: 11, color: C.muted, fontFamily: C.mono, lineHeight: 1.6 }}>
          Stages update live as your day unfolds — times from your booking.
        </div>
        <SourceChip tier="booking" />
      </div>
    </FullScreen>
  );
}
