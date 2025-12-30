import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Test fixtures - Sample events for testing
export const MOCK_EVENTS = [
  {
    id: 1,
    name: 'Team Meeting',
    date: '2024-01-15',
    description: 'Weekly sync',
    color: '#3b82f6',
  },
  {
    id: 2,
    name: 'Project Review',
    date: '2024-01-20',
    description: 'Q1 review',
    color: '#10b981',
  },
  {
    id: 3,
    name: 'Code Review',
    date: '2024-01-15',
    description: 'PR reviews',
    color: '#f59e0b',
  },
];

// Common test dates
export const TEST_DATE = new Date('2024-01-15T12:00:00Z');
export const LEAP_YEAR_FEB_29 = new Date('2024-02-29T12:00:00Z');
export const NON_LEAP_YEAR_FEB_28 = new Date('2023-02-28T12:00:00Z');
export const END_OF_MONTH = new Date('2024-01-31T12:00:00Z');
export const START_OF_MONTH = new Date('2024-02-01T12:00:00Z');
