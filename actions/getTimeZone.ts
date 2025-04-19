"use server";

import { TimeZone } from "@/lib/types";
import { Country } from "country-state-city";
import { randomUUID } from 'crypto';

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
  try {
    const allCountries = await Country.getAllCountries();
    const results: TimeZone[] = [];
    const timezoneMap = new Map<string, TimeZone>();

    // Process all countries and their timezones
    allCountries.forEach((country) => {
      if (country.timezones && country.timezones.length > 0) {
        country.timezones.forEach((tz) => {
          if (!tz.abbreviation) return; // Skip invalid timezones
          
          const key = `${tz.abbreviation.toUpperCase()}_${country.name.toLowerCase()}`;
          if (!timezoneMap.has(key)) {
            timezoneMap.set(key, {
              id: key,
              name: tz.abbreviation.toUpperCase(),
              fullName: tz.tzName || tz.zoneName || '',
              offset: getOffsetString(tz.gmtOffset),
              country: country.name,
              uuid: randomUUID()
            });
          }
        });
      }
    });

    // Process input queries
    inputs.forEach((input) => {
      // First decode the input in case it contains URL-encoded characters
      const decodedInput = decodeURIComponent(input);
      
      const [abbrev, ...countryParts] = decodedInput.toLowerCase().split("_");
      // Join country parts back together in case the country name had underscores
      const country = countryParts.join("_");
      
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
            id: decodedInput, // Store the decoded input for ID
            uuid: randomUUID()
          });
        }
      } else {
        console.warn(`No match found for timezone: ${decodedInput}`);
      }
    });

    return results;
  } catch (error) {
    console.error('Error in getTimezones:', error);
    return [];
  }
};
