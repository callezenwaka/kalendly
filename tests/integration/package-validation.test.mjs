#!/usr/bin/env node

/**
 * Local NPM Package Testing Script
 * Run this to validate your package before publishing
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Change to project root directory
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
        log(`✅ ${description}: ${filePath}`, 'green');
        return true;
    } else {
        log(`❌ ${description}: ${filePath}`, 'red');
        return false;
    }
}

async function runTests() {
    log('\n🧪 Testing kalendly Calendar Scheduler Package\n', 'blue');
    
    let passed = 0;
    let total = 0;
    
    // Test 1: Check if package.json exists
    total++;
    if (checkFile('package.json', 'Package.json exists')) {
        passed++;
    }
    
    // Test 2: Check if build ran
    total++;
    if (checkFile('dist', 'Build output directory exists')) {
        passed++;
    }
    
    // Test 3: Check core files
    const coreFiles = [
        'dist/index.js',
        'dist/index.mjs',
        'dist/index.d.ts',
        'dist/core/index.js',
        'dist/core/index.mjs',
        'dist/core/index.d.ts',
        'dist/vanilla/index.js',
        'dist/vanilla/index.mjs',
        'dist/vanilla/index.d.ts',
        'dist/react/index.js',
        'dist/react/index.mjs',
        'dist/react/index.d.ts',
        'dist/vue/index.js',
        'dist/vue/index.mjs',
        // Note: Vue build uses Vite and doesn't generate .d.ts files
        'dist/styles/calendar.css'
    ];
    
    coreFiles.forEach(file => {
        total++;
        if (checkFile(file, `Build file: ${path.basename(file)}`)) {
            passed++;
        }
    });
    
    // Test 4: Try importing modules
    log('\n📦 Testing Module Imports:', 'blue');
    
    try {
        total++;
        const { createCalendar } = await import('../../dist/vanilla/index.mjs');
        if (typeof createCalendar === 'function') {
            log('✅ Vanilla JS import successful', 'green');
            passed++;
        } else {
            log('❌ Vanilla JS import failed - createCalendar not a function', 'red');
        }
    } catch (error) {
        total++;
        log(`❌ Vanilla JS import failed: ${error.message}`, 'red');
    }

    try {
        total++;
        const coreModule = await import('../../dist/core/index.mjs');
        if (coreModule.CalendarEngine && coreModule.MONTHS && coreModule.DAYS) {
            log('✅ Core module import successful', 'green');
            passed++;
        } else {
            log('❌ Core module import failed - missing exports', 'red');
        }
    } catch (error) {
        total++;
        log(`❌ Core module import failed: ${error.message}`, 'red');
    }

    try {
        total++;
        const { Calendar: ReactCalendar } = await import('../../dist/react/index.mjs');
        if (typeof ReactCalendar === 'function') {
            log('✅ React module import successful', 'green');
            passed++;
        } else {
            log('❌ React module import failed', 'red');
        }
    } catch (error) {
        total++;
        log(`❌ React module import failed: ${error.message}`, 'red');
    }

    try {
        total++;
        const vueModule = await import('../../dist/vue/index.mjs');
        if (vueModule.default || vueModule.Calendar) {
            log('✅ Vue module import successful', 'green');
            passed++;
        } else {
            log('❌ Vue module import failed - missing default export', 'red');
        }
    } catch (error) {
        total++;
        log(`❌ Vue module import failed: ${error.message}`, 'red');
    }

    // Test 5: Validate package.json exports
    log('\n📋 Validating package.json exports:', 'blue');
    try {
        total++;
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredExports = ['.', './core', './react', './vue', './react-native', './vanilla', './styles'];
        
        let exportsValid = true;
        requiredExports.forEach(exportPath => {
            if (!packageJson.exports || !packageJson.exports[exportPath]) {
                log(`❌ Missing export: ${exportPath}`, 'red');
                exportsValid = false;
            }
        });
        
        if (exportsValid) {
            log('✅ All required exports present in package.json', 'green');
            passed++;
        }
    } catch (error) {
        total++;
        log(`❌ Failed to validate package.json: ${error.message}`, 'red');
    }
    
    // Test 6: Verify API structure
    log('\n🗓️ Verifying API Structure:', 'blue');
    try {
        total++;
        const { createCalendar, VanillaCalendar } = await import('../../dist/vanilla/index.mjs');
        const { CalendarEngine } = await import('../../dist/core/index.mjs');

        // Verify exports are the correct types
        if (typeof createCalendar === 'function' && typeof VanillaCalendar === 'function') {
            log('✅ Vanilla Calendar API exports validated', 'green');
            passed++;
        } else {
            log('❌ Vanilla Calendar API structure invalid', 'red');
        }

        total++;
        if (typeof CalendarEngine === 'function') {
            log('✅ CalendarEngine class exported correctly', 'green');
            passed++;
        } else {
            log('❌ CalendarEngine export invalid', 'red');
        }

        // Note: Actual calendar creation requires DOM (tested in unit tests with jsdom)
    } catch (error) {
        total++;
        log(`❌ API structure validation failed: ${error.message}`, 'red');
    }
    
    // Test 7: Check file sizes
    log('\n📏 Checking Bundle Sizes:', 'blue');
    const bundleFiles = [
        'dist/vanilla/index.mjs',
        'dist/core/index.mjs',
        'dist/styles/calendar.css'
    ];
    
    bundleFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            const sizeKB = (stats.size / 1024).toFixed(2);
            if (sizeKB < 100) { // Reasonable size check
                log(`✅ ${path.basename(file)}: ${sizeKB}KB`, 'green');
            } else {
                log(`⚠️  ${path.basename(file)}: ${sizeKB}KB (large)`, 'yellow');
            }
        }
    });
    
    // Summary
    log(`\n📊 Test Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');
    
    if (passed === total) {
        log('\n🎉 All tests passed! Your package is ready for publishing.', 'green');
        log('\nNext steps:', 'blue');
        log('1. Test with the provided HTML files');
        log('2. Run: npm publish --dry-run');
        log('3. Run: npm publish');
    } else {
        log('\n❌ Some tests failed. Please fix the issues before publishing.', 'red');
        process.exit(1);
    }
}

// Run the tests
runTests().catch(console.error);