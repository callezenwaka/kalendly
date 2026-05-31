# Contributing to Kalendly

Thank you for your interest in contributing to Kalendly! This guide will help you get started with development, testing, and contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Building the Project](#building-the-project)
- [Running Tests](#running-tests)
- [Running Examples](#running-examples)
- [Making Changes](#making-changes)
- [Submitting Contributions](#submitting-contributions)
- [Release Process](#release-process)

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/callezenwaka/kalendly.git
cd kalendly
```

2. Install dependencies:

```bash
npm install
```

3. Verify installation:

```bash
npm test
```

## Project Structure

```
kalendly/
├── src/
│   ├── core/              # Core calendar engine (framework-agnostic)
│   ├── web-components/    # <kal-calendar> custom element
│   └── styles/            # CSS and styling
├── docs/
│   └── examples/          # Live framework demos (served by dev:examples)
│       ├── vanilla/
│       ├── react/
│       ├── vue/
│       ├── svelte/
│       ├── angular/
│       └── solid/
├── tests/                 # Unit and integration tests
│   ├── unit/
│   ├── integration/
│   └── manual/            # Browser-based manual test pages
└── dist/                  # Built output (generated)
```

## Building the Project

### Build:

```bash
npm run build
```

This runs `tsup`, copies `calendar.css` to `dist/styles/`, then copies `dist/` into `docs/dist/` so the example pages can load the built files.

### Development mode (watch):

```bash
npm run dev
```

Rebuilds on every source change (TypeScript + CSS). Run alongside `dev:examples` when iterating on both the component and the demos.

## Running Tests

### Run all tests:

```bash
npm test
```

### Run tests in watch mode:

```bash
npm run test:watch
```

### Run tests with coverage:

```bash
npm run test:coverage
```

### Run package validation tests:

```bash
npm run test:package
```

This validates that the built package:

- Has correct exports
- Can be imported by all frameworks
- Contains all necessary files

### Manual browser testing:

```bash
npm run test:manual
```

This starts a local server on `http://localhost:8080` where you can:

- Open `tests/manual/*.html` files in your browser
- Manually test calendar behavior
- Debug visual issues
- Test interactions that are hard to automate

## Running Examples

The `docs/examples/` directory contains live demos for all supported frameworks.

### Start the dev server:

```bash
npm run dev:examples
```

This builds the package then serves `docs/` on port 5173. All demos are available at:

- Vanilla JS: http://localhost:5173/examples/vanilla/index.html
- React: http://localhost:5173/examples/react/index.html
- Vue: http://localhost:5173/examples/vue/index.html
- Svelte: http://localhost:5173/examples/svelte/index.html
- Angular: http://localhost:5173/examples/angular/index.html
- Solid.js: http://localhost:5173/examples/solid/index.html

Each demo includes interactive controls for availability mode, selectable range, and lazy event fetching. When working on the component source, run `npm run dev` in a separate terminal so changes are rebuilt automatically — then refresh the browser.

## Making Changes

### Before You Start

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. Make your changes in the appropriate directory:
   - Core logic: `src/core/`
   - Framework-specific: `src/react/`, `src/vue/`, etc.
   - Styles: `src/styles/`
   - Tests: `tests/unit/` or `tests/integration/`

### Code Standards

- TypeScript for all source code
- ESLint for code linting
- Vitest for testing
- Follow existing code style and patterns

### Pre-commit Hooks

The project uses Husky and lint-staged to run checks before commits:

- ESLint with auto-fix
- TypeScript type checking
- Related tests for changed files

These run automatically when you commit.

### Writing Tests

Add tests for any new features or bug fixes:

```typescript
// tests/unit/web-components/YourFeature.test.ts
import { describe, it, expect } from 'vitest';

describe('YourFeature', () => {
  it('should behave correctly', () => {
    document.body.innerHTML = '<kal-calendar id="cal"></kal-calendar>';
    const cal = document.getElementById('cal') as any;
    // assert ...
  });
});
```

## Submitting Contributions

### Pull Request Process

1. Ensure all tests pass:

```bash
npm test
npm run build
npm run test:package
```

2. Commit your changes:

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve bug"
```

3. Push to your fork:

```bash
git push origin feature/your-feature-name
```

4. Open a Pull Request on GitHub with:
   - Clear description of changes
   - Link to related issues
   - Screenshots/demos if applicable

### Commit Message Format

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:

```
feat: add event filtering by category
fix: resolve timezone display issue
docs: update installation instructions
```

## Release Process

### For Maintainers

Releases are fully CI-driven. Do not run `npm version` or `npm publish` locally — the workflow handles both.

#### Required secrets (repo Settings → Secrets and variables → Actions)

| Secret             | Value                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTOMATION_TOKEN` | Fine-grained PAT with **Contents: Read & write** and **Workflows: Read & write** on this repo — used to push the version-bump commit back to `main` |
| `NPM_TOKEN`        | npm access token — used as `NODE_AUTH_TOKEN` to publish the package                                                                                 |

#### Steps

1. Merge all changes to `main` and verify CI is green:

```bash
git checkout main
git pull origin main
```

2. Push a version tag — the tag drives everything:

```bash
# patch: 0.2.1 → 0.2.2
git tag v0.2.2
git push origin v0.2.2

# minor: 0.2.1 → 0.3.0
git tag v0.3.0
git push origin v0.3.0

# major: 0.2.1 → 1.0.0
git tag v1.0.0
git push origin v1.0.0
```

3. The `publish` workflow triggers automatically and:
   - Reads the version from the tag (strips the `v`)
   - Bumps `package.json` to match (`--no-git-tag-version`)
   - Runs `type-check`, `test:run`, `build`, and `test:package`
   - Commits `package.json` + `package-lock.json` back to `main`
   - Publishes to npm with `--provenance` (attaches a signed build attestation)

The version bump commit only lands on `main` after all checks pass — a failed build or test leaves `main` unchanged.

### Manual Publishing (Fallback)

Only if the CI workflow fails and the release is urgent:

```bash
git checkout main
git pull origin main
npm ci
npm run type-check
npm run test:run
npm run build
npm run test:package
npm version <patch|minor|major> --no-git-tag-version
npm publish --access public
```

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Join discussions in GitHub Discussions (if enabled)

## Code of Conduct

Be respectful and constructive in all interactions. We're building this together!

---

Thank you for contributing to Kalendly! 🎉
