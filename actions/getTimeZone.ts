"use server";

import { TimeZone } from "@/lib/types";
import { Country } from "country-state-city";

const getOffsetString = (gmtOffset: number): string => {
  const hours = Math.floor(gmtOffset / 3600);
  const minutes = Math.abs(Math.floor((gmtOffset % 3600) / 60));
  const sign = hours >= 0 ? "+" : "-";
  return `${sign}${Math.abs(hours).toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

// Marking the function as async
export const getTimezones = async (inputs: string[]): Promise<TimeZone[]> => {
  // Await the Country.getAllCountries() if needed for asynchronous behavior
  const allCountries = await Country.getAllCountries();  // Ensure this is an async operation if required
  const results: TimeZone[] = [];

  // Create a map to store unique timezones
  const timezoneMap = new Map<string, TimeZone>();

  // Process all countries and their timezones
  allCountries.forEach((country) => {
    if (country.timezones && country.timezones.length > 0) {
      country.timezones.forEach((tz) => {
        const key = `${tz.abbreviation.toUpperCase()}_${country.name.toLowerCase()}`;
        if (!timezoneMap.has(key)) {
          timezoneMap.set(key, {
            id: timezoneMap.size + 1,
            name: tz.abbreviation.toUpperCase(),
            fullName: tz.tzName,
            offset: getOffsetString(tz.gmtOffset),
          });
        }
      });
    }
  });

  // Process input queries
  inputs.forEach((input, index) => {
    const [abbrev, country] = input.toLowerCase().split("_");
    const searchKey = country
      ? `${abbrev.toUpperCase()}_${country}`
      : Array.from(timezoneMap.keys()).find(
          (key) =>
            key.startsWith(`${abbrev.toUpperCase()}_`) &&
            (!country || key.endsWith(`_${country}`))
        );

    if (searchKey) {
      const tz = timezoneMap.get(searchKey);
      if (tz) {
        results.push({
          ...tz,
          id: index + 1, // Maintain input order for IDs
        });
      }
    }
  });

  return results;
};
