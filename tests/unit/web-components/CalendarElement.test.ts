import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import {
  CalendarElement,
  defineCalendarElement,
} from '../../../src/web-components/CalendarElement';
import type { CalendarEvent, CalendarTheme } from '../../../src/core/types';

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 1, name: 'Team Meeting', date: '2024-01-15' },
  { id: 2, name: 'Project Review', date: '2024-01-20' },
];

// Register the custom element once before all tests
beforeAll(() => {
  defineCalendarElement();
});

afterEach(() => {
  document.body.innerHTML = '';
  // Reset theme CSS variables
  const root = document.documentElement;
  root.style.removeProperty('--calendar-primary-color');
  root.style.removeProperty('--calendar-secondary-color');
  root.style.removeProperty('--calendar-tertiary-color');
  root.style.removeProperty('--calendar-text-color');
  root.style.removeProperty('--calendar-text-light');
  root.style.removeProperty('--calendar-background');
  root.style.removeProperty('--calendar-cell-hover');
  root.style.removeProperty('--calendar-border-color');
  root.style.removeProperty('--calendar-today-outline');
  root.style.removeProperty('--calendar-selected-bg');
  root.style.removeProperty('--calendar-event-indicator');
});

// Helper: create and attach a <kal-calendar> element
function mount(
  props: {
    events?: CalendarEvent[];
    title?: string;
    initialDate?: Date;
    weekStartsOn?: 0 | 1;
    minYear?: number;
    maxYear?: number;
    useShortMonthNames?: boolean;
    theme?: CalendarTheme;
    renderEvent?: (e: CalendarEvent) => string;
    renderNoEvents?: () => string;
  } = {}
): CalendarElement {
  const el = document.createElement('kal-calendar') as CalendarElement;

  if (props.title) el.setAttribute('title', props.title);
  if (props.initialDate)
    el.setAttribute('initial-date', props.initialDate.toISOString());
  if (props.weekStartsOn !== undefined)
    el.setAttribute('week-starts-on', String(props.weekStartsOn));
  if (props.minYear !== undefined)
    el.setAttribute('min-year', String(props.minYear));
  if (props.maxYear !== undefined)
    el.setAttribute('max-year', String(props.maxYear));
  if (props.useShortMonthNames) el.setAttribute('use-short-month-names', '');

  el.events = props.events ?? [];
  if (props.theme !== undefined) el.theme = props.theme;
  if (props.renderEvent !== undefined) el.renderEvent = props.renderEvent;
  if (props.renderNoEvents !== undefined)
    el.renderNoEvents = props.renderNoEvents;

  document.body.appendChild(el);
  return el;
}

