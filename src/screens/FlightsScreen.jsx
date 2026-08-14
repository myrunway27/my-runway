// Flights tab — route summary, outbound flights, live leave-by card
// (security wait, nav-app picker, Directions + Trip Mode CTAs), check-in
// helper, collapsible trip-carbon estimate, and user-tracked flights.
// The countdown is real: computeLeave() ticks with the store clock.

import React, { useState } from "react";
import { C } from "../theme.js";
import { useApp } from "../store.jsx";
import { sc, fmtClock, fmtDur, computeLeave, DRIVE_MIN, TRAFFIC_MIN, AIRPORT_BUFFER_MIN } from "../lib/utils.js";
import { Icon } from "../components/icons.jsx";
import { SectionLabel } from "../components/ui.jsx";
import { SourceChip } from "../features/dataSource.jsx";
import FlightCard from "../components/FlightCard.jsx";
import ConnBridge from "../components/ConnBridge.jsx";

function NavLogo({ app, size = 28 }) {
  const [err, setErr] = useState(false);
  if (err || !app.logo) return <Icon name={app.iconName || "map"} size={Math.round(size * 0.8)} color={C.soft} />;
  return <img src={app.logo} alt={app.label} onError={() => setErr(true)} style={{ width: size, height: size, objectFit: "contain", borderRadius: size * 0.2, flexShrink: 0 }} />;
}

