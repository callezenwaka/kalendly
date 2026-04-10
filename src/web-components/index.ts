export { CalendarElement, defineCalendarElement } from './CalendarElement';
export type { CalendarElementProps, CalendarElementInstance } from './types';
export * from '../core';

// Auto-register the custom element (guarded — safe to import multiple times)
if (
  typeof customElements !== 'undefined' &&
  !customElements.get('kal-calendar')
) {
  // Dynamic import keeps this out of the synchronous module evaluation path,
  // which prevents crashes in SSR environments where customElements is undefined
  // but window/document may not be fully available.
  import('./CalendarElement.js').then(({ CalendarElement }) => {
    if (!customElements.get('kal-calendar')) {
      customElements.define('kal-calendar', CalendarElement);
    }
  });
}
