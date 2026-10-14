import React, { useState, useEffect } from "react";
import { C, applyTheme } from "./theme.js";
import { AppProvider, useApp } from "./store.jsx";
import { Icon } from "./components/icons.jsx";
import Logo from "./components/Logo.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import FlightsScreen from "./screens/FlightsScreen.jsx";
import TripScreen from "./screens/TripScreen.jsx";
import AirportsScreen from "./screens/AirportsScreen.jsx";
import FamilyScreen from "./screens/FamilyScreen.jsx";
import PassportScreen from "./screens/PassportScreen.jsx";
import PlansScreen from "./screens/PlansScreen.jsx";
import CorporateDashboard from "./screens/Corporate.jsx";
import FlightDetail from "./screens/FlightDetail.jsx";
import { AddModal, ShareModal, SettingsModal } from "./screens/modals.jsx";
import NotificationCenter from "./features/notifications.jsx";
import TripMode from "./features/tripMode.jsx";

const TABS = [
  { id: "flights", icon: "plane", label: "Flights" },
  { id: "trip", icon: "calendar", label: "Trip" },
  { id: "airports", icon: "planeUp", label: "Airports" },
  { id: "family", icon: "users", label: "Family" },
  { id: "passport", icon: "chart", label: "Passport" },
];

const TITLES = {
  flights: ["My Flights", "Tel Aviv → Miami · Wed Sep 2"],
  trip: ["Trip Timeline", "Flights, layover & plans in one thread"],
  airports: ["Airport Intelligence", "Weather, delays & boards at every stop"],
  family: ["Family Tracker", "Everyone's flights in one place"],
  passport: ["My Passport", "Your lifetime flying history"],
};

// Shared motion classes — every screen may use these.
const MOTION_CSS = `
::-webkit-scrollbar{display:none}
*{box-sizing:border-box}
input::placeholder{color:var(--mr-muted)}
@keyframes mrIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes mrPop{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:none}}
@keyframes mrSheet{from{transform:translateY(40px);opacity:0.4}to{transform:none;opacity:1}}
@keyframes mrPulse{0%,100%{opacity:1}50%{opacity:0.45}}
@keyframes mrShimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
.mr-in{animation:mrIn .35s ease both}
.mr-pop{animation:mrPop .28s ease both}
.mr-sheet{animation:mrSheet .3s cubic-bezier(.2,.8,.3,1) both}
.mr-pulse{animation:mrPulse 2s ease infinite}
`;

// Viewport width, so the header can stay inside a phone screen. Without this the
// full logo lockup plus five controls need ~500px; on a 390px phone that widened
// the layout viewport and pushed the fixed BottomNav's last tab off-screen.
function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window === "undefined" ? 480 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

