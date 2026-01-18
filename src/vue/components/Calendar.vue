<template>
  <div :class="['kalendly-calendar', props.class]" :style="props.style">
    <div v-if="title || $slots.title" class="page--title">
      <slot name="title">
        <h1>{{ title }}</h1>
      </slot>
    </div>

    <div class="calendar--content">
      <div class="calendar--card">
        <!-- Navigation Header -->
        <div class="calendar--nav-header">
          <button
            type="button"
            class="calendar--nav-arrow"
            aria-label="Previous month"
            @click="handlePrevious"
          >
            &#8249;
          </button>

          <div ref="pickerRef" class="calendar--picker-container">
            <button
              type="button"
              class="calendar--picker-btn"
              :aria-expanded="pickerOpen ? 'true' : 'false'"
              aria-haspopup="true"
              @click="togglePicker"
            >
              {{
                props.useShortMonthNames
                  ? `${MONTHS[viewModel.currentMonth]} ${viewModel.currentYear}`
                  : viewModel.monthAndYearText
              }}
              <span class="calendar--picker-chevron">&#9662;</span>
            </button>

            <div v-if="pickerOpen" class="calendar--picker-dropdown">
              <div class="calendar--picker-year-row">
                <button
                  type="button"
                  class="calendar--picker-year-arrow"
                  :disabled="viewModel.currentYear <= computedMinYear"
                  aria-label="Previous year"
                  @click="handleYearPrev"
                >
                  &#8249;
                </button>
                <input
                  type="text"
                  :class="[
                    'calendar--picker-year-input',
                    { invalid: !yearInputValid },
                  ]"
                  :value="yearInput"
                  aria-label="Year"
                  @input="handleYearInputChange"
                  @blur="handleYearInputBlur"
                  @keydown.enter="handleYearInputBlur"
                />
                <button
                  type="button"
                  class="calendar--picker-year-arrow"
                  :disabled="viewModel.currentYear >= computedMaxYear"
                  aria-label="Next year"
                  @click="handleYearNext"
                >
                  &#8250;
                </button>
              </div>

              <div class="calendar--picker-months">
                <button
                  v-for="(month, index) in props.useShortMonthNames
                    ? MONTHS
                    : MONTHS_FULL"
                  :key="month"
                  type="button"
                  :class="[
                    'calendar--picker-month',
                    { selected: index === viewModel.currentMonth },
                    {
                      'current-month':
                        index === todayMonth &&
                        viewModel.currentYear === todayYear,
                    },
                  ]"
                  @click="handleMonthSelect(index)"
                >
                  {{ month }}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="calendar--today-btn"
            :disabled="isCurrentMonth"
            @click="handleGoToToday"
          >
            Today
          </button>

          <button
            type="button"
            class="calendar--nav-arrow"
            aria-label="Next month"
            @click="handleNext"
          >
            &#8250;
          </button>
        </div>

        <table class="calendar--table calendar--table--bordered">
          <thead>
            <tr>
              <th v-for="day in viewModel.days" :key="day">
                {{ day.slice(0, 3) }}
              </th>
            </tr>
          </thead>
          <tbody @click="handleDateClick">
            <tr
              v-for="(week, weekIndex) in viewModel.calendarDates"
              :key="weekIndex"
            >
              <td
                v-for="(calendarDate, dayIndex) in week"
                :key="`${weekIndex}-${dayIndex}`"
                :class="getCellClasses(calendarDate)"
              >
                {{ calendarDate.date.getDate() }}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="viewModel.selectedDate"
          :class="['date-popup', viewModel.popupPositionClass]"
        >
          <div class="popup-header">
            <h2>{{ viewModel.scheduleDay }}</h2>
            <button
              type="button"
              class="popup-close"
              aria-label="Close"
              @click="handleClosePopup"
            >
              ✕
            </button>
          </div>

          <div v-if="showScrollHint" class="scroll-hint">
            ↓ Scroll to see more events ↓
          </div>

          <div class="events-container">
            <template v-if="viewModel.tasks.length > 0">
              <div
                v-for="event in viewModel.tasks"
                :key="event.id || event.name"
                class="event-card"
                :style="{ borderLeftColor: event.color }"
                style="cursor: pointer"
                @click="emit('event-click', event)"
              >
                <slot name="event" :event="event">
                  <div class="event-header">
                    <div class="event-title">{{ event.name }}</div>
                    <div class="event-badges">
                      <span
                        v-if="event.category"
                        :class="`badge category-${event.category}`"
                      >
                        {{ getCategoryLabel(event.category) }}
                      </span>
                      <span
                        v-if="event.priority"
                        :class="`badge priority-${event.priority}`"
                      >
                        {{ getPriorityLabel(event.priority) }}
                      </span>
                      <span
                        v-if="event.status && event.status !== 'scheduled'"
                        :class="`badge status-${event.status}`"
                      >
                        {{ getStatusLabel(event.status) }}
                      </span>
                    </div>
                  </div>

                  <div v-if="getTimeRange(event)" class="event-time">
                    <span class="event-time-label">Time:</span>
                    <span class="event-time-value">{{
                      getTimeRange(event)
                    }}</span>
                  </div>

                  <div v-if="event.description" class="event-description">
                    {{ event.description }}
                  </div>

                  <div v-if="event.location" class="event-time">
                    <span class="event-time-label">Location:</span>
                    <span class="event-time-value">{{ event.location }}</span>
                  </div>

                  <div
                    v-if="event.attendees && event.attendees.length > 0"
                    class="event-time"
                  >
                    <span class="event-time-label">Attendees:</span>
                    <span class="event-time-value">{{
                      formatAttendeesList(event.attendees)
                    }}</span>
                  </div>

                  <div v-if="event.organizer" class="event-time">
                    <span class="event-time-label">Organizer:</span>
                    <span class="event-time-value">{{ event.organizer }}</span>
                  </div>

                  <div v-if="event.notes" class="event-time">
                    <span class="event-time-label">Notes:</span>
                    <span class="event-time-value">{{ event.notes }}</span>
                  </div>

                  <div v-if="event.url" class="event-time">
                    <a
                      :href="event.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="event-link"
                      @click.stop
                    >
                      View Details →
                    </a>
                  </div>

                  <div
                    v-if="event.tags && event.tags.length > 0"
                    class="event-tags"
                  >
                    <span
                      v-for="(tag, idx) in event.tags"
                      :key="idx"
                      class="event-tag"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </slot>
              </div>
            </template>

            <div v-else class="no-events-message">
              <slot name="no-events"> No events scheduled for this day. </slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  CalendarEngine,
  getCellClasses as getCoreCellClasses,
  formatTimeRange,
  formatAttendees,
  MONTHS_FULL,
  MONTHS,
} from '../../core';
import type { VueCalendarProps } from '../types';
import type { CalendarEvent, CalendarDate } from '../../core/types';

