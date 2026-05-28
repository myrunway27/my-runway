import { useState, useEffect } from "react";


const DARK = {
  bg:"#04070e", surface:"#090f1c", card:"#0d1525", border:"#13203a",
  accent:"#00c8f0", orange:"#ff5c2b", green:"#00e87a", yellow:"#ffc800",
  red:"#ff3a54", purple:"#a78bfa",
  text:"#d4ecff", muted:"#4e7090", soft:"#7a9ab8",
  mono:"'Courier New',monospace", sans:"system-ui,-apple-system,sans-serif",
  display:"Impact,'Arial Narrow',Arial,sans-serif",
};
const LIGHT = {
  bg:"#f0f4f8", surface:"#ffffff", card:"#ffffff", border:"#d1dce8",
  accent:"#0077aa", orange:"#e84b1a", green:"#008844", yellow:"#b88a00",
  red:"#cc2233", purple:"#6644bb",
  text:"#0a1628", muted:"#7a90a8", soft:"#3a5070",
  mono:"'Courier New',monospace", sans:"system-ui,-apple-system,sans-serif",
  display:"Impact,'Arial Narrow',Arial,sans-serif",
};
let C = DARK;

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
    conn:null,
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
    conn:null,
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
  { id:1, name:"Sarah Chen", dept:"Sales", avatar:"SC", color:"#00c8f0", flight:"AA 100", dep:"JFK", arr:"LAX", status:"Departed", eta:"11:45 AM", progress:62, gate:"B22", delay:0, phone:"(212) 555-0101", saved:142 },
  { id:2, name:"Marcus Lee", dept:"Eng", avatar:"ML", color:"#00e87a", flight:"DL 456", dep:"ATL", arr:"SFO", status:"On Time", eta:"2:30 PM", progress:0, gate:"D14", delay:0, phone:"(415) 555-0192", saved:78 },
  { id:3, name:"Priya Sharma", dept:"Sales", avatar:"PS", color:"#ffc800", flight:"UA 789", dep:"LAX", arr:"ORD", status:"Delayed", eta:"~5:45 PM", progress:0, gate:"C11", delay:55, phone:"(312) 555-0134" },
  { id:4, name:"Tom Walsh", dept:"Exec", avatar:"TW", color:"#a78bfa", flight:"BA 178", dep:"LHR", arr:"JFK", status:"In Air", eta:"8:00 PM", progress:78, gate:"T7", delay:0, phone:"(646) 555-0177" },
  { id:5, name:"Lisa Park", dept:"HR", avatar:"LP", color:"#ff5c2b", flight:"SW 321", dep:"DAL", arr:"MIA", status:"Cancelled", eta:"—", progress:0, gate:"—", delay:0, phone:"(305) 555-0155", cancelled:true },
  { id:6, name:"James Rivera", dept:"Eng", avatar:"JR", color:"#00e87a", flight:"AA 200", dep:"BOS", arr:"DFW", status:"Landed", eta:"Arrived", progress:100, gate:"B8", delay:0, phone:"(972) 555-0188" },
];

const AERO_KEY = "97ab108198mshc33fad15a3e5c29p13a079jsn7c9329d739f7";
const AVSTACK_KEY = "b1b0dab2a1bbd203a6180ddc395782f7";
const FLIGHTAWARE_KEY = "DODdOAjIx6Y2vyCoxPRydpURF3z6mSjd";

// AviationStack — real-time status, delays, times
async function fetchAviationStack(flightNumber, date) {
  const iata = flightNumber.replace(" ", "");
  const url = `https://api.aviationstack.com/v1/flights?access_key=${AVSTACK_KEY}&flight_iata=${iata}&flight_date=${date}&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data?.data?.[0];
    if (!f) return null;
    return {
      status: f.flight_status || null,
      depTime: f.departure?.scheduled?.slice(11,16) || null,
      arrTime: f.arrival?.scheduled?.slice(11,16) || null,
      depDelay: f.departure?.delay || 0,
      arrDelay: f.arrival?.delay || 0,
      depGate: f.departure?.gate || null,
      depTerminal: f.departure?.terminal || null,
      arrGate: f.arrival?.gate || null,
      arrTerminal: f.arrival?.terminal || null,
    };
  } catch (e) {
    console.error("AviationStack error:", e);
    return null;
  }
}

// AeroDataBox — gate & terminal details
async function fetchAeroDataBox(flightNumber, date) {
  const iata = flightNumber.replace(" ", "");
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${iata}/${date}`;
  try {
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": AERO_KEY,
        "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const f = Array.isArray(data) ? data[0] : data;
    if (!f) return null;
    return {
      gate: f.departure?.gate || null,
      depTerminal: f.departure?.terminal || null,
      arrTerminal: f.arrival?.terminal || null,
    };
  } catch (e) {
    console.error("AeroDataBox error:", e);
    return null;
  }
}

