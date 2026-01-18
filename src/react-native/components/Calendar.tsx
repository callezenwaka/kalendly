import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {
  CalendarEngine,
  getCellClasses,
  MONTHS_FULL,
  MONTHS,
} from '../../core';
import { CalendarComponentProps } from '../types';
import { DatePopup } from './DatePopup';
import {
  getResponsiveStyles,
  CalendarColors,
} from '../../styles/react-native-styles';

export const Calendar: React.FC<CalendarComponentProps> = ({
  events,
  initialDate,
  minYear,
  maxYear,
  weekStartsOn = 0,
  useShortMonthNames = false,
  onDateSelect,
  onEventClick,
  onMonthChange,
  style,
  containerStyle,
  headerStyle,
  headerTextStyle,
  cellStyle,
  cellTextStyle,
  renderEvent,
  renderNoEvents,
  title,
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

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [yearInput, setYearInput] = useState('');
  const [yearInputValid, setYearInputValid] = useState(true);

  const today = new Date();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const computedMinYear = minYear ?? todayYear - 30;
  const computedMaxYear = maxYear ?? todayYear + 10;

  useEffect(() => {
    const unsubscribe = engine.subscribe(rerender);
    return unsubscribe;
  }, [engine, rerender]);

  useEffect(() => {
    engine.updateEvents(events);
  }, [engine, events]);

  useEffect(() => {
    return () => {
      engine.destroy();
    };
  }, [engine]);

  const viewModel = engine.getViewModel();
  const actions = engine.getActions();
  const { selectedDate, tasks } = viewModel;

  const isCurrentMonth =
    viewModel.currentYear === todayYear &&
    viewModel.currentMonth === todayMonth;

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

  const handleGoToToday = () => {
    actions.goToToday();
    setPickerOpen(false);
    onMonthChange?.(todayYear, todayMonth);
  };

  const togglePicker = () => {
    const newOpen = !pickerOpen;
    setPickerOpen(newOpen);
    if (newOpen) {
      setYearInput(String(viewModel.currentYear));
      setYearInputValid(true);
    }
  };

  const handleYearInputChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setYearInput(value);
      const year = parseInt(value, 10);
      setYearInputValid(
        value === '' || (year >= computedMinYear && year <= computedMaxYear)
      );
    }
  };

  const handleYearInputSubmit = () => {
    const year = parseInt(yearInput, 10);
    if (isNaN(year) || year < computedMinYear || year > computedMaxYear) {
      setYearInput(String(viewModel.currentYear));
      setYearInputValid(true);
    } else {
      actions.jump(year, viewModel.currentMonth);
      onMonthChange?.(year, viewModel.currentMonth);
    }
  };

  const handleYearPrev = () => {
    const newYear = viewModel.currentYear - 1;
    if (newYear >= computedMinYear) {
      actions.jump(newYear, viewModel.currentMonth);
      setYearInput(String(newYear));
      onMonthChange?.(newYear, viewModel.currentMonth);
    }
  };

  const handleYearNext = () => {
    const newYear = viewModel.currentYear + 1;
    if (newYear <= computedMaxYear) {
      actions.jump(newYear, viewModel.currentMonth);
      setYearInput(String(newYear));
      onMonthChange?.(newYear, viewModel.currentMonth);
    }
  };

  const handleMonthSelect = (month: number) => {
    actions.jump(viewModel.currentYear, month);
    setPickerOpen(false);
    onMonthChange?.(viewModel.currentYear, month);
  };

  const closePopup = () => {
    engine.clearSelection();
  };

  return (
    <ScrollView style={[calendarStyles.container, containerStyle]}>
      {title && (
        <View style={calendarStyles.titleContainer}>
          <Text style={calendarStyles.title}>{title}</Text>
        </View>
      )}

      <View style={[calendarStyles.contentContainer, style]}>
        <View style={calendarStyles.card}>
          {/* Navigation Header */}
          <View style={[pickerStyles.navHeader, headerStyle]}>
            <TouchableOpacity
              style={pickerStyles.navArrow}
              onPress={handlePrevious}
            >
              <Text style={pickerStyles.navArrowText}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={pickerStyles.pickerBtn}
              onPress={togglePicker}
            >
              <Text style={[pickerStyles.pickerBtnText, headerTextStyle]}>
                {useShortMonthNames
                  ? `${MONTHS[viewModel.currentMonth]} ${viewModel.currentYear}`
                  : viewModel.monthAndYearText}
              </Text>
              <Text style={pickerStyles.chevron}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                pickerStyles.todayBtn,
                isCurrentMonth && pickerStyles.todayBtnDisabled,
              ]}
              onPress={handleGoToToday}
              disabled={isCurrentMonth}
            >
              <Text
                style={[
                  pickerStyles.todayBtnText,
                  isCurrentMonth && pickerStyles.todayBtnTextDisabled,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={pickerStyles.navArrow}
              onPress={handleNext}
            >
              <Text style={pickerStyles.navArrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Month/Year Picker Modal */}
          <Modal
            visible={pickerOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setPickerOpen(false)}
          >
            <Pressable
              style={pickerStyles.modalOverlay}
              onPress={() => setPickerOpen(false)}
            >
              <Pressable
                style={pickerStyles.pickerDropdown}
                onPress={e => e.stopPropagation()}
              >
                {/* Year Selector */}
                <View style={pickerStyles.yearRow}>
                  <TouchableOpacity
                    style={pickerStyles.yearArrow}
                    onPress={handleYearPrev}
                    disabled={viewModel.currentYear <= computedMinYear}
                  >
                    <Text
                      style={[
                        pickerStyles.yearArrowText,
                        viewModel.currentYear <= computedMinYear &&
                          pickerStyles.yearArrowDisabled,
                      ]}
                    >
                      ‹
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    style={[
                      pickerStyles.yearInput,
                      !yearInputValid && pickerStyles.yearInputInvalid,
                    ]}
                    value={yearInput}
                    onChangeText={handleYearInputChange}
                    onSubmitEditing={handleYearInputSubmit}
                    onBlur={handleYearInputSubmit}
                    keyboardType="number-pad"
                    maxLength={4}
                  />

                  <TouchableOpacity
                    style={pickerStyles.yearArrow}
                    onPress={handleYearNext}
                    disabled={viewModel.currentYear >= computedMaxYear}
                  >
                    <Text
                      style={[
                        pickerStyles.yearArrowText,
                        viewModel.currentYear >= computedMaxYear &&
                          pickerStyles.yearArrowDisabled,
                      ]}
                    >
                      ›
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Month Grid */}
                <View style={pickerStyles.monthGrid}>
                  {(useShortMonthNames ? MONTHS : MONTHS_FULL).map(
                    (month, index) => {
                      const isSelected = index === viewModel.currentMonth;
                      const isCurrent =
                        index === todayMonth &&
                        viewModel.currentYear === todayYear;
                      return (
                        <TouchableOpacity
                          key={month}
                          style={[
                            pickerStyles.monthBtn,
                            isSelected && pickerStyles.monthBtnSelected,
                            isCurrent && pickerStyles.monthBtnCurrent,
                          ]}
                          onPress={() => handleMonthSelect(index)}
                        >
                          <Text
                            style={[
                              pickerStyles.monthBtnText,
                              isSelected && pickerStyles.monthBtnTextSelected,
                            ]}
                          >
                            {month}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              </Pressable>
            </Pressable>
          </Modal>

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
                  const isOtherMonth = cellClasses.includes('other-month');

                  return (
                    <TouchableOpacity
                      key={`${weekIndex}-${dayIndex}`}
                      style={[
                        calendarStyles.tableCell,
                        cellStyle,
                        isToday && calendarStyles.cellToday,
                        hasEvents && calendarStyles.cellWithEvents,
                        isOtherMonth && pickerStyles.cellOtherMonth,
                      ]}
                      onPress={() => {
                        handleDatePress(calendarDate.date, dayIndex);
                      }}
                    >
                      <Text
                        style={[
                          calendarStyles.tableCellText,
                          cellTextStyle,
                          isToday && calendarStyles.cellTodayText,
                          isOtherMonth && pickerStyles.cellOtherMonthText,
                        ]}
                      >
                        {calendarDate.date.getDate()}
                      </Text>
                      {hasEvents && (
                        <View style={calendarStyles.eventIndicator} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      <DatePopup
        visible={!!selectedDate}
        selectedDate={selectedDate}
        events={tasks}
        scheduleDay={viewModel.scheduleDay}
        onClose={closePopup}
        onEventClick={onEventClick}
        renderEvent={renderEvent}
        renderNoEvents={renderNoEvents}
        showCloseButton={showCloseButton}
      />
    </ScrollView>
  );
};

// Picker styles for React Native
const pickerStyles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
    gap: 8,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    fontSize: 20,
    color: '#2c3e50',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    gap: 8,
  },
  pickerBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  chevron: {
    fontSize: 10,
    color: '#2c3e50',
  },
  todayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  todayBtnDisabled: {
    opacity: 0.5,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  todayBtnTextDisabled: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  yearArrow: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearArrowText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  yearArrowDisabled: {
    opacity: 0.3,
  },
  yearInput: {
    width: 80,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  yearInputInvalid: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthBtn: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  monthBtnSelected: {
    backgroundColor: '#fc8917',
  },
  monthBtnCurrent: {
    borderWidth: 1,
    borderColor: '#fc8917',
  },
  monthBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  monthBtnTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  cellOtherMonth: {
    backgroundColor: '#f9fafb',
  },
  cellOtherMonthText: {
    color: '#9ca3af',
  },
});
