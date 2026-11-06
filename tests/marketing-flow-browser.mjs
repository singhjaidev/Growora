import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
export async function testMarketingBrowser({
  base: backendBase,
  origin,
  cookie,
  workspaceId,
  formId,
  client,
}) {
  const base = origin;
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [],
    inventory = [];
  await mkdir('test-results/phase8', { recursive: true });
  try {
    const owner = await browser.newContext(),
      guest = await browser.newContext({
        viewport: { width: 390, height: 900 },
        reducedMotion: 'reduce',
      });
    for (const context of [owner, guest])
      await context.route(origin + '/**', async (route) => {
        const u = new URL(route.request().url());
        const response = await route.fetch({
          url: backendBase + u.pathname + u.search,
          headers: { ...route.request().headers(), origin },
        });
        await route.fulfill({ response });
      });
    const split = cookie.indexOf('=');
    await owner.addCookies([
      {
        name: cookie.slice(0, split),
        value: cookie.slice(split + 1),
        url: base,
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
      { name: 'growora-workspace', value: workspaceId, url: base, httpOnly: true, sameSite: 'Lax' },
    ]);
    const admin = await owner.newPage(),
      page = await guest.newPage();
    for (const p of [admin, page]) p.on('pageerror', (e) => errors.push(e.message));
    await admin.goto(base + '/dashboard/settings/marketing');
    await admin.getByLabel('Receiving workspace').selectOption(workspaceId);
    await admin.getByLabel('Published enquiry form').selectOption(formId);
    await admin.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await admin.getByText('Website enquiries disconnected.', { exact: true }).waitFor();
    await page.goto(base + '/solutions');
    await page.getByRole('alert').filter({ hasText: 'unavailable' }).waitFor();
    assert.equal(
      await page.getByRole('button', { name: 'Send enquiry', exact: true }).isDisabled(),
      true,
    );
    await admin.getByLabel('Receiving workspace').selectOption(workspaceId);
    await admin.getByLabel('Published enquiry form').selectOption(formId);
    await admin.getByRole('button', { name: 'Connect', exact: true }).click();
    await admin.getByText('Website enquiries connected.', { exact: true }).waitFor();
    await admin.reload();
    await admin.getByText('Status: Connected', { exact: true }).waitFor();

    // Inspect rendered interactions and follow every visible internal navigation target.
    for (const path of [
      '/',
      '/product',
      '/solutions',
      '/integrations',
      '/pricing',
      '/how-it-works',
    ]) {
      await page.goto(base + path);
      await page.getByRole('heading', { level: 1 }).first().waitFor();
      inventory.push({
        path,
        controls: await page
          .locator('a,button,input,select,textarea')
          .evaluateAll((nodes) =>
            nodes.map((e) => ({
              tag: e.tagName,
              label: (
                e.textContent ||
                e.getAttribute('aria-label') ||
                e.getAttribute('placeholder') ||
                ''
              ).trim(),
              href: e.getAttribute('href'),
              name: e.getAttribute('name'),
            })),
          ),
      });
    }
    const links = [
      ...new Set(
        inventory
          .flatMap((p) => p.controls.map((c) => c.href))
          .filter((h) => h?.startsWith('/') && !h.startsWith('//')),
      ),
    ];
    for (const href of links) {
      const r = await guest.request.get(backendBase + href);
      assert.ok(r.status() < 400, href + ': ' + r.status());
    }
    await page.goto(base + '/product');
    await page.getByRole('link', { name: 'Explore the platform' }).click();
    assert.equal(await page.locator('#features').count(), 1);
    await page.goto(base + '/integrations');
    await page.getByPlaceholder('Find your tools…').fill('Slack');
    await page.getByRole('button', { name: 'Explore connection' }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'Close', exact: true }).last().click();
    await page.goto(base + '/how-it-works');
    await page.getByRole('button', { name: 'Next step' }).click();
    await page.getByText('Step 2 of 5', { exact: true }).waitFor();
    await page.goto(base + '/');
    await page.getByRole('link', { name: 'Explore workspace', exact: true }).first().click();
    await page.waitForURL(base + '/signup');
    await admin.goto(base + '/');
    await admin.getByRole('link', { name: 'Explore workspace', exact: true }).first().click();
    await admin.waitForURL(base + '/dashboard');

    await page.goto(base + '/solutions');
    const send = page.getByRole('button', { name: 'Send enquiry', exact: true });
    await send.click();
    assert.equal(
      await page.getByRole('heading', { name: 'Your enquiry has been received.' }).count(),
      0,
    );
    const email = 'marketing-browser-' + randomBytes(5).toString('hex') + '@example.test';
    await page.getByLabel('Name', { exact: true }).fill('Marketing browser customer');
    await page.getByLabel('Company', { exact: true }).fill('Browser sample business');
    await page.getByLabel('Work email').fill(email);
    await page.getByLabel('I acknowledge this use of my information.').check();
    let attemptKey, droppedResolve;
    const dropped = new Promise((resolve) => {
      droppedResolve = resolve;
    });
    await page.route('**/api/marketing/enquiry', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      attemptKey = route.request().headers()['idempotency-key'];
      // Persist the request, then drop the response: retry must not duplicate the enquiry.
      const persisted = await route.fetch({
        url: backendBase + '/api/marketing/enquiry',
        headers: { ...route.request().headers(), origin },
      });
      assert.equal(persisted.status(), 200);
      await route.abort();
      droppedResolve();
    });
    await send.click();
    await dropped;
    await page.locator('main:visible').getByRole('alert').waitFor();
    assert.equal(await page.getByLabel('Work email').inputValue(), email);
    assert.equal(
      await page.getByRole('heading', { name: 'Your enquiry has been received.' }).count(),
      0,
    );
    await page.unroute('**/api/marketing/enquiry');
    const sent = page.waitForRequest(
      (r) => r.method() === 'POST' && r.url().endsWith('/api/marketing/enquiry'),
    );
    await send.click();
    const request = await sent;
    assert.equal(request.headers()['idempotency-key'], attemptKey);
    await page
      .getByRole('heading', { name: 'Your enquiry has been received.', exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    const rows = (await client.query('SELECT * FROM lead WHERE customer_email=$1', [email])).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].workspace_id, workspaceId);
    assert.equal(
      (
        await client.query('SELECT * FROM lead_activity WHERE lead_id=$1', [rows[0].id])
      ).rows.filter((r) => r.action === 'RECEIVED').length,
      1,
    );
    await admin.goto(base + '/dashboard/leads/' + rows[0].id);
    await admin.getByRole('heading', { name: 'Website redesign', exact: true }).waitFor();
    await admin.locator('main:visible').getByText(email, { exact: true }).first().waitFor();
    await page.screenshot({ path: 'test-results/phase8/submitted-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    await writeFile(
      'test-results/phase8/interaction-inventory.json',
      JSON.stringify(inventory, null, 2),
    );
    console.log(
      'PASS marketing browser real persistence, lost-response retry, owner settings, dashboard, navigation and mobile',
    );
  } catch (e) {
    console.error('MARKETING_BROWSER_FAILURE', e.message);
    throw e;
  } finally {
    await browser.close();
  }
}
