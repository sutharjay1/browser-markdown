# Cursor-Style UI Redesign — Design

**Date:** 2026-07-16
**Status:** Approved
**Sources:** `DESIGN.md` (cursor.com token analysis, attached by user), Mobbin screens of the Cursor web app (light + dark dashboards), user feedback ("UI is cramped; sidebar and buttons not good; want cursor.com theme light+dark, more colour").

## Goal

Restyle the entire extension UI — rendered document, TOC sidebar, toolbar, settings popup, light + dark themes — in cursor.com's design language: warm cream/warm-dark canvas, weight-400 editorial headings with negative tracking, Cursor Orange used scarcely, hairline-only depth (no shadows), JetBrains Mono on all code, quiet Cursor-app sidebar/button patterns.

## Architecture decision: token-first static theming

All colors/spacing/radii live as `--mdv-*` CSS custom properties in a new `entrypoints/content/tokens.css`, defined twice: `:root` (light) and `html[data-mdv-theme='dark']` (dark). Every component stylesheet consumes tokens. Theme switching is a pure attribute flip.

Consequences:
- `lib/theme.ts` shrinks to: resolve `auto|light|dark` (via `prefers-color-scheme`) → stamp `document.documentElement.dataset.mdvTheme`. **No more `<style>` injection.** Public API unchanged (`applyTheme(choice)`), so `viewer.ts` callers don't change.
- `github-markdown-css` dependency **removed**; hljs theme CSS imports removed (replaced by our own token-mapped syntax palette).
- `vitest.config.ts` `test.css.include` becomes obsolete and is removed.
- Robustness win: no runtime style injection left for page CSP to interfere with.

Rejected alternative: keeping the `?inline` injection swap with new CSS strings — retains two theming mechanisms and a dead dependency for no benefit.

## Fonts (user decision: bundle)

- **Inter** (static latin subsets, weights 400/500/600) via `@fontsource/inter/latin-{400,500,600}.css` — substitute for licensed CursorGothic, with negative tracking on display sizes.
- **JetBrains Mono** (latin 400) via `@fontsource/jetbrains-mono/latin-400.css` — every code surface.
- Imported in the content script entry so Vite bundles them into the content CSS (fonts inline as base64, same as KaTeX fonts today — no WAR/CSP concerns). Popup imports the same.
- Fallback stacks: `'Inter', system-ui, -apple-system, sans-serif` and `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`.

## Token palette (exact values)

| Token | Light | Dark |
|---|---|---|
| `--mdv-canvas` | `#f7f7f4` | `#141310` |
| `--mdv-canvas-soft` | `#fafaf7` | `#1c1b17` |
| `--mdv-surface` | `#ffffff` | `#1e1d19` |
| `--mdv-surface-strong` | `#e6e5e0` | `#34322b` |
| `--mdv-text` | `#26251e` | `#e8e6df` |
| `--mdv-text-soft` | `#5a5852` | `#b5b2a7` |
| `--mdv-muted` | `#807d72` | `#8f8c81` |
| `--mdv-muted-soft` | `#a09c92` | `#6b6960` |
| `--mdv-hairline` | `#e6e5e0` | `#2a2925` |
| `--mdv-hairline-soft` | `#efeee8` | `#23221e` |
| `--mdv-hairline-strong` | `#cfcdc4` | `#3d3b34` |
| `--mdv-accent` | `#f54e00` | `#ff6a2b` |
| `--mdv-accent-active` | `#d04200` | `#f54e00` |
| `--mdv-on-accent` | `#ffffff` | `#ffffff` |
| `--mdv-pill` | `#ececea` | `#26241e` |
| `--mdv-selection` | `rgba(245,78,0,0.15)` | `rgba(255,106,43,0.22)` |
| `--mdv-error` | `#cf2d56` | `#e5537a` |
| `--mdv-error-tint` | `#fbeef0` | `#362026` |
| `--mdv-success` | `#1f8a65` | `#34b98a` |

