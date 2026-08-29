import { test, expect } from '@playwright/test';
import { openDemo, click, paintedColor, settled } from './helpers';

// v0.3.3 declared --calendar-nav-arrow-hover-bg: var(--calendar-primary-color)
// at :root. Custom properties substitute at computed-value time, so it resolved
// against :root and descendants inherited the finished value — an override set
// on the element never reached it. These specs fail against that release.

const INDIGO = '79,70,229';
const DEFAULT_ORANGE = '252,137,23';

test.describe('element-scoped theming', () => {
  test.beforeEach(async ({ page }) => {
    await openDemo(page);
  });

  test('the brand colour reaches the nav arrow on hover', async ({ page }) => {
    const arrow = page.locator('#cal .calendar-nav-arrow').first();

    await arrow.hover();
    expect(await paintedColor(page, arrow)).toBe(DEFAULT_ORANGE);

    await click(page, 'brandIndigoBtn');
    await arrow.hover();
    expect(await paintedColor(page, arrow)).toBe(INDIGO);
  });

  test('the brand colour reaches translucent fills', async ({ page }) => {
    await click(page, 'modeDayBtn');
    // A leading cell would match .calendar-cell-other-month:hover instead,
    // which is a higher-specificity rule painting from --calendar-cell-hover
    const cell = page
      .locator('#cal td[data-clickable="true"]:not(.calendar-cell-other-month)')
      .first();

    await cell.hover();
    const before = await paintedColor(page, cell);

    await click(page, 'brandIndigoBtn');
    await cell.hover();
    const after = await paintedColor(page, cell);

    // A 10% tint of a different hue must paint differently
    expect(after).not.toBe(before);
  });

  test('removing the brand restores the default', async ({ page }) => {
    const arrow = page.locator('#cal .calendar-nav-arrow').first();

    await click(page, 'brandIndigoBtn');
    await arrow.hover();
    expect(await paintedColor(page, arrow)).toBe(INDIGO);

    await click(page, 'brandDefaultBtn');
    await arrow.hover();
    expect(await paintedColor(page, arrow)).toBe(DEFAULT_ORANGE);
  });

  test('a second calendar on the page is unaffected', async ({ page }) => {
    await page.evaluate(() => {
      const second = document.createElement('kal-calendar');
      second.id = 'cal-two';
      document.body.appendChild(second);
    });
    await settled(page, '#cal-two');

    await click(page, 'brandIndigoBtn');

    const theirs = page.locator('#cal .calendar-nav-arrow').first();
    const ours = page.locator('#cal-two .calendar-nav-arrow').first();

    await theirs.hover();
    expect(await paintedColor(page, theirs)).toBe(INDIGO);

    await ours.hover();
    expect(await paintedColor(page, ours)).toBe(DEFAULT_ORANGE);
  });
});
