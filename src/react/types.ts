import { ReactNode, CSSProperties } from 'react';
import { CalendarProps as CoreCalendarProps, CalendarEvent } from '../core';

export interface ReactCalendarProps extends CoreCalendarProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  renderNoEvents?: () => ReactNode;
  title?: string;
}

export type CalendarComponentProps = ReactCalendarProps;

export interface DatePopupProps {
  isVisible: boolean;
  selectedDate: Date | null;
  events: CalendarEvent[];
  scheduleDay: string;
  popupPositionClass: string;
  onClose?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  renderNoEvents?: () => ReactNode;
}
