import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CalendarEngine, getCellClasses } from '../../core';
import { CalendarComponentProps } from '../types';
import { DatePopup } from './DatePopup';

export const Calendar: React.FC<CalendarComponentProps> = ({
  events,
  initialDate,
  minYear,
  maxYear,
  weekStartsOn = 0,
  onDateSelect,
  onEventClick,
  onMonthChange,
  className = '',
  style,
  renderEvent,
  renderNoEvents,
  title = 'Event Schedule',
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

    const cellContent = td.textContent?.trim();
    if (!cellContent) return;

    const clickedDate = new Date(
      viewModel.currentYear,
      viewModel.currentMonth,
      parseInt(cellContent)
    );

    const dayIndex = td.parentNode
      ? Array.from(td.parentNode.children).indexOf(td)
      : 0;
    engine.handleDateClick(clickedDate, dayIndex);

    onDateSelect?.(clickedDate);
  };

  const handleMonthChange = () => {
    onMonthChange?.(viewModel.currentYear, viewModel.currentMonth);
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    actions.jump(year, viewModel.currentMonth);
    handleMonthChange();
  };

  const handleMonthSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const month = parseInt(event.target.value);
    actions.jump(viewModel.currentYear, month);
    handleMonthChange();
  };

  const handleNext = () => {
    actions.next();
    handleMonthChange();
  };

  const handlePrevious = () => {
    actions.previous();
    handleMonthChange();
  };

  return (
    <div className={`kalendly-calendar ${className}`} style={style}>
      {title && (
        <div className="page--title">
          <h1>{title}</h1>
        </div>
      )}

      <div className="calendar--content">
        <div className="calendar--card">
          <h3 className="calendar--card--header">
            {viewModel.monthAndYearText}
          </h3>

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
                        {calendarDate?.date.getDate() || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="calendar--navigation--buttons">
            <button
              className="calendar--navigation--btn"
              onClick={handlePrevious}
            >
              Previous
            </button>
            <button className="calendar--navigation--btn" onClick={handleNext}>
              Next
            </button>
          </div>

          <form className="calendar--form--jump">
            <div className="calendar--lead">Jump To:</div>
            <div>
              <label className="calendar--form--jump--item">
                <select
                  value={viewModel.currentMonth}
                  onChange={handleMonthSelectChange}
                  aria-label="Select month"
                >
                  {viewModel.months.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label className="calendar--form--jump--item">
                <select
                  value={viewModel.currentYear}
                  onChange={handleYearChange}
                  aria-label="Select year"
                >
                  {viewModel.years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </form>

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
