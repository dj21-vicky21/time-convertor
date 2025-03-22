'use client'

import React, { useState } from 'react';
import { Share, Clock, Calendar, Link as LinkIcon, Plus, X, Grid, List, GripVertical } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { TimeZoneTimeline } from '@/components/TimeZoneTimeline';
import { format } from 'date-fns';

interface TimeZone {
  id: number;
  name: string;
  fullName: string;
  offset: string;
}

const INITIAL_TIMEZONES: TimeZone[] = [
  { id: 1, name: 'IST', fullName: 'India Standard Time', offset: '+05:30' },
  { id: 2, name: 'EST', fullName: 'Eastern Standard Time', offset: '-05:00' },
];

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeZones, setTimeZones] = useState(INITIAL_TIMEZONES);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [is24Hour, setIs24Hour] = useState(false);
  const [draggedZone, setDraggedZone] = useState<number | null>(null);

  const handleTimeChange = (newDate: Date) => {
    setCurrentDate(new Date(newDate));
  };

  const removeTimeZone = (id: number) => {
    setTimeZones(timeZones.filter(tz => tz.id !== id));
  };

  const resetToNow = () => {
    setCurrentDate(new Date());
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    const draggedElement = e.currentTarget as HTMLElement;
    const card = draggedElement.closest('.timezone-card') as HTMLElement;
    if (card) {
      // Set the drag image to be the entire card
      e.dataTransfer.setDragImage(card, 0, 0);
    }
    setDraggedZone(id);
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (draggedZone === null || draggedZone === id) return;

    const newTimeZones = [...timeZones];
    const draggedIndex = newTimeZones.findIndex(tz => tz.id === draggedZone);
    const dropIndex = newTimeZones.findIndex(tz => tz.id === id);

    const [draggedItem] = newTimeZones.splice(draggedIndex, 1);
    newTimeZones.splice(dropIndex, 0, draggedItem);

    setTimeZones(newTimeZones);
  };

  const handleDragEnd = () => {
    setDraggedZone(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-700">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Time Zone Converter</h1>
          <p className="text-lg text-gray-600">Compare multiple time zones and plan global meetings with ease</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-grow max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add Time Zone, City or Town"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            {/* Date Selection */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
                >
                  <Calendar size={20} />
                  {format(currentDate, 'dd/MM/yyyy')}
                </button>
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

              <button
                onClick={resetToNow}
                className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <Clock size={20} />
                Now
              </button>

              <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
                <LinkIcon size={20} />
                Save Link
              </button>

              <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
                <Share size={20} />
                Share
              </button>

              <button
                onClick={() => setIs24Hour(!is24Hour)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  is24Hour ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'
                }`}
              >
                {is24Hour ? '24h' : '12h'}
              </button>
            </div>
          </div>
        </div>

        {/* View Toggle and Add Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <List size={20} />
              List View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Grid size={20} />
              Grid View
            </button>
          </div>

          <button
            onClick={() => {
              const newId = Math.max(...timeZones.map(tz => tz.id)) + 1;
              setTimeZones([...timeZones, { id: newId, name: 'GMT', fullName: 'Greenwich Mean Time', offset: '+00:00' }]);
            }}
            className="px-4 py-2 bg-white rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Plus size={20} />
            Add Time Zone
          </button>
        </div>

        {/* Time Zones */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'w-3xl space-y-4 m-auto'}`}>
          {timeZones.map((tz) => (
            <div
              key={tz.id}
              
              className={`timezone-card bg-white rounded-xl shadow-sm p-6 transition-all ${
                draggedZone === tz.id ? 'opacity-50 scale-105' : ''
              } hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-move" 
                      onDragStart={(e) => handleDragStart(e, tz.id)}
                      onDragOver={(e) => handleDragOver(e, tz.id)}
                      onDragEnd={handleDragEnd}
                      draggable
                  >
                    <GripVertical size={20} className="text-gray-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{tz.name}</h2>
                    <p className="text-gray-500">GMT{tz.offset}</p>
                  </div>
                  <span className="text-lg text-gray-600">{tz.fullName}</span>
                </div>
                <button onClick={() => removeTimeZone(tz.id)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <TimeZoneTimeline
                timeZone={tz.name}
                currentDate={currentDate}
                onTimeChange={handleTimeChange}
                offset={tz.offset}
                is24Hour={is24Hour}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;