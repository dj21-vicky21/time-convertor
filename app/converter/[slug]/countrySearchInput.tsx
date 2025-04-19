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

export default function CountrySearchInput() {
  const { slug, is24Hour, viewMode, timeZones } = useAppStore();
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

  // Helper function to navigate with query params
  const navigateWithParams = useCallback((path: string) => {
    // Get current query params
    const params = new URLSearchParams(searchParams.toString());
    
    // Ensure we have latest values
    params.set('is24Hour', is24Hour.toString());
    params.set('viewMode', viewMode);
    
    // Create URL with params
    const newUrl = params.toString() ? `${path}?${params.toString()}` : path;
    
    // Navigate
    router.push(newUrl);
  }, [router, searchParams, is24Hour, viewMode]);

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

  // Filter and sort countries based on multiple criteria with priority
  const filteredResults = useMemo(() => {
    if (!debouncedInputText.trim()) return [];

    const value = debouncedInputText.toLowerCase();

    // First filter all possible matches
    const filtered = allCountries.filter((country) => {
      // Basic country info
      const matchesName = country.name.toLowerCase().includes(value);
      const matchesIsoCode = country.isoCode.toLowerCase().includes(value);
      const matchesCurrency = country.currency?.toLowerCase().includes(value);
      const matchesPhoneCode = country.phonecode?.toLowerCase().includes(value);

      // Timezone info
      const matchesTimezone = country.timezones?.some((tz) => {
        return (
          (tz.abbreviation && tz.abbreviation.toLowerCase().includes(value)) ||
          (tz.zoneName && tz.zoneName.toLowerCase().includes(value)) ||
          (tz.tzName && tz.tzName.toLowerCase().includes(value))
        );
      });

      return (
        matchesName ||
        matchesIsoCode ||
        matchesCurrency ||
        matchesPhoneCode ||
        matchesTimezone
      );
    });

    // Then sort by match priority
    return filtered.sort((a, b) => {
      // Exact match on name gets highest priority
      const aNameExact = a.name.toLowerCase() === value;
      const bNameExact = b.name.toLowerCase() === value;
      if (aNameExact && !bNameExact) return -1;
      if (!aNameExact && bNameExact) return 1;

      // Exact match on ISO code
      const aIsoExact = a.isoCode.toLowerCase() === value;
      const bIsoExact = b.isoCode.toLowerCase() === value;
      if (aIsoExact && !bIsoExact) return -1;
      if (!aIsoExact && bIsoExact) return 1;

      // Starts with input
      const aNameStartsWith = a.name.toLowerCase().startsWith(value);
      const bNameStartsWith = b.name.toLowerCase().startsWith(value);
      if (aNameStartsWith && !bNameStartsWith) return -1;
      if (!aNameStartsWith && bNameStartsWith) return 1;

      // Exact match on currency
      const aCurrencyExact = a.currency?.toLowerCase() === value;
      const bCurrencyExact = b.currency?.toLowerCase() === value;
      if (aCurrencyExact && !bCurrencyExact) return -1;
      if (!aCurrencyExact && bCurrencyExact) return 1;

      // Exact match on timezone
      const aTzExact = a.timezones?.some(
        (tz) =>
          tz.abbreviation?.toLowerCase() === value ||
          tz.zoneName?.toLowerCase() === value ||
          tz.tzName?.toLowerCase() === value
      );
      const bTzExact = b.timezones?.some(
        (tz) =>
          tz.abbreviation?.toLowerCase() === value ||
          tz.zoneName?.toLowerCase() === value ||
          tz.tzName?.toLowerCase() === value
      );
      if (aTzExact && !bTzExact) return -1;
      if (!aTzExact && bTzExact) return 1;

      // Finally, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [debouncedInputText, allCountries]);

  // Calculate current times and timezone info for filtered results
  useEffect(() => {
    if (!isDropdownOpen || filteredResults.length === 0) {
      setTimezoneData({});
      return;
    }

    let isSubscribed = true; // Add cleanup flag

    const updateTimezoneData = () => {
      if (!isSubscribed) return; // Check if still subscribed
      const newData: Record<string, TimezoneInfo> = {};

      filteredResults.forEach((country) => {
        const tz = country.timezones?.[0];

        if (tz) {
          try {
            const timeString = new Date().toLocaleTimeString("en-US", {
              timeZone: tz.zoneName,
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            newData[country.isoCode] = {
              abbreviation: tz.abbreviation || "N/A",
              zoneName: tz.zoneName || "N/A",
              currentTime: timeString,
              gmtOffset: tz.gmtOffset || 0,
              tzName: tz.tzName || "N/A",
            };
          } catch {
            newData[country.isoCode] = {
              abbreviation: tz.abbreviation || "N/A",
              zoneName: tz.zoneName || "N/A",
              currentTime: "N/A",
              gmtOffset: tz.gmtOffset || 0,
              tzName: tz.tzName || "N/A",
            };
          }
        } else {
          newData[country.isoCode] = {
            abbreviation: "N/A",
            zoneName: "N/A",
            currentTime: "N/A",
            gmtOffset: 0,
            tzName: "N/A",
          };
        }
      });

      setTimezoneData(newData);
    };

    updateTimezoneData();
    const interval = setInterval(updateTimezoneData, 60000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [filteredResults, isDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleItemClick = (country: ICountry, e: React.MouseEvent) => {
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
      if (!country.timezones || !country.timezones.length) {
        console.warn('Country has no timezone data:', country.name);
        toast.error(`${country.name} has no timezone data`);
        return;
      }
      
      // Validate that the timezone has necessary data
      const timezone = country.timezones[0];
      if (!timezone.abbreviation) {
        console.warn('Invalid timezone data for country:', country.name);
        
        // Create a fallback abbreviation if needed
        const fallbackAbbreviation = country.isoCode + "T";
        
        // Build a fallback URL with the country code
        const fallbackCode = `${fallbackAbbreviation}_${country.name}`;
        let basePath;
        if (slug.includes("-to-")) {
          basePath = `${slug}-${encodeURIComponent(fallbackCode)}`;
        } else if (slug) {
          basePath = `${slug}-to-${encodeURIComponent(fallbackCode)}`;
        } else {
          basePath = encodeURIComponent(fallbackCode);
        }
        
        // Close dropdown
        setIsDropdownOpen(false);
        setInputText("");
        
        // Navigate with the fallback
        setTimeout(() => {
          navigateWithParams(`/converter/${basePath}`);
        }, 50);
        
        return;
      }
      
      // Create the country code with URL encoding for the country name
      const countryCode = `${timezone.abbreviation}_${country.name}`;
      
      // Build the path with proper URL encoding
      let basePath;
      if (slug.includes("-to-")) {
        basePath = `${slug}-${encodeURIComponent(countryCode)}`;
      } else if (slug) {
        basePath = `${slug}-to-${encodeURIComponent(countryCode)}`;
      } else {
        basePath = encodeURIComponent(countryCode);
      }
      
      // Log the navigation path for debugging
      console.log('Navigating to:', `/converter/${basePath}`);
      
      // Close dropdown immediately to prevent further interactions
      setIsDropdownOpen(false);
      setInputText("");
      
      // Navigate with a small delay to ensure state is updated
      setTimeout(() => {
        navigateWithParams(`/converter/${basePath}`);
      }, 50);
    } catch (error) {
      console.error('Error in handleItemClick:', error);
      toast.error('Error selecting time zone');
      setIsDropdownOpen(false);
      setInputText("");
    }
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
          maxLimitReached ? "border-amber-500 bg-amber-50" : "border-gray-300"
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
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredResults.length > 0 ? (
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
                  className="p-2 cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-colors duration-150 flex justify-between items-center text-black relative group"
                >
                  <div className="absolute inset-0 bg-blue-500 opacity-0 group-active:opacity-10 transition-opacity pointer-events-none"></div>
                  <div className="flex-1 relative z-10">
                    <div className="font-medium flex items-center gap-2">
                      {country.flag} {country.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="mt-1 flex flex-col">
                        <div>
                          {timezoneInfo.abbreviation} | {timezoneInfo.tzName}
                        </div>
                        <span>({timezoneInfo.zoneName})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                    {timezoneInfo.currentTime}
                  </div>
                </li>
              );
            })
          ) : inputText ? (
            <li className="p-4 text-gray-600 text-center">
              <div className="font-medium">No countries found</div>
              <div className="text-sm mt-1">Try a different search term</div>
            </li>
          ) : (
            <li className="p-4 text-gray-600 text-center">
              <div className="font-medium">Start typing to search</div>
              <div className="text-sm mt-1">Search by country name, code, or timezone</div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
