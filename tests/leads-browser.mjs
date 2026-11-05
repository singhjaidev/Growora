import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({
  channel: process.env.CHROME_PATH ? undefined : 'chrome',
  executablePath: process.env.CHROME_PATH,
});
const base = 'http://localhost:3000',
  suffix = randomBytes(8).toString('hex'),
  errors = [];
await mkdir('test-results/phase4', { recursive: true });
try {
  const owner = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    guest = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  for (const p of [owner, guest]) p.on('pageerror', (e) => errors.push(e.message));
  await owner.goto(base + '/signup');
  await owner.getByLabel('Name', { exact: true }).fill('Lead browser owner');
  await owner.getByLabel('Email address').fill('lead-browser-' + suffix + '@example.test');
  await owner.locator('input[name=password]').fill(randomBytes(18).toString('hex'));
  await owner.getByRole('button', { name: 'Create account' }).click();
  await owner.waitForURL(base + '/dashboard');
  await owner.getByRole('link', { name: 'Open workspace overview' }).click();
  await owner.getByLabel('Business name').fill('Lead browser workspace');
  await owner.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await owner.getByRole('heading', { name: 'Lead browser workspace', exact: true }).waitFor();
  await owner.getByRole('link', { name: 'Enquiry forms', exact: true }).click();
  await owner.getByLabel('Public form title').fill('Website enquiries');
  await owner.getByLabel('Review submissions after (days)').fill('30');
  await owner.getByRole('button', { name: 'Create form', exact: true }).click();
  await owner.getByRole('link', { name: 'Open public form', exact: true }).waitFor();
  const url = await owner
    .getByRole('link', { name: 'Open public form', exact: true })
    .getAttribute('href');
  await owner.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await owner.getByRole('button', { name: 'Copy link', exact: true }).click();
  await owner.getByText('Link copied.', { exact: true }).waitFor();
  assert.equal(await owner.evaluate(() => navigator.clipboard.readText()), base + url);
  await guest.goto(base + url);
  assert.equal(
    (await guest.context().cookies()).some((c) => c.name.includes('session_token')),
    false,
  );
  await guest.getByLabel('Your name').fill('Customer browser test');
  await guest.getByLabel('Email address').fill('browser-customer@example.test');
  await guest.getByLabel('Phone number (optional)').fill('+91 9876543210');
  await guest.getByLabel('Subject', { exact: true }).fill('A real enquiry');
  await guest
    .getByLabel('Message', { exact: true })
    .fill('<script>window.enquiryExecuted=true</script>\nPlease contact me about my website.');
  await guest.getByLabel('I acknowledge this use of my information.').check();
  await guest.screenshot({ path: 'test-results/phase4/public-mobile.png', fullPage: true });
  assert.equal(
    await guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await guest.route('**/api/enquiry/**', (route) => route.abort());
  await guest.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await guest.getByText('Could not confirm your submission.', { exact: false }).waitFor();
  assert.equal(await guest.getByRole('heading', { name: 'Enquiry received' }).count(), 0);
  await guest.unroute('**/api/enquiry/**');
  await guest.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await guest.getByRole('heading', { name: 'Enquiry received', exact: true }).waitFor();
  await owner.goto(base + '/dashboard');
  const summary = owner
    .locator('section')
    .filter({ has: owner.getByRole('heading', { name: 'Enquiries · Lead browser workspace' }) });
  assert.equal(
    await summary
      .locator('dl div')
      .filter({ has: owner.locator('dt', { hasText: /^Total$/ }) })
      .locator('dd')
      .textContent(),
    '1',
  );
  await owner.getByRole('link', { name: 'View leads', exact: true }).click();
  await owner.getByRole('link', { name: 'Customer browser test', exact: true }).click();
  await owner.getByRole('heading', { name: 'A real enquiry', exact: true }).waitFor();
  await owner.getByText('<script>window.enquiryExecuted=true</script>', { exact: false }).waitFor();
  assert.equal(await owner.evaluate(() => window.enquiryExecuted), undefined);
  await owner
    .getByLabel('Assigned to', { exact: false })
    .selectOption({ label: 'Lead browser owner' });
  await owner.getByRole('button', { name: 'Save assignment', exact: true }).click();
  await owner.getByText('Assignment updated.', { exact: true }).waitFor();
  await owner.reload();
  await owner
    .locator('main:visible')
    .getByLabel('Status', { exact: false })
    .selectOption('CONTACTED');
  await owner.getByRole('button', { name: 'Update status', exact: true }).click();
  await owner.getByText('Status updated.', { exact: true }).waitFor();
  await owner.reload();
  await owner
    .locator('main:visible')
    .getByText('Status changed: NEW → CONTACTED', { exact: false })
    .waitFor();
  await owner
    .locator('main:visible')
    .getByText('Assignment changed: Unassigned → Lead browser owner', { exact: false })
    .waitFor();
  await owner.screenshot({ path: 'test-results/phase4/detail-desktop.png', fullPage: true });
  await owner.goto(base + '/dashboard/leads');
  await owner.locator('main:visible').getByLabel('Search', { exact: true }).fill('not found');
  await owner.locator('main:visible').getByRole('button', { name: 'Apply filters' }).click();
  await owner.locator('main:visible').getByText('No enquiries match these filters.').waitFor();
  await owner.locator('main:visible').getByLabel('Search', { exact: true }).fill('customer');
  await owner
    .locator('main:visible')
    .getByLabel('Status', { exact: false })
    .selectOption('CONTACTED');
  await owner.locator('main:visible').getByRole('button', { name: 'Apply filters' }).click();
  await owner.getByRole('link', { name: 'Customer browser test', exact: true }).waitFor();
  await owner.setViewportSize({ width: 390, height: 844 });
  await owner.screenshot({ path: 'test-results/phase4/list-mobile.png', fullPage: true });
  assert.equal(
    await owner.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await owner.goto(base + '/dashboard/lead-forms');
  const existing = owner
    .locator('section')
    .filter({ has: owner.getByRole('heading', { name: 'Website enquiries', exact: true }) });
  await existing.getByText('Accepting enquiries · 1 submissions', { exact: true }).waitFor();
  await existing.getByLabel('Accept submissions').uncheck();
  await existing.getByRole('button', { name: 'Save form', exact: true }).click();
  await existing.getByText('Submissions disabled · 1 submissions', { exact: true }).waitFor();
  await guest.reload();
  await guest.getByRole('heading', { name: 'Enquiry form unavailable' }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Phase 4 browser: signup/session, workspace, form creation/copy, anonymous mobile form, failed retry, persistence, real counters, escaped message, assignment, status/activity, search/filter, mobile layout, disable form: PASS',
  );
} catch (e) {
  for (const [i, c] of browser.contexts().entries())
    for (const p of c.pages()) {
      await p.screenshot({ path: 'test-results/phase4/failure-' + i + '.png', fullPage: true });
    }
  throw e;
} finally {
  await browser.close();
}
