"use client";

import { useAppStore } from "@/store/appStore";
import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function EmptyTimeZone() {
  const { setSlug, is24Hour, viewMode } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Update URL with query parameters when loading the empty page
  useEffect(() => {
    setSlug("");

    // Update URL with the current settings
    const params = new URLSearchParams(searchParams.toString());
    params.set('is24Hour', is24Hour.toString());
    params.set('viewMode', viewMode);
    
    // Create URL with params
    const newUrl = params.toString() ? `/converter?${params.toString()}` : "/converter";
    
    // Replace URL without refreshing page
    router.replace(newUrl, { scroll: false });
  }, [setSlug, router, searchParams, is24Hour, viewMode]);

  return (
    <div className="text-center mt-32 px-5 font-semibold">
      Begin by entering a Country, ISO Code or Time Zone in the search box above
    </div>
  );
}

export default EmptyTimeZone;
