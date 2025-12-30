import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
  MONTHS,
  DAYS,
} from '../../../src/core/utils';
import { CalendarEvent } from '../../../src/core/types';

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 1, name: 'Team Meeting', date: '2024-01-15' },
  { id: 2, name: 'Project Review', date: '2024-01-20' },
  { id: 3, name: 'Code Review', date: '2024-01-15' },
];

describe('Date Utilities', () => {
  describe('normalizeDate', () => {
    it('should normalize date to midnight', () => {
      const date = new Date('2024-01-15T14:30:00');
      const normalized = normalizeDate(date);

      expect(normalized.getHours()).toBe(0);
      expect(normalized.getMinutes()).toBe(0);
      expect(normalized.getSeconds()).toBe(0);
      expect(normalized.getMilliseconds()).toBe(0);
    });

    it('should strip time component', () => {
      const morning = new Date('2024-01-15T08:00:00');
      const evening = new Date('2024-01-15T20:00:00');

      const normalizedMorning = normalizeDate(morning);
      const normalizedEvening = normalizeDate(evening);

      expect(normalizedMorning.getTime()).toBe(normalizedEvening.getTime());
    });

    it('should preserve date components', () => {
      const date = new Date('2024-03-25T14:30:00');
      const normalized = normalizeDate(date);

      expect(normalized.getFullYear()).toBe(2024);
      expect(normalized.getMonth()).toBe(2); // March
      expect(normalized.getDate()).toBe(25);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day different times', () => {
      const date1 = new Date('2024-01-15T08:00:00');
      const date2 = new Date('2024-01-15T20:00:00');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should handle edge cases at midnight', () => {
      const date1 = new Date('2024-01-15T23:59:59');
      const date2 = new Date('2024-01-15T00:00:00');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different months same day number', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-02-15');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for different years same month/day', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2025-01-15');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should correctly identify today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });

    it('should handle different times on same day', () => {
      const todayMorning = new Date();
      todayMorning.setHours(8, 0, 0, 0);
      const todayEvening = new Date();
      todayEvening.setHours(20, 0, 0, 0);

      expect(isToday(todayMorning)).toBe(true);
      expect(isToday(todayEvening)).toBe(true);
    });
  });
});

describe('Year Generation', () => {
  describe('generateYears', () => {
    it('should generate default year range', () => {
      const currentYear = new Date().getFullYear();
      const years = generateYears();

      expect(years[0]).toBe(currentYear - 30);
      expect(years[years.length - 1]).toBe(currentYear + 10);
      expect(years.length).toBe(41); // 30 + 1 + 10
    });

    it('should respect minYear and maxYear', () => {
      const years = generateYears(2020, 2025);

      expect(years[0]).toBe(2020);
      expect(years[years.length - 1]).toBe(2025);
      expect(years.length).toBe(6);
    });

    it('should handle single year range', () => {
      const years = generateYears(2024, 2024);

      expect(years.length).toBe(1);
      expect(years[0]).toBe(2024);
    });

    it('should generate sequential years', () => {
      const years = generateYears(2020, 2025);

      for (let i = 0; i < years.length - 1; i++) {
        expect(years[i + 1] - years[i]).toBe(1);
      }
    });

    it('should respect only minYear when maxYear not provided', () => {
      const currentYear = new Date().getFullYear();
      const years = generateYears(2020);

      expect(years[0]).toBe(2020);
      expect(years[years.length - 1]).toBe(currentYear + 10);
    });
  });
});

describe('Event Filtering', () => {
  describe('getEventsForDate', () => {
    it('should return events for specific date', () => {
      const date = new Date('2024-01-15');
      const events = getEventsForDate(MOCK_EVENTS, date);

      expect(events.length).toBe(2);
      expect(events[0].id).toBe(1);
      expect(events[1].id).toBe(3);
    });

    it('should return empty array when no events', () => {
      const date = new Date('2024-01-16');
      const events = getEventsForDate(MOCK_EVENTS, date);

      expect(events).toEqual([]);
    });

    it('should handle multiple events on same date', () => {
      const date = new Date('2024-01-15');
      const events = getEventsForDate(MOCK_EVENTS, date);

      expect(events.length).toBe(2);
    });

    it('should normalize event dates correctly', () => {
      const eventsWithTime: CalendarEvent[] = [
        { id: 1, name: 'Morning Event', date: new Date('2024-01-15T08:00:00') },
        { id: 2, name: 'Evening Event', date: new Date('2024-01-15T20:00:00') },
      ];

      const date = new Date('2024-01-15');
      const events = getEventsForDate(eventsWithTime, date);

      expect(events.length).toBe(2);
    });

    it('should handle string and Date types', () => {
      const mixedEvents: CalendarEvent[] = [
        { id: 1, name: 'String Date', date: '2024-01-15' },
        { id: 2, name: 'Date Object', date: new Date('2024-01-15') },
      ];

      const date = new Date('2024-01-15');
      const events = getEventsForDate(mixedEvents, date);

      expect(events.length).toBe(2);
    });

    it('should handle empty events array', () => {
      const events = getEventsForDate([], new Date('2024-01-15'));
      expect(events).toEqual([]);
    });
  });

  describe('hasEvents', () => {
    it('should return true when events exist', () => {
      const date = new Date('2024-01-15');
      expect(hasEvents(MOCK_EVENTS, date)).toBe(true);
    });

    it('should return false when no events', () => {
      const date = new Date('2024-01-16');
      expect(hasEvents(MOCK_EVENTS, date)).toBe(false);
    });
  });
});

