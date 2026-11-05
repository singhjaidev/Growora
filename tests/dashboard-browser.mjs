// Run against a local development server with Playwright and Chrome installed.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  channel: process.env.CHROME_PATH ? undefined : 'chrome',
});
const base = 'http://localhost:3000';
const email = 'dashboard-' + randomBytes(8).toString('hex') + '@example.test';
const password = randomBytes(18).toString('hex');
const nextPassword = randomBytes(18).toString('hex');
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const other = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.name));
  await page.goto(base + '/dashboard/settings/profile');
  await page.waitForURL(base + '/login');
  await page.goto(base + '/signup');
  await page.getByLabel('Name', { exact: true }).fill('Dashboard browser test');
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name=password]').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(base + '/dashboard');
  await page.getByRole('heading', { name: 'Welcome, Dashboard browser test.' }).waitFor();
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  await page
    .getByRole('navigation', { name: 'Dashboard navigation' })
    .getByText('Account settings')
    .click();
  await page.getByLabel('Display name').fill('Unsaved');
  await page.getByRole('button', { name: 'Cancel' }).click();
  assert.equal(await page.getByLabel('Display name').inputValue(), 'Dashboard browser test');
  await page.getByLabel('Display name').fill('Saved profile');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Profile saved.').waitFor();
  await page.reload();
  assert.equal(await page.getByLabel('Display name').inputValue(), 'Saved profile');
  assert.equal(await page.getByLabel('Registered email').inputValue(), email);
  async function login(tab, pass) {
    await tab.goto(base + '/login');
    await tab.getByLabel('Email address').fill(email);
    await tab.getByLabel('Password').fill(pass);
    await tab.getByRole('button', { name: 'Sign in', exact: true }).click();
    await tab.waitForURL(base + '/dashboard');
  }
  await login(other, password);
  await page.locator('summary').click();
  await page.locator('details').getByText('Account settings').waitFor();
  await page.locator('summary').click();
  await menu.click();
  await page.getByRole('navigation').getByText('Security settings').click();
  await page.getByRole('button', { name: 'Revoke', exact: true }).click();
  await page.getByText('Session revoked.').waitFor();
  await other.reload();
  await other.waitForURL(base + '/login');
  await login(other, password);
  await page.reload();
  await page.getByRole('button', { name: 'Sign out all other devices' }).click();
  await page.getByText('Other devices signed out.').waitFor();
  await other.reload();
  await other.waitForURL(base + '/login');
  await page.getByLabel('Current password').fill(password);
  await page.getByLabel('New password').fill(nextPassword);
  await page.getByRole('button', { name: 'Change password' }).click();
  await page.getByText('Password changed. Other sessions have been signed out.').waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Security', exact: true }).waitFor();
  await menu.click();
  await page.getByRole('navigation').getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.waitForURL(base + '/login');
  await login(other, nextPassword);
  await other.getByRole('heading', { name: 'Welcome, Saved profile.' }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'PASS dashboard redirects, mobile navigation, profile menu, profile persistence, password rotation, session revocation and logout.',
  );
} finally {
  await browser.close();
}
