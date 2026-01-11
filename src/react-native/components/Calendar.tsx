import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { CalendarEngine, getCellClasses } from '../../core';
import { CalendarComponentProps, SelectProps } from '../types';
import { DatePopup } from './DatePopup';
import {
  getResponsiveStyles,
  CalendarColors,
} from '../../styles/react-native-styles';

// Simple Select component for React Native
const Select: React.FC<SelectProps> = ({
  options,
  selectedValue,
  onValueChange,
  style,
  textStyle,
}) => {
  const selectedOption = options.find(opt => opt.value === selectedValue);

  const showPicker = () => {
    Alert.alert(
      'Select Option',
      '',
      options.map(option => ({
        text: option.label,
        onPress: () => onValueChange(option.value),
      }))
    );
  };

  return (
    <TouchableOpacity style={style} onPress={showPicker}>
      <Text style={textStyle}>{selectedOption?.label}</Text>
    </TouchableOpacity>
  );
};

export const Calendar: React.FC<CalendarComponentProps> = ({
  events,
  initialDate,
  minYear,
  maxYear,
  weekStartsOn = 0,
  onDateSelect,
  onEventClick: _onEventClick,
  onMonthChange,
  style,
  containerStyle,
  headerStyle,
  headerTextStyle,
  cellStyle,
  cellTextStyle,
  renderEvent,
  renderNoEvents,
  title = 'Event Schedule',
  showCloseButton = true,
  theme,
}) => {
  const engine = useMemo(
    () =>
      new CalendarEngine({
        events,
        initialDate,
        minYear,
        maxYear,
        weekStartsOn,
      }),
    [events, initialDate, minYear, maxYear, weekStartsOn]
  );

  // Map CalendarTheme to CalendarColors format
  const themeColors = useMemo<Partial<CalendarColors> | undefined>(() => {
    if (!theme) return undefined;
    return {
      primary: theme.primary,
      secondary: theme.secondary,
      tertiary: theme.tertiary,
      text: theme.textColor,
      border: theme.borderColor,
      todayOutline: theme.todayOutline,
      eventIndicator: theme.eventIndicator,
      background: theme.background,
    };
  }, [theme]);

  // Generate responsive styles based on screen dimensions and theme
  const calendarStyles = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    return getResponsiveStyles(width, height, themeColors);
  }, [themeColors]);

  const [, forceUpdate] = useState({});
  const rerender = useCallback(() => forceUpdate({}), []);

  useEffect(() => {
    const unsubscribe = engine.subscribe(rerender);
    return unsubscribe;
  }, [engine, rerender]);

  useEffect(() => {
    engine.updateEvents(events);
  }, [engine, events]);

  const viewModel = engine.getViewModel();
  const actions = engine.getActions();
  const { selectedDate, tasks } = viewModel;

  const handleDatePress = (date: Date, dayIndex: number) => {
    engine.handleDateClick(date, dayIndex);
    onDateSelect?.(date);
  };

  const handleNext = () => {
    actions.next();
    onMonthChange?.(viewModel.currentYear, viewModel.currentMonth);
  };

  const handlePrevious = () => {
    actions.previous();
    onMonthChange?.(viewModel.currentYear, viewModel.currentMonth);
  };

  const handleMonthChange = (month: number) => {
    actions.jump(viewModel.currentYear, month);
    onMonthChange?.(viewModel.currentYear, month);
  };

  const handleYearChange = (year: number) => {
    actions.jump(year, viewModel.currentMonth);
    onMonthChange?.(year, viewModel.currentMonth);
  };

  const closePopup = () => {
    engine.clearSelection();
  };

  const monthOptions = viewModel.months.map((month, index) => ({
    label: month,
    value: index,
  }));

  const yearOptions = viewModel.years.map(year => ({
    label: year.toString(),
    value: year,
  }));

  return (
    <ScrollView style={[calendarStyles.container, containerStyle]}>
      {title && (
        <View style={calendarStyles.titleContainer}>
          <Text style={calendarStyles.title}>{title}</Text>
        </View>
      )}

      <View style={[calendarStyles.contentContainer, style]}>
        <View style={calendarStyles.card}>
          <View style={[calendarStyles.cardHeader, headerStyle]}>
            <Text style={[calendarStyles.cardHeaderText, headerTextStyle]}>
              {viewModel.monthAndYearText}
            </Text>
          </View>

          <View style={calendarStyles.table}>
            {/* Table Header */}
            <View style={calendarStyles.tableHeader}>
              {viewModel.days.map(day => (
                <View key={day} style={calendarStyles.tableHeaderCell}>
                  <Text style={calendarStyles.tableHeaderText}>
                    {day.slice(0, 3)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Rows */}
            {viewModel.calendarDates.map((week, weekIndex) => (
              <View key={weekIndex} style={calendarStyles.tableRow}>
                {week.map((calendarDate, dayIndex) => {
                  const cellClasses = getCellClasses(calendarDate);
                  const isToday = cellClasses.includes(
                    'schedule--current--exam'
                  );
                  const hasEvents = cellClasses.includes('has--event');

                  return (
                    <TouchableOpacity
                      key={`${weekIndex}-${dayIndex}`}
                      style={[
                        calendarStyles.tableCell,
                        cellStyle,
                        isToday && calendarStyles.cellToday,
                        hasEvents && calendarStyles.cellWithEvents,
                      ]}
                      onPress={() => {
                        if (calendarDate) {
                          handleDatePress(calendarDate.date, dayIndex);
                        }
                      }}
                      disabled={!calendarDate}
                    >
                      {calendarDate && (
                        <>
                          <Text
                            style={[
                              calendarStyles.tableCellText,
                              cellTextStyle,
                              isToday && calendarStyles.cellTodayText,
                            ]}
                          >
                            {calendarDate.date.getDate()}
                          </Text>
                          {hasEvents && (
                            <View style={calendarStyles.eventIndicator} />
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={calendarStyles.navigationContainer}>
            <TouchableOpacity
              style={calendarStyles.navigationButton}
              onPress={handlePrevious}
            >
              <Text style={calendarStyles.navigationButtonText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={calendarStyles.navigationButton}
              onPress={handleNext}
            >
              <Text style={calendarStyles.navigationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>

          {/* Jump Form */}
          <View style={calendarStyles.jumpForm}>
            <Text style={calendarStyles.jumpLabel}>Jump To:</Text>
            <Select
              options={monthOptions}
              selectedValue={viewModel.currentMonth}
              onValueChange={handleMonthChange}
              style={calendarStyles.jumpSelect}
              textStyle={calendarStyles.jumpSelectText}
            />
            <Select
              options={yearOptions}
              selectedValue={viewModel.currentYear}
              onValueChange={handleYearChange}
              style={calendarStyles.jumpSelect}
              textStyle={calendarStyles.jumpSelectText}
            />
          </View>
        </View>
      </View>

      <DatePopup
        visible={!!selectedDate}
        selectedDate={selectedDate}
        events={tasks}
        scheduleDay={viewModel.scheduleDay}
        onClose={closePopup}
        renderEvent={renderEvent}
        renderNoEvents={renderNoEvents}
        showCloseButton={showCloseButton}
      />
    </ScrollView>
  );
};
