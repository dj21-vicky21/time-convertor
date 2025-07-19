"use client";

import React, { Suspense, useEffect, useState, useCallback, useRef } from "react";
import {
  Clock,
  Calendar,
  Link as LinkIcon,
  Plus,
  Grid,
  List,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import CountrySearchInput from "./[slug]/countrySearchInput";
import { toast } from "sonner";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

function App({ children }: { children: React.ReactNode }) {
  const {
    currentDate,
    setCurrentDate,
    is24Hour,
    setIs24Hour,
    slug,
    setViewMode,
    viewMode,
    timeZones,
  } = useAppStore();
  // const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  // Add ref for calendar container
  const calendarRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Add click outside handler for calendar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Helper function to update URL params
  const updateQueryParams = useCallback((params: Record<string, string>) => {
    const urlSearchParams = new URLSearchParams(searchParams.toString());
    
    // Update params
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        urlSearchParams.delete(key);
      } else {
        urlSearchParams.set(key, value);
      }
    });
    
    // Create the new URL
    const newUrl = pathname + (urlSearchParams.toString() ? `?${urlSearchParams.toString()}` : '');
    
    // Update URL without refresh
    router.replace(newUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  // Load initial settings from URL
  useEffect(() => {
    const Is24HourSearchParams = searchParams.get("is24Hour");
    if (Is24HourSearchParams && Is24HourSearchParams === "true") {
      setIs24Hour(true);
    }
    
    const viewModeSearchParams = searchParams.get("viewMode");
    if (viewModeSearchParams && viewModeSearchParams === "grid") {
      setViewMode("grid");
    }
  }, [searchParams, setIs24Hour, setViewMode]);
  
  // Toggle 24 hour format
  const toggle24HourFormat = useCallback(() => {
    const newValue = !is24Hour;
    setIs24Hour(newValue);
    updateQueryParams({ is24Hour: newValue.toString() });
  }, [is24Hour, setIs24Hour, updateQueryParams]);
  
  // Toggle view mode
  const toggleViewMode = useCallback((mode: "list" | "grid") => {
    setViewMode(mode);
    updateQueryParams({ viewMode: mode });
  }, [setViewMode, updateQueryParams]);

  const resetToNow = () => {
    setCurrentDate(new Date());
  };

  // const handleDragStart = (e: React.DragEvent, id: number) => {
  //   const draggedElement = e.currentTarget as HTMLElement;
  //   const card = draggedElement.closest('.timezone-card') as HTMLElement;
  //   if (card) {
  //     // Set the drag image to be the entire card
  //     e.dataTransfer.setDragImage(card, 0, 0);
  //   }
  //   setDraggedZone(id);
  // };

  // const handleDragOver = (e: React.DragEvent, id: number) => {
  //   e.preventDefault();
  //   if (draggedZone === null || draggedZone === id) return;

  //   const newTimeZones = [...timeZones];
  //   const draggedIndex = newTimeZones.findIndex(tz => tz.id === draggedZone);
  //   const dropIndex = newTimeZones.findIndex(tz => tz.id === id);

  //   const [draggedItem] = newTimeZones.splice(draggedIndex, 1);
  //   newTimeZones.splice(dropIndex, 0, draggedItem);

  //   setTimeZones(newTimeZones);
  // };

  // const handleDragEnd = () => {
  //   setDraggedZone(null);
  // };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">
            Time Zone Converter
          </h1>
          <div className="flex items-center justify-between h-8">
            <p className="text-lg text-muted-foreground">
              Compare multiple time zones and plan global meetings with ease
            </p>
            {/* View Toggle and Add Button */}
            <div className="hidden md:flex justify-end items-center">
              <div className="flex gap-2">
                {slug && (
                  <>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      onClick={() => toggleViewMode("list")}
                      className="gap-2"
                    >
                      <List size={20} />
                      List View
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      onClick={() => toggleViewMode("grid")}
                      className="gap-2"
                    >
                      <Grid size={20} />
                      Grid View
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-card text-card-foreground rounded-xl shadow-sm p-4 mb-6 border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-grow max-w-md">
              <div className="relative">
                <CountrySearchInput />
                <Plus
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                {/* Timezone counter */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    timeZones.length >= 10 
                      ? "bg-destructive/10 text-destructive" 
                      : timeZones.length >= 7
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {timeZones.length}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative" ref={calendarRef}>
                <Button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  variant="outline"
                  className="gap-2"
                >
                  <Calendar size={20} />
                  {format(currentDate, "dd/MM/yyyy")}
                </Button>
                {showDatePicker && (
                  <div className="absolute top-full mt-2 z-50">
                    <div className="p-1 bg-popover rounded-md border shadow-lg">
                      <DatePicker
                        selected={currentDate}
                        onChange={(date) => {
                          if (date) {
                            setCurrentDate(date);
                            setShowDatePicker(false);
                          }
                        }}
                        inline
                        showPopperArrow={false}
                        calendarClassName="!border-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={resetToNow}
                variant="outline"
                className="gap-2"
              >
                <Clock size={20} />
                Now
              </Button>

              <Button
                variant="outline"
                className="hidden md:flex gap-2"
                onClick={() => {
                  const urlSearchParams = new URLSearchParams();
                  urlSearchParams.set('is24Hour', is24Hour.toString());
                  urlSearchParams.set('viewMode', viewMode);
                  const baseUrl = `${window.location.origin}${pathname}`;
                  const shareableUrl = `${baseUrl}${urlSearchParams.toString() ? `?${urlSearchParams.toString()}` : ''}`;
                  navigator.clipboard.writeText(shareableUrl);
                  toast("Link copied to clipboard");
                }}
              >
                <LinkIcon size={20} />
                Save Link
              </Button>

              <Button
                variant={is24Hour ? "default" : "outline"}
                onClick={toggle24HourFormat}
                className="gap-2"
              >
                {is24Hour ? "24h" : "12h"}
              </Button>

              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Time Zones */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            timeZones.length && viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "md:w-3xl space-y-4 m-auto"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const Page = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <App>{children}</App>
    </Suspense>
  );
};

export default Page;
