import { AppStore } from "@/lib/types";
import { create } from "zustand";

export const useAppStore = create<AppStore>((set) => ({
  currentDate: new Date(), // Default value
  setCurrentDate: (date: Date) => set({ currentDate: date }),
  is24Hour: false, // Default value
  setIs24Hour: (is24Hour) => set({ is24Hour }),
  slug: "", // Initial value of the slug
  setSlug: (slug: string) => set({ slug }),
  timeZones: [], // Default value
  setTimeZones: (timeZones) => set({ timeZones }),
}));
