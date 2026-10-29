import { useState, useEffect } from "react";
// Vintage aviation fonts loaded via CSS injection below

const DARK = {
  bg:"#04070e", surface:"#090f1c", card:"#0d1525", border:"#13203a",
  accent:"#00c8f0", green:"#00e87a", yellow:"#ffc800",
  red:"#ff3a54", purple:"#a78bfa", orange:"#ff5c2b",
  text:"#d4ecff", muted:"#4e7090", soft:"#7a9ab8",
  mono:"'Courier New',monospace", sans:"Georgia,serif",
  display:"'Playfair Display','Times New Roman',serif",
  deco:"'Courier New',monospace",
};
const LIGHT = {
  bg:"#f5f0e8", surface:"#fffff8", card:"#fffef5", border:"#d4c9a8",
  accent:"#8b5e1a", green:"#4a7c3f", yellow:"#b88a00",
  red:"#8b2020", purple:"#5a3a6b", orange:"#c4511a",
  text:"#1a1208", muted:"#7a6a4a", soft:"#5a4a2a",
  mono:"'Courier New',monospace", sans:"Georgia,serif",
  display:"'Playfair Display','Times New Roman',serif",
  deco:"'Courier New',monospace",
};
let C = DARK;
// Global account type — "personal" | "pro" | "corporate"
let ACCOUNT_TYPE = "personal";
// Developer mode — set to false before publishing to App Store
const DEV_MODE = true;

const FLIGHTS = [
  {
    id:"f1", iata:"LY 018", code:"LY", airline:"El Al Israel Airlines",
    dep:"MIA", arr:"TLV", depTime:"2:30 PM", arrTime:"9:30 AM+1",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"TBD",
    aircraft:"Boeing 787-9", date:"Sun Jun 14, 2026", sortDate:"2026-06-14T14:30", conf:"8ZEH6P", trip:"outbound",
    inbound:"Arriving from TLV, on the ground at MIA — on time",
    wx:{
      dep:{ icon:"🌤️", temp:88, cond:"Sunny", wind:10, note:"Great departure conditions" },
      arr:{ icon:"☀️", temp:82, cond:"Sunny", wind:14, note:"Beautiful Tel Aviv morning" },
    },
    conn:null,
  },
  {
    id:"f2", iata:"LY 347", code:"LY", airline:"El Al Israel Airlines",
    dep:"TLV", arr:"ZRH", depTime:"8:00 AM", arrTime:"11:20 AM",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"3",
    aircraft:"Boeing 737-800", date:"Thu Jul 2, 2026", sortDate:"2026-07-02T08:00", conf:"8ZEH6P", trip:"return",
    wx:{
      dep:{ icon:"☀️", temp:84, cond:"Sunny", wind:12, note:"Warm Tel Aviv morning" },
      arr:{ icon:"⛅", temp:68, cond:"Partly Cloudy", wind:8, note:"Mild Zurich afternoon" },
    },
    conn:null,
  },
  {
    id:"f3", iata:"LX 064", code:"LX", airline:"Swiss International Air Lines",
    dep:"ZRH", arr:"MIA", depTime:"1:00 PM", arrTime:"5:25 PM",
    status:"Scheduled", progress:0, gate:"TBD", terminal:"TBD",
    aircraft:"Boeing 777-300ER", date:"Thu Jul 2, 2026", sortDate:"2026-07-02T13:00", conf:"8ZEH6P", trip:"return",
    wx:{
      dep:{ icon:"⛅", temp:68, cond:"Partly Cloudy", wind:8, note:"Mild Zurich afternoon" },
      arr:{ icon:"🌤️", temp:90, cond:"Sunny", wind:15, note:"Hot Miami afternoon — welcome home!" },
    },
    conn:{
      arrTerminal:"Terminal 2", arrGate:"TBD",
      depTerminal:"Terminal 2", depGate:"TBD",
      walkMins:25, layoverMins:100, buffer:75,
      transport:"Walk within terminal",
      security:"Security screening required — allow extra time with children",
      steps:[
        { icon:"🛬", label:"Deplane at ZRH Terminal 2", mins:10 },
        { icon:"🔒", label:"Security screening", mins:20 },
        { icon:"🚶", label:"Walk to departure gate", mins:10 },
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
  later:{ c:"#00e87a", bg:"rgba(0,232,122,0.07)", br:"rgba(0,232,122,0.18)", icon:"✅", label:"ON TRACK", time:"11:00 AM", sub:"Leave in 2h 22m · LY 018 departs 2:30 PM" },
  soon: { c:"#ffc800", bg:"rgba(255,200,0,0.07)", br:"rgba(255,200,0,0.18)", icon:"⏰", label:"LEAVING SOON", time:"11:00 AM", sub:"Leave in 48 min · LY 018 departs 2:30 PM" },
  now:  { c:"#ff3a54", bg:"rgba(255,58,84,0.07)", br:"rgba(255,58,84,0.18)", icon:"🚨", label:"LEAVE NOW", time:"11:00 AM", sub:"Only 12 minutes! LY 018 departs 2:30 PM" },
};

const EMPLOYEES = [
  { id:1, name:"Sarah Chen", dept:"Sales", avatar:"SC", color:"#00c8f0", flight:"AA 100", dep:"JFK", arr:"LAX", status:"Departed", eta:"11:45 AM", progress:62, gate:"B22", delay:0, phone:"(212) 555-0101", saved:142 },
  { id:2, name:"Marcus Lee", dept:"Eng", avatar:"ML", color:"#00e87a", flight:"DL 456", dep:"ATL", arr:"SFO", status:"On Time", eta:"2:30 PM", progress:0, gate:"D14", delay:0, phone:"(415) 555-0192", saved:78 },
  { id:3, name:"Priya Sharma", dept:"Sales", avatar:"PS", color:"#ffc800", flight:"UA 789", dep:"LAX", arr:"ORD", status:"Delayed", eta:"~5:45 PM", progress:0, gate:"C11", delay:55, phone:"(312) 555-0134" },
  { id:4, name:"Tom Walsh", dept:"Exec", avatar:"TW", color:"#a78bfa", flight:"BA 178", dep:"LHR", arr:"JFK", status:"In Air", eta:"8:00 PM", progress:78, gate:"T7", delay:0, phone:"(646) 555-0177" },
  { id:5, name:"Lisa Park", dept:"HR", avatar:"LP", color:"#ff5c2b", flight:"SW 321", dep:"DAL", arr:"MIA", status:"Cancelled", eta:"—", progress:0, gate:"—", delay:0, phone:"(305) 555-0155", cancelled:true },
  { id:6, name:"James Rivera", dept:"Eng", avatar:"JR", color:"#00e87a", flight:"AA 200", dep:"BOS", arr:"DFW", status:"Landed", eta:"Arrived", progress:100, gate:"B8", delay:0, phone:"(972) 555-0188" },
];

// SECURITY: hardcoded API keys removed (they were exposed in plaintext and must be rotated).
const AERO_KEY = "";
const AVSTACK_KEY = "";
const FLIGHTAWARE_KEY = "";

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
      inboundId: f.inbound_fae_flight_id || null,
    };
  } catch (e) {
    console.error("FlightAware error:", e);
    return null;
  }
}

