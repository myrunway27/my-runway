// Bottom-sheet modals: AddModal, ShareModal, SettingsModal.
// All use Sheet from components/ui.jsx and are wired to the central store.
// AddModal is built around the golden rule: the booking is the source of truth —
// pasting a confirmation (booking-verified) beats a flight-number lookup (estimate).
import React, { useMemo, useState } from "react";
import { C } from "../theme.js";
import { useApp } from "../store.jsx";
import { Sheet, Toggle } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { SourceChip } from "../features/dataSource.jsx";

// ── Booking-text parsing ──────────────────────────────────────
// 6-char uppercase words that look like conf codes but aren't.
const CONF_STOPWORDS = new Set([
  "FLIGHT", "TICKET", "TRAVEL", "BOEING", "AIRBUS", "DEPART", "ARRIVE", "RETURN",
  "PLEASE", "ONLINE", "THANKS", "STATUS", "CHANGE", "POLICY", "REFUND", "BOOKED",
  "AMOUNT", "REVIEW", "CENTER", "NUMBER", "RECORD", "ZURICH", "MIRROR", "SUMMER",
  "WINTER", "AUGUST", "ISRAEL", "CANCEL", "ECONOM", "COUNTER",
]);

const DATE_RE = /\b(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b|\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:,?\s*\d{4})?\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/i;

function parseBooking(text) {
  const flights = [];
  const flightRe = /\b([A-Z]{2})\s?(\d{1,4})\b/g;
  let m;
  while ((m = flightRe.exec(text))) {
    const code = m[1];
    // Don't treat "6:10 PM 2" / "11:05 AM 4" as flights PM 2 / AM 4.
    if ((code === "AM" || code === "PM") && /\d:\d{2}\s?$/.test(text.slice(Math.max(0, m.index - 6), m.index))) continue;
    const fn = `${code} ${m[2]}`;
    if (!flights.includes(fn)) flights.push(fn);
  }

  let conf = null;
  const confRe = /\b[A-Z0-9]{6}\b/g;
  while ((m = confRe.exec(text))) {
    const t = m[0];
    if (CONF_STOPWORDS.has(t)) continue;
    if (/^\d+$/.test(t)) continue;            // pure digits — not a PNR
    if (/^[A-Z]{2}\d{4}$/.test(t)) continue;  // compact flight number e.g. LY0347
    conf = t;
    break;
  }

  const dateM = text.match(DATE_RE);
  const times = text.match(/\d{1,2}:\d{2}\s?(?:AM|PM)?/gi) || [];

  return { flights, conf, date: dateM ? dateM[0] : null, times };
}

