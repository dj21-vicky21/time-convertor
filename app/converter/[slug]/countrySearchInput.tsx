"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Country, ICountry } from "country-state-city";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from "sonner";

type TimezoneInfo = {
  abbreviation: string;
  zoneName: string;
  currentTime: string;
  gmtOffset: number;
  tzName: string;
};

// Add type for search index
type CountryWithSearchIndex = ICountry[] & {
  searchIndex?: Map<string, Set<number>>;
};

export default function CountrySearchInput() {
  const { slug, is24Hour, viewMode, timeZones, setTimeZones } = useAppStore();
  const [inputText, setInputText] = useState("");
  const debouncedInputText = useDebounce(inputText, 300);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timezoneData, setTimezoneData] = useState<
    Record<string, TimezoneInfo>
  >({});
  const [maxLimitReached, setMaxLimitReached] = useState(false);
  const [showMaxLimitWarning, setShowMaxLimitWarning] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Maximum number of timezones allowed
  const MAX_TIMEZONES = 10;

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

  // Filter and sort countries based on multiple criteria with priority
  const filteredResults = useMemo(() => {
    if (!debouncedInputText.trim()) return [];
    
    const searchTerms = debouncedInputText.toLowerCase().split(' ').filter(Boolean);
    if (searchTerms.length === 0) return [];
    
    // Create or get cached search index
    const countriesWithIndex = allCountries as CountryWithSearchIndex;
    const searchIndex = countriesWithIndex.searchIndex || (countriesWithIndex.searchIndex = createSearchIndex(allCountries));
    
    // Get matching country indices for each search term
    const matchingSets = searchTerms.map(term => {
      const matches = new Set<number>();
      // Check for partial matches in the index
      for (const [key, indices] of searchIndex.entries()) {
        if (key.includes(term)) {
          indices.forEach(idx => matches.add(idx));
        }
      }
      return matches;
    });
    
    // Find intersection of all matching sets
    const commonMatches = [...matchingSets[0]].filter(idx =>
      matchingSets.every(set => set.has(idx))
    );
    
    // Get matching countries and sort them
    const matches = commonMatches.map(idx => allCountries[idx])
      .sort((a, b) => {
        const searchTerm = debouncedInputText.toLowerCase();
        
        // Exact match on zoneName gets highest priority
        const aZoneExact = a.timezones?.some(tz => tz.zoneName?.toLowerCase() === searchTerm);
        const bZoneExact = b.timezones?.some(tz => tz.zoneName?.toLowerCase() === searchTerm);
        if (aZoneExact !== bZoneExact) return aZoneExact ? -1 : 1;

        // Exact match on timezone abbreviation gets next priority
        const aTimezoneExact = a.timezones?.some(tz => tz.abbreviation?.toLowerCase() === searchTerm);
        const bTimezoneExact = b.timezones?.some(tz => tz.abbreviation?.toLowerCase() === searchTerm);
        if (aTimezoneExact !== bTimezoneExact) return aTimezoneExact ? -1 : 1;

        // Exact match on name gets next priority
        const aNameExact = a.name.toLowerCase() === searchTerm;
        const bNameExact = b.name.toLowerCase() === searchTerm;
        if (aNameExact !== bNameExact) return aNameExact ? -1 : 1;

        // Starts with zoneName gets next priority
        const aZoneStarts = a.timezones?.some(tz => 
          tz.zoneName?.toLowerCase().startsWith(searchTerm)
        );
        const bZoneStarts = b.timezones?.some(tz => 
          tz.zoneName?.toLowerCase().startsWith(searchTerm)
        );
        if (aZoneStarts !== bZoneStarts) return aZoneStarts ? -1 : 1;

        // Starts with timezone abbreviation gets next priority
        const aTimezoneStarts = a.timezones?.some(tz => 
          tz.abbreviation?.toLowerCase().startsWith(searchTerm)
        );
        const bTimezoneStarts = b.timezones?.some(tz => 
          tz.abbreviation?.toLowerCase().startsWith(searchTerm)
        );
        if (aTimezoneStarts !== bTimezoneStarts) return aTimezoneStarts ? -1 : 1;
        
        // Starts with name gets next priority
        const aNameStarts = a.name.toLowerCase().startsWith(searchTerm);
        const bNameStarts = b.name.toLowerCase().startsWith(searchTerm);
        if (aNameStarts !== bNameStarts) return aNameStarts ? -1 : 1;
        
        // Default to alphabetical by name
        return a.name.localeCompare(b.name);
    });
    
    return matches;
  }, [debouncedInputText, allCountries]);

  // Add timezone data cache
  const timezoneCache = new Map<string, TimezoneInfo>();

  // Calculate current times and timezone info for filtered results
  useEffect(() => {
    if (!isDropdownOpen || filteredResults.length === 0) {
      return;
    }

    let isSubscribed = true;
      const newData: Record<string, TimezoneInfo> = {};
    const now = new Date();

    // Process all countries in a single batch
      filteredResults.forEach((country) => {
        const tz = country.timezones?.[0];
      if (!tz) {
        newData[country.isoCode] = {
          abbreviation: "N/A",
          zoneName: "N/A",
          currentTime: "N/A",
          gmtOffset: 0,
          tzName: "N/A",
        };
        return;
      }

      // Check cache first
      const cacheKey = `${country.isoCode}_${tz.zoneName}_${now.getMinutes()}`;
      const cachedData = timezoneCache.get(cacheKey);
      
      if (cachedData) {
        newData[country.isoCode] = cachedData;
        return;
      }

          try {
            const timeString = new Date().toLocaleTimeString("en-US", {
              timeZone: tz.zoneName,
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

        const tzInfo = {
              abbreviation: tz.abbreviation || "N/A",
              zoneName: tz.zoneName || "N/A",
              currentTime: timeString,
              gmtOffset: tz.gmtOffset || 0,
              tzName: tz.tzName || "N/A",
            };

        // Cache the result
        timezoneCache.set(cacheKey, tzInfo);
        newData[country.isoCode] = tzInfo;
          } catch {
            newData[country.isoCode] = {
              abbreviation: tz.abbreviation || "N/A",
              zoneName: tz.zoneName || "N/A",
              currentTime: "N/A",
              gmtOffset: tz.gmtOffset || 0,
              tzName: tz.tzName || "N/A",
          };
        }
      });

    if (isSubscribed) {
      setTimezoneData(newData);
    }

    // Clean up old cache entries every minute
    const cleanup = () => {
      const currentMinute = new Date().getMinutes();
      for (const [key] of timezoneCache) {
        const [, , cachedMinute] = key.split('_');
        if (cachedMinute && parseInt(cachedMinute) !== currentMinute) {
          timezoneCache.delete(key);
        }
      }
    };

    const interval = setInterval(() => {
      if (isSubscribed) {
        cleanup();
        // Update times
        const updatedData: Record<string, TimezoneInfo> = {};
        Object.entries(newData).forEach(([isoCode, oldInfo]) => {
          const country = filteredResults.find(c => c.isoCode === isoCode);
          const tz = country?.timezones?.[0];
          
          if (tz?.zoneName) {
            try {
              updatedData[isoCode] = {
                ...oldInfo,
                currentTime: new Date().toLocaleTimeString("en-US", {
                  timeZone: tz.zoneName,
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              };
            } catch {
              updatedData[isoCode] = oldInfo;
            }
          } else {
            updatedData[isoCode] = oldInfo;
          }
        });
        setTimezoneData(updatedData);
      }
    }, 60000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [filteredResults, isDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setIsDropdownOpen(true);
  };

  // Memoize URL handling functions
  const handleItemClick = useCallback(async (country: ICountry, e: React.MouseEvent) => {
    // Prevent the dropdown from closing immediately and stop event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Check if maximum limit is reached
      if (timeZones.length >= MAX_TIMEZONES) {
        showWarningWithTimeout();
        
        // Close dropdown without adding more timezones
        setIsDropdownOpen(false);
        setInputText("");
        return;
      }
      
      // Validate timezone data
      if (!country.timezones?.length) {
        console.warn('Country has no timezone data:', country.name);
        toast.error(`${country.name} has no timezone data`);
        return;
      }
      
      // Get timezone and prepare URL parts
      const timezone = country.timezones[0];
      const abbreviation = timezone.abbreviation || country.isoCode + "T";
      const countryCode = `${abbreviation}_${country.name}`;

      // Create new timezone object directly
      const newTimezone = {
        uuid: crypto.randomUUID(),
        id: countryCode,
        name: abbreviation.toUpperCase(),
        fullName: timezone.tzName || timezone.zoneName || `${abbreviation} (${country.name})`,
        offset: getOffsetString(timezone.gmtOffset),
        country: country.name
      };

      // Update state with new timezone
      const updatedTimeZones = [...timeZones, newTimezone];
      setTimeZones(updatedTimeZones);
      
      // Close dropdown immediately
      setIsDropdownOpen(false);
      setInputText("");
      
      // Build the path efficiently
      const basePath = encodeURIComponent(
        slug
          ? slug.includes("-to-")
            ? `${slug}-${countryCode}`
            : `${slug}-to-${countryCode}`
          : countryCode
      );
      
      // Update URL without navigation
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

  // Add the getOffsetString helper function at the top of the file after imports
  const getOffsetString = (gmtOffset: number): string => {
    const hours = Math.floor(gmtOffset / 3600);
    const minutes = Math.abs(Math.floor((gmtOffset % 3600) / 60));
    const sign = hours >= 0 ? "+" : "-";
    return `${sign}${Math.abs(hours).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

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
        placeholder={maxLimitReached ? "Maximum limit reached (10)" : "Search by Country"}
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
          {filteredResults.length === 0 ? (
            !debouncedInputText.trim() ? (
              <li className="p-4 text-muted-foreground text-center">
                <div className="font-medium">Start typing to search</div>
                <div className="text-sm mt-1">Search by country name, code, or timezone</div>
              </li>
            ) : (
              <li className="p-4 text-muted-foreground text-center">
                <div className="font-medium">No countries found</div>
                <div className="text-sm mt-1">Try a different search term</div>
              </li>
            )
          ) : (
            filteredResults.map((country) => {
              const timezoneInfo = timezoneData[country.isoCode] || {
                abbreviation: "Loading...",
                zoneName: "Loading...",
                currentTime: "Loading...",
                gmtOffset: 0,
                tzName: "Loading...",
              };

              return (
                <li
                  key={country.isoCode}
                  onMouseDown={(e) => handleItemClick(country, e)}
                  className="p-2 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors duration-150 flex justify-between items-center relative group"
                >
                  <div className="absolute inset-0 bg-primary opacity-0 group-active:opacity-5 transition-opacity pointer-events-none"></div>
                  <div className="flex-1 relative z-10">
                    <div className="font-medium flex items-center gap-2">
                      {country.flag} {country.name}
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
