# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-10

### Breaking Changes

- **Renamed custom element tag** from `cal-calendar` to `kal-calendar` — update all template and HTML references
- **Replaced framework-specific packages** with a single Web Component — `kalendly/react`, `kalendly/vue`, `kalendly/react-native`, and `kalendly/vanilla` sub-paths are removed
  - Before: `import { Calendar } from 'kalendly/react'` → After: `import 'kalendly'`
  - Before: `<Calendar events={events} />` → After: `<kal-calendar events={events} />`
- **Custom event names changed** — `date-select` → `cal-date-select`, `month-change` → `cal-month-change`
- **Event handler signature changed** — handlers now receive a `CustomEvent`; use `e.detail.date`, `e.detail.events`, `e.detail.year`, `e.detail.month`
- **React Native** support dropped — out of scope for a web component library
- **`@event-click`** removed — no direct equivalent; use `cal-date-select` to get events for the selected date

### Added

- **`<kal-calendar>` Web Component** — single `HTMLElement` subclass (`CalendarElement`) that works natively in React 19, Vue 3, Svelte 4/5, Angular, Solid.js, and plain HTML with no framework adapters
- **Solid.js support** — `prop:events={events}` + `on:cal-date-select={handler}`; TypeScript JSX namespace declarations documented
- **Svelte 5 support** — runes syntax (`$props()`), `oncal-date-select` and `oncal-month-change` event props
- **Svelte 4 support** — `bind:this` pattern with `onMount` for property binding
- **React 18 workaround** documented in README — `ref`-based wrapper for projects not yet on React 19
- **`defineCalendarElement(tagName?)`** — synchronous registration with optional custom tag name
- **UMD / IIFE build** (`dist/index.umd.js`) — auto-registers `<kal-calendar>` on load; suitable for CDN and script-tag usage
- **`./core` sub-path export** — `import { CalendarEngine } from 'kalendly/core'` for headless / advanced usage
- **Demo site** (`docs/`) — static HTML examples for all six frameworks (Vanilla, React, Vue, Svelte, Angular, Solid), served via Netlify with `docs/` as publish root
- **Migration guide** in README — side-by-side before/after table for upgrading from v0.1.x

### Changed

- **Light DOM rendering** — no Shadow DOM; existing `calendar.css` global class selectors work without modification and host-page CSS overrides apply naturally
- **CSS loading** — import styles explicitly with `import 'kalendly/styles'` in bundler projects, or via `<link>` in plain HTML; Angular users add to `angular.json` styles array
- **`copy:dist` script** now runs `rm -rf docs/dist && cp -r dist docs/dist` to prevent stale nested copies on repeated builds
- **`build` script** updated to run `copy:styles` and `copy:dist` after `tsup`
- **Removed React adapter** (`react-adapter.tsx`) — React 19 handles custom element property and event binding natively
- **Removed Vue shims** (`vue-shims.d.ts`) — no `.vue` source files remain
- **Peer dependency** updated to `react >= 19.0.0` (optional)
- **README** rewritten for web component API; includes all six framework usage examples, full CSS variable reference, theming guide, styling override documentation, and migration table

### Fixed

- `copy:dist` creating `docs/dist/dist/` nested directory on repeated builds — fixed by cleaning before copy
- Custom element tag registration footer in UMD build now correctly uses `kal-calendar`

## [0.1.7] - 2026-01-18

### Changed

- **Vanilla Calendar Performance Optimization**
  - Replaced individual event listeners with event delegation pattern
  - Single delegated click handler routes actions via `data-action` attributes
  - Listeners attached once and persist across re-renders (previously ~15 listeners recreated on every render)
  - Added `updatePickerYear()` method for targeted DOM updates on year navigation
  - Year picker arrows now update only input value and button states instead of full DOM rebuild

### Fixed

- **Vanilla Calendar Event Handling**
  - Fixed popup closing immediately after date selection due to document click handler interference
  - Added `stopPropagation` on date cell clicks to prevent selection clearing after render

