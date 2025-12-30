import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCalendar, VanillaCalendar } from '../../../src/vanilla/Calendar';
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
      expect(container.querySelector('.calendar--card--header')).toBeTruthy();
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

    it('should render month and year selects', () => {
      createCalendar({
        container: container,
        events: [],
      });

      const monthSelect = container.querySelector('[data-month-select]');
      const yearSelect = container.querySelector('[data-year-select]');

      expect(monthSelect).toBeTruthy();
      expect(yearSelect).toBeTruthy();
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

      const header = container.querySelector('.calendar--card--header');
      expect(header?.textContent).toContain('Jan 2024');

      const nextBtn = container.querySelector(
        '[data-action="next"]'
      ) as HTMLButtonElement;
      nextBtn?.click();

      // Re-check after click
      const updatedHeader = container.querySelector('.calendar--card--header');
      expect(updatedHeader?.textContent).toContain('Feb 2024');
    });

    it('should navigate to previous month', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-03-15'),
      });

      const header = container.querySelector('.calendar--card--header');
      expect(header?.textContent).toContain('Mar 2024');

      const prevBtn = container.querySelector(
        '[data-action="previous"]'
      ) as HTMLButtonElement;
      prevBtn?.click();

      const updatedHeader = container.querySelector('.calendar--card--header');
      expect(updatedHeader?.textContent).toContain('Feb 2024');
    });

    it('should jump to selected month', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      const monthSelect = container.querySelector(
        '[data-month-select]'
      ) as HTMLSelectElement;
      monthSelect.value = '5'; // June
      monthSelect.dispatchEvent(new Event('change'));

      const header = container.querySelector('.calendar--card--header');
      expect(header?.textContent).toContain('Jun 2024');
    });

    it('should jump to selected year', () => {
      createCalendar({
        container: container,
        events: [],
        initialDate: new Date('2024-01-15'),
      });

      const yearSelect = container.querySelector(
        '[data-year-select]'
      ) as HTMLSelectElement;
      yearSelect.value = '2025';
      yearSelect.dispatchEvent(new Event('change'));

      const header = container.querySelector('.calendar--card--header');
      expect(header?.textContent).toContain('Jan 2025');
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

      const header = container.querySelector('.calendar--card--header');
      expect(header?.textContent).toContain('Jun 2025');
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
      const calendar = createCalendar({
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

      const header = container.querySelector('.calendar--card--header');
      expect(header?.textContent).toContain('Feb 2024');

      // Should render day 29
      const cells = Array.from(container.querySelectorAll('td'));
      const has29 = cells.some(cell => cell.textContent?.trim() === '29');
      expect(has29).toBe(true);
    });
  });
});
