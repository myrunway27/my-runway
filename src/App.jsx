import { useState, useEffect } from "react";

const C = {
  bg:"#04070e", surface:"#090f1c", card:"#0d1525", border:"#13203a",
  accent:"#00c8f0", orange:"#ff5c2b", green:"#00e87a", yellow:"#ffc800",
  red:"#ff3a54", purple:"#a78bfa",
  text:"#d4ecff", muted:"#4e7090", soft:"#7a9ab8",
  mono:"'Courier New',monospace",
  sans:"system-ui,-apple-system,sans-serif",
  display:"Impact,'Arial Narrow',Arial,sans-serif",
};

// conn is now on the DESTINATION flight (the one you're connecting TO)
// so the bridge appears BETWEEN flight 1 and flight 2
const FLIGHTS = [
  {
    id:"f1", iata:"AA 1307", code:"AA", airline:"American Airlines",
    dep:"MIA", arr:"LIM", depTime:"3:51 PM", arrTime:"8:30 PM",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"D",
    aircraft:"Boeing 737", date:"Wed Apr 22, 2026", conf:"WKZGIC", trip:"outbound",
    wx:{
      dep:{ icon:"🌤️", temp:82, cond:"Partly Cloudy", wind:12, note:"Good departure conditions" },
      arr:{ icon:"🌥️", temp:68, cond:"Overcast", wind:9, note:"Typical Lima overcast" },
    },
    conn: null,
  },
  {
    id:"f2", iata:"LA 2166", code:"LA", airline:"LATAM Airlines",
    dep:"LIM", arr:"CUZ", depTime:"11:40 PM", arrTime:"1:00 AM",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"TBD",
    aircraft:"Airbus A319", date:"Apr 22–23, 2026", conf:"NATBMU", trip:"outbound",
    wx:{
      dep:{ icon:"🌥️", temp:66, cond:"Overcast", wind:8, note:"Normal Lima night" },
      arr:{ icon:"🌙", temp:44, cond:"Clear night", wind:5, note:"Cusco at 11,200ft — cold!" },
    },
    // Connection info lives on f2 — it's the bridge ARRIVING from f1 and DEPARTING on f2
    conn:{
      arrTerminal:"International Terminal", arrGate:"TBD",
      depTerminal:"Domestic Terminal", depGate:"TBD",
      walkMins:35, layoverMins:190, buffer:155,
      transport:"Walk within terminal",
      security:"Immigration & passport control required",
      steps:[
        { icon:"🛬", label:"Deplane at LIM International Terminal", mins:5 },
        { icon:"🛂", label:"Immigration & passport control", mins:25 },
        { icon:"🚶", label:"Walk to domestic gates", mins:5 },
      ],
    },
  },
  {
    id:"f3", iata:"H2 5012", code:"H2", airline:"Sky Airline",
    dep:"CUZ", arr:"LIM", depTime:"6:15 PM", arrTime:"8:00 PM",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"TBD",
    aircraft:"Airbus A320", date:"Mon Apr 27, 2026", conf:"JNNAYS", trip:"return",
    wx:{
      dep:{ icon:"⛅", temp:55, cond:"Partly Cloudy", wind:10, note:"Watch for mountain weather" },
      arr:{ icon:"🌥️", temp:67, cond:"Overcast", wind:8, note:"Typical Lima evening" },
    },
    conn: null,
  },
  {
    id:"f4", iata:"AA 988", code:"AA", airline:"American Airlines",
    dep:"LIM", arr:"MIA", depTime:"11:45 PM", arrTime:"6:40 AM",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"TBD",
    aircraft:"Boeing 737", date:"Apr 27–28, 2026", conf:"GPHCIF", trip:"return",
    wx:{
      dep:{ icon:"🌙", temp:64, cond:"Clear night", wind:7, note:"Clear departure" },
      arr:{ icon:"🌤️", temp:79, cond:"Sunny", wind:14, note:"Morning arrival Miami" },
    },
    // Connection bridge between H2 5012 and AA 988
    conn:{
      arrTerminal:"Domestic Terminal", arrGate:"TBD",
      depTerminal:"International Terminal", depGate:"TBD",
      walkMins:40, layoverMins:225, buffer:185,
      transport:"Walk between terminals",
      security:"Check-in & security screening required",
      steps:[
        { icon:"🛬", label:"Deplane domestic terminal", mins:10 },
        { icon:"🚶", label:"Walk to international terminal", mins:15 },
        { icon:"🛂", label:"Check-in AA / bag drop", mins:15 },
      ],
    },
  },
];

