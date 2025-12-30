export interface CalendarEvent {
  id: string | number;
  name: string;
  date: string | Date;
  description?: string;
  color?: string;
  [key: string]: any;
}

export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
  events: CalendarEvent[];
}

export interface CalendarState {
  currentYear: number;
  currentMonth: number;
  currentDate: number;
  selectedDate: Date | null;
  selectedDayIndex: number | null;
  tasks: CalendarEvent[];
}

export interface CalendarConfig {
  events: CalendarEvent[];
  initialDate?: Date;
  minYear?: number;
  maxYear?: number;
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
}

export interface CalendarActions {
  next: () => void;
  previous: () => void;
  jump: (year: number, month: number) => void;
  selectDate: (date: Date) => void;
  updateTasks: () => void;
}

export interface PopupPosition {
  class:
    | 'popup-left'
    | 'popup-right'
    | 'popup-center-top'
    | 'popup-center-bottom';
  style?: Record<string, string | number>;
}

export interface CalendarViewModel extends CalendarState {
  months: string[];
  days: string[];
  years: number[];
  monthAndYearText: string;
  scheduleDay: string;
  calendarDates: (CalendarDate | null)[][];
  popupPositionClass: string;
}

export type CalendarEventHandler = (event: CalendarEvent) => void;

export interface CalendarProps {
  events: CalendarEvent[];
  initialDate?: Date;
  minYear?: number;
  maxYear?: number;
  weekStartsOn?: 0 | 1;
  onDateSelect?: (date: Date) => void;
  onEventClick?: CalendarEventHandler;
  onMonthChange?: (year: number, month: number) => void;
}
