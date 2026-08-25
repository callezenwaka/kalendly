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
  for (const property of Array.from(root.style)) {
    if (property.startsWith('--calendar-')) root.style.removeProperty(property);
  }
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
    availabilityColors?: Record<string, string>;
    selectableStatuses?: string[];
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
  if (props.availabilityColors !== undefined)
    el.availabilityColors = props.availabilityColors;
  if (props.selectableStatuses !== undefined)
    el.selectableStatuses = props.selectableStatuses;
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
      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
        'January 2024'
      );

      el.setAttribute('initial-date', new Date('2024-06-01').toISOString());
      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
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
      expect(el.querySelector('.calendar-table')).toBeTruthy();
      expect(el.querySelector('.calendar-picker-btn')).toBeTruthy();
    });

    it('should render title when attribute is set', () => {
      const el = mount({ title: 'My Calendar' });
      const h1 = el.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toBe('My Calendar');
    });

    it('should not render title when attribute is absent', () => {
      const el = mount();
      expect(el.querySelector('.calendar-title')).toBeNull();
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
      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
        'January 2024'
      );
      (el.querySelector('[data-action="next"]') as HTMLButtonElement)?.click();
      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
        'February 2024'
      );
    });

    it('should navigate to previous month', () => {
      const el = mount({ initialDate: new Date('2024-03-15') });
      (
        el.querySelector('[data-action="previous"]') as HTMLButtonElement
      )?.click();
      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
        'February 2024'
      );
    });

    it('should jump to selected month via picker', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      (el.querySelector('.calendar-picker-btn') as HTMLButtonElement)?.click();

      const monthBtns = el.querySelectorAll('[data-action="select-month"]');
      if (monthBtns.length === 0) return; // Picker not rendered
      expect(monthBtns.length).toBe(12);
      (monthBtns[5] as HTMLButtonElement)?.click();

      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
        'June 2024'
      );
    });

    it('should jump to year via input', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      (el.querySelector('.calendar-picker-btn') as HTMLButtonElement)?.click();

      const yearInput = el.querySelector(
        '[data-year-input]'
      ) as HTMLInputElement;
      if (!yearInput) return;

      yearInput.value = '2025';
      yearInput.dispatchEvent(new Event('input', { bubbles: true }));
      yearInput.dispatchEvent(new Event('blur', { bubbles: true }));

      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
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
      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
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
      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
        'January 2024'
      );
    });

    it('should use short month names when use-short-month-names is set', () => {
      const el = mount({
        initialDate: new Date('2024-01-15'),
        useShortMonthNames: true,
      });
      expect(el.querySelector('.calendar-picker-btn')?.textContent).toContain(
        'Jan 2024'
      );
    });

    it('should show long month names in picker dropdown by default', () => {
      const el = mount({ initialDate: new Date('2024-01-15') });
      (el.querySelector('.calendar-picker-btn') as HTMLButtonElement)?.click();
      const btns = el.querySelectorAll('.calendar-picker-month');
      if (btns.length === 0) return;
      expect(btns[0].textContent).toBe('January');
      expect(btns[11].textContent).toBe('December');
    });

    it('should show short month names in picker dropdown when configured', () => {
      const el = mount({
        initialDate: new Date('2024-01-15'),
        useShortMonthNames: true,
      });
      (el.querySelector('.calendar-picker-btn') as HTMLButtonElement)?.click();
      const btns = el.querySelectorAll('.calendar-picker-month');
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
      {
        id: 1,
        name: 'Private Booking',
        date: '2024-01-15',
        availabilityStatus: 'blocked',
      },
    ];

    it('should add availability-blocked class to cells with events', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      const bookedCell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      expect(bookedCell?.classList.contains('availability-blocked')).toBe(true);
    });

    it('should add availability-open class to cells without events', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      const freeCell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '16'
      );
      expect(freeCell?.classList.contains('availability-open')).toBe(true);
    });

    it('should not add availability classes to calendar-cell-other-month cells', () => {
      const el = mount({
        events: BOOKED_EVENTS,
        initialDate: BOOKED_DATE,
        availabilityMode: 'day',
      });
      const otherMonthCells = el.querySelectorAll(
        'td.calendar-cell-other-month'
      );
      otherMonthCells.forEach(cell => {
        expect(cell.classList.contains('availability-blocked')).toBe(false);
        expect(cell.classList.contains('availability-open')).toBe(false);
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
      expect(bookedCell?.classList.contains('availability-blocked')).toBe(
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
        availabilityStatus: 'blocked',
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
      expect(el.querySelectorAll('.time-grid-slot').length).toBe(24);
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
      const slots = el.querySelectorAll('.time-grid-slot');
      // 09:00 and 10:00 should be booked (startTime=09:00, endTime=11:00)
      expect(slots[9].classList.contains('time-grid-slot-blocked')).toBe(true);
      expect(slots[10].classList.contains('time-grid-slot-blocked')).toBe(true);
      // 08:00 and 11:00 should be free
      expect(slots[8].classList.contains('time-grid-slot-open')).toBe(true);
      expect(slots[11].classList.contains('time-grid-slot-open')).toBe(true);
    });

    it('should mark all hours booked for all-day events', () => {
      const el = mount({
        events: [
          {
            id: 1,
            name: 'Private',
            date: '2024-01-15',
            allDay: true,
            availabilityStatus: 'blocked',
          },
        ],
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      const cell = Array.from(el.querySelectorAll('td')).find(
        td => td.textContent?.trim() === '15'
      );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const slots = el.querySelectorAll('.time-grid-slot-blocked');
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
      const slots = el.querySelectorAll('.time-grid-slot-open');
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
      expect(bookedCell?.classList.contains('availability-blocked')).toBe(true);
    });
  });

  describe('Selectable — day mode', () => {
    const BASE_DATE = new Date('2024-01-15');
    const EVENTS: CalendarEvent[] = [
      {
        id: 1,
        name: 'Private',
        date: '2024-01-15',
        availabilityStatus: 'blocked',
      },
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

    it('first click on a free day adds availability-range-start class', () => {
      const el = mount({
        events: EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'day',
        selectable: 'range',
      });
      clickDay(el, '16');
      expect(
        getCell(el, '16')?.classList.contains('availability-range-start')
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
        getCell(el, '16')?.classList.contains('availability-range-start')
      ).toBe(true);
      expect(
        getCell(el, '20')?.classList.contains('availability-range-end')
      ).toBe(true);
      expect(
        getCell(el, '18')?.classList.contains('availability-in-range')
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
        getCell(el, '16')?.classList.contains('availability-range-start')
      ).toBe(true);
      expect(
        getCell(el, '20')?.classList.contains('availability-range-end')
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
        getCell(el, '22')?.classList.contains('availability-range-start')
      ).toBe(true);
      expect(
        getCell(el, '16')?.classList.contains('availability-range-start')
      ).toBe(false);
      expect(
        getCell(el, '20')?.classList.contains('availability-range-end')
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
        getCell(el, '13')?.classList.contains('availability-range-start')
      ).toBe(false);
      expect(
        getCell(el, '17')?.classList.contains('availability-range-start')
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
        getCell(el, '16')?.classList.contains('availability-range-start')
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
        availabilityStatus: 'blocked',
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
          `.time-grid-slot-open[data-start-time="${startTime}"]`
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
        el.querySelectorAll('.time-grid-slot-open[data-action="select-slot"]')
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
          '.time-grid-slot-blocked[data-action="select-slot"]'
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

    it('first click adds time-grid-slot-range-start class', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
        selectable: 'range',
      });
      openTimeGrid(el);
      clickSlot(el, '08:00');
      expect(el.querySelector('.time-grid-slot-range-start')).toBeTruthy();
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
      expect(el.querySelector('.time-grid-slot-range-start')).toBeNull();
    });

    it('free slots do not have data-action when selectable is not set', () => {
      const el = mount({
        events: TIMED_EVENTS,
        initialDate: BASE_DATE,
        availabilityMode: 'time',
      });
      openTimeGrid(el);
      expect(
        el.querySelectorAll('.time-grid-slot-open[data-action="select-slot"]')
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
      const skeletons = el.querySelectorAll('td.calendar-skeleton');
      expect(skeletons.length).toBe(42); // 6 weeks × 7 days
    });

    it('renders no skeleton cells when loading is false', () => {
      const el = mount({});
      expect(el.querySelectorAll('td.calendar-skeleton').length).toBe(0);
    });

    it('skeleton cells are aria-hidden', () => {
      const el = mount({});
      el.loading = true;
      const skeletons = el.querySelectorAll('td.calendar-skeleton');
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
      expect(el.querySelectorAll('td.calendar-skeleton').length).toBe(42);
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
      expect(el.querySelectorAll('td.calendar-skeleton').length).toBe(42);
      el.loading = false;
      expect(el.querySelectorAll('td.calendar-skeleton').length).toBe(0);
      expect(el.querySelectorAll('td[data-clickable]').length).toBeGreaterThan(
        0
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty events array', () => {
      const el = mount({ events: [] });
      expect(el.querySelector('.calendar-table')).toBeTruthy();
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

    const heading = el.querySelector('.calendar-title h1');
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
      {
        id: 1,
        name: 'Private',
        date: '2024-01-20',
        availabilityStatus: 'blocked',
      },
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
    const el = mountRange([
      {
        id: 1,
        name: 'Private',
        date: '2024-01-28',
        availabilityStatus: 'blocked',
      },
    ]);
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
    const el = mountRange([
      {
        id: 1,
        name: 'Private',
        date: '2024-01-20',
        availabilityStatus: 'blocked',
      },
    ]);
    const cell = Array.from(el.querySelectorAll('td')).find(
      td => td.textContent?.trim() === '20'
    );

    cell?.classList.remove('availability-blocked');

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

describe('CalendarElement — design tokens', () => {
  const FULL_THEME: Required<CalendarTheme> = {
    primary: '#101010',
    secondary: '#101011',
    tertiary: '#101012',
    textColor: '#101013',
    textLight: '#101014',
    background: '#101015',
    cellHover: '#101016',
    borderColor: '#101017',
    todayOutline: '#101018',
    selectedBg: '#101019',
    headerBg: '#10101a',
    popupBg: '#10101b',
    pickerBg: '#10101c',
    pickerShadow: '0 0 0 #10101d',
    eventIndicator: '#10101e',
    onAccent: '#10101f',
    link: '#101020',
    openBg: '#101021',
    openFg: '#101022',
    conditionalBg: '#101023',
    conditionalFg: '#101024',
    blockedBg: '#101025',
    blockedFg: '#101026',
    rangeBg: '#101027',
    rangeOutline: '#101028',
    inRangeBg: '#101029',
    inRangeOutline: '#10102a',
    badgeBg: '#10102b',
    badgeText: '#10102c',
    badgeSuccessBg: '#10102d',
    badgeSuccessText: '#10102e',
    badgeInfoBg: '#10102f',
    badgeInfoText: '#101030',
    badgeWarningBg: '#101031',
    badgeWarningText: '#101032',
    badgeDangerBg: '#101033',
    badgeDangerText: '#101034',
    badgeNeutralBg: '#101035',
    badgeNeutralText: '#101036',
    badgePositiveBg: '#101037',
    badgePositiveText: '#101038',
    badgeTentativeBg: '#101039',
    badgeTentativeText: '#10103a',
  };

  it('writes one CSS variable per theme key', () => {
    mount({ theme: FULL_THEME });

    const written = Array.from(document.documentElement.style).filter(p =>
      p.startsWith('--calendar-')
    );
    expect(written.length).toBe(Object.keys(FULL_THEME).length);
  });

  it('writes distinct values, so no two keys share a variable', () => {
    mount({ theme: FULL_THEME });

    const root = document.documentElement;
    const values = Array.from(root.style)
      .filter(p => p.startsWith('--calendar-'))
      .map(p => root.style.getPropertyValue(p));
    expect(new Set(values).size).toBe(values.length);
  });

  describe('stylesheet', () => {
    const css = readFileSync(
      resolve(__dirname, '../../../src/styles/calendar.css'),
      'utf-8'
    );
    const [root, body] = css.split('}\n');

    it('declares no colour literal outside :root', () => {
      expect(body.match(/#[0-9a-fA-F]{3,8}/g)).toBeNull();
    });

    it('resolves every var() reference to a declared token', () => {
      const declared = new Set(
        Array.from(root.matchAll(/(--[\w-]+):/g), m => m[1])
      );
      const referenced = new Set(
        Array.from(css.matchAll(/var\((--[\w-]+)\)/g), m => m[1])
      );
      const missing = [...referenced].filter(t => !declared.has(t));
      expect(missing).toEqual([]);
    });
  });
});

describe('CalendarElement — multi-state availability', () => {
  const BASE = new Date('2024-01-15');

  function cell(el: CalendarElement, day: string): HTMLElement | undefined {
    return Array.from(el.querySelectorAll('td')).find(
      td => td.textContent?.trim() === day
    ) as HTMLElement | undefined;
  }

  function mountDay(
    events: CalendarEvent[],
    extra: {
      availabilityColors?: Record<string, string>;
      selectableStatuses?: string[];
    } = {}
  ): CalendarElement {
    return mount({
      events,
      initialDate: BASE,
      availabilityMode: 'day',
      selectable: 'range',
      ...extra,
    });
  }

  it('renders declared buckets with no configuration beyond the status', () => {
    const el = mountDay([
      {
        id: 1,
        name: 'Private',
        date: '2024-01-20',
        availabilityStatus: 'blocked',
      },
    ]);

    expect(cell(el, '20')?.classList.contains('availability-blocked')).toBe(
      true
    );
    expect(cell(el, '21')?.classList.contains('availability-open')).toBe(true);
    expect(cell(el, '20')?.getAttribute('style')).toBeNull();
  });

  function mountedThen(update: (el: CalendarElement) => void): () => void {
    const el = mountDay([
      {
        id: 1,
        name: 'seed',
        date: '2024-01-20',
        availabilityStatus: 'blocked',
      },
    ]);
    return () => update(el);
  }

  it('throws when an event omits availabilityStatus', () => {
    expect(
      mountedThen(el => {
        el.events = [{ id: 7, name: 'Private', date: '2024-01-20' }];
      })
    ).toThrow(/requires availabilityStatus on every event.*7/s);
  });

  it('names every offending event, not just the first', () => {
    expect(
      mountedThen(el => {
        el.events = [
          { id: 7, name: 'a', date: '2024-01-20' },
          { id: 9, name: 'b', date: '2024-01-21' },
        ];
      })
    ).toThrow(/7, 9/);
  });

  it('throws when availabilityStatus names no known bucket', () => {
    expect(
      mountedThen(el => {
        el.events = [
          {
            id: 3,
            name: 'a',
            date: '2024-01-20',
            availabilityStatus: 'maintenance',
          },
        ];
      })
    ).toThrow(/Unrecognised on: 3 \(maintenance\)/);
  });

  it('accepts a bucket once availabilityColors declares it', () => {
    const el = mountDay(
      [
        {
          id: 3,
          name: 'a',
          date: '2024-01-20',
          availabilityStatus: 'maintenance',
        },
      ],
      { availabilityColors: { maintenance: '#0891b2' } }
    );

    expect(cell(el, '20')?.classList.contains('availability-maintenance')).toBe(
      true
    );
  });

  it('does not validate outside availability mode', () => {
    expect(() =>
      mount({
        events: [{ id: 1, name: 'a', date: '2024-01-20' }],
        initialDate: BASE,
      })
    ).not.toThrow();
  });

  it('renders the three built-in buckets without a colour map', () => {
    const el = mountDay([
      { id: 1, name: 'a', date: '2024-01-18', availabilityStatus: 'open' },
      {
        id: 2,
        name: 'b',
        date: '2024-01-19',
        availabilityStatus: 'conditional',
      },
      { id: 3, name: 'c', date: '2024-01-20', availabilityStatus: 'blocked' },
    ]);

    expect(cell(el, '18')?.classList.contains('availability-open')).toBe(true);
    expect(cell(el, '19')?.classList.contains('availability-conditional')).toBe(
      true
    );
    expect(cell(el, '20')?.classList.contains('availability-blocked')).toBe(
      true
    );
    // built-ins paint from CSS variables, so no inline style
    expect(cell(el, '19')?.getAttribute('style')).toBeNull();
  });

  it('gives caller-defined buckets an inline colour', () => {
    const el = mountDay(
      [
        {
          id: 1,
          name: 'a',
          date: '2024-01-20',
          availabilityStatus: 'maintenance',
        },
      ],
      { availabilityColors: { maintenance: '#0891b2' } }
    );

    const td = cell(el, '20');
    expect(td?.classList.contains('availability-maintenance')).toBe(true);
    expect(td?.classList.contains('availability-status')).toBe(true);
    expect(td?.style.getPropertyValue('--availability-color')).toBe('#0891b2');
  });

  it('overrides a built-in colour without losing the others', () => {
    const el = mountDay(
      [
        {
          id: 1,
          name: 'a',
          date: '2024-01-19',
          availabilityStatus: 'conditional',
        },
        { id: 2, name: 'b', date: '2024-01-20', availabilityStatus: 'blocked' },
      ],
      { availabilityColors: { conditional: '#7c3aed' } }
    );

    expect(cell(el, '19')?.style.getPropertyValue('--availability-color')).toBe(
      '#7c3aed'
    );
    expect(cell(el, '20')?.getAttribute('style')).toBeNull();
  });

  it('resolves built-in collisions by severity, not declaration order', () => {
    const el = mountDay([
      { id: 1, name: 'a', date: '2024-01-20', availabilityStatus: 'open' },
      {
        id: 2,
        name: 'b',
        date: '2024-01-20',
        availabilityStatus: 'conditional',
      },
      { id: 3, name: 'c', date: '2024-01-20', availabilityStatus: 'blocked' },
    ]);

    expect(cell(el, '20')?.classList.contains('availability-blocked')).toBe(
      true
    );
  });

  it('resolves caller-defined collisions by colour-map key order', () => {
    const events: CalendarEvent[] = [
      { id: 1, name: 'a', date: '2024-01-20', availabilityStatus: 'cleaning' },
      {
        id: 2,
        name: 'b',
        date: '2024-01-20',
        availabilityStatus: 'maintenance',
      },
    ];

    const first = mountDay(events, {
      availabilityColors: { maintenance: '#111111', cleaning: '#222222' },
    });
    expect(
      cell(first, '20')?.classList.contains('availability-maintenance')
    ).toBe(true);

    const second = mountDay(events, {
      availabilityColors: { cleaning: '#222222', maintenance: '#111111' },
    });
    expect(
      cell(second, '20')?.classList.contains('availability-cleaning')
    ).toBe(true);
  });

  it('marks unselectable days and labels every cell', () => {
    const el = mountDay([
      {
        id: 1,
        name: 'a',
        date: '2024-01-20',
        availabilityStatus: 'conditional',
      },
    ]);

    expect(
      cell(el, '20')?.classList.contains('availability-unselectable')
    ).toBe(true);
    expect(cell(el, '20')?.getAttribute('aria-label')).toBe('conditional');
    expect(cell(el, '21')?.getAttribute('aria-label')).toBe('open');
    expect(
      cell(el, '21')?.classList.contains('availability-unselectable')
    ).toBe(false);
  });

  it('lets selectableStatuses reopen a claimed bucket for selection', () => {
    const el = mountDay(
      [
        {
          id: 1,
          name: 'a',
          date: '2024-01-20',
          availabilityStatus: 'conditional',
        },
        { id: 2, name: 'b', date: '2024-01-22', availabilityStatus: 'blocked' },
      ],
      { selectableStatuses: ['open', 'conditional'] }
    );

    const selections: { startDate: Date; endDate: Date }[] = [];
    el.addEventListener('cal-availability-select', e =>
      selections.push(
        (e as CustomEvent).detail as { startDate: Date; endDate: Date }
      )
    );

    cell(el, '20')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(selections.length).toBe(1);

    cell(el, '22')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(selections.length).toBe(1);
  });

  it('gates endpoints and spans through the same predicate', () => {
    const el = mountDay(
      [{ id: 1, name: 'a', date: '2024-01-20', availabilityStatus: 'blocked' }],
      { selectableStatuses: ['open'] }
    );

    const selections: { startDate: Date; endDate: Date }[] = [];
    el.addEventListener('cal-availability-select', e =>
      selections.push(
        (e as CustomEvent).detail as { startDate: Date; endDate: Date }
      )
    );

    cell(el, '18')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    cell(el, '22')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const last = selections[selections.length - 1];
    expect(last.startDate.getDate()).toBe(22);
    expect(last.endDate.getDate()).toBe(22);
  });

  it('does not let an injected bucket name escape the markup', () => {
    const el = mountDay(
      [
        {
          id: 1,
          name: 'a',
          date: '2024-01-20',
          availabilityStatus: 'a" onmouseover="alert(1)',
        },
      ],
      { availabilityColors: { 'a" onmouseover="alert(1)': 'red" onload="x' } }
    );

    const td = cell(el, '20');
    expect(td?.getAttribute('onmouseover')).toBeNull();
    expect(td?.getAttribute('onload')).toBeNull();
    expect(td?.className).toContain('availability-a-onmouseover-alert-1');
    expect(td?.style.getPropertyValue('--availability-color')).toBe('#3b82f6');
  });
});

describe('CalendarElement — availability validation timing', () => {
  const BASE = new Date('2024-01-15');

  function configure(): CalendarElement {
    const el = document.createElement('kal-calendar') as CalendarElement;
    el.setAttribute('availability-mode', 'day');
    el.setAttribute('initial-date', BASE.toISOString());
    return el;
  }

  function captureReactionError(run: () => void): Error {
    const captured: Error[] = [];
    const capture = (e: ErrorEvent) => {
      captured.push(e.error ?? new Error(e.message));
      e.preventDefault();
    };

    window.addEventListener('error', capture);
    try {
      run();
    } catch (thrown) {
      captured.push(thrown as Error);
    } finally {
      window.removeEventListener('error', capture);
    }

    expect(captured).toHaveLength(1);
    return captured[0];
  }

  it('throws before the element is ever connected', () => {
    const el = configure();

    expect(() => {
      el.events = [{ id: 7, name: 'a', date: '2024-01-20' }];
    }).toThrow(/Missing on: 7/);

    expect(el.isConnected).toBe(false);
  });

  it('stores the failure when availability-mode is applied to events already set', () => {
    const el = document.createElement('kal-calendar') as CalendarElement;
    el.events = [{ id: 7, name: 'a', date: '2024-01-20' }];
    document.body.appendChild(el);

    const reported = captureReactionError(() =>
      el.setAttribute('availability-mode', 'day')
    );

    expect(reported.message).toMatch(/Missing on: 7/);
    expect(() => el.getEngine()).toThrow(/Missing on: 7/);
  });

  it('does not throw at configuration time for an undeclared bucket', () => {
    const el = configure();

    expect(() => {
      el.events = [
        {
          id: 3,
          name: 'a',
          date: '2024-01-20',
          availabilityStatus: 'maintenance',
        },
      ];
    }).not.toThrow();
  });

  it('accepts a bucket declared after the events', () => {
    const el = configure();
    el.events = [
      {
        id: 3,
        name: 'a',
        date: '2024-01-20',
        availabilityStatus: 'maintenance',
      },
    ];
    el.availabilityColors = { maintenance: '#0891b2' };

    expect(() => document.body.appendChild(el)).not.toThrow();
    expect(el.querySelector('td.availability-maintenance')).toBeTruthy();
  });

  it('resurfaces a failed initialisation on the next read', () => {
    const el = configure();
    el.events = [
      {
        id: 3,
        name: 'a',
        date: '2024-01-20',
        availabilityStatus: 'maintenance',
      },
    ];

    const reported = captureReactionError(() => document.body.appendChild(el));

    expect(reported.message).toMatch(/Unrecognised on: 3 \(maintenance\)/);
    expect(() => el.getEngine()).toThrow(/Unrecognised on: 3 \(maintenance\)/);
    expect(() => el.getCurrentDate()).toThrow(/Unrecognised on/);
  });

  it('clears the stored failure once the configuration is corrected', () => {
    const el = configure();
    el.events = [
      {
        id: 3,
        name: 'a',
        date: '2024-01-20',
        availabilityStatus: 'maintenance',
      },
    ];

    captureReactionError(() => document.body.appendChild(el));

    el.availabilityColors = { maintenance: '#0891b2' };

    expect(() => el.getEngine()).not.toThrow();
  });
});

describe('CalendarElement — heading attribute', () => {
  it('renders the heading attribute', () => {
    const el = document.createElement('kal-calendar') as CalendarElement;
    el.setAttribute('heading', 'Room bookings');
    document.body.appendChild(el);

    expect(el.querySelector('.calendar-title h1')?.textContent).toBe(
      'Room bookings'
    );
  });

  it('prefers heading when both are set', () => {
    const el = document.createElement('kal-calendar') as CalendarElement;
    el.setAttribute('title', 'old');
    el.setAttribute('heading', 'new');
    document.body.appendChild(el);

    expect(el.querySelector('.calendar-title h1')?.textContent).toBe('new');
  });

  it('still renders a deprecated title, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (
      CalendarElement as unknown as { titleDeprecationWarned: boolean }
    ).titleDeprecationWarned = false;

    const first = document.createElement('kal-calendar') as CalendarElement;
    first.setAttribute('title', 'Legacy');
    document.body.appendChild(first);

    const second = document.createElement('kal-calendar') as CalendarElement;
    second.setAttribute('title', 'Legacy too');
    document.body.appendChild(second);

    expect(first.querySelector('.calendar-title h1')?.textContent).toBe(
      'Legacy'
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/title attribute is deprecated/);

    warn.mockRestore();
  });
});

describe('CalendarElement — malformed times', () => {
  const BASE = new Date('2024-01-15');

  function slotsFor(startTime: string, endTime?: string): number {
    const el = mount({
      events: [
        {
          id: 1,
          name: 'a',
          date: '2024-01-15',
          startTime,
          ...(endTime === undefined ? {} : { endTime }),
          availabilityStatus: 'blocked',
        },
      ],
      initialDate: BASE,
      availabilityMode: 'time',
    });
    Array.from(el.querySelectorAll('td'))
      .find(td => td.textContent?.trim() === '15')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return el.querySelectorAll('.time-grid-slot-blocked').length;
  }

  it('books the whole day when a time cannot be parsed', () => {
    expect(slotsFor('9am', '11am')).toBe(24);
    expect(slotsFor('', '11:00')).toBe(24);
    expect(slotsFor('09:00', 'noon')).toBe(24);
    expect(slotsFor('25:00', '26:00')).toBe(24);
  });

  it('still books only the stated hours for a valid range', () => {
    expect(slotsFor('09:00', '11:00')).toBe(2);
  });

  it('books from the start to the end of the day when no end is given', () => {
    expect(slotsFor('09:00')).toBe(15);
    expect(slotsFor('00:00')).toBe(24);
    expect(slotsFor('23:00')).toBe(1);
  });

  it('leaves the hours before an open-ended start available', () => {
    const el = mount({
      events: [
        {
          id: 1,
          name: 'a',
          date: '2024-01-15',
          startTime: '09:00',
          availabilityStatus: 'blocked',
        },
      ],
      initialDate: BASE,
      availabilityMode: 'time',
    });
    Array.from(el.querySelectorAll('td'))
      .find(td => td.textContent?.trim() === '15')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(el.querySelectorAll('.time-grid-slot-open').length).toBe(9);
  });
});

describe('CalendarElement — multi-month view', () => {
  const BASE = new Date('2024-01-15');

  function mountMonths(
    months: string,
    mode: 'day' | 'time' | null = 'day'
  ): CalendarElement {
    const el = document.createElement('kal-calendar') as CalendarElement;
    el.setAttribute('initial-date', BASE.toISOString());
    if (mode) el.setAttribute('availability-mode', mode);
    el.setAttribute('months', months);
    el.events = [];
    document.body.appendChild(el);
    return el;
  }

  it('renders one table by default', () => {
    expect(mountMonths('1').querySelectorAll('table').length).toBe(1);
  });

  it('renders two consecutive months', () => {
    const el = mountMonths('2');
    const captions = Array.from(
      el.querySelectorAll('.calendar-pane-caption')
    ).map(node => node.textContent?.trim());

    expect(el.querySelectorAll('table').length).toBe(2);
    expect(captions).toEqual(['January 2024', 'February 2024']);
  });

  it('rolls the second pane into the next year', () => {
    const el = document.createElement('kal-calendar') as CalendarElement;
    el.setAttribute('initial-date', new Date('2024-12-10').toISOString());
    el.setAttribute('availability-mode', 'day');
    el.setAttribute('months', '2');
    el.events = [];
    document.body.appendChild(el);

    const captions = Array.from(
      el.querySelectorAll('.calendar-pane-caption')
    ).map(node => node.textContent?.trim());
    expect(captions).toEqual(['December 2024', 'January 2025']);
  });

  it('advances by one month, not by pane count', () => {
    const el = mountMonths('2');
    el.querySelector<HTMLElement>('[data-action="next"]')?.click();

    const captions = Array.from(
      el.querySelectorAll('.calendar-pane-caption')
    ).map(node => node.textContent?.trim());
    expect(captions).toEqual(['February 2024', 'March 2024']);
  });

  it('shows no caption for a single pane', () => {
    expect(mountMonths('1').querySelector('.calendar-pane-caption')).toBeNull();
  });

  it('falls back to one pane outside day mode, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = mountMonths('2', 'time');

    expect(el.querySelectorAll('table').length).toBe(1);
    expect(warn.mock.calls[0][0]).toMatch(/only supported with/);
    warn.mockRestore();
  });

  it('clamps beyond two panes', () => {
    expect(mountMonths('5').querySelectorAll('table').length).toBe(2);
  });

  it('ignores a non-numeric months attribute', () => {
    expect(mountMonths('lots').querySelectorAll('table').length).toBe(1);
  });

  it('selects a range spanning both panes', () => {
    const el = document.createElement('kal-calendar') as CalendarElement;
    el.setAttribute('initial-date', BASE.toISOString());
    el.setAttribute('availability-mode', 'day');
    el.setAttribute('selectable', 'range');
    el.setAttribute('months', '2');
    el.events = [];
    document.body.appendChild(el);

    const selections: { startDate: Date; endDate: Date }[] = [];
    el.addEventListener('cal-availability-select', e =>
      selections.push(
        (e as CustomEvent).detail as { startDate: Date; endDate: Date }
      )
    );

    // each click re-renders, so the panes must be re-queried between them
    const clickDayInPane = (paneIndex: number, day: string): void => {
      const pane = el.querySelectorAll('.calendar-pane')[paneIndex];
      const cell = Array.from(pane.querySelectorAll('td')).find(
        td =>
          td.textContent?.trim() === day &&
          !td.classList.contains('calendar-cell-other-month')
      );
      expect(cell).toBeTruthy();
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    };

    clickDayInPane(0, '20');
    clickDayInPane(1, '5');

    const last = selections[selections.length - 1];
    expect(last.startDate.getMonth()).toBe(0);
    expect(last.startDate.getDate()).toBe(20);
    expect(last.endDate.getMonth()).toBe(1);
    expect(last.endDate.getDate()).toBe(5);
  });
});

describe('CalendarElement — multi-month loading', () => {
  it('repeats the skeleton in every pane', () => {
    const el = document.createElement('kal-calendar') as CalendarElement;
    el.setAttribute('initial-date', new Date('2024-01-15').toISOString());
    el.setAttribute('availability-mode', 'day');
    el.setAttribute('months', '2');
    el.events = [];
    document.body.appendChild(el);

    el.loading = true;

    expect(el.querySelectorAll('table').length).toBe(2);
    expect(el.querySelectorAll('td.calendar-skeleton').length).toBe(84);
    el.querySelectorAll('table').forEach(table => {
      expect(table.querySelectorAll('td.calendar-skeleton').length).toBe(42);
    });

    el.loading = false;
    expect(el.querySelectorAll('td.calendar-skeleton').length).toBe(0);
    expect(el.querySelectorAll('table').length).toBe(2);
  });
});