const NAV_APPS = [
  { id:"waze", label:"Waze", color:"#00AFFF", bg:"rgba(0,175,255,0.12)", border:"rgba(0,175,255,0.3)", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Waze_icon.svg/96px-Waze_icon.svg.png" },
  { id:"google", label:"Google Maps", color:"#4285F4", bg:"rgba(66,133,244,0.12)", border:"rgba(66,133,244,0.3)", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Google_Maps_Logo_2020.svg/96px-Google_Maps_Logo_2020.svg.png" },
  { id:"apple", label:"Apple Maps", color:"#6eb5ff", bg:"rgba(110,181,255,0.12)", border:"rgba(110,181,255,0.3)", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Apple_Maps_logo_2020.svg/96px-Apple_Maps_logo_2020.svg.png" },
];

const LEAVE_CFG = {
  later:{ c:"#00e87a", bg:"rgba(0,232,122,0.07)", br:"rgba(0,232,122,0.18)", icon:"✅", label:"ON TRACK", time:"6:45 AM", sub:"Leave in 2h 22m" },
  soon: { c:"#ffc800", bg:"rgba(255,200,0,0.07)", br:"rgba(255,200,0,0.18)", icon:"⏰", label:"LEAVING SOON", time:"6:45 AM", sub:"Leave in 48 min" },
  now:  { c:"#ff3a54", bg:"rgba(255,58,84,0.07)", br:"rgba(255,58,84,0.18)", icon:"🚨", label:"LEAVE NOW", time:"6:45 AM", sub:"Only 12 minutes!" },
};

const EMPLOYEES = [
  { id:1, name:"Sarah Chen", dept:"Sales", avatar:"SC", color:"#00c8f0", flight:"AA 100", dep:"JFK", arr:"LAX", status:"Departed", eta:"11:45 AM", progress:62, gate:"B22", delay:0, phone:"(212) 555-0101" },
  { id:2, name:"Marcus Lee", dept:"Eng", avatar:"ML", color:"#00e87a", flight:"DL 456", dep:"ATL", arr:"SFO", status:"On Time", eta:"2:30 PM", progress:0, gate:"D14", delay:0, phone:"(415) 555-0192" },
  { id:3, name:"Priya Sharma", dept:"Sales", avatar:"PS", color:"#ffc800", flight:"UA 789", dep:"LAX", arr:"ORD", status:"Delayed", eta:"~5:45 PM", progress:0, gate:"C11", delay:55, phone:"(312) 555-0134" },
  { id:4, name:"Tom Walsh", dept:"Exec", avatar:"TW", color:"#a78bfa", flight:"BA 178", dep:"LHR", arr:"JFK", status:"In Air", eta:"8:00 PM", progress:78, gate:"T7", delay:0, phone:"(646) 555-0177" },
  { id:5, name:"Lisa Park", dept:"HR", avatar:"LP", color:"#ff5c2b", flight:"SW 321", dep:"DAL", arr:"MIA", status:"Cancelled", eta:"—", progress:0, gate:"—", delay:999, phone:"(305) 555-0155" },
  { id:6, name:"James Rivera", dept:"Eng", avatar:"JR", color:"#00e87a", flight:"AA 200", dep:"BOS", arr:"DFW", status:"Landed", eta:"Arrived", progress:100, gate:"B8", delay:0, phone:"(972) 555-0188" },
];

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
  const [err, setErr] = useState(false);
  const colors = { AA:"#0078D2", UA:"#005DAA", DL:"#C01933", LA:"#E31837", H2:"#FF6B00", BA:"#075AAA", SW:"#304CB2" };
  if (err) return <div style={{ width:size, height:size, borderRadius:7, background:colors[code]||"#334", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.38, fontWeight:800, color:"#fff", fontFamily:C.mono, flexShrink:0 }}>{code}</div>;
  return <img src={`https://airhex.com/images/airline-logos/${code.toLowerCase()}.png`} alt={code} onError={()=>setErr(true)} style={{ width:size, height:size, borderRadius:7, objectFit:"contain", background:"rgba(255,255,255,0.05)", padding:2, flexShrink:0 }}/>;
}

function NavLogo({ app, size=28 }) {
  const [err, setErr] = useState(false);
  if (err) return <span style={{ fontSize:size*0.7 }}>🗺️</span>;
  return <img src={app.logo} alt={app.label} onError={()=>setErr(true)} style={{ width:size, height:size, objectFit:"contain", borderRadius:size*0.2, flexShrink:0 }}/>;
}

function StatusPill({ status }) {
  const s = sc(status);
  return <span style={{ background:s.bg, border:`1px solid ${s.br}`, borderRadius:20, padding:"4px 12px", fontSize:11, color:s.c, fontWeight:700, fontFamily:C.mono, whiteSpace:"nowrap" }}>{status}</span>;
}

// Pure SVG arc with clearly visible plane
function Arc({ progress=0, color="#00c8f0" }) {
  const w=200, h=54, cx=w/2;
  const pct = progress/100;
  // When progress=0, show plane at start; otherwise animate along path
  const px = progress===0 ? cx : 16 + pct*(w-32);
  const py = progress===0 ? h-28 : h-10 - Math.sin(pct*Math.PI)*24;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible", display:"block", margin:"0 auto" }}>
      {/* Dashed track - lighter so plane stands out */}
      <path d={`M 16 ${h-8} Q ${cx} ${h-50} ${w-16} ${h-8}`} fill="none" stroke="#2a4060" strokeWidth="1.5" strokeDasharray="4 5"/>
      {/* Start dot */}
      <circle cx="16" cy={h-8} r="4" fill="#0d1525" stroke={color} strokeWidth="2"/>
      {/* End dot */}
      <circle cx={w-16} cy={h-8} r="4" fill="#0d1525" stroke={color} strokeWidth="2"/>
      {/* Plane - bright white with colored ring, always at center when not flying */}
      <circle cx={px} cy={py} r="14" fill={color} opacity="0.2"/>
      <circle cx={px} cy={py} r="14" fill="none" stroke={color} strokeWidth="2"/>
      <text x={px} y={py+1} fontSize="15" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontWeight="bold">✈</text>
    </svg>
  );
}

function ConnBridge({ conn }) {
  const [open, setOpen] = useState(false);
  const urgency = conn.buffer > 120
    ? { c:"#00e87a", bg:"rgba(0,232,122,0.07)", br:"rgba(0,232,122,0.25)", label:"✅ Comfortable connection" }
    : conn.buffer > 45
    ? { c:"#ffc800", bg:"rgba(255,200,0,0.07)", br:"rgba(255,200,0,0.25)", label:"⏰ Tight connection" }
    : { c:"#ff3a54", bg:"rgba(255,58,84,0.07)", br:"rgba(255,58,84,0.25)", label:"🚨 Very tight — rush!" };
  return (
    <div style={{ background:urgency.bg, borderRadius:16, border:`1px solid ${urgency.br}`, overflow:"hidden", marginBottom:12, marginTop:2 }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ padding:"13px 16px", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:urgency.c, marginBottom:3 }}>{urgency.label}</div>
          <div style={{ fontSize:12, color:C.soft }}>{conn.walkMins} min transfer · {conn.buffer} min buffer · {conn.transport}</div>
        </div>
        <span style={{ fontSize:14, color:C.muted }}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${urgency.br}` }}>
          <div style={{ display:"flex", marginBottom:16, paddingTop:14 }}>
            {[["LAYOVER",`${Math.floor(conn.layoverMins/60)}h${conn.layoverMins%60}m`,C.text],["WALKING",`${conn.walkMins}m`,C.yellow],["BUFFER",`${conn.buffer}m`,urgency.c]].map(([l,v,c],i)=>(
              <div key={l} style={{ flex:1, textAlign:"center", borderRight:i<2?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:5 }}>{l}</div>
                <div style={{ fontSize:24, fontWeight:800, color:c, fontFamily:C.mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background:C.surface, borderRadius:12, padding:"14px", marginBottom:12, border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", gap:14, marginBottom:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:5 }}>🛬 ARRIVING AT</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{conn.arrTerminal}</div>
                <div style={{ fontSize:12, color:C.soft }}>Gate: <b style={{ color:C.text, fontFamily:C.mono }}>{conn.arrGate}</b></div>
              </div>
              <div style={{ width:1, background:C.border }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:5 }}>🛫 DEPARTING FROM</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{conn.depTerminal}</div>
                <div style={{ fontSize:12, color:C.soft }}>Gate: <b style={{ color:C.text, fontFamily:C.mono }}>{conn.depGate}</b></div>
              </div>
            </div>
            <div style={{ background:"rgba(255,200,0,0.08)", borderRadius:9, padding:"9px 12px", border:"1px solid rgba(255,200,0,0.25)" }}>
              <div style={{ fontSize:13, color:C.yellow, fontWeight:600 }}>⚠️ {conn.security}</div>
            </div>
          </div>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1.5, marginBottom:10 }}>STEP BY STEP</div>
          {conn.steps.map((s,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<conn.steps.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontSize:20, width:28, textAlign:"center", flexShrink:0 }}>{s.icon}</span>
              <div style={{ flex:1, fontSize:14, color:C.text, fontWeight:500 }}>{s.label}</div>
              <div style={{ fontSize:14, fontWeight:800, color:C.yellow, fontFamily:C.mono, flexShrink:0 }}>{s.mins}m</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FlightCard({ f, onTap }) {
  const s = sc(f.status);
  return (
    <div onClick={()=>onTap(f)} style={{ background:C.card, borderRadius:20, border:`1px solid ${f.status==="Delayed"?"rgba(255,200,0,0.3)":f.status==="Gate Change"?"rgba(167,139,250,0.3)":C.border}`, padding:16, marginBottom:10, cursor:"pointer" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <AirlineLogo code={f.code} size={30}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, fontFamily:C.mono }}>{f.iata}</div>
          <div style={{ fontSize:12, color:C.soft }}>{f.airline} · {f.aircraft}</div>
        </div>
        <StatusPill status={f.status}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", marginBottom:14 }}>
        <div style={{ textAlign:"center", minWidth:60 }}>
          <div style={{ fontSize:30, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{f.dep}</div>
          <div style={{ fontSize:13, color:"#a8c8e8", fontWeight:600, marginTop:4 }}>{f.depTime}</div>
        </div>
        <div style={{ flex:1, display:"flex", justifyContent:"center" }}>
          <Arc progress={f.progress} color={s.c}/>
        </div>
        <div style={{ textAlign:"center", minWidth:60 }}>
          <div style={{ fontSize:30, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{f.arr}</div>
          <div style={{ fontSize:13, color:"#a8c8e8", fontWeight:600, marginTop:4 }}>{f.arrTime}</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", marginBottom:f.wx?12:0 }}>
        <span style={{ background:C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:C.soft, border:`1px solid ${C.border}` }}>Gate <b style={{ color:C.text, fontFamily:C.mono }}>{f.gate}</b></span>
        <span style={{ background:C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:C.soft, border:`1px solid ${C.border}` }}>Terminal <b style={{ color:C.text, fontFamily:C.mono }}>{f.terminal}</b></span>
        {f.conf&&<span style={{ background:"rgba(167,139,250,0.1)", borderRadius:8, padding:"5px 11px", fontSize:12, color:C.purple, border:"1px solid rgba(167,139,250,0.25)", fontFamily:C.mono }}>CONF# {f.conf}</span>}
        {f.date&&<span style={{ background:C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:C.soft, border:`1px solid ${C.border}` }}>{f.date}</span>}
      </div>
      {f.wx&&(
        <div style={{ display:"flex", gap:8, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
          {[["dep",f.dep,f.wx.dep],["arr",f.arr,f.wx.arr]].map(([type,code,w])=>(
            <div key={type} style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:C.surface, borderRadius:11, padding:"10px 12px", border:`1px solid ${C.border}` }}>
              <span style={{ fontSize:20 }}>{w.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:C.soft, marginBottom:2 }}>{code}</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{w.temp}° <span style={{ fontSize:12, color:C.soft, fontWeight:400 }}>{w.cond}</span></div>
                <div style={{ fontSize:11, color:C.muted }}>💨 {w.wind}mph</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddModal({ onClose }) {
  const [num, setNum] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  function submit() {
    if (!num.trim()) { setErr("Enter a flight number e.g. AA 100"); return; }
    if (!date) { setErr("Pick a date"); return; }
    setBusy(true); setErr("");
    setTimeout(()=>{ setBusy(false); alert(`Flight ${num.toUpperCase()} added!`); onClose(); }, 1400);
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:"20px 20px 48px", border:`1px solid ${C.border}`, maxWidth:480, margin:"0 auto", width:"100%" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 18px" }}/>
        <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:6 }}>Track a Flight</div>
        <div style={{ fontSize:14, color:C.soft, marginBottom:22 }}>Enter your flight number and date.</div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:8 }}>FLIGHT NUMBER</div>
          <input value={num} onChange={e=>setNum(e.target.value)} placeholder="AA 100, UA456, DL 202..."
            style={{ width:"100%", background:C.card, border:`1.5px solid ${num?C.accent+"60":C.border}`, borderRadius:13, padding:"14px 16px", color:C.text, fontSize:16, fontFamily:C.mono, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:err?12:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:8 }}>FLIGHT DATE</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{ width:"100%", background:C.card, border:`1.5px solid ${date?C.accent+"60":C.border}`, borderRadius:13, padding:"14px 16px", color:date?C.text:C.muted, fontSize:14, fontFamily:C.mono, outline:"none", colorScheme:"dark", boxSizing:"border-box" }}/>
        </div>
        {err&&<div style={{ fontSize:13, color:C.red, marginBottom:14 }}>⚠️ {err}</div>}
        <div onClick={submit} style={{ background:busy?C.muted:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"16px 0", textAlign:"center", fontWeight:800, fontSize:16, color:"#000", cursor:busy?"default":"pointer" }}>
          {busy?"Looking up flight...":"Track This Flight →"}
        </div>
      </div>
    </div>
  );
}

function ShareModal({ onClose }) {
  const autoMsg = `Landing LIM at 8:30 PM on American Airlines AA 1307. Connecting via LIM — next flight LA 2166 departs 11:40 PM.`;
  const [note, setNote] = useState("");
  const [generated, setGenerated] = useState(false);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:"20px 20px 48px", border:`1px solid ${C.border}`, maxWidth:480, margin:"0 auto", width:"100%" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 18px" }}/>
        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:6 }}>Share Trip</div>
        <div style={{ fontSize:13, color:C.soft, marginBottom:16 }}>Send a live tracking link to your pickup person</div>
        <div style={{ background:C.card, borderRadius:12, padding:"13px 14px", marginBottom:14, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:6 }}>AUTO-GENERATED MESSAGE</div>
          <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{autoMsg}</div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:1.5, marginBottom:8 }}>ADD A PERSONAL NOTE (optional)</div>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. bring coffee ☕, I have 2 bags..."
            style={{ width:"100%", background:C.card, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
        </div>
        {generated&&(
          <div style={{ background:"rgba(0,232,122,0.08)", borderRadius:12, padding:"12px 14px", marginBottom:14, border:"1px solid rgba(0,232,122,0.25)" }}>
            <div style={{ fontSize:12, color:C.green, marginBottom:4, fontWeight:700 }}>✅ Link generated!</div>
            <div style={{ fontSize:13, color:C.text, fontFamily:C.mono }}>myrunwayapp.co/t/abc123k</div>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[["💬","WhatsApp","#25D366"],["✉️","iMessage","#34C759"],["📧","Email","#4285F4"],["🔗","Copy Link",C.accent]].map(([icon,label,color])=>(
            <div key={label} onClick={()=>{ setGenerated(true); alert(`Sharing via ${label}...`); }} style={{ background:`${color}15`, border:`1px solid ${color}40`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlightsScreen({ onTap, onAdd, leaveState, setLeaveState, navIdx, setNavIdx }) {
  const lc = LEAVE_CFG[leaveState];
  const app = NAV_APPS[navIdx];
  const outbound = FLIGHTS.filter(f=>f.trip==="outbound");
  const returnFlights = FLIGHTS.filter(f=>f.trip==="return");
  const [showOutboundAll, setShowOutboundAll] = useState(false);
  const [showReturnAll, setShowReturnAll] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  function renderFlightGroup(flights, showAll, setShowAll) {
    // Always show all flights so connection bridge is always visible between them
    // But collapse non-first flights when showAll is false
    return flights.map((f, i) => (
      <div key={f.id}>
        {/* Connection bridge BEFORE this flight if it has conn = connecting leg */}
        {f.conn && <ConnBridge conn={f.conn}/>}
        {/* Show first flight always, show rest only when expanded */}
        {(i === 0 || showAll) && <FlightCard f={f} onTap={onTap}/>}
        {/* If collapsed and there are more flights, show a teaser */}
        {i === 0 && !showAll && flights.length > 1 && (
          <div onClick={()=>setShowAll(true)} style={{ background:C.surface, borderRadius:12, border:`1px dashed ${C.border}`, padding:"10px 16px", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
            <span style={{ fontSize:12, color:C.soft, fontFamily:C.mono }}>+ {flights.length - 1} more connecting flight</span>
            <span style={{ fontSize:11, color:C.accent, fontFamily:C.mono }}>show ▼</span>
          </div>
        )}
      </div>
    ));
  }

  return (
    <div style={{ padding:"14px 14px 100px" }}>

      {/* Route summary — WHITE text */}
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"14px", marginBottom:16 }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>OUTBOUND · APR 22</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {outbound.map(f=>{
              const s=sc(f.status);
              return (
                <div key={f.id} onClick={()=>onTap(f)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid rgba(255,255,255,0.15)`, borderRadius:20, padding:"6px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:12, color:"#ffffff", fontFamily:C.mono, fontWeight:700 }}>{f.iata} · {f.dep}–{f.arr}</span>
                  <div style={{ width:7, height:7, borderRadius:4, background:s.c, flexShrink:0 }}/>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>RETURN · APR 27</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {returnFlights.map(f=>{
              const s=sc(f.status);
              return (
                <div key={f.id} onClick={()=>onTap(f)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid rgba(255,255,255,0.15)`, borderRadius:20, padding:"6px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:12, color:"#ffffff", fontFamily:C.mono, fontWeight:700 }}>{f.iata} · {f.dep}–{f.arr}</span>
                  <div style={{ width:7, height:7, borderRadius:4, background:s.c, flexShrink:0 }}/>
                </div>
              );
            })}
          </div>
        </div>
        {/* Legend */}
        <div style={{ display:"flex", gap:12, marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, flexWrap:"wrap" }}>
          {[["#00e87a","On Time"],["#ffc800","Delayed"],["#a78bfa","Gate Change"],["#ff3a54","Cancelled"]].map(([c,l])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:4, background:c }}/>
              <span style={{ fontSize:10, color:C.muted, fontFamily:C.mono }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OUTBOUND */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:11, color:C.orange, fontFamily:C.mono, fontWeight:700, letterSpacing:2 }}>OUTBOUND · APR 22</div>
        {outbound.length > 1 && (
          <div onClick={()=>setShowOutboundAll(o=>!o)} style={{ fontSize:11, color:C.accent, cursor:"pointer", fontFamily:C.mono }}>
            {showOutboundAll ? "Hide ▲" : `All ${outbound.length} flights ▼`}
          </div>
        )}
      </div>
      {renderFlightGroup(outbound, showOutboundAll, setShowOutboundAll)}

      {/* RETURN — collapsed by default */}
      <div onClick={()=>setShowReturn(o=>!o)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:20, marginBottom:showReturn?12:0, cursor:"pointer", background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"13px 16px" }}>
        <div>
          <div style={{ fontSize:11, color:C.accent, fontFamily:C.mono, fontWeight:700, letterSpacing:2, marginBottom:4 }}>RETURN · APR 27</div>
          <div style={{ fontSize:12, color:C.soft }}>CUZ → LIM → MIA · 2 flights</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {returnFlights.map(f=>{ const s=sc(f.status); return <div key={f.id} style={{ width:8, height:8, borderRadius:4, background:s.c }}/>; })}
          <span style={{ fontSize:14, color:C.accent, marginLeft:4 }}>{showReturn?"▲":"▼"}</span>
        </div>
      </div>
      {showReturn && <div style={{ marginTop:12 }}>{renderFlightGroup(returnFlights, showReturnAll, setShowReturnAll)}</div>}

      {/* Leave by card */}
      <div style={{ background:C.card, borderRadius:20, border:`1px solid ${lc.br}`, overflow:"hidden", marginTop:16, marginBottom:14 }}>
        <div onClick={()=>setLeaveState(s=>s==="later"?"soon":s==="soon"?"now":"later")} style={{ background:lc.bg, padding:"13px 16px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", borderBottom:`1px solid ${lc.br}` }}>
          <span style={{ fontSize:22 }}>{lc.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:800, color:lc.c, letterSpacing:1.5, fontFamily:C.mono }}>{lc.label}</div>
            <div style={{ fontSize:13, color:C.soft }}>{lc.sub}</div>
          </div>
          <span style={{ fontSize:10, color:lc.c, fontFamily:C.mono, border:`1px solid ${lc.br}`, borderRadius:5, padding:"3px 8px" }}>TAP DEMO</span>
        </div>
        <div style={{ padding:"16px" }}>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:2, fontFamily:C.mono, fontWeight:700, marginBottom:4, textAlign:"center" }}>LEAVE HOME BY</div>
          <div style={{ fontFamily:C.display, fontSize:64, color:lc.c, lineHeight:1, letterSpacing:2, marginBottom:16, textAlign:"center" }}>{lc.time}</div>
          <div style={{ display:"flex", background:C.surface, borderRadius:12, overflow:"hidden", marginBottom:14, border:`1px solid ${C.border}` }}>
            {[["🚗","Drive","38 min"],["🚦","Traffic","+12m"],["📍","Dist","22 mi"],["✈️","Buffer","2.5h"]].map(([icon,label,val],i)=>(
              <div key={label} style={{ flex:1, padding:"11px 0", textAlign:"center", borderRight:i<3?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontSize:18, marginBottom:3 }}>{icon}</div>
                <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:0.8, marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:C.mono, color:label==="Traffic"?C.yellow:C.text }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:C.surface, borderRadius:11, padding:"11px 14px", marginBottom:14, border:`1px solid ${C.border}` }}>
            <span style={{ fontSize:20 }}>🏠</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1.5, marginBottom:2 }}>FROM</div>
              <div style={{ fontSize:14, color:C.text, fontWeight:600 }}>Miami, FL</div>
            </div>
            <span style={{ fontSize:13, color:C.accent, cursor:"pointer" }}>Change</span>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {NAV_APPS.map((a,i)=>{
              const active=i===navIdx;
              return (
                <div key={a.id} onClick={()=>setNavIdx(i)} style={{ flex:1, background:active?a.bg:C.surface, border:`2px solid ${active?a.color:C.border}`, borderRadius:13, padding:"12px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer", transition:"all 0.2s" }}>
                  <NavLogo app={a} size={28}/>
                  <span style={{ fontSize:10, fontWeight:700, fontFamily:C.mono, color:active?a.color:C.soft }}>{a.label}</span>
                </div>
              );
            })}
          </div>
          <div onClick={()=>alert(`Opening ${app.label} → Miami International Airport`)} style={{ background:`linear-gradient(135deg,${app.color},${app.color}bb)`, borderRadius:14, padding:"15px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:"pointer" }}>
            <NavLogo app={app} size={22}/>
            <span style={{ fontSize:15, fontWeight:800, color:"#000" }}>Get Directions in {app.label}</span>
          </div>
        </div>
      </div>

      <div onClick={onAdd} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.surface, borderRadius:14, border:`1px dashed ${C.border}`, padding:"15px 0", cursor:"pointer" }}>
        <span style={{ fontSize:20, color:C.soft }}>+</span>
        <span style={{ fontSize:14, fontWeight:700, color:C.soft }}>Add another flight</span>
      </div>
    </div>
  );
}

function WeatherScreen() {
  const airports = [];
  FLIGHTS.forEach(f=>{
    if(!airports.find(a=>a.code===f.dep)) airports.push({code:f.dep,type:"dep",wx:f.wx?.dep,flight:f.iata});
    if(!airports.find(a=>a.code===f.arr)) airports.push({code:f.arr,type:"arr",wx:f.wx?.arr,flight:f.iata});
  });
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:16 }}>
        <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:12 }}>YOUR ROUTE</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", flexWrap:"wrap", gap:8 }}>
          {airports.map((a,i)=>{
            const w=a.wx; if(!w) return null;
            return (
              <div key={a.code} style={{ display:"flex", alignItems:"center" }}>
                <div style={{ textAlign:"center" }}>
                  <span style={{ fontSize:28 }}>{w.icon}</span>
                  <div style={{ fontSize:16, fontWeight:800, color:C.text, fontFamily:C.mono, marginTop:3 }}>{a.code}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{w.temp}°F</div>
                </div>
                {i<airports.length-1&&<span style={{ fontSize:16, color:C.muted, padding:"0 8px" }}>→</span>}
              </div>
            );
          })}
        </div>
      </div>
      {airports.map(a=>{
        const w=a.wx; if(!w) return null;
        return (
          <div key={a.code} style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, padding:18, marginBottom:12 }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:1.5, marginBottom:12 }}>{a.type==="dep"?"🛫 DEPARTING FROM":"🛬 ARRIVING INTO"} · {a.flight}</div>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
              <span style={{ fontSize:48 }}>{w.icon}</span>
              <div>
                <div style={{ fontSize:44, fontFamily:C.display, color:C.text, lineHeight:1, marginBottom:4 }}>{w.temp}°F</div>
                <div style={{ fontSize:15, color:C.soft }}>{w.cond}</div>
                <div style={{ fontSize:13, color:C.muted }}>💨 {w.wind}mph wind</div>
              </div>
            </div>
            <div style={{ background:"rgba(0,232,122,0.08)", borderRadius:11, padding:"11px 14px", border:"1px solid rgba(0,232,122,0.2)", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:18 }}>✅</span>
              <div style={{ fontSize:13, color:C.soft }}>{w.note}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FamilyScreen() {
  const [sel, setSel] = useState(null);
  const people = [
    { name:"Mom", initials:"M", color:"#a78bfa", flight:"DL 204", dep:"ATL", arr:"JFK", status:"On Time", eta:"4:20 PM" },
    { name:"Jake", initials:"J", color:"#00e87a", flight:"SW 881", dep:"ORD", arr:"LAX", status:"Departed", eta:"3:15 PM" },
    { name:"Sarah", initials:"S", color:"#ff5c2b", flight:"BA 178", dep:"LHR", arr:"JFK", status:"Delayed", eta:"8:00 PM" },
  ];
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, background:C.card, borderRadius:16, border:`1px dashed ${C.border}`, padding:"16px", marginBottom:14, cursor:"pointer" }}>
        <div style={{ width:46, height:46, borderRadius:23, background:C.surface, border:`2px dashed ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>+</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.soft }}>Add family member</div>
          <div style={{ fontSize:13, color:C.muted }}>Track their flights alongside yours</div>
        </div>
      </div>
      {people.map((p,i)=>{
        const s=sc(p.status); const isSel=sel===i;
        return (
          <div key={i} onClick={()=>setSel(isSel?null:i)} style={{ background:C.card, borderRadius:18, border:`1px solid ${isSel?p.color+"55":C.border}`, padding:"16px", marginBottom:10, cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:isSel?14:0 }}>
              <div style={{ width:50, height:50, borderRadius:25, background:`${p.color}22`, border:`2px solid ${p.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:p.color, fontFamily:C.mono, flexShrink:0 }}>{p.initials}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:800, color:C.text }}>{p.name}</div>
                <div style={{ fontSize:13, color:C.soft, fontFamily:C.mono }}>{p.flight} · {p.dep} → {p.arr}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ background:s.bg, border:`1px solid ${s.br}`, borderRadius:20, padding:"4px 11px", fontSize:11, color:s.c, fontWeight:700, fontFamily:C.mono, marginBottom:4 }}>{p.status}</div>
                <div style={{ fontSize:12, color:C.muted }}>ETA {p.eta}</div>
              </div>
            </div>
            {isSel&&(
              <div style={{ display:"flex", gap:8 }}>
                <div onClick={e=>{e.stopPropagation();alert("Opening live link...");}} style={{ flex:1, background:"rgba(0,200,240,0.08)", border:"1px solid rgba(0,200,240,0.2)", borderRadius:11, padding:"13px 0", textAlign:"center", cursor:"pointer" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.accent }}>🔗 Live Link</span>
                </div>
                <div onClick={e=>{e.stopPropagation();alert("Opening pickup route...");}} style={{ flex:1, background:"rgba(0,232,122,0.08)", border:"1px solid rgba(0,232,122,0.2)", borderRadius:11, padding:"13px 0", textAlign:"center", cursor:"pointer" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.green }}>🚗 Pickup Route</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PassportScreen() {
  const p = { miles:124580, flights:47, airports:23, countries:8, streak:3, airline:"American Airlines", yr:{flights:12,miles:28400}, badges:["🌍 Globe Trotter","✈️ Jet Setter","🔗 Connection Pro","⚡ Early Bird"] };
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ background:"linear-gradient(135deg,rgba(0,200,240,0.1),rgba(255,92,43,0.06))", borderRadius:20, border:"1px solid rgba(0,200,240,0.2)", padding:"24px 18px", marginBottom:14, textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.soft, fontFamily:C.mono, letterSpacing:2, marginBottom:6 }}>LIFETIME MILES</div>
        <div style={{ fontFamily:C.display, fontSize:58, color:C.accent, letterSpacing:4, lineHeight:1, marginBottom:6 }}>{p.miles.toLocaleString()}</div>
        <div style={{ fontSize:14, color:C.soft }}>{Math.round(p.miles/24902)}× around the Earth 🌍</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[["✈️","Flights",p.flights],["🏛️","Airports",p.airports],["🌍","Countries",p.countries],["🔥","Streak",`${p.streak} trips`]].map(([icon,label,val])=>(
          <div key={label} style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"18px", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
            <div style={{ fontFamily:C.display, fontSize:36, color:C.text, lineHeight:1, marginBottom:4 }}>{val}</div>
            <div style={{ fontSize:11, color:C.soft, fontFamily:C.mono, letterSpacing:1 }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px", marginBottom:12 }}>
        <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:12 }}>2026 SO FAR</div>
        <div style={{ display:"flex", gap:24 }}>
          <div><div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginBottom:4 }}>FLIGHTS</div><div style={{ fontSize:28, fontWeight:800, color:C.accent, fontFamily:C.mono }}>{p.yr.flights}</div></div>
          <div><div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginBottom:4 }}>MILES</div><div style={{ fontSize:28, fontWeight:800, color:C.orange, fontFamily:C.mono }}>{p.yr.miles.toLocaleString()}</div></div>
          <div style={{ flex:1 }}><div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginBottom:4 }}>TOP AIRLINE</div><div style={{ fontSize:13, fontWeight:700, color:C.text, marginTop:4 }}>{p.airline}</div></div>
        </div>
      </div>
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px" }}>
        <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:12 }}>ACHIEVEMENTS</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {p.badges.map(b=><div key={b} style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:20, padding:"7px 14px", fontSize:13, color:C.purple, fontWeight:600 }}>{b}</div>)}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"7px 14px", fontSize:13, color:C.muted }}>🔒 5 more</div>
        </div>
      </div>
    </div>
  );
}

function PlansScreen() {
  const tiers = [
    { id:"free", name:"Free", price:"$0", period:"forever", color:C.soft, bg:"rgba(78,112,144,0.08)", border:"rgba(78,112,144,0.2)", tag:null,
      features:["Track up to 2 flights","Basic status updates","Leave-by time","Share 1 trip link"], missing:["Family tracking","Unlimited flights","Corporate dashboard","Priority support"],
      cta:"Current Plan", ctaStyle:{ background:C.surface, color:C.soft, border:`1px solid ${C.border}` } },
    { id:"pro", name:"Pro", price:"$19.99", period:"per year", color:C.accent, bg:"rgba(0,200,240,0.08)", border:"rgba(0,200,240,0.28)", tag:"MOST POPULAR",
      features:["Unlimited flight tracking","Family tracker (5 members)","Unlimited share links","AI delay explanations","Weather alerts","VIP lounge finder","Priority support"], missing:[],
      cta:"Upgrade to Pro", ctaStyle:{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, color:"#000" } },
    { id:"corporate", name:"Corporate", price:"$9", period:"per seat/month", color:C.purple, bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.28)", tag:"FOR TEAMS",
      features:["Everything in Pro","Admin dashboard","All employee flights","Manager delay alerts","CSV bulk import","SSO login","Expense integration","Dedicated account manager"], missing:[],
      cta:"Contact Sales", ctaStyle:{ background:`linear-gradient(135deg,${C.purple},#7c3aed)`, color:"#fff" } },
  ];
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      {tiers.map(t=>(
        <div key={t.id} style={{ background:t.bg, borderRadius:20, border:`2px solid ${t.border}`, padding:"20px 16px", marginBottom:16, position:"relative" }}>
          {t.tag&&<div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:t.color, borderRadius:20, padding:"4px 16px", fontSize:11, fontWeight:800, color:"#000", fontFamily:C.mono, letterSpacing:1, whiteSpace:"nowrap" }}>{t.tag}</div>}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, marginTop:t.tag?8:0 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:t.color, marginBottom:2 }}>{t.name}</div>
              <div style={{ fontSize:12, color:C.soft }}>{t.id==="corporate"?"Billed annually · min 5 seats":"Billed annually"}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:36, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{t.price}</div>
              <div style={{ fontSize:12, color:C.soft }}>{t.period}</div>
            </div>
          </div>
          {t.features.map(f=><div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}><span style={{ fontSize:15, color:t.color }}>✓</span><span style={{ fontSize:14, color:C.text }}>{f}</span></div>)}
          {t.missing.map(f=><div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}><span style={{ fontSize:15, color:C.muted }}>✕</span><span style={{ fontSize:14, color:C.muted }}>{f}</span></div>)}
          <div onClick={()=>alert(t.id==="free"?"You're on the free plan!":t.id==="pro"?"Redirecting to checkout...":"We'll connect you with our sales team!")}
            style={{ ...t.ctaStyle, borderRadius:13, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, cursor:"pointer", marginTop:18 }}>
            {t.cta} {t.id!=="free"&&"→"}
          </div>
        </div>
      ))}
    </div>
  );
}

function CorporateDashboard({ onClose }) {
  const [filter, setFilter] = useState("all");
  const [selEmp, setSelEmp] = useState(null);
  const filtered = filter==="all"?EMPLOYEES:filter==="issue"?EMPLOYEES.filter(e=>e.delay>0||e.status==="Cancelled"):EMPLOYEES.filter(e=>e.dept===filter);
  const delayed=EMPLOYEES.filter(e=>e.delay>0).length;
  const cancelled=EMPLOYEES.filter(e=>e.status==="Cancelled").length;
  const inAir=EMPLOYEES.filter(e=>e.status==="Departed"||e.status==="In Air").length;
  const onTime=EMPLOYEES.filter(e=>e.status==="On Time"||e.status==="Landed").length;

  if (selEmp) {
    const s=sc(selEmp.status);
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
              <div style={{ fontSize:13, color:C.soft }}>{selEmp.dept} · {selEmp.phone}</div>
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
                <span style={{ position:"absolute", top:"50%", left:`${Math.max(5,Math.min(90,selEmp.progress))}%`, transform:"translate(-50%,-50%)", fontSize:16 }}>✈</span>
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
          {selEmp.status==="Cancelled"&&(
            <div style={{ background:"rgba(255,58,84,0.08)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:14, padding:"14px", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.red, marginBottom:6 }}>⚠️ Flight Cancelled</div>
              <div onClick={()=>alert("Alerting travel manager...")} style={{ background:`linear-gradient(135deg,${C.orange},#cc3300)`, borderRadius:11, padding:"12px 0", textAlign:"center", fontWeight:800, fontSize:13, color:"#fff", cursor:"pointer" }}>Alert Travel Manager →</div>
            </div>
          )}
          {selEmp.delay>0&&(
            <div style={{ background:"rgba(255,200,0,0.07)", border:"1px solid rgba(255,200,0,0.22)", borderRadius:14, padding:"14px", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.yellow, marginBottom:6 }}>⏰ Delayed {selEmp.delay} min</div>
              <div onClick={()=>alert("Sending delay notification...")} style={{ background:`linear-gradient(135deg,${C.yellow},#cc9900)`, borderRadius:11, padding:"12px 0", textAlign:"center", fontWeight:800, fontSize:13, color:"#000", cursor:"pointer" }}>Notify Manager →</div>
            </div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            {[["📞","Call"],["💬","Message"],["🔗","Track"]].map(([icon,label])=>(
              <div key={label} onClick={()=>alert(`${label}ing ${selEmp.name}...`)} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:20, marginBottom:3 }}>{icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.soft }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onClose} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Corporate Dashboard</div>
          <div style={{ fontSize:12, color:C.soft }}>Acme Corp · 6 traveling today</div>
        </div>
        <div style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, color:C.purple, fontFamily:C.mono }}>CORP</div>
      </div>
      <div style={{ padding:"14px 14px 100px" }}>
        {(delayed>0||cancelled>0)&&(
          <div style={{ background:"rgba(255,58,84,0.08)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:14, padding:"12px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:20 }}>🚨</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:1 }}>Action needed</div>
              <div style={{ fontSize:12, color:C.soft }}>{cancelled>0?`${cancelled} cancellation · `:""}{delayed>0?`${delayed} delayed`:""}</div>
            </div>
            <div onClick={()=>setFilter("issue")} style={{ background:C.red, borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>
              <span style={{ fontSize:11, fontWeight:800, color:"#fff" }}>Review</span>
            </div>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
          {[["✈️","In Air",inAir,C.accent],["✅","On Time",onTime,C.green],["⏰","Delayed",delayed,C.yellow],["❌","Cancelled",cancelled,C.red]].map(([icon,label,val,color])=>(
            <div key={label} style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:"10px 6px", textAlign:"center" }}>
              <div style={{ fontSize:16, marginBottom:3 }}>{icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color, fontFamily:C.mono, lineHeight:1, marginBottom:2 }}>{val}</div>
              <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          {[["all","All"],["issue","🚨 Issues"],["Sales","Sales"],["Eng","Eng"],["Exec","Exec"]].map(([id,label])=>(
            <div key={id} onClick={()=>setFilter(id)} style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:C.mono, background:filter===id?"rgba(0,200,240,0.12)":"transparent", color:filter===id?C.accent:C.soft, border:`1px solid ${filter===id?"rgba(0,200,240,0.3)":C.border}` }}>
              {label}
            </div>
          ))}
        </div>
        {filtered.map(emp=>{
          const s=sc(emp.status);
          const hasIssue=emp.delay>0||emp.status==="Cancelled";
          return (
            <div key={emp.id} onClick={()=>setSelEmp(emp)} style={{ background:C.card, borderRadius:16, border:`1px solid ${hasIssue?(emp.status==="Cancelled"?"rgba(255,58,84,0.3)":"rgba(255,200,0,0.25)"):C.border}`, padding:"12px 14px", marginBottom:8, cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:19, background:`${emp.color}22`, border:`2px solid ${emp.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:emp.color, fontFamily:C.mono, flexShrink:0 }}>{emp.avatar}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:14, fontWeight:800, color:C.text }}>{emp.name}</span>
                    <span style={{ fontSize:9, color:C.muted, background:C.surface, borderRadius:4, padding:"1px 5px", fontFamily:C.mono }}>{emp.dept}</span>
                  </div>
                  <div style={{ fontSize:11, color:C.soft, fontFamily:C.mono }}>{emp.flight} · {emp.dep} → {emp.arr}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ background:s.bg, border:`1px solid ${s.br}`, borderRadius:20, padding:"2px 8px", fontSize:9, color:s.c, fontWeight:700, fontFamily:C.mono, marginBottom:3 }}>{emp.status}</div>
                  {emp.delay>0&&<div style={{ fontSize:10, color:C.yellow, fontFamily:C.mono }}>+{emp.delay}m</div>}
                  {emp.status==="Cancelled"&&<div style={{ fontSize:10, color:C.red }}>Needs rebooking</div>}
                  {!emp.delay&&emp.status!=="Cancelled"&&<div style={{ fontSize:10, color:C.muted }}>{emp.eta}</div>}
                </div>
              </div>
              {emp.progress>0&&emp.progress<100&&(
                <div style={{ height:2.5, background:C.surface, borderRadius:2, overflow:"hidden", marginTop:8 }}>
                  <div style={{ height:2.5, width:`${emp.progress}%`, background:`linear-gradient(90deg,${C.accent},${C.orange})`, borderRadius:2 }}/>
                </div>
              )}
            </div>
          );
        })}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
          <div onClick={()=>alert("Exporting travel report...")} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px", textAlign:"center", cursor:"pointer" }}>
            <div style={{ fontSize:22, marginBottom:5 }}>📊</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Export Report</div>
          </div>
          <div onClick={()=>alert("Opening settings...")} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px", textAlign:"center", cursor:"pointer" }}>
            <div style={{ fontSize:22, marginBottom:5 }}>⚙️</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Settings</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ active, onNav }) {
  const tabs = [
    { id:"flights", icon:"✈️", label:"Flights" },
    { id:"weather", icon:"🌤️", label:"Weather" },
    { id:"family", icon:"👨‍👩‍👧", label:"Family" },
    { id:"passport", icon:"📊", label:"Passport" },
    { id:"plans", icon:"⭐", label:"Plans" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(4,7,14,0.98)", borderTop:`1px solid ${C.border}`, zIndex:20 }}>
      <div style={{ display:"flex", padding:"8px 8px 22px", maxWidth:480, margin:"0 auto" }}>
        {tabs.map(t=>(
          <div key={t.id} onClick={()=>onNav(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", padding:"6px 0" }}>
            <span style={{ fontSize:22 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, fontFamily:C.mono, color:active===t.id?C.accent:C.muted }}>{t.label}</span>
            {active===t.id&&<div style={{ width:20, height:3, borderRadius:2, background:C.accent }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyRunway() {
  const [tab, setTab] = useState("flights");
  const [showAdd, setShowAdd] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCorp, setShowCorp] = useState(false);
  const [leaveState, setLeaveState] = useState("later");
  const [navIdx, setNavIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(()=>{ const i=setInterval(()=>setTick(n=>n+1),2000); return()=>clearInterval(i); },[]);

  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:C.sans, maxWidth:480, margin:"0 auto", position:"relative" }}>
      <style>{`::-webkit-scrollbar{display:none} *{box-sizing:border-box}`}</style>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:10, height:10, borderRadius:5, background:C.orange, boxShadow:tick%2===0?`0 0 14px ${C.orange}`:"none", transition:"box-shadow 1.5s" }}/>
          <span style={{ fontFamily:C.display, fontSize:24, color:C.accent, letterSpacing:5 }}>MY RUNWAY</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div onClick={()=>setShowAdd(true)} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:10, padding:"9px 14px", cursor:"pointer" }}>
            <span style={{ fontSize:13, color:"#000", fontWeight:800 }}>+ Add Flight</span>
          </div>
          <div onClick={()=>setShowCorp(true)} style={{ background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:10, padding:"9px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:13 }}>🏢</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.purple }}>Corp</span>
          </div>
          <div onClick={()=>setShowShare(true)} style={{ background:"rgba(0,200,240,0.07)", border:"1px solid rgba(0,200,240,0.15)", borderRadius:10, padding:"9px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:13 }}>🔗</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.accent }}>Share</span>
          </div>
        </div>
      </div>
      <div style={{ padding:"18px 16px 0" }}>
        <div style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4 }}>
          {tab==="flights"?"My Flights":tab==="weather"?"Airport Weather":tab==="family"?"Family Tracker":tab==="plans"?"Plans & Pricing":"My Passport"}
        </div>
        <div style={{ fontSize:14, color:C.soft }}>
          {tab==="flights"?"Your Peru trip · Apr 22–28":tab==="weather"?"Conditions at every stop":tab==="family"?"Everyone's flights in one place":tab==="plans"?"Choose the right plan":"Your lifetime flying history"}
        </div>
      </div>
      <div style={{ flex:1 }}>
        {tab==="flights"&&<FlightsScreen onTap={f=>alert(`${f.iata}: ${f.dep} → ${f.arr}\nStatus: ${f.status}\nGate: ${f.gate} · Terminal: ${f.terminal}\nConf#: ${f.conf}\n${f.date}`)} onAdd={()=>setShowAdd(true)} leaveState={leaveState} setLeaveState={setLeaveState} navIdx={navIdx} setNavIdx={setNavIdx}/>}
        {tab==="weather"&&<WeatherScreen/>}
        {tab==="family"&&<FamilyScreen/>}
        {tab==="passport"&&<PassportScreen/>}
        {tab==="plans"&&<PlansScreen/>}
      </div>
      <BottomNav active={tab} onNav={t=>setTab(t)}/>
      {showAdd&&<AddModal onClose={()=>setShowAdd(false)}/>}
      {showShare&&<ShareModal onClose={()=>setShowShare(false)}/>}
      {showCorp&&<CorporateDashboard onClose={()=>setShowCorp(false)}/>}
    </div>
  );
}
