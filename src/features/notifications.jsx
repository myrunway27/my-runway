// Notification center — full-screen overlay listing store notifications.
import React, { useEffect } from "react";
import { C } from "../theme.js";
import { useApp } from "../store.jsx";
import { FullScreen } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";

export default function NotificationCenter({ onClose }) {
  const { notifications, markNotifsRead, clearNotifs } = useApp();

  // Mark everything read once on mount (badge clears; dots flip after this render).
  useEffect(() => {
    markNotifsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FullScreen
      title="Notifications"
      onBack={onClose}
      right={
        <span onClick={clearNotifs} style={{ fontSize: 12, fontWeight: 700, color: C.red, cursor: "pointer" }}>
          Clear
        </span>
      }
    >
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "70px 20px", color: C.soft, fontSize: 14, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><Icon name="bellOff" size={40} color={C.soft} /></div>
          All quiet — we'll ping you before the airline does.
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px", marginBottom: 10, display: "flex", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={n.icon} size={22} color={C.soft} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{n.title}</div>
              <div style={{ fontSize: 12.5, color: C.soft, lineHeight: 1.5 }}>{n.body}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontFamily: C.mono, color: C.muted, whiteSpace: "nowrap" }}>{n.time}</span>
              {n.read === false && <div style={{ width: 6, height: 6, borderRadius: 3, background: C.accent }} />}
            </div>
          </div>
        ))
      )}
      <div style={{ textAlign: "center", fontSize: 11, color: C.muted, fontFamily: C.mono, padding: "18px 10px 0", lineHeight: 1.6 }}>
        Alerts arrive 2-90 min before airline apps. That's the whole point.
      </div>
    </FullScreen>
  );
}
