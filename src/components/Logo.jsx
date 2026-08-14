// MyRunway brand mark + lockup.
// LogoMark: winged-propeller emblem (art-deco layered wings, two-blade prop,
// runway centerline beneath). Logo: horizontal lockup with wordmark + tagline.
import React from "react";
import { C } from "../theme.js";

export function LogoMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size * (40 / 64)}
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Art-deco layered wings — 3 feather strokes each side, swept up, progressively shorter */}
      <g stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" fill="none">
        {/* Left wing */}
        <path d="M27.5 17.5 Q17 13.5 5 10.5" />
        <path d="M27.5 21 Q18 18.5 9 16.5" />
        <path d="M27.5 24.5 Q19 23 13 22" />
        {/* Right wing */}
        <path d="M36.5 17.5 Q47 13.5 59 10.5" />
        <path d="M36.5 21 Q46 18.5 55 16.5" />
        <path d="M36.5 24.5 Q45 23 51 22" />
      </g>

      {/* Two-blade vertical propeller — elegant tapered blades */}
      <g stroke={C.orange} strokeWidth="1.6" strokeLinejoin="round" fill="none">
        <path d="M32 17.7 C30.6 14.6 30.7 9 32 4.8 C33.3 9 33.4 14.6 32 17.7 Z" />
        <path d="M32 23.3 C30.6 26.4 30.7 30.8 32 34.2 C33.3 30.8 33.4 26.4 32 23.3 Z" />
      </g>

      {/* Propeller hub */}
      <circle cx="32" cy="20.5" r="2.6" stroke={C.accent} strokeWidth="2" fill="none" />

      {/* Runway centerline dash beneath */}
      <path d="M24 38 H40" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="5 4" opacity="0.75" />
    </svg>
  );
}

export default function Logo({ height = 26, withText = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: height * 0.3, userSelect: "none" }}>
      <LogoMark size={height * 1.55} />
      {withText && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontFamily: C.display, fontSize: height * 0.85, fontWeight: 900, letterSpacing: 4, color: C.accent, lineHeight: 1, whiteSpace: "nowrap" }}>
            MY RUNWAY
          </span>
          {height >= 22 && (
            <span style={{ fontFamily: C.mono, fontSize: 7.5, letterSpacing: 2, color: C.muted, marginTop: 3, whiteSpace: "nowrap" }}>
              KNOW BEFORE YOU GO
            </span>
          )}
        </div>
      )}
    </div>
  );
}
