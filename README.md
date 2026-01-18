# kalendly Universal Calendar

A universal calendar component that works seamlessly across React, Vue, and React Native with full TypeScript support.

## Features

- 🚀 **Universal**: Works with React, Vue, React Native, and Vanilla JavaScript
- 📱 **Responsive**: Mobile-friendly design that matches your existing UI implementation
- 🎨 **Customizable**: Easy to theme and customize with CSS variables
- 🔒 **Type Safe**: Full TypeScript support
- 📅 **Event Management**: Add, display, and manage events with rich metadata
- 🔔 **Advanced Features**: Recurring events, reminders, categories, priorities, and collaboration
- 🌐 **Accessible**: Built with accessibility in mind
- 📦 **Tree Shakeable**: Import only what you need

## 🎯 Live Demo

<div align="center">

[![Kalendly Calendar Demo](./docs/images/calendar-demo.gif)](https://kalendly-example.netlify.app/)

**[🚀 Try the Interactive Demo →](https://kalendly-example.netlify.app/)**

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
</p>

## Installation

```bash
npm install kalendly
# or
yarn add kalendly
# or
pnpm add kalendly
```

## Usage

### React

```jsx
import React from 'react';
import { Calendar } from 'kalendly/react';
import 'kalendly/styles';

const events = [
  {
    id: 1,
    name: 'Team Meeting',
    date: '2025-01-15',
  },
  {
    id: 2,
    name: 'Project Deadline',
    date: '2025-01-20',
  },
];

function App() {
  const handleDateSelect = date => {
    console.log('Selected date:', date);
  };

  return (
    <div>
      <Calendar
        events={events}
        onDateSelect={handleDateSelect}
        title="My Calendar"
      />
    </div>
  );
}

export default App;
```

### Vue

```vue
<template>
  <div>
    <Calendar
      :events="events"
      @date-select="handleDateSelect"
      title="My Calendar"
    >
      <template #event="{ event }">
        <div class="custom-event">{{ event.name }}</div>
      </template>
    </Calendar>
  </div>
</template>

<script setup>
import { Calendar } from 'kalendly/vue';
import 'kalendly/styles';

const events = [
  {
    id: 1,
    name: 'Team Meeting',
    date: '2025-01-15',
  },
  {
    id: 2,
    name: 'Project Deadline',
    date: '2025-01-20',
  },
];

const handleDateSelect = date => {
  console.log('Selected date:', date);
};
</script>
```

### React Native

```jsx
import React from 'react';
import { View } from 'react-native';
import { Calendar } from 'kalendly/react-native';

const events = [
  {
    id: 1,
    name: 'Team Meeting',
    date: '2025-01-15',
  },
  {
    id: 2,
    name: 'Project Deadline',
    date: '2025-01-20',
  },
];

function App() {
  const handleDateSelect = date => {
    console.log('Selected date:', date);
  };

  return (
    <View style={{ flex: 1 }}>
      <Calendar
        events={events}
        onDateSelect={handleDateSelect}
        title="My Calendar"
      />
    </View>
  );
}

export default App;
```

### Vanilla JavaScript

#### Modern ES Modules (Recommended)

```html
<!DOCTYPE html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="node_modules/kalendly/dist/styles/calendar.css"
    />
    <title>Vanilla JS Calendar</title>
  </head>
  <body>
    <div id="calendar"></div>

    <script type="module">
      import { createCalendar } from 'kalendly/vanilla';

      const events = [
        { id: 1, name: 'Team Meeting', date: '2025-01-15' },
        { id: 2, name: 'Project Deadline', date: '2025-01-20' },
      ];

      const calendar = createCalendar({
        container: '#calendar',
        events: events,
        title: 'My Calendar',
      });

      // Listen to events (note: use addEventListener, not onclick)
      document.getElementById('calendar').addEventListener('dateSelect', e => {
        console.log('Selected date:', e.detail.date);
      });

      document.getElementById('calendar').addEventListener('monthChange', e => {
        console.log('Month changed:', e.detail.year, e.detail.month);
      });

      // Update events dynamically
      // calendar.updateEvents(newEvents);

      // Navigate to specific date
      // calendar.goToDate(new Date(2025, 5, 15));

      // Cleanup when done
      // calendar.destroy();
    </script>
  </body>
</html>
```

#### CDN Usage (Browser)

```html
<!DOCTYPE html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/kalendly/dist/styles/calendar.css"
    />
  </head>
  <body>
    <div id="calendar"></div>

    <script type="module">
      import { createCalendar } from 'https://unpkg.com/kalendly/dist/vanilla/index.mjs';

      const calendar = createCalendar({
        container: '#calendar',
        events: [{ id: 1, name: 'Meeting', date: '2025-01-15' }],
        title: 'My Calendar',
      });
    </script>
  </body>
</html>
```

#### Legacy/Global Usage (Without Modules)

```html
<!DOCTYPE html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/kalendly/dist/styles/calendar.css"
    />
  </head>
  <body>
    <div id="calendar"></div>

    <script src="https://unpkg.com/kalendly/dist/vanilla/index.umd.js"></script>
    <script>
      const { createCalendar } = Kalendly;

      const calendar = createCalendar({
        container: '#calendar',
        events: [{ id: 1, name: 'Meeting', date: '2025-01-15' }],
        title: 'My Calendar',
      });

      // Now you can use global functions with onclick
      function handleDateSelect() {
        console.log('Date selected!');
      }

      document
        .getElementById('calendar')
        .addEventListener('dateSelect', handleDateSelect);
    </script>
  </body>
</html>
```

## API Reference

### Props

| Prop                 | Type                                    | Default            | Description                             |
| -------------------- | --------------------------------------- | ------------------ | --------------------------------------- |
| `events`             | `CalendarEvent[]`                       | `[]`               | Array of events to display              |
| `initialDate`        | `Date`                                  | `new Date()`       | Initial date to display                 |
| `minYear`            | `number`                                | `currentYear - 30` | Minimum selectable year                 |
| `maxYear`            | `number`                                | `currentYear + 10` | Maximum selectable year                 |
| `weekStartsOn`       | `0 \| 1`                                | `0`                | Week start day (0 = Sunday, 1 = Monday) |
| `useShortMonthNames` | `boolean`                               | `false`            | Use abbreviated month names (Jan, Feb)  |
| `categoryColors`     | `CategoryColorMap`                      | `{}`               | Custom colors for event categories      |
| `theme`              | `CalendarTheme`                         | `undefined`        | Custom theme colors for the calendar    |
| `title`              | `string`                                | `undefined`        | Optional calendar title displayed above |
| `onDateSelect`       | `(date: Date) => void`                  | -                  | Callback when date is selected          |
| `onEventClick`       | `(event: CalendarEvent) => void`        | -                  | Callback when event is clicked          |
| `onMonthChange`      | `(year: number, month: number) => void` | -                  | Callback when month changes             |

### CalendarEvent Interface

```typescript
interface CalendarEvent {
  // Required fields
  id: string | number;
  name: string;
  date: string | Date;

  // Time fields
  startTime?: string; // e.g., "09:00", "14:30"
  endTime?: string; // e.g., "10:00", "16:00"
  allDay?: boolean; // True for all-day events

  // Display & categorization
  description?: string;
  color?: string; // Custom event color
  category?:
    | 'work'
    | 'personal'
    | 'meeting'
    | 'deadline'
    | 'appointment'
    | 'other';
  location?: string; // Event location
  url?: string; // Related URL or meeting link

  // Status & priority
  status?: 'scheduled' | 'completed' | 'cancelled' | 'tentative';
  priority?: 'low' | 'medium' | 'high';

  // Collaboration
  attendees?: string[]; // List of attendee names/emails
  organizer?: string; // Event organizer

  // Reminders & recurrence
  reminders?: number[]; // Minutes before event to remind (e.g., [15, 60])
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number; // Every X days/weeks/months/years
    endDate?: string | Date; // When recurrence ends
    daysOfWeek?: number[]; // For weekly recurrence (0 = Sunday)
  };

  // Metadata
  notes?: string; // Additional notes
  tags?: string[]; // Event tags
  createdAt?: string | Date; // Creation timestamp
  updatedAt?: string | Date; // Last update timestamp

  // Flexibility for custom fields
  [key: string]: unknown;
}
```

#### Example with Enhanced Fields

```typescript
const events = [
  {
    id: 1,
    name: 'Team Standup',
    date: '2025-01-15',
    startTime: '09:00',
    endTime: '09:30',
    category: 'meeting',
    location: 'Conference Room A',
    url: 'https://meet.google.com/abc-defg-hij',
    attendees: ['john@example.com', 'jane@example.com'],
    organizer: 'team-lead@example.com',
    priority: 'high',
    status: 'scheduled',
    reminders: [15, 60],
    recurring: {
      frequency: 'daily',
      interval: 1,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      endDate: '2025-12-31',
    },
    tags: ['team', 'sync'],
  },
  {
    id: 2,
    name: 'Project Deadline',
    date: '2025-01-20',
    allDay: true,
    category: 'deadline',
    priority: 'high',
    status: 'scheduled',
    description: 'Final submission for Q1 project',
    notes: 'Make sure all tests pass before submission',
  },
];
```

#### Category Colors

You can customize colors for different event categories:

```typescript
const categoryColors = {
  work: '#4CAF50',
  personal: '#2196F3',
  meeting: '#FF9800',
  deadline: '#F44336',
  appointment: '#9C27B0',
  other: '#607D8B'
};

<Calendar events={events} categoryColors={categoryColors} />
```

## Theming

Kalendly supports custom theming across all frameworks with a **consistent API**. Customize calendar colors to match your brand or create light/dark themes.

### CalendarTheme Interface

```typescript
interface CalendarTheme {
  primary?: string; // Primary brand color
  secondary?: string; // Secondary brand color
  tertiary?: string; // Tertiary/accent color
  textColor?: string; // Main text color
  textLight?: string; // Light/secondary text color
  background?: string; // Background color
  cellHover?: string; // Cell hover state color
  borderColor?: string; // Border color
  todayOutline?: string; // Today indicator color
  selectedBg?: string; // Selected date background
  eventIndicator?: string; // Event indicator dot color
}
```

### Basic Theme Example

**React:**

```tsx
import { Calendar } from 'kalendly/react';
import 'kalendly/styles';

function App() {
  return (
    <Calendar
      events={events}
      theme={{
        primary: '#3b82f6',
        secondary: '#60a5fa',
        tertiary: '#93c5fd',
        borderColor: '#e5e7eb',
        todayOutline: '#fbbf24',
        eventIndicator: '#10b981',
      }}
    />
  );
}
```

**Vue:**

```vue
<template>
  <Calendar :events="events" :theme="calendarTheme" />
</template>

<script setup lang="ts">
import { Calendar } from 'kalendly/vue';
import 'kalendly/styles';

const calendarTheme = {
  primary: '#3b82f6',
  secondary: '#60a5fa',
  tertiary: '#93c5fd',
  borderColor: '#e5e7eb',
  todayOutline: '#fbbf24',
  eventIndicator: '#10b981',
};
</script>
```

**Vanilla JavaScript:**

```javascript
import { createCalendar } from 'kalendly/vanilla';
import 'kalendly/styles';

const calendar = createCalendar({
  container: '#calendar',
  events: events,
  theme: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    tertiary: '#93c5fd',
    borderColor: '#e5e7eb',
    todayOutline: '#fbbf24',
    eventIndicator: '#10b981',
  },
});
```

**React Native:**

```tsx
import { Calendar } from 'kalendly/react-native';

function App() {
  return (
    <Calendar
      events={events}
      theme={{
        primary: '#3b82f6',
        secondary: '#60a5fa',
        tertiary: '#93c5fd',
        borderColor: '#e5e7eb',
        todayOutline: '#fbbf24',
        eventIndicator: '#10b981',
      }}
    />
  );
}
```

### Dark Theme Example

```typescript
const darkTheme = {
  primary: '#6366f1',
  secondary: '#818cf8',
  tertiary: '#a5b4fc',
  textColor: '#f9fafb',
  textLight: '#d1d5db',
  background: '#1f2937',
  cellHover: '#374151',
  borderColor: '#4b5563',
  todayOutline: '#fbbf24',
  selectedBg: '#312e81',
  eventIndicator: '#34d399'
};

<Calendar events={events} theme={darkTheme} />
```

### Dynamic Theme Switching

**React:**

```tsx
import { useState } from 'react';
import { Calendar } from 'kalendly/react';

const themes = {
  blue: { primary: '#3b82f6', secondary: '#60a5fa' },
  purple: { primary: '#8b5cf6', secondary: '#a78bfa' },
  green: { primary: '#10b981', secondary: '#34d399' },
};

function App() {
  const [currentTheme, setCurrentTheme] = useState('blue');

  return (
    <>
      <button onClick={() => setCurrentTheme('blue')}>Blue</button>
      <button onClick={() => setCurrentTheme('purple')}>Purple</button>
      <button onClick={() => setCurrentTheme('green')}>Green</button>

      <Calendar events={events} theme={themes[currentTheme]} />
    </>
  );
}
```

**Vue:**

```vue
<template>
  <div>
    <button @click="currentTheme = 'blue'">Blue</button>
    <button @click="currentTheme = 'purple'">Purple</button>
    <button @click="currentTheme = 'green'">Green</button>

    <Calendar :events="events" :theme="themes[currentTheme]" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Calendar } from 'kalendly/vue';

const themes = {
  blue: { primary: '#3b82f6', secondary: '#60a5fa' },
  purple: { primary: '#8b5cf6', secondary: '#a78bfa' },
  green: { primary: '#10b981', secondary: '#34d399' },
};

const currentTheme = ref('blue');
</script>
```

**Vanilla JavaScript:**

```javascript
import { createCalendar } from 'kalendly/vanilla';

const themes = {
  blue: { primary: '#3b82f6', secondary: '#60a5fa' },
  purple: { primary: '#8b5cf6', secondary: '#a78bfa' },
  green: { primary: '#10b981', secondary: '#34d399' },
};

const calendar = createCalendar({
  container: '#calendar',
  events: events,
  theme: themes.blue,
});

// Update theme dynamically without recreation
document.getElementById('purple-btn').addEventListener('click', () => {
  calendar.updateTheme(themes.purple);
});
```

> **Note:** The `updateTheme()` method is available in Vanilla JavaScript for efficient theme updates without recreating the calendar instance.

## Framework-Specific Features

### React Props

| Prop             | Type                                  | Description              |
| ---------------- | ------------------------------------- | ------------------------ |
| `className`      | `string`                              | CSS class name           |
| `style`          | `React.CSSProperties`                 | Inline styles            |
| `renderEvent`    | `(event: CalendarEvent) => ReactNode` | Custom event renderer    |
| `renderNoEvents` | `() => ReactNode`                     | Custom no events message |

### Vue Props & Slots

| Slot        | Props                      | Description              |
| ----------- | -------------------------- | ------------------------ |
| `title`     | -                          | Custom title content     |
| `event`     | `{ event: CalendarEvent }` | Custom event display     |
| `no-events` | -                          | Custom no events message |

### React Native Props

| Prop              | Type        | Description                |
| ----------------- | ----------- | -------------------------- |
| `style`           | `ViewStyle` | Container style            |
| `headerStyle`     | `ViewStyle` | Header style               |
| `cellStyle`       | `ViewStyle` | Calendar cell style        |
| `showCloseButton` | `boolean`   | Show close button in popup |

### Vanilla JavaScript Options

| Option           | Type                               | Description                   |
| ---------------- | ---------------------------------- | ----------------------------- |
| `container`      | `HTMLElement \| string`            | Container element or selector |
| `className`      | `string`                           | Additional CSS class          |
| `renderEvent`    | `(event: CalendarEvent) => string` | Custom event HTML renderer    |
| `renderNoEvents` | `() => string`                     | Custom no events HTML         |

### Vanilla JavaScript Events

```javascript
// Listen to calendar events
calendar.container.addEventListener('dateSelect', e => {
  console.log('Date selected:', e.detail.date);
});

calendar.container.addEventListener('monthChange', e => {
  console.log('Month changed:', e.detail.year, e.detail.month);
});
```

### Vanilla JavaScript API

```javascript
const calendar = createCalendar(options);

// Methods
calendar.updateEvents(newEvents); // Update events
calendar.getCurrentDate(); // Get selected date
calendar.goToDate(new Date()); // Navigate to date
calendar.getEngine(); // Access core engine
calendar.destroy(); // Cleanup
```

## Common Issues & Solutions

### Vanilla JavaScript

**Issue: "Function is not defined" errors with onclick handlers**

❌ **Wrong:**

```html
<button onclick="myFunction()">Click me</button>
<script type="module">
  function myFunction() {} // Not accessible globally in modules
</script>
```

✅ **Correct:**

```html
<button id="myButton">Click me</button>
<script type="module">
  function myFunction() {}
  document.getElementById('myButton').addEventListener('click', myFunction);
</script>
```

**Issue: Module imports not working**

Use the correct import paths:

- Local: `'./dist/vanilla/index.mjs'`
- NPM: `'kalendly/vanilla'`
- CDN: `'https://unpkg.com/kalendly/dist/vanilla/index.mjs'`

**Issue: Styles not loading**

Always include the CSS file:

```html
<link rel="stylesheet" href="path/to/kalendly/dist/styles/calendar.css" />
```

## Customization

### CSS Variables (React/Vue)

```css
:root {
  --calendar-primary-color: #fc8917;
  --calendar-primary-color-rgb: 252, 137, 23;
  --calendar-secondary-color: #fca045;
  --calendar-secondary-color-rgb: 252, 160, 69;
  --calendar-tertiary-color: #fdb873;
  --calendar-text-color: #2c3e50;
  --calendar-border-color: #dee2e6;
  --calendar-today-outline: #f7db04;
  --calendar-event-indicator: #1890ff;
  --calendar-background: #fff;
}
```

> **Note:** The `-rgb` variables are used for semi-transparent backgrounds (e.g., hover states) and provide compatibility with older browsers (Chrome < 111, Safari iOS < 16.2).

### React Native Theming

```javascript
import { calendarStyles } from 'kalendly/react-native';

// Customize styles
const customStyles = {
  ...calendarStyles,
  container: {
    ...calendarStyles.container,
    backgroundColor: '#f5f5f5',
  },
};
```

## Core API

You can also use the core calendar engine directly:

```typescript
import { CalendarEngine } from 'kalendly/core';

const engine = new CalendarEngine({
  events: myEvents,
  initialDate: new Date(),
});

// Subscribe to changes
const unsubscribe = engine.subscribe(() => {
  console.log('Calendar state changed');
});

// Get current state
const viewModel = engine.getViewModel();
const actions = engine.getActions();

// Navigate months
actions.next();
actions.previous();
actions.jump(2025, 5); // June 2025
actions.goToToday(); // Navigate to current month

// Check current view
const isCurrentMonth = actions.isCurrentMonth(); // true if viewing today's month

// Clean up
unsubscribe();
engine.destroy();
```

## TypeScript Support

The package is written in TypeScript and provides full type definitions:

```typescript
import type { CalendarEvent, CalendarProps, CalendarState } from 'kalendly';
```

## Browser Support

- **React/Vue**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **React Native**: iOS 12+, Android API 21+

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information on:

- Development setup
- Project structure
- Building and testing
- Running examples
- Submitting pull requests
- Release process

Quick start:

```bash
# Clone and install
git clone https://github.com/callezenwaka/kalendly.git
cd kalendly
npm install

# Run tests
npm test

# Run examples locally
npm run dev:examples
```

## License

MIT © Callis Ezenwaka

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and version history.

### Recent Updates

- **v0.1.7**: Vanilla calendar performance optimization with event delegation, targeted DOM updates for picker navigation
- **v0.1.6**: Navigation enhancements with Today button, month/year picker dropdown, optional `title` prop, calendar grid improvements showing previous/next month days, and browser compatibility fixes
- **v0.1.5**: Universal theming system, TypeScript support improvements, integration test enhancements
- **v0.1.4**: Netlify configuration updates
- **v0.1.3**: Vue types generation improvements
- **v0.1.2**: Enhanced event parameters with structured metadata, categories, recurrence, collaboration features
- **v0.1.1**: Pre-commit hooks and trusted publishing with OIDC
- **v0.1.0**: Initial release with React, Vue, React Native, and Vanilla JavaScript support