// FlightAware AeroAPI — best gate/terminal data
async function fetchFlightAware(flightNumber, date) {
  const iata = flightNumber.replace(" ", "");
  // FlightAware uses ident and date range
  const start = `${date}T00:00:00Z`;
  const end = `${date}T23:59:59Z`;
  const url = `https://aeroapi.flightaware.com/aeroapi/flights/${iata}?start=${start}&end=${end}&max_pages=1`;
  try {
    const res = await fetch(url, {
      headers: {
        "x-apikey": FLIGHTAWARE_KEY,
        "Accept": "application/json; charset=UTF-8",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const f = data?.flights?.[0];
    if (!f) return null;
    return {
      status: f.status || null,
      depGate: f.gate_origin || null,
      arrGate: f.gate_destination || null,
      depTerminal: f.terminal_origin || null,
      arrTerminal: f.terminal_destination || null,
      depDelay: f.departure_delay ? Math.round(f.departure_delay / 60) : 0,
      arrDelay: f.arrival_delay ? Math.round(f.arrival_delay / 60) : 0,
      depTime: f.scheduled_out?.slice(11, 16) || null,
      arrTime: f.scheduled_in?.slice(11, 16) || null,
    };
  } catch (e) {
    console.error("FlightAware error:", e);
    return null;
  }
}

// Combined — all 3 APIs, best data wins
async function fetchFlightInfo(flightNumber, date) {
  const [avstack, aero, fa] = await Promise.allSettled([
    fetchAviationStack(flightNumber, date),
    fetchAeroDataBox(flightNumber, date),
    fetchFlightAware(flightNumber, date),
  ]);
  const av = avstack.status === "fulfilled" ? avstack.value : null;
  const ae = aero.status === "fulfilled" ? aero.value : null;
  const fw = fa.status === "fulfilled" ? fa.value : null;

  // FlightAware status normalization
  const faStatus = fw?.status || "";
  const faStatusNorm =
    faStatus.includes("En Route") ? "In Air" :
    faStatus.includes("Arrived") ? "Landed" :
    faStatus.includes("Cancelled") ? "Cancelled" :
    faStatus.includes("Delayed") ? "Delayed" :
    faStatus.includes("Scheduled") ? "Scheduled" : null;

  // AviationStack status normalization
  const avRaw = av?.status || "";
  const avStatusNorm =
    avRaw === "active" ? "In Air" :
    avRaw === "landed" ? "Landed" :
    avRaw === "cancelled" ? "Cancelled" :
    avRaw === "incident" ? "Delayed" :
    avRaw === "scheduled" ? "Scheduled" : null;

  // FlightAware wins on status & gates, AviationStack fills gaps, AeroDataBox as backup
  return {
    status: faStatusNorm || avStatusNorm || null,
    depTime: fw?.depTime || av?.depTime || null,
    arrTime: fw?.arrTime || av?.arrTime || null,
    depDelay: fw?.depDelay || av?.depDelay || 0,
    arrDelay: fw?.arrDelay || av?.arrDelay || 0,
    gate: fw?.depGate || av?.depGate || ae?.gate || null,
    depTerminal: fw?.depTerminal || av?.depTerminal || ae?.depTerminal || null,
    arrTerminal: fw?.arrTerminal || av?.arrTerminal || ae?.arrTerminal || null,
  };
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

function Arc({ progress=0, color="#00c8f0" }) {
  const w=200, h=54, cx=w/2;
  const pct = progress/100;
  const px = progress===0 ? cx : 16 + pct*(w-32);
  const py = progress===0 ? h-28 : h-10 - Math.sin(pct*Math.PI)*24;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:"visible", display:"block", margin:"0 auto" }}>
      <path d={`M 16 ${h-8} Q ${cx} ${h-50} ${w-16} ${h-8}`} fill="none" stroke="#2a4060" strokeWidth="1.5" strokeDasharray="4 5"/>
      <circle cx="16" cy={h-8} r="4" fill="#0d1525" stroke={color} strokeWidth="2"/>
      <circle cx={w-16} cy={h-8} r="4" fill="#0d1525" stroke={color} strokeWidth="2"/>
      <circle cx={px} cy={py} r="14" fill={color} opacity="0.25"/>
      <circle cx={px} cy={py} r="14" fill="none" stroke={color} strokeWidth="2.5"/>
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
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch if within 48 hours of flight — save API calls
    const flightDate = f.date?.match(/\w+ (\w+ \d+, \d+)/)?.[0] || f.date;
    setLoading(true);
    const iata = f.iata.replace(" ", "");
    const dateStr = f.id === "f1" ? "2026-04-22" :
                    f.id === "f2" ? "2026-04-22" :
                    f.id === "f3" ? "2026-04-27" : "2026-04-27";
    fetchFlightInfo(iata, dateStr).then(data => {
      if (data) setLiveData(data);
      setLoading(false);
    });
  }, [f.id]);

  const gate = liveData?.gate || f.gate;
  const terminal = liveData?.depTerminal || f.terminal;
  const status = liveData?.status || f.status;
  const delay = liveData?.depDelay || 0;
  const ls = sc(status);

  return (
    <div onClick={()=>onTap(f)} style={{ background:C.card, borderRadius:20, border:`1px solid ${f.status==="Delayed"?"rgba(255,200,0,0.3)":f.status==="Gate Change"?"rgba(167,139,250,0.3)":C.border}`, padding:16, marginBottom:10, cursor:"pointer" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <AirlineLogo code={f.code} size={30}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, fontFamily:C.mono }}>{f.iata}</div>
          <div style={{ fontSize:12, color:C.soft }}>{f.airline} · {f.aircraft}</div>
        </div>
        <StatusPill status={status}/>
        {delay>0&&<span style={{ background:"rgba(255,200,0,0.1)", border:"1px solid rgba(255,200,0,0.3)", borderRadius:20, padding:"3px 8px", fontSize:10, color:C.yellow, fontWeight:700, fontFamily:C.mono }}>+{delay}m</span>}
        {loading&&<span style={{ fontSize:10, color:C.muted, fontFamily:C.mono }}>↻</span>}
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
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", marginBottom:0 }}>
        <span style={{ background:gate!=="TBD"?"rgba(0,200,240,0.1)":C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:gate!=="TBD"?C.accent:C.soft, border:`1px solid ${gate!=="TBD"?"rgba(0,200,240,0.3)":C.border}` }}>Gate <b style={{ color:gate!=="TBD"?C.accent:C.text, fontFamily:C.mono }}>{gate}</b></span>
        <span style={{ background:terminal!=="TBD"?"rgba(0,200,240,0.1)":C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:terminal!=="TBD"?C.accent:C.soft, border:`1px solid ${terminal!=="TBD"?"rgba(0,200,240,0.3)":C.border}` }}>Terminal <b style={{ color:terminal!=="TBD"?C.accent:C.text, fontFamily:C.mono }}>{terminal}</b></span>
        {f.conf&&<span style={{ background:"rgba(167,139,250,0.1)", borderRadius:8, padding:"5px 11px", fontSize:12, color:C.purple, border:"1px solid rgba(167,139,250,0.25)", fontFamily:C.mono }}>CONF# {f.conf}</span>}
        {f.date&&<span style={{ background:C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:C.soft, border:`1px solid ${C.border}` }}>{f.date}</span>}
      </div>

    </div>
  );
}

// ── MODALS ─────────────────────────────────────────────────────

// ── Cancellation Alert Banner ─────────────────────────────────
function CancellationAlert({ flight, onDismiss, onAction }) {
  const [expanded, setExpanded] = useState(true);
  if (!expanded) return null;
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:80, maxWidth:480, margin:"0 auto" }}>
      <div style={{ background:"linear-gradient(135deg,#ff3a54,#cc0022)", padding:"14px 16px", boxShadow:"0 4px 20px rgba(255,58,84,0.4)" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:24, flexShrink:0 }}>🚨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#fff", marginBottom:3 }}>Flight Cancelled!</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:2 }}>{flight.iata} · {flight.dep} → {flight.arr}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{flight.date} · We detected this before the airline notified you</div>
          </div>
          <div onClick={()=>setExpanded(false)} style={{ fontSize:18, color:"rgba(255,255,255,0.7)", cursor:"pointer", flexShrink:0 }}>✕</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={onAction} style={{ flex:1, background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:11, padding:"10px 0", textAlign:"center", cursor:"pointer" }}>
            <span style={{ fontSize:13, fontWeight:800, color:"#fff" }}>Find Alternatives ✈</span>
          </div>
          <div onClick={()=>{ alert(`Notifying your contacts about the cancellation of ${flight.iata}...

They will receive:
"⚠️ Flight ${flight.iata} (${flight.dep}→${flight.arr}) has been cancelled. Plans may change."`); }} style={{ flex:1, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:11, padding:"10px 0", textAlign:"center", cursor:"pointer" }}>
            <span style={{ fontSize:13, fontWeight:800, color:"#fff" }}>Alert Contacts 🔔</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cancellation Tracker Screen ────────────────────────────────
