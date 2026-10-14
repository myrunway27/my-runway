// Central app store. Wrap the app in <AppProvider>; consume with useApp().
//
// useApp() returns:
//   now            demo clock in minutes since 10:30 AM Apr 22 (see utils)
//   tick           tick counter
//   flights        array (seed FLIGHTS_SEED + user-added; live-updated by sim)
//   tripItems      TRIP_ITEMS
//   family         array (seed + user-added; live-updated)
//   employees      corporate array
//   airports       AIRPORTS map
//   notifications  [{id, icon, title, body, time, read}] newest first
//   unread         count of unread notifications
//   settings       { isDark, onboarded, userName, homeAddress, navId ("waze"|"google"|"apple"|"gtransit"|"citymapper"|"moovit"), notifs: {status, leaveBy, landing, cancellations} }
//   notifications may carry kind: "cancel" | "delay" | "gate" | "info" (from sim events)
//   addFlight(partial)      — add a user flight (gets sensible defaults)
//   removeFlight(id)
//   addFamily({name, flight})
//   removeFamily(id)
//   updateSettings(patch)   — shallow merge into settings (persisted)
//   markNotifsRead()
//   clearNotifs()

import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { AIRPORTS, FLIGHTS_SEED, TRIP_ITEMS, FAMILY_SEED, EMPLOYEES, NAV_APPS } from "./data/seed.js";
import { TICK_MS, MIN_PER_TICK, applyTick } from "./data/sim.js";
import { fmtClock } from "./lib/utils.js";

const LS_KEY = "myrunway-v1";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return typeof p === "object" && p ? p : {};
  } catch {
    return {};
  }
}

function persist(state) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        settings: state.settings,
        customFlights: state.flights.filter((f) => f.custom),
        customFamily: state.family.filter((p) => p.custom),
      })
    );
  } catch {
    // storage unavailable (private mode etc.) — run in-memory only
  }
}

function initState() {
  const p = loadPersisted();
  return {
    tick: 0,
    now: 0,
    flights: [...FLIGHTS_SEED, ...(p.customFlights || [])],
    family: [...FAMILY_SEED, ...(p.customFamily || [])],
    employees: EMPLOYEES,
    notifications: [
      { id: "n-seed-1", icon: "wave", kind: "info", title: "Welcome to MyRunway", body: "Tracking your Tel Aviv → Miami trip. We'll alert you before the airline does.", time: "2:00 AM", read: false },
    ],
    settings: {
      isDark: true,
      onboarded: false,
      userName: "",
      homeAddress: "Dizengoff St 99, Tel Aviv",
      navId: "waze",
      notifs: { status: true, leaveBy: true, landing: true, cancellations: true },
      ...(p.settings || {}),
    },
  };
}

const COLORS = ["#00c8f0", "#ffc800", "#a78bfa", "#ff5c2b", "#00e87a"];

function reducer(state, action) {
  switch (action.type) {
    case "TICK": {
      const tick = state.tick + 1;
      const now = state.now + MIN_PER_TICK;
      const r = applyTick({ tick, now, flights: state.flights, family: state.family, employees: state.employees }, fmtClock);
      return {
        ...state, tick, now,
        flights: r.flights, family: r.family, employees: r.employees,
        notifications: r.notifications.length ? [...r.notifications, ...state.notifications] : state.notifications,
      };
    }
    case "ADD_FLIGHT": {
      const { num, date } = action;
      const id = `uf-${Date.now()}`;
      const code = num.trim().split(/\s+/)[0].slice(0, 2).toUpperCase();
      const f = {
        id, custom: true, source: "lookup", iata: num.toUpperCase(), code, airline: "Tracked flight",
        dep: "???", arr: "???", depMin: state.now + 600, arrMin: state.now + 780,
        depTime: "TBD", arrTime: "TBD", status: "Scheduled", progress: 0,
        gate: "TBD", terminal: "TBD", aircraft: "TBD", seat: "—",
        date, conf: null, trip: "other", wx: null,
        risk: { score: 20, predictedDelay: 0, reasons: [{ icon: "🕐", label: "Too early to predict", detail: "Risk factors appear ~24h before departure" }] },
        inbound: null, pass: null, conn: null,
      };
      return { ...state, flights: [...state.flights, f] };
    }
    case "REMOVE_FLIGHT":
      return { ...state, flights: state.flights.filter((f) => f.id !== action.id) };
    case "ADD_FAMILY": {
      const { name, flight } = action;
      const p = {
        id: `up-${Date.now()}`, custom: true, name,
        initials: name.slice(0, 2).toUpperCase(),
        color: COLORS[state.family.length % COLORS.length],
        flight: flight.toUpperCase(), dep: "???", arr: "???",
        status: "Scheduled", eta: "TBD", progress: 0,
      };
      return { ...state, family: [...state.family, p] };
    }
    case "REMOVE_FAMILY":
      return { ...state, family: state.family.filter((p) => p.id !== action.id) };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "MARK_NOTIFS_READ":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case "CLEAR_NOTIFS":
      return { ...state, notifications: [] };
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const i = setInterval(() => dispatch({ type: "TICK" }), TICK_MS);
    return () => clearInterval(i);
  }, []);

  // Persist on any user-driven change (settings / custom items).
  useEffect(() => {
    persist(state);
  }, [state.settings, state.flights.length, state.family.length]);

  const value = {
    ...state,
    tripItems: TRIP_ITEMS,
    airports: AIRPORTS,
    navApps: NAV_APPS,
    unread: state.notifications.filter((n) => !n.read).length,
    addFlight: (num, date) => dispatch({ type: "ADD_FLIGHT", num, date }),
    removeFlight: (id) => dispatch({ type: "REMOVE_FLIGHT", id }),
    addFamily: (name, flight) => dispatch({ type: "ADD_FAMILY", name, flight }),
    removeFamily: (id) => dispatch({ type: "REMOVE_FAMILY", id }),
    updateSettings: (patch) => dispatch({ type: "UPDATE_SETTINGS", patch }),
    markNotifsRead: () => dispatch({ type: "MARK_NOTIFS_READ" }),
    clearNotifs: () => dispatch({ type: "CLEAR_NOTIFS" }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
