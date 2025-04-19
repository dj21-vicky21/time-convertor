"use server";

import { TimeZone } from "@/lib/types";
import { Country } from "country-state-city";
import { randomUUID } from 'crypto';

// Helper to safely decode URL components
const safeDecodeURIComponent = (str: string): string => {
  try {
    return decodeURIComponent(str);
  } catch (error) {
    console.error('Error decoding URL component:', str, error);
    return str;
  }
};

const getOffsetString = (gmtOffset: number): string => {
  const hours = Math.floor(gmtOffset / 3600);
  const minutes = Math.abs(Math.floor((gmtOffset % 3600) / 60));
  const sign = hours >= 0 ? "+" : "-";
  return `${sign}${Math.abs(hours).toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

// Create a predefined list of common time zones for fallback
const commonTimeZones: Record<string, TimeZone> = {
  "EST_United States": {
    uuid: "est-us",
    id: "EST_United States",
    name: "EST",
    fullName: "Eastern Standard Time",
    offset: "-05:00",
    country: "United States"
  },
  "GMT_United Kingdom": {
    uuid: "gmt-uk",
    id: "GMT_United Kingdom",
    name: "GMT",
    fullName: "Greenwich Mean Time",
    offset: "+00:00",
    country: "United Kingdom"
  },
  "IST_India": {
    uuid: "ist-in",
    id: "IST_India",
    name: "IST",
    fullName: "India Standard Time",
    offset: "+05:30",
    country: "India"
  },
  "SGT_Singapore": {
    uuid: "sgt-sg",
    id: "SGT_Singapore",
    name: "SGT",
    fullName: "Singapore Time",
    offset: "+08:00",
    country: "Singapore"
  },
  "JST_Japan": {
    uuid: "jst-jp",
    id: "JST_Japan",
    name: "JST",
    fullName: "Japan Standard Time",
    offset: "+09:00",
    country: "Japan"
  }
};

// Marking the function as async
export const getTimezones = async (inputs: string[]): Promise<TimeZone[]> => {
  try {
    // Add basic validation
    if (!inputs || inputs.length === 0) {
      return [];
    }
    
    console.log('Processing timezone inputs:', inputs);
    
    // First, try to fetch all countries
    let countries: any[] = [];
    try {
      countries = await Country.getAllCountries();
      console.log(`Successfully loaded ${countries.length} countries`);
    } catch (error) {
      console.error('Error loading countries from country-state-city:', error);
    }
    
    const results: TimeZone[] = [];
    const timezoneMap = new Map<string, TimeZone>();

    // Process all countries and their timezones if we have them
    if (countries.length > 0) {
      // Build a map of all available timezones
      countries.forEach((country) => {
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
    }
    
    // Add common timezones to the map for fallback
    Object.entries(commonTimeZones).forEach(([key, tz]) => {
      const lowercaseKey = key.toLowerCase();
      if (!timezoneMap.has(lowercaseKey)) {
        timezoneMap.set(lowercaseKey, {
          ...tz,
          uuid: randomUUID() // Generate a new UUID each time
        });
      }
    });

    // Process input queries
    for (let i = 0; i < inputs.length; i++) {
      try {
        const input = inputs[i];
        
        // First decode the input in case it contains URL-encoded characters
        const decodedInput = safeDecodeURIComponent(input);
        console.log(`Processing timezone: ${decodedInput}`);
        
        const [abbrev, ...countryParts] = decodedInput.toLowerCase().split("_");
        // Join country parts back together in case the country name had underscores
        const country = countryParts.join("_");
        
        // First try an exact match
        const searchKey = `${abbrev.toUpperCase()}_${country}`;
        let exactMatch = timezoneMap.get(searchKey);
        
        // If no exact match, try to find a key that starts with the abbreviation
        if (!exactMatch && abbrev) {
          const possibleMatch = Array.from(timezoneMap.keys()).find(
            (key) => key.toLowerCase().startsWith(`${abbrev.toLowerCase()}_`)
          );
          
          if (possibleMatch) {
            exactMatch = timezoneMap.get(possibleMatch);
          }
        }
        
        // Check if we have a match in our predefined common timezones
        const commonTimezoneKey = `${abbrev.toUpperCase()}_${countryParts.join(' ')}`;
        const commonMatch = commonTimeZones[commonTimezoneKey];
        
        if (exactMatch) {
          // Found in our database
          results.push({
            ...exactMatch,
            id: decodedInput, // Store the decoded input for ID
            uuid: randomUUID()
          });
        } else if (commonMatch) {
          // Found in our common timezones
          results.push({
            ...commonMatch,
            uuid: randomUUID()
          });
        } else {
          // No match found, create a fallback
          console.warn(`No match found for timezone: ${decodedInput}, using fallback`);
          
          const countryName = countryParts.length > 0 
            ? countryParts.join(' ') 
            : "Unknown";
          
          results.push({
            uuid: randomUUID(),
            id: decodedInput,
            name: abbrev ? abbrev.toUpperCase() : "TZ",
            fullName: countryName !== "Unknown" 
              ? `${abbrev.toUpperCase()} (${countryName})` 
              : abbrev.toUpperCase(),
            offset: "+00:00", // Default to GMT
            country: countryName
          });
        }
      } catch (error) {
        console.error(`Error processing timezone input: ${inputs[i]}`, error);
        
        // Add a generic fallback
        results.push({
          uuid: randomUUID(),
          id: inputs[i],
          name: "TZ",
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
        const parts = safeDecodeURIComponent(input).split('_');
        return {
          uuid: randomUUID(),
          id: input,
          name: parts[0] ? parts[0].toUpperCase() : "TZ",
          fullName: parts.length > 1 ? parts.slice(1).join(' ') : "Unknown",
          offset: "+00:00", // Default
          country: parts.length > 1 ? parts.slice(1).join(' ') : "Unknown"
        };
      } catch {
        return {
          uuid: randomUUID(),
          id: input,
          name: "TZ",
          fullName: "Unknown Timezone",
          offset: "+00:00",
          country: "Unknown"
        };
      }
    });
  }
};
