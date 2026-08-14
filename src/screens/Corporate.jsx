// Corporate suite — dashboard, employee detail, export report, and company
// settings, all in one full-screen overlay stack. Employees come live from
// the store so progress bars advance with the sim.
import React, { useState } from "react";
import { C } from "../theme.js";
import { sc } from "../lib/utils.js";
import { useApp } from "../store.jsx";
import { Icon } from "../components/icons.jsx";

function StatusPill({ status }) {
  const s = sc(status);
  return <span style={{ background: s.bg, border: `1px solid ${s.br}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, color: s.c, fontWeight: 700, fontFamily: C.mono, whiteSpace: "nowrap" }}>{status}</span>;
}

function CorporateSettings({ onBack }) {
  const [companyName, setCompanyName] = useState("Acme Corp");
  const [managerEmail, setManagerEmail] = useState("manager@acme.com");
  const [alertDelays, setAlertDelays] = useState(true);
  const [alertCancels, setAlertCancels] = useState(true);
  const [alertGates, setAlertGates] = useState(false);
  const [saved, setSaved] = useState(false);
  function save() { setSaved(true); setTimeout(() => { setSaved(false); onBack(); }, 1500); }
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 55, overflowY: "auto" }}>
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 17, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: C.accent }}>←</div>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Company Settings</span>
      </div>
      <div style={{ padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 8 }}>COMPANY NAME</div>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 8 }}>MANAGER ALERT EMAIL</div>
          <div style={{ fontSize: 12, color: C.soft, marginBottom: 8 }}>Flight alerts are sent to this address</div>
          <input value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 12 }}>ALERT TYPES</div>
          {[["alertDelays", alertDelays, setAlertDelays, "Flight Delays", "Notify when an employee's flight is delayed"],
            ["alertCancels", alertCancels, setAlertCancels, "Cancellations", "Immediate alert when a flight is cancelled"],
            ["alertGates", alertGates, setAlertGates, "Gate Changes", "Notify when gate assignment changes"]].map(([key, val, setter, title, desc]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{desc}</div>
              </div>
              <div onClick={() => setter((v) => !v)} style={{ width: 44, height: 26, borderRadius: 13, background: val ? C.purple : "#2a3f5f", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 3, left: val ? 21 : 3, transition: "left 0.2s" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono, letterSpacing: 2, marginBottom: 12 }}>TEAM MANAGEMENT</div>
          {[["mail", "Invite Team Members", "Send invites via email"], ["upload", "Import from CSV", "Bulk add employees with flight data"], ["lock", "SSO Configuration", "Set up Google/Microsoft single sign-on"]].map(([icon, title, desc]) => (
            <div key={title} onClick={() => alert(`${title}: Coming soon! This will be available in the Pro launch.`)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 8, cursor: "pointer" }}>
              <Icon name={icon} size={20} color={C.soft} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{desc}</div>
              </div>
              <span style={{ fontSize: 16, color: C.muted }}>›</span>
            </div>
          ))}
        </div>
        <div onClick={save} style={{ background: saved ? C.green : `linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius: 14, padding: "15px 0", textAlign: "center", fontWeight: 800, fontSize: 15, color: "#fff", cursor: "pointer" }}>
          {saved ? <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="check" size={16} color="#fff" strokeWidth={2.6} />Saved!</span> : "Save Settings"}
        </div>
      </div>
    </div>
  );
}