// Fetch the status of the inbound aircraft (the plane that becomes your flight)
async function fetchInboundStatus(inboundId) {
  if (!inboundId) return null;
  const url = `https://aeroapi.flightaware.com/aeroapi/flights/${inboundId}`;
  try {
    const res = await fetch(url, {
      headers: { "x-apikey": FLIGHTAWARE_KEY, "Accept": "application/json; charset=UTF-8" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const f = data?.flights?.[0];
    if (!f) return null;
    const origin = f.origin?.code_iata || f.origin?.code || "origin";
    const delay = f.arrival_delay ? Math.round(f.arrival_delay / 60) : 0;
    const st = f.status || "";
    if (st.includes("Arrived") || st.includes("Landed")) {
      return `Arriving from ${origin}, already on the ground — ${delay > 15 ? `${delay} min late` : "on time"}`;
    }
    if (st.includes("En Route")) {
      return `Arriving from ${origin}, in the air — ${delay > 15 ? `running ${delay} min late ⚠️` : "on time"}`;
    }
    if (st.includes("Scheduled")) {
      return `Arriving from ${origin}, not yet departed — ${delay > 15 ? `expected ${delay} min late ⚠️` : "on time"}`;
    }
    return `Arriving from ${origin} — ${st}`;
  } catch (e) {
    console.error("Inbound fetch error:", e);
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
  const inbound = fw?.inboundId ? await fetchInboundStatus(fw.inboundId) : null;
  return {
    status: faStatusNorm || avStatusNorm || null,
    depTime: fw?.depTime || av?.depTime || null,
    arrTime: fw?.arrTime || av?.arrTime || null,
    depDelay: fw?.depDelay || av?.depDelay || 0,
    arrDelay: fw?.arrDelay || av?.arrDelay || 0,
    gate: fw?.depGate || av?.depGate || ae?.gate || null,
    depTerminal: fw?.depTerminal || av?.depTerminal || ae?.depTerminal || null,
    arrTerminal: fw?.arrTerminal || av?.arrTerminal || ae?.arrTerminal || null,
    inbound,
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
  const [showDebug, setShowDebug] = useState(false);
  const [apiResults, setApiResults] = useState({ fa:null, av:null, ae:null });

  useEffect(() => {
    setLoading(true);
    const iata = f.iata.replace(" ", "");
    const dateStr = f.sortDate?.slice(0,10) || "2026-06-14";

    // Run all 3 APIs simultaneously and capture individual results
    Promise.allSettled([
      fetchFlightAware(iata, dateStr),
      fetchAviationStack(iata, dateStr),
      fetchAeroDataBox(iata, dateStr),
    ]).then(([fa, av, ae]) => {
      const faData = fa.status === "fulfilled" ? fa.value : null;
      const avData = av.status === "fulfilled" ? av.value : null;
      const aeData = ae.status === "fulfilled" ? ae.value : null;
      setApiResults({ fa:faData, av:avData, ae:aeData });
      // Best data wins
      const faStatus = faData?.status || "";
      const faNorm = faStatus.includes("En Route")?"In Air":faStatus.includes("Arrived")?"Landed":faStatus.includes("Cancelled")?"Cancelled":faStatus.includes("Delayed")?"Delayed":faStatus.includes("Scheduled")?"Scheduled":null;
      const avRaw = avData?.status || "";
      const avNorm = avRaw==="active"?"In Air":avRaw==="landed"?"Landed":avRaw==="cancelled"?"Cancelled":avRaw==="scheduled"?"Scheduled":null;
      setLiveData({
        status: faNorm || avNorm || null,
        depTime: faData?.depTime || avData?.depTime || null,
        arrTime: faData?.arrTime || avData?.arrTime || null,
        depDelay: faData?.depDelay || avData?.depDelay || 0,
        arrDelay: faData?.arrDelay || avData?.arrDelay || 0,
        gate: faData?.depGate || avData?.depGate || aeData?.gate || null,
        depTerminal: faData?.depTerminal || avData?.depTerminal || aeData?.depTerminal || null,
        arrTerminal: faData?.arrTerminal || avData?.arrTerminal || aeData?.arrTerminal || null,
        inbound: faData?.inboundId ? "Fetching inbound..." : null,
      });
      setLoading(false);
    });
  }, [f.id]);

  const gate = liveData?.gate || f.gate;
  const terminal = liveData?.depTerminal || f.terminal;
  const status = liveData?.status || f.status;
  const delay = liveData?.depDelay || 0;
  const inbound = liveData?.inbound || f.inbound;
  const ls = sc(status);

  // Debug helper
  function apiRowColor(data) {
    if (data === null) return C.muted;
    if (data && (data.status || data.gate || data.depGate)) return C.green;
    return C.yellow;
  }
  function apiRowIcon(data) {
    if (data === null) return "⚪";
    if (data && (data.status || data.gate || data.depGate)) return "✅";
    return "⚠️";
  }
  function apiRowLabel(data, name) {
    if (data === null) return `${name} — no data (flight too far out or key issue)`;
    const parts = [];
    if (data.status) parts.push(`Status: ${data.status}`);
    if (data.depGate || data.gate) parts.push(`Gate: ${data.depGate || data.gate}`);
    if (data.depTerminal) parts.push(`Terminal: ${data.depTerminal}`);
    if (data.depDelay > 0) parts.push(`Delay: +${data.depDelay}m`);
    return `${name} — ${parts.length ? parts.join(" · ") : "connected but no live data yet"}`;
  }

  return (
    <div style={{ background:C.card, borderRadius:20, border:`1px solid ${status==="Delayed"?"rgba(255,200,0,0.3)":status==="Gate Change"?"rgba(167,139,250,0.3)":C.border}`, padding:16, marginBottom:10, animation:"cardIn 0.4s ease" }}>
      <div onClick={()=>onTap(f)} style={{ cursor:"pointer" }}>
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
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
          <span style={{ background:gate!=="TBD"?"rgba(0,200,240,0.1)":C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:gate!=="TBD"?C.accent:C.soft, border:`1px solid ${gate!=="TBD"?"rgba(0,200,240,0.3)":C.border}` }}>Gate <b style={{ color:gate!=="TBD"?C.accent:C.text, fontFamily:C.mono }}>{gate}</b></span>
          <span style={{ background:terminal!=="TBD"?"rgba(0,200,240,0.1)":C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:terminal!=="TBD"?C.accent:C.soft, border:`1px solid ${terminal!=="TBD"?"rgba(0,200,240,0.3)":C.border}` }}>Terminal <b style={{ color:terminal!=="TBD"?C.accent:C.text, fontFamily:C.mono }}>{terminal}</b></span>
          {f.conf&&<span style={{ background:C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:C.soft, border:`1px solid ${C.border}`, fontFamily:C.mono }}>CONF# {f.conf}</span>}
          {f.date&&<span style={{ background:C.surface, borderRadius:8, padding:"5px 11px", fontSize:12, color:C.soft, border:`1px solid ${C.border}` }}>{f.date}</span>}
        </div>
      </div>

      {/* Inbound tracker */}
      {inbound&&(
        <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16 }}>🔄</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:0.5, marginBottom:2 }}>YOUR INCOMING AIRCRAFT</div>
            <div style={{ fontSize:12, color:C.soft }}>{inbound}</div>
          </div>
        </div>
      )}

      {/* ── Data Sources dropdown — DEV ONLY ── */}
      {DEV_MODE&&(
        <>
        <div onClick={e=>{ e.stopPropagation(); setShowDebug(d=>!d); }} style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11 }}>📡</span>
            <span style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:1 }}>DATA SOURCES</span>
            {loading&&<span style={{ fontSize:10, color:C.muted, fontFamily:C.mono }}>· checking...</span>}
            {!loading&&<span style={{ fontSize:10, color:liveData?C.green:C.muted, fontFamily:C.mono }}>· {liveData?"live":"pre-flight"}</span>}
          </div>
          <span style={{ fontSize:11, color:C.muted }}>{showDebug?"▲":"▼"}</span>
        </div>

        {showDebug&&(
          <div style={{ marginTop:10, background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px", animation:"cardIn 0.2s ease" }}>
            {[
              ["FlightAware AeroAPI", apiResults.fa, "Gates · Status · Inbound aircraft"],
              ["AviationStack", apiResults.av, "Status · Times · Delays"],
              ["AeroDataBox", apiResults.ae, "Gate · Terminal backup"],
            ].map(([name, data, desc])=>(
              <div key={name} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:14, flexShrink:0, marginTop:2 }}>{apiRowIcon(data)}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:apiRowColor(data), marginBottom:2 }}>{name}</div>
                  <div style={{ fontSize:11, color:C.soft, marginBottom:2 }}>{desc}</div>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono }}>{apiRowLabel(data, "→")}</div>
                </div>
              </div>
            ))}
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0" }}>
              <span style={{ fontSize:14, flexShrink:0, marginTop:2 }}>⚪</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:2 }}>AvioWiki Lounges</div>
                <div style={{ fontSize:11, color:C.soft, marginBottom:2 }}>Lounge locations · Access rules · Hours</div>
                <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono }}>→ Hardcoded MIA/TLV/ZRH — sufficient for launch</div>
              </div>
            </div>
            <div style={{ marginTop:10, padding:"8px 10px", background:"rgba(0,200,240,0.05)", borderRadius:8, border:"1px solid rgba(0,200,240,0.15)" }}>
              <div style={{ fontSize:10, color:C.muted, lineHeight:1.5 }}>
                💡 Live data activates ~24–48h before departure. Before that, APIs return "Scheduled" which is correct — not a bug.
              </div>
            </div>
          </div>
        )}
        </>
      )}
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
          </div>          <div onClick={()=>{ alert(`Notifying your contacts about the cancellation of ${flight.iata}...

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
    { id:"c1", iata:"AA 100", dep:"MIA", arr:"JFK", date:"Example flight", detectedAt:"6 hours before departure", notifiedAt:"Never — airline did not notify", status:"Cancelled", rebookedOn:"AA 102", savings:"Caught early — rebooking saved $340" },
    { id:"c2", iata:"DL 200", dep:"ATL", arr:"LAX", date:"Example flight", detectedAt:"3 hours before departure", notifiedAt:"1 hour before departure", status:"Cancelled", rebookedOn:"DL 202", savings:"Detected 2hrs before airline alert" },
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
  const autoMsg = `Landing TLV (Ben Gurion) at 9:30 AM on El Al LY 018. Departing MIA 2:30 PM Sun Jun 14. Arriving Mon Jun 15.`;
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

function SettingsModal({ onClose, isDark, setIsDark, homeAddress, setHomeAddress, accountType, setAccountType, navIdx, setNavIdx }) {
  const [addr, setAddr] = useState(homeAddress);
  const [alerts, setAlerts] = useState({ delays:true, cancels:true, gates:true, boarding:true, checkin:true });
  const [saved, setSaved] = useState(false);
  function save() {
    setHomeAddress(addr);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:60, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:"20px 20px 48px", border:`1px solid ${C.border}`, maxWidth:480, margin:"0 auto", width:"100%", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ width:36, height:4, background:C.border, borderRadius:2, margin:"0 auto 18px" }}/>
        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:20 }}>Settings</div>

        {/* Account Type */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>ACCOUNT TYPE</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["personal","👤","Personal"],["pro","⭐","Pro"],["corporate","🏢","Corporate"]].map(([id,icon,label])=>(
              <div key={id} onClick={()=>setAccountType(id)} style={{ flex:1, background:accountType===id?`${id==="corporate"?C.purple:C.accent}18`:C.card, border:`2px solid ${accountType===id?(id==="corporate"?C.purple:C.accent):C.border}`, borderRadius:12, padding:"12px 6px", textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:accountType===id?(id==="corporate"?C.purple:C.accent):C.soft }}>{label}</div>
              </div>
            ))}
          </div>
          {accountType==="corporate"&&<div style={{ fontSize:11, color:C.purple, marginTop:8, background:"rgba(167,139,250,0.08)", borderRadius:8, padding:"8px 12px", border:"1px solid rgba(167,139,250,0.2)" }}>🏢 Corporate mode: team dashboard visible, company banner shown at top</div>}
          {accountType==="personal"&&<div style={{ fontSize:11, color:C.muted, marginTop:8 }}>Personal mode: corporate features hidden. Upgrade to Corporate to manage a team.</div>}
        </div>

        {/* Theme */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>APPEARANCE</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["🌙","Dark Mode",true,"#04070e","#d4ecff"],["☀️","Light Mode",false,"#f0f4f8","#0a1628"]].map(([icon,label,dark,bg,text])=>(
              <div key={label} onClick={()=>setIsDark(dark)} style={{ flex:1, background:isDark===dark?`${C.accent}18`:C.card, border:`2px solid ${isDark===dark?C.accent:C.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center", cursor:"pointer", position:"relative" }}>
                {isDark===dark&&<div style={{ position:"absolute", top:8, right:8, width:8, height:8, borderRadius:4, background:C.accent }}/>}
                <div style={{ width:40, height:28, borderRadius:8, background:bg, border:`1px solid ${C.border}`, margin:"0 auto 8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color:isDark===dark?C.accent:C.soft }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:C.muted, marginTop:8, textAlign:"center" }}>Changes take effect immediately</div>
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
            {NAV_APPS.map((a,i)=>(
              <div key={a.id} onClick={()=>setNavIdx(i)} style={{ flex:1, background:navIdx===i?`${a.color}18`:C.card, border:`2px solid ${navIdx===i?a.color:C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
                <NavLogo app={a} size={24}/>
                <div style={{ fontSize:11, fontWeight:700, color:navIdx===i?a.color:C.soft, marginTop:4 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert preferences — moved from cancellation screen */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>ALERT PREFERENCES</div>
          {[
            ["delays","⏰","Delay alerts","Notify me when a flight is delayed"],
            ["cancels","🚨","Cancellation alerts","Instant alert if a flight is cancelled — before the airline"],
            ["gates","🚪","Gate changes","Alert when gate is assigned or changes"],
            ["boarding","✈️","Boarding alerts","Notify me when boarding starts"],
            ["checkin","🎫","Check-in reminder","Remind me 24h before check-in opens"],
          ].map(([key,icon,title,desc])=>(
            <div key={key} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:20 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:11, color:C.muted }}>{desc}</div>
              </div>
              <div onClick={()=>setAlerts(a=>({...a,[key]:!a[key]}))} style={{ width:44, height:26, borderRadius:13, background:alerts[key]?C.accent:"#2a3f5f", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute", top:3, left:alerts[key]?21:3, transition:"left 0.2s" }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Plans & Pricing */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>PLAN & PRICING</div>
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden" }}>
            {[
              { id:"free", label:"Free", desc:"Track up to 2 flights", price:"$0", color:C.soft },
              { id:"pro", label:"Pro", desc:"Unlimited flights + all features", price:"$19.99/yr", color:C.accent },
              { id:"corporate", label:"Corporate", desc:"Team dashboard + expenses", price:"From $6/seat/mo", color:C.purple },
            ].map((plan,i)=>(
              <div key={plan.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderBottom:i<2?`1px solid ${C.border}`:"none", background:accountType===plan.id?`${plan.color}08`:"transparent" }}>
                <div style={{ width:10, height:10, borderRadius:5, border:`2px solid ${plan.color}`, background:accountType===plan.id?plan.color:"transparent", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:accountType===plan.id?plan.color:C.text }}>{plan.label}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{plan.desc}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:plan.color, fontFamily:C.mono }}>{plan.price}</div>
              </div>
            ))}
          </div>
          {accountType!=="pro"&&accountType!=="corporate"&&(
            <div onClick={()=>alert("Opening Pro checkout ($19.99/yr)...")} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"12px 0", textAlign:"center", fontWeight:800, fontSize:13, color:"#000", cursor:"pointer", marginTop:10 }}>
              Upgrade to Pro →
            </div>
          )}
          {accountType!=="corporate"&&(
            <div onClick={()=>alert("Opening Corporate pricing page...")} style={{ background:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:11, padding:"12px 0", textAlign:"center", fontWeight:800, fontSize:13, color:"#fff", cursor:"pointer", marginTop:8 }}>
              See Corporate Plans →
            </div>
          )}
        </div>

        {/* Plans & Pricing */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>PLAN & PRICING</div>
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden" }}>
            {[
              { id:"personal", label:"Free", desc:"Track up to 2 flights", price:"$0", color:C.soft },
              { id:"pro", label:"Pro", desc:"Unlimited flights + all features", price:"$19.99/yr", color:C.accent },
              { id:"corporate", label:"Corporate", desc:"Team dashboard + expenses", price:"From $6/seat/mo", color:C.purple },
            ].map((plan,i)=>(
              <div key={plan.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderBottom:i<2?`1px solid ${C.border}`:"none", background:accountType===plan.id?`${plan.color}10`:"transparent" }}>
                <div style={{ width:10, height:10, borderRadius:5, border:`2px solid ${plan.color}`, background:accountType===plan.id?plan.color:"transparent", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:accountType===plan.id?plan.color:C.text }}>{plan.label}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{plan.desc}</div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:plan.color, fontFamily:C.mono }}>{plan.price}</div>
              </div>
            ))}
          </div>
          {accountType==="personal"&&(
            <div onClick={()=>alert("Opening Pro checkout — $19.99/yr")} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"12px 0", textAlign:"center", fontWeight:800, fontSize:13, color:"#000", cursor:"pointer", marginTop:10 }}>
              Upgrade to Pro →
            </div>
          )}
          <div onClick={()=>alert("Opening Corporate pricing...")} style={{ background:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:11, padding:"12px 0", textAlign:"center", fontWeight:700, fontSize:13, color:"#fff", cursor:"pointer", marginTop:8 }}>
            {accountType==="corporate"?"Manage Corporate Plan →":"See Corporate Plans →"}
          </div>
        </div>

        {/* Feature requests */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:6 }}>WHAT WOULD YOU LIKE TO SEE NEXT?</div>
          <div style={{ fontSize:12, color:C.soft, marginBottom:12 }}>Vote for features or suggest your own — we read every one.</div>
          {[
            ["🗺️","Live flight map","See your plane's position on a map in real time"],
            ["🔔","SMS alerts","Text when your flight is cancelled or delayed"],
            ["🎒","Bag tracking","Know where your checked luggage is at all times"],
            ["🏨","Hotel integration","Add hotel bookings alongside your flights"],
            ["🚗","Rental car","Track pickup times and return deadlines"],
            ["💳","Points & miles","See your loyalty points update after each flight"],
            ["🤖","AI trip assistant","Ask questions about your trip, get instant answers"],
            ["🌍","Offline mode","Access your trip info without internet"],
          ].map(([icon,title,desc])=>{
            const [voted,setVoted] = useState(false);
            return (
              <div key={title} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{title}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{desc}</div>
                </div>
                <div onClick={()=>setVoted(v=>!v)} style={{ background:voted?"rgba(0,232,122,0.12)":C.surface, border:`1.5px solid ${voted?"rgba(0,232,122,0.4)":C.border}`, borderRadius:20, padding:"5px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, flexShrink:0, transition:"all 0.2s" }}>
                  <span style={{ fontSize:12 }}>{voted?"❤️":"🤍"}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:voted?C.green:C.soft }}>{voted?"Voted":"Vote"}</span>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:8 }}>YOUR OWN IDEA</div>
            <textarea placeholder="Tell us what you'd love to see in My Runway..."
              style={{ width:"100%", background:C.card, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"12px 14px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box", resize:"none", height:80, fontFamily:C.sans }}
              onFocus={e=>e.target.style.borderColor=C.accent}
              onBlur={e=>e.target.style.borderColor=C.border}
            />
            <div onClick={()=>alert("Thanks for the suggestion! We read every one. 🙏")} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"11px 0", textAlign:"center", fontWeight:700, fontSize:13, color:C.soft, cursor:"pointer", marginTop:8 }}>
              Send Suggestion →
            </div>
          </div>
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
  const [showAll, setShowAll] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  // ── Smart flight progression ──────────────────────────────────
  // Find the next upcoming flight based on today's date
  const now = new Date();
  const upcoming = FLIGHTS.filter(f => new Date(f.sortDate) > now);
  const completed = FLIGHTS.filter(f => new Date(f.sortDate) <= now || f.status === "Landed");
  const nextFlight = upcoming[0] || null; // The hero — next flight
  const remainingFlights = upcoming.slice(1); // Everything after the next flight

  // Group label for next flight
  const nextLabel = nextFlight
    ? nextFlight.trip === "outbound"
      ? `OUTBOUND · JUN 14`
      : `RETURN · JUL 2`
    : null;

  function renderFlightGroup(flights, showAll, setShowAll) {
    return flights.map((f, i) => (
      <div key={f.id}>
        {/* Connection bridge BEFORE this flight — describes getting from previous flight to this one */}
        {f.conn && (i === 0 || showAll) && <ConnBridge conn={f.conn}/>}
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
      {/* ── Slim protection banner ── */}
      <div style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(0,232,122,0.07)", borderRadius:12, border:"1px solid rgba(0,232,122,0.22)", padding:"10px 14px", marginBottom:14 }}>
        <div style={{ position:"relative", width:10, height:10, flexShrink:0 }}>
          <div style={{ position:"absolute", inset:0, borderRadius:5, background:C.green, animation:"pulse 2s infinite" }}/>
        </div>
        <span style={{ fontSize:12, fontWeight:700, color:C.green }}>All flights protected</span>
        <span style={{ fontSize:11, color:C.soft }}>· checking every 15 min</span>
        <style>{`@keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:0.4}100%{transform:scale(1);opacity:1}}`}</style>
      </div>

      {/* ── Completed flights (collapsed, above next flight) ── */}
      {completed.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ flex:1, height:1, background:C.border }}/>
            <span style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1 }}>COMPLETED</span>
            <div style={{ flex:1, height:1, background:C.border }}/>
          </div>
          {completed.map(f=>(
            <div key={f.id} style={{ background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, padding:"10px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10, opacity:0.6 }}>
              <span style={{ fontSize:18 }}>✅</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:C.mono }}>{f.iata}</div>
                <div style={{ fontSize:11, color:C.muted }}>{f.dep} → {f.arr} · {f.date}</div>
              </div>
              <div style={{ fontSize:11, color:C.green, fontFamily:C.mono, fontWeight:700 }}>Landed ✓</div>
            </div>
          ))}
        </div>
      )}

      {/* ── NEXT FLIGHT — the hero ── */}
      {nextFlight ? (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:20, padding:"4px 12px" }}>
              <span style={{ fontSize:10, fontWeight:800, color:"#000", fontFamily:C.mono, letterSpacing:1 }}>NEXT FLIGHT UP</span>
            </div>
            <span style={{ fontSize:10, color:C.muted, fontFamily:C.mono }}>{nextLabel}</span>
          </div>
          <FlightCard f={nextFlight} onTap={onTap}/>

          {/* ── Remaining flights after the hero ── */}
          {remainingFlights.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ flex:1, height:1, background:C.border }}/>
                <span style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1 }}>COMING UP</span>
                <div style={{ flex:1, height:1, background:C.border }}/>
              </div>
              {remainingFlights.map(f => (
                <div key={f.id}>
                  {f.conn && <ConnBridge conn={f.conn}/>}
                  <FlightCard f={f} onTap={onTap}/>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"32px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
          <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>All flights completed!</div>
          <div style={{ fontSize:13, color:C.soft }}>You're home. Add your next trip to start tracking.</div>
          <div onClick={onAdd} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:12, padding:"12px 0", marginTop:20, cursor:"pointer" }}>
            <span style={{ fontSize:14, fontWeight:800, color:"#000" }}>+ Add Next Trip</span>
          </div>
        </div>
      )}

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
            {[["🚗","Drive","45 min"],["🚦","Traffic","+15m"],["📍","Dist","28 mi"],["✈️","Buffer","3h"]].map(([icon,label,val],i)=>(
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
          <div onClick={()=>alert(`Opening ${app.label} → Miami International Airport (MIA)`)} style={{ background:`linear-gradient(135deg,${app.color},${app.color}bb)`, borderRadius:14, padding:"15px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:"pointer" }}>
            <NavLogo app={app} size={22}/>
            <span style={{ fontSize:15, fontWeight:800, color:"#000" }}>Get Directions in {app.label}</span>
          </div>
          <div style={{ textAlign:"center", marginTop:8 }}>
            <span style={{ fontSize:11, color:C.muted }}>Using {app.label} · </span>
            <span onClick={()=>alert("Change your navigation app in ⚙️ Settings → Preferred Navigation App")} style={{ fontSize:11, color:C.accent, cursor:"pointer" }}>Change in Settings</span>
          </div>
        </div>
      </div>

      {/* ── Trip Extras (collapsible to reduce clutter) ── */}
      <div onClick={()=>setShowExtras(o=>!o)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:4, marginBottom:showExtras?12:14, cursor:"pointer", background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"13px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>🎫</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.text }}>Check-in & Carbon</span>
        </div>
        <span style={{ fontSize:14, color:C.accent }}>{showExtras?"▲":"▼"}</span>
      </div>

      {showExtras&&<>
      {/* ── Check-in Reminder Card ── */}
      <div style={{ background:"rgba(0,200,240,0.07)", borderRadius:18, border:"1px solid rgba(0,200,240,0.25)", padding:16, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <span style={{ fontSize:22 }}>🎫</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.accent, marginBottom:2 }}>Check-in Opens Soon!</div>
            <div style={{ fontSize:12, color:C.soft }}>LY 018 · MIA → TLV · Sun Jun 14</div>
          </div>
          <div style={{ background:"rgba(0,200,240,0.15)", borderRadius:8, padding:"4px 10px", border:"1px solid rgba(0,200,240,0.3)" }}>
            <span style={{ fontSize:10, color:C.accent, fontFamily:C.mono, fontWeight:700 }}>24H ALERT</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={()=>alert("Opening elal.com check-in for LY 018...\n\nIn the live app this opens the airline check-in page directly!")} style={{ flex:1, background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"11px 0", textAlign:"center", cursor:"pointer" }}>
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
            <div style={{ fontSize:11, color:C.soft }}>Israel family trip · 3 flights · 6 passengers</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {[["✈️ MIA→TLV","890 kg"],["✈️ TLV→ZRH","312 kg"],["✈️ ZRH→MIA","756 kg"]].map(([leg,co2])=>(
            <div key={leg} style={{ flex:1, background:C.surface, borderRadius:9, padding:"8px 4px", textAlign:"center", border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:9, color:C.soft, marginBottom:3 }}>{leg}</div>
              <div style={{ fontSize:11, fontWeight:800, color:C.green, fontFamily:C.mono }}>{co2}</div>
            </div>
          ))}
        </div>
        <div style={{ background:C.surface, borderRadius:11, padding:"10px 14px", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginBottom:2 }}>TOTAL · 6 PASSENGERS</div>
            <div style={{ fontSize:18, fontWeight:800, color:C.green, fontFamily:C.mono }}>11,748 kg CO₂</div>
          </div>
          <div onClick={()=>alert("Opening carbon offset options...\n\nIn the live app this connects to a carbon offset provider like Gold Standard or Terrapass.")} style={{ background:"rgba(0,232,122,0.1)", border:"1px solid rgba(0,232,122,0.3)", borderRadius:10, padding:"8px 12px", cursor:"pointer" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.green }}>Offset It 🌳</div>
          </div>
        </div>
      </div>
      </>}

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

        <div onClick={()=>alert("Our sales team will contact you within 24 hours to get your team set up!")} style={{ background:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:14, padding:"16px 0", textAlign:"center", fontWeight:800, fontSize:16, color:"#fff", cursor:"pointer", marginBottom:12 }}>
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
          {t.tag&&<div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:t.color, borderRadius:20, padding:"4px 16px", fontSize:11, fontWeight:800, color:"#000", fontFamily:C.mono, letterSpacing:1, whiteSpace:"nowrap" }}>{t.tag}</div>}
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
          <div onClick={()=>alert(t.id==="free"?"You're on the free plan!":"Opening checkout for Pro ($19.99/yr)...")}
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

function CorporateSettings({ onBack, isAdmin=true, teamVisible, setTeamVisible }) {
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
  const statusIcon = { draft:"✏️", submitted:"⏳", approved:"✅", rejected:"❌" };

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
            <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>CAPTURE RECEIPT</div>
            <div style={{ display:"flex", gap:8 }}>
              <label style={{ flex:1, background:"rgba(0,200,240,0.07)", border:"1px solid rgba(0,200,240,0.25)", borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer", display:"block" }}>
                <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) alert("📸 Photo captured!\n\nIn the live app, AI reads:\n• Merchant name\n• Amount\n• Date\n• Category\n\nAnd pre-fills the form below. Review and edit if needed."); }}/>
                <div style={{ fontSize:28, marginBottom:6 }}>📸</div>
                <div style={{ fontSize:13, fontWeight:700, color:C.accent }}>Take Photo</div>
                <div style={{ fontSize:11, color:C.soft }}>AI reads your receipt</div>
              </label>
              <label style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer", display:"block" }}>
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) alert("🖼️ Image uploaded!\n\nAI is reading your receipt..."); }}/>
                <div style={{ fontSize:28, marginBottom:6 }}>🖼️</div>
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
            <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:8 }}>{label.toUpperCase()}</div>
            <input type={type} placeholder={ph} value={newExp[key]} onChange={e=>setNewExp(n=>({...n,[key]:e.target.value}))}
              style={{ width:"100%", background:C.card, border:`1.5px solid ${newExp[key]?C.accent+"60":C.border}`, borderRadius:12, padding:"13px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
          </div>
        ))}

        {/* Category picker */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>CATEGORY</div>
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
          {selEmp.saved&&<div style={{ background:"rgba(0,232,122,0.07)", border:"1px solid rgba(0,232,122,0.2)", borderRadius:12, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:16 }}>💰</span><span style={{ fontSize:13, color:C.green }}>Saved ${selEmp.saved} vs company average</span></div>}
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            {[["📞","Call",()=>alert(`Calling ${selEmp.name}...`)],["💬","Message",()=>alert(`Messaging ${selEmp.name}...`)],["🔗","Track",()=>alert(`Live link: myrunwayapp.co/t/${selEmp.id}`)]].map(([icon,label,fn])=>(
              <div key={label} onClick={fn} style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:20, marginBottom:3 }}>{icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.soft }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Employee expenses (admin view) */}
          {isAdmin&&(
            <div>
              <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>EXPENSES</div>
              {expenses.filter(e=>e.emp===selEmp.name).map(exp=>(
                <div key={exp.id} style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18 }}>{statusIcon[exp.status]}</span>
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
        <div onClick={()=>alert("Downloading CSV...")} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"15px 0", textAlign:"center", fontWeight:800, fontSize:15, color:"#000", cursor:"pointer" }}>
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
        {(isAdmin||teamVisible?[["flights","✈️ Flights"],["expenses","🧾 Expenses"]]:[ ["flights","✈️ My Flights"],["expenses","🧾 My Expenses"] ]).map(([id,label])=>(
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
                <span style={{ fontSize:22 }}>💰</span>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:800, color:C.green }}>$220 saved this month</div><div style={{ fontSize:11, color:C.soft }}>2 employees booked below budget</div></div>
                <span style={{ fontSize:10, color:C.green, fontFamily:C.mono, fontWeight:700, border:"1px solid rgba(0,232,122,0.3)", borderRadius:6, padding:"3px 8px" }}>VIEW →</span>
              </div>
              {(delayed>0||cancelled>0)&&(
                <div style={{ background:"rgba(255,58,84,0.08)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:14, padding:"12px 14px", marginBottom:12, display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:20 }}>🚨</span>
                  <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:C.red }}>Action needed</div><div style={{ fontSize:12, color:C.soft }}>{cancelled>0?`${cancelled} cancellation · `:""}{delayed>0?`${delayed} delayed`:""}</div></div>
                  <div onClick={()=>setFilter("issue")} style={{ background:C.red, borderRadius:8, padding:"6px 10px", cursor:"pointer" }}><span style={{ fontSize:11, fontWeight:800, color:"#fff" }}>Review</span></div>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[["✈️","In Air",inAir,C.accent],["✅","On Time",onTime,C.green],["⏰","Delayed",delayed,C.yellow],["❌","Cancel",cancelled,C.red]].map(([icon,label,val,color])=>(
                  <div key={label} style={{ background:`${color}12`, borderRadius:12, border:`1px solid ${color}30`, padding:"12px 4px", textAlign:"center" }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
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
                {[["all","All"],["issue","🚨 Issues"],["Sales","Sales"],["Eng","Eng"],["Exec","Exec"],["HR","HR"]].map(([id,label])=>(
                  <div key={id} onClick={()=>setFilter(id)} style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:C.mono, background:filter===id?"rgba(0,200,240,0.12)":"transparent", color:filter===id?C.accent:C.soft, border:`1px solid ${filter===id?"rgba(0,200,240,0.3)":C.border}` }}>{label}</div>
                ))}
              </div>
              {/* Employee list */}
              {filtered.map(emp=>{ const s=sc(emp.status); const hasIssue=emp.delay>0||emp.cancelled; return (
                <div key={emp.id} onClick={()=>setSelEmp(emp)} style={{ background:C.card, borderRadius:16, border:`1px solid ${hasIssue?(emp.cancelled?"rgba(255,58,84,0.25)":"rgba(255,200,0,0.2)"):C.border}`, padding:"14px 16px", marginBottom:10, cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:22, background:`${emp.color}18`, border:`2px solid ${emp.color}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:emp.color, fontFamily:C.mono, flexShrink:0 }}>{emp.avatar}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                        <span style={{ fontSize:15, fontWeight:800, color:C.text }}>{emp.name}</span>
                        <span style={{ fontSize:10, color:C.muted, background:C.surface, borderRadius:5, padding:"2px 7px", fontFamily:C.mono, border:`1px solid ${C.border}` }}>{emp.dept}</span>
                        {emp.saved&&<span style={{ fontSize:9, color:C.green, fontFamily:C.mono }}>💰 Saved ${emp.saved}</span>}
                      </div>
                      <div style={{ fontSize:12, color:C.soft, fontFamily:C.mono }}>{emp.flight} · {emp.dep} → {emp.arr}</div>
                      {emp.progress>0&&emp.progress<100&&<div style={{ height:3, background:C.surface, borderRadius:2, overflow:"hidden", marginTop:8, maxWidth:180 }}><div style={{ height:3, width:`${emp.progress}%`, background:`linear-gradient(90deg,${emp.color},${C.accent})`, borderRadius:2 }}/></div>}
                      {emp.delay>0&&<div style={{ fontSize:11, color:C.yellow, marginTop:4, fontFamily:C.mono }}>⏰ +{emp.delay} min delay</div>}
                      {emp.cancelled&&<div style={{ fontSize:11, color:C.red, marginTop:4, fontWeight:700 }}>🚨 Cancelled — needs rebooking</div>}
                    </div>
                    <StatusPill status={emp.status}/>
                  </div>
                </div>
              );})}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
                <div onClick={()=>setShowExport(true)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>📊</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>Export Report</div>
                  <div style={{ fontSize:11, color:C.muted }}>Download CSV</div>
                </div>
                <div onClick={()=>setShowSettings(true)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>⚙️</div>
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
                <div style={{ fontSize:12, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:6 }}>MY UPCOMING FLIGHT</div>
                <div style={{ fontSize:18, fontWeight:800, color:C.text, fontFamily:C.mono }}>LY 018 · MIA → TLV</div>
                <div style={{ fontSize:13, color:C.soft }}>Sun Jun 14 · 2:30 PM · Gate TBD</div>
                <StatusPill status="Scheduled"/>
              </div>
              {teamVisible ? (
                <div>
                  <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>YOUR TEAM</div>
                  {EMPLOYEES.slice(0,3).map(emp=>{ const s=sc(emp.status); return (
                    <div key={emp.id} style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:18, background:`${emp.color}18`, border:`2px solid ${emp.color}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:emp.color, fontFamily:C.mono }}>{emp.avatar}</div>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:C.text }}>{emp.name}</div><div style={{ fontSize:11, color:C.soft, fontFamily:C.mono }}>{emp.flight} · {emp.dep}→{emp.arr}</div></div>
                      <StatusPill status={emp.status}/>
                    </div>
                  );})}
                </div>
              ) : (
                <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"20px", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>👥</div>
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
            {[["🍽️","Meals"],["🚕","Transport"],["🏨","Lodging"],["✈️","Travel"]].map(([icon,cat])=>{
              const total = myExpenses.filter(e=>e.category===cat).reduce((s,e)=>s+parseFloat(e.amount||0),0).toFixed(2);
              return (
                <div key={cat} style={{ flex:1, background:C.card, borderRadius:10, border:`1px solid ${C.border}`, padding:"8px 4px", textAlign:"center" }}>
                  <div style={{ fontSize:14, marginBottom:2 }}>{icon}</div>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>{cat}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:C.text, fontFamily:C.mono }}>${total}</div>
                </div>
              );
            })}
          </div>

          {/* Expense line items */}
          {myExpenses.length===0&&(
            <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"32px", textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🧾</div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>No expenses yet</div>
              <div style={{ fontSize:12, color:C.soft }}>Tap + Add to snap a receipt or enter manually</div>
            </div>
          )}
          {myExpenses.map(exp=>(
            <div key={exp.id} style={{ background:C.card, borderRadius:14, border:`1px solid ${exp.status==="rejected"?"rgba(255,58,84,0.25)":exp.status==="approved"?"rgba(0,232,122,0.18)":C.border}`, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{statusIcon[exp.status]}</span>
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
            <div onClick={()=>alert("Exporting expense report to finance...")} style={{ background:`linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius:14, padding:"14px 0", textAlign:"center", fontWeight:800, fontSize:14, color:"#fff", cursor:"pointer", marginTop:8 }}>
              Export to Finance →
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}


// ── Boarding Pass / Mobile Wallet ──────────────────────────────
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
      <div style={{ fontSize:13, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:12 }}>MOBILE BOARDING PASSES</div>

      {/* Pass selector */}
      <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto" }}>
        {passes.map((pass,i)=>(
          <div key={pass.id} onClick={()=>setActive(i)} style={{ flexShrink:0, background:i===active?C.card:C.surface, border:`1px solid ${i===active?C.accent:C.border}`, borderRadius:10, padding:"8px 12px", cursor:"pointer" }}>
            <div style={{ fontSize:12, fontWeight:800, color:i===active?C.accent:C.soft, fontFamily:C.mono }}>{pass.flight}</div>
            <div style={{ fontSize:10, color:C.muted }}>{pass.dep}→{pass.arr}</div>
          </div>
        ))}
      </div>

      {/* The boarding pass */}
      <div style={{ background:"#fff", borderRadius:20, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
        <div style={{ background:p.color, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
          {/* Art deco diagonal lines */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,0.04) 8px,rgba(255,255,255,0.04) 9px)", pointerEvents:"none" }}/>
          <div style={{ color:"#fff", fontSize:18, fontWeight:700, fontFamily:"Georgia,serif", fontStyle:"italic", letterSpacing:1 }}>{p.airline}</div>
          <div style={{ color:"rgba(255,255,255,0.9)", fontSize:12, fontFamily:"'Courier New',monospace", letterSpacing:2 }}>{p.flight}</div>
        </div>
        <div style={{ padding:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:36, fontWeight:800, color:"#111", fontFamily:C.mono, lineHeight:1 }}>{p.dep}</div>
              <div style={{ fontSize:12, color:"#888", marginTop:4 }}>{p.time}</div>
            </div>
            <div style={{ flex:1, padding:"0 16px", textAlign:"center" }}>
              <div style={{ fontSize:20 }}>✈️</div>
              <div style={{ height:2, background:"#ddd", margin:"4px 0" }}/>
              <div style={{ fontSize:11, color:"#aaa" }}>{p.date}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:36, fontWeight:800, color:"#111", fontFamily:C.mono, lineHeight:1 }}>{p.arr}</div>
              <div style={{ fontSize:12, color:"#888", marginTop:4 }}>Arrival</div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 0", borderTop:"1px dashed #ddd", borderBottom:"1px dashed #ddd", marginBottom:16 }}>
            {[["PASSENGER",p.name],["SEAT",p.seat],["GROUP",p.group]].map(([l,v])=>(
              <div key={l}><div style={{ fontSize:9, color:"#aaa", fontFamily:C.mono, marginBottom:2 }}>{l}</div><div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            {[["GATE",p.gate],["BOARDS",p.boarding],["CONF",p.conf]].map(([l,v])=>(
              <div key={l}><div style={{ fontSize:9, color:"#aaa", fontFamily:C.mono, marginBottom:2 }}>{l}</div><div style={{ fontSize:13, fontWeight:700, color:"#111", fontFamily:C.mono }}>{v}</div></div>
            ))}
          </div>
          {/* QR / barcode */}
          <div style={{ background:"#fff", borderRadius:10, padding:"12px", display:"flex", justifyContent:"center" }}>
            <div style={{ display:"flex", gap:1.5, alignItems:"flex-end", height:60 }}>
              {Array.from({length:48}).map((_,i)=>(
                <div key={i} style={{ width:i%4===0?3:2, height:"100%", background:(i*7%3===0||i%5===0)?"#111":"#fff" }}/>
              ))}
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:10, color:"#aaa", fontFamily:C.mono, marginTop:8 }}>{p.conf} · {p.flight} · {p.seat}</div>
        </div>
      </div>

      {/* Add to wallet buttons */}
      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <div onClick={()=>alert("Adding to Apple Wallet...\n\nIn the live app this saves the pass to your phone's wallet for offline access.")} style={{ flex:1, background:"#000", border:"1px solid #333", borderRadius:12, padding:"13px 0", textAlign:"center", cursor:"pointer" }}>
          <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}> Apple Wallet</span>
        </div>
        <div onClick={()=>alert("Adding to Google Wallet...")} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 0", textAlign:"center", cursor:"pointer" }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.text }}>Google Wallet</span>
        </div>
      </div>
      <div style={{ background:"rgba(0,200,240,0.06)", border:"1px solid rgba(0,200,240,0.2)", borderRadius:12, padding:"12px 14px", marginTop:12, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:16 }}>🔔</span>
        <div style={{ fontSize:12, color:C.soft }}>We'll alert you the moment your gate is posted and when boarding starts.</div>
      </div>
    </div>
  );
}

// ── VIP Lounge Finder ──────────────────────────────────────────
function LoungeScreen() {
  const [airport, setAirport] = useState("MIA");
  const airports = ["MIA","TLV","ZRH"];
  const data = {
    MIA:[
      { name:"American Airlines Admirals Club", terminal:"Concourse D, near D15", access:["Priority Pass ❌","Amex Platinum ❌","AA membership ✅","Day pass $79"], hours:"5:00 AM – 9:00 PM", amenities:["Wi-Fi","Showers","Hot food","Bar"], rating:4.2 },
      { name:"Amex Centurion Lounge", terminal:"Concourse D, near D12", access:["Amex Platinum ✅","Priority Pass ❌","Day pass ❌"], hours:"5:00 AM – 10:00 PM", amenities:["Premium dining","Craft cocktails","Showers","Spa"], rating:4.7 },
      { name:"Turkish Airlines Lounge", terminal:"Concourse E", access:["Star Alliance Gold ✅","Priority Pass ✅","Day pass $50"], hours:"6:00 AM – 11:00 PM", amenities:["Wi-Fi","Buffet","Quiet zone"], rating:4.4 },
    ],
    TLV:[
      { name:"El Al King David Lounge", terminal:"Terminal 3, Concourse C", access:["El Al Matmid ✅","Business class ✅","Day pass ❌"], hours:"24 hours", amenities:["Kosher dining","Showers","Prayer room","Wi-Fi"], rating:4.5 },
      { name:"Dan Lounge", terminal:"Terminal 3, Level 3", access:["Priority Pass ✅","Day pass $45"], hours:"24 hours", amenities:["Buffet","Bar","Shower","Kids area"], rating:4.1 },
    ],
    ZRH:[
      { name:"Swiss Senator Lounge", terminal:"Airside E", access:["Star Alliance Gold ✅","Swiss First/Business ✅","Priority Pass ❌"], hours:"5:30 AM – 10:00 PM", amenities:["Fine dining","Whisky bar","Showers","Terrace"], rating:4.6 },
      { name:"Aspire Lounge", terminal:"Airside E, Gate E45", access:["Priority Pass ✅","Day pass CHF 55"], hours:"6:00 AM – 9:00 PM", amenities:["Wi-Fi","Snacks","Bar","Quiet area"], rating:4.0 },
    ],
  };
  const lounges = data[airport];
  return (
    <div style={{ padding:"14px 14px 100px" }}>
      <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, letterSpacing:3, marginBottom:12, borderBottom:`1px solid ${C.border}`, paddingBottom:8 }}>✦ VIP LOUNGE FINDER ✦</div>

      {/* Airport selector */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {airports.map(a=>(
          <div key={a} onClick={()=>setAirport(a)} style={{ flex:1, background:a===airport?`linear-gradient(135deg,${C.accent},#007aaa)`:C.surface, border:`1px solid ${a===airport?C.accent:C.border}`, borderRadius:12, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
            <div style={{ fontSize:18, fontWeight:800, color:a===airport?"#000":C.text, fontFamily:C.mono }}>{a}</div>
            <div style={{ fontSize:9, color:a===airport?"#003355":C.muted }}>{a==="MIA"?"Miami":a==="TLV"?"Tel Aviv":"Zurich"}</div>
          </div>
        ))}
      </div>

      {lounges.map((l,i)=>(
        <div key={i} style={{ background:C.card, borderRadius:18, border:`1px solid ${C.border}`, padding:16, marginBottom:12, animation:"cardIn 0.4s ease" }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 3h12L12 11 6 3z" stroke={C.accent} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <line x1="12" y1="11" x2="12" y2="19" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="19" x2="16" y2="19" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:2 }}>{l.name}</div>
              <div style={{ fontSize:11, color:C.soft }}>📍 {l.terminal}</div>
            </div>
            <div style={{ background:"rgba(0,232,122,0.1)", border:"1px solid rgba(0,232,122,0.25)", borderRadius:8, padding:"3px 8px", display:"flex", alignItems:"center", gap:3 }}>
              <span style={{ fontSize:10 }}>⭐</span><span style={{ fontSize:11, color:C.green, fontWeight:700, fontFamily:C.mono }}>{l.rating}</span>
            </div>
          </div>
          <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, letterSpacing:1, marginBottom:6 }}>ACCESS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
            {l.access.map((a,j)=>(
              <span key={j} style={{ background:a.includes("✅")?"rgba(0,232,122,0.08)":C.surface, border:`1px solid ${a.includes("✅")?"rgba(0,232,122,0.25)":C.border}`, borderRadius:7, padding:"4px 9px", fontSize:11, color:a.includes("✅")?C.green:C.soft }}>{a}</span>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, color:C.soft }}>🕐 {l.hours}</div>
            <div style={{ display:"flex", gap:5 }}>
              {l.amenities.slice(0,3).map((a,k)=>(
                <span key={k} style={{ fontSize:10, color:C.muted }}>{a}{k<2?" ·":""}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2l3 4H6L9 2zM6 6l3 10L3 6h3zM12 6h3L9 16l3-10z" stroke={C.purple} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
        </svg>
        <div style={{ fontSize:12, color:C.soft }}>Pro members get one-tap day-pass booking and real-time lounge crowding levels.</div>
      </div>
    </div>
  );
}

// ── Alternate Flights ──────────────────────────────────────────
function AlternateFlightsScreen({ flight, onBack }) {
  const alts = [
    { iata:"LY 002", dep:"MIA", arr:"TLV", depTime:"11:30 PM", arrTime:"6:30 PM+1", date:"Sun Jun 14", seats:14, price:"Same fare", aircraft:"Boeing 787-9", stops:"Nonstop", badge:"BEST OPTION", badgeColor:C.green },
    { iata:"LY 004", dep:"MIA", arr:"TLV", depTime:"8:45 AM", arrTime:"3:45 AM+2", date:"Mon Jun 15", seats:6, price:"Same fare", aircraft:"Boeing 787-9", stops:"Nonstop", badge:"NEXT DAY", badgeColor:C.yellow },
    { iata:"AA 100 + LY 315", dep:"MIA", arr:"TLV", depTime:"7:00 AM", arrTime:"11:55 PM", date:"Sun Jun 14", seats:22, price:"+$180", aircraft:"B777 + B737", stops:"1 stop · JFK", badge:"WITH CONNECTION", badgeColor:C.muted },
    { iata:"UA 90 + LY 321", dep:"MIA", arr:"TLV", depTime:"6:00 AM", arrTime:"2:30 AM+2", date:"Mon Jun 15", seats:8, price:"+$240", aircraft:"B767 + B737", stops:"1 stop · EWR", badge:null, badgeColor:null },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:55, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Alternate Flights</div>
          <div style={{ fontSize:12, color:C.soft }}>{flight?.iata || "LY 018"} · MIA → TLV · Jun 14</div>
        </div>
        <div style={{ background:"rgba(255,58,84,0.1)", border:"1px solid rgba(255,58,84,0.3)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, color:C.red, fontFamily:C.mono }}>CANCELLED</div>
      </div>
      <div style={{ padding:"16px 16px 100px" }}>
        <div style={{ background:"rgba(255,200,0,0.07)", border:"1px solid rgba(255,200,0,0.25)", borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M11 2L4 12h6l-1 6 7-10h-6l1-6z" fill={C.yellow} opacity="0.9"/>
          </svg>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.yellow }}>Act fast — seats are filling up</div>
            <div style={{ fontSize:11, color:C.soft }}>We found {alts.length} alternatives on your route. Prices may change.</div>
          </div>
        </div>

        {alts.map((a,i)=>(
          <div key={i} style={{ background:C.card, borderRadius:18, border:`1px solid ${i===0?"rgba(0,232,122,0.3)":C.border}`, padding:16, marginBottom:12, animation:"cardIn 0.4s ease", position:"relative" }}>
            {a.badge&&(
              <div style={{ position:"absolute", top:-11, left:16, background:a.badgeColor, borderRadius:20, padding:"3px 12px", fontSize:9, fontWeight:800, color:"#000", fontFamily:C.mono, letterSpacing:1 }}>{a.badge}</div>
            )}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12, marginTop:a.badge?6:0 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:C.text, fontFamily:C.mono, marginBottom:2 }}>{a.iata}</div>
                <div style={{ fontSize:11, color:C.soft }}>{a.aircraft} · {a.stops}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:15, fontWeight:800, color:a.price==="Same fare"?C.green:C.text }}>{a.price}</div>
                <div style={{ fontSize:10, color:C.muted }}>{a.seats} seats left</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ textAlign:"center", minWidth:44 }}>
                <div style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{a.dep}</div>
                <div style={{ fontSize:11, color:C.soft, marginTop:3 }}>{a.depTime}</div>
              </div>
              <div style={{ flex:1, height:1, background:C.border, position:"relative" }}>
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize:16 }}>✈</div>
              </div>
              <div style={{ textAlign:"center", minWidth:44 }}>
                <div style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:C.mono, lineHeight:1 }}>{a.arr}</div>
                <div style={{ fontSize:11, color:C.soft, marginTop:3 }}>{a.arrTime}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div onClick={()=>alert(`Calling El Al to rebook onto ${a.iata}...\n\nIn the live app this connects directly to the airline or opens their rebooking page.`)} style={{ flex:1, background:i===0?`linear-gradient(135deg,${C.green},#007a44)`:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:11, padding:"12px 0", textAlign:"center", cursor:"pointer" }}>
                <span style={{ fontSize:13, fontWeight:800, color:"#000" }}>Select This Flight →</span>
              </div>
              <div onClick={()=>alert(`Sharing ${a.iata} option with your group...`)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"12px 14px", cursor:"pointer" }}>
                <span style={{ fontSize:13 }}>🔗</span>
              </div>
            </div>
          </div>
        ))}

        <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 3h4l1.5 4-2 1.5a11 11 0 005 5L13 11l4 1.5V17a2 2 0 01-2 2A16 16 0 013 3z" stroke={C.accent} strokeWidth="1.3" fill="none"/>
          </svg>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Need help rebooking?</div>
            <div style={{ fontSize:11, color:C.soft }}>El Al customer service · 1-800-223-6700</div>
          </div>
          <div onClick={()=>alert("Calling El Al...")} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:10, padding:"8px 14px", cursor:"pointer" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#000" }}>Call</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Seat Tracker ───────────────────────────────────────────────
function SeatTrackerScreen({ onBack }) {
  const [watching, setWatching] = useState(["32A","32B","32C"]);
  const [wishlist, setWishlist] = useState([
    { seat:"12A", class:"Economy", type:"Window", desc:"Exit row — extra legroom", available:false, price:"Free" },
    { seat:"14C", class:"Economy", type:"Aisle", desc:"Near front, quick exit", available:true, price:"Free" },
    { seat:"2A", class:"Business", type:"Window", desc:"Lie-flat bed · extra cost", available:false, price:"+$1,200" },
    { seat:"11A", class:"Economy", type:"Window", desc:"Exit row — extra legroom", available:true, price:"Free" },
  ]);
  const flights = [
    { iata:"LY 018", dep:"MIA", arr:"TLV", date:"Jun 14", seats:["32A","32B","32C","32D","32E","32F"] },
    { iata:"LY 347", dep:"TLV", arr:"ZRH", date:"Jul 2", seats:["18C","18D","18E"] },
    { iata:"LX 064", dep:"ZRH", arr:"MIA", date:"Jul 2", seats:["24F","24G","24H"] },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:55, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Seat Tracker</div>
          <div style={{ fontSize:12, color:C.soft }}>We watch for better seats and alert you instantly</div>
        </div>
        <div style={{ background:"rgba(0,232,122,0.1)", border:"1px solid rgba(0,232,122,0.25)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700, color:C.green, fontFamily:C.mono }}>WATCHING</div>
      </div>
      <div style={{ padding:"16px 16px 100px" }}>

        {/* Current seats */}
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>YOUR CURRENT SEATS</div>
        {flights.map(f=>(
          <div key={f.iata} style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:C.text, fontFamily:C.mono }}>{f.iata}</div>
                <div style={{ fontSize:11, color:C.soft }}>{f.dep} → {f.arr} · {f.date}</div>
              </div>
              <div style={{ display:"flex", gap:5 }}>
                {f.seats.map(s=>(
                  <div key={s} style={{ background:"rgba(0,200,240,0.1)", border:"1px solid rgba(0,200,240,0.3)", borderRadius:8, padding:"5px 9px", fontSize:12, fontWeight:800, color:C.accent, fontFamily:C.mono }}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Better seat wishlist */}
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10, marginTop:20 }}>WATCHING FOR BETTER SEATS</div>
        <div style={{ background:"rgba(0,200,240,0.05)", border:"1px solid rgba(0,200,240,0.15)", borderRadius:12, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:12, color:C.soft }}>We check seat availability every 30 minutes and alert you the moment a better seat opens up. It's free to change if your ticket allows it.</div>
        </div>

        {wishlist.map((s,i)=>(
          <div key={i} style={{ background:C.card, borderRadius:14, border:`1px solid ${s.available?"rgba(0,232,122,0.3)":C.border}`, padding:"14px 16px", marginBottom:10, animation:"cardIn 0.4s ease" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:s.available?"rgba(0,232,122,0.12)":"rgba(255,255,255,0.05)", border:`2px solid ${s.available?"rgba(0,232,122,0.4)":C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontFamily:C.mono, fontSize:14, fontWeight:800, color:s.available?C.green:C.soft }}>{s.seat}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.type} · {s.class}</span>
                  {s.available&&<span style={{ background:"rgba(0,232,122,0.12)", border:"1px solid rgba(0,232,122,0.3)", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:800, color:C.green, fontFamily:C.mono }}>OPEN NOW!</span>}
                </div>
                <div style={{ fontSize:12, color:C.soft, marginBottom:2 }}>{s.desc}</div>
                <div style={{ fontSize:12, color:s.price==="Free"?C.green:C.yellow, fontWeight:700 }}>{s.price}</div>
              </div>
              {s.available ? (
                <div onClick={()=>alert(`Requesting seat change to ${s.seat}...\n\nIn the live app this opens the airline's seat selection page with your booking reference pre-filled.`)} style={{ background:`linear-gradient(135deg,${C.green},#007a44)`, borderRadius:11, padding:"10px 14px", cursor:"pointer", flexShrink:0 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:"#000" }}>Grab It →</span>
                </div>
              ) : (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:11, padding:"10px 12px", flexShrink:0 }}>
                  <span style={{ fontSize:11, color:C.muted }}>Watching 👁</span>
                </div>
              )}
            </div>
          </div>
        ))}

        <div onClick={()=>alert("Add seat to watchlist — in the live app you search the seat map and tap any seat to watch it.")} style={{ background:C.surface, border:`1px dashed ${C.border}`, borderRadius:14, padding:"14px 0", textAlign:"center", cursor:"pointer", marginTop:4 }}>
          <span style={{ fontSize:13, fontWeight:700, color:C.soft }}>+ Add seat to watchlist</span>
        </div>
      </div>
    </div>
  );
}

// ── Airport Intelligence ───────────────────────────────────────
function AirportIntelligenceScreen({ onBack }) {
  const airports = [
    { code:"MIA", name:"Miami International", city:"Miami, FL", status:"good", delay:"Avg 4 min", weather:"☀️ 88°F Sunny", gates:"Normal operations", tip:"Your departure airport — all clear", color:C.green },
    { code:"TLV", name:"Ben Gurion International", city:"Tel Aviv, Israel", status:"good", delay:"Avg 8 min", weather:"☀️ 82°F Clear", gates:"Normal operations", tip:"Your arrival airport — no delays", color:C.green },
    { code:"ZRH", name:"Zurich Airport", city:"Zurich, Switzerland", status:"warning", delay:"Avg 28 min", weather:"🌧️ 58°F Rain", gates:"Ground stop lifted — residual delays", tip:"Your connection airport — allow extra time", color:C.yellow },
    { code:"JFK", name:"John F. Kennedy", city:"New York, NY", status:"bad", delay:"Avg 62 min", weather:"⛈️ 64°F Thunderstorms", gates:"Ground delay program active", tip:"Not your airport — avoid connections here today", color:C.red },
    { code:"LHR", name:"London Heathrow", city:"London, UK", status:"good", delay:"Avg 12 min", weather:"🌥️ 61°F Overcast", gates:"Normal operations", tip:"Normal operations", color:C.green },
    { code:"CDG", name:"Charles de Gaulle", city:"Paris, France", status:"warning", delay:"Avg 35 min", weather:"🌦️ 63°F Showers", gates:"Runway 27L closed for maintenance", tip:"Significant delays — avoid if possible", color:C.yellow },
  ];
  const statusIcon = { good:"▲", warning:"▲", bad:"▲" };
  const statusLabel = { good:"Normal", warning:"Delays", bad:"Severe" };
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:55, overflowY:"auto" }}>
      <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
        <div onClick={onBack} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Airport Intelligence</div>
          <div style={{ fontSize:12, color:C.soft }}>Real-time conditions at major airports</div>
        </div>
      </div>
      <div style={{ padding:"16px 16px 100px" }}>

        {/* Your airports first */}
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10 }}>YOUR TRIP AIRPORTS</div>
        {airports.slice(0,3).map(a=>(
          <div key={a.code} style={{ background:C.card, borderRadius:18, border:`2px solid ${a.color}30`, padding:16, marginBottom:12, animation:"cardIn 0.4s ease" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${a.color}14`, border:`2px solid ${a.color}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:16, fontWeight:800, color:a.color, fontFamily:C.mono }}>{a.code}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:2 }}>{a.name}</div>
                <div style={{ fontSize:12, color:C.soft }}>{a.city}</div>
              </div>
              <div style={{ background:`${a.color}14`, border:`1px solid ${a.color}40`, borderRadius:20, padding:"4px 12px", display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontSize:12 }}>{statusIcon[a.status]}</span>
                <span style={{ fontSize:11, fontWeight:700, color:a.color, fontFamily:C.mono }}>{statusLabel[a.status]}</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              {[["AVG DELAY",a.delay],["WEATHER",a.weather],["GATES",a.gates]].map(([label,val])=>(
                <div key={label} style={{ background:C.surface, borderRadius:10, padding:"10px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:9, color:C.muted, fontFamily:C.mono, marginBottom:4, letterSpacing:1 }}>{label}</div>
                  <div style={{ fontSize:12, color:C.text, fontWeight:600 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ background:`${a.color}08`, border:`1px solid ${a.color}25`, borderRadius:10, padding:"9px 12px", display:"flex", alignItems:"center", gap:8 }}>

              <span style={{ fontSize:12, color:a.color, fontWeight:600 }}>{a.tip}</span>
            </div>
          </div>
        ))}

        {/* Other major airports */}
        <div style={{ fontSize:11, color:C.muted, fontFamily:C.mono, letterSpacing:2, marginBottom:10, marginTop:8 }}>MAJOR HUBS TODAY</div>
        {airports.slice(3).map(a=>(
          <div key={a.code} style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${a.color}14`, border:`1px solid ${a.color}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:11, fontWeight:800, color:a.color, fontFamily:C.mono }}>{a.code}</span>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{a.name}</div>
              <div style={{ fontSize:11, color:C.soft }}>{a.delay} · {a.weather}</div>
            </div>
            <div style={{ background:`${a.color}14`, border:`1px solid ${a.color}30`, borderRadius:20, padding:"3px 10px" }}>
              <span style={{ fontSize:10, fontWeight:700, color:a.color, fontFamily:C.mono, letterSpacing:0.5 }}>{statusLabel[a.status].toUpperCase()}</span>
            </div>
          </div>
        ))}

        <div style={{ background:"rgba(0,200,240,0.05)", border:"1px solid rgba(0,200,240,0.15)", borderRadius:12, padding:"12px 14px", marginTop:8, display:"flex", gap:10 }}>
          <div style={{ fontSize:12, color:C.soft, lineHeight:1.5 }}>Airport conditions update every 15 minutes via FAA, FlightAware, and local ATC data feeds.</div>
        </div>
      </div>
    </div>
  );
}

// ── Vintage SVG icons ─────────────────────────────────────────
function VintageIcon({ id, size=26, color="#7a9ab8" }) {
  const icons = {
    flights: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill={color}/></svg>),
    wallet: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8"/><path d="M2 9h20M16 14h2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="14" r="1" fill={color}/></svg>),
    lounges: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Martini glass — universal VIP lounge symbol */}
      <path d="M6 3h12L12 11 6 3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
      <line x1="12" y1="11" x2="12" y2="19" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="8" y1="19" x2="16" y2="19" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="15" cy="6" r="1.5" fill={color} opacity="0.6"/>
    </svg>),
    passport: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5"/><path d="M8 17h8M9 14h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>),
    account: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  };
  return icons[id] || null;
}

