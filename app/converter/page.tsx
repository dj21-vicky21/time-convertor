"use client";

import { useAppStore } from "@/store/appStore";
import React, { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function EmptyTimeZone() {
  const { setSlug, is24Hour, viewMode } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);

  useEffect(() => {
    setSlug("");
  }, [setSlug]);

  // Sync URL with current settings -- skips when URL already matches to prevent infinite loop
  useEffect(() => {
    const currentIs24Hour = searchParams.get("is24Hour");
    const currentViewMode = searchParams.get("viewMode");

    const needsUpdate =
      currentIs24Hour !== is24Hour.toString() ||
      currentViewMode !== viewMode;

    if (!initializedRef.current || needsUpdate) {
      initializedRef.current = true;
      const params = new URLSearchParams();
      params.set("is24Hour", is24Hour.toString());
      params.set("viewMode", viewMode);
      router.replace(`/converter?${params.toString()}`, { scroll: false });
    }
  // searchParams intentionally excluded -- including it causes an infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is24Hour, viewMode, router]);

  return (
    <div className="text-center mt-32 px-5 font-semibold">
      Begin by entering a Country, ISO Code or Time Zone in the search box above
    </div>
  );
}

export default EmptyTimeZone;
