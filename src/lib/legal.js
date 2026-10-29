// Plain-language Privacy Policy and Terms of Use. DRAFT, pending legal review.
// Kept as data so the app can render it in-app (no router) and tests can check the key promises.
// Facts here must match the code: storage keys come from usePersistentState("…") in App.jsx (prefixed "mr:").

export const LEGAL_DRAFT_DATE = "October 29, 2026";
export const CONTACT_PLACEHOLDER = "[contact email to be added]";

/** localStorage keys the app writes (all prefixed "mr:"), and what each holds. */
export const STORED_KEYS = [
  ["userFlights", "Flights you add yourself (flight number, airports, dates and times)"],
  ["flightEdits", "Your edits to trip flights, such as a cancellation-announced date"],
  ["home", "Your home address or area, used for leave-by estimates"],
  ["stay", "Where you're staying while away, if you enter it"],
  ["prefs", "Drive time, traffic and airport buffer preferences"],
  ["kids", "Whether you travel with children (a yes/no setting, no names or ages)"],
  ["navIdx", "Your preferred navigation app"],
  ["dark", "Light or dark appearance"],
  ["account", "The view you picked (personal, pro or corporate). This is not an account"],
  ["onboarded", "Whether you've seen the welcome screens"],
  ["demoClock", "Whether the demo clock replays the travel day"],
  ["scenario", "Which simulated live-data scenario is selected, if any"],
  ["votes", "Your votes on suggested features"],
];

export const PRIVACY = {
  title: "Privacy Policy",
  sections: [
    ["The short version", [
      "My Runway has no accounts and no sign-in. We don't sell your data, share it with advertisers, or use tracking cookies or analytics.",
      "Your trip lives on your device. A few lookups (live flight status, US airport delays and weather) go through the internet, as described below.",
    ]],
    ["What stays on your device", [
      "The app saves its data in your browser's local storage on this device only. It is not uploaded to us. That includes:",
      ...STORED_KEYS.map(([, d]) => `• ${d}.`),
      "The trip itinerary shown in the app (flights, confirmation codes, seats and passenger count) is built into this version of the app. Your own additions and edits are kept in local storage as listed above.",
      "We don't store names, passport numbers, payment details or a list of family members.",
    ]],
    ["What is sent over the internet, and to whom", [
      "Live flight status: when live data is on, the app asks our own server (/api/flight) about a flight. It sends the flight number (for example LY347), the departure date, the scheduled departure time and the departure airport. Our server passes the flight number and date to the flight-data providers FlightAware (AeroAPI), AeroDataBox (via RapidAPI) and AviationStack to get status, gates and delays. Your address, settings and other trip details are not sent.",
      "US airport delays: the app asks our server (/api/faa), which fetches the public FAA National Airspace System status feed. No personal or trip data is sent for this.",
      "Weather: for arrival weather the app sends an airport's coordinates and a time directly from your browser to Open-Meteo. No personal data is sent.",
      "Links you tap (airline sites, CBP, TSA, maps and navigation apps) open those services, and their own privacy policies apply.",
      "Like any website, our hosting provider (Vercel) and the services above can see your IP address and basic request details when your device contacts them. Our server keeps a short-lived in-memory record of IP addresses, for about a minute, only to rate-limit abuse. It does not write them to a database.",
    ]],
    ["Offline cache (service worker)", [
      "To work with no signal, the app installs a service worker that caches the app's own files (the page, scripts, icons and manifest) on your device. It doesn't cache your flight lookups or API responses. Clearing site data or using \"Delete all data\" below removes it.",
    ]],
    ["Export and delete your data", [
      "Export: More → Your data → Export JSON or Export CSV downloads your flights, settings and any live status to your device.",
      "Delete: use \"Delete all data on this device\" below, or clear this site's data in your browser settings. Because we don't hold your data on a server, there is nothing else for us to delete.",
    ]],
    ["Children", [
      "My Runway is meant for adults planning travel, including family travel. We don't knowingly collect personal information from children.",
    ]],
    ["Changes and contact", [
      "If this policy changes, we'll update this page and its date.",
      `Questions: ${CONTACT_PLACEHOLDER}.`,
    ]],
  ],
};

export const TERMS = {
  title: "Terms of Use",
  sections: [
    ["Using My Runway", [
      "My Runway is a free travel helper. By using it you agree to these terms. If you don't agree, please don't use the app.",
    ]],
    ["Flight information is for information only", [
      "Flight status, gates, delays, connection times, leave-by times, security estimates, airport notices and weather come from third parties, from your own entries, or from estimates. They can be late, incomplete or wrong.",
      "Always check with your airline, the airport and official announcements. Your airline's information is what counts. Don't rely on My Runway alone to decide when to leave or whether you'll make a flight or connection.",
      "Demo and simulated modes show example data, not real flights.",
    ]],
    ["Compensation estimates (EU261 / UK261) are not legal advice", [
      "The compensation checker gives a rough estimate under EU Regulation 261/2004 and the UK's version of it, based on distance, delay and notice. It is not legal advice and is not a promise that you are owed anything.",
      "Airlines decide claims, and they can refuse them, for example for extraordinary circumstances. Courts and national enforcement bodies have the final say. Check the rules or get advice before you rely on an estimate.",
    ]],
    ["No guarantees", [
      "The app is provided \"as is\" and \"as available\", without warranties of any kind, as far as the law allows. We don't guarantee it will be accurate, uninterrupted or error-free.",
      "As far as the law allows, we aren't liable for missed flights or connections, extra costs, or other losses from using or relying on the app. Nothing in these terms limits rights you have that can't be limited by law.",
    ]],
    ["Fair use", [
      "Don't misuse the app or its servers, for example by scraping, automated bulk requests or trying to get around rate limits. We may limit or block access to protect the service.",
    ]],
    ["Third-party services and links", [
      "Live data, weather, maps and other links come from other companies. Their terms apply, and we aren't responsible for their content or availability.",
    ]],
    ["Changes and contact", [
      "We may update these terms. We'll update this page and its date when we do.",
      `Questions: ${CONTACT_PLACEHOLDER}.`,
    ]],
  ],
};
