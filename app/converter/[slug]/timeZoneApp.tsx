"use client";

import React, { useEffect, useState, useCallback } from "react";
import TimeCard from "@/components/card";
import { useAppStore } from "@/store/appStore";
import { useRouter } from "next/navigation";
import { getTimezones } from "@/actions/getTimeZone";

function TimeZoneApp({ slug }: { slug: string }) {
  const {
    currentDate,
    setCurrentDate,
    is24Hour,
    setSlug,
    setTimeZones,
    timeZones,
  } = useAppStore();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize these functions to prevent recreating on every render
  const handleTimeChange = useCallback((newDate: Date) => {
    setCurrentDate(new Date(newDate));
  }, [setCurrentDate]);

  const removeTimeZone = useCallback((uuid: string) => {
    const filterZones = timeZones.filter((tz) => tz.uuid !== uuid);
    setTimeZones(filterZones);
  }, [setTimeZones,timeZones]);

  // Memoize these pure functions
  const getValuesFromSlug = useCallback((slug: string) => {
    const parts = slug.split("-").filter((part) => part.length > 0);

    // Return empty array if no valid parts
    if (parts.length === 0) return [];

    // Only return [firstValue] if "to" doesn't appear right after it
    if (parts.length < 2 || parts[1] !== "to") {
      return [parts[0]];
    }

    // If "to" appears right after first value, return all non-"to" values
    return parts.filter(
      (part, index) => part !== "to" && (index === 0 || index > 1)
    );
  }, []);

  const generateSlugStructure = useCallback((values: string[]) => {
    // Filter out empty values
    const filtered = values.filter((v) => v && v.length > 0);

    if (filtered.length === 0) return "";
    if (filtered.length === 1) return filtered[0];

    // First element + "-to-" + remaining elements joined with "-"
    return `${filtered[0]}-to-${filtered.slice(1).join("-")}`;
  }, []);

  const getURLTimeZones = async (a: string[]) => {
    const allCountries = await getTimezones(a);
    return allCountries;
  };

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setSlug(slug);
      const splitSlug = getValuesFromSlug(slug);
      const validTimeZones = await getURLTimeZones(splitSlug);
      setTimeZones(validTimeZones);
      
      if (!splitSlug.length) return;
      // const formatedSlug = generateSlugStructure(splitSlug);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, setSlug]);

  useEffect(() => {
    if (timeZones.length === 0) {
      router.push("/converter");
      return;
    }
    const formattedSlug = generateSlugStructure(timeZones.map((tz) => tz.id));
    // Push to the new route
    // router.push({
    //   pathname: formattedSlug,
    //   query: {
    //     is24Hour: is24Hour,
    //     viewMode: viewMode
    //   }
    // });
    router.push(formattedSlug)
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, timeZones]);

  return (
    <>
      {isClient &&
        timeZones.map((tz, index) => (
          <TimeCard
            currentDate={currentDate}
            handleTimeChange={handleTimeChange}
            is24Hour={is24Hour}
            removeTimeZone={removeTimeZone}
            tz={tz}
            key={tz.id + index}
          />
        ))}
    </>
  );
}

export default TimeZoneApp;
