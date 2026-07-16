# Site Avoidance & CSP Rule Scoping — Design

**Date:** 2026-07-16 · **Status:** Approved · **Branch:** feature/cursor-ui-redesign

## Problem

1. The DNR CSP-strip rule fires on ANY main-frame URL ending `.md` — including `github.com/...blob/main/README.md` HTML pages — silently removing GitHub's CSP for no benefit (rendering was never at risk there: the content-type + single-`<pre>` detection already rejects HTML pages).
2. Users have no per-site escape hatch when they don't want rendering on some host.

## Design

**1. Content-type-scoped CSP rule (per-browser rulesets).** Replace `public/rules.json` with:
- `public/rules.chrome.json` — adds `condition.responseHeaders: [{ header: "content-type", values: ["text/plain*", "text/markdown*", "text/x-markdown*"] }]`; the strip only fires on actual raw-markdown responses. Requires Chrome 128 → add `minimum_chrome_version: "128"` to the Chrome manifest.
- `public/rules.firefox.json` — Firefox lacks responseHeaders conditions; keeps the URL regex plus `excludedRequestDomains: ["github.com"]` (covers all subdomains; `raw.githubusercontent.com` is a different domain, unaffected).
- `wxt.config.ts` manifest function picks the path per browser.

**2. Content-script exclusion.** `excludeMatches: ['*://github.com/*', '*://www.github.com/*']` on the content script definition — belt-and-suspenders on top of detection.

**3. User denylist.** `Settings.disabledHosts: string[]` (default `[]`), guarded in `normalizeSettings` (non-array/non-string entries dropped). New pure `lib/sitelist.ts`: `isHostDisabled(hostname, patterns)` — case-insensitive; `example.com` matches the host and all subdomains; leading `*.` accepted as equivalent; no substring tricks (`evilgithub.com` never matches `github.com`). Content script checks it after the `enabled` gate. Popup gains a "Disabled sites" textarea (one hostname per line); the generic binding learns textarea ↔ string-array (join/split on newlines, trimmed, empties dropped).

## Tests

`tests/sitelist.test.ts`: exact, subdomain, `*.` prefix, case-insensitivity, suffix-collision rejection, empty/whitespace patterns. `tests/settings.test.ts`: default `[]`, valid array round-trip, garbage shape → default. E2E unchanged — and now doubles as proof the Chrome responseHeaders condition still strips CSP on genuine `text/plain` responses.

## Out of scope

Per-tab "disable here" quick action; regex patterns; path-level rules.
