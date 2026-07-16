import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const EXT_PATH = path.resolve('output/chrome-mv3');
const PORT = 8124;
const OUT_DIR = path.resolve('output/screenshots');

const server = http
  .createServer((req, res) => {
    const file = path.join('tests/fixtures', path.basename(req.url ?? ''));
    if (!fs.existsSync(file)) {
      res.statusCode = 404;
      return res.end('not found');
    }
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(fs.readFileSync(file));
  })
  .listen(PORT);

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const scheme of ['light', 'dark']) {
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    colorScheme: scheme,
    viewport: { width: 1440, height: 1200 },
    args: [`--disable-extensions-except=${EXT_PATH}`, `--load-extension=${EXT_PATH}`],
  });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/kitchen-sink.md`);
  await page.waitForSelector('#mdv-content h1');
  await page.waitForTimeout(1500); // mermaid + idle highlighting
  await page.screenshot({ path: path.join(OUT_DIR, `${scheme}.png`), fullPage: true });
  await ctx.close();
}

server.close();
console.log(`wrote ${OUT_DIR}/light.png and dark.png`);
