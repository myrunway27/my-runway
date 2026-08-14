// Seed data for MyRunway. All flight times are demo-minute offsets from
// DEMO start (4:00 AM, Wed Sep 2, 2026) — see lib/utils.js fmtClock/fmtDay.
// Trip: TLV → ZRH → MIA, flying home to Miami. All icon fields are ICON
// NAMES rendered via <Icon name="..."/> (see components/icons.jsx) — no emoji.

// ── Airports ──────────────────────────────────────────────────
// Trip airports carry full data (weather, forecast5, security, health, boards);
// others are minimal (family / corporate flights, inbound legs).
export const AIRPORTS = {
  TLV: {
    code: "TLV", name: "Ben Gurion", city: "Tel Aviv", lat: 32.01, lon: 34.89,
    weather: { icon: "sun", temp: 84, cond: "Sunny", wind: 7, note: "Clear Tel Aviv morning" },
    forecast5: [
      { day: "Wed", icon: "sun", hi: 86, lo: 73 },
      { day: "Thu", icon: "sun", hi: 87, lo: 74 },
      { day: "Fri", icon: "sun", hi: 88, lo: 75 },
      { day: "Sat", icon: "cloudSun", hi: 85, lo: 73 },
      { day: "Sun", icon: "sun", hi: 84, lo: 72 },
    ],
    security: { wait: 35, checkpoint: "T3 security interview + X-ray", trend: "rising" },
    health: {
      score: 66,
      factors: [
        { icon: "users", label: "Interview lines long in morning wave", impact: "medium" },
        { icon: "planeUp", label: "Heavy 6–9 AM departure bank", impact: "medium" },
        { icon: "check", label: "Runway ops normal", impact: "low" },
      ],
    },
    board: [
      { flight: "LY 347", dest: "Zurich ZRH", time: "8:00 AM", status: "On Time", gate: "B7" },
      { flight: "LY 315", dest: "London LHR", time: "7:40 AM", status: "Boarding", gate: "C4" },
      { flight: "LX 253", dest: "Zurich ZRH", time: "7:55 AM", status: "On Time", gate: "B9" },
      { flight: "UA 91", dest: "Newark EWR", time: "8:30 AM", status: "Delayed", gate: "C7" },
      { flight: "AF 1621", dest: "Paris CDG", time: "8:45 AM", status: "On Time", gate: "B2" },
    ],
  },
  ZRH: {
    code: "ZRH", name: "Zurich Airport", city: "Zurich", lat: 47.46, lon: 8.55,
    weather: { icon: "cloudSun", temp: 66, cond: "Partly Cloudy", wind: 9, note: "Mild Zurich midday" },
    forecast5: [
      { day: "Wed", icon: "cloudSun", hi: 66, lo: 52 },
      { day: "Thu", icon: "rain", hi: 62, lo: 50 },
      { day: "Fri", icon: "cloud", hi: 64, lo: 51 },
      { day: "Sat", icon: "sun", hi: 70, lo: 53 },
      { day: "Sun", icon: "cloudSun", hi: 68, lo: 54 },
    ],
    security: { wait: 12, checkpoint: "Transit control", trend: "falling" },
    health: {
      score: 88,
      factors: [
        { icon: "check", label: "Transit ops smooth", impact: "low" },
        { icon: "clock", label: "92% on-time today", impact: "low" },
        { icon: "wind", label: "Light föhn winds possible", impact: "low" },
      ],
    },
    board: [
      { flight: "LX 64", dest: "Miami MIA", time: "1:40 PM", status: "On Time", gate: "E24" },
      { flight: "LX 38", dest: "Los Angeles LAX", time: "1:10 PM", status: "Boarding", gate: "E36" },
      { flight: "LX 8", dest: "Chicago ORD", time: "1:30 PM", status: "On Time", gate: "E55" },
      { flight: "LX 1072", dest: "Berlin BER", time: "2:05 PM", status: "On Time", gate: "A72" },
      { flight: "LX 316", dest: "London LCY", time: "2:20 PM", status: "Delayed", gate: "A50" },
    ],
  },
  MIA: {
    code: "MIA", name: "Miami International", city: "Miami", lat: 25.79, lon: -80.29,
    weather: { icon: "storm", temp: 90, cond: "Scattered PM Storms", wind: 14, note: "Storms usually fade by evening arrival" },
    forecast5: [
      { day: "Wed", icon: "storm", hi: 90, lo: 79 },
      { day: "Thu", icon: "storm", hi: 91, lo: 80 },
      { day: "Fri", icon: "cloudSun", hi: 89, lo: 79 },
      { day: "Sat", icon: "rain", hi: 88, lo: 78 },
      { day: "Sun", icon: "sun", hi: 90, lo: 79 },
    ],
    security: { wait: 25, checkpoint: "Checkpoint D", trend: "steady" },
    health: {
      score: 72,
      factors: [
        { icon: "storm", label: "30% chance of afternoon storms", impact: "medium" },
        { icon: "planeUp", label: "Heavy 3–6 PM departure bank", impact: "medium" },
        { icon: "security", label: "TSA wait ~25 min (Checkpoint D)", impact: "low" },
      ],
    },
    board: [
      { flight: "AA 421", dest: "New York JFK", time: "5:40 PM", status: "On Time", gate: "D31" },
      { flight: "DL 892", dest: "Atlanta ATL", time: "6:15 PM", status: "Boarding", gate: "F6" },
      { flight: "UA 1188", dest: "Houston IAH", time: "6:35 PM", status: "Delayed", gate: "G2" },
      { flight: "B6 904", dest: "Boston BOS", time: "7:22 PM", status: "On Time", gate: "E11" },
      { flight: "AA 2451", dest: "Dallas DFW", time: "7:45 PM", status: "On Time", gate: "D24" },
    ],
  },
  // Minimal entries (family / corporate flights, inbound legs)
  JFK: { code: "JFK", name: "John F. Kennedy Intl", city: "New York", lat: 40.64, lon: -73.78 },
  LAX: { code: "LAX", name: "Los Angeles Intl", city: "Los Angeles", lat: 33.94, lon: -118.41 },
  ATL: { code: "ATL", name: "Hartsfield–Jackson", city: "Atlanta", lat: 33.64, lon: -84.43 },
  SFO: { code: "SFO", name: "San Francisco Intl", city: "San Francisco", lat: 37.62, lon: -122.38 },
  ORD: { code: "ORD", name: "O'Hare Intl", city: "Chicago", lat: 41.97, lon: -87.9 },
  LHR: { code: "LHR", name: "Heathrow", city: "London", lat: 51.47, lon: -0.45 },
  DAL: { code: "DAL", name: "Dallas Love Field", city: "Dallas", lat: 32.85, lon: -96.85 },
  BOS: { code: "BOS", name: "Logan Intl", city: "Boston", lat: 42.36, lon: -71.01 },
  DFW: { code: "DFW", name: "Dallas/Fort Worth Intl", city: "Dallas", lat: 32.9, lon: -97.04 },
};

