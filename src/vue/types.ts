import {
  CalendarProps as CoreCalendarProps,
  CalendarEvent,
  CalendarTheme,
} from '../core';
import type { VNode } from 'vue';

export interface VueCalendarProps extends CoreCalendarProps {
  class?: string;
  style?: Record<string, string | number>;
  title?: string;
  theme?: CalendarTheme;
}

export interface VueCalendarEmits {
  'date-select': (date: Date) => void;
  'event-click': (event: CalendarEvent) => void;
  'month-change': (year: number, month: number) => void;
}

export interface VueCalendarSlots {
  title?: () => VNode | VNode[];
  event?: (props: { event: CalendarEvent }) => VNode | VNode[];
  'no-events'?: () => VNode | VNode[];
}
