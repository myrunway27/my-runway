// Minimal RFC 5545 calendar export (flights + check-in reminders).
import { schedule, checkinWindow, tzOf } from "./trip.js";
import { airport } from "./airports.js";

const stamp = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = s => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

function fold(line) {
  // fold at 75 octets (approximate by UTF-16 length; content here is ASCII-heavy)
  const out = [];
  let s = line;
  while (s.length > 75) { out.push(s.slice(0, 75)); s = " " + s.slice(75); }
  out.push(s);
  return out.join("\r\n");
}

function vevent({ uid, start, end, summary, location, description, alarmMinsBefore, alarmText, now }) {
  const L = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(summary)}`,
  ];
  if (location) L.push(`LOCATION:${esc(location)}`);
  if (description) L.push(`DESCRIPTION:${esc(description)}`);
  if (alarmMinsBefore !== undefined) {
    L.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(alarmText || summary)}`,
      `TRIGGER:${alarmMinsBefore === 0 ? "PT0M" : `-PT${alarmMinsBefore}M`}`, "END:VALARM");
  }
  L.push("END:VEVENT");
  return L.map(fold).join("\r\n");
}

/**
 * @param flights booked flights
 * @param opts { includeCheckin=true, now=new Date(), leaveBy: {id: Date} }
 */
export function buildTripIcs(flights, opts = {}) {
  const now = opts.now || new Date();
  const events = [];
  for (const f of flights) {
    const s = schedule(f);
    const dep = airport(f.dep);
    const desc = [
      `${f.airline} ${f.iata}  ${f.dep} → ${f.arr}`,
      `Departs ${f.depTime} local (${tzOf(f.dep)}), arrives ${f.arrTime} local (${tzOf(f.arr)})`,
      f.terminal ? `Terminal: ${f.terminal}` : null,
      f.gate && f.gate !== "TBD" ? `Gate: ${f.gate}` : null,
      f.conf ? `Confirmation: ${f.conf}` : null,
      "Times are from your booking. Check My Runway for live changes.",
    ].filter(Boolean).join("\n");
    events.push(vevent({
      uid: `${f.id}-${f.depDate}@myrunwayapp.co`, start: s.dep, end: s.arr, now,
      summary: `Flight ${f.iata} ${f.dep} → ${f.arr}`,
      location: dep ? `${dep.name} (${f.dep})${f.terminal ? `, ${f.terminal}` : ""}` : f.dep,
      description: desc,
      alarmMinsBefore: opts.leaveBy?.[f.id] ? Math.round((s.dep - opts.leaveBy[f.id]) / 60000) : 240,
      alarmText: `Time to leave for ${f.dep}: ${f.iata} departs ${f.depTime}`,
    }));
    if (opts.includeCheckin !== false) {
      const w = checkinWindow(f, now);
      events.push(vevent({
        uid: `${f.id}-${f.depDate}-checkin@myrunwayapp.co`, start: w.opensAt, end: new Date(w.opensAt.getTime() + 15 * 60000), now,
        summary: `Check in: ${f.iata} ${f.dep} → ${f.arr}`,
        description: `Online check-in opens ${w.hours}h before departure.${w.url ? `\n${w.url}` : ""}${f.conf ? `\nConfirmation: ${f.conf}` : ""}`,
        alarmMinsBefore: 0, alarmText: `Check-in is open for ${f.iata}`,
      }));
    }
  }
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//My Runway//Know Before You Go//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    ...events, "END:VCALENDAR", ""].join("\r\n");
}

export function downloadText(filename, text, mime = "text/calendar;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