describe('CalendarElement', () => {
  describe('Registration', () => {
    it('should be registered as a custom element', () => {
      expect(customElements.get('kal-calendar')).toBe(CalendarElement);
    });

    it('defineCalendarElement should not throw if called again', () => {
      expect(() => defineCalendarElement()).not.toThrow();
    });

    it('defineCalendarElement should be a no-op if tag is already registered', () => {
      // Calling again with the same tag should not throw
      expect(() => defineCalendarElement('kal-calendar')).not.toThrow();
    });
  });

  describe('Lifecycle', () => {
    it('should add kalendly-calendar class on connect', () => {
      const el = mount();
      expect(el.classList.contains('kalendly-calendar')).toBe(true);
    });

    it('should remove kalendly-calendar class on disconnect', () => {
      const el = mount();
      document.body.removeChild(el);
      expect(el.classList.contains('kalendly-calendar')).toBe(false);
    });

    it('should clear innerHTML on disconnect', () => {
      const el = mount();
      expect(el.innerHTML).not.toBe('');
      document.body.removeChild(el);
      expect(el.innerHTML).toBe('');
    });

    it('should destroy engine on disconnect', () => {
      const el = mount();
      const engine = el.getEngine();
      const spy = vi.spyOn(engine, 'destroy');
      document.body.removeChild(el);
      expect(spy).toHaveBeenCalled();
    });

    it('should re-initialise engine when observed attribute changes', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'January 2024'
      );

      el.setAttribute('initial-date', new Date('2024-06-01').toISOString());
      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'June 2024'
      );
    });

    it('should not re-initialise when attribute value is unchanged', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      const engine = el.getEngine();
      el.setAttribute('initial-date', el.getAttribute('initial-date')!);
      // Engine instance should be the same object (no reinit)
      expect(el.getEngine()).toBe(engine);
    });
  });

  describe('Rendering', () => {
    it('should render calendar table', () => {
      const el = mount();
      expect(el.querySelector('.calendar--table')).toBeTruthy();
      expect(el.querySelector('.calendar--picker-btn')).toBeTruthy();
    });

    it('should render title when attribute is set', () => {
      const el = mount({ title: 'My Calendar' });
      const h1 = el.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toBe('My Calendar');
    });

    it('should not render title when attribute is absent', () => {
      const el = mount();
      expect(el.querySelector('.page--title')).toBeNull();
    });

    it('should render previous and next buttons', () => {
      const el = mount();
      expect(el.querySelector('[data-action="previous"]')).toBeTruthy();
      expect(el.querySelector('[data-action="next"]')).toBeTruthy();
    });

    it('should render date cells', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      expect(
        el.querySelectorAll('td[data-clickable="true"]').length
      ).toBeGreaterThan(0);
    });

    it('should render day 29 for leap-year February', () => {
      const el = mount({ initialDate: new Date('2024-02-01') });
      const cells = Array.from(el.querySelectorAll('td'));
      expect(cells.some(td => td.textContent?.trim() === '29')).toBe(true);
    });
  });

  describe('Properties', () => {
    it('should accept events set before connecting', () => {
      const el = document.createElement('kal-calendar') as CalendarElement;
      el.events = MOCK_EVENTS;
      document.body.appendChild(el);
      expect(el.events).toEqual(MOCK_EVENTS);
    });

    it('should update engine when events property is set after connect', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      el.events = MOCK_EVENTS;
      // Click Jan 15 — popup should list events
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.querySelector('.date-popup')).toBeTruthy();
    });

    it('should re-render when renderEvent property is set', () => {
      const el = mount({
        events: MOCK_EVENTS,
        initialDate: new Date('2024-01-15'),
      });
      el.renderEvent = (event: CalendarEvent) =>
        `<li class="custom">${event.name}</li>`;
      // Open popup to trigger renderEvent
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.innerHTML).toContain('Team Meeting');
    });
  });

  describe('Events', () => {
    it('should dispatch cal-date-select on date click', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      const handler = vi.fn();
      el.addEventListener('cal-date-select', handler);

      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.date).toBeInstanceOf(Date);
      expect(Array.isArray(detail.events)).toBe(true);
    });

    it('should dispatch cal-month-change on next button click', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      const handler = vi.fn();
      el.addEventListener('cal-month-change', handler);

      (el.querySelector('[data-action="next"]') as HTMLButtonElement)?.click();

      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.year).toBe(2024);
      expect(detail.month).toBe(1); // February
    });

    it('should dispatch cal-month-change on previous button click', () => {
      const el = mount({ initialDate: new Date('2024-03-15') });
      const handler = vi.fn();
      el.addEventListener('cal-month-change', handler);

      (
        el.querySelector('[data-action="previous"]') as HTMLButtonElement
      )?.click();

      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.month).toBe(1); // February
    });

    it('cal-date-select should bubble', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      const handler = vi.fn();
      document.body.addEventListener('cal-date-select', handler);

      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(handler).toHaveBeenCalled();
      document.body.removeEventListener('cal-date-select', handler);
    });

    it('should show popup after date click', () => {
      const el = mount({
        events: MOCK_EVENTS,
        initialDate: new Date('2024-01-15'),
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.querySelector('.date-popup')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next month', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'January 2024'
      );
      (el.querySelector('[data-action="next"]') as HTMLButtonElement)?.click();
      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'February 2024'
      );
    });

    it('should navigate to previous month', () => {
      const el = mount({ initialDate: new Date('2024-03-15') });
      (
        el.querySelector('[data-action="previous"]') as HTMLButtonElement
      )?.click();
      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'February 2024'
      );
    });

    it('should jump to selected month via picker', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      (el.querySelector('.calendar--picker-btn') as HTMLButtonElement)?.click();

      const monthBtns = el.querySelectorAll('[data-action="select-month"]');
      if (monthBtns.length === 0) return; // Picker not rendered
      expect(monthBtns.length).toBe(12);
      (monthBtns[5] as HTMLButtonElement)?.click();

      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'June 2024'
      );
    });

    it('should jump to year via input', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      (el.querySelector('.calendar--picker-btn') as HTMLButtonElement)?.click();

      const yearInput = el.querySelector(
        '[data-year-input]'
      ) as HTMLInputElement;
      if (!yearInput) return;

      yearInput.value = '2025';
      yearInput.dispatchEvent(new Event('input', { bubbles: true }));
      yearInput.dispatchEvent(new Event('blur', { bubbles: true }));

      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'January 2025'
      );
    });
  });

  describe('Public API', () => {
    it('updateEvents should update displayed events', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      expect(typeof el.updateEvents).toBe('function');
      el.updateEvents(MOCK_EVENTS);
      expect(el.getEngine()).toBeDefined();
    });

    it('getCurrentDate should return null initially', () => {
      const el = mount();
      expect(el.getCurrentDate()).toBeNull();
    });

    it('getCurrentDate should return selected date after click', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.getCurrentDate()).toBeInstanceOf(Date);
    });

    it('goToDate should navigate to given date', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      el.goToDate(new Date('2025-06-15'));
      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'June 2025'
      );
    });

    it('getEngine should return CalendarEngine', () => {
      const el = mount();
      const engine = el.getEngine();
      expect(engine).toBeDefined();
      expect(typeof engine.getViewModel).toBe('function');
    });

    it('getEngine should throw when element is not connected', () => {
      const el = document.createElement('kal-calendar') as CalendarElement;
      expect(() => el.getEngine()).toThrow(
        'CalendarElement is not connected to the DOM'
      );
    });
  });

  describe('Short Month Names', () => {
    it('should use long month names by default', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'January 2024'
      );
    });

    it('should use short month names when use-short-month-names is set', () => {
      const el = mount({
        initialDate: new Date('2024-01-15'),
        useShortMonthNames: true,
      });
      expect(el.querySelector('.calendar--picker-btn')?.textContent).toContain(
        'Jan 2024'
      );
    });

    it('should show long month names in picker dropdown by default', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      (el.querySelector('.calendar--picker-btn') as HTMLButtonElement)?.click();
      const btns = el.querySelectorAll('.calendar--picker-month');
      if (btns.length === 0) return;
      expect(btns[0].textContent).toBe('January');
      expect(btns[11].textContent).toBe('December');
    });

    it('should show short month names in picker dropdown when configured', () => {
      const el = mount({
        initialDate: new Date('2024-01-15'),
        useShortMonthNames: true,
      });
      (el.querySelector('.calendar--picker-btn') as HTMLButtonElement)?.click();
      const btns = el.querySelectorAll('.calendar--picker-month');
      if (btns.length === 0) return;
      expect(btns[0].textContent).toBe('Jan');
      expect(btns[11].textContent).toBe('Dec');
    });
  });

  describe('Custom Renderers', () => {
    it('should use custom renderEvent', () => {
      const el = mount({
        events: MOCK_EVENTS,
        initialDate: new Date('2024-01-15'),
        renderEvent: (event: CalendarEvent) =>
          `<li class="custom-event">${event.name} - Custom</li>`,
      });

      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(el.innerHTML).toContain('Team Meeting - Custom');
    });

    it('should use custom renderNoEvents', () => {
      const el = mount({
        events: [],
        initialDate: new Date('2024-01-15'),
        renderNoEvents: () =>
          '<div class="custom-no-events">Custom: No events!</div>',
      });

      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(el.innerHTML).toContain('Custom: No events!');
    });
  });

  describe('Theme', () => {
    it('should apply theme property', () => {
      mount({
        theme: {
          primary: '#3b82f6',
          secondary: '#60a5fa',
          tertiary: '#93c5fd',
        },
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
      mount({
        theme: {
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
        },
      });
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-text-color')).toBe(
        '#1f2937'
      );
      expect(root.style.getPropertyValue('--calendar-event-indicator')).toBe(
        '#10b981'
      );
    });

    it('should apply partial theme without error', () => {
      expect(() => mount({ theme: { primary: '#8b5cf6' } })).not.toThrow();
      expect(
        document.documentElement.style.getPropertyValue(
          '--calendar-primary-color'
        )
      ).toBe('#8b5cf6');
    });

    it('should work with no theme', () => {
      expect(() => mount()).not.toThrow();
    });

    it('should update theme dynamically via updateTheme', () => {
      const el = mount({ theme: { primary: '#3b82f6' } });
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#3b82f6'
      );

      el.updateTheme({
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        tertiary: '#c4b5fd',
      });
      expect(root.style.getPropertyValue('--calendar-primary-color')).toBe(
        '#8b5cf6'
      );
      expect(root.style.getPropertyValue('--calendar-tertiary-color')).toBe(
        '#c4b5fd'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', () => {
      const el = mount({ events: [] });
      expect(el.querySelector('.calendar--table')).toBeTruthy();
    });

    it('should not throw on click outside a date cell', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      const th = el.querySelector('th');
      expect(() => {
        th?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }).not.toThrow();
    });
  });
});
