// Root entry point — delegates to the web-components barrel.
// Import from 'kalendly'       → CalendarElement, Calendar (React adapter), core re-exports
// Import from 'kalendly/core'  → CalendarEngine, types, utils only
// Import from 'kalendly/react' → same as 'kalendly', aliased for React consumers
export * from './web-components';
