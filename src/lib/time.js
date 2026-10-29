// Time-zone helpers built on Intl only (no dependencies).

/** "8:00 AM" | "08:00" | "1:00 PM" -> { h, m } (24h) */
export function parseClock(str) {
  const m = String(str || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3] && m[3].toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return { h, m: min };
}

/** Offset (minutes) of `tz` from UTC at instant `date`. */
export function tzOffsetMinutes(date, tz) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map(x => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

/** Wall-clock date ("2026-07-02") + time ("8:00 AM") in `tz` -> Date (UTC instant). */
export function zonedToUtc(dateISO, clock, tz) {
  const t = typeof clock === "string" ? parseClock(clock) : clock;
  if (!t) return null;
  const [y, mo, d] = dateISO.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, t.h, t.m);
  // two passes handle DST edges
  let off = tzOffsetMinutes(new Date(guess), tz);
  let ts = guess - off * 60000;
  const off2 = tzOffsetMinutes(new Date(ts), tz);
  if (off2 !== off) ts = guess - off2 * 60000;
  return new Date(ts);
}

export function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000);
}

export function diffMinutes(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

/** "8:35 AM" in the given zone */
export function fmtClock(date, tz) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(date);
}

/** "Thu, Jul 2" in the given zone */
export function fmtDay(date, tz) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(date);
}

/** Short zone label, e.g. "GMT+3" / "EDT" */
export function tzLabel(date, tz) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(date);
  return (p.find(x => x.type === "timeZoneName") || {}).value || tz;
}

/** 95 -> "1h 35m", 40 -> "40m", -10 -> "-10m" */
export function fmtDuration(mins) {
  const sign = mins < 0 ? "-" : "";
  const a = Math.abs(Math.round(mins));
  const h = Math.floor(a / 60), m = a % 60;
  if (h === 0) return `${sign}${m}m`;
  return `${sign}${h}h${m ? ` ${m}m` : ""}`;
}

/** "YYYY-MM-DD" of `date` in zone */
export function isoDateIn(date, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
