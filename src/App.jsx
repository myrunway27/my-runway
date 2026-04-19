import { useState, useEffect } from "react";

const C = {
  bg:"#04070e", surface:"#090f1c", card:"#0d1525", border:"#13203a",
  accent:"#00c8f0", orange:"#ff5c2b", green:"#00e87a", yellow:"#ffc800",
  red:"#ff3a54", purple:"#a78bfa",
  text:"#d4ecff", muted:"#1e3050", soft:"#4e7090",
  mono:"'Courier New',monospace",
  sans:"system-ui,-apple-system,sans-serif",
  display:"Impact,'Arial Narrow',Arial,sans-serif",
};

const FLIGHTS = [
  {
    id:"f1", iata:"AA 1307", code:"AA", airline:"American Airlines",
    dep:"MIA", arr:"LIM", depTime:"3:51 PM", arrTime:"8:30 PM",
    depFull:"Miami Intl (MIA)", arrFull:"Jorge Chávez Intl · Lima",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"D",
    aircraft:"Boeing 737", alt:null, spd:null,
    date:"Wed Apr 22, 2026", conf:"WKZGIC",
    inbound:null, aiReason:null,
    wx:{
      dep:{ icon:"🌤️", temp:82, cond:"Partly Cloudy", impact:"LOW", wind:12, note:"Good departure conditions" },
      arr:{ icon:"🌥️", temp:68, cond:"Overcast", impact:"LOW", wind:9, note:"Typical Lima overcast" },
    },
    conn:{
      from:"LIM Arrivals", to:"LIM Gate — LA 2166",
      walkMins:35, layoverMins:190, buffer:155,
      transport:"Terminal walk", urgency:"comfortable",
      steps:[
        { icon:"🛬", label:"Deplane & immigration", mins:25 },
        { icon:"🚶", label:"Walk to domestic gates", mins:10 },
      ],
    },
  },
  {
    id:"f2", iata:"LA 2166", code:"LA", airline:"LATAM Airlines",
    dep:"LIM", arr:"CUZ", depTime:"11:40 PM", arrTime:"1:00 AM",
    depFull:"Jorge Chávez Intl · Lima", arrFull:"Alejandro Velasco Astete · Cusco",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"TBD",
    aircraft:"Airbus A319", alt:null, spd:null,
    date:"Apr 22–23, 2026", conf:"NATBMU",
    inbound:null, aiReason:null,
    wx:{
      dep:{ icon:"🌥️", temp:66, cond:"Overcast", impact:"LOW", wind:8, note:"Normal Lima night" },
      arr:{ icon:"🌙", temp:44, cond:"Clear night", impact:"LOW", wind:5, note:"Cusco at 11,200ft — cold!" },
    },
    conn:null,
  },
  {
    id:"f3", iata:"H2 5012", code:"H2", airline:"Sky Airline",
    dep:"CUZ", arr:"LIM", depTime:"6:15 PM", arrTime:"8:00 PM",
    depFull:"Alejandro Velasco Astete · Cusco", arrFull:"Jorge Chávez Intl · Lima",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"TBD",
    aircraft:"Airbus A320", alt:null, spd:null,
    date:"Mon Apr 27, 2026", conf:"JNNAYS",
    inbound:null, aiReason:null,
    wx:{
      dep:{ icon:"⛅", temp:55, cond:"Partly Cloudy", impact:"LOW", wind:10, note:"Watch for mountain weather" },
      arr:{ icon:"🌥️", temp:67, cond:"Overcast", impact:"LOW", wind:8, note:"Typical Lima evening" },
    },
    conn:{
      from:"LIM Arrivals", to:"LIM Gate — AA 988",
      walkMins:40, layoverMins:225, buffer:185,
      transport:"Terminal walk", urgency:"comfortable",
      steps:[
        { icon:"🛬", label:"Deplane & walk to intl", mins:15 },
        { icon:"🛂", label:"Check-in AA / bag drop", mins:25 },
      ],
    },
  },
  {
    id:"f4", iata:"AA 988", code:"AA", airline:"American Airlines",
    dep:"LIM", arr:"MIA", depTime:"11:45 PM", arrTime:"6:40 AM",
    depFull:"Jorge Chávez Intl · Lima", arrFull:"Miami Intl (MIA)",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"TBD",
    aircraft:"Boeing 737", alt:null, spd:null,
    date:"Apr 27–28, 2026", conf:"GPHCIF",
    inbound:null, aiReason:null,
    wx:{
      dep:{ icon:"🌙", temp:64, cond:"Clear night", impact:"LOW", wind:7, note:"Clear departure" },
      arr:{ icon:"🌤️", temp:79, cond:"Sunny", impact:"LOW", wind:14, note:"Morning arrival Miami" },
    },
    conn:null,
  },
];