describe('Calendar Grid Generation', () => {
  describe('generateCalendarDates', () => {
    it('should generate correct grid for January 2024', () => {
      const dates = generateCalendarDates(2024, 0, []); // January 2024

      expect(Array.isArray(dates)).toBe(true);
      expect(dates.length).toBeGreaterThan(0);
      expect(dates[0].length).toBe(7); // 7 days per week
    });

    it('should handle February leap year (29 days)', () => {
      const dates = generateCalendarDates(2024, 1, []); // February 2024

      const allDates = dates.flat().filter(d => d !== null);
      expect(allDates.length).toBe(29);
    });

    it('should handle February non-leap year (28 days)', () => {
      const dates = generateCalendarDates(2023, 1, []); // February 2023

      const allDates = dates.flat().filter(d => d !== null);
      expect(allDates.length).toBe(28);
    });

    it('should handle months starting on Sunday', () => {
      const dates = generateCalendarDates(2024, 8, [], 0); // September 2024 starts on Sunday

      expect(dates[0][0]).not.toBeNull(); // First cell should not be null
    });

    it('should handle months starting on Monday', () => {
      const dates = generateCalendarDates(2024, 0, [], 0); // January 2024 starts on Monday

      expect(dates[0][0]).toBeNull(); // First cell (Sunday) should be null
      expect(dates[0][1]).not.toBeNull(); // Second cell (Monday) should have date
    });

    it('should handle months starting on Saturday', () => {
      const dates = generateCalendarDates(2024, 5, [], 0); // June 2024 starts on Saturday

      expect(dates[0][6]).not.toBeNull(); // Saturday cell should have date
    });

    it('should respect weekStartsOn Sunday (0)', () => {
      const dates = generateCalendarDates(2024, 0, [], 0);

      // First row should start with nulls for days before month starts
      expect(Array.isArray(dates[0])).toBe(true);
      expect(dates[0].length).toBe(7);
    });

    it('should respect weekStartsOn Monday (1)', () => {
      const dates = generateCalendarDates(2024, 0, [], 1);

      // Calendar should be adjusted for Monday start
      expect(Array.isArray(dates[0])).toBe(true);
      expect(dates[0].length).toBe(7);
    });

    it('should include correct null padding', () => {
      const dates = generateCalendarDates(2024, 0, [], 0); // January 2024

      // January 1, 2024 is a Monday, so first cell (Sunday) should be null
      expect(dates[0][0]).toBeNull();
    });

    it('should attach events to correct dates', () => {
      const events: CalendarEvent[] = [
        { id: 1, name: 'Event', date: '2024-01-15' },
      ];
      const dates = generateCalendarDates(2024, 0, events);

      const allDates = dates.flat().filter(d => d !== null);
      const dateWith15 = allDates.find(d => d && d.date.getDate() === 15);

      expect(dateWith15).toBeDefined();
      expect(dateWith15?.hasEvents).toBe(true);
      expect(dateWith15?.events.length).toBe(1);
    });

    it('should set isToday flag correctly', () => {
      const today = new Date();
      const dates = generateCalendarDates(
        today.getFullYear(),
        today.getMonth(),
        []
      );

      const allDates = dates.flat().filter(d => d !== null);
      const todayDate = allDates.find(d => d && d.isToday);

      expect(todayDate).toBeDefined();
      expect(todayDate?.date.getDate()).toBe(today.getDate());
    });

    it('should set hasEvents flag correctly', () => {
      const events: CalendarEvent[] = [
        { id: 1, name: 'Event', date: '2024-01-15' },
      ];
      const dates = generateCalendarDates(2024, 0, events);

      const allDates = dates.flat().filter(d => d !== null);
      const dateWithEvent = allDates.find(d => d && d.date.getDate() === 15);
      const dateWithoutEvent = allDates.find(d => d && d.date.getDate() === 16);

      expect(dateWithEvent?.hasEvents).toBe(true);
      expect(dateWithoutEvent?.hasEvents).toBe(false);
    });

    it('should handle December to January boundary', () => {
      const decemberDates = generateCalendarDates(2024, 11, []); // December
      const januaryDates = generateCalendarDates(2025, 0, []); // January

      const decDates = decemberDates.flat().filter(d => d !== null);
      const janDates = januaryDates.flat().filter(d => d !== null);

      expect(decDates.length).toBe(31);
      expect(janDates.length).toBe(31);
    });

    it('should generate maximum 6 weeks', () => {
      const dates = generateCalendarDates(2024, 0, []);

      expect(dates.length).toBeLessThanOrEqual(6);
    });

    it('should have isCurrentMonth property set to true', () => {
      const dates = generateCalendarDates(2024, 0, []);

      const allDates = dates.flat().filter(d => d !== null);
      allDates.forEach(date => {
        expect(date?.isCurrentMonth).toBe(true);
      });
    });
  });
});

