"use client";

import React, { useEffect, useState } from "react";
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
import { useSearchParams } from 'next/navigation';


function App({ children }: { children: React.ReactNode }) {
  const { currentDate, setCurrentDate, is24Hour, setIs24Hour, slug ,setViewMode , viewMode} =
    useAppStore();
  // const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  const searchParams = useSearchParams();

  useEffect(() => {

  const Is24HourSearchParams = searchParams.get('is24Hour');

  if(Is24HourSearchParams && Is24HourSearchParams === "true") {
    setIs24Hour(true);
  }
  const viewModeSearchParams = searchParams.get('viewMode');

  if(viewModeSearchParams && viewModeSearchParams === "grid") {
    setViewMode("grid");
  } 

  }, []);

  // const [draggedZone, setDraggedZone] = useState<number | null>(null);
  // const searchParams = useSearchParams();

  // const search = searchParams.get("timezone");

  // https://www.npmjs.com/package/react-timezone-select
  // eg
  // https://ndom91.github.io/react-timezone-select/

  // useEffect(() => {
  //   if (!search) return;
  //   setTimeZones(INITIAL_TIMEZONES);
  // }, []);

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Time Zone Converter
          </h1>
          <p className="text-lg text-gray-600">
            Compare multiple time zones and plan global meetings with ease
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-grow max-w-md">
              <div className="relative">
                <CountrySearchInput/>
                {/* <Input
                  type="text"
                  placeholder="Add Time Zone, City or Town"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                /> */}
                <Plus
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
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
                onClick={() =>{
                    navigator.clipboard.writeText(window.location.href+`?is24Hour=${is24Hour}&viewMode=${viewMode}`);
                    toast("Link copied to clipboard", {
                      description: "You can share this link with others",
                      action: {
                        label: "Undo",
                        onClick: () => console.log("Undo"),
                      },
                    })
                  }
                }
                // className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
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
                onClick={() => setIs24Hour(!is24Hour)}
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

        {/* View Toggle and Add Button */}
        <div className="hidden md:flex justify-end items-center mb-6">
          <div className="flex gap-2">
            {slug && (
              <>
                <Button
                  variant={"outline"}
                  onClick={() => setViewMode("list")}
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
                  onClick={() => setViewMode("grid")}
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

        {/* Time Zones */}
        <div
          className={`${
            viewMode === "grid"
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

export default App;
