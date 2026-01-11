<template>
  <div :class="['kalendly-calendar', props.class]" :style="props.style">
    <div v-if="title || $slots.title" class="page--title">
      <slot name="title">
        <h1>{{ title }}</h1>
      </slot>
    </div>

    <div class="calendar--content">
      <div class="calendar--card">
        <h3 class="calendar--card--header">
          {{ viewModel.monthAndYearText }}
        </h3>

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
                {{ calendarDate?.date.getDate() || '' }}
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

        <div class="calendar--navigation--buttons">
          <button class="calendar--navigation--btn" @click="handlePrevious">
            Previous
          </button>
          <button class="calendar--navigation--btn" @click="handleNext">
            Next
          </button>
        </div>

        <form class="calendar--form--jump">
          <div class="calendar--lead">Jump To:</div>
          <div>
            <label class="calendar--form--jump--item">
              <select
                :value="viewModel.currentMonth"
                @change="handleMonthChange"
              >
                <option
                  v-for="(month, index) in viewModel.months"
                  :key="index"
                  :value="index"
                >
                  {{ month }}
                </option>
              </select>
            </label>
          </div>
          <div>
            <label class="calendar--form--jump--item">
              <select :value="viewModel.currentYear" @change="handleYearChange">
                <option
                  v-for="year in viewModel.years"
                  :key="year"
                  :value="year"
                >
                  {{ year }}
                </option>
              </select>
            </label>
          </div>
        </form>
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
} from '../../core';
import type { VueCalendarProps } from '../types';
import type { CalendarEvent, CalendarDate } from '../../core/types';

const props = withDefaults(defineProps<VueCalendarProps>(), {
  events: () => [],
  weekStartsOn: 0,
  title: 'Event Schedule',
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

  const cellContent = td.textContent?.trim();
  if (!cellContent) return;

  const clickedDate = new Date(
    viewModel.value.currentYear,
    viewModel.value.currentMonth,
    parseInt(cellContent)
  );

  const dayIndex = td.parentNode
    ? Array.from(td.parentNode.children).indexOf(td)
    : 0;
  engine.handleDateClick(clickedDate, dayIndex);

  emit('date-select', clickedDate);
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

const handleMonthChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const month = parseInt(select.value);
  actions.jump(viewModel.value.currentYear, month);
  emit('month-change', viewModel.value.currentYear, month);
};

const handleYearChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const year = parseInt(select.value);
  actions.jump(year, viewModel.value.currentMonth);
  emit('month-change', year, viewModel.value.currentMonth);
};

const handleClosePopup = () => {
  engine.clearSelection();
};

watch(
  () => props.events,
  newEvents => {
    engine.updateEvents(newEvents);
    forceUpdate.value++;
  },
  { deep: true }
);

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = engine.subscribe(() => {
    forceUpdate.value++;
  });
});

onUnmounted(() => {
  unsubscribe?.();
  engine.destroy();
});
</script>
