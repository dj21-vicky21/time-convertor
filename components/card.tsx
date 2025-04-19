"use client";

import { X, GripVertical } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { TimeZoneTimeline } from "./TimeZoneTimeline";
import { TimeCardProps } from "@/lib/types";
import { format, parse, addMinutes } from "date-fns";
import { useAppStore } from "@/store/appStore";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { timeZones } = useAppStore();
  const isAtMaxLimit = timeZones.length >= 10;

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
      console.error("Invalid time format:", error);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        inputRef.current.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
          <div className="text-center ml-auto w-[140px]">
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
                    className="text-3xl font-bold text-center w-36 border-b-2 border-primary focus:outline-none"
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
