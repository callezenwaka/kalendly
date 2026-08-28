# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Regression in 0.3.3: setting `--calendar-primary-color` on the element stopped working.** 0.3.3 added nav-arrow tokens declared as `--calendar-nav-arrow-hover-bg: var(--calendar-primary-color)` at `:root`. Custom properties substitute at computed-value time, so that resolved against `:root`'s primary and descendants inherited the finished value — an override set on `<kal-calendar>` never reached it. Pointing the calendar at a design system with `style="--calendar-primary-color: var(--primary)"` worked in 0.3.2 and silently stopped in 0.3.3.

  Defaults now live in a use-site fallback — `var(--calendar-nav-arrow-hover-bg, var(--calendar-primary-color))` — which resolves inside the element, so both the specific token and the base token work, scoped per element. `--calendar-shadow-primary` had the same shape and is fixed with it. A test now fails if any `--calendar-*` token is derived from another at `:root`.

### Documentation

- **Where you set a token decides what it colours.** The theming section only ever showed `:root`, which is page-wide; there was no example of scoping a token to one calendar, which is what an app embedding a single calendar actually wants. Added the element-scoped form in every framework's idiom, the note that `theme` writes to `:root` and so colours every calendar on the page, and the reason `--calendar-primary-color-rgb` has to be set alongside `--calendar-primary-color`.

- Every demo gains a **Brand Colour** control that sets the tokens on the element and removes them again, so the scoping is visible rather than described.

- **The demos were styling the component.** Each page styled a bare `button`, and with no shadow DOM that reached the calendar's own buttons — the month picker took the demo's brand colour on hover instead of the library's. The demos exist to validate the library, so one misrepresenting it is worse than no demo. Every page now scopes its styles to its own controls, and a test fails if a demo stylesheet declares a bare selector for any element the calendar renders.

## [0.3.3] - 2026-08-28

### Fixed

- **A range crossing a month boundary is now marked in both months.** Selecting 28 Aug → 4 Sep emitted the right payload but drew the wrong picture: August stopped marking at the boundary and September started at it, so the days between changed appearance depending on which month you were looking at. Two render conditions gated on `isCurrentMonth` while nothing else in the component did — `isDateSelectable` has no month check, every cell is a click target, and the range machine spans adjacent-month days. The component decided a day was in the range, reported it in the event you act on, then drew it as though it were not.

- **Adjacent-month days now show their availability.** Leading and trailing cells rendered blank whatever their state, so an open day read as unavailable and a blocked one invited a click it would then refuse. In a booking calendar that misrepresents what is for sale.

- **Clicking a day already on screen no longer moves the month.** The jump exists to reveal a date you cannot see; for a leading or trailing cell there is nothing to reveal, and it guaranteed you were looking at the _other_ month the moment a cross-month range completed. Suppressed at the click site only — `actions.selectDate` still navigates, since callers rely on it for exactly that.

### Added

- **Ten theme tokens for colours that previously could not be reached**, each defaulting to the value it replaces, so setting none of them changes nothing.

  `--calendar-nav-arrow-fg` / `-bg` / `-border` / `-hover-fg` / `-hover-bg`, and the matching `navArrow*` keys, colour the `‹` `›` arrows without moving `primary` — which also drives the selected-day fill, today outline and picker accents.

  `--calendar-input-invalid-bg`, with `--calendar-input-invalid-rgb` behind it, fixes the invalid year input taking its border from a token and its fill from a literal, so theming one left the two disagreeing.

  `--calendar-popup-header-fg` and `--calendar-popup-close-fg` / `-bg` / `-hover-bg` cover the popup heading and close button, which were hard-coded white.

  Found by auditing every colour literal in the stylesheet rather than fixing the one that was reported. A test now keeps every literal inside a token declaration, and a second checks every `var()` resolves to a declared token.

## [0.3.2] - 2026-08-27

### Added

