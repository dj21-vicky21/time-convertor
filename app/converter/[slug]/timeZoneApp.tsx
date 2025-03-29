"use client";

import React, { useEffect, useState } from "react";
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

  const handleTimeChange = (newDate: Date) => {
    setCurrentDate(new Date(newDate));
  };

  const removeTimeZone = (uuid: string) => {
    const filterZones = timeZones.filter((tz) => tz.uuid !== uuid);
    setTimeZones(filterZones);
  };

  function getValuesFromSlug(slug: string) {
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
  }

  function generateSlugStructure(values: string[]) {
    // Filter out empty values
    const filtered = values.filter((v) => v && v.length > 0);

    if (filtered.length === 0) return "";
    if (filtered.length === 1) return filtered[0];

    // First element + "-to-" + remaining elements joined with "-"
    return `${filtered[0]}-to-${filtered.slice(1).join("-")}`;
  }

  const getURLTimeZones = async (a: string[]) => {
    const allCountries = await getTimezones(a);
    return allCountries;
  };

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      // Set slug if it is not set yet
      setSlug(slug);

      // Split slug into the timezone abbreviations or countries
      const splitSlug = getValuesFromSlug(slug);
      const validTimeZones = await getURLTimeZones(splitSlug);
      setTimeZones(validTimeZones);
      console.log("--> ~ useEffect ~ splitSlug:", splitSlug);

      if (!splitSlug.length) return;

      // Generate the formatted slug structure
      const formatedSlug = generateSlugStructure(splitSlug);
      console.log("--> ~ useEffect ~ formatedSlug:", formatedSlug);

      // Push to the new route
      // router.push(formatedSlug);
    };

    fetchData();
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