Radii: 4 / 6 / 8 / 12 px (tags / rows+buttons / inputs+CTAs / cards+code panes), pill 9999px. Spacing on a 4px base. `color-scheme` set per theme. No `box-shadow` anywhere.

## Document styling (`entrypoints/content/markdown.css`, replaces github-markdown-css)

Article on canvas directly (no card), max-width 780px, centered, padding 56px 48px 96px. Body: Inter 15px/1.65 `--mdv-text`.

- **Headings:** weight 400, negative tracking, `--mdv-text`. h1 34px/-0.72px + hairline underline (padding-bottom 12px); h2 26px/-0.4px; h3 20px/-0.2px; h4–h6 weight 600 at 16/14/13px. Heading top margins generous (h2: 40px top / 16px bottom). Hover reveals an orange `#` anchor via `a.header-anchor`-free approach: headings are wrapped targets; we style `h1:hover .mdv-anchor` — anchor injected by markdown-it-anchor `permalink` OFF today, so instead: headings get `position:relative` and CSS-only `:hover::before` showing `#` in `--mdv-accent` in the left margin. No JS change.
- **Links:** `--mdv-accent`, no underline; hover: underline (1px, 2px offset). Visited same.
- **Code blocks:** `pre` on `--mdv-canvas-soft`, 1px `--mdv-hairline`, radius 12px, padding 20px, JetBrains Mono 13px/1.5, `overflow-x auto`. **Inline code:** JetBrains Mono 13px, `--mdv-hairline-soft` background chip, 1px `--mdv-hairline`, radius 4px, padding 1px 5px.
- **Tables:** full-width auto, 1px `--mdv-hairline` outer border, radius 8px (via wrapper-free `border-collapse: separate; border-spacing: 0` + per-corner radii), header cells on `--mdv-canvas-soft` in 11px/600 uppercase tracked `--mdv-muted`, body cells 14px with hairline row separators, cell padding 8px 12px.
- **Blockquote:** 2px `--mdv-hairline-strong` left border, padding-left 16px, `--mdv-text-soft`.
- **Task lists:** custom checkboxes (appearance:none, 15px, radius 4px, hairline border; checked = `--mdv-accent` fill + white ✓).
- **Images:** max-width 100%, radius 8px, 1px `--mdv-hairline-soft`.
- **hr:** 1px `--mdv-hairline`. **`::selection`:** `--mdv-selection`. **KaTeX:** inherits text color (keep katex.min.css). **Footnotes:** 13px `--mdv-muted`, hairline top rule.
- **Syntax palette** (`hljs-cursor.css`, token-scoped for both themes):

| hljs class group | Light | Dark |
|---|---|---|
| comment, quote | `#8d8a7e` | `#85826f` |
| keyword, selector-tag | `#b3372f` | `#f57058` |
| string, addition | `#1f7a5c` | `#56d4a0` |
| number, literal, deletion | `#9a5b00` | `#e0a45c` |
| title, function, section | `#6f42c1` | `#b99df5` |
| attr, attribute, variable, template-variable | `#2f6db5` | `#7fb3e8` |
| type, class-name, built_in | `#b45309` | `#e0a45c` |
| default text | `--mdv-text` | `--mdv-text` |

## Chrome: sidebar + toolbar (`viewer.css` rewrite + small `viewer.ts` changes)

