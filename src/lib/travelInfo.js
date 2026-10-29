// Static travel helpers: US customs (CBP Mobile Passport Control) and "Can I bring this?".
import { airport } from "./airports.js";

export const CBP_MPC_URL = "https://www.cbp.gov/travel/us-citizens/mobile-passport-control";
export const TSA_WHAT_CAN_I_BRING_URL = "https://www.tsa.gov/travel/security-screening/whatcanibring/all";

/** International arrival into the US (departure outside the US). */
export function isUsInternationalArrival(f) {
  const d = airport(f?.dep), a = airport(f?.arr);
  return !!(d && a && a.country === "US" && d.country !== "US");
}

// General TSA guidance (US screening). carryOn / checked: "yes" | "no" | "limits".
export const BRING_ITEMS = [
  { item: "Liquids, gels, aerosols", carryOn: "limits", checked: "yes", note: "3.4 oz (100 ml) per container, all in one quart-size bag." },
  { item: "Baby formula, breast milk, baby food", carryOn: "yes", checked: "yes", note: "Over 3.4 oz allowed in reasonable amounts. Tell the officer." },
  { item: "Laptop / tablet", carryOn: "yes", checked: "limits", note: "Carry-on recommended. Devices may need to come out for screening." },
  { item: "Power bank / spare lithium battery", carryOn: "yes", checked: "no", note: "Carry-on only. Over 100 Wh needs airline approval." },
  { item: "E-cigarettes / vapes", carryOn: "yes", checked: "no", note: "Carry-on only. Never charge on board." },
  { item: "Lighter", carryOn: "limits", checked: "limits", note: "One common lighter on your person. Torch lighters not allowed." },
  { item: "Medication (pills)", carryOn: "yes", checked: "yes", note: "Keep essentials in your carry-on." },
  { item: "Liquid medication", carryOn: "yes", checked: "yes", note: "Over 3.4 oz allowed if declared at screening." },
  { item: "Razor (disposable / cartridge)", carryOn: "yes", checked: "yes", note: "Loose safety razor blades: checked only." },
  { item: "Scissors", carryOn: "limits", checked: "yes", note: "Blades under 4 inches from the pivot are OK in carry-on." },
  { item: "Knives", carryOn: "no", checked: "yes", note: "Sheathed or securely wrapped in checked bags. Plastic or round-bladed butter knives OK." },
  { item: "Tools (over 7 in.)", carryOn: "no", checked: "yes", note: "Screwdrivers and wrenches under 7 inches OK in carry-on." },
  { item: "Sports bats, clubs, sticks", carryOn: "no", checked: "yes", note: "" },
  { item: "Umbrella", carryOn: "yes", checked: "yes", note: "" },
  { item: "Food (solid)", carryOn: "yes", checked: "yes", note: "Check destination customs rules for fruit, meat and plants." },
  { item: "Peanut butter, jam, yogurt", carryOn: "limits", checked: "yes", note: "Treated as liquids/gels: 3.4 oz rule." },
  { item: "Alcohol (under 70% ABV)", carryOn: "limits", checked: "limits", note: "Carry-on: 3.4 oz. Checked: up to 5 L per person, 24–70% ABV, in retail packaging." },
  { item: "Hair straightener / curling iron", carryOn: "yes", checked: "yes", note: "Cordless butane ones: carry-on only." },
  { item: "Aerosol sunscreen / hairspray", carryOn: "limits", checked: "limits", note: "Toiletries only, 3.4 oz in carry-on." },
  { item: "Firearms / ammunition", carryOn: "no", checked: "limits", note: "Declared, unloaded, in a locked hard case. Airline and local laws apply." },
  { item: "Fireworks, flammable liquids, bear spray", carryOn: "no", checked: "no", note: "" },
  { item: "Snow globe", carryOn: "limits", checked: "yes", note: "Only if smaller than a tennis ball and fits in the liquids bag." },
  { item: "CPAP / medical devices", carryOn: "yes", checked: "yes", note: "Medical devices don't count toward carry-on allowance on most airlines." },
  { item: "Car seat / stroller", carryOn: "yes", checked: "yes", note: "Usually gate-checked free. Check with your airline." },
];

export function searchItems(q, items = BRING_ITEMS) {
  const t = String(q || "").trim().toLowerCase();
  if (!t) return items;
  const words = t.split(/\s+/);
  return items.filter(x => { const hay = `${x.item} ${x.note}`.toLowerCase(); return words.every(w => hay.includes(w)); });
}
