# browser-markdown — Agent Guide

A Chrome (MV3) + Firefox (MV3) extension that renders raw `.md` files in place — local `file://` and remote `http(s)://` — with GFM, syntax-highlighted code, KaTeX math, lazy-loaded Mermaid diagrams, emoji, a TOC sidebar with scrollspy, GitHub light/dark themes, a raw-view toggle, auto-reload for local files, and a settings popup. Built with WXT + TypeScript; one codebase, two store-ready builds.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Installs deps; `postinstall` runs `wxt prepare` (regenerates `.wxt/` types — required before `tsc` works) |
| `npm run dev` | Chrome dev build with HMR |
| `npm run dev:firefox` | Firefox dev build |
| `npm test` | Unit tests (vitest, jsdom) — `tests/**/*.test.ts` |
| `npm run build` | Production builds for both browsers → `.output/chrome-mv3/`, `.output/firefox-mv3/` |
| `npm run e2e` | Playwright E2E (`tests/e2e/*.spec.ts`) — requires `npm run build` first and `npx playwright install chromium` once |
| `npm run lint:firefox` | AMO linter (`web-ext lint`) over the Firefox build |
| `npm run zip` | Store-ready zips → `.output/*.zip` |

Type check: `npx tsc --noEmit` (strict mode).

## Architecture

```
entrypoints/
  content/index.ts     content-script entry: URL-matched, gates on detect + settings.enabled
  content/viewer.ts    viewer shell (#mdv-root: sidebar/toolbar/article/raw), updateContent pipeline
  content/viewer.css   viewer layout + theme variables (html[data-mdv-theme])
  background.ts        minimal; DNR CSP-strip rules are static (public/rules.json)
  popup/               settings form, bound generically to Settings keys via input name=
  mermaid-runner.ts    unlisted script, lazy-imported only when a page has mermaid blocks
lib/
  renderer.ts    markdown-it (+GFM/KaTeX/emoji plugins) → DOMPurify. THE security boundary.
  detect.ts      "is this tab a raw markdown file?" (content-type + single-<pre> body)
  settings.ts    storage.sync-backed Settings; normalizeSettings clamps on every read path
  theme.ts       light/dark/auto via injected <style id="mdv-theme-css"> (color-only CSS)
  toc.ts         heading collection, TOC list, IntersectionObserver scrollspy
  highlight.ts   idle-scheduled highlight.js (lib/common) on pre>code
  reload.ts      XHR polling for file:// auto-reload (fetch rejects file:// in Chrome)
  patterns.ts    shared content-script URL match patterns
  shims.d.ts     module declarations for untyped markdown-it plugins (the only allowed `any`)
```

Docs: design spec in `docs/superpowers/specs/`, implementation plan in `docs/superpowers/plans/`.

## Hard rules

- **Sanitization boundary:** every HTML string passes `DOMPurify.sanitize` before touching the DOM. The ONLY `innerHTML` sink in the codebase is `renderMarkdown(...)` output in `viewer.ts`. Never add another unsanitized sink; never move sanitize out of `renderer.ts`'s return. `md.validateLink = () => true` is deliberate — DOMPurify alone filters URI schemes, and `tests/renderer.test.ts` has the XSS regression suite protecting this.
- **No remote code, no `eval`, no inline scripts** — Chrome Web Store and AMO both reject these. Every library is bundled.
- **MV3 for both browsers** (`manifestVersion: 3` in `wxt.config.ts`); Firefox `strict_min_version: 128.0` (first with DNR on by default).
- **Permissions are frozen:** `storage`, `declarativeNetRequest`, host permissions `*://*/*.md*`, `*://*/*.markdown*`, `*://*/*.mkd*`. Adding any permission is a store-review event — don't do it casually.
- **TypeScript strict.** `any` is allowed only in `lib/shims.d.ts` and the two commented interop spots (katex plugin import, popup form binding).
- Keep `renderer.ts` pure (string in → sanitized string out, no browser APIs) so it stays unit-testable.

## Gotchas (these cost real debugging time — don't re-learn them)

- **`?inline` CSS in tests:** vitest disables CSS processing by default; `vitest.config.ts` has `test.css.include` for `github-markdown-css` and `highlight.js`. Without it those imports silently become `''`.
- **The noncharacter Vite plugin in `wxt.config.ts` is load-bearing.** Chromium refuses to load extensions whose JS contains a raw Unicode noncharacter (U+FFFF ends up in the minified KaTeX bundle under Vite 8). The plugin re-escapes them post-minify. Removing it breaks `--load-extension` and store uploads silently.
- **Test file split:** `.test.ts` = vitest unit tests; `.spec.ts` = Playwright E2E. vitest's include pattern only matches `.test.ts` — keep it that way.
- **KaTeX CSS** is imported as a real stylesheet in the content script (fonts inline as base64); theme CSS goes through `?inline` + `<style>` injection instead. Don't swap these — theme CSS is color-only, KaTeX CSS has assets.
- **Mermaid must stay out of the content bundle.** It ships as the unlisted `mermaid-runner.js` (WAR-exposed) and is dynamic-imported on demand. If `content.js` suddenly grows by megabytes, this regressed.
- **Local files:** Chrome needs the "Allow access to file URLs" toggle per install; Firefox MV3 needs a manual host-permission grant (Manage Extension → Permissions). Firefox may also block file:// re-reads, disabling auto-reload there (rendering unaffected).
- **Empty-file saves intentionally don't re-render** (`lib/reload.ts`): editors truncate-then-write on save; reacting to the empty read would flash a blank page. There's a test pinning this.

## Conventions

- TDD for `lib/` modules: failing test → implementation → green, commit per unit of work.
- Run `npm test` and `npx tsc --noEmit` before committing; run `npm run e2e` when `entrypoints/` changes.
- Commit messages: conventional prefixes (`feat:`, `fix:`, `test:`, `chore:`, `docs:`), no attribution trailers.
