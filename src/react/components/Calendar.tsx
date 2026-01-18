import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  CalendarEngine,
  getCellClasses,
  MONTHS_FULL,
  MONTHS,
} from '../../core';
import { CalendarComponentProps } from '../types';
import { DatePopup } from './DatePopup';

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
  className = '',
  style,
  renderEvent,
  renderNoEvents,
  title,
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

  const [, forceUpdate] = useState({});
  const rerender = useCallback(() => forceUpdate({}), []);

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [yearInput, setYearInput] = useState('');
  const [yearInputValid, setYearInputValid] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (theme) {
      const root = document.documentElement;
      if (theme.primary)
        root.style.setProperty('--calendar-primary-color', theme.primary);
      if (theme.secondary)
        root.style.setProperty('--calendar-secondary-color', theme.secondary);
      if (theme.tertiary)
        root.style.setProperty('--calendar-tertiary-color', theme.tertiary);
      if (theme.textColor)
        root.style.setProperty('--calendar-text-color', theme.textColor);
      if (theme.textLight)
        root.style.setProperty('--calendar-text-light', theme.textLight);
      if (theme.background)
        root.style.setProperty('--calendar-background', theme.background);
      if (theme.cellHover)
        root.style.setProperty('--calendar-cell-hover', theme.cellHover);
      if (theme.borderColor)
        root.style.setProperty('--calendar-border-color', theme.borderColor);
      if (theme.todayOutline)
        root.style.setProperty('--calendar-today-outline', theme.todayOutline);
      if (theme.selectedBg)
        root.style.setProperty('--calendar-selected-bg', theme.selectedBg);
      if (theme.eventIndicator)
        root.style.setProperty(
          '--calendar-event-indicator',
          theme.eventIndicator
        );
    }
  }, [theme]);

  const viewModel = engine.getViewModel();
  const actions = engine.getActions();
  const { selectedDate, tasks } = viewModel;

  const handleDateClick = (
    event: React.MouseEvent<HTMLTableSectionElement>
  ) => {
    const td = (event.target as HTMLElement).closest('td');
    if (!td) return;

    const tr = td.parentElement as HTMLTableRowElement | null;
    if (!tr) return;

    const weekIndex = tr.rowIndex - 1; // -1 because of thead
    const dayIndex = Array.from(tr.children).indexOf(td);

    const calendarDate = viewModel.calendarDates[weekIndex]?.[dayIndex];
    if (!calendarDate) return;

    engine.handleDateClick(calendarDate.date, dayIndex);
    onDateSelect?.(calendarDate.date);
  };

  const handleMonthChange = useCallback(() => {
    onMonthChange?.(viewModel.currentYear, viewModel.currentMonth);
  }, [onMonthChange, viewModel.currentYear, viewModel.currentMonth]);

  const handleNext = () => {
    actions.next();
    handleMonthChange();
  };

  const handlePrevious = () => {
    actions.previous();
    handleMonthChange();
  };

  const handleGoToToday = () => {
    actions.goToToday();
    setPickerOpen(false);
    const today = new Date();
    onMonthChange?.(today.getFullYear(), today.getMonth());
  };

  const togglePicker = () => {
    const newOpen = !pickerOpen;
    setPickerOpen(newOpen);
    if (newOpen) {
      setYearInput(String(viewModel.currentYear));
      setYearInputValid(true);
    }
  };

  const today = new Date();
  const computedMinYear = minYear ?? today.getFullYear() - 30;
  const computedMaxYear = maxYear ?? today.getFullYear() + 10;

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setYearInput(value);
      const year = parseInt(value, 10);
      setYearInputValid(
        value === '' || (year >= computedMinYear && year <= computedMaxYear)
      );
    }
  };

  const handleYearInputBlur = () => {
    const year = parseInt(yearInput, 10);
    if (isNaN(year) || year < computedMinYear || year > computedMaxYear) {
      setYearInput(String(viewModel.currentYear));
      setYearInputValid(true);
    } else {
      actions.jump(year, viewModel.currentMonth);
      handleMonthChange();
    }
  };

  const handleYearPrev = () => {
    const newYear = viewModel.currentYear - 1;
    if (newYear >= computedMinYear) {
      actions.jump(newYear, viewModel.currentMonth);
      setYearInput(String(newYear));
      handleMonthChange();
    }
  };

  const handleYearNext = () => {
    const newYear = viewModel.currentYear + 1;
    if (newYear <= computedMaxYear) {
      actions.jump(newYear, viewModel.currentMonth);
      setYearInput(String(newYear));
      handleMonthChange();
    }
  };

  const handleMonthSelect = (month: number) => {
    actions.jump(viewModel.currentYear, month);
    setPickerOpen(false);
    handleMonthChange();
  };

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false);
      }
    };

    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  return (
    <div className={`kalendly-calendar ${className}`} style={style}>
      {title && (
        <div className="page--title">
          <h1>{title}</h1>
        </div>
      )}

      <div className="calendar--content">
        <div className="calendar--card">
          {/* Navigation Header */}
          <div className="calendar--nav-header">
            <button
              type="button"
              className="calendar--nav-arrow"
              onClick={handlePrevious}
              aria-label="Previous month"
            >
              &#8249;
            </button>

            <div className="calendar--picker-container" ref={pickerRef}>
              <button
                type="button"
                className="calendar--picker-btn"
                onClick={togglePicker}
                // aria-expanded={pickerOpen ? "true" : "false"}
                {...{ 'aria-expanded': pickerOpen }}
                aria-haspopup="true"
              >
                {useShortMonthNames
                  ? `${MONTHS[viewModel.currentMonth]} ${viewModel.currentYear}`
                  : viewModel.monthAndYearText}
                <span className="calendar--picker-chevron">&#9662;</span>
              </button>

              {pickerOpen && (
                <div className="calendar--picker-dropdown">
                  <div className="calendar--picker-year-row">
                    <button
                      type="button"
                      className="calendar--picker-year-arrow"
                      onClick={handleYearPrev}
                      disabled={viewModel.currentYear <= computedMinYear}
                      aria-label="Previous year"
                    >
                      &#8249;
                    </button>
                    <input
                      type="text"
                      className={`calendar--picker-year-input${!yearInputValid ? ' invalid' : ''}`}
                      value={yearInput}
                      onChange={handleYearInputChange}
                      onBlur={handleYearInputBlur}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleYearInputBlur();
                      }}
                      aria-label="Year"
                    />
                    <button
                      type="button"
                      className="calendar--picker-year-arrow"
                      onClick={handleYearNext}
                      disabled={viewModel.currentYear >= computedMaxYear}
                      aria-label="Next year"
                    >
                      &#8250;
                    </button>
                  </div>

                  <div className="calendar--picker-months">
                    {(useShortMonthNames ? MONTHS : MONTHS_FULL).map(
                      (month, index) => {
                        const isSelected = index === viewModel.currentMonth;
                        const isCurrentMonth =
                          index === today.getMonth() &&
                          viewModel.currentYear === today.getFullYear();
                        return (
                          <button
                            key={month}
                            type="button"
                            className={`calendar--picker-month${isSelected ? ' selected' : ''}${isCurrentMonth ? ' current-month' : ''}`}
                            onClick={() => handleMonthSelect(index)}
                          >
                            {month}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="calendar--today-btn"
              onClick={handleGoToToday}
              disabled={actions.isCurrentMonth()}
            >
              Today
            </button>

            <button
              type="button"
              className="calendar--nav-arrow"
              onClick={handleNext}
              aria-label="Next month"
            >
              &#8250;
            </button>
          </div>

          <table className="calendar--table calendar--table--bordered">
            <thead>
              <tr>
                {viewModel.days.map(day => (
                  <th key={day}>{day.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody onClick={handleDateClick}>
              {viewModel.calendarDates.map((week, weekIndex) => (
                <tr key={weekIndex}>
                  {week.map((calendarDate, dayIndex) => {
                    const cellClasses = getCellClasses(calendarDate);
                    return (
                      <td
                        key={`${weekIndex}-${dayIndex}`}
                        className={cellClasses.join(' ')}
                      >
                        {calendarDate.date.getDate()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <DatePopup
            isVisible={!!selectedDate}
            selectedDate={selectedDate}
            events={tasks}
            scheduleDay={viewModel.scheduleDay}
            popupPositionClass={viewModel.popupPositionClass}
            onClose={() => engine.clearSelection()}
            onEventClick={onEventClick}
            renderEvent={renderEvent}
            renderNoEvents={renderNoEvents}
          />
        </div>
      </div>
    </div>
  );
};
