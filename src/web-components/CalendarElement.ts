import {
  CalendarEngine,
  getCellClasses,
  formatTimeRange,
  formatAttendees,
  MONTHS_FULL,
  MONTHS,
} from '../core';
import type { CalendarEvent, CalendarTheme, CategoryColorMap } from '../core';

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export class CalendarElement extends HTMLElement {
  static observedAttributes = [
    'initial-date',
    'min-year',
    'max-year',
    'week-starts-on',
    'title',
    'use-short-month-names',
    'availability-mode',
    'selectable',
    'loading',
  ];

  private engine: CalendarEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private actions: ReturnType<CalendarEngine['getActions']> | null = null;
  private pickerOpen = false;
  private yearInput = '';
  private yearInputValid = true;
  private listenersAttached = false;

  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  private delegatedClickHandler: ((e: MouseEvent) => void) | null = null;
  private delegatedInputHandler: ((e: Event) => void) | null = null;
  private delegatedBlurHandler: ((e: FocusEvent) => void) | null = null;
  private delegatedKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

  // Rich property backing fields
  private _events: CalendarEvent[] = [];
  private _theme: CalendarTheme | null = null;
  private _categoryColors: CategoryColorMap | null = null;
  private _renderEvent: ((e: CalendarEvent) => string) | null = null;
  private _renderNoEvents: (() => string) | null = null;

  // Selection state (availability mode — range)
  private _rangeStart: Date | null = null;
  private _rangeEnd: Date | null = null;
  private _timeRangeDate: Date | null = null;
  private _timeRangeStart: string | null = null;
  private _timeRangeEnd: string | null = null;
  private _timeRangeComplete = false;

  get events(): CalendarEvent[] {
    return this._events;
  }

  set events(val: CalendarEvent[]) {
    this._events = val;
    if (this.engine) {
      this.engine.updateEvents(val);
    }
  }

  set theme(val: CalendarTheme) {
    this._theme = val;
    this.applyTheme();
  }

  set categoryColors(val: CategoryColorMap) {
    this._categoryColors = val;
    if (this.engine) {
      this.engine.updateCategoryColors(val);
    }
  }

  set renderEvent(val: (e: CalendarEvent) => string) {
    this._renderEvent = val;
    if (this.engine) this.render();
    // ignored when availability-mode attribute is set
  }

  set renderNoEvents(val: () => string) {
    this._renderNoEvents = val;
    if (this.engine) this.render();
    // ignored when availability-mode attribute is set
  }

  get loading(): boolean {
    return this.hasAttribute('loading');
  }

  set loading(val: boolean) {
    if (val) this.setAttribute('loading', '');
    else this.removeAttribute('loading');
  }

  connectedCallback(): void {
    this.classList.add('kalendly-calendar');
    this.initEngine();
    this.render();
  }

  disconnectedCallback(): void {
    this.cleanup();
    this.classList.remove('kalendly-calendar');
    this.innerHTML = '';
  }

  attributeChangedCallback(
    name: string,
    oldVal: string | null,
    newVal: string | null
  ): void {
    if (oldVal === newVal) return;
    if (name === 'loading') {
      this.render();
      return;
    }
    if (name === 'selectable' && newVal === null) {
      this._rangeStart = null;
      this._rangeEnd = null;
      this._timeRangeDate = null;
      this._timeRangeStart = null;
      this._timeRangeEnd = null;
      this._timeRangeComplete = false;
    }
    this.reinit();
  }

  private get minYear(): number {
    const val = this.getAttribute('min-year');
    return val ? parseInt(val, 10) : new Date().getFullYear() - 30;
  }

  private get maxYear(): number {
    const val = this.getAttribute('max-year');
    return val ? parseInt(val, 10) : new Date().getFullYear() + 10;
  }

  private initEngine(): void {
    const initialDateAttr = this.getAttribute('initial-date');
    const initialDate = initialDateAttr ? new Date(initialDateAttr) : undefined;
    const weekStartsOnAttr = this.getAttribute('week-starts-on');
    const weekStartsOn: 0 | 1 = weekStartsOnAttr === '1' ? 1 : 0;

    this.engine = new CalendarEngine({
      events: this._events,
      initialDate,
      minYear: this.minYear,
      maxYear: this.maxYear,
      weekStartsOn,
      categoryColors: this._categoryColors ?? undefined,
    });

    this.actions = this.engine.getActions();
    this.applyTheme();

    this.unsubscribe = this.engine.subscribe(() => {
      this.render();
    });
  }

  private reinit(): void {
    if (!this.engine) return;
    this.cleanup();
    this.initEngine();
    this.render();
  }

  private cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.delegatedClickHandler) {
      this.removeEventListener('click', this.delegatedClickHandler);
      this.delegatedClickHandler = null;
    }
    if (this.delegatedInputHandler) {
      this.removeEventListener('input', this.delegatedInputHandler);
      this.delegatedInputHandler = null;
    }
    if (this.delegatedBlurHandler) {
      this.removeEventListener('blur', this.delegatedBlurHandler, true);
      this.delegatedBlurHandler = null;
    }
    if (this.delegatedKeydownHandler) {
      this.removeEventListener('keydown', this.delegatedKeydownHandler);
      this.delegatedKeydownHandler = null;
    }
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }

    this.listenersAttached = false;

    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }

    this.actions = null;
  }

  private applyTheme(): void {
    if (!this._theme) return;
    const root = document.documentElement;
    const t = this._theme;
    if (t.primary)
      root.style.setProperty('--calendar-primary-color', t.primary);
    if (t.secondary)
      root.style.setProperty('--calendar-secondary-color', t.secondary);
    if (t.tertiary)
      root.style.setProperty('--calendar-tertiary-color', t.tertiary);
    if (t.textColor)
      root.style.setProperty('--calendar-text-color', t.textColor);
    if (t.textLight)
      root.style.setProperty('--calendar-text-light', t.textLight);
    if (t.background)
      root.style.setProperty('--calendar-background', t.background);
    if (t.cellHover)
      root.style.setProperty('--calendar-cell-hover', t.cellHover);
    if (t.borderColor)
      root.style.setProperty('--calendar-border-color', t.borderColor);
    if (t.todayOutline)
      root.style.setProperty('--calendar-today-outline', t.todayOutline);
    if (t.selectedBg)
      root.style.setProperty('--calendar-selected-bg', t.selectedBg);
    if (t.eventIndicator)
      root.style.setProperty('--calendar-event-indicator', t.eventIndicator);
  }

  private render(): void {
    if (!this.engine) return;

    const viewModel = this.engine.getViewModel();
    const useShortMonths = this.hasAttribute('use-short-month-names');
    const title = this.getAttribute('title');
    const minYear = this.minYear;
    const maxYear = this.maxYear;
    const availabilityMode = this.getAttribute('availability-mode');
    const selectable = this.hasAttribute('selectable');
    const isLoading = this.loading;

    const today = new Date();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const isCurrentMonth =
      viewModel.currentYear === todayYear &&
      viewModel.currentMonth === todayMonth;

    const showScrollHint = viewModel.tasks.length > 3;

    const defaultRenderEvent = (event: CalendarEvent) => {
      const timeRange = formatTimeRange(event);
      const attendeesList = formatAttendees(event.attendees);

      let borderColor = event.color || '#3b82f6';
      if (event.category) {
        borderColor = this.engine!.getCategoryColor(event.category);
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

    const renderEvent = this._renderEvent || defaultRenderEvent;
    const renderNoEvents = this._renderNoEvents || defaultRenderNoEvents;

    const renderTimeGrid = (events: CalendarEvent[], date: Date): string => {
      const isHourBooked = (hour: number): boolean =>
        events.some(event => {
          if (!event.startTime || !event.endTime) return true;
          const [startH] = (event.startTime as string).split(':').map(Number);
          const [endH] = (event.endTime as string).split(':').map(Number);
          return hour >= startH && hour < endH;
        });

      const slots = Array.from({ length: 24 }, (_, hour) => {
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
        const booked = isHourBooked(hour);

        const inTimeRange =
          !booked &&
          selectable &&
          this._timeRangeStart !== null &&
          this._timeRangeEnd !== null &&
          isSameDay(this._timeRangeDate!, date) &&
          startTime >= this._timeRangeStart &&
          endTime <= this._timeRangeEnd;

        const isRangeStart = inTimeRange && startTime === this._timeRangeStart;
        const isRangeEnd = inTimeRange && endTime === this._timeRangeEnd;
        const isInRange = inTimeRange && !isRangeStart && !isRangeEnd;

        const slotClasses = [
          'time-grid__slot',
          booked ? 'time-grid__slot--booked' : 'time-grid__slot--free',
          isRangeStart ? 'time-grid__slot--range-start' : '',
          isRangeEnd ? 'time-grid__slot--range-end' : '',
          isInRange ? 'time-grid__slot--in-range' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const slotAttrs =
          !booked && selectable
            ? `data-action="select-slot" data-start-time="${startTime}" data-end-time="${endTime}" data-date="${date.toISOString()}"`
            : '';

        return `
          <div class="${slotClasses}" ${slotAttrs}>
            <span class="time-grid__label">${startTime}</span>
            <span class="time-grid__status">${booked ? 'Booked' : 'Available'}</span>
          </div>`;
      });

      return `<div class="time-grid">${slots.join('')}</div>`;
    };

    const html = `
      ${
        title
          ? `
      <div class="page--title">
        <h1>${title}</h1>
      </div>
      `
          : ''
      }

      <div class="calendar--content">
        <div class="calendar--card">
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
                  useShortMonths
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
                    ${(useShortMonths ? MONTHS : MONTHS_FULL)
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
              ${
                isLoading
                  ? Array.from(
                      { length: 6 },
                      () =>
                        `<tr>${Array.from(
                          { length: 7 },
                          () =>
                            `<td class="calendar--skeleton" aria-hidden="true"></td>`
                        ).join('')}</tr>`
                    ).join('')
                  : viewModel.calendarDates
                      .map(
                        week => `
                    <tr>
                      ${week
                        .map((calendarDate, dayIndex) => {
                          const classes = getCellClasses(calendarDate);
                          if (availabilityMode && calendarDate.isCurrentMonth) {
                            classes.push(
                              calendarDate.hasEvents
                                ? 'availability--booked'
                                : 'availability--free'
                            );
                          }
                          if (
                            availabilityMode === 'day' &&
                            selectable &&
                            calendarDate.isCurrentMonth
                          ) {
                            const d = calendarDate.date;
                            if (
                              this._rangeStart &&
                              isSameDay(d, this._rangeStart)
                            )
                              classes.push('availability--range-start');
                            if (this._rangeEnd && isSameDay(d, this._rangeEnd))
                              classes.push('availability--range-end');
                            if (this._rangeStart && this._rangeEnd) {
                              if (d > this._rangeStart && d < this._rangeEnd)
                                classes.push('availability--in-range');
                            }
                          }
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
                      .join('')
              }
            </tbody>
          </table>

          ${
            !isLoading && availabilityMode !== 'day' && viewModel.selectedDate
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
                  availabilityMode === 'time'
                    ? renderTimeGrid(viewModel.tasks, viewModel.selectedDate!)
                    : viewModel.tasks.length > 0
                      ? viewModel.tasks
                          .map(event => renderEvent(event))
                          .join('')
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

    this.innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    const minYear = this.minYear;
    const maxYear = this.maxYear;

    this.delegatedClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const cell = target.closest('td[data-clickable="true"]') as HTMLElement;
      if (cell && cell.dataset.date) {
        e.stopPropagation();
        const date = new Date(cell.dataset.date);
        const dayIndex = parseInt(cell.dataset.dayIndex || '0');
        const availMode = this.getAttribute('availability-mode');
        const isSelectable = this.hasAttribute('selectable');

        if (availMode === 'day' && isSelectable) {
          const isBooked = cell.classList.contains('availability--booked');
          if (!isBooked) {
            let startDate: Date;
            let endDate: Date;
            if (this._rangeEnd !== null) {
              // State 2 (complete) → reset, start fresh
              this._rangeStart = date;
              this._rangeEnd = null;
              startDate = date;
              endDate = date;
            } else if (this._rangeStart === null) {
              // State 0 → first click
              this._rangeStart = date;
              startDate = date;
              endDate = date;
            } else {
              // State 1 → second click, complete the range if no booked day inside
              const [s, e] =
                this._rangeStart <= date
                  ? [this._rangeStart, date]
                  : [date, this._rangeStart];
              const cursor = new Date(s);
              cursor.setDate(cursor.getDate() + 1);
              let blocked = false;
              while (cursor < e) {
                if (this.engine!.getEventsForDate(cursor).length > 0) {
                  blocked = true;
                  break;
                }
                cursor.setDate(cursor.getDate() + 1);
              }
              if (blocked) {
                // Booked day inside range — reset, start fresh from this click
                this._rangeStart = date;
                this._rangeEnd = null;
              } else {
                this._rangeStart = s;
                this._rangeEnd = e;
              }
              startDate = this._rangeStart;
              endDate = this._rangeEnd ?? this._rangeStart;
            }
            this.dispatchEvent(
              new CustomEvent('cal-availability-select', {
                bubbles: true,
                composed: true,
                detail: { startDate, endDate },
              })
            );
          }
        }

        if (availMode === 'time') {
          // Reset time range when a new day is opened
          this._timeRangeDate = null;
          this._timeRangeStart = null;
          this._timeRangeEnd = null;
          this._timeRangeComplete = false;
        }

        this.engine!.handleDateClick(date, dayIndex);
        this.dispatchEvent(
          new CustomEvent('cal-date-select', {
            bubbles: true,
            composed: true,
            detail: { date, events: this.engine!.getEventsForDate(date) },
          })
        );
        return;
      }

      const actionEl = target.closest('[data-action]') as HTMLElement;
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      e.stopPropagation();

      switch (action) {
        case 'previous': {
          const vm = this.engine!.getViewModel();
          const tMonth = vm.currentMonth === 0 ? 11 : vm.currentMonth - 1;
          const tYear =
            vm.currentMonth === 0 ? vm.currentYear - 1 : vm.currentYear;
          this.dispatchMonthChange(tYear, tMonth);
          this.actions!.previous();
          break;
        }

        case 'next': {
          const vm = this.engine!.getViewModel();
          const tMonth = vm.currentMonth === 11 ? 0 : vm.currentMonth + 1;
          const tYear =
            vm.currentMonth === 11 ? vm.currentYear + 1 : vm.currentYear;
          this.dispatchMonthChange(tYear, tMonth);
          this.actions!.next();
          break;
        }

        case 'today': {
          const t = new Date();
          this.dispatchMonthChange(t.getFullYear(), t.getMonth());
          this.actions!.goToToday();
          this.pickerOpen = false;
          break;
        }

        case 'toggle-picker':
          this.pickerOpen = !this.pickerOpen;
          if (this.pickerOpen) {
            this.yearInput = String(this.engine!.getViewModel().currentYear);
            this.yearInputValid = true;
          }
          this.render();
          break;

        case 'year-prev': {
          const vm = this.engine!.getViewModel();
          if (vm.currentYear > minYear) {
            const newYear = vm.currentYear - 1;
            this.yearInput = String(newYear);
            this.updatePickerYear(newYear);
            this.dispatchMonthChange(newYear, vm.currentMonth);
            this.actions!.jump(newYear, vm.currentMonth);
          }
          break;
        }

        case 'year-next': {
          const vm = this.engine!.getViewModel();
          if (vm.currentYear < maxYear) {
            const newYear = vm.currentYear + 1;
            this.yearInput = String(newYear);
            this.updatePickerYear(newYear);
            this.dispatchMonthChange(newYear, vm.currentMonth);
            this.actions!.jump(newYear, vm.currentMonth);
          }
          break;
        }

        case 'select-month': {
          const month = parseInt(actionEl.dataset.month || '0', 10);
          const year = this.engine!.getViewModel().currentYear;
          this.dispatchMonthChange(year, month);
          this.actions!.jump(year, month);
          this.pickerOpen = false;
          break;
        }

        case 'close-popup':
          this._timeRangeDate = null;
          this._timeRangeStart = null;
          this._timeRangeEnd = null;
          this._timeRangeComplete = false;
          this.engine!.clearSelection();
          break;

        case 'select-slot': {
          const slotStart = actionEl.dataset.startTime!;
          const slotEnd = actionEl.dataset.endTime!;
          const slotDate = new Date(actionEl.dataset.date!);
          if (this._timeRangeComplete) {
            // State 2 → reset, start fresh
            this._timeRangeDate = slotDate;
            this._timeRangeStart = slotStart;
            this._timeRangeEnd = slotEnd;
            this._timeRangeComplete = false;
          } else if (this._timeRangeStart === null) {
            // State 0 → first click
            this._timeRangeDate = slotDate;
            this._timeRangeStart = slotStart;
            this._timeRangeEnd = slotEnd;
          } else {
            // State 1 → second click, extend range
            const newStart =
              slotStart < this._timeRangeStart
                ? slotStart
                : this._timeRangeStart;
            const newEnd =
              slotEnd > this._timeRangeEnd! ? slotEnd : this._timeRangeEnd!;
            this._timeRangeStart = newStart;
            this._timeRangeEnd = newEnd;
            this._timeRangeComplete = true;
          }
          this.render();
          this.dispatchEvent(
            new CustomEvent('cal-availability-select', {
              bubbles: true,
              composed: true,
              detail: {
                date: this._timeRangeDate,
                startTime: this._timeRangeStart,
                endTime: this._timeRangeEnd,
              },
            })
          );
          break;
        }
      }
    };

    this.delegatedInputHandler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.matches('[data-year-input]')) return;

      const value = target.value;
      if (value === '' || /^\d+$/.test(value)) {
        this.yearInput = value;
        const year = parseInt(value, 10);
        this.yearInputValid =
          value === '' || (year >= minYear && year <= maxYear);
        target.classList.toggle('invalid', !this.yearInputValid);
      }
    };

    this.delegatedBlurHandler = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (!target.matches('[data-year-input]')) return;

      const year = parseInt(this.yearInput, 10);
      const vm = this.engine!.getViewModel();
      if (isNaN(year) || year < minYear || year > maxYear) {
        this.yearInput = String(vm.currentYear);
        this.yearInputValid = true;
        target.value = this.yearInput;
        target.classList.remove('invalid');
      } else if (year !== vm.currentYear) {
        this.dispatchMonthChange(year, vm.currentMonth);
        this.actions!.jump(year, vm.currentMonth);
      }
    };

    this.delegatedKeydownHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement;
      if (!target.matches('[data-year-input]')) return;
      if (e.key === 'Enter') target.blur();
    };

    this.addEventListener('click', this.delegatedClickHandler);
    this.addEventListener('input', this.delegatedInputHandler);
    this.addEventListener('blur', this.delegatedBlurHandler, true);
    this.addEventListener('keydown', this.delegatedKeydownHandler);

    this.clickOutsideHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (this.contains(target)) return;

      if (this.pickerOpen) {
        this.pickerOpen = false;
        this.render();
        return;
      }

      const popup = this.querySelector('.date-popup');
      if (popup) {
        this.engine!.clearSelection();
      }
    };

    document.addEventListener('click', this.clickOutsideHandler);
  }

  private updatePickerYear(year: number): void {
    const input = this.querySelector('[data-year-input]') as HTMLInputElement;
    if (input) input.value = String(year);

    const prevBtn = this.querySelector(
      '[data-action="year-prev"]'
    ) as HTMLButtonElement;
    const nextBtn = this.querySelector(
      '[data-action="year-next"]'
    ) as HTMLButtonElement;
    if (prevBtn) prevBtn.disabled = year <= this.minYear;
    if (nextBtn) nextBtn.disabled = year >= this.maxYear;
  }

  private dispatchMonthChange(year?: number, month?: number): void {
    if (!this.engine) return;
    const vm = this.engine.getViewModel();
    this.dispatchEvent(
      new CustomEvent('cal-month-change', {
        bubbles: true,
        composed: true,
        detail: {
          year: year ?? vm.currentYear,
          month: month ?? vm.currentMonth,
        },
      })
    );
  }

  // Public API
  updateEvents(events: CalendarEvent[]): void {
    this.events = events;
  }

  updateTheme(theme: CalendarTheme): void {
    this.theme = theme;
  }

  getCurrentDate(): Date | null {
    return this.engine?.getViewModel().selectedDate ?? null;
  }

  goToDate(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    this.dispatchMonthChange(year, month);
    this.actions?.jump(year, month);
  }

  getEngine(): CalendarEngine {
    if (!this.engine)
      throw new Error('CalendarElement is not connected to the DOM');
    return this.engine;
  }
}

export function defineCalendarElement(tagName = 'kal-calendar'): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, CalendarElement);
  }
}
