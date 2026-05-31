# kalendly

A universal calendar web component — works in React, Vue, Svelte, Angular, Solid.js, and plain HTML with no framework dependency.

## Features

- **Framework-agnostic**: Single `<kal-calendar>` custom element, no framework required
- **Responsive**: Mobile-friendly, matches your existing UI
- **Themeable**: CSS variables + JS property API
- **Type Safe**: Full TypeScript support
- **Event-rich**: Categories, priorities, time ranges, attendees, and more
- **Availability mode**: Day and time views for booking flows — hides event details, shows booked/free cells
- **Lazy loading**: Per-month on-demand fetch with skeleton shimmer state
- **Accessible**: Built with accessibility in mind
- **Tree-shakeable**: Import only what you need

## Live Demo

<div align="center">

[![Kalendly Calendar Demo](./docs/images/calendar-demo.gif)](https://kalendly-example.netlify.app/)

**[Try the Interactive Demo →](https://kalendly-example.netlify.app/)**

</div>

<p align="center">
  <a href="https://kalendly-example.netlify.app/vanilla">
    <img src="https://img.shields.io/badge/Vanilla_JS-fc8917?style=for-the-badge&logo=javascript&logoColor=white" alt="Vanilla JS Demo"/>
  </a>
  <a href="https://kalendly-example.netlify.app/react">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Demo"/>
  </a>
  <a href="https://kalendly-example.netlify.app/vue">
    <img src="https://img.shields.io/badge/Vue-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue Demo"/>
  </a>
  <a href="https://kalendly-example.netlify.app/angular">
    <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular Demo"/>
  </a>
  <a href="https://kalendly-example.netlify.app/svelte">
    <img src="https://img.shields.io/badge/Svelte-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="Svelte Demo"/>
  </a>
  <a href="https://kalendly-example.netlify.app/solid">
    <img src="https://img.shields.io/badge/Solid.js-2C4F7C?style=for-the-badge&logo=solid&logoColor=white" alt="Solid.js Demo"/>
  </a>
</p>

## Installation

```bash
npm install kalendly
```

## Usage

### Vanilla HTML / CDN

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/kalendly/dist/styles/calendar.css"
/>
<script src="https://unpkg.com/kalendly/dist/index.umd.js"></script>

<kal-calendar id="cal" title="My Calendar"></kal-calendar>

<script>
  const cal = document.getElementById('cal');

  // Set events (JS property — not an attribute)
  cal.events = [
    { id: 1, name: 'Team Meeting', date: new Date(2025, 0, 15) },
    { id: 2, name: 'Project Deadline', date: new Date(2025, 0, 20) },
  ];

  // Listen to custom events
  cal.addEventListener('cal-date-select', e => {
    console.log('Selected:', e.detail.date, e.detail.events);
  });

  cal.addEventListener('cal-month-change', e => {
    console.log('Month:', e.detail.year, e.detail.month);
  });
</script>
```

### ES Modules

```js
import 'kalendly';
import 'kalendly/styles';

// <kal-calendar> is now registered and ready
```

### React 19

React 19 has full custom element support — pass objects/arrays as props and listen to custom events directly.

```jsx
import 'kalendly';
import 'kalendly/styles';

function App() {
  return (
    <kal-calendar
      title="My Calendar"
      events={events}
      oncal-date-select={e => console.log(e.detail.date)}
      oncal-month-change={e => console.log(e.detail.year, e.detail.month)}
    />
  );
}
```

> **React 18 users:** React 18 does not forward object/array props or custom events to custom elements. You need to wire these up via a `ref`:
>
> ```jsx
> import { useRef, useEffect } from 'react';
> import 'kalendly';
>
> function Calendar({ events, onDateSelect, onMonthChange, ...attrs }) {
>   const ref = useRef(null);
>
>   useEffect(() => {
>     if (ref.current) ref.current.events = events;
>   }, [events]);
>
>   useEffect(() => {
>     const el = ref.current;
>     if (!el) return;
>     const onSelect = e => onDateSelect?.(e.detail.date, e.detail.events);
>     const onChange = e => onMonthChange?.(e.detail.year, e.detail.month);
>     el.addEventListener('cal-date-select', onSelect);
>     el.addEventListener('cal-month-change', onChange);
>     return () => {
>       el.removeEventListener('cal-date-select', onSelect);
>       el.removeEventListener('cal-month-change', onChange);
>     };
>   }, [onDateSelect, onMonthChange]);
>
>   return <kal-calendar ref={ref} {...attrs} />;
> }
> ```

### Vue 3

Vue 3 supports custom elements natively — bind props with `:` and listen to events with `@`.

> **Vue-specific:** Vue's template compiler warns on unknown tags. React, Solid.js, and Svelte treat hyphenated tags as DOM elements natively — no config needed. Angular uses `CUSTOM_ELEMENTS_SCHEMA` (see the Angular section below).

Tell Vue's compiler that `<kal-*>` tags are native custom elements. The config location depends on your build tool:

**Vite** (`vite.config.ts`):

```ts
vue({
  template: {
    compilerOptions: {
      isCustomElement: tag => tag.startsWith('kal-'),
    },
  },
});
```

**Nuxt 3** (`nuxt.config.ts`):

```ts
export default defineNuxtConfig({
  vue: {
    compilerOptions: {
      isCustomElement: tag => tag.startsWith('kal-'),
    },
  },
});
```

**webpack / Vue CLI** (`vue.config.js`):

```js
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => ({
        ...options,
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('kal-'),
        },
      }));
  },
};
```

Without this the component still renders correctly — Vue falls back to a native DOM element. This only suppresses the console warning.

```vue
<template>
  <kal-calendar
    title="My Calendar"
    :events="events"
    @cal-date-select="onDateSelect"
    @cal-month-change="onMonthChange"
  />
