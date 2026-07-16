# browser-markdown — Agent Guide

A Chrome (MV3) + Firefox (MV3) extension that renders raw `.md` files in place — local `file://` and remote `http(s)://` — with GFM, syntax-highlighted code, KaTeX math, lazy-loaded Mermaid diagrams, emoji, a TOC sidebar with scrollspy, GitHub light/dark themes, a raw-view toggle, auto-reload for local files, and a settings popup. Built with WXT + TypeScript; one codebase, two store-ready builds.

## Commands

**This project uses pnpm — never npm** (no `package-lock.json`; the lockfile is `pnpm-lock.yaml`).

| Command | What it does |
| --- | --- |
| `pnpm install` | Installs deps; `postinstall` runs `wxt prepare` (regenerates `.wxt/` types — required before `tsc` works) |
| `pnpm dev` | Chrome dev build with HMR |
| `pnpm dev:firefox` | Firefox dev build |
| `pnpm test` | Unit tests (vitest, jsdom) — `tests/**/*.test.ts` |
| `pnpm build` | Production builds for both browsers → `output/chrome-mv3/`, `output/firefox-mv3/` |
| `pnpm e2e` | Playwright E2E (`tests/e2e/*.spec.ts`) — requires `pnpm build` first and `pnpm exec playwright install chromium` once |
| `pnpm lint:firefox` | AMO linter (`web-ext lint`) over the Firefox build |
| `pnpm zip` | Store-ready zips → `output/*.zip` |

Type check: `pnpm exec tsc --noEmit` (strict mode).

## Architecture

```
entrypoints/
  content/index.ts     content-script entry: URL-matched, gates on detect + settings.enabled
  content/viewer.ts    viewer shell (#mdv-root: sidebar/toolbar/article/raw), updateContent pipeline
  content/viewer.css   viewer chrome layout (sidebar/toolbar/raw); all colors come from tokens.css
  background.ts        minimal; DNR CSP-strip rules are static (public/rules.json)
  popup/               settings form, bound generically to Settings keys via input name=
  mermaid-runner.ts    unlisted script, lazy-imported only when a page has mermaid blocks
lib/
  renderer.ts    markdown-it (+GFM/KaTeX/emoji plugins) → DOMPurify. THE security boundary.
  detect.ts      "is this tab a raw markdown file?" (content-type + single-<pre> body)
  settings.ts    storage.sync-backed Settings; normalizeSettings clamps on every read path
  theme.ts       stamps html[data-mdv-theme]; all colors are --mdv-* tokens in assets/styles/tokens.css (static, no injection)
  toc.ts         heading collection, TOC list, IntersectionObserver scrollspy
  highlight.ts   idle-scheduled highlight.js (lib/common) on pre>code
  reload.ts      XHR polling for file:// auto-reload (fetch rejects file:// in Chrome)
  patterns.ts    shared content-script URL match patterns
  shims.d.ts     module declarations for untyped markdown-it plugins (the only allowed `any`)
assets/styles/  tokens.css + markdown.css + hljs-cursor.css (design system)
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

- **The noncharacter Vite plugin in `wxt.config.ts` is load-bearing.** Chromium refuses to load extensions whose JS contains a raw Unicode noncharacter (U+FFFF ends up in the minified KaTeX bundle under Vite 8). The plugin re-escapes them post-minify. Removing it breaks `--load-extension` and store uploads silently.
- **Test file split:** `.test.ts` = vitest unit tests; `.spec.ts` = Playwright E2E. vitest's include pattern only matches `.test.ts` — keep it that way.
- **Theming is static tokens.** assets/styles/tokens.css defines light (:root) and dark (html[data-mdv-theme='dark']) palettes; theme.ts only flips the attribute. Never re-introduce runtime <style> injection or github-markdown-css.
- **Fonts are bundled** (@fontsource Inter latin 400/500/600 + JetBrains Mono latin 400), imported in the content entry and popup main.ts; they inline into the built CSS.
- **Mermaid must stay out of the content bundle.** It ships as the unlisted `mermaid-runner.js` (WAR-exposed) and is dynamic-imported on demand. If `content.js` suddenly grows by megabytes, this regressed.
- **CSP-strip rules are per-browser** (`public/rules.chrome.json` / `rules.firefox.json`, picked in wxt.config.ts). Chrome scopes the strip by response `content-type` (needs Chrome ≥128, pinned via `minimum_chrome_version`); Firefox can't match response headers, so it excludes github.com by domain. Never collapse these back into one file — Firefox rejects rules with unknown condition keys.
- **Site avoidance is layered:** content-type + single-`<pre>` detection (universal), `excludeMatches` for github.com (perf), and the user `disabledHosts` setting via `lib/sitelist.ts` (subdomain-inclusive matching). The popup textarea binds string-array settings one-per-line.
- **Local files:** Chrome needs the "Allow access to file URLs" toggle per install; Firefox MV3 needs a manual host-permission grant (Manage Extension → Permissions). Firefox may also block file:// re-reads, disabling auto-reload there (rendering unaffected).
- **Empty-file saves intentionally don't re-render** (`lib/reload.ts`): editors truncate-then-write on save; reacting to the empty read would flash a blank page. There's a test pinning this.

## Conventions

- TDD for `lib/` modules: failing test → implementation → green, commit per unit of work.
- Run `pnpm test` and `pnpm exec tsc --noEmit` before committing; run `pnpm e2e` when `entrypoints/` changes.
- Commit messages: conventional prefixes (`feat:`, `fix:`, `test:`, `chore:`, `docs:`), no attribution trailers.
