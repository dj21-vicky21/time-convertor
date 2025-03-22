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
