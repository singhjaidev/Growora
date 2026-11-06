import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { Pool } from 'pg';
import { score } from '../src/server/intelligence/contract.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({
  channel: process.env.CHROME_PATH ? undefined : 'chrome',
  executablePath: process.env.CHROME_PATH,
});
const base = 'http://localhost:3000',
  suffix = randomBytes(8).toString('hex'),
  errors = [];
const { password } = JSON.parse(await readFile('.growora-local/credentials.json', 'utf8'));
const db = new Pool({
  host: '127.0.0.1',
  port: 55432,
  user: 'growora_local',
  password,
  database: 'postgres',
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/signup');
  await page.getByLabel('Name', { exact: true }).fill('AI fixture browser owner');
  await page.getByLabel('Email address').fill('ai-browser-' + suffix + '@example.test');
  await page.locator('input[name=password]').fill(randomBytes(18).toString('hex'));
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(base + '/dashboard');
  const post = async (path, data) => {
    const r = await page.request.post(base + path, { headers: { origin: base }, data });
    assert.ok(r.ok(), await r.text());
    return r.json();
  };
  const w = (await post('/api/workspaces/create', { name: 'AI browser fixture workspace' })).id;
  await post('/api/leads/form-create', {
    workspaceId: w,
    name: 'Synthetic browser form',
    privacyNotice: 'Synthetic test only',
    retentionDays: null,
    enabled: true,
  });
  const form = (await (await page.request.get(base + '/api/leads/forms?workspaceId=' + w)).json())
    .forms[0];
  await page.request.post(base + '/api/enquiry/' + form.publicId, {
    headers: { origin: base, 'Idempotency-Key': randomUUID() },
    data: {
      formVersion: 1,
      customerName: 'Synthetic AI browser customer',
      customerEmail: 'synthetic-ai@example.test',
      subject: 'Synthetic fixture requirement',
      message: 'Synthetic enquiry only',
      consent: true,
      company: '',
    },
  });
  const rows = await (await page.request.get(base + '/api/leads/list?workspaceId=' + w)).json();
  const id = rows.rows[0].id;
  await page.goto(base + '/dashboard/leads/' + id);
  await page.getByRole('heading', { name: 'AI Insights', exact: true }).waitFor();
  await page
    .locator('main:visible')
    .getByText('Unavailable · processing configuration required', { exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Request reanalysis', exact: true }).isDisabled(),
    true,
  );
  const fixture = JSON.parse(await readFile('tests/fixtures/intelligence-eval.json', 'utf8'))[0]
    .fixture;
  await db.query(
    "UPDATE lead_ai_job SET status='COMPLETED',result=$2,model='TEST_FIXTURE_NOT_LIVE',prompt_version='qualification-1',schema_version='extraction-1',scoring_version='priority-1',processed_at=now() WHERE lead_id=$1 AND workspace_id=$3",
    [id, JSON.stringify({ extraction: fixture, scoring: score(fixture) }), w],
  );
  await db.query(
    "UPDATE lead_intelligence SET status='COMPLETED',score=100,priority='HIGH' WHERE lead_id=$1 AND workspace_id=$2",
    [id, w],
  );
  await page.reload();
  const section = page
    .locator('main:visible section')
    .filter({ has: page.getByRole('heading', { name: 'AI Insights', exact: true }) });
  await section.getByText('100/100 · HIGH', { exact: true }).waitFor();
  await section.getByRole('heading', { name: 'Customer-stated excerpts' }).waitFor();
  await section.getByRole('heading', { name: 'Score breakdown' }).waitFor();
  await section.getByLabel('Review verdict').selectOption('FLAGGED');
  await section.getByLabel('Review note').fill('Synthetic browser review: verify interpretation.');
  await section.getByRole('button', { name: 'Save AI review' }).click();
  await section.getByText('Review saved.', { exact: true }).waitFor();
  await page.reload();
  await page.locator('main:visible').getByText('Human review: FLAGGED', { exact: false }).waitFor();
  await mkdir('test-results/phase5', { recursive: true });
  await page.screenshot({
    path: 'test-results/phase5/insights-desktop-fixture.png',
    fullPage: true,
  });
  await page.goto(base + '/dashboard/leads');
  await page.getByLabel('AI priority').selectOption('HIGH');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.getByRole('link', { name: 'Synthetic AI browser customer' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'test-results/phase5/priority-mobile-fixture.png',
    fullPage: true,
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log(
    'PASS intelligence browser: configuration state, explicitly labeled synthetic insights, review persistence, priority filter, mobile layout. No live provider used.',
  );
} finally {
  await db.end();
  await browser.close();
}
