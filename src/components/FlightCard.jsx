// FlightCard — the main flight summary card on the Flights screen.
// Ported from the original, upgraded with a RiskBadge in the chip row and
// a LIVE pill + arc progress while the flight is in the air.
// StatusPill and Arc live in ui.jsx (shared primitives).
import React from "react";
import { C } from "../theme.js";
import { sc } from "../lib/utils.js";
import { AirlineLogo } from "./logos.jsx";
import { Icon } from "./icons.jsx";
import { StatusPill, Arc } from "./ui.jsx";
import { RiskBadge } from "../features/delayRisk.jsx";

export default function FlightCard({ f, onTap }) {
  const s = sc(f.status);
  const live = f.status === "In Air";
  const timeColor = C.isDark ? "#a8c8e8" : C.soft;
  const chip = { background: C.surface, borderRadius: 8, padding: "5px 11px", fontSize: 12, color: C.soft, border: `1px solid ${C.border}` };
  return (
    <div
      onClick={() => onTap(f)}
      style={{ background: C.card, borderRadius: 20, border: `1px solid ${f.status === "Delayed" ? "rgba(255,200,0,0.3)" : f.status === "Gate Change" ? "rgba(167,139,250,0.3)" : C.border}`, padding: 16, marginBottom: 10, cursor: "pointer" }}
    >
      {/* Header: logo · flight ids · (LIVE) · status */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <AirlineLogo code={f.code} size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: C.mono }}>{f.iata}</div>
          <div style={{ fontSize: 12, color: C.soft }}>{f.airline} · {f.aircraft}</div>
        </div>
        {live && (
          <span style={{ fontSize: 9, fontWeight: 800, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 20, padding: "3px 7px", fontFamily: C.mono, letterSpacing: 1.5, whiteSpace: "nowrap" }}>
            ● LIVE
          </span>
        )}
        <StatusPill status={f.status} />
      </div>

      {/* Route arc with live progress */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <div style={{ textAlign: "center", minWidth: 60 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.text, fontFamily: C.mono, lineHeight: 1 }}>{f.dep}</div>
          <div style={{ fontSize: 13, color: timeColor, fontWeight: 600, marginTop: 4 }}>{f.depTime}</div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Arc progress={f.progress} color={s.c} />
        </div>
        <div style={{ textAlign: "center", minWidth: 60 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.text, fontFamily: C.mono, lineHeight: 1 }}>{f.arr}</div>
          <div style={{ fontSize: 13, color: timeColor, fontWeight: 600, marginTop: 4 }}>{f.arrTime}</div>
        </div>
      </div>

      {/* Chips: risk · gate · terminal · conf · date */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: f.wx ? 12 : 0 }}>
        {f.risk && <RiskBadge risk={f.risk} />}
        <span style={chip}>Gate <b style={{ color: C.text, fontFamily: C.mono }}>{f.gate}</b></span>
        <span style={chip}>Terminal <b style={{ color: C.text, fontFamily: C.mono }}>{f.terminal}</b></span>
        {f.conf && <span style={{ background: "rgba(167,139,250,0.1)", borderRadius: 8, padding: "5px 11px", fontSize: 12, color: C.purple, border: "1px solid rgba(167,139,250,0.25)", fontFamily: C.mono }}>CONF# {f.conf}</span>}
        {f.date && <span style={chip}>{f.date}</span>}
      </div>

      {/* Weather strip */}
      {f.wx && (
        <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          {[["dep", f.dep, f.wx.dep], ["arr", f.arr, f.wx.arr]].map(([type, code, w]) => (
            <div key={type} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.surface, borderRadius: 11, padding: "10px 12px", border: `1px solid ${C.border}` }}>
              <Icon name={w.icon} size={20} color={C.soft} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.soft, marginBottom: 2 }}>{code}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{w.temp}° <span style={{ fontSize: 12, color: C.soft, fontWeight: 400 }}>{w.cond}</span></div>
                <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 3 }}><Icon name="wind" size={11} color={C.muted} /> {w.wind}mph</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
