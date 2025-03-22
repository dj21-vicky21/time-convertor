"use client"

import React, { useRef, useState } from 'react';
import { format, parse, addMinutes } from 'date-fns';
import { GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeZoneTimelineProps {
  timeZone: string;
  currentDate: Date;
  onTimeChange: (newDate: Date) => void;
  offset: string;
  is24Hour: boolean;
}

export const TimeZoneTimeline: React.FC<TimeZoneTimelineProps> = ({
  timeZone,
  currentDate,
  onTimeChange,
  offset,
  is24Hour,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableTime, setEditableTime] = useState('');

  const getOffsetMinutes = (offsetStr: string): number => {
    const match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;
    const [_, sign, hours, minutes] = match;
    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
    return sign === '+' ? totalMinutes : -totalMinutes;
  };

  const getLocalOffsetMinutes = (): number => {
    return -currentDate.getTimezoneOffset();
  };

  const convertToLocalTime = (date: Date, fromOffset: string): Date => {
    const sourceOffset = getOffsetMinutes(fromOffset);
    const localOffset = getLocalOffsetMinutes();
    const diffMinutes = localOffset - sourceOffset;
    return addMinutes(date, diffMinutes);
  };

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
    return convertToLocalTime(tzDate, offset);
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
          className={`h-full flex-1 ${isDaytime ? 'bg-blue-200/70' : 'bg-gray-200/70'}`}
          style={{ borderLeft: "2px solid #fff"}}
        >

          <div className='h-full flex items-center'>
            {i != 0  && <span className={cn("rounded-lg relative border-l border-gray-600", i%3 == 0 ? "h-full border-black" : "h-1/6")}  style={{left:"-1.5px"}}/>}
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
        ? `${hour.toString().padStart(2, '0')}:00`
        : hour === 0 || hour === 11
        ? `${hour === 0 ? '12' : hour}am`
        : `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`;
      
      return (
        <div
          key={i}
          className="absolute text-xs text-gray-500"
          style={{
            left: `${(hour / 24) * 100}%`,
            transform: 'translateX(-50%)',
            bottom: '2px'
          }}
        >
          {hour % 3 === 0 ? label : ''}
        </div>
      );
    });
  };

  const handleTimeEdit = () => {
    const tzDate = convertToTargetTime(currentDate, offset);
    setEditableTime(format(tzDate, is24Hour ? 'HH:mm' : 'hh:mm a'));
    setIsEditing(true);
  };

  const handleTimeSubmit = () => {
    try {
      let newDate: Date;
      
      if (is24Hour) {
        const [hours, minutes] = editableTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) throw new Error('Invalid time format');
        
        const tzDate = convertToTargetTime(currentDate, offset);
        tzDate.setHours(hours, minutes, 0, 0);
        newDate = convertToLocalTime(tzDate, offset);
      } else {
        // Parse 12-hour format
        const parsedDate = parse(editableTime, 'hh:mm a', new Date());
        if (isNaN(parsedDate.getTime())) throw new Error('Invalid time format');
        
        const tzDate = convertToTargetTime(currentDate, offset);
        tzDate.setHours(parsedDate.getHours(), parsedDate.getMinutes(), 0, 0);
        newDate = convertToLocalTime(tzDate, offset);
      }
      
      onTimeChange(newDate);
      setIsEditing(false);
    } catch (error) {
      console.log("--> ~ handleTimeSubmit ~ error:", error)
      setIsEditing(false);
    }
  };

  const tzDate = convertToTargetTime(currentDate, offset);

  return (
    <div className="w-full">
      <div className="text-center mb-4 ">
        <div className='h-18 box-border '>
        {isEditing ? (
          <input
            type="text"
            value={editableTime}
            onChange={(e) => setEditableTime(e.target.value)}
            onBlur={handleTimeSubmit}
            onKeyPress={(e) => e.key === 'Enter' && handleTimeSubmit()}
            className="text-4xl font-bold text-center w-40 border-b-2 border-primary focus:outline-none"
            autoFocus
          />
        ) : (
          <span className="text-4xl font-bold cursor-pointer" onClick={handleTimeEdit}>
            {format(tzDate, is24Hour ? 'HH:mm' : 'h:mm a')}
          </span>
        )}
        </div>
        <div className="text-gray-500 mt-1">
          {format(tzDate, 'EEE, MMM d')}
        </div>
      </div>
      
      <div
        ref={timelineRef}
        className="relative h-16 cursor-pointer group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 flex"
        style={{
          // background: "rgb(0,0,0)",
          background: "linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(255,255,255,1) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,1) 70%, rgba(0,0,0,1) 90%, rgba(0,0,0,1) 100%)",
        }}
        >
          {getTimelineSegments()}
        </div>
        
        {/* Current time indicator with centered grip handle */}
        <div
          className="absolute top-0 bottom-0 flex items-center justify-center w-0.5 bg-primary z-10 transition-all duration-200 cursor-move"
          style={{
            left: `${getCurrentTimePosition()}%`,
            transition: isDragging ? 'none' : 'left 0.2s ease-out',
          }}
        >
          <div className="absolute top-1/2 -translate-y-1/2  bg-primary rounded-lg p-0.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripHorizontal size={10} className="text-white" />
          </div>
        </div>
        
        <div className="absolute -bottom-5 w-full h-6 cursor-pointer">
          {getHourLabels()}
        </div>
      </div>
    </div>
  );
};