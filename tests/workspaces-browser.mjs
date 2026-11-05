import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readdir, readFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({
  channel: process.env.CHROME_PATH ? undefined : 'chrome',
  executablePath: process.env.CHROME_PATH,
});
const base = 'http://localhost:3000',
  suffix = randomBytes(8).toString('hex'),
  recipient = 'team-' + suffix + '@example.test';
const ownFiles = [];
async function mail(kind) {
  for (let i = 0; i < 80; i++) {
    for (const f of await readdir('.growora-local/inbox')) {
      if (!f.includes('-' + kind + '-')) continue;
      const path = '.growora-local/inbox/' + f,
        text = await readFile(path, 'utf8');
      if (text.startsWith('To: ' + recipient + '\n')) {
        ownFiles.push(path);
        return text;
      }
    }
    await delay(100);
  }
  throw Error('Expected local invitation email');
}
async function signup(page, email, name) {
  await page.goto(base + '/signup');
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('Email address').fill(email);
  await page.locator('input[name=password]').fill(randomBytes(18).toString('hex'));
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(base + '/dashboard');
}
try {
  const owner = await browser.newPage({ viewport: { width: 390, height: 844 } }),
    guest = await (await browser.newContext()).newPage();
  const errors = [];
  for (const p of [owner, guest]) p.on('pageerror', (e) => errors.push(e.name));
  await signup(owner, 'business-' + suffix + '@example.test', 'Workspace test owner');
  await owner.getByRole('link', { name: 'Open workspace overview' }).click();
  await owner.getByLabel('Business name').fill('First business');
  await owner.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await owner.getByRole('heading', { name: 'First business' }).waitFor();
  await owner.getByRole('link', { name: 'Workspace settings', exact: true }).click();
  await owner.getByLabel('Business name').fill('Updated business');
  await owner.getByLabel('Industry').fill('Consulting');
  await owner.getByRole('button', { name: 'Save workspace' }).click();
  await owner.getByText('Workspace saved.').waitFor();
  await owner.reload();
  assert.equal(await owner.getByLabel('Industry').inputValue(), 'Consulting');
  await owner.goto(base + '/dashboard/team');
  await owner.getByLabel('Email address').fill(recipient);
  await owner.getByRole('button', { name: 'Send invitation' }).click();
  await owner.getByText('Invitation email accepted for delivery.').waitFor();
  const url = (await mail('invite')).trim().split('\n').at(-1);
  await guest.goto(url);
  await guest.getByRole('button', { name: 'Send confirmation code' }).click();
  await guest
    .getByText('Sign in with the invited account or create an account to continue.')
    .waitFor();
  const signupTab = await guest.context().newPage();
  await signup(signupTab, recipient, 'Workspace test member');
  await signupTab.close();
  await guest.getByRole('button', { name: 'Send confirmation code' }).click();
  await guest.getByLabel('Confirmation code').waitFor();
  const code = (await mail('code')).match(/code is (\d{8})/)[1];
  await guest.getByLabel('Confirmation code').fill(code);
  await guest.getByRole('button', { name: 'Accept invitation' }).click();
  await guest.waitForURL(base + '/dashboard/workspace');
  await guest.goto(base + '/dashboard/team');
  await guest.getByText('Workspace test member (you)').waitFor();
  assert.equal(await guest.getByRole('button', { name: 'Send invitation' }).count(), 0);
  await owner.reload();
  await owner.getByRole('button', { name: 'Make admin' }).click();
  await owner.getByText('Role updated.').waitFor();
  await guest.reload();
  await guest.getByRole('button', { name: 'Send invitation' }).waitFor();
  await owner.goto(base + '/dashboard/workspace/new');
  await owner.getByLabel('Business name').fill('Second business');
  await owner.getByRole('button', { name: 'Create workspace', exact: true }).click();
  await owner.getByRole('heading', { name: 'Second business' }).waitFor();
  await owner.getByRole('button', { name: 'Menu', exact: true }).click();
  await owner.getByLabel('Active workspace').selectOption({ label: 'Updated business · OWNER' });
  await owner.getByRole('heading', { name: 'Updated business' }).waitFor();
  await owner.goto(base + '/dashboard/team');
  owner.once('dialog', (d) => d.accept());
  await owner.getByRole('button', { name: 'Remove', exact: true }).click();
  await owner.getByText('Member removed.').waitFor();
  await guest.reload();
  await guest.getByRole('heading', { name: 'Your first workspace' }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'PASS mobile workspace onboarding, settings persistence, authenticated mailbox acceptance, team role changes, switching and removal.',
  );
} finally {
  await browser.close();
  for (const path of ownFiles) await unlink(path);
}
