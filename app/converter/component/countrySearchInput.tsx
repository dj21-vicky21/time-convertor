"use client";

import { useState, useMemo, useEffect} from "react";
import { Country, ICountry } from "country-state-city";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

type TimezoneInfo = {
  abbreviation: string;
  zoneName: string;
  currentTime: string;
  gmtOffset: number;
  tzName: string;
};

export default function CountrySearchInput() {
  const { slug } = useAppStore()
  const [inputText, setInputText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timezoneData, setTimezoneData] = useState<
    Record<string, TimezoneInfo>
  >({});
  const router = useRouter();

  // Get all countries once and memoize
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  // Filter and sort countries based on multiple criteria with priority
  const filteredResults = useMemo(() => {
    if (!inputText.trim()) return [];

    const value = inputText.toLowerCase();

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
  }, [inputText, allCountries]);

  // Calculate current times and timezone info for filtered results
  useEffect(() => {
    if (!isDropdownOpen || filteredResults.length === 0) {
      setTimezoneData({});
      return;
    }

    const updateTimezoneData = () => {
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

    // Calculate immediately
    updateTimezoneData();

    // Update times every minute
    const interval = setInterval(updateTimezoneData, 60000);

    return () => clearInterval(interval);
  }, [filteredResults, isDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleItemClick = (country: ICountry) => {
    // setInputText(country.name);
    setInputText("");
    setIsDropdownOpen(false);
    if(!country.timezones) return 

    const countryCode = country.timezones[0].abbreviation + "_" + country.name
    router.push(`/converter/${slug.includes("-to-") ? slug +"-"+ countryCode : slug ? slug + "-to-" + countryCode : countryCode }`);
    console.log("Selected country:", country);
  };

  return (
    <div>
      <Input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={() => setIsDropdownOpen(true)}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        placeholder="Search by Country"
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isDropdownOpen && inputText && (
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
                  onClick={() => handleItemClick(country)}
                  className="p-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center text-black"
                >
                  <div className="flex-1">
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
          ) : (
            <li className="p-2 text-gray-600">No countries found</li>
          )}
        </ul>
      )}
    </div>
  );
}
