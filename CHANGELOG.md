# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.7]: https://github.com/callezenwaka/kalendly/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/callezenwaka/kalendly/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/callezenwaka/kalendly/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/callezenwaka/kalendly/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/callezenwaka/kalendly/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/callezenwaka/kalendly/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/callezenwaka/kalendly/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/callezenwaka/kalendly/releases/tag/v0.1.0
