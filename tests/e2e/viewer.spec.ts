import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const EXT_PATH = path.resolve('.output/chrome-mv3');
const PORT = 8123;

let server: http.Server;
let context: BrowserContext;

test.beforeAll(async () => {
  server = http
    .createServer((req, res) => {
      const file = path.join('tests/fixtures', path.basename(req.url ?? ''));
      // Browsers auto-request /favicon.ico; without this guard the missing-file
      // read throws synchronously inside the request handler and takes the server
      // down for every subsequent test in this file.
      if (!fs.existsSync(file)) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      // Simulate raw.githubusercontent.com's restrictive CSP to prove the DNR rule strips it.
      res.setHeader('content-security-policy', "default-src 'none'; sandbox");
      res.end(fs.readFileSync(file));
    })
    .listen(PORT);
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT_PATH}`, `--load-extension=${EXT_PATH}`],
    colorScheme: 'light',
  });
});

test.afterAll(async () => {
  await context.close();
  server.close();
});

test('renders a remote markdown file in place', async () => {
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/kitchen-sink.md`);
  await expect(page.locator('#mdv-content h1').first()).toHaveText('Kitchen Sink');
  await expect(page).toHaveTitle('Kitchen Sink');
});

test('builds a TOC and highlights code', async () => {
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/kitchen-sink.md`);
  // The TOC is populated after the (awaited) lazy mermaid render, so a bare
  // one-shot `.count()` races the content script; poll instead of sampling once.
  await expect
    .poll(() => page.locator('#mdv-sidebar a').count())
    .toBeGreaterThan(3);
  await expect(page.locator('#mdv-content code.hljs').first()).toBeVisible();
});

test('theme toggle cycles and persists to the html stamp', async () => {
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/kitchen-sink.md`);
  const themeBtn = page.getByTitle('Cycle theme (auto → light → dark)');
  const before = await page.locator('html').getAttribute('data-mdv-theme');
  // The default setting is 'auto', which resolves to the html stamp seen here.
  expect(['light', 'dark']).toContain(before);
  await themeBtn.click(); // auto -> light
  await themeBtn.click(); // light -> dark
  const after = await page.locator('html').getAttribute('data-mdv-theme');
  // Two clicks from the default 'auto' always land on 'dark': 'dark' forces the
  // dark stylesheet regardless of the system color-scheme, so this is
  // deterministic even though `before` depends on the test environment's
  // prefers-color-scheme.
  expect(after).toBe('dark');
});
