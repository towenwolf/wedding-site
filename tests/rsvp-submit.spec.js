const { test, expect } = require('@playwright/test');

// This test submits to the REAL, live Google Form/Sheet used for actual
// wedding RSVPs. It's opt-in only so `npm test` never pollutes guest data.
// Run explicitly with: RUN_LIVE_SUBMIT=1 npx playwright test rsvp-submit
// Then delete the resulting row from the Google Sheet afterward.
test.skip(!process.env.RUN_LIVE_SUBMIT, 'Set RUN_LIVE_SUBMIT=1 to run (submits to the live Sheet)');

test('a guest can fill out and submit the RSVP form', async ({ page }) => {
  await page.goto('/rsvp.html');
  const frame = page.frameLocator('.rsvp-frame');

  await frame
    .locator('[role="listitem"]', { hasText: 'Guest name(s)' })
    .locator('input[type="text"]')
    .fill('Test Guest (automated Playwright test)');

  const attendCheckbox = frame
    .locator('[role="listitem"]', { hasText: 'Which will you attend?' })
    .getByRole('checkbox', { name: 'Wedding (ceremony & reception)' });
  await attendCheckbox.click();
  await expect(attendCheckbox).toHaveAttribute('aria-checked', 'true');

  await frame
    .locator('[role="listitem"]', { hasText: 'Number in party' })
    .locator('input[type="text"]')
    .fill('1');

  const mealRadio = frame
    .locator('[role="listitem"]', { hasText: 'Meal Choice' })
    .getByRole('radio', { name: 'Option 1' });
  await mealRadio.click();
  await expect(mealRadio).toHaveAttribute('aria-checked', 'true');

  await frame
    .locator('[role="listitem"]', { hasText: 'Dietary needs' })
    .locator('input[type="text"], textarea')
    .fill('None');

  await frame
    .locator('[role="listitem"]', { hasText: 'Note to couple' })
    .locator('input[type="text"], textarea')
    .fill('TEST SUBMISSION — please delete this row (automated Playwright test)');

  await frame.getByRole('button', { name: 'Submit' }).click();

  await expect(frame.getByText(/response has been recorded/i)).toBeVisible({ timeout: 15000 });
});
