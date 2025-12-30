import { ReactNode } from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { CalendarProps as CoreCalendarProps, CalendarEvent } from '../core';

export interface ReactNativeCalendarProps extends CoreCalendarProps {
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  headerTextStyle?: TextStyle;
  cellStyle?: ViewStyle;
  cellTextStyle?: TextStyle;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  renderNoEvents?: () => ReactNode;
  title?: string;
  showCloseButton?: boolean;
}

export type CalendarComponentProps = ReactNativeCalendarProps;

export interface DatePopupProps {
  visible: boolean;
  selectedDate: Date | null;
  events: CalendarEvent[];
  scheduleDay: string;
  onClose: () => void;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  renderNoEvents?: () => ReactNode;
  showCloseButton?: boolean;
}

export interface SelectProps {
  options: Array<{ label: string; value: number }>;
  selectedValue: number;
  onValueChange: (value: number) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}
