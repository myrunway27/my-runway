// Airports tab — Flighty-style "Airport Intelligence" for every trip stop.
// Route summary + per-airport weather hero, 5-day outlook, health card,
// security wait, and departures board. Airport list derives from the
// user's flights (unique dep/arr codes with full data, in order of
// first appearance) — never hardcoded.

import React from "react";
import { C } from "../theme.js";
import { useApp } from "../store.jsx";
import { sc } from "../lib/utils.js";
import { Icon } from "../components/icons.jsx";
import { SourceChip } from "../features/dataSource.jsx";
import { AirportHealthCard } from "../features/airportHealth.jsx";

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 2, ...style }}>
      {children}
    </div>
  );
}

// ── "YOUR ROUTE" summary ──────────────────────────────────────
function RouteSummary({ stops }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "14px 16px", marginBottom: 16 }}>
      <SectionLabel style={{ marginBottom: 12 }}>YOUR ROUTE</SectionLabel>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 8 }}>
        {stops.map((a, i) => {
          const w = a.weather;
          if (!w) return null;
          return (
            <div key={a.code} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Icon name={w.icon} size={28} color={C.accent} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: C.mono, marginTop: 3 }}>{a.code}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{w.temp}°F</div>
              </div>
              {i < stops.length - 1 && (
                <span style={{ display: "flex", padding: "0 8px" }}>
                  <Icon name="chevronRight" size={16} color={C.muted} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weather hero card ─────────────────────────────────────────
function WeatherHero({ weather }) {
  const w = weather;
  return (
    <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <Icon name={w.icon} size={44} color={C.accent} />
        <div>
          <div style={{ fontSize: 44, fontFamily: C.display, color: C.text, lineHeight: 1, marginBottom: 4 }}>{w.temp}°F</div>
          <div style={{ fontSize: 15, color: C.soft }}>{w.cond}</div>
          <div style={{ fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="wind" size={13} color={C.muted} /> {w.wind}mph wind
          </div>
        </div>
      </div>
      <div style={{ background: "rgba(0,232,122,0.08)", borderRadius: 11, padding: "11px 14px", border: "1px solid rgba(0,232,122,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="check" size={16} color={C.green} strokeWidth={2.4} />
        <div style={{ fontSize: 13, color: C.soft }}>{w.note}</div>
      </div>
    </div>
  );
}

// ── 5-day outlook ─────────────────────────────────────────────
function ForecastCard({ forecast }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <SectionLabel>5-DAY OUTLOOK</SectionLabel>
        <SourceChip tier="demo" />
      </div>
      <div style={{ display: "flex" }}>
        {forecast.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 0.5, marginBottom: 7 }}>{d.day}</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
              <Icon name={d.icon} size={22} color={C.soft} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: C.mono }}>{d.hi}°</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, marginTop: 1 }}>{d.lo}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Security wait row card ────────────────────────────────────
function SecurityWaitCard({ security }) {
  const trend =
    security.trend === "rising" ? { icon: "trendUp", c: C.red } :
    security.trend === "falling" ? { icon: "trendDown", c: C.green } :
    { icon: "chevronRight", c: C.muted };
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 13 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.accent}26`, border: `1px solid ${C.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="security" size={21} color={C.accent} />
      </div>
      <div style={{ flex: 1 }}>
        <SectionLabel style={{ letterSpacing: 1.5, marginBottom: 3 }}>SECURITY WAIT</SectionLabel>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: C.mono, lineHeight: 1.2 }}>~{security.wait} min</div>
        <div style={{ fontSize: 12, color: C.soft }}>{security.checkpoint}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <Icon name={trend.icon} size={18} color={trend.c} />
        <SourceChip tier="est" />
      </div>
    </div>
  );
}

// ── Departures board ──────────────────────────────────────────
function DepartureBoard({ board }) {
  const cap = (extra) => ({
    fontSize: 9, color: C.muted, fontFamily: C.mono, letterSpacing: 0.8, ...extra,
  });
  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
      <SectionLabel style={{ marginBottom: 10 }}>DEPARTURES BOARD</SectionLabel>
      <div style={{ background: C.surface, borderRadius: 12, padding: 12 }}>
        {/* Column captions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
          <span style={cap({ width: 62 })}>FLIGHT</span>
          <span style={cap({ flex: 1 })}>DEST</span>
          <span style={cap({ width: 52 })}>TIME</span>
          <span style={cap({ width: 34, textAlign: "center" })}>GATE</span>
          <span style={cap({ width: 62, textAlign: "right" })}>STATUS</span>
        </div>
        {board.map((r, i) => (
          <div key={r.flight} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: i < board.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ width: 62, fontFamily: C.mono, fontWeight: 700, fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{r.flight}</span>
            <span style={{ flex: 1, fontSize: 12, color: C.soft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.dest}</span>
            <span style={{ width: 52, fontFamily: C.mono, fontSize: 12, color: C.text, whiteSpace: "nowrap" }}>{r.time}</span>
            <span style={{ width: 34, textAlign: "center" }}>
              <span style={{ fontFamily: C.mono, fontSize: 11, color: C.soft, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 5px" }}>{r.gate}</span>
            </span>
            <span style={{ width: 62, textAlign: "right", fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: sc(r.status).c, whiteSpace: "nowrap" }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── One airport section ───────────────────────────────────────
function AirportSection({ airport }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header row: big code + name/city */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "0 2px 10px" }}>
        <div style={{ fontFamily: C.display, fontSize: 30, color: C.text, letterSpacing: 2, lineHeight: 1 }}>{airport.code}</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: C.soft, fontWeight: 600 }}>{airport.name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{airport.city}</div>
        </div>
      </div>

      <WeatherHero weather={airport.weather} />

      {airport.forecast5 && <ForecastCard forecast={airport.forecast5} />}

      <div style={{ marginBottom: 12 }}>
        <AirportHealthCard airport={airport} />
      </div>

      {airport.security && <SecurityWaitCard security={airport.security} />}

      <DepartureBoard board={airport.board} />
    </div>
  );
}

export default function AirportsScreen() {
  const { airports, flights } = useApp();

  // Unique dep/arr codes across the user's flights, in order of first
  // appearance, kept only when we hold full airport intelligence for them.
  const codes = [];
  for (const f of flights) {
    for (const code of [f.dep, f.arr]) {
      if (code && !codes.includes(code)) codes.push(code);
    }
  }
  const stops = codes
    .map((code) => airports[code])
    .filter((a) => a && a.weather && a.health && a.board);

  return (
    <div style={{ padding: "14px 14px 100px" }}>
      <RouteSummary stops={stops} />

      {stops.map((a, i) => (
        <div key={a.code} className="mr-in" style={{ animationDelay: `${i * 40}ms` }}>
          <AirportSection airport={a} />
        </div>
      ))}

      {/* Footer note */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "12px 14px", fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 9 }}>
        <Icon name="satellite" size={15} color={C.muted} />
        <span>Boards refresh live in the full app — data shown is a demo snapshot.</span>
      </div>
    </div>
  );
}
