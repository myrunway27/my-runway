// Delay-risk forecast components — the Flighty-killer feature.
// Predicts delays from inbound aircraft, weather and ATC before airlines announce.
import React from "react";
import { C } from "../theme.js";
import { riskInfo } from "../lib/utils.js";
import { Icon } from "../components/icons.jsx";

// 8px status dot — replaces the old traffic-light glyphs.
function RiskDot({ color }) {
  return <span style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0, display: "inline-block" }} />;
}

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, fontWeight: 700, letterSpacing: 1.5, ...style }}>
      {children}
    </div>
  );
}

// Compact chip — same styling family as the CONF# chip on FlightCard.
export function RiskBadge({ risk }) {
  if (!risk) return null;
  const r = riskInfo(risk.score);
  return (
    <span style={{ background: r.bg, border: `1px solid ${r.br}`, borderRadius: 8, padding: "5px 11px", fontSize: 12, color: r.c, fontWeight: 700, fontFamily: C.mono, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}>
      <RiskDot color={r.c} />
      <span>{r.level} RISK{risk.predictedDelay > 0 && <b style={{ fontWeight: 800 }}> +{risk.predictedDelay}m</b>}</span>
    </span>
  );
}

// Full delay-forecast panel for the flight detail screen.
export function RiskCard({ flight }) {
  const risk = flight && flight.risk;
  if (!risk) return null;
  const r = riskInfo(risk.score);
  const score = Math.max(0, Math.min(100, risk.score));
  const reasons = risk.reasons || [];

  return (
    <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <SectionLabel style={{ marginBottom: 6 }}>DELAY FORECAST</SectionLabel>
          <div style={{ fontFamily: C.display, fontSize: 30, color: r.c, lineHeight: 1, letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 8 }}>
            <RiskDot color={r.c} /> {r.level}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: r.c, fontFamily: C.mono, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: C.mono, letterSpacing: 1 }}>/100 RISK</div>
        </div>
      </div>

      {/* Score meter 0-100 */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, height: 10, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${r.c}55, ${r.c})`, transition: "width 0.4s" }} />
      </div>

      {/* Why */}
      <SectionLabel style={{ marginBottom: 4 }}>WHY</SectionLabel>
      {reasons.map((reason, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < reasons.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <span style={{ width: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={reason.icon} size={18} color={C.soft} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 2 }}>{reason.label}</div>
            <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.45 }}>{reason.detail}</div>
          </div>
        </div>
      ))}

      {/* Prediction banner */}
      {risk.predictedDelay > 0 && (
        <div style={{ background: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.25)", borderRadius: 10, padding: "10px 13px", marginTop: 12, display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="warning" size={16} color={C.yellow} />
          <span style={{ fontSize: 13, color: C.yellow, fontWeight: 700 }}>Prediction: departs ~{risk.predictedDelay} min late</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 1, textAlign: "center", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        PREDICTED BEFORE AIRLINES ANNOUNCE — LIKE FLIGHTY, BUT FREE
      </div>
    </div>
  );
}
