import { test, expect } from '@playwright/test';
import { openDemo, click, paintedColor } from './helpers';

// v0.3.1 shipped a calendar whose cells carried cursor: pointer while looking
// completely inert: `.kalendly-table td:hover` lost on specificity to the
// bucket colour rules, so hovering an availability cell changed nothing. Every
// assertion here compares a state against its own base rather than against a
// fixed colour, so it survives retheming.

const currentMonthCell = (page: import('@playwright/test').Page) =>
  page
    .locator('#cal td[data-clickable="true"]:not(.kalendly-cell-other-month)')
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
      'kalendly-cell-selected'
    );
    expect(await paintedColor(page, cell, 'outlineColor')).not.toBe(
      baseOutline
    );
  });

  test('days inside a selected range are marked', async ({ page }) => {
    await click(page, 'modeDayBtn');
    await click(page, 'selRangeBtn');

    const cells = page.locator(
      '#cal td[data-clickable="true"]:not(.kalendly-cell-other-month)'
    );
    const start = cells.nth(1);
    const end = cells.nth(4);
    const middle = cells.nth(2);

    const base = await paintedColor(page, middle);

    await start.click();
    await end.click();
    await page.mouse.move(0, 0);

    expect(await middle.getAttribute('class')).toContain(
      'kalendly-availability-in-range'
    );
    expect(await paintedColor(page, middle)).not.toBe(base);
  });

  test('days outside available-days are marked and inert', async ({ page }) => {
    await click(page, 'modeDayBtn');

    const weekend = page
      .locator('#cal td[data-date]:not(.kalendly-cell-other-month)')
      .first();
    const base = await paintedColor(page, weekend);

    await click(page, 'daysWeekBtn');

    const excluded = page.locator('#cal td.kalendly-cell-out-of-range').first();
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
      .locator('#cal .kalendly-time-grid-slot-open:not(.kalendly-time-grid-slot-out-of-range)')
      .first();
    const closed = page.locator('#cal .kalendly-time-grid-slot-out-of-range').first();
    await open.waitFor();
    await closed.waitFor();

    expect(await paintedColor(page, closed)).not.toBe(
      await paintedColor(page, open)
    );
    expect(await closed.getAttribute('data-action')).toBeNull();
  });
});

// A thrown configuration error used to leave an empty element with the reason
// only in the console. The vendor saw a blank space and had to go looking.
test.describe('a misconfigured calendar says so', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', () => {}); // the throw is expected
    await openDemo(page);
  });

  test('renders the reason where the calendar would be', async ({ page }) => {
    const shown = await page.evaluate(async () => {
      const el = document.createElement('kal-calendar');
      el.setAttribute('months', '3');
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 60));
      return {
        text: el.textContent?.trim() ?? '',
        hasBlock: !!el.querySelector('.kalendly-error'),
      };
    });

    expect(shown.hasBlock).toBe(true);
    expect(shown.text).toContain('months="3"');
    expect(shown.text).toContain('maximum of 2');
  });

  test('escapes a value that carries markup', async ({ page }) => {
    const shown = await page.evaluate(async () => {
      const el = document.createElement('kal-calendar');
      el.setAttribute('months', '<img src=x onerror=alert(1)>');
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 60));
      return {
        injected: !!el.querySelector('img'),
        text: el.textContent?.trim() ?? '',
      };
    });

    expect(shown.injected).toBe(false);
    expect(shown.text).toContain('<img src=x onerror=alert(1)>');
  });

  test('clears once the attribute is corrected', async ({ page }) => {
    const recovered = await page.evaluate(async () => {
      const el = document.createElement('kal-calendar');
      el.setAttribute('months', '3');
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 60));

      el.setAttribute('months', '2');
      await new Promise(r => setTimeout(r, 60));
      return {
        error: !!el.querySelector('.kalendly-error'),
        tables: el.querySelectorAll('.kalendly-table').length,
      };
    });

    expect(recovered.error).toBe(false);
    expect(recovered.tables).toBe(2);
  });
});