- **Booking constraints — `min-date`, `max-date`, `available-days`, `available-hours`.** Bookings often run to fixed hours on fixed days within a bookable horizon, and until now the calendar offered all 1440 minutes of every day, forever in both directions. Saying otherwise meant authoring a blocking event for every excluded hour of every excluded day — unbounded work for a static rule. All four are optional and absent means no constraint, so nothing changes for existing consumers.

  `min-date`/`max-date` bound the horizon, inclusive, parsed like `initial-date`. `available-days` is a recurring weekly rule using `getDay()` numbering (`0` = Sunday), independent of `week-starts-on`. `available-hours` is a recurring daily rule taking a comma-separated list of `HH:MM-HH:MM` ranges, because a working day is not always contiguous: `"09:00-12:00,13:00-17:00"` closes for lunch. Each range is half-open, `[start, end)`, matching the convention events already use.

  Excluded days are not click targets at all — no hover response, and neither `cal-date-select` nor `cal-availability-select` fires. Excluded hours render greyed and marked `Closed` and emit no `cal-slot-select`, but are still shown, so a booking falling outside the window stays visible. Style with `--calendar-out-of-range-bg` / `--calendar-out-of-range-fg` or the `outOfRangeBg` / `outOfRangeFg` theme keys.

  Bad input throws and names the attribute: an unreadable date, `min-date` after `max-date`, a weekday outside `0`–`6`, a malformed, inverted or overlapping range, or a boundary that misses the `slot-duration` grid. Validation runs on render rather than when the grid draws, so a mistake surfaces immediately instead of waiting for someone to open the right day.

- `parseHourRanges`, `isDateWithinWindow` and `isDayAllowed` exported from `kalendly/core`.

### Breaking Changes

- **`CalendarEvent.name` is optional.** It is read in one place — the event card's title — and availability mode never renders the card, so callers there were supplying a field the calendar guarantees never to show. An event without a name now renders a card with no title rather than an empty one. Nothing changes at runtime: events are handed back by reference, so a supplied name still round-trips through `cal-date-select`. It is breaking for TypeScript consumers _reading_ the field, which now needs a guard under `strictNullChecks`.

## [0.3.1] - 2026-08-27

### Breaking Changes

- **An event with a `startTime` and no `endTime` occupies one slot**, not the rest of the day. The previous behaviour never double-booked but silently made a whole evening unsellable from one incomplete record. The library warns once naming the event; the supported fix is an end time in the data.

### Added

- **`cal-slot-select`** — fires on every time-slot click with `{ date, startTime, endTime, booked }`, mirroring how `cal-date-select` fires for every day. Slots were only click targets when `selectable` was set, so driving your own booking flow meant enabling range selection you did not want or listening for raw DOM clicks. `selectable` still gates `cal-availability-select`, the range machine and the highlighting. The payload carries a time window and a boolean, so no event detail leaks.
- **`endDate` on `CalendarEvent`** — the last day of a multi-day event, **inclusive**. One event covers a range rather than needing one per day, and because it matches the `endDate` `cal-availability-select` emits, a saved selection can be handed straight back. Matched by range rather than expanded, so ids stay unique and long spans cost nothing. Times on a span repeat daily. An `endDate` before `date`, or unreadable, throws and names the event. Deliberately differs from RFC 5545's exclusive all-day `DTEND`.
- **`slot-duration`** — time-grid granularity in minutes, default 60. The grid renders `1440 / slot-duration` slots and `cal-availability-select` emits times on that granularity, so a schedule kept in half-hours can represent and take half-hour bookings. A value that does not divide 1440 falls back to 60 with a warning.
- `parseTimeToMinutes`, `formatMinutes`, `mergeIntervals`, `bookedSlots` and `eventInterval` exported from `kalendly/core`.

### Fixed

- **Hovering a cell did nothing in availability mode.** `.calendar-table td:hover` lost on specificity to the bucket colour rules, so cells carried `cursor: pointer` while looking completely inert. The hover rule now targets clickable cells and wins.
- **A clicked day showed no sign of it.** No cell ever received a selected class, and `--calendar-selected-bg` was declared and never used. In standard mode the popup hid this; in day availability mode, where the popup is suppressed, a click produced nothing visible at all. The selected day is now marked, using that token.
- **Bookings crossing midnight blocked nothing.** A `22:00`–`06:00` booking left the whole day available, so a customer could book on top of it — from valid data, with no error. Time ranges are now absolute intervals: an `endTime` at or before its `startTime` belongs to the next day, and each day's grid shows the portion of any booking falling on that day. The grid reads the previous day's events so the morning a booking runs into is marked.
- **Overlapping bookings double-counted.** Intervals merge before slots are tested, so a 09:00–17:00 meeting and a 17:30–22:00 class mark 09:00–22:00 once between them.