// ── Your flights (flying home: TLV → ZRH → MIA, Wed Sep 2 2026) ──
export const FLIGHTS_SEED = [
  {
    id: "f1", iata: "LY 347", code: "LY", airline: "El Al",
    dep: "TLV", arr: "ZRH", depMin: 240, arrMin: 425, depTime: "8:00 AM", arrTime: "11:05 AM",
    status: "Scheduled", progress: 0, gate: "TBD", terminal: "3",
    aircraft: "Boeing 787-9", tail: "4X-EDA", seat: "22C",
    date: "Wed Sep 2, 2026", conf: "ELAL7Q", trip: "outbound", source: "booking",
    wx: {
      dep: { icon: "sun", temp: 84, cond: "Sunny", wind: 7, note: "Clear Tel Aviv morning" },
      arr: { icon: "cloudSun", temp: 66, cond: "Partly Cloudy", wind: 9, note: "Mild Zurich midday" },
    },
    risk: {
      score: 20, predictedDelay: 0,
      reasons: [
        { icon: "ticket", label: "Booking-verified schedule", detail: "Times synced from your El Al confirmation ELAL7Q" },
        { icon: "plane", label: "Aircraft parked at gate overnight", detail: "4X-EDA slept at TLV — zero inbound risk" },
        { icon: "planeUp", label: "Morning departure wave manageable", detail: "TLV 6–9 AM bank is busy but flowing normally" },
      ],
    },
    inbound: [
      { from: "JFK", to: "TLV", flight: "LY 8", status: "Landed", depTime: "11:50 PM", arrTime: "4:55 AM", progress: 100 },
      { from: "TLV", to: "ZRH", flight: "LY 347", status: "This is your flight", depTime: "8:00 AM", arrTime: "11:05 AM", progress: 0 },
    ],
    checkin: { open: true, airline: "El Al app", counter: "T3 counters 5–8 · open now", tip: "Israeli security interview — arrive 3h before departure" },
    carbonKg: 310,
    pass: { zone: "C", group: "GROUP 3", seat: "22C", gate: "B7" },
    conn: null,
  },
  {
    id: "f2", iata: "LX 64", code: "LX", airline: "SWISS",
    dep: "ZRH", arr: "MIA", depMin: 580, arrMin: 1210, depTime: "1:40 PM", arrTime: "6:10 PM",
    status: "Scheduled", progress: 0, gate: "TBD", terminal: "E",
    aircraft: "Airbus A340-300", tail: "HB-JMK", seat: "38H",
    date: "Wed Sep 2, 2026", conf: "SWQ4RZ", trip: "outbound", source: "booking",
    wx: {
      dep: { icon: "cloudSun", temp: 66, cond: "Partly Cloudy", wind: 9, note: "Mild Zurich midday" },
      arr: { icon: "storm", temp: 90, cond: "Scattered PM Storms", wind: 14, note: "Storms usually fade by evening arrival" },
    },
    risk: {
      score: 30, predictedDelay: 0,
      reasons: [
        { icon: "clock", label: "2h 35m transit is comfortable", detail: "Comfortable but not roomy — transit passport control adds time" },
        { icon: "planeUp", label: "Midday ZRH departure bank", detail: "The 1–2 PM long-haul wave competes for runway slots" },
        { icon: "refresh", label: "Long-haul turnaround on time", detail: "HB-JMK arrived from Chicago this morning as scheduled" },
      ],
    },
    inbound: [
      { from: "ORD", to: "ZRH", flight: "LX 9", status: "Landed", depTime: "5:40 PM", arrTime: "9:05 AM", progress: 100 },
      { from: "ZRH", to: "MIA", flight: "LX 64", status: "This is your flight", depTime: "1:40 PM", arrTime: "6:10 PM", progress: 0 },
    ],
    checkin: { open: true, airline: "Through-checked from TLV", counter: "Bags tagged to MIA", tip: "Keep boarding pass from El Al check-in" },
    carbonKg: 980,
    pass: { zone: "2", group: "GROUP 2", seat: "38H", gate: "E24" },
    conn: {
      arrTerminal: "Terminal (Schengen)", arrGate: "B7",
      depTerminal: "Terminal E (Non-Schengen)", depGate: "E24",
      walkMins: 25, layoverMins: 155, buffer: 130,
      transport: "Skymetro to E gates",
      security: "Transit passport control required (leaving Schengen)",
      steps: [
        { icon: "planeDown", label: "Deplane", mins: 5 },
        { icon: "passport", label: "Transit passport control", mins: 15 },
        { icon: "train", label: "Skymetro + walk to E gates", mins: 10 },
      ],
    },
  },
];

