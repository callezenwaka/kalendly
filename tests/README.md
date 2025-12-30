# Tests

This directory contains comprehensive testing for the Kalendly calendar library.

## Directory Structure

```
tests/
├── unit/                           # Unit tests (Vitest)
│   ├── core/                       # Core engine tests
│   │   ├── calendar-engine.test.ts # 46 tests - CalendarEngine class
│   │   └── utils.test.ts           # 60 tests - Utility functions
│   ├── react/                      # React component tests
│   │   ├── Calendar.test.tsx       # 30 tests - React Calendar
│   │   └── DatePopup.test.tsx      # 13 tests - React DatePopup
│   ├── vue/                        # Vue component tests
│   │   └── Calendar.test.ts        # 25 tests - Vue Calendar
│   └── vanilla/                    # Vanilla JS tests
│       └── Calendar.test.ts        # 30 tests - Vanilla Calendar
├── integration/                    # Integration tests
│   └── package-validation.test.mjs # 24 tests - Pre-publish validation
├── manual/                         # Manual browser testing
│   └── vanilla.html                # Test vanilla JS implementation
├── setup.ts                        # Vitest setup & test fixtures
└── README.md                       # This file
```

## Test Types

### 1. Unit Tests (Vitest)

**Purpose:** Test code logic in isolation with 97%+ coverage

**Total:** 204 tests across all modules

**Run commands:**

```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:ui       # Visual UI
npm run test:coverage # Generate coverage report
npm run test:watch    # Watch mode (explicit)
```

**Coverage thresholds:**

- Lines: 85% minimum (achieving 98.47%)
- Functions: 85% minimum (achieving 97.22%)
- Branches: 80% minimum (achieving 86.66%)
- Statements: 85% minimum (achieving 97.68%)

**Module breakdown:**
| Module | Tests | Coverage |
|--------|-------|----------|
| Core (engine) | 46 | 100% statements, 100% branches |
| Core (utils) | 60 | 100% statements, 96.87% branches |
| React | 43 | 96.92% statements, 83.87% branches |
| Vue | 25 | 94.36% statements, 68.18% branches |
| Vanilla | 30 | 97.87% statements, 86.79% branches |

### 2. Integration Tests (Node.js)

**Purpose:** Validate build artifacts before publishing to npm

**Total:** 24 tests

**Run command:**

```bash
npm run test:package
```

**What it validates:**

- ✅ Build artifacts exist (CJS, ESM, TypeScript definitions)
- ✅ All modules can be imported (Vanilla, Core, React, Vue)
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

- Vanilla JS: http://localhost:8080/tests/manual/vanilla.html

**Note:** React and Vue manual tests have been removed. For React/Vue examples, see the `examples/` directory (these are for code reference only and may not run directly in browser without a build step).

## Testing Stack

- **Test Runner:** Vitest (modern, fast, native ESM/TypeScript)
- **Testing Libraries:**
  - @testing-library/react (React component testing)
  - @testing-library/vue (Vue component testing)
  - @testing-library/jest-dom (Custom DOM matchers)
- **DOM Environment:** jsdom (for unit tests)
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
npm test -- --watch tests/unit/react/Calendar.test.tsx
```

## Continuous Integration

All tests run automatically on:

- Pull requests
- Commits to main branch
- Before publishing (`npm pack`, `npm publish`)

**CI Requirements:**

- ✅ All 204 unit tests must pass
- ✅ All 24 integration tests must pass
- ✅ Coverage thresholds must be met (85%+ lines, 80%+ branches)

## Test vs Examples vs Manual

| Type                  | Purpose                      | Audience            | When to Use               |
| --------------------- | ---------------------------- | ------------------- | ------------------------- |
| **Unit Tests**        | Automated logic verification | Developers          | During development, CI/CD |
| **Integration Tests** | Build artifact validation    | Package maintainers | Before publishing         |
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
