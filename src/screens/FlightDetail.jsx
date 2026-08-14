import React from "react";
import { C } from "../theme.js";
import { sc } from "../lib/utils.js";
import { FullScreen, StatusPill, Arc, SectionLabel } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { SourceChip } from "../features/dataSource.jsx";
import { AirlineLogo } from "../components/logos.jsx";
import ConnBridge from "../components/ConnBridge.jsx";
import RouteMap from "../features/liveMap.jsx";
import { RiskCard } from "../features/delayRisk.jsx";
import InboundTimeline from "../features/inbound.jsx";
import BoardingPass from "../features/wallet.jsx";

export default function FlightDetail({ flight, onClose, onShare }) {
  const f = flight;
  const s = sc(f.status);
  const isBooking = f.source === "booking";

  // Section entrance stagger — sections render top-down, so each call
  // hands out the next 50ms animation-delay slot (skipped sections skip slots).
  let si = 0;
  const stag = () => ({ animationDelay: `${si++ * 50}ms` });

  const infoCell = (label, value, color) => (
    <div key={label} style={{ flex: 1, minWidth: "27%", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "11px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 9, color: C.muted, fontFamily: C.mono, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: color || C.text, fontFamily: C.mono }}>{value}</div>
    </div>
  );

  const chip = { display: "inline-flex", alignItems: "center", gap: 5, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, fontFamily: C.mono, color: C.soft };

  return (
    <FullScreen
      title={f.iata}
      onBack={onClose}
      right={
        <div onClick={onShare} style={{ background: "rgba(0,200,240,0.07)", border: "1px solid rgba(0,200,240,0.2)", borderRadius: 9, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="link" size={12} color={C.accent} />
          <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>Share</span>
        </div>
      }
    >
      {/* Hero */}
      <div className="mr-in" style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 18, marginBottom: 12, ...stag() }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <AirlineLogo code={f.code} size={34} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{f.airline}</div>
            <div style={{ fontSize: 12, color: C.soft }}>{f.aircraft}{f.tail ? ` · ${f.tail}` : ""} · {f.date}</div>
          </div>
          <StatusPill status={f.status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <div style={{ textAlign: "center", minWidth: 70 }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: C.text, fontFamily: C.mono, lineHeight: 1 }}>{f.dep}</div>
            <div style={{ fontSize: 13, color: C.soft, fontWeight: 600, marginTop: 4 }}>{f.depTime}</div>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Arc progress={f.progress} color={s.c} />
          </div>
          <div style={{ textAlign: "center", minWidth: 70 }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: C.text, fontFamily: C.mono, lineHeight: 1 }}>{f.arr}</div>
            <div style={{ fontSize: 13, color: C.soft, fontWeight: 600, marginTop: 4 }}>{f.arrTime}</div>
          </div>
        </div>
        {/* Data honesty: where these times come from */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <SourceChip tier={isBooking ? "booking" : "est"} />
          {isBooking && (
            <span style={{ fontSize: 9, color: C.muted, fontFamily: C.mono, letterSpacing: 1 }}>TIMES FROM YOUR BOOKING</span>
          )}
        </div>
        {f.status === "In Air" && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <span className="mr-pulse" style={{ background: "rgba(0,200,240,0.1)", border: "1px solid rgba(0,200,240,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: C.accent, fontWeight: 700, fontFamily: C.mono }}>
              ● LIVE · {f.progress}% complete
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {infoCell("GATE", f.gate, f.gate !== "TBD" ? C.yellow : undefined)}
          {infoCell("TERMINAL", f.terminal)}
          {infoCell("SEAT", f.seat || "—")}
        </div>
        {(f.tail || f.carbonKg != null) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
            {f.tail && (
              <span style={chip}>
                <Icon name="plane" size={12} color={C.soft} />
                {f.tail}
              </span>
            )}
            {f.carbonKg != null && (
              <span style={{ ...chip, color: C.green, background: "rgba(0,232,122,0.07)", border: "1px solid rgba(0,232,122,0.2)" }}>
                <Icon name="leaf" size={12} color={C.green} />
                {f.carbonKg} kg CO₂
              </span>
            )}
          </div>
        )}
        {f.conf && (
          <div style={{ marginTop: 8, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.22)", borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
            <span style={{ fontSize: 12, color: C.purple, fontFamily: C.mono, fontWeight: 700 }}>CONFIRMATION {f.conf}</span>
          </div>
        )}
      </div>

      {/* Live route map */}
      <div className="mr-in" style={{ marginBottom: 12, ...stag() }}>
        <RouteMap flight={f} />
      </div>

      {/* Delay forecast */}
      {f.risk && (
        <div className="mr-in" style={{ marginBottom: 12, ...stag() }}>
          <RiskCard flight={f} />
        </div>
      )}

      {/* Where's my plane */}
      {f.inbound && (
        <div className="mr-in" style={{ marginBottom: 12, ...stag() }}>
          <InboundTimeline flight={f} />
        </div>
      )}

      {/* Connection guide */}
      {f.conn && (
        <div className="mr-in" style={{ marginBottom: 12, ...stag() }}>
          <SectionLabel style={{ marginBottom: 10 }}>YOUR CONNECTION AT {f.dep}</SectionLabel>
          <ConnBridge conn={f.conn} />
        </div>
      )}

      {/* Weather at both ends */}
      {f.wx && (
        <div className="mr-in" style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 14, marginBottom: 12, ...stag() }}>
          <SectionLabel style={{ marginBottom: 10 }}>WEATHER ON YOUR ROUTE</SectionLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {[[f.dep, f.wx.dep], [f.arr, f.wx.arr]].map(([code, w]) => (
              <div key={code} style={{ flex: 1, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px" }}>
                <div style={{ fontSize: 11, color: C.soft, fontFamily: C.mono, marginBottom: 6 }}>{code}</div>
                <div style={{ marginBottom: 6 }}>
                  <Icon name={w.icon} size={24} color={C.accent} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{w.temp}° <span style={{ fontSize: 12, color: C.soft, fontWeight: 400 }}>{w.cond}</span></div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="wind" size={11} color={C.muted} style={{ flexShrink: 0 }} />
                  <span>{w.wind}mph · {w.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boarding pass */}
      {f.pass && (
        <div className="mr-in" style={{ marginBottom: 12, ...stag() }}>
          <SectionLabel style={{ marginBottom: 10 }}>BOARDING PASS</SectionLabel>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BoardingPass flight={f} />
          </div>
        </div>
      )}
    </FullScreen>
  );
}
