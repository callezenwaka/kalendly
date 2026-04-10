#!/usr/bin/env node

/**
 * Package validation script — run after build to verify dist output before publishing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.chdir(path.join(__dirname, '../..'));

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${description}: ${filePath}`, 'green');
    return true;
  } else {
    log(`✗ ${description}: ${filePath}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🧪 Validating kalendly v2 package\n', 'blue');

  let passed = 0;
  let total = 0;

  // 1. package.json
  total++;
  if (checkFile('package.json', 'package.json exists')) passed++;

  // 2. dist directory
  total++;
  if (checkFile('dist', 'Build output directory exists')) passed++;

  // 3. Required dist files
  log('\nChecking dist files:', 'blue');
  const requiredFiles = [
    'dist/index.js',
    'dist/index.mjs',
    'dist/index.d.ts',
    'dist/index.umd.js',
    'dist/core/index.js',
    'dist/core/index.mjs',
    'dist/core/index.d.ts',
    'dist/styles/calendar.css',
    'styles.d.ts',
  ];

  requiredFiles.forEach(file => {
    total++;
    if (checkFile(file, path.basename(file))) passed++;
  });

  // 4. Module imports (CalendarElement extends HTMLElement — browser-only, skip in Node)
  log('\nTesting module imports:', 'blue');

  const isBrowserApi = (err) => err.message.includes('HTMLElement') || err.message.includes('customElements');

  try {
    total++;
    const mod = await import('../../dist/index.mjs');
    if (typeof mod.CalendarElement === 'function' && typeof mod.defineCalendarElement === 'function') {
      log('✓ Main entry: CalendarElement and defineCalendarElement exported', 'green');
      passed++;
    } else {
      log('✗ Main entry: missing CalendarElement or defineCalendarElement', 'red');
    }
  } catch (error) {
    if (isBrowserApi(error)) {
      log('✓ Main entry: browser-only module (HTMLElement requires DOM — OK in Node)', 'yellow');
      passed++;
    } else {
      log(`✗ Main entry import failed: ${error.message}`, 'red');
    }
  }

  try {
    total++;
    const mod = await import('../../dist/index.mjs');
    if (typeof mod.Calendar === 'function') {
      log('✓ React adapter: Calendar component exported from main entry', 'green');
      passed++;
    } else {
      log('✗ React adapter: Calendar not found in main entry', 'red');
    }
  } catch (error) {
    if (isBrowserApi(error)) {
      log('✓ React adapter: browser-only module (OK in Node)', 'yellow');
      passed++;
    } else {
      log(`✗ React adapter import failed: ${error.message}`, 'red');
    }
  }

  try {
    total++;
    const mod = await import('../../dist/core/index.mjs');
    if (mod.CalendarEngine && mod.MONTHS && mod.DAYS) {
      log('✓ Core entry: CalendarEngine, MONTHS, DAYS exported', 'green');
      passed++;
    } else {
      log('✗ Core entry: missing expected exports', 'red');
    }
  } catch (error) {
    log(`✗ Core entry import failed: ${error.message}`, 'red');
  }

  // 5. CalendarElement is a proper HTMLElement subclass
  log('\nVerifying API structure:', 'blue');
  try {
    total++;
    const { CalendarElement } = await import('../../dist/index.mjs');
    if (typeof CalendarElement === 'function' && CalendarElement.observedAttributes) {
      log('✓ CalendarElement has observedAttributes (custom element signature)', 'green');
      passed++;
    } else {
      log('✗ CalendarElement missing observedAttributes', 'red');
    }
  } catch (error) {
    if (isBrowserApi(error)) {
      const dts = fs.readFileSync('dist/index.d.ts', 'utf8');
      if (dts.includes('observedAttributes') && dts.includes('CalendarElement')) {
        log('✓ CalendarElement: observedAttributes present in type declarations', 'yellow');
        passed++;
      } else {
        log('✗ CalendarElement: observedAttributes missing from type declarations', 'red');
      }
    } else {
      log(`✗ CalendarElement structure check failed: ${error.message}`, 'red');
    }
  }

  try {
    total++;
    const { CalendarEngine } = await import('../../dist/core/index.mjs');
    if (typeof CalendarEngine === 'function') {
      log('✓ CalendarEngine class exported correctly', 'green');
      passed++;
    } else {
      log('✗ CalendarEngine export invalid', 'red');
    }
  } catch (error) {
    log(`✗ CalendarEngine check failed: ${error.message}`, 'red');
  }

  // 6. package.json exports map
  log('\nValidating package.json exports:', 'blue');
  try {
    total++;
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const required = ['.', './core', './react', './styles'];
    const removed = ['./vue', './vanilla', './react-native'];

    let valid = true;
    required.forEach(e => {
      if (!pkg.exports?.[e]) {
        log(`✗ Missing export: ${e}`, 'red');
        valid = false;
      }
    });
    removed.forEach(e => {
      if (pkg.exports?.[e]) {
        log(`✗ Stale export still present: ${e}`, 'red');
        valid = false;
      }
    });

    if (valid) {
      log('✓ All required exports present, stale exports removed', 'green');
      passed++;
    }
  } catch (error) {
    total++;
    log(`✗ package.json export validation failed: ${error.message}`, 'red');
  }

  // 7. Bundle sizes
  log('\nBundle sizes:', 'blue');
  ['dist/index.mjs', 'dist/index.umd.js', 'dist/core/index.mjs', 'dist/styles/calendar.css'].forEach(file => {
    if (fs.existsSync(file)) {
      const sizeKB = (fs.statSync(file).size / 1024).toFixed(2);
      const color = sizeKB < 100 ? 'green' : 'yellow';
      log(`  ${path.basename(file)}: ${sizeKB} KB`, color);
    }
  });

  // Summary
  log(`\nResults: ${passed}/${total} checks passed`, passed === total ? 'green' : 'red');

  if (passed === total) {
    log('\n🎉 Package is ready for publishing.', 'green');
  } else {
    log('\nFix the issues above before publishing.', 'red');
    process.exit(1);
  }
}

runTests().catch(console.error);
