// Data-honesty chips — every data block declares where it came from.
// booking = from the user's booking (source of truth), live = live feed,
// est = estimated/modeled, demo = demo snapshot only.
import React from "react";
import { C } from "../theme.js";

export function SourceChip({ tier, style }) {
  const cfg =
    tier === "booking" ? { c: C.green, label: "BOOKING" } :
    tier === "live" ? { c: C.accent, label: "LIVE" } :
    tier === "est" ? { c: C.yellow, label: "EST" } :
    { c: C.muted, label: "DEMO" };
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: C.mono,
        fontSize: 8.5,
        fontWeight: 800,
        letterSpacing: 1,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        color: cfg.c,
        background: cfg.c + "26", // ~15% alpha tint
        border: `1px solid ${cfg.c}66`, // ~40% alpha border
        borderRadius: 4,
        padding: "2px 6px",
        ...style,
      }}
    >
      {cfg.label}
    </span>
  );
}
