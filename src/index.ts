// Main entry point - exports core functionality
// For framework-specific implementations, use:
//   - kalendly/vanilla
//   - kalendly/react
//   - kalendly/vue
//   - kalendly/react-native

// Core exports
export * from './core';

// Framework-specific exports (Vue is excluded as it's built separately with Vite)
export * as React from './react';
export * as ReactNative from './react-native';
export * as Vanilla from './vanilla';

// Main package info
export const version = '1.0.0';
export const name = 'kalendly';

// Convenience re-exports for common usage
export { Calendar as ReactCalendar } from './react';
export { Calendar as ReactNativeCalendar } from './react-native';
export { createCalendar as createVanillaCalendar } from './vanilla';

// Note: For Vue, import directly from 'kalendly/vue'