function BottomNav({ active, onNav }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.headerBg, borderTop: `1px solid ${C.border}`, zIndex: 20 }}>
      <div style={{ display: "flex", padding: "8px 8px 22px", maxWidth: 480, margin: "0 auto" }}>
        {TABS.map((t) => (
          <div key={t.id} onClick={() => onNav(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", padding: "6px 0", transition: "transform .15s ease" }}>
            <Icon name={t.icon} size={21} color={active === t.id ? C.accent : C.muted} />
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: C.mono, color: active === t.id ? C.accent : C.muted }}>{t.label}</span>
            {active === t.id && <div className="mr-pop" style={{ width: 20, height: 3, borderRadius: 2, background: C.accent }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Shell() {
  const app = useApp();
  const { settings, notifications, unread, flights } = app;
  applyTheme(settings.isDark);

  const vw = useViewportWidth();
  // Header size tiers, measured against what the row actually needs:
  // full lockup + "Add" label ≈ 469px, compact ≈ 382px, mark-only ≈ 260px.
  const narrow = vw < 470;        // drop the tagline and the "Add" label
  const markOnly = vw < 390;      // drop the wordmark too (SE, most Androids)

  const [tab, setTab] = useState("flights");
  const [showAdd, setShowAdd] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCorp, setShowCorp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showTripMode, setShowTripMode] = useState(false);
  const [detailId, setDetailId] = useState(null);

  if (!settings.onboarded) {
    return (
      <>
        <style>{MOTION_CSS.replace("var(--mr-muted)", C.muted)}</style>
        <Onboarding />
      </>
    );
  }

  const detailFlight = detailId ? flights.find((f) => f.id === detailId) : null;
  const [title, subtitle] = TITLES[tab];

  // Bell stays neutral; it only goes red for a real unread cancellation.
  const hasCancel = notifications.some((n) => n.kind === "cancel" && !n.read);

  const iconBtn = { background: settings.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, borderRadius: 10, padding: narrow ? "8px 8px" : "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", position: "relative", transition: "background .15s ease" };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: C.sans, maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{MOTION_CSS.replace("var(--mr-muted)", C.muted)}</style>

      {/* Header */}
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Logo height={narrow ? 20 : 24} withText={!markOnly} />
        <div style={{ display: "flex", gap: narrow ? 4 : 6, alignItems: "center", flexShrink: 0 }}>
          <div onClick={() => setShowNotifs(true)} style={iconBtn} title="Notifications">
            <Icon name="bell" size={15} color={hasCancel ? C.red : C.soft} />
            {unread > 0 && (
              <div className="mr-pop" style={{ position: "absolute", top: -5, right: -5, background: hasCancel ? C.red : C.accent, borderRadius: 9, minWidth: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: hasCancel ? "#fff" : "#000", padding: "0 4px" }}>{unread}</div>
            )}
          </div>
          <div onClick={() => app.updateSettings({ isDark: !settings.isDark })} style={iconBtn} title="Theme">
            <Icon name={settings.isDark ? "sun" : "moon"} size={15} color={C.soft} />
          </div>
          <div onClick={() => setShowSettings(true)} style={iconBtn} title="Settings">
            <Icon name="gear" size={15} color={C.soft} />
          </div>
          <div onClick={() => setShowAdd(true)} title="Add" style={{ background: `linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius: 10, padding: narrow ? "8px 10px" : "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="plus" size={13} color="#000" strokeWidth={2.6} />
            {!narrow && <span style={{ fontSize: 12, color: "#000", fontWeight: 800 }}>Add</span>}
          </div>
          <div onClick={() => setShowCorp(true)} style={{ ...iconBtn, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)" }} title="Corporate">
            <Icon name="building" size={15} color={C.purple} />
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 3, fontFamily: C.display }}>{title}</div>
        <div style={{ fontSize: 13, color: C.soft }}>{subtitle}</div>
      </div>

      {/* Active tab (keyed so each switch replays the entrance animation) */}
      <div key={tab} className="mr-in" style={{ flex: 1 }}>
        {tab === "flights" && <FlightsScreen onTap={(f) => setDetailId(f.id)} onAdd={() => setShowAdd(true)} onTripMode={() => setShowTripMode(true)} />}
        {tab === "trip" && <TripScreen onTapFlight={(id) => setDetailId(id)} />}
        {tab === "airports" && <AirportsScreen />}
        {tab === "family" && <FamilyScreen />}
        {tab === "passport" && <PassportScreen onOpenPlans={() => setShowPlans(true)} />}
      </div>

      <BottomNav active={tab} onNav={setTab} />

      {/* Overlays */}
      {showTripMode && <TripMode onClose={() => setShowTripMode(false)} />}
      {detailFlight && <FlightDetail flight={detailFlight} onClose={() => setDetailId(null)} onShare={() => setShowShare(true)} />}
      {showNotifs && <NotificationCenter onClose={() => setShowNotifs(false)} />}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onOpenPlans={() => { setShowSettings(false); setShowPlans(true); }} />}
      {showPlans && <PlansScreen onClose={() => setShowPlans(false)} />}
      {showCorp && <CorporateDashboard onClose={() => setShowCorp(false)} />}
    </div>
  );
}

export default function MyRunway() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
