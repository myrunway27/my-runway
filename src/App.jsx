import { useState, useEffect, useMemo } from "react";
import MyRunwayBadge from "./components/MyRunwayBadge.jsx";
import { airport } from "./lib/airports.js";
import { fmtClock, fmtDay, fmtDuration, diffMinutes, tzLabel } from "./lib/time.js";
import {
  schedule, liveTimes, flightPhase, computeLeaveBy, leaveState as leaveStateOf,
  connectionRisk, RISK_COPY, diffBookingVsLive, checkinWindow, tzOf,
} from "./lib/trip.js";
import { fetchLive, mockLive, verifyFlight, MOCK_SCENARIOS } from "./lib/liveData.js";
import { fetchAirportWeather, fetchWeatherAt } from "./lib/weather.js";
import { buildTripIcs, downloadText } from "./lib/ics.js";
import { lateInbound } from "./lib/lateInbound.js";
import { eu261Estimate, fmtComp, noticeDaysBetween } from "./lib/eu261.js";
import { fetchFaaStatus, statusFor, relevantEvents, describe as describeFaa } from "./lib/faaStatus.js";
import { isUsInternationalArrival, CBP_MPC_URL, TSA_WHAT_CAN_I_BRING_URL, searchItems } from "./lib/travelInfo.js";
import { buildTripsCsv, buildTripsJson, downloadBlob } from "./lib/exportData.js";

// Apple-style system theme: SF font stack, one accent, dark first.
const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SF_DISPLAY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SF_MONO = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";
const DARK = {
  bg:"#000000", surface:"#1c1c1e", card:"rgba(28,28,30,0.72)", border:"rgba(255,255,255,0.09)",
  accent:"#0a84ff", green:"#30d158", yellow:"#ffd60a",
  red:"#ff453a", purple:"#bf5af2", orange:"#ff9f0a",
  text:"#f5f5f7", muted:"#98989f", soft:"#c7c7cc", chip:"rgba(118,118,128,0.24)",
  glass:"rgba(30,30,32,0.72)",
  mono:SF, sans:SF, display:SF_DISPLAY, deco:SF_MONO,
};
const LIGHT = {
  bg:"#f2f2f7", surface:"#ffffff", card:"rgba(255,255,255,0.78)", border:"rgba(60,60,67,0.14)",
  accent:"#0066cc", green:"#1f7a37", yellow:"#946200",
  red:"#c4271d", purple:"#8e3fb8", orange:"#b35900",
  text:"#1c1c1e", muted:"#636366", soft:"#3a3a3c", chip:"rgba(118,118,128,0.14)",
  glass:"rgba(255,255,255,0.72)",
  mono:SF, sans:SF, display:SF_DISPLAY, deco:SF_MONO,
};
let C = DARK;
// Developer panels (data sources, demo controls) only in `vite dev`, or with ?dev=1
const DEV_MODE = import.meta.env.DEV || (typeof location !== "undefined" && new URLSearchParams(location.search).has("dev"));

// ── Booking data: the source of truth. Live data only overlays day-of status. ──
// depDate/arrDate are the LOCAL dates at the departure/arrival airport.
const FLIGHTS = [
  {
    id:"f1", iata:"LY 018", code:"LY", airline:"El Al Israel Airlines",
    dep:"MIA", arr:"TLV", depDate:"2026-06-14", arrDate:"2026-06-15", depTime:"2:30 PM", arrTime:"9:30 AM",
    status:"Scheduled", gate:"TBD", terminal:"TBD",
    aircraft:"Boeing 787-9", date:"Sun Jun 14, 2026", conf:"8ZEH6P", trip:"outbound",
    conn:null,
  },
  {
    id:"f2", iata:"LY 347", code:"LY", airline:"El Al Israel Airlines",
    dep:"TLV", arr:"ZRH", depDate:"2026-07-02", depTime:"8:00 AM", arrTime:"11:20 AM",
    status:"Scheduled", gate:"TBD", terminal:"Terminal 3",
    aircraft:"Boeing 737-800", date:"Thu Jul 2, 2026", conf:"8ZEH6P", trip:"return",
    conn:null,
  },
  {
    id:"f3", iata:"LX 064", code:"LX", airline:"Swiss International Air Lines",
    dep:"ZRH", arr:"MIA", depDate:"2026-07-02", depTime:"1:00 PM", arrTime:"5:25 PM",
    status:"Scheduled", gate:"E26", terminal:"Terminal 2", arrGate:"J18", arrTerminal:"Terminal S",
    aircraft:"Boeing 777-300ER", date:"Thu Jul 2, 2026", conf:"8ZEH6P", trip:"return",
    conn:{
      from:"f2", terminalChange:true,
      arrTerminal:"Arrival gate TBD", depTerminal:"Terminal 2 · Dock E", depGate:"E26",
      transport:"Terminal change at ZRH",
      security:"Transfer security re-screen. TLV→MIA is non-Schengen to non-Schengen, so passport control is often skipped: follow Transit signs, not Exit.",
      steps:[
        { icon:"planeArrive", label:"Arrive ZRH from TLV (11:20 AM)", mins:10 },
        { icon:"lock", label:"Transfer security re-screen (follow Transit)", mins:20 },
        { icon:"walk", label:"Walk to Dock E, Gate E26", mins:15 },
      ],
    },
  },
];
const TRIP = { name:"Israel family trip", range:"Jun 14 – Jul 2, 2026", withKids:true, passengers:6 };

const NAV_APPS = [
  { id:"waze", label:"Waze", color:"#00AFFF", mode:"drive" },
  { id:"google", label:"Google Maps", color:"#4285F4", mode:"drive" },
  { id:"apple", label:"Apple Maps", color:"#6eb5ff", mode:"drive" },
  { id:"google_transit", label:"Google Transit", color:"#34A853", mode:"transit" },
  { id:"citymapper", label:"Citymapper", color:"#00D1B2", mode:"transit" },
  { id:"moovit", label:"Moovit", color:"#FF6D00", mode:"transit" },
];

// Deep links (open the user's chosen app with the airport as destination)
function navUrl(app, ap) {
  const q = encodeURIComponent(ap ? `${ap.name} (${ap.code})` : "airport");
  const ll = ap ? `${ap.lat},${ap.lon}` : "";
  switch (app.id) {
    case "waze": return `https://waze.com/ul?ll=${ll}&navigate=yes`;
    case "apple": return `https://maps.apple.com/?daddr=${ll}&q=${q}`;
    case "google_transit": return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=transit`;
    case "citymapper": return `https://citymapper.com/directions?endcoord=${ll}&endname=${q}`;
    case "moovit": return `https://moovitapp.com/?to=${q}&tll=${ll}`;
    default: return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
  }
}

const EMPLOYEES = [
  { id:1, name:"Sarah Chen", dept:"Sales", avatar:"SC", color:"#00c8f0", flight:"AA 100", dep:"JFK", arr:"LAX", status:"Departed", eta:"11:45 AM", progress:62, gate:"B22", delay:0, phone:"(212) 555-0101", saved:142 },
  { id:2, name:"Marcus Lee", dept:"Eng", avatar:"ML", color:"#00e87a", flight:"DL 456", dep:"ATL", arr:"SFO", status:"On Time", eta:"2:30 PM", progress:0, gate:"D14", delay:0, phone:"(415) 555-0192", saved:78 },
  { id:3, name:"Priya Sharma", dept:"Sales", avatar:"PS", color:"#ffc800", flight:"UA 789", dep:"LAX", arr:"ORD", status:"Delayed", eta:"~5:45 PM", progress:0, gate:"C11", delay:55, phone:"(312) 555-0134" },
  { id:4, name:"Tom Walsh", dept:"Exec", avatar:"TW", color:"#a78bfa", flight:"BA 178", dep:"LHR", arr:"JFK", status:"In Air", eta:"8:00 PM", progress:78, gate:"T7", delay:0, phone:"(646) 555-0177" },
  { id:5, name:"Lisa Park", dept:"HR", avatar:"LP", color:"#ff5c2b", flight:"SW 321", dep:"DAL", arr:"MIA", status:"Cancelled", eta:"—", progress:0, gate:"—", delay:0, phone:"(305) 555-0155", cancelled:true },
  { id:6, name:"James Rivera", dept:"Eng", avatar:"JR", color:"#00e87a", flight:"AA 200", dep:"BOS", arr:"DFW", status:"Landed", eta:"Arrived", progress:100, gate:"B8", delay:0, phone:"(972) 555-0188" },
];

// ── Small persistence helper (settings survive reloads) ──
function usePersistentState(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(`mr:${key}`); return s === null ? initial : JSON.parse(s); } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(`mr:${key}`, JSON.stringify(v)); } catch { /* private mode */ } }, [key, v]);
  return [v, setV];
}

// Status label for a flight given the live overlay (falls back to booking status)
function displayStatus(f, live, phase) {
  if (live?.status === "Cancelled") return "Cancelled";
  if (live?.status === "Diverted") return "Diverted";
  if (phase === "completed") return "Landed";
  if (phase === "in-air") return "In Air";
  const t = liveTimes(f, live);
  if (t.depDelay >= 15) return "Delayed";
  return live?.status && live.status !== "Scheduled" ? live.status : f.status;
}

const REAL_CLOCK = { demo:false, now:() => new Date() };
// Re-render every 15s; the clock decides what "now" is (real or demo replay)
function useNow(clock = REAL_CLOCK) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 15000);
    return () => clearInterval(t);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick drives the refresh
  return useMemo(() => clock.now(), [clock, tick]);
}

function Arc({ progress=0, color="#00c8f0" }) {
  const w=200, h=54, cx=w/2;
  const pct = Math.max(0, Math.min(100, progress))/100;
  const px = progress===0 ? cx : 16 + pct*(w-32);
  const py = progress===0 ? h-28 : h-10 - Math.sin(pct*Math.PI)*24;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible", display:"block", margin:"0 auto", maxWidth:"100%" }}>
      <path d={`M 16 ${h-8} Q ${cx} ${h-50} ${w-16} ${h-8}`} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 5"/>
      <circle cx="16" cy={h-8} r="4" fill="#1c1c1e" stroke={color} strokeWidth="2"/>
      <circle cx={w-16} cy={h-8} r="4" fill="#1c1c1e" stroke={color} strokeWidth="2"/>
      <circle cx={px} cy={py} r="14" fill={color} opacity="0.25"/>
      <circle cx={px} cy={py} r="14" fill="none" stroke={color} strokeWidth="2.5"/>
      {/* line-art plane (no emoji glyphs) */}
      <g transform={`translate(${px-8},${py-8}) scale(0.6667)`}><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#ffffff" transform="rotate(90 12 12)"/></g>
    </svg>
  );
}

const SEV = () => ({ red:C.red, yellow:C.yellow, accent:C.accent, green:C.green });
const tint = (hex, a) => {
  // "#rrggbb" -> rgba()
  const h = hex.replace("#","");
  const n = parseInt(h.length===3 ? h.split("").map(x=>x+x).join("") : h, 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
};

// ── "Updated X min ago" trust signal ──
function agoLabel(iso, now) {
  if (!iso) return null;
  const m = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m/60)}h ago`;
}

function LiveStatusStrip({ liveState, scenario, realNow, hasCancellation }) {
  const anyConfigured = Object.values(liveState).some(s => s?.configured);
  const updatedAt = Object.values(liveState).map(s => s?.updatedAt).filter(Boolean).sort().pop();
  const mock = scenario && scenario !== "off";
  const tone = hasCancellation ? C.red : (anyConfigured || mock) ? C.green : C.soft;
  const title = hasCancellation ? "Action needed on your trip" : mock ? "Live overlay: simulated" : anyConfigured ? "Live data on" : "Showing your booking";
  const sub = mock ? `Demo scenario · ${MOCK_SCENARIOS.find(s=>s.id===scenario)?.label}` :
    anyConfigured ? `Checked ${agoLabel(updatedAt, realNow) || "recently"} · booking times stay the source of truth` :
    "Live status is off (no API key yet). Times, gates and terminals are from your booking.";
  return (
    <div data-testid="live-strip" style={{ display:"flex", alignItems:"center", gap:9, background:tint(tone==="#7a9ab8"?"#7a9ab8":tone, 0.07), borderRadius:12, border:`1px solid ${tint(tone, 0.22)}`, padding:"10px 14px", marginBottom:14 }}>
      <div style={{ position:"relative", width:10, height:10, flexShrink:0 }}><div style={{ position:"absolute", inset:0, borderRadius:5, background:tone, animation:(anyConfigured||mock)?"pulse 2s infinite":"none" }}/></div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:tone }}>{title}</div>
        <div style={{ fontSize:11, color:C.soft, lineHeight:1.4 }}>{sub}</div>
      </div>
      <style>{`@keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:0.4}100%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ── What changed: booking vs live ──
function WhatChangedBanner({ flights, getLive }) {
  const rows = flights.flatMap(f => diffBookingVsLive(f, getLive(f.id)).map(c => ({ ...c, f })));
  if (!rows.length) return null;
  const worst = rows.some(r=>r.severity==="red") ? "red" : rows.some(r=>r.severity==="yellow") ? "yellow" : "accent";
  const col = SEV()[worst];
  return (
    <div data-testid="what-changed" style={{ background:tint(col,0.07), border:`1px solid ${tint(col,0.3)}`, borderRadius:16, padding:"13px 16px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <StatIcon id={worst==="accent"?"refresh":"alert"} color={col} size={18}/>
        <div style={{ fontSize:12, fontWeight:800, color:col, fontFamily:C.mono, letterSpacing:0.6,  }}>WHAT CHANGED SINCE YOU BOOKED</div>
      </div>
      {rows.map((r,i)=>(
        <div key={i} style={{ display:"flex", gap:10, alignItems:"baseline", padding:"6px 0", borderTop:i?`1px solid ${tint(col,0.15)}`:"none" }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.text, fontFamily:C.mono, flexShrink:0, minWidth:52 }}>{r.f.iata}</span>
          <span style={{ fontSize:13, color:SEV()[r.severity]===C.accent?C.text:SEV()[r.severity] }}>{r.text}</span>
        </div>
      ))}
      <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>Your booked times are unchanged in the app; changes show as overlays.</div>
    </div>
  );
}

// ── Connection risk (relaxed / tight / at risk) ──
function ConnectionCard({ inbound, outbound, liveIn, liveOut, withKids }) {
  const [open, setOpen] = useState(false);
  const conn = outbound.conn;
  const r = connectionRisk(inbound, outbound, liveIn, liveOut, { terminalChange: !!conn?.terminalChange, withKids });
  const copy = RISK_COPY[r.level];
  const col = C[copy.color];
  const walk = (conn?.steps||[]).reduce((s,x)=>s+x.mins,0);
  const tzA = tzOf(outbound.dep);
  return (
    <div data-testid="connection-card" style={{ background:tint(col,0.07), borderRadius:16, border:`1px solid ${tint(col,0.28)}`, overflow:"hidden", marginBottom:12, marginTop:2 }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ padding:"13px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600 }}>{outbound.dep}</div>
          <div style={{ fontSize:20, fontWeight:800, color:col, fontFamily:C.mono, lineHeight:1.1 }}>{fmtDuration(r.mins)}</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <span style={{ fontSize:10, fontWeight:800, color:"#000", background:col, borderRadius:20, padding:"2px 9px", fontFamily:C.mono, letterSpacing:0.6,  }}>{copy.label}</span>
            <span style={{ fontSize:12, color:C.soft }}>connection</span>
          </div>
          <div style={{ fontSize:12, color:C.soft }}>{copy.text}</div>
          {r.changed && <div style={{ fontSize:11, color:C.yellow, marginTop:3 }}>Was {fmtDuration(r.scheduledMins)} when booked</div>}
        </div>
        <span style={{ fontSize:12, color:C.muted }}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${tint(col,0.2)}` }}>
          <div style={{ display:"flex", marginBottom:14, paddingTop:14 }}>
            {[["LAYOVER",fmtDuration(r.mins),C.text],["NEED",`${r.mct}m`,C.yellow],["SPARE",`${r.slack}m`,col]].map(([l,v,c],i)=>(
              <div key={l} style={{ flex:1, textAlign:"center", borderRight:i<2?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:5 }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:c, fontFamily:C.mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:C.soft, marginBottom:12, lineHeight:1.5 }}>
            Land {fmtClock(r.arrAt, tzA)} · depart {fmtClock(r.depAt, tzA)} ({tzA.split("/")[1]} time). Minimum we plan for: {r.factors.map(f=>`${f.label.toLowerCase()} ${f.mins}m`).join(" + ")}.
          </div>
          {conn?.steps && <>
            <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>STEP BY STEP · ~{walk} MIN</div>
            {conn.steps.map((s,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<conn.steps.length-1?`1px solid ${C.border}`:"none" }}>
                <span style={{ width:28, display:"flex", justifyContent:"center", flexShrink:0 }}><StatIcon id={s.icon} color={C.soft} size={20}/></span>
                <div style={{ flex:1, fontSize:13, color:C.text, fontWeight:500 }}>{s.label}</div>
                <div style={{ fontSize:13, fontWeight:800, color:C.yellow, fontFamily:C.mono, flexShrink:0 }}>{s.mins}m</div>
              </div>
            ))}
          </>}
          {conn?.security && <div style={{ fontSize:11, color:C.soft, marginTop:10, lineHeight:1.5, display:"flex", gap:7 }}><StatIcon id="security" color={C.orange} size={14}/><span>{conn.security}</span></div>}
        </div>
      )}
    </div>
  );
}

function FlightCard({ f, live, liveMeta, now, onTap, onInfo, extraChips = [] }) {
  const phase = flightPhase(f, live, now);
  const status = displayStatus(f, live, phase);
  const s = sc(status);
  const t = liveTimes(f, live);
  const progress = phase==="completed" ? 100 : phase==="in-air" ? Math.round(100*(now - t.estDep)/(t.estArr - t.estDep)) : 0;
  const gate = live?.depGate || f.gate;
  const terminal = (live?.depTerminal || f.terminal || "TBD").replace(/^Terminal\s*/i,"");
  const gateChanged = live?.depGate && f.gate !== "TBD" && live.depGate !== f.gate;
  const depTz = tzOf(f.dep), arrTz = tzOf(f.arr);
  const dayShift = f.arrDate && f.arrDate !== f.depDate ? "+1" : "";
  const inbound = live?.inbound;
  return (
    <div data-testid={`flight-${f.id}`} className="mr-glass mr-card" style={{ background:C.card, borderRadius:22, border:`1px solid ${status==="Cancelled"?tint(C.red,0.45):C.border}`, padding:16, marginBottom:10, animation:"cardIn 0.5s cubic-bezier(.34,1.4,.64,1)", opacity:phase==="completed"?0.75:1 }}>
      <div onClick={()=>onTap(f)} style={{ cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <AirlineLogo code={f.code} size={30}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, fontFamily:C.mono }}>{f.iata}</div>
            <div style={{ fontSize:12, color:C.soft, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.airline} · {f.aircraft}</div>
          </div>
          <StatusPill status={status}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", marginBottom:14 }}>
          <div style={{ textAlign:"center", minWidth:68 }}>
            <div style={{ fontSize:30, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{f.dep}</div>
            <div style={{ fontSize:13, color:C.soft, fontWeight:600, marginTop:4, textDecoration:t.depDelay>=5?"line-through":"none" }}>{f.depTime}</div>
            {t.depDelay>=5 && status!=="Cancelled" && <div style={{ fontSize:13, color:C.yellow, fontWeight:700 }}>{fmtClock(t.estDep, depTz)}</div>}
          </div>
          <div style={{ flex:1, display:"flex", justifyContent:"center", minWidth:0 }}><Arc progress={progress} color={s.c}/></div>
          <div style={{ textAlign:"center", minWidth:68 }}>
            <div style={{ fontSize:30, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{f.arr}</div>
            <div style={{ fontSize:13, color:C.soft, fontWeight:600, marginTop:4, textDecoration:t.arrDelay>=5?"line-through":"none" }}>{f.arrTime}{dayShift&&<sup style={{ fontSize:9 }}>{dayShift}</sup>}</div>
            {t.arrDelay>=5 && status!=="Cancelled" && <div style={{ fontSize:13, color:C.yellow, fontWeight:700 }}>{fmtClock(t.estArr, arrTz)}</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
          <span style={{ background:gate!=="TBD"?tint(C.accent,0.1):C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:gate!=="TBD"?C.accent:C.soft, border:`1px solid ${gateChanged?C.yellow:gate!=="TBD"?tint(C.accent,0.3):C.border}` }}>Gate <b style={{ color:gateChanged?C.yellow:gate!=="TBD"?C.accent:C.text, fontFamily:C.mono }}>{gate}</b></span>
          <span style={{ background:terminal!=="TBD"?tint(C.accent,0.1):C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:terminal!=="TBD"?C.accent:C.soft, border:`1px solid ${terminal!=="TBD"?tint(C.accent,0.3):C.border}` }}>Terminal <b style={{ color:terminal!=="TBD"?C.accent:C.text, fontFamily:C.mono }}>{terminal}</b></span>
          {f.conf&&<span style={{ background:C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:C.soft, border:`1px solid ${C.border}`, fontFamily:C.mono }}>CONF# {f.conf}</span>}
          {f.date&&<span style={{ background:C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:C.soft, border:`1px solid ${C.border}` }}>{f.date}</span>}
        </div>
      </div>
      {inbound&&(()=>{
        const li = lateInbound({ inbound, ourDep: t.schedDep, aircraft: f.aircraft, knownDelayMins: Math.max(0, t.depDelay) });
        const warn = li.level==="late" || li.level==="watch", tight = li.level==="tight";
        const col = warn ? C.red : tight ? C.yellow : C.soft;
        return (
          <div data-testid={`inbound-${f.id}`} role={warn||tight?"status":undefined} style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
            <StatIcon id="refresh" color={warn?C.red:tight?C.yellow:C.muted} size={16}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, color:warn?C.red:C.muted, fontWeight:warn?700:400, letterSpacing:0.5, marginBottom:2 }}>{warn?"LATE PLANE ALERT":tight?"TIGHT TURNAROUND":"YOUR INCOMING AIRCRAFT"}</div>
              <div style={{ fontSize:12, color:col }}>
                {li.message || `${inbound.ident ? `${inbound.ident} ` : ""}from ${inbound.origin || "origin"} · ${inbound.status || "status unknown"}${li.eta?` · lands ${fmtClock(li.eta, depTz)}`:""}`}
              </div>
            </div>
          </div>
        );
      })()}
      {(()=>{
        const list = [];
        if (t.cancelled || t.arrDelay >= 180) {
          const e = eu261Estimate({ dep:f.dep, arr:f.arr, carrier:f.code, arrDelayMins:t.arrDelay, cancelled:t.cancelled, noticeDays: f.cancelNoticeDate ? noticeDaysBetween(f.cancelNoticeDate, f.depDate) : null });
          if (e.covered && e.eligible !== false) list.push({ id:"comp", icon:"money", tone:C.green, text: e.amount ? `Compensation · up to ${fmtComp(e.amount,e.currency)}` : "Compensation may be owed", data:e });
        }
        if (!t.cancelled && phase !== "completed" && isUsInternationalArrival(f)) list.push({ id:"customs", icon:"door", tone:C.accent, text:"Customs: set up MPC" });
        list.push(...extraChips);
        if (!list.length || !onInfo) return null;
        return (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:12 }}>
            {list.map(c=>(
              <button key={c.id} type="button" className="mr-btn mr-chip" data-testid={`chip-${c.id}-${f.id}`} onClick={()=>onInfo({ kind:c.id, f, data:c.data })} style={{ minHeight:44, display:"inline-flex", alignItems:"center", gap:7, padding:"0 14px", borderRadius:22, border:"none", background:tint(c.tone,0.16), color:c.tone, fontSize:13, fontWeight:600, cursor:"pointer", font:"inherit", fontFamily:C.sans }}>
                <StatIcon id={c.icon} color={c.tone} size={15}/>{c.text}
              </button>
            ))}
          </div>
        );
      })()}
      {DEV_MODE && liveMeta && (
        <div style={{ marginTop:10, paddingTop:8, borderTop:`1px dashed ${C.border}`, fontSize:10, color:C.muted, fontFamily:C.mono, lineHeight:1.6 }}>
          DATA SOURCES · {liveMeta.mock ? "mock scenario" : !liveMeta.configured ? "proxy not configured (booking only)" :
            Object.entries(liveMeta.sources||{}).map(([k,v])=>`${k}: ${v}`).join(" · ") || liveMeta.error || "—"}
        </div>
      )}
    </div>
  );
}

// ── Leave-by countdown (adjusts with delays) ──
const LEAVE_CFG = () => ({
  ok:   { c:C.green, icon:"check", label:"ON TRACK" },
  soon: { c:C.yellow, icon:"clock", label:"LEAVING SOON" },
  now:  { c:C.red, icon:"alert", label:"LEAVE NOW" },
});

function LeaveByCard({ f, live, now, navIdx, homeAddress, stayAddress, prefs, onEdit, warning }) {
  const lb = computeLeaveBy(f, live, prefs);
  const state = leaveStateOf(now, lb);
  if (state === "gone") return null;
  const cfg = LEAVE_CFG()[state];
  const tz = tzOf(f.dep);
  const ap = airport(f.dep);
  const app = NAV_APPS[navIdx] || NAV_APPS[0];
  const mins = diffMinutes(lb.leaveBy, now);
  const atHome = ap?.code === "MIA";
  const from = atHome ? (homeAddress || "Set your home address") : (stayAddress || `Where you're staying near ${ap?.city || f.dep}`);
  const sub = state==="now" ? `Time to go · ${f.iata} departs ${fmtClock(lb.depAt, tz)}` : `Leave in ${fmtDuration(mins)} · ${f.iata} departs ${fmtClock(lb.depAt, tz)}`;
  return (
    <div data-testid="leave-by" style={{ background:C.card, borderRadius:20, border:`1px solid ${tint(cfg.c,0.25)}`, overflow:"hidden", marginBottom:14, marginTop:14 }}>
      <div style={{ background:tint(cfg.c,0.07), padding:"13px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${tint(cfg.c,0.18)}` }}>
        <StatIcon id={cfg.icon} color={cfg.c} size={22}/>
        <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:800, color:cfg.c, letterSpacing:1.5, fontFamily:C.mono }}>{cfg.label}</div><div style={{ fontSize:13, color:C.soft }}>{sub}</div></div>
        <span style={{ fontSize:10, color:C.muted, fontFamily:C.mono }}>{fmtDay(lb.leaveBy, tz).toUpperCase()}</span>
      </div>
      <div style={{ padding:"16px" }}>
        <div style={{ fontSize:11, color:C.muted, letterSpacing:2, fontFamily:C.mono, fontWeight:700, marginBottom:4, textAlign:"center" }}>LEAVE {atHome?"HOME":"FOR "+f.dep} BY</div>
        <div style={{ fontFamily:C.display, fontSize:60, color:cfg.c, lineHeight:1, letterSpacing:2, marginBottom:6, textAlign:"center" }}>{fmtClock(lb.leaveBy, tz)}</div>
        <div style={{ fontSize:11, color:C.muted, textAlign:"center", marginBottom:lb.shiftMins?6:14, fontFamily:C.mono }}>{ap?.city} time ({tzLabel(lb.leaveBy, tz)})</div>
        {warning && <div data-testid="leave-warning" style={{ display:"flex", gap:8, alignItems:"flex-start", background:tint(C.red,0.08), border:`1px solid ${tint(C.red,0.3)}`, borderRadius:10, padding:"9px 12px", marginBottom:12 }}><StatIcon id="alert" color={C.red} size={16}/><span style={{ fontSize:12, color:C.red, lineHeight:1.45 }}>{warning}</span></div>}
        {lb.shiftMins>0 && <div style={{ fontSize:12, color:C.yellow, textAlign:"center", marginBottom:14 }}>Moved {fmtDuration(lb.shiftMins)} later for the delay (was {fmtClock(lb.original, tz)})</div>}
        <div style={{ display:"flex", background:C.surface, borderRadius:12, overflow:"hidden", marginBottom:10, border:`1px solid ${C.border}` }}>
          {[["drive","Drive",`${lb.driveMins}m`,C.accent],["traffic","Traffic",`+${lb.trafficMins}m`,C.yellow],["security","Security",lb.securityMins?`~${lb.securityMins}m`:"—",C.orange],["buffer","Airport",fmtDuration(lb.bufferMins),C.accent]].map(([icon,label,val,col],i)=>(
            <div key={label} style={{ flex:1, padding:"11px 0", textAlign:"center", borderRight:i<3?`1px solid ${C.border}`:"none" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:5, height:20, alignItems:"center" }}><StatIcon id={icon} color={col} size={18}/></div>
              <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:0.8, marginBottom:2 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize:13, fontWeight:700, fontFamily:C.mono, color:col===C.accent?C.text:col }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14, padding:"0 2px" }}>
          <StatIcon id="security" color={C.orange} size={13}/>
          <span style={{ fontSize:11, color:C.soft }}>Security (~{lb.securityMins ?? "?"} min at {f.dep}) is inside your {fmtDuration(lb.bufferMins)} airport buffer</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, background:C.surface, borderRadius:11, padding:"11px 14px", marginBottom:14, border:`1px solid ${C.border}` }}>
          <StatIcon id="home" color={C.accent} size={20}/>
          <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:2 }}>FROM</div><div style={{ fontSize:14, color:C.text, fontWeight:600 }}>{from}</div></div>
          <span onClick={onEdit} style={{ fontSize:13, color:C.accent, cursor:"pointer" }}>Change</span>
        </div>
        <a href={navUrl(app, ap)} target="_blank" rel="noreferrer" style={{ textDecoration:"none", background:`linear-gradient(135deg,${app.color},${app.color}bb)`, borderRadius:14, padding:"15px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:"pointer" }}>
          <NavLogo app={app} size={22}/><span style={{ fontSize:15, fontWeight:800, color:"#000" }}>{app.mode==="transit"?"Transit Route":"Get Directions"} in {app.label}</span>
        </a>
      </div>
    </div>
  );
}

// ── Arrival card: local time + Open-Meteo weather (free, no key) ──
function ArrivalCard({ f, live, now }) {
  const t = liveTimes(f, live);
  const ap = airport(f.arr);
  const tz = tzOf(f.arr);
  const [wx, setWx] = useState(null);
  const [wxState, setWxState] = useState("loading");
  const whenIso = t.estArr.toISOString();
  useEffect(() => {
    let alive = true;
    fetchWeatherAt(f.arr, new Date(whenIso), new Date()).then(w => {
      if (!alive) return;
      setWx(w); setWxState(w ? (w.unavailable ? "far" : "ok") : "error");
    });
    return () => { alive = false; };
  }, [f.arr, whenIso]);
  const cancelled = t.cancelled;
  const belt = live?.baggage;
  const arrGate = live?.arrGate || f.arrGate || "TBD";
  const arrTerminal = (live?.arrTerminal || f.arrTerminal || "TBD").replace(/^Terminal\s*/i,"");
  return (
    <div data-testid="arrival-card" style={{ background:C.card, borderRadius:20, border:`1px solid ${C.border}`, padding:16, marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <StatIcon id="planeArrive" color={C.accent} size={18}/>
        <div style={{ flex:1, fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600 }}>ARRIVING {ap?.city?.toUpperCase()} · {f.iata}</div>
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600 }}>{cancelled?"BOOKED ARRIVAL":t.arrDelay>=5?"ESTIMATED ARRIVAL":"SCHEDULED ARRIVAL"}</div>
          <div style={{ fontFamily:C.display, fontSize:40, color:t.arrDelay>=5&&!cancelled?C.yellow:C.text, lineHeight:1.05 }}>{fmtClock(cancelled?t.schedArr:t.estArr, tz)}</div>
          <div style={{ fontSize:12, color:C.soft }}>{fmtDay(t.schedArr, tz)} · local {tzLabel(t.schedArr, tz)}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600 }}>LOCAL TIME NOW</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:C.mono }}>{fmtClock(now, tz)}</div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12, background:C.surface, borderRadius:12, padding:"10px 12px", border:`1px solid ${C.border}`, marginBottom:10 }}>
        {wxState==="ok" ? <>
          <StatIcon id={wx.icon} color={C.accent} size={30}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{wx.tempF}°F <span style={{ fontSize:12, color:C.soft, fontWeight:400 }}>({Math.round((wx.tempF-32)*5/9)}°C) · {wx.label}</span></div>
            <div style={{ fontSize:11, color:C.muted }}>{wx.windMph} mph wind · at arrival time · Open-Meteo {wx.source==="historical"?"(archived forecast)":"forecast"}</div>
          </div>
        </> : <div style={{ fontSize:12, color:C.muted, padding:"4px 0" }}>{wxState==="loading"?"Loading arrival weather...":wxState==="far"?wx.unavailable:"Weather unavailable right now"}</div>}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {[["TERMINAL",arrTerminal],["GATE",arrGate],["BAG BELT",belt||"—"]].map(([l,v])=>(
          <div key={l} style={{ flex:1, background:C.surface, borderRadius:10, padding:"8px 6px", textAlign:"center", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600 }}>{l}</div>
            <div style={{ fontSize:14, fontWeight:800, color:v==="—"||v==="TBD"?C.soft:C.text, fontFamily:C.mono }}>{v}</div>
          </div>
        ))}
      </div>
      {!belt && <div style={{ fontSize:10, color:C.muted, marginTop:6 }}>Baggage belt appears once live data has it.</div>}
    </div>
  );
}

