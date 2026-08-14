// Shared UI primitives for MyRunway. Ported from the original design language.
import React from "react";
import { C } from "../theme.js";
import { sc } from "../lib/utils.js";

export function StatusPill({ status }) {
  const s = sc(status);
  return <span style={{ background: s.bg, border: `1px solid ${s.br}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, color: s.c, fontWeight: 700, fontFamily: C.mono, whiteSpace: "nowrap" }}>{status}</span>;
}

// Small filled airliner silhouette (14x14-ish, nose pointing +x), centered
// on 0,0 so consumers can translate/rotate it into place.
export const PLANE_PATH_D =
  "M7 0 L4.9 -0.9 L2.2 -0.9 L-0.9 -6.3 L-2.6 -6.3 L-1.3 -0.9 L-4.3 -0.9 L-5.7 -2.7 L-6.8 -2.7 L-5.9 0 L-6.8 2.7 L-5.7 2.7 L-4.3 0.9 L-1.3 0.9 L-2.6 6.3 L-0.9 6.3 L2.2 0.9 L4.9 0.9 Z";

export function Arc({ progress = 0, color = "#00c8f0" }) {
  const w = 200, h = 54, cx = w / 2;
  const pct = progress / 100;
  const px = progress === 0 ? cx : 16 + pct * (w - 32);
  const py = progress === 0 ? h - 28 : h - 10 - Math.sin(pct * Math.PI) * 24;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
      <path d={`M 16 ${h - 8} Q ${cx} ${h - 50} ${w - 16} ${h - 8}`} fill="none" stroke={C.isDark ? "#2a4060" : C.border} strokeWidth="1.5" strokeDasharray="4 5" />
      <circle cx="16" cy={h - 8} r="4" fill={C.card} stroke={color} strokeWidth="2" />
      <circle cx={w - 16} cy={h - 8} r="4" fill={C.card} stroke={color} strokeWidth="2" />
      <circle cx={px} cy={py} r="14" fill={color} opacity="0.25" />
      <circle cx={px} cy={py} r="14" fill="none" stroke={color} strokeWidth="2.5" />
      <path d={PLANE_PATH_D} fill={C.isDark ? "#ffffff" : C.text} transform={`translate(${px} ${py})`} />
    </svg>
  );
}

export function SectionLabel({ children, color, style }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, fontFamily: C.mono, letterSpacing: 2, textTransform: "uppercase", color: color || C.muted, ...style }}>
      {children}
    </div>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 44, height: 26, borderRadius: 13, background: on ? C.accent : "#2a3f5f", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 3, left: on ? 21 : 3, transition: "left 0.2s" }} />
    </div>
  );
}

export function PrimaryBtn({ children, onClick, color1, color2, textColor = "#000", style }) {
  return (
    <div onClick={onClick} style={{ background: `linear-gradient(135deg,${color1 || C.accent},${color2 || "#007aaa"})`, borderRadius: 14, padding: "15px 0", textAlign: "center", fontWeight: 800, fontSize: 15, color: textColor, cursor: "pointer", ...style }}>
      {children}
    </div>
  );
}

export function Sheet({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "20px 20px 48px", border: `1px solid ${C.border}`, maxWidth: 480, margin: "0 auto", width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 18px" }} />
        {children}
      </div>
    </div>
  );
}

export function FullScreen({ title, onBack, children, right }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 55, overflowY: "auto", fontFamily: C.sans }}>
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", position: "sticky", top: 0, zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 480, margin: "0 auto" }}>
          <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 17, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: C.accent, flexShrink: 0 }}>←</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text, flex: 1 }}>{title}</span>
          {right}
        </div>
      </div>
      <div style={{ padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}
