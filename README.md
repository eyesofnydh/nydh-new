# Nidhin's portfolio

A portfolio website that preserves the character hero, split background,
floating symbols, cards, interactive chart, guestbook, and both games.

## Develop and publish

- `npm ci`: install the locked Netlify storage dependency (Node.js 22 or newer).
- `npm run dev`: preview the source at http://127.0.0.1:4173.
- `npm run build`: validate JavaScript, local assets, anchor targets, and unique IDs,
  then assemble the deployable site in `dist/`.
- `npm run preview`: serve that build at http://127.0.0.1:4173.
- `npm test`: run game lifecycle and guestbook API regression tests.

Deploy this repository through Netlify. `netlify.toml` sets the build command,
`dist/` publish directory, and server functions. Uploading only `dist/` to a static
host does not install the shared guestbook API. The local build does not publish automatically.

## Code organization

- `index.html`: page content and existing layout.
- `style.css`: main site styles.
- `css/`: chart, guestbook, and snake styles; `responsive.css` supplies the shared
  dark/purple theme and desktop, tablet, and phone layout rules.
- `index.js`: navigation and optional animation libraries.
- `js/`: separate chart, guestbook, games, quotes, dialog, and other interactions.
- `images/`, `icons/`, `sound/`: existing assets.
- `images/optimized/`: compressed WebP copies; original artwork is retained.
- `server/`: shared guestbook validation, persistence adapters, and email delivery.
- `netlify/functions/`: public API and failed-notification retry worker.
- `scripts/check-site.cjs`: browser regression checks using Playwright and Microsoft Edge.

`styles.scss` is a legacy source and is not compiled or loaded by the site.
`car.js` is an unused prototype; it is deliberately not loaded into the snake canvas.
Edit the CSS files used by `index.html` to update production styles.

## Checks

With Playwright installed, run `npm run test:browser`. The default browser
is Microsoft Edge; set `BROWSER_CHANNEL` to use another installed Chromium channel.
If Playwright is bundled elsewhere, set `PLAYWRIGHT_PATH` to its module directory.
The checks use the production build, block external resources to verify graceful
failure of CDN libraries, check nine 320–1920px phone/tablet/desktop layouts, and wait after page load to
detect delayed automatic scrolling. These browser checks require a working browser
and permission to launch it; the Node.js tests do not validate rendered appearance.
Set `CHECK_ONLINE=1` to also check the page with external libraries enabled.
API tests use fake email delivery; browser tests run against isolated local data.
Screenshots and test data are written to the ignored `test-results/` folder.

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

## Shared guestbook and email

Production entries are stored in the site-wide Netlify Blobs store `portfolio-guestbook`,
so all visitors see the same feed and new deployments preserve entries. The feed shows
the latest 200 notes in pages of 10; older entries remain in storage. Author/message/reaction
are public. Ownership secrets stay in each author's browser; the server stores only hashes
and allows deletion only with the corresponding secret. Clearing browser storage loses
self-service deletion access. The site owner can manage the underlying store in Netlify.

Production notifications use the site's existing FormSubmit destination,
`nidhinxnarayanan@gmail.com`. Set `GUESTBOOK_EMAIL` in Netlify to override it.
FormSubmit requires one-time activation through the recipient's inbox. Check that inbox
after the first production submission and follow the activation link if requested.
An accepted request means the provider accepted it, not that inbox delivery was verified.
Failed notifications are kept in an outbox and retried every 15 minutes, up to five
attempts. As with most email retry systems, a provider timeout can cause duplicate delivery.

Netlify deploy previews use separate stores and never send notifications. `npm run dev`
and `npm run preview` store shared preview notes in `.local/guestbook/`, also without
sending email. The UI labels preview mode clearly. Local-only messages from the old
browser guestbook are not automatically published.

The API validates input, uses conditional writes to prevent concurrent-note loss,
checks submission origins, rate-limits posting, and keeps private metadata out of responses.
No email or Netlify secrets are exposed in frontend code.

References: [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/),
[FormSubmit AJAX](https://formsubmit.co/ajax-documentation).

## Performance and appearance

The original hero, illustrations, animations, and games are retained. Below-the-fold
images load lazily; optimized WebP images include dimensions to reduce layout movement.
Snake's food feedback lives in a reserved strip below its canvas and cannot cover the board.
Text and placeholders use lighter neutral colors against the existing dark/purple palette.
Fonts, icons, and optional animation libraries still use external CDNs; a chart fallback
keeps the skills visualization visible if Highcharts is unavailable.
