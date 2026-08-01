const { test, expect } = require('@playwright/test');

const FORM_ID = '1FAIpQLSdS97K_BIgkoBhuudFYP372Y7NFcByPy_wwlmptlmqtltJ9Jg';

test.describe('RSVP section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#rsvp');
  });

  test('embeds the Google Form with the correct ID', async ({ page }) => {
    const iframe = page.locator('.rsvp-frame');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', new RegExp(`forms/d/e/${FORM_ID}/viewform\\?embedded=true`));
  });

  test('loads the real form inside the iframe', async ({ page }) => {
    const frame = page.frameLocator('.rsvp-frame');
    await expect(frame.locator('form')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.rsvp-frame')).not.toHaveAttribute(
      'src',
      /ServiceLogin|accounts\.google\.com/
    );
  });

  test('shows a working direct-link fallback', async ({ page, request }) => {
    const link = page.locator('.rsvp-fallback a');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');

    const href = await link.getAttribute('href');
    expect(href).toBe(`https://docs.google.com/forms/d/e/${FORM_ID}/viewform`);

    const res = await request.get(href);
    expect(res.ok()).toBeTruthy();
  });

  test('iframe stays within viewport width (no horizontal overflow)', async ({ page }) => {
    const iframe = page.locator('.rsvp-frame');
    const box = await iframe.boundingBox();
    const viewport = page.viewportSize();
    expect(box.width).toBeLessThanOrEqual(viewport.width);
  });
});