// ── Trip timeline (TripIt-style: everything, not just flights) ──
export const TRIP_ITEMS = [
  { id: "t1", type: "note", icon: "home", dayLabel: "Wed Sep 2", timeLabel: "4:50 AM", title: "Leave Dizengoff St 99", sub: "22 min drive to TLV · 3h security-interview buffer" },
  { id: "t2", type: "flight", flightId: "f1", icon: "planeUp", dayLabel: "Wed Sep 2", timeLabel: "8:00 AM", title: "TLV → ZRH · LY 347", sub: "El Al · Seat 22C · Conf ELAL7Q" },
  { id: "t3", type: "transfer", icon: "walk", dayLabel: "Wed Sep 2", timeLabel: "11:05 AM", title: "Transit at Zurich · 2h 35m", sub: "Passport control → Skymetro → Gate E24" },
  { id: "t4", type: "flight", flightId: "f2", icon: "planeUp", dayLabel: "Wed Sep 2", timeLabel: "1:40 PM", title: "ZRH → MIA · LX 64", sub: "SWISS · Seat 38H · Conf SWQ4RZ" },
  { id: "t5", type: "note", icon: "planeDown", dayLabel: "Wed Sep 2", timeLabel: "6:10 PM", title: "Land Miami — home!", sub: "Long-term parking Lot 4, row G" },
];

// ── Family tracker seed ───────────────────────────────────────
export const FAMILY_SEED = [
  { id: "p1", name: "Mom", initials: "M", color: "#a78bfa", flight: "DL 204", dep: "ATL", arr: "JFK", status: "On Time", eta: "4:20 PM", progress: 0 },
  { id: "p2", name: "Jake", initials: "J", color: "#00e87a", flight: "SW 881", dep: "ORD", arr: "LAX", status: "Departed", eta: "3:15 PM", progress: 45 },
  { id: "p3", name: "Sarah", initials: "S", color: "#ff5c2b", flight: "BA 178", dep: "LHR", arr: "JFK", status: "Delayed", eta: "8:00 PM", progress: 0 },
];

