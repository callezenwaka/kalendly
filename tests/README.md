# Tests

This directory contains comprehensive testing for the Kalendly calendar library.

## Directory Structure

```
tests/
├── unit/                            # Unit tests (Vitest)
│   ├── core/                        # Core engine tests
│   │   ├── calendar-engine.test.ts  # CalendarEngine class
│   │   └── utils.test.ts            # Utility functions
│   ├── web-components/              # Custom element tests
│   │   └── CalendarElement.test.ts  # <kal-calendar>
│   ├── styles/                      # Stylesheet guards
│   │   └── tokens.test.ts           # namespacing, dead tokens
│   └── demos/                       # Demo page conformance
│       └── fixtures.test.ts         # fixtures and markup safety
├── browser/                         # Browser tests (Playwright)
│   ├── helpers.ts                   # painted-colour comparison, settling
│   ├── theming.spec.ts              # element-scoped tokens, leak containment
│   ├── states.spec.ts               # hover, selected, range, out-of-range
│   └── injection.spec.ts            # the manual page's error and log paths
├── integration/                     # Integration tests
│   └── package-validation.test.mjs  # Pre-publish validation
├── manual/                          # Manual browser testing
│   └── web-component.html           # Every mode, control and event
├── setup.ts                         # Vitest setup & test fixtures
└── README.md                        # This file
```

## Test Types

### 1. Unit Tests (Vitest)

**Purpose:** Test code logic in isolation

**Run commands:**

```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:ui       # Visual UI
npm run test:coverage # Generate coverage report
npm run test:watch    # Watch mode (explicit)
```

### 2. Integration Tests (Node.js)

**Purpose:** Validate build artifacts before publishing to npm

**Run command:**

```bash
npm run test:package
```

**What it validates:**

- ✅ Build artifacts exist (CJS, ESM, TypeScript definitions)
- ✅ All modules can be imported
- ✅ Package.json exports are configured correctly
- ✅ API structure (createCalendar, CalendarEngine, etc.)
- ✅ Bundle sizes are reasonable (<100KB)

**Pre-publish hook:**

```bash
npm pack    # Automatically runs test:package first
```

### 3. Manual Tests (Browser)

**Purpose:** Visual testing in real browsers during development

**Run command:**

```bash
npm run test:manual
```

Then open in browser:

- Web component: http://localhost:8080/tests/manual/web-component.html

### 4. Browser Tests (Playwright)

**Purpose:** assert what jsdom cannot — the CSS cascade, `var()` substitution,
and what actually paints. Two regressions reached published versions with the
unit suite green because of that gap.

**First run**, once per machine:

```bash
npm run test:browser:install   # Chromium and WebKit, ~250MB, cached
```

**Run commands:**

```bash
npm run test:browser           # builds, then runs both engines
npm run test:browser:ui        # Playwright UI — pick tests, step, inspect
npm run test:browser:headed    # watch it drive a real window
```

Each builds first: the demo pages load the library from `docs/dist`, so running
against a stale build fails in ways that look like test bugs.

Assertions compare rasterised pixels rather than computed strings, because
`rgba(...)` and `color(srgb ...)` serialize differently and paint identically.
Transitions are disabled in the fixture — computed style read mid-transition
returns interpolated values.

**Note:** For framework integrations, see `docs/examples/` — one page per framework, each unbundled so it mirrors real consumer usage. Their fixtures are validated by `tests/unit/demos/fixtures.test.ts`.

## Testing Stack

- **Test Runner:** Vitest (modern, fast, native ESM/TypeScript)
- **DOM Environment:** jsdom, with custom elements exercised directly
- **Coverage:** Vitest coverage-v8

## Writing Tests

### Test Fixtures

Shared test fixtures are available in `tests/setup.ts`:

```typescript
import { MOCK_EVENTS, TEST_DATE } from '../../../tests/setup';
```

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CalendarEngine } from '../../../src/core';

describe('CalendarEngine', () => {
  describe('Feature Group', () => {
    it('should do something specific', () => {
      const engine = new CalendarEngine({ events: [] });
      expect(engine.getViewModel()).toBeDefined();
    });
  });
});
```

### Running Specific Tests

```bash
# Run tests matching pattern
npm test calendar-engine

# Run tests in specific file
npm test tests/unit/core/utils.test.ts

# Run tests in watch mode for specific file
npm test -- --watch tests/unit/web-components/CalendarElement.test.ts
```

## Continuous Integration

All tests run automatically on:

- Pull requests
- Commits to main branch
- Before publishing (`npm pack`, `npm publish`)

**CI Requirements:**

- ✅ Unit tests must pass
- ✅ Browser tests must pass, on Chromium and WebKit
- ✅ Package validation must pass

## Test vs Examples vs Manual

| Type                  | Purpose                      | Audience            | When to Use               |
| --------------------- | ---------------------------- | ------------------- | ------------------------- |
| **Unit Tests**        | Automated logic verification | Developers          | During development, CI/CD |
| **Integration Tests** | Build artifact validation    | Package maintainers | Before publishing         |
| **Browser Tests**     | Cascade, `var()`, painted output | Developers      | During development, CI/CD |
| **Manual Tests**      | Quick visual checks          | Developers          | During development        |
| **Examples**          | Polished demonstrations      | End users           | Documentation, tutorials  |

## Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

Opens an interactive browser UI to debug tests visually.

### Debugging in VSCode

1. Install "Vitest" extension
2. Click on test file
3. Click "Debug" button next to test

### Verbose Output

```bash
npm test -- --reporter=verbose
```

## Coverage Reports

After running `npm run test:coverage`, view detailed reports:

- **Terminal:** Summary printed to console
- **HTML:** Open `coverage/index.html` in browser
- **JSON:** Machine-readable at `coverage/coverage-final.json`
- **LCOV:** CI integration at `coverage/lcov.info`

## Common Issues

### "Cannot find module" errors

**Solution:** Ensure you've built the project first:

```bash
npm run build
npm run test:package
```

### Tests timing out

**Solution:** Increase timeout in test:

```typescript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Coverage not meeting thresholds

**Solution:** Check uncovered lines:

```bash
npm run test:coverage
# Look for "Uncovered Line #s" column
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **One assertion per test** - Makes failures easy to diagnose
3. **Use descriptive test names** - `it('should X when Y')` format
4. **Isolate tests** - Each test should be independent
5. **Mock external dependencies** - Don't rely on network, filesystem, etc.
6. **Test edge cases** - Empty arrays, null values, boundary conditions
7. **Keep tests fast** - Unit tests should run in <10ms each

## Migration Notes

**Migrated from Jest to Vitest** on 2024-12-30:

- ✅ Faster test execution (50% faster)
- ✅ Native ESM support (no ts-jest needed)
- ✅ Better TypeScript support
- ✅ Jest-compatible API (minimal changes)
- ✅ Shared Vite configuration

All tests were rewritten to ensure 85%+ coverage across the codebase.
