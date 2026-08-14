import React, { useState } from "react";
import { C } from "../theme.js";
import { sc } from "../lib/utils.js";
import { useApp } from "../store.jsx";
import { Icon } from "../components/icons.jsx";

// Family tracker — live list from the store (sim updates status/eta/progress).
export default function FamilyScreen() {
  const { family, addFamily, removeFamily } = useApp();
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFlight, setNewFlight] = useState("");

  function addPerson() {
    if (!newName.trim() || !newFlight.trim()) return;
    addFamily(newName.trim(), newFlight.trim());
    setNewName(""); setNewFlight(""); setShowAdd(false);
  }

  return (
    <div style={{ padding: "14px 14px 100px" }}>
      <div onClick={() => setShowAdd((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, borderRadius: 16, border: `1px dashed ${C.border}`, padding: "16px", marginBottom: 14, cursor: "pointer" }}>
        <div style={{ width: 46, height: 46, borderRadius: 23, background: C.surface, border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.soft }}>+</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.soft }}>Add family member</div>
          <div style={{ fontSize: 13, color: C.muted }}>Track their flights alongside yours</div>
        </div>
      </div>

      {showAdd && (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.accent}40`, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Add a person</div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name (e.g. Mom)" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
          <input value={newFlight} onChange={(e) => setNewFlight(e.target.value)} placeholder="Flight number (e.g. AA 100)" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12, fontFamily: C.mono }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={addPerson} style={{ flex: 1, background: `linear-gradient(135deg,${C.accent},#007aaa)`, borderRadius: 10, padding: "11px 0", textAlign: "center", fontWeight: 800, fontSize: 14, color: "#000", cursor: "pointer" }}>Add</div>
            <div onClick={() => setShowAdd(false)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 0", textAlign: "center", fontWeight: 700, fontSize: 14, color: C.soft, cursor: "pointer" }}>Cancel</div>
          </div>
        </div>
      )}

      {family.map((p) => {
        const s = sc(p.status);
        const isSel = sel === p.id;
        const inFlight = p.progress > 0 && p.progress < 100;
        return (
          <div key={p.id} onClick={() => setSel(isSel ? null : p.id)} style={{ background: C.card, borderRadius: 18, border: `1px solid ${isSel ? p.color + "55" : C.border}`, padding: "16px", marginBottom: 10, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isSel ? 14 : 0 }}>
              <div style={{ width: 50, height: 50, borderRadius: 25, background: `${p.color}22`, border: `2px solid ${p.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: p.color, fontFamily: C.mono, flexShrink: 0 }}>{p.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 13, color: C.soft, fontFamily: C.mono }}>{p.flight} · {p.dep} → {p.arr}</div>
                {inFlight && (
                  <div style={{ height: 3, borderRadius: 2, background: C.surface, marginTop: 7, overflow: "hidden" }}>
                    <div style={{ width: `${p.progress}%`, height: "100%", borderRadius: 2, background: p.color, transition: "width 1s" }} />
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ background: s.bg, border: `1px solid ${s.br}`, borderRadius: 20, padding: "4px 11px", fontSize: 11, color: s.c, fontWeight: 700, fontFamily: C.mono, marginBottom: 4 }}>{p.status}</div>
                <div style={{ fontSize: 12, color: C.muted }}>ETA {p.eta}</div>
              </div>
            </div>
            {isSel && (
              <div style={{ display: "flex", gap: 8 }}>
                <div onClick={(e) => { e.stopPropagation(); alert(`Live tracking link for ${p.name}:\nmyrunwayapp.co/t/abc123k\n\nThey can open this in any browser — no app needed!`); }} style={{ flex: 1, background: "rgba(0,200,240,0.08)", border: "1px solid rgba(0,200,240,0.2)", borderRadius: 11, padding: "13px 0", textAlign: "center", cursor: "pointer" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: C.accent }}><Icon name="link" size={14} color={C.accent} />Send Live Link</span>
                </div>
                <div onClick={(e) => { e.stopPropagation(); alert(`Opening Google Maps for pickup route to ${p.arr} airport...`); }} style={{ flex: 1, background: "rgba(0,232,122,0.08)", border: "1px solid rgba(0,232,122,0.2)", borderRadius: 11, padding: "13px 0", textAlign: "center", cursor: "pointer" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: C.green }}><Icon name="car" size={14} color={C.green} />Pickup Route</span>
                </div>
                <div onClick={(e) => { e.stopPropagation(); removeFamily(p.id); setSel(null); }} style={{ background: "rgba(255,58,84,0.08)", border: "1px solid rgba(255,58,84,0.2)", borderRadius: 11, padding: "13px 14px", textAlign: "center", cursor: "pointer" }}>
                  <span style={{ display: "inline-flex", alignItems: "center" }}><Icon name="trash" size={14} color={C.red} /></span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
