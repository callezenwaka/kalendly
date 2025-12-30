import type { App } from 'vue';
import Calendar from './components/Calendar.vue';
import type { VueCalendarProps } from './types';

// Export the component
export { default as Calendar } from './components/Calendar.vue';
export * from './types';
export * from '../core';

// Plugin installation function
export function install(app: App) {
  app.component('Kalendly', Calendar);
}

// Export as plugin
export default {
  install,
  Calendar,
};

// Create a convenient factory function
export function createCalendar(props: VueCalendarProps) {
  return Calendar;
}
