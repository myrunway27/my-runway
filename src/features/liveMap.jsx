// Live route map — Flightradar24-style pure-SVG radar scope for one flight.
// No tiles, no libraries: graticule grid + great-circle-ish bezier + live plane.
import React from "react";
import { C } from "../theme.js";
import { AIRPORTS } from "../data/seed.js";
import { project, sc } from "../lib/utils.js";

// Small filled airliner silhouette (14x14-ish, nose pointing +x, centered on
// 0,0) — translated to the live position and rotated to the route heading.
const PLANE_D =
  "M7 0 L4.9 -0.9 L2.2 -0.9 L-0.9 -6.3 L-2.6 -6.3 L-1.3 -0.9 L-4.3 -0.9 L-5.7 -2.7 L-6.8 -2.7 L-5.9 0 L-6.8 2.7 L-5.7 2.7 L-4.3 0.9 L-1.3 0.9 L-2.6 6.3 L-0.9 6.3 L2.2 0.9 L4.9 0.9 Z";

// Deterministic string hash (stable across renders — no Math.random).
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Quadratic bezier point at t.
function qPoint(p1, cp, p2, t) {
  const u = 1 - t;
  return {
    x: u * u * p1.x + 2 * u * t * cp.x + t * t * p2.x,
    y: u * u * p1.y + 2 * u * t * cp.y + t * t * p2.y,
  };
}

// Quadratic bezier tangent at t (for plane heading).
function qTangent(p1, cp, p2, t) {
  const u = 1 - t;
  return {
    x: 2 * u * (cp.x - p1.x) + 2 * t * (p2.x - cp.x),
    y: 2 * u * (cp.y - p1.y) + 2 * t * (p2.y - cp.y),
  };
}

