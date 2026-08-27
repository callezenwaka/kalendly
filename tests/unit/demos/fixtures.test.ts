import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CalendarEvent } from '../../../src/core/types';
import {
  bookedSlots,
  eventCoversDate,
  parseTimeToMinutes,
} from '../../../src/core/utils';

// The demos are unbundled HTML, so nothing type-checks their fixtures. This
// reads them back out and runs them through the library's own functions.

const DEMOS = resolve(__dirname, '../../../docs/examples');
const MANUAL = resolve(__dirname, '../../manual/web-component.html');

const ARRAY_NAMES = [
  'normalEvents',
  'leanEvents',
  'SAMPLE_EVENTS',
  'LEAN_EVENTS',
];

function extractArrays(source: string): CalendarEvent[] {
  const thisMonth = (day: number) => new Date(2024, 0, day);
  const events: CalendarEvent[] = [];

  for (const name of ARRAY_NAMES) {
    const match = new RegExp(
      `\\b${name}(?:\\s*,\\s*\\w+\\s*\\])?\\s*=\\s*(?:ref\\(|useState\\()?\\s*(\\[[\\s\\S]*?\\n\\s*\\])`
    ).exec(source);
    if (!match) continue;

    const build = new Function('thisMonth', `return ${match[1]};`) as (
      f: (d: number) => Date
    ) => CalendarEvent[];
    events.push(...build(thisMonth));
  }

  return events;
}

const pages = [
  ...readdirSync(DEMOS, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => [entry.name, resolve(DEMOS, entry.name, 'index.html')])
    .filter(([, file]) => {
      try {
        readFileSync(file, 'utf-8');
        return true;
      } catch {
        return false;
      }
    }),
  ['manual', MANUAL],
] as Array<[string, string]>;

describe('demo fixtures', () => {
  it('finds every demo page', () => {
    expect(pages.length).toBeGreaterThanOrEqual(7);
  });

  describe.each(pages)('%s', (_name, file) => {
    const source = readFileSync(file, 'utf-8');
    const events = extractArrays(source);

    it('extracts every event the page declares', () => {
      const declared = source.match(/\bid: [0-9]/g) ?? [];
      expect(events.length).toBe(declared.length);
    });

    it('gives every event an id and a readable date', () => {
      for (const event of events) {
        expect(event.id).toBeDefined();
        expect(Number.isNaN(new Date(event.date).getTime())).toBe(false);
      }
    });

    it('uses only bucket names the library knows', () => {
      const known = ['open', 'conditional', 'blocked'];
      for (const event of events) {
        if (event.availabilityStatus === undefined) continue;
        expect(known).toContain(event.availabilityStatus);
      }
    });

    it('ships fixtures for availability mode', () => {
      const lean = events.filter(e => e.availabilityStatus !== undefined);
      expect(lean.length).toBeGreaterThan(0);
    });

    it('exercises the untitled-card path', () => {
      const cards = events.filter(e => e.availabilityStatus === undefined);
      expect(cards.some(e => e.name === undefined)).toBe(true);
    });

    it('writes times the library can parse', () => {
      for (const event of events) {
        for (const time of [event.startTime, event.endTime]) {
          if (time === undefined) continue;
          expect(parseTimeToMinutes(time)).not.toBeNull();
        }
      }
    });

    it('never puts an endDate before its date', () => {
      for (const event of events) {
        if (event.endDate === undefined) continue;
        expect(() =>
          eventCoversDate(event, new Date(event.date))
        ).not.toThrow();
      }
    });

    it('renders a time grid without throwing', () => {
      const lean = events.filter(e => e.availabilityStatus !== undefined);
      expect(() => bookedSlots(lean, new Date(2024, 0, 15), 60)).not.toThrow();
      expect(() => bookedSlots(lean, new Date(2024, 0, 15), 30)).not.toThrow();
    });
  });
});
