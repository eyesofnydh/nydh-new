# Nidhin's portfolio

A static portfolio website. Serve this folder with a local web server and open
`index.html`. Deployment requires no build step.

## Code organization

- `index.html`: page content and existing layout.
- `style.css`: main site styles.
- `css/`: extracted chart, guestbook, and snake styles, in their original cascade order.
- `index.js`: navigation and optional animation libraries.
- `js/`: separate chart, guestbook, games, quotes, dialog, and other interactions.
- `images/`, `icons/`, `sound/`: existing assets.
- `scripts/check-site.cjs`: browser regression checks using Playwright and Microsoft Edge.

`styles.scss` is a legacy source and is not compiled or loaded by the site.
`car.js` is an unused prototype; it is deliberately not loaded into the snake canvas.
Edit the CSS files used by `index.html` to update production styles.

## Checks

With Playwright installed, run `node scripts/check-site.cjs`. The default browser
is Microsoft Edge; set `BROWSER_CHANNEL` to use another installed Chromium channel.
If Playwright is bundled elsewhere, set `PLAYWRIGHT_PATH` to its module directory.
The checks block external resources to verify graceful failure of CDN libraries.

## Fixes from the review

- Removed the conflicting car script from the snake canvas.
- Corrected duplicate section and typing IDs.
- Repaired menu behavior after resizing, closing on navigation, and keyboard controls.
- Fixed header stacking and clipping that prevented mobile navigation clicks.
- Removed the project filter's reliance on the browser's implicit global event.
- Guarded optional libraries and missing popup elements against runtime errors.
- Prevented duplicate snake timers, rapid direction reversal, and full-board food loops.
- Prevented dinosaur startup from scrolling the page and corrected repeated speed increases.
- Validated stored guestbook entries and escaped stored reactions before rendering.
- Added the missing contact name field and required message validation.
- Handled rejected hover audio playback and bounded loading-overlay delays.

## Service limitations

Guestbook messages are local to the visitor's browser, not shared between visitors.
The contact form uses FormSubmit; delivery and account activation must be verified
with a real submission by the site owner. Browser checks do not send email.
Fonts, icons, charts, and animations depend on external CDN services.
