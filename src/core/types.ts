// Known values keep autocomplete; any other string is still accepted
type Open<T extends string> = T | (string & {});

export interface CalendarEvent {
  id: string | number;
  date: string | Date;

  // Rendered as the event card's title. Availability mode never renders the
  // card, so callers there need not supply one.
  name?: string;

  // Last day of a multi-day event, inclusive. Absent means a single day.
  endDate?: string | Date;

  // Time fields
  startTime?: string;
  endTime?: string;
  allDay?: boolean;

  // Display & categorization
  description?: string;
  color?: string;
  category?: Open<
    'work' | 'personal' | 'meeting' | 'deadline' | 'appointment' | 'other'
  >;
  location?: string;
  url?: string;

  // Status & priority
  status?: Open<'scheduled' | 'completed' | 'cancelled' | 'tentative'>;
  priority?: Open<'low' | 'medium' | 'high'>;

  // Availability bucket. Distinct from `status`: this is the caller's own
  // state mapped down to an opaque label for the availability layer, so
  // internal detail never reaches the calendar.
  availabilityStatus?: Open<'open' | 'conditional' | 'blocked'>;

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
  monthCount?: number;
}

export interface CalendarPane {
  year: number;
  month: number;
  monthAndYearText: string;
  calendarDates: CalendarDate[][];
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

export interface CalendarViewModel extends CalendarState {
  months: string[];
  days: string[];
  years: number[];
  monthAndYearText: string;
  scheduleDay: string;
  panes: CalendarPane[];
  calendarDates: CalendarDate[][];
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
  outOfRangeBg?: string;
  outOfRangeFg?: string;
  navArrowFg?: string;
  navArrowBg?: string;
  navArrowBorder?: string;
  navArrowHoverFg?: string;
  navArrowHoverBg?: string;
  inputInvalidBg?: string;
  popupHeaderFg?: string;
  popupCloseFg?: string;
  popupCloseBg?: string;
  popupCloseHoverBg?: string;
  headerBg?: string;
  popupBg?: string;
  pickerBg?: string;
  pickerShadow?: string;
  eventIndicator?: string;
  onAccent?: string;
  link?: string;

  // Availability — traffic light
  openBg?: string;
  openFg?: string;
  conditionalBg?: string;
  conditionalFg?: string;
  blockedBg?: string;
  blockedFg?: string;
  rangeBg?: string;
  rangeOutline?: string;
  inRangeBg?: string;
  inRangeOutline?: string;

  // Badges — badgeBg/badgeText are the fallback for caller-defined values
  badgeBg?: string;
  badgeText?: string;
  badgeSuccessBg?: string;
  badgeSuccessText?: string;
  badgeInfoBg?: string;
  badgeInfoText?: string;
  badgeWarningBg?: string;
  badgeWarningText?: string;
  badgeDangerBg?: string;
  badgeDangerText?: string;
  badgeNeutralBg?: string;
  badgeNeutralText?: string;
  badgePositiveBg?: string;
  badgePositiveText?: string;
  badgeTentativeBg?: string;
  badgeTentativeText?: string;
}
