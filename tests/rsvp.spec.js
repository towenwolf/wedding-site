const { test, expect } = require('@playwright/test');

const FORM_ID = '1FAIpQLSdS97K_BIgkoBhuudFYP372Y7NFcByPy_wwlmptlmqtltJ9Jg';

test.describe('RSVP section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rsvp.html');
  });

  test('links out to the Google Form with the correct ID', async ({ page, request }) => {
    const link = page.locator('.rsvp-cta');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');

    const href = await link.getAttribute('href');
    expect(href).toBe(`https://docs.google.com/forms/d/e/${FORM_ID}/viewform`);

    const res = await request.get(href);
    expect(res.ok()).toBeTruthy();
  });
});

test('homepage nav links to the RSVP page', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('a.nav-rsvp').click();
  await expect(page).toHaveURL(/rsvp\.html$/);
});
