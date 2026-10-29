// EU261 / UK261 compensation estimate. Pure, offline. An estimate, not legal advice.
import { airport } from "./airports.js";

// EU 27 + EEA (IS, LI, NO) + Switzerland + UK (UK261 mirrors EU261, in GBP in reality).
export const EU_COVERED = new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","CH","GB"]);

// IATA codes of common EU/EEA/CH/UK-licensed carriers ("community carriers").
export const EU_CARRIERS = new Set(["LX","LH","OS","SN","EW","WK","AF","KL","HV","BA","VS","IB","I2","VY","UX","AZ","TP","SK","DY","D8","AY","EI","FR","RK","U2","EC","W6","W4","LO","OK","A3","BT","RO","OU","JU","LG","FI","WF","LS","BY","EN","4Y","DE","X3","HF"]);

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

/** Coverage: departing an EU/EEA/CH/UK airport (any airline), or arriving there on an EU/UK carrier. */
export function coverage({ dep, arr, carrier }) {
  const dc = countryOf(dep), ac = countryOf(arr);
  if (!dc || !ac) return { covered: null, reason: "Unknown airport country" };
  if (EU_COVERED.has(dc)) return { covered: true, reason: `Departs ${dep}, an EU261/UK261 airport` };
  if (EU_COVERED.has(ac) && EU_CARRIERS.has(carrier)) return { covered: true, reason: `Arrives ${arr} on an EU/UK carrier (${carrier})` };
  if (EU_COVERED.has(ac)) return { covered: false, reason: `Arrives in Europe, but ${carrier} is not an EU/UK carrier` };
  return { covered: false, reason: "Neither departs from nor flies into Europe on an EU/UK carrier" };
}

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
  const intraEu = EU_COVERED.has(countryOf(dep)) && EU_COVERED.has(countryOf(arr));
  const amount = amountFor(km, intraEu);
  const reasons = [cov.reason], caveats = [];
  const base = { covered: cov.covered, km, amountEur: null, range: null, reasons, caveats, eligible: false };
  if (!cov.covered) return { ...base, eligible: cov.covered === null ? null : false };

  let trigger = false, maybe = false;
  if (cancelled) {
    if (noticeDays === null || noticeDays === undefined) { maybe = true; reasons.push("Cancelled. Eligible if you were told less than 14 days before departure"); }
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
  return { ...base, eligible: trigger ? true : null, amountEur: amount, range: amount === null ? [250, 600] : null };
}