## [0.1.6] - 2026-01-18

### Added

- **Navigation Enhancements**
  - Added `goToToday()` method to navigate directly to current month
  - Added `isCurrentMonth()` method to check if viewing current month
  - Added Today button in navigation header (disabled when already on current month)
  - Added month/year picker dropdown for quick navigation
  - Added `MONTHS_FULL` array for complete month names
  - Added `useShortMonthNames` prop to toggle between short/full month names
- **Calendar Grid Improvements**
  - Calendar now displays previous/next month days in greyed-out cells instead of empty cells
  - Added `other-month` CSS class for styling non-current month days
- **Optional Title Prop**
  - Made `title` prop optional across all frameworks (React, Vue, Vanilla, React Native)
- **Test Coverage**
  - Added unit tests for `goToToday()` method (4 tests)
  - Added unit tests for `isCurrentMonth()` method (5 tests)

### Changed

- **Navigation UI Refactor**
  - Replaced static header with interactive month/year picker button
  - Updated all framework implementations (React, Vue, Vanilla, React Native)
- **Calendar Date Type**
  - Changed `calendarDates` return type from `(CalendarDate | null)[][]` to `CalendarDate[][]`
  - Updated tests to use `isCurrentMonth` property instead of null checks

### Fixed

- **Browser Compatibility**
  - Replaced `color-mix()` CSS function with `rgba()` using CSS variables
  - Added `--calendar-primary-color-rgb` and `--calendar-secondary-color-rgb` variables
  - Fixes compatibility with Chrome < 111 and Safari on iOS < 16.2
- **React Native Sync**
  - Added `onEventClick` callback support to React Native DatePopup (now matches React implementation)
  - Added engine cleanup (`destroy()`) on Calendar component unmount
  - Added Calendar component test suite for React Native

## [0.1.5] - 2026-01-18

### Added

- **Theme Support** - Universal theming system across all frameworks
  - Added `CalendarTheme` interface with 11 customizable color properties
  - Added `theme` prop to React, Vue, Vanilla, and React Native Calendar components
  - React and Vue: Dynamic theme updates via prop changes
  - Vanilla JavaScript: `updateTheme()` method for efficient theme switching
  - React Native: Responsive theme integration with StyleSheet
  - Comprehensive theme tests (18 tests) covering all frameworks
- TypeScript support improvements
  - Added `types` field in tsconfig.json for @testing-library/jest-dom matchers
  - Created `styles.d.ts` module declaration for TypeScript projects
  - Enhanced package.json exports with explicit types field for styles
- Integration test improvements
  - Updated package validation to include all build outputs
  - Added validation for React Native builds (CJS, ESM, TypeScript declarations)
  - Added validation for Vue TypeScript declarations
  - Added validation for UMD build and styles.d.ts

### Changed

- **React Native Styling Architecture**
  - Refactored `getResponsiveStyles()` to accept optional color overrides
  - Renamed `colors` to `defaultColors` for clarity
  - Exported `CalendarColors` type for type safety
  - Enhanced Calendar component with dynamic style generation based on theme
  - Select component now accepts style props for theme integration
- Build & Type Generation
  - Removed outdated comment about Vue not generating .d.ts files
  - Package validation now checks 21 files (up from 16)

### Fixed

- TypeScript errors in test files
  - Resolved missing jest-dom matcher types (toBeInTheDocument, toHaveClass, etc.)
  - Added global type declarations for testing library matchers
- Vanilla Calendar theme application
  - Moved `applyTheme()` from constructor body to separate private method
  - Fixed invalid method declaration syntax

## [0.1.4] - 2026-01-11

### Changed

- Updated Netlify configuration for improved deployment
- Updated Netlify URL references in README

## [0.1.3] - 2026-01-11

### Changed

