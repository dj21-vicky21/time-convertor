export interface TimeZone {
  uuid: string;
  id: string;
  offset: string;
  name: string;
  fullName: string;
  country: string;
}

export interface TimeCardProps {
  removeTimeZone: (name: string) => void;
  tz: TimeZone;
  currentDate: Date;
  handleTimeChange: (date: Date) => void;
  is24Hour: boolean;
  index: number;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}

export interface TimeZoneTimelineProps {
  timeZone: string;
  currentDate: Date;
  onTimeChange: (newDate: Date) => void;
  offset: string;
  is24Hour: boolean;
  getOffsetMinutes: (offset: string) => number;
  getLocalOffsetMinutes: () => number;
  convertToLocalTime: (tzDate: Date, offset: string) => Date;
}

export interface MainPageProps {
  params: {
    slug: string;
  };
}

export interface AppStore {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  is24Hour: boolean;
  setIs24Hour: (is24Hour: boolean) => void;
  slug: string;
  setSlug: (slug: string) => void;
  timeZones: TimeZone[];
  setTimeZones: (timeZones: TimeZone[]) => void;
  viewMode: "list" | "grid";
  setViewMode: (viewMode: "list" | "grid") => void;
}
