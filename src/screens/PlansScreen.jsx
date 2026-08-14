// Plans & Pricing — full-screen overlay with the Free / Pro / Corporate tiers.
import React from "react";
import { C } from "../theme.js";
import { Icon } from "../components/icons.jsx";

export default function PlansScreen({ onClose }) {
  const tiers = [
    { id: "free", name: "Free", price: "$0", period: "forever", color: C.soft, bg: "rgba(78,112,144,0.08)", border: "rgba(78,112,144,0.2)", tag: null,
      features: ["Track up to 2 flights", "Basic status updates", "Leave-by time", "Share 1 trip link"], missing: ["Family tracking", "Unlimited flights", "Corporate dashboard", "Priority support"],
      cta: "Current Plan", ctaStyle: { background: C.surface, color: C.soft, border: `1px solid ${C.border}` } },
    { id: "pro", name: "Pro", price: "$19.99", period: "per year", color: C.accent, bg: "rgba(0,200,240,0.08)", border: "rgba(0,200,240,0.28)", tag: "MOST POPULAR",
      features: ["Unlimited flight tracking", "Family tracker (5 members)", "Unlimited share links", "AI delay explanations", "Delay forecasts with reasons", "Live route map", "Weather alerts", "VIP lounge finder", "Priority support"], missing: [],
      cta: "Upgrade to Pro →", ctaStyle: { background: `linear-gradient(135deg,${C.accent},#007aaa)`, color: "#000" } },
    { id: "corporate", name: "Corporate", price: "$9", period: "per seat/month", color: C.purple, bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.28)", tag: "FOR TEAMS",
      features: ["Everything in Pro", "Admin dashboard", "All employee flights", "Manager delay alerts", "CSV bulk import", "SSO login", "Expense integration", "Dedicated account manager"], missing: [],
      cta: "Contact Sales →", ctaStyle: { background: `linear-gradient(135deg,${C.purple},#7c3aed)`, color: "#fff" } },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, overflowY: "auto" }}>
      <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", position: "sticky", top: 0, zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 480, margin: "0 auto" }}>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: C.accent }}>←</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Plans & Pricing</div>
            <div style={{ fontSize: 12, color: C.soft }}>Choose the right plan</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 14px 100px", maxWidth: 480, margin: "0 auto" }}>
        {tiers.map((t) => (
          <div key={t.id} style={{ background: t.bg, borderRadius: 20, border: `2px solid ${t.border}`, padding: "20px 16px", marginBottom: 16, position: "relative" }}>
            {t.tag && <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: t.color, borderRadius: 20, padding: "4px 16px", fontSize: 11, fontWeight: 800, color: "#000", fontFamily: C.mono, letterSpacing: 1, whiteSpace: "nowrap" }}>{t.tag}</div>}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, marginTop: t.tag ? 8 : 0 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: t.color, marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: C.soft }}>{t.id === "corporate" ? "Billed annually · min 5 seats" : "Billed annually"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.text, fontFamily: C.mono, lineHeight: 1 }}>{t.price}</div>
                <div style={{ fontSize: 12, color: C.soft }}>{t.period}</div>
              </div>
            </div>
            {t.features.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <Icon name="check" size={15} color={t.color} />
                <span style={{ fontSize: 14, color: C.text }}>{f}</span>
              </div>
            ))}
            {t.missing.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <Icon name="x" size={15} color={C.muted} />
                <span style={{ fontSize: 14, color: C.muted }}>{f}</span>
              </div>
            ))}
            <div
              onClick={() => alert(t.id === "free" ? "You're already on the free plan!" : t.id === "pro" ? "Opening checkout for Pro plan ($19.99/yr)..." : "Our sales team will contact you within 24 hours!")}
              style={{ ...t.ctaStyle, borderRadius: 13, padding: "15px 0", textAlign: "center", fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 18 }}
            >
              {t.cta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
