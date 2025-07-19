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

  // Add effect to handle global mouse events
  React.useEffect(() => {
    if (!isDragging) return;

    // Set cursor for entire page while dragging
    document.body.style.cursor = 'grabbing';

    const handleGlobalMouseMove = (e: MouseEvent) => {
      updateTimeFromPosition(e.clientX);
      e.preventDefault();
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      updateTimeFromPosition(e.clientX);
      document.body.style.cursor = ''; // Reset cursor
      e.preventDefault();
    };

    // Add global event listeners when dragging starts
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    // Cleanup listeners when dragging stops or component unmounts
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = ''; // Reset cursor on cleanup
    };
  }, [isDragging]);

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
      
      // Calculate gradient percentage based on position in day/night cycle
      const getGradientClass = () => {
        if (hour === 5) return "bg-gradient-to-r from-muted via-muted to-background dark:from-background dark:via-background dark:to-muted"; // Dawn
        if (hour === 18) return "bg-gradient-to-r from-background via-muted to-muted dark:from-muted dark:via-background dark:to-background"; // Dusk
        if (isDaytime) return "bg-background dark:bg-muted";
        return "bg-muted dark:bg-background";
      };

      return (
        <div
          key={i}
          className={cn(
            "h-full flex-1 transition-colors duration-300",
            getGradientClass()
          )}
          style={{ 
            borderLeft: "1px solid var(--border)",
          }}
        >
          <div className="h-full flex items-center">
            {i != 0 && (
              <span
                className={cn(
                  "rounded-lg relative border-l",
                  i % 3 == 0 ? "h-2/6 border-foreground" : "h-1/6 border-muted-foreground"
                )}
                style={{ left: "-1px" }}
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
          className="absolute text-xs text-muted-foreground"
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
    <div className="w-full pb-5 md:py-5">
      <div
        ref={timelineRef}
        className="relative h-4 cursor-grab active:cursor-grabbing group"
        onMouseDown={handleMouseDown}
      >
        <div
          className={cn(
            "absolute inset-0 flex rounded overflow-hidden",
            "bg-gradient-to-r from-muted via-background to-muted",
            "dark:bg-gradient-to-r dark:from-background dark:via-muted dark:to-background",
            "transition-colors duration-300"
          )}
        >
          {getTimelineSegments()}
        </div>

        {/* Current time indicator with centered grip handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 flex items-center justify-center w-0.5 bg-primary z-[5] transition-all duration-200 cursor-grab active:cursor-grabbing",
            isDragging && "cursor-grabbing"
          )}
          style={{
            left: `${getCurrentTimePosition()}%`,
            transition: isDragging ? "none" : "left 0.2s ease-out",
          }}
        >
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 bg-primary rounded p-0.5 py-2 transition-all",
            "opacity-0 group-hover:opacity-100 hover:scale-110",
            isDragging ? "opacity-100 scale-110" : ""
          )}>
            <GripHorizontal size={10} className="text-primary-foreground" />
          </div>
        </div>

        <div className="absolute -bottom-5 w-full h-6 cursor-pointer pointer-events-none">
          {getHourLabels()}
        </div>
      </div>
    </div>
  );
};