// ── Corporate dashboard seed ──────────────────────────────────
export const EMPLOYEES = [
  { id: 1, name: "Sarah Chen", dept: "Sales", avatar: "SC", color: "#00c8f0", flight: "AA 100", dep: "JFK", arr: "LAX", status: "Departed", eta: "11:45 AM", progress: 62, gate: "B22", delay: 0, phone: "(212) 555-0101" },
  { id: 2, name: "Marcus Lee", dept: "Eng", avatar: "ML", color: "#00e87a", flight: "DL 456", dep: "ATL", arr: "SFO", status: "On Time", eta: "2:30 PM", progress: 0, gate: "D14", delay: 0, phone: "(415) 555-0192" },
  { id: 3, name: "Priya Sharma", dept: "Sales", avatar: "PS", color: "#ffc800", flight: "UA 789", dep: "LAX", arr: "ORD", status: "Delayed", eta: "~5:45 PM", progress: 0, gate: "C11", delay: 55, phone: "(312) 555-0134" },
  { id: 4, name: "Tom Walsh", dept: "Exec", avatar: "TW", color: "#a78bfa", flight: "BA 178", dep: "LHR", arr: "JFK", status: "In Air", eta: "8:00 PM", progress: 78, gate: "T7", delay: 0, phone: "(646) 555-0177" },
  { id: 5, name: "Lisa Park", dept: "HR", avatar: "LP", color: "#ff5c2b", flight: "SW 321", dep: "DAL", arr: "MIA", status: "Cancelled", eta: "—", progress: 0, gate: "—", delay: 0, phone: "(305) 555-0155", cancelled: true },
  { id: 6, name: "James Rivera", dept: "Eng", avatar: "JR", color: "#00e87a", flight: "AA 200", dep: "BOS", arr: "DFW", status: "Landed", eta: "Arrived", progress: 100, gate: "B8", delay: 0, phone: "(972) 555-0188" },
];

// ── Passport (lifetime stats) ─────────────────────────────────
// Badges are { icon, label } — icon is an ICON NAME rendered via <Icon>.
export const PASSPORT = {
  miles: 124580, flights: 47, airports: 23, countries: 8, streak: 3,
  airline: "American Airlines", yr: { flights: 12, miles: 28400 },
  badges: [
    { icon: "globe", label: "Globe Trotter" },
    { icon: "plane", label: "Jet Setter" },
    { icon: "link", label: "Connection Pro" },
    { icon: "sunrise", label: "Early Bird" },
  ],
  lockedBadges: [
    { icon: "trophy", label: "Century Club" },
    { icon: "luggage", label: "Road Warrior" },
    { icon: "moon", label: "Night Owl" },
    { icon: "star", label: "First Class" },
    { icon: "mountain", label: "Mountain Explorer" },
  ],
};

// ── Navigation apps (leave-by card) ───────────────────────────
// type: "drive" | "transit". iconName is the fallback glyph when logo is null.
export const NAV_APPS = [
  { id: "waze", label: "Waze", color: "#00AFFF", bg: "rgba(0,175,255,0.12)", border: "rgba(0,175,255,0.3)", type: "drive", iconName: "car", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Waze_icon.svg/96px-Waze_icon.svg.png" },
  { id: "google", label: "Google Maps", color: "#4285F4", bg: "rgba(66,133,244,0.12)", border: "rgba(66,133,244,0.3)", type: "drive", iconName: "map", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Google_Maps_Logo_2020.svg/96px-Google_Maps_Logo_2020.svg.png" },
  { id: "apple", label: "Apple Maps", color: "#6eb5ff", bg: "rgba(110,181,255,0.12)", border: "rgba(110,181,255,0.3)", type: "drive", iconName: "pin", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Apple_Maps_logo_2020.svg/96px-Apple_Maps_logo_2020.svg.png" },
  { id: "gtransit", label: "Google Transit", color: "#34A853", bg: "rgba(52,168,83,0.12)", border: "rgba(52,168,83,0.3)", type: "transit", iconName: "transit", logo: null },
  { id: "citymapper", label: "Citymapper", color: "#12b886", bg: "rgba(18,184,134,0.12)", border: "rgba(18,184,134,0.3)", type: "transit", iconName: "bus", logo: null },
  { id: "moovit", label: "Moovit", color: "#f2a33c", bg: "rgba(242,163,60,0.12)", border: "rgba(242,163,60,0.3)", type: "transit", iconName: "train", logo: null },
];