## [0.3.0] - 2026-08-26

### Breaking Changes

- **Event text is HTML-escaped.** `name`, `description`, `location`, `organizer`, `notes`, `tags`, `attendees` and the formatted time range render as text, so markup passed in those fields is no longer parsed. Use `renderEvent` to emit your own markup.
- **`event.url` is scheme-checked.** Only `http:`, `https:`, `mailto:` and relative URLs are emitted; anything else — `javascript:`, `data:` — becomes `#`.
- **`event.color` is validated.** Hex values and CSS colour keywords only; other values fall back to `#3b82f6`. Colours resolved through `categoryColors` were already validated and are unaffected.
- **Every class name is flat kebab-case.** `calendar--card` → `calendar-card`, `time-grid__slot--free` → `time-grid-slot-open`, and so on. Four changed meaning as well as punctuation: `schedule--current--exam` → `calendar-cell-today`, `has--event` → `calendar-cell-has-event`, `other-month` → `calendar-cell-other-month`, `page--title` → `calendar-title`.
- **`availability-mode` requires `availabilityStatus` on every event**, and the value must name a built-in bucket or a key of `availabilityColors`. Either violation throws, naming the offending events.
- **Availability classes and theme keys renamed.** `availability--booked` / `--free` → `availability-blocked` / `-open`, plus the new `availability-conditional`. `CalendarTheme` keys `freeBg`, `freeFg`, `reservedBg`, `reservedFg`, `activeBg`, `activeFg` → `openBg`, `openFg`, `conditionalBg`, `conditionalFg`, `blockedBg`, `blockedFg`.
- **`cursor: not-allowed` follows selectability**, not colour — it moved from the booked colour class onto `availability-unselectable`.
- **Type sizes and spacing are `rem`.** The calendar now scales with the reader's root font size instead of holding a fixed pixel size. Pages that set a root font size other than 16px will see the calendar render larger or smaller to match.
- **28 declarations changed size** when type, radius and spacing moved onto scales — mostly `9px`→`10px`, `11px`→`12px`, `13px`→`14px`, `15px`→`16px`, with one `30px`→`32px` padding. Nothing moves more than 2px, but layouts pinned to exact pixel dimensions may need a look.

### Added

- **Multi-state availability** — `availabilityStatus` on `CalendarEvent` with three built-in buckets: `open` (green), `conditional` (amber), `blocked` (red). Collisions on a day resolve by severity.
- **`availabilityColors`** — recolour a built-in bucket or declare your own. Merges over the defaults, and paints the cell through an inline `--availability-color`, which takes precedence over the matching `theme` key.
- **`selectableStatuses`** — which buckets a range may start, end or span. Defaults to `open` only.
- **`months` attribute** — two months side by side, in every mode. Navigation advances one month at a time; ranges cross panes.
- **`heading` attribute** — replaces `title`, which also rendered as a browser tooltip over the whole calendar. `title` still works and warns once per page.
- **Design tokens** — every colour, type size, radius, shadow and spacing step is a custom property, in two tiers: `--kal-*` primitives and `--calendar-*` semantic roles. 26 new `CalendarTheme` keys expose the semantic layer.
- **Open value types** — `status`, `category` and `priority` accept any string while keeping autocomplete for the documented values. Unrecognised values render with a neutral badge fill via `--calendar-badge-bg` / `--calendar-badge-text`.
- **Core API** — `CalendarConfig.monthCount`, `CalendarViewModel.panes`, and the `CalendarPane` type. `calendarDates` remains as an alias for `panes[0].calendarDates`.
- **`escapeHtml`, `slugifyToken`, `safeUrl`, `safeColor`** exported from `kalendly/core` for consumers writing their own `renderEvent`.
- **`aria-label` on availability cells**, naming the bucket.

### Fixed