function CancellationScreen({ onBack }) {
  const [notifications, setNotifications] = useState([
    true, true, true, // SMS, Email, Push all on by default
  ]);
  const history = [
    { id:"c1", iata:"AA 1307", dep:"MIA", arr:"LIM", date:"Wed Apr 22, 2026", detectedAt:"6 hours before departure", notifiedAt:"Never — airline did not notify", status:"Cancelled", rebookedOn:"AA 1309", savings:"Caught early — rebooking saved $340" },
    { id:"c2", iata:"LA 2166", dep:"LIM", arr:"CUZ", date:"Apr 22, 2026", detectedAt:"3 hours before departure", notifiedAt:"1 hour before departure", status:"Cancelled", rebookedOn:"H2 1022", savings:"Detected 2hrs before airline alert" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Cancellation Tracker</div>
          <div style={{ fontSize:12, color:C.soft }}>Real-time alerts before the airline tells you</div>
        </div>
        <div style={{ background:"rgba(255,58,84,0.1)", border:"1px solid rgba(255,58,84,0.3)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, color:C.red, fontFamily:C.mono }}>LIVE</div>
      </div>
      <div style={{ padding:"16px 16px 100px" }}>

        {/* How it works */}
        <div style={{ background:"rgba(0,200,240,0.06)", borderRadius:16, border:"1px solid rgba(0,200,240,0.2)", padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.accent, marginBottom:10 }}>⚡ How My Runway Detects Cancellations</div>
          {[
            ["🔍","We check your flights every 15 minutes via FlightAware, AeroDataBox & AviationStack"],
            ["📡","The moment any source flags a cancellation we alert you instantly"],
            ["⏱️","On average we detect cancellations 2–4 hours before the airline emails you"],
            ["🔔","You get SMS, push notification, and email simultaneously"],
          ].map(([icon,text],i)=>(
            <div key={i} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
              <div style={{ fontSize:12, color:C.soft, lineHeight:1.5 }}>{text}</div>
            </div>
          ))}
        </div>

        {/* Alert settings */}
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:12 }}>🔔 Alert Settings</div>
          {[["📱","SMS Text Message","Instant text to your phone"],["📧","Email","Full cancellation details + alternatives"],["🔔","Push Notification","App notification on your device"]].map(([icon,title,desc],i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<2?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontSize:20 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{title}</div>
                <div style={{ fontSize:11, color:C.muted }}>{desc}</div>
              </div>
              <div onClick={()=>setNotifications(n=>{ const copy=[...n]; copy[i]=!copy[i]; return copy; })} style={{ width:44, height:26, borderRadius:13, background:notifications[i]?C.red:"#2a3f5f", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:notifications[i]?21:3, transition:"left 0.2s" }}/>
              </div>
            </div>
          ))}
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:1.5, marginBottom:8 }}>ALSO ALERT THESE CONTACTS</div>
            <div style={{ display:"flex", gap:8 }}>
              <input placeholder="Phone or email (pickup person)" style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", color:C.text, fontSize:13, outline:"none" }}/>
              <div style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:10, padding:"10px 14px", cursor:"pointer" }}>
                <span style={{ fontSize:12, fontWeight:800, color:"#000" }}>Add</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation history */}
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:12 }}>YOUR CANCELLATION HISTORY</div>
        {history.map(c=>(
          <div key={c.id} style={{ background:C.card, borderRadius:16, border:"1px solid rgba(255,58,84,0.2)", padding:"14px 16px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:24 }}>⚠️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.text, fontFamily:C.mono }}>{c.iata}</div>
                <div style={{ fontSize:12, color:C.soft }}>{c.dep} → {c.arr} · {c.date}</div>
              </div>
              <div style={{ background:"rgba(255,58,84,0.1)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:20, padding:"3px 10px", fontSize:10, color:C.red, fontWeight:700, fontFamily:C.mono }}>Cancelled</div>
            </div>
            {[
              ["🔍 Detected by My Runway", c.detectedAt],
              ["✉️ Airline notified you", c.notifiedAt],
              ["✈️ Rebooked onto", c.rebookedOn],
            ].map(([label,val])=>(
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderTop:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.soft }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{val}</span>
              </div>
            ))}
            <div style={{ background:"rgba(0,232,122,0.07)", borderRadius:10, padding:"9px 12px", marginTop:10, border:"1px solid rgba(0,232,122,0.2)" }}>
              <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>💰 {c.savings}</span>
            </div>
          </div>
        ))}

        <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"14px 16px", textAlign:"center" }}>
          <div style={{ fontSize:13, color:C.muted, marginBottom:4 }}>Monitoring your flights 24/7</div>
          <div style={{ fontSize:12, color:C.soft }}>Checked every <b style={{ color:C.accent }}>15 minutes</b> across <b style={{ color:C.accent }}>3 data sources</b></div>
        </div>
      </div>
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
    setTimeout(()=>{ setBusy(false); alert(`Flight ${num.toUpperCase()} added!\nIn the live app this pulls real data.`); onClose(); }, 1400);
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
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const autoMsg = `Landing LIM at 8:30 PM on American Airlines AA 1307. Connecting via LIM — next flight LA 2166 departs 11:40 PM.`;
  const shareLink = "myrunwayapp.co/t/abc123k";
  function share(method) {
    if (method==="Copy Link") { setCopied(true); setTimeout(()=>setCopied(false),2000); }
    else alert(`Opening ${method}...\n\n${autoMsg}${note?"\n\n"+note:""}\n\nTrack live: ${shareLink}`);
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:"20px 20px 48px", border:`1px solid ${C.border}`, maxWidth:480, margin:"0 auto", width:"100%" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 18px" }}/>
        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:6 }}>Share Trip</div>
        <div style={{ fontSize:13, color:C.soft, marginBottom:16 }}>Your pickup person gets a live tracking link — no app needed.</div>
        <div style={{ background:C.card, borderRadius:12, padding:"13px 14px", marginBottom:14, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:6 }}>AUTO-GENERATED MESSAGE</div>
          <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{autoMsg}</div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:1.5, marginBottom:8 }}>ADD A PERSONAL NOTE (optional)</div>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. bring coffee ☕, I have 2 bags..."
            style={{ width:"100%", background:C.card, border:`1.5px solid ${note?C.accent+"60":C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ background:"rgba(0,200,240,0.06)", borderRadius:12, padding:"10px 14px", marginBottom:16, border:"1px solid rgba(0,200,240,0.2)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:12, color:C.accent, fontFamily:C.mono }}>{shareLink}</span>
          <span style={{ fontSize:11, color:copied?C.green:C.accent, fontWeight:700, cursor:"pointer" }} onClick={()=>share("Copy Link")}>{copied?"✅ Copied!":"Copy"}</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[["💬","WhatsApp","#25D366"],["✉️","iMessage","#34C759"],["📧","Email","#4285F4"],["🔗","Copy Link",C.accent]].map(([icon,label,color])=>(
            <div key={label} onClick={()=>share(label)} style={{ background:`${color}15`, border:`1px solid ${color}40`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color }}>{label==="Copy Link"&&copied?"✅ Copied!":label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ onClose, isDark, setIsDark, homeAddress, setHomeAddress }) {
  const [addr, setAddr] = useState(homeAddress);
  const [navPref, setNavPref] = useState("waze");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  function save() {
    setHomeAddress(addr);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:"20px 20px 48px", border:`1px solid ${C.border}`, maxWidth:480, margin:"0 auto", width:"100%", maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 18px" }}/>
        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:20 }}>Settings</div>

        {/* Theme */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>APPEARANCE</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["🌙","Dark",true],["☀️","Light",false]].map(([icon,label,dark])=>(
              <div key={label} onClick={()=>setIsDark(dark)} style={{ flex:1, background:isDark===dark?`${C.accent}18`:C.card, border:`2px solid ${isDark===dark?C.accent:C.border}`, borderRadius:14, padding:"14px 0", textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:isDark===dark?C.accent:C.soft }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Home address */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>HOME ADDRESS</div>
          <div style={{ fontSize:12, color:C.soft, marginBottom:8 }}>Used to calculate your leave-by time to the airport</div>
          <input value={addr} onChange={e=>setAddr(e.target.value)} placeholder="123 Main St, Miami, FL"
            style={{ width:"100%", background:C.card, border:`1.5px solid ${addr?C.accent+"60":C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
        </div>

        {/* Navigation preference */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>PREFERRED NAVIGATION APP</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["waze","🚗","Waze"],["google","🗺️","Google"],["apple","🍎","Apple"]].map(([id,icon,label])=>(
              <div key={id} onClick={()=>setNavPref(id)} style={{ flex:1, background:navPref===id?`${C.accent}18`:C.card, border:`2px solid ${navPref===id?C.accent:C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:navPref===id?C.accent:C.soft }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>NOTIFICATIONS</div>
          {[["Flight status changes","Get alerted when your flight is delayed, cancelled, or gate changes"],["Leave-by reminders","Get notified when it's time to leave for the airport"],["Landing alerts","Notify your pickup contact when you land"]].map(([title,desc],i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:i<2?`1px solid ${C.border}`:"none" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:12, color:C.muted }}>{desc}</div>
              </div>
              <div onClick={()=>setNotifications(n=>!n)} style={{ width:44, height:26, borderRadius:13, background:notifications?C.accent:"#2a3f5f", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:notifications?21:3, transition:"left 0.2s" }}/>
              </div>
            </div>
          ))}
        </div>

        <div onClick={save} style={{ background:saved?C.green:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, color:"#000", cursor:"pointer" }}>
          {saved?"✅ Saved!":"Save Settings"}
        </div>
      </div>
    </div>
  );
}

// ── SCREENS ────────────────────────────────────────────────────

function FlightsScreen({ onTap, onAdd, leaveState, setLeaveState, navIdx, setNavIdx, homeAddress }) {
  const lc = LEAVE_CFG[leaveState];
  const app = NAV_APPS[navIdx];
  const outbound = FLIGHTS.filter(f=>f.trip==="outbound");
  const returnFlights = FLIGHTS.filter(f=>f.trip==="return");
  const [showReturn, setShowReturn] = useState(false);
  const [showReturnAll, setShowReturnAll] = useState(false);

  function renderFlightGroup(flights, showAll, setShowAll) {
    return flights.map((f, i) => (
      <div key={f.id}>
        {f.conn && <ConnBridge conn={f.conn}/>}
        {(i === 0 || showAll) && <FlightCard f={f} onTap={onTap}/>}
        {i === 0 && !showAll && flights.length > 1 && (
          <div onClick={()=>setShowAll(true)} style={{ background:C.surface, borderRadius:12, border:`1px dashed ${C.border}`, padding:"10px 16px", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
            <span style={{ fontSize:12, color:C.soft, fontFamily:C.mono }}>+ {flights.length-1} more connecting flight</span>
            <span style={{ fontSize:11, color:C.accent, fontFamily:C.mono }}>show ▼</span>
          </div>
        )}
      </div>
    ));
  }

  return (
    <div style={{ padding:"14px 14px 100px" }}>
      {/* Route summary */}
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"14px", marginBottom:16 }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>OUTBOUND · APR 22</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {outbound.map(f=>{ const s=sc(f.status); return (
              <div key={f.id} onClick={()=>onTap(f)} style={{ background:`${s.c}22`, border:`1.5px solid ${s.c}`, borderRadius:20, padding:"7px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:4, background:s.c, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:s.c, fontFamily:C.mono, fontWeight:800 }}>{f.iata} · {f.dep}–{f.arr}</span>
              </div>
            );})}
          </div>
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>RETURN · APR 27</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {returnFlights.map(f=>{ const s=sc(f.status); return (
              <div key={f.id} onClick={()=>onTap(f)} style={{ background:`${s.c}22`, border:`1.5px solid ${s.c}`, borderRadius:20, padding:"7px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:4, background:s.c, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:s.c, fontFamily:C.mono, fontWeight:800 }}>{f.iata} · {f.dep}–{f.arr}</span>
              </div>
            );})}
          </div>
        </div>
        <div style={{ display:"flex", gap:12, marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, flexWrap:"wrap" }}>
          {[["#00e87a","On Time"],["#ffc800","Delayed"],["#a78bfa","Gate Change"],["#ff3a54","Cancelled"]].map(([c,l])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:4, background:c }}/>
              <span style={{ fontSize:10, color:C.muted, fontFamily:C.mono }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Outbound — always expanded */}
      <div style={{ fontSize:11, color:C.orange, fontFamily:C.mono, fontWeight:700, letterSpacing:2, marginBottom:12 }}>OUTBOUND · APR 22 · {outbound.length} FLIGHTS</div>
      {renderFlightGroup(outbound, true, ()=>{})}

      {/* Return — collapsed by default */}
      <div onClick={()=>setShowReturn(o=>!o)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:20, marginBottom:showReturn?12:16, cursor:"pointer", background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"13px 16px" }}>
        <div>
          <div style={{ fontSize:11, color:C.accent, fontFamily:C.mono, fontWeight:700, letterSpacing:2, marginBottom:4 }}>RETURN · APR 27</div>
          <div style={{ fontSize:12, color:C.soft }}>CUZ → LIM → MIA · 2 flights</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {returnFlights.map(f=>{ const s=sc(f.status); return <div key={f.id} style={{ width:8, height:8, borderRadius:4, background:s.c }}/>; })}
          <span style={{ fontSize:14, color:C.accent, marginLeft:4 }}>{showReturn?"▲":"▼"}</span>
        </div>
      </div>
      {showReturn&&<div style={{ marginTop:4 }}>{renderFlightGroup(returnFlights, showReturnAll, setShowReturnAll)}</div>}

      {/* Leave by card */}
      <div style={{ background:C.card, borderRadius:20, border:`1px solid ${lc.br}`, overflow:"hidden", marginBottom:14 }}>
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
              <div style={{ fontSize:14, color:C.text, fontWeight:600 }}>{homeAddress||"Set your home address"}</div>
            </div>
            <span style={{ fontSize:13, color:C.accent, cursor:"pointer" }}>Change</span>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {NAV_APPS.map((a,i)=>{ const active=i===navIdx; return (
              <div key={a.id} onClick={()=>setNavIdx(i)} style={{ flex:1, background:active?a.bg:C.surface, border:`2px solid ${active?a.color:C.border}`, borderRadius:13, padding:"12px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer", transition:"all 0.2s" }}>
                <NavLogo app={a} size={28}/>
                <span style={{ fontSize:10, fontWeight:700, fontFamily:C.mono, color:active?a.color:C.soft }}>{a.label}</span>
              </div>
            );})}
          </div>
          <div onClick={()=>alert(`Opening ${app.label} → Miami International Airport (MIA)`)} style={{ background:`linear-gradient(135deg,${app.color},${app.color}bb)`, borderRadius:14, padding:"15px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:"pointer" }}>
            <NavLogo app={app} size={22}/>
            <span style={{ fontSize:15, fontWeight:800, color:"#000" }}>Get Directions in {app.label}</span>
          </div>
        </div>
      </div>

      {/* ── Check-in Reminder Card ── */}
      <div style={{ background:"rgba(0,200,240,0.07)", borderRadius:18, border:"1px solid rgba(0,200,240,0.25)", padding:16, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:22 }}>🎫</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.accent, marginBottom:2 }}>Check-in Opens Soon!</div>
            <div style={{ fontSize:12, color:C.soft }}>AA 1307 · MIA → LIM · Wed Apr 22</div>
          </div>
          <div style={{ background:"rgba(0,200,240,0.15)", borderRadius:8, padding:"4px 10px", border:"1px solid rgba(0,200,240,0.3)" }}>
            <span style={{ fontSize:10, color:C.accent, fontFamily:C.mono, fontWeight:700 }}>24H ALERT</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={()=>alert("Opening AA.com check-in for flight AA 1307...\n\nIn the live app this opens the airline check-in page directly!")} style={{ flex:1, background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"11px 0", textAlign:"center", cursor:"pointer" }}>
            <span style={{ fontSize:13, fontWeight:800, color:"#000" }}>Check In Now →</span>
          </div>
          <div onClick={()=>alert("Reminder set! We'll notify you when check-in opens.")} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"11px 14px", textAlign:"center", cursor:"pointer" }}>
            <span style={{ fontSize:13, color:C.soft }}>🔔</span>
          </div>
        </div>
      </div>

      {/* ── CO2 Carbon Tracker ── */}
      <div style={{ background:"rgba(0,232,122,0.06)", borderRadius:18, border:"1px solid rgba(0,232,122,0.2)", padding:16, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <span style={{ fontSize:20 }}>🌱</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:C.green }}>Trip Carbon Footprint</div>
            <div style={{ fontSize:11, color:C.soft }}>Your Peru round trip · 4 flights</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {[["✈️ MIA→LIM","312 kg"],["✈️ LIM→CUZ","89 kg"],["✈️ CUZ→LIM","89 kg"],["✈️ LIM→MIA","312 kg"]].map(([leg,co2])=>(
            <div key={leg} style={{ flex:1, background:C.surface, borderRadius:9, padding:"8px 4px", textAlign:"center", border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:9, color:C.soft, marginBottom:3 }}>{leg}</div>
              <div style={{ fontSize:11, fontWeight:800, color:C.green, fontFamily:C.mono }}>{co2}</div>
            </div>
          ))}
        </div>
        <div style={{ background:C.surface, borderRadius:11, padding:"10px 14px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginBottom:2 }}>TOTAL TRIP EMISSIONS</div>
            <div style={{ fontSize:20, fontWeight:800, color:C.green, fontFamily:C.mono }}>802 kg CO₂</div>
          </div>
          <div onClick={()=>alert("Opening carbon offset options...\n\nIn the live app this connects to a carbon offset provider like Gold Standard or Terrapass.")} style={{ background:"rgba(0,232,122,0.1)", border:"1px solid rgba(0,232,122,0.3)", borderRadius:10, padding:"8px 12px", cursor:"pointer" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.green }}>Offset It 🌳</div>
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
          {airports.map((a,i)=>{ const w=a.wx; if(!w) return null; return (
            <div key={a.code} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ textAlign:"center" }}>
                <span style={{ fontSize:28 }}>{w.icon}</span>
                <div style={{ fontSize:16, fontWeight:800, color:C.text, fontFamily:C.mono, marginTop:3 }}>{a.code}</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{w.temp}°F</div>
              </div>
              {i<airports.length-1&&<span style={{ fontSize:16, color:C.muted, padding:"0 8px" }}>→</span>}
            </div>
          );})}
        </div>
      </div>
      {airports.map(a=>{ const w=a.wx; if(!w) return null; return (
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
      );})}
    </div>
  );
}

function FamilyScreen() {
  const [sel, setSel] = useState(null);
  const [people, setPeople] = useState([
    { name:"Mom", initials:"M", color:"#a78bfa", flight:"DL 204", dep:"ATL", arr:"JFK", status:"On Time", eta:"4:20 PM" },
    { name:"Jake", initials:"J", color:"#00e87a", flight:"SW 881", dep:"ORD", arr:"LAX", status:"Departed", eta:"3:15 PM" },
    { name:"Sarah", initials:"S", color:"#ff5c2b", flight:"BA 178", dep:"LHR", arr:"JFK", status:"Delayed", eta:"8:00 PM" },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFlight, setNewFlight] = useState("");

  function addPerson() {
    if (!newName.trim()||!newFlight.trim()) return;
    const colors=["#00c8f0","#ffc800","#a78bfa","#ff5c2b","#00e87a"];
    setPeople(p=>[...p,{ name:newName, initials:newName.slice(0,2).toUpperCase(), color:colors[p.length%colors.length], flight:newFlight.toUpperCase(), dep:"???", arr:"???", status:"Scheduled", eta:"TBD" }]);
    setNewName(""); setNewFlight(""); setShowAdd(false);
  }

  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div onClick={()=>setShowAdd(s=>!s)} style={{ display:"flex", alignItems:"center", gap:12, background:C.card, borderRadius:16, border:`1px dashed ${C.border}`, padding:"16px", marginBottom:14, cursor:"pointer" }}>
        <div style={{ width:46, height:46, borderRadius:23, background:C.surface, border:`2px dashed ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>+</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.soft }}>Add family member</div>
          <div style={{ fontSize:13, color:C.muted }}>Track their flights alongside yours</div>
        </div>
      </div>

      {showAdd&&(
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.accent}40`, padding:"16px", marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12 }}>Add a person</div>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name (e.g. Mom)" style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
          <input value={newFlight} onChange={e=>setNewFlight(e.target.value)} placeholder="Flight number (e.g. AA 100)" style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:12, fontFamily:C.mono }}/>
          <div style={{ display:"flex", gap:8 }}>
            <div onClick={addPerson} style={{ flex:1, background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:10, padding:"11px 0", textAlign:"center", fontWeight:800, fontSize:14, color:"#000", cursor:"pointer" }}>Add</div>
            <div onClick={()=>setShowAdd(false)} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px 0", textAlign:"center", fontWeight:700, fontSize:14, color:C.soft, cursor:"pointer" }}>Cancel</div>
          </div>
        </div>
      )}

      {people.map((p,i)=>{ const s=sc(p.status); const isSel=sel===i; return (
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
              <div onClick={e=>{e.stopPropagation();alert(`Live tracking link for ${p.name}:\nmyrunwayapp.co/t/abc123k\n\nThey can open this in any browser — no app needed!`);}} style={{ flex:1, background:"rgba(0,200,240,0.08)", border:"1px solid rgba(0,200,240,0.2)", borderRadius:11, padding:"13px 0", textAlign:"center", cursor:"pointer" }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.accent }}>🔗 Send Live Link</span>
              </div>
              <div onClick={e=>{e.stopPropagation();alert(`Opening Google Maps for pickup route to ${p.arr} airport...`);}} style={{ flex:1, background:"rgba(0,232,122,0.08)", border:"1px solid rgba(0,232,122,0.2)", borderRadius:11, padding:"13px 0", textAlign:"center", cursor:"pointer" }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.green }}>🚗 Pickup Route</span>
              </div>
              <div onClick={e=>{e.stopPropagation();setPeople(p=>p.filter((_,j)=>j!==i));setSel(null);}} style={{ background:"rgba(255,58,84,0.08)", border:"1px solid rgba(255,58,84,0.2)", borderRadius:11, padding:"13px 14px", textAlign:"center", cursor:"pointer" }}>
                <span style={{ fontSize:14, color:C.red }}>🗑️</span>
              </div>
            </div>
          )}
        </div>
      );})}
    </div>
  );
}

function PassportScreen() {
  const p = { miles:124580, flights:47, airports:23, countries:8, streak:3, airline:"American Airlines", yr:{flights:12,miles:28400}, badges:["🌍 Globe Trotter","✈️ Jet Setter","🔗 Connection Pro","⚡ Early Bird"] };
  const allBadges = [...p.badges, "🏆 Century Club","💼 Road Warrior","🌙 Night Owl","🥇 First Class","🔒 Mountain Explorer"];
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
          {allBadges.slice(p.badges.length).map(b=><div key={b} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"7px 14px", fontSize:13, color:C.muted, opacity:0.5 }}>🔒 {b.split(" ").slice(1).join(" ")}</div>)}
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
      cta:"Upgrade to Pro →", ctaStyle:{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, color:"#000" } },
    { id:"corporate", name:"Corporate", price:"$9", period:"per seat/month", color:C.purple, bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.28)", tag:"FOR TEAMS",
      features:["Everything in Pro","Admin dashboard","All employee flights","Manager delay alerts","CSV bulk import","SSO login","Expense integration","Dedicated account manager"], missing:[],
      cta:"Contact Sales →", ctaStyle:{ background:`linear-gradient(135deg,${C.purple},#7c3aed)`, color:"#fff" } },
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
          <div onClick={()=>alert(t.id==="free"?"You're already on the free plan!":t.id==="pro"?"Opening checkout for Pro plan ($19.99/yr)...":"Our sales team will contact you within 24 hours!")}
            style={{ ...t.ctaStyle, borderRadius:13, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, cursor:"pointer", marginTop:18 }}>
            {t.cta}
          </div>
        </div>
      ))}
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
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:8 }}>COMPANY NAME</div>
          <input value={companyName} onChange={e=>setCompanyName(e.target.value)} style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:8 }}>SPEND POLICY LIMITS</div>
          <div style={{ fontSize:12, color:C.soft, marginBottom:10 }}>Set max spend per employee per trip</div>
          {[["Economy flights max","$800"],["Business class max","$2,500"],["Hotel per night max","$250"],["Meal per diem","$75"]].map(([label,def])=>(
            <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ flex:1, fontSize:13, color:C.text }}>{label}</div>
              <input defaultValue={def} style={{ width:80, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", color:C.text, fontSize:13, outline:"none", textAlign:"right", fontFamily:C.mono }} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:8 }}>MANAGER ALERT EMAIL</div>
          <div style={{ fontSize:12, color:C.soft, marginBottom:8 }}>Flight alerts are sent to this address</div>
          <input value={managerEmail} onChange={e=>setManagerEmail(e.target.value)} style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:12 }}>ALERT TYPES</div>
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
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:12 }}>TEAM MANAGEMENT</div>
          {[["📧","Invite Team Members","Send invites via email"],["📤","Import from CSV","Bulk add employees with flight data"],["🔐","SSO Configuration","Set up Google/Microsoft single sign-on"]].map(([icon,title,desc])=>(
            <div key={title} onClick={()=>alert(`${title}: Coming soon! This will be available in the Pro launch.`)} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", background:C.card, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:8, cursor:"pointer" }}>
              <span style={{ fontSize:20 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{title}</div>
                <div style={{ fontSize:12, color:C.muted }}>{desc}</div>
              </div>
              <span style={{ fontSize:16, color:C.muted }}>›</span>
            </div>
          ))}
        </div>
        <div onClick={save} style={{ background:saved?C.green:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:14, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, color:"#fff", cursor:"pointer" }}>
          {saved?"✅ Saved!":"Save Settings"}
        </div>
      </div>
    </div>
  );
}

