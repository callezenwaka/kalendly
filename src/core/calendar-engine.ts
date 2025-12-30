import {
  CalendarEvent,
  CalendarState,
  CalendarConfig,
  CalendarActions,
  CalendarViewModel,
} from './types';
import {
  generateCalendarDates,
  getEventsForDate,
  generateYears,
  getPopupPositionClass,
  getMonthYearText,
  formatDateForDisplay,
  MONTHS,
  DAYS,
} from './utils';

export class CalendarEngine {
  private state: CalendarState;
  private config: CalendarConfig;
  private listeners: Set<() => void> = new Set();

  constructor(config: CalendarConfig) {
    this.config = config;

    const initialDate = config.initialDate || new Date();
    this.state = {
      currentYear: initialDate.getFullYear(),
      currentMonth: initialDate.getMonth(),
      currentDate: initialDate.getDate(),
      selectedDate: null,
      selectedDayIndex: null,
      tasks: [],
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Get current state
   */
  getState(): CalendarState {
    return { ...this.state };
  }

  /**
   * Get view model with computed properties
   */
  getViewModel(): CalendarViewModel {
    const calendarDates = generateCalendarDates(
      this.state.currentYear,
      this.state.currentMonth,
      this.config.events,
      this.config.weekStartsOn
    );

    return {
      ...this.state,
      months: MONTHS,
      days: DAYS,
      years: generateYears(this.config.minYear, this.config.maxYear),
      monthAndYearText: getMonthYearText(
        this.state.currentYear,
        this.state.currentMonth
      ),
      scheduleDay: this.state.selectedDate
        ? formatDateForDisplay(this.state.selectedDate)
        : '',
      calendarDates,
      popupPositionClass: getPopupPositionClass(this.state.selectedDayIndex),
    };
  }

  /**
   * Get actions object
   */
  getActions(): CalendarActions {
    return {
      next: this.next.bind(this),
      previous: this.previous.bind(this),
      jump: this.jump.bind(this),
      selectDate: this.selectDate.bind(this),
      updateTasks: this.updateTasks.bind(this),
    };
  }

  /**
   * Navigate to next month
   */
  private next(): void {
    if (this.state.currentMonth === 11) {
      this.state.currentMonth = 0;
      this.state.currentYear++;
    } else {
      this.state.currentMonth++;
    }

    this.state.selectedDate = null;
    this.state.selectedDayIndex = null;
    this.updateTasks();
    this.notify();
  }

  /**
   * Navigate to previous month
   */
  private previous(): void {
    if (this.state.currentMonth === 0) {
      this.state.currentMonth = 11;
      this.state.currentYear--;
    } else {
      this.state.currentMonth--;
    }

    this.state.selectedDate = null;
    this.state.selectedDayIndex = null;
    this.updateTasks();
    this.notify();
  }

  /**
   * Jump to specific month and year
   */
  private jump(year: number, month: number): void {
    this.state.currentYear = year;
    this.state.currentMonth = month;
    this.state.selectedDate = null;
    this.state.selectedDayIndex = null;
    this.updateTasks();
    this.notify();
  }

  /**
   * Select a specific date
   */
  private selectDate(date: Date, dayIndex?: number): void {
    this.state.selectedDate = date;
    this.state.selectedDayIndex = dayIndex ?? null;
    this.state.currentDate = date.getDate();
    this.state.currentMonth = date.getMonth();
    this.state.currentYear = date.getFullYear();
    this.updateTasks();
    this.notify();
  }

  /**
   * Update tasks for the currently selected date
   */
  private updateTasks(): void {
    if (!this.state.selectedDate) {
      this.state.tasks = [];
      return;
    }

    this.state.tasks = getEventsForDate(
      this.config.events,
      this.state.selectedDate
    );
  }

  /**
   * Update events configuration
   */
  updateEvents(events: CalendarEvent[]): void {
    this.config.events = events;
    this.updateTasks();
    this.notify();
  }

  /**
   * Handle date cell click
   */
  handleDateClick(date: Date, dayIndex?: number): void {
    this.selectDate(date, dayIndex);
  }

  /**
   * Check if date has events
   */
  hasEventsForDate(date: Date): boolean {
    return getEventsForDate(this.config.events, date).length > 0;
  }

  /**
   * Get events for a specific date
   */
  getEventsForDate(date: Date): CalendarEvent[] {
    return getEventsForDate(this.config.events, date);
  }

  /**
   * Clear selected date
   */
  clearSelection(): void {
    this.state.selectedDate = null;
    this.state.selectedDayIndex = null;
    this.state.tasks = [];
    this.notify();
  }

  /**
   * Destroy the engine and cleanup listeners
   */
  destroy(): void {
    this.listeners.clear();
  }
}
