import {
  CalendarEngine,
  getCellClasses,
  formatTimeRange,
  formatAttendees,
} from '../core';
import { VanillaCalendarProps, VanillaCalendarInstance } from './types';

export class VanillaCalendar implements VanillaCalendarInstance {
  private engine: CalendarEngine;
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private props: VanillaCalendarProps;
  private actions: ReturnType<CalendarEngine['getActions']>;

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
          <h3 class="calendar--card--header">${viewModel.monthAndYearText}</h3>
          
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
                      const dateString = calendarDate
                        ? calendarDate.date.toISOString()
                        : '';
                      return `
                      <td 
                        class="${classes.join(' ')}" 
                        data-date="${dateString}"
                        data-day-index="${dayIndex}"
                        ${calendarDate ? 'data-clickable="true"' : ''}
                      >
                        ${calendarDate?.date.getDate() || ''}
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

          <div class="calendar--navigation--buttons">
            <button class="calendar--navigation--btn" data-action="previous">
              Previous
            </button>
            <button class="calendar--navigation--btn" data-action="next">
              Next
            </button>
          </div>

          <form class="calendar--form--jump">
            <div class="calendar--lead">Jump To:</div>
            <div>
              <label class="calendar--form--jump--item">
                <select data-month-select>
                  ${viewModel.months
                    .map(
                      (month, index) => `
                    <option value="${index}" ${index === viewModel.currentMonth ? 'selected' : ''}>
                      ${month}
                    </option>
                  `
                    )
                    .join('')}
                </select>
              </label>
            </div>
            <div>
              <label class="calendar--form--jump--item">
                <select data-year-select>
                  ${viewModel.years
                    .map(
                      year => `
                    <option value="${year}" ${year === viewModel.currentYear ? 'selected' : ''}>
                      ${year}
                    </option>
                  `
                    )
                    .join('')}
                </select>
              </label>
            </div>
          </form>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const tableBody = this.container.querySelector('[data-calendar-body]');
    if (tableBody) {
      tableBody.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const cell = target.closest('td[data-clickable="true"]') as HTMLElement;

        if (cell && cell.dataset.date) {
          const date = new Date(cell.dataset.date);
          const dayIndex = parseInt(cell.dataset.dayIndex || '0');
          this.engine.handleDateClick(date, dayIndex);

          this.container.dispatchEvent(
            new CustomEvent('dateSelect', {
              detail: { date, dayIndex },
            })
          );
        }
      });
    }

    const prevBtn = this.container.querySelector('[data-action="previous"]');
    const nextBtn = this.container.querySelector('[data-action="next"]');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.actions.previous();
        this.container.dispatchEvent(
          new CustomEvent('monthChange', {
            detail: {
              year: this.engine.getViewModel().currentYear,
              month: this.engine.getViewModel().currentMonth,
            },
          })
        );
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.actions.next();
        this.container.dispatchEvent(
          new CustomEvent('monthChange', {
            detail: {
              year: this.engine.getViewModel().currentYear,
              month: this.engine.getViewModel().currentMonth,
            },
          })
        );
      });
    }

    const monthSelect = this.container.querySelector(
      '[data-month-select]'
    ) as HTMLSelectElement;
    const yearSelect = this.container.querySelector(
      '[data-year-select]'
    ) as HTMLSelectElement;

    if (monthSelect) {
      monthSelect.addEventListener('change', e => {
        const target = e.target as HTMLSelectElement;
        const month = parseInt(target.value);
        const year = this.engine.getViewModel().currentYear;
        this.actions.jump(year, month);

        this.container.dispatchEvent(
          new CustomEvent('monthChange', {
            detail: { year, month },
          })
        );
      });
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', e => {
        const target = e.target as HTMLSelectElement;
        const year = parseInt(target.value);
        const month = this.engine.getViewModel().currentMonth;
        this.actions.jump(year, month);

        this.container.dispatchEvent(
          new CustomEvent('monthChange', {
            detail: { year, month },
          })
        );
      });
    }

    const closeBtn = this.container.querySelector(
      '[data-action="close-popup"]'
    );
    if (closeBtn) {
      closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.engine.clearSelection();
      });
    }

    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const popup = this.container.querySelector('.date-popup');

      if (
        popup &&
        !popup.contains(target) &&
        !target.closest('[data-calendar-body]')
      ) {
        this.engine.clearSelection();
      }
    });
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
