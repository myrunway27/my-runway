// MyRunway theme system.
// Usage: import { C } from "../theme.js" and read C.* inside render.
// App calls applyTheme(isDark) at the top of its render, before children render,
// so every component that re-renders picks up the active palette.

export const DARK = {
  bg: "#04070e", surface: "#090f1c", card: "#0d1525", border: "#13203a",
  accent: "#00c8f0", orange: "#ff5c2b", green: "#00e87a", yellow: "#ffc800",
  red: "#ff3a54", purple: "#a78bfa",
  text: "#d4ecff", muted: "#4e7090", soft: "#7a9ab8",
  mono: "'Cascadia Mono','Consolas','Courier New',monospace", sans: "'Segoe UI',system-ui,-apple-system,sans-serif",
  display: "'Segoe UI Black','Arial Black',system-ui,sans-serif",
  headerBg: "rgba(4,7,14,0.98)",
  isDark: true,
};

export const LIGHT = {
  bg: "#f0f4f8", surface: "#ffffff", card: "#ffffff", border: "#d1dce8",
  accent: "#0077aa", orange: "#e84b1a", green: "#008844", yellow: "#b88a00",
  red: "#cc2233", purple: "#6644bb",
  text: "#0a1628", muted: "#7a90a8", soft: "#3a5070",
  mono: "'Cascadia Mono','Consolas','Courier New',monospace", sans: "'Segoe UI',system-ui,-apple-system,sans-serif",
  display: "'Segoe UI Black','Arial Black',system-ui,sans-serif",
  headerBg: "rgba(240,244,248,0.98)",
  isDark: false,
};

export const C = { ...DARK };

export function applyTheme(isDark) {
  Object.assign(C, isDark ? DARK : LIGHT);
}
