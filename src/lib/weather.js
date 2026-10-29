// Open-Meteo (free, no API key). Degrades to null on any failure.
import { airport } from "./airports.js";

const WMO = [
  [[0], "Clear", "sun"], [[1], "Mostly clear", "sun"], [[2], "Partly cloudy", "partly"], [[3], "Overcast", "cloud"],
  [[45, 48], "Fog", "fog"], [[51, 53, 55, 56, 57], "Drizzle", "rain"], [[61, 63, 65, 66, 67], "Rain", "rain"],
  [[71, 73, 75, 77, 85, 86], "Snow", "snow"], [[80, 81, 82], "Showers", "rain"], [[95, 96, 99], "Thunderstorms", "storm"],
];
export function describeWmo(code) {
  const row = WMO.find(r => r[0].includes(Number(code)));
  return row ? { label: row[1], icon: row[2] } : { label: "—", icon: "cloud" };
}

const cache = new Map();
async function cachedJson(url, ttlMs = 10 * 60 * 1000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) return null;
    const data = await r.json();
    cache.set(url, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const UNITS = "temperature_unit=fahrenheit&wind_speed_unit=mph";

/** Current conditions + 5-day daily forecast for an airport. */
export async function fetchAirportWeather(code) {
  const ap = airport(code);
  if (!ap) return null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${ap.lat}&longitude=${ap.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto&${UNITS}`;
  const j = await cachedJson(url);
  if (!j?.current) return null;
  return {
    tempF: Math.round(j.current.temperature_2m),
    windMph: Math.round(j.current.wind_speed_10m),
    humidity: j.current.relative_humidity_2m,
    ...describeWmo(j.current.weather_code),
    daily: (j.daily?.time || []).map((d, i) => ({
      date: d, hiF: Math.round(j.daily.temperature_2m_max[i]), loF: Math.round(j.daily.temperature_2m_min[i]),
      ...describeWmo(j.daily.weather_code[i]),
    })),
  };
}

/**
 * Weather at a specific instant (e.g. arrival). Uses the forecast API up to 15 days ahead,
 * and the historical-forecast API for past instants. Returns null when out of range.
 */
export async function fetchWeatherAt(code, when, now = new Date()) {
  const ap = airport(code);
  if (!ap || !when) return null;
  const day = when.toISOString().slice(0, 10);
  const ahead = (when - now) / 86400000;
  if (ahead > 15) return { unavailable: "Forecast appears 15 days before arrival" };
  const base = ahead < -1 ? "https://historical-forecast-api.open-meteo.com/v1/forecast" : "https://api.open-meteo.com/v1/forecast";
  const url = `${base}?latitude=${ap.lat}&longitude=${ap.lon}&hourly=temperature_2m,weather_code,wind_speed_10m&start_date=${day}&end_date=${day}&timezone=GMT&${UNITS}`;
  const j = await cachedJson(url);
  const times = j?.hourly?.time;
  if (!times) return null;
  const key = when.toISOString().slice(0, 13) + ":00";
  let i = times.indexOf(key);
  if (i < 0) i = Math.min(times.length - 1, when.getUTCHours());
  return {
    tempF: Math.round(j.hourly.temperature_2m[i]),
    windMph: Math.round(j.hourly.wind_speed_10m[i]),
    ...describeWmo(j.hourly.weather_code[i]),
    source: ahead < -1 ? "historical" : "forecast",
  };
}
