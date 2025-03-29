"use client";

import { useAppStore } from "@/store/appStore";
import React, { useEffect } from "react";

function EmptyTimeZone() {
  const {setSlug} = useAppStore();

  useEffect(() => {
    setSlug("");
  }, []);
  
  return (
    <div className="text-center mt-32 px-5 font-semibold">
      Begin by entering a city, town, or time zone in the search box above
    </div>
  );
}

export default EmptyTimeZone;