- **Malformed times no longer read as available.** `"9am"` parsed to `NaN` and every comparison against it was false, so the hour rendered free. Unparseable times now book the slot.
- **An open-ended event no longer blocks the whole day.** `startTime` with no `endTime` blacked out all 24 slots including the hours before it began; it now books from its start hour to midnight.
- **Selectability has one definition.** The click handler read a CSS class while the range-span check read event data; they agreed only by coincidence. Both now use the same predicate, which also stops a previous- or next-month day carrying events from being picked as a range endpoint.
- **Multi-word badge values produce one class.** `status: 'in progress'` emitted two classes and a quote could escape the attribute.
- Dead CSS removed — fifteen rule blocks for classes nothing rendered.
- `getPopupPositionClass` removed along with `CalendarViewModel.popupPositionClass` and the `PopupPosition` type. It computed a class from the day-of-week index that no CSS rule ever consumed — the popup is a centred modal — so it had no effect on where anything rendered.

### Notes

- A configuration error raised while the browser is upgrading the element — declarative markup parsed before the module loads — is reported as an uncaught error rather than thrown to your code, because custom element callbacks run inside the reaction queue. The failure is kept: the next `getEngine()`, `getCurrentDate()` or `goToDate()` throws it, and setting `events` or `availabilityColors` clears it. Setting properties on an already-defined element throws where you set them.

## [0.2.2] - 2026-05-10

### Added

- **Dark theme support** — hard-coded colours in the stylesheet became CSS custom properties, so a dark palette can be applied without overriding rules: `--calendar-text-light`, `--calendar-cell-hover`, `--calendar-header-bg`, `--calendar-selected-bg`, `--calendar-popup-bg`, `--calendar-skeleton-base`, `--calendar-skeleton-highlight`
- **`headerBg` and `popupBg`** on `CalendarTheme`, so the two new surfaces are reachable from the JS theming API
- **CI workflow** running checks on push and pull request
- **Vue integration docs** — `isCustomElement` configuration for Vite, Nuxt and webpack, plus screenshots of the day and time availability views

## [0.2.1] - 2026-05-10

### Added

- **`availability-mode="day"`** — day cells show booked (red tint) vs free (green tint) without exposing any event details; clicking a day opens no popup
- **`availability-mode="time"`** — clicking a day opens a time-grid popup showing which hour blocks are booked or free; no event name, organiser, or attendee data is rendered
- **`selectable="range"`** — enables free day/slot selection in availability mode; 3-click state machine: first click selects, second extends the range, third resets; booked cells are non-selectable
- **`cal-availability-select` event** — fires on every selection; payload is `{ startDate, endDate }` in day mode or `{ date, startTime, endTime }` in time mode
- **`loading` property / attribute** — `el.loading = true` replaces calendar cells with a shimmer skeleton; `el.loading = false` restores the real grid
- **`cal-month-change` fires before render** — dispatched with the target month's `year`/`month` before the engine navigates, allowing `loading = true` to be set synchronously with no empty-calendar flash
- **Skeleton shimmer CSS** — `calendar--skeleton` cells with `@keyframes skeleton-shimmer` left-to-right animation

### Changed

- `cal-month-change` dispatch order moved before engine action in `previous`, `next`, `jump`, and `goToDate` — backwards compatible; apps using `el.events` upfront see no change in behaviour
- `renderEvent` and `renderNoEvents` properties are ignored when `availability-mode` is set

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

## [0.1.2] - 2026-01-11

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

## [0.1.1] - 2025-12-31

### Added

- Pre-commit hooks with lock file validation
- Husky for git hooks management
- Lint-staged for running linters on staged files

### Changed

- Bumped package version to 0.1.1

### Fixed

- Upgraded npm to support trusted publishing with OIDC

## [0.1.0] - 2025-12-31

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

[0.2.1]: https://github.com/callezenwaka/kalendly/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/callezenwaka/kalendly/compare/v0.1.7...v0.2.0
[0.1.7]: https://github.com/callezenwaka/kalendly/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/callezenwaka/kalendly/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/callezenwaka/kalendly/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/callezenwaka/kalendly/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/callezenwaka/kalendly/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/callezenwaka/kalendly/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/callezenwaka/kalendly/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/callezenwaka/kalendly/releases/tag/v0.1.0
