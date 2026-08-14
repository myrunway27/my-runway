// InboundTimeline — "where is my actual airplane today" (FlightAware/Flighty style).
// Traces the tail's legs across the day, ending at the user's own flight.

import React from "react";
import { C } from "../theme.js";
import { sc } from "../lib/utils.js";

function dotStyle(status) {
  const base = { width: 10, height: 10, borderRadius: 5, flexShrink: 0 };
  if (status === "Landed") return { ...base, background: C.green };
  if (status === "In Air") return { ...base, background: C.accent, boxShadow: `0 0 10px ${C.accent}` };
  if (status === "This is your flight") return { ...base, background: C.orange };
  // Scheduled → hollow
  return { ...base, background: "transparent", border: `2px solid ${C.border}` };
}

export default function InboundTimeline({ flight }) {
  if (!flight.inbound) return null;
  const legs = flight.inbound;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontFamily: C.mono, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
        YOUR AIRCRAFT TODAY · {flight.tail}
      </div>

      {legs.map((leg, i) => {
        const isLast = i === legs.length - 1;
        const isYou = leg.status === "This is your flight";
        const s = sc(leg.status);
        const lineColor = leg.status === "Landed" ? C.green : C.border;

        return (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            {/* Left rail: status dot + connecting line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 }}>
              <div style={{ ...dotStyle(leg.status), marginTop: isYou ? 13 : 4 }} />
              {!isLast && <div style={{ width: 2, flex: 1, background: lineColor, margin: "4px 0" }} />}
            </div>

            {/* Right: leg details */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 16 }}>
              {isYou ? (
                <div style={{ background: "rgba(255,92,43,0.06)", border: "1px solid rgba(255,92,43,0.2)", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontFamily: C.mono, fontWeight: 800, color: C.orange, letterSpacing: 1.5, marginBottom: 5 }}>
                    THIS IS YOUR FLIGHT
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: C.mono }}>
                    {leg.from} → {leg.to}
                  </div>
                  <div style={{ fontSize: 12, color: C.soft, marginTop: 2 }}>
                    {leg.flight} · {leg.depTime} – {leg.arrTime}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: C.mono }}>
                    {leg.from} → {leg.to}
                  </div>
                  <div style={{ fontSize: 12, color: C.soft, marginTop: 2 }}>
                    {leg.flight} · {leg.depTime} – {leg.arrTime}
                  </div>
                  <div style={{ fontSize: 11, color: s.c, fontFamily: C.mono, fontWeight: 700, marginTop: 3 }}>
                    {leg.status}
                  </div>
                  {leg.status === "In Air" && (
                    <div style={{ height: 3, background: C.surface, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, leg.progress))}%`, background: C.accent, borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