const props = withDefaults(defineProps<VueCalendarProps>(), {
  events: () => [],
  weekStartsOn: 0,
  useShortMonthNames: false,
  class: '',
  style: () => ({}),
});

const emit = defineEmits<{
  'date-select': [date: Date];
  'event-click': [event: CalendarEvent];
  'month-change': [year: number, month: number];
}>();

const engine = new CalendarEngine({
  events: props.events,
  initialDate: props.initialDate,
  minYear: props.minYear,
  maxYear: props.maxYear,
  weekStartsOn: props.weekStartsOn,
});

const forceUpdate = ref(0);
const viewModel = computed(() => {
  void forceUpdate.value;
  return engine.getViewModel();
});

const showScrollHint = computed(() => viewModel.value.tasks.length > 3);

const actions = engine.getActions();

// Picker state
const pickerOpen = ref(false);
const yearInput = ref('');
const yearInputValid = ref(true);
const pickerRef = ref<HTMLElement | null>(null);

const today = new Date();
const todayMonth = today.getMonth();
const todayYear = today.getFullYear();
const computedMinYear = computed(() => props.minYear ?? todayYear - 30);
const computedMaxYear = computed(() => props.maxYear ?? todayYear + 10);

const isCurrentMonth = computed(() => {
  return (
    viewModel.value.currentYear === todayYear &&
    viewModel.value.currentMonth === todayMonth
  );
});

const getCellClasses = (calendarDate: CalendarDate | null) => {
  if (!calendarDate) return '';
  return getCoreCellClasses(calendarDate);
};

const getTimeRange = (event: CalendarEvent) => {
  return formatTimeRange(event);
};

const formatAttendeesList = (attendees: string[]) => {
  return formatAttendees(attendees);
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    work: 'WORK',
    personal: 'PERSONAL',
    meeting: 'MEETING',
    deadline: 'DEADLINE',
    appointment: 'APPOINTMENT',
    other: 'OTHER',
  };
  return labels[category] || category.toUpperCase();
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };
  return labels[priority] || priority.toUpperCase();
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
    tentative: 'TENTATIVE',
    scheduled: 'SCHEDULED',
  };
  return labels[status] || status.toUpperCase();
};