function BottomNav({ active, onNav }) {
  const tabs = [
    { id:"flights", label:"Flights" },
    { id:"wallet", label:"Wallet" },
    { id:"lounges", label:"Lounges" },
    { id:"passport", label:"Passport" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(4,7,14,0.98)", borderTop:`1px solid ${C.border}`, zIndex:20 }}>
      <div style={{ display:"flex", padding:"8px 8px 22px", maxWidth:480, margin:"0 auto" }}>
        {tabs.map(t=>(
          <div key={t.id} onClick={()=>onNav(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer", padding:"6px 0" }}>
            <VintageIcon id={t.id} size={24} color={active===t.id?C.accent:C.muted}/>
            <span style={{ fontSize:9, fontWeight:700, fontFamily:C.mono, letterSpacing:1, color:active===t.id?C.accent:C.muted }}>{t.label.toUpperCase()}</span>
            {active===t.id&&<div style={{ width:20, height:2, borderRadius:1, background:C.accent }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const slideIcons = [
    // Shield — protection
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <path d="M36 8L14 18v18c0 13 9.8 25.2 22 28 12.2-2.8 22-15 22-28V18L36 8z" stroke={C.accent} strokeWidth="2" fill={`${C.accent}12`}/>
      <path d="M26 36l7 7 14-14" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="36" cy="36" r="30" stroke={C.accent} strokeWidth="0.8" opacity="0.2"/>
    </svg>,
    // Propeller — inbound tracking
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="34" stroke={C.accent} strokeWidth="1" opacity="0.25"/>
      <circle cx="36" cy="36" r="24" stroke={C.accent} strokeWidth="0.8" opacity="0.15"/>
      <path d="M36 36 Q22 18 28 8 Q42 12 36 36Z" fill={C.accent} opacity="0.9"/>
      <path d="M36 36 Q54 32 62 38 Q58 52 36 36Z" fill={C.accent} opacity="0.9"/>
      <path d="M36 36 Q22 48 12 44 Q14 30 36 36Z" fill={C.accent} opacity="0.9"/>
      <circle cx="36" cy="36" r="8" fill={C.bg} stroke={C.accent} strokeWidth="2"/>
      <circle cx="36" cy="36" r="4" fill={C.accent}/>
      <circle cx="36" cy="36" r="1.5" fill={C.bg}/>
    </svg>,
    // Clock/gauge — leave-by time
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="32" stroke={C.accent} strokeWidth="1.5" fill={`${C.accent}08`}/>
      <circle cx="36" cy="36" r="28" stroke={C.accent} strokeWidth="0.5" opacity="0.3"/>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i)=>{
        const r=Math.PI*deg/180; const x1=36+24*Math.sin(r); const y1=36-24*Math.cos(r);
        const x2=36+(i%3===0?20:22)*Math.sin(r); const y2=36-(i%3===0?20:22)*Math.cos(r);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.accent} strokeWidth={i%3===0?"1.5":"0.8"} opacity="0.6"/>;
      })}
      <line x1="36" y1="36" x2="36" y2="14" stroke={C.accent} strokeWidth="2" strokeLinecap="round"/>
      <line x1="36" y1="36" x2="50" y2="42" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="36" cy="36" r="3" fill={C.accent}/>
    </svg>,
    // Chain link — share
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="34" stroke={C.accent} strokeWidth="1" opacity="0.2"/>
      <rect x="16" y="26" width="18" height="12" rx="6" stroke={C.accent} strokeWidth="2" fill="none"/>
      <rect x="38" y="26" width="18" height="12" rx="6" stroke={C.accent} strokeWidth="2" fill="none"/>
      <line x1="34" y1="32" x2="38" y2="32" stroke={C.accent} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="5" stroke={C.accent} strokeWidth="1.5" fill="none"/>
      <circle cx="52" cy="20" r="5" stroke={C.accent} strokeWidth="1.5" fill="none"/>
      <circle cx="36" cy="52" r="5" stroke={C.accent} strokeWidth="1.5" fill="none"/>
      <line x1="24" y1="23" x2="30" y2="28" stroke={C.accent} strokeWidth="1" opacity="0.5"/>
      <line x1="48" y1="23" x2="42" y2="28" stroke={C.accent} strokeWidth="1" opacity="0.5"/>
      <line x1="36" y1="47" x2="36" y2="38" stroke={C.accent} strokeWidth="1" opacity="0.5"/>
    </svg>,
  ];
  const slides = [
    { title:"Never Miss a Change", body:"We check your flights every 15 minutes across 3 data sources and alert you the instant anything changes — often before the airline does." },
    { title:"Know Before You Go", body:"We track the incoming aircraft that becomes your flight, so you get the earliest possible warning if a delay is coming your way." },
    { title:"Leave at the Right Time", body:"My Runway calculates exactly when to leave home based on live traffic, your airport, and your flight — no more guessing." },
    { title:"Share with Anyone", body:"Send a live tracking link to whoever's picking you up. They see your flight in real time — no app needed." },
  ];
  const s = slides[step];
  const last = step === slides.length - 1;
  return (
    <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:90, display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px", textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:48 }}>
<svg width="36" height="36" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="21" fill="none" stroke={C.accent} strokeWidth="1.5" opacity="0.4"/>
            <circle cx="22" cy="22" r="18" fill="none" stroke={C.accent} strokeWidth="0.5" opacity="0.2"/>
            <ellipse cx="22" cy="22" rx="14" ry="5" fill={C.accent} transform="rotate(30 22 22)" style={{transformOrigin:"22px 22px"}}/>
            <ellipse cx="22" cy="22" rx="14" ry="5" fill={C.accent} transform="rotate(150 22 22)" style={{transformOrigin:"22px 22px"}}/>
            <ellipse cx="22" cy="22" rx="14" ry="5" fill={C.accent} transform="rotate(270 22 22)" style={{transformOrigin:"22px 22px"}}/>
            <circle cx="22" cy="22" r="7" fill={C.bg}/>
            <circle cx="22" cy="22" r="5.5" fill={C.bg} stroke={C.accent} strokeWidth="1.8"/>
            <circle cx="22" cy="22" r="3" fill={C.accent}/>
            <circle cx="22" cy="22" r="1.2" fill={C.bg}/>
          </svg>
          <span style={{ fontFamily:C.display, fontSize:22, color:C.accent, letterSpacing:3, fontStyle:"italic" }}>MY RUNWAY</span>
        </div>
        <div style={{ width:120, height:120, borderRadius:60, background:"rgba(0,200,240,0.06)", border:"1px solid rgba(0,200,240,0.18)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:36, animation:"fadeUp 0.4s ease" }}>{slideIcons[step]}</div>
        <div key={step} style={{ animation:"fadeUp 0.4s ease" }}>
          <div style={{ fontFamily:C.display, fontSize:26, fontWeight:400, fontStyle:"italic", color:C.text, marginBottom:14 }}>{s.title}</div>
          <div style={{ fontSize:15, color:C.soft, lineHeight:1.6, maxWidth:320, margin:"0 auto" }}>{s.body}</div>
        </div>
      </div>
      <div style={{ padding:"0 32px 40px" }}>
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:28 }}>
          {slides.map((_,i)=>(
            <div key={i} style={{ width:i===step?24:8, height:8, borderRadius:4, background:i===step?C.accent:C.border, transition:"all 0.3s" }}/>
          ))}
        </div>
        <div onClick={()=>last?onDone():setStep(step+1)} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:14, padding:"16px 0", textAlign:"center", fontWeight:800, fontSize:16, color:"#000", cursor:"pointer" }}>
          {last?"Get Started ✈":"Next"}
        </div>
        {!last&&<div onClick={onDone} style={{ textAlign:"center", marginTop:16, fontSize:14, color:C.muted, cursor:"pointer" }}>Skip</div>}
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
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
  const [showCancelAlert, setShowCancelAlert] = useState(false); // Only shows when real cancellation detected
  const cancelledFlight = FLIGHTS[0]; // Demo alert
  const [leaveState, setLeaveState] = useState("later");
  const [navIdx, setNavIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [homeAddress, setHomeAddress] = useState("Miami, FL (Davie)");
  const [accountType, setAccountType] = useState("personal"); // "personal" | "pro" | "corporate"
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [showFamily, setShowFamily] = useState(false);
  const [showAlternates, setShowAlternates] = useState(false);
  const [showSeatTracker, setShowSeatTracker] = useState(false);
  const [showAirportIntel, setShowAirportIntel] = useState(false);

  C = isDark ? DARK : LIGHT;
  ACCOUNT_TYPE = accountType;

  useEffect(()=>{ const i=setInterval(()=>setTick(n=>n+1),2000); return()=>clearInterval(i); },[]);

  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:C.sans, maxWidth:480, margin:"0 auto", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Special+Elite&display=swap');
        ::-webkit-scrollbar{display:none}
        *{box-sizing:border-box}
        @keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:2000px}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
      <div style={{ background:isDark?"rgba(4,7,14,0.98)":"rgba(240,244,248,0.98)", borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, overflow:"hidden" }}>
          {/* Perfectly symmetric 3-blade vintage propeller */}
<svg width="30" height="30" viewBox="0 0 44 44" style={{ flexShrink:0 }}>
            {/* Outer badge ring */}
            <circle cx="22" cy="22" r="21" fill="none" stroke={C.accent} strokeWidth="1.5" opacity="0.4"/>
            <circle cx="22" cy="22" r="18" fill="none" stroke={C.accent} strokeWidth="0.5" opacity="0.2"/>
            {/* Blade 1 — pointing up-right at 30deg */}
            <ellipse cx="22" cy="22" rx="14" ry="5" fill={C.accent} transform="rotate(30 22 22)" style={{transformOrigin:"22px 22px"}}/>
            {/* Blade 2 — pointing up-left at 150deg */}
            <ellipse cx="22" cy="22" rx="14" ry="5" fill={C.accent} transform="rotate(150 22 22)" style={{transformOrigin:"22px 22px"}}/>
            {/* Blade 3 — pointing down at 270deg */}
            <ellipse cx="22" cy="22" rx="14" ry="5" fill={C.accent} transform="rotate(270 22 22)" style={{transformOrigin:"22px 22px"}}/>
            {/* Engine hub */}
            <circle cx="22" cy="22" r="7" fill={C.bg}/>
            <circle cx="22" cy="22" r="5.5" fill={C.bg} stroke={C.accent} strokeWidth="1.8"/>
            <circle cx="22" cy="22" r="3" fill={C.accent}/>
            <circle cx="22" cy="22" r="1.2" fill={C.bg}/>
          </svg>
          <span style={{ fontFamily:C.display, fontSize:17, color:C.accent, letterSpacing:2, fontStyle:"italic", whiteSpace:"nowrap" }}>My Runway</span>
          {DEV_MODE&&<div style={{ background:"rgba(255,200,0,0.15)", border:"1px solid rgba(255,200,0,0.4)", borderRadius:5, padding:"1px 5px", fontSize:8, fontWeight:800, color:C.yellow, fontFamily:C.mono, letterSpacing:1, flexShrink:0 }}>DEV</div>}
        </div>
        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
          {/* Settings gear */}
          <div onClick={()=>setShowSettings(true)} title="Settings" style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px", cursor:"pointer", display:"flex" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke={C.soft} strokeWidth="1.2"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke={C.soft} strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          {/* Add flight */}
          <div onClick={()=>setShowAdd(true)} style={{ background:`linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius:8, padding:"7px 11px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span style={{ fontSize:11, color:"#000", fontWeight:800, fontFamily:C.mono, letterSpacing:0.5 }}>FLIGHT</span>
          </div>
          {/* Corporate */}
          {accountType==="corporate"&&(
            <div onClick={()=>setShowCorp(true)} title="Corporate" style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:8, padding:"7px", cursor:"pointer", display:"flex" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="6" width="14" height="9" rx="1" stroke={C.purple} strokeWidth="1.2"/><path d="M5 6V4a3 3 0 016 0v2" stroke={C.purple} strokeWidth="1.2"/><line x1="8" y1="9" x2="8" y2="12" stroke={C.purple} strokeWidth="1.2" strokeLinecap="round"/><line x1="5.5" y1="10.5" x2="10.5" y2="10.5" stroke={C.purple} strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
          )}
          {/* Share / chain link */}
          <div onClick={()=>setShowShare(true)} title="Share trip" style={{ background:`rgba(0,200,240,0.07)`, border:`1px solid rgba(0,200,240,0.2)`, borderRadius:8, padding:"7px", cursor:"pointer", display:"flex" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="13" cy="3" r="2" stroke={C.accent} strokeWidth="1.2"/><circle cx="3" cy="8" r="2" stroke={C.accent} strokeWidth="1.2"/><circle cx="13" cy="13" r="2" stroke={C.accent} strokeWidth="1.2"/><line x1="5" y1="7" x2="11" y2="4" stroke={C.accent} strokeWidth="1.2"/><line x1="5" y1="9" x2="11" y2="12" stroke={C.accent} strokeWidth="1.2"/></svg>
          </div>
          {/* Weather / cloud-sun */}
          <div onClick={()=>setShowWeather(true)} title="Weather" style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px", cursor:"pointer", display:"flex" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="10" cy="5" r="3" stroke={C.yellow} strokeWidth="1.2"/><path d="M4 11a3 3 0 015.8-1A2.5 2.5 0 1113.5 11H4z" stroke={C.soft} strokeWidth="1.2" fill="none"/><line x1="10" y1="1" x2="10" y2="0" stroke={C.yellow} strokeWidth="1.2" strokeLinecap="round"/><line x1="13.5" y1="2.5" x2="14" y2="2" stroke={C.yellow} strokeWidth="1.2" strokeLinecap="round"/><line x1="15" y1="5" x2="16" y2="5" stroke={C.yellow} strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          {/* Airport radar */}
          <div onClick={()=>setShowAirportIntel(true)} title="Airport Conditions" style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px", cursor:"pointer", display:"flex" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke={C.soft} strokeWidth="1.1" opacity="0.4"/>
              <circle cx="8" cy="8" r="4.5" stroke={C.soft} strokeWidth="1" opacity="0.4"/>
              <circle cx="8" cy="8" r="2" stroke={C.soft} strokeWidth="1" opacity="0.4"/>
              <circle cx="8" cy="8" r="1" fill={C.accent}/>
              <line x1="8" y1="8" x2="12.5" y2="3.5" stroke={C.accent} strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          {/* Seat */}
          <div onClick={()=>setShowSeatTracker(true)} title="Seat Tracker" style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px", cursor:"pointer", display:"flex" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 3h8v6H4z" rx="1" stroke={C.soft} strokeWidth="1.2" fill="none"/><path d="M3 9h10v2H3z" rx="1" stroke={C.soft} strokeWidth="1.2" fill="none"/><line x1="5" y1="11" x2="5" y2="14" stroke={C.soft} strokeWidth="1.2" strokeLinecap="round"/><line x1="11" y1="11" x2="11" y2="14" stroke={C.soft} strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          {/* Alert bell with red dot */}
          <div onClick={()=>setShowCancellations(true)} title="Cancellation Tracker" style={{ background:"rgba(255,58,84,0.08)", border:"1px solid rgba(255,58,84,0.25)", borderRadius:8, padding:"7px", cursor:"pointer", display:"flex", position:"relative" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 00-5 5v3l-1 1v1h12v-1l-1-1V7a5 5 0 00-5-5z" stroke={C.red} strokeWidth="1.2" fill="none"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke={C.red} strokeWidth="1.2"/></svg>
            <div style={{ position:"absolute", top:-2, right:-2, width:7, height:7, borderRadius:4, background:C.red, border:"1.5px solid #04070e" }}/>
          </div>
        </div>
      </div>
      {/* Corporate account banner — only for corporate users */}
      {accountType==="corporate"&&(
        <div style={{ background:"linear-gradient(135deg,rgba(167,139,250,0.12),rgba(124,58,237,0.06))", borderBottom:"1px solid rgba(167,139,250,0.25)", padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16 }}>🏢</span>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:12, fontWeight:800, color:C.purple }}>Acme Corp</span>
            <span style={{ fontSize:12, color:C.muted }}> · Corporate Account · 6 employees traveling</span>
          </div>
          <div onClick={()=>setShowCorp(true)} style={{ fontSize:11, color:C.purple, fontWeight:700, fontFamily:C.mono, cursor:"pointer" }}>Dashboard →</div>
        </div>
      )}
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ fontFamily:C.display, fontSize:24, fontWeight:400, fontStyle:"italic", color:C.text, marginBottom:3, letterSpacing:0.5 }}>
          {tab==="flights"?(accountType==="corporate"?"Team Flights":"My Flights"):tab==="wallet"?"Boarding Passes":tab==="lounges"?"Airport Lounges":"My Passport"}
        </div>
        <div style={{ fontSize:12, color:C.soft, fontFamily:C.mono, letterSpacing:2, textTransform:"uppercase" }}>
          {tab==="flights"?"Israel family trip · Jun 14 – Jul 2, 2026":tab==="wallet"?"Hold your passes — works offline":tab==="lounges"?"Find lounges & access rules":"Your lifetime flying history"}
        </div>
      </div>
      <div style={{ flex:1 }}>
        {tab==="flights"&&<FlightsScreen onTap={f=>alert(`${f.iata}\n${f.dep} → ${f.arr}\nStatus: ${f.status}\nGate: ${f.gate} · Terminal: ${f.terminal}\nConf#: ${f.conf}\n${f.date}`)} onAdd={()=>setShowAdd(true)} leaveState={leaveState} setLeaveState={setLeaveState} navIdx={navIdx} setNavIdx={setNavIdx} homeAddress={homeAddress}/>}
        {tab==="wallet"&&<WalletScreen/>}
        {tab==="lounges"&&<LoungeScreen/>}
        {tab==="passport"&&<PassportScreen/>}

      </div>
      <BottomNav active={tab} onNav={t=>setTab(t)}/>
      {showAdd&&<AddModal onClose={()=>setShowAdd(false)}/>}
      {showCancellations&&<CancellationScreen onBack={()=>setShowCancellations(false)}/>}
      {showCancelAlert&&<CancellationAlert flight={cancelledFlight} onDismiss={()=>setShowCancelAlert(false)} onAction={()=>{ setShowCancelAlert(false); setShowAlternates(true); }}/>}
      {showShare&&<ShareModal onClose={()=>setShowShare(false)}/>}
      {showSettings&&<SettingsModal onClose={()=>setShowSettings(false)} isDark={isDark} setIsDark={setIsDark} homeAddress={homeAddress} setHomeAddress={setHomeAddress} accountType={accountType} setAccountType={setAccountType} navIdx={navIdx} setNavIdx={setNavIdx}/>}
      {showCorp&&<CorporateDashboard onClose={()=>setShowCorp(false)}/>}
      {showOnboarding&&<Onboarding onDone={()=>setShowOnboarding(false)}/>}
      {showAlternates&&<AlternateFlightsScreen flight={FLIGHTS[0]} onBack={()=>setShowAlternates(false)}/>}
      {showSeatTracker&&<SeatTrackerScreen onBack={()=>setShowSeatTracker(false)}/>}
      {showAirportIntel&&<AirportIntelligenceScreen onBack={()=>setShowAirportIntel(false)}/>}
      {showWeather&&(
        <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
          <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
            <div onClick={()=>setShowWeather(false)} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Airport Weather</div>
          </div>
          <WeatherScreen/>
        </div>
      )}
      {showFamily&&(
        <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:50, overflowY:"auto" }}>
          <div style={{ background:"rgba(4,7,14,0.98)", borderBottom:`1px solid ${C.border}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0 }}>
            <div onClick={()=>setShowFamily(false)} style={{ width:34, height:34, borderRadius:17, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.accent }}>←</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text }}>Family Tracker</div>
          </div>
          <FamilyScreen/>
        </div>
      )}
    </div>
  );
}
