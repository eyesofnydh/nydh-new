const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('./server.cjs');
const { randomUUID } = require('node:crypto');
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
const server = createServer(outputRoot, { guestbookDirectory: path.join(root, 'test-results', `browser-data-${randomUUID()}`) });
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
    fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Exercise graceful degradation without relying on external CDNs.
    await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1') ? route.continue() : route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.scrollY), 0, 'Page must not jump to a game after loading');
    for (const [width, height] of [[320, 667], [390, 844], [430, 932], [768, 1024], [820, 1180], [1024, 768], [1180, 820], [1440, 900], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      const overflow = await page.evaluate(() => [...document.querySelectorAll('.container, .about123-card, .skill-card1234, .portfolio-item, .game-container, canvas, .guestbook-form')].filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
      }).map(element => element.id || element.className));
      assert.deepEqual(overflow, [], `Content overflow at ${width}px`);
      if ([390, 820, 1440].includes(width)) await page.screenshot({ path: path.join(root, 'test-results', `home-${width}.png`) });
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
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/api/guestbook') && response.request().method() === 'POST'),
      page.locator('#guestbook-form .submit-btn').click()
    ]);
    await page.waitForFunction(() => document.getElementById('message-count').textContent === '1');
    assert.equal(await page.locator('#message-count').textContent(), '1');
    assert.equal(await page.locator('#messages script').count(), 0);
    const otherVisitor = await browser.newPage();
    await otherVisitor.route('**/*', route => route.request().url().startsWith('http://127.0.0.1') ? route.continue() : route.abort());
    await otherVisitor.goto(`http://127.0.0.1:${server.address().port}`);
    await otherVisitor.waitForFunction(() => document.getElementById('message-count').textContent === '1');
    assert.equal(await otherVisitor.locator('#messages .delete-btn').count(), 0, 'Other visitors cannot delete the author’s note');
    await otherVisitor.close();
    await page.locator('#guestbook').screenshot({ path: path.join(root, 'test-results', 'guestbook-mobile.png') });
    await page.locator('#messages .delete-btn').click();
    await page.waitForFunction(() => document.getElementById('message-count').textContent === '0');
    assert.equal(await page.locator('#message-count').textContent(), '0');
    // Failed delivery must leave the visitor's draft available to retry.
    const rejectPost = route => route.request().method() === 'POST'
      ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Please retry shortly.' }) })
      : route.continue();
    await page.route('**/api/guestbook', rejectPost);
    await page.locator('#message-text').fill('Keep my draft on failure');
    await page.locator('#guestbook-form .submit-btn').click();
    await page.waitForFunction(() => document.getElementById('guestbook-status').dataset.state === 'error');
    assert.equal(await page.locator('#message-text').inputValue(), 'Keep my draft on failure');
    await page.unroute('**/api/guestbook', rejectPost);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('[data-snake-start]').first().click();
    await page.locator('button[data-snake-begin]').click();
    assert.equal(await page.locator('#gameCanvas').getAttribute('width'), '800');
    await page.locator('.game-section').press('Escape');
    assert.equal(await page.locator('#pauseOverlay').isVisible(), true);
    await page.evaluate(() => {
      document.getElementById('quoteText').textContent = 'Food collected! The game stays fully visible.';
      document.getElementById('quoteDisplay').classList.add('show');
    });
    const clearBoard = await page.evaluate(() => {
      const board = document.getElementById('gameCanvas').getBoundingClientRect();
      const quote = document.getElementById('quoteDisplay').getBoundingClientRect();
      return quote.top >= board.bottom;
    });
    assert.ok(clearBoard, 'Food feedback overlaps the board');
    await page.locator('.game-section').screenshot({ path: path.join(root, 'test-results', 'snake-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.game-section').screenshot({ path: path.join(root, 'test-results', 'snake-mobile.png') });
    await page.locator('.game-section').press('Escape');
    assert.equal(await page.locator('#pauseOverlay').isVisible(), false);
    await page.locator('#snake-pause').click();
    assert.equal(await page.locator('#pauseOverlay').isVisible(), true);
    assert.equal(await page.locator('.contact input[name="name"]').count(), 1);
    assert.deepEqual(errors, []);
    console.log('Passed: nine device sizes, no automatic scrolling, mobile navigation, shared guestbook across two visitors, owner-only deletion, clear Snake feedback, game controls, and CDN fallback.');
    if (process.env.CHECK_ONLINE === '1') {
      const online = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const onlineErrors = [];
      online.on('pageerror', error => onlineErrors.push(error.message));
      await online.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle', timeout: 60000 });
      await online.waitForTimeout(1500);
      assert.equal(await online.evaluate(() => window.scrollY), 0);
      assert.deepEqual(onlineErrors, []);
      await online.screenshot({ path: path.join(root, 'test-results', 'online-desktop.png') });
      console.log('Online libraries:', await online.evaluate(() => ({ chart: !!window.Highcharts, typing: !!window.TypeIt, animations: !!window.AOS })));
      await online.locator('#guestbook').screenshot({ path: path.join(root, 'test-results', 'guestbook-desktop.png') });
      await online.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
