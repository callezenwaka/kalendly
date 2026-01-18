import { describe, it, expect, vi } from 'vitest';
import { CalendarEngine } from '../../../src/core/calendar-engine';
import { CalendarEvent } from '../../../src/core/types';

// Test fixtures
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 1,
    name: 'Team Meeting',
    date: '2024-01-15',
  },
  {
    id: 2,
    name: 'Project Review',
    date: '2024-01-20',
  },
  {
    id: 3,
    name: 'Code Review',
    date: '2024-01-15',
  },
];

describe('CalendarEngine', () => {
  describe('Constructor & Initialization', () => {
    it('should initialize with default config', () => {
      const engine = new CalendarEngine({ events: [] });
      const state = engine.getState();

      expect(state.currentYear).toBe(new Date().getFullYear());
      expect(state.currentMonth).toBe(new Date().getMonth());
      expect(state.selectedDate).toBeNull();
      expect(state.tasks).toEqual([]);
    });

    it('should initialize with custom initialDate', () => {
      const customDate = new Date('2024-06-15');
      const engine = new CalendarEngine({
        events: [],
        initialDate: customDate,
      });
      const state = engine.getState();

      expect(state.currentYear).toBe(2024);
      expect(state.currentMonth).toBe(5); // June is month 5 (0-indexed)
      expect(state.currentDate).toBe(15);
    });

    it('should initialize with minYear and maxYear', () => {
      const engine = new CalendarEngine({
        events: [],
        minYear: 2020,
        maxYear: 2030,
      });
      const viewModel = engine.getViewModel();

      expect(viewModel.years[0]).toBe(2020);
      expect(viewModel.years[viewModel.years.length - 1]).toBe(2030);
    });

    it('should initialize with weekStartsOn Monday', () => {
      const engine = new CalendarEngine({
        events: [],
        weekStartsOn: 1,
      });

      // Verify week starts on Monday by checking calendar generation
      const viewModel = engine.getViewModel();
      expect(viewModel.calendarDates).toBeDefined();
    });

    it('should initialize with empty events array', () => {
      const engine = new CalendarEngine({ events: [] });
      const state = engine.getState();

      expect(state.tasks).toEqual([]);
    });
  });

  describe('Subscription System', () => {
    it('should subscribe to state changes', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      const unsubscribe = engine.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify listeners on state change', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      engine.subscribe(listener);
      engine.getActions().next();

      expect(listener).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      const unsubscribe = engine.subscribe(listener);
      unsubscribe();

      engine.getActions().next();
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      engine.subscribe(listener1);
      engine.subscribe(listener2);

      engine.getActions().next();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should not notify after unsubscribe', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      const unsubscribe = engine.subscribe(listener);
      unsubscribe();

      engine.getActions().next();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('View Model Generation', () => {
    it('should generate correct view model structure', () => {
      const engine = new CalendarEngine({ events: MOCK_EVENTS });
      const viewModel = engine.getViewModel();

      expect(viewModel).toHaveProperty('currentYear');
      expect(viewModel).toHaveProperty('currentMonth');
      expect(viewModel).toHaveProperty('months');
      expect(viewModel).toHaveProperty('days');
      expect(viewModel).toHaveProperty('years');
      expect(viewModel).toHaveProperty('monthAndYearText');
      expect(viewModel).toHaveProperty('calendarDates');
      expect(viewModel).toHaveProperty('popupPositionClass');
    });

    it('should include all required properties', () => {
      const engine = new CalendarEngine({ events: [] });
      const viewModel = engine.getViewModel();

      expect(Array.isArray(viewModel.months)).toBe(true);
      expect(viewModel.months.length).toBe(12);
      expect(Array.isArray(viewModel.days)).toBe(true);
      expect(viewModel.days.length).toBe(7);
      expect(Array.isArray(viewModel.years)).toBe(true);
    });

    it('should compute calendar dates correctly', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });
      const viewModel = engine.getViewModel();

      expect(Array.isArray(viewModel.calendarDates)).toBe(true);
      expect(viewModel.calendarDates.length).toBeGreaterThan(0);
      expect(Array.isArray(viewModel.calendarDates[0])).toBe(true);
    });

    it('should compute popup position class', () => {
      const engine = new CalendarEngine({ events: [] });
      const viewModel = engine.getViewModel();

      expect(viewModel.popupPositionClass).toBe('popup-center-bottom');
    });

    it('should format scheduleDay correctly when date selected', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      const date = new Date('2024-01-15');
      engine.handleDateClick(date, 3);

      const viewModel = engine.getViewModel();
      expect(viewModel.scheduleDay).toContain('15');
    });
  });

  describe('Navigation - next()', () => {
    it('should move to next month', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      engine.getActions().next();
      const state = engine.getState();

      expect(state.currentMonth).toBe(1); // February
      expect(state.currentYear).toBe(2024);
    });

    it('should roll over to January when at December', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-12-15'),
      });

      engine.getActions().next();
      const state = engine.getState();

      expect(state.currentMonth).toBe(0); // January
    });

    it('should increment year when rolling over', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-12-15'),
      });

      engine.getActions().next();
      const state = engine.getState();

      expect(state.currentYear).toBe(2025);
      expect(state.currentMonth).toBe(0);
    });

    it('should clear selected date on navigation', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      engine.handleDateClick(new Date('2024-01-15'));
      engine.getActions().next();

      const state = engine.getState();
      expect(state.selectedDate).toBeNull();
    });

    it('should notify listeners', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      engine.subscribe(listener);
      engine.getActions().next();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Navigation - previous()', () => {
    it('should move to previous month', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-03-15'),
      });

      engine.getActions().previous();
      const state = engine.getState();

      expect(state.currentMonth).toBe(1); // February
      expect(state.currentYear).toBe(2024);
    });

    it('should roll back to December when at January', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      engine.getActions().previous();
      const state = engine.getState();

      expect(state.currentMonth).toBe(11); // December
    });

    it('should decrement year when rolling back', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      engine.getActions().previous();
      const state = engine.getState();

      expect(state.currentYear).toBe(2023);
      expect(state.currentMonth).toBe(11);
    });

    it('should clear selected date on navigation', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      engine.handleDateClick(new Date('2024-01-15'));
      engine.getActions().previous();

      const state = engine.getState();
      expect(state.selectedDate).toBeNull();
    });

    it('should notify listeners', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      engine.subscribe(listener);
      engine.getActions().previous();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Navigation - jump()', () => {
    it('should jump to specific year and month', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      engine.getActions().jump(2025, 5); // June 2025
      const state = engine.getState();

      expect(state.currentYear).toBe(2025);
      expect(state.currentMonth).toBe(5);
    });

    it('should clear selected date', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      engine.handleDateClick(new Date('2024-01-15'));
      engine.getActions().jump(2025, 0);

      const state = engine.getState();
      expect(state.selectedDate).toBeNull();
    });

    it('should handle boundary years', () => {
      const engine = new CalendarEngine({
        events: [],
        minYear: 2020,
        maxYear: 2030,
      });

      engine.getActions().jump(2020, 0);
      let state = engine.getState();
      expect(state.currentYear).toBe(2020);

      engine.getActions().jump(2030, 11);
      state = engine.getState();
      expect(state.currentYear).toBe(2030);
    });

    it('should notify listeners', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      engine.subscribe(listener);
      engine.getActions().jump(2025, 5);

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Navigation - goToToday()', () => {
    it('should navigate to current month and year', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2020-06-15'),
      });

      const today = new Date();
      engine.getActions().goToToday();
      const state = engine.getState();

      expect(state.currentYear).toBe(today.getFullYear());
      expect(state.currentMonth).toBe(today.getMonth());
    });

    it('should clear selected date', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2020-06-15'),
      });

      engine.handleDateClick(new Date('2020-06-15'), 3);
      engine.getActions().goToToday();

      const state = engine.getState();
      expect(state.selectedDate).toBeNull();
      expect(state.selectedDayIndex).toBeNull();
    });

    it('should notify listeners', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2020-06-15'),
      });
      const listener = vi.fn();

      engine.subscribe(listener);
      engine.getActions().goToToday();

      expect(listener).toHaveBeenCalled();
    });

    it('should work when already on current month', () => {
      const engine = new CalendarEngine({ events: [] });
      const today = new Date();

      engine.getActions().goToToday();
      const state = engine.getState();

      expect(state.currentYear).toBe(today.getFullYear());
      expect(state.currentMonth).toBe(today.getMonth());
    });
  });

  describe('Navigation - isCurrentMonth()', () => {
    it('should return true when viewing current month', () => {
      const engine = new CalendarEngine({ events: [] });

      expect(engine.getActions().isCurrentMonth()).toBe(true);
    });

    it('should return false when viewing different month', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2020-06-15'),
      });

      expect(engine.getActions().isCurrentMonth()).toBe(false);
    });

    it('should return false after navigating away from current month', () => {
      const engine = new CalendarEngine({ events: [] });

      expect(engine.getActions().isCurrentMonth()).toBe(true);

      engine.getActions().previous();
      expect(engine.getActions().isCurrentMonth()).toBe(false);
    });

    it('should return true after using goToToday', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2020-06-15'),
      });

      expect(engine.getActions().isCurrentMonth()).toBe(false);

      engine.getActions().goToToday();
      expect(engine.getActions().isCurrentMonth()).toBe(true);
    });

    it('should return false when same month but different year', () => {
      const today = new Date();
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date(today.getFullYear() - 1, today.getMonth(), 15),
      });

      expect(engine.getActions().isCurrentMonth()).toBe(false);
    });
  });

  describe('Date Selection', () => {
    it('should select a date with dayIndex', () => {
      const engine = new CalendarEngine({ events: [] });
      const date = new Date('2024-01-15');

      engine.handleDateClick(date, 3);
      const state = engine.getState();

      expect(state.selectedDate).toEqual(date);
      expect(state.selectedDayIndex).toBe(3);
    });

    it('should select a date without dayIndex', () => {
      const engine = new CalendarEngine({ events: [] });
      const date = new Date('2024-01-15');

      engine.handleDateClick(date);
      const state = engine.getState();

      expect(state.selectedDate).toEqual(date);
      expect(state.selectedDayIndex).toBeNull();
    });

    it('should update current state to selected date', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-01'),
      });

      const date = new Date('2024-03-20');
      engine.handleDateClick(date);
      const state = engine.getState();

      expect(state.currentYear).toBe(2024);
      expect(state.currentMonth).toBe(2); // March
      expect(state.currentDate).toBe(20);
    });

    it('should update tasks for selected date', () => {
      const engine = new CalendarEngine({ events: MOCK_EVENTS });
      const date = new Date('2024-01-15');

      engine.handleDateClick(date);
      const state = engine.getState();

      expect(state.tasks.length).toBe(2); // Two events on Jan 15
      expect(state.tasks[0].id).toBe(1);
      expect(state.tasks[1].id).toBe(3);
    });

    it('should notify listeners', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      engine.subscribe(listener);
      engine.handleDateClick(new Date('2024-01-15'));

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Event Management', () => {
    it('should update events and refresh tasks', () => {
      const engine = new CalendarEngine({ events: [] });

      engine.updateEvents(MOCK_EVENTS);
      const date = new Date('2024-01-15');
      engine.handleDateClick(date);

      const state = engine.getState();
      expect(state.tasks.length).toBe(2);
    });

    it('should get events for specific date', () => {
      const engine = new CalendarEngine({ events: MOCK_EVENTS });
      const date = new Date('2024-01-15');

      const events = engine.getEventsForDate(date);
      expect(events.length).toBe(2);
      expect(events[0].id).toBe(1);
      expect(events[1].id).toBe(3);
    });

    it('should check if date has events', () => {
      const engine = new CalendarEngine({ events: MOCK_EVENTS });

      const hasEvents = engine.hasEventsForDate(new Date('2024-01-15'));
      expect(hasEvents).toBe(true);

      const hasNoEvents = engine.hasEventsForDate(new Date('2024-01-16'));
      expect(hasNoEvents).toBe(false);
    });

    it('should handle empty events array', () => {
      const engine = new CalendarEngine({ events: [] });
      const events = engine.getEventsForDate(new Date('2024-01-15'));

      expect(events).toEqual([]);
    });

    it('should handle multiple events on same date', () => {
      const engine = new CalendarEngine({ events: MOCK_EVENTS });
      const events = engine.getEventsForDate(new Date('2024-01-15'));

      expect(events.length).toBe(2);
    });
  });

  describe('State Management', () => {
    it('should return cloned state (immutability)', () => {
      const engine = new CalendarEngine({ events: [] });
      const state1 = engine.getState();
      const state2 = engine.getState();

      expect(state1).not.toBe(state2); // Different references
      expect(state1).toEqual(state2); // Same values
    });

    it('should clear selection correctly', () => {
      const engine = new CalendarEngine({ events: MOCK_EVENTS });

      engine.handleDateClick(new Date('2024-01-15'));
      engine.clearSelection();

      const state = engine.getState();
      expect(state.selectedDate).toBeNull();
      expect(state.selectedDayIndex).toBeNull();
    });

    it('should clear tasks when selection cleared', () => {
      const engine = new CalendarEngine({ events: MOCK_EVENTS });

      engine.handleDateClick(new Date('2024-01-15'));
      let state = engine.getState();
      expect(state.tasks.length).toBe(2);

      engine.clearSelection();
      state = engine.getState();
      expect(state.tasks).toEqual([]);
    });

    it('should handle destroy and cleanup listeners', () => {
      const engine = new CalendarEngine({ events: [] });
      const listener = vi.fn();

      engine.subscribe(listener);
      engine.destroy();
      engine.getActions().next();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year February 29', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-02-29'),
      });

      const state = engine.getState();
      expect(state.currentYear).toBe(2024);
      expect(state.currentMonth).toBe(1); // February
      expect(state.currentDate).toBe(29);
    });

    it('should handle month boundaries', () => {
      const engine = new CalendarEngine({
        events: [],
        initialDate: new Date('2024-01-31'),
      });

      engine.getActions().next();
      const state = engine.getState();

      expect(state.currentMonth).toBe(1); // February
    });

    it('should handle timezone differences', () => {
      const date1 = new Date('2024-01-15T23:00:00Z');
      const date2 = new Date('2024-01-15T01:00:00Z');

      const engine = new CalendarEngine({
        events: [
          { id: 1, name: 'Event 1', date: date1 },
          { id: 2, name: 'Event 2', date: date2 },
        ],
      });

      const events = engine.getEventsForDate(new Date('2024-01-15'));
      expect(events.length).toBe(2);
    });
  });

  describe('Category Colors', () => {
    it('should initialize with default category colors', () => {
      const engine = new CalendarEngine({ events: [] });
      const color = engine.getCategoryColor('work');

      expect(color).toBe('#3b82f6');
    });

    it('should initialize with custom category colors', () => {
      const engine = new CalendarEngine({
        events: [],
        categoryColors: { work: '#ff0000' },
      });
      const color = engine.getCategoryColor('work');

      expect(color).toBe('#ff0000');
    });

    it('should get category color for known category', () => {
      const engine = new CalendarEngine({ events: [] });

      expect(engine.getCategoryColor('work')).toBe('#3b82f6');
      expect(engine.getCategoryColor('personal')).toBe('#8b5cf6');
      expect(engine.getCategoryColor('meeting')).toBe('#10b981');
    });

    it('should return other category color for unknown category', () => {
      const engine = new CalendarEngine({ events: [] });
      const color = engine.getCategoryColor('unknown');

      expect(color).toBe('#6b7280'); // Returns 'other' category color
    });

    it('should return default color when category is undefined', () => {
      const engine = new CalendarEngine({ events: [] });
      const color = engine.getCategoryColor();

      expect(color).toBe('#fc8917');
    });

    it('should update category colors dynamically', () => {
      const engine = new CalendarEngine({ events: [] });

      let color = engine.getCategoryColor('work');
      expect(color).toBe('#3b82f6');

      engine.updateCategoryColors({ work: '#00ff00' });
      color = engine.getCategoryColor('work');
      expect(color).toBe('#00ff00');
    });

    it('should merge custom colors with existing ones on update', () => {
      const engine = new CalendarEngine({
        events: [],
        categoryColors: { work: '#ff0000' },
      });

      expect(engine.getCategoryColor('work')).toBe('#ff0000');
      expect(engine.getCategoryColor('personal')).toBe('#8b5cf6');

      engine.updateCategoryColors({ personal: '#0000ff' });

      expect(engine.getCategoryColor('work')).toBe('#3b82f6'); // Reset to default
      expect(engine.getCategoryColor('personal')).toBe('#0000ff');
    });

    it('should handle custom category colors', () => {
      const engine = new CalendarEngine({
        events: [],
        categoryColors: { myCustomCategory: '#abcdef' },
      });

      const color = engine.getCategoryColor('myCustomCategory');
      expect(color).toBe('#abcdef');
    });
  });
});
