import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ channel: 'chrome' });
const base = 'http://localhost:3000',
  suffix = randomBytes(8).toString('hex'),
  errors = [];
await mkdir('test-results/phase6', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    main = page.locator('main:visible');
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '/signup');
  await page.getByLabel('Name', { exact: true }).fill('Routing browser owner');
  await page.getByLabel('Email address').fill('routing-browser-' + suffix + '@example.test');
  await page.locator('input[name=password]').fill(randomBytes(18).toString('hex'));
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(base + '/dashboard');
  const api = async (path, body) => {
    const r = await page.request.post(base + path, { headers: { origin: base }, data: body });
    assert.ok(r.ok(), await r.text());
    return r.json();
  };
  const w = (await api('/api/workspaces/create', { name: 'Routing browser ' + suffix })).id;
  await api('/api/workspaces/switch', { workspaceId: w });
  await api('/api/leads/form-create', {
    workspaceId: w,
    name: 'Routing enquiries',
    privacyNotice: 'Disposable local routing verification only.',
    retentionDays: 30,
    enabled: true,
  });
  const forms = await (await page.request.get(base + '/api/leads/forms?workspaceId=' + w)).json(),
    form = forms.forms[0];
  await page.goto(base + '/dashboard/settings/routing');
  await main.getByRole('heading', { name: 'Routing settings', exact: true }).waitFor();
  await main.getByLabel('Eligible for automatic assignments').check();
  await main.getByLabel('Available for new leads').check();
  await main.getByLabel('Active assignment capacity').fill('1');
  await main.getByLabel('Specialties (comma separated)').fill('Packaging');
  let response = page.waitForResponse(
    (r) => r.url().endsWith('/api/routing/profile') && r.request().method() === 'POST',
  );
  await main.getByRole('button', { name: 'Save routing profile', exact: true }).click();
  assert.equal((await response).status(), 200);
  await page.reload();
  assert.equal(await main.getByLabel('Active assignment capacity').inputValue(), '1');
  assert.equal(await main.getByLabel('Available for new leads').isChecked(), true);
  await main.getByLabel('Enable automatic routing').check();
  await main.locator('select[name=strategy]').selectOption('ROUND_ROBIN');
  response = page.waitForResponse(
    (r) => r.url().endsWith('/api/routing/policy') && r.request().method() === 'POST',
  );
  await main.getByRole('button', { name: 'Save routing policy', exact: true }).click();
  assert.equal((await response).status(), 200);
  await page.reload();
  assert.equal(await main.locator('select[name=strategy]').inputValue(), 'ROUND_ROBIN');
  const submit = async (label) => {
    const r = await page.request.post(base + '/api/enquiry/' + form.publicId, {
      headers: { origin: base, 'idempotency-key': randomUUID() },
      data: {
        formVersion: 1,
        customerName: label,
        customerEmail: randomUUID() + '@example.test',
        customerPhone: '',
        subject: label,
        message: 'Please quote packaging supplies.',
        consent: true,
        company: '',
      },
    });
    assert.ok(r.ok(), await r.text());
  };
  const leads = async () =>
    (await (await page.request.get(base + '/api/leads/list?workspaceId=' + w)).json()).rows;
  await submit('Routing first');
  let first;
  for (let i = 0; i < 40; i++) {
    first = (await leads()).find((l) => l.subject === 'Routing first');
    if (first?.routingState === 'ASSIGNED') break;
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.equal(first.routingState, 'ASSIGNED');
  assert.equal(first.assignmentOrigin, 'AUTOMATIC');
  await page.goto(base + '/dashboard/leads/' + first.id);
  await main.getByText('Assignment source: AUTOMATIC', { exact: false }).waitFor();
  assert.equal(
    await main.getByRole('button', { name: 'Request routing', exact: true }).isDisabled(),
    true,
  );
  await main.getByLabel('Assigned to', { exact: false }).selectOption('');
  await main.getByRole('button', { name: 'Save assignment', exact: true }).click();
  await main.getByText('Assignment updated.', { exact: true }).waitFor();
  await page.reload();
  await main.getByText('Assignment source: MANUAL', { exact: false }).waitFor();
  const previewResponse = page.waitForResponse(r => r.url().includes('/api/routing/preview?'));
  await main.getByRole('button', { name: 'Preview routing', exact: true }).click();
  const previewResult = await previewResponse;
  assert.equal(previewResult.status(), 200, await previewResult.text());
  assert.equal((await previewResult.json()).decision.outcome, 'ASSIGNED');
  await main.getByRole('heading', { name: 'Simulation: ASSIGNED' }).waitFor();
  assert.equal((await leads()).find((l) => l.id === first.id).assignedToUserId, null);
  await main.getByRole('button', { name: 'Request routing', exact: true }).click();
  await main
    .getByText('Assignment source: AUTOMATIC', { exact: false })
    .waitFor({ timeout: 20000 });
  await submit('Capacity review');
  let review;
  for (let i = 0; i < 40; i++) {
    review = (await leads()).find((l) => l.subject === 'Capacity review');
    if (review?.routingState === 'REVIEW') break;
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.equal(review.routingState, 'REVIEW');
  await page.goto(base + '/dashboard/leads?routing=REVIEW');
  await main.getByRole('link', { name: 'Capacity review', exact: true }).waitFor();
  assert.equal(await main.getByRole('link', { name: 'Routing first', exact: true }).count(), 0);
  await page.goto(base + '/dashboard/settings/routing');
  await main.getByText('CAPACITY_REACHED', { exact: false }).waitFor();
  await page.screenshot({ path: 'test-results/phase6/routing-desktop.png', fullPage: true, caret: 'initial' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'test-results/phase6/routing-mobile.png', fullPage: true, caret: 'initial' });
  assert.deepEqual(errors, []);
  console.log(
    'PASS routing settings/profile persistence, automatic assignment, manual protection, read-only preview, explicit reroute, capacity review queue, history and mobile overflow',
  );
} finally {
  await browser.close();
}
