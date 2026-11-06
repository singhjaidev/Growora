import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ channel: 'chrome' });
const base = process.env.AUDIT_BASE_URL || 'http://localhost:3000',
  report = [];
await mkdir('test-results/phase7/marketing', { recursive: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      locale: 'en-GB',
      timezoneId: 'UTC',
      reducedMotion: 'reduce',
      colorScheme: 'light',
    });
    const page = await context.newPage(),
      errors = [],
      failures = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('requestfailed', (r) => {
      if (!r.failure()?.errorText.includes('ERR_ABORTED'))
        failures.push({ url: r.url(), error: r.failure()?.errorText });
    });
    for (const path of [
      '/',
      '/product',
      '/solutions',
      '/integrations',
      '/pricing',
      '/how-it-works',
    ]) {
      const samples = [];
      for (let n = 0; n < 2; n++) {
        const response = await page.goto(base + path);
        assert.equal(response.status(), 200);
        await page.evaluate(() => document.fonts.ready);
        await page.getByRole('heading', { level: 1 }).first().waitFor();
        await page.waitForTimeout(1200);
        const shot = await page.screenshot({
          fullPage: true,
          animations: 'disabled',
          caret: 'initial',
          path:
            'test-results/phase7/marketing/' +
            (path.slice(1) || 'home') +
            '-' +
            width +
            '-' +
            n +
            '.png',
        });
        samples.push(shot);
      }
      const imageA = await sharp(samples[0])
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true }),
        imageB = await sharp(samples[1]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let changed = 0;
      if (imageA.data.length === imageB.data.length)
        for (let i = 0; i < imageA.data.length; i += 4) {
          if (!imageA.data.subarray(i, i + 4).equals(imageB.data.subarray(i, i + 4))) changed++;
        }
      const evidence = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        fonts: document.fonts.status,
        h1: document.querySelectorAll('h1').length,
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        unlabelledInputs: [
          ...document.querySelectorAll('input:not([type=hidden]),select,textarea'),
        ].filter(
          (e) =>
            !e.labels?.length &&
            !e.getAttribute('aria-label') &&
            !e.getAttribute('aria-labelledby'),
        ).length,
      }));
      report.push({
        path,
        width,
        identical: samples[0].equals(samples[1]),
        changedPixels: imageA.data.length === imageB.data.length ? changed : null,
        totalPixels: imageA.info.width * imageA.info.height,
        hash: createHash('sha256').update(samples[1]).digest('hex'),
        ...evidence,
      });
      if (evidence.scrollWidth > width)
        report.push({
          overflow: path,
          width,
          elements: await page.evaluate(() =>
            [...document.querySelectorAll('body *')]
              .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
              .slice(0, 15)
              .map((e) => ({
                tag: e.tagName,
                className: String(e.className),
                right: e.getBoundingClientRect().right,
              })),
          ),
        });
    }
    report.push({ width, errors, failures });
    await context.close();
  }
  const links = [...new Set(report.flatMap((r) => r.links || []))]
      .filter((p) => p.startsWith('/') && !p.startsWith('//'))
      .map((p) => p.split('#')[0])
      .filter(Boolean),
    linkResults = [];
  const request = await browser.newContext();
  for (const path of links) {
    const r = await request.request.get(base + path);
    linkResults.push({ path, status: r.status() });
  }
  report.push({ linkResults });
  await writeFile('test-results/phase7/marketing/report.json', JSON.stringify(report, null, 2));
  assert.ok(
    report.filter((r) => r.errors).every((r) => r.errors.length === 0),
    'marketing console errors: see report',
  );
  assert.equal(
    report.filter((r) => r.overflow).length,
    0,
    'page-level horizontal overflow: see report',
  );
  console.log(
    'PASS six marketing pages at desktop/mobile; repeat screenshots, console/network/links and basic accessibility recorded',
  );
} finally {
  await writeFile('test-results/phase7/marketing/report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
