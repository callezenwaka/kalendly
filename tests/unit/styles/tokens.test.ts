import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const COMPONENT = readFileSync(
  resolve(__dirname, '../../../src/web-components/CalendarElement.ts'),
  'utf-8'
);

const CSS = readFileSync(
  resolve(__dirname, '../../../src/styles/calendar.css'),
  'utf-8'
);

// One entry per declaration, so a value wrapped across lines stays whole
const declarations = (): Array<[string, string]> =>
  CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .map(chunk => chunk.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .map(chunk => {
      // drop any selector prefix first — `:root` carries a colon of its own
      const body = chunk.split('{').pop()!.trim();
      const colon = body.indexOf(':');
      return colon === -1
        ? (['', body] as [string, string])
        : ([body.slice(0, colon).trim(), body.slice(colon + 1).trim()] as [
            string,
            string,
          ]);
    });

// rgba(var(--x), .1) takes its colour from a token; only the alpha is literal
const stripTokenRefs = (value: string): string =>
  value
    .replace(/rgba?\(\s*var\([^)]*\)[^)]*\)/g, '')
    .replace(/var\([^)]*\)/g, '');

const COLOUR =
  /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\b(white|black|red|green|blue|gray|grey)\b/;

describe('design tokens', () => {
  it('keeps every colour literal inside a token declaration', () => {
    const offenders = declarations()
      .filter(([prop]) => !prop.startsWith('--'))
      .filter(([, value]) => COLOUR.test(stripTokenRefs(value)))
      .map(([prop, value]) => `${prop}: ${value}`);

    expect(offenders).toEqual([]);
  });

  it('resolves every var() reference to a declared token or a fallback', () => {
    const declared = new Set(
      [...CSS.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(m => m[1])
    );

    const undeclared = [
      ...new Set(
        [...CSS.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)]
          .filter(m => m[2] === ')')
          .map(m => m[1])
      ),
    ].filter(name => !declared.has(name));

    expect(undeclared).toEqual([]);
  });

  // A token declared as var() of another resolves in the scope it is declared
  // in, so an element-level override of the base never reaches it. v0.3.3
  // shipped exactly that and broke --kalendly-primary-color set on
  // <kal-calendar>. Defaults belong in a use-site fallback instead.
  it('never derives one semantic token from another at :root', () => {
    const derived = declarations()
      .filter(([prop]) => prop.startsWith('--kalendly-'))
      .filter(([, value]) => /var\(\s*--kalendly-/.test(value))
      .map(([prop, value]) => `${prop}: ${value}`);

    expect(derived).toEqual([]);
  });
});

// Every name the stylesheet ships is one a consumer could otherwise own.
// `.badge` shipped unprefixed and uppercased every badge in any application
// that imported the stylesheet alongside Bootstrap, Bulma or similar.
describe('namespacing', () => {
  const selectorText = CSS.replace(/\{[^{}]*\}/g, '{}');

  it('prefixes every class with kalendly-', () => {
    const classes = [...new Set(selectorText.match(/\.[a-zA-Z][\w-]*/g) ?? [])];
    const unprefixed = classes.filter(c => !c.startsWith('.kalendly'));

    expect(unprefixed).toEqual([]);
  });

  it('keeps every semantic token under --kalendly-', () => {
    const declared = [...CSS.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(m => m[1]);
    const stray = [
      ...new Set(
        declared.filter(t => !t.startsWith('--kalendly-') && !t.startsWith('--kal-'))
      ),
    ];

    expect(stray).toEqual([]);
  });

  it('declares no token it never reads', () => {
    const declared = new Set(
      [...CSS.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(m => m[1])
    );
    const used = new Set([...CSS.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]));
    const themed = new Set(
      [...COMPONENT.matchAll(/'(--[\w-]+)'/g)].map(m => m[1])
    );

    const dead = [...declared].filter(t => !used.has(t) && !themed.has(t));
    expect(dead.sort()).toEqual([]);
  });
});