</template>

<script setup>
import 'kalendly';
import 'kalendly/styles';

const events = [{ id: 1, name: 'Team Meeting', date: new Date(2025, 0, 15) }];

function onDateSelect(e) {
  console.log('Selected:', e.detail.date);
}

function onMonthChange(e) {
  console.log('Month:', e.detail.year, e.detail.month);
}
</script>
```

### Angular

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// app.component.ts
import 'kalendly';
import 'kalendly/styles';
```

```html
<!-- app.component.html -->
<kal-calendar
  title="My Calendar"
  [events]="events"
  (cal-date-select)="onDateSelect($event)"
  (cal-month-change)="onMonthChange($event)"
></kal-calendar>
```

### Svelte 5

```svelte
<script>
  import 'kalendly';
  import 'kalendly/styles';
  let { events = [] } = $props();
</script>

<kal-calendar {events} oncal-date-select={e => console.log(e.detail.date)} />
```

### Svelte 4

```svelte
<script>
  import { onMount } from 'svelte';
  import 'kalendly';
  import 'kalendly/styles';
  export let events = [];
  let calEl;
  onMount(() => { calEl.events = events; });
  $: if (calEl) calEl.events = events;
</script>

<kal-calendar bind:this={calEl} on:cal-date-select on:cal-month-change />
```

### Solid.js

```jsx
import 'kalendly';
import 'kalendly/styles';

function App() {
  return (
    <kal-calendar
      title="My Calendar"
      prop:events={events}
      on:cal-date-select={e => console.log(e.detail.date)}
    />
  );
}
```

## Styling

### Loading styles

```js
// Bundler (Vite, webpack) — add once in your app entry (e.g. main.tsx)
import 'kalendly/styles';

// Plain HTML
// <link rel="stylesheet" href="/node_modules/kalendly/dist/styles/calendar.css">

// Angular — add to angular.json → projects → architect → build → styles
// "node_modules/kalendly/dist/styles/calendar.css"
```

### Overriding styles

kalendly uses Light DOM — all standard CSS techniques work:

```css
/* 1. CSS custom properties (recommended) */
:root {
  --calendar-primary-color: #6366f1;
  --calendar-background: #1e1e2e;
  --calendar-border-color: #334155;
}

/* 2. Direct class overrides */
.kalendly-calendar .calendar--card {
  border-radius: 12px;
}
```

```js
// 3. JS theme property
document.querySelector('kal-calendar').theme = {
  primary: '#6366f1',
  background: '#1e1e2e',
};
```

## Attributes

Primitives are set as HTML attributes:

| Attribute               | Type             | Default          | Description                                      |
| ----------------------- | ---------------- | ---------------- | ------------------------------------------------ |
| `title`                 | `string`         | —                | Calendar title                                   |
| `initial-date`          | `string`         | today            | ISO date string for initial view                 |
| `min-year`              | `string`         | currentYear - 30 | Minimum year in picker                           |
| `max-year`              | `string`         | currentYear + 10 | Maximum year in picker                           |
| `week-starts-on`        | `"0"\|"1"`       | `"0"`            | Week start: 0 = Sunday, 1 = Monday               |
| `use-short-month-names` | `string`         | —                | Present = use abbreviated month names            |
| `availability-mode`     | `"day"\|"time"`  | —                | Hides event details; shows booked/free cells     |
| `selectable`            | `"range"`        | —                | Enables day/slot selection (requires avail mode) |
| `loading`               | `boolean` (flag) | —                | Present = render skeleton shimmer cells          |