// ── 24h check-in reminder + calendar export ──
function CheckinCard({ f, now, onCalendar }) {
  const w = checkinWindow(f, now);
  if (w.state === "closed") return null;
  const tz = tzOf(f.dep);
  const open = w.state === "open";
  function remind() {
    const ics = buildTripIcs([f], { now: new Date() });
    downloadText(`check-in-${f.iata.replace(/\s/g,"")}.ics`, ics);
  }
  return (
    <div data-testid="checkin-card" style={{ background:tint(C.accent,0.07), borderRadius:18, border:`1px solid ${tint(C.accent,0.25)}`, padding:16, marginTop:4, marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <StatIcon id="ticket" color={C.accent} size={22}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:C.accent, marginBottom:2 }}>{open?"Check-in is open":`Check-in opens in ${fmtDuration(w.minsToOpen)}`}</div>
          <div style={{ fontSize:12, color:C.soft }}>{f.iata} · {f.dep} → {f.arr} · {open?`closes ${fmtClock(w.closesAt, tz)}`:`${fmtDay(w.opensAt, tz)}, ${fmtClock(w.opensAt, tz)}`}</div>
        </div>
        <div style={{ background:tint(C.accent,0.15), borderRadius:8, padding:"4px 10px", border:`1px solid ${tint(C.accent,0.3)}` }}><span style={{ fontSize:10, color:C.accent, fontFamily:C.mono, fontWeight:700 }}>{w.hours}H RULE</span></div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {open && w.url
          ? <a href={w.url} target="_blank" rel="noreferrer" style={{ flex:1, textDecoration:"none", background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"11px 0", textAlign:"center", cursor:"pointer" }}><span style={{ fontSize:13, fontWeight:800, color:"#000" }}>Check In Now →</span></a>
          : <div onClick={remind} data-testid="remind-btn" style={{ flex:1, background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"11px 0", textAlign:"center", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><StatIcon id="bell" color="#000" size={15}/><span style={{ fontSize:13, fontWeight:800, color:"#000" }}>Remind me (.ics)</span></div>}
        <div onClick={onCalendar} data-testid="calendar-btn" title="Add whole trip to calendar" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"11px 14px", textAlign:"center", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><StatIcon id="calendar" color={C.soft} size={16}/><span style={{ fontSize:12, color:C.soft, fontWeight:700 }}>Trip</span></div>
      </div>
    </div>
  );
}

// ── Flight detail sheet (tap a card) ──
function FlightDetailSheet({ f, live, liveMeta, now, onClose, onAlternates, onEdit }) {
  const changes = diffBookingVsLive(f, live);
  const t = liveTimes(f, live);
  const depTz = tzOf(f.dep);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div data-testid="flight-detail" onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:"20px 16px 40px", border:`1px solid ${C.border}`, maxWidth:480, margin:"0 auto", width:"100%", maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 16px" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <AirlineLogo code={f.code} size={30}/>
          <div style={{ flex:1 }}><div style={{ fontSize:18, fontWeight:800, color:C.text, fontFamily:C.mono }}>{f.iata} · {f.dep} → {f.arr}</div><div style={{ fontSize:12, color:C.soft }}>{f.date} · departs {f.depTime} {airport(f.dep)?.city} time</div></div>
          <div onClick={onClose} style={{ fontSize:18, color:C.muted, cursor:"pointer" }}>✕</div>
        </div>
        <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"12px 14px", marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>BOOKING VS LIVE</div>
          {[["Departure", f.depTime, t.depDelay>=5?fmtClock(t.estDep, depTz):null],["Arrival", f.arrTime, t.arrDelay>=5?fmtClock(t.estArr, tzOf(f.arr)):null],["Gate", f.gate, live?.depGate],["Terminal", f.terminal, live?.depTerminal]].map(([l,b,lv])=>(
            <div key={l} style={{ display:"flex", padding:"6px 0", borderTop:`1px solid ${C.border}`, fontSize:13 }}>
              <span style={{ flex:1, color:C.soft }}>{l}</span>
              <span style={{ width:100, color:C.text, fontFamily:C.mono, textAlign:"right" }}>{b}</span>
              <span style={{ width:100, color:lv&&lv!==b?C.yellow:C.muted, fontFamily:C.mono, textAlign:"right" }}>{lv||"—"}</span>
            </div>
          ))}
          <div style={{ display:"flex", fontSize:9, color:C.muted, fontFamily:C.mono, marginTop:4 }}><span style={{ flex:1 }}/><span style={{ width:100, textAlign:"right" }}>BOOKED</span><span style={{ width:100, textAlign:"right" }}>LIVE</span></div>
          {!changes.length && <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{live?"No changes from your booking.":"No live data yet. Showing your booking."}</div>}
        </div>
        <ArrivalCard f={f} live={live} now={now}/>
        {onEdit && <CancelNoticeField value={f.cancelNoticeDate||""} depDate={f.depDate} onChange={v=>onEdit({ cancelNoticeDate: v || undefined })}/>}
        {t.cancelled && <div onClick={onAlternates} style={{ background:`linear-gradient(135deg,${C.red},#cc0022)`, borderRadius:12, padding:"13px 0", textAlign:"center", color:"#fff", fontWeight:800, cursor:"pointer", marginBottom:12 }}>Find Alternatives →</div>}
        {DEV_MODE && liveMeta && <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono }}>source: {liveMeta.mock?"mock":liveMeta.configured?"proxy":"booking only"}</div>}
      </div>
    </div>
  );
}

/** Optional "cancellation announced" date: makes the EU261/UK261 14-day rule exact. */
function CancelNoticeField({ value, depDate, onChange }) {
  const days = value && depDate ? noticeDaysBetween(value, depDate) : null;
  return (
    <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"12px 14px", marginBottom:12 }}>
      <label htmlFor="cancel-notice" style={{ display:"block" }}>{label("CANCELLATION ANNOUNCED (OPTIONAL)")}</label>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input id="cancel-notice" data-testid="cancel-notice" type="date" value={value} max={depDate} onChange={e=>onChange(e.target.value)} style={{ ...inputStyle(), minHeight:44 }}/>
        {value && <button type="button" className="mr-btn" aria-label="Clear cancellation date" onClick={()=>onChange("")} style={{ ...pillBtn(), flex:"0 0 auto", padding:"0 14px" }}>Clear</button>}
      </div>
      <div style={{ fontSize:12, color:C.soft, marginTop:6, lineHeight:1.4 }}>{days===null ? "Only if the airline cancelled. Used for the 14-day notice rule in compensation estimates." : `${days} day${days===1?"":"s"} before departure: ${days<14?"under 14 days, compensation can apply":"14+ days, no compensation for the cancellation"}.`}</div>
    </div>
  );
}

function DemoClockChip({ clock, now }) {
  if (!clock.demo) return null;
  const tz = clock.tz;
  return (
    <div data-testid="demo-clock" title="The trip dates have passed, so the app replays the travel day on a simulated clock. Turn off in Settings." style={{ display:"flex", alignItems:"center", gap:8, background:tint("#ffc800",0.08), border:`1px solid ${tint("#ffc800",0.3)}`, borderRadius:10, padding:"7px 12px", margin:"10px 16px 0" }}>
      <StatIcon id="clock" color={C.yellow} size={14}/>
      <span style={{ fontSize:10, color:C.yellow, fontFamily:C.mono, letterSpacing:0.6, fontWeight:700 }}>DEMO CLOCK</span>
      <span style={{ fontSize:11, color:C.soft, flex:1 }}>{fmtDay(now, tz)}, {fmtClock(now, tz)} {airport(clock.airport)?.city} · replaying the travel day</span>
    </div>
  );
}

function notify(msg) { window.dispatchEvent(new CustomEvent("mr-toast", { detail: String(msg) })); }

function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const h = e => {
      const id = Math.random();
      setItems(x => [...x, { id, text: e.detail }]);
      setTimeout(() => setItems(x => x.filter(i => i.id !== id)), 3500);
    };
    window.addEventListener("mr-toast", h);
    return () => window.removeEventListener("mr-toast", h);
  }, []);
  return (
    <div style={{ position:"fixed", bottom:92, left:0, right:0, zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", gap:6, pointerEvents:"none" }}>
      {items.map(t => <div key={t.id} data-testid="toast" style={{ background:C.card, border:`1px solid ${C.accent}`, color:C.text, borderRadius:12, padding:"10px 14px", fontSize:13, maxWidth:420, margin:"0 16px", boxShadow:"0 6px 24px rgba(0,0,0,0.5)" }}>{t.text}</div>)}
    </div>
  );
}

function Sheet({ onClose, children, testid, label }) {
  return (
    <div className="mr-scrim" style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div data-testid={testid} role="dialog" aria-modal="true" aria-label={label} className="mr-sheet mr-glass" onClick={e=>e.stopPropagation()} style={{ background:C.glass, borderTopLeftRadius:28, borderTopRightRadius:28, padding:"10px 20px calc(28px + env(safe-area-inset-bottom))", border:`1px solid ${C.border}`, maxWidth:480, margin:"0 auto", width:"100%", maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 18px" }}/>
        {children}
      </div>
    </div>
  );
}

function OverlayPage({ title, sub, onBack, children, testid }) {
  return (
    <div data-testid={testid} style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
      <div style={{ background:C.glass, borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, zIndex:2 }}>
        <div data-testid="back" onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ flex:1 }}><div style={{ fontSize:16, fontWeight:800, color:C.text }}>{title}</div>{sub&&<div style={{ fontSize:12, color:C.soft }}>{sub}</div>}</div>
      </div>
      <div style={{ maxWidth:480, margin:"0 auto" }}>{children}</div>
    </div>
  );
}


// ── Secondary features live behind "More" (progressive disclosure) ──
function SheetTitle({ title, sub, onClose, id }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16 }}>
      <div style={{ flex:1 }}><h2 id={id} style={{ margin:0, fontSize:22, fontWeight:700, color:C.text, letterSpacing:-0.3 }}>{title}</h2>{sub&&<div style={{ fontSize:13, color:C.soft, marginTop:4, lineHeight:1.4 }}>{sub}</div>}</div>
      <button type="button" className="mr-btn" aria-label="Close" onClick={onClose} style={{ width:44, height:44, borderRadius:22, border:"none", background:C.chip, color:C.soft, fontSize:16, cursor:"pointer", flexShrink:0 }}>✕</button>
    </div>
  );
}

