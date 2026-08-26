import type {
  CalendarEvent,
  CalendarTheme,
  CategoryColorMap,
  CalendarEngine,
} from '../core';

export interface CalendarElementProps {
  events?: CalendarEvent[];
  initialDate?: Date;
  minYear?: number;
  maxYear?: number;
  weekStartsOn?: 0 | 1;
  useShortMonthNames?: boolean;
  title?: string;
  theme?: CalendarTheme;
  categoryColors?: CategoryColorMap;
  renderEvent?: (event: CalendarEvent) => string;
  renderNoEvents?: () => string;
  availabilityColors?: Record<string, string>;
  selectableStatuses?: string[];
}

export interface CalendarElementInstance {
  events: CalendarEvent[];
  theme: CalendarTheme;
  categoryColors: CategoryColorMap;
  availabilityColors: Record<string, string>;
  selectableStatuses: string[];
  renderEvent: (event: CalendarEvent) => string;
  renderNoEvents: () => string;
  updateEvents: (events: CalendarEvent[]) => void;
  updateTheme: (theme: CalendarTheme) => void;
  getCurrentDate: () => Date | null;
  goToDate: (date: Date) => void;
  getEngine: () => CalendarEngine;
}
