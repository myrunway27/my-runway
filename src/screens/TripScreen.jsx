// Trip tab — the TripIt-killer: one chronological thread of the whole trip.
// Flights, hotels, activities, transfers and notes grouped by day, drawn on
// a subway-map style vertical timeline. Live flight data via useApp().

import React from "react";
import { C } from "../theme.js";
import { useApp } from "../store.jsx";
import { sc, fmtClock, fmtDur } from "../lib/utils.js";
import { Icon } from "../components/icons.jsx";
import { SourceChip } from "../features/dataSource.jsx";
import BoardingPass from "../features/wallet.jsx";

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, fontWeight: 700, letterSpacing: 1.5, ...style }}>
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const s = sc(status);
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.br}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, color: s.c, fontWeight: 700, fontFamily: C.mono, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function dotColorFor(item, flight) {
  if (item.type === "flight") return sc(flight ? flight.status : "").c;
  if (item.type === "hotel") return C.purple;
  if (item.type === "activity") return C.orange;
  if (item.type === "transfer") return C.yellow;
  return C.muted; // note & anything else
}

function TimelineRow({ item, flight, isLast, now, delay, onTapFlight }) {
  const isFlight = item.type === "flight";
  const dot = dotColorFor(item, flight);
  const cardBorder =
    isFlight && flight && flight.status === "Delayed" ? "rgba(255,200,0,0.3)"
    : isFlight && flight && flight.status === "Gate Change" ? "rgba(167,139,250,0.3)"
    : C.border;
  const inAir = isFlight && flight && flight.status === "In Air";
  const upcoming = isFlight && flight && flight.depMin > now;

  return (
    <div className="mr-in" style={{ display: "flex", gap: 12, animationDelay: `${delay}ms` }}>
      {/* Left rail: dot + connecting line */}
      <div style={{ width: 14, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: dot, marginTop: 16, flexShrink: 0 }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: C.border, marginTop: 4, marginBottom: -6 }} />}
      </div>

      {/* Content card */}
      <div
        onClick={isFlight ? () => onTapFlight(item.flightId) : undefined}
        style={{ flex: 1, minWidth: 0, background: C.card, borderRadius: 16, border: `1px solid ${cardBorder}`, padding: "13px 14px", marginBottom: 10, cursor: isFlight ? "pointer" : "default" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Icon name={item.icon} size={18} color={dot} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 3 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.4 }}>{item.sub}</div>
          </div>
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.soft, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {item.timeLabel}
          </span>
        </div>

        {isFlight && flight && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <StatusPill status={flight.status} />
            {inAir ? (
              <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.accent, background: "rgba(0,200,240,0.1)", border: "1px solid rgba(0,200,240,0.25)", borderRadius: 7, padding: "3px 8px", whiteSpace: "nowrap" }}>
                IN AIR · {Math.round(flight.progress)}%
              </span>
            ) : upcoming ? (
              <span style={{ fontFamily: C.mono, fontSize: 11, color: C.soft, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "3px 8px", whiteSpace: "nowrap" }}>
                departs {fmtClock(flight.depMin)}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TripScreen({ onTapFlight }) {
  const { tripItems, flights, now } = useApp();

  const flightById = (id) => flights.find((f) => f.id === id);

  // Group items by dayLabel, preserving trip order.
  const days = [];
  tripItems.forEach((it) => {
    let g = days.find((d) => d.label === it.dayLabel);
    if (!g) { g = { label: it.dayLabel, items: [] }; days.push(g); }
    g.items.push(it);
  });

  // UP NEXT: first flight item whose live flight hasn't departed yet.
  const heroItem =
    tripItems.find((it) => {
      if (it.type !== "flight") return false;
      const f = flightById(it.flightId);
      return f && f.depMin > now;
    }) || tripItems[0];
  const heroFlight = heroItem && heroItem.flightId ? flightById(heroItem.flightId) : null;
  const heroUpcoming = heroFlight && heroFlight.depMin > now;
  const heroBig = heroUpcoming ? `in ${fmtDur(heroFlight.depMin - now)}` : heroItem.timeLabel;
  const heroSub = heroFlight
    ? `Departs ${fmtClock(heroFlight.depMin)} · Gate ${heroFlight.gate}`
    : heroItem.sub;

  // Boarding passes in trip order.
  const passFlights = tripItems
    .filter((it) => it.type === "flight")
    .map((it) => flightById(it.flightId))
    .filter((f) => f && f.pass);

  // Continuous entrance cascade across the whole timeline (top-down render order).
  let gi = 0;

  return (
    <div style={{ padding: "14px 14px 100px" }}>
      {/* UP NEXT hero — live-updates every tick via `now` */}
      <div
        className="mr-pop"
        onClick={heroFlight ? () => onTapFlight(heroFlight.id) : undefined}
        style={{ background: C.card, borderRadius: 20, border: "1px solid rgba(255,92,43,0.25)", padding: 16, marginBottom: 18, cursor: heroFlight ? "pointer" : "default" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: C.orange, fontFamily: C.mono, fontWeight: 800, letterSpacing: 2 }}>UP NEXT</span>
          <div style={{ flex: 1 }} />
          {heroFlight && <SourceChip tier="booking" />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Icon name={heroItem.icon} size={34} color={C.orange} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 3 }}>{heroItem.title}</div>
            <div style={{ fontSize: 12, color: C.soft }}>{heroSub}</div>
          </div>
        </div>
        <div style={{ fontFamily: C.display, fontSize: 34, color: C.orange, letterSpacing: 1, lineHeight: 1, marginTop: 12 }}>{heroBig}</div>
      </div>

      {/* Day-by-day timeline */}
      {days.map((day) => (
        <div key={day.label}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 12px" }}>
            <span style={{ fontSize: 11, color: C.accent, fontFamily: C.mono, fontWeight: 700, letterSpacing: 2 }}>{day.label.toUpperCase()}</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          {day.items.map((item, i) => (
            <TimelineRow
              key={item.id}
              item={item}
              flight={item.flightId ? flightById(item.flightId) : null}
              isLast={i === day.items.length - 1}
              now={now}
              delay={gi++ * 40}
              onTapFlight={onTapFlight}
            />
          ))}
        </div>
      ))}

      {/* Boarding pass wallet */}
      {passFlights.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <SectionLabel style={{ marginBottom: 10 }}>BOARDING PASSES</SectionLabel>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {passFlights.map((f) => (
              <div
                key={f.id}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                style={{ flexShrink: 0, transition: "transform .15s ease" }}
              >
                <BoardingPass flight={f} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="planeUp" size={12} color={C.muted} style={{ flexShrink: 0 }} />
            <span>Passes stored offline — works with no signal</span>
          </div>
        </div>
      )}
    </div>
  );
}
