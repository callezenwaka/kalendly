import { CalendarEngine, getCellClasses } from '../core';
import { VanillaCalendarProps, VanillaCalendarInstance } from './types';

export class VanillaCalendar implements VanillaCalendarInstance {
  private engine: CalendarEngine;
  private container: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private props: VanillaCalendarProps;
  private actions: ReturnType<CalendarEngine['getActions']>;

  constructor(props: VanillaCalendarProps) {
    this.props = props;

    // Get container element
    if (typeof props.container === 'string') {
      const element = document.querySelector(props.container);
      if (!element) {
        throw new Error(`Container element "${props.container}" not found`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = props.container;
    }

    // Initialize engine
    this.engine = new CalendarEngine({
      events: props.events,
      initialDate: props.initialDate,
      minYear: props.minYear,
      maxYear: props.maxYear,
      weekStartsOn: props.weekStartsOn,
    });

    // Cache actions for event handlers
    this.actions = this.engine.getActions();

    this.init();
  }

  private init(): void {
    // Add CSS class to container
    this.container.classList.add('kalendly-calendar');
    if (this.props.className) {
      this.container.classList.add(this.props.className);
    }

    // Subscribe to engine changes
    this.unsubscribe = this.engine.subscribe(() => {
      this.render();
    });

    // Initial render
    this.render();
  }

  private render(): void {
    const viewModel = this.engine.getViewModel();

    const defaultRenderEvent = (event: any) =>
      `<li class="event--item">${event.name}</li>`;
    const defaultRenderNoEvents = () =>
      '<div class="no-events-message">No events scheduled for this day.</div>';

    const renderEvent = this.props.renderEvent || defaultRenderEvent;
    const renderNoEvents = this.props.renderNoEvents || defaultRenderNoEvents;

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
                  (week, weekIndex) => `
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
              <button type="button" class="popup-close" data-action="close-popup" aria-label="Close">✕</button>
              <div class="schedule--wrapper">
                <div class="schedule--block">
                  <h2 class="schedule--day">${viewModel.scheduleDay}</h2>
                </div>
                ${
                  viewModel.tasks.length > 0
                    ? `
                  <div class="event--wrapper">
                    <ul>
                      ${viewModel.tasks.map(event => renderEvent(event)).join('')}
                    </ul>
                  </div>
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
    // Date cell clicks
    const tableBody = this.container.querySelector('[data-calendar-body]');
    if (tableBody) {
      tableBody.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const cell = target.closest('td[data-clickable="true"]') as HTMLElement;

        if (cell && cell.dataset.date) {
          const date = new Date(cell.dataset.date);
          const dayIndex = parseInt(cell.dataset.dayIndex || '0');
          this.engine.handleDateClick(date, dayIndex);

          // Trigger custom event
          this.container.dispatchEvent(
            new CustomEvent('dateSelect', {
              detail: { date, dayIndex },
            })
          );
        }
      });
    }

    // Navigation buttons
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

    // Month/Year selects
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

    // Close popup button
    const closeBtn = this.container.querySelector(
      '[data-action="close-popup"]'
    );
    if (closeBtn) {
      closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.engine.clearSelection();
      });
    }

    // Close popup on outside click
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

  // Public API methods
  public updateEvents(events: import('../core').CalendarEvent[]): void {
    this.engine.updateEvents(events);
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

// Factory function for easier usage
export function createCalendar(
  props: VanillaCalendarProps
): VanillaCalendarInstance {
  return new VanillaCalendar(props);
}
