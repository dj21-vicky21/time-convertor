"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import TimeCard from "@/components/card";
import { useAppStore } from "@/store/appStore";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getTimezones } from "@/actions/getTimeZone";
import { toast } from "sonner";
import { TimeZone } from "@/lib/types";

// Add type for window extension
declare global {
  interface Window {
    updateURLTimeout?: number;
  }
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Reference to store timeZones order separately from state to prevent re-renders
  const timeZonesRef = useRef<TimeZone[]>([]);
  
  // Track URL updates
  const lastSlugRef = useRef<string>(slug);
  
  // Track card UUIDs that are currently being removed
  const removingCardsRef = useRef<Set<string>>(new Set());
  
  // Track if initial data has been loaded
  const initialLoadDoneRef = useRef(false);
  
  // Ref to decouple searchParams from callback dependencies
  const searchParamsRef = useRef(searchParams);
  
  // Maximum number of timezones allowed
  const MAX_TIMEZONES = 7;
  
  // Create a ref for the drag and drop operation
  const dragDropRef = useRef<{
    cards: NodeListOf<Element> | null;
    draggingElement: HTMLElement | null;
  }>({ cards: null, draggingElement: null });
  
  // Update timeZonesRef when timeZones changes
  useEffect(() => {
    timeZonesRef.current = timeZones;
  }, [timeZones]);

  // Keep searchParamsRef in sync without triggering callback re-creation
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // Reads searchParams from ref to avoid dependency churn
  const pushWithQueryParams = useCallback((path: string) => {
    if (path.split('?')[0] === pathname) return;
    
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.set('is24Hour', is24Hour.toString());
    params.set('viewMode', viewMode);
    
    const newUrl = params.toString() ? `${path}?${params.toString()}` : path;
    router.push(newUrl, {scroll: false});
  }, [router, is24Hour, viewMode, pathname]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fast slug parsing - optimized to reduce calculations
  const getValuesFromSlug = useCallback((slug: string) => {
    if (!slug) return [];
    
    try {
      // Decode URL-encoded characters (like %20 for spaces)
      let decodedSlug;
      try {
        decodedSlug = decodeURIComponent(slug);
      } catch {
        decodedSlug = slug; // Fall back to raw slug if decoding fails
      }
      
      const parts = decodedSlug.split("-");
      
      // Fast path for simple case
      if (parts.length === 0) return [];
      if (parts.length === 1) return [parts[0]];
      
      // Handle "to" format
      if (parts.length >= 2 && parts[1] === "to") {
        return [parts[0], ...parts.slice(2)].filter(Boolean);
      } else {
        return [parts[0]];
      }
    } catch {
      return [];
    }
  }, []);

  // Generate slug efficiently
  const generateSlugStructure = useCallback((values: string[]) => {
    // Fast path for empty or single value
    if (!values.length) return "";
    if (values.length === 1) return encodeURIComponent(values[0]);
    
    // First element + "-to-" + remaining elements
    return `${encodeURIComponent(values[0])}-to-${values.slice(1).map(encodeURIComponent).join("-")}`;
  }, []);

  // Optimized URL update function with improved slug handling
  const updateURL = useCallback((tzArray?: TimeZone[]) => {
    if (!isClient) return;
    
    // Use passed array or current state
    const zonesToUse = tzArray || timeZones;
    
    // Skip if no timezones or we're still loading initial data
    if (!zonesToUse.length) return;
    
    // Create new slug from timezone IDs - optimized to minimize processing
    const timezoneIds = zonesToUse.map(tz => tz.id);
    const formattedSlug = generateSlugStructure(timezoneIds);
    
    // Only update if different from current slug
    if (formattedSlug && formattedSlug !== lastSlugRef.current) {
      // Update ref first to prevent duplicate updates
      lastSlugRef.current = formattedSlug;
      
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        pushWithQueryParams(`/converter/${formattedSlug}`);
      });
    }
  }, [isClient, generateSlugStructure, timeZones, pushWithQueryParams]);
  
  // Enhanced optimization - debounce URL updates during rapid changes
  const debouncedUpdateURL = useCallback((tzArray?: TimeZone[]) => {
    if (typeof window === 'undefined') return;
    
    if (window.updateURLTimeout) {
      clearTimeout(window.updateURLTimeout);
    }
    
    window.updateURLTimeout = setTimeout(() => {
      updateURL(tzArray);
    }, 100) as unknown as number;
  }, [updateURL]);

  // Efficient time change handler - only creates new Date when needed
  const handleTimeChange = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, [setCurrentDate]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    
    // Get and store card element
    const card = e.currentTarget.closest('.timezone-card') as HTMLElement;
    if (!card) return;
    
    // Store references for later
    dragDropRef.current = {
      draggingElement: card,
      cards: document.querySelectorAll('.timezone-card')
    };
    
    // Visual updates
    card.style.opacity = '0.4';
    card.classList.add('dragging');
    e.dataTransfer.setDragImage(card, 20, 20);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

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
    
    // Update state with the new order
    setTimeZones(newTimeZones);
    
    // Update URL with the new timezone order - use debounced version
    debouncedUpdateURL(newTimeZones);
  }, [draggedIndex, setTimeZones, debouncedUpdateURL]);

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
    
    // Apply the updated order from our ref to the state
    const updatedTimeZones = [...timeZonesRef.current];
    setTimeZones(updatedTimeZones);
    
    // Clear drag drop references
    dragDropRef.current = {
      draggingElement: null,
      cards: null,
    };
    
    // Update URL - use debounced version for better performance 
    debouncedUpdateURL(updatedTimeZones);
  }, [setTimeZones, debouncedUpdateURL]);

  // Uses refs inside setTimeout to avoid stale closures
  const removeTimeZone = useCallback((uuid: string) => {
    if (removingCardsRef.current.has(uuid)) return;
    
    removingCardsRef.current.add(uuid);
    timeZonesRef.current = timeZonesRef.current.filter(tz => tz.uuid !== uuid);
    
    const cardToRemove = document.querySelector(`[data-uuid="${uuid}"]`);
    if (cardToRemove) cardToRemove.classList.add('removing');
    
    setTimeout(() => {
      const filtered = timeZonesRef.current.filter(tz => tz.uuid !== uuid);
      setTimeZones(filtered);
      
      if (isClient) {
        const params = new URLSearchParams(searchParamsRef.current.toString());
        params.set('is24Hour', is24Hour.toString());
        params.set('viewMode', viewMode);

        if (filtered.length === 0) {
          router.replace(`/converter${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
        } else {
          const formattedSlug = generateSlugStructure(filtered.map(tz => tz.id));
          router.replace(`/converter/${formattedSlug}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
        }
      }
      
      removingCardsRef.current.delete(uuid);
    }, 100);
  }, [setTimeZones, isClient, router, is24Hour, viewMode, generateSlugStructure]);

  // Initial data loading with cancellation guard to prevent race conditions
  useEffect(() => {
    if (!slug || initialLoadDoneRef.current) {
      setIsLoading(false);
      return;
    }

    // Set guard immediately so Strict Mode re-runs skip the fetch
    initialLoadDoneRef.current = true;

    let cancelled = false;
    setIsLoading(true);

    const fetchData = async () => {
      try {
        setSlug(slug);
        const splitSlug = getValuesFromSlug(slug);
        
        if (!splitSlug.length) {
          if (!cancelled) setIsLoading(false);
          return;
        }
        
        const limitedSlug = splitSlug.slice(0, MAX_TIMEZONES);
        
        if (limitedSlug.length < splitSlug.length) {
          toast.warning("Maximum of 10 time zones allowed", {
            description: "Only the first 10 time zones have been added."
          });
        }
        
        const validTimeZones = await getURLTimeZones(limitedSlug);
        
        if (cancelled) return;

        if (validTimeZones?.length) {
          setTimeZones(validTimeZones);
          debouncedUpdateURL(validTimeZones);
        }
      } catch (error) {
        console.error("Error loading timezones:", error);
        initialLoadDoneRef.current = false;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Only redirect when data is loaded and there are genuinely no timezones
  useEffect(() => {
    if (!isClient || isLoading) return;
    
    if (timeZones.length === 0 && slug === "" && initialLoadDoneRef.current) {
      pushWithQueryParams("/converter");
    }
  }, [timeZones.length, isClient, isLoading, slug, pushWithQueryParams]);

  // Memoize TimeCard components to prevent unnecessary renders
  const memoizedTimeCards = useMemo(() => {
    if (!isClient) return null;
    
    return timeZones.map((tz, index) => (
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
    ));
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

  const getURLTimeZones = async (a: string[]) => {
    if (!a.length) return [];
    
    try {
      const allCountries = await getTimezones(a);
      return allCountries;
    } catch (error) {
      console.error("Error fetching timezones:", error);
      // Create fallback timezones directly without any loops
      const fallbackTimezones: TimeZone[] = [];
      
      // Process the first timezone if exists
      if (a.length > 0) {
        const id = a[0];
        const parts = id.split('_');
        fallbackTimezones.push({
          uuid: Math.random().toString(36).substr(2, 9),
          id,
          name: parts[0] || "TZ",
          fullName: parts.join(' '),
          offset: "+00:00",
          country: parts.slice(1).join(' ') || "Unknown"
        });
      }
      
      // Process the second timezone if exists
      if (a.length > 1) {
        const id = a[1];
        const parts = id.split('_');
        fallbackTimezones.push({
          uuid: Math.random().toString(36).substr(2, 9),
          id,
          name: parts[0] || "TZ",
          fullName: parts.join(' '),
          offset: "+00:00",
          country: parts.slice(1).join(' ') || "Unknown"
        });
      }
      
      return fallbackTimezones;
    }
  };

  return <>{memoizedTimeCards}</>;
}

export default TimeZoneApp;
