import { CalendarProps as CoreCalendarProps, CalendarEvent } from '../core';

export interface VanillaCalendarProps extends CoreCalendarProps {
  container: HTMLElement | string;
  className?: string;
  title?: string;
  renderEvent?: (event: CalendarEvent) => string;
  renderNoEvents?: () => string;
}

export interface VanillaCalendarInstance {
  destroy: () => void;
  updateEvents: (events: CalendarEvent[]) => void;
  getCurrentDate: () => Date | null;
  goToDate: (date: Date) => void;
  getEngine: () => import('../core').CalendarEngine;
}
