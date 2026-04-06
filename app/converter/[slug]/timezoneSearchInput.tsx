"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Country, ICountry } from "country-state-city";
import cityTimezones from "city-timezones";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from "sonner";
import { searchCities } from "@/actions/searchCities";

type TimezoneInfo = {
  abbreviation: string;
  zoneName: string;
  currentTime: string;
  gmtOffset: number;
  tzName: string;
};

type SearchResult = {
  type: "country" | "city";
  displayName: string;
  flag: string;
  isoCode: string;
  countryName: string;
  cityName?: string;
  province?: string;
  timezone: {
    abbreviation: string;
    zoneName: string;
    gmtOffset: number;
    tzName: string;
  };
  population?: number;
};

// Add type for search index
type CountryWithSearchIndex = ICountry[] & {
  searchIndex?: Map<string, Set<number>>;
};

function getTimezoneAbbreviation(ianaZone: string): { abbreviation: string; tzName: string; gmtOffset: number } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const abbr = parts.find(p => p.type === "timeZoneName")?.value || ianaZone.split("/").pop() || "TZ";

    const longFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "long",
    });
    const longParts = longFormatter.formatToParts(now);
    const tzName = longParts.find(p => p.type === "timeZoneName")?.value || ianaZone;

    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone: ianaZone }));
    const gmtOffset = (tzDate.getTime() - utcDate.getTime()) / 1000;

    return { abbreviation: abbr, tzName, gmtOffset };
  } catch {
    return { abbreviation: "TZ", tzName: ianaZone, gmtOffset: 0 };
  }
}

