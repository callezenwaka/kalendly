import { CalendarProps as CoreCalendarProps, CalendarEvent } from '../core';

export interface VueCalendarProps extends CoreCalendarProps {
  class?: string;
  style?: Record<string, any>;
  title?: string;
}

export interface VueCalendarEmits {
  'date-select': (date: Date) => void;
  'event-click': (event: CalendarEvent) => void;
  'month-change': (year: number, month: number) => void;
}

export interface VueCalendarSlots {
  title?: () => any;
  event?: (props: { event: CalendarEvent }) => any;
  'no-events'?: () => any;
}
