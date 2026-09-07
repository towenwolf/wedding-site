const { test, expect } = require('@playwright/test');

const ENDPOINT_PATTERN = /script\.google\.com\/macros\/s\/.*\/exec/;

test.describe('RSVP section', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('wedding-auth', '1'));
    await page.goto('/rsvp.html');
  });

  test('a known guest can find their household and see it pre-filled', async ({ page }) => {
    await page.route(ENDPOINT_PATTERN, (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          found: true,
          householdId: '18',
          guests: [
            { first: 'Diamond', last: 'Podmore' },
            { first: 'Travis', last: 'Wolf' },
          ],
        }),
      });
    });

    await page.locator('#rsvp-name').fill('Diamond Podmore');
    await page.locator('#rsvp-search-btn').click();

    await expect(page.locator('#rsvp-household')).toBeVisible();
    await expect(page.locator('.rsvp-guest-name')).toHaveText(['Diamond Podmore', 'Travis Wolf']);
  });

  test('an unknown name is blocked with a message instead of a blank form', async ({ page }) => {
    await page.route(ENDPOINT_PATTERN, (route) => {
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ found: false }) });
    });

    await page.locator('#rsvp-name').fill('Not Invited Person');
    await page.locator('#rsvp-search-btn').click();

    await expect(page.locator('#rsvp-status')).toContainText("couldn't find that name");
    await expect(page.locator('#rsvp-household')).toBeHidden();
  });

  test('submitting the household form posts a JSON payload for each guest', async ({ page }) => {
    await page.route(ENDPOINT_PATTERN, (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true }) });
        return;
      }
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ found: true, householdId: '1', guests: [{ first: 'Margaret', last: 'Wolf' }] }),
      });
    });

    await page.locator('#rsvp-name').fill('Margaret Wolf');
    await page.locator('#rsvp-search-btn').click();
    await expect(page.locator('#rsvp-household')).toBeVisible();

    await page.locator('#rsvp-email').fill('margaret@example.com');

    const [postRequest] = await Promise.all([
      page.waitForRequest((req) => req.url().match(ENDPOINT_PATTERN) && req.method() === 'POST'),
      page.locator('#rsvp-household .rsvp-cta').click(),
    ]);

    const payload = JSON.parse(postRequest.postData());
    expect(payload.householdId).toBe('1');
    expect(payload.email).toBe('margaret@example.com');
    expect(payload.welcomeParty).toBe('yes');
    expect(payload.welcomePartyKids).toBe('yes');
    expect(payload.guests).toEqual([{ name: 'Margaret Wolf', attending: 'yes', dietary: '' }]);

    await expect(page.locator('#rsvp-household')).toContainText('Thank you');
  });
});

test('homepage nav links to the RSVP page', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('wedding-auth', '1'));
  await page.goto('/index.html');
  await page.locator('a.nav-rsvp').click();
  await expect(page).toHaveURL(/rsvp\.html$/);
});
