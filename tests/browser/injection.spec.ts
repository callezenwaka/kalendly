import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// The component escapes what it renders, but the manual page also prints
// values that came from a caller — attribute values in its activity log. That
// line was built with innerHTML, so a payload the component had safely escaped
// executed in the page instead.
//
// The demo pages share the pattern but route no caller data into it, so there
// is nothing to exercise there; the unit guard in tests/unit/demos covers the
// shape rather than the behaviour.

const PAYLOAD = '<img src=x onerror=alert(1)>';

test.describe('the manual page', () => {
  const url = pathToFileURL(
    resolve('tests/manual/web-component.html')
  ).href;

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', () => {}); // the misconfiguration throws by design
    await page.goto(url);
    await page.locator('#calendar .kalendly-table').waitFor();
  });

  test('shows why a misconfigured calendar did not render', async ({
    page,
  }) => {
    await page.locator('#btn-bad-months').click();
    await page.waitForTimeout(150);

    const panel = page.locator('#calendar .kalendly-error');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('months="3"');
    await expect(panel).toContainText('maximum of 2');
  });

  test('recovers when the attribute is corrected', async ({ page }) => {
    await page.locator('#btn-bad-slot').click();
    await page.waitForTimeout(150);
    await expect(page.locator('#calendar .kalendly-error')).toBeVisible();

    await page.locator('#btn-bad-reset').click();
    await page.waitForTimeout(150);

    await expect(page.locator('#calendar .kalendly-error')).toHaveCount(0);
    await expect(page.locator('#calendar .kalendly-table')).toBeVisible();
  });

  test('does not execute a payload passed as an attribute', async ({
    page,
  }) => {
    let alerted = false;
    page.on('dialog', async d => {
      alerted = true;
      await d.dismiss();
    });

    await page.locator('#btn-bad-markup').click();
    await page.waitForTimeout(300);

    expect(alerted).toBe(false);
    expect(await page.locator('img').count()).toBe(0);

    // It reaches both the error panel and the log, as text in each
    await expect(page.locator('#calendar .kalendly-error')).toContainText(
      PAYLOAD
    );
    const logged = await page.locator('.log-line').allTextContents();
    expect(logged.some(l => l.includes('onerror'))).toBe(true);
  });
});