function CorporateDashboard({ onClose }) {
  const [filter, setFilter] = useState("all");
  const [selEmp, setSelEmp] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const filtered = filter==="all"?EMPLOYEES:filter==="issue"?EMPLOYEES.filter(e=>e.delay>0||e.cancelled):EMPLOYEES.filter(e=>e.dept===filter);
  const delayed=EMPLOYEES.filter(e=>e.delay>0).length;
  const cancelled=EMPLOYEES.filter(e=>e.cancelled).length;
  const inAir=EMPLOYEES.filter(e=>e.status==="Departed"||e.status==="In Air").length;
  const onTime=EMPLOYEES.filter(e=>e.status==="On Time"||e.status==="Landed").length;

  if (showSettings) return <CorporateSettings onBack={()=>setShowSettings(false)}/>;

  if (showExport) return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:55, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={()=>setShowExport(false)} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <span style={{ fontSize:16, fontWeight:800, color:C.text }}>Export Report</span>
      </div>
      <div style={{ padding:"20px 16px 100px" }}>
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"20px", marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:4 }}>April 2026 Travel Report</div>
          <div style={{ fontSize:13, color:C.soft, marginBottom:16 }}>6 employees · 1 cancellation · 2 delays</div>
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
        <div onClick={()=>alert("Downloading CSV...\n\nIn the live app this downloads a spreadsheet with all employee travel data.")} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, color:"#000", cursor:"pointer" }}>
          Download CSV ↓
        </div>
      </div>
    </div>
  );

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
          {selEmp.cancelled&&(
            <div style={{ background:"rgba(255,58,84,0.08)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:14, padding:"14px", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.red, marginBottom:6 }}>⚠️ Flight Cancelled</div>
              <div style={{ fontSize:13, color:C.soft, marginBottom:10 }}>This employee needs to be rebooked. Their travel manager has been notified.</div>
              <div onClick={()=>alert("Opening rebooking flow for Lisa Park...\n\nIn the live app this connects to your corporate travel tool.")} style={{ background:`linear-gradient(135deg,${C.orange},#cc3300)`, borderRadius:11, padding:"12px 0", textAlign:"center", fontWeight:800, fontSize:13, color:"#fff", cursor:"pointer" }}>Rebook Flight →</div>
            </div>
          )}
          {selEmp.delay>0&&(
            <div style={{ background:"rgba(255,200,0,0.07)", border:"1px solid rgba(255,200,0,0.22)", borderRadius:14, padding:"14px", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:C.yellow, marginBottom:6 }}>⏰ Delayed {selEmp.delay} min</div>
              <div style={{ fontSize:13, color:C.soft, marginBottom:10 }}>Downstream meetings may need to be rescheduled.</div>
              <div onClick={()=>alert(`Sending delay notification to ${selEmp.name}'s manager...`)} style={{ background:`linear-gradient(135deg,${C.yellow},#cc9900)`, borderRadius:11, padding:"12px 0", textAlign:"center", fontWeight:800, fontSize:13, color:"#000", cursor:"pointer" }}>Notify Manager →</div>
            </div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            {[["📞","Call",()=>alert(`Calling ${selEmp.name} at ${selEmp.phone}...`)],["💬","Message",()=>alert(`Opening iMessage to ${selEmp.name}...`)],["🔗","Track",()=>alert(`Live tracking:\nmyrunwayapp.co/t/${selEmp.id}abc\n\nShare this with anyone picking up ${selEmp.name}.`)]].map(([icon,label,fn])=>(
              <div key={label} onClick={fn} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
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
          <div style={{ fontSize:12, color:C.soft }}>Acme Corp · {EMPLOYEES.length} traveling today</div>
        </div>
        <div style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, color:C.purple, fontFamily:C.mono }}>CORP</div>
      </div>
      <div style={{ padding:"14px 14px 100px" }}>
        {/* Savings banner */}
        <div style={{ background:"rgba(0,232,122,0.07)", border:"1px solid rgba(0,232,122,0.2)", borderRadius:14, padding:"12px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>💰</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:C.green }}>$220 saved this month</div>
            <div style={{ fontSize:11, color:C.soft }}>2 employees booked below budget · vs company average</div>
          </div>
          <div style={{ background:"rgba(0,232,122,0.12)", border:"1px solid rgba(0,232,122,0.3)", borderRadius:8, padding:"5px 10px" }}>
            <span style={{ fontSize:10, color:C.green, fontFamily:C.mono, fontWeight:700 }}>VIEW REPORT</span>
          </div>
        </div>

        {(delayed>0||cancelled>0)&&(
          <div style={{ background:"rgba(255,58,84,0.08)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:14, padding:"12px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:20 }}>🚨</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:1 }}>Action needed</div>
              <div style={{ fontSize:12, color:C.soft }}>{cancelled>0?`${cancelled} cancellation · `:""}{delayed>0?`${delayed} delayed`:""} · Tap to review</div>
            </div>
            <div onClick={()=>setFilter("issue")} style={{ background:C.red, borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>
              <span style={{ fontSize:11, fontWeight:800, color:"#fff" }}>Review</span>
            </div>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          {[["✈️","In Air",inAir,C.accent],["✅","On Time",onTime,C.green],["⏰","Delayed",delayed,C.yellow],["❌","Cancelled",cancelled,C.red]].map(([icon,label,val,color])=>(
            <div key={label} style={{ background:`${color}12`, borderRadius:14, border:`1px solid ${color}30`, padding:"14px 6px", textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:5 }}>{icon}</div>
              <div style={{ fontSize:26, fontWeight:800, color, fontFamily:C.mono, lineHeight:1, marginBottom:4 }}>{val}</div>
              <div style={{ fontSize:10, color:C.soft, fontFamily:C.mono, fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          {[["all","All"],["issue","🚨 Issues"],["Sales","Sales"],["Eng","Eng"],["Exec","Exec"],["HR","HR"]].map(([id,label])=>(
            <div key={id} onClick={()=>setFilter(id)} style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:C.mono, background:filter===id?"rgba(0,200,240,0.12)":"transparent", color:filter===id?C.accent:C.soft, border:`1px solid ${filter===id?"rgba(0,200,240,0.3)":C.border}` }}>
              {label}
            </div>
          ))}
        </div>
        {filtered.map(emp=>{
          const s=sc(emp.status);
          const hasIssue=emp.delay>0||emp.cancelled;
          return (
            <div key={emp.id} onClick={()=>setSelEmp(emp)} style={{ background:C.card, borderRadius:16, border:`1px solid ${hasIssue?(emp.cancelled?"rgba(255,58,84,0.25)":"rgba(255,200,0,0.2)"):C.border}`, padding:"14px 16px", marginBottom:10, cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:22, background:`${emp.color}18`, border:`2px solid ${emp.color}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:emp.color, fontFamily:C.mono, flexShrink:0 }}>{emp.avatar}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:C.text }}>{emp.name}</span>
                    <span style={{ fontSize:10, color:C.muted, background:C.surface, borderRadius:5, padding:"2px 7px", fontFamily:C.mono, border:`1px solid ${C.border}` }}>{emp.dept}</span>
                  </div>
                  <div style={{ fontSize:12, color:C.soft, fontFamily:C.mono }}>{emp.flight} · {emp.dep} → {emp.arr}</div>
                  {emp.progress>0&&emp.progress<100&&(
                    <div style={{ height:3, background:C.surface, borderRadius:2, overflow:"hidden", marginTop:8, maxWidth:180 }}>
                      <div style={{ height:3, width:`${emp.progress}%`, background:`linear-gradient(90deg,${emp.color},${C.accent})`, borderRadius:2 }}/>
                    </div>
                  )}
                  {emp.saved&&<div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(0,232,122,0.08)", border:"1px solid rgba(0,232,122,0.2)", borderRadius:6, padding:"2px 7px", marginTop:5 }}><span style={{ fontSize:9 }}>💰</span><span style={{ fontSize:9, color:C.green, fontFamily:C.mono, fontWeight:700 }}>Saved ${emp.saved} vs avg</span></div>}
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ background:s.bg, border:`1px solid ${s.br}`, borderRadius:20, padding:"4px 10px", fontSize:10, color:s.c, fontWeight:700, fontFamily:C.mono, marginBottom:4 }}>{emp.status}</div>
                  {emp.delay>0&&<div style={{ fontSize:11, color:C.yellow, fontFamily:C.mono, fontWeight:700 }}>+{emp.delay}m delay</div>}
                  {emp.cancelled&&<div style={{ fontSize:10, color:C.red, fontWeight:600 }}>Needs rebooking</div>}
                  {!emp.delay&&!emp.cancelled&&<div style={{ fontSize:11, color:C.muted }}>{emp.eta}</div>}
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
          <div onClick={()=>setShowExport(true)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer" }}>
            <div style={{ fontSize:24, marginBottom:6 }}>📊</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>Export Report</div>
            <div style={{ fontSize:11, color:C.muted }}>Download as CSV</div>
          </div>
          <div onClick={()=>setShowSettings(true)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer" }}>
            <div style={{ fontSize:24, marginBottom:6 }}>⚙️</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>Settings</div>
            <div style={{ fontSize:11, color:C.muted }}>Alerts, team, SSO</div>
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
  const [showSettings, setShowSettings] = useState(false);
  const [showCancellations, setShowCancellations] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(true);
  const cancelledFlight = FLIGHTS[0]; // Demo: AA 1307 is "cancelled"
  const [leaveState, setLeaveState] = useState("later");
  const [navIdx, setNavIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [homeAddress, setHomeAddress] = useState("Miami, FL");

  C = isDark ? DARK : LIGHT;

  useEffect(()=>{ const i=setInterval(()=>setTick(n=>n+1),2000); return()=>clearInterval(i); },[]);

  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:C.sans, maxWidth:480, margin:"0 auto", position:"relative" }}>
      <style>{`::-webkit-scrollbar{display:none} *{box-sizing:border-box}`}</style>
      <div style={{ background:isDark?"rgba(4,7,14,0.98)":"rgba(240,244,248,0.98)", borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:10, height:10, borderRadius:5, background:C.orange, boxShadow:tick%2===0?`0 0 14px ${C.orange}`:"none", transition:"box-shadow 1.5s" }}/>
          <span style={{ fontFamily:C.display, fontSize:22, color:C.accent, letterSpacing:4 }}>MY RUNWAY</span>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <div onClick={()=>setIsDark(d=>!d)} style={{ background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)", border:`1px solid ${C.border}`, borderRadius:9, padding:"7px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:13 }}>{isDark?"☀️":"🌙"}</span>
          </div>
          <div onClick={()=>setShowSettings(true)} style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:9, padding:"7px 10px", cursor:"pointer" }}>
            <span style={{ fontSize:13 }}>⚙️</span>
          </div>
          <div onClick={()=>setShowAdd(true)} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:9, padding:"7px 12px", cursor:"pointer" }}>
            <span style={{ fontSize:12, color:"#000", fontWeight:800 }}>+ Add Flight</span>
          </div>
          <div onClick={()=>setShowCorp(true)} style={{ background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:9, padding:"7px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ fontSize:13 }}>🏢</span>
          </div>
          <div onClick={()=>setShowShare(true)} style={{ background:"rgba(0,200,240,0.07)", border:"1px solid rgba(0,200,240,0.15)", borderRadius:9, padding:"7px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ fontSize:13 }}>🔗</span>
          </div>
          <div onClick={()=>setShowCancellations(true)} style={{ background:"rgba(255,58,84,0.1)", border:"1px solid rgba(255,58,84,0.3)", borderRadius:9, padding:"7px 10px", cursor:"pointer", position:"relative" }}>
            <span style={{ fontSize:13 }}>🚨</span>
            <div style={{ position:"absolute", top:-3, right:-3, width:8, height:8, borderRadius:4, background:C.red, border:"1.5px solid #04070e" }}/>
          </div>
        </div>
      </div>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:3 }}>
          {tab==="flights"?"My Flights":tab==="weather"?"Airport Weather":tab==="family"?"Family Tracker":tab==="plans"?"Plans & Pricing":"My Passport"}
        </div>
        <div style={{ fontSize:13, color:C.soft }}>
          {tab==="flights"?"Your Peru trip · Apr 22–28":tab==="weather"?"Conditions at every stop":tab==="family"?"Everyone's flights in one place":tab==="plans"?"Choose the right plan":"Your lifetime flying history"}
        </div>
      </div>
      <div style={{ flex:1 }}>
        {tab==="flights"&&<FlightsScreen onTap={f=>alert(`${f.iata}\n${f.dep} → ${f.arr}\nStatus: ${f.status}\nGate: ${f.gate} · Terminal: ${f.terminal}\nConf#: ${f.conf}\n${f.date}`)} onAdd={()=>setShowAdd(true)} leaveState={leaveState} setLeaveState={setLeaveState} navIdx={navIdx} setNavIdx={setNavIdx} homeAddress={homeAddress}/>}
        {tab==="weather"&&<WeatherScreen/>}
        {tab==="family"&&<FamilyScreen/>}
        {tab==="passport"&&<PassportScreen/>}
        {tab==="plans"&&<PlansScreen/>}
      </div>
      <BottomNav active={tab} onNav={t=>setTab(t)}/>
      {showAdd&&<AddModal onClose={()=>setShowAdd(false)}/>}
      {showCancellations&&<CancellationScreen onBack={()=>setShowCancellations(false)}/>}
      {showCancelAlert&&<CancellationAlert flight={cancelledFlight} onDismiss={()=>setShowCancelAlert(false)} onAction={()=>{ setShowCancelAlert(false); setShowCancellations(true); }}/>}
      {showShare&&<ShareModal onClose={()=>setShowShare(false)}/>}
      {showSettings&&<SettingsModal onClose={()=>setShowSettings(false)} isDark={isDark} setIsDark={setIsDark} homeAddress={homeAddress} setHomeAddress={setHomeAddress}/>}
      {showCorp&&<CorporateDashboard onClose={()=>setShowCorp(false)}/>}
    </div>
  );
}
