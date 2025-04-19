"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import TimeCard from "@/components/card";
import { useAppStore } from "@/store/appStore";
import { useRouter } from "next/navigation";
import { getTimezones } from "@/actions/getTimeZone";
import { toast } from "sonner";
import { TimeZone } from "@/lib/types";

function TimeZoneApp({ slug }: { slug: string }) {
  const {
    currentDate,
    setCurrentDate,
    is24Hour,
    setSlug,
    setTimeZones,
    timeZones,
    viewMode,
  } = useAppStore();
  const [isClient, setIsClient] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const router = useRouter();
  
  // Reference to store timeZones order separately from state to prevent re-renders
  const timeZonesRef = useRef<TimeZone[]>([]);
  
  // Update ref when timeZones changes
  useEffect(() => {
    timeZonesRef.current = timeZones;
  }, [timeZones]);

  // Helper function to preserve query parameters
  const pushWithQueryParams = useCallback((path: string) => {
    // Get current query params
    const params = new URLSearchParams();
    
    // Only add parameters when they differ from defaults
    // Default is24Hour is false (12h format)
    if (is24Hour) {
      params.set('is24Hour', 'true');
    }
    
    // Default viewMode is 'list'
    if (viewMode !== 'list') {
      params.set('viewMode', viewMode);
    }
    
    // Create the new URL with query parameters only if not default
    const newUrl = params.toString() ? `${path}?${params.toString()}` : path;
    
    // Navigate
    router.push(newUrl);
  }, [router, is24Hour, viewMode]);

  // Set up client-side handling
  useEffect(() => {
    setIsClient(true);
    
    // Only run URL parameter handling on the client
    if (typeof window !== 'undefined') {
      // Parse the URL to extract query parameters if present
      const urlParams = new URL(window.location.href).searchParams;
      
      // Set is24Hour from URL or default to false
      const is24HourParam = urlParams.get('is24Hour');
      if (is24HourParam === 'true') {
        useAppStore.setState({ is24Hour: true });
      } else if (is24HourParam === null && window.location.search === '') {
        // Only reset to default if no parameters were provided
        useAppStore.setState({ is24Hour: false });
      }
      
      // Set viewMode from URL or default to 'list'
      const viewModeParam = urlParams.get('viewMode');
      if (viewModeParam === 'grid') {
        useAppStore.setState({ viewMode: 'grid' });
      } else if (viewModeParam === null && window.location.search === '') {
        // Only reset to default if no parameters were provided
        useAppStore.setState({ viewMode: 'list' });
      }
    }
  }, []);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setSlug(slug);
      const splitSlug = getValuesFromSlug(slug);
      
      // Limit to maximum 10 timezones
      const limitedSlug = splitSlug.slice(0, 10);
      
      // If we're limiting the timezones, show a toast notification
      if (limitedSlug.length < splitSlug.length) {
        toast.warning("Maximum of 10 time zones allowed", {
          description: "Only the first 10 time zones have been added."
        });
      }
      
      const validTimeZones = await getURLTimeZones(limitedSlug);
      setTimeZones(validTimeZones);
      
      if (!limitedSlug.length) return;
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, setSlug]);

  // Memoize these functions to prevent recreating on every render
  const handleTimeChange = useCallback((newDate: Date) => {
    setCurrentDate(new Date(newDate));
  }, [setCurrentDate]);

  const removeTimeZone = useCallback((uuid: string) => {
    // Add visual feedback for removal
    const cardToRemove = document.querySelector(`[data-uuid="${uuid}"]`);
    if (cardToRemove) {
      cardToRemove.classList.add('removing');
      
      // Short delay for animation
      setTimeout(() => {
        const filterZones = timeZones.filter((tz) => tz.uuid !== uuid);
        setTimeZones(filterZones);
      }, 100);
    } else {
      // If element not found, just remove directly
      const filterZones = timeZones.filter((tz) => tz.uuid !== uuid);
      setTimeZones(filterZones);
    }
  }, [setTimeZones, timeZones]);

  // Maximum number of timezones allowed
  const MAX_TIMEZONES = 10;
  
  // Create a ref for the drag and drop operation
  const dragDropRef = useRef<{
    cards: NodeListOf<Element> | null;
    draggingElement: HTMLElement | null;
  }>({ cards: null, draggingElement: null });

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    // Check if we're already at the maximum limit
    if (timeZones.length >= MAX_TIMEZONES) {
      // Only allow drag if we're reordering existing items
      setDraggedIndex(index);
    } else {
      setDraggedIndex(index);
    }
    
    // Get the card element
    const card = e.currentTarget.closest('.timezone-card') as HTMLElement;
    if (!card) return;
    
    // Store dragging element reference
    dragDropRef.current.draggingElement = card;
    
    // Get all cards for later operations
    dragDropRef.current.cards = document.querySelectorAll('.timezone-card');
    
    // Set opacity of the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
    
    // Set drag image and add visual class
    e.dataTransfer.setDragImage(card, 20, 20);
    card.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
  }, [timeZones.length]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    // Get cards from ref for visualization
    const cards = dragDropRef.current.cards;
    if (cards && index !== draggedIndex) {
      // Clear previous drop targets
      cards.forEach(card => card.classList.remove('drop-target'));
      
      // Highlight current drop target
      if (index >= 0 && index < cards.length) {
        cards[index].classList.add('drop-target');
      }
    }
    
    // Don't reorder if we're hovering over the same card that's being dragged
    if (index === draggedIndex) return;
    
    // Reorder the timezones (in the ref only, not state yet to avoid re-renders)
    const newTimeZones = [...timeZonesRef.current];
    const draggedItem = newTimeZones[draggedIndex];
    
    // Remove the dragged item
    newTimeZones.splice(draggedIndex, 1);
    // Insert it at the new position
    newTimeZones.splice(index, 0, draggedItem);
    
    // Update our ref with the new order
    timeZonesRef.current = newTimeZones;
    
    // Update the dragged index to the new position
    setDraggedIndex(index);
  }, [draggedIndex, setDraggedIndex]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    // Use the ref to get the current timeZones array
    const currentTimeZones = [...timeZonesRef.current];
    
    // Get the item being dragged
    const draggedItem = currentTimeZones[draggedIndex];
    
    // Clone the array to ensure immutability
    const newTimeZones = [...currentTimeZones];
    
    // Remove it from the array
    newTimeZones.splice(draggedIndex, 1);
    
    // Insert it at the new position
    newTimeZones.splice(dropIndex, 0, draggedItem);
    
    // Clean up visual feedback using the ref
    const { cards } = dragDropRef.current;
    if (cards) {
      cards.forEach(card => {
        card.classList.remove('dragging');
        card.classList.remove('drop-target');
      });
    }
    
    // Update state
    setTimeZones(newTimeZones);
  }, [draggedIndex, setTimeZones]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    
    // Get the dragging element from our ref
    const draggingElement = dragDropRef.current.draggingElement;
    if (draggingElement) {
      draggingElement.style.opacity = '1';
      draggingElement.classList.remove('dragging');
    }
    
    // Clean up any drop target classes
    const cards = dragDropRef.current.cards;
    if (cards) {
      cards.forEach(card => {
        card.classList.remove('drop-target');
      });
    }
    
    // Clear drag drop references
    dragDropRef.current = {
      draggingElement: null,
      cards: null,
    };
    
    // Apply the updated order from our ref to the state
    setTimeZones([...timeZonesRef.current]);
  }, [setTimeZones]);

  // Memoize these pure functions
  const getValuesFromSlug = useCallback((slug: string) => {
    // Decode URL-encoded characters (like %20 for spaces)
    const decodedSlug = decodeURIComponent(slug);
    
    const parts = decodedSlug.split("-").filter((part) => part.length > 0);

    // Return empty array if no valid parts
    if (parts.length === 0) return [];

    // Only return [firstValue] if "to" doesn't appear right after it
    if (parts.length < 2 || parts[1] !== "to") {
      return [parts[0]];
    }

    // If "to" appears right after first value, return all non-"to" values
    return parts.filter(
      (part, index) => part !== "to" && (index === 0 || index > 1)
    );
  }, []);

  const generateSlugStructure = useCallback((values: string[]) => {
    // Filter out empty values
    const filtered = values.filter((v) => v && v.length > 0);

    if (filtered.length === 0) return "";
    if (filtered.length === 1) return encodeURIComponent(filtered[0]);

    // First element + "-to-" + remaining elements joined with "-", with URL encoding
    return `${encodeURIComponent(filtered[0])}-to-${filtered.slice(1).map(v => encodeURIComponent(v)).join("-")}`;
  }, []);

  const getURLTimeZones = async (a: string[]) => {
    const allCountries = await getTimezones(a);
    return allCountries;
  };

  useEffect(() => {
    if (timeZones.length === 0) {
      pushWithQueryParams("/converter");
      return;
    }
    const formattedSlug = generateSlugStructure(timeZones.map((tz) => tz.id));
    pushWithQueryParams(`/converter/${formattedSlug}`);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZones, pushWithQueryParams]);

  // Memoize the TimeCard components to prevent unnecessary re-renders
  const memoizedTimeCards = useMemo(() => {
    return isClient ? timeZones.map((tz, index) => (
      <TimeCard
        currentDate={currentDate}
        handleTimeChange={handleTimeChange}
        is24Hour={is24Hour}
        removeTimeZone={removeTimeZone}
        tz={tz}
        key={tz.uuid}
        index={index}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
      />
    )) : null;
  }, [
    isClient,
    timeZones,
    currentDate,
    is24Hour,
    handleTimeChange,
    removeTimeZone,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop
  ]);

  return <>{memoizedTimeCards}</>;
}

export default TimeZoneApp;
