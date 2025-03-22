import { GripVertical, X } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { TimeZoneTimeline } from "./TimeZoneTimeline";
import { TimeCardProps } from "@/lib/types";

function TimeCard({
  removeTimeZone,
  tz,
  currentDate,
  handleTimeChange,
  is24Hour,
}: TimeCardProps) {
  return (
    <div
      className={`timezone-card bg-white rounded-xl shadow-sm p-6 transition-all relative ${
        // draggedZone === tz.id ? 'opacity-50 scale-105' : ''
        ""
      } hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-4">
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
      />
    </div>
  );
}

export default TimeCard;