export default function FlightsScreen({ onTap, onAdd, onTripMode }) {
  const { flights, now, settings, updateSettings, navApps, airports, removeFlight } = useApp();
  const [showCarbon, setShowCarbon] = useState(false);

  const outbound = flights.filter((f) => f.trip === "outbound");
  const others = flights.filter((f) => f.trip === "other");

  // ── Nav apps: driving (have a logo) vs transit (logo null → icon) ──
  const drivingApps = navApps.filter((a) => a.logo);
  const transitApps = navApps.filter((a) => !a.logo);
  const app = navApps.find((a) => a.id === settings.navId) || navApps[0];
  const appIsTransit = !!app && !app.logo;

  // ── Leave-by: first upcoming outbound flight, real countdown ──
  const leaveFlight = [...outbound].sort((a, b) => a.depMin - b.depMin).find((f) => f.depMin > now);
  let leave = null, lc = null;
  if (leaveFlight) {
    leave = computeLeave(leaveFlight, now);
    const LEAVE_STYLES = {
      later: { c: C.green, bg: "rgba(0,232,122,0.07)", br: "rgba(0,232,122,0.18)", icon: "check", label: "ON TRACK" },
      soon: { c: C.yellow, bg: "rgba(255,200,0,0.07)", br: "rgba(255,200,0,0.18)", icon: "clock", label: "LEAVING SOON" },
      now: { c: C.red, bg: "rgba(255,58,84,0.07)", br: "rgba(255,58,84,0.18)", icon: "siren", label: "LEAVE NOW" },
      go: { c: C.accent, bg: "rgba(0,200,240,0.07)", br: "rgba(0,200,240,0.18)", icon: "luggage", label: "EN ROUTE — you should be on your way" },
    };
    lc = LEAVE_STYLES[leave.phase];
  }
  const pulseTripMode = leave && (leave.phase === "soon" || leave.phase === "now");
  const depApt = leaveFlight ? airports[leaveFlight.dep] : null;
  const sec = depApt && depApt.security;
  const secTrendIcon = sec ? (sec.trend === "rising" ? "trendUp" : sec.trend === "falling" ? "trendDown" : "chevronRight") : null;
  const secTrendColor = sec ? (sec.trend === "rising" ? C.yellow : sec.trend === "falling" ? C.green : C.muted) : null;
  const destName = depApt ? `${depApt.name} (${leaveFlight.dep})` : leaveFlight ? leaveFlight.dep : "the airport";

  // ── Check-in: next upcoming flight that carries booking check-in info ──
  const checkinFlight =
    [...flights].filter((f) => f.checkin).sort((a, b) => a.depMin - b.depMin).find((f) => f.depMin > now) ||
    flights.find((f) => f.checkin);
  const ci = checkinFlight ? checkinFlight.checkin : null;

  // ── Carbon: sum booked legs that carry an estimate ──
  const carbonLegs = flights.filter((f) => typeof f.carbonKg === "number" && f.carbonKg > 0);
  const carbonSum = carbonLegs.reduce((s, f) => s + f.carbonKg, 0);

  function renderFlightGroup(group) {
    return group.map((f, i) => (
      <div key={f.id} className="mr-in" style={{ animationDelay: `${i * 40}ms` }}>
        {f.conn && <ConnBridge conn={f.conn} />}
        <FlightCard f={f} onTap={onTap} />
      </div>
    ));
  }

  const chipRow = (group) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {group.map((f) => {
        const s = sc(f.status);
        return (
          <div key={f.id} onClick={() => onTap(f)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: C.text, fontFamily: C.mono, fontWeight: 700 }}>{f.iata} · {f.dep}–{f.arr}</span>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: s.c, flexShrink: 0 }} />
          </div>
        );
      })}
    </div>
  );

  const navTile = (a) => {
    const active = a.id === settings.navId;
    return (
      <div key={a.id} onClick={() => updateSettings({ navId: a.id })} style={{ flex: 1, background: active ? a.bg : C.surface, border: `2px solid ${active ? a.color : C.border}`, borderRadius: 13, padding: "11px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", transition: "all 0.2s" }}>
        {a.logo ? <NavLogo app={a} size={26} /> : <Icon name={a.iconName} size={26} color={active ? a.color : C.soft} />}
        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: C.mono, color: active ? a.color : C.soft, textAlign: "center" }}>{a.label}</span>
      </div>
    );
  };

  return (
    <div style={{ padding: "14px 14px 100px" }}>
      {/* Route summary — outbound only (this trip has no return booked) */}
      {outbound.length > 0 && (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>OUTBOUND · SEP 2</div>
          {chipRow(outbound)}
          <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
            {[["#00e87a", "On Time"], ["#ffc800", "Delayed"], ["#a78bfa", "Gate Change"], ["#ff3a54", "Cancelled"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: c }} />
                <span style={{ fontSize: 10, color: C.muted, fontFamily: C.mono }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outbound — always expanded */}
      {outbound.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: C.orange, fontFamily: C.mono, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
            OUTBOUND · SEP 2 · {outbound.length} FLIGHT{outbound.length !== 1 ? "S" : ""}
          </div>
          {renderFlightGroup(outbound)}
        </>
      )}

      {/* Leave-by card — real countdown off the store clock */}
      {leaveFlight && (
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${lc.br}`, overflow: "hidden", marginBottom: 14, marginTop: 10 }}>
          <div style={{ background: lc.bg, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${lc.br}` }}>
            <Icon name={lc.icon} size={22} color={lc.c} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: lc.c, letterSpacing: 1.5, fontFamily: C.mono }}>{lc.label}</div>
              <div style={{ fontSize: 13, color: C.soft }}>
                {leave.phase === "go" ? `${leaveFlight.iata} departs at ${leaveFlight.depTime}` : `Leave in ${fmtDur(leave.minsLeft)}`}
              </div>
            </div>
            <span style={{ fontSize: 10, color: lc.c, fontFamily: C.mono, border: `1px solid ${lc.br}`, borderRadius: 5, padding: "3px 8px" }}>LIVE</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, fontFamily: C.mono, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>LEAVE HOME BY</div>
            <div style={{ fontFamily: C.display, fontSize: 64, color: lc.c, lineHeight: 1, letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>{fmtClock(leave.leaveAtMin)}</div>

            {/* Drive / Traffic / Dist / Buffer strip */}
            <div style={{ display: "flex", background: C.surface, borderRadius: 12, overflow: "hidden", marginBottom: 10, border: `1px solid ${C.border}` }}>
              {[
                ["car", "Drive", `${DRIVE_MIN} min`, true],
                ["trafficLight", "Traffic", `+${TRAFFIC_MIN}m`, false],
                ["pin", "Dist", "12 mi", false],
                ["planeUp", "Buffer", `${AIRPORT_BUFFER_MIN / 60}h`, false],
              ].map(([icon, label, val, est], i) => (
                <div key={label} style={{ flex: 1, padding: "11px 0", textAlign: "center", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}><Icon name={icon} size={16} color={C.soft} /></div>
                  <div style={{ fontSize: 9, color: C.muted, fontFamily: C.mono, letterSpacing: 0.8, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: C.mono, color: label === "Traffic" ? C.yellow : C.text }}>{val}</div>
                  {est && <div style={{ display: "flex", justifyContent: "center", marginTop: 3 }}><SourceChip tier="est" style={{ transform: "scale(0.85)" }} /></div>}
                </div>
              ))}
            </div>

            {/* Security wait at the departure airport */}
            {sec && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, background: C.surface, borderRadius: 11, padding: "10px 14px", marginBottom: 14, border: `1px solid ${C.border}` }}>
                <Icon name="security" size={16} color={C.soft} />
                <span style={{ flex: 1, fontSize: 12, color: C.soft }}>Security at {leaveFlight.dep} ~{sec.wait} min · {sec.trend}</span>
                <Icon name={secTrendIcon} size={14} color={secTrendColor} />
                <SourceChip tier="est" />
              </div>
            )}

            {/* From: home address */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, borderRadius: 11, padding: "11px 14px", marginBottom: 14, border: `1px solid ${C.border}` }}>
              <Icon name="home" size={18} color={C.soft} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 1.5, marginBottom: 2 }}>FROM</div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{settings.homeAddress || "Set your home address"}</div>
              </div>
              <span style={{ fontSize: 13, color: C.accent, cursor: "pointer" }}>Change</span>
            </div>

            {/* Nav app picker — driving row + public transit row */}
            {drivingApps.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <SectionLabel style={{ fontSize: 9, letterSpacing: 1.5, marginBottom: 6 }}>Driving</SectionLabel>
                <div style={{ display: "flex", gap: 8 }}>{drivingApps.map(navTile)}</div>
              </div>
            )}
            {transitApps.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <SectionLabel style={{ fontSize: 9, letterSpacing: 1.5, marginBottom: 6 }}>Public transit</SectionLabel>
                <div style={{ display: "flex", gap: 8 }}>{transitApps.map(navTile)}</div>
              </div>
            )}

            {/* CTA row: Directions + Trip Mode */}
            {app && (
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  onClick={() => alert(appIsTransit ? `Opening ${app.label} → transit route to ${destName}` : `Opening ${app.label} → ${destName}`)}
                  style={{ flex: 1, background: `linear-gradient(135deg,${app.color},${app.color}bb)`, borderRadius: 14, padding: "13px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                >
                  <NavLogo app={app} size={20} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#000", textAlign: "center" }}>
                    {appIsTransit ? `Get transit route in ${app.label}` : `Get Directions in ${app.label}`}
                  </span>
                </div>
                <div
                  className={pulseTripMode ? "mr-pulse" : undefined}
                  onClick={onTripMode}
                  style={{ flex: 1, background: `linear-gradient(135deg,${C.orange},#c93a10)`, borderRadius: 14, padding: "13px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                >
                  <Icon name="route" size={17} color="#fff" strokeWidth={2.2} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Trip Mode</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Check-in — always visible for the next flight with booking data */}
      {ci && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel style={{ marginBottom: 10 }}>Check-in</SectionLabel>
          <div className="mr-in" style={{ background: "rgba(0,232,122,0.06)", border: "1px solid rgba(0,232,122,0.2)", borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Icon name="ticket" size={20} color={C.green} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{ci.airline}</div>
                <div style={{ fontSize: 12, color: C.soft }}>{ci.counter}</div>
              </div>
              {ci.open != null && (
                <span style={{ fontSize: 9, fontWeight: 800, fontFamily: C.mono, letterSpacing: 1, whiteSpace: "nowrap", color: ci.open ? C.green : C.muted, border: `1px solid ${ci.open ? "rgba(0,232,122,0.3)" : C.border}`, borderRadius: 5, padding: "3px 7px" }}>
                  {typeof ci.open === "string" ? ci.open.toUpperCase() : ci.open ? "OPEN NOW" : "OPENS LATER"}
                </span>
              )}
            </div>
            {ci.tip && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.22)", borderRadius: 10, padding: "9px 12px", marginBottom: 10 }}>
                <Icon name="warning" size={14} color={C.yellow} />
                <span style={{ flex: 1, fontSize: 12, color: C.soft }}>{ci.tip}</span>
              </div>
            )}
            <div
              onClick={() => alert(`Opening ${checkinFlight.airline} online check-in for ${checkinFlight.iata}`)}
              style={{ textAlign: "center", background: "rgba(0,232,122,0.12)", border: "1px solid rgba(0,232,122,0.3)", borderRadius: 11, padding: "11px 0", fontSize: 13, fontWeight: 800, color: C.green, cursor: "pointer" }}
            >
              Open check-in →
            </div>
          </div>
        </div>
      )}

      {/* Trip carbon — collapsed by default */}
      {carbonLegs.length > 0 && (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 14, overflow: "hidden" }}>
          <div onClick={() => setShowCarbon((o) => !o)} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Icon name="leaf" size={18} color={C.green} />
            <span style={{ flex: 1, fontSize: 11, color: C.muted, fontFamily: C.mono, fontWeight: 700, letterSpacing: 1.5 }}>
              TRIP CARBON · {Math.round(carbonSum)} kg CO₂
            </span>
            <SourceChip tier="est" />
            <Icon name={showCarbon ? "chevronUp" : "chevronDown"} size={16} color={C.soft} />
          </div>
          {showCarbon && (
            <div className="mr-in" style={{ padding: "12px 16px 14px", borderTop: `1px solid ${C.border}` }}>
              {carbonLegs.map((f, i) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < carbonLegs.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: C.text, fontFamily: C.mono, fontWeight: 700 }}>{f.iata} {f.dep}→{f.arr}</span>
                  <span style={{ fontSize: 12, color: C.soft, fontFamily: C.mono }}>{f.carbonKg} kg</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 10, marginBottom: 10 }}>≈ {(carbonSum / 230).toFixed(1)}× a Tel Aviv–London flight</div>
              <span onClick={() => alert("Connecting you to our verified offset partner (demo)")} style={{ fontSize: 12, color: C.green, fontWeight: 700, cursor: "pointer" }}>
                Offset with partner →
              </span>
            </div>
          )}
        </div>
      )}

      {/* Other tracked flights (user-added) */}
      {others.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: C.purple, fontFamily: C.mono, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>OTHER TRACKED FLIGHTS · {others.length}</div>
          {others.map((f, i) => (
            <div key={f.id} className="mr-in" style={{ animationDelay: `${i * 40}ms` }}>
              <FlightCard f={f} onTap={onTap} />
              <div style={{ textAlign: "right", marginTop: -4, marginBottom: 14 }}>
                <span onClick={() => removeFlight(f.id)} style={{ fontSize: 11, color: C.red, fontFamily: C.mono, cursor: "pointer" }}>Remove</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add another flight */}
      <div onClick={onAdd} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.surface, borderRadius: 14, border: `1px dashed ${C.border}`, padding: "15px 0", cursor: "pointer", marginTop: others.length > 0 ? 0 : 6 }}>
        <Icon name="plus" size={16} color={C.soft} strokeWidth={2.4} />
        <span style={{ fontSize: 14, fontWeight: 700, color: C.soft }}>Add another flight</span>
      </div>
    </div>
  );
}
