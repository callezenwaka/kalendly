import type { Locator, Page } from '@playwright/test';

// Computed colours serialize differently depending on how they were authored —
// `rgba(...)` from rgba(), `color(srgb ...)` from color-mix(). Rasterising over
// a known background normalises all of them to painted pixels, so assertions
// survive a change of authoring syntax.
export async function paintedColor(
  page: Page,
  locator: Locator,
  property:
    | 'backgroundColor'
    | 'color'
    | 'borderTopColor'
    | 'outlineColor' = 'backgroundColor'
): Promise<string> {
  const css = await locator.evaluate(
    (el, prop) => getComputedStyle(el)[prop as 'backgroundColor'],
    property
  );

  return page.evaluate(value => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `${r},${g},${b}`;
  }, css);
}

// The component batches renders on a microtask and exposes updateComplete.
// Waiting on it beats any timeout.
export async function settled(page: Page, selector = '#cal'): Promise<void> {
  await page.waitForFunction(async sel => {
    const el = document.querySelector(sel) as
      | (HTMLElement & { updateComplete?: Promise<void> })
      | null;
    if (!el) return false;
    await el.updateComplete;
    return true;
  }, selector);
}

export async function openDemo(page: Page, name = 'vanilla'): Promise<void> {
  await page.goto(`/examples/${name}/`);

  // The component transitions background-color over 0.2s. Reading computed
  // style mid-transition returns an interpolated value, so assertions would be
  // timing-dependent. Removing transitions makes every read the settled one.
  await page.addStyleTag({
    content: `*, *::before, *::after {
      transition: none !important;
      animation: none !important;
    }`,
  });

  await page.locator('#cal .calendar-table').waitFor();
  await settled(page);
}

export async function click(page: Page, id: string): Promise<void> {
  await page.locator(`#${id}`).click();
  await settled(page);
}

// A day cell in the rendered month, by its visible number, current month only.
export function dayCell(page: Page, day: number): Locator {
  return page
    .locator('#cal td[data-date]')
    .filter({ hasNotText: /^$/ })
    .locator(`text="${day}"`)
    .first();
}