function countryIsoToFlag(iso2: string): string {
  return [...iso2.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join("");
}

export default function TimezoneSearchInput() {
  const { slug, is24Hour, viewMode, timeZones, setTimeZones, MAX_TIMEZONES : maxTimezones} = useAppStore();
  const [inputText, setInputText] = useState("");
  const debouncedInputText = useDebounce(inputText, 300);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timezoneData, setTimezoneData] = useState<
    Record<string, TimezoneInfo>
  >({});
  const [maxLimitReached, setMaxLimitReached] = useState(false);
  const [showMaxLimitWarning, setShowMaxLimitWarning] = useState(false);
  const [serverCityResults, setServerCityResults] = useState<SearchResult[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Maximum number of timezones allowed
  const MAX_TIMEZONES = maxTimezones;

  // Add a timer ref to manage the warning timeout
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add state to track animation
  const [isHiding, setIsHiding] = useState(false);

  // Function to show the warning with timeout
  const showWarningWithTimeout = useCallback(() => {
    // Clear any existing timer
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Reset animation state
    setIsHiding(false);
    
    // Show the warning
    setShowMaxLimitWarning(true);
    
    // Set a new timer
    warningTimerRef.current = setTimeout(() => {
      // Start hide animation
      setIsHiding(true);
      
      // Actually hide the message after animation completes
      const hideTimer = setTimeout(() => {
        setShowMaxLimitWarning(false);
        setIsHiding(false);
      }, 300);
      
      warningTimerRef.current = hideTimer;
    }, 3000);
  }, []);

  // Check if the maximum limit is reached - separate from warning management
  useEffect(() => {
    setMaxLimitReached(timeZones.length >= MAX_TIMEZONES);
  }, [timeZones.length, MAX_TIMEZONES]);

  // Handle showing and hiding the warning message
  useEffect(() => {
    // Show warning when limit is reached
    if (maxLimitReached) {
      showWarningWithTimeout();
    } else {
      // Hide warning when count drops below limit
      setIsHiding(true);
      
      // Wait for animation to complete
      const hideTimer = setTimeout(() => {
        setShowMaxLimitWarning(false);
        setIsHiding(false);
      }, 300);
      
      // Clear any existing timer
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = hideTimer;
      }
    }
    
    // Cleanup timers on unmount
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [maxLimitReached, showWarningWithTimeout]);

  // Get all countries once and memoize
  const allCountries = useMemo(() => {
    try {
      const countries = Country.getAllCountries();
      
      // Add error handling for empty country list
      if (!countries || countries.length === 0) {
        console.error('Country list is empty, using fallback data');
        return [
          {
            name: "United States",
            isoCode: "US",
            flag: "🇺🇸",
            phonecode: "1",
            currency: "USD",
            latitude: "37.09024",
            longitude: "-95.712891",
            timezones: [
              {
                zoneName: "America/New_York",
                gmtOffset: -18000,
                abbreviation: "EST",
                tzName: "Eastern Standard Time"
              }
            ]
          },
          {
            name: "United Kingdom",
            isoCode: "GB",
            flag: "🇬🇧",
            phonecode: "44",
            currency: "GBP",
            latitude: "55.378051",
            longitude: "-3.435973",
            timezones: [
              {
                zoneName: "Europe/London",
                gmtOffset: 0,
                abbreviation: "GMT",
                tzName: "Greenwich Mean Time"
              }
            ]
          },
          {
            name: "India",
            isoCode: "IN",
            flag: "🇮🇳",
            phonecode: "91",
            currency: "INR",
            latitude: "20.593684",
            longitude: "78.96288",
            timezones: [
              {
                zoneName: "Asia/Kolkata",
                gmtOffset: 19800,
                abbreviation: "IST",
                tzName: "Indian Standard Time"
              }
            ]
          },
          {
            name: "Singapore",
            isoCode: "SG",
            flag: "🇸🇬",
            phonecode: "65",
            currency: "SGD",
            latitude: "1.352083",
            longitude: "103.819836",
            timezones: [
              {
                zoneName: "Asia/Singapore",
                gmtOffset: 28800,
                abbreviation: "SGT",
                tzName: "Singapore Time"
              }
            ]
          },
          {
            name: "Japan",
            isoCode: "JP",
            flag: "🇯🇵",
            phonecode: "81",
            currency: "JPY",
            latitude: "36.204824",
            longitude: "138.252924",
            timezones: [
              {
                zoneName: "Asia/Tokyo",
                gmtOffset: 32400,
                abbreviation: "JST",
                tzName: "Japan Standard Time"
              }
            ]
          }
        ] as ICountry[];
      }
      
      return countries;
    } catch (error) {
      console.error('Error loading countries:', error);
      // Return a basic fallback list if Country.getAllCountries fails
      return [
        {
          name: "United States",
          isoCode: "US",
          flag: "🇺🇸",
          phonecode: "1",
          currency: "USD",
          latitude: "37.09024",
          longitude: "-95.712891",
          timezones: [
            {
              zoneName: "America/New_York",
              gmtOffset: -18000,
              abbreviation: "EST",
              tzName: "Eastern Standard Time"
            }
          ]
        },
        {
          name: "Singapore",
          isoCode: "SG",
          flag: "🇸🇬",
          phonecode: "65",
          currency: "SGD",
          latitude: "1.352083",
          longitude: "103.819836",
          timezones: [
            {
              zoneName: "Asia/Singapore",
              gmtOffset: 28800,
              abbreviation: "SGT",
              tzName: "Singapore Time"
            }
          ]
        }
      ] as ICountry[];
    }
  }, []);

  // Add efficient search index
  const createSearchIndex = (countries: ICountry[]) => {
    const index = new Map<string, Set<number>>();
    
    countries.forEach((country, idx: number) => {
      // Index country name
      const nameLower = country.name.toLowerCase();
      nameLower.split(' ').forEach(word => {
        const set = index.get(word) || new Set();
        set.add(idx);
        index.set(word, set);
      });
      
      // Index ISO code
      const isoLower = country.isoCode.toLowerCase();
      const isoSet = index.get(isoLower) || new Set();
      isoSet.add(idx);
      index.set(isoLower, isoSet);
      
      // Index timezone info - now handling all timezones in the array
      country.timezones?.forEach(tz => {
        // Index abbreviation
        if (tz.abbreviation) {
          const abbr = tz.abbreviation.toLowerCase();
          const abbrSet = index.get(abbr) || new Set();
          abbrSet.add(idx);
          index.set(abbr, abbrSet);
        }

        // Index zoneName (e.g., "Asia/Kolkata")
        if (tz.zoneName) {
          const zoneNameLower = tz.zoneName.toLowerCase();
          // Index full zoneName
          const zoneSet = index.get(zoneNameLower) || new Set();
          zoneSet.add(idx);
          index.set(zoneNameLower, zoneSet);
          // Index parts of zoneName (e.g., "asia", "kolkata")
          zoneNameLower.split('/').forEach(part => {
            const partSet = index.get(part) || new Set();
            partSet.add(idx);
            index.set(part, partSet);
          });
        }

        // Index tzName
        if (tz.tzName) {
          const tzNameLower = tz.tzName.toLowerCase();
          tzNameLower.split(' ').forEach(word => {
            const set = index.get(word) || new Set();
            set.add(idx);
            index.set(word, set);
          });
        }
      });
    });
    
    return index;
  };

  // Unified search: countries + cities, producing SearchResult[]
  const filteredResults = useMemo((): SearchResult[] => {
    if (!debouncedInputText.trim()) return [];
    
    const searchTerms = debouncedInputText.toLowerCase().split(' ').filter(Boolean);
    if (searchTerms.length === 0) return [];

    // --- Country results (existing logic) ---
    const countriesWithIndex = allCountries as CountryWithSearchIndex;
    const searchIndex = countriesWithIndex.searchIndex || (countriesWithIndex.searchIndex = createSearchIndex(allCountries));
    
    const matchingSets = searchTerms.map(term => {
      const matches = new Set<number>();
      for (const [key, indices] of searchIndex.entries()) {
        if (key.includes(term)) {
          indices.forEach(idx => matches.add(idx));
        }
      }
      return matches;
    });
    
    const commonMatches = matchingSets[0]
      ? [...matchingSets[0]].filter(idx => matchingSets.every(set => set.has(idx)))
      : [];
    
    const searchTerm = debouncedInputText.toLowerCase();

    const countryResults: SearchResult[] = commonMatches
      .map(idx => allCountries[idx])
      .sort((a, b) => {
        const aZoneExact = a.timezones?.some(tz => tz.zoneName?.toLowerCase() === searchTerm);
        const bZoneExact = b.timezones?.some(tz => tz.zoneName?.toLowerCase() === searchTerm);
        if (aZoneExact !== bZoneExact) return aZoneExact ? -1 : 1;
        const aTzExact = a.timezones?.some(tz => tz.abbreviation?.toLowerCase() === searchTerm);
        const bTzExact = b.timezones?.some(tz => tz.abbreviation?.toLowerCase() === searchTerm);
        if (aTzExact !== bTzExact) return aTzExact ? -1 : 1;
        const aNameExact = a.name.toLowerCase() === searchTerm;
        const bNameExact = b.name.toLowerCase() === searchTerm;
        if (aNameExact !== bNameExact) return aNameExact ? -1 : 1;
        const aNameStarts = a.name.toLowerCase().startsWith(searchTerm);
        const bNameStarts = b.name.toLowerCase().startsWith(searchTerm);
        if (aNameStarts !== bNameStarts) return aNameStarts ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((country): SearchResult => {
        const tz = country.timezones?.[0];
        return {
          type: "country",
          displayName: country.name,
          flag: country.flag || "",
          isoCode: country.isoCode,
          countryName: country.name,
          timezone: {
            abbreviation: tz?.abbreviation || "N/A",
            zoneName: tz?.zoneName || "N/A",
            gmtOffset: tz?.gmtOffset || 0,
            tzName: tz?.tzName || "N/A",
          },
        };
      });

    // --- City results from city-timezones ---
    const countryIsos = new Set(countryResults.map(r => r.isoCode));

    let cityHits = cityTimezones.findFromCityStateProvince(debouncedInputText) || [];
    cityHits = cityHits
      .sort((a, b) => (b.pop || 0) - (a.pop || 0))
      .slice(0, 15);

    const seenCityKeys = new Set<string>();
    const cityResults: SearchResult[] = [];

    for (const city of cityHits) {
      if (!city.timezone) continue;
      const key = `${city.city_ascii}_${city.iso2}_${city.timezone}`;
      if (seenCityKeys.has(key)) continue;
      seenCityKeys.add(key);

      const matchingCountry = countryResults.find(
        r => r.isoCode === city.iso2 && r.timezone.zoneName === city.timezone
      );
      if (matchingCountry && city.city_ascii?.toLowerCase() === city.country?.toLowerCase()) continue;

      // Prefer abbreviation from country-state-city data (IST, EST, etc.)
      // over Intl API which often returns raw offsets like "GMT+5:30"
      const countryData = allCountries.find(c => c.isoCode === city.iso2);
      const countryTz = countryData?.timezones?.find(tz => tz.zoneName === city.timezone);

      let abbreviation: string;
      let tzName: string;
      let gmtOffset: number;

      if (countryTz?.abbreviation) {
        abbreviation = countryTz.abbreviation;
        tzName = countryTz.tzName || countryTz.zoneName || city.timezone;
        gmtOffset = countryTz.gmtOffset || 0;
      } else {
        const resolved = getTimezoneAbbreviation(city.timezone);
        abbreviation = resolved.abbreviation;
        tzName = resolved.tzName;
        gmtOffset = resolved.gmtOffset;
      }

      cityResults.push({
        type: "city",
        displayName: [city.city, city.province, city.country].filter(Boolean).join(", "),
        flag: city.iso2 ? countryIsoToFlag(city.iso2) : "",
        isoCode: city.iso2 || "",
        countryName: city.country || "",
        cityName: city.city || city.city_ascii || "",
        province: city.province || "",
        timezone: { abbreviation, zoneName: city.timezone, gmtOffset, tzName },
        population: city.pop || 0,
      });
    }

    return [...countryResults, ...cityResults];
  }, [debouncedInputText, allCountries]);

  // Deduplicated timezone list for fallback when no city/country match is found
  const uniqueTimezones = useMemo(() => {
    const seen = new Map<string, {
      abbreviation: string;
      zoneName: string;
      gmtOffset: number;
      tzName: string;
      countryName: string;
    }>();

    allCountries.forEach(country => {
      country.timezones?.forEach(tz => {
        if (!tz.abbreviation || tz.zoneName === "N/A") return;
        const key = `${tz.abbreviation}_${tz.gmtOffset}`;
        if (!seen.has(key)) {
          seen.set(key, {
            abbreviation: tz.abbreviation,
            zoneName: tz.zoneName || "",
            gmtOffset: tz.gmtOffset || 0,
            tzName: tz.tzName || tz.zoneName || "",
            countryName: country.name,
          });
        }
      });
    });

    return Array.from(seen.values()).sort((a, b) => a.gmtOffset - b.gmtOffset);
  }, [allCountries]);

  // Fallback: search the 167K GeoNames database when city-timezones has no results
  useEffect(() => {
    if (!debouncedInputText.trim() || debouncedInputText.trim().length < 2) {
      setServerCityResults([]);
      setIsSearchingServer(false);
      return;
    }

    const localCityHits = cityTimezones.findFromCityStateProvince(debouncedInputText);
    if (localCityHits && localCityHits.length > 0) {
      setServerCityResults([]);
      setIsSearchingServer(false);
      return;
    }

    let cancelled = false;
    setIsSearchingServer(true);

    searchCities(debouncedInputText).then(results => {
      if (cancelled) return;

      const converted: SearchResult[] = results.map(r => {
        const countryData = allCountries.find(c => c.isoCode === r.countryCode);
        const countryTz = countryData?.timezones?.find(tz => tz.zoneName === r.timezone);

        const abbreviation = countryTz?.abbreviation || r.abbreviation;
        const tzName = countryTz?.tzName || r.tzName;
        const gmtOffset = countryTz?.gmtOffset ?? r.gmtOffset;

        return {
          type: "city" as const,
          displayName: `${r.name}, ${r.countryName}`,
          flag: r.countryCode ? countryIsoToFlag(r.countryCode) : "",
          isoCode: r.countryCode,
          countryName: r.countryName,
          cityName: r.name,
          timezone: { abbreviation, zoneName: r.timezone, gmtOffset, tzName },
          population: r.population,
        };
      });

      setServerCityResults(converted);
      setIsSearchingServer(false);
    }).catch(() => {
      if (!cancelled) {
        setServerCityResults([]);
        setIsSearchingServer(false);
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInputText]);

  // Merge local results with server results
  const combinedResults = useMemo(() => {
    if (serverCityResults.length > 0) {
      const countryResults = filteredResults.filter(r => r.type === "country");
      return [...countryResults, ...serverCityResults];
    }
    return filteredResults;
  }, [filteredResults, serverCityResults]);

  const timezoneCacheRef = useRef(new Map<string, TimezoneInfo>());

  // Calculate current times for all search results (countries + cities)
  useEffect(() => {
    if (!isDropdownOpen || combinedResults.length === 0) return;

    let isSubscribed = true;
    const newData: Record<string, TimezoneInfo> = {};
    const now = new Date();

    combinedResults.forEach((result, idx) => {
      const tz = result.timezone;
      const resultKey = result.type === "city" ? `city_${idx}_${result.displayName}` : result.isoCode;

      if (!tz || tz.zoneName === "N/A") {
        newData[resultKey] = { abbreviation: "N/A", zoneName: "N/A", currentTime: "N/A", gmtOffset: 0, tzName: "N/A" };
        return;
      }

      const cacheKey = `${resultKey}_${tz.zoneName}_${now.getMinutes()}`;
      const cached = timezoneCacheRef.current.get(cacheKey);
      if (cached) { newData[resultKey] = cached; return; }

      try {
        const timeString = new Date().toLocaleTimeString("en-US", {
          timeZone: tz.zoneName,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        const info: TimezoneInfo = {
          abbreviation: tz.abbreviation,
          zoneName: tz.zoneName,
          currentTime: timeString,
          gmtOffset: tz.gmtOffset,
          tzName: tz.tzName,
        };
        timezoneCacheRef.current.set(cacheKey, info);
        newData[resultKey] = info;
      } catch {
        newData[resultKey] = {
          abbreviation: tz.abbreviation,
          zoneName: tz.zoneName,
          currentTime: "N/A",
          gmtOffset: tz.gmtOffset,
          tzName: tz.tzName,
        };
      }
    });

    if (isSubscribed) setTimezoneData(newData);

    const interval = setInterval(() => {
      if (!isSubscribed) return;
      const updated: Record<string, TimezoneInfo> = {};
      combinedResults.forEach((result, idx) => {
        const resultKey = result.type === "city" ? `city_${idx}_${result.displayName}` : result.isoCode;
        const old = newData[resultKey];
        if (!old || old.zoneName === "N/A") { updated[resultKey] = old; return; }
        try {
          updated[resultKey] = {
            ...old,
            currentTime: new Date().toLocaleTimeString("en-US", {
              timeZone: old.zoneName,
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
          };
        } catch {
          updated[resultKey] = old;
        }
      });
      setTimezoneData(updated);
    }, 60000);

    return () => { isSubscribed = false; clearInterval(interval); };
  }, [combinedResults, isDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleItemClick = useCallback(async (result: SearchResult, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (timeZones.length >= MAX_TIMEZONES) {
        showWarningWithTimeout();
        setIsDropdownOpen(false);
        setInputText("");
        return;
      }
      
      const tz = result.timezone;
      if (!tz || tz.zoneName === "N/A") {
        toast.error(`No timezone data for ${result.displayName}`);
        return;
      }

      const abbreviation = tz.abbreviation || result.isoCode + "T";
      const timezoneId = result.type === "city" && result.cityName
        ? `${abbreviation}_${result.cityName}`
        : `${abbreviation}_${result.countryName}`;

      const cardName = result.type === "city" && result.cityName
        ? result.cityName
        : result.countryName;

      const cardFullName = result.type === "city" && result.cityName
        ? `${abbreviation.toUpperCase()} - ${tz.tzName || tz.zoneName}`
        : `${abbreviation.toUpperCase()} - ${tz.tzName || tz.zoneName || result.countryName}`;

      const newTimezone = {
        uuid: crypto.randomUUID(),
        id: timezoneId,
        name: cardName,
        fullName: cardFullName,
        offset: getOffsetString(tz.gmtOffset),
        country: result.countryName,
      };

      const updatedTimeZones = [...timeZones, newTimezone];
      setTimeZones(updatedTimeZones);
      
      setIsDropdownOpen(false);
      setInputText("");
      
      // Build slug by encoding each timezone ID separately to avoid double-encoding
      const allIds = updatedTimeZones.map(tz => tz.id);
      const basePath = allIds.length === 1
        ? encodeURIComponent(allIds[0])
        : `${encodeURIComponent(allIds[0])}-to-${allIds.slice(1).map(encodeURIComponent).join("-")}`;
      
      const params = new URLSearchParams(searchParams.toString());
      params.set('is24Hour', is24Hour.toString());
      params.set('viewMode', viewMode);
      const newUrl = `/converter/${basePath}${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(newUrl, { scroll: false });

    } catch (error) {
      console.error('Error in handleItemClick:', error);
      toast.error('Error selecting time zone');
      setIsDropdownOpen(false);
      setInputText("");
    }
  }, [timeZones, setTimeZones, slug, is24Hour, viewMode, searchParams, router, showWarningWithTimeout]);

  const getOffsetString = (gmtOffset: number): string => {
    const hours = Math.floor(gmtOffset / 3600);
    const minutes = Math.abs(Math.floor((gmtOffset % 3600) / 60));
    const sign = hours >= 0 ? "+" : "-";
    return `${sign}${Math.abs(hours).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Fallback handler: user picks a timezone for a custom location name
  const handleCustomLocationClick = useCallback((
    tz: { abbreviation: string; zoneName: string; gmtOffset: number; tzName: string; countryName: string },
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (timeZones.length >= MAX_TIMEZONES) {
        showWarningWithTimeout();
        setIsDropdownOpen(false);
        setInputText("");
        return;
      }

      const rawName = inputText.trim();
      if (!rawName) return;

      const displayName = rawName
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      const timezoneId = `${tz.abbreviation}_${displayName}`;

      const newTimezone = {
        uuid: crypto.randomUUID(),
        id: timezoneId,
        name: displayName,
        fullName: `${tz.abbreviation.toUpperCase()} - ${tz.tzName}`,
        offset: getOffsetString(tz.gmtOffset),
        country: tz.countryName,
      };

      const updatedTimeZones = [...timeZones, newTimezone];
      setTimeZones(updatedTimeZones);

      setIsDropdownOpen(false);
      setInputText("");

      const allIds = updatedTimeZones.map(t => t.id);
      const basePath = allIds.length === 1
        ? encodeURIComponent(allIds[0])
        : `${encodeURIComponent(allIds[0])}-to-${allIds.slice(1).map(encodeURIComponent).join("-")}`;

      const params = new URLSearchParams(searchParams.toString());
      params.set("is24Hour", is24Hour.toString());
      params.set("viewMode", viewMode);
      const newUrl = `/converter/${basePath}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(newUrl, { scroll: false });
    } catch (error) {
      console.error("Error in handleCustomLocationClick:", error);
      toast.error("Error selecting time zone");
      setIsDropdownOpen(false);
      setInputText("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZones, setTimeZones, is24Hour, viewMode, searchParams, router, showWarningWithTimeout, inputText]);

  // Reference to maintain the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
    setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <Input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={() => setIsDropdownOpen(true)}
        placeholder={maxLimitReached ? "Maximum limit reached (10)" : "Search by country, city, or timezone"}
        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          maxLimitReached ? "border-destructive bg-destructive/5" : "border-input"
        }`}
        disabled={maxLimitReached}
      />
      
      {/* Max limit warning message */}
      {showMaxLimitWarning && (
        <div className={`absolute left-0 right-0 -bottom-12 bg-amber-100 text-amber-800 px-3 py-2 rounded-md shadow-md z-20 text-sm ${
          isHiding ? 'animate-fade-out-up' : 'animate-fade-in-down'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v5a1 1 0 102 0V7zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Maximum of 10 time zones allowed. Remove a time zone to add another.
            </div>
            <button 
              onClick={() => {
                setIsHiding(true);
                setTimeout(() => {
                  setShowMaxLimitWarning(false);
                  setIsHiding(false);
                }, 300);
              }}
              className="ml-2 text-amber-800 hover:text-amber-900"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isDropdownOpen && !maxLimitReached && (
        <ul className="absolute z-10 w-full mt-1 bg-card text-card-foreground border rounded-md shadow-lg max-h-60 overflow-auto">
          {combinedResults.length === 0 ? (
            !debouncedInputText.trim() ? (
              <li className="p-4 text-muted-foreground text-center">
                <div className="font-medium">Start typing to search</div>
                <div className="text-sm mt-1">Search by country, city, or timezone</div>
              </li>
            ) : isSearchingServer ? (
              <li className="p-4 text-muted-foreground text-center">
                <div className="font-medium">Searching...</div>
                <div className="text-sm mt-1">Looking through 167,000+ locations</div>
              </li>
            ) : (
              <>
                <li className="p-3 text-center border-b border-border sticky top-0 bg-card z-10">
                  <div className="font-medium text-foreground">
                    Can&apos;t find &ldquo;{debouncedInputText}&rdquo;?
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Select a timezone to add it as a custom location
                  </div>
                </li>
                {uniqueTimezones.map((tz, idx) => (
                  <li
                    key={`fallback_${idx}_${tz.abbreviation}`}
                    onMouseDown={(e) => handleCustomLocationClick(tz, e)}
                    className="p-2 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors duration-150 flex justify-between items-center group"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {tz.abbreviation} - {tz.tzName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        GMT{getOffsetString(tz.gmtOffset)} &middot; {tz.countryName}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Add
                    </div>
                  </li>
                ))}
              </>
            )
          ) : (
            combinedResults.map((result, idx) => {
              const resultKey = result.type === "city" ? `city_${idx}_${result.displayName}` : result.isoCode;
              const timezoneInfo = timezoneData[resultKey] || {
                abbreviation: result.timezone.abbreviation || "Loading...",
                zoneName: result.timezone.zoneName || "Loading...",
                currentTime: "Loading...",
                gmtOffset: result.timezone.gmtOffset || 0,
                tzName: result.timezone.tzName || "Loading...",
              };

              return (
                <li
                  key={`${result.type}_${idx}_${result.isoCode}`}
                  onMouseDown={(e) => handleItemClick(result, e)}
                  className="p-2 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors duration-150 flex justify-between items-center relative group"
                >
                  <div className="absolute inset-0 bg-primary opacity-0 group-active:opacity-5 transition-opacity pointer-events-none"></div>
                  <div className="flex-1 relative z-10">
                    <div className="font-medium flex items-center gap-2">
                      {result.flag} {result.displayName}
                      {result.type === "city" && (
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">City</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div className="mt-1 flex flex-col">
                        <div>
                          {timezoneInfo.abbreviation} | {timezoneInfo.tzName}
                        </div>
                        <span>({timezoneInfo.zoneName})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium bg-muted/50 px-2 py-1 rounded whitespace-nowrap">
                    {timezoneInfo.currentTime}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
