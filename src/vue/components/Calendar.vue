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
          <button
            type="button"
            class="popup-close"
            aria-label="Close"
            @click="handleClosePopup"
          >
            ✕
          </button>
          <div class="schedule--wrapper">
            <div class="schedule--block">
              <h2 class="schedule--day">
                {{ viewModel.scheduleDay }}
              </h2>
            </div>

            <div v-if="viewModel.tasks.length > 0" class="event--wrapper">
              <ul>
                <li
                  v-for="event in viewModel.tasks"
                  :key="event.id || event.name"
                  class="event--item"
                  style="cursor: pointer"
                  @click="emit('event-click', event)"
                >
                  <slot name="event" :event="event">
                    {{ event.name }}
                  </slot>
                </li>
              </ul>
            </div>

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
  // Trigger reactivity when forceUpdate changes
  void forceUpdate.value;
  return engine.getViewModel();
});

const actions = engine.getActions();

const getCellClasses = (calendarDate: CalendarDate | null) => {
  if (!calendarDate) return '';
  return getCoreCellClasses(calendarDate);
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

// Watch for prop changes
watch(
  () => props.events,
  newEvents => {
    engine.updateEvents(newEvents);
    forceUpdate.value++;
  },
  { deep: true }
);

// Subscribe to engine updates
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
