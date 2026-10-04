const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
require('./build.cjs');
const outputRoot = path.join(root, 'dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(https?:|#|data:)/.test(match[1])) continue;
  assert.ok(fs.existsSync(path.join(root, match[1])), `Missing asset: ${match[1]}`);
}
const server = http.createServer((req, res) => {
  const file = path.resolve(outputRoot, '.' + decodeURIComponent(req.url === '/' ? '/index.html' : req.url));
  if (!file.startsWith(outputRoot + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Exercise graceful degradation without relying on external CDNs.
    await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1') ? route.continue() : route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.scrollY), 0, 'Page must not jump to a game after loading');
    for (const width of [320, 390, 768, 820, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => [...document.querySelectorAll('.container, .about123-card, .skill-card1234, .portfolio-item, .game-container, canvas, .guestbook-form')].filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
      }).map(element => element.id || element.className));
      assert.deepEqual(overflow, [], `Content overflow at ${width}px`);
    }
    assert.equal(await page.locator('.loading-section').isVisible(), false);
    assert.deepEqual(await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    }), []);
    assert.equal(await page.evaluate(() => document.activeElement.id), '');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.hamburger').click();
    assert.equal(await page.locator('.menu').evaluate(element => element.classList.contains('show')), true);
    await page.locator('.menu a[href="#about"]').click();
    assert.equal(await page.locator('.menu').evaluate(element => element.classList.contains('show')), false);
    await page.locator('#message-text').fill('Regression test <script>alert(1)</script>');
    await page.locator('#guestbook-form').evaluate(form => form.requestSubmit());
    assert.equal(await page.locator('#message-count').textContent(), '1');
    assert.equal(await page.locator('#messages script').count(), 0);
    await page.locator('#messages .delete-btn').click();
    assert.equal(await page.locator('#message-count').textContent(), '0');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('[data-snake-start]').first().click();
    await page.locator('button[data-snake-begin]').click();
    assert.equal(await page.locator('#gameCanvas').getAttribute('width'), '800');
    await page.locator('.game-section').press('Escape');
    assert.equal(await page.locator('#pauseOverlay').isVisible(), true);
    await page.locator('.game-section').press('Escape');
    assert.equal(await page.locator('#pauseOverlay').isVisible(), false);
    await page.locator('#snake-pause').click();
    assert.equal(await page.locator('#pauseOverlay').isVisible(), true);
    assert.equal(await page.locator('.contact input[name="name"]').count(), 1);
    assert.deepEqual(errors, []);
    console.log('Passed: built site, no automatic scrolling, six responsive widths, mobile navigation, guestbook, snake startup/pause/touch controls, contact fields, and CDN failure fallback.');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