- **Sidebar:** 248px, `--mdv-canvas` bg, 1px `--mdv-hairline` right divider, sticky full-height, padding 20px 12px. Header block (new in `buildShell`): `ON THIS PAGE` caption (11px/600, letter-spacing 0.88px, uppercase, `--mdv-muted`) above the document title (13px/600 `--mdv-text`, 2-line clamp). Below, the TOC nav in a dedicated `#mdv-toc-host` container — `updateContent` re-renders **only** the host, preserving the header (fixes today's header-wipe-on-reload behavior of `sidebar.replaceChildren`).
- **TOC entries:** 13px, min-height 28px, padding 4px 8px, radius 6px, `--mdv-muted` text. Hover: `--mdv-pill` bg + `--mdv-text`. Active: `--mdv-pill` bg, `--mdv-text` at 500, and a 2px × 14px `--mdv-accent` rounded left indicator (::before). Indent per level (12px steps) with a 1px `--mdv-hairline-soft` indent guide on nested groups.
- **Toolbar:** top-right, gap 6px. Buttons: 28px height, padding 0 10px, `--mdv-surface` bg, 1px `--mdv-hairline` border, radius 6px, 13px/500 `--mdv-text-soft` label + 14px inline-SVG stroke icon (`currentColor`): panel-left (Contents), sun/moon (Theme), braces (Raw). Hover: `--mdv-canvas-soft` bg, `--mdv-text`. Pressed/raw-active: `--mdv-pill` bg. **Button `title` attributes stay exactly as today** (`Toggle table of contents`, `Cycle theme (auto → light → dark)`, `Toggle raw markdown`) — E2E locates by them; visible labels are new.
- **Notice** (render-failure): pill on `--mdv-error-tint`, text `--mdv-error`, 12px/500, radius 6px, hairline border in error color at 25% via color-mix or pre-mixed hex.
- **Responsive:** below 960px the sidebar starts collapsed (one `window.innerWidth` check in `initViewer` sets `data-sidebar-collapsed`); toolbar labels hide below 720px (icon-only, titles still present).
- **Raw view:** JetBrains Mono 13px on canvas, `--mdv-text-soft`.
- **Motion:** 150–180ms ease-out transitions on hover fills/pills; sidebar collapse animates width+opacity 180ms; theme flip transitions background/color 120ms on root containers only. All wrapped in `@media (prefers-reduced-motion: no-preference)`.

## Popup restyle (`popup/style.css` rewrite + minor `index.html` markup)

320px wide, `--mdv-canvas` bg, same fonts/tokens. Header row: `Markdown Viewer` (14px/600) + version caption (11px `--mdv-muted`) left, master **Enabled** toggle right, hairline bottom border. Sections separated by hairlines; each setting = 36px row (13px `--mdv-text-soft` label left, control right). Checkboxes become CSS toggle switches on the existing `<input type="checkbox">` elements (appearance:none; track 34×18px radius pill, `--mdv-surface-strong` off / `--mdv-accent` on; 14px knob, 120ms transition). Theme select + number input: 28px, `--mdv-surface` bg, hairline border, radius 6px, 13px. Form field **names unchanged** (Settings-key contract); `main.ts` binding logic unchanged (only markup grouping/classes may change).

## Contracts that must NOT break

- `applyTheme(choice)` signature + `data-mdv-theme` stamp values (`light`/`dark`).
- Toolbar button `title` attributes (E2E), `#mdv-content`/`#mdv-sidebar`/`#mdv-root`/`#mdv-raw` ids, `markdown-body` class stays on the article (renderer/tests reference it? — no; keep for continuity anyway), `.mdv-toc a[data-level][data-target]` shape, `data-sidebar-collapsed` attribute.
- Popup form field names = Settings keys.
- Sanitization boundary untouched (`renderer.ts` not part of this work except nothing changes).

## Testing

- `tests/theme.test.ts` rewritten for the new contract: stamps attribute; light/dark/auto (jsdom → light); asserts **no** `#mdv-theme-css` style element is created.
- All other unit suites unchanged and must stay green (46 → same count minus/plus theme test deltas).
- E2E must pass unchanged (it asserts rendered h1, TOC links, `code.hljs`, `data-mdv-theme` cycling).
- Visual acceptance: kitchen-sink fixture reviewed in both themes; Playwright captures light+dark screenshots to `output/screenshots/` (not committed) for the user to inspect.

## Out of scope

- Mermaid diagram re-theming on toggle (unchanged v1 behavior).
- Popup live-preview of theme beyond current `watchSettings` behavior.
- Icon set beyond the three toolbar glyphs.