export default function RouteMap({ flight, height = 230 }) {
  const dep = AIRPORTS[flight.dep];
  const arr = AIRPORTS[flight.arr];
  if (!dep || !arr || dep.lat == null || dep.lon == null || arr.lat == null || arr.lon == null) return null;

  const W = 400;
  const H = height;
  const s = sc(flight.status);

  // ── Bounds: min span 8° so short routes don't over-zoom, then pad 25% ──
  let minLat = Math.min(dep.lat, arr.lat), maxLat = Math.max(dep.lat, arr.lat);
  let minLon = Math.min(dep.lon, arr.lon), maxLon = Math.max(dep.lon, arr.lon);
  if (maxLat - minLat < 8) { const c = (minLat + maxLat) / 2; minLat = c - 4; maxLat = c + 4; }
  if (maxLon - minLon < 8) { const c = (minLon + maxLon) / 2; minLon = c - 4; maxLon = c + 4; }
  const latPad = (maxLat - minLat) * 0.25, lonPad = (maxLon - minLon) * 0.25;
  const bounds = { minLat: minLat - latPad, maxLat: maxLat + latPad, minLon: minLon - lonPad, maxLon: maxLon + lonPad };

  const p1 = project(dep.lat, dep.lon, bounds, W, H);
  const p2 = project(arr.lat, arr.lon, bounds, W, H);

  // ── Route bezier: control point offset perpendicular, arcing upward ──
  const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 1;
  let nx = -dy / dist, ny = dx / dist;
  if (ny > 0) { nx = -nx; ny = -ny; } // arc toward the top of the scope
  const k = dist * 0.2;
  const cp = { x: mx + nx * k, y: my + ny * k };

  const t = Math.max(0, Math.min(1, (flight.progress || 0) / 100));
  const plane = qPoint(p1, cp, p2, t);
  const tan = qTangent(p1, cp, p2, t);
  const headingDeg = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;

  // Flown sub-curve 0..t is itself a quadratic bezier (de Casteljau split).
  const cSub = { x: p1.x + (cp.x - p1.x) * t, y: p1.y + (cp.y - p1.y) * t };
  const fullD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${cp.x.toFixed(1)} ${cp.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  const flownD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${cSub.x.toFixed(1)} ${cSub.y.toFixed(1)} ${plane.x.toFixed(1)} ${plane.y.toFixed(1)}`;

  // ── Other traffic: 8-10 deterministic dots hashed from flight.id + index ──
  const nDots = 8 + (hashStr(flight.id) % 3);
  const dots = [];
  for (let i = 0; i < nDots; i++) {
    const hx = hashStr(`${flight.id}-x-${i}`);
    const hy = hashStr(`${flight.id}-y-${i}`);
    dots.push({ x: 12 + (hx % (W - 24)), y: 12 + (hy % (H - 24)) });
  }

  // ── Graticule lines every ~40px ──
  const vLines = [];
  for (let x = 40; x < W; x += 40) vLines.push(x);
  const hLines = [];
  for (let y = 40; y < H; y += 40) hLines.push(y);

  const clipId = `lm-clip-${flight.id}`;
  const inAir = flight.status === "In Air" || flight.status === "Departed";
  const stripText = inAir
    ? `${Math.round(flight.progress || 0)}% complete`
    : flight.status === "Landed"
    ? `Arrived ${flight.arrTime}`
    : `Departs ${flight.depTime}`;

  const airports = [
    { code: dep.code, city: dep.city, p: p1 },
    { code: arr.code, city: arr.city, p: p2 },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontFamily: C.mono, letterSpacing: 1.5, color: C.muted, marginBottom: 10 }}>
        LIVE ROUTE · {flight.dep} → {flight.arr}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={W} height={H} rx="14" />
          </clipPath>
        </defs>

        {/* Radar scope background */}
        <rect x="0" y="0" width={W} height={H} rx="14" fill={C.surface} />

        <g clipPath={`url(#${clipId})`}>
          {/* Graticule grid */}
          {vLines.map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2={H} stroke={C.border} strokeWidth="0.6" opacity="0.5" />
          ))}
          {hLines.map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2={W} y2={y} stroke={C.border} strokeWidth="0.6" opacity="0.5" />
          ))}

          {/* Other aircraft in the area */}
          {dots.map((d, i) => (
            <circle key={`d${i}`} cx={d.x} cy={d.y} r="2" fill={C.muted} opacity="0.35" />
          ))}

          {/* Full route (dashed) */}
          <path d={fullD} fill="none" stroke={C.border} strokeWidth="1.5" strokeDasharray="5 6" />

          {/* Flown portion: glow + solid */}
          {t > 0 && (
            <>
              <path d={flownD} fill="none" stroke={C.accent} strokeWidth="6" opacity="0.3" strokeLinecap="round" />
              <path d={flownD} fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Airport markers + labels */}
          {airports.map((a) => (
            <g key={a.code}>
              <circle cx={a.p.x} cy={a.p.y} r="5" fill={C.card} stroke={s.c} strokeWidth="2" />
              <text x={a.p.x} y={a.p.y - 12} textAnchor="middle" fontSize="11" fontWeight="800" fontFamily={C.mono} fill={C.text}>
                {a.code}
              </text>
              <text x={a.p.x} y={a.p.y + 17} textAnchor="middle" fontSize="8" fill={C.muted}>
                {a.city}
              </text>
            </g>
          ))}

          {/* Plane: pulsing halo + rotated silhouette */}
          <circle cx={plane.x} cy={plane.y} r="10" fill={s.c} opacity="0.25">
            <animate attributeName="r" values="8;13;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.12;0.25" dur="2s" repeatCount="indefinite" />
          </circle>
          <path
            d={PLANE_D}
            fill="#fff"
            transform={`translate(${plane.x.toFixed(1)} ${plane.y.toFixed(1)}) rotate(${headingDeg.toFixed(1)})`}
          />
        </g>
      </svg>

      {/* Status strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontSize: 11, fontFamily: C.mono, color: C.soft }}>{stripText}</span>
        {flight.status === "In Air" && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(0,232,122,0.1)", border: "1px solid rgba(0,232,122,0.25)", borderRadius: 20, padding: "3px 9px" }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green, display: "inline-block" }} />
            <span style={{ fontSize: 9, fontFamily: C.mono, fontWeight: 700, letterSpacing: 1, color: C.green }}>LIVE</span>
          </span>
        )}
      </div>
    </div>
  );
}
