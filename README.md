# Nidhin's portfolio

A static portfolio website that preserves the character hero, split background,
floating symbols, cards, interactive chart, guestbook, and both games.

## Develop and publish

- `npm run dev`: preview the source at http://127.0.0.1:4173.
- `npm run build`: validate JavaScript, local assets, anchor targets, and unique IDs,
  then assemble the deployable site in `dist/`.
- `npm run preview`: serve that build at http://127.0.0.1:4173.
- `npm test`: run game lifecycle regression tests using Node.js only.

Deploy the contents of `dist/` to your static host. The build needs Node.js and has
no package installation step. It does not publish the site automatically.

## Code organization

- `index.html`: page content and existing layout.
- `style.css`: main site styles.
- `css/`: chart, guestbook, and snake styles; `responsive.css` supplies the shared
  dark/purple theme and desktop, tablet, and phone layout rules.
- `index.js`: navigation and optional animation libraries.
- `js/`: separate chart, guestbook, games, quotes, dialog, and other interactions.
- `images/`, `icons/`, `sound/`: existing assets.
- `scripts/check-site.cjs`: browser regression checks using Playwright and Microsoft Edge.

`styles.scss` is a legacy source and is not compiled or loaded by the site.
`car.js` is an unused prototype; it is deliberately not loaded into the snake canvas.
Edit the CSS files used by `index.html` to update production styles.

## Checks

With Playwright installed, run `npm run test:browser`. The default browser
is Microsoft Edge; set `BROWSER_CHANNEL` to use another installed Chromium channel.
If Playwright is bundled elsewhere, set `PLAYWRIGHT_PATH` to its module directory.
The checks use the production build, block external resources to verify graceful
failure of CDN libraries, check 320–1440px layouts, and wait after page load to
detect delayed automatic scrolling. These browser checks require a working browser
and permission to launch it; the Node.js tests do not validate rendered appearance.

## Fixes from the review

- Removed the conflicting car script from the snake canvas.
- Corrected duplicate section and typing IDs.
- Repaired menu behavior after resizing, closing on navigation, and keyboard controls.
- Fixed header stacking and clipping that prevented mobile navigation clicks.
- Removed the project filter's reliance on the browser's implicit global event.
- Guarded optional libraries and missing popup elements against runtime errors.
- Prevented duplicate snake timers, rapid direction reversal, and full-board food loops.
- Prevented dinosaur startup from scrolling the page and corrected repeated speed increases.
- Removed stale inline game implementations; HTML now loads each maintained game file once.
- Isolated overlapping animation names so the guestbook cannot replace hero animations.
- Added phone/tablet layouts, readable inputs, touch controls, and accessible navigation.
- Added a chart fallback, bounded loading overlay, and consistent section backgrounds.
- Validated stored guestbook entries and escaped stored reactions before rendering.
- Added the missing contact name field and required message validation.
- Handled rejected hover audio playback and bounded loading-overlay delays.

## Service limitations

Guestbook messages are local to the visitor's browser, not shared between visitors.
The contact form uses FormSubmit; delivery and account activation must be verified
with a real submission by the site owner. Browser checks do not send email.
Fonts, icons, charts, and animations depend on external CDN services.
