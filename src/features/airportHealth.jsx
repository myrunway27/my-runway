// Airport health components — live disruption-risk gauge per airport.
import React from "react";
import { C } from "../theme.js";
import { healthInfo } from "../lib/utils.js";
import { Icon } from "../components/icons.jsx";

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, fontWeight: 700, letterSpacing: 1.5, ...style }}>
      {children}
    </div>
  );
}

// SVG circular gauge: arc length proportional to score (0-100).
export function HealthMeter({ score, size = 64 }) {
  const h = healthInfo(score);
  const clamped = Math.max(0, Math.min(100, score));
  const sw = Math.max(5, Math.round(size * 0.09));
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0, overflow: "visible" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.border} strokeWidth={sw} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={h.c} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${(clamped / 100) * circ} ${circ}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx - size * 0.02} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.28} fontWeight="800" fontFamily={C.mono} fill={C.text}>
        {clamped}
      </text>
      <text x={cx} y={cx + size * 0.22} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.12} fontFamily={C.mono} fill={C.muted}>
        /100
      </text>
    </svg>
  );
}

// Card: circular gauge + disruption label + contributing factors.
export function AirportHealthCard({ airport }) {
  const health = airport && airport.health;
  if (!health) return null;
  const h = healthInfo(health.score);
  const factors = health.factors || [];
  const impactColor = { high: C.red, medium: C.yellow, low: C.green };

  return (
    <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <HealthMeter score={health.score} size={64} />
        <div style={{ flex: 1 }}>
          <SectionLabel style={{ marginBottom: 5 }}>DISRUPTION RISK</SectionLabel>
          <div style={{ fontFamily: C.display, fontSize: 26, color: h.c, lineHeight: 1, letterSpacing: 1.5, marginBottom: 4 }}>{h.label}</div>
          <div style={{ fontSize: 12, color: C.soft }}>How {airport.code} is running right now</div>
        </div>
      </div>

      {factors.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 4, borderTop: `1px solid ${C.border}` }}>
          {factors.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i < factors.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ width: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={f.icon} size={17} color={C.soft} /></span>
              <div style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 500 }}>{f.label}</div>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: impactColor[f.impact] || C.muted, flexShrink: 0 }} title={f.impact} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
