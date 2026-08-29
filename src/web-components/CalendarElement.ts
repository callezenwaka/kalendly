import {
  CalendarEngine,
  getCellClasses,
  formatTimeRange,
  formatAttendees,
  bookedSlots,
  formatMinutes,
  parseHourRanges,
  isDateWithinWindow,
  isDayAllowed,
  DEFAULT_SLOT_DURATION,
  MINUTES_PER_DAY,
  escapeHtml,
  slugifyToken,
  safeUrl,
  safeColor,
  MONTHS_FULL,
  MONTHS,
} from '../core';
import type {
  CalendarEvent,
  CalendarTheme,
  CalendarPane,
  CategoryColorMap,
} from '../core';

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export class CalendarElement extends HTMLElement {
  static observedAttributes = [
    'initial-date',
    'min-year',
    'max-year',
    'min-date',
    'max-date',
    'available-days',
    'available-hours',
    'week-starts-on',
    'heading',
    'months',
    'slot-duration',
    'title',
    'use-short-month-names',
    'availability-mode',
    'selectable',
    'loading',
  ];

  private static readonly themeMap: Record<keyof CalendarTheme, string> = {
    primary: '--kalendly-primary-color',
    secondary: '--kalendly-secondary-color',
    tertiary: '--kalendly-tertiary-color',
    textColor: '--kalendly-text-color',
    textLight: '--kalendly-text-light',
    background: '--kalendly-background',
    cellHover: '--kalendly-cell-hover',
    borderColor: '--kalendly-border-color',
    todayOutline: '--kalendly-today-outline',
    selectedBg: '--kalendly-selected-bg',
    outOfRangeBg: '--kalendly-out-of-range-bg',
    outOfRangeFg: '--kalendly-out-of-range-fg',
    navArrowFg: '--kalendly-nav-arrow-fg',
    navArrowBg: '--kalendly-nav-arrow-bg',
    navArrowBorder: '--kalendly-nav-arrow-border',
    navArrowHoverFg: '--kalendly-nav-arrow-hover-fg',
    navArrowHoverBg: '--kalendly-nav-arrow-hover-bg',
    inputInvalidBg: '--kalendly-input-invalid-bg',
    popupHeaderFg: '--kalendly-popup-header-fg',
    popupCloseFg: '--kalendly-popup-close-fg',
    popupCloseBg: '--kalendly-popup-close-bg',
    popupCloseHoverBg: '--kalendly-popup-close-hover-bg',
    headerBg: '--kalendly-header-bg',
    popupBg: '--kalendly-popup-bg',
    pickerBg: '--kalendly-picker-bg',
    pickerShadow: '--kalendly-picker-shadow',
    eventIndicator: '--kalendly-event-indicator',
    onAccent: '--kalendly-on-accent',
    link: '--kalendly-link',
    openBg: '--kalendly-open-bg',
    openFg: '--kalendly-open-fg',
    conditionalBg: '--kalendly-conditional-bg',
    conditionalFg: '--kalendly-conditional-fg',
    blockedBg: '--kalendly-blocked-bg',
    blockedFg: '--kalendly-blocked-fg',
    rangeBg: '--kalendly-range-bg',
    rangeOutline: '--kalendly-range-outline',
    inRangeBg: '--kalendly-in-range-bg',
    inRangeOutline: '--kalendly-in-range-outline',
    badgeBg: '--kalendly-badge-bg',
    badgeText: '--kalendly-badge-text',
    badgeSuccessBg: '--kalendly-badge-success-bg',
    badgeSuccessText: '--kalendly-badge-success-text',
    badgeInfoBg: '--kalendly-badge-info-bg',
    badgeInfoText: '--kalendly-badge-info-text',
    badgeWarningBg: '--kalendly-badge-warning-bg',
    badgeWarningText: '--kalendly-badge-warning-text',
    badgeDangerBg: '--kalendly-badge-danger-bg',
    badgeDangerText: '--kalendly-badge-danger-text',
    badgeNeutralBg: '--kalendly-badge-neutral-bg',
    badgeNeutralText: '--kalendly-badge-neutral-text',
    badgePositiveBg: '--kalendly-badge-positive-bg',
    badgePositiveText: '--kalendly-badge-positive-text',
    badgeTentativeBg: '--kalendly-badge-tentative-bg',
    badgeTentativeText: '--kalendly-badge-tentative-text',
  };

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
  private _availabilityColors: Record<string, string> | null = null;
  private _selectableStatuses: string[] | null = null;
  private _initError: Error | null = null;
  private pendingUpdate: Promise<void> | null = null;

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
    this._initError = null;
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

  get availabilityColors(): Record<string, string> {
    return this._availabilityColors ?? {};
  }

  set availabilityColors(val: Record<string, string>) {
    this._initError = null;
    this._availabilityColors = val;
    if (this.engine) this.scheduleRender();
  }

  get selectableStatuses(): string[] {
    return this._selectableStatuses ?? [];
  }

  set selectableStatuses(val: string[]) {
    this._selectableStatuses = val;
    if (this.engine) this.scheduleRender();
  }

  set renderEvent(val: (e: CalendarEvent) => string) {
    this._renderEvent = val;
    if (this.engine) this.scheduleRender();
    // ignored when availability-mode attribute is set
  }

  set renderNoEvents(val: () => string) {
    this._renderNoEvents = val;
    if (this.engine) this.scheduleRender();
    // ignored when availability-mode attribute is set
  }

  get loading(): boolean {
    return this.hasAttribute('loading');
  }

  set loading(val: boolean) {
    if (val) this.setAttribute('loading', '');
    else this.removeAttribute('loading');
  }

  // Custom element reactions report rather than propagate, so a failure here
  // is kept and resurfaced at the next call the integrator makes
  private reaction(run: () => void): void {
    try {
      run();
    } catch (error) {
      this._initError = error as Error;
      throw error;
    }
  }

  connectedCallback(): void {
    this.classList.add('kalendly');
    this.reaction(() => {
      this.initEngine();
      this.render();
    });
  }

  disconnectedCallback(): void {
    this.cleanup();
    this.classList.remove('kalendly');
    this.innerHTML = '';
  }

  attributeChangedCallback(
    name: string,
    oldVal: string | null,
    newVal: string | null
  ): void {
    if (oldVal === newVal) return;
    if (name === 'loading') {
      this.scheduleRender();
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

  private get headingText(): string | null {
    const heading = this.getAttribute('heading');
    if (heading !== null) return heading;

    const title = this.getAttribute('title');
    if (title !== null && !CalendarElement.titleDeprecationWarned) {
      CalendarElement.titleDeprecationWarned = true;
      console.warn(
        `<kal-calendar> the title attribute is deprecated and will be removed ` +
          `in a future release — use heading instead. title is a global HTML ` +
          `attribute, so the browser also renders it as a tooltip over the ` +
          `whole calendar.`
      );
    }
    return title;
  }

  private static warnedMissingEnd = new Set<string>();

  private get slotDuration(): number {
    const raw = this.getAttribute('slot-duration');
    if (raw === null) return DEFAULT_SLOT_DURATION;

    const minutes = Number(raw);
    if (
      Number.isInteger(minutes) &&
      minutes > 0 &&
      MINUTES_PER_DAY % minutes === 0
    ) {
      return minutes;
    }

    console.warn(
      `<kal-calendar> slot-duration="${raw}" must be a positive whole number of ` +
        `minutes that divides ${MINUTES_PER_DAY} — falling back to ` +
        `${DEFAULT_SLOT_DURATION}.`
    );
    return DEFAULT_SLOT_DURATION;
  }

  private warnMissingEndTime(events: CalendarEvent[]): void {
    for (const event of events) {
      if (!event.startTime || event.endTime) continue;

      const key = String(event.id);
      if (CalendarElement.warnedMissingEnd.has(key)) continue;
      CalendarElement.warnedMissingEnd.add(key);

      console.warn(
        `<kal-calendar> event ${key} has startTime but no endTime — occupying ` +
          `one ${this.slotDuration}-minute slot. Send an endTime to say how long ` +
          `it runs.`
      );
    }
  }

  private get monthCount(): number {
    const requested = Number(this.getAttribute('months') ?? 1);
    if (!Number.isInteger(requested) || requested < 1) return 1;

    return Math.min(requested, 2);
  }

  private get minYear(): number {
    const val = this.getAttribute('min-year');
    return val ? parseInt(val, 10) : new Date().getFullYear() - 30;
  }

  private get maxYear(): number {
    const val = this.getAttribute('max-year');
    return val ? parseInt(val, 10) : new Date().getFullYear() + 10;
  }

  private boundaryDate(attr: 'min-date' | 'max-date'): Date | null {
    const val = this.getAttribute(attr);
    if (!val) return null;

    const parsed = new Date(val);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(
        `<kal-calendar> ${attr} is unreadable: "${val}". Use a value Date can ` +
          `parse, the same as initial-date.`
      );
    }

    return parsed;
  }

  private get availableDays(): number[] | null {
    const val = this.getAttribute('available-days');
    if (val === null) return null;

    const parts = val
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      throw new Error(
        `<kal-calendar> available-days is empty. Omit the attribute to allow ` +
          `every day, or name at least one weekday.`
      );
    }

    return parts.map(part => {
      const day = Number(part);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw new Error(
          `<kal-calendar> available-days must list integers 0-6, 0 = Sunday. ` +
            `Got "${part}".`
        );
      }
      return day;
    });
  }

  private get availableHours(): Array<[number, number]> | null {
    const val = this.getAttribute('available-hours');
    if (val === null) return null;

    return parseHourRanges(val, this.slotDuration);
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
      monthCount: this.monthCount,
    });

    this.actions = this.engine.getActions();
    this.applyTheme();

    this.unsubscribe = this.engine.subscribe(() => {
      this.scheduleRender();
    });
  }

  private reinit(): void {
    if (!this.engine) return;
    this.cleanup();
    this.initEngine();
    this.scheduleRender();
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
    for (const key of Object.keys(CalendarElement.themeMap) as Array<
      keyof CalendarTheme
    >) {
      const value = this._theme[key];
      if (value) root.style.setProperty(CalendarElement.themeMap[key], value);
    }
  }

  private static readonly BUILT_IN_BUCKETS = ['blocked', 'conditional', 'open'];

  private static titleDeprecationWarned = false;

  private get knownBuckets(): string[] {
    return [
      ...CalendarElement.BUILT_IN_BUCKETS,
      ...Object.keys(this._availabilityColors ?? {}),
    ];
  }

  get updateComplete(): Promise<void> {
    return this.pendingUpdate ?? Promise.resolve();
  }

  private scheduleRender(): void {
    if (this.pendingUpdate) return;

    this.pendingUpdate = Promise.resolve().then(() => {
      this.pendingUpdate = null;
      try {
        this.render();
      } catch (error) {
        this._initError = error as Error;
        throw error;
      }
    });
  }

  private rethrowInitError(): void {
    if (this._initError) throw this._initError;
  }

  private assertStatusesDeclared(): void {
    if (!this.getAttribute('availability-mode')) return;

    const missing = this._events
      .filter(
        event =>
          typeof event.availabilityStatus !== 'string' ||
          event.availabilityStatus === ''
      )
      .map(event => String(event.id));

    if (missing.length) {
      throw new Error(
        `<kal-calendar> availability-mode requires availabilityStatus on every ` +
          `event. Missing on: ${missing.join(', ')}.`
      );
    }
  }

  private assertStatusesKnown(): void {
    const known = new Set(this.knownBuckets);
    const unknown = this._events
      .filter(event => !known.has(event.availabilityStatus as string))
      .map(event => `${event.id} (${event.availabilityStatus})`);

    if (unknown.length) {
      throw new Error(
        `<kal-calendar> availabilityStatus must name a built-in bucket ` +
          `(${CalendarElement.BUILT_IN_BUCKETS.join(', ')}) or a key of ` +
          `availabilityColors. Unrecognised on: ${unknown.join(', ')}.`
      );
    }
  }

  private resolveBucket(date: Date): string {
    if (!this.engine) return 'open';

    const declared = new Set(
      this.engine
        .getEventsForDate(date)
        .map(event => event.availabilityStatus as string)
    );
    if (declared.size === 0) return 'open';

    return this.knownBuckets.find(bucket => declared.has(bucket)) as string;
  }

  private assertHorizonOrdered(): void {
    const min = this.boundaryDate('min-date');
    const max = this.boundaryDate('max-date');

    if (min && max && min.getTime() > max.getTime()) {
      throw new Error(
        `<kal-calendar> min-date is after max-date: ` +
          `"${this.getAttribute('min-date')}" > "${this.getAttribute('max-date')}".`
      );
    }
  }

  // Whether the vendor offers this day at all, before any event is considered.
  private isDateOffered(date: Date): boolean {
    return (
      isDateWithinWindow(
        date,
        this.boundaryDate('min-date'),
        this.boundaryDate('max-date')
      ) && isDayAllowed(date, this.availableDays)
    );
  }

  private isDateSelectable(date: Date): boolean {
    if (!this.engine) return false;
    if (!this.isDateOffered(date)) return false;

    if (this._selectableStatuses) {
      return this._selectableStatuses.includes(this.resolveBucket(date));
    }

    return this.engine.getEventsForDate(date).length === 0;
  }

  private render(): void {
    if (!this.engine) return;

    const viewModel = this.engine.getViewModel();
    const useShortMonths = this.hasAttribute('use-short-month-names');
    const title = this.headingText;
    const minYear = this.minYear;
    const maxYear = this.maxYear;
    const availabilityMode = this.getAttribute('availability-mode');
    const selectable = this.hasAttribute('selectable');
    const isLoading = this.loading;

    if (availabilityMode) {
      this.assertStatusesDeclared();
      this.assertStatusesKnown();
    }

    // Up front, not in the grid: the grid only renders once a day is open.
    this.boundaryDate('min-date');
    this.boundaryDate('max-date');
    void this.availableDays;
    void this.availableHours;
    this.assertHorizonOrdered();

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

      let borderColor = safeColor(event.color || '#3b82f6');
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
        <div class="kalendly-event-card" style="border-left-color: ${borderColor}">
          <div class="kalendly-event-header">
            ${event.name ? `<div class="kalendly-event-title">${escapeHtml(event.name)}</div>` : ''}
            <div class="kalendly-event-badges">
              ${event.category ? `<span class="kalendly-badge kalendly-category-${slugifyToken(event.category)}">${escapeHtml(getCategoryLabel(event.category))}</span>` : ''}
              ${event.priority ? `<span class="kalendly-badge kalendly-priority-${slugifyToken(event.priority)}">${escapeHtml(getPriorityLabel(event.priority))}</span>` : ''}
              ${event.status && event.status !== 'scheduled' ? `<span class="kalendly-badge kalendly-status-${slugifyToken(event.status)}">${escapeHtml(getStatusLabel(event.status))}</span>` : ''}
            </div>
          </div>

          ${
            timeRange
              ? `
          <div class="kalendly-event-time">
            <span class="kalendly-event-time-label">Time:</span>
            <span class="kalendly-event-time-value">${escapeHtml(timeRange)}</span>
          </div>
          `
              : ''
          }

          ${
            event.description
              ? `
          <div class="kalendly-event-description">${escapeHtml(event.description)}</div>
          `
              : ''
          }

          ${
            event.location
              ? `
          <div class="kalendly-event-time">
            <span class="kalendly-event-time-label">Location:</span>
            <span class="kalendly-event-time-value">${escapeHtml(event.location)}</span>
          </div>
          `
              : ''
          }

          ${
            attendeesList
              ? `
          <div class="kalendly-event-time">
            <span class="kalendly-event-time-label">Attendees:</span>
            <span class="kalendly-event-time-value">${escapeHtml(attendeesList)}</span>
          </div>
          `
              : ''
          }

          ${
            event.organizer
              ? `
          <div class="kalendly-event-time">
            <span class="kalendly-event-time-label">Organizer:</span>
            <span class="kalendly-event-time-value">${escapeHtml(event.organizer)}</span>
          </div>
          `
              : ''
          }

          ${
            event.notes
              ? `
          <div class="kalendly-event-time">
            <span class="kalendly-event-time-label">Notes:</span>
            <span class="kalendly-event-time-value">${escapeHtml(event.notes)}</span>
          </div>
          `
              : ''
          }

          ${
            event.url
              ? `
          <div class="kalendly-event-time">
            <a href="${escapeHtml(safeUrl(event.url as string))}" target="_blank" rel="noopener noreferrer" class="kalendly-event-link">
              View Details →
            </a>
          </div>
          `
              : ''
          }

          ${
            event.tags && event.tags.length > 0
              ? `
          <div class="kalendly-event-tags">
            ${event.tags.map((tag: string) => `<span class="kalendly-event-tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
          `
              : ''
          }
        </div>
      `;
    };

    const defaultRenderNoEvents = () =>
      '<div class="kalendly-no-events-message">No events scheduled for this day.</div>';

    const renderEvent = this._renderEvent || defaultRenderEvent;
    const renderNoEvents = this._renderNoEvents || defaultRenderNoEvents;

    const renderTimeGrid = (date: Date): string => {
      const slotDuration = this.slotDuration;

      // A booking crossing midnight belongs to the day it started on, so the
      // previous day's events are needed to mark the morning it runs into
      const previousDay = new Date(date);
      previousDay.setDate(previousDay.getDate() - 1);
      const events = [
        ...this.engine!.getEventsForDate(previousDay),
        ...this.engine!.getEventsForDate(date),
      ];

      this.warnMissingEndTime(events);
      const booked = bookedSlots(events, date, slotDuration);

      const hours = this.availableHours;

      const slots = booked.map((isBooked, index) => {
        const slotStart = index * slotDuration;
        const slotEnd = slotStart + slotDuration;
        const startTime = formatMinutes(slotStart);
        const endTime = formatMinutes(slotEnd);

        const offered =
          hours === null ||
          hours.some(([from, to]) => slotStart >= from && slotEnd <= to);

        const inTimeRange =
          offered &&
          !isBooked &&
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
          'kalendly-time-grid-slot',
          offered ? '' : 'kalendly-time-grid-slot-out-of-range',
          isBooked ? 'kalendly-time-grid-slot-blocked' : 'kalendly-time-grid-slot-open',
          isRangeStart ? 'kalendly-time-grid-slot-range-start' : '',
          isRangeEnd ? 'kalendly-time-grid-slot-range-end' : '',
          isInRange ? 'kalendly-time-grid-slot-in-range' : '',
        ]
          .filter(Boolean)
          .join(' ');

        // No data-action outside the offered hours, so cal-slot-select stays
        // silent for a slot the vendor never put up for sale.
        const slotAttrs =
          `${offered ? 'data-action="select-slot" ' : ''}` +
          `data-start-time="${startTime}" ` +
          `data-end-time="${endTime}" data-date="${date.toISOString()}" ` +
          `data-booked="${isBooked}"`;

        const status = !offered ? 'Closed' : isBooked ? 'Booked' : 'Available';

        return `
          <div class="${slotClasses}" ${slotAttrs}>
            <span class="kalendly-time-grid-label">${startTime}</span>
            <span class="kalendly-time-grid-status">${status}</span>
          </div>`;
      });

      const gridClasses = selectable
        ? 'kalendly-time-grid kalendly-time-grid-selectable'
        : 'kalendly-time-grid';

      return `<div class="${gridClasses}">${slots.join('')}</div>`;
    };

    const multiMonth = viewModel.panes.length > 1;

    const renderPane = (pane: CalendarPane): string => `
        <div class="kalendly-pane">
          ${
            multiMonth
              ? `<div class="kalendly-pane-caption">${escapeHtml(pane.monthAndYearText)}</div>`
              : ''
          }
            <table class="kalendly-table kalendly-table-bordered">
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
                              `<td class="kalendly-skeleton" aria-hidden="true"></td>`
                          ).join('')}</tr>`
                      ).join('')
                    : pane.calendarDates
                        .map(
                          week => `
                      <tr>
                        ${week
                          .map((calendarDate, dayIndex) => {
                            const classes = getCellClasses(calendarDate);
                            const cellAttrs: string[] = [];

                            if (
                              viewModel.selectedDate &&
                              isSameDay(
                                calendarDate.date,
                                viewModel.selectedDate
                              )
                            ) {
                              classes.push('kalendly-cell-selected');
                            }
                            if (availabilityMode) {
                              const bucket = this.resolveBucket(
                                calendarDate.date
                              );
                              const custom = (this._availabilityColors ?? {})[
                                bucket
                              ];

                              classes.push(
                                `kalendly-availability-${slugifyToken(bucket)}`
                              );
                              if (custom) {
                                classes.push('kalendly-availability-status');
                                cellAttrs.push(
                                  `style="--kalendly-availability-color: ${escapeHtml(safeColor(custom))}"`
                                );
                              }
                              if (!this.isDateSelectable(calendarDate.date)) {
                                classes.push('kalendly-availability-unselectable');
                              }
                              cellAttrs.push(
                                `aria-label="${escapeHtml(bucket)}"`
                              );
                            }
                            if (availabilityMode === 'day' && selectable) {
                              const d = calendarDate.date;
                              if (
                                this._rangeStart &&
                                isSameDay(d, this._rangeStart)
                              )
                                classes.push('kalendly-availability-range-start');
                              if (
                                this._rangeEnd &&
                                isSameDay(d, this._rangeEnd)
                              )
                                classes.push('kalendly-availability-range-end');
                              if (this._rangeStart && this._rangeEnd) {
                                if (d > this._rangeStart && d < this._rangeEnd)
                                  classes.push('kalendly-availability-in-range');
                              }
                            }
                            const dateString = calendarDate.date.toISOString();
                            // Not offered means not a click target at all: no
                            // data-clickable, so neither the delegated handler
                            // nor the hover rule ever sees the cell.
                            const offered = this.isDateOffered(
                              calendarDate.date
                            );
                            if (!offered) {
                              classes.push('kalendly-cell-out-of-range');
                            }
                            return `
                            <td
                              class="${classes.join(' ')}"
                              data-date="${dateString}"
                              data-day-index="${dayIndex}"
                              ${offered ? 'data-clickable="true"' : ''}
                              ${cellAttrs.join(' ')}
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
        </div>
      `;
    const html = `
      ${
        title
          ? `
      <div class="kalendly-title">
        <h1>${escapeHtml(title)}</h1>
      </div>
      `
          : ''
      }

      <div class="kalendly-content">
        <div class="kalendly-card">
          <div class="kalendly-nav-header">
            <button type="button" class="kalendly-nav-arrow" data-action="previous" aria-label="Previous month">
              &#8249;
            </button>

            <div class="kalendly-picker-container" data-picker-container>
              <button
                type="button"
                class="kalendly-picker-btn"
                data-action="toggle-picker"
                aria-expanded="${this.pickerOpen ? 'true' : 'false'}"
                aria-haspopup="true"
              >
                ${
                  useShortMonths
                    ? `${MONTHS[viewModel.currentMonth]} ${viewModel.currentYear}`
                    : viewModel.monthAndYearText
                }
                <span class="kalendly-picker-chevron">&#9662;</span>
              </button>

              ${
                this.pickerOpen
                  ? `
                <div class="kalendly-picker-dropdown">
                  <div class="kalendly-picker-year-row">
                    <button
                      type="button"
                      class="kalendly-picker-year-arrow"
                      data-action="year-prev"
                      ${viewModel.currentYear <= minYear ? 'disabled' : ''}
                      aria-label="Previous year"
                    >&#8249;</button>
                    <input
                      type="text"
                      class="kalendly-picker-year-input${!this.yearInputValid ? ' kalendly-invalid' : ''}"
                      value="${escapeHtml(this.yearInput || viewModel.currentYear)}"
                      data-year-input
                      aria-label="Year"
                    />
                    <button
                      type="button"
                      class="kalendly-picker-year-arrow"
                      data-action="year-next"
                      ${viewModel.currentYear >= maxYear ? 'disabled' : ''}
                      aria-label="Next year"
                    >&#8250;</button>
                  </div>

                  <div class="kalendly-picker-months">
                    ${(useShortMonths ? MONTHS : MONTHS_FULL)
                      .map((month, index) => {
                        const isSelected = index === viewModel.currentMonth;
                        const isCurrent =
                          index === todayMonth &&
                          viewModel.currentYear === todayYear;
                        return `
                        <button
                          type="button"
                          class="kalendly-picker-month${isSelected ? ' kalendly-selected' : ''}${isCurrent ? ' kalendly-current-month' : ''}"
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
              class="kalendly-today-btn"
              data-action="today"
              ${isCurrentMonth ? 'disabled' : ''}
            >Today</button>

            <button type="button" class="kalendly-nav-arrow" data-action="next" aria-label="Next month">
              &#8250;
            </button>
          </div>

          <div class="kalendly-panes">
            ${viewModel.panes.map(renderPane).join('')}
          </div>

          ${
            !isLoading && availabilityMode !== 'day' && viewModel.selectedDate
              ? `
            <div class="kalendly-popup">
              <div class="kalendly-popup-header">
                <h2>${viewModel.scheduleDay}</h2>
                <button type="button" class="kalendly-popup-close" data-action="close-popup" aria-label="Close">✕</button>
              </div>

              ${
                showScrollHint
                  ? `
              <div class="kalendly-scroll-hint">
                ↓ Scroll to see more events ↓
              </div>
              `
                  : ''
              }

              <div class="kalendly-events-container">
                ${
                  availabilityMode === 'time'
                    ? renderTimeGrid(viewModel.selectedDate!)
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
          if (this.isDateSelectable(date)) {
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
                if (!this.isDateSelectable(cursor)) {
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

        this.engine!.handleDateClick(date, dayIndex, { navigate: false });
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
          const slotBooked = actionEl.dataset.booked === 'true';

          // Reported for every slot, the way cal-date-select is for every day.
          // selectable gates the range machine below, not the click itself.
          this.dispatchEvent(
            new CustomEvent('cal-slot-select', {
              bubbles: true,
              composed: true,
              detail: {
                date: slotDate,
                startTime: slotStart,
                endTime: slotEnd,
                booked: slotBooked,
              },
            })
          );

          if (slotBooked || !this.hasAttribute('selectable')) break;

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
        target.classList.toggle('kalendly-invalid', !this.yearInputValid);
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
        target.classList.remove('kalendly-invalid');
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

      const popup = this.querySelector('.kalendly-popup');
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
    this.rethrowInitError();
    return this.engine?.getViewModel().selectedDate ?? null;
  }

  goToDate(date: Date): void {
    this.rethrowInitError();
    const year = date.getFullYear();
    const month = date.getMonth();
    this.dispatchMonthChange(year, month);
    this.actions?.jump(year, month);
  }

  getEngine(): CalendarEngine {
    this.rethrowInitError();
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

declare global {
  interface HTMLElementTagNameMap {
    'kal-calendar': CalendarElement;
  }
}
