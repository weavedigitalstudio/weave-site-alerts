# Weave Site Alerts

Shows an emergency notice across the top of every page of a client site when Weave switches one on centrally. The rest of the time it does nothing visible.

For example, when a client's phone system goes down and every one of their sites needs to say so at once. Works whatever the theme: Beaver Builder Theme, Themer, GeneratePress, Page Builder Framework or block themes.

## How it works

1. The plugin adds one small deferred script to every public page.
2. The script asks the Weave alerts service, `https://alerts.weave.digital/v1/alert/<this-site's-host>`, whether a notice is active.
3. If one is, the script draws it at the top of the page. If nothing is active, the answer is slow (5 seconds) or anything fails, nothing is drawn.

The notice is never part of the page itself, so it stays out of any page cache. Switching a notice on or off needs no cache purge on any site, and sites pick the change up within about two minutes.

The wording, phone numbers and which sites show what are all managed in the service, not in this plugin.

## Installing

There is nothing to configure. Install and activate:

```bash
wp plugin install https://github.com/weavedigitalstudio/weave-site-alerts/releases/latest/download/weave-site-alerts.zip --activate
```

(or upload the zip from the latest release). Updates come through the normal WordPress updates screen from GitHub releases. The repository is public, so no token is needed.

The site must also be listed in the service's config for its group, under its host name without `www.`. A site that is not listed simply never shows anything.

## What visitors see

- An amber bar (or dark, for `info` notices) at the very top, with the message, tap-to-call and email links, and a close button. Closing it hides that notice for the rest of the visit.
- If the theme pins its header to the top of the screen, the notice pins above it and moves the header down, so neither covers the other.
- During a phone outage, the notice can also point the page's own "call us" links at the backup number. A link's text changes only when it showed the old number.
- Screen readers get the notice as a labelled region at the start of the page.

## Settings, for developers

| Constant or filter | Default | Effect |
|---|---|---|
| `WEAVE_SITE_ALERTS_ENDPOINT` | `https://alerts.weave.digital/v1/alert/` | Service address. The site key is appended. |
| `WEAVE_SITE_ALERTS_SITE` | home URL host, no `www.` | Which site's notice to show. Lets a staging or local copy show the live site's notice. |
| `weave_site_alerts_enabled` | `true` | Return false to switch the plugin off without deactivating it. |
| `weave_site_alerts_endpoint` | full URL | Change the final address. |

## Previewing

Add `?alert-preview` to any page URL to also see notices still in preview on the service. Preview notices carry a "Preview" badge.

## Caveats

- perfmatters "Delay JavaScript" would hold the script back until the visitor scrolls or taps. If it is switched on, add `weave-site-alerts` to its exclusions.
- A visitor with JavaScript switched off sees no notice.
- The notice appears a moment after the page, so it is a small layout shift while a notice is on, and none otherwise.

## Testing

`tests/manual.md` has the checklist used before a release.