## Properties

Rich objects are set as JS properties (not attributes):

| Property         | Type                               | Description                                       |
| ---------------- | ---------------------------------- | ------------------------------------------------- |
| `events`         | `CalendarEvent[]`                  | Events to display                                 |
| `loading`        | `boolean`                          | `true` = render skeleton cells; `false` = restore |
| `theme`          | `CalendarTheme`                    | Custom theme colors                               |
| `categoryColors` | `CategoryColorMap`                 | Per-category color overrides                      |
| `renderEvent`    | `(event: CalendarEvent) => string` | Custom event HTML renderer                        |
| `renderNoEvents` | `() => string`                     | Custom empty-state HTML renderer                  |

> `renderEvent` and `renderNoEvents` are ignored when `availability-mode` is set.

## Custom Events

| Event                     | `detail` shape                                                         | Description                            |
| ------------------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| `cal-date-select`         | `{ date: Date, events: CalendarEvent[] }`                              | User clicked a date (normal mode)      |
| `cal-month-change`        | `{ year: number, month: number }`                                      | Fires **before** the new month renders |
| `cal-availability-select` | `{ startDate: Date, endDate: Date }` or `{ date, startTime, endTime }` | Day/slot selected in availability mode |

All events bubble and are composed (cross Shadow DOM boundaries).

`cal-availability-select` detail shape depends on mode:

- **Day mode** (`availability-mode="day"`): `{ startDate: Date, endDate: Date }` — first click gives `startDate === endDate`; second click extends the range; third click resets
- **Time mode** (`availability-mode="time"`): `{ date: Date, startTime: string, endTime: string }` — first click selects a single slot; second click extends; third click resets

## Availability Mode

Hides all event details from the end user — only booked/free state is shown. Designed for scheduling and booking flows where the server's event data must not be exposed to the viewer.

### Day view

```html
<kal-calendar availability-mode="day"></kal-calendar>
```

Days with events are tinted red (booked); days without events are tinted green (free). Only cells in the current month are colour-coded — other-month cells remain grayed out. Clicking a day fires no popup and reveals no event details.

<div align="center">
  <img src="./docs/images/day.png" alt="Availability day view — month grid with red booked cells and green free cells"/>
  <p><em>Day view: the month grid shows only booked/free state per day — event names, times, and attendees are never revealed</em></p>
</div>

Pass the minimal event shape — only `id` and `date` are required; `startTime`/`endTime` are optional and mark the whole day as booked regardless:

```js
cal.events = [
  { id: 1, date: new Date(2025, 4, 8) },
  { id: 2, date: new Date(2025, 4, 8), startTime: '14:00', endTime: '16:00' },
  { id: 3, date: new Date(2025, 4, 20), startTime: '10:00', endTime: '12:00' },
];
```

### Time view

```html
<kal-calendar availability-mode="time"></kal-calendar>
```

Clicking a day opens a popup with a 24-slot hourly grid (00:00 – 23:00). Each slot shows only "Booked" or "Available" — no event name or organiser is ever rendered. A slot is booked if any event's time window overlaps that hour; the rest are free.

<div align="center">
  <img src="./docs/images/time.png" alt="Availability time view — day popup showing 24 hourly slots coloured red (booked) or green (available)"/>
  <p><em>Time view: clicking a day opens an hourly grid — booked slots in red, available slots in green; no event details exposed</em></p>
</div>

### Selectable range

Add `selectable="range"` to let the user pick a free day or time slot:

```html
<kal-calendar availability-mode="day" selectable="range"></kal-calendar>
<kal-calendar availability-mode="time" selectable="range"></kal-calendar>
```

```js
// Day mode — fires on every click
cal.addEventListener('cal-availability-select', e => {
  const { startDate, endDate } = e.detail;
  console.log('Selected:', startDate, '→', endDate);
});

// Time mode — fires on every slot click
cal.addEventListener('cal-availability-select', e => {
  const { date, startTime, endTime } = e.detail;
  console.log('Slot:', date, startTime, '–', endTime);
});
```

Booked days/slots cannot be selected. The 3-click state machine: first click selects, second extends, third resets.

## Lazy Event Fetching

`cal-month-change` fires **before** the new month renders, so you can set `loading = true` synchronously — the calendar shows skeleton shimmer cells from the first frame with no empty-calendar flash.

