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
│   ├── react/             # React components
│   ├── react-native/      # React Native components
│   ├── vue/               # Vue components
│   ├── vanilla/           # Vanilla JavaScript implementation
│   └── styles/            # CSS and styling
├── examples/              # Demo applications
│   ├── react/
│   ├── react-native/
│   ├── vue/
│   └── vanilla/
├── tests/                 # Unit and integration tests
│   ├── unit/
│   └── integration/
└── dist/                  # Built output (generated)
```

## Building the Project

### Build all frameworks:

```bash
npm run build
```

This runs:

- `tsup` for React, React Native, and Vanilla builds
- `vite build` for Vue build

### Build specific frameworks:

```bash
# Build React/React Native/Vanilla
npm run build:tsup

# Build Vue
npm run build:vue
```

### Development mode (watch):

```bash
# Watch React/React Native/Vanilla
npm run dev:tsup

# Watch Vue
npm run dev:vue
```

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

The `examples/` directory contains demo applications for each framework.

### React Example:

```bash
cd examples/react
npm install
npm run dev
# Open http://localhost:5173
```

### Vue Example:

```bash
cd examples/vue
npm install
npm run dev
# Open http://localhost:5174
```

### Vanilla JavaScript Example:

```bash
cd examples/vanilla
# Open index.html in your browser
# Or use a simple HTTP server:
npx serve .
```

### React Native Example:

```bash
cd examples/react-native
npm install

# For iOS:
npm run ios

# For Android:
npm run android
```

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
// tests/unit/react/YourFeature.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YourComponent } from '../../../src/react/components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeTruthy();
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

The project uses GitHub Actions for automated publishing with npm Trusted Publishing.

1. Ensure all changes are merged to `main`:

```bash
git checkout main
git pull origin main
```

2. Update version in package.json:

```bash
# For patches (0.1.0 → 0.1.1)
npm version patch

# For minor (0.1.0 → 0.2.0)
npm version minor

# For major (0.1.0 → 1.0.0)
npm version major
```

3. Push with tags:

```bash
git push origin main --follow-tags
```

4. GitHub Actions will automatically:
   - Run all tests
   - Build the package
   - Validate the package
   - Publish to npm with provenance

### Manual Publishing (Fallback)

If GitHub Actions fails:

```bash
npm run build
npm test
npm run test:package
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
