// Static airport reference data. Coordinates are [lat, lon] for Open-Meteo.
// securityMins = typical wait estimate (spec "Security wait estimates"), used for display only.
export const AIRPORTS = {
  MIA: { code: "MIA", name: "Miami International", city: "Miami", country: "US", tz: "America/New_York", lat: 25.7959, lon: -80.2870, securityMins: 25, domestic: true },
  TLV: { code: "TLV", name: "Ben Gurion International", city: "Tel Aviv", country: "IL", tz: "Asia/Jerusalem", lat: 32.0114, lon: 34.8854, securityMins: 40 },
  ZRH: { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "CH", tz: "Europe/Zurich", lat: 47.4647, lon: 8.5492, securityMins: 20 },
  JFK: { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "US", tz: "America/New_York", lat: 40.6413, lon: -73.7781, securityMins: 45, domestic: true },
  LAX: { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "US", tz: "America/Los_Angeles", lat: 33.9416, lon: -118.4085, securityMins: 35, domestic: true },
  ATL: { code: "ATL", name: "Hartsfield-Jackson Atlanta", city: "Atlanta", country: "US", tz: "America/New_York", lat: 33.6407, lon: -84.4277, securityMins: 30, domestic: true },
  ORD: { code: "ORD", name: "Chicago O'Hare", city: "Chicago", country: "US", tz: "America/Chicago", lat: 41.9742, lon: -87.9073, securityMins: 30, domestic: true },
  LHR: { code: "LHR", name: "London Heathrow", city: "London", country: "GB", tz: "Europe/London", lat: 51.47, lon: -0.4543, securityMins: 25 },
  CDG: { code: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "FR", tz: "Europe/Paris", lat: 49.0097, lon: 2.5479, securityMins: 25 },
};

export function airport(code) {
  return AIRPORTS[code] || null;
}

export function isDomesticPair(a, b) {
  const A = airport(a), B = airport(b);
  return !!(A && B && A.country === B.country);
}
