import React from "react";
import { C } from "../theme.js";
import { PASSPORT } from "../data/seed.js";
import { Icon } from "../components/icons.jsx";

// Lifetime flying stats + achievements, with a Pro upsell at the bottom.
export default function PassportScreen({ onOpenPlans }) {
  const p = PASSPORT;
  return (
    <div style={{ padding: "14px 14px 100px" }}>
      {/* Lifetime miles hero */}
      <div style={{ background: "linear-gradient(135deg,rgba(0,200,240,0.1),rgba(255,92,43,0.06))", borderRadius: 20, border: "1px solid rgba(0,200,240,0.2)", padding: "24px 18px", marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: C.soft, fontFamily: C.mono, letterSpacing: 2, marginBottom: 6 }}>LIFETIME MILES</div>
        <div style={{ fontFamily: C.display, fontSize: 58, color: C.accent, letterSpacing: 4, lineHeight: 1, marginBottom: 6 }}>{p.miles.toLocaleString()}</div>
        <div style={{ fontSize: 14, color: C.soft, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>{Math.round(p.miles / 24902)}× around the Earth <Icon name="globe" size={14} color={C.soft} /></div>
      </div>

      {/* 2x2 stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[["plane", "Flights", p.flights], ["building", "Airports", p.airports], ["globe", "Countries", p.countries], ["fire", "Streak", `${p.streak} trips`]].map(([icon, label, val]) => (
          <div key={label} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "18px", textAlign: "center" }}>
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><Icon name={icon} size={28} color={C.soft} /></div>
            <div style={{ fontFamily: C.display, fontSize: 36, color: C.text, lineHeight: 1, marginBottom: 4 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.soft, fontFamily: C.mono, letterSpacing: 1 }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* This year */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "16px", marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 12 }}>2026 SO FAR</div>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, marginBottom: 4 }}>FLIGHTS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.accent, fontFamily: C.mono }}>{p.yr.flights}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, marginBottom: 4 }}>MILES</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.orange, fontFamily: C.mono }}>{p.yr.miles.toLocaleString()}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, marginBottom: 4 }}>TOP AIRLINE</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 4 }}>{p.airline}</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "16px", marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 12 }}>ACHIEVEMENTS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {p.badges.map((b) => (
            <div key={b.label} style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 20, padding: "7px 14px", fontSize: 13, color: C.purple, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={b.icon} size={14} color={C.purple} />
              {b.label}
            </div>
          ))}
          {p.lockedBadges.map((b) => (
            <div key={b.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "7px 14px", fontSize: 13, color: C.muted, opacity: 0.5, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="lock" size={13} color={C.muted} />
              {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Pro upsell */}
      <div style={{ background: "rgba(0,200,240,0.06)", border: "1px solid rgba(0,200,240,0.25)", borderRadius: 20, padding: "20px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}><Icon name="star" size={17} color={C.yellow} />MyRunway Pro</div>
        <div style={{ fontSize: 13, color: C.soft, marginBottom: 14 }}>Unlimited flights, family tracking, delay predictions</div>
        <div onClick={() => onOpenPlans()} style={{ background: `linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius: 13, padding: "14px 0", textAlign: "center", fontWeight: 800, fontSize: 15, color: "#000", cursor: "pointer" }}>See Plans →</div>
      </div>
    </div>
  );
}
