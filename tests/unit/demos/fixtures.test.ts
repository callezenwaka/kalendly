import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CalendarEvent } from '../../../src/core/types';
import {
  bookedSlots,
  eventCoversDate,
  parseHourRanges,
  parseTimeToMinutes,
} from '../../../src/core/utils';

// The demos are unbundled HTML, so nothing type-checks their fixtures. This
// reads them back out and runs them through the library's own functions.

const DEMOS = resolve(__dirname, '../../../docs/examples');
const MANUAL = resolve(__dirname, '../../manual/web-component.html');
const LANDING = resolve(__dirname, '../../../docs/index.html');

const ARRAY_NAMES = [
  'normalEvents',
  'leanEvents',
  'SAMPLE_EVENTS',
  'LEAN_EVENTS',
  'cal.events',
];

function extractArrays(source: string): CalendarEvent[] {
  const thisMonth = (day: number) => new Date(2024, 0, day);
  const now = new Date(2024, 0, 1);
  const events: CalendarEvent[] = [];

  for (const name of ARRAY_NAMES) {
    const match = new RegExp(
      `\\b${name.replace('.', '\\.')}(?:\\s*,\\s*\\w+\\s*\\])?\\s*=\\s*(?:ref\\(|useState\\()?\\s*(\\[[\\s\\S]*?\\n\\s*\\])`
    ).exec(source);
    if (!match) continue;

    const build = new Function('thisMonth', 'now', `return ${match[1]};`) as (
      f: (d: number) => Date,
      n: Date
    ) => CalendarEvent[];
    events.push(...build(thisMonth, now));
  }

  return events;
}

// The landing page is a marketing preview, so it is held to the same data
// rules but is not expected to show off an untitled card.
const pages = [
  ...readdirSync(DEMOS, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(
      entry =>
        [entry.name, resolve(DEMOS, entry.name, 'index.html'), true] as const
    )
    .filter(([, file]) => {
      try {
        readFileSync(file, 'utf-8');
        return true;
      } catch {
        return false;
      }
    }),
  ['manual', MANUAL, true],
  ['landing', LANDING, false],
] as Array<[string, string, boolean]>;

describe('demo fixtures', () => {
  it('finds every demo page', () => {
    expect(pages.length).toBeGreaterThanOrEqual(8);
  });

  describe.each(pages)('%s', (_name, file, isFeatureDemo) => {
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

    it.runIf(isFeatureDemo)('ships fixtures for availability mode', () => {
      const lean = events.filter(e => e.availabilityStatus !== undefined);
      expect(lean.length).toBeGreaterThan(0);
    });

    it.runIf(isFeatureDemo)('exercises the untitled-card path', () => {
      const cards = events.filter(e => e.availabilityStatus === undefined);
      expect(cards.some(e => e.name === undefined)).toBe(true);
    });

    it('always pairs a startTime with an endTime', () => {
      for (const event of events) {
        if (event.startTime === undefined) continue;
        expect(event.endTime, `event ${event.id}`).toBeDefined();
      }
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

    // Every page offers slot lengths and opening-hours presets as independent
    // controls, so any pairing is reachable by clicking.
    it('offers no slot length and hours pairing that throws', () => {
      const durations = [
        ...source.matchAll(
          /slot-duration['"]?,\s*String\((\d+)\)|slot-(\d+)|\[60, 30, 15\]/g
        ),
      ].length
        ? [60, 30, 15]
        : [60];

      const presets = [
        ...source.matchAll(
          /'(\d{2}:\d{2}-\d{2}:\d{2}(?:,\d{2}:\d{2}-\d{2}:\d{2})*)'/g
        ),
      ].map(m => m[1]);

      for (const preset of presets) {
        for (const duration of durations) {
          expect(
            () => parseHourRanges(preset, duration),
            `${preset} at ${duration}min`
          ).not.toThrow();
        }
      }
    });

    // These attributes throw on invalid input, so a demo offering a bad value
    // would fail at the click rather than degrading.
    it('offers only attribute values the component accepts', () => {
      const months = [...source.matchAll(/setMonths\((\d+)\)/g)].map(m =>
        Number(m[1])
      );
      for (const count of months) {
        expect(Number.isInteger(count) && count >= 1 && count <= 2).toBe(true);
      }

      const durations = [
        ...source.matchAll(/setSlotDuration\((\d+)\)|slot-(\d+)/g),
      ].map(m => Number(m[1] ?? m[2]));
      for (const minutes of durations) {
        expect(Number.isInteger(minutes) && 1440 % minutes === 0).toBe(true);
      }
    });

    it('renders a time grid without throwing', () => {
      const lean = events.filter(e => e.availabilityStatus !== undefined);
      expect(() => bookedSlots(lean, new Date(2024, 0, 15), 60)).not.toThrow();
      expect(() => bookedSlots(lean, new Date(2024, 0, 15), 30)).not.toThrow();
    });
  });
});

// The component has no shadow DOM, so a demo styling a bare `button` also
// styles the calendar's own buttons. That makes the demo misrepresent the
// library — the month picker rendered with the demo's brand colour on hover,
// not the library's.
describe('demo stylesheets', () => {
  const RENDERED = [
    'button',
    'input',
    'select',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'a',
    'h2',
  ];

  const styleBlock = (source: string): string =>
    source
      .split('<style>')
      .slice(1)
      .map(chunk => chunk.split('</style>')[0])
      .join('\n');

  const bareSelector = new RegExp(
    `^\\s+(${RENDERED.join('|')})\\b[^{\\n]*\\{`,
    'gm'
  );

  describe.each(pages)('%s', (_name, file) => {
    it('scopes its own styles so they cannot reach inside the calendar', () => {
      const offenders = [
        ...styleBlock(readFileSync(file, 'utf-8')).matchAll(bareSelector),
      ].map(m => m[0].trim());

      expect(offenders).toEqual([]);
    });
  });
});

// The manual page fed an attribute value straight into an innerHTML log line,
// so a payload passed to the component executed in the page instead. Event
// names and attribute values both reach the logger.
describe('demo pages do not build markup from data', () => {
  describe.each(pages)('%s', (_name, file) => {
    it('never assigns innerHTML in a log helper', () => {
      const source = readFileSync(file, 'utf-8');
      const sinks = source
        .split('\n')
        .map((line, i) => [i + 1, line.trim()] as const)
        .filter(([, line]) => /\.innerHTML\s*=/.test(line))
        .filter(([, line]) => /log|line|entry|message/i.test(line))
        .map(([n, line]) => `${n}: ${line}`);

      expect(sinks).toEqual([]);
    });
  });
});
