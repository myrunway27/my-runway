// ConnBridge — connection helper card shown between two legs of a trip.
// Urgency tier is derived from conn.buffer; tapping the header expands a
// step-by-step transfer guide. Ported verbatim from the original design.
import React, { useState } from "react";
import { C } from "../theme.js";
import { Icon } from "./icons.jsx";

export default function ConnBridge({ conn }) {
  const [open, setOpen] = useState(false);
  const urgency = conn.buffer > 120
    ? { c: "#00e87a", bg: "rgba(0,232,122,0.07)", br: "rgba(0,232,122,0.25)", icon: "check", label: "Comfortable connection" }
    : conn.buffer > 45
    ? { c: "#ffc800", bg: "rgba(255,200,0,0.07)", br: "rgba(255,200,0,0.25)", icon: "clock", label: "Tight connection" }
    : { c: "#ff3a54", bg: "rgba(255,58,84,0.07)", br: "rgba(255,58,84,0.25)", icon: "siren", label: "Very tight — rush!" };
  return (
    <div style={{ background: urgency.bg, borderRadius: 16, border: `1px solid ${urgency.br}`, overflow: "hidden", marginBottom: 12, marginTop: 2 }}>
      <div onClick={() => setOpen((o) => !o)} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: urgency.c, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}><Icon name={urgency.icon} size={14} color={urgency.c} /> {urgency.label}</div>
          <div style={{ fontSize: 12, color: C.soft }}>{conn.walkMins} min transfer · {conn.buffer} min buffer · {conn.transport}</div>
        </div>
        <span style={{ fontSize: 14, color: C.muted }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${urgency.br}` }}>
          <div style={{ display: "flex", marginBottom: 16, paddingTop: 14 }}>
            {[["LAYOVER", `${Math.floor(conn.layoverMins / 60)}h${conn.layoverMins % 60}m`, C.text], ["WALKING", `${conn.walkMins}m`, C.yellow], ["BUFFER", `${conn.buffer}m`, urgency.c]].map(([l, v, c], i) => (
              <div key={l} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: C.mono, letterSpacing: 1, marginBottom: 5 }}>{l}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: c, fontFamily: C.mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, borderRadius: 12, padding: "14px", marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 1, marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}><Icon name="planeDown" size={11} color={C.muted} /> ARRIVING AT</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{conn.arrTerminal}</div>
                <div style={{ fontSize: 12, color: C.soft }}>Gate: <b style={{ color: C.text, fontFamily: C.mono }}>{conn.arrGate}</b></div>
              </div>
              <div style={{ width: 1, background: C.border }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 1, marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}><Icon name="planeUp" size={11} color={C.muted} /> DEPARTING FROM</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{conn.depTerminal}</div>
                <div style={{ fontSize: 12, color: C.soft }}>Gate: <b style={{ color: C.text, fontFamily: C.mono }}>{conn.depGate}</b></div>
              </div>
            </div>
            <div style={{ background: "rgba(255,200,0,0.08)", borderRadius: 9, padding: "9px 12px", border: "1px solid rgba(255,200,0,0.25)" }}>
              <div style={{ fontSize: 13, color: C.yellow, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Icon name="warning" size={13} color={C.yellow} /> <span style={{ flex: 1 }}>{conn.security}</span></div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 1.5, marginBottom: 10 }}>STEP BY STEP</div>
          {conn.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < conn.steps.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ width: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={s.icon} size={20} color={C.soft} /></span>
              <div style={{ flex: 1, fontSize: 14, color: C.text, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.yellow, fontFamily: C.mono, flexShrink: 0 }}>{s.mins}m</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
