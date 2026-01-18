export * from './types';
export * from './utils';
export { CalendarEngine } from './calendar-engine';

// Re-export commonly used utilities
export {
  MONTHS,
  MONTHS_FULL,
  DAYS,
  normalizeDate,
  isSameDay,
  isToday,
  generateYears,
  getEventsForDate,
  hasEvents,
  generateCalendarDates,
  getPopupPositionClass,
  getCellClasses,
  formatDateForDisplay,
  getMonthYearText,
} from './utils';