- Enhanced Vue types generation script with improved DTS configuration
- Updated Vite config with rollupTypes option to merge all .d.ts into single file
- Improved type generation for Vue components

## [0.1.2] - 2025-01-XX

### Added

- Enhanced `CalendarEvent` interface with structured metadata fields:
  - **Time fields**: `startTime`, `endTime`, `allDay` for flexible time management
  - **Display & categorization**: `category` with predefined types ('work', 'personal', 'meeting', 'deadline', 'appointment', 'other'), `location`, `url`
  - **Status & priority**: `status` ('scheduled', 'completed', 'cancelled', 'tentative'), `priority` ('low', 'medium', 'high')
  - **Collaboration**: `attendees` array, `organizer` field
  - **Reminders & recurrence**: `reminders` array, `recurring` object with frequency patterns (daily, weekly, monthly, yearly)
  - **Metadata**: `notes`, `tags`, `createdAt`, `updatedAt` timestamps
- Added `categoryColors` configuration option to customize colors per category
- Added `CategoryColorMap` interface for type-safe category color mapping
- Comprehensive CONTRIBUTING.md with development guidelines and workflow
- React Native testing infrastructure with @testing-library/react-native
- React Native DatePopup component unit tests
- Example assets (favicon.ico, kalendly.png)
- Netlify deployment configuration for live interactive examples
- Build pipeline for examples deployment (`build:examples` script)

### Changed

- Improved type safety by replacing `any` with `unknown` in CalendarEvent index signature
- Updated React Calendar to properly track dependencies in useMemo hook
- Updated all framework implementations (React, Vue, React Native, Vanilla) to support enhanced event parameters
- Bumped Node.js requirement from >=16.0.0 to >=20.0.0
- Enhanced example HTML files with better UI and new event field demonstrations
- Updated Vite examples config to support production builds with proper bundling

### Fixed

- React Calendar dependency array now includes all dependencies (events, initialDate, minYear, maxYear, weekStartsOn)
- Removed unused `selectedDayIndex` variable from React Calendar component

## [0.1.1] - 2025-01-XX

### Added

- Pre-commit hooks with lock file validation
- Husky for git hooks management
- Lint-staged for running linters on staged files

### Changed

- Bumped package version to 0.1.1

### Fixed

- Upgraded npm to support trusted publishing with OIDC

## [0.1.0] - 2024-12-XX

### Added

- Initial release of Kalendly universal calendar scheduler
- Support for React, Vue, React Native, and Vanilla JavaScript
- Core calendar engine with framework-agnostic logic
- Event management system
- TypeScript definitions and full type safety
- Responsive, mobile-friendly design
- Customizable themes with CSS variables
- Month navigation and date selection
- Event popup with details display
- Accessibility features
- Tree-shakeable exports
- Comprehensive documentation
- Example applications for all frameworks
- Unit and integration tests
- Build pipeline with tsup and Vite
- NPM publishing workflow with GitHub Actions
- Trusted publishing with OIDC authentication

### Features by Framework

#### React

- Calendar and DatePopup components
- React hooks integration
- Custom event rendering support
- TypeScript prop types

#### Vue

- Calendar and DatePopup components with Composition API
- Scoped slots for customization
- Event emitters for interactions
- TypeScript support with defineComponent

#### React Native

- Native mobile components
- Platform-specific styling
- TouchableOpacity interactions
- Modal-based popup

#### Vanilla JavaScript

- ES modules and UMD builds
- CDN support
- DOM event system
- Imperative API

[0.2.0]: https://github.com/callezenwaka/kalendly/compare/v0.1.7...v0.2.0
[0.1.7]: https://github.com/callezenwaka/kalendly/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/callezenwaka/kalendly/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/callezenwaka/kalendly/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/callezenwaka/kalendly/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/callezenwaka/kalendly/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/callezenwaka/kalendly/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/callezenwaka/kalendly/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/callezenwaka/kalendly/releases/tag/v0.1.0