function todayStr() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Add / Track a flight ──────────────────────────────────────
export function AddModal({ onClose }) {
  const { addFlight } = useApp();
  const [mode, setMode] = useState("paste"); // "paste" | "number"
  const [text, setText] = useState("");
  const [num, setNum] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const parsed = useMemo(() => parseBooking(text), [text]);
  const n = parsed.flights.length;

  function submitPaste() {
    if (done || n === 0) return;
    const dateStr = parsed.date || todayStr();
    parsed.flights.forEach((fn) => addFlight(fn, dateStr));
    setDone(true);
    setTimeout(onClose, 1300);
  }

  function submitLookup() {
    if (busy || done) return;
    if (!num.trim()) { setErr("Enter a flight number e.g. LY 347"); return; }
    if (!date) { setErr("Pick a date"); return; }
    setBusy(true); setErr("");
    setTimeout(() => {
      addFlight(num.trim(), date);
      setBusy(false);
      setDone(true);
      setTimeout(onClose, 1200);
    }, 1400);
  }

  const inputStyle = (filled) => ({
    width: "100%", background: C.card, border: `1.5px solid ${filled ? C.accent + "60" : C.border}`,
    borderRadius: 13, padding: "14px 16px", color: C.text, fontSize: 16, fontFamily: C.mono,
    outline: "none", boxSizing: "border-box",
  });

  return (
    <Sheet onClose={onClose}>
      <style>{`textarea::placeholder{color:${C.muted}}`}</style>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 14 }}>Track a Flight</div>

      {/* Golden rule callout */}
      <div className="mr-in" style={{ display: "flex", gap: 12, alignItems: "flex-start", background: C.accent + "10", border: `1px solid ${C.accent}33`, borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: C.accent + "1c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="shield" size={19} color={C.accent} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 3 }}>The booking is the source of truth</div>
          <div style={{ fontSize: 12.5, color: C.soft, lineHeight: 1.5 }}>Times from your booking beat any flight-tracker lookup.</div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[["paste", "PASTE BOOKING", "ticket"], ["number", "FLIGHT #", "search"]].map(([id, label, icon]) => {
          const active = mode === id;
          return (
            <div key={id} onClick={() => { setMode(id); setErr(""); }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 9, cursor: "pointer", background: active ? C.accent + "18" : "transparent", border: `1px solid ${active ? C.accent + "55" : "transparent"}`, transition: "all .15s ease" }}>
              <Icon name={icon} size={13} color={active ? C.accent : C.muted} />
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: C.mono, letterSpacing: 1, color: active ? C.accent : C.muted }}>{label}</span>
            </div>
          );
        })}
      </div>

      {mode === "paste" ? (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5}
            placeholder="Paste your confirmation email or booking text…"
            style={{ width: "100%", minHeight: 90, background: C.card, border: `1.5px solid ${text ? C.accent + "60" : C.border}`, borderRadius: 13, padding: "13px 15px", color: C.text, fontSize: 14, fontFamily: C.sans, lineHeight: 1.55, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 14 }} />

          {/* Live parse preview */}
          {text.trim() !== "" && (
            <div className="mr-in" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: C.mono, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>
                PARSED FROM YOUR BOOKING{parsed.times.length > 0 ? ` · ${parsed.times.length} TIME${parsed.times.length === 1 ? "" : "S"}` : ""}
              </div>
              {n === 0 ? (
                <div style={{ fontSize: 12.5, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="search" size={14} color={C.muted} />
                  No flight numbers yet — looking for codes like LY 347…
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {parsed.flights.map((fn, i) => (
                    <div key={fn} className="mr-pop" style={{ animationDelay: i * 40 + "ms", display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "6px 9px" }}>
                      <Icon name="plane" size={13} color={C.accent} />
                      <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: C.mono, color: C.text }}>{fn}</span>
                      <SourceChip tier="booking" />
                    </div>
                  ))}
                  {parsed.conf && (
                    <div className="mr-pop" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 9, padding: "6px 9px" }}>
                      <Icon name="ticket" size={13} color={C.purple} />
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: C.mono, color: C.purple }}>CONF {parsed.conf}</span>
                    </div>
                  )}
                  {parsed.date && (
                    <div className="mr-pop" style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "6px 9px" }}>
                      <Icon name="calendar" size={13} color={C.soft} />
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: C.mono, color: C.soft }}>{parsed.date}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {done ? (
            <div className="mr-pop" style={{ padding: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 800, fontSize: 15, color: C.green }}>
              <Icon name="check" size={18} color={C.green} strokeWidth={2.4} />
              {n} flight{n === 1 ? "" : "s"} added — booking-verified
            </div>
          ) : (
            <div onClick={submitPaste}
              style={{ background: n === 0 ? C.card : `linear-gradient(135deg,${C.accent},#007aaa)`, border: n === 0 ? `1px solid ${C.border}` : "1px solid transparent", borderRadius: 14, padding: "16px 0", textAlign: "center", fontWeight: 800, fontSize: 16, color: n === 0 ? C.muted : "#000", cursor: n === 0 ? "default" : "pointer" }}>
              {n === 0 ? "Add flights" : `Add ${n} flight${n === 1 ? "" : "s"}`}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Lookup honesty warning */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.25)", borderRadius: 12, padding: "11px 13px", marginBottom: 16 }}>
            <Icon name="warning" size={16} color={C.yellow} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: C.soft, lineHeight: 1.5 }}>
              Lookup can't see schedule changes on <b style={{ color: C.yellow }}>YOUR</b> booking. Paste your confirmation instead for booking-verified times.
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 8 }}>FLIGHT NUMBER</div>
            <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="LY 347, LX64, AA 100..." style={inputStyle(num)} />
          </div>
          <div style={{ marginBottom: err ? 12 : 20 }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 8 }}>FLIGHT DATE</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ ...inputStyle(date), fontSize: 14, color: date ? C.text : C.muted, colorScheme: C.isDark ? "dark" : "light" }} />
          </div>
          {err && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.red, marginBottom: 14 }}>
              <Icon name="warning" size={14} color={C.red} /> {err}
            </div>
          )}
          {done ? (
            <div className="mr-pop" style={{ padding: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 800, fontSize: 15, color: C.green }}>
              <Icon name="check" size={18} color={C.green} strokeWidth={2.4} />
              {num.trim().toUpperCase()} added — find it under Other Tracked Flights
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div onClick={submitLookup}
                style={{ flex: 1, background: busy ? C.muted : `linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius: 14, padding: "16px 0", textAlign: "center", fontWeight: 800, fontSize: 16, color: "#000", cursor: busy ? "default" : "pointer" }}>
                {busy ? "Looking up flight..." : "Track This Flight →"}
              </div>
              <SourceChip tier="est" />
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}

// ── Share trip ────────────────────────────────────────────────
export function ShareModal({ onClose }) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(null);
  const autoMsg = `Landing Miami (MIA) at 6:10 PM on SWISS LX 64 — connected in Zurich from El Al LY 347.`;
  const shareLink = "myrunwayapp.co/t/abc123k";

  function share(method) {
    if (method === "Copy Link") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setSent(method);
      setTimeout(() => setSent(null), 1600);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>Share Trip</div>
      <div style={{ fontSize: 13, color: C.soft, marginBottom: 16 }}>Your pickup person gets a live tracking link — no app needed.</div>
      <div style={{ background: C.card, borderRadius: 12, padding: "13px 14px", marginBottom: 14, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.mono, letterSpacing: 1, marginBottom: 6 }}>AUTO-GENERATED MESSAGE</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{autoMsg}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 1.5, marginBottom: 8 }}>ADD A PERSONAL NOTE (optional)</div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. bring coffee, I have 2 bags..."
          style={{ width: "100%", background: C.card, border: `1.5px solid ${note ? C.accent + "60" : C.border}`, borderRadius: 12, padding: "13px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      </div>
      <div style={{ background: "rgba(0,200,240,0.06)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, border: "1px solid rgba(0,200,240,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: C.accent, fontFamily: C.mono }}>{shareLink}</span>
        <span style={{ fontSize: 11, color: copied ? C.green : C.accent, fontWeight: 700, cursor: "pointer" }} onClick={() => share("Copy Link")}>{copied ? "Copied!" : "Copy"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[["message", "WhatsApp", "#25D366"], ["phone", "iMessage", "#34C759"], ["mail", "Email", "#4285F4"], ["link", "Copy Link", C.accent]].map(([icon, label, color]) => (
          <div key={label} onClick={() => share(label)} style={{ background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 12, padding: "12px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
            <Icon name={icon} size={19} color={color} />
            <div style={{ fontSize: 12, fontWeight: 700, color }}>
              {label === "Copy Link" ? (copied ? "Copied!" : label) : sent === label ? "Sent!" : label}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

// ── Settings ──────────────────────────────────────────────────
const TRANSIT_IDS = ["gtransit", "citymapper", "moovit"];

const NOTIF_ROWS = [
  ["status", "Flight status changes", "Get alerted when your flight is delayed, cancelled, or gate changes"],
  ["leaveBy", "Leave-by reminders", "Get notified when it's time to leave for the airport"],
  ["landing", "Landing alerts", "Notify your pickup contact when you land"],
];

function NavAppLogo({ app, active }) {
  const [err, setErr] = useState(false);
  if (err || !app.logo) return <Icon name="car" size={24} color={active ? (app.color || C.accent) : C.soft} />;
  return <img src={app.logo} alt={app.label} onError={() => setErr(true)} style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 6, flexShrink: 0 }} />;
}

function NavTile({ app, active, onPick }) {
  return (
    <div onClick={onPick}
      style={{ flex: 1, background: active ? (app.bg || C.accent + "18") : C.card, border: `2px solid ${active ? (app.color || C.accent) : C.border}`, borderRadius: 12, padding: "12px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", transition: "all 0.2s" }}>
      {app.iconName
        ? <Icon name={app.iconName} size={24} color={active ? (app.color || C.accent) : C.soft} />
        : <NavAppLogo app={app} active={active} />}
      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: C.mono, color: active ? (app.color || C.accent) : C.soft, textAlign: "center" }}>{app.label}</span>
    </div>
  );
}

export function SettingsModal({ onClose, onOpenPlans }) {
  const { settings, updateSettings, navApps } = useApp();
  const [addr, setAddr] = useState(settings.homeAddress);
  const [saved, setSaved] = useState(false);
  const navId = settings.navId || "waze";

  const driving = navApps.filter((a) => !TRANSIT_IDS.includes(a.id));
  const transit = navApps.filter((a) => TRANSIT_IDS.includes(a.id));

  function save() {
    if (saved) return;
    updateSettings({ homeAddress: addr });
    setSaved(true);
    setTimeout(onClose, 800);
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 20 }}>Settings</div>

      {/* Theme */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 10 }}>APPEARANCE</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["moon", "Dark", true], ["sun", "Light", false]].map(([icon, label, dark]) => {
            const active = settings.isDark === dark;
            return (
              <div key={label} onClick={() => updateSettings({ isDark: dark })}
                style={{ flex: 1, background: active ? `${C.accent}18` : C.card, border: `2px solid ${active ? C.accent : C.border}`, borderRadius: 14, padding: "14px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <Icon name={icon} size={22} color={active ? C.accent : C.soft} />
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? C.accent : C.soft }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Home address */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 10 }}>HOME ADDRESS</div>
        <div style={{ fontSize: 12, color: C.soft, marginBottom: 8 }}>Used to calculate your leave-by time to the airport</div>
        <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Dizengoff St 99, Tel Aviv"
          style={{ width: "100%", background: C.card, border: `1.5px solid ${addr ? C.accent + "60" : C.border}`, borderRadius: 12, padding: "13px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Navigation preference — driving & transit */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 10 }}>PREFERRED NAVIGATION APP</div>
        {[["car", "DRIVING", driving], ["bus", "PUBLIC TRANSIT", transit]].map(([icon, label, apps]) => apps.length > 0 && (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Icon name={icon} size={12} color={C.muted} />
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: C.mono, letterSpacing: 1.5, color: C.muted }}>{label}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {apps.map((a) => (
                <NavTile key={a.id} app={a} active={navId === a.id} onPick={() => updateSettings({ navId: a.id })} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cancellation alerts */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 10 }}>CANCELLATION ALERTS</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 14px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: "rgba(255,58,84,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="siren" size={17} color={C.red} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>Red bell for cancellations</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>The alert bell only turns red for a real cancellation. Everything else stays calm.</div>
          </div>
          <Toggle on={!!settings.notifs.cancellations} onChange={(v) => updateSettings({ notifs: { ...settings.notifs, cancellations: v } })} />
        </div>
      </div>

      {/* Notifications */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 10 }}>NOTIFICATIONS</div>
        {NOTIF_ROWS.map(([key, title, desc], i) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < NOTIF_ROWS.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{desc}</div>
            </div>
            <Toggle on={!!settings.notifs[key]} onChange={(v) => updateSettings({ notifs: { ...settings.notifs, [key]: v } })} />
          </div>
        ))}
      </div>

      {/* Plans & pricing */}
      <div onClick={onOpenPlans} style={{ background: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.22)", borderRadius: 12, padding: "13px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <Icon name="star" size={15} color={C.yellow} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.yellow }}>Plans & Pricing</span>
        <Icon name="chevronRight" size={15} color={C.yellow} />
      </div>

      <div onClick={save} style={{ background: saved ? C.green : `linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius: 14, padding: "15px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 800, fontSize: 15, color: "#000", cursor: "pointer" }}>
        {saved && <Icon name="check" size={16} color="#000" strokeWidth={2.6} />}
        <span>{saved ? "Saved!" : "Save Settings"}</span>
      </div>
    </Sheet>
  );
}