function MoreRow({ icon, title, sub, onClick, testid, right }) {
  return (
    <button type="button" className="mr-btn mr-row" data-testid={testid} onClick={onClick} style={{ width:"100%", minHeight:56, display:"flex", alignItems:"center", gap:14, background:"transparent", border:"none", borderTop:`1px solid ${C.border}`, padding:"10px 4px", cursor:"pointer", textAlign:"left", color:C.text, font:"inherit" }}>
      <span style={{ width:32, height:32, borderRadius:9, background:tint(C.accent,0.16), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><StatIcon id={icon} color={C.accent} size={17}/></span>
      <span style={{ flex:1, minWidth:0 }}><span style={{ display:"block", fontSize:15, fontWeight:600 }}>{title}</span>{sub&&<span style={{ display:"block", fontSize:12, color:C.soft, marginTop:2 }}>{sub}</span>}</span>
      {right || <span aria-hidden="true" style={{ color:C.muted, fontSize:18 }}>›</span>}
    </button>
  );
}

function MoreSheet({ onClose, tools, onExport, onOpen }) {
  return (
    <Sheet onClose={onClose} testid="more-sheet" label="More">
      <SheetTitle id="more-title" title="More" sub="Tools and trip utilities" onClose={onClose}/>
      {tools.map(([id,icon,text,fn])=><MoreRow key={id} testid={`tool-${id}`} icon={icon} title={text} onClick={()=>{ onClose(); fn(); }}/>)}
      <MoreRow testid="more-faa" icon="radar" title="US airport delays" sub="FAA ground stops, delays and closures" onClick={()=>onOpen("faa")}/>
      <MoreRow testid="more-bring" icon="bag" title="Can I bring this?" sub="Carry-on and checked bag rules" onClick={()=>onOpen("bring")}/>
      <div style={{ fontSize:12, fontWeight:600, color:C.muted, letterSpacing:0.4, margin:"22px 4px 6px" }}>YOUR DATA</div>
      <div style={{ display:"flex", gap:10 }}>
        <button type="button" className="mr-btn" data-testid="export-json" onClick={()=>onExport("json")} style={pillBtn()}>Export JSON</button>
        <button type="button" className="mr-btn" data-testid="export-csv" onClick={()=>onExport("csv")} style={pillBtn()}>Export CSV</button>
      </div>
      <div style={{ fontSize:12, color:C.muted, margin:"8px 4px 0", lineHeight:1.4 }}>Downloads your flights, settings and any live status to this device. Nothing is uploaded.</div>
    </Sheet>
  );
}
function CompensationSheet({ f, data, onClose }) {
  const e = data;
  return (
    <Sheet onClose={onClose} testid="sheet-comp" label={`${e.scheme||"EU261"} compensation estimate`}>
      <SheetTitle title="Compensation estimate" sub={`${f.iata} · ${f.dep} → ${f.arr}${e.km?` · ${e.km.toLocaleString()} km`:""}`} onClose={onClose}/>
      <div style={{ textAlign:"center", padding:"8px 0 18px" }}>
        <div style={{ fontSize:13, color:C.soft, marginBottom:4 }}>{e.eligible ? "Likely owed per passenger" : "Possibly owed per passenger"}</div>
        <div style={{ fontSize:48, fontWeight:700, color:C.text, letterSpacing:-1 }}>{e.amount ? fmtComp(e.amount,e.currency) : e.range ? `${fmtComp(e.range[0],e.currency)}–${fmtComp(e.range[1],e.currency)}` : "—"}</div>
        <div style={{ fontSize:12, color:C.muted }}>{e.scheme==="UK261"?"UK261":"EU261"} · cash, on top of care and rebooking</div>
      </div>
      <ul style={{ margin:"0 0 14px", padding:"0 0 0 18px", color:C.text, fontSize:14, lineHeight:1.6 }}>{e.reasons.map(r=><li key={r}>{r}</li>)}</ul>
      {e.caveats.map(c=><div key={c} style={{ fontSize:13, color:C.soft, lineHeight:1.5, marginBottom:6 }}>{c}</div>)}
      <div role="note" style={{ marginTop:12, padding:"12px 14px", borderRadius:14, background:tint(C.yellow,0.12), color:C.text, fontSize:13, lineHeight:1.5 }}>
        <b>Estimate only, not legal advice.</b> {e.scheme==="UK261" ? "UK261 bands: £220 up to 1,500 km, £350 for 1,500–3,500 km (or domestic UK over 1,500 km), £520 over 3,500 km" : "EU261 bands: €250 up to 1,500 km, €400 for 1,500–3,500 km (or intra-EU over 1,500 km), €600 over 3,500 km"}, by great-circle distance. Keep your boarding pass and receipts and claim with the operating airline first.
      </div>
    </Sheet>
  );
}

function CustomsSheet({ f, onClose }) {
  const ap = airport(f.arr);
  const steps = ["Download the free Mobile Passport Control app (CBP) before you land.", "Add everyone travelling on your passport details, including kids.", `After landing at ${f.arr}, choose the airport, answer the questions and submit with a selfie.`, "Follow the Mobile Passport Control signs with your passports ready."];
  return (
    <Sheet onClose={onClose} testid="sheet-customs" label="US customs reminder">
      <SheetTitle title="Arriving in the US" sub={`${f.iata} lands at ${ap?.name || f.arr}. Set up Mobile Passport Control before landing to speed through customs.`} onClose={onClose}/>
      <ol style={{ margin:"0 0 16px", padding:"0 0 0 20px", color:C.text, fontSize:15, lineHeight:1.6 }}>{steps.map(x=><li key={x} style={{ marginBottom:6 }}>{x}</li>)}</ol>
      <a className="mr-btn" href={CBP_MPC_URL} target="_blank" rel="noopener noreferrer" style={{ ...pillBtn(true), display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}>Open CBP Mobile Passport Control ↗</a>
      <div style={{ fontSize:12, color:C.muted, marginTop:10, lineHeight:1.4 }}>Official U.S. Customs and Border Protection page. Eligibility and participating airports are set by CBP.</div>
    </Sheet>
  );
}

const RULE = { yes:["Yes","green"], no:["No","red"], limits:["Limits","yellow"] };
function RuleTag({ label, v }) {
  const [txt, key] = RULE[v] || ["?","muted"];
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, color:C.soft }}>{label}<b style={{ color:C[key], fontWeight:700 }}>{txt}</b></span>;
}
function BringSheet({ onClose }) {
  const [q, setQ] = useState("");
  const items = searchItems(q);
  return (
    <Sheet onClose={onClose} testid="sheet-bring" label="Can I bring this?">
      <SheetTitle title="Can I bring this?" sub="General TSA guidance for US airports. Airlines and other countries can be stricter." onClose={onClose}/>
      <input data-testid="bring-search" type="search" aria-label="Search items" placeholder="Search: power bank, knife, formula…" value={q} onChange={e=>setQ(e.target.value)} style={{ ...inputStyle(), minHeight:44, borderRadius:12, marginBottom:8 }}/>
      <div role="list" aria-live="polite">
        {items.map(x=>(
          <div role="listitem" key={x.item} style={{ padding:"12px 2px", borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:4 }}>{x.item}</div>
            <div style={{ display:"flex", gap:16 }}><RuleTag label="Carry-on" v={x.carryOn}/><RuleTag label="Checked" v={x.checked}/></div>
            {x.note&&<div style={{ fontSize:12, color:C.soft, marginTop:4, lineHeight:1.4 }}>{x.note}</div>}
          </div>
        ))}
        {!items.length&&<div style={{ fontSize:14, color:C.soft, padding:"14px 2px" }}>Not in our quick list. Check the full TSA list below.</div>}
      </div>
      <a className="mr-btn" href={TSA_WHAT_CAN_I_BRING_URL} target="_blank" rel="noopener noreferrer" style={{ ...pillBtn(), display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", marginTop:12 }}>Full TSA “What Can I Bring?” list ↗</a>
      <div style={{ fontSize:12, color:C.muted, marginTop:8, lineHeight:1.4 }}>General guidance only. The TSA officer makes the final call at the checkpoint.</div>
    </Sheet>
  );
}

// FAA NAS status: US airports only. Ground stop / closure = red, delays = yellow.
const isUsAirport = code => airport(code)?.country === "US";
// FAA chip for one flight: real clock only (hidden in demo mode), routine closures dropped,
// and only notices that apply to the flight's own day / time window at that airport.
function faaChip(faa, f, { now, demo, live } = {}) {
  if (!faa?.ok || demo) return null;
  const t = liveTimes(f, live);
  const H = 3600000;
  for (const code of [f.dep, f.arr].filter(isUsAirport)) {
    const at = code === f.dep ? +t.estDep : +t.estArr;
    const win = code === f.dep ? { from:new Date(at - 3*H), to:new Date(at + H) } : { from:new Date(at - H), to:new Date(at + H) };
    const ev = relevantEvents(faa, code, { now: now || new Date(), ...win, tz: tzOf(code) });
    if (!ev.length) continue;
    const severe = ev.some(e => e.type === "ground_stop" || e.type === "closure");
    const kind = ev.find(e => e.type === "ground_stop") ? "ground stop" : ev.find(e => e.type === "closure") ? "closure notice" : "delays";
    return { id:"faa", icon:"alert", tone: severe ? C.red : C.yellow, text:`${code}: ${kind}`, data:{ code } };
  }
  return null;
}
function AirportStatusSheet({ faa, codes, onClose, onRetry }) {
  const others = faa?.ok ? Object.keys(faa.airports).filter(c => !codes.includes(c) && statusFor(faa, c).length).sort() : [];
  const Block = ({ code }) => {
    const ev = statusFor(faa, code);
    return (
      <div style={{ padding:"12px 2px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16, fontWeight:700, color:C.text, minWidth:44 }}>{code}</span>
          <span style={{ fontSize:13, color:ev.length?C.yellow:C.green, fontWeight:600 }}>{ev.length ? `${ev.length} notice${ev.length>1?"s":""}` : "No reported delays"}</span>
        </div>
        {ev.map((e,i)=><div key={i} style={{ fontSize:13, color:C.soft, marginTop:4, lineHeight:1.4 }}>{describeFaa(e)}</div>)}
      </div>
    );
  };
  return (
    <Sheet onClose={onClose} testid="sheet-faa" label="US airport delay status">
      <SheetTitle title="US airport status" sub="Delays, ground stops and closures from the FAA NAS status feed." onClose={onClose}/>
      {!faa && <div style={{ fontSize:14, color:C.soft, padding:"12px 2px" }}>Checking the FAA feed…</div>}
      {faa && !faa.ok && (
        <div role="status" style={{ padding:"14px", borderRadius:14, background:C.chip, fontSize:14, color:C.text, lineHeight:1.5 }}>
          FAA airport status is unavailable right now ({faa.error}). Check <a href="https://nasstatus.faa.gov/" target="_blank" rel="noopener noreferrer" style={{ color:C.accent }}>nasstatus.faa.gov</a> or your airline app.
          <button type="button" className="mr-btn" onClick={onRetry} style={{ ...pillBtn(), marginTop:12, width:"100%" }}>Try again</button>
        </div>
      )}
      {faa?.ok && <>
        {codes.length ? codes.map(c=><Block key={c} code={c}/>) : <div style={{ fontSize:14, color:C.soft }}>No US airports on this trip.</div>}
        {others.length>0 && <>
          <div style={{ fontSize:12, fontWeight:600, color:C.muted, letterSpacing:0.4, margin:"20px 2px 4px" }}>ELSEWHERE IN THE US</div>
          {others.map(c=><Block key={c} code={c}/>)}
        </>}
        <div style={{ fontSize:12, color:C.muted, marginTop:12 }}>FAA update: {faa.updatedAt || "unknown"}. Closure notices for general aviation only are hidden. Airline-specific delays are not included.</div>
      </>}
    </Sheet>
  );
}

const pillBtn = (primary) => ({ flex:1, minHeight:48, borderRadius:14, border:primary?"none":`1px solid ${C.border}`, background:primary?C.accent:C.chip, color:primary?"#fff":C.text, fontSize:15, fontWeight:600, cursor:"pointer", font:"inherit", fontFamily:C.sans });

const inputStyle = () => ({ width:"100%", background:C.card, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"12px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:C.sans });
const label = t => <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:6 }}>{t}</div>;

// ── Add flight: honest. Manual entry from the booking; optional live check. ──
function AddModal({ onClose, onAdd }) {
  const [v, setV] = useState({ iata:"", date:"", dep:"", arr:"", depTime:"", arrTime:"", arrDate:"", cancelNoticeDate:"" });
  const [check, setCheck] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, x) => { setV(o => ({ ...o, [k]: x })); setCheck(null); };
  const iataOk = /^[A-Z0-9]{2}\s?\d{1,4}[A-Z]?$/i.test(v.iata.trim());
  const timeOk = t => /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(t.trim());
  const ready = iataOk && v.date && /^[A-Z]{3}$/i.test(v.dep) && /^[A-Z]{3}$/i.test(v.arr) && timeOk(v.depTime) && timeOk(v.arrTime);
  async function verify() {
    setBusy(true);
    setCheck(await verifyFlight(v.iata.toUpperCase(), v.date));
    setBusy(false);
  }
  function add() {
    const m = v.iata.toUpperCase().replace(/\s+/g,"").match(/^([A-Z0-9]{2})(\d+[A-Z]?)$/);
    const d = new Date(`${v.date}T12:00:00Z`);
    onAdd({
      id:`u${Date.now()}`, iata:`${m[1]} ${m[2]}`, code:m[1], airline:m[1],
      dep:v.dep.toUpperCase(), arr:v.arr.toUpperCase(), depDate:v.date, arrDate:v.arrDate||v.date,
      depTime:v.depTime.toUpperCase().replace(/(\d)(AM|PM)/,"$1 $2"), arrTime:v.arrTime.toUpperCase().replace(/(\d)(AM|PM)/,"$1 $2"),
      status:"Scheduled", gate:"TBD", terminal:"TBD", aircraft:"Aircraft TBD",
      date:d.toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric", year:"numeric", timeZone:"UTC" }), conf:"", trip:"added", conn:null,
      ...(v.cancelNoticeDate ? { cancelNoticeDate:v.cancelNoticeDate } : {}),
    });
    notify(`${m[1]} ${m[2]} added`);
    onClose();
  }
  return (
    <Sheet onClose={onClose} testid="add-modal">
      <div style={{ fontFamily:C.display, fontStyle:"italic", fontSize:22, color:C.text, marginBottom:4 }}>Add a flight</div>
      <div style={{ fontSize:12, color:C.soft, marginBottom:16 }}>Copy the times from your booking confirmation. Your booking stays the source of truth; live data only adds status on the day.</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div>{label("FLIGHT")}<input data-testid="add-iata" value={v.iata} onChange={e=>set("iata",e.target.value)} placeholder="LY 347" style={inputStyle()}/></div>
        <div>{label("DEPARTURE DATE")}<input type="date" value={v.date} onChange={e=>set("date",e.target.value)} style={inputStyle()}/></div>
        <div>{label("FROM (IATA)")}<input value={v.dep} maxLength={3} onChange={e=>set("dep",e.target.value)} placeholder="TLV" style={inputStyle()}/></div>
        <div>{label("TO (IATA)")}<input value={v.arr} maxLength={3} onChange={e=>set("arr",e.target.value)} placeholder="ZRH" style={inputStyle()}/></div>
        <div>{label("DEPARTS (LOCAL)")}<input value={v.depTime} onChange={e=>set("depTime",e.target.value)} placeholder="8:00 AM" style={inputStyle()}/></div>
        <div>{label("ARRIVES (LOCAL)")}<input value={v.arrTime} onChange={e=>set("arrTime",e.target.value)} placeholder="11:20 AM" style={inputStyle()}/></div>
      </div>
      <div style={{ marginBottom:14 }}>{label("ARRIVAL DATE (IF DIFFERENT)")}<input type="date" value={v.arrDate} onChange={e=>set("arrDate",e.target.value)} style={inputStyle()}/></div>
      <div style={{ marginBottom:14 }}>{label("CANCELLATION ANNOUNCED (OPTIONAL)")}<input data-testid="add-cancel-notice" aria-label="Cancellation announced date (optional)" type="date" value={v.cancelNoticeDate} onChange={e=>set("cancelNoticeDate",e.target.value)} style={inputStyle()}/></div>
      {check && (
        <div data-testid="add-check" style={{ fontSize:12, borderRadius:10, padding:"10px 12px", marginBottom:12, background:C.card, border:`1px solid ${C.border}`, color:check.found?C.green:check.configured?C.yellow:C.soft }}>
          {!check.configured ? "Live lookup is off (no API key configured). You can still add the flight from your booking."
            : check.error ? `Live lookup failed (${check.error}). You can still add it from your booking.`
            : check.found ? `Found ${v.iata.toUpperCase()} in live data${check.live?.status?` · ${check.live.status}`:""}.`
            : "Live data has no match for that flight and date yet. Double-check the number, or add it anyway."}
        </div>
      )}
      <div style={{ display:"flex", gap:8 }}>
        <div onClick={()=>iataOk&&v.date&&!busy&&verify()} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 0", textAlign:"center", cursor:iataOk&&v.date?"pointer":"default", color:iataOk&&v.date?C.text:C.muted, fontWeight:700, fontSize:13 }}>{busy?"Checking...":"Check live"}</div>
        <div data-testid="add-submit" onClick={()=>ready&&add()} style={{ flex:1.4, background:ready?`linear-gradient(135deg,${C.accent},#007aaa)`:C.surface, border:ready?"none":`1px solid ${C.border}`, borderRadius:12, padding:"13px 0", textAlign:"center", cursor:ready?"pointer":"default", color:ready?"#000":C.muted, fontWeight:800, fontSize:14 }}>Add to My Flights</div>
      </div>
      {!ready && <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>Times like "8:00 AM"; airports as 3-letter codes.</div>}
    </Sheet>
  );
}

// ── Share: message built from the next flight, real clipboard / native share ──
function ShareModal({ onClose, flight, live, now }) {
  const [copied, setCopied] = useState(false);
  const t = flight ? liveTimes(flight, live) : null;
  const msg = flight ? [
    `${flight.iata} ${airport(flight.dep)?.city||flight.dep} → ${airport(flight.arr)?.city||flight.arr}`,
    `${flight.date} · departs ${flight.depTime}${t.depDelay>=5?` (now ${fmtClock(t.estDep, tzOf(flight.dep))})`:""}, arrives ${flight.arrTime}${t.arrDelay>=5?` (now ${fmtClock(t.estArr, tzOf(flight.arr))})`:""} local`,
    t.cancelled ? "Update: this flight is CANCELLED, rebooking now." : null,
    `Sent from My Runway`,
  ].filter(Boolean).join("\n") : "No upcoming flights";
  async function copy() {
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(()=>setCopied(false), 2000); }
    catch { notify("Copy blocked by the browser. Select the text instead."); }
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title:"My flight", text: msg }); } catch { /* cancelled */ } }
    else copy();
  }
  return (
    <Sheet onClose={onClose} testid="share-modal">
      <div style={{ fontFamily:C.display, fontStyle:"italic", fontSize:22, color:C.text, marginBottom:4 }}>Share your flight</div>
      <div style={{ fontSize:12, color:C.soft, marginBottom:14 }}>Built from your next flight{now?` (${fmtDay(now, tzOf(flight?.dep||"MIA"))})`:""}. Nothing is sent until you choose an app.</div>
      <pre data-testid="share-text" style={{ whiteSpace:"pre-wrap", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px", color:C.text, fontSize:13, fontFamily:C.mono, marginBottom:14, userSelect:"all" }}>{msg}</pre>
      <div style={{ display:"flex", gap:8 }}>
        <div onClick={copy} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 0", textAlign:"center", cursor:"pointer", color:copied?C.green:C.text, fontWeight:700, fontSize:13 }}>{copied?"Copied":"Copy text"}</div>
        <div onClick={share} style={{ flex:1, background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:12, padding:"13px 0", textAlign:"center", cursor:"pointer", color:"#000", fontWeight:800, fontSize:13 }}>Share…</div>
      </div>
    </Sheet>
  );
}

// ── Alternates for a cancelled flight: real next steps, no invented inventory ──
const MANAGE_URLS = { LY:"https://www.elal.com/eng/manage-booking", LX:"https://www.swiss.com/us/en/manage-booking" };
function AlternateFlightsScreen({ onBack, flight }) {
  const f = flight || FLIGHTS[0];
  const gf = `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights from ${f.dep} to ${f.arr} on ${f.depDate} one way`)}`;
  const euRights = ["ZRH","LHR","CDG"].includes(f.dep) || f.code === "LX";
  return (
    <OverlayPage testid="alternates" title="Rebooking options" sub={`${f.iata} · ${f.dep} → ${f.arr} · ${f.date}`} onBack={onBack}>
      <div style={{ padding:"16px 16px 100px" }}>
        <div style={{ background:tint(C.yellow,0.07), border:`1px solid ${tint(C.yellow,0.25)}`, borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", gap:10 }}>
          <StatIcon id="bolt" color={C.yellow} size={18}/>
          <div><div style={{ fontSize:13, fontWeight:700, color:C.yellow, marginBottom:2 }}>Move fast: seats on the next flights go quickly</div><div style={{ fontSize:12, color:C.soft }}>Rebook through the airline first: on the same ticket it's normally free when they cancel.</div></div>
        </div>
        {[
          { icon:"ticket", title:`Rebook with ${f.airline}`, text:"Manage booking: accept the offered flight or pick another.", href:MANAGE_URLS[f.code], cta:"Open manage booking" },
          { icon:"search", title:"See every flight on this route", text:`Same-day and next-day ${f.dep} → ${f.arr} options on Google Flights, to know what to ask for.`, href:gf, cta:"Search flights" },
          { icon:"phone", title:"Call while you queue", text:"Agents at the transfer desk and on the phone work the same inventory. Try both.", href:null },
        ].map(o=>(
          <div key={o.title} style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:16, marginBottom:12 }}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:o.href?12:0 }}>
              <StatIcon id={o.icon} color={C.accent} size={20}/>
              <div><div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:3 }}>{o.title}</div><div style={{ fontSize:12, color:C.soft, lineHeight:1.5 }}>{o.text}</div></div>
            </div>
            {o.href&&<a href={o.href} target="_blank" rel="noreferrer" style={{ display:"block", textDecoration:"none", background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"11px 0", textAlign:"center", color:"#000", fontWeight:800, fontSize:13 }}>{o.cta} →</a>}
          </div>
        ))}
        {euRights && <div style={{ fontSize:12, color:C.soft, lineHeight:1.6, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px" }}>
          <b style={{ color:C.text }}>Your rights:</b> flights from Switzerland/EU, or on a Swiss/EU airline, fall under EU261-style rules: rebooking or a refund, meals and a hotel if you're stuck overnight, and possibly compensation. Keep receipts.
        </div>}
      </div>
    </OverlayPage>
  );
}

// ── Weather (live, free Open-Meteo; no key needed) ──
function useAirportWeather(code) {
  const [w, setW] = useState({ state:"loading" });
  useEffect(() => {
    let alive = true;
    fetchAirportWeather(code).then(d => alive && setW(d ? { state:"ok", ...d } : { state:"error" }));
    return () => { alive = false; };
  }, [code]);
  return w;
}

function WeatherScreen({ codes = ["MIA","TLV","ZRH"] }) {
  const [sel, setSel] = useState(codes[0]);
  const now = useNow();
  const w = useAirportWeather(sel);
  const ap = airport(sel);
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {codes.map(c=>(<div key={c} onClick={()=>setSel(c)} style={{ flex:1, background:c===sel?`linear-gradient(135deg,${C.accent},#007aaa)`:C.surface, border:`1px solid ${c===sel?C.accent:C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}><div style={{ fontSize:18, fontWeight:800, color:c===sel?"#000":C.text, fontFamily:C.mono }}>{c}</div><div style={{ fontSize:9, color:c===sel?"#003355":C.muted }}>{airport(c)?.city}</div></div>))}
      </div>
      {w.state==="loading" && <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:30 }}>Loading live weather...</div>}
      {w.state==="error" && <div style={{ color:C.soft, fontSize:13, textAlign:"center", padding:30 }}>Weather is unavailable right now. Try again in a minute.</div>}
      {w.state==="ok" && <>
        <div data-testid="weather-now" style={{ background:C.card, borderRadius:20, border:`1px solid ${C.border}`, padding:20, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <StatIcon id={w.icon} color={C.accent} size={56}/>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:C.display, fontSize:48, color:C.text, lineHeight:1 }}>{w.tempF}°F</div>
              <div style={{ fontSize:14, color:C.soft, marginTop:6 }}>{w.label} · {Math.round((w.tempF-32)*5/9)}°C</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600 }}>LOCAL TIME</div>
              <div style={{ fontSize:16, fontWeight:800, color:C.text, fontFamily:C.mono }}>{fmtClock(now, ap.tz)}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            {[["wind","WIND",`${w.windMph} mph`],["rain","HUMIDITY",`${w.humidity}%`],["clock","UPDATED","10 min"]].map(([i,l,val])=>(
              <div key={l} style={{ flex:1, background:C.surface, borderRadius:10, padding:"10px", border:`1px solid ${C.border}`, textAlign:"center" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}><StatIcon id={i} color={C.soft} size={16}/></div>
                <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>5-DAY FORECAST</div>
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden" }}>
          {w.daily.map((d,i)=>(
            <div key={d.date} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderTop:i?`1px solid ${C.border}`:"none" }}>
              <div style={{ width:44, fontSize:13, fontWeight:700, color:C.text }}>{i===0?"Today":new Date(`${d.date}T12:00:00Z`).toLocaleDateString("en-US",{ weekday:"short", timeZone:"UTC" })}</div>
              <StatIcon id={d.icon} color={C.accent} size={20}/>
              <div style={{ flex:1, fontSize:12, color:C.soft }}>{d.label}</div>
              <div style={{ fontSize:13, fontFamily:C.mono, color:C.text }}>{d.hiF}° <span style={{ color:C.muted }}>{d.loF}°</span></div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:10, color:C.muted, marginTop:10 }}>Live data from Open-Meteo, updated every 10 minutes.</div>
      </>}
    </div>
  );
}

