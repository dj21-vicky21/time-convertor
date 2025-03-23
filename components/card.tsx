"use client";

import { GripVertical, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { TimeZoneTimeline } from "./TimeZoneTimeline";
import { TimeCardProps } from "@/lib/types";
import { format, parse, addMinutes } from "date-fns";

function TimeCard({
  removeTimeZone,
  tz,
  currentDate,
  handleTimeChange,
  is24Hour,
}: TimeCardProps) {
  const [editableTime, setEditableTime] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getOffsetMinutes = (offsetStr: string): number => {
    const match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;
    const [_, sign, hours, minutes] = match;
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
        const parsedDate = parse(editableTime, "hh:mm a", new Date());
        if (isNaN(parsedDate.getTime())) throw new Error("Invalid time format");

        const tzDate = convertToTargetTime(currentDate, tz.offset);
        tzDate.setHours(parsedDate.getHours(), parsedDate.getMinutes(), 0, 0);
        newDate = convertToLocalTime(tzDate, tz.offset);
      }

      handleTimeChange(newDate);
      setIsEditing(false);
    } catch (error) {
      console.log("--> ~ handleTimeSubmit ~ error:", error);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    // Function to handle clicks outside the input
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        // Blur the input if the click is outside
        inputRef.current.blur();
      }
    };

    // Add event listener for mousedown
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus(); // Focus the input
      inputRef.current.select(); // Select the text
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTime(e.target.value);
  };

  const tzDate = convertToTargetTime(currentDate, tz.offset);

  return (
    <div
      className={`timezone-card bg-white rounded-xl shadow-sm p-6 transition-all relative ${
        // draggedZone === tz.id ? 'opacity-50 scale-105' : ''
        ""
      } hover:shadow-md`}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between pr-10 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-move"
              // onDragStart={(e) => handleDragStart(e, tz.id)}
              // onDragOver={(e) => handleDragOver(e, tz.id)}
              // onDragEnd={handleDragEnd}
              // draggable
            >
              <GripVertical size={20} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {tz.name}{" "}
                <span className="text-sm font-light">({tz.fullName})</span>
              </h2>
              <p className="text-gray-500">GMT{tz.offset}</p>
            </div>
            <span className="text-lg text-gray-600"></span>
          </div>
          <div className="text-center ml-auto">
            <div className="h-10 box-border">
              <div className="">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editableTime}
                    onChange={handleChange}
                    onBlur={handleTimeSubmit}
                    onKeyPress={(e) => e.key === "Enter" && handleTimeSubmit()}
                    className="text-3xl font-bold text-center w-40 border-b-2 border-primary focus:outline-none"
                    autoFocus
                  />
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
          onClick={() => removeTimeZone(tz.id)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
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
