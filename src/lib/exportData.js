// Data export: trips as JSON or CSV, downloaded with a Blob (no server).

export const CSV_COLUMNS = ["id", "flight", "airline", "from", "to", "depDate", "depTime", "arrDate", "arrTime", "aircraft", "terminal", "gate", "confirmation", "trip", "liveStatus", "depDelayMins", "arrDelayMins"];

/** RFC 4180 cell: quote if it has a comma, quote, CR or LF; double inner quotes. Neutralise spreadsheet formulas. */
export function csvCell(v) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s; // CSV injection guard
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows, columns) {
  const lines = [columns.map(csvCell).join(",")];
  for (const r of rows) lines.push(columns.map(c => csvCell(r[c])).join(","));
  return lines.join("\r\n") + "\r\n";
}

export function flightRow(f, live) {
  return {
    id: f.id, flight: f.iata, airline: f.airline, from: f.dep, to: f.arr,
    depDate: f.depDate, depTime: f.depTime, arrDate: f.arrDate || f.depDate, arrTime: f.arrTime,
    aircraft: f.aircraft, terminal: f.terminal, gate: f.gate, confirmation: f.conf, trip: f.trip,
    liveStatus: live?.status || "", depDelayMins: live?.depDelayMins ?? "", arrDelayMins: live?.arrDelayMins ?? "",
  };
}

export function buildTripsCsv(flights, getLive = () => null) {
  return toCsv(flights.map(f => flightRow(f, getLive(f.id))), CSV_COLUMNS);
}

export function buildTripsJson(flights, { trip, settings, getLive = () => null, now = new Date() } = {}) {
  return JSON.stringify({
    app: "My Runway", version: 1, exportedAt: now.toISOString(), trip: trip || null, settings: settings || {},
    flights: flights.map(f => ({ ...f, live: getLive(f.id) || null })),
  }, null, 2);
}

export function downloadBlob(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