// ── Airport conditions: live weather; delay/security are labelled typical estimates ──
function AirportWxLine({ code }) {
  const w = useAirportWeather(code);
  if (w.state!=="ok") return <span style={{ color:C.muted }}>{w.state==="loading"?"Loading...":"Unavailable"}</span>;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}><StatIcon id={w.icon} color={C.accent} size={14}/>{w.tempF}°F {w.label}</span>;
}

function AirportIntelligenceScreen({ onBack }) {
  const now = useNow();
  const rows = [
    { code:"MIA", role:"Your home airport", security:"~25 min", tip:"Allow extra time on Sunday afternoons" },
    { code:"TLV", role:"Your return departure", security:"~40 min", tip:"Israeli security questioning happens before check-in: arrive 3h early" },
    { code:"ZRH", role:"Your connection", security:"~20 min", tip:"Miami flights leave from the E gates (non-Schengen): take the Skymetro and expect a re-screen" },
  ];
  return (
    <OverlayPage testid="airport-intel" title="Airport conditions" sub="Live weather · security times are typical estimates" onBack={onBack}>
      <div style={{ padding:"16px 16px 100px" }}>
        {rows.map(r=>{ const ap = airport(r.code); return (
          <div key={r.code} style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, padding:16, marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:tint(C.accent,0.08), border:`2px solid ${tint(C.accent,0.25)}`, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:16, fontWeight:800, color:C.accent, fontFamily:C.mono }}>{r.code}</span></div>
              <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:800, color:C.text }}>{ap.name}</div><div style={{ fontSize:12, color:C.soft }}>{ap.city} · {r.role}</div></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              {[["WEATHER NOW",<AirportWxLine key="w" code={r.code}/>],["LOCAL TIME",fmtClock(now, ap.tz)],["TYPICAL SECURITY",r.security],["TIME ZONE",tzLabel(now, ap.tz)]].map(([l,val])=>(
                <div key={l} style={{ background:C.surface, borderRadius:10, padding:"10px", border:`1px solid ${C.border}` }}><div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, marginBottom:4, letterSpacing:1 }}>{l}</div><div style={{ fontSize:12, color:l==="TYPICAL SECURITY"?C.orange:C.text, fontWeight:600 }}>{val}</div></div>
              ))}
            </div>
            <div style={{ fontSize:12, color:C.soft, display:"flex", gap:7 }}><StatIcon id="info" color={C.accent} size={14}/><span>{r.tip}</span></div>
          </div>
        ); })}
        <div style={{ fontSize:10, color:C.muted }}>Live airport delay programs need the flight-data API (planned).</div>
      </div>
    </OverlayPage>
  );
}

function ToolChips({ items }) {
  return (
    <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"4px 0 18px" }}>
      {items.map(([id,icon,text,fn])=>(
        <button type="button" className="mr-btn mr-glass" key={id} data-testid={`tool-${id}`} onClick={fn} style={{ flexShrink:0, minHeight:44, display:"flex", alignItems:"center", gap:7, background:C.chip, border:"none", borderRadius:22, padding:"0 16px", cursor:"pointer", font:"inherit" }}>
          <StatIcon id={icon} color={C.accent} size={16}/><span style={{ fontSize:14, color:C.text, fontWeight:500, whiteSpace:"nowrap" }}>{text}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main flights screen ──
function FlightsScreen({ flights, getLive, getMeta, now, navIdx, homeAddress, stayAddress, prefs, withKids, onTap, onAdd, onEditPrefs, onCalendar, tools, liveStrip, onMore, onInfo, faa, faaNow, demo }) {
  const phases = flights.map(f => ({ f, phase: flightPhase(f, getLive(f.id), now) }));
  const upcoming = phases.filter(p => p.phase !== "completed").map(p => p.f);
  const done = phases.filter(p => p.phase === "completed").map(p => p.f);
  const next = upcoming.find(f => flightPhase(f, getLive(f.id), now) === "upcoming");
  const nextInAir = upcoming.find(f => flightPhase(f, getLive(f.id), now) === "in-air");
  const arrivalFocus = nextInAir || next;
  // show the final destination of the journey (LX 064 into MIA, not the ZRH layover)
  const arrF = (arrivalFocus && upcoming.find(f => f.conn?.from === arrivalFocus.id)) || arrivalFocus;
  const [showDone, setShowDone] = useState(false);
  const onwardCancelled = next && upcoming.find(f => f.conn?.from === next.id && getLive(f.id)?.status === "Cancelled");
  const checkinFlights = upcoming.filter(f => checkinWindow(f, now).state !== "closed").slice(0, 2);
  const totalKm = 22000;
  return (
    <div style={{ padding:"14px 16px 120px" }}>
      {liveStrip}
      <ToolChips items={[...tools.filter(t=>t[0]==="weather"||t[0]==="intel"), ["more","more","More",onMore]]}/>
      <WhatChangedBanner flights={upcoming} getLive={getLive}/>
      {next && <LeaveByCard f={next} live={getLive(next.id)} now={now} navIdx={navIdx} homeAddress={homeAddress} stayAddress={stayAddress} prefs={prefs} onEdit={onEditPrefs} warning={onwardCancelled ? `Your connection ${onwardCancelled.iata} is cancelled. Rebook it before you leave for the airport.` : null}/>}
      <h2 style={{ fontSize:20, fontWeight:700, color:C.text, margin:"18px 2px 10px", letterSpacing:-0.3 }}>{upcoming.length?"Upcoming":"No upcoming flights"}</h2>
      {upcoming.map(f=>{
        const inbound = f.conn?.from && flights.find(x=>x.id===f.conn.from);
        return (
          <div key={f.id}>
            {inbound && upcoming.includes(inbound) && <ConnectionCard inbound={inbound} outbound={f} liveIn={getLive(inbound.id)} liveOut={getLive(f.id)} withKids={withKids}/>}
            <FlightCard f={f} live={getLive(f.id)} liveMeta={getMeta(f.id)} now={now} onTap={onTap} onInfo={onInfo} extraChips={[faaChip(faa, f, { now: faaNow, demo, live: getLive(f.id) })].filter(Boolean)}/>
          </div>
        );
      })}
      {arrF && <ArrivalCard f={arrF} live={getLive(arrF.id)} now={now}/>}
      {checkinFlights.map(f=><CheckinCard key={f.id} f={f} now={now} onCalendar={onCalendar}/>)}
      <div onClick={onCalendar} data-testid="ics-trip" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"13px 0", cursor:"pointer", marginBottom:14 }}>
        <StatIcon id="calendar" color={C.accent} size={18}/><span style={{ fontSize:13, fontWeight:700, color:C.text }}>Add trip to calendar (.ics with alerts)</span>
      </div>
      {done.length>0 && <>
        <div onClick={()=>setShowDone(s=>!s)} style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, margin:"6px 0 10px", cursor:"pointer" }}>COMPLETED ({done.length}) {showDone?"▲":"▼"}</div>
        {showDone && done.map(f=><FlightCard key={f.id} f={f} live={getLive(f.id)} liveMeta={getMeta(f.id)} now={now} onTap={onTap} onInfo={onInfo}/>)}
      </>}
      <div style={{ display:"flex", alignItems:"center", gap:12, background:tint(C.green,0.06), border:`1px solid ${tint(C.green,0.2)}`, borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
        <StatIcon id="leaf" color={C.green} size={20}/>
        <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:700, color:C.green }}>Trip footprint (estimate)</div><div style={{ fontSize:11, color:C.soft }}>~{totalKm.toLocaleString()} km flown · roughly 2.1 t CO₂ per economy passenger</div></div>
      </div>
      <div data-testid="add-flight-cta" onClick={onAdd} style={{ background:C.card, border:`1.5px dashed ${C.border}`, borderRadius:16, padding:"16px", textAlign:"center", cursor:"pointer", color:C.soft, fontSize:14, fontWeight:600 }}>+ Add a flight</div>
    </div>
  );
}

function SettingsModal({ onClose, isDark, setIsDark, homeAddress, setHomeAddress, stayAddress, setStayAddress, prefs, setPrefs, withKids, setWithKids, accountType, setAccountType, navIdx, setNavIdx, demoClock, setDemoClock, scenario, setScenario, onPlans }) {
  const [addr, setAddr] = useState(homeAddress);
  const [stay, setStay] = useState(stayAddress);
  const [drive, setDrive] = useState(String(prefs.driveMins));
  const [votes, setVotes] = usePersistentState("votes", {});
  const [alerts, setAlerts] = useState({ delays:true, cancels:true, gates:true, boarding:true, checkin:true });
  const [cancelChannels, setCancelChannels] = useState({ sms:true, email:true, push:true });
  const [saved, setSaved] = useState(false);
  function save() { setHomeAddress(addr); setStayAddress(stay); const d = parseInt(drive,10); if (d>0 && d<300) setPrefs(p=>({ ...p, driveMins:d })); setSaved(true); setTimeout(()=>setSaved(false), 2000); }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div data-testid="settings" onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:"20px 20px 48px", border:`1px solid ${C.border}`, maxWidth:480, margin:"0 auto", width:"100%", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 18px" }}/>
        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:20 }}>Settings</div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>ACCOUNT TYPE</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["personal","user","Personal"],["pro","star","Pro"],["corporate","building","Corporate"]].map(([id,icon,label])=>(
              <div key={id} onClick={()=>setAccountType(id)} style={{ flex:1, background:accountType===id?`${id==="corporate"?C.purple:C.accent}18`:C.card, border:`2px solid ${accountType===id?(id==="corporate"?C.purple:C.accent):C.border}`, borderRadius:12, padding:"12px 6px", textAlign:"center", cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><StatIcon id={icon} color={accountType===id?(id==="corporate"?C.purple:C.accent):C.soft} size={20}/></div>
                <div style={{ fontSize:11, fontWeight:700, color:accountType===id?(id==="corporate"?C.purple:C.accent):C.soft }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>APPEARANCE</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["moon","Dark Mode",true,"#04070e"],["sun","Light Mode",false,"#f0f4f8"]].map(([icon,label,dark,bg])=>(
              <div key={label} onClick={()=>setIsDark(dark)} style={{ flex:1, background:isDark===dark?`${C.accent}18`:C.card, border:`2px solid ${isDark===dark?C.accent:C.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center", cursor:"pointer" }}>
                <div style={{ width:40, height:28, borderRadius:8, background:bg, border:`1px solid ${C.border}`, margin:"0 auto 8px", display:"flex", alignItems:"center", justifyContent:"center" }}><StatIcon id={icon} color={isDark===dark?C.accent:C.soft} size={15}/></div>
                <div style={{ fontSize:12, fontWeight:700, color:isDark===dark?C.accent:C.soft }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>HOME ADDRESS</div>
          <input value={addr} onChange={e=>setAddr(e.target.value)} placeholder="123 Main St, Miami, FL" style={{ width:"100%", background:C.card, border:`1.5px solid ${addr?C.accent+"60":C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>WHERE YOU'RE STAYING (AWAY FROM HOME)</div>
          <input value={stay} onChange={e=>setStay(e.target.value)} placeholder="Hotel or family address, e.g. Ra'anana" style={{ width:"100%", background:C.card, border:`1.5px solid ${stay?C.accent+"60":C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
          <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Used for leave-by times when you fly home from somewhere else.</div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>LEAVE-BY PLANNING</div>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
            <div style={{ flex:1, fontSize:13, color:C.text }}>Drive to the airport (minutes)</div>
            <input data-testid="drive-mins" inputMode="numeric" value={drive} onChange={e=>setDrive(e.target.value.replace(/\D/g,""))} style={{ width:70, background:C.card, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 10px", color:C.text, fontSize:14, textAlign:"center", fontFamily:C.mono }}/>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ flex:1 }}><div style={{ fontSize:13, color:C.text }}>Travelling with kids</div><div style={{ fontSize:11, color:C.muted }}>Adds 10 min to connection planning</div></div>
            <div onClick={()=>setWithKids(k=>!k)} style={{ width:44, height:26, borderRadius:13, background:withKids?C.accent:"#2a3f5f", position:"relative", cursor:"pointer", flexShrink:0 }}><div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:withKids?21:3, transition:"left 0.2s" }}/></div>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>HOW YOU GET TO THE AIRPORT</div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1, marginBottom:7 }}>DRIVING</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
            {NAV_APPS.map((a,i)=>a.mode==="drive"&&(
              <div key={a.id} onClick={()=>setNavIdx(i)} style={{ background:navIdx===i?`${a.color}18`:C.card, border:`2px solid ${navIdx===i?a.color:C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center" }}>
                <NavLogo app={a} size={24}/>
                <div style={{ fontSize:11, fontWeight:700, color:navIdx===i?a.color:C.soft, marginTop:4 }}>{a.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1, marginBottom:7 }}>PUBLIC TRANSIT</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {NAV_APPS.map((a,i)=>a.mode==="transit"&&(
              <div key={a.id} onClick={()=>setNavIdx(i)} style={{ background:navIdx===i?`${a.color}18`:C.card, border:`2px solid ${navIdx===i?a.color:C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center" }}>
                <NavLogo app={a} size={24}/>
                <div style={{ fontSize:10, fontWeight:700, color:navIdx===i?a.color:C.soft, marginTop:4 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>CANCELLATION ALERTS</div>
          <div style={{ fontSize:12, color:C.soft, marginBottom:12, lineHeight:1.5 }}>How you'd like to be notified the moment a flight is cancelled — often before the airline tells you.</div>
          {[["sms","SMS Text Message","Instant text to your phone"],["email","Email","Full details + alternative flights"],["push","Push Notification","App notification on your device"]].map(([key,title,desc])=>(
            <div key={key} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:11, color:C.muted }}>{desc}</div>
              </div>
              <div onClick={()=>setCancelChannels(c=>({...c,[key]:!c[key]}))} style={{ width:44, height:26, borderRadius:13, background:cancelChannels[key]?C.red:"#2a3f5f", position:"relative", cursor:"pointer", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:cancelChannels[key]?21:3, transition:"left 0.2s" }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>ALERT PREFERENCES</div>
          {[["delays","clock","Delay alerts"],["cancels","alert","Cancellation alerts"],["gates","door","Gate changes"],["boarding","plane","Boarding alerts"],["checkin","ticket","Check-in reminder"]].map(([key,icon,title])=>(
            <div key={key} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
              <StatIcon id={icon} color={C.soft} size={19}/>
              <div style={{ flex:1, fontSize:13, fontWeight:600, color:C.text }}>{title}</div>
              <div onClick={()=>setAlerts(a=>({...a,[key]:!a[key]}))} style={{ width:44, height:26, borderRadius:13, background:alerts[key]?C.accent:"#2a3f5f", position:"relative", cursor:"pointer", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:alerts[key]?21:3, transition:"left 0.2s" }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>PLAN & PRICING</div>
          <div data-testid="open-plans" onClick={onPlans} style={{ display:"flex", alignItems:"center", gap:12, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px", cursor:"pointer" }}>
            <StatIcon id="star" color={C.accent} size={18}/>
            <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:C.text }}>{accountType==="personal"?"Free plan":accountType==="pro"?"Pro":"Corporate"}</div><div style={{ fontSize:11, color:C.muted }}>Compare Free, Pro and Corporate</div></div>
            <span style={{ color:C.accent, fontSize:13 }}>View →</span>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:6 }}>WHAT WOULD YOU LIKE TO SEE NEXT?</div>
          {[["map","Live flight map"],["phone","SMS alerts"],["bag","Bag tracking"],["building","Hotel bookings"],["drive","Rental car"],["money","Points & miles"],["chat","AI trip assistant"],["globe","Offline mode"]].map(([icon,title])=>(
            <div key={title} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
              <StatIcon id={icon} color={C.soft} size={18}/>
              <div style={{ flex:1, fontSize:13, fontWeight:600, color:C.text }}>{title}</div>
              <div onClick={()=>setVotes(v=>({ ...v, [title]:!v[title] }))} style={{ background:votes[title]?"rgba(0,232,122,0.12)":C.surface, border:`1.5px solid ${votes[title]?"rgba(0,232,122,0.4)":C.border}`, borderRadius:20, padding:"5px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <StatIcon id={votes[title]?"heartFill":"heart"} color={votes[title]?C.green:C.soft} size={12}/>
                <span style={{ fontSize:11, fontWeight:700, color:votes[title]?C.green:C.soft }}>{votes[title]?"Voted":"Vote"}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:24, background:tint("#ffc800",0.05), border:`1px solid ${tint("#ffc800",0.25)}`, borderRadius:14, padding:"14px" }}>
          <div style={{ fontSize:11, color:C.yellow, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>DEMO</div>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
            <div style={{ flex:1 }}><div style={{ fontSize:13, color:C.text }}>Replay the travel day</div><div style={{ fontSize:11, color:C.muted }}>This trip's dates have passed. The demo clock starts before LY 347 leaves Tel Aviv.</div></div>
            <div data-testid="demo-toggle" onClick={()=>setDemoClock(d=>!d)} style={{ width:44, height:26, borderRadius:13, background:demoClock?C.yellow:"#2a3f5f", position:"relative", cursor:"pointer", flexShrink:0 }}><div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:demoClock?21:3, transition:"left 0.2s" }}/></div>
          </div>
          <div style={{ fontSize:13, color:C.text, marginBottom:6 }}>Simulate live data</div>
          <select data-testid="scenario" value={scenario} onChange={e=>setScenario(e.target.value)} style={{ width:"100%", background:C.card, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px", color:C.text, fontSize:13 }}>
            {MOCK_SCENARIOS.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div data-testid="settings-save" onClick={save} style={{ background:saved?C.green:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, color:"#000", cursor:"pointer" }}>{saved?"Saved":"Save Settings"}</div>
      </div>
    </div>
  );
}
function sc(s) {
  if(s==="On Time"||s==="Scheduled") return { c:"#00e87a", bg:"rgba(0,232,122,0.1)", br:"rgba(0,232,122,0.25)" };
  if(s==="Departed"||s==="In Air") return { c:"#00c8f0", bg:"rgba(0,200,240,0.1)", br:"rgba(0,200,240,0.25)" };
  if(s==="Delayed") return { c:"#ffc800", bg:"rgba(255,200,0,0.1)", br:"rgba(255,200,0,0.25)" };
  if(s==="Landed") return { c:"#00e87a", bg:"rgba(0,232,122,0.1)", br:"rgba(0,232,122,0.25)" };
  if(s==="Cancelled") return { c:"#ff3a54", bg:"rgba(255,58,84,0.1)", br:"rgba(255,58,84,0.25)" };
  if(s==="Gate Change") return { c:"#a78bfa", bg:"rgba(167,139,250,0.1)", br:"rgba(167,139,250,0.25)" };
  return { c:"#7a9ab8", bg:"rgba(78,112,144,0.1)", br:"rgba(78,112,144,0.25)" };
}

function AirlineLogo({ code, size=26 }) {
  // Local monogram in the airline's brand colour (no third-party image requests)
  const colors = { AA:"#0078D2", UA:"#005DAA", DL:"#C01933", LA:"#E31837", H2:"#FF6B00", BA:"#075AAA", SW:"#304CB2", LY:"#003399", LX:"#d52b1e" };
  return <div aria-label={code} style={{ width:size, height:size, borderRadius:7, background:colors[code]||"#334", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.38, fontWeight:800, color:"#fff", fontFamily:C.mono, flexShrink:0 }}>{code}</div>;
}

function NavLogo({ app, size=28 }) {
  // Self-contained badge: app's brand color + first letter. No external images to break.
  const letter = app.label.replace("Google ","G·").charAt(0).toUpperCase();
  const mark = { waze:"W", google:"G", apple:"", google_transit:"G", citymapper:"C", moovit:"M" }[app.id] ?? letter;
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.28, background:app.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 1px 4px ${app.color}55` }}>
      {app.id==="apple"
        ? <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v6c0 5-3.5 7-7 8-3.5-1-7-3-7-8V7l7-4z" fill="#fff"/><path d="M9 12l2 2 4-4" stroke={app.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : app.mode==="transit"
          ? <svg width={size*0.62} height={size*0.62} viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="14" rx="2.5" stroke="#fff" strokeWidth="1.8"/><path d="M6 11h12" stroke="#fff" strokeWidth="1.8"/><circle cx="9" cy="14" r="1.1" fill="#fff"/><circle cx="15" cy="14" r="1.1" fill="#fff"/><path d="M8 17l-1.5 3M16 17l1.5 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
          : <span style={{ fontSize:size*0.5, fontWeight:900, color:"#fff", fontFamily:"Arial, sans-serif" }}>{mark}</span>}
    </div>
  );
}

function StatusPill({ status }) {
  const s = sc(status);
  return <span style={{ background:s.bg, border:`1px solid ${s.br}`, borderRadius:20, padding:"4px 12px", fontSize:11, color:s.c, fontWeight:700, fontFamily:C.mono, whiteSpace:"nowrap" }}>{status}</span>;
}

function StatIcon({ id, color="#00c8f0", size=19 }) {
  const sw = 1.5;
  const icons = {
    drive: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11M5 11h14M5 11v6m14-6v6M5 17h14M6.5 17v1.5M17.5 17v1.5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="14" r="0.9" fill={color}/><circle cx="16.5" cy="14" r="0.9" fill={color}/></svg>),
    traffic: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="8" y="3" width="8" height="16" rx="3" stroke={color} strokeWidth={sw}/><circle cx="12" cy="7" r="1.4" fill={color}/><circle cx="12" cy="11" r="1.4" fill={color} opacity="0.45"/><circle cx="12" cy="15" r="1.4" fill={color} opacity="0.45"/><path d="M12 19v2" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    dist: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 21c4-4.5 6-8 6-11a6 6 0 10-12 0c0 3 2 6.5 6 11z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><circle cx="12" cy="10" r="2.2" stroke={color} strokeWidth={sw}/></svg>),
    buffer: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw}/><path d="M12 7v5l3.5 2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    security: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    sun: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth={sw}/><path d="M12 2.5v2.5M12 19v2.5M2.5 12h2.5M19 12h2.5M5 5l1.8 1.8M17.2 17.2L19 19M5 19l1.8-1.8M17.2 6.8L19 5" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    cloud: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 18a4 4 0 01-.5-7.97A5.5 5.5 0 0117.5 11 3.5 3.5 0 0117 18H7z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    partly: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3" stroke={color} strokeWidth={sw}/><path d="M8 2.5v1.5M2.5 8h1.5M4.2 4.2l1 1M11.8 4.2l-1 1" stroke={color} strokeWidth={sw} strokeLinecap="round"/><path d="M9 19a3.5 3.5 0 01-.4-6.98A4.5 4.5 0 0117.5 13 3 3 0 0117 19H9z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    rain: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 15a4 4 0 01-.5-7.97A5.5 5.5 0 0117.5 8 3.5 3.5 0 0117 15H7z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    storm: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 14a4 4 0 01-.5-7.97A5.5 5.5 0 0117.5 7 3.5 3.5 0 0117 14H7z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M12 15l-2 3h3l-2 3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    snow: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 14a4 4 0 01-.5-7.97A5.5 5.5 0 0117.5 7 3.5 3.5 0 0117 14H7z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><circle cx="8" cy="18.5" r="0.7" fill={color}/><circle cx="12" cy="19.5" r="0.7" fill={color}/><circle cx="16" cy="18.5" r="0.7" fill={color}/></svg>),
    fog: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 12a4 4 0 01-.5-7.97A5.5 5.5 0 0117.5 5 3.5 3.5 0 0117 12H7z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M5 16h14M7 19h10" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    home: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 11l8-6 8 6M6 9.5V19a1 1 0 001 1h3v-5h4v5h3a1 1 0 001-1V9.5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    ticket: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v1.5a2 2 0 000 5V16a2 2 0 01-2 2H5a2 2 0 01-2-2v-1.5a2 2 0 000-5V8z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M14 6v12" stroke={color} strokeWidth={sw} strokeDasharray="2 2"/></svg>),
    bell: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3a6 6 0 00-6 6v4l-1.5 2v1h15v-1L18 13V9a6 6 0 00-6-6z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M10 19a2 2 0 004 0" stroke={color} strokeWidth={sw}/></svg>),
    leaf: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14 0-4 2-7 6-9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    alert: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3L2 20h20L12 3z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M12 10v4" stroke={color} strokeWidth={sw} strokeLinecap="round"/><circle cx="12" cy="17" r="0.6" fill={color}/></svg>),
    warning: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw}/><path d="M12 7v5" stroke={color} strokeWidth={sw} strokeLinecap="round"/><circle cx="12" cy="16" r="0.6" fill={color}/></svg>),
    plane: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M21 16v-1.5l-7-4.5V5a1.5 1.5 0 00-3 0v5l-7 4.5V16l7-2v4l-1.8 1.3V20l3.3-.9 3.3.9v-1.2L14 18v-4l7 2z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    planeDepart: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 18h18" stroke={color} strokeWidth={sw} strokeLinecap="round"/><path d="M4 14l3 1 6-1 7-2.2a1.4 1.4 0 00-.5-2.7l-2.6.4-4-4.2-1.8.5 2.2 4.3-3.4.6L6.5 9l-1.6.5L6 13l-2 .5V14z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    planeArrive: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 19h18" stroke={color} strokeWidth={sw} strokeLinecap="round"/><path d="M5 13l2.6 1.6 6 1.4 7.2 1.4a1.4 1.4 0 00.6-2.7l-2.4-1-2-5.5-1.8-.4.6 4.7-3.3-.8L9.7 8 8 7.8l.6 3.6-2.4-.8L5 11.4V13z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    clock: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw}/><path d="M12 7v5l3.5 2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    check: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw}/><path d="M8 12.5l2.5 2.5L16 9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    cross: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw}/><path d="M9 9l6 6M15 9l-6 6" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    link: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M9 15l6-6" stroke={color} strokeWidth={sw} strokeLinecap="round"/><path d="M10.5 6.5l1-1a3.5 3.5 0 015 5l-2 2a3.5 3.5 0 01-5 0" stroke={color} strokeWidth={sw} strokeLinecap="round"/><path d="M13.5 17.5l-1 1a3.5 3.5 0 01-5-5l2-2a3.5 3.5 0 015 0" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    money: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw}/><path d="M12 7v10M14.5 9.5c0-1.1-1.1-2-2.5-2s-2.5.9-2.5 2 1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.9-2.5-2" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    globe: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw}/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke={color} strokeWidth={sw}/></svg>),
    search: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke={color} strokeWidth={sw}/><path d="M15.5 15.5L20 20" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    email: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={sw}/><path d="M3 7l9 6 9-6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    chat: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    star: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    building: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="1" stroke={color} strokeWidth={sw}/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    moon: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M20 14a8 8 0 01-10-10 8 8 0 1010 10z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    user: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={color} strokeWidth={sw}/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    door: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 3h9a1 1 0 011 1v16a1 1 0 01-1 1H6V3z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><circle cx="12.5" cy="12" r="0.8" fill={color}/></svg>),
    phone: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 4h4l1.5 5-2 1.5a11 11 0 005 5L18 13l5 1.5V19a2 2 0 01-2 2A16 16 0 014 4z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    receipt: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M9 8h6M9 12h6" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    pin: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 21c4-4.5 6-8 6-11a6 6 0 10-12 0c0 3 2 6.5 6 11z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><circle cx="12" cy="10" r="2.2" stroke={color} strokeWidth={sw}/></svg>),
    eye: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth={sw}/></svg>),
    bolt: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M13 3L5 13h5l-1 8 8-10h-5l1-8z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    satellite: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw}/><path d="M5 12a7 7 0 017-7M5 16a11 11 0 0111-11" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    edit: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18 10l-4-4L4 16v4z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M14 6l4 4" stroke={color} strokeWidth={sw}/></svg>),
    hourglass: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 4h10M7 20h10M8 4c0 5 8 5 8 0M8 20c0-5 8-5 8 0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    walk: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="13" cy="4.5" r="1.8" stroke={color} strokeWidth={sw}/><path d="M13 8l-2 4 2 2v6M13 12l3 1M11 12l-2 5M11 12V9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    refresh: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0114-5l2 2M20 12a8 8 0 01-14 5l-2-2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/><path d="M20 4v5h-5M4 20v-5h5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    trophy: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 01-10 0V4zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M10 14v3M14 14v3M8 20h8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    briefcase: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth={sw}/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth={sw}/></svg>),
    medal: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="14" r="6" stroke={color} strokeWidth={sw}/><path d="M9 8L7 3h10l-2 5" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M12 11.5l1 2 2 .2-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 13.7l2-.2 1-2z" stroke={color} strokeWidth="1" strokeLinejoin="round"/></svg>),
    bank: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 9l9-5 9 5M5 9v8M9 9v8M15 9v8M19 9v8M3 20h18" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    fire: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3c1 3 4 4 4 8a4 4 0 01-8 0c0-1 .5-2 1-2.5C8 11 7 13 7 15a5 5 0 0010 0c0-5-4-7-5-12z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    lock: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke={color} strokeWidth={sw}/><path d="M8 10V7a4 4 0 018 0v3" stroke={color} strokeWidth={sw}/></svg>),
    lock_open: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke={color} strokeWidth={sw}/><path d="M8 10V7a4 4 0 017-2.5" stroke={color} strokeWidth={sw}/></svg>),
    seat: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 4a1.5 1.5 0 011.5 1.5V13H15a1.5 1.5 0 010 3H7.5A2 2 0 015.5 14V5.5A1.5 1.5 0 017 4z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><path d="M6 16v3M16 16v3" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    co2: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="7" cy="13" r="4" stroke={color} strokeWidth={sw}/><circle cx="16" cy="11" r="3" stroke={color} strokeWidth={sw}/><path d="M3 19h18" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.5"/></svg>),
    calendar: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth={sw}/><path d="M4 10h16M9 3v4M15 3v4" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    download: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    upload: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 15V4M7 9l5-5 5 5M5 20h14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    bag: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="5" y="7" width="14" height="13" rx="2" stroke={color} strokeWidth={sw}/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M9 11v5M15 11v5" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    food: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 21V3c-2 1-3 4-3 7h3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>),
    camera: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 8h3l2-3h6l2 3h3v11H4z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/><circle cx="12" cy="13" r="3.5" stroke={color} strokeWidth={sw}/></svg>),
    image: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={sw}/><circle cx="9" cy="10" r="1.8" stroke={color} strokeWidth={sw}/><path d="M3 17l5-4 4 3 3-2 6 4" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    users: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke={color} strokeWidth={sw}/><path d="M3 19c0-3 3-5 6-5s6 2 6 5" stroke={color} strokeWidth={sw} strokeLinecap="round"/><circle cx="17" cy="9" r="2.3" stroke={color} strokeWidth={sw}/><path d="M17 14c2.5 0 4 1.6 4 4" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    chart: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 20h16M7 16v-5M12 16V6M17 16v-8" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    gear: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw}/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    heart: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    heartFill: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill={color} stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    wind: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 9h11a3 3 0 10-3-3M3 15h15a3 3 0 11-3 3M3 12h7" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    map: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14M15 6v14" stroke={color} strokeWidth={sw} strokeLinejoin="round"/></svg>),
    info: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw}/><path d="M12 11v6M12 7.5v.5" stroke={color} strokeWidth={sw} strokeLinecap="round"/></svg>),
    share: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="2.5" stroke={color} strokeWidth={sw}/><circle cx="6" cy="12" r="2.5" stroke={color} strokeWidth={sw}/><circle cx="18" cy="19" r="2.5" stroke={color} strokeWidth={sw}/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" stroke={color} strokeWidth={sw}/></svg>),
    more: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.8" fill={color}/><circle cx="12" cy="12" r="1.8" fill={color}/><circle cx="19" cy="12" r="1.8" fill={color}/></svg>),
    radar: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw} opacity="0.5"/><circle cx="12" cy="12" r="5" stroke={color} strokeWidth={sw} opacity="0.5"/><path d="M12 12l6-6" stroke={color} strokeWidth={sw} strokeLinecap="round"/><circle cx="12" cy="12" r="1.3" fill={color}/></svg>),
  };
  return icons[id] || null;
}

