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
    // Add basic validation
    if (!inputs || inputs.length === 0) {
      return [];
    }
    
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
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      try {
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
            continue;
          }
        }
        
        // If no match found, add a fallback timezone
        console.warn(`No match found for timezone: ${decodedInput}`);
        results.push({
          uuid: randomUUID(),
          id: decodedInput,
          name: abbrev ? abbrev.toUpperCase() : "UTC",
          fullName: countryParts.length > 0 ? `${abbrev} (${countryParts.join(' ')})` : abbrev || "Unknown",
          offset: "+00:00", // Default to GMT
          country: countryParts.join(" ") || "Unknown"
        });
      } catch (e) {
        // If there's an error processing this input, add a basic fallback
        console.error(`Error processing timezone input: ${input}`, e);
        results.push({
          uuid: randomUUID(),
          id: input,
          name: "UTC",
          fullName: "Unknown Timezone",
          offset: "+00:00",
          country: "Unknown"
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in getTimezones:', error);
    
    // Return basic fallback timezones if the API fails
    return inputs.map(input => {
      try {
        const parts = input.split('_');
        return {
          uuid: randomUUID(),
          id: input,
          name: parts[0] ? parts[0].toUpperCase() : "UTC",
          fullName: parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || "Unknown",
          offset: "+00:00", // Default
          country: parts.length > 1 ? parts.slice(1).join(' ') : "Unknown"
        };
      } catch {
        return {
          uuid: randomUUID(),
          id: input,
          name: "UTC",
          fullName: "Unknown Timezone",
          offset: "+00:00",
          country: "Unknown"
        };
      }
    });
  }
};
