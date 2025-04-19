"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import TimeCard from "@/components/card";
import { useAppStore } from "@/store/appStore";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  
  // Reference to store timeZones order separately from state to prevent re-renders
  const timeZonesRef = useRef<TimeZone[]>([]);
  
  // Refs for URL update debouncing
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSlugRef = useRef<string>(slug);
  
  // Track card UUIDs that are currently being removed to prevent duplicate removals
  const removingCardsRef = useRef<Set<string>>(new Set());
  
  // Update ref when timeZones changes
  useEffect(() => {
    timeZonesRef.current = timeZones;
  }, [timeZones]);

  // Helper function to preserve query parameters
  const pushWithQueryParams = useCallback((path: string) => {
    // Get current query params
    const params = new URLSearchParams(searchParams.toString());
    
    // Make sure we have the latest values
    params.set('is24Hour', is24Hour.toString());
    params.set('viewMode', viewMode);
    
    // Create the new URL with query parameters
    const newUrl = params.toString() ? `${path}?${params.toString()}` : path;
    
    // Navigate
    router.push(newUrl);
  }, [router, searchParams, is24Hour, viewMode]);

  useEffect(() => {
    setIsClient(true);
    
    // Cleanup timeout on unmount
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Memoize these pure functions
  const getValuesFromSlug = useCallback((slug: string) => {
    try {
      // Decode URL-encoded characters (like %20 for spaces)
      let decodedSlug;
      try {
        decodedSlug = decodeURIComponent(slug);
      } catch (e) {
        console.error("Error decoding slug:", e);
        decodedSlug = slug; // Fall back to raw slug if decoding fails
      }
      
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
    } catch (error) {
      console.error("Error in getValuesFromSlug:", error);
      // Return a safe fallback
      return [];
    }
  }, []);

  const generateSlugStructure = useCallback((values: string[]) => {
    // Filter out empty values
    const filtered = values.filter((v) => v && v.length > 0);

    if (filtered.length === 0) return "";
    if (filtered.length === 1) return encodeURIComponent(filtered[0]);

    // First element + "-to-" + remaining elements joined with "-", with URL encoding
    return `${encodeURIComponent(filtered[0])}-to-${filtered.slice(1).map(v => encodeURIComponent(v)).join("-")}`;
  }, []);

  // Create a manual URL update function - defined BEFORE it's used
  const updateURL = useCallback(() => {
    if (!isClient) return;
    const formattedSlug = generateSlugStructure(timeZones.map((tz) => tz.id));
    if (formattedSlug && formattedSlug !== slug) {
      // Directly update without debounce since this is explicitly called
      lastSlugRef.current = formattedSlug;
      pushWithQueryParams(`/converter/${formattedSlug}`);
    }
  }, [isClient, generateSlugStructure, timeZones, slug, pushWithQueryParams]);

  // Memoize these functions to prevent recreating on every render
  const handleTimeChange = useCallback((newDate: Date) => {
    setCurrentDate(new Date(newDate));
  }, [setCurrentDate]);

  const removeTimeZone = useCallback((uuid: string) => {
    // Check if this card is already being removed
    if (removingCardsRef.current.has(uuid)) {
      return; // Skip if already in process of being removed
    }
    
    // Mark this card as being removed
    removingCardsRef.current.add(uuid);
    
    // First update our internal reference to prevent any sync issues
    timeZonesRef.current = timeZonesRef.current.filter((tz) => tz.uuid !== uuid);
    
    // Add visual feedback for removal
    const cardToRemove = document.querySelector(`[data-uuid="${uuid}"]`);
    if (cardToRemove) {
      cardToRemove.classList.add('removing');
      
      // Short delay for animation, then remove from state
      setTimeout(() => {
        // Filter out the timezone to remove
        const filtered = timeZones.filter((tz: TimeZone) => tz.uuid !== uuid);
        // Update state with the filtered array
        setTimeZones(filtered);
        
        // Update URL only after state is fully updated
        setTimeout(() => {
          // Double check we're still on client
          if (isClient) {
            const newSlug = generateSlugStructure(filtered.map((tz: TimeZone) => tz.id));
            // Only update if there's something to update and we're on client
            if (newSlug !== slug) {
              pushWithQueryParams(`/converter/${newSlug}`);
            } else if (filtered.length === 0) {
              // If we removed the last timezone, go to home page
              pushWithQueryParams('/converter');
            }
          }
          
          // Remove from the tracking set once complete
          removingCardsRef.current.delete(uuid);
        }, 200);
      }, 100);
    } else {
      // If element not found, use direct state update
      const filtered = timeZones.filter((tz: TimeZone) => tz.uuid !== uuid);
      setTimeZones(filtered);
      
      // Update URL after state update completes
      setTimeout(() => {
        if (isClient) {
          if (filtered.length === 0) {
            pushWithQueryParams('/converter');
          } else {
            const newSlug = generateSlugStructure(filtered.map((tz: TimeZone) => tz.id));
            if (newSlug !== slug) {
              pushWithQueryParams(`/converter/${newSlug}`);
            }
          }
        }
        
        // Remove from the tracking set once complete
        removingCardsRef.current.delete(uuid);
      }, 200);
    }
  }, [setTimeZones, timeZones, isClient, generateSlugStructure, pushWithQueryParams, slug]);

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
    
    // Update URL after state update is applied
    setTimeout(() => {
      updateURL();
    }, 100);
  }, [draggedIndex, setTimeZones, updateURL]);

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

  const getURLTimeZones = async (a: string[]) => {
    try {
      const allCountries = await getTimezones(a);
      return allCountries;
    } catch (error) {
      console.error("Error fetching timezones:", error);
      // Create fallback timezones directly without any loops
      const fallbackTimezones: TimeZone[] = [];
      
      // Process up to 10 elements from the array
      if (a.length > 0) {
        const id = a[0];
        const parts = id.split('_');
        fallbackTimezones.push({
          uuid: Math.random().toString(36).substring(2, 9),
          id,
          name: parts[0] || "TZ",
          fullName: parts.join(' '),
          offset: "+00:00",
          country: parts.slice(1).join(' ') || "Unknown"
        });
      }
      if (a.length > 1) {
        const id = a[1];
        const parts = id.split('_');
        fallbackTimezones.push({
          uuid: Math.random().toString(36).substring(2, 9),
          id,
          name: parts[0] || "TZ",
          fullName: parts.join(' '),
          offset: "+00:00",
          country: parts.slice(1).join(' ') || "Unknown"
        });
      }
      // Add more elements as needed, up to 10
      // This pattern can be expanded for all 10 potential elements
      
      return fallbackTimezones;
    }
  };

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
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
        
        // Don't continue if we have no timezone codes
        if (limitedSlug.length === 0) return;
        
        const validTimeZones = await getURLTimeZones(limitedSlug);
        
        // Only update state if we have valid timezones
        if (validTimeZones && validTimeZones.length > 0) {
          setTimeZones(validTimeZones);
          
          // Wait for timeZones to be set, then sync the URL once
          setTimeout(() => {
            if (isClient && validTimeZones.length > 0) {
              // This ensures URL is correct after initial load
              updateURL();
            }
          }, 500);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, setSlug]);

  // Modified to prevent unwanted redirects
  useEffect(() => {
    // Skip completely on the server side
    if (!isClient) return; 
    
    // Only handle the redirect to home page case
    if (timeZones.length === 0 && slug === "") {
      pushWithQueryParams("/converter");
      return;
    }
    
    // Skip URL updates entirely for most cases to prevent flickering
    // We'll only update URLs when:
    // 1. User manually removes a timezone (handled by removeTimeZone)
    // 2. User completes a drag and drop (handled by handleDrop)
    // 3. Initial load is complete
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZones.length === 0, isClient]); // Only depend on if timezones are empty

  // Watch for timezone count changes to ensure URL stays in sync
  // but only update on significant changes to prevent flickering
  const prevTimeZoneCountRef = useRef(timeZones.length);
  useEffect(() => {
    if (!isClient) return;
    
    // Skip minor array changes during normal usage
    if (Math.abs(timeZones.length - prevTimeZoneCountRef.current) >= 1) {
      // If there's been a significant change in timezone count
      // (like adding a new timezone), update the URL
      prevTimeZoneCountRef.current = timeZones.length;
      
      // Add a small delay to avoid multiple updates when adding multiple timezones
      setTimeout(() => {
        updateURL();
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZones.length, isClient]);

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
