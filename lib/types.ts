export interface TimeZone {
  id: number;
  fullName: string;
  offset: string;
  name: string;
}
export interface TimeCardProps {
  removeTimeZone: (id: number) => void;
  tz: TimeZone;
  currentDate: Date;
  handleTimeChange: (date: Date) => void;
  is24Hour: boolean
}

export interface TimeZoneTimelineProps {
  timeZone: string;
  currentDate: Date;
  onTimeChange: (newDate: Date) => void;
  offset: string;
  is24Hour: boolean;
}

export interface MainPageProps {
    params: {
      slug: string;
    };
  }
  