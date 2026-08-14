// Logo components for MyRunway. Ported verbatim from the original.
import React, { useState } from "react";
import { C } from "../theme.js";
import { Icon } from "./icons.jsx";

export function AirlineLogo({ code, size = 26 }) {
  const [err, setErr] = useState(false);
  const colors = { AA: "#0078D2", UA: "#005DAA", DL: "#C01933", LA: "#E31837", H2: "#FF6B00", BA: "#075AAA", SW: "#304CB2" };
  if (err) return <div style={{ width: size, height: size, borderRadius: 7, background: colors[code] || "#334", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "#fff", fontFamily: C.mono, flexShrink: 0 }}>{code}</div>;
  return <img src={`https://airhex.com/images/airline-logos/${code.toLowerCase()}.png`} alt={code} onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: 7, objectFit: "contain", background: "rgba(255,255,255,0.05)", padding: 2, flexShrink: 0 }} />;
}

export function NavLogo({ app, size = 28 }) {
  const [err, setErr] = useState(false);
  if (err || app.logo == null) return <Icon name={app.iconName || "map"} size={size * 0.8} color={C.soft} />;
  return <img src={app.logo} alt={app.label} onError={() => setErr(true)} style={{ width: size, height: size, objectFit: "contain", borderRadius: size * 0.2, flexShrink: 0 }} />;
}