function CancellationAlert({ flight, simulated, onDismiss, onAction, onShare }) {
  const [expanded, setExpanded] = useState(true);
  if (!expanded) return null;
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:80, maxWidth:480, margin:"0 auto" }}>
      <div style={{ background:"linear-gradient(135deg,#ff3a54,#cc0022)", padding:"14px 16px", boxShadow:"0 4px 20px rgba(255,58,84,0.4)" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
          <StatIcon id="alert" color="#fff" size={24}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#fff", marginBottom:3 }}>Flight Cancelled!</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:2 }}>{flight.iata} · {flight.dep} → {flight.arr}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{flight.date} · {simulated?"Simulated scenario (demo)":"Reported by live flight data. Confirm with the airline."}</div>
          </div>
          <div onClick={()=>{ setExpanded(false); if (onDismiss) onDismiss(); }} style={{ fontSize:18, color:"rgba(255,255,255,0.7)", cursor:"pointer", flexShrink:0 }}>✕</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={onAction} style={{ flex:1, background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:11, padding:"10px 0", textAlign:"center", cursor:"pointer" }}>
            <span style={{ fontSize:13, fontWeight:800, color:"#fff" }}>Find Alternatives →</span>
          </div>
          <div onClick={onShare} style={{ flex:1, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:11, padding:"10px 0", textAlign:"center", cursor:"pointer" }}>
            <span style={{ fontSize:13, fontWeight:800, color:"#fff" }}>Tell Family</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CancellationScreen({ onBack, liveOn }) {
  const [notifications, setNotifications] = useState([true, true, true]);
  const history = [
    { id:"c1", iata:"AA 100", dep:"MIA", arr:"JFK", date:"Example flight", detectedAt:"6 hours before departure", notifiedAt:"Never — airline did not notify", rebookedOn:"AA 102", savings:"Caught early — rebooking saved $340" },
    { id:"c2", iata:"DL 200", dep:"ATL", arr:"LAX", date:"Example flight", detectedAt:"3 hours before departure", notifiedAt:"1 hour before departure", rebookedOn:"DL 202", savings:"Detected 2hrs before airline alert" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Cancellation Tracker</div>
          <div style={{ fontSize:12, color:C.soft }}>{liveOn?"Watching your flights for cancellations":"Live data is off: watching your booking only"}</div>
        </div>
        <div style={{ background:"rgba(255,58,84,0.1)", border:"1px solid rgba(255,58,84,0.3)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, color:C.red, fontFamily:C.mono }}>{liveOn?"LIVE":"OFF"}</div>
      </div>
      <div style={{ padding:"16px 16px 100px" }}>
        <div style={{ background:"rgba(0,200,240,0.06)", borderRadius:16, border:"1px solid rgba(0,200,240,0.2)", padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.accent, marginBottom:10, display:"flex", alignItems:"center", gap:7 }}><StatIcon id="bolt" color={C.accent} size={16}/> How My Runway Detects Cancellations</div>
          {[["search","While the app is open we re-check your flights every 5 minutes through the /api/flight proxy (FlightAware, AeroDataBox, AviationStack)"],["satellite","If any source reports a cancellation, the flight card turns red and you get a banner with next steps"],["hourglass","Flight-data feeds often update before the airline's email arrives, but always confirm with the airline"],["bell","SMS, push and email delivery need a backend and are planned, not live yet"]].map(([icon,text],i)=>(
            <div key={i} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
              <span style={{ flexShrink:0, marginTop:1 }}><StatIcon id={icon} color={C.accent} size={16}/></span>
              <div style={{ fontSize:12, color:C.soft, lineHeight:1.5 }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:12, display:"flex", alignItems:"center", gap:7 }}><StatIcon id="bell" color={C.text} size={16}/> Alert Settings</div>
          {[["phone","SMS Text Message","Instant text to your phone"],["email","Email","Full cancellation details + alternatives"],["bell","Push Notification","App notification on your device"]].map(([icon,title,desc],i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<2?`1px solid ${C.border}`:"none" }}>
              <StatIcon id={icon} color={C.soft} size={20}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{title}</div>
                <div style={{ fontSize:11, color:C.muted }}>{desc}</div>
              </div>
              <div onClick={()=>setNotifications(n=>{ const c=[...n]; c[i]=!c[i]; return c; })} style={{ width:44, height:26, borderRadius:13, background:notifications[i]?C.red:"#2a3f5f", position:"relative", cursor:"pointer", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:notifications[i]?21:3, transition:"left 0.2s" }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:12 }}>EXAMPLES: HOW AN ALERT LOOKS</div>
        {history.map(c=>(
          <div key={c.id} style={{ background:C.card, borderRadius:16, border:"1px solid rgba(255,58,84,0.2)", padding:"14px 16px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <StatIcon id="warning" color={C.red} size={24}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.text, fontFamily:C.mono }}>{c.iata}</div>
                <div style={{ fontSize:12, color:C.soft }}>{c.dep} → {c.arr} · {c.date}</div>
              </div>
              <div style={{ background:"rgba(255,58,84,0.1)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:20, padding:"3px 10px", fontSize:10, color:C.red, fontWeight:700, fontFamily:C.mono }}>Cancelled</div>
            </div>
            {[["Detected by My Runway", c.detectedAt],["Airline notified you", c.notifiedAt],["Rebooked onto", c.rebookedOn]].map(([label,val])=>(
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderTop:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.soft }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{val}</span>
              </div>
            ))}
            <div style={{ background:"rgba(0,232,122,0.07)", borderRadius:10, padding:"9px 12px", marginTop:10, border:"1px solid rgba(0,232,122,0.2)", display:"flex", alignItems:"center", gap:7 }}>
              <StatIcon id="money" color={C.green} size={15}/><span style={{ fontSize:12, color:C.green, fontWeight:600 }}>{c.savings}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FamilyScreen() {
  const [sel, setSel] = useState(null);
  const [people] = useState([
    { name:"Mom", initials:"M", color:"#a78bfa", flight:"DL 204", dep:"ATL", arr:"JFK", status:"On Time", eta:"4:20 PM" },
    { name:"Jake", initials:"J", color:"#00e87a", flight:"SW 881", dep:"ORD", arr:"LAX", status:"Departed", eta:"3:15 PM" },
    { name:"Sarah", initials:"S", color:"#ff5c2b", flight:"BA 178", dep:"LHR", arr:"JFK", status:"Delayed", eta:"8:00 PM" },
  ]);
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>Sample family members (demo data).</div>
      <div onClick={()=>notify("Adding family members is coming soon")} style={{ display:"flex", alignItems:"center", gap:12, background:C.card, borderRadius:16, border:`1px dashed ${C.border}`, padding:"16px", marginBottom:14, cursor:"pointer" }}>
        <div style={{ width:46, height:46, borderRadius:23, background:C.surface, border:`2px dashed ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:C.soft }}>+</div>
        <div><div style={{ fontSize:15, fontWeight:700, color:C.soft }}>Add family member</div><div style={{ fontSize:13, color:C.muted }}>Track their flights alongside yours</div></div>
      </div>
      {people.map((p,i)=>{ const s=sc(p.status); const isSel=sel===i; return (
        <div key={i} onClick={()=>setSel(isSel?null:i)} style={{ background:C.card, borderRadius:18, border:`1px solid ${isSel?p.color+"55":C.border}`, padding:"16px", marginBottom:10, cursor:"pointer" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:isSel?14:0 }}>
            <div style={{ width:50, height:50, borderRadius:25, background:`${p.color}22`, border:`2px solid ${p.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:p.color, fontFamily:C.mono, flexShrink:0 }}>{p.initials}</div>
            <div style={{ flex:1 }}><div style={{ fontSize:17, fontWeight:800, color:C.text }}>{p.name}</div><div style={{ fontSize:13, color:C.soft, fontFamily:C.mono }}>{p.flight} · {p.dep} → {p.arr}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ background:s.bg, border:`1px solid ${s.br}`, borderRadius:20, padding:"4px 11px", fontSize:11, color:s.c, fontWeight:700, fontFamily:C.mono, marginBottom:4 }}>{p.status}</div><div style={{ fontSize:12, color:C.muted }}>ETA {p.eta}</div></div>
          </div>
          {isSel&&(
            <div style={{ display:"flex", gap:8 }}>
              <div onClick={e=>{e.stopPropagation();notify(`Live links for ${p.name} need a shared trip link, which is coming soon`);}} style={{ flex:1, background:"rgba(0,200,240,0.08)", border:"1px solid rgba(0,200,240,0.2)", borderRadius:11, padding:"13px 0", textAlign:"center", cursor:"pointer" }}><span style={{ fontSize:14, fontWeight:700, color:C.accent }}>Send Live Link</span></div>
              <div onClick={e=>{e.stopPropagation();window.open(navUrl(NAV_APPS[0], airport(p.arr)), "_blank", "noopener");}} style={{ flex:1, background:"rgba(0,232,122,0.08)", border:"1px solid rgba(0,232,122,0.2)", borderRadius:11, padding:"13px 0", textAlign:"center", cursor:"pointer" }}><span style={{ fontSize:14, fontWeight:700, color:C.green }}>Pickup Route</span></div>
            </div>
          )}
        </div>
      );})}
    </div>
  );
}

function PassportScreen() {
  const p = { miles:124580, flights:47, airports:23, countries:8, streak:3, airline:"American Airlines", badges:["x Globe Trotter","x Jet Setter","x Connection Pro","x Early Bird"] };
  const allBadges = [...p.badges, "x Century Club","x Road Warrior","x Night Owl","x First Class","x Mountain Explorer"];
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ background:"linear-gradient(135deg,rgba(0,200,240,0.1),rgba(255,92,43,0.06))", borderRadius:20, border:"1px solid rgba(0,200,240,0.2)", padding:"24px 18px", marginBottom:14, textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.soft, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:6 }}>LIFETIME MILES</div>
        <div style={{ fontFamily:C.display, fontSize:58, color:C.accent, letterSpacing:4, lineHeight:1, marginBottom:6 }}>{p.miles.toLocaleString()}</div>
        <div style={{ fontSize:14, color:C.soft, display:"inline-flex", alignItems:"center", gap:6, justifyContent:"center" }}>{Math.round(p.miles/24902)}× around the Earth <StatIcon id="globe" color={C.soft} size={15}/></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[["plane","Flights",p.flights],["bank","Airports",p.airports],["globe","Countries",p.countries],["fire","Streak",`${p.streak} trips`]].map(([icon,label,val])=>(
          <div key={label} style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"18px", textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><StatIcon id={icon} color={C.accent} size={26}/></div>
            <div style={{ fontFamily:C.display, fontSize:36, color:C.text, lineHeight:1, marginBottom:4 }}>{val}</div>
            <div style={{ fontSize:11, color:C.soft, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600 }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px" }}>
        <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:12 }}>ACHIEVEMENTS</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {p.badges.map(b=><div key={b} style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:20, padding:"7px 14px", fontSize:13, color:C.purple, fontWeight:600 }}>{b.split(" ").slice(1).join(" ")}</div>)}
          {allBadges.slice(p.badges.length).map(b=><div key={b} style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"7px 14px", fontSize:13, color:C.muted, opacity:0.5 }}><StatIcon id="lock" color={C.muted} size={12}/> {b.split(" ").slice(1).join(" ")}</div>)}
        </div>
      </div>
    </div>
  );
}

function WalletScreen() {
  const [active, setActive] = useState(0);
  const passes = [
    { id:"p1", airline:"El Al", code:"LY", flight:"LY 018", dep:"MIA", arr:"TLV", date:"Sun Jun 14", time:"2:30 PM", gate:"TBD", seat:"32A", boarding:"1:45 PM", group:"4", name:"SADOK/ASAF", conf:"8ZEH6P", color:"#003399" },
    { id:"p2", airline:"El Al", code:"LY", flight:"LY 347", dep:"TLV", arr:"ZRH", date:"Thu Jul 2", time:"8:00 AM", gate:"TBD", seat:"18C", boarding:"7:15 AM", group:"3", name:"SADOK/ASAF", conf:"8ZEH6P", color:"#003399" },
    { id:"p3", airline:"Swiss", code:"LX", flight:"LX 064", dep:"ZRH", arr:"MIA", date:"Thu Jul 2", time:"1:00 PM", gate:"TBD", seat:"24F", boarding:"12:15 PM", group:"2", name:"SADOK/ASAF", conf:"8ZEH6P", color:"#d52b1e" },
  ];
  const p = passes[active];
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ fontSize:13, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:12 }}>MOBILE BOARDING PASSES</div>
      <div style={{ fontSize:11, color:C.soft, marginBottom:12, lineHeight:1.5, display:"flex", gap:6 }}><StatIcon id="info" color={C.soft} size={14}/><span>Sample passes (seats and barcode are placeholders, not valid for boarding). Real passes come from El Al and SWISS after check-in.</span></div>
      <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto" }}>
        {passes.map((pass,i)=>(<div key={pass.id} onClick={()=>setActive(i)} style={{ flexShrink:0, background:i===active?C.card:C.surface, border:`1px solid ${i===active?C.accent:C.border}`, borderRadius:10, padding:"8px 12px", cursor:"pointer" }}><div style={{ fontSize:12, fontWeight:800, color:i===active?C.accent:C.soft, fontFamily:C.mono }}>{pass.flight}</div><div style={{ fontSize:10, color:C.muted }}>{pass.dep}→{pass.arr}</div></div>))}
      </div>
      <div style={{ background:"#fff", borderRadius:20, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
        <div style={{ background:p.color, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,0.04) 8px,rgba(255,255,255,0.04) 9px)", pointerEvents:"none" }}/>
          <div style={{ color:"#fff", fontSize:18, fontWeight:700, fontFamily:"Georgia,serif", fontStyle:"italic", letterSpacing:1 }}>{p.airline}</div>
          <div style={{ color:"rgba(255,255,255,0.9)", fontSize:12, fontFamily:"'Courier New',monospace", letterSpacing:2 }}>{p.flight}</div>
        </div>
        <div style={{ padding:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:36, fontWeight:800, color:"#111", fontFamily:C.mono, lineHeight:1 }}>{p.dep}</div><div style={{ fontSize:12, color:"#888", marginTop:4 }}>{p.time}</div></div>
            <div style={{ flex:1, padding:"0 16px", textAlign:"center" }}><div style={{ display:"flex", justifyContent:"center" }}><StatIcon id="plane" color="#888" size={20}/></div><div style={{ height:2, background:"#ddd", margin:"4px 0" }}/><div style={{ fontSize:11, color:"#aaa" }}>{p.date}</div></div>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:36, fontWeight:800, color:"#111", fontFamily:C.mono, lineHeight:1 }}>{p.arr}</div><div style={{ fontSize:12, color:"#888", marginTop:4 }}>Arrival</div></div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 0", borderTop:"1px dashed #ddd", borderBottom:"1px dashed #ddd", marginBottom:16 }}>
            {[["PASSENGER",p.name],["SEAT",p.seat],["GROUP",p.group]].map(([l,v])=>(<div key={l}><div style={{ fontSize:9, color:"#aaa", fontFamily:C.mono, marginBottom:2 }}>{l}</div><div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{v}</div></div>))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            {[["GATE",p.gate],["BOARDS",p.boarding],["CONF",p.conf]].map(([l,v])=>(<div key={l}><div style={{ fontSize:9, color:"#aaa", fontFamily:C.mono, marginBottom:2 }}>{l}</div><div style={{ fontSize:13, fontWeight:700, color:"#111", fontFamily:C.mono }}>{v}</div></div>))}
          </div>
          <div style={{ background:"#fff", borderRadius:10, padding:"12px", display:"flex", justifyContent:"center" }}>
            <div style={{ display:"flex", gap:1.5, alignItems:"flex-end", height:60 }}>{Array.from({length:48}).map((_,i)=>(<div key={i} style={{ width:i%4===0?3:2, height:"100%", background:(i*7%3===0||i%5===0)?"#111":"#fff" }}/>))}</div>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <div onClick={()=>notify("Add the real pass from the airline app or check-in email")} style={{ flex:1, background:"#000", border:"1px solid #333", borderRadius:12, padding:"13px 0", textAlign:"center", cursor:"pointer" }}><span style={{ fontSize:13, fontWeight:700, color:"#fff" }}> Apple Wallet</span></div>
        <div onClick={()=>notify("Add the real pass from the airline app or check-in email")} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 0", textAlign:"center", cursor:"pointer" }}><span style={{ fontSize:13, fontWeight:700, color:C.text }}>Google Wallet</span></div>
      </div>
    </div>
  );
}

function LoungeScreen() {
  const [airport, setAirport] = useState("MIA");
  const airports = ["MIA","TLV","ZRH"];
  const data = {
    MIA:[{ name:"American Airlines Admirals Club", terminal:"Concourse D, near D15", access:[["Priority Pass",false],["AA membership",true],["Day pass $79",null]], hours:"5:00 AM – 9:00 PM", amenities:["Wi-Fi","Showers","Hot food"], rating:4.2 },{ name:"Amex Centurion Lounge", terminal:"Concourse D, near D12", access:[["Amex Platinum",true],["Day pass",false]], hours:"5:00 AM – 10:00 PM", amenities:["Premium dining","Cocktails","Spa"], rating:4.7 }],
    TLV:[{ name:"El Al King David Lounge", terminal:"Terminal 3, Concourse C", access:[["El Al Matmid",true],["Business class",true]], hours:"24 hours", amenities:["Kosher dining","Showers","Wi-Fi"], rating:4.5 },{ name:"Dan Lounge", terminal:"Terminal 3, Level 3", access:[["Priority Pass",true],["Day pass $45",null]], hours:"24 hours", amenities:["Buffet","Bar","Kids area"], rating:4.1 }],
    ZRH:[{ name:"Swiss Senator Lounge", terminal:"Airside E", access:[["Star Alliance Gold",true],["Swiss Business",true]], hours:"5:30 AM – 10:00 PM", amenities:["Fine dining","Whisky bar","Terrace"], rating:4.6 },{ name:"Aspire Lounge", terminal:"Airside E, Gate E45", access:[["Priority Pass",true],["Day pass CHF 55",null]], hours:"6:00 AM – 9:00 PM", amenities:["Wi-Fi","Snacks","Bar"], rating:4.0 }],
  };
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:12, borderBottom:`1px solid ${C.border}`, paddingBottom:8 }}>VIP LOUNGE FINDER · LISTINGS ARE INDICATIVE, CHECK THE LOUNGE BEFORE YOU GO</div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {airports.map(a=>(<div key={a} onClick={()=>setAirport(a)} style={{ flex:1, background:a===airport?`linear-gradient(135deg,${C.accent},#007aaa)`:C.surface, border:`1px solid ${a===airport?C.accent:C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}><div style={{ fontSize:18, fontWeight:800, color:a===airport?"#000":C.text, fontFamily:C.mono }}>{a}</div><div style={{ fontSize:9, color:a===airport?"#003355":C.muted }}>{a==="MIA"?"Miami":a==="TLV"?"Tel Aviv":"Zurich"}</div></div>))}
      </div>
      {data[airport].map((l,i)=>(
        <div key={i} style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, padding:16, marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 3h12L12 11 6 3z" stroke={C.accent} strokeWidth="1.5" strokeLinejoin="round" fill="none"/><line x1="12" y1="11" x2="12" y2="19" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="19" x2="16" y2="19" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:2 }}>{l.name}</div><div style={{ fontSize:11, color:C.soft, display:"flex", alignItems:"center", gap:4 }}><StatIcon id="pin" color={C.soft} size={11}/>{l.terminal}</div></div>
            <div style={{ background:"rgba(0,232,122,0.1)", border:"1px solid rgba(0,232,122,0.25)", borderRadius:8, padding:"3px 8px", display:"flex", alignItems:"center", gap:3 }}><StatIcon id="star" color={C.green} size={12}/><span style={{ fontSize:11, color:C.green, fontWeight:700, fontFamily:C.mono }}>{l.rating}</span></div>
          </div>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:6 }}>ACCESS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>{l.access.map(([label,ok],j)=>(<span key={j} style={{ display:"inline-flex", alignItems:"center", gap:4, background:ok?"rgba(0,232,122,0.08)":C.surface, border:`1px solid ${ok?"rgba(0,232,122,0.25)":C.border}`, borderRadius:7, padding:"4px 9px", fontSize:11, color:ok?C.green:ok===false?C.muted:C.soft, textDecoration:ok===false?"line-through":"none" }}>{ok!==null&&<StatIcon id={ok?"check":"cross"} color={ok?C.green:C.muted} size={11}/>}{label}</span>))}</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:`1px solid ${C.border}` }}><div style={{ fontSize:11, color:C.soft, display:"flex", alignItems:"center", gap:4 }}><StatIcon id="clock" color={C.soft} size={11}/>{l.hours}</div><div style={{ display:"flex", gap:5 }}>{l.amenities.slice(0,3).map((a,k)=>(<span key={k} style={{ fontSize:10, color:C.muted }}>{a}{k<2?" ·":""}</span>))}</div></div>
        </div>
      ))}
    </div>
  );
}

function SeatTrackerScreen({ onBack }) {
  const flights = [{ iata:"LY 018", dep:"MIA", arr:"TLV", date:"Jun 14", seats:["32A","32B","32C"] },{ iata:"LY 347", dep:"TLV", arr:"ZRH", date:"Jul 2", seats:["18C","18D"] }];
  const wishlist = [
    { seat:"12A", cls:"Economy", type:"Window", desc:"Exit row — extra legroom", available:false, price:"Free" },
    { seat:"14C", cls:"Economy", type:"Aisle", desc:"Near front, quick exit", available:true, price:"Free" },
    { seat:"2A", cls:"Business", type:"Window", desc:"Lie-flat bed", available:false, price:"+$1,200" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:55, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ flex:1 }}><div style={{ fontSize:16, fontWeight:800, color:C.text }}>Seat Tracker</div><div style={{ fontSize:12, color:C.soft }}>We watch for better seats and alert you</div></div>
        <div style={{ background:"rgba(0,232,122,0.1)", border:"1px solid rgba(0,232,122,0.25)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, color:C.green, fontFamily:C.mono }}>WATCHING</div>
      </div>
      <div style={{ padding:"16px 16px 100px" }}>
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>YOUR CURRENT SEATS</div>
        {flights.map(f=>(
          <div key={f.iata} style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div><div style={{ fontSize:14, fontWeight:800, color:C.text, fontFamily:C.mono }}>{f.iata}</div><div style={{ fontSize:11, color:C.soft }}>{f.dep} → {f.arr} · {f.date}</div></div>
              <div style={{ display:"flex", gap:5 }}>{f.seats.map(s=>(<div key={s} style={{ background:"rgba(0,200,240,0.1)", border:"1px solid rgba(0,200,240,0.3)", borderRadius:8, padding:"5px 9px", fontSize:12, fontWeight:800, color:C.accent, fontFamily:C.mono }}>{s}</div>))}</div>
            </div>
          </div>
        ))}
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10, marginTop:20 }}>WATCHING FOR BETTER SEATS</div>
        {wishlist.map((s,i)=>(
          <div key={i} style={{ background:C.card, borderRadius:14, border:`1px solid ${s.available?"rgba(0,232,122,0.3)":C.border}`, padding:"14px 16px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:s.available?"rgba(0,232,122,0.12)":"rgba(255,255,255,0.05)", border:`2px solid ${s.available?"rgba(0,232,122,0.4)":C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ fontFamily:C.mono, fontSize:14, fontWeight:800, color:s.available?C.green:C.soft }}>{s.seat}</div></div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}><span style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.type} · {s.cls}</span>{s.available&&<span style={{ background:"rgba(0,232,122,0.12)", border:"1px solid rgba(0,232,122,0.3)", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:800, color:C.green, fontFamily:C.mono }}>OPEN NOW!</span>}</div>
                <div style={{ fontSize:12, color:C.soft, marginBottom:2 }}>{s.desc}</div>
                <div style={{ fontSize:12, color:s.price==="Free"?C.green:C.yellow, fontWeight:700 }}>{s.price}</div>
              </div>
              {s.available ? <div onClick={()=>notify(`Seat requests go through the airline. Open "Manage booking" and pick ${s.seat}`)} style={{ background:`linear-gradient(135deg,${C.green},#007a44)`, borderRadius:11, padding:"10px 14px", cursor:"pointer", flexShrink:0 }}><span style={{ fontSize:12, fontWeight:800, color:"#000" }}>Grab It →</span></div> : <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"10px 12px", flexShrink:0 }}><span style={{ fontSize:11, color:C.muted, display:"inline-flex", alignItems:"center", gap:4 }}>Watching <StatIcon id="eye" color={C.muted} size={12}/></span></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VintageIcon({ id, size=26, color="#7a9ab8" }) {
  const icons = {
    flights: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill={color}/></svg>),
    wallet: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8"/><path d="M2 9h20M16 14h2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="14" r="1" fill={color}/></svg>),
    lounges: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 3h12L12 11 6 3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill="none"/><line x1="12" y1="11" x2="12" y2="19" stroke={color} strokeWidth="1.6" strokeLinecap="round"/><line x1="8" y1="19" x2="16" y2="19" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></svg>),
    passport: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5"/><path d="M8 17h8M9 14h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>),
    more: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.8" fill={color}/><circle cx="12" cy="12" r="1.8" fill={color}/><circle cx="19" cy="12" r="1.8" fill={color}/></svg>),
  };
  return icons[id] || null;
}

