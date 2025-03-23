"use client";

import React, { useRef, useState } from "react";
import { addMinutes } from "date-fns";
import { GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeZoneTimelineProps } from "@/lib/types";

export const TimeZoneTimeline: React.FC<TimeZoneTimelineProps> = ({
  currentDate,
  onTimeChange,
  offset,
  is24Hour,
  getOffsetMinutes,
  getLocalOffsetMinutes,
  convertToLocalTime,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const convertToTargetTime = (date: Date, toOffset: string): Date => {
    const targetOffset = getOffsetMinutes(toOffset);
    const localOffset = getLocalOffsetMinutes();
    const diffMinutes = targetOffset - localOffset;
    return addMinutes(date, diffMinutes);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateTimeFromPosition(e.clientX);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateTimeFromPosition(e.clientX);
    e.preventDefault();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    updateTimeFromPosition(e.clientX);
    e.preventDefault();
  };

  const calculateNewDate = (xPosition: number): Date => {
    if (!timelineRef.current) return currentDate;

    const timeline = timelineRef.current;
    const rect = timeline.getBoundingClientRect();
    const totalWidth = rect.width;
    const relativeX = Math.max(0, Math.min(xPosition - rect.left, totalWidth));

    const totalMinutes = (relativeX / totalWidth) * (24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);

    const tzDate = convertToTargetTime(currentDate, offset);
    tzDate.setHours(hours, minutes, 0, 0);
    const date = convertToLocalTime(tzDate, offset);
    return date;
  };

  const updateTimeFromPosition = (xPosition: number) => {
    const newDate = calculateNewDate(xPosition);
    onTimeChange(newDate);
  };

  const getTimelineSegments = () => {
    return Array.from({ length: 24 }).map((_, i) => {
      const hour = i;
      const isDaytime = hour >= 6 && hour < 18;
      return (
        <div
          key={i}
          className={`h-full flex-1 ${
            isDaytime ? "bg-blue-200/70" : "bg-gray-200/70"
          }`}
          style={{ borderLeft: "2px solid #fff" }}
        >
          <div className="h-full flex items-center">
            {i != 0 && (
              <span
                className={cn(
                  "rounded-lg relative border-l border-gray-600",
                  i % 3 == 0 ? "h-2/6 border-black" : "h-1/6"
                )}
                style={{ left: "-1.5px" }}
              />
            )}
          </div>
        </div>
      );
    });
  };

  const getCurrentTimePosition = () => {
    const tzDate = convertToTargetTime(currentDate, offset);
    const hours = tzDate.getHours();
    const minutes = tzDate.getMinutes();
    return ((hours * 60 + minutes) / (24 * 60)) * 100;
  };

  const getHourLabels = () => {
    return Array.from({ length: 24 }).map((_, i) => {
      const hour = i;
      const label = is24Hour
        ? `${hour.toString().padStart(2, "0")}:00`
        : hour === 0 || hour === 11
        ? `${hour === 0 ? "12" : hour}am`
        : `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "pm" : "am"}`;

      return (
        <div
          key={i}
          className="absolute text-xs text-gray-500"
          style={{
            left: `${(hour / 24) * 100}%`,
            transform: "translateX(-50%)",
            bottom: "2px",
          }}
        >
          {hour % 3 === 0 ? label : ""}
        </div>
      );
    });
  };

  return (
    <div className="w-full py-5">
      <div
        ref={timelineRef}
        className="relative h-4  cursor-pointer group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 flex"
          style={{
            // background: "rgb(0,0,0)",
            background:
              "linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(148,218,253,1) 30%, rgba(148,218,253,1) 50%, rgba(148,218,253,1) 70%, rgba(0,0,0,1) 90%, rgba(0,0,0,1) 100%)",
          }}
        >
          {getTimelineSegments()}
        </div>

        {/* Current time indicator with centered grip handle */}
        <div
          className="absolute top-0 bottom-0 flex items-center justify-center w-0.5 bg-primary z-10 transition-all duration-200 cursor-move "
          style={{
            left: `${getCurrentTimePosition()}%`,
            transition: isDragging ? "none" : "left 0.2s ease-out",
          }}
        >
          <div className="absolute top-1/2 -translate-y-1/2  bg-primary rounded p-0.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripHorizontal size={10} className="text-white" />
          </div>
        </div>

        <div className="absolute -bottom-5 w-full h-6 cursor-pointer pointer-events-none">
          {getHourLabels()}
        </div>
      </div>
    </div>
  );
};
