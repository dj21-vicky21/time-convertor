"use client";

import { TimeZone } from "@/lib/types";
import React, { useEffect, useState } from "react";
import TimeCard from "@/components/card";
import { useAppStore } from "@/store/appStore";

const INITIAL_TIMEZONES: TimeZone[] = [
  { id: 1, name: "IST", fullName: "India Standard Time", offset: "+05:30" },
  { id: 2, name: "EST", fullName: "Eastern Standard Time", offset: "-4:00" },
];

function TimeZoneApp({ slug }: { slug: string }) {
  const { currentDate, setCurrentDate, is24Hour, setSlug } = useAppStore();
  const [timeZones, setTimeZones] = useState<TimeZone[]>(INITIAL_TIMEZONES);

  const handleTimeChange = (newDate: Date) => {
    setCurrentDate(new Date(newDate));
  };

  const removeTimeZone = (id: number) => {
    setTimeZones(timeZones.filter((tz) => tz.id !== id));
  };

  useEffect(() => {
    if (!slug) return;
    setSlug(slug);
  }, [slug, setSlug]);

  return (
    <>
      {timeZones.map((tz) => (
        <TimeCard
          currentDate={currentDate}
          handleTimeChange={handleTimeChange}
          is24Hour={is24Hour}
          removeTimeZone={removeTimeZone}
          tz={tz}
          key={tz.id}
        />
      ))}
    </>
  );
}

export default TimeZoneApp;
