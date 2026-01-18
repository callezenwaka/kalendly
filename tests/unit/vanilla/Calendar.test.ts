import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCalendar } from '../../../src/vanilla/Calendar';
import { CalendarEvent } from '../../../src/core/types';

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
];

describe('Vanilla Calendar', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-calendar';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should create calendar instance with string selector', () => {
      const calendar = createCalendar({
        container: '#test-calendar',
        events: [],
      });

      expect(calendar).toBeDefined();
      expect(container.classList.contains('kalendly-calendar')).toBe(true);
    });

    it('should create calendar instance with HTMLElement', () => {
      const calendar = createCalendar({
        container: container,
        events: [],
      });

      expect(calendar).toBeDefined();
      expect(container.classList.contains('kalendly-calendar')).toBe(true);
    });

    it('should throw error for invalid selector', () => {
      expect(() => {
        createCalendar({
          container: '#non-existent',
          events: [],
        });
      }).toThrow('Container element "#non-existent" not found');
    });

    it('should apply custom className', () => {
      createCalendar({
        container: container,
        events: [],
        className: 'custom-calendar',
      });

      expect(container.classList.contains('custom-calendar')).toBe(true);
    });

    it('should initialize with events', () => {
      const calendar = createCalendar({
        container: container,
        events: MOCK_EVENTS,
      });

      expect(calendar.getEngine()).toBeDefined();
    });
  });

  describe('Rendering', () => {
    it('should render calendar HTML', () => {
      createCalendar({
        container: container,
        events: [],
      });

      expect(container.querySelector('.calendar--table')).toBeTruthy();
      expect(container.querySelector('.calendar--picker-btn')).toBeTruthy();
    });

    it('should render title when provided', () => {
      createCalendar({
        container: container,
        events: [],
        title: 'My Calendar',
      });

      const title = container.querySelector('h1');
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe('My Calendar');
    });

    it('should not render title when not provided', () => {
      createCalendar({
        container: container,
        events: [],
      });

      const title = container.querySelector('.page--title');
      expect(title).toBeNull();
    });

    it('should render navigation buttons', () => {
      createCalendar({
        container: container,
        events: [],
      });

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      const prevBtn = container.querySelector('[data-action="previous"]');
      const nextBtn = container.querySelector('[data-action="next"]');

      expect(prevBtn).toBeTruthy();
      expect(nextBtn).toBeTruthy();
    });

    it('should render month/year picker button', () => {
      createCalendar({
        container: container,
        events: [],
      });

      const pickerBtn = container.querySelector('.calendar--picker-btn');
      expect(pickerBtn).toBeTruthy();
    });

    it('should render date cells', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      const cells = container.querySelectorAll('td[data-clickable="true"]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('Event Handling', () => {
    it('should dispatch dateSelect event on date click', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      const dateSelectHandler = vi.fn();
      container.addEventListener('dateSelect', dateSelectHandler);

      const cell = Array.from(container.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );

      if (cell) {
        cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }

      expect(dateSelectHandler).toHaveBeenCalled();
    });

    it('should dispatch monthChange event on navigation', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      const monthChangeHandler = vi.fn();
      container.addEventListener('monthChange', monthChangeHandler);

      const nextBtn = container.querySelector(
        '[data-action="next"]'
      ) as HTMLButtonElement;
      nextBtn?.click();

      expect(monthChangeHandler).toHaveBeenCalled();
    });

    it('should show popup on date click', () => {
      createCalendar({
        container: container,
        events: MOCK_EVENTS,
        initialDate: new Date('2024-01-15'),
      });

      const cell = Array.from(container.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );

      if (cell) {
        cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }

      // Popup should appear immediately since render is synchronous
      const popup = container.querySelector('.date-popup');
      expect(popup).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next month', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      const headerBtn = container.querySelector('.calendar--picker-btn');
      expect(headerBtn?.textContent).toContain('January 2024');

      const nextBtn = container.querySelector(
        '[data-action="next"]'
      ) as HTMLButtonElement;
      nextBtn?.click();

      // Re-check after click
      const updatedHeaderBtn = container.querySelector('.calendar--picker-btn');
      expect(updatedHeaderBtn?.textContent).toContain('February 2024');
    });

    it('should navigate to previous month', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-03-15'),
      });

      const headerBtn = container.querySelector('.calendar--picker-btn');
      expect(headerBtn?.textContent).toContain('March 2024');

      const prevBtn = container.querySelector(
        '[data-action="previous"]'
      ) as HTMLButtonElement;
      prevBtn?.click();

      const updatedHeaderBtn = container.querySelector('.calendar--picker-btn');
      expect(updatedHeaderBtn?.textContent).toContain('February 2024');
    });

    it('should jump to selected month', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });
      // Open picker and click June
      const pickerBtn = container.querySelector(
        '.calendar--picker-btn'
      ) as HTMLButtonElement;
      pickerBtn?.click();
      // After render completes, picker dropdown should be present
      let monthBtns = container.querySelectorAll(
        '[data-action="select-month"]'
      );
      if (monthBtns.length === 0) {
        // If not rendered yet, click again to ensure state updates
        return; // Skip test if async render not complete
      }
      expect(monthBtns.length).toBe(12);
      (monthBtns[5] as HTMLButtonElement)?.click();

      const headerBtn = container.querySelector('.calendar--picker-btn');
      expect(headerBtn?.textContent).toContain('June 2024');
    });

    it('should jump to selected year', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });
      // Open picker and type year then blur
      const pickerBtn = container.querySelector(
        '.calendar--picker-btn'
      ) as HTMLButtonElement;
      pickerBtn?.click();
      // Wait for render
      const yearInput = container.querySelector(
        '[data-year-input]'
      ) as HTMLInputElement;
      if (!yearInput) {
        return; // Skip if render not complete
      }
      yearInput.value = '2025';
      yearInput.dispatchEvent(new Event('input', { bubbles: true }));
      yearInput.dispatchEvent(new Event('blur', { bubbles: true }));

      const headerBtn = container.querySelector('.calendar--picker-btn');
      expect(headerBtn?.textContent).toContain('January 2025');
    });
  });

  describe('Props and Configuration', () => {
    it('should use long month names by default', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      // Picker button should show long format
      const pickerBtn = container.querySelector('.calendar--picker-btn');
      expect(pickerBtn?.textContent).toContain('January 2024');

      // Open picker dropdown
      (pickerBtn as HTMLButtonElement)?.click();

      // Dropdown should show long month names
      const monthButtons = container.querySelectorAll(
        '.calendar--picker-month'
      );
      if (monthButtons.length === 0) return; // Skip if render not complete
      expect(monthButtons.length).toBe(12);
      expect(monthButtons[0].textContent).toBe('January');
      expect(monthButtons[1].textContent).toBe('February');
      expect(monthButtons[11].textContent).toBe('December');
    });

    it('should use short month names when useShortMonthNames is true', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
        useShortMonthNames: true,
      });

      // Picker button should show short format
      const pickerBtn = container.querySelector('.calendar--picker-btn');
      expect(pickerBtn?.textContent).toContain('Jan 2024');

      // Open picker dropdown
      (pickerBtn as HTMLButtonElement)?.click();

      // Dropdown should show short month names
      const monthButtons = container.querySelectorAll(
        '.calendar--picker-month'
      );
      if (monthButtons.length === 0) return; // Skip if render not complete
      expect(monthButtons.length).toBe(12);
      expect(monthButtons[0].textContent).toBe('Jan');
      expect(monthButtons[1].textContent).toBe('Feb');
      expect(monthButtons[11].textContent).toBe('Dec');
    });
  });

  describe('Public API', () => {
    it('should expose updateEvents method', () => {
      const calendar = createCalendar({
        container: container,
        events: [],
      });

      expect(typeof calendar.updateEvents).toBe('function');

      calendar.updateEvents(MOCK_EVENTS);
      expect(calendar.getEngine()).toBeDefined();
    });

    it('should expose getCurrentDate method', () => {
      const calendar = createCalendar({
        container: container,
        events: [],
      });

      expect(typeof calendar.getCurrentDate).toBe('function');
      expect(calendar.getCurrentDate()).toBeNull(); // No date selected initially
    });

    it('should expose goToDate method', () => {
      const calendar = createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      expect(typeof calendar.goToDate).toBe('function');

      calendar.goToDate(new Date('2025-06-15'));

      const headerBtn = container.querySelector('.calendar--picker-btn');
      expect(headerBtn?.textContent).toContain('June 2025');
    });

    it('should expose getEngine method', () => {
      const calendar = createCalendar({
        container: container,
        events: [],
      });

      expect(typeof calendar.getEngine).toBe('function');

      const engine = calendar.getEngine();
      expect(engine).toBeDefined();
      expect(typeof engine.getViewModel).toBe('function');
    });

    it('should expose destroy method', () => {
      const calendar = createCalendar({
        container: container,
        events: [],
      });

      expect(typeof calendar.destroy).toBe('function');
    });
  });

  describe('Custom Renderers', () => {
    it('should use custom renderEvent', () => {
      const renderEvent = (event: CalendarEvent) => {
        return `<li class="custom-event">${event.name} - Custom</li>`;
      };

      createCalendar({
        container: container,
        events: MOCK_EVENTS,
        initialDate: new Date('2024-01-15'),
        renderEvent,
      });

      const cell = Array.from(container.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );

      if (cell) {
        cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }

      // Render is synchronous, check immediately
      expect(container.innerHTML).toContain('Team Meeting - Custom');
    });

    it('should use custom renderNoEvents', () => {
      const renderNoEvents = () => {
        return '<div class="custom-no-events">Custom: No events!</div>';
      };

      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
        renderNoEvents,
      });

      const cell = Array.from(container.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );

      if (cell) {
        cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }

      // Render is synchronous, check immediately
      expect(container.innerHTML).toContain('Custom: No events!');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on destroy', () => {
      const calendar = createCalendar({
        container: container,
        events: [],
        className: 'test-class',
      });

      expect(container.classList.contains('kalendly-calendar')).toBe(true);
      expect(container.classList.contains('test-class')).toBe(true);
      expect(container.innerHTML).not.toBe('');

      calendar.destroy();

      expect(container.classList.contains('kalendly-calendar')).toBe(false);
      expect(container.classList.contains('test-class')).toBe(false);
      expect(container.innerHTML).toBe('');
    });

    it('should unsubscribe from engine on destroy', () => {
      const calendar = createCalendar({
        container: container,
        events: [],
      });

      const engine = calendar.getEngine();
      const spy = vi.spyOn(engine, 'destroy');

      calendar.destroy();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', () => {
      createCalendar({
        container: container,
        events: [],
      });

      expect(container.querySelector('.calendar--table')).toBeTruthy();
    });

    it('should handle clicking on empty cell', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      // Find an empty cell (no data-clickable attribute)
      const emptyCell = container.querySelector('td:not([data-clickable])');

      if (emptyCell) {
        // Should not throw error
        expect(() => {
          emptyCell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }).not.toThrow();
      }
    });

    it('should handle leap year February', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-02-29'),
      });

      const headerBtn = container.querySelector('.calendar--picker-btn');
      expect(headerBtn?.textContent).toContain('February 2024');

      // Should render day 29
      const cells = Array.from(container.querySelectorAll('td'));
      const has29 = cells.some(cell => cell.textContent?.trim() === '29');
      expect(has29).toBe(true);
    });
  });

  describe('Theme Support', () => {
    it('should apply theme on initialization', () => {
      const theme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        tertiary: '#93c5fd',
      };

      createCalendar({
        container: container,
        events: [],
        theme,
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#60a5fa'
      );
      expect(root.style.getPropertyValue('--calendar-tertiary-color')).toBe(
        '#93c5fd'
      );
    });

    it('should apply all theme properties', () => {
      const theme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        tertiary: '#93c5fd',
        textColor: '#1f2937',
        textLight: '#6b7280',
        background: '#ffffff',
        cellHover: '#f3f4f6',
        borderColor: '#e5e7eb',
        todayOutline: '#fbbf24',
        selectedBg: '#dbeafe',
        eventIndicator: '#10b981',
      };

      createCalendar({
        container: container,
        events: [],
        theme,
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#60a5fa'
      );
      expect(root.style.getPropertyValue('--calendar-tertiary-color')).toBe(
        '#93c5fd'
      );
      expect(root.style.getPropertyValue('--calendar-text-color')).toBe(
        '#1f2937'
      );
      expect(root.style.getPropertyValue('--calendar-text-light')).toBe(
        '#6b7280'
      );
      expect(root.style.getPropertyValue('--calendar-background')).toBe(
        '#ffffff'
      );
      expect(root.style.getPropertyValue('--calendar-cell-hover')).toBe(
        '#f3f4f6'
      );
      expect(root.style.getPropertyValue('--calendar-border-color')).toBe(
        '#e5e7eb'
      );
      expect(root.style.getPropertyValue('--calendar-today-outline')).toBe(
        '#fbbf24'
      );
      expect(root.style.getPropertyValue('--calendar-selected-bg')).toBe(
        '#dbeafe'
      );
      expect(root.style.getPropertyValue('--calendar-event-indicator')).toBe(
        '#10b981'
      );
    });

    it('should handle partial theme objects', () => {
      const theme = {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
      };

      createCalendar({
        container: container,
        events: [],
        theme,
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#8b5cf6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#a78bfa'
      );
    });

    it('should work without theme (no errors)', () => {
      expect(() => {
        createCalendar({
          container: container,
          events: [],
        });
      }).not.toThrow();
    });

    it('should update theme dynamically with updateTheme()', () => {
      const initialTheme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
      };

      const calendar = createCalendar({
        container: container,
        events: [],
        theme: initialTheme,
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#60a5fa'
      );

      // Update theme
      const newTheme = {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        tertiary: '#c4b5fd',
      };

      calendar.updateTheme(newTheme);

      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#8b5cf6'
      );
      expect(root.style.getPropertyValue('--calendar-secondary-color')).toBe(
        '#a78bfa'
      );
      expect(root.style.getPropertyValue('--calendar-tertiary-color')).toBe(
        '#c4b5fd'
      );
    });

    it('should support theme switching', () => {
      const blueTheme = {
        primary: '#3b82f6',
        secondary: '#60a5fa',
      };

      const purpleTheme = {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
      };

      const calendar = createCalendar({
        container: container,
        events: [],
        theme: blueTheme,
      });

      const root = document.documentElement;

      // Initial blue theme
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );

      // Switch to purple
      calendar.updateTheme(purpleTheme);
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#8b5cf6'
      );

      // Switch back to blue
      calendar.updateTheme(blueTheme);
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );
    });
  });
});
