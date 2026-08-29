import { describe, it, expect } from 'vitest';
import {
  normalizeDate,
  isSameDay,
  isToday,
  generateYears,
  getEventsForDate,
  hasEvents,
  generateCalendarDates,
  getCellClasses,
  formatDateForDisplay,
  getMonthYearText,
  mergeCategoryColors,
  getCategoryColor,
  isValidHexColor,
  getDefaultEventColor,
  escapeHtml,
  slugifyToken,
  safeUrl,
  safeColor,
  parseTimeToMinutes,
  formatMinutes,
  mergeIntervals,
  bookedSlots,
  isDateWithinWindow,
  isDayAllowed,
  parseHourRanges,
  DEFAULT_CATEGORY_COLORS,
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

      const currentMonthDates = dates.flat().filter(d => d.isCurrentMonth);
      expect(currentMonthDates.length).toBe(29);
    });

    it('should handle February non-leap year (28 days)', () => {
      const dates = generateCalendarDates(2023, 1, []); // February 2023

      const currentMonthDates = dates.flat().filter(d => d.isCurrentMonth);
      expect(currentMonthDates.length).toBe(28);
    });

    it('should handle months starting on Sunday', () => {
      const dates = generateCalendarDates(2024, 8, [], 0); // September 2024 starts on Sunday

      expect(dates[0][0].isCurrentMonth).toBe(true); // First cell should be current month
    });

    it('should handle months starting on Monday', () => {
      const dates = generateCalendarDates(2024, 0, [], 0); // January 2024 starts on Monday

      expect(dates[0][0].isCurrentMonth).toBe(false); // First cell (Sunday) should be previous month
      expect(dates[0][1].isCurrentMonth).toBe(true); // Second cell (Monday) should be current month
    });

    it('should handle months starting on Saturday', () => {
      const dates = generateCalendarDates(2024, 5, [], 0); // June 2024 starts on Saturday

      expect(dates[0][6].isCurrentMonth).toBe(true); // Saturday cell should be current month
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

    it('should include correct padding from previous month', () => {
      const dates = generateCalendarDates(2024, 0, [], 0); // January 2024

      // January 1, 2024 is a Monday, so first cell (Sunday) should be from previous month
      expect(dates[0][0].isCurrentMonth).toBe(false);
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

      const decDates = decemberDates.flat().filter(d => d.isCurrentMonth);
      const janDates = januaryDates.flat().filter(d => d.isCurrentMonth);

      expect(decDates.length).toBe(31);
      expect(janDates.length).toBe(31);
    });

    it('should generate maximum 6 weeks', () => {
      const dates = generateCalendarDates(2024, 0, []);

      expect(dates.length).toBeLessThanOrEqual(6);
    });

    it('should have isCurrentMonth property set correctly', () => {
      const dates = generateCalendarDates(2024, 0, []);

      const currentMonthDates = dates.flat().filter(d => d.isCurrentMonth);
      const otherMonthDates = dates.flat().filter(d => !d.isCurrentMonth);

      // All current month dates should have the flag
      currentMonthDates.forEach(date => {
        expect(date.isCurrentMonth).toBe(true);
      });

      // Other dates should not have the flag
      otherMonthDates.forEach(date => {
        expect(date.isCurrentMonth).toBe(false);
      });
    });
  });
});

