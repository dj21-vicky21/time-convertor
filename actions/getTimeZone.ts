"use server";

import { TimeZone } from "@/lib/types";
import { Country, ICountry } from "country-state-city";
import { randomUUID } from 'crypto';

// Define the timezone interface
interface Timezone {
  abbreviation: string;
  tzName?: string;
  zoneName?: string;
  gmtOffset: number;
}

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

// Predefined common time zones for fallback URL slug resolution
const commonTimeZones: Record<string, TimeZone> = {
  // UTC / Zulu
  "UTC_Coordinated Universal Time": { uuid: "utc", id: "UTC_Coordinated Universal Time", name: "UTC", fullName: "Coordinated Universal Time", offset: "+00:00", country: "Universal" },
  "Z_Zulu Time": { uuid: "z-zulu", id: "Z_Zulu Time", name: "Z", fullName: "Zulu Time (UTC+00:00)", offset: "+00:00", country: "Universal" },
  // Americas
  "EST_United States": { uuid: "est-us", id: "EST_United States", name: "EST", fullName: "Eastern Standard Time", offset: "-05:00", country: "United States" },
  "EDT_Eastern Daylight Time": { uuid: "edt", id: "EDT_Eastern Daylight Time", name: "EDT", fullName: "Eastern Daylight Time", offset: "-04:00", country: "United States" },
  "CST_United States": { uuid: "cst-us", id: "CST_United States", name: "CST", fullName: "Central Standard Time", offset: "-06:00", country: "United States" },
  "CDT_Central Daylight Time": { uuid: "cdt", id: "CDT_Central Daylight Time", name: "CDT", fullName: "Central Daylight Time", offset: "-05:00", country: "United States" },
  "MST_United States": { uuid: "mst-us", id: "MST_United States", name: "MST", fullName: "Mountain Standard Time", offset: "-07:00", country: "United States" },
  "MDT_Mountain Daylight Time": { uuid: "mdt", id: "MDT_Mountain Daylight Time", name: "MDT", fullName: "Mountain Daylight Time", offset: "-06:00", country: "United States" },
  "PST_United States": { uuid: "pst-us", id: "PST_United States", name: "PST", fullName: "Pacific Standard Time", offset: "-08:00", country: "United States" },
  "PDT_Pacific Daylight Time": { uuid: "pdt", id: "PDT_Pacific Daylight Time", name: "PDT", fullName: "Pacific Daylight Time", offset: "-07:00", country: "United States" },
  "AKST_United States": { uuid: "akst", id: "AKST_United States", name: "AKST", fullName: "Alaska Standard Time", offset: "-09:00", country: "United States" },
  "HST_United States": { uuid: "hst", id: "HST_United States", name: "HST", fullName: "Hawaii Standard Time", offset: "-10:00", country: "United States" },
  "AST_Atlantic": { uuid: "ast", id: "AST_Atlantic", name: "AST", fullName: "Atlantic Standard Time", offset: "-04:00", country: "Canada" },
  "ADT_Atlantic Daylight Time": { uuid: "adt", id: "ADT_Atlantic Daylight Time", name: "ADT", fullName: "Atlantic Daylight Time", offset: "-03:00", country: "Canada" },
  "NST_Newfoundland": { uuid: "nst", id: "NST_Newfoundland", name: "NST", fullName: "Newfoundland Standard Time", offset: "-03:30", country: "Canada" },
  "NDT_Newfoundland Daylight Time": { uuid: "ndt", id: "NDT_Newfoundland Daylight Time", name: "NDT", fullName: "Newfoundland Daylight Time", offset: "-02:30", country: "Canada" },
  // Europe
  "GMT_United Kingdom": { uuid: "gmt-uk", id: "GMT_United Kingdom", name: "GMT", fullName: "Greenwich Mean Time", offset: "+00:00", country: "United Kingdom" },
  "BST_United Kingdom": { uuid: "bst-uk", id: "BST_United Kingdom", name: "BST", fullName: "British Summer Time", offset: "+01:00", country: "United Kingdom" },
  "WET_Western European Time": { uuid: "wet", id: "WET_Western European Time", name: "WET", fullName: "Western European Time", offset: "+00:00", country: "Portugal" },
  "WEST_Western European Summer Time": { uuid: "west", id: "WEST_Western European Summer Time", name: "WEST", fullName: "Western European Summer Time", offset: "+01:00", country: "Portugal" },
  "CET_Central European Time": { uuid: "cet", id: "CET_Central European Time", name: "CET", fullName: "Central European Time", offset: "+01:00", country: "Germany" },
  "CEST_Central European Summer Time": { uuid: "cest", id: "CEST_Central European Summer Time", name: "CEST", fullName: "Central European Summer Time", offset: "+02:00", country: "Germany" },
  "EET_Eastern European Time": { uuid: "eet", id: "EET_Eastern European Time", name: "EET", fullName: "Eastern European Time", offset: "+02:00", country: "Greece" },
  "EEST_Eastern European Summer Time": { uuid: "eest", id: "EEST_Eastern European Summer Time", name: "EEST", fullName: "Eastern European Summer Time", offset: "+03:00", country: "Greece" },
  "MSK_Russia": { uuid: "msk", id: "MSK_Russia", name: "MSK", fullName: "Moscow Standard Time", offset: "+03:00", country: "Russia" },
  // Asia
  "IST_India": { uuid: "ist-in", id: "IST_India", name: "IST", fullName: "India Standard Time", offset: "+05:30", country: "India" },
  "NPT_Nepal": { uuid: "npt", id: "NPT_Nepal", name: "NPT", fullName: "Nepal Time", offset: "+05:45", country: "Nepal" },
  "ICT_Thailand": { uuid: "ict", id: "ICT_Thailand", name: "ICT", fullName: "Indochina Time", offset: "+07:00", country: "Thailand" },
  "CST_China": { uuid: "cst-cn", id: "CST_China", name: "CST", fullName: "China Standard Time", offset: "+08:00", country: "China" },
  "SGT_Singapore": { uuid: "sgt-sg", id: "SGT_Singapore", name: "SGT", fullName: "Singapore Time", offset: "+08:00", country: "Singapore" },
  "KST_South Korea": { uuid: "kst", id: "KST_South Korea", name: "KST", fullName: "Korea Standard Time", offset: "+09:00", country: "South Korea" },
  "JST_Japan": { uuid: "jst-jp", id: "JST_Japan", name: "JST", fullName: "Japan Standard Time", offset: "+09:00", country: "Japan" },
  // Australia / Pacific
  "AWST_Australia": { uuid: "awst", id: "AWST_Australia", name: "AWST", fullName: "Australian Western Standard Time", offset: "+08:00", country: "Australia" },
  "ACST_Australia": { uuid: "acst", id: "ACST_Australia", name: "ACST", fullName: "Australian Central Standard Time", offset: "+09:30", country: "Australia" },
  "AEST_Australia": { uuid: "aest", id: "AEST_Australia", name: "AEST", fullName: "Australian Eastern Standard Time", offset: "+10:00", country: "Australia" },
  "NZST_New Zealand": { uuid: "nzst", id: "NZST_New Zealand", name: "NZST", fullName: "New Zealand Standard Time", offset: "+12:00", country: "New Zealand" },
  "NZDT_New Zealand": { uuid: "nzdt", id: "NZDT_New Zealand", name: "NZDT", fullName: "New Zealand Daylight Time", offset: "+13:00", country: "New Zealand" },
  // Africa / Middle East
  "SAST_South Africa": { uuid: "sast", id: "SAST_South Africa", name: "SAST", fullName: "South Africa Standard Time", offset: "+02:00", country: "South Africa" },
  "EAT_East Africa": { uuid: "eat", id: "EAT_East Africa", name: "EAT", fullName: "East Africa Time", offset: "+03:00", country: "Kenya" },
  "WAT_West Africa": { uuid: "wat", id: "WAT_West Africa", name: "WAT", fullName: "West Africa Time", offset: "+01:00", country: "Nigeria" },
  "GST_Gulf": { uuid: "gst-gulf", id: "GST_Gulf", name: "GST", fullName: "Gulf Standard Time", offset: "+04:00", country: "United Arab Emirates" },
  // International Date Line
  "IDLW_International Date Line West": { uuid: "idlw", id: "IDLW_International Date Line West", name: "IDLW", fullName: "International Date Line West", offset: "-12:00", country: "Universal" },
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
    let countries: ICountry[] = [];
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
          country.timezones.forEach((tz: Timezone) => {
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
        
        // Derive display name from the slug (e.g., "Chennai" from IST_Chennai, "India" from IST_India)
        const displayName = countryParts.length > 0 
          ? countryParts.join(' ').split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : abbrev.toUpperCase();
        
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
          results.push({
            ...exactMatch,
            id: decodedInput,
            name: displayName,
            fullName: exactMatch.fullName 
              ? `${abbrev.toUpperCase()} - ${exactMatch.fullName}`
              : abbrev.toUpperCase(),
            uuid: randomUUID()
          });
        } else if (commonMatch) {
          results.push({
            ...commonMatch,
            name: displayName,
            fullName: commonMatch.fullName 
              ? `${abbrev.toUpperCase()} - ${commonMatch.fullName}`
              : abbrev.toUpperCase(),
            uuid: randomUUID()
          });
        } else {
          console.warn(`No match found for timezone: ${decodedInput}, using fallback`);
          
          results.push({
            uuid: randomUUID(),
            id: decodedInput,
            name: displayName,
            fullName: `${abbrev.toUpperCase()} - ${displayName}`,
            offset: "+00:00",
            country: displayName
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
