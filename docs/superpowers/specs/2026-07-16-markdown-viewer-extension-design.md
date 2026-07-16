# Markdown Viewer Extension — Design

**Date:** 2026-07-16
**Status:** Approved
**Targets:** Chrome (MV3) and Firefox, published to Chrome Web Store and Firefox Add-ons (AMO)

## Purpose

A browser extension that renders any raw `.md` file — local (`file://`) or remote (`http(s)://`) — as fully formatted markdown, in place, in the original tab. Goals: **fast** (readable in milliseconds), **safe** (nothing unsanitized reaches the DOM), and **complete** (GFM plus code highlighting, Mermaid, math, emoji).

## Architecture decision

**In-place rendering via content script.** A content script runs on markdown-extension URLs, reads the plain text the browser already loaded, and replaces the page with rendered HTML. The URL in the address bar never changes, so anchors, reload, and copy-link work naturally, and behavior is identical for local and remote files in both browsers.

Alternatives considered and rejected:
- *Extension viewer page (redirect to `viewer.html?src=...`)* — clean isolation, but the address bar shows an extension URL, copy-link breaks, and Firefox extension pages cannot read `file://` URLs, making local file support fragile.
- *Hybrid extension-origin iframe* — avoids page-CSP issues but adds cross-frame messaging for TOC/scroll/anchors and degrades printing and find-in-page.

## Tech stack

One codebase, two builds, via **WXT** (Vite-based cross-browser extension framework) + **TypeScript**.
- `wxt build -b chrome` → Chrome MV3 (service worker background).
- `wxt build -b firefox` → Firefox build (event page, `browser_specific_settings.gecko.id`).
- `wxt zip` → store-ready packages for both.

Libraries (all bundled locally — no CDN or remote code, per store policy):

| Concern | Library |
|---|---|
| Markdown → HTML | `markdown-it` + plugins (anchor, task-lists, footnote, emoji, sub, sup, deflist, linkify enabled) |
| Sanitization | `dompurify` |
| Code highlighting | `highlight.js` (GitHub light/dark themes) |
| Math | `katex` (`$...$`, `$$...$$` via `@vscode/markdown-it-katex`) |
| Diagrams | `mermaid`, lazy-loaded by dynamic import only when the document contains a mermaid fence |
| Base styles | `github-markdown-css` (light + dark) |

## Project structure

```
browser-markdown/
├── wxt.config.ts
├── entrypoints/
│   ├── content/           # runs on *.md URLs: detect → render → mount UI
│   ├── background.ts      # declarativeNetRequest CSP rules, settings defaults
│   └── popup/             # settings: theme, feature toggles, auto-reload
├── lib/
│   ├── detect.ts          # "is this tab really a raw markdown file?"
│   ├── renderer.ts        # markdown-it pipeline + DOMPurify (pure, no browser APIs)
│   ├── toc.ts             # TOC tree build + scrollspy
│   ├── theme.ts           # light/dark/auto, storage.sync persistence
│   ├── reload.ts          # file:// polling auto-reload
│   └── styles/
└── tests/                 # vitest unit tests + markdown fixtures (incl. kitchen-sink.md)
```

Design rule: `renderer.ts` is a **pure function** (markdown string in → sanitized HTML string out) with zero browser APIs, so the whole pipeline is unit-testable in Node.

## Detection

Content script match patterns: URLs ending in `.md`, `.markdown`, `.mdown`, `.mkd`, `.mkdn` on `http(s)://` and `file://`.

URL match alone is not proof (some sites serve HTML at `.md` paths). Before rendering, `detect.ts` requires **both**:
1. `document.contentType` is `text/plain` or `text/markdown`;
2. the body is the browser's plain-text wrapper (a single `<pre>` element).

If either check fails, the extension does nothing. This is the "never break a normal website" guarantee.

## Rendering pipeline

1. Read raw text from the plain-text `<pre>` (no second network fetch).
2. `markdown-it` parses (GFM + plugins) → HTML string. Inline raw HTML in the markdown is allowed at parse time for GitHub compatibility because step 3 makes it safe.
3. `DOMPurify.sanitize` the full HTML — strips scripts, event handlers, `javascript:` URLs. **Nothing unsanitized ever reaches the DOM.**
4. Replace the page body with the rendered document; mount toolbar + TOC sidebar. Keep the original `<pre>` (hidden) for the raw-view toggle.
5. Post-process: highlight.js per code block (lazily via `requestIdleCallback` so huge files never jank), KaTeX on math spans, and — only if mermaid fences exist — dynamic-import Mermaid and render each block with a per-block error fallback.

Performance target: typical README readable in single-digit milliseconds after DOM ready; Mermaid pops in after.

## Security & CSP

- **Sanitization:** DOMPurify between parse and DOM, always.
- **Page CSP:** sites like `raw.githubusercontent.com` send `Content-Security-Policy: default-src 'none'; sandbox`, which would block injected styles, KaTeX fonts, and images referenced by the markdown. Fix: a **declarativeNetRequest** `modifyHeaders` rule removing the CSP header **only on main-frame navigations to markdown-extension URLs** — narrowest possible scope, and an established, store-reviewable pattern.
- Extension assets (CSS, KaTeX fonts) exposed via `web_accessible_resources`.
- **Store compliance from day one:** no remote code, no `eval`, no inline scripts; permissions limited to `storage`, `declarativeNetRequest`, and host permissions constrained by the `.md` URL filters.
- **File access:** Chrome requires the user to enable "Allow access to file URLs" (documented in onboarding/README); Firefox grants `file://` content-script matches without a toggle.

## Viewer features

- **TOC sidebar** — built from `markdown-it-anchor` heading slugs (GitHub-style `#anchors`), nested by level, scrollspy highlight, collapsible with state remembered.
- **Theme** — GitHub light/dark; follows `prefers-color-scheme` by default with a manual light/dark/auto toggle persisted in `storage.sync`. highlight.js and Mermaid themes switch together.
- **Raw ⇄ rendered toggle** — swaps between rendered view and the preserved original `<pre>`, no reload.
- **Auto-reload** — for `file://` documents, poll by re-fetching the same URL every ~1.5s, compare content, re-render on change **preserving scroll position**. Off by default for remote URLs; interval and on/off configurable.
- **Settings popup** — theme, auto-reload interval, per-feature toggles (Mermaid, KaTeX, emoji), global on/off.

## Error handling

Rule: *degrade, never break.*
- Pipeline failure → leave the raw text as the browser showed it + small toolbar notice.
- Bad Mermaid/KaTeX block → inline error card in that block's place; rest of the document renders.
- Huge files → synchronous markdown render (fast) + per-block lazy highlighting via `requestIdleCallback`.

## Testing

- **Unit (vitest):** `renderer.ts` against fixtures — GFM tables/task lists/footnotes, KaTeX, mermaid fences, emoji, and **XSS fixtures** (script tags, `javascript:` URLs, event handlers) asserting DOMPurify strips them. `detect.ts` against real/fake content types.
- **Smoke fixture:** `kitchen-sink.md` exercising every feature; open in both browsers after changes.
- **E2E (Playwright, Chromium):** load the built extension, open a local and a mocked-remote `.md`, assert rendered headings, TOC, and theme toggle work.
- **Firefox packaging check:** `wxt build -b firefox` + `web-ext lint` (AMO's linter) in a script, so the Firefox package is always submittable.

## Out of scope (v1)

- Editing markdown (viewer only).
- Non-`.md` URLs served as `text/markdown` without the extension (no URL filter can catch them; revisit later).
- Export to PDF/HTML (browser print works on the rendered page).
- Firefox for Android.