describe('CSS Class Generation', () => {
  describe('getCellClasses', () => {
    it('should include kalendly-cell-today for today', () => {
      const today = new Date();
      const cellDate = {
        date: today,
        isCurrentMonth: true,
        isToday: true,
        hasEvents: false,
        events: [],
      };

      const classes = getCellClasses(cellDate);
      expect(classes).toContain('kalendly-cell-today');
    });

    it('should include kalendly-cell-has-event when events exist', () => {
      const cellDate = {
        date: new Date('2024-01-15'),
        isCurrentMonth: true,
        isToday: false,
        hasEvents: true,
        events: [{ id: 1, name: 'Event', date: '2024-01-15' }],
      };

      const classes = getCellClasses(cellDate);
      expect(classes).toContain('kalendly-cell-has-event');
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
      expect(classes).toContain('kalendly-cell-today');
      expect(classes).toContain('kalendly-cell-has-event');
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
      expect(text).toBe('January 2024');
    });

    it('should handle all 12 months', () => {
      const expectedMonths = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      expectedMonths.forEach((month, index) => {
        const text = getMonthYearText(2024, index);
        expect(text).toBe(`${month} 2024`);
      });
    });

    it('should handle different years', () => {
      expect(getMonthYearText(2023, 5)).toBe('June 2023');
      expect(getMonthYearText(2024, 5)).toBe('June 2024');
      expect(getMonthYearText(2025, 5)).toBe('June 2025');
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

describe('Category Color Functions', () => {
  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#FFF')).toBe(true);
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#123abc')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('fff')).toBe(false);
      expect(isValidHexColor('#gggggg')).toBe(false);
      expect(isValidHexColor('#ff')).toBe(false);
      expect(isValidHexColor('#fffffff')).toBe(false);
      expect(isValidHexColor('rgb(255,255,255)')).toBe(false);
    });
  });

  describe('mergeCategoryColors', () => {
    it('should return default colors when no custom colors provided', () => {
      const merged = mergeCategoryColors();

      expect(merged).toEqual(DEFAULT_CATEGORY_COLORS);
    });

    it('should merge custom colors with defaults', () => {
      const customColors = {
        work: '#ff0000',
        custom: '#00ff00',
      };

      const merged = mergeCategoryColors(customColors);

      expect(merged.work).toBe('#ff0000');
      expect(merged.custom).toBe('#00ff00');
      expect(merged.personal).toBe(DEFAULT_CATEGORY_COLORS.personal);
      expect(merged.meeting).toBe(DEFAULT_CATEGORY_COLORS.meeting);
    });

    it('should override default colors with custom ones', () => {
      const customColors = {
        work: '#custom1',
        personal: '#custom2',
      };

      const merged = mergeCategoryColors(customColors);

      expect(merged.work).toBe('#custom1');
      expect(merged.personal).toBe('#custom2');
    });

    it('should handle empty object', () => {
      const merged = mergeCategoryColors({});

      expect(merged).toEqual(DEFAULT_CATEGORY_COLORS);
    });
  });

  describe('getCategoryColor', () => {
    it('should return color for known category', () => {
      const color = getCategoryColor('work');

      expect(color).toBe(DEFAULT_CATEGORY_COLORS.work);
    });

    it('should return custom color when provided', () => {
      const customColors = { work: '#ff0000' };
      const color = getCategoryColor('work', customColors);

      expect(color).toBe('#ff0000');
    });

    it('should return other category color for unknown category', () => {
      const color = getCategoryColor('unknown');

      expect(color).toBe(DEFAULT_CATEGORY_COLORS.other);
    });

    it('should return fallback for invalid hex color', () => {
      const customColors = { work: 'kalendly-invalid' };
      const color = getCategoryColor('work', customColors);

      expect(color).toBe('#fc8917');
    });

    it('should handle custom categories', () => {
      const customColors = { myCategory: '#123456' };
      const color = getCategoryColor('myCategory', customColors);

      expect(color).toBe('#123456');
    });
  });

  describe('getDefaultEventColor', () => {
    it('should return category color when category exists', () => {
      const color = getDefaultEventColor('work');

      expect(color).toBe(DEFAULT_CATEGORY_COLORS.work);
    });

    it('should return custom color when provided', () => {
      const customColors = { meeting: '#abcdef' };
      const color = getDefaultEventColor('meeting', customColors);

      expect(color).toBe('#abcdef');
    });

    it('should return default fallback when category not found', () => {
      const color = getDefaultEventColor('nonexistent');

      expect(color).toBe('#fc8917');
    });

    it('should return default fallback when category is undefined', () => {
      const color = getDefaultEventColor();

      expect(color).toBe('#fc8917');
    });

    it('should use custom colors map', () => {
      const customColors = {
        work: '#111111',
        personal: '#222222',
      };

      expect(getDefaultEventColor('work', customColors)).toBe('#111111');
      expect(getDefaultEventColor('personal', customColors)).toBe('#222222');
    });
  });
});

describe('Sanitizers', () => {
  describe('escapeHtml', () => {
    it('should escape every HTML-significant character', () => {
      expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
    });

    it('should neutralise a script payload', () => {
      expect(escapeHtml('<script>alert(1)</script>')).toBe(
        '&lt;script&gt;alert(1)&lt;/script&gt;'
      );
    });

    it('should neutralise an attribute breakout payload', () => {
      expect(escapeHtml('" onfocus=alert(1) autofocus="')).toBe(
        '&quot; onfocus=alert(1) autofocus=&quot;'
      );
    });

    it('should leave safe text untouched', () => {
      expect(escapeHtml('Team Meeting')).toBe('Team Meeting');
    });

    it('should coerce non-string values', () => {
      expect(escapeHtml(2024)).toBe('2024');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('slugifyToken', () => {
    it('should collapse whitespace into a single class token', () => {
      expect(slugifyToken('in progress')).toBe('in-progress');
    });

    it('should trim leading and trailing separators', () => {
      expect(slugifyToken('--Active--')).toBe('active');
    });

    it('should strip characters that could escape an attribute', () => {
      expect(slugifyToken('a" onmouseover="x')).toBe('a-onmouseover-x');
      expect(slugifyToken('<script>')).toBe('script');
    });

    it('should leave an already-safe token unchanged', () => {
      expect(slugifyToken('completed')).toBe('completed');
    });
  });

  describe('safeUrl', () => {
    it('should allow http, https and mailto', () => {
      expect(safeUrl('https://example.com/a?b=1')).toBe(
        'https://example.com/a?b=1'
      );
      expect(safeUrl('http://example.com')).toBe('http://example.com');
      expect(safeUrl('mailto:someone@example.com')).toBe(
        'mailto:someone@example.com'
      );
    });

    it('should allow relative URLs', () => {
      expect(safeUrl('/events/1')).toBe('/events/1');
      expect(safeUrl('#details')).toBe('#details');
      expect(safeUrl('./local.html')).toBe('./local.html');
      expect(safeUrl('events/1')).toBe('events/1');
    });

    it('should reject javascript and data URLs', () => {
      expect(safeUrl('javascript:alert(1)')).toBe('#');
      expect(safeUrl('JaVaScRiPt:alert(1)')).toBe('#');
      expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
      expect(safeUrl('vbscript:msgbox(1)')).toBe('#');
    });

    it('should reject scheme obfuscation with whitespace and control characters', () => {
      expect(safeUrl('  javascript:alert(1)')).toBe('#');
      expect(safeUrl('java script:alert(1)')).toBe('#');
      expect(safeUrl('java\\tscript:alert(1)')).toBe('#');
      expect(safeUrl('java\\nscript:alert(1)')).toBe('#');
    });
  });

  describe('safeColor', () => {
    it('should allow hex colors in both lengths', () => {
      expect(safeColor('#fff')).toBe('#fff');
      expect(safeColor('#3b82f6')).toBe('#3b82f6');
    });

    it('should allow bare CSS keywords', () => {
      expect(safeColor('red')).toBe('red');
      expect(safeColor('rebeccapurple')).toBe('rebeccapurple');
    });

    it('should reject values that could escape the style attribute', () => {
      expect(safeColor('red" onmouseover="alert(1)')).toBe('#3b82f6');
      expect(safeColor('red; background: url(x)')).toBe('#3b82f6');
      expect(safeColor('')).toBe('#3b82f6');
    });
  });
});

describe('Booking intervals', () => {
  const on = (date: string, hours: boolean[]) =>
    hours.reduce<number[]>(
      (acc, booked, i) => (booked ? [...acc, i] : acc),
      []
    );

  describe('parseTimeToMinutes', () => {
    it('parses valid times', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('09:30')).toBe(570);
      expect(parseTimeToMinutes('24:00')).toBe(1440);
    });

    it('rejects anything it cannot read', () => {
      for (const bad of ['9am', '', '25:00', '09:60', 'noon', '09', null]) {
        expect(parseTimeToMinutes(bad)).toBeNull();
      }
    });
  });

  describe('formatMinutes', () => {
    it('renders the end of the day as 24:00, not 00:00', () => {
      expect(formatMinutes(0)).toBe('00:00');
      expect(formatMinutes(570)).toBe('09:30');
      expect(formatMinutes(1440)).toBe('24:00');
    });
  });

  describe('mergeIntervals', () => {
    it('merges overlapping and touching intervals', () => {
      expect(
        mergeIntervals([
          [0, 10],
          [5, 20],
          [20, 30],
          [40, 50],
        ])
      ).toEqual([
        [0, 30],
        [40, 50],
      ]);
    });
  });

  describe('bookedSlots', () => {
    const day = (iso: string) => new Date(`${iso}T00:00:00`);

    it('spreads an overnight booking across both days', () => {
      const events: CalendarEvent[] = [
        {
          id: 1,
          name: 'night',
          date: '2024-01-15',
          startTime: '22:00',
          endTime: '06:00',
        },
      ];

      expect(on('15', bookedSlots(events, day('2024-01-15')))).toEqual([
        22, 23,
      ]);
      expect(on('16', bookedSlots(events, day('2024-01-16')))).toEqual([
        0, 1, 2, 3, 4, 5,
      ]);
      expect(on('14', bookedSlots(events, day('2024-01-14')))).toEqual([]);
    });

    it('flows a missing end time into the next day', () => {
      const events: CalendarEvent[] = [
        { id: 1, name: 'late', date: '2024-01-15', startTime: '23:00' },
      ];

      // 120-minute slots: 12 a day, so 23:00-01:00 is the last slot of the
      // 15th and the first of the 16th
      expect(on('15', bookedSlots(events, day('2024-01-15'), 120))).toEqual([
        11,
      ]);
      expect(on('16', bookedSlots(events, day('2024-01-16'), 120))).toEqual([
        0,
      ]);
    });

    it('books one slot when no end time is given', () => {
      const events: CalendarEvent[] = [
        { id: 1, name: 'x', date: '2024-01-15', startTime: '09:00' },
      ];
      expect(on('15', bookedSlots(events, day('2024-01-15')))).toEqual([9]);
    });

    it('books the stated hours and nothing more', () => {
      const events: CalendarEvent[] = [
        {
          id: 1,
          name: 'x',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '11:00',
        },
      ];
      expect(on('15', bookedSlots(events, day('2024-01-15')))).toEqual([9, 10]);
    });

    it('lets two bookings share a day without double-counting', () => {
      const events: CalendarEvent[] = [
        {
          id: 1,
          name: 'meeting',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '17:00',
        },
        {
          id: 2,
          name: 'yoga',
          date: '2024-01-15',
          startTime: '17:30',
          endTime: '22:00',
        },
      ];

      expect(on('15', bookedSlots(events, day('2024-01-15')))).toEqual([
        9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      ]);
    });

    it('books the whole day for all-day, timeless and unreadable events', () => {
      const all = Array.from({ length: 24 }, (_, i) => i);

      for (const event of [
        { id: 1, name: 'x', date: '2024-01-15', allDay: true },
        { id: 2, name: 'x', date: '2024-01-15' },
        { id: 3, name: 'x', date: '2024-01-15', startTime: '9am' },
        {
          id: 4,
          name: 'x',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: 'noon',
        },
      ] as CalendarEvent[]) {
        expect(on('15', bookedSlots([event], day('2024-01-15')))).toEqual(all);
      }
    });

    it('honours a finer grid', () => {
      const events: CalendarEvent[] = [
        {
          id: 1,
          name: 'x',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '09:30',
        },
      ];

      const slots = bookedSlots(events, day('2024-01-15'), 30);
      expect(slots.length).toBe(48);
      expect(on('15', slots)).toEqual([18]); // 09:00–09:30 is slot 18
    });
  });
});

describe('Multi-day events', () => {
  const day = (iso: string) => new Date(`${iso}T00:00:00`);
  const span: CalendarEvent[] = [
    { id: 1, name: 'stay', date: '2024-01-15', endDate: '2024-01-17' },
  ];

  it('covers the first, interior and last day', () => {
    for (const iso of ['2024-01-15', '2024-01-16', '2024-01-17']) {
      expect(getEventsForDate(span, day(iso))).toHaveLength(1);
    }
  });

  it('covers neither neighbour', () => {
    expect(getEventsForDate(span, day('2024-01-14'))).toEqual([]);
    expect(getEventsForDate(span, day('2024-01-18'))).toEqual([]);
  });

  it('treats an absent endDate as a single day', () => {
    const single: CalendarEvent[] = [{ id: 1, name: 'x', date: '2024-01-15' }];
    expect(getEventsForDate(single, day('2024-01-15'))).toHaveLength(1);
    expect(getEventsForDate(single, day('2024-01-16'))).toEqual([]);
  });

  it('includes a single-day span, where endDate equals date', () => {
    const same: CalendarEvent[] = [
      { id: 1, name: 'x', date: '2024-01-15', endDate: '2024-01-15' },
    ];
    expect(getEventsForDate(same, day('2024-01-15'))).toHaveLength(1);
    expect(getEventsForDate(same, day('2024-01-16'))).toEqual([]);
  });

  it('throws when endDate precedes date', () => {
    const inverted: CalendarEvent[] = [
      { id: 7, name: 'x', date: '2024-01-17', endDate: '2024-01-15' },
    ];
    expect(() => getEventsForDate(inverted, day('2024-01-16'))).toThrow(
      /event 7 has an endDate before its date/
    );
  });

  it('throws on an unreadable endDate', () => {
    const bad: CalendarEvent[] = [
      { id: 9, name: 'x', date: '2024-01-15', endDate: 'next tuesday' },
    ];
    expect(() => getEventsForDate(bad, day('2024-01-15'))).toThrow(
      /event 9 has an unreadable endDate/
    );
  });

  it('repeats a span time window on every day it covers', () => {
    const hall: CalendarEvent[] = [
      {
        id: 1,
        name: 'meeting',
        date: '2024-01-15',
        endDate: '2024-01-17',
        startTime: '09:00',
        endTime: '17:00',
      },
      {
        id: 2,
        name: 'yoga',
        date: '2024-01-16',
        endDate: '2024-01-17',
        startTime: '17:30',
        endTime: '22:00',
      },
    ];

    const booked = (iso: string) =>
      bookedSlots(hall, day(iso)).reduce<number[]>(
        (acc, isBooked, i) => (isBooked ? [...acc, i] : acc),
        []
      );

    // 15th: meeting only
    expect(booked('2024-01-15')).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
    // 16th and 17th: meeting plus the class
    const both = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    expect(booked('2024-01-16')).toEqual(both);
    expect(booked('2024-01-17')).toEqual(both);
    // 18th: nothing
    expect(booked('2024-01-18')).toEqual([]);
  });
});

describe('isDateWithinWindow', () => {
  const min = new Date(2024, 2, 10);
  const max = new Date(2024, 2, 20);

  it('accepts a date inside the window', () => {
    expect(isDateWithinWindow(new Date(2024, 2, 15), min, max)).toBe(true);
  });

  it('treats both bounds as inclusive', () => {
    expect(isDateWithinWindow(new Date(2024, 2, 10), min, max)).toBe(true);
    expect(isDateWithinWindow(new Date(2024, 2, 20), min, max)).toBe(true);
  });

  it('rejects a date outside either bound', () => {
    expect(isDateWithinWindow(new Date(2024, 2, 9), min, max)).toBe(false);
    expect(isDateWithinWindow(new Date(2024, 2, 21), min, max)).toBe(false);
  });

  it('ignores the time of day on the bounds', () => {
    const lateMin = new Date(2024, 2, 10, 23, 59);
    expect(isDateWithinWindow(new Date(2024, 2, 10, 0, 1), lateMin, max)).toBe(
      true
    );
  });

  it('leaves an end unbounded when its bound is null', () => {
    expect(isDateWithinWindow(new Date(1990, 0, 1), null, max)).toBe(true);
    expect(isDateWithinWindow(new Date(2099, 0, 1), min, null)).toBe(true);
    expect(isDateWithinWindow(new Date(2099, 0, 1), null, null)).toBe(true);
  });

  it('accepts only that day when the bounds are equal', () => {
    const day = new Date(2024, 2, 15);
    expect(isDateWithinWindow(day, day, day)).toBe(true);
    expect(isDateWithinWindow(new Date(2024, 2, 16), day, day)).toBe(false);
  });
});

describe('isDayAllowed', () => {
  // 2024-03-10 is a Sunday, so this run covers getDay() 0 through 6
  const week = Array.from({ length: 7 }, (_, i) => new Date(2024, 2, 10 + i));

  it('allows every day when the list is null', () => {
    for (const day of week) expect(isDayAllowed(day, null)).toBe(true);
  });

  it('allows only the listed weekdays', () => {
    const weekdays = [1, 2, 3, 4, 5];
    const allowed = week.map(day => isDayAllowed(day, weekdays));
    expect(allowed).toEqual([false, true, true, true, true, true, false]);
  });

  it('uses getDay numbering, 0 = Sunday', () => {
    expect(week[0].getDay()).toBe(0);
    expect(isDayAllowed(week[0], [0])).toBe(true);
    expect(isDayAllowed(week[1], [0])).toBe(false);
  });

  it('allows nothing when the list is empty', () => {
    for (const day of week) expect(isDayAllowed(day, [])).toBe(false);
  });
});

describe('parseHourRanges', () => {
  it('parses a single range to half-open minutes', () => {
    expect(parseHourRanges('09:00-17:00', 60)).toEqual([[540, 1020]]);
  });

  it('parses a split shift', () => {
    expect(parseHourRanges('09:00-12:00,13:00-17:00', 60)).toEqual([
      [540, 720],
      [780, 1020],
    ]);
  });

  it('tolerates whitespace around ranges', () => {
    expect(parseHourRanges(' 09:00-12:00 , 13:00-17:00 ', 60)).toEqual([
      [540, 720],
      [780, 1020],
    ]);
  });

  it('accepts a range spanning the whole day', () => {
    expect(parseHourRanges('00:00-24:00', 60)).toEqual([[0, 1440]]);
  });

  it('accepts half-hour boundaries when slots are half-hour', () => {
    expect(parseHourRanges('09:30-17:00', 30)).toEqual([[570, 1020]]);
  });

  it('throws when a boundary misses the slot grid', () => {
    expect(() => parseHourRanges('09:30-17:00', 60)).toThrow(
      /does not land on a 60-minute slot boundary/
    );
  });

  it('throws when a range is inverted or empty', () => {
    expect(() => parseHourRanges('17:00-09:00', 60)).toThrow(
      /starts at or after it ends/
    );
    expect(() => parseHourRanges('09:00-09:00', 60)).toThrow(
      /starts at or after it ends/
    );
  });

  it('throws on a malformed range', () => {
    expect(() => parseHourRanges('09:00', 60)).toThrow(/not HH:MM-HH:MM/);
    expect(() => parseHourRanges('9am-5pm', 60)).toThrow(/unreadable time/);
    expect(() => parseHourRanges('09:00-25:00', 60)).toThrow(/unreadable time/);
  });

  it('throws when nothing is named', () => {
    expect(() => parseHourRanges('', 60)).toThrow(/is empty/);
    expect(() => parseHourRanges('  ,  ', 60)).toThrow(/is empty/);
  });

  it('throws on overlapping ranges', () => {
    expect(() => parseHourRanges('09:00-13:00,12:00-17:00', 60)).toThrow(
      /overlap or touch/
    );
  });

  it('throws on touching ranges, which are one window written twice', () => {
    expect(() => parseHourRanges('09:00-12:00,12:00-17:00', 60)).toThrow(
      /overlap or touch/
    );
  });

  it('accepts ranges given out of order', () => {
    expect(parseHourRanges('13:00-17:00,09:00-12:00', 60)).toEqual([
      [780, 1020],
      [540, 720],
    ]);
  });
});
