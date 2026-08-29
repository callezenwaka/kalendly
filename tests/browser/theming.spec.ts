import { test, expect } from '@playwright/test';
import { openDemo, click, paintedColor, settled } from './helpers';

// v0.3.3 declared --kalendly-nav-arrow-hover-bg: var(--kalendly-primary-color)
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
    const arrow = page.locator('#cal .kalendly-nav-arrow').first();

    await arrow.hover();
    expect(await paintedColor(page, arrow)).toBe(DEFAULT_ORANGE);

    await click(page, 'brandIndigoBtn');
    await arrow.hover();
    expect(await paintedColor(page, arrow)).toBe(INDIGO);
  });

  test('the brand colour reaches translucent fills', async ({ page }) => {
    await click(page, 'modeDayBtn');
    // A leading cell would match .kalendly-cell-other-month:hover instead,
    // which is a higher-specificity rule painting from --kalendly-cell-hover
    const cell = page
      .locator('#cal td[data-clickable="true"]:not(.kalendly-cell-other-month)')
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
    const arrow = page.locator('#cal .kalendly-nav-arrow').first();

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

    const theirs = page.locator('#cal .kalendly-nav-arrow').first();
    const ours = page.locator('#cal-two .kalendly-nav-arrow').first();

    await theirs.hover();
    expect(await paintedColor(page, theirs)).toBe(INDIGO);

    await ours.hover();
    expect(await paintedColor(page, ours)).toBe(DEFAULT_ORANGE);
  });
});

// The stylesheet used to ship `.badge` and 17 other generic selectors
// unprefixed, so importing it uppercased every badge in the host application.
test.describe('the stylesheet stays inside the component', () => {
  test('does not style a page element that shares a former class name', async ({
    page,
  }) => {
    await openDemo(page);

    const probe = await page.evaluate(() => {
      const el = document.createElement('span');
      // The names the stylesheet used to claim
      el.className = 'badge event-card popup-header date-popup scroll-hint';
      el.textContent = 'untouched';
      document.body.appendChild(el);
      const s = getComputedStyle(el);
      return {
        textTransform: s.textTransform,
        letterSpacing: s.letterSpacing,
        background: s.backgroundColor,
      };
    });

    expect(probe.textTransform).toBe('none');
    expect(probe.letterSpacing).toBe('normal');
    expect(probe.background).toBe('rgba(0, 0, 0, 0)');
  });

  test('accepts an oklch brand colour, which no rgb triple could express', async ({
    page,
  }) => {
    await openDemo(page);
    const arrow = page.locator('#cal .kalendly-nav-arrow').first();

    await arrow.hover();
    const before = await paintedColor(page, arrow);

    await page.evaluate(() => {
      document
        .getElementById('cal')!
        .style.setProperty('--kalendly-primary-color', 'oklch(0.55 0.22 264)');
    });
    await arrow.hover();

    expect(await paintedColor(page, arrow)).not.toBe(before);
  });
});
