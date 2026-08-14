// First-run onboarding — 3-step full-screen flow.
// Step 1: brand splash. Step 2: name + home address (leave-by anchor).
// Step 3: required nav-app pick. Finishing flips settings.onboarded.
import React, { useState } from "react";
import { C } from "../theme.js";
import { useApp } from "../store.jsx";
import { Icon } from "../components/icons.jsx";
import { LogoMark } from "../components/Logo.jsx";
import { SectionLabel, PrimaryBtn } from "../components/ui.jsx";

const DRIVING_APPS = [
  { id: "waze", label: "Waze", color: "#00AFFF", icon: "car" },
  { id: "google", label: "Google Maps", color: "#4285F4", icon: "map" },
  { id: "apple", label: "Apple Maps", color: "#6eb5ff", icon: "pin" },
];
const TRANSIT_APPS = [
  { id: "gtransit", label: "Google Transit", color: "#34A853", icon: "transit" },
  { id: "citymapper", label: "Citymapper", color: "#12b886", icon: "bus" },
  { id: "moovit", label: "Moovit", color: "#f2a33c", icon: "train" },
];

function StepBtn({ label, disabled, onClick, style }) {
  if (disabled) {
    return (
      <div style={{ background: C.muted, borderRadius: 14, padding: "15px 0", textAlign: "center", fontWeight: 800, fontSize: 15, color: C.bg, opacity: 0.55, cursor: "default", ...style }}>
        {label}
      </div>
    );
  }
  return <PrimaryBtn onClick={onClick} style={style}>{label}</PrimaryBtn>;
}

function BackBtn({ onClick }) {
  return (
    <div onClick={onClick} style={{ width: 34, height: 34, borderRadius: 17, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginBottom: 22 }}>
      <Icon name="arrowLeft" size={16} color={C.accent} />
    </div>
  );
}

function NavTile({ app, active, onPick }) {
  return (
    <div
      onClick={() => onPick(app.id)}
      style={{
        background: active ? `${app.color}1c` : C.card,
        border: `1px solid ${active ? app.color : C.border}`,
        borderRadius: 14,
        padding: "14px 6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        transition: "background .15s ease, border-color .15s ease",
      }}
    >
      <Icon name={app.icon} size={22} color={active ? app.color : C.soft} />
      <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? C.text : C.soft, textAlign: "center", lineHeight: 1.25 }}>
        {app.label}
      </span>
    </div>
  );
}

export default function Onboarding() {
  const { settings, updateSettings } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [addr, setAddr] = useState(settings.homeAddress || "");
  const [picked, setPicked] = useState(null);

  const input = {
    width: "100%", background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "13px 14px", color: C.text, fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: C.sans,
  };

  const finish = () =>
    updateSettings({ onboarded: true, userName: name.trim(), homeAddress: addr, navId: picked });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", fontFamily: C.sans }}>
      {/* Step content — keyed so each advance replays the entrance animation */}
      <div key={step} className="mr-in" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: step === 1 ? "center" : "flex-start", padding: step === 1 ? "40px 28px" : "28px 24px 12px" }}>

        {step === 1 && (
          <>
            <div className="mr-pop" style={{ display: "flex", justifyContent: "center" }}>
              <LogoMark size={120} />
            </div>
            <div style={{ fontFamily: C.display, fontSize: 34, fontWeight: 900, letterSpacing: 6, color: C.text, textAlign: "center", marginTop: 24 }}>
              MY RUNWAY
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: 3, color: C.orange, textAlign: "center", marginTop: 10 }}>
              KNOW BEFORE YOU GO
            </div>
            <div style={{ fontSize: 14, color: C.soft, textAlign: "center", lineHeight: 1.65, marginTop: 18, maxWidth: 300, alignSelf: "center" }}>
              Flight alerts before the airline. Door-to-gate timing. Zero guesswork.
            </div>
            <PrimaryBtn onClick={() => setStep(2)} style={{ marginTop: 40 }}>Get Started</PrimaryBtn>
          </>
        )}

        {step === 2 && (
          <>
            <BackBtn onClick={() => setStep(1)} />
            <SectionLabel color={C.accent} style={{ marginBottom: 10 }}>STEP 2 OF 3</SectionLabel>
            <div style={{ fontFamily: C.display, fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 24 }}>
              Where are you leaving from?
            </div>

            <SectionLabel style={{ marginBottom: 8 }}>YOUR NAME</SectionLabel>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ ...input, marginBottom: 18 }} />

            <SectionLabel style={{ marginBottom: 8 }}>HOME ADDRESS</SectionLabel>
            <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Street, city" style={input} />
            <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, marginTop: 8 }}>
              Used to compute your leave-by-home time. Change it any time in Settings.
            </div>

            <StepBtn label="Continue" disabled={!addr.trim()} onClick={() => setStep(3)} style={{ marginTop: 30 }} />
          </>
        )}

        {step === 3 && (
          <>
            <BackBtn onClick={() => setStep(2)} />
            <SectionLabel color={C.accent} style={{ marginBottom: 10 }}>STEP 3 OF 3</SectionLabel>
            <div style={{ fontFamily: C.display, fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6 }}>
              How do you get to the airport?
            </div>
            <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.5, marginBottom: 22 }}>
              Your leave-by alerts open directly in the app you pick.
            </div>

            <SectionLabel style={{ marginBottom: 10 }}>DRIVING</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
              {DRIVING_APPS.map((a) => (
                <NavTile key={a.id} app={a} active={picked === a.id} onPick={setPicked} />
              ))}
            </div>

            <SectionLabel style={{ marginBottom: 10 }}>PUBLIC TRANSIT</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {TRANSIT_APPS.map((a) => (
                <NavTile key={a.id} app={a} active={picked === a.id} onPick={setPicked} />
              ))}
            </div>

            <StepBtn label="Finish Setup" disabled={!picked} onClick={finish} style={{ marginTop: 30 }} />
          </>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", padding: "18px 0 36px" }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ width: step === n ? 22 : 7, height: 7, borderRadius: 4, background: step === n ? C.accent : C.border, transition: "width .25s ease, background .25s ease" }} />
        ))}
      </div>
    </div>
  );
}