const handleDateClick = (event: Event) => {
  const td = (event.target as HTMLElement).closest('td');
  if (!td) return;

  const tr = td.parentElement as HTMLTableRowElement | null;
  if (!tr) return;

  const weekIndex = tr.rowIndex - 1;
  const dayIndex = Array.from(tr.children).indexOf(td);

  const calendarDate = viewModel.value.calendarDates[weekIndex]?.[dayIndex];
  if (!calendarDate) return;

  engine.handleDateClick(calendarDate.date, dayIndex);
  emit('date-select', calendarDate.date);
};

const handleNext = () => {
  actions.next();
  emit(
    'month-change',
    viewModel.value.currentYear,
    viewModel.value.currentMonth
  );
};

const handlePrevious = () => {
  actions.previous();
  emit(
    'month-change',
    viewModel.value.currentYear,
    viewModel.value.currentMonth
  );
};

const handleClosePopup = () => {
  engine.clearSelection();
};

const togglePicker = () => {
  pickerOpen.value = !pickerOpen.value;
  if (pickerOpen.value) {
    yearInput.value = String(viewModel.value.currentYear);
    yearInputValid.value = true;
  }
};

const handleGoToToday = () => {
  actions.goToToday();
  pickerOpen.value = false;
  emit('month-change', todayYear, todayMonth);
};

const handleYearInputChange = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  if (value === '' || /^\d+$/.test(value)) {
    yearInput.value = value;
    const year = parseInt(value, 10);
    yearInputValid.value =
      value === '' ||
      (year >= computedMinYear.value && year <= computedMaxYear.value);
  }
};

const handleYearInputBlur = () => {
  const year = parseInt(yearInput.value, 10);
  if (
    isNaN(year) ||
    year < computedMinYear.value ||
    year > computedMaxYear.value
  ) {
    yearInput.value = String(viewModel.value.currentYear);
    yearInputValid.value = true;
  } else {
    actions.jump(year, viewModel.value.currentMonth);
    emit('month-change', year, viewModel.value.currentMonth);
  }
};

const handleYearPrev = () => {
  const newYear = viewModel.value.currentYear - 1;
  if (newYear >= computedMinYear.value) {
    actions.jump(newYear, viewModel.value.currentMonth);
    yearInput.value = String(newYear);
    emit('month-change', newYear, viewModel.value.currentMonth);
  }
};

const handleYearNext = () => {
  const newYear = viewModel.value.currentYear + 1;
  if (newYear <= computedMaxYear.value) {
    actions.jump(newYear, viewModel.value.currentMonth);
    yearInput.value = String(newYear);
    emit('month-change', newYear, viewModel.value.currentMonth);
  }
};

const handleMonthSelect = (month: number) => {
  actions.jump(viewModel.value.currentYear, month);
  pickerOpen.value = false;
  emit('month-change', viewModel.value.currentYear, month);
};

const handleClickOutside = (event: MouseEvent) => {
  if (pickerRef.value && !pickerRef.value.contains(event.target as Node)) {
    pickerOpen.value = false;
  }
};

watch(
  () => props.events,
  newEvents => {
    engine.updateEvents(newEvents);
    forceUpdate.value++;
  },
  { deep: true }
);

watch(
  () => props.theme,
  newTheme => {
    if (newTheme) {
      const root = document.documentElement;
      if (newTheme.primary)
        root.style.setProperty('--calendar-primary-color', newTheme.primary);
      if (newTheme.secondary)
        root.style.setProperty(
          '--calendar-secondary-color',
          newTheme.secondary
        );
      if (newTheme.tertiary)
        root.style.setProperty('--calendar-tertiary-color', newTheme.tertiary);
      if (newTheme.textColor)
        root.style.setProperty('--calendar-text-color', newTheme.textColor);
      if (newTheme.textLight)
        root.style.setProperty('--calendar-text-light', newTheme.textLight);
      if (newTheme.background)
        root.style.setProperty('--calendar-background', newTheme.background);
      if (newTheme.cellHover)
        root.style.setProperty('--calendar-cell-hover', newTheme.cellHover);
      if (newTheme.borderColor)
        root.style.setProperty('--calendar-border-color', newTheme.borderColor);
      if (newTheme.todayOutline)
        root.style.setProperty(
          '--calendar-today-outline',
          newTheme.todayOutline
        );
      if (newTheme.selectedBg)
        root.style.setProperty('--calendar-selected-bg', newTheme.selectedBg);
      if (newTheme.eventIndicator)
        root.style.setProperty(
          '--calendar-event-indicator',
          newTheme.eventIndicator
        );
    }
  },
  { immediate: true, deep: true }
);

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = engine.subscribe(() => {
    forceUpdate.value++;
  });
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  unsubscribe?.();
  engine.destroy();
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>
