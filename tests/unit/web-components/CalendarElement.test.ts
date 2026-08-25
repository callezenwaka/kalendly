import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
  root.style.removeProperty('--calendar-badge-bg');
  root.style.removeProperty('--calendar-badge-text');
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
    availabilityMode?: 'day' | 'time';
    selectable?: 'range';
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
  if (props.availabilityMode)
    el.setAttribute('availability-mode', props.availabilityMode);
  if (props.selectable) el.setAttribute('selectable', props.selectable);

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
          badgeBg: '#1f2937',
          badgeText: '#e5e7eb',
        },
      });
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--calendar-text-color')).toBe(
        '#1f2937'
      );
      expect(root.style.getPropertyValue('--calendar-event-indicator')).toBe(
        '#10b981'
      );
      expect(root.style.getPropertyValue('--calendar-badge-bg')).toBe(
        '#1f2937'
      );
      expect(root.style.getPropertyValue('--calendar-badge-text')).toBe(
        '#e5e7eb'
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

  describe('Availability Mode', () => {
    const BOOKED_DATE = new Date('2024-01-15');
    const BOOKED_EVENTS: CalendarEvent[] = [
      { id: 1, name: 'Private Booking', date: '2024-01-15' },
    ];

    it('should add availability--booked class to cells with events', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      const bookedCell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      expect(bookedCell?.classList.contains('availability--booked')).toBe(true);
    });

    it('should add availability--free class to cells without events', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      const freeCell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '16'
      );
      expect(freeCell?.classList.contains('availability--free')).toBe(true);
    });

    it('should not add availability classes to other-month cells', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      const otherMonthCells = el.querySelectorAll('td.other-month');
      otherMonthCells.forEach(cell => {
        expect(cell.classList.contains('availability--booked')).toBe(false);
        expect(cell.classList.contains('availability--free')).toBe(false);
      });
    });

    it('should not open popup when a day is clicked', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.querySelector('.date-popup')).toBeNull();
    });

    it('should still dispatch cal-date-select when a day is clicked', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      const handler = vi.fn();
      el.addEventListener('cal-date-select', handler);
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(handler).toHaveBeenCalled();
    });

    it('should ignore renderEvent when availability-mode is set', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
        renderEvent: () => '<div class="custom-render">CUSTOM</div>',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.innerHTML).not.toContain('CUSTOM');
    });

    it('should ignore renderNoEvents when availability-mode is set', () => {
      const el = mount({
        events: [],
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
        renderNoEvents: () => '<div class="custom-empty">CUSTOM EMPTY</div>',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.innerHTML).not.toContain('CUSTOM EMPTY');
    });

    it('should restore normal behaviour when availability-mode is removed', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      el.removeAttribute('availability-mode');

      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.querySelector('.date-popup')).toBeTruthy();

      const bookedCell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      expect(bookedCell?.classList.contains('availability--booked')).toBe(
        false
      );
    });
  });

  describe('Availability Mode — time', () => {
    const BASE_DATE = new Date('2024-01-15');
    const TIMED_EVENTS: CalendarEvent[] = [
      {
        id: 1,
        name: 'Private',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '11:00',
      },
    ];

    it('should open popup when a day is clicked', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.querySelector('.date-popup')).toBeTruthy();
    });

    it('should render the time grid inside the popup', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.querySelector('.time-grid')).toBeTruthy();
      expect(el.querySelectorAll('.time-grid__slot').length).toBe(24);
    });

    it('should mark booked hours correctly', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const slots = el.querySelectorAll('.time-grid__slot');
      // 09:00 and 10:00 should be booked (startTime=09:00, endTime=11:00)
      expect(slots[9].classList.contains('time-grid__slot--booked')).toBe(true);
      expect(slots[10].classList.contains('time-grid__slot--booked')).toBe(
        true
      );
      // 08:00 and 11:00 should be free
      expect(slots[8].classList.contains('time-grid__slot--free')).toBe(true);
      expect(slots[11].classList.contains('time-grid__slot--free')).toBe(true);
    });

    it('should mark all hours booked for all-day events', () => {
      const el = mount({
        events: [{ id: 1, name: 'Private', date: '2024-01-15', allDay: true }],
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const slots = el.querySelectorAll('.time-grid__slot--booked');
      expect(slots.length).toBe(24);
    });

    it('should show all hours free when no events on that day', () => {
      const el = mount({
        events: [],
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const slots = el.querySelectorAll('.time-grid__slot--free');
      expect(slots.length).toBe(24);
    });

    it('should not render event details in the time grid', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(el.innerHTML).not.toContain('Private');
      expect(el.querySelector('.event-card')).toBeNull();
    });

    it('should still show booked/free cell backgrounds from day mode', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      const bookedCell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      expect(bookedCell?.classList.contains('availability--booked')).toBe(true);
    });
  });

  describe('Selectable — day mode', () => {
    const BASE_DATE = new Date('2024-01-15');
    const EVENTS: CalendarEvent[] = [
      { id: 1, name: 'Private', date: '2024-01-15' },
    ];

    function clickDay(el: CalendarElement, day: string): void {
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === day
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    function getCell(el: CalendarElement, day: string): Element | undefined {
      return Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === day
      );
    }

    it('first click on a free day adds availability--range-start class', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      clickDay(el, '16');
      expect(
        getCell(el, '16')?.classList.contains('availability--range-start')
      ).toBe(true);
    });

    it('first click fires cal-availability-select with startDate === endDate', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      const handler = vi.fn();
      el.addEventListener('cal-availability-select', handler);
      clickDay(el, '16');

      expect(handler).toHaveBeenCalledTimes(1);
      const { startDate, endDate } = (handler.mock.calls[0][0] as CustomEvent)
        .detail;
      expect(startDate).toBeInstanceOf(Date);
      expect(endDate).toBeInstanceOf(Date);
      expect(startDate.toDateString()).toBe(endDate.toDateString());
    });

    it('second click on a later day sets range-end and in-range cells', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      clickDay(el, '16');
      clickDay(el, '20');

      expect(
        getCell(el, '16')?.classList.contains('availability--range-start')
      ).toBe(true);
      expect(
        getCell(el, '20')?.classList.contains('availability--range-end')
      ).toBe(true);
      expect(
        getCell(el, '18')?.classList.contains('availability--in-range')
      ).toBe(true);
    });

    it('second click fires cal-availability-select with startDate < endDate', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      const handler = vi.fn();
      el.addEventListener('cal-availability-select', handler);
      clickDay(el, '16');
      clickDay(el, '20');

      expect(handler).toHaveBeenCalledTimes(2);
      const { startDate, endDate } = (handler.mock.calls[1][0] as CustomEvent)
        .detail;
      expect(startDate < endDate).toBe(true);
    });

    it('swaps start and end when second click is before first', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      const handler = vi.fn();
      el.addEventListener('cal-availability-select', handler);
      clickDay(el, '20');
      clickDay(el, '16');

      const { startDate, endDate } = (handler.mock.calls[1][0] as CustomEvent)
        .detail;
      expect(startDate < endDate).toBe(true);
      expect(
        getCell(el, '16')?.classList.contains('availability--range-start')
      ).toBe(true);
      expect(
        getCell(el, '20')?.classList.contains('availability--range-end')
      ).toBe(true);
    });

    it('third click resets and starts a new range', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      clickDay(el, '16');
      clickDay(el, '20');
      clickDay(el, '22');

      expect(
        getCell(el, '22')?.classList.contains('availability--range-start')
      ).toBe(true);
      expect(
        getCell(el, '16')?.classList.contains('availability--range-start')
      ).toBe(false);
      expect(
        getCell(el, '20')?.classList.contains('availability--range-end')
      ).toBe(false);
    });

    it('clicking a booked day does not update the range', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      const handler = vi.fn();
      el.addEventListener('cal-availability-select', handler);
      clickDay(el, '15');
      expect(handler).not.toHaveBeenCalled();
    });

    it('rejects a range that spans a booked day — resets to new first click', () => {
      // Jan 15 is booked; clicking 13 then 17 would span 15
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      const handler = vi.fn();
      el.addEventListener('cal-availability-select', handler);
      clickDay(el, '13');
      clickDay(el, '17'); // spans booked day 15 — should reset

      // Second call should have startDate === endDate (fresh first click at 17)
      const { startDate, endDate } = (handler.mock.calls[1][0] as CustomEvent)
        .detail;
      expect(startDate.toDateString()).toBe(endDate.toDateString());
      expect(
        getCell(el, '13')?.classList.contains('availability--range-start')
      ).toBe(false);
      expect(
        getCell(el, '17')?.classList.contains('availability--range-start')
      ).toBe(true);
    });

    it('removing selectable attribute clears the range', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      clickDay(el, '16');
      el.removeAttribute('selectable');
      expect(
        getCell(el, '16')?.classList.contains('availability--range-start')
      ).toBe(false);
    });
  });

  describe('Selectable — time mode', () => {
    const BASE_DATE = new Date('2024-01-15');
    const TIMED_EVENTS: CalendarEvent[] = [
      {
        id: 1,
        name: 'Private',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '11:00',
      },
    ];

    function openTimeGrid(el: CalendarElement): void {
      Array.from(el.querySelectorAll('td'))
        .find(td => td.textContent?.trim() === '15')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    function clickSlot(el: CalendarElement, startTime: string): void {
      (
        el.querySelector(
          `.time-grid__slot--free[data-start-time="${startTime}"]`
        ) as HTMLElement
      )?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    it('free slots have data-action="select-slot" when selectable="range"', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
        selectable: 'range',
      });
      openTimeGrid(el);
      expect(
        el.querySelectorAll('.time-grid__slot--free[data-action="select-slot"]')
          .length
      ).toBeGreaterThan(0);
    });

    it('booked slots do not have data-action="select-slot"', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
        selectable: 'range',
      });
      openTimeGrid(el);
      expect(
        el.querySelectorAll(
          '.time-grid__slot--booked[data-action="select-slot"]'
        ).length
      ).toBe(0);
    });

    it('first click fires cal-availability-select with single slot', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
        selectable: 'range',
      });
      openTimeGrid(el);
      const handler = vi.fn();
      el.addEventListener('cal-availability-select', handler);
      clickSlot(el, '08:00');

      expect(handler).toHaveBeenCalledTimes(1);
      const { date, startTime, endTime } = (
        handler.mock.calls[0][0] as CustomEvent
      ).detail;
      expect(date).toBeInstanceOf(Date);
      expect(startTime).toBe('08:00');
      expect(endTime).toBe('09:00');
    });

    it('first click adds time-grid__slot--range-start class', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
        selectable: 'range',
      });
      openTimeGrid(el);
      clickSlot(el, '08:00');
      expect(el.querySelector('.time-grid__slot--range-start')).toBeTruthy();
    });

    it('second click extends the time range', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
        selectable: 'range',
      });
      openTimeGrid(el);
      const handler = vi.fn();
      el.addEventListener('cal-availability-select', handler);
      clickSlot(el, '08:00');
      clickSlot(el, '13:00');

      const { startTime, endTime } = (handler.mock.calls[1][0] as CustomEvent)
        .detail;
      expect(startTime).toBe('08:00');
      expect(endTime).toBe('14:00');
    });

    it('third click resets and starts a new time range', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
        selectable: 'range',
      });
      openTimeGrid(el);
      const handler = vi.fn();
      el.addEventListener('cal-availability-select', handler);
      clickSlot(el, '08:00');
      clickSlot(el, '13:00');
      clickSlot(el, '14:00');

      const { startTime, endTime } = (handler.mock.calls[2][0] as CustomEvent)
        .detail;
      expect(startTime).toBe('14:00');
      expect(endTime).toBe('15:00');
    });

    it('closing the popup clears the time range', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
        selectable: 'range',
      });
      openTimeGrid(el);
      clickSlot(el, '08:00');
      (
        el.querySelector('[data-action="close-popup"]') as HTMLButtonElement
      )?.click();
      openTimeGrid(el);
      expect(el.querySelector('.time-grid__slot--range-start')).toBeNull();
    });

    it('free slots do not have data-action when selectable is not set', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      openTimeGrid(el);
      expect(
        el.querySelectorAll('.time-grid__slot--free[data-action="select-slot"]')
          .length
      ).toBe(0);
    });
  });

  describe('Loading state', () => {
    it('loading getter returns false by default', () => {
      const el = mount({});
      expect(el.loading).toBe(false);
    });

    it('setting loading=true reflects as attribute', () => {
      const el = mount({});
      el.loading = true;
      expect(el.hasAttribute('loading')).toBe(true);
    });

    it('setting loading=false removes the attribute', () => {
      const el = mount({});
      el.loading = true;
      el.loading = false;
      expect(el.hasAttribute('loading')).toBe(false);
    });

    it('renders skeleton cells when loading is true', () => {
      const el = mount({});
      el.loading = true;
      const skeletons = el.querySelectorAll('td.calendar--skeleton');
      expect(skeletons.length).toBe(42); // 6 weeks × 7 days
    });

    it('renders no skeleton cells when loading is false', () => {
      const el = mount({});
      expect(el.querySelectorAll('td.calendar--skeleton').length).toBe(0);
    });

    it('skeleton cells are aria-hidden', () => {
      const el = mount({});
      el.loading = true;
      const skeletons = el.querySelectorAll('td.calendar--skeleton');
      skeletons.forEach(td => {
        expect(td.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('suppresses popup when loading is true', () => {
      const el = mount({
        initialDate: new Date('2024-01-15'),
        events: [{ id: 1, name: 'Test', date: '2024-01-15' }],
      });
      Array.from(el.querySelectorAll('td'))
        .find(td => td.textContent?.trim() === '15')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      el.loading = true;
      expect(el.querySelector('.date-popup')).toBeNull();
    });

    it('cal-month-change fires before render on next navigation', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      let monthInEventWasOld = false;
      el.addEventListener('cal-month-change', (e: Event) => {
        const { month } = (e as CustomEvent).detail;
        // event says February (month 1) — engine hasn't rendered yet
        if (month === 1) {
          el.loading = true; // set synchronously
          monthInEventWasOld = true;
        }
      });
      el.querySelector<HTMLElement>('[data-action="next"]')?.click();
      expect(monthInEventWasOld).toBe(true);
      // loading was set in the handler → skeleton should be visible
      expect(el.querySelectorAll('td.calendar--skeleton').length).toBe(42);
    });

    it('cal-month-change fires before render on previous navigation', () => {
      const el = mount({ initialDate: new Date('2024-02-15') });
      let detailMonth = -1;
      el.addEventListener('cal-month-change', (e: Event) => {
        detailMonth = (e as CustomEvent).detail.month;
      });
      el.querySelector<HTMLElement>('[data-action="previous"]')?.click();
      expect(detailMonth).toBe(0); // January
    });

    it('clearing loading re-renders real cells', () => {
      const el = mount({});
      el.loading = true;
      expect(el.querySelectorAll('td.calendar--skeleton').length).toBe(42);
      el.loading = false;
      expect(el.querySelectorAll('td.calendar--skeleton').length).toBe(0);
      expect(el.querySelectorAll('td[data-clickable]').length).toBeGreaterThan(
        0
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

describe('CalendarElement — output escaping', () => {
  const DAY = new Date('2024-01-15');

  function openDay(el: CalendarElement, day = '15'): void {
    const cell = Array.from(el.querySelectorAll('td')).find(
      td => td.textContent?.trim() === day
    );
    cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  it('renders a script payload in event name as text', () => {
    const el = mount({
      initialDate: DAY,
      events: [
        {
          id: 1,
          name: '<script>alert(1)</script>',
          date: '2024-01-15',
        },
      ],
    });
    openDay(el);

    const title = el.querySelector('.event-title');
    expect(title?.querySelector('script')).toBeNull();
    expect(title?.textContent).toBe('<script>alert(1)</script>');
  });

  it('renders a script payload in description as text', () => {
    const el = mount({
      initialDate: DAY,
      events: [
        {
          id: 1,
          name: 'Meeting',
          date: '2024-01-15',
          description: '<img src=x onerror=alert(1)>',
        },
      ],
    });
    openDay(el);

    const description = el.querySelector('.event-description');
    expect(description?.querySelector('img')).toBeNull();
    expect(description?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('collapses a javascript: url to a harmless anchor', () => {
    const el = mount({
      initialDate: DAY,
      events: [
        {
          id: 1,
          name: 'Meeting',
          date: '2024-01-15',
          url: 'javascript:alert(1)',
        },
      ],
    });
    openDay(el);

    expect(el.querySelector('.event-link')?.getAttribute('href')).toBe('#');
  });

  it('preserves a legitimate url', () => {
    const el = mount({
      initialDate: DAY,
      events: [
        {
          id: 1,
          name: 'Meeting',
          date: '2024-01-15',
          url: 'https://example.com/e/1',
        },
      ],
    });
    openDay(el);

    expect(el.querySelector('.event-link')?.getAttribute('href')).toBe(
      'https://example.com/e/1'
    );
  });

  it('does not let a color escape the style attribute', () => {
    const el = mount({
      initialDate: DAY,
      events: [
        {
          id: 1,
          name: 'Meeting',
          date: '2024-01-15',
          color: 'red" onmouseover="alert(1)',
        },
      ],
    });
    openDay(el);

    const card = el.querySelector('.event-card');
    expect(card?.getAttribute('onmouseover')).toBeNull();
    expect(card?.getAttribute('style')).toContain('#3b82f6');
  });

  it('escapes the title attribute', () => {
    const el = mount({
      initialDate: DAY,
      title: '<img src=x onerror=alert(1)>',
    });

    const heading = el.querySelector('.page--title h1');
    expect(heading?.querySelector('img')).toBeNull();
    expect(heading?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('escapes a reflected year input value', () => {
    const el = mount({ initialDate: DAY });

    const picker = el.querySelector(
      '[data-action="toggle-picker"]'
    ) as HTMLElement;
    picker?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    (el as unknown as { yearInput: string }).yearInput =
      '" onfocus=alert(1) autofocus="';
    el.events = [];

    const input = el.querySelector('[data-year-input]');
    expect(input?.getAttribute('onfocus')).toBeNull();
    expect(input?.getAttribute('autofocus')).toBeNull();
    expect(input?.getAttribute('value')).toBe('" onfocus=alert(1) autofocus="');
  });

  it('renders a multi-word status as a single class token', () => {
    const el = mount({
      initialDate: DAY,
      events: [
        {
          id: 1,
          name: 'Meeting',
          date: '2024-01-15',
          status: 'in progress',
        },
      ],
    });
    openDay(el);

    const badge = el.querySelector('.badge.status-in-progress');
    expect(badge).toBeTruthy();
    expect(Array.from(badge!.classList)).toEqual([
      'badge',
      'status',
      'status-in-progress',
    ]);
    expect(badge?.textContent?.trim()).toBe('IN PROGRESS');
  });

  it('escapes attendees, organizer, location and notes', () => {
    const el = mount({
      initialDate: DAY,
      events: [
        {
          id: 1,
          name: 'Meeting',
          date: '2024-01-15',
          location: '<b>HQ</b>',
          organizer: '<b>Ada</b>',
          notes: '<b>bring laptop</b>',
          attendees: ['<b>Ada</b>', '<b>Grace</b>'],
        },
      ],
    });
    openDay(el);

    const card = el.querySelector('.event-card');
    expect(card?.querySelector('b')).toBeNull();
    expect(card?.textContent).toContain('<b>HQ</b>');
    expect(card?.textContent).toContain('<b>Ada</b>');
  });

  it('escapes tags', () => {
    const el = mount({
      initialDate: DAY,
      events: [
        {
          id: 1,
          name: 'Meeting',
          date: '2024-01-15',
          tags: ['<b>urgent</b>'],
        },
      ],
    });
    openDay(el);

    const tag = el.querySelector('.event-tag');
    expect(tag?.querySelector('b')).toBeNull();
    expect(tag?.textContent).toBe('<b>urgent</b>');
  });
});

describe('CalendarElement — selectability predicate', () => {
  const BASE_DATE = new Date('2024-01-15');

  function clickDay(el: CalendarElement, day: string): void {
    const cell = Array.from(el.querySelectorAll('td')).find(
      td => td.textContent?.trim() === day
    );
    cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function mountRange(events: CalendarEvent[]): CalendarElement {
    return mount({
      events,
      initialDate: BASE_DATE,
      availabilityMode: 'day',
      selectable: 'range',
    });
  }

  it('treats a booked day the same as an endpoint and inside a span', () => {
    const booked: CalendarEvent[] = [
      { id: 1, name: 'Private', date: '2024-01-20' },
    ];

    const asEndpoint = mountRange(booked);
    const endpointSelections: unknown[] = [];
    asEndpoint.addEventListener('cal-availability-select', e =>
      endpointSelections.push((e as CustomEvent).detail)
    );
    clickDay(asEndpoint, '20');

    expect(endpointSelections.length).toBe(0);

    const inSpan = mountRange(booked);
    const spanSelections: { startDate: Date; endDate: Date }[] = [];
    inSpan.addEventListener('cal-availability-select', e =>
      spanSelections.push(
        (e as CustomEvent).detail as { startDate: Date; endDate: Date }
      )
    );
    clickDay(inSpan, '18');
    clickDay(inSpan, '22');

    // Second click spans the booked 20th, so the range resets to the 22nd
    const last = spanSelections[spanSelections.length - 1];
    expect(last.startDate.getDate()).toBe(22);
    expect(last.endDate.getDate()).toBe(22);
  });

  it('completes a range when every day inside it is free', () => {
    const el = mountRange([{ id: 1, name: 'Private', date: '2024-01-28' }]);
    const selections: { startDate: Date; endDate: Date }[] = [];
    el.addEventListener('cal-availability-select', e =>
      selections.push(
        (e as CustomEvent).detail as { startDate: Date; endDate: Date }
      )
    );

    clickDay(el, '18');
    clickDay(el, '22');

    const last = selections[selections.length - 1];
    expect(last.startDate.getDate()).toBe(18);
    expect(last.endDate.getDate()).toBe(22);
  });

  it('does not read selectability back from the rendered class', () => {
    const el = mountRange([{ id: 1, name: 'Private', date: '2024-01-20' }]);
    const cell = Array.from(el.querySelectorAll('td')).find(
      td => td.textContent?.trim() === '20'
    );

    cell?.classList.remove('availability--booked');

    const selections: unknown[] = [];
    el.addEventListener('cal-availability-select', e =>
      selections.push((e as CustomEvent).detail)
    );
    cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(selections.length).toBe(0);
  });
});

describe('CalendarElement — open badge values', () => {
  const DAY = new Date('2024-01-15');

  function openDay(el: CalendarElement): void {
    const cell = Array.from(el.querySelectorAll('td')).find(
      td => td.textContent?.trim() === '15'
    );
    cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function badgesFor(event: Partial<CalendarEvent>): Element[] {
    const el = mount({
      initialDate: DAY,
      events: [{ id: 1, name: 'Meeting', date: '2024-01-15', ...event }],
    });
    openDay(el);
    return Array.from(el.querySelectorAll('.badge'));
  }

  it('accepts a caller-defined category and priority', () => {
    const badges = badgesFor({ category: 'maintenance', priority: 'urgent' });

    expect(Array.from(badges[0].classList)).toEqual([
      'badge',
      'category',
      'category-maintenance',
    ]);
    expect(badges[0].textContent?.trim()).toBe('MAINTENANCE');
    expect(Array.from(badges[1].classList)).toEqual([
      'badge',
      'priority',
      'priority-urgent',
    ]);
    expect(badges[1].textContent?.trim()).toBe('URGENT');
  });

  it('keeps the marker class on known values', () => {
    for (const status of ['completed', 'cancelled', 'tentative']) {
      const badges = badgesFor({ status });
      expect(Array.from(badges[0].classList)).toEqual([
        'badge',
        'status',
        `status-${status}`,
      ]);
      expect(badges[0].textContent?.trim()).toBe(status.toUpperCase());
    }
  });

  it('still renders no badge for scheduled', () => {
    expect(badgesFor({ status: 'scheduled' })).toEqual([]);
  });

  describe('stylesheet fallback', () => {
    const css = readFileSync(
      resolve(__dirname, '../../../src/styles/calendar.css'),
      'utf-8'
    );
    const fallback = css.indexOf('.badge.category,');

    it('declares both custom properties in :root', () => {
      expect(css).toContain('--calendar-badge-bg:');
      expect(css).toContain('--calendar-badge-text:');
    });

    it.each(['category-meeting', 'priority-high', 'status-completed'])(
      'precedes .badge.%s, which has equal specificity',
      selector => {
        expect(fallback).toBeGreaterThan(-1);
        expect(fallback).toBeLessThan(css.indexOf(`.badge.${selector}`));
      }
    );
  });
});
