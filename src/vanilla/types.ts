import {
  CalendarProps as CoreCalendarProps,
  CalendarEvent,
  CalendarTheme,
} from '../core';

export interface VanillaCalendarProps extends CoreCalendarProps {
  container: HTMLElement | string;
  className?: string;
  title?: string;
  renderEvent?: (event: CalendarEvent) => string;
  renderNoEvents?: () => string;
  theme?: CalendarTheme;
}

export interface VanillaCalendarInstance {
  destroy: () => void;
  updateEvents: (events: CalendarEvent[]) => void;
  updateTheme: (theme: CalendarTheme) => void;
  getCurrentDate: () => Date | null;
  goToDate: (date: Date) => void;
  getEngine: () => import('../core').CalendarEngine;
}
