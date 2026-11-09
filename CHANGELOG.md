# Changelog

## 0.1.1, 10 November 2026

- On desktop the notice is centred, icon and text together, with the close button on the right. Phones keep the left-aligned layout, which reads faster when the message wraps.
- The close button is a drawn cross, so it is the same clear size whatever the site's font.

## 0.1.0, 9 November 2026

First version.

- Loads a small deferred script on every public page. The script asks the Weave alerts service whether a notice is active for this site and draws it at the top of the page. Nothing active, a slow answer or an error draws nothing.
- Pinned headers (Beaver Builder fixed header, top bars) are detected: the notice pins above them and moves them down.
- Theme CSS cannot restyle the notice: its styles are scoped to `#weave-site-alert` and forced.
- During a phone outage the notice can point the page's own phone links at a backup number, and every number written inside those links (icon links included) shows the backup number too.
- Two levels: `urgent` (amber, warning icon) and `notice` (pale, information icon) for planned or less serious messages.
- Dismiss button, remembered for the browser session per notice.
- `?alert-preview` on any URL shows notices still in preview.
- GitHub release updater for the public repository, no token needed.
