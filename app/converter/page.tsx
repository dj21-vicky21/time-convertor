"use client";

import { useAppStore } from "@/store/appStore";
import React, { Suspense, useEffect } from "react";

function EmptyTimeZone() {
  const {setSlug} = useAppStore();

  useEffect(() => {
    setSlug("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="text-center mt-32 px-5 font-semibold">
      Begin by entering a city, town, or time zone in the search box above
    </div>
    </Suspense>
  );
}

export default EmptyTimeZone;
