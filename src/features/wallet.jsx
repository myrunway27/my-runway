// BoardingPass — App-in-the-Air-style wallet pass card.
// Fixed-width (~300px, flexShrink 0) so it sits nicely in a horizontal scroller.

import React, { useState } from "react";
import { C } from "../theme.js";
import { Icon } from "../components/icons.jsx";

function AirlineLogo({ code, size = 24 }) {
  const [err, setErr] = useState(false);
  const colors = { AA: "#0078D2", UA: "#005DAA", DL: "#C01933", LA: "#E31837", H2: "#FF6B00", BA: "#075AAA", SW: "#304CB2" };
  if (err) {
    return (
      <div style={{ width: size, height: size, borderRadius: 7, background: colors[code] || "#334", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "#fff", fontFamily: C.mono, flexShrink: 0 }}>
        {code}
      </div>
    );
  }
  return (
    <img
      src={`https://airhex.com/images/airline-logos/${code.toLowerCase()}.png`}
      alt={code}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: 7, objectFit: "contain", background: "rgba(255,255,255,0.05)", padding: 2, flexShrink: 0 }}
    />
  );
}

// Deterministic fake QR: 9x9 grid hashed from the flight id (no Math.random).
function FakeQR({ id, size = 72 }) {
  const N = 9, cell = 8, pad = 9, vb = N * cell + pad * 2;
  const str = String(id || "MYRUNWAY");
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) >>> 0;

  const squares = [];
  let x = h || 1;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      x = (x * 1664525 + 1013904223) >>> 0;
      const inFinder = (r < 3 && c < 3) || (r < 3 && c > N - 4) || (r > N - 4 && c < 3);
      if (!inFinder && ((x >>> 13) & 1)) squares.push([c, r]);
    }
  }

  const finder = (fx, fy) => (
    <g key={`f-${fx}-${fy}`}>
      <rect x={pad + fx * cell} y={pad + fy * cell} width={cell * 3} height={cell * 3} fill="#000" />
      <rect x={pad + fx * cell + 6} y={pad + fy * cell + 6} width={cell * 3 - 12} height={cell * 3 - 12} fill="#fff" />
      <rect x={pad + fx * cell + 9} y={pad + fy * cell + 9} width={cell * 3 - 18} height={cell * 3 - 18} fill="#000" />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} style={{ borderRadius: 8, flexShrink: 0, display: "block" }}>
      <rect width={vb} height={vb} fill="#fff" />
      {squares.map(([c, r]) => (
        <rect key={`${c}-${r}`} x={pad + c * cell} y={pad + r * cell} width={cell} height={cell} fill="#000" />
      ))}
      {finder(0, 0)}
      {finder(N - 3, 0)}
      {finder(0, N - 3)}
    </svg>
  );
}

export default function BoardingPass({ flight }) {
  if (!flight.pass) return null;
  const p = flight.pass;

  const caption = { fontSize: 9, fontFamily: C.mono, color: C.muted, letterSpacing: 1, fontWeight: 700, marginBottom: 4 };
  const value = { fontSize: 15, fontFamily: C.mono, fontWeight: 800, color: C.text };

  return (
    <div style={{ width: 300, flexShrink: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", position: "relative" }}>
      {/* Airline color strip */}
      <div style={{ height: 6, background: `linear-gradient(90deg,${C.accent},#007aaa)`, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />

      {/* Header: logo + flight number + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px 8px" }}>
        <AirlineLogo code={flight.code} size={24} />
        <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: C.text, fontFamily: C.mono }}>{flight.iata}</div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono }}>{flight.date}</div>
      </div>

      {/* Route: DEP → ARR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px 14px" }}>
        <div>
          <div style={{ fontSize: 26, fontFamily: C.display, color: C.text, letterSpacing: 2, lineHeight: 1 }}>{flight.dep}</div>
          <div style={{ fontSize: 10, color: C.soft, fontFamily: C.mono, marginTop: 3 }}>{flight.depTime}</div>
        </div>
        <Icon name="plane" size={16} color={C.accent} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontFamily: C.display, color: C.text, letterSpacing: 2, lineHeight: 1 }}>{flight.arr}</div>
          <div style={{ fontSize: 10, color: C.soft, fontFamily: C.mono, marginTop: 3 }}>{flight.arrTime}</div>
        </div>
      </div>

      {/* GATE / SEAT / ZONE / GROUP */}
      <div style={{ display: "flex", padding: "0 16px 16px" }}>
        {[
          ["GATE", p.gate, C.yellow],
          ["SEAT", p.seat, C.text],
          ["ZONE", p.zone, C.text],
          ["GROUP", p.group, C.text],
        ].map(([label, v, color]) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={caption}>{label}</div>
            <div style={{ ...value, color }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Dashed separator with ticket notches */}
      <div style={{ position: "relative", borderTop: `2px dashed ${C.border}` }}>
        <div style={{ position: "absolute", top: -7, left: -6, width: 12, height: 12, borderRadius: 6, background: C.bg }} />
        <div style={{ position: "absolute", top: -7, right: -6, width: 12, height: 12, borderRadius: 6, background: C.bg }} />
      </div>

      {/* QR row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px 16px" }}>
        <FakeQR id={flight.id} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {flight.conf && (
            <div style={{ fontSize: 11, color: C.soft, fontFamily: C.mono, fontWeight: 700, marginBottom: 6 }}>CONF# {flight.conf}</div>
          )}
          <div style={{ fontSize: 9, color: C.muted, fontFamily: C.mono, letterSpacing: 1 }}>SCAN AT GATE · OFFLINE READY</div>
        </div>
      </div>
    </div>
  );
}
