// Headless click-through at mobile + desktop widths. Captures console errors and screenshots.
// Usage: dev server on :5173, then `node e2e/smoke.mjs [tag]`
import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:5173";
const TAG = process.argv[2] || "run";
const OUT = "screenshots";
const errors = [];
const sizes = [["mobile", { width: 390, height: 844 }, 3], ["desktop", { width: 1280, height: 800 }, 1]];

async function shot(page, name) { await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/${TAG}-${name}.png`, fullPage: false }); }
async function full(page, name) { await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/${TAG}-${name}.png`, fullPage: true }); }

const browser = await chromium.launch();
for (const [label, viewport, dpr] of sizes) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: label === "mobile", hasTouch: label === "mobile", acceptDownloads: true });
  const page = await ctx.newPage();
  const log = (kind, text) => { if (!/Download the React DevTools|fonts\.googleapis|airhex\.com/i.test(text)) errors.push(`[${label}] ${kind}: ${text}`); };
  page.on("console", m => { if (m.type() === "error" || m.type() === "warning") log(m.type(), `${m.text()} @ ${m.location()?.url || ""}`); });
  page.on("pageerror", e => log("pageerror", e.message));
  // an in-flight /api/faa poll is aborted when the test navigates away; that is not an app error
  page.on("requestfailed", r => { if (!/airhex|fonts\.g/.test(r.url()) && !(/\/api\/faa/.test(r.url()) && /ERR_ABORTED/.test(r.failure()?.errorText || ""))) log("requestfailed", `${r.url()} ${r.failure()?.errorText}`); });

  // 1) Onboarding (fresh storage)
  await page.goto(BASE, { waitUntil: "networkidle" });
  await shot(page, `${label}-01-onboarding`);
  for (let i = 0; i < 6; i++) { const n = page.getByText("Next", { exact: true }); if (await n.count()) await n.first().click(); else break; }
  await page.getByText("Waze", { exact: true }).first().click();
  await page.getByText(/Get Started/).click();
  await page.waitForSelector('[data-testid="flight-f2"]');
  await shot(page, `${label}-02-flights-booking-only`);
  await full(page, `${label}-02b-flights-full`);

  // 2) Delay scenario via settings
  await page.getByTestId("btn-settings").click();
  await page.getByTestId("scenario").selectOption("delay");
  await shot(page, `${label}-03-settings`);
  await page.getByTestId("settings-save").click();
  await page.mouse.click(5, 5);
  await page.waitForSelector('[data-testid="glance-changed-f2"]');
  await page.getByTestId("expand-f2").click();
  await page.waitForSelector('[data-testid="what-changed"]');
  await shot(page, `${label}-04-delay-whatchanged`);
  await page.getByTestId("expand-f3").click();
  await page.getByTestId("connection-card").click();
  await full(page, `${label}-05-delay-full`);

  // 3) Flight detail
  await page.getByTestId("flight-f3").locator("div").first().click();
  await page.waitForSelector('[data-testid="flight-detail"]');
  await page.waitForTimeout(1500);
  await shot(page, `${label}-06-detail`);
  await page.keyboard.press("Escape");
  await page.mouse.click(5, 5);

  // 4) Tools
  for (const t of ["weather", "intel", "seats", "family", "cancel"]) {
    if (!(await page.getByTestId(`tool-${t}`).count())) await page.getByTestId("tool-more").click();
    await page.getByTestId(`tool-${t}`).click();
    await page.waitForTimeout(t === "weather" || t === "intel" ? 2000 : 300);
    await shot(page, `${label}-07-tool-${t}`);
    await page.getByText("←").first().click();
  }
  // 5) Share + Add
  await page.getByTestId("btn-share").click();
  await shot(page, `${label}-08-share`);
  await page.mouse.click(5, 5);
  await page.getByTestId("btn-add").click();
  await page.getByTestId("add-iata").fill("LX 17");
  await shot(page, `${label}-09-add`);
  await page.mouse.click(5, 5);

  // 5b) Data export (More sheet)
  await page.getByTestId("tool-more").click();
  await shot(page, `${label}-09b-more`);
  for (const k of ["json", "csv"]) {
    const [d] = await Promise.all([page.waitForEvent("download"), page.getByTestId(`export-${k}`).click()]);
    const txt = await d.path().then(p => import("node:fs").then(fs => fs.readFileSync(p, "utf8")));
    if (k === "csv" ? !/^id,flight,/.test(txt) : !JSON.parse(txt).flights?.length) errors.push(`[${label}] ${k} export malformed`);
  }
  await page.keyboard.press("Escape");

  // 6) Calendar export
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("ics-trip").click()]);
  const ics = await dl.path().then(p => import("node:fs").then(fs => fs.readFileSync(p, "utf8")));
  if (!/BEGIN:VCALENDAR/.test(ics) || (ics.match(/BEGIN:VEVENT/g) || []).length < 2) errors.push(`[${label}] ics export malformed`);

  // 7) Cancel scenario
  await page.goto(`${BASE}/?demo=cancel`, { waitUntil: "networkidle" });
  await shot(page, `${label}-10-cancel-alert`);
  await page.getByText(/Find Alternatives/).first().click();
  await shot(page, `${label}-11-alternates`);
  await page.getByText("←").first().click();

  // 8) Tabs
  for (const t of ["wallet", "lounges", "passport"]) { await page.getByTestId(`tab-${t}`).click(); await shot(page, `${label}-12-tab-${t}`); }
  await page.getByTestId("tab-flights").click();

  // 9) Plans, corporate, light mode
  await page.getByTestId("btn-settings").click();
  await page.getByText("Corporate", { exact: true }).first().click();
  await page.getByTestId("open-plans").click();
  await shot(page, `${label}-13-plans`);
  await page.getByText("←").first().click();
  await page.getByText("Dashboard →").click();
  await page.waitForTimeout(300);
  await shot(page, `${label}-14-corporate`);
  await page.goto(`${BASE}/?demo=ontime`, { waitUntil: "networkidle" });
  await page.getByTestId("btn-settings").click();
  await page.getByText("Light Mode").click();
  await page.mouse.click(5, 5);
  await shot(page, `${label}-15-light-ontime`);
  await ctx.close();
}
await browser.close();
console.log(errors.length ? `CONSOLE ISSUES (${errors.length}):\n` + errors.join("\n") : "NO CONSOLE ERRORS");
process.exit(errors.length ? 1 : 0);
