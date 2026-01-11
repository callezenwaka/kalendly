import { CalendarEvent, CalendarDate, CategoryColorMap } from './types';

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function generateYears(minYear?: number, maxYear?: number): number[] {
  const currentYear = new Date().getFullYear();
  const min = minYear ?? currentYear - 30;
  const max = maxYear ?? currentYear + 10;

  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function getEventsForDate(
  events: CalendarEvent[],
  date: Date
): CalendarEvent[] {
  const normalizedTargetDate = normalizeDate(date);

  return events.filter(event => {
    const eventDate = normalizeDate(new Date(event.date));
    return eventDate.getTime() === normalizedTargetDate.getTime();
  });
}

export function hasEvents(events: CalendarEvent[], date: Date): boolean {
  return getEventsForDate(events, date).length > 0;
}

export function generateCalendarDates(
  year: number,
  month: number,
  events: CalendarEvent[] = [],
  weekStartsOn: 0 | 1 = 0
): (CalendarDate | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let firstDayOfWeek = firstDay.getDay();
  if (weekStartsOn === 1) {
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  }

  const dates: (CalendarDate | null)[][] = [];
  let day = 1;

  for (let week = 0; week < 6; week++) {
    const weekDates: (CalendarDate | null)[] = [];

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      if (week === 0 && dayOfWeek < firstDayOfWeek) {
        weekDates.push(null);
      } else if (day > daysInMonth) {
        weekDates.push(null);
      } else {
        const currentDate = new Date(year, month, day);
        const dateEvents = getEventsForDate(events, currentDate);

        weekDates.push({
          date: currentDate,
          isCurrentMonth: true,
          isToday: isToday(currentDate),
          hasEvents: dateEvents.length > 0,
          events: dateEvents,
        });
        day++;
      }
    }

    dates.push(weekDates);

    if (day > daysInMonth && weekDates.every(date => date === null)) {
      break;
    }
  }

  return dates;
}

export function getPopupPositionClass(selectedDayIndex: number | null): string {
  if (selectedDayIndex === null) return 'popup-center-bottom';

  if (selectedDayIndex < 3) {
    return 'popup-right';
  } else if (selectedDayIndex > 4) {
    return 'popup-left';
  } else {
    return 'popup-center-bottom';
  }
}

export function getCellClasses(calendarDate: CalendarDate | null): string[] {
  if (!calendarDate) return [];

  const classes: string[] = [];

  if (calendarDate.isToday) {
    classes.push('schedule--current--exam');
  }

  if (calendarDate.hasEvents) {
    classes.push('has--event');
  }

  return classes;
}

export function formatDateForDisplay(date: Date): string {
  return `${DAYS[date.getDay()]} ${date.getDate()}`;
}

export function getMonthYearText(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}

export function formatTimeRange(event: CalendarEvent): string {
  if (event.allDay || (!event.startTime && !event.endTime)) {
    return 'All day';
  }

  if (event.startTime && event.endTime) {
    return `${event.startTime} - ${event.endTime}`;
  }

  if (event.startTime) {
    return `${event.startTime}`;
  }

  return '';
}

export function formatAttendees(attendees?: string[]): string {
  if (!attendees || attendees.length === 0) return '';

  if (attendees.length === 1) return attendees[0];
  if (attendees.length === 2) return attendees.join(' and ');

  return `${attendees.slice(0, -1).join(', ')}, and ${attendees[attendees.length - 1]}`;
}

export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aAllDay = a.allDay || (!a.startTime && !a.endTime);
    const bAllDay = b.allDay || (!b.startTime && !b.endTime);

    if (aAllDay && !bAllDay) return -1;
    if (!aAllDay && bAllDay) return 1;

    if (!a.startTime || !b.startTime) return 0;
    return a.startTime.localeCompare(b.startTime);
  });
}

export const DEFAULT_CATEGORY_COLORS: CategoryColorMap = {
  work: '#3b82f6',
  personal: '#8b5cf6',
  meeting: '#10b981',
  deadline: '#ef4444',
  appointment: '#f59e0b',
  other: '#6b7280',
};

// Dynamic function that accepts custom colors
export function getDefaultEventColor(
  category?: string,
  customColors?: CategoryColorMap
): string {
  const colorMap = customColors || DEFAULT_CATEGORY_COLORS;

  if (category && colorMap[category]) {
    return colorMap[category];
  }

  // Default fallback color
  return '#fc8917';
}

// Helper to merge custom colors with defaults
export function mergeCategoryColors(
  customColors?: CategoryColorMap
): CategoryColorMap {
  return {
    ...DEFAULT_CATEGORY_COLORS,
    ...customColors,
  };
}

// Validate if a color is a valid hex color
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

// Get color for a category with validation
export function getCategoryColor(
  category: string,
  customColors?: CategoryColorMap
): string {
  const colorMap = mergeCategoryColors(customColors);
  const color = colorMap[category] || colorMap.other || '#fc8917';

  return isValidHexColor(color) ? color : '#fc8917';
}
