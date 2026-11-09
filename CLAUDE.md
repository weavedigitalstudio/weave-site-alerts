# CLAUDE.md, Weave Site Alerts

## What this is

A tiny plugin that draws a centrally managed emergency notice at the top of a
client site. The notice content lives in the Weave alerts service
(`~/Projects/weave-alerts-service`, private), not in WordPress. Read that repo's
`docs/plan.md` for the whole system.

Public repository on purpose: the updater then needs no token on each site.

**Nothing client-specific in this repo, ever** (Gareth, 9 November 2026). No
client names, site domains, hosting details, message wording, phone numbers or
results from testing real sites, in code, comments, docs, commit messages or
release notes. All of that lives in the private service repo, whose
`docs/testing.md` holds the real-site test notes. Nothing secret either.

## Rules

- **Fail silent.** Any error, slow answer or missing data draws nothing and
  changes nothing else on the page. Never let this plugin break a client page.
- **No markup from the service.** The browser script builds the notice with
  `textContent` and validated `tel:`/`mailto:` links only. Never introduce
  `innerHTML` for service data.
- **No cache dependence.** The page must never contain the notice. Keep it
  client-side so switching on and off needs no purge.
- **Theme-proof CSS.** Everything scoped to `#weave-site-alert` and forced with
  `!important` where themes style bare elements. After any visual change, test
  on a theme with a fixed header and one with a top bar, at desktop and mobile
  widths. `tests/manual.md` has the checklist.
- Plain PHP 8.1, `declare( strict_types=1 )`, namespaced functions, no build
  step. WordPress Coding Standards: run `phpcs` before a release. NZ English,
  no em or en dashes.

## Releasing

Bump the header `Version:` and `WEAVE_SITE_ALERTS_VERSION` (the workflow
refuses a tag that does not match both), update `CHANGELOG.md`, commit, tag
`vX.Y.Z`, push with `--follow-tags`. Sites poll every 4 hours. A hyphenated tag
is a prerelease and the updater ignores it.