const NAV_APPS = [
  { id:"waze", label:"Waze", color:"#00AFFF", bg:"rgba(0,175,255,0.12)", border:"rgba(0,175,255,0.3)", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Waze_icon.svg/96px-Waze_icon.svg.png" },
  { id:"google", label:"Google Maps", color:"#4285F4", bg:"rgba(66,133,244,0.12)", border:"rgba(66,133,244,0.3)", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Google_Maps_Logo_2020.svg/96px-Google_Maps_Logo_2020.svg.png" },
  { id:"apple", label:"Apple Maps", color:"#6eb5ff", bg:"rgba(110,181,255,0.12)", border:"rgba(110,181,255,0.3)", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Apple_Maps_logo_2020.svg/96px-Apple_Maps_logo_2020.svg.png" },
];

const LEAVE_CFG = {
  later:{ c:C.green, bg:"rgba(0,232,122,0.07)", br:"rgba(0,232,122,0.18)", icon:"✅", label:"ON TRACK", time:"6:45 AM", sub:"Leave in 2h 22m" },
  soon: { c:C.yellow, bg:"rgba(255,200,0,0.07)", br:"rgba(255,200,0,0.18)", icon:"⏰", label:"LEAVING SOON", time:"6:45 AM", sub:"Leave in 48 min" },
  now:  { c:C.red, bg:"rgba(255,58,84,0.07)", br:"rgba(255,58,84,0.18)", icon:"🚨", label:"LEAVE NOW", time:"6:45 AM", sub:"Only 12 minutes!" },
};

function sc(s) {
  if(s==="On Time"||s==="Scheduled") return { c:C.green, bg:"rgba(0,232,122,0.1)", br:"rgba(0,232,122,0.25)" };
  if(s==="Departed") return { c:C.accent, bg:"rgba(0,200,240,0.1)", br:"rgba(0,200,240,0.25)" };
  if(s==="Delayed") return { c:C.yellow, bg:"rgba(255,200,0,0.1)", br:"rgba(255,200,0,0.25)" };
  if(s==="Landed") return { c:C.green, bg:"rgba(0,232,122,0.1)", br:"rgba(0,232,122,0.25)" };
  if(s==="Cancelled") return { c:C.red, bg:"rgba(255,58,84,0.1)", br:"rgba(255,58,84,0.25)" };
  return { c:C.soft, bg:"rgba(78,112,144,0.1)", br:"rgba(78,112,144,0.25)" };
}

function AirlineLogo({ code, size=26 }) {
  const [err, setErr] = useState(false);
  const colors = { AA:"#0078D2", UA:"#005DAA", DL:"#C01933", WN:"#304CB2", BA:"#075AAA" };
  if (err) return <div style={{ width:size, height:size, borderRadius:7, background:colors[code]||"#334", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.38, fontWeight:800, color:"#fff", fontFamily:C.mono, flexShrink:0 }}>{code}</div>;
  return <img src={`https://airhex.com/images/airline-logos/${code.toLowerCase()}.png`} alt={code} onError={()=>setErr(true)} style={{ width:size, height:size, borderRadius:7, objectFit:"contain", background:"rgba(255,255,255,0.05)", padding:2, flexShrink:0 }}/>;
}

function NavLogo({ app, size=28 }) {
  const [err, setErr] = useState(false);
  const fb = { waze:"🚗", google:"🗺️", apple:"🍎" };
  if (err) return <span style={{ fontSize:size*0.7 }}>{fb[app.id]}</span>;
  return <img src={app.logo} alt={app.label} onError={()=>setErr(true)} style={{ width:size, height:size, objectFit:"contain", borderRadius:size*0.2, flexShrink:0 }}/>;
}

function StatusPill({ status }) {
  const s = sc(status);
  return <span style={{ background:s.bg, border:`1px solid ${s.br}`, borderRadius:20, padding:"3px 11px", fontSize:11, color:s.c, fontWeight:700, fontFamily:C.mono, whiteSpace:"nowrap" }}>{status}</span>;
}

function Arc({ progress=0, color=C.accent, w=200 }) {
  const h=36, cx=w/2, px=10+(progress/100)*(w-20), py=h-8-Math.sin((progress/100)*Math.PI)*14;
  return (
    <svg width={w} height={h} style={{ overflow:"visible", display:"block" }}>
      <path d={`M 10 ${h-6} Q ${cx} ${h-30} ${w-10} ${h-6}`} fill="none" stroke={C.border} strokeWidth="1.5" strokeDasharray="3 3"/>
      {progress>0&&<path d={`M 10 ${h-6} Q ${cx} ${h-30} ${px} ${py}`} fill="none" stroke={color} strokeWidth="1.5" opacity="0.5"/>}
      <circle cx="10" cy={h-6} r="3.5" fill={C.surface} stroke={color} strokeWidth="1.5"/>
      <circle cx={w-10} cy={h-6} r="3.5" fill={C.surface} stroke={color} strokeWidth="1.5"/>
      <text x={px} y={py+1} fontSize="16" textAnchor="middle" dominantBaseline="middle">✈</text>
    </svg>
  );
}

function ConnBridge({ conn }) {
  const [open, setOpen] = useState(false);
  const uc = { c:C.green, bg:"rgba(0,232,122,0.07)", br:"rgba(0,232,122,0.2)" };
  return (
    <div style={{ background:uc.bg, borderRadius:16, border:`1px solid ${uc.br}`, overflow:"hidden", marginBottom:10 }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ padding:"11px 16px", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:uc.c, marginBottom:1 }}>✅ Comfortable connection</div>
          <div style={{ fontSize:12, color:C.soft }}>{conn.from} → {conn.to} · {conn.walkMins} min walk · {conn.buffer} min spare</div>
        </div>
        <span style={{ fontSize:12, color:C.muted }}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{ padding:"0 16px 14px", borderTop:`1px solid ${uc.br}` }}>
          <div style={{ display:"flex", gap:0, marginBottom:12, paddingTop:12 }}>
            {[["LAYOVER",`${Math.floor(conn.layoverMins/60)}h${conn.layoverMins%60}m`,C.text],["WALKING",`${conn.walkMins}m`,C.yellow],["BUFFER",`${conn.buffer}m`,uc.c]].map(([l,v,c],i)=>(
              <div key={l} style={{ flex:1, textAlign:"center", borderRight:i<2?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:20, fontWeight:800, color:c, fontFamily:C.mono }}>{v}</div>
              </div>
            ))}
          </div>
          {conn.steps.map((s,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:i<conn.steps.length-1?8:0 }}>
              <span style={{ fontSize:16, width:22, textAlign:"center" }}>{s.icon}</span>
              <div style={{ flex:1, fontSize:13, color:C.text }}>{s.label}</div>
              <div style={{ fontSize:12, fontWeight:700, color:C.yellow, fontFamily:C.mono }}>{s.mins} min</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FlightsScreen({ onTap, onAdd, leaveState, setLeaveState, navIdx, setNavIdx }) {
  const lc = LEAVE_CFG[leaveState];
  const app = NAV_APPS[navIdx];
  return (
    <div style={{ padding:"14px 14px 80px" }}>
      {FLIGHTS.map((f,i)=>{
        const s=sc(f.status);
        return (
          <div key={f.id}>
            <div onClick={()=>onTap(f)} style={{ background:C.card, borderRadius:20, border:`1px solid ${C.border}`, padding:16, marginBottom:8, cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <AirlineLogo code={f.code} size={24}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:C.text, fontFamily:C.mono }}>{f.iata}</div>
                  <div style={{ fontSize:11, color:C.soft }}>{f.airline}</div>
                </div>
                <StatusPill status={f.status}/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ textAlign:"center", minWidth:44 }}>
                  <div style={{ fontSize:26, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{f.dep}</div>
                  <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginTop:2 }}>{f.depTime}</div>
                </div>
                <div style={{ flex:1 }}><Arc progress={f.progress} color={s.c}/></div>
                <div style={{ textAlign:"center", minWidth:44 }}>
                  <div style={{ fontSize:26, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{f.arr}</div>
                  <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginTop:2 }}>{f.arrTime}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:f.wx?10:0 }}>
                <span style={{ background:C.surface, borderRadius:8, padding:"3px 9px", fontSize:12, color:C.soft, border:`1px solid ${C.border}` }}>Gate <b style={{ color:C.text, fontFamily:C.mono }}>{f.gate}</b></span>
                <span style={{ background:C.surface, borderRadius:8, padding:"3px 9px", fontSize:12, color:C.soft, border:`1px solid ${C.border}` }}>T{f.terminal}</span>
                {f.conf&&<span style={{ background:"rgba(167,139,250,0.08)", borderRadius:8, padding:"3px 9px", fontSize:12, color:C.purple, border:"1px solid rgba(167,139,250,0.2)", fontFamily:C.mono }}>{f.conf}</span>}
                {f.date&&<span style={{ background:C.surface, borderRadius:8, padding:"3px 9px", fontSize:11, color:C.soft, border:`1px solid ${C.border}` }}>{f.date}</span>}
              </div>
              {f.wx&&(
                <div style={{ display:"flex", gap:7, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                  {[["dep",f.dep,f.wx.dep],["arr",f.arr,f.wx.arr]].map(([type,code,w])=>(
                    <div key={type} style={{ flex:1, display:"flex", alignItems:"center", gap:7, background:C.surface, borderRadius:11, padding:"8px 10px", border:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:18 }}>{w.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono }}>{code}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:C.mono }}>{w.temp}° <span style={{ fontSize:11, color:C.soft, fontWeight:400 }}>{w.cond}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {i<FLIGHTS.length-1&&FLIGHTS[i+1].conn&&<ConnBridge conn={FLIGHTS[i+1].conn}/>}
          </div>
        );
      })}
      <div style={{ background:C.card, borderRadius:20, border:`1px solid ${lc.br}`, overflow:"hidden", marginTop:6, marginBottom:12 }}>
        <div onClick={()=>setLeaveState(s=>s==="later"?"soon":s==="soon"?"now":"later")} style={{ background:lc.bg, padding:"11px 16px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", borderBottom:`1px solid ${lc.br}` }}>
          <span style={{ fontSize:20 }}>{lc.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:800, color:lc.c, letterSpacing:1.5, fontFamily:C.mono }}>{lc.label}</div>
            <div style={{ fontSize:12, color:C.soft }}>{lc.sub}</div>
          </div>
          <span style={{ fontSize:9, color:lc.c, fontFamily:C.mono, border:`1px solid ${lc.br}`, borderRadius:5, padding:"2px 7px" }}>TAP DEMO</span>
        </div>
        <div style={{ padding:"14px 16px" }}>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:2, fontFamily:C.mono, fontWeight:700, marginBottom:3 }}>LEAVE HOME BY</div>
          <div style={{ fontFamily:C.display, fontSize:56, color:lc.c, lineHeight:1, letterSpacing:2, marginBottom:12 }}>{lc.time}</div>
          <div style={{ display:"flex", gap:7, marginBottom:10 }}>
            {NAV_APPS.map((a,i)=>{
              const active=i===navIdx;
              return (
                <div key={a.id} onClick={()=>setNavIdx(i)} style={{ flex:1, background:active?a.bg:C.surface, border:`1.5px solid ${active?a.color:C.border}`, borderRadius:13, padding:"10px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer" }}>
                  <NavLogo app={a} size={26}/>
                  <span style={{ fontSize:9, fontWeight:700, fontFamily:C.mono, color:active?a.color:C.soft }}>{a.label}</span>
                </div>
              );
            })}
          </div>
          <div onClick={()=>alert(`Opening ${app.label} → Miami International Airport (MIA)`)} style={{ background:`linear-gradient(135deg,${app.color},${app.color}bb)`, borderRadius:14, padding:"13px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:"pointer" }}>
            <NavLogo app={app} size={20}/>
            <span style={{ fontSize:14, fontWeight:800, color:"#000" }}>Directions in {app.label}</span>
          </div>
        </div>
      </div>
      <div onClick={onAdd} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.surface, borderRadius:14, border:`1px dashed ${C.muted}`, padding:"13px 0", cursor:"pointer" }}>
        <span style={{ fontSize:16, color:C.soft }}>+</span>
        <span style={{ fontSize:13, fontWeight:700, color:C.soft }}>Add another flight</span>
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
    <div style={{ position:"sticky", bottom:0, background:"rgba(4,7,14,0.97)", borderTop:`1px solid ${C.border}`, zIndex:20 }}>
      <div style={{ display:"flex", padding:"8px 8px 16px" }}>
        {tabs.map(t=>(
          <div key={t.id} onClick={()=>onNav(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", padding:"5px 0" }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, fontFamily:C.mono, color:active===t.id?C.accent:C.muted }}>{t.label}</span>
            {active===t.id&&<div style={{ width:16, height:2.5, borderRadius:1.5, background:C.accent }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyRunway() {
  const [tab, setTab] = useState("flights");
  const [selFlight, setSelFlight] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [leaveState, setLeaveState] = useState("later");
  const [navIdx, setNavIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(()=>{ const i=setInterval(()=>setTick(n=>n+1),2000); return()=>clearInterval(i); },[]);

  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:C.sans }}>
      <style>{`::-webkit-scrollbar{display:none}`}</style>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:4, background:C.orange, boxShadow:tick%2===0?`0 0 10px ${C.orange}`:"none", transition:"box-shadow 1.5s" }}/>
          <span style={{ fontFamily:C.display, fontSize:22, color:C.accent, letterSpacing:5 }}>MY RUNWAY</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div onClick={()=>setShowAdd(true)} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:10, padding:"8px 14px", cursor:"pointer" }}>
            <span style={{ fontSize:13, color:"#000", fontWeight:800 }}>+ Add Flight</span>
          </div>
        </div>
      </div>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:2 }}>My Flights</div>
        <div style={{ fontSize:13, color:C.soft }}>Your Peru trip · Apr 22–28 · Tap for details</div>
      </div>
      <div style={{ flex:1 }}>
        <FlightsScreen onTap={f=>setSelFlight(f)} onAdd={()=>setShowAdd(true)} leaveState={leaveState} setLeaveState={setLeaveState} navIdx={navIdx} setNavIdx={setNavIdx}/>
      </div>
      <BottomNav active={tab} onNav={t=>setTab(t)}/>
    </div>
  );
}
