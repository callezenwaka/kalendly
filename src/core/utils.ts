import { CalendarEvent, CalendarDate } from './types';

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

/**
 * Normalizes a date to midnight (00:00:00) for comparison purposes
 */
export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

/**
 * Checks if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Generates an array of years for the year selector
 */
export function generateYears(minYear?: number, maxYear?: number): number[] {
  const currentYear = new Date().getFullYear();
  const min = minYear ?? currentYear - 30;
  const max = maxYear ?? currentYear + 10;

  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

/**
 * Gets events for a specific date
 */
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

/**
 * Checks if a date has any events
 */
export function hasEvents(events: CalendarEvent[], date: Date): boolean {
  return getEventsForDate(events, date).length > 0;
}

/**
 * Generates calendar dates for a given month and year
 */
export function generateCalendarDates(
  year: number,
  month: number,
  events: CalendarEvent[] = [],
  weekStartsOn: 0 | 1 = 0
): (CalendarDate | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Adjust first day based on week start preference
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

    // Break early if we've filled all days and the rest of the row is empty
    if (day > daysInMonth && weekDates.every(date => date === null)) {
      break;
    }
  }

  return dates;
}

/**
 * Gets the popup position class based on the selected day index
 */
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

/**
 * Gets CSS classes for a calendar cell
 */
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

/**
 * Formats a date for display
 */
export function formatDateForDisplay(date: Date): string {
  return `${DAYS[date.getDay()]} ${date.getDate()}`;
}

/**
 * Gets month and year text for display
 */
export function getMonthYearText(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}
