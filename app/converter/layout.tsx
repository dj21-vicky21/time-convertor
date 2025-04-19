"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
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

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-50 p-6 text-gray-700">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Time Zone Converter
          </h1>
         <div className="flex justify-between">
         <p className="text-lg text-gray-600">
            Compare multiple time zones and plan global meetings with ease
          </p>
          {/* View Toggle and Add Button */}
        <div className="hidden md:flex justify-end items-center mb-6">
          <div className="flex gap-2">
            {slug && (
              <>
                <Button
                  variant={"outline"}
                  onClick={() => toggleViewMode("list")}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    viewMode === "list"
                      ? "bg-gray-900 text-white hover:bg-primary hover:text-white"
                      : "bg-white text-gray-700 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  <List size={20} />
                  List View
                </Button>
                <Button
                  variant={"outline"}
                  onClick={() => toggleViewMode("grid")}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    viewMode === "grid"
                      ? "bg-gray-900 text-white hover:bg-primary hover:text-white"
                      : "bg-white text-gray-700 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  <Grid size={20} />
                  Grid View
                </Button>
              </>
            )}
          </div>

          {/* <Button
            variant={'outline'}
            onClick={() => {
              const newId = Math.max(...timeZones.map(tz => tz.id)) + 1;
              setTimeZones([...timeZones, { id: newId, name: 'GMT', fullName: 'Greenwich Mean Time', offset: '+00:00' }]);
            }}
            className="px-4 py-2  rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Add Time Zone
          </Button> */}
        </div>
         </div>
        </div>

        

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-grow max-w-md">
              <div className="relative">
                <CountrySearchInput />
                <Plus
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                {/* Timezone counter */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    timeZones.length >= 10 
                      ? "bg-amber-100 text-amber-800" 
                      : timeZones.length >= 7
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {timeZones.length}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <Button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  variant={"outline"}
                  // className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
                >
                  <Calendar size={20} />
                  {format(currentDate, "dd/MM/yyyy")}
                </Button>
                {showDatePicker && (
                  <div className="absolute top-full mt-2 z-10">
                    <DatePicker
                      selected={currentDate}
                      onChange={(date) => {
                        if (date) {
                          setCurrentDate(date);
                          setShowDatePicker(false);
                        }
                      }}
                      inline
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={resetToNow}
                variant={"outline"}
                // className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <Clock size={20} />
                Now
              </Button>

              <Button
                variant={"outline"}
                className="hidden md:flex"
                onClick={() => {
                  // Create a shareable URL with the current settings
                  const urlSearchParams = new URLSearchParams();
                  urlSearchParams.set('is24Hour', is24Hour.toString());
                  urlSearchParams.set('viewMode', viewMode);
                  
                  // Get the base URL (without any query parameters)
                  const baseUrl = `${window.location.origin}${pathname}`;
                  
                  // Construct the full URL
                  const shareableUrl = `${baseUrl}${urlSearchParams.toString() ? `?${urlSearchParams.toString()}` : ''}`;
                  
                  // Copy to clipboard
                  navigator.clipboard.writeText(shareableUrl);
                  
                  toast("Link copied to clipboard", {
                    action: {
                      label: "X",
                      onClick: () => console.log("Undo"),
                    },
                  });
                }}
              >
                <LinkIcon size={20} />
                Save Link
              </Button>

              {/* <Button
                variant={"outline"}
                className="hidden md:flex"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: "Link copied to clipboard",
                    description: "You can share this link with others",
                    duration: 2000,
                    type: "success",
                  });
                }}
                // className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <Share size={20} />
                Share
              </Button> */}

              <Button
                variant={"outline"}
                onClick={toggle24HourFormat}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  is24Hour
                    ? "bg-primary text-white hover:bg-primary hover:text-white"
                    : "bg-white border border-gray-300"
                }`}
              >
                {is24Hour ? "24h" : "12h"}
              </Button>
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
          {/* {  timeZones.map((tz) => (
            <TimeCard
              currentDate={currentDate}
              handleTimeChange={handleTimeChange}
              is24Hour={is24Hour}
              removeTimeZone={removeTimeZone}
              tz={tz}
              key={tz.id}
            />
          ))} */}

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