describe('Popup Positioning', () => {
  describe('getPopupPositionClass', () => {
    it('should return popup-right for dayIndex 0', () => {
      expect(getPopupPositionClass(0)).toBe('popup-right');
    });

    it('should return popup-right for dayIndex 1', () => {
      expect(getPopupPositionClass(1)).toBe('popup-right');
    });

    it('should return popup-right for dayIndex 2', () => {
      expect(getPopupPositionClass(2)).toBe('popup-right');
    });

    it('should return popup-center-bottom for dayIndex 3', () => {
      expect(getPopupPositionClass(3)).toBe('popup-center-bottom');
    });

    it('should return popup-center-bottom for dayIndex 4', () => {
      expect(getPopupPositionClass(4)).toBe('popup-center-bottom');
    });

    it('should return popup-left for dayIndex 5', () => {
      expect(getPopupPositionClass(5)).toBe('popup-left');
    });

    it('should return popup-left for dayIndex 6', () => {
      expect(getPopupPositionClass(6)).toBe('popup-left');
    });

    it('should return popup-center-bottom for null', () => {
      expect(getPopupPositionClass(null)).toBe('popup-center-bottom');
    });
  });
});

describe('CSS Class Generation', () => {
  describe('getCellClasses', () => {
    it('should return empty array for null', () => {
      expect(getCellClasses(null)).toEqual([]);
    });

    it('should include schedule--current--exam for today', () => {
      const today = new Date();
      const cellDate = {
        date: today,
        isCurrentMonth: true,
        isToday: true,
        hasEvents: false,
        events: [],
      };

      const classes = getCellClasses(cellDate);
      expect(classes).toContain('schedule--current--exam');
    });

    it('should include has--event when events exist', () => {
      const cellDate = {
        date: new Date('2024-01-15'),
        isCurrentMonth: true,
        isToday: false,
        hasEvents: true,
        events: [{ id: 1, name: 'Event', date: '2024-01-15' }],
      };

      const classes = getCellClasses(cellDate);
      expect(classes).toContain('has--event');
    });

    it('should combine both classes when applicable', () => {
      const today = new Date();
      const cellDate = {
        date: today,
        isCurrentMonth: true,
        isToday: true,
        hasEvents: true,
        events: [{ id: 1, name: 'Event', date: today }],
      };

      const classes = getCellClasses(cellDate);
      expect(classes).toContain('schedule--current--exam');
      expect(classes).toContain('has--event');
      expect(classes.length).toBe(2);
    });

    it('should return empty array when no special conditions', () => {
      const cellDate = {
        date: new Date('2024-01-15'),
        isCurrentMonth: true,
        isToday: false,
        hasEvents: false,
        events: [],
      };

      const classes = getCellClasses(cellDate);
      expect(classes).toEqual([]);
    });
  });
});

describe('Formatting Functions', () => {
  describe('formatDateForDisplay', () => {
    it('should format date with day name and number', () => {
      const date = new Date('2024-01-15'); // Monday
      const formatted = formatDateForDisplay(date);

      expect(formatted).toContain('15');
      expect(formatted).toContain('Monday');
    });

    it('should handle all weekdays correctly', () => {
      const dates = [
        new Date('2024-01-14'), // Sunday
        new Date('2024-01-15'), // Monday
        new Date('2024-01-16'), // Tuesday
        new Date('2024-01-17'), // Wednesday
        new Date('2024-01-18'), // Thursday
        new Date('2024-01-19'), // Friday
        new Date('2024-01-20'), // Saturday
      ];

      const expectedDays = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];

      dates.forEach((date, index) => {
        const formatted = formatDateForDisplay(date);
        expect(formatted).toContain(expectedDays[index]);
      });
    });
  });

  describe('getMonthYearText', () => {
    it('should format month and year', () => {
      const text = getMonthYearText(2024, 0); // January 2024
      expect(text).toBe('Jan 2024');
    });

    it('should handle all 12 months', () => {
      const expectedMonths = [
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

      expectedMonths.forEach((month, index) => {
        const text = getMonthYearText(2024, index);
        expect(text).toBe(`${month} 2024`);
      });
    });

    it('should handle different years', () => {
      expect(getMonthYearText(2023, 5)).toBe('Jun 2023');
      expect(getMonthYearText(2024, 5)).toBe('Jun 2024');
      expect(getMonthYearText(2025, 5)).toBe('Jun 2025');
    });
  });
});

describe('Constants', () => {
  it('should export MONTHS array with 12 months', () => {
    expect(Array.isArray(MONTHS)).toBe(true);
    expect(MONTHS.length).toBe(12);
    expect(MONTHS[0]).toBe('Jan');
    expect(MONTHS[11]).toBe('Dec');
  });

  it('should export DAYS array with 7 days', () => {
    expect(Array.isArray(DAYS)).toBe(true);
    expect(DAYS.length).toBe(7);
    expect(DAYS[0]).toBe('Sunday');
    expect(DAYS[6]).toBe('Saturday');
  });
});