```js
cal.addEventListener('cal-month-change', async ({ detail }) => {
  const { year, month } = detail;
  cal.loading = true;
  cal.events = await fetchEvents(year, month); // your API call
  cal.loading = false;
});
```

The "dump all events upfront" pattern still works unchanged — `cal-month-change` is optional:

```js
// Load once, component handles all months
cal.events = allEvents;
```

## Core API

`querySelector('kal-calendar')` returns `CalendarElement | null` automatically — no cast needed:

```ts
import type { CalendarElement } from 'kalendly';

const cal = document.querySelector('kal-calendar'); // CalendarElement | null
cal?.goToDate(new Date());
cal?.updateEvents(events);
cal?.updateTheme(theme);
cal?.getCurrentDate(); // Date | null
cal?.getEngine(); // CalendarEngine
```

**JavaScript** works the same way without the import:

```js
const cal = document.querySelector('kal-calendar');

cal.updateEvents(newEvents);
cal.updateTheme(newTheme);
cal.goToDate(new Date());
cal.getCurrentDate();
cal.getEngine();
```

## CalendarEvent Interface

```typescript
interface CalendarEvent {
  id: string | number;
  name: string;
  date: string | Date;

  startTime?: string; // e.g. "09:00"
  endTime?: string; // e.g. "10:00"
  allDay?: boolean;

  description?: string;
  color?: string;
  category?:
    | 'work'
    | 'personal'
    | 'meeting'
    | 'deadline'
    | 'appointment'
    | 'other';
  location?: string;
  url?: string;

  status?: 'scheduled' | 'completed' | 'cancelled' | 'tentative';
  priority?: 'low' | 'medium' | 'high';

  attendees?: string[];
  organizer?: string;
  reminders?: number[]; // minutes before event
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: string | Date;
    daysOfWeek?: number[];
  };

  notes?: string;
  tags?: string[];
  [key: string]: unknown;
}
```

## Theming

### All CSS variables

```css
:root {
  --calendar-primary-color: #fc8917;
  --calendar-secondary-color: #fca045;
  --calendar-tertiary-color: #fdb873;
  --calendar-text-color: #2c3e50;
  --calendar-text-light: #6b7280;
  --calendar-border-color: #dee2e6;
  --calendar-today-outline: #f7db04;
  --calendar-event-indicator: #1890ff;
  --calendar-background: #fff;
  --calendar-cell-hover: #f3f4f6;
  --calendar-selected-bg: #eff6ff;
}
```

### JS theme property (full reference)

```js
cal.theme = {
  primary: '#3b82f6',
  secondary: '#60a5fa',
  tertiary: '#93c5fd',
  textColor: '#111827',
  textLight: '#6b7280',
  background: '#ffffff',
  cellHover: '#f3f4f6',
  borderColor: '#e5e7eb',
  todayOutline: '#fbbf24',
  selectedBg: '#eff6ff',
  eventIndicator: '#10b981',
};
```

### Dark theme example

```js
cal.theme = {
  primary: '#6366f1',
  secondary: '#818cf8',
  textColor: '#f9fafb',
  textLight: '#d1d5db',
  background: '#1f2937',
  cellHover: '#374151',
  borderColor: '#4b5563',
  todayOutline: '#fbbf24',
  selectedBg: '#312e81',
  eventIndicator: '#34d399',
};
```

## Core Engine (advanced)

```typescript
import { CalendarEngine } from 'kalendly/core';

const engine = new CalendarEngine({ events, initialDate: new Date() });

const unsubscribe = engine.subscribe(() => {
  const viewModel = engine.getViewModel();
  // re-render
});

engine.getActions().next();
engine.getActions().previous();
engine.getActions().jump(2025, 5);
engine.getActions().goToToday();

unsubscribe();
engine.destroy();
```

## Browser Support

Custom Elements v1 — Chrome 67+, Firefox 63+, Safari 12.1+, Edge 79+.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © Callis Ezenwaka

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

### Recent Updates

- **v0.2.1**: Add availability mode (day/time views), selectable range, lazy event fetching with skeleton loading
- **v0.2.0**: Migrated to a single `<kal-calendar>` web component — works natively in React, Vue, Angular, Svelte, Solid.js, and plain HTML with no framework dependency
- **v0.1.7**: Vanilla calendar performance optimization with event delegation
- **v0.1.6**: Navigation enhancements — Today button, month/year picker, optional `title` prop
- **v0.1.5**: Universal theming system, TypeScript improvements
- **v0.1.0**: Initial release with React, Vue, React Native, and Vanilla JavaScript support
