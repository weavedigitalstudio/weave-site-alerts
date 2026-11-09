# Manual test checklist

Run before tagging a release.

## Local end to end

1. Run the alerts service locally and give it a test site with a backup phone number.
2. On a local WordPress site, install this plugin and add an mu-plugin:
   ```php
   define( 'WEAVE_SITE_ALERTS_ENDPOINT', 'http://localhost:8788/v1/alert/' );
   define( 'WEAVE_SITE_ALERTS_SITE', 'example.test' );
   ```
3. Check at 1366px and 390px wide:
   - [ ] A live notice: the bar is the first element in `<body>`, the text is right, links are tap-to-call.
   - [ ] A page with `tel:` links and phone-link swap on: they point at the backup number. A link whose text was the old number shows the new one. Other link text is untouched.
   - [ ] The close button hides it. A reload in the same tab keeps it hidden, and phone links stay swapped.
   - [ ] A preview notice: hidden on a plain URL, shown with `?alert-preview` and a Preview badge.
   - [ ] Notice switched off: gone on a fresh load.
   - [ ] Service stopped: the page loads normally, with no bar and no JavaScript errors.
   - [ ] No PHP notices from the plugin.

## Real themes, without touching any server

Load a live site in a local browser (Playwright), inject `assets/site-alerts.js` after load with `window.weaveSiteAlerts = { endpoint: 'https://alerts.test/v1/alert/x' }`, and answer that request with a sample notice using `page.route`. Screenshot desktop and mobile. Check that the notice does not overlap a pinned header and that the theme has not restyled it.

Cover at least: a theme with a fixed header, one with a top bar above the header, one with an off-canvas mobile menu, and a block theme.

## Coding standards

Run `phpcs` from the repo root. There should be no errors or warnings.
