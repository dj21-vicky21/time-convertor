"use client";

import { X, GripVertical } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { TimeZoneTimeline } from "./TimeZoneTimeline";
import { TimeCardProps } from "@/lib/types";
import { format, parse, addMinutes } from "date-fns";
import { useAppStore } from "@/store/appStore";

// Generate time options for dropdown in 30-minute intervals
const generateTimeOptions = (is24Hour: boolean) => {
  const options = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0); // Midnight

  for (let i = 0; i < 48; i++) {
    // Create a new Date for each time slot
    const time = new Date(baseDate.getTime() + i * 30 * 60 * 1000); // 30 min intervals

    const formattedTime = is24Hour
      ? format(time, 'HH:mm')
      : format(time, 'h:mm a');

    options.push(formattedTime);
  }

  return options;
};

// Find the closest time in options to the given time
const findClosestTime = (options: string[], time: string, is24Hour: boolean): number => {
  // If time format doesn't match any option, return 0
  if (!time || time.length < 4) return 0;
  
  try {
    // Parse the input time
    const currentTime = is24Hour
      ? parse(time, 'HH:mm', new Date())
      : parse(time, 'h:mm a', new Date());
    
    // Find the option that's closest to the current time
    let closestIndex = 0;
    let smallestDiff = Infinity;
    
    options.forEach((option, index) => {
      const optionTime = is24Hour
        ? parse(option, 'HH:mm', new Date())
        : parse(option, 'h:mm a', new Date());
      
      const diff = Math.abs(optionTime.getTime() - currentTime.getTime());
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  } catch {
    return 0;
  }
};

function TimeCard({
  removeTimeZone,
  tz,
  currentDate,
  handleTimeChange,
  is24Hour,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: TimeCardProps) {
  const [editableTime, setEditableTime] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { timeZones } = useAppStore();
  const isAtMaxLimit = timeZones.length >= 10;
  
  // Generate time options once when component mounts
  const timeOptions = React.useMemo(() => generateTimeOptions(is24Hour), [is24Hour]);

  const getOffsetMinutes = (offsetStr: string): number => {
    const match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;
    const [, sign, hours, minutes] = match;
    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
    return sign === "+" ? totalMinutes : -totalMinutes;
  };

  const getLocalOffsetMinutes = (): number => {
    return -currentDate.getTimezoneOffset();
  };

  const convertToTargetTime = (date: Date, toOffset: string): Date => {
    const targetOffset = getOffsetMinutes(toOffset);
    const localOffset = getLocalOffsetMinutes();
    const diffMinutes = targetOffset - localOffset;
    return addMinutes(date, diffMinutes);
  };

  const handleTimeEdit = () => {
    const tzDate = convertToTargetTime(currentDate, tz.offset);
    const time = format(tzDate, is24Hour ? "HH:mm" : "h:mm a");
    setEditableTime(time);
    setIsEditing(true);
    setShowSuggestions(true);
  };

  const convertToLocalTime = (date: Date, fromOffset: string): Date => {
    const sourceOffset = getOffsetMinutes(fromOffset);
    const localOffset = getLocalOffsetMinutes();
    const diffMinutes = localOffset - sourceOffset;
    return addMinutes(date, diffMinutes);
  };

  const handleTimeSubmit = () => {
    try {
      let newDate: Date;

      if (is24Hour) {
        const [hours, minutes] = editableTime.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes))
          throw new Error("Invalid time format");

        const tzDate = convertToTargetTime(currentDate, tz.offset);
        tzDate.setHours(hours, minutes, 0, 0);
        newDate = convertToLocalTime(tzDate, tz.offset);
      } else {
        // Parse 12-hour format
        const parsedDate = parse(editableTime, "h:mm a", new Date());
        if (isNaN(parsedDate.getTime())) throw new Error("Invalid time format");

        const tzDate = convertToTargetTime(currentDate, tz.offset);
        tzDate.setHours(parsedDate.getHours(), parsedDate.getMinutes(), 0, 0);
        newDate = convertToLocalTime(tzDate, tz.offset);
      }

      handleTimeChange(newDate);
      setIsEditing(false);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Invalid time format:", error);
      setIsEditing(false);
      setShowSuggestions(false);
    }
  };
  
  // Handle suggestion selection
  const handleSelectSuggestion = (time: string) => {
    setEditableTime(time);
    setIsEditing(false);
    setShowSuggestions(false);
    
    try {
      let newDate: Date;
      
      if (is24Hour) {
        const [hours, minutes] = time.split(":").map(Number);
        const tzDate = convertToTargetTime(currentDate, tz.offset);
        tzDate.setHours(hours, minutes, 0, 0);
        newDate = convertToLocalTime(tzDate, tz.offset);
      } else {
        const parsedDate = parse(time, "h:mm a", new Date());
        const tzDate = convertToTargetTime(currentDate, tz.offset);
        tzDate.setHours(parsedDate.getHours(), parsedDate.getMinutes(), 0, 0);
        newDate = convertToLocalTime(tzDate, tz.offset);
      }
      
      handleTimeChange(newDate);
    } catch (error) {
      console.error("Error setting time:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        if (isEditing) {
          handleTimeSubmit();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      
      // When editing starts, set up the suggestions dropdown
      if (showSuggestions && suggestionsRef.current) {
        // Find the closest time to scroll to
        const closestIndex = findClosestTime(timeOptions, editableTime, is24Hour);
        const items = suggestionsRef.current.children;
        
        if (items.length > 0 && items[closestIndex]) {
          // Scroll the closest time into view
          items[closestIndex].scrollIntoView({
            block: 'center',
            behavior: 'auto'
          });
          
          // Add selected class to the closest item
          items[closestIndex].classList.add('bg-gray-100');
        }
      }
    }
  }, [isEditing, showSuggestions, editableTime, timeOptions, is24Hour]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTime(e.target.value);
  };

  const tzDate = convertToTargetTime(currentDate, tz.offset);

  return (
    <div
      ref={cardRef}
      className={`timezone-card bg-white rounded-xl shadow-sm p-6 transition-all relative hover:shadow-md ${
        isAtMaxLimit ? 'border border-amber-200' : ''
      }`}
      draggable={false}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDrop={(e) => onDrop && onDrop(e, index)}
      data-index={index}
      data-uuid={tz.uuid}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between pr-10 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-move drag-handle"
              onDragStart={(e) => onDragStart && onDragStart(e, index)}
              onDragEnd={() => onDragEnd && onDragEnd()}
              draggable
            >
              <GripVertical size={20} className="text-gray-400" />
            </div>
            <div className="">
              <h2 className="text-3xl font-bold">
                {tz.name}{" "}
                <span className="text-xs font-light">({tz.fullName})</span>
              </h2>
              <p className="text-gray-500">GMT{tz.offset}</p>
            </div>
            <span className="text-lg text-gray-600"></span>
          </div>
          <div className="text-center ml-auto w-[140px] relative">
            <div className="h-10 box-border">
              <div className="">
                {isEditing ? (
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editableTime}
                        onChange={handleChange}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyPress={(e) => e.key === "Enter" && handleTimeSubmit()}
                        className="text-3xl font-bold text-center w-36 border-b-2 border-primary focus:outline-none"
                        autoFocus
                      />
                     
                    </div>
                    
                    {showSuggestions && (
                      <div 
                        ref={suggestionsRef}
                        className="absolute z-100 h-[110px] bg-white shadow-lg border rounded-md mt-1 py-1 w-full max-h-60 overflow-y-auto"
                      >
                        {timeOptions.map((time, i) => (
                          <div
                            key={i}
                            className="px-3 py-1 cursor-pointer hover:bg-gray-100 text-left"
                            onClick={() => handleSelectSuggestion(time)}
                          >
                            {time}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span
                    className="text-3xl font-bold cursor-pointer"
                    onClick={handleTimeEdit}
                  >
                    {format(tzDate, is24Hour ? "HH:mm" : "h:mm a")}
                  </span>
                )}
              </div>
            </div>
            <div className="text-gray-500 mt-1">
              {format(tzDate, "EEE, MMM d")}
            </div>
          </div>
        </div>
        <Button
          variant={"ghost"}
          onClick={() => removeTimeZone(tz.uuid)}
          className={`absolute top-2 right-2 text-gray-400 hover:text-gray-600 ${
            isAtMaxLimit ? 'animate-pulse bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800' : ''
          }`}
          title={isAtMaxLimit ? "Remove to add more timezones" : "Remove timezone"}
        >
          <X size={20} />
        </Button>
      </div>
      <TimeZoneTimeline
        timeZone={tz.name}
        currentDate={currentDate}
        onTimeChange={handleTimeChange}
        offset={tz.offset}
        is24Hour={is24Hour}
        convertToLocalTime={convertToLocalTime}
        getLocalOffsetMinutes={getLocalOffsetMinutes}
        getOffsetMinutes={getOffsetMinutes}
      />
    </div>
  );
}

export default TimeCard;
