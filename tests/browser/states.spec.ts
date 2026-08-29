import { test, expect } from '@playwright/test';
import { openDemo, click, paintedColor } from './helpers';

// v0.3.1 shipped a calendar whose cells carried cursor: pointer while looking
// completely inert: `.calendar-table td:hover` lost on specificity to the
// bucket colour rules, so hovering an availability cell changed nothing. Every
// assertion here compares a state against its own base rather than against a
// fixed colour, so it survives retheming.

const currentMonthCell = (page: import('@playwright/test').Page) =>
  page
    .locator('#cal td[data-clickable="true"]:not(.calendar-cell-other-month)')
    .first();

test.describe('interaction states are visible', () => {
  test.beforeEach(async ({ page }) => {
    await openDemo(page);
  });

  test('hovering a cell changes it, in availability mode', async ({ page }) => {
    await click(page, 'modeDayBtn');
    const cell = currentMonthCell(page);

    const base = await paintedColor(page, cell);
    await cell.hover();
    const hovered = await paintedColor(page, cell);

    expect(hovered).not.toBe(base);
  });

  test('hovering a cell changes it, in normal mode', async ({ page }) => {
    const cell = currentMonthCell(page);

    const base = await paintedColor(page, cell);
    await cell.hover();
    expect(await paintedColor(page, cell)).not.toBe(base);
  });

  test('a selected day is marked', async ({ page }) => {
    await click(page, 'modeDayBtn');
    const cell = currentMonthCell(page);

    const baseOutline = await paintedColor(page, cell, 'outlineColor');
    await cell.click();
    await page.mouse.move(0, 0); // hover must not be what we are measuring

    // The bucket fill deliberately stays — availability is still worth seeing —
    // so selection reads from the outline rather than the background.
    expect(await cell.getAttribute('class')).toContain(
      'calendar-cell-selected'
    );
    expect(await paintedColor(page, cell, 'outlineColor')).not.toBe(
      baseOutline
    );
  });

  test('days inside a selected range are marked', async ({ page }) => {
    await click(page, 'modeDayBtn');
    await click(page, 'selRangeBtn');

    const cells = page.locator(
      '#cal td[data-clickable="true"]:not(.calendar-cell-other-month)'
    );
    const start = cells.nth(1);
    const end = cells.nth(4);
    const middle = cells.nth(2);

    const base = await paintedColor(page, middle);

    await start.click();
    await end.click();
    await page.mouse.move(0, 0);

    expect(await middle.getAttribute('class')).toContain(
      'availability-in-range'
    );
    expect(await paintedColor(page, middle)).not.toBe(base);
  });

  test('days outside available-days are marked and inert', async ({ page }) => {
    await click(page, 'modeDayBtn');

    const weekend = page
      .locator('#cal td[data-date]:not(.calendar-cell-other-month)')
      .first();
    const base = await paintedColor(page, weekend);

    await click(page, 'daysWeekBtn');

    const excluded = page.locator('#cal td.calendar-cell-out-of-range').first();
    expect(await excluded.count()).toBeGreaterThan(0);
    expect(await paintedColor(page, excluded)).not.toBe(base);
    expect(await excluded.getAttribute('data-clickable')).toBeNull();
  });

  test('closed hours are marked in the time grid', async ({ page }) => {
    await click(page, 'modeTimeBtn');
    // Changing an attribute reinitialises the engine and closes the popup, so
    // the hours have to be set before the day is opened.
    await click(page, 'hours9to5Btn');
    await currentMonthCell(page).click();

    // A closed slot that is not booked carries -open as well, so exclude it
    const open = page
      .locator('#cal .time-grid-slot-open:not(.time-grid-slot-out-of-range)')
      .first();
    const closed = page.locator('#cal .time-grid-slot-out-of-range').first();
    await open.waitFor();
    await closed.waitFor();

    expect(await paintedColor(page, closed)).not.toBe(
      await paintedColor(page, open)
    );
    expect(await closed.getAttribute('data-action')).toBeNull();
  });
});