function BottomNav({ active, onNav }) {
  const tabs = [{ id:"flights", label:"Flights" },{ id:"wallet", label:"Wallet" },{ id:"lounges", label:"Lounges" },{ id:"passport", label:"Passport" }];
  return (
    <nav data-testid="bottom-nav" aria-label="Main" className="mr-glass" style={{ position:"fixed", bottom:0, left:0, right:0, background:C.glass, borderTop:`0.5px solid ${C.border}`, zIndex:20 }}>
      <div style={{ display:"flex", padding:"6px 8px calc(8px + env(safe-area-inset-bottom))", maxWidth:480, margin:"0 auto" }}>
        {tabs.map(t=>(<button type="button" key={t.id} data-testid={`tab-${t.id}`} aria-current={active===t.id?"page":undefined} onClick={()=>onNav(t.id)} style={{ flex:1, minHeight:48, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", padding:"4px 0", background:"none", border:"none", font:"inherit" }}><VintageIcon id={t.id} size={24} color={active===t.id?C.accent:C.muted}/><span style={{ fontSize:10, fontWeight:600, color:active===t.id?C.accent:C.muted }}>{t.label}</span></button>))}
      </div>
    </nav>
  );
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [navPick, setNavPick] = useState(null);
  const slides = [
    { title:"Never Miss a Change", body:"We check your flights every 15 minutes across 3 data sources and alert you the instant anything changes — often before the airline does." },
    { title:"Know Before You Go", body:"We track the incoming aircraft that becomes your flight, so you get the earliest possible warning if a delay is coming your way." },
    { title:"Leave at the Right Time", body:"My Runway calculates exactly when to leave home based on live traffic, your airport, and your flight." },
    { title:"Share with Anyone", body:"Send a live tracking link to whoever's picking you up. They see your flight in real time — no app needed." },
  ];
  const setupStep = slides.length;        // the nav-app picker comes after the slides
  const onSlides = step < slides.length;
  const s = onSlides ? slides[step] : null;

  // ── Navigation-app setup screen ──
  if (step === setupStep) {
    return (
      <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:90, display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto" }}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px", textAlign:"center" }}>
          <div style={{ marginBottom:36 }}><MyRunwayBadge variant="full" size={120}/></div>
          <div style={{ animation:"fadeUp 0.4s ease", width:"100%" }}>
            <div style={{ fontFamily:C.display, fontSize:26, fontWeight:400, fontStyle:"italic", color:C.text, marginBottom:12 }}>One quick thing</div>
            <div style={{ fontSize:15, color:C.soft, lineHeight:1.6, maxWidth:320, margin:"0 auto 24px" }}>How do you usually get to the airport? We'll open the right app when it's time to leave.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:340, margin:"0 auto" }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1, textAlign:"left", marginBottom:1 }}>DRIVING</div>
              {NAV_APPS.map((a,i)=>a.mode==="drive"&&(
                <div key={a.id} onClick={()=>setNavPick(i)} style={{ display:"flex", alignItems:"center", gap:12, background:navPick===i?`${a.color}18`:C.card, border:`2px solid ${navPick===i?a.color:C.border}`, borderRadius:12, padding:"11px 16px", cursor:"pointer", transition:"all 0.15s" }}>
                  <NavLogo app={a} size={26}/>
                  <span style={{ flex:1, textAlign:"left", fontSize:15, fontWeight:700, color:navPick===i?a.color:C.text }}>{a.label}</span>
                  <div style={{ width:20, height:20, borderRadius:10, border:`2px solid ${navPick===i?a.color:C.border}`, background:navPick===i?a.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>{navPick===i&&<span style={{ fontSize:12, color:"#000", fontWeight:900 }}>✓</span>}</div>
                </div>
              ))}
              <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:1, textAlign:"left", margin:"6px 0 1px" }}>PUBLIC TRANSIT</div>
              {NAV_APPS.map((a,i)=>a.mode==="transit"&&(
                <div key={a.id} onClick={()=>setNavPick(i)} style={{ display:"flex", alignItems:"center", gap:12, background:navPick===i?`${a.color}18`:C.card, border:`2px solid ${navPick===i?a.color:C.border}`, borderRadius:12, padding:"11px 16px", cursor:"pointer", transition:"all 0.15s" }}>
                  <NavLogo app={a} size={26}/>
                  <span style={{ flex:1, textAlign:"left", fontSize:15, fontWeight:700, color:navPick===i?a.color:C.text }}>{a.label}</span>
                  <div style={{ width:20, height:20, borderRadius:10, border:`2px solid ${navPick===i?a.color:C.border}`, background:navPick===i?a.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>{navPick===i&&<span style={{ fontSize:12, color:"#000", fontWeight:900 }}>✓</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding:"0 32px 40px" }}>
          <div onClick={()=>navPick!==null&&onDone(navPick)} style={{ background:navPick!==null?`linear-gradient(135deg,${C.accent},#007aaa)`:C.surface, border:navPick!==null?"none":`1px solid ${C.border}`, borderRadius:14, padding:"16px 0", textAlign:"center", fontWeight:800, fontSize:16, color:navPick!==null?"#000":C.muted, cursor:navPick!==null?"pointer":"default", transition:"all 0.2s" }}>Get Started →</div>
          <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:C.muted }}>You can change this anytime in Settings</div>
        </div>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:90, display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px", textAlign:"center" }}>
        <div style={{ marginBottom:44 }}><MyRunwayBadge variant="full" size={180}/></div>
        <div key={step} style={{ animation:"fadeUp 0.4s ease" }}>
          <div style={{ fontFamily:C.display, fontSize:26, fontWeight:400, fontStyle:"italic", color:C.text, marginBottom:14 }}>{s.title}</div>
          <div style={{ fontSize:15, color:C.soft, lineHeight:1.6, maxWidth:320, margin:"0 auto" }}>{s.body}</div>
        </div>
      </div>
      <div style={{ padding:"0 32px 40px" }}>
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:28 }}>{slides.map((_,i)=>(<div key={i} style={{ width:i===step?24:8, height:8, borderRadius:4, background:i===step?C.accent:C.border, transition:"all 0.3s" }}/>))}</div>
        <div onClick={()=>setStep(step+1)} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"16px 0", textAlign:"center", fontWeight:800, fontSize:16, color:"#000", cursor:"pointer" }}>Next</div>
        <div onClick={()=>setStep(setupStep)} style={{ textAlign:"center", marginTop:16, fontSize:14, color:C.muted, cursor:"pointer" }}>Skip</div>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function CorporatePricingPage({ onBack }) {
  const [seats, setSeats] = useState(5);
  const tier = seats <= 5
    ? { name:"Starter", price:9, color:C.accent, desc:"Perfect for small teams" }
    : seats <= 10
    ? { name:"Growth", price:7, color:C.green, desc:"Best for growing teams" }
    : { name:"Enterprise", price:6, color:C.purple, desc:"Unlimited scale + dedicated support" };
  const monthly = seats * tier.price;
  const annual = monthly * 12;
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Corporate Pricing</div>
          <div style={{ fontSize:12, color:C.soft }}>Billed annually · cancel anytime</div>
        </div>
      </div>
      <div style={{ padding:"20px 16px 100px" }}>

        {/* Tier cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
          {[
            { name:"Starter", range:"1–5 seats", price:9, color:C.accent, features:["Up to 5 employees","Flight tracking & alerts","Corporate dashboard","CSV export","Email support"] },
            { name:"Growth", range:"6–10 seats", price:7, color:C.green, features:["Up to 10 employees","Everything in Starter","Receipt capture & expense AI","Spend policy controls","Priority support","Savings rewards program"] },
            { name:"Enterprise", range:"11+ seats", price:6, color:C.purple, features:["Unlimited employees","Everything in Growth","Dedicated account manager","SSO / SAML login","Custom spend policies","API access","SLA guarantee","Onboarding & training"] },
          ].map(t=>(
            <div key={t.name} style={{ background:seats<=(t.name==="Starter"?5:t.name==="Growth"?10:999)&&seats>=(t.name==="Starter"?1:t.name==="Growth"?6:11)?`${t.color}10`:C.card, borderRadius:18, border:`2px solid ${seats<=(t.name==="Starter"?5:t.name==="Growth"?10:999)&&seats>=(t.name==="Starter"?1:t.name==="Growth"?6:11)?t.color:C.border}`, padding:"16px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:t.color }}>{t.name}</div>
                  <div style={{ fontSize:12, color:C.soft }}>{t.range}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:28, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>${t.price}</div>
                  <div style={{ fontSize:11, color:C.soft }}>per seat/mo</div>
                </div>
              </div>
              {t.features.map(f=>(
                <div key={f} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                  <span style={{ fontSize:13, color:t.color }}>✓</span>
                  <span style={{ fontSize:13, color:C.text }}>{f}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Seat calculator */}
        <div style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, padding:"18px", marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:4 }}>Calculate your price</div>
          <div style={{ fontSize:12, color:C.soft, marginBottom:16 }}>Drag to set number of seats</div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <span style={{ fontSize:12, color:C.muted, fontFamily:C.mono, width:20 }}>1</span>
            <input type="range" min={1} max={50} value={seats} onChange={e=>setSeats(Number(e.target.value))}
              style={{ flex:1, accentColor:tier.color }}/>
            <span style={{ fontSize:12, color:C.muted, fontFamily:C.mono, width:20 }}>50</span>
          </div>
          <div style={{ background:C.surface, borderRadius:12, padding:"14px", border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:13, color:C.soft }}>{seats} seats × ${tier.price}/mo</span>
              <span style={{ fontSize:22, fontWeight:800, color:tier.color, fontFamily:C.mono }}>{tier.name}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
              <span style={{ fontSize:13, color:C.soft }}>Monthly total</span>
              <span style={{ fontSize:28, fontWeight:800, color:C.text, fontFamily:C.mono }}>${monthly}/mo</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginTop:4 }}>
              <span style={{ fontSize:12, color:C.muted }}>Billed annually</span>
              <span style={{ fontSize:14, color:C.muted, fontFamily:C.mono }}>${annual}/yr</span>
            </div>
          </div>
        </div>

        <div onClick={()=>notify("Our sales team will contact you within 24 hours to get your team set up!")} style={{ background:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:14, padding:"16px 0", textAlign:"center", fontWeight:800, fontSize:16, color:"#fff", cursor:"pointer", marginBottom:12 }}>
          Start Free Trial →
        </div>
        <div style={{ textAlign:"center", fontSize:12, color:C.muted }}>14-day free trial · no credit card required · cancel anytime</div>
      </div>
    </div>
  );
}

function PlansScreen() {
  const [showCorpPricing, setShowCorpPricing] = useState(false);
  if (showCorpPricing) return <CorporatePricingPage onBack={()=>setShowCorpPricing(false)}/>;
  const tiers = [
    { id:"free", name:"Free", price:"$0", period:"forever", color:C.soft, bg:"rgba(78,112,144,0.08)", border:"rgba(78,112,144,0.2)", tag:null,
      features:["Track up to 2 flights","Basic status updates","Leave-by time","Share 1 trip link"], missing:["Family tracking","Unlimited flights","Lounge finder","Priority support"],
      cta:"Current Plan", ctaStyle:{ background:C.surface, color:C.soft, border:`1px solid ${C.border}` } },
    { id:"pro", name:"Pro", price:"$19.99", period:"per year", color:C.accent, bg:"rgba(0,200,240,0.08)", border:"rgba(0,200,240,0.28)", tag:"MOST POPULAR",
      features:["Unlimited flight tracking","Family tracker (5 members)","Unlimited share links","VIP lounge finder","AI delay predictions","Weather alerts","Priority support"], missing:[],
      cta:"Upgrade to Pro →", ctaStyle:{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, color:"#000" } },
  ];
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      {tiers.map(t=>(
        <div key={t.id} style={{ background:t.bg, borderRadius:20, border:`2px solid ${t.border}`, padding:"20px 16px", marginBottom:16, position:"relative" }}>
          {t.tag&&<div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:t.color, borderRadius:20, padding:"4px 16px", fontSize:11, fontWeight:800, color:"#000", fontFamily:C.mono, letterSpacing:0.6, whiteSpace:"nowrap" }}>{t.tag}</div>}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, marginTop:t.tag?8:0 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:t.color, marginBottom:2 }}>{t.name}</div>
              <div style={{ fontSize:12, color:C.soft }}>Billed annually</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:36, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{t.price}</div>
              <div style={{ fontSize:12, color:C.soft }}>{t.period}</div>
            </div>
          </div>
          {t.features.map(f=><div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}><span style={{ fontSize:15, color:t.color }}>✓</span><span style={{ fontSize:14, color:C.text }}>{f}</span></div>)}
          {t.missing.map(f=><div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}><span style={{ fontSize:15, color:C.muted }}>✕</span><span style={{ fontSize:14, color:C.muted }}>{f}</span></div>)}
          <div onClick={()=>notify(t.id==="free"?"You're on the free plan!":"Opening checkout for Pro ($19.99/yr)...")}
            style={{ ...t.ctaStyle, borderRadius:13, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, cursor:"pointer", marginTop:18 }}>
            {t.cta}
          </div>
        </div>
      ))}

      {/* Corporate teaser */}
      <div style={{ background:"rgba(167,139,250,0.08)", borderRadius:20, border:"2px solid rgba(167,139,250,0.3)", padding:"20px 16px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:C.purple, marginBottom:2 }}>Corporate</div>
            <div style={{ fontSize:12, color:C.soft }}>For teams · billed annually</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:18, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>From $6</div>
            <div style={{ fontSize:12, color:C.soft }}>per seat/month</div>
          </div>
        </div>
        {["Team flight dashboard","Corporate expense tracking","AI receipt capture","Spend policy controls","SSO & admin controls"].map(f=>(
          <div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
            <span style={{ fontSize:15, color:C.purple }}>✓</span>
            <span style={{ fontSize:14, color:C.text }}>{f}</span>
          </div>
        ))}
        <div style={{ display:"flex", gap:8, marginTop:18 }}>
          <div onClick={()=>setShowCorpPricing(true)} style={{ flex:1, background:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:13, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:14, color:"#fff", cursor:"pointer" }}>
            See Corporate Plans →
          </div>
        </div>
        <div style={{ textAlign:"center", marginTop:10, fontSize:12, color:C.muted }}>Starter (1–5) · Growth (6–10) · Enterprise (11+)</div>
      </div>
    </div>
  );
}