function ExportView({ employees, onBack }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 55, overflowY: "auto" }}>
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 17, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: C.accent }}>←</div>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Export Report</span>
      </div>
      <div style={{ padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>April 2026 Travel Report</div>
          <div style={{ fontSize: 13, color: C.soft, marginBottom: 16 }}>6 employees · 1 cancellation · 2 delays</div>
          {employees.map((emp) => (
            <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{emp.name}</div>
                <div style={{ fontSize: 11, color: C.soft, fontFamily: C.mono }}>{emp.flight} · {emp.dep}→{emp.arr}</div>
              </div>
              <StatusPill status={emp.status} />
            </div>
          ))}
        </div>
        <div onClick={() => alert("Downloading CSV...\n\nIn the live app this downloads a spreadsheet with all employee travel data.")} style={{ background: `linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius: 14, padding: "15px 0", textAlign: "center", fontWeight: 800, fontSize: 15, color: "#000", cursor: "pointer" }}>
          Download CSV ↓
        </div>
      </div>
    </div>
  );
}

function EmployeeDetail({ emp, onBack }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, overflowY: "auto" }}>
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 17, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: C.accent }}>←</div>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{emp.name}</span>
      </div>
      <div style={{ padding: "16px 16px 100px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: `${emp.color}22`, border: `2px solid ${emp.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: emp.color, fontFamily: C.mono }}>{emp.avatar}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{emp.name}</div>
            <div style={{ fontSize: 13, color: C.soft }}>{emp.dept} Department</div>
            <div style={{ fontSize: 12, color: C.muted }}>{emp.phone}</div>
          </div>
        </div>
        <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: C.mono, flex: 1 }}>{emp.flight}</div>
            <StatusPill status={emp.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: C.mono }}>{emp.dep}</div>
            <div style={{ flex: 1, height: 2, background: C.border, borderRadius: 1, position: "relative" }}>
              {emp.progress > 0 && <div style={{ height: 2, width: `${emp.progress}%`, background: `linear-gradient(90deg,${C.accent},${C.orange})`, borderRadius: 1 }} />}
              <span style={{ position: "absolute", top: "50%", left: `${Math.max(5, Math.min(90, emp.progress))}%`, transform: "translate(-50%,-50%)", display: "inline-flex", alignItems: "center" }}><Icon name="plane" size={16} color={C.accent} /></span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: C.mono }}>{emp.arr}</div>
          </div>
          {[["ETA", emp.eta], ["Gate", emp.gate], ["Delay", emp.delay > 0 ? `+${emp.delay} min` : "None"]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.soft }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: l === "Delay" && emp.delay > 0 ? C.yellow : C.text, fontFamily: C.mono }}>{v}</span>
            </div>
          ))}
        </div>
        {emp.cancelled && (
          <div style={{ background: "rgba(255,58,84,0.08)", border: "1px solid rgba(255,58,84,0.25)", borderRadius: 14, padding: "14px", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.red, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Icon name="warning" size={14} color={C.red} />Flight Cancelled</div>
            <div style={{ fontSize: 13, color: C.soft, marginBottom: 10 }}>This employee needs to be rebooked. Their travel manager has been notified.</div>
            <div onClick={() => alert("Opening rebooking flow for Lisa Park...\n\nIn the live app this connects to your corporate travel tool.")} style={{ background: `linear-gradient(135deg,${C.orange},#cc3300)`, borderRadius: 11, padding: "12px 0", textAlign: "center", fontWeight: 800, fontSize: 13, color: "#fff", cursor: "pointer" }}>Rebook Flight →</div>
          </div>
        )}
        {emp.delay > 0 && (
          <div style={{ background: "rgba(255,200,0,0.07)", border: "1px solid rgba(255,200,0,0.22)", borderRadius: 14, padding: "14px", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.yellow, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={14} color={C.yellow} />Delayed {emp.delay} min</div>
            <div style={{ fontSize: 13, color: C.soft, marginBottom: 10 }}>Downstream meetings may need to be rescheduled.</div>
            <div onClick={() => alert(`Sending delay notification to ${emp.name}'s manager...`)} style={{ background: `linear-gradient(135deg,${C.yellow},#cc9900)`, borderRadius: 11, padding: "12px 0", textAlign: "center", fontWeight: 800, fontSize: 13, color: "#000", cursor: "pointer" }}>Notify Manager →</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          {[["phone", "Call", () => alert(`Calling ${emp.name} at ${emp.phone}...`)], ["message", "Message", () => alert(`Opening iMessage to ${emp.name}...`)], ["link", "Track", () => alert(`Live tracking:\nmyrunwayapp.co/t/${emp.id}abc\n\nShare this with anyone picking up ${emp.name}.`)]].map(([icon, label, fn]) => (
            <div key={label} onClick={fn} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 0", textAlign: "center", cursor: "pointer" }}>
              <div style={{ marginBottom: 3, display: "flex", justifyContent: "center" }}><Icon name={icon} size={20} color={C.soft} /></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.soft }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CorporateDashboard({ onClose }) {
  const { employees } = useApp();
  const [filter, setFilter] = useState("all");
  const [selEmpId, setSelEmpId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const filtered = filter === "all" ? employees : filter === "issue" ? employees.filter((e) => e.delay > 0 || e.cancelled) : employees.filter((e) => e.dept === filter);
  const delayed = employees.filter((e) => e.delay > 0).length;
  const cancelled = employees.filter((e) => e.cancelled).length;
  const inAir = employees.filter((e) => e.status === "Departed" || e.status === "In Air").length;
  const onTime = employees.filter((e) => e.status === "On Time" || e.status === "Landed").length;

  if (showSettings) return <CorporateSettings onBack={() => setShowSettings(false)} />;

  if (showExport) return <ExportView employees={employees} onBack={() => setShowExport(false)} />;

  const selEmp = selEmpId != null ? employees.find((e) => e.id === selEmpId) : null;
  if (selEmp) return <EmployeeDetail emp={selEmp} onBack={() => setSelEmpId(null)} />;

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, overflowY: "auto" }}>
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0 }}>
        <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: C.accent }}>←</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Corporate Dashboard</div>
          <div style={{ fontSize: 12, color: C.soft }}>Acme Corp · {employees.length} traveling today</div>
        </div>
        <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: C.purple, fontFamily: C.mono }}>CORP</div>
      </div>
      <div style={{ padding: "14px 14px 100px", maxWidth: 480, margin: "0 auto" }}>
        {(delayed > 0 || cancelled > 0) && (
          <div style={{ background: "rgba(255,58,84,0.08)", border: "1px solid rgba(255,58,84,0.25)", borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <Icon name="siren" size={20} color={C.red} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 1 }}>Action needed</div>
              <div style={{ fontSize: 12, color: C.soft }}>{cancelled > 0 ? `${cancelled} cancellation · ` : ""}{delayed > 0 ? `${delayed} delayed` : ""} · Tap to review</div>
            </div>
            <div onClick={() => setFilter("issue")} style={{ background: C.red, borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>Review</span>
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[["plane", "In Air", inAir, C.accent], ["check", "On Time", onTime, C.green], ["clock", "Delayed", delayed, C.yellow], ["x", "Cancelled", cancelled, C.red]].map(([icon, label, val, color]) => (
            <div key={label} style={{ background: `${color}12`, borderRadius: 14, border: `1px solid ${color}30`, padding: "14px 6px", textAlign: "center" }}>
              <div style={{ marginBottom: 5, display: "flex", justifyContent: "center" }}><Icon name={icon} size={22} color={color} /></div>
              <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: C.mono, lineHeight: 1, marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 10, color: C.soft, fontFamily: C.mono, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {[["all", "All"], ["issue", "Issues", "siren"], ["Sales", "Sales"], ["Eng", "Eng"], ["Exec", "Exec"], ["HR", "HR"]].map(([id, label, icon]) => (
            <div key={id} onClick={() => setFilter(id)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: C.mono, background: filter === id ? "rgba(0,200,240,0.12)" : "transparent", color: filter === id ? C.accent : C.soft, border: `1px solid ${filter === id ? "rgba(0,200,240,0.3)" : C.border}`, display: "flex", alignItems: "center", gap: 5 }}>
              {icon && <Icon name={icon} size={11} color={filter === id ? C.accent : C.soft} />}
              {label}
            </div>
          ))}
        </div>
        {filtered.map((emp) => {
          const s = sc(emp.status);
          const hasIssue = emp.delay > 0 || emp.cancelled;
          return (
            <div key={emp.id} onClick={() => setSelEmpId(emp.id)} style={{ background: C.card, borderRadius: 16, border: `1px solid ${hasIssue ? (emp.cancelled ? "rgba(255,58,84,0.25)" : "rgba(255,200,0,0.2)") : C.border}`, padding: "14px 16px", marginBottom: 10, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: `${emp.color}18`, border: `2px solid ${emp.color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: emp.color, fontFamily: C.mono, flexShrink: 0 }}>{emp.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{emp.name}</span>
                    <span style={{ fontSize: 10, color: C.muted, background: C.surface, borderRadius: 5, padding: "2px 7px", fontFamily: C.mono, border: `1px solid ${C.border}` }}>{emp.dept}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.soft, fontFamily: C.mono }}>{emp.flight} · {emp.dep} → {emp.arr}</div>
                  {emp.progress > 0 && emp.progress < 100 && (
                    <div style={{ height: 3, background: C.surface, borderRadius: 2, overflow: "hidden", marginTop: 8, maxWidth: 180 }}>
                      <div style={{ height: 3, width: `${emp.progress}%`, background: `linear-gradient(90deg,${emp.color},${C.accent})`, borderRadius: 2 }} />
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ background: s.bg, border: `1px solid ${s.br}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: s.c, fontWeight: 700, fontFamily: C.mono, marginBottom: 4 }}>{emp.status}</div>
                  {emp.delay > 0 && <div style={{ fontSize: 11, color: C.yellow, fontFamily: C.mono, fontWeight: 700 }}>+{emp.delay}m delay</div>}
                  {emp.cancelled && <div style={{ fontSize: 10, color: C.red, fontWeight: 600 }}>Needs rebooking</div>}
                  {!emp.delay && !emp.cancelled && <div style={{ fontSize: 11, color: C.muted }}>{emp.eta}</div>}
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          <div onClick={() => setShowExport(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><Icon name="chart" size={24} color={C.soft} /></div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Export Report</div>
            <div style={{ fontSize: 11, color: C.muted }}>Download as CSV</div>
          </div>
          <div onClick={() => setShowSettings(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><Icon name="gear" size={24} color={C.soft} /></div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Settings</div>
            <div style={{ fontSize: 11, color: C.muted }}>Alerts, team, SSO</div>
          </div>
        </div>
      </div>
    </div>
  );
}
