export interface CalendarEvent {
  id: string | number;
  name: string;
  date: string | Date;

  // Time fields
  startTime?: string;
  endTime?: string;
  allDay?: boolean;

  // Display & categorization
  description?: string;
  color?: string;
  category?:
    | 'work'
    | 'personal'
    | 'meeting'
    | 'deadline'
    | 'appointment'
    | 'other';
  location?: string;
  url?: string;

  // Status & priority
  status?: 'scheduled' | 'completed' | 'cancelled' | 'tentative';
  priority?: 'low' | 'medium' | 'high';

  // Collaboration
  attendees?: string[];
  organizer?: string;

  // Reminders & recurrence
  reminders?: number[];
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: string | Date;
    daysOfWeek?: number[];
  };

  // Metadata
  notes?: string;
  tags?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Flexibility for custom fields
  [key: string]: unknown;
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

export interface CategoryColorMap {
  [category: string]: string;
}

export interface CalendarConfig {
  events: CalendarEvent[];
  initialDate?: Date;
  minYear?: number;
  maxYear?: number;
  weekStartsOn?: 0 | 1;
  categoryColors?: CategoryColorMap;
}

export interface CalendarActions {
  next: () => void;
  previous: () => void;
  jump: (year: number, month: number) => void;
  goToToday: () => void;
  isCurrentMonth: () => boolean;
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
  calendarDates: CalendarDate[][];
  popupPositionClass: string;
}

export type CalendarEventHandler = (event: CalendarEvent) => void;

export interface CalendarProps {
  events: CalendarEvent[];
  initialDate?: Date;
  minYear?: number;
  maxYear?: number;
  weekStartsOn?: 0 | 1;
  useShortMonthNames?: boolean;
  onDateSelect?: (date: Date) => void;
  onEventClick?: CalendarEventHandler;
  onMonthChange?: (year: number, month: number) => void;
}

export interface CalendarTheme {
  primary?: string;
  secondary?: string;
  tertiary?: string;
  textColor?: string;
  textLight?: string;
  background?: string;
  cellHover?: string;
  borderColor?: string;
  todayOutline?: string;
  selectedBg?: string;
  headerBg?: string;
  popupBg?: string;
  eventIndicator?: string;
}
