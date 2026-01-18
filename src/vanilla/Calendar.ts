import {
  CalendarEngine,
  getCellClasses,
  formatTimeRange,
  formatAttendees,
  MONTHS_FULL,
  MONTHS,
} from '../core';
import { VanillaCalendarProps, VanillaCalendarInstance } from './types';

export class VanillaCalendar implements VanillaCalendarInstance {
  private engine: CalendarEngine;
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private props: VanillaCalendarProps;
  private actions: ReturnType<CalendarEngine['getActions']>;
  private pickerOpen: boolean = false;
  private yearInput: string = '';
  private yearInputValid: boolean = true;
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  private delegatedClickHandler: ((e: MouseEvent) => void) | null = null;
  private delegatedInputHandler: ((e: Event) => void) | null = null;
  private delegatedBlurHandler: ((e: FocusEvent) => void) | null = null;
  private delegatedKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private listenersAttached: boolean = false;

  constructor(props: VanillaCalendarProps) {
    this.props = props;

    if (typeof props.container === 'string') {
      const element = document.querySelector(props.container);
      if (!element) {
        throw new Error(`Container element "${props.container}" not found`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = props.container;
    }

    this.engine = new CalendarEngine({
      events: props.events,
      initialDate: props.initialDate,
      minYear: props.minYear,
      maxYear: props.maxYear,
      weekStartsOn: props.weekStartsOn,
    });

    this.actions = this.engine.getActions();

    this.applyTheme();
    this.init();
  }

  private applyTheme(): void {
    if (this.props.theme) {
      const root = document.documentElement;
      const theme = this.props.theme;
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
  }

  private init(): void {
    this.container.classList.add('kalendly-calendar');
    if (this.props.className) {
      this.container.classList.add(this.props.className);
    }

    this.unsubscribe = this.engine.subscribe(() => {
      this.render();
    });

    this.render();
  }

  private render(): void {
    const viewModel = this.engine.getViewModel();

    const defaultRenderEvent = (
      event: VanillaCalendarProps['events'][number]
    ) => {
      const timeRange = formatTimeRange(event);
      const attendeesList = formatAttendees(event.attendees);

      let borderColor = event.color || '#3b82f6';
      if (event.category) {
        borderColor = this.engine.getCategoryColor(event.category);
      }

      const getCategoryLabel = (category?: string) => {
        const labels: Record<string, string> = {
          work: 'WORK',
          personal: 'PERSONAL',
          meeting: 'MEETING',
          deadline: 'DEADLINE',
          appointment: 'APPOINTMENT',
          other: 'OTHER',
        };
        return category ? labels[category] || category.toUpperCase() : '';
      };

      const getPriorityLabel = (priority?: string) => {
        const labels: Record<string, string> = {
          high: 'HIGH',
          medium: 'MEDIUM',
          low: 'LOW',
        };
        return priority ? labels[priority] || priority.toUpperCase() : '';
      };

      const getStatusLabel = (status?: string) => {
        const labels: Record<string, string> = {
          completed: 'COMPLETED',
          cancelled: 'CANCELLED',
          tentative: 'TENTATIVE',
          scheduled: 'SCHEDULED',
        };
        return status ? labels[status] || status.toUpperCase() : '';
      };

      return `
        <div class="event-card" style="border-left-color: ${borderColor}">
          <div class="event-header">
            <div class="event-title">${event.name}</div>
            <div class="event-badges">
              ${event.category ? `<span class="badge category-${event.category}">${getCategoryLabel(event.category)}</span>` : ''}
              ${event.priority ? `<span class="badge priority-${event.priority}">${getPriorityLabel(event.priority)}</span>` : ''}
              ${event.status && event.status !== 'scheduled' ? `<span class="badge status-${event.status}">${getStatusLabel(event.status)}</span>` : ''}
            </div>
          </div>
          
          ${
            timeRange
              ? `
          <div class="event-time">
            <span class="event-time-label">Time:</span>
            <span class="event-time-value">${timeRange}</span>
          </div>
          `
              : ''
          }
          
          ${
            event.description
              ? `
          <div class="event-description">${event.description}</div>
          `
              : ''
          }
          
          ${
            event.location
              ? `
          <div class="event-time">
            <span class="event-time-label">Location:</span>
            <span class="event-time-value">${event.location}</span>
          </div>
          `
              : ''
          }
          
          ${
            attendeesList
              ? `
          <div class="event-time">
            <span class="event-time-label">Attendees:</span>
            <span class="event-time-value">${attendeesList}</span>
          </div>
          `
              : ''
          }
          
          ${
            event.organizer
              ? `
          <div class="event-time">
            <span class="event-time-label">Organizer:</span>
            <span class="event-time-value">${event.organizer}</span>
          </div>
          `
              : ''
          }
          
          ${
            event.notes
              ? `
          <div class="event-time">
            <span class="event-time-label">Notes:</span>
            <span class="event-time-value">${event.notes}</span>
          </div>
          `
              : ''
          }
          
          ${
            event.url
              ? `
          <div class="event-time">
            <a href="${event.url}" target="_blank" rel="noopener noreferrer" class="event-link">
              View Details →
            </a>
          </div>
          `
              : ''
          }
          
          ${
            event.tags && event.tags.length > 0
              ? `
          <div class="event-tags">
            ${event.tags.map((tag: string) => `<span class="event-tag">${tag}</span>`).join('')}
          </div>
          `
              : ''
          }
        </div>
      `;
    };

    const defaultRenderNoEvents = () =>
      '<div class="no-events-message">No events scheduled for this day.</div>';

    const renderEvent = this.props.renderEvent || defaultRenderEvent;
    const renderNoEvents = this.props.renderNoEvents || defaultRenderNoEvents;

    const showScrollHint = viewModel.tasks.length > 3;

    const today = new Date();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const minYear = this.props.minYear ?? todayYear - 30;
    const maxYear = this.props.maxYear ?? todayYear + 10;
    const isCurrentMonth =
      viewModel.currentYear === todayYear &&
      viewModel.currentMonth === todayMonth;

    const html = `
      ${
        this.props.title
          ? `
        <div class="page--title">
          <h1>${this.props.title}</h1>
        </div>
      `
          : ''
      }

      <div class="calendar--content">
        <div class="calendar--card">
          <!-- Navigation Header -->
          <div class="calendar--nav-header">
            <button type="button" class="calendar--nav-arrow" data-action="previous" aria-label="Previous month">
              &#8249;
            </button>

            <div class="calendar--picker-container" data-picker-container>
              <button
                type="button"
                class="calendar--picker-btn"
                data-action="toggle-picker"
                aria-expanded="${this.pickerOpen ? 'true' : 'false'}"
                aria-haspopup="true"
              >
                ${
                  this.props.useShortMonthNames
                    ? `${MONTHS[viewModel.currentMonth]} ${viewModel.currentYear}`
                    : viewModel.monthAndYearText
                }
                <span class="calendar--picker-chevron">&#9662;</span>
              </button>

              ${
                this.pickerOpen
                  ? `
                <div class="calendar--picker-dropdown">
                  <div class="calendar--picker-year-row">
                    <button
                      type="button"
                      class="calendar--picker-year-arrow"
                      data-action="year-prev"
                      ${viewModel.currentYear <= minYear ? 'disabled' : ''}
                      aria-label="Previous year"
                    >&#8249;</button>
                    <input
                      type="text"
                      class="calendar--picker-year-input${!this.yearInputValid ? ' invalid' : ''}"
                      value="${this.yearInput || viewModel.currentYear}"
                      data-year-input
                      aria-label="Year"
                    />
                    <button
                      type="button"
                      class="calendar--picker-year-arrow"
                      data-action="year-next"
                      ${viewModel.currentYear >= maxYear ? 'disabled' : ''}
                      aria-label="Next year"
                    >&#8250;</button>
                  </div>

                  <div class="calendar--picker-months">
                    ${(this.props.useShortMonthNames ? MONTHS : MONTHS_FULL)
                      .map((month, index) => {
                        const isSelected = index === viewModel.currentMonth;
                        const isCurrent =
                          index === todayMonth &&
                          viewModel.currentYear === todayYear;
                        return `
                        <button
                          type="button"
                          class="calendar--picker-month${isSelected ? ' selected' : ''}${isCurrent ? ' current-month' : ''}"
                          data-action="select-month"
                          data-month="${index}"
                        >${month}</button>
                      `;
                      })
                      .join('')}
                  </div>
                </div>
              `
                  : ''
              }
            </div>

            <button
              type="button"
              class="calendar--today-btn"
              data-action="today"
              ${isCurrentMonth ? 'disabled' : ''}
            >Today</button>

            <button type="button" class="calendar--nav-arrow" data-action="next" aria-label="Next month">
              &#8250;
            </button>
          </div>

          <table class="calendar--table calendar--table--bordered">
            <thead>
              <tr>
                ${viewModel.days.map(day => `<th>${day.slice(0, 3)}</th>`).join('')}
              </tr>
            </thead>
            <tbody data-calendar-body>
              ${viewModel.calendarDates
                .map(
                  week => `
                <tr>
                  ${week
                    .map((calendarDate, dayIndex) => {
                      const classes = getCellClasses(calendarDate);
                      const dateString = calendarDate.date.toISOString();
                      return `
                      <td
                        class="${classes.join(' ')}"
                        data-date="${dateString}"
                        data-day-index="${dayIndex}"
                        data-clickable="true"
                      >
                        ${calendarDate.date.getDate()}
                      </td>
                    `;
                    })
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          ${
            viewModel.selectedDate
              ? `
            <div class="date-popup ${viewModel.popupPositionClass}">
              <div class="popup-header">
                <h2>${viewModel.scheduleDay}</h2>
                <button type="button" class="popup-close" data-action="close-popup" aria-label="Close">✕</button>
              </div>

              ${
                showScrollHint
                  ? `
              <div class="scroll-hint">
                ↓ Scroll to see more events ↓
              </div>
              `
                  : ''
              }

              <div class="events-container">
                ${
                  viewModel.tasks.length > 0
                    ? `
                  ${viewModel.tasks.map(event => renderEvent(event)).join('')}
                `
                    : renderNoEvents()
                }
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Only attach delegated listeners once
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const minYear = this.props.minYear ?? todayYear - 30;
    const maxYear = this.props.maxYear ?? todayYear + 10;

    // Single delegated click handler for all actions
    this.delegatedClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Handle calendar date clicks
      const cell = target.closest('td[data-clickable="true"]') as HTMLElement;
      if (cell && cell.dataset.date) {
        e.stopPropagation(); // Prevent document handler from clearing selection after render
        const date = new Date(cell.dataset.date);
        const dayIndex = parseInt(cell.dataset.dayIndex || '0');
        this.engine.handleDateClick(date, dayIndex);
        this.container.dispatchEvent(
          new CustomEvent('dateSelect', { detail: { date, dayIndex } })
        );
        return;
      }

      // Handle button actions via data-action attribute
      const actionEl = target.closest('[data-action]') as HTMLElement;
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      e.stopPropagation();

      switch (action) {
        case 'previous':
          this.actions.previous();
          this.dispatchMonthChange();
          break;

        case 'next':
          this.actions.next();
          this.dispatchMonthChange();
          break;

        case 'today':
          this.actions.goToToday();
          this.pickerOpen = false;
          this.container.dispatchEvent(
            new CustomEvent('monthChange', {
              detail: { year: todayYear, month: todayMonth },
            })
          );
          break;

        case 'toggle-picker':
          this.pickerOpen = !this.pickerOpen;
          if (this.pickerOpen) {
            this.yearInput = String(this.engine.getViewModel().currentYear);
            this.yearInputValid = true;
          }
          this.render();
          break;

        case 'year-prev': {
          const vm = this.engine.getViewModel();
          if (vm.currentYear > minYear) {
            const newYear = vm.currentYear - 1;
            this.yearInput = String(newYear);
            this.updatePickerYear(newYear);
            this.actions.jump(newYear, vm.currentMonth);
            this.dispatchMonthChange();
          }
          break;
        }

        case 'year-next': {
          const vm = this.engine.getViewModel();
          if (vm.currentYear < maxYear) {
            const newYear = vm.currentYear + 1;
            this.yearInput = String(newYear);
            this.updatePickerYear(newYear);
            this.actions.jump(newYear, vm.currentMonth);
            this.dispatchMonthChange();
          }
          break;
        }

        case 'select-month': {
          const month = parseInt(actionEl.dataset.month || '0', 10);
          this.actions.jump(this.engine.getViewModel().currentYear, month);
          this.pickerOpen = false;
          this.dispatchMonthChange();
          break;
        }

        case 'close-popup':
          this.engine.clearSelection();
          break;
      }
    };

    // Delegated input handler for year input
    this.delegatedInputHandler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.matches('[data-year-input]')) return;

      const value = target.value;
      if (value === '' || /^\d+$/.test(value)) {
        this.yearInput = value;
        const year = parseInt(value, 10);
        this.yearInputValid =
          value === '' || (year >= minYear && year <= maxYear);
        // Update input styling without full re-render
        target.classList.toggle('invalid', !this.yearInputValid);
      }
    };

    // Delegated blur handler for year input
    this.delegatedBlurHandler = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (!target.matches('[data-year-input]')) return;

      const year = parseInt(this.yearInput, 10);
      const vm = this.engine.getViewModel();
      if (isNaN(year) || year < minYear || year > maxYear) {
        this.yearInput = String(vm.currentYear);
        this.yearInputValid = true;
        target.value = this.yearInput;
        target.classList.remove('invalid');
      } else if (year !== vm.currentYear) {
        this.actions.jump(year, vm.currentMonth);
        this.dispatchMonthChange();
      }
    };

    // Delegated keydown handler for year input
    this.delegatedKeydownHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement;
      if (!target.matches('[data-year-input]')) return;
      if (e.key === 'Enter') {
        target.blur();
      }
    };

    // Attach delegated listeners to container
    this.container.addEventListener('click', this.delegatedClickHandler);
    this.container.addEventListener('input', this.delegatedInputHandler);
    this.container.addEventListener('blur', this.delegatedBlurHandler, true);
    this.container.addEventListener('keydown', this.delegatedKeydownHandler);

    // Click outside handler for picker and popup
    this.clickOutsideHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Ignore clicks inside container (handled by delegated handler)
      if (this.container.contains(target)) return;

      // Close picker on outside click
      if (this.pickerOpen) {
        this.pickerOpen = false;
        this.render();
        return;
      }

      // Close popup on outside click
      const popup = this.container.querySelector('.date-popup');
      if (popup) {
        this.engine.clearSelection();
      }
    };

    document.addEventListener('click', this.clickOutsideHandler);
  }

  // Targeted update for picker year - avoids full DOM rebuild
  private updatePickerYear(year: number): void {
    const input = this.container.querySelector(
      '[data-year-input]'
    ) as HTMLInputElement;
    if (input) {
      input.value = String(year);
    }

    // Update year arrow disabled states
    const today = new Date();
    const todayYear = today.getFullYear();
    const minYear = this.props.minYear ?? todayYear - 30;
    const maxYear = this.props.maxYear ?? todayYear + 10;

    const prevBtn = this.container.querySelector(
      '[data-action="year-prev"]'
    ) as HTMLButtonElement;
    const nextBtn = this.container.querySelector(
      '[data-action="year-next"]'
    ) as HTMLButtonElement;

    if (prevBtn) prevBtn.disabled = year <= minYear;
    if (nextBtn) nextBtn.disabled = year >= maxYear;
  }

  private dispatchMonthChange(): void {
    const vm = this.engine.getViewModel();
    this.container.dispatchEvent(
      new CustomEvent('monthChange', {
        detail: { year: vm.currentYear, month: vm.currentMonth },
      })
    );
  }

  public updateEvents(events: import('../core').CalendarEvent[]): void {
    this.engine.updateEvents(events);
  }

  public updateTheme(theme: import('../core').CalendarTheme): void {
    this.props.theme = theme;
    this.applyTheme();
  }

  public getCurrentDate(): Date | null {
    return this.engine.getViewModel().selectedDate;
  }

  public goToDate(date: Date): void {
    this.actions.jump(date.getFullYear(), date.getMonth());
  }

  public getEngine(): CalendarEngine {
    return this.engine;
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Clean up delegated listeners
    if (this.delegatedClickHandler) {
      this.container.removeEventListener('click', this.delegatedClickHandler);
      this.delegatedClickHandler = null;
    }
    if (this.delegatedInputHandler) {
      this.container.removeEventListener('input', this.delegatedInputHandler);
      this.delegatedInputHandler = null;
    }
    if (this.delegatedBlurHandler) {
      this.container.removeEventListener(
        'blur',
        this.delegatedBlurHandler,
        true
      );
      this.delegatedBlurHandler = null;
    }
    if (this.delegatedKeydownHandler) {
      this.container.removeEventListener(
        'keydown',
        this.delegatedKeydownHandler
      );
      this.delegatedKeydownHandler = null;
    }
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }

    this.listenersAttached = false;
    this.engine.destroy();
    this.container.innerHTML = '';
    this.container.classList.remove('kalendly-calendar');

    if (this.props.className) {
      this.container.classList.remove(this.props.className);
    }
  }
}

export function createCalendar(
  props: VanillaCalendarProps
): VanillaCalendarInstance {
  return new VanillaCalendar(props);
}