function CorporateSettings({ onBack }) {
  const [companyName, setCompanyName] = useState("Acme Corp");
  const [managerEmail, setManagerEmail] = useState("manager@acme.com");
  const [alertDelays, setAlertDelays] = useState(true);
  const [alertCancels, setAlertCancels] = useState(true);
  const [alertGates, setAlertGates] = useState(false);
  const [saved, setSaved] = useState(false);
  function save() { setSaved(true); setTimeout(()=>{ setSaved(false); onBack(); }, 1500); }
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:55, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <span style={{ fontSize:16, fontWeight:800, color:C.text }}>Company Settings</span>
      </div>
      <div style={{ padding:"20px 16px 100px" }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>COMPANY NAME</div>
          <input value={companyName} onChange={e=>setCompanyName(e.target.value)} style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>SPEND POLICY LIMITS</div>
          <div style={{ fontSize:12, color:C.soft, marginBottom:10 }}>Set max spend per employee per trip</div>
          {[["Economy flights max","$800"],["Business class max","$2,500"],["Hotel per night max","$250"],["Meal per diem","$75"]].map(([label,def])=>(
            <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ flex:1, fontSize:13, color:C.text }}>{label}</div>
              <input defaultValue={def} style={{ width:80, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", color:C.text, fontSize:13, outline:"none", textAlign:"right", fontFamily:C.mono }} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>MANAGER ALERT EMAIL</div>
          <div style={{ fontSize:12, color:C.soft, marginBottom:8 }}>Flight alerts are sent to this address</div>
          <input value={managerEmail} onChange={e=>setManagerEmail(e.target.value)} style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:12 }}>ALERT TYPES</div>
          {[["alertDelays",alertDelays,setAlertDelays,"Flight Delays","Notify when an employee's flight is delayed"],
            ["alertCancels",alertCancels,setAlertCancels,"Cancellations","Immediate alert when a flight is cancelled"],
            ["alertGates",alertGates,setAlertGates,"Gate Changes","Notify when gate assignment changes"]].map(([key,val,setter,title,desc])=>(
            <div key={key} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:12, color:C.muted }}>{desc}</div>
              </div>
              <div onClick={()=>setter(v=>!v)} style={{ width:44, height:26, borderRadius:13, background:val?C.purple:"#2a3f5f", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:val?21:3, transition:"left 0.2s" }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:12 }}>TEAM MANAGEMENT</div>
          {[["email","Invite Team Members","Send invites via email"],["upload","Import from CSV","Bulk add employees with flight data"],["lock","SSO Configuration","Set up Google/Microsoft single sign-on"]].map(([icon,title,desc])=>(
            <div key={title} onClick={()=>notify(`${title}: Coming soon! This will be available in the Pro launch.`)} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", background:C.card, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:8, cursor:"pointer" }}>
              <span style={{ display:"flex", justifyContent:"center" }}><StatIcon id={icon} color={C.soft} size={20}/></span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{title}</div>
                <div style={{ fontSize:12, color:C.muted }}>{desc}</div>
              </div>
              <span style={{ fontSize:16, color:C.muted }}>›</span>
            </div>
          ))}
        </div>
        <div onClick={save} style={{ background:saved?C.green:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:14, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, color:"#fff", cursor:"pointer" }}>
          {saved?"Saved":"Save Settings"}
        </div>
      </div>
    </div>
  );
}

function CorporateDashboard({ onClose, corpRole="admin" }) {
  // corpRole: "admin" (boss) or "employee"
  const [tab, setTab] = useState("flights"); // "flights" | "expenses"
  const [filter, setFilter] = useState("all");
  const [selEmp, setSelEmp] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [teamVisible, setTeamVisible] = useState(false); // admin can toggle
  const isAdmin = corpRole === "admin";

  // ── Expense state ──────────────────────────────────────────────
  const initExpenses = [
    { id:"e1", merchant:"Cafe Madrid", category:"Meals", amount:"42.50", date:"Jun 14, 2026", status:"submitted", note:"Lunch before flight", emp:"Asaf Sadok" },
    { id:"e2", merchant:"Airport Taxi", category:"Transport", amount:"68.00", date:"Jun 14, 2026", status:"approved", note:"MIA to hotel", emp:"Asaf Sadok" },
    { id:"e3", merchant:"Hilton TLV", category:"Lodging", amount:"310.00", date:"Jun 15, 2026", status:"submitted", note:"1 night stay", emp:"Sarah Chen" },
    { id:"e4", merchant:"El Al Baggage", category:"Travel", amount:"120.00", date:"Jun 14, 2026", status:"draft", note:"Extra baggage fee", emp:"Asaf Sadok" },
  ];
  const [expenses, setExpenses] = useState(initExpenses);
  const [showAddExp, setShowAddExp] = useState(false);
  const [editExp, setEditExp] = useState(null);
  const [newExp, setNewExp] = useState({ merchant:"", category:"Meals", amount:"", date:"", note:"" });
  const categories = ["Meals","Transport","Lodging","Travel","Entertainment","Other"];

  const myExpenses = isAdmin ? expenses : expenses.filter(e=>e.emp==="Asaf Sadok");
  const totalMyExp = myExpenses.reduce((s,e)=>s+parseFloat(e.amount||0),0).toFixed(2);

  function saveExpense() {
    if (editExp) {
      setExpenses(ex=>ex.map(e=>e.id===editExp.id?{...e,...newExp}:e));
      setEditExp(null);
    } else {
      setExpenses(ex=>[...ex,{ id:"e"+Date.now(), ...newExp, status:"draft", emp:"Asaf Sadok" }]);
    }
    setNewExp({ merchant:"", category:"Meals", amount:"", date:"", note:"" });
    setShowAddExp(false);
  }

  function startEdit(exp) {
    setEditExp(exp);
    setNewExp({ merchant:exp.merchant, category:exp.category, amount:exp.amount, date:exp.date, note:exp.note });
    setShowAddExp(true);
  }

  function deleteExpense(id) { setExpenses(ex=>ex.filter(e=>e.id!==id)); }

  function approveExpense(id) { setExpenses(ex=>ex.map(e=>e.id===id?{...e,status:"approved"}:e)); }
  function rejectExpense(id) { setExpenses(ex=>ex.map(e=>e.id===id?{...e,status:"rejected"}:e)); }

  const statusColor = { draft:C.muted, submitted:C.yellow, approved:C.green, rejected:C.red };
  const statusIcon = { draft:"edit", submitted:"hourglass", approved:"check", rejected:"cross" };

  const filtered = filter==="all"?EMPLOYEES:filter==="issue"?EMPLOYEES.filter(e=>e.delay>0||e.cancelled):EMPLOYEES.filter(e=>e.dept===filter);
  const delayed=EMPLOYEES.filter(e=>e.delay>0).length;
  const cancelled=EMPLOYEES.filter(e=>e.cancelled).length;
  const inAir=EMPLOYEES.filter(e=>e.status==="Departed"||e.status==="In Air").length;
  const onTime=EMPLOYEES.filter(e=>e.status==="On Time"||e.status==="Landed").length;

  if (showSettings) return <CorporateSettings onBack={()=>setShowSettings(false)} isAdmin={isAdmin} teamVisible={teamVisible} setTeamVisible={setTeamVisible}/>;

  // ── Add/Edit Expense Modal ─────────────────────────────────────
  if (showAddExp) return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:60, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={()=>{setShowAddExp(false);setEditExp(null);setNewExp({merchant:"",category:"Meals",amount:"",date:"",note:""}); }} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{editExp?"Edit Expense":"Add Expense"}</div>
      </div>
      <div style={{ padding:"20px 16px 100px" }}>
        {/* Photo capture option */}
        {!editExp&&(
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>CAPTURE RECEIPT</div>
            <div style={{ display:"flex", gap:8 }}>
              <label style={{ flex:1, background:"rgba(0,200,240,0.07)", border:"1px solid rgba(0,200,240,0.25)", borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer", display:"block" }}>
                <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) notify("Photo captured!\n\nIn the live app, AI reads:\n• Merchant name\n• Amount\n• Date\n• Category\n\nAnd pre-fills the form below. Review and edit if needed."); }}/>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><StatIcon id="camera" color={C.soft} size={28}/></div>
                <div style={{ fontSize:13, fontWeight:700, color:C.accent }}>Take Photo</div>
                <div style={{ fontSize:11, color:C.soft }}>AI reads your receipt</div>
              </label>
              <label style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer", display:"block" }}>
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) notify("Image uploaded!\n\nAI is reading your receipt..."); }}/>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><StatIcon id="image" color={C.soft} size={28}/></div>
                <div style={{ fontSize:13, fontWeight:700, color:C.soft }}>Upload Photo</div>
                <div style={{ fontSize:11, color:C.muted }}>From camera roll</div>
              </label>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
              <div style={{ flex:1, height:1, background:C.border }}/><span style={{ fontSize:12, color:C.muted }}>or enter manually</span><div style={{ flex:1, height:1, background:C.border }}/>
            </div>
          </div>
        )}

        {/* Form fields */}
        {[
          ["Merchant / Description", "merchant", "text", "e.g. Cafe Madrid"],
          ["Amount ($)", "amount", "number", "0.00"],
          ["Date", "date", "date", ""],
          ["Notes (optional)", "note", "text", "e.g. Client lunch"],
        ].map(([label, key, type, ph])=>(
          <div key={key} style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>{label.toUpperCase()}</div>
            <input type={type} placeholder={ph} value={newExp[key]} onChange={e=>setNewExp(n=>({...n,[key]:e.target.value}))}
              style={{ width:"100%", background:C.card, border:`1.5px solid ${newExp[key]?C.accent+"60":C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
          </div>
        ))}

        {/* Category picker */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>CATEGORY</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {categories.map(cat=>(
              <div key={cat} onClick={()=>setNewExp(n=>({...n,category:cat}))} style={{ padding:"8px 14px", borderRadius:20, border:`1.5px solid ${newExp.category===cat?C.accent:C.border}`, background:newExp.category===cat?"rgba(0,200,240,0.1)":C.surface, cursor:"pointer", fontSize:12, fontWeight:700, color:newExp.category===cat?C.accent:C.soft }}>
                {cat}
              </div>
            ))}
          </div>
        </div>

        <div onClick={saveExpense} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, color:"#000", cursor:"pointer" }}>
          {editExp?"Save Changes ✓":"Add Expense →"}
        </div>
      </div>
    </div>
  );

  // ── Employee detail view ───────────────────────────────────────
  if (selEmp) {
    return (
      <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
        <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
          <div onClick={()=>setSelEmp(null)} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
          <span style={{ fontSize:16, fontWeight:800, color:C.text }}>{selEmp.name}</span>
        </div>
        <div style={{ padding:"16px 16px 100px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
            <div style={{ width:56, height:56, borderRadius:28, background:`${selEmp.color}22`, border:`2px solid ${selEmp.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:selEmp.color, fontFamily:C.mono }}>{selEmp.avatar}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:C.text }}>{selEmp.name}</div>
              <div style={{ fontSize:13, color:C.soft }}>{selEmp.dept} Department</div>
              <div style={{ fontSize:12, color:C.muted }}>{selEmp.phone}</div>
            </div>
          </div>
          <div style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, padding:16, marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ fontSize:18, fontWeight:800, color:C.text, fontFamily:C.mono, flex:1 }}>{selEmp.flight}</div>
              <StatusPill status={selEmp.status}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:C.mono }}>{selEmp.dep}</div>
              <div style={{ flex:1, height:2, background:C.border, borderRadius:1, position:"relative" }}>
                {selEmp.progress>0&&<div style={{ height:2, width:`${selEmp.progress}%`, background:`linear-gradient(90deg,${C.accent},${C.orange})`, borderRadius:1 }}/>}
                <span style={{ position:"absolute", top:"50%", left:`${Math.max(5,Math.min(90,selEmp.progress))}%`, transform:"translate(-50%,-50%)", display:"flex" }}><StatIcon id="plane" color={C.accent} size={16}/></span>
              </div>
              <div style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:C.mono }}>{selEmp.arr}</div>
            </div>
            {[["ETA",selEmp.eta],["Gate",selEmp.gate],["Delay",selEmp.delay>0?`+${selEmp.delay} min`:"None"]].map(([l,v])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.soft }}>{l}</span>
                <span style={{ fontSize:13, fontWeight:700, color:l==="Delay"&&selEmp.delay>0?C.yellow:C.text, fontFamily:C.mono }}>{v}</span>
              </div>
            ))}
          </div>
          {selEmp.saved&&<div style={{ background:"rgba(0,232,122,0.07)", border:"1px solid rgba(0,232,122,0.2)", borderRadius:12, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}><span style={{ display:"flex", justifyContent:"center" }}><StatIcon id="money" color={C.soft} size={16}/></span><span style={{ fontSize:13, color:C.green }}>Saved ${selEmp.saved} vs company average</span></div>}
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            {[["phone","Call",()=>notify(`Calling ${selEmp.name}...`)],["chat","Message",()=>notify(`Messaging ${selEmp.name}...`)],["link","Track",()=>notify(`Live link: myrunwayapp.co/t/${selEmp.id}`)]].map(([icon,label,fn])=>(
              <div key={label} onClick={fn} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:3 }}><StatIcon id={icon} color={C.soft} size={20}/></div>
                <div style={{ fontSize:12, fontWeight:700, color:C.soft }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Employee expenses (admin view) */}
          {isAdmin&&(
            <div>
              <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>EXPENSES</div>
              {expenses.filter(e=>e.emp===selEmp.name).map(exp=>(
                <div key={exp.id} style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ display:"flex" }}><StatIcon id={statusIcon[exp.status]} color={exp.status==="approved"?C.green:exp.status==="rejected"?C.red:C.soft} size={18}/></span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{exp.merchant}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{exp.category} · {exp.date}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:C.text, fontFamily:C.mono }}>${exp.amount}</div>
                    <div style={{ fontSize:10, color:statusColor[exp.status], fontWeight:700 }}>{exp.status.toUpperCase()}</div>
                  </div>
                  {isAdmin&&exp.status==="submitted"&&(
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      <div onClick={()=>approveExpense(exp.id)} style={{ background:"rgba(0,232,122,0.15)", border:"1px solid rgba(0,232,122,0.3)", borderRadius:6, padding:"3px 8px", fontSize:10, color:C.green, cursor:"pointer", fontWeight:700 }}>✓ OK</div>
                      <div onClick={()=>rejectExpense(exp.id)} style={{ background:"rgba(255,58,84,0.1)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:6, padding:"3px 8px", fontSize:10, color:C.red, cursor:"pointer", fontWeight:700 }}>✕</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Export view ────────────────────────────────────────────────
  if (showExport) return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:55, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={()=>setShowExport(false)} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <span style={{ fontSize:16, fontWeight:800, color:C.text }}>Export Report</span>
      </div>
      <div style={{ padding:"20px 16px 100px" }}>
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"20px", marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:4 }}>June 2026 Travel Report</div>
          <div style={{ fontSize:13, color:C.soft, marginBottom:16 }}>6 employees · Total expenses: ${expenses.reduce((s,e)=>s+parseFloat(e.amount||0),0).toFixed(2)}</div>
          {EMPLOYEES.map(emp=>(
            <div key={emp.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}`, alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{emp.name}</div>
                <div style={{ fontSize:11, color:C.soft, fontFamily:C.mono }}>{emp.flight} · {emp.dep}→{emp.arr}</div>
              </div>
              <StatusPill status={emp.status}/>
            </div>
          ))}
        </div>
        <div onClick={()=>notify("Downloading CSV...")} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, color:"#000", cursor:"pointer" }}>
          Download CSV ↓
        </div>
      </div>
    </div>
  );

  // ── Main dashboard ─────────────────────────────────────────────
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
      {/* Header */}
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onClose} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Acme Corp</div>
          <div style={{ fontSize:12, color:C.soft }}>{isAdmin?"Admin view · Full access":"Employee view · Your flights & expenses"}</div>
        </div>
        <div style={{ background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, color:C.purple, fontFamily:C.mono }}>{isAdmin?"ADMIN":"EMPLOYEE"}</div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.bg, position:"sticky", top:62, zIndex:9 }}>
        {(isAdmin||teamVisible?[["flights","Flights"],["expenses","Expenses"]]:[ ["flights","My Flights"],["expenses","My Expenses"] ]).map(([id,label])=>(
          <div key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"13px 0", textAlign:"center", fontWeight:700, fontSize:13, color:tab===id?C.accent:C.muted, borderBottom:`2px solid ${tab===id?C.accent:"transparent"}`, cursor:"pointer" }}>{label}</div>
        ))}
      </div>

      <div style={{ padding:"14px 14px 100px" }}>

        {/* ── FLIGHTS TAB ── */}
        {tab==="flights"&&(<>
          {isAdmin&&(
            <>
              {/* Admin: savings + alerts + stats */}
              <div style={{ background:"rgba(0,232,122,0.07)", border:"1px solid rgba(0,232,122,0.2)", borderRadius:14, padding:"12px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ display:"flex", justifyContent:"center" }}><StatIcon id="money" color={C.soft} size={22}/></span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800, color:C.green }}>$220 saved this month</div><div style={{ fontSize:11, color:C.soft }}>2 employees booked below budget</div></div>
                <span style={{ fontSize:10, color:C.green, fontFamily:C.mono, fontWeight:700, border:"1px solid rgba(0,232,122,0.3)", borderRadius:6, padding:"3px 8px" }}>VIEW →</span>
              </div>
              {(delayed>0||cancelled>0)&&(
                <div style={{ background:"rgba(255,58,84,0.08)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:14, padding:"12px 14px", marginBottom:12, display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ display:"flex", justifyContent:"center" }}><StatIcon id="alert" color={C.soft} size={20}/></span>
                  <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:C.red }}>Action needed</div><div style={{ fontSize:12, color:C.soft }}>{cancelled>0?`${cancelled} cancellation · `:""}{delayed>0?`${delayed} delayed`:""}</div></div>
                  <div onClick={()=>setFilter("issue")} style={{ background:C.red, borderRadius:8, padding:"6px 10px", cursor:"pointer" }}><span style={{ fontSize:11, fontWeight:800, color:"#fff" }}>Review</span></div>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[["plane","In Air",inAir,C.accent],["check","On Time",onTime,C.green],["clock","Delayed",delayed,C.yellow],["cross","Cancel",cancelled,C.red]].map(([icon,label,val,color])=>(
                  <div key={label} style={{ background:`${color}12`, borderRadius:12, border:`1px solid ${color}30`, padding:"12px 4px", textAlign:"center" }}>
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}><StatIcon id={icon} color={C.soft} size={18}/></div>
                    <div style={{ fontSize:22, fontWeight:800, color, fontFamily:C.mono, lineHeight:1, marginBottom:3 }}>{val}</div>
                    <div style={{ fontSize:9, color:C.soft, fontFamily:C.mono }}>{label}</div>
                  </div>
                ))}
              </div>
              {/* Team visibility toggle */}
              <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"12px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Team flight visibility</div>
                  <div style={{ fontSize:11, color:C.soft }}>Let employees see each other's flights</div>
                </div>
                <div onClick={()=>setTeamVisible(v=>!v)} style={{ width:44, height:26, borderRadius:13, background:teamVisible?C.accent:"#2a3f5f", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
                  <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:teamVisible?21:3, transition:"left 0.2s" }}/>
                </div>
              </div>
              {/* Dept filters */}
              <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
                {[["all","All"],["issue","Issues"],["Sales","Sales"],["Eng","Eng"],["Exec","Exec"],["HR","HR"]].map(([id,label])=>(
                  <div key={id} onClick={()=>setFilter(id)} style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:C.mono, background:filter===id?"rgba(0,200,240,0.12)":"transparent", color:filter===id?C.accent:C.soft, border:`1px solid ${filter===id?"rgba(0,200,240,0.3)":C.border}` }}>{label}</div>
                ))}
              </div>
              {/* Employee list */}
              {filtered.map(emp=>{ const hasIssue=emp.delay>0||emp.cancelled; return (
                <div key={emp.id} onClick={()=>setSelEmp(emp)} style={{ background:C.card, borderRadius:16, border:`1px solid ${hasIssue?(emp.cancelled?"rgba(255,58,84,0.25)":"rgba(255,200,0,0.2)"):C.border}`, padding:"14px 16px", marginBottom:10, cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:22, background:`${emp.color}18`, border:`2px solid ${emp.color}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:emp.color, fontFamily:C.mono, flexShrink:0 }}>{emp.avatar}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                        <span style={{ fontSize:15, fontWeight:800, color:C.text }}>{emp.name}</span>
                        <span style={{ fontSize:10, color:C.muted, background:C.surface, borderRadius:5, padding:"2px 7px", fontFamily:C.mono, border:`1px solid ${C.border}` }}>{emp.dept}</span>
                        {emp.saved&&<span style={{ fontSize:9, color:C.green, fontFamily:C.mono }}>Saved ${emp.saved}</span>}
                      </div>
                      <div style={{ fontSize:12, color:C.soft, fontFamily:C.mono }}>{emp.flight} · {emp.dep} → {emp.arr}</div>
                      {emp.progress>0&&emp.progress<100&&<div style={{ height:3, background:C.surface, borderRadius:2, overflow:"hidden", marginTop:8, maxWidth:180 }}><div style={{ height:3, width:`${emp.progress}%`, background:`linear-gradient(90deg,${emp.color},${C.accent})`, borderRadius:2 }}/></div>}
                      {emp.delay>0&&<div style={{ fontSize:11, color:C.yellow, marginTop:4, fontFamily:C.mono, display:"flex", alignItems:"center", gap:4 }}><StatIcon id="clock" color={C.yellow} size={12}/>+{emp.delay} min delay</div>}
                      {emp.cancelled&&<div style={{ fontSize:11, color:C.red, marginTop:4, fontWeight:700 }}>Cancelled — needs rebooking</div>}
                    </div>
                    <StatusPill status={emp.status}/>
                  </div>
                </div>
              );})}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
                <div onClick={()=>setShowExport(true)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><StatIcon id="chart" color={C.soft} size={24}/></div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>Export Report</div>
                  <div style={{ fontSize:11, color:C.muted }}>Download CSV</div>
                </div>
                <div onClick={()=>setShowSettings(true)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><StatIcon id="gear" color={C.soft} size={24}/></div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>Settings</div>
                  <div style={{ fontSize:11, color:C.muted }}>Policies · Team · SSO</div>
                </div>
              </div>
            </>
          )}
          {!isAdmin&&(
            /* Employee: see own flight + team if enabled */
            <div>
              <div style={{ background:"rgba(0,200,240,0.06)", border:"1px solid rgba(0,200,240,0.2)", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
                <div style={{ fontSize:12, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:6 }}>MY UPCOMING FLIGHT</div>
                <div style={{ fontSize:18, fontWeight:800, color:C.text, fontFamily:C.mono }}>LY 018 · MIA → TLV</div>
                <div style={{ fontSize:13, color:C.soft }}>Sun Jun 14 · 2:30 PM · Gate TBD</div>
                <StatusPill status="Scheduled"/>
              </div>
              {teamVisible ? (
                <div>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.6, fontWeight:600, marginBottom:10 }}>YOUR TEAM</div>
                  {EMPLOYEES.slice(0,3).map(emp=>{ return (
                    <div key={emp.id} style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:18, background:`${emp.color}18`, border:`2px solid ${emp.color}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:emp.color, fontFamily:C.mono }}>{emp.avatar}</div>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:C.text }}>{emp.name}</div><div style={{ fontSize:11, color:C.soft, fontFamily:C.mono }}>{emp.flight} · {emp.dep}→{emp.arr}</div></div>
                      <StatusPill status={emp.status}/>
                    </div>
                  );})}
                </div>
              ) : (
                <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"20px", textAlign:"center" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}><StatIcon id="users" color={C.soft} size={24}/></div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:6 }}>Team visibility is off</div>
                  <div style={{ fontSize:12, color:C.soft }}>Your admin hasn't enabled team flight sharing yet.</div>
                </div>
              )}
            </div>
          )}
        </>)}

        {/* ── EXPENSES TAB ── */}
        {tab==="expenses"&&(<>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Expenses</div>
              <div style={{ fontSize:12, color:C.soft }}>{isAdmin?"All employees":"Your trip"} · Total: <b style={{ color:C.accent, fontFamily:C.mono }}>${totalMyExp}</b></div>
            </div>
            <div onClick={()=>{setEditExp(null);setNewExp({merchant:"",category:"Meals",amount:"",date:"",note:""});setShowAddExp(true);}} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"10px 16px", cursor:"pointer" }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#000" }}>+ Add</span>
            </div>
          </div>

          {/* Summary bar */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {[["food","Meals"],["drive","Transport"],["building","Lodging"],["plane","Travel"]].map(([icon,cat])=>{
              const total = myExpenses.filter(e=>e.category===cat).reduce((s,e)=>s+parseFloat(e.amount||0),0).toFixed(2);
              return (
                <div key={cat} style={{ flex:1, background:C.card, borderRadius:10, border:`1px solid ${C.border}`, padding:"8px 4px", textAlign:"center" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:2 }}><StatIcon id={icon} color={C.soft} size={14}/></div>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>{cat}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:C.text, fontFamily:C.mono }}>${total}</div>
                </div>
              );
            })}
          </div>

          {/* Expense line items */}
          {myExpenses.length===0&&(
            <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"32px", textAlign:"center" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><StatIcon id="receipt" color={C.soft} size={32}/></div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>No expenses yet</div>
              <div style={{ fontSize:12, color:C.soft }}>Tap + Add to snap a receipt or enter manually</div>
            </div>
          )}
          {myExpenses.map(exp=>(
            <div key={exp.id} style={{ background:C.card, borderRadius:14, border:`1px solid ${exp.status==="rejected"?"rgba(255,58,84,0.25)":exp.status==="approved"?"rgba(0,232,122,0.18)":C.border}`, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ display:"flex", flexShrink:0 }}><StatIcon id={statusIcon[exp.status]} color={exp.status==="approved"?C.green:exp.status==="rejected"?C.red:C.soft} size={22}/></span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{exp.merchant}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:C.text, fontFamily:C.mono }}>${exp.amount}</div>
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{exp.category} · {exp.date}{isAdmin?` · ${exp.emp}`:""}</div>
                  {exp.note&&<div style={{ fontSize:12, color:C.soft, fontStyle:"italic" }}>"{exp.note}"</div>}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:statusColor[exp.status], fontFamily:C.mono, background:`${statusColor[exp.status]}15`, borderRadius:6, padding:"3px 8px" }}>{exp.status.toUpperCase()}</span>
                    <div style={{ display:"flex", gap:6 }}>
                      {exp.status==="draft"&&<div onClick={()=>startEdit(exp)} style={{ fontSize:11, color:C.accent, cursor:"pointer", fontWeight:700 }}>Edit</div>}
                      {exp.status==="draft"&&<div onClick={()=>setExpenses(ex=>ex.map(e=>e.id===exp.id?{...e,status:"submitted"}:e))} style={{ fontSize:11, color:C.green, cursor:"pointer", fontWeight:700 }}>Submit</div>}
                      {exp.status==="draft"&&<div onClick={()=>deleteExpense(exp.id)} style={{ fontSize:11, color:C.red, cursor:"pointer", fontWeight:700 }}>Delete</div>}
                      {isAdmin&&exp.status==="submitted"&&(
                        <>
                          <div onClick={()=>approveExpense(exp.id)} style={{ fontSize:11, color:C.green, cursor:"pointer", fontWeight:700, border:"1px solid rgba(0,232,122,0.3)", borderRadius:6, padding:"2px 8px" }}>✓ Approve</div>
                          <div onClick={()=>rejectExpense(exp.id)} style={{ fontSize:11, color:C.red, cursor:"pointer", fontWeight:700, border:"1px solid rgba(255,58,84,0.25)", borderRadius:6, padding:"2px 8px" }}>✕ Reject</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isAdmin&&myExpenses.some(e=>e.status==="submitted")&&(
            <div onClick={()=>notify("Exporting expense report to finance...")} style={{ background:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:14, padding:"14px 0", textAlign:"center", fontWeight:800, fontSize:14, color:"#fff", cursor:"pointer", marginTop:8 }}>
              Export to Finance →
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}


// ── Boarding Pass / Mobile Wallet ──────────────────────────────

// ── Clock: the trip is in the past, so by default we replay the travel day on a demo clock ──
const DEMO_ANCHOR = "2026-07-01T23:40:00Z"; // 2:40 AM in Tel Aviv on Jul 2, before LY 347
function makeClock(demo, anchorIso) {
  if (!demo) return { demo:false, tz:Intl.DateTimeFormat().resolvedOptions().timeZone, now:()=>new Date() };
  const start = Date.now();
  const anchor = Date.parse(anchorIso || DEMO_ANCHOR) || Date.parse(DEMO_ANCHOR);
  return { demo:true, tz:"Asia/Jerusalem", airport:"TLV", now:()=>new Date(anchor + (Date.now() - start)) };
}

const URLQ = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();

export default function MyRunway() {
  const [tab, setTab] = useState("flights");
  const [overlay, setOverlay] = useState(null); // add | share | settings | corp | plans | cancellations | alternates | seats | intel | weather | family
  const [detail, setDetail] = useState(null);
  const [info, setInfo] = useState(null);
  const [faa, setFaa] = useState(null); // FAA NAS status (US airports), null while loading
  const [faaTick, setFaaTick] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchFaaStatus().then(r => { if (alive) setFaa(r); });
    const id = setInterval(() => setFaaTick(x => x + 1), 5 * 60 * 1000);
    return () => { alive = false; clearInterval(id); };
  }, [faaTick]); // contextual sheet: { kind, f, data }
  const [isDark, setIsDark] = usePersistentState("dark", true);
  const [navIdx, setNavIdx] = usePersistentState("navIdx", 0);
  const [homeAddress, setHomeAddress] = usePersistentState("home", "Miami, FL (Davie)");
  const [stayAddress, setStayAddress] = usePersistentState("stay", "");
  const [prefs, setPrefs] = usePersistentState("prefs", { driveMins:45, trafficMins:15, intlBufferMins:180, domesticBufferMins:120 });
  const [withKids, setWithKids] = usePersistentState("kids", TRIP.withKids);
  const [accountType, setAccountType] = usePersistentState("account", "personal");
  const [onboarded, setOnboarded] = usePersistentState("onboarded", false);
  const [demoClock, setDemoClock] = usePersistentState("demoClock", true);
  const [savedScenario, setScenario] = usePersistentState("scenario", "off");
  const [userFlights, setUserFlights] = usePersistentState("userFlights", []);
  // Per-flight edits to booked flights (e.g. cancellation-announced date), stored with the trip.
  const [flightEdits, setFlightEdits] = usePersistentState("flightEdits", {});
  const [cancelDismissed, setCancelDismissed] = useState(false);
  const [liveState, setLiveState] = useState({});
  const [alternatesFor, setAlternatesFor] = useState(null);

  const scenario = URLQ.get("demo") || savedScenario;
  const showOnboarding = !onboarded && URLQ.get("onboarding") !== "0";
  const clock = useMemo(() => makeClock(URLQ.has("clock") ? true : demoClock, URLQ.get("clock")), [demoClock]);
  const now = useNow(clock);
  const realNow = useNow(REAL_CLOCK);

  // Theme is a module-level palette read by every component (kept from the original single-file design)
  C = isDark ? DARK : LIGHT;

  const flights = useMemo(() => [...FLIGHTS, ...userFlights].map(f => flightEdits[f.id] ? { ...f, ...flightEdits[f.id] } : f).sort((a,b)=>schedule(a).dep - schedule(b).dep), [userFlights, flightEdits]);
  const editFlight = (id, patch) => {
    const apply = o => { const n = { ...o, ...patch }; for (const k of Object.keys(n)) if (n[k] === undefined) delete n[k]; return n; };
    if (userFlights.some(f => f.id === id)) setUserFlights(xs => xs.map(f => f.id === id ? apply(f) : f));
    else setFlightEdits(m => ({ ...m, [id]: apply(m[id] || {}) }));
  };

  // Live overlay: our own /api/flight proxy (keys stay server-side). Re-check every 5 min.
  useEffect(() => {
    if (scenario !== "off") return;
    let alive = true;
    async function poll() {
      const results = await Promise.all(flights.map(async f => [f.id, await fetchLive(f)]));
      if (!alive) return;
      setLiveState(Object.fromEntries(results.map(([id, r]) => [id, { ...r, updatedAt: r.updatedAt || new Date().toISOString() }])));
    }
    poll();
    const t = setInterval(poll, 5 * 60000);
    return () => { alive = false; clearInterval(t); };
  }, [flights, scenario]);

  const mockState = useMemo(() => scenario === "off" ? null :
    Object.fromEntries(flights.map(f => [f.id, { mock:true, configured:true, live: mockLive(f, scenario), updatedAt: null }])), [flights, scenario]);
  const state = mockState || liveState;
  const getLive = id => state[id]?.live || null;
  const getMeta = id => state[id] || null;

  const cancelled = flights.find(f => getLive(f.id)?.status === "Cancelled");
  const hasCancellation = !!cancelled;
  const liveOn = scenario !== "off" || Object.values(liveState).some(s => s?.configured);
  const upcoming = flights.filter(f => flightPhase(f, getLive(f.id), now) !== "completed");
  const nextFlight = upcoming[0] || flights[flights.length - 1];

  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setDetail(null); setOverlay(null); setInfo(null); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  function exportTrip() {
    const list = upcoming.length ? upcoming : flights;
    const leaveBy = Object.fromEntries(list.map(f => [f.id, computeLeaveBy(f, null, prefs).leaveBy]));
    downloadText("my-runway-trip.ics", buildTripIcs(list, { now: realNow, leaveBy }));
    notify("Calendar file downloaded: flights, leave-by alarms and check-in reminders");
  }

  const close = () => setOverlay(null);
  const tools = [
    ["weather","sun","Weather",()=>setOverlay("weather")],
    ["intel","radar","Airports",()=>setOverlay("intel")],
    ["seats","seat","Seats",()=>setOverlay("seats")],
    ["family","users","Family",()=>setOverlay("family")],
    ["cancel","bell","Alerts",()=>setOverlay("cancellations")],
  ];
  function exportData(kind) {
    const stamp = realNow.toISOString().slice(0,10);
    if (kind === "csv") downloadBlob(`my-runway-trips-${stamp}.csv`, buildTripsCsv(flights, getLive), "text/csv;charset=utf-8");
    else downloadBlob(`my-runway-trips-${stamp}.json`, buildTripsJson(flights, { trip: TRIP, getLive, now: realNow, settings: { homeAddress, stayAddress, prefs, withKids, navApp: NAV_APPS[navIdx]?.label } }), "application/json");
    notify(`Exported ${flights.length} flights as ${kind.toUpperCase()}`);
  }
  const titles = { flights:[accountType==="corporate"?"Team Flights":"My Flights",`${TRIP.name} · ${TRIP.range}`], wallet:["Boarding Passes","Hold your passes, works offline"], lounges:["Airport Lounges","Find lounges & access rules"], passport:["My Passport","Your lifetime flying history"] };
  const iconBtn = { background:"transparent", border:"1px solid transparent", borderRadius:22, width:44, height:44, alignItems:"center", justifyContent:"center", cursor:"pointer", display:"flex", position:"relative" };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:C.sans, maxWidth:480, margin:"0 auto", position:"relative", color:C.text }}>
      <style>{`
        ::-webkit-scrollbar{display:none}
        *{box-sizing:border-box}
        html,body{background:${C.bg}}
        body{font-family:${SF};-webkit-font-smoothing:antialiased;font-feature-settings:"tnum";color-scheme:${isDark?"dark":"light"}}
        body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:${isDark?"radial-gradient(120% 60% at 50% -10%, rgba(10,132,255,0.18), transparent 60%)":"radial-gradient(120% 60% at 50% -10%, rgba(0,102,204,0.10), transparent 60%)"}}
        .mr-glass{-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%)}
        .mr-card{box-shadow:0 1px 0 rgba(255,255,255,${isDark?0.04:0.6}) inset, 0 10px 30px rgba(0,0,0,${isDark?0.35:0.08})}
        .mr-btn{transition:transform .35s cubic-bezier(.34,1.56,.64,1), opacity .2s}
        .mr-btn:active{transform:scale(.96);opacity:.85}
        .mr-sheet{animation:sheetUp .45s cubic-bezier(.32,1.25,.6,1)}
        .mr-scrim{animation:fadeIn .25s ease}
        :focus-visible{outline:2px solid ${C.accent} !important;outline-offset:2px}
        input:focus-visible{outline-offset:0}
        @keyframes cardIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:none}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}
        @media (max-width:420px){ .mr-dev{display:none} }
        @media (max-width:400px){ .mr-addlabel{display:none} }
      `}</style>
      <div className="mr-glass" style={{ background:C.glass, borderBottom:`0.5px solid ${C.border}`, padding:"6px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10, gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, overflow:"hidden" }}>
          <MyRunwayBadge variant="icon" size={34} color={C.accent}/>
          <span className={accountType==="corporate"?"mr-addlabel":undefined} style={{ fontFamily:C.display, fontSize:17, fontWeight:600, color:C.text, letterSpacing:-0.2, whiteSpace:"nowrap" }}>My Runway</span>
          {DEV_MODE&&<div className="mr-dev" style={{ background:"rgba(255,200,0,0.15)", border:"1px solid rgba(255,200,0,0.4)", borderRadius:5, padding:"1px 5px", fontSize:8, fontWeight:800, color:C.yellow, fontFamily:C.mono, letterSpacing:0.6, flexShrink:0 }}>DEV</div>}
        </div>
        <div style={{ display:"flex", gap:5, alignItems:"center", flexShrink:0 }}>
          {accountType==="corporate"&&<div onClick={()=>setOverlay("corp")} title="Corporate" style={{ ...iconBtn, background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.3)" }}><StatIcon id="building" color={C.purple} size={16}/></div>}
          <div data-testid="btn-share" onClick={()=>setOverlay("share")} title="Share" role="button" tabIndex={0} aria-label="Share" style={iconBtn}><StatIcon id="share" color={C.accent} size={20}/></div>
          <div data-testid="btn-bell" onClick={()=>setOverlay("cancellations")} title="Cancellation alerts" role="button" tabIndex={0} aria-label="Cancellation alerts" style={iconBtn}>
            <StatIcon id="bell" color={hasCancellation?C.red:C.accent} size={20}/>
            {hasCancellation&&<div style={{ position:"absolute", top:9, right:9, width:7, height:7, borderRadius:4, background:C.red, border:"1.5px solid #04070e" }}/>}
          </div>
          <div data-testid="btn-settings" onClick={()=>setOverlay("settings")} title="Settings" role="button" tabIndex={0} aria-label="Settings" style={iconBtn}><StatIcon id="gear" color={C.accent} size={20}/></div>
          <div data-testid="btn-add" className="mr-btn" role="button" tabIndex={0} aria-label="Add flight" onClick={()=>setOverlay("add")} style={{ background:C.accent, borderRadius:22, height:36, minWidth:36, padding:"0 12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4, margin:"4px 0 4px 4px" }}>
            <span style={{ fontSize:18, color:"#fff", fontWeight:600, lineHeight:1 }}>+</span>
            <span className="mr-addlabel" style={{ fontSize:14, color:"#fff", fontWeight:600 }}>Flight</span>
          </div>
        </div>
      </div>
      {accountType==="corporate"&&(
        <div style={{ background:"linear-gradient(135deg,rgba(167,139,250,0.12),rgba(124,58,237,0.06))", borderBottom:"1px solid rgba(167,139,250,0.25)", padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <StatIcon id="building" color={C.purple} size={16}/>
          <div style={{ flex:1 }}><span style={{ fontSize:12, fontWeight:800, color:C.purple }}>Acme Corp</span><span style={{ fontSize:12, color:C.muted }}> · Corporate (sample team)</span></div>
          <div onClick={()=>setOverlay("corp")} style={{ fontSize:11, color:C.purple, fontWeight:700, fontFamily:C.mono, cursor:"pointer" }}>Dashboard →</div>
        </div>
      )}
      <DemoClockChip clock={clock} now={now}/>
      <div style={{ padding:"16px 16px 0" }}>
        <h1 style={{ fontFamily:C.display, fontSize:34, fontWeight:700, color:C.text, margin:"6px 0 2px", letterSpacing:-0.6 }}>{titles[tab][0]}</h1>
        <div style={{ fontSize:15, color:C.muted }}>{titles[tab][1]}</div>
      </div>
      <div style={{ flex:1 }}>
        {tab==="flights"&&<FlightsScreen flights={flights} getLive={getLive} getMeta={getMeta} now={now} navIdx={navIdx} homeAddress={homeAddress} stayAddress={stayAddress} prefs={prefs} withKids={withKids}
          onTap={f=>setDetail(f)} onAdd={()=>setOverlay("add")} onEditPrefs={()=>setOverlay("settings")} onCalendar={exportTrip} tools={tools} onMore={()=>setOverlay("more")} onInfo={setInfo} faa={faa} faaNow={realNow} demo={clock.demo}
          liveStrip={<LiveStatusStrip liveState={state} scenario={scenario} realNow={realNow} hasCancellation={hasCancellation}/>}/>}
        {tab==="wallet"&&<WalletScreen/>}
        {tab==="lounges"&&<LoungeScreen/>}
        {tab==="passport"&&<PassportScreen/>}
      </div>
      <BottomNav active={tab} onNav={t=>{ setTab(t); window.scrollTo(0,0); }}/>
      {detail&&<FlightDetailSheet f={flights.find(x=>x.id===detail.id)||detail} onEdit={p=>editFlight(detail.id,p)} live={getLive(detail.id)} liveMeta={getMeta(detail.id)} now={now} onClose={()=>setDetail(null)} onAlternates={()=>{ setAlternatesFor(detail); setDetail(null); setOverlay("alternates"); }}/>}
      {overlay==="add"&&<AddModal onClose={close} onAdd={f=>setUserFlights(x=>[...x, f])}/>}
      {overlay==="share"&&<ShareModal onClose={close} flight={nextFlight} live={nextFlight?getLive(nextFlight.id):null} now={now}/>}
      {overlay==="settings"&&<SettingsModal onClose={close} isDark={isDark} setIsDark={setIsDark} homeAddress={homeAddress} setHomeAddress={setHomeAddress} stayAddress={stayAddress} setStayAddress={setStayAddress} prefs={prefs} setPrefs={setPrefs} withKids={withKids} setWithKids={setWithKids} accountType={accountType} setAccountType={setAccountType} navIdx={navIdx} setNavIdx={setNavIdx} demoClock={demoClock} setDemoClock={setDemoClock} scenario={savedScenario} setScenario={s=>{ setScenario(s); setCancelDismissed(false); }} onPlans={()=>setOverlay("plans")}/>}
      {info?.kind==="comp"&&<CompensationSheet f={info.f} data={info.data} onClose={()=>setInfo(null)}/>}
      {info?.kind==="customs"&&<CustomsSheet f={info.f} onClose={()=>setInfo(null)}/>}
      {overlay==="bring"&&<BringSheet onClose={close}/>}
      {(overlay==="faa"||info?.kind==="faa")&&<AirportStatusSheet faa={faa} codes={[...new Set(flights.filter(f=>flightPhase(f, getLive(f.id), now)!=="completed").flatMap(f=>[f.dep,f.arr]).filter(isUsAirport))]} onClose={()=>{ setInfo(null); if (overlay==="faa") close(); }} onRetry={()=>{ setFaa(null); setFaaTick(x=>x+1); }}/>}
      {overlay==="more"&&<MoreSheet onClose={close} tools={tools.filter(t=>t[0]!=="weather"&&t[0]!=="intel")} onExport={exportData} onOpen={setOverlay}/>}
      {overlay==="corp"&&<CorporateDashboard onClose={close} corpRole="admin"/>}
      {overlay==="plans"&&<OverlayPage testid="plans" title="Plans & pricing" onBack={close}><PlansScreen/></OverlayPage>}
      {overlay==="cancellations"&&<CancellationScreen onBack={close} liveOn={liveOn}/>}
      {overlay==="alternates"&&<AlternateFlightsScreen onBack={close} flight={alternatesFor||cancelled}/>}
      {overlay==="seats"&&<SeatTrackerScreen onBack={close}/>}
      {overlay==="intel"&&<AirportIntelligenceScreen onBack={close}/>}
      {overlay==="weather"&&<OverlayPage testid="weather" title="Airport weather" sub="Live from Open-Meteo" onBack={close}><WeatherScreen/></OverlayPage>}
      {overlay==="family"&&<OverlayPage testid="family" title="Family tracker" onBack={close}><FamilyScreen/></OverlayPage>}
      {hasCancellation&&!cancelDismissed&&!overlay&&<CancellationAlert key={cancelled.id} flight={cancelled} simulated={scenario!=="off"} onDismiss={()=>setCancelDismissed(true)} onShare={()=>{ setCancelDismissed(true); setOverlay("share"); }} onAction={()=>{ setCancelDismissed(true); setAlternatesFor(cancelled); setOverlay("alternates"); }}/>}
      {showOnboarding&&<Onboarding onDone={(pickedNav)=>{ if(typeof pickedNav==="number") setNavIdx(pickedNav); setOnboarded(true); }}/>}
      <Toasts/>
    </div>
  );
}
