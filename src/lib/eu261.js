// EU261 / UK261 compensation estimate. Pure, offline. An estimate, not legal advice.
import { airport } from "./airports.js";

// EU 27 + EEA (IS, LI, NO) + Switzerland + UK (UK261 mirrors EU261, in GBP in reality).
export const EU_COVERED = new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","CH","GB"]);

// IATA codes of common EU/EEA/CH/UK-licensed carriers ("community carriers").
// UK carriers are not EU community carriers after Brexit; they count for UK261 instead.
export const EU_CARRIERS = new Set(["LX","LH","OS","SN","EW","WK","AF","KL","HV","IB","I2","VY","UX","AZ","TP","SK","DY","D8","AY","EI","FR","RK","U2","EC","W6","W4","LO","OK","A3","BT","RO","OU","JU","LG","FI","WF","EN","4Y","DE","X3","HF"]);

// UK-licensed carriers (UK261 applies to them flying into the UK).
export const UK_CARRIERS = new Set(["BA","VS","U2","LS","BY","LM","T3","W9","RK","MT","ZT"]);

// UK261 (retained Reg. 261/2004) amounts in GBP, same distance bands as EU261.
export const UK_AMOUNTS = { 250: 220, 400: 350, 600: 520 };

const toRad = d => (d * Math.PI) / 180;
/** Great-circle (haversine) distance in km, or null if either airport has no coordinates. */
export function greatCircleKm(a, b) {
  const A = typeof a === "string" ? airport(a) : a, B = typeof b === "string" ? airport(b) : b;
  if (!A || !B || !Number.isFinite(A.lat) || !Number.isFinite(B.lat)) return null;
  const R = 6371;
  const dLat = toRad(B.lat - A.lat), dLon = toRad(B.lon - A.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(A.lat)) * Math.cos(toRad(B.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const countryOf = code => airport(code)?.country || null;
const isUk = c => c === "GB";
const isEu = c => !!c && c !== "GB" && EU_COVERED.has(c);

/**
 * Coverage + regime. UK261 (GBP): departs the UK, or arrives in the UK on a UK carrier.
 * EU261 (EUR): departs EU/EEA/CH, or arrives there on an EU/EEA/CH carrier.
 */
export function coverage({ dep, arr, carrier }) {
  const dc = countryOf(dep), ac = countryOf(arr);
  if (!dc || !ac) return { covered: null, scheme: null, reason: "Unknown airport country" };
  if (isUk(dc)) return { covered: true, scheme: "UK261", reason: `Departs ${dep}, a UK airport (UK261)` };
  if (isEu(dc)) return { covered: true, scheme: "EU261", reason: `Departs ${dep}, an EU261 airport` };
  if (isUk(ac) && UK_CARRIERS.has(carrier)) return { covered: true, scheme: "UK261", reason: `Arrives ${arr} on a UK carrier (${carrier}, UK261)` };
  if (isEu(ac) && EU_CARRIERS.has(carrier)) return { covered: true, scheme: "EU261", reason: `Arrives ${arr} on an EU carrier (${carrier})` };
  if (isUk(ac)) return { covered: false, scheme: null, reason: `Arrives in the UK, but ${carrier} is not a UK carrier` };
  if (isEu(ac)) return { covered: false, scheme: null, reason: `Arrives in Europe, but ${carrier} is not an EU carrier` };
  return { covered: false, scheme: null, reason: "Neither departs from nor flies into Europe/UK on a European carrier" };
}

/** Whole days between when the cancellation was announced and the scheduled departure date (both "YYYY-MM-DD"). */
export function noticeDaysBetween(announced, depDate) {
  const a = Date.parse(`${announced}T00:00:00Z`), d = Date.parse(`${depDate}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(d)) return null;
  return Math.max(0, Math.round((d - a) / 86400000));
}

/** Format a compensation amount, e.g. "€400" / "£350". */
export const fmtComp = (amount, currency) => `${currency === "GBP" ? "£" : "€"}${amount}`;

/** Band by distance: 250 (<=1500), 400 (1500-3500, or any intra-EU >1500), 600 (>3500). */
export function amountFor(km, intraEu) {
  if (km === null || km === undefined) return null;
  if (km <= 1500) return 250;
  if (intraEu || km <= 3500) return 400;
  return 600;
}

/**
 * @param {{ dep, arr, carrier, arrDelayMins?:number, cancelled?:boolean, noticeDays?:number|null }} p
 * @returns {{ eligible:boolean|null, covered:boolean|null, amountEur:number|null, range:[number,number]|null, km:number|null, reasons:string[], caveats:string[] }}
 */
export function eu261Estimate({ dep, arr, carrier, arrDelayMins = 0, cancelled = false, noticeDays = null }) {
  const cov = coverage({ dep, arr, carrier });
  const km = greatCircleKm(dep, arr);
  const uk = cov.scheme === "UK261";
  const dc = countryOf(dep), ac = countryOf(arr);
  const intraEu = uk ? isUk(dc) && isUk(ac) : isEu(dc) && isEu(ac);
  const band = amountFor(km, intraEu);
  const amount = band === null ? null : uk ? UK_AMOUNTS[band] : band;
  const currency = uk ? "GBP" : "EUR";
  const reasons = [cov.reason], caveats = [];
  const base = { covered: cov.covered, scheme: cov.scheme, currency, amount: null, km, amountEur: null, range: null, reasons, caveats, eligible: false };
  if (!cov.covered) return { ...base, eligible: cov.covered === null ? null : false };

  let trigger = false, maybe = false;
  if (cancelled) {
    if (noticeDays === null || noticeDays === undefined) { maybe = true; reasons.push("Cancelled. Possibly owed: eligible if you were told less than 14 days before departure"); }
    else if (noticeDays < 14) { trigger = true; reasons.push(`Cancelled with ${noticeDays} days' notice (under 14)`); }
    else reasons.push(`Cancelled with ${noticeDays} days' notice (14+ days: no compensation)`);
    caveats.push("A reroute that gets you in close to the original times can reduce or remove compensation.");
  } else if (arrDelayMins >= 180) {
    trigger = true; reasons.push(`Arrived ${Math.floor(arrDelayMins / 60)}h ${arrDelayMins % 60}m late (3h+ at arrival)`);
    if (km && km > 3500 && !intraEu && arrDelayMins < 240) caveats.push("Over 3,500 km with a 3–4h delay, the airline may cut this by 50%.");
  } else {
    reasons.push(arrDelayMins > 0 ? `Arrival delay ${arrDelayMins} min (under 3h)` : "No qualifying delay");
  }
  caveats.push("No compensation for extraordinary circumstances (e.g. weather, security, air traffic control strikes).");
  if (km === null) caveats.push("Distance unknown for this route, so the amount is shown as a range.");
  if (!trigger && !maybe) return base;
  const range = amount === null ? (uk ? [220, 520] : [250, 600]) : null;
  return { ...base, eligible: trigger ? true : null, amount, amountEur: uk ? null : amount, range };
}
