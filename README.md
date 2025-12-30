# kalendly Universal Calendar Scheduler

A universal calendar scheduler component that works seamlessly across React, Vue, and React Native with full TypeScript support.

## Features

- 🚀 **Universal**: Works with React, Vue, React Native, and Vanilla JavaScript
- 📱 **Responsive**: Mobile-friendly design that matches your existing Vue implementation
- 🎨 **Customizable**: Easy to theme and customize with CSS variables
- 🔒 **Type Safe**: Full TypeScript support
- 📅 **Event Management**: Add, display, and manage events
- 🌐 **Accessible**: Built with accessibility in mind
- 📦 **Tree Shakeable**: Import only what you need
- 🎯 **Design Consistent**: Matches the original Vue calendar design and feel

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

| Prop            | Type                                    | Default            | Description                             |
| --------------- | --------------------------------------- | ------------------ | --------------------------------------- |
| `events`        | `CalendarEvent[]`                       | `[]`               | Array of events to display              |
| `initialDate`   | `Date`                                  | `new Date()`       | Initial date to display                 |
| `minYear`       | `number`                                | `currentYear - 30` | Minimum selectable year                 |
| `maxYear`       | `number`                                | `currentYear + 10` | Maximum selectable year                 |
| `weekStartsOn`  | `0 \| 1`                                | `0`                | Week start day (0 = Sunday, 1 = Monday) |
| `onDateSelect`  | `(date: Date) => void`                  | -                  | Callback when date is selected          |
| `onEventClick`  | `(event: CalendarEvent) => void`        | -                  | Callback when event is clicked          |
| `onMonthChange` | `(year: number, month: number) => void` | -                  | Callback when month changes             |

### CalendarEvent Interface

```typescript
interface CalendarEvent {
  id: string | number;
  name: string;
  date: string | Date;
  description?: string;
  color?: string;
  [key: string]: any;
}
```

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
  --calendar-secondary-color: #fca045;
  --calendar-tertiary-color: #fdb873;
  --calendar-text-color: #2c3e50;
  --calendar-border-color: #dee2e6;
  --calendar-today-outline: #f7db04;
  --calendar-event-indicator: #1890ff;
  --calendar-background: #fff;
}
```

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

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © Callis Ezenwaka

## Changelog

### 1.0.0

- Initial release
- React, Vue, and React Native support
- TypeScript definitions
- Core calendar engine
- Event management
- Responsive design
