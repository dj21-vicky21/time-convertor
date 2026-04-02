"use server";

import { readFileSync } from "fs";
import { join } from "path";
import { Country } from "country-state-city";

interface CityData {
  tz: string[]; // IANA timezone names
  cc: string[]; // ISO-2 country codes
  cities: [string, string, number, number, number][]; // [name, asciiLower, ccIdx, tzIdx, population]
}

export interface CitySearchResult {
  name: string;
  countryCode: string;
  countryName: string;
  timezone: string; // IANA zone name (e.g. "Asia/Kolkata")
  abbreviation: string;
  tzName: string;
  gmtOffset: number;
  population: number;
}

let cachedData: CityData | null = null;
let countryNameCache: Map<string, string> | null = null;

function loadData(): CityData {
  if (!cachedData) {
    const filePath = join(process.cwd(), "data", "cities.json");
    cachedData = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return cachedData!;
}

function getCountryName(isoCode: string): string {
  if (!countryNameCache) {
    countryNameCache = new Map();
    try {
      const countries = Country.getAllCountries();
      for (const c of countries) {
        countryNameCache.set(c.isoCode, c.name);
      }
    } catch {
      // fallback: return the code itself
    }
  }
  return countryNameCache.get(isoCode) || isoCode;
}

function resolveTimezone(ianaZone: string): {
  abbreviation: string;
  tzName: string;
  gmtOffset: number;
} {
  try {
    const now = new Date();

    const shortFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "short",
    });
    const abbreviation =
      shortFmt.formatToParts(now).find((p) => p.type === "timeZoneName")
        ?.value || ianaZone.split("/").pop() || "TZ";

    const longFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "long",
    });
    const tzName =
      longFmt.formatToParts(now).find((p) => p.type === "timeZoneName")
        ?.value || ianaZone;

    const utcDate = new Date(
      now.toLocaleString("en-US", { timeZone: "UTC" })
    );
    const tzDate = new Date(
      now.toLocaleString("en-US", { timeZone: ianaZone })
    );
    const gmtOffset = (tzDate.getTime() - utcDate.getTime()) / 1000;

    return { abbreviation, tzName, gmtOffset };
  } catch {
    return { abbreviation: "TZ", tzName: ianaZone, gmtOffset: 0 };
  }
}

export async function searchCities(
  query: string,
  limit = 20
): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const data = loadData();
  const q = query.toLowerCase().trim();

  const scored: { entry: (typeof data.cities)[0]; score: number }[] = [];

  for (const city of data.cities) {
    const ascii = city[1];
    if (!ascii.includes(q)) continue;

    // Exact match > starts-with > contains, weighted by population
    const score = ascii === q ? 3 : ascii.startsWith(q) ? 2 : 1;
    scored.push({ entry: city, score });
  }

  scored.sort((a, b) => b.score - a.score || b.entry[4] - a.entry[4]);

  const tzCache = new Map<
    string,
    { abbreviation: string; tzName: string; gmtOffset: number }
  >();

  return scored.slice(0, limit).map((r) => {
    const [name, , ccIdx, tzIdx, population] = r.entry;
    const countryCode = data.cc[ccIdx];
    const timezone = data.tz[tzIdx];

    if (!tzCache.has(timezone)) {
      tzCache.set(timezone, resolveTimezone(timezone));
    }
    const { abbreviation, tzName, gmtOffset } = tzCache.get(timezone)!;

    return {
      name,
      countryCode,
      countryName: getCountryName(countryCode),
      timezone,
      abbreviation,
      tzName,
      gmtOffset,
      population,
    };
  });
}
