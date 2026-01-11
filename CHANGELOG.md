# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/callezenwaka/kalendly/compare/v0.1.4...HEAD
[0.1.4]: https://github.com/callezenwaka/kalendly/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/callezenwaka/kalendly/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/callezenwaka/kalendly/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/callezenwaka/kalendly/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/callezenwaka/kalendly/releases/tag/v0.1.0
