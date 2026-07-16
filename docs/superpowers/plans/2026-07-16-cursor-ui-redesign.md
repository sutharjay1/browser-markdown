# Cursor-Style UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the whole extension (document, TOC sidebar, toolbar, popup, light+dark) in cursor.com's design language via token-first static theming.

**Architecture:** A new `assets/styles/tokens.css` defines every color as `--mdv-*` custom properties under `:root` (light) and `html[data-mdv-theme='dark']` (dark); all component CSS consumes tokens. `lib/theme.ts` becomes a pure attribute stamp (no style injection). `github-markdown-css` and hljs theme imports are replaced by our own `markdown.css` + `hljs-cursor.css`. Inter + JetBrains Mono are bundled via @fontsource latin subsets.

**Tech Stack:** Existing WXT 0.20 + TypeScript project; @fontsource/inter, @fontsource/jetbrains-mono added; github-markdown-css removed.

## Global Constraints

- **pnpm only** — never npm. `pnpm add` / `pnpm remove` / `pnpm test`.
- Spec (token values, component measurements) is authoritative: `docs/superpowers/specs/2026-07-16-cursor-ui-redesign-design.md`.
- **No `box-shadow` anywhere.** Depth = hairlines + surface contrast.
- Display/headings weight 400 with negative tracking; body Inter 15px; ALL code surfaces JetBrains Mono 13px.
- Cursor Orange (`--mdv-accent`) used scarcely: links, active TOC indicator, toggles-on, checked checkboxes, focus rings. Never as large surfaces.
- **Unbreakable contracts:** `applyTheme(choice)` signature + `data-mdv-theme` ∈ {`light`,`dark`}; toolbar button `title`s exactly `Toggle table of contents` / `Cycle theme (auto → light → dark)` / `Toggle raw markdown`; element ids `#mdv-root #mdv-sidebar #mdv-toolbar #mdv-content #mdv-raw`; `markdown-body` class on the article; `.mdv-toc a[data-level][data-target]`; `data-sidebar-collapsed` attribute; popup form field names = Settings keys; the ONLY `innerHTML` sink stays `renderMarkdown(...)` output (icons are built with `createElementNS`, NOT innerHTML).
- Every task ends with: `pnpm test` green, `pnpm exec tsc --noEmit` clean, `pnpm build` succeeds. Tasks 3 and 5 also run `pnpm e2e`.
- TypeScript strict. Commit after every task; conventional commit prefixes; no attribution trailers.

---

### Task 1: Fonts, design tokens, and static theming (theme.ts rewrite, TDD)

**Files:**
- Create: `assets/styles/tokens.css`
- Modify: `lib/theme.ts` (full rewrite), `tests/theme.test.ts` (full rewrite), `entrypoints/content/index.ts` (imports), `vitest.config.ts` (remove obsolete css.include), `package.json` (deps via pnpm commands)

**Interfaces:**
- Consumes: nothing new.
- Produces: `--mdv-*` custom properties (names below) consumed by Tasks 2–4; `applyTheme(choice: 'auto' | 'light' | 'dark'): void` that ONLY stamps `document.documentElement.dataset.mdvTheme`; fonts `'Inter'` and `'JetBrains Mono'` available via `var(--mdv-font-sans)` / `var(--mdv-font-mono)`.

- [ ] **Step 1: Swap dependencies**

```bash
pnpm add @fontsource/inter @fontsource/jetbrains-mono
pnpm remove github-markdown-css
```

- [ ] **Step 2: Write the failing tests** — replace `tests/theme.test.ts` entirely:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme } from '../lib/theme';

beforeEach(() => {
  delete document.documentElement.dataset.mdvTheme;
  document.getElementById('mdv-theme-css')?.remove();
});

describe('applyTheme (token-first static theming)', () => {
  it('stamps dark on the html element', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.mdvTheme).toBe('dark');
  });

  it('stamps light', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.mdvTheme).toBe('light');
  });

  it('auto resolves to light when matchMedia is unavailable (jsdom)', () => {
    applyTheme('auto');
    expect(document.documentElement.dataset.mdvTheme).toBe('light');
  });

  it('injects no style element — theming is static CSS, attribute flip only', () => {
    applyTheme('dark');
    applyTheme('light');
    expect(document.getElementById('mdv-theme-css')).toBeNull();
  });
});
```

- [ ] **Step 3: Run to verify RED**

Run: `pnpm exec vitest run tests/theme.test.ts`
Expected: FAIL — old implementation imports `github-markdown-css` (now removed) and/or creates `#mdv-theme-css`.

- [ ] **Step 4: Rewrite `lib/theme.ts`** (entire file):

```ts
export type ThemeChoice = 'auto' | 'light' | 'dark';

/**
 * Token-first theming: all colors live in assets/styles/tokens.css under
 * :root (light) and html[data-mdv-theme='dark']. Switching themes is a pure
 * attribute flip — no style injection, nothing for page CSP to block.
 */
export function applyTheme(choice: ThemeChoice): void {
  const prefersDark =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = choice === 'dark' || (choice === 'auto' && prefersDark);
  document.documentElement.dataset.mdvTheme = dark ? 'dark' : 'light';
}
```

- [ ] **Step 5: Run to verify GREEN**

Run: `pnpm exec vitest run tests/theme.test.ts`
Expected: 4 passed.

- [ ] **Step 6: Create `assets/styles/tokens.css`** (exact values from the spec):

```css
:root {
  color-scheme: light;
  --mdv-canvas: #f7f7f4;
  --mdv-canvas-soft: #fafaf7;
  --mdv-surface: #ffffff;
  --mdv-surface-strong: #e6e5e0;
  --mdv-text: #26251e;
  --mdv-text-soft: #5a5852;
  --mdv-muted: #807d72;
  --mdv-muted-soft: #a09c92;
  --mdv-hairline: #e6e5e0;
  --mdv-hairline-soft: #efeee8;
  --mdv-hairline-strong: #cfcdc4;
  --mdv-accent: #f54e00;
  --mdv-accent-active: #d04200;
  --mdv-on-accent: #ffffff;
  --mdv-pill: #ececea;
  --mdv-selection: rgba(245, 78, 0, 0.15);
  --mdv-error: #cf2d56;
  --mdv-error-tint: #fbeef0;
  --mdv-success: #1f8a65;
  --mdv-font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mdv-font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

html[data-mdv-theme='dark'] {
  color-scheme: dark;
  --mdv-canvas: #141310;
  --mdv-canvas-soft: #1c1b17;
  --mdv-surface: #1e1d19;
  --mdv-surface-strong: #34322b;
  --mdv-text: #e8e6df;
  --mdv-text-soft: #b5b2a7;
  --mdv-muted: #8f8c81;
  --mdv-muted-soft: #6b6960;
  --mdv-hairline: #2a2925;
  --mdv-hairline-soft: #23221e;
  --mdv-hairline-strong: #3d3b34;
  --mdv-accent: #ff6a2b;
  --mdv-accent-active: #f54e00;
  --mdv-on-accent: #ffffff;
  --mdv-pill: #26241e;
  --mdv-selection: rgba(255, 106, 43, 0.22);
  --mdv-error: #e5537a;
  --mdv-error-tint: #362026;
  --mdv-success: #34b98a;
}
```

- [ ] **Step 7: Update `entrypoints/content/index.ts` imports** — replace the current CSS import block with (KaTeX import and its comment stay; `viewer.css` stays):

```ts
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@/assets/styles/tokens.css';
import './viewer.css';
// Real stylesheet import (not ?inline): KaTeX CSS references fonts, which must
// resolve against the extension origin via the manifest css list + WAR.
import 'katex/dist/katex.min.css';
```

- [ ] **Step 8: Remove the obsolete `css.include` from `vitest.config.ts`** — the `test.css` block existed only to process `?inline` imports for github-markdown-css/highlight.js, which no longer exist. Resulting `test` block:

```ts
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
```

- [ ] **Step 9: Verify everything**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm build`
Expected: all suites green (theme suite is 4 tests now); tsc clean; both builds succeed. Grep check: `grep -c "Inter" output/chrome-mv3/content-scripts/content.css` ≥ 1 (fonts bundled).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: design tokens, bundled Inter/JetBrains Mono, static attribute-flip theming"
```

---

### Task 2: Document restyle — markdown.css + hljs-cursor.css

**Files:**
- Create: `assets/styles/markdown.css`, `assets/styles/hljs-cursor.css`
- Modify: `entrypoints/content/index.ts` (two imports)

**Interfaces:**
- Consumes: `--mdv-*` tokens (Task 1); `.markdown-body` class on `#mdv-content`; hljs classes emitted by `lib/highlight.ts`; `pre.mermaid`, KaTeX markup, `task-list-item` classes from the renderer.
- Produces: complete document styling; Tasks 3+ assume the article carries NO card/border (sits on canvas).

- [ ] **Step 1: Create `assets/styles/markdown.css`**:

```css
.markdown-body {
  font-family: var(--mdv-font-sans);
  font-size: 15px;
  line-height: 1.65;
  color: var(--mdv-text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.markdown-body ::selection {
  background: var(--mdv-selection);
}

/* Headings — Cursor editorial voice: weight 400, negative tracking */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  font-weight: 400;
  position: relative;
}
.markdown-body h1 {
  font-size: 34px;
  letter-spacing: -0.72px;
  line-height: 1.2;
  margin: 0 0 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--mdv-hairline);
}
.markdown-body h2 {
  font-size: 26px;
  letter-spacing: -0.4px;
  line-height: 1.25;
  margin: 40px 0 16px;
}
.markdown-body h3 {
  font-size: 20px;
  letter-spacing: -0.2px;
  line-height: 1.3;
  margin: 32px 0 12px;
}
.markdown-body h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 28px 0 10px;
}
.markdown-body h5 {
  font-size: 14px;
  font-weight: 600;
  margin: 24px 0 8px;
}
.markdown-body h6 {
  font-size: 13px;
  font-weight: 600;
  color: var(--mdv-muted);
  margin: 24px 0 8px;
}
.markdown-body h1[id]:hover::before,
.markdown-body h2[id]:hover::before,
.markdown-body h3[id]:hover::before {
  content: '#';
  position: absolute;
  left: -22px;
  color: var(--mdv-accent);
  font-weight: 400;
}

/* Body text */
.markdown-body p {
  margin: 0 0 16px;
}
.markdown-body a {
  color: var(--mdv-accent);
  text-decoration: none;
}
.markdown-body a:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.markdown-body strong {
  font-weight: 600;
}
.markdown-body ul,
.markdown-body ol {
  margin: 0 0 16px;
  padding-left: 24px;
}
.markdown-body li {
  margin: 4px 0;
}
.markdown-body li::marker {
  color: var(--mdv-muted);
}

/* Code — JetBrains Mono everywhere */
.markdown-body code,
.markdown-body pre,
.markdown-body kbd {
  font-family: var(--mdv-font-mono);
}
.markdown-body code {
  font-size: 13px;
  background: var(--mdv-hairline-soft);
  border: 1px solid var(--mdv-hairline);
  border-radius: 4px;
  padding: 1px 5px;
}
.markdown-body pre {
  background: var(--mdv-canvas-soft);
  border: 1px solid var(--mdv-hairline);
  border-radius: 12px;
  padding: 20px;
  overflow-x: auto;
  margin: 0 0 20px;
  line-height: 1.5;
}
.markdown-body pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
}
.markdown-body pre.mermaid {
  text-align: center;
}

/* Tables — hairline-only */
.markdown-body table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--mdv-hairline);
  border-radius: 8px;
  margin: 0 0 20px;
  overflow: hidden;
}
.markdown-body th {
  background: var(--mdv-canvas-soft);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.88px;
  color: var(--mdv-muted);
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--mdv-hairline);
}
.markdown-body td {
  font-size: 14px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--mdv-hairline-soft);
}
.markdown-body tr:last-child td {
  border-bottom: none;
}

/* Blockquote */
.markdown-body blockquote {
  margin: 0 0 16px;
  padding: 2px 0 2px 16px;
  border-left: 2px solid var(--mdv-hairline-strong);
  color: var(--mdv-text-soft);
}

/* Task lists — orange-accented checkboxes */
.markdown-body .task-list-item {
  list-style: none;
}
.markdown-body input[type='checkbox'] {
  appearance: none;
  width: 15px;
  height: 15px;
  border: 1px solid var(--mdv-hairline-strong);
  border-radius: 4px;
  background: var(--mdv-surface);
  vertical-align: -2px;
  margin-right: 6px;
  position: relative;
}
.markdown-body input[type='checkbox']:checked {
  background: var(--mdv-accent);
  border-color: var(--mdv-accent);
}
.markdown-body input[type='checkbox']:checked::after {
  content: '';
  position: absolute;
  left: 4.5px;
  top: 1.5px;
  width: 3px;
  height: 7px;
  border: solid var(--mdv-on-accent);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

/* Media, rules, footnotes, definition lists, math */
.markdown-body img {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--mdv-hairline-soft);
}
.markdown-body hr {
  border: 0;
  border-top: 1px solid var(--mdv-hairline);
  margin: 32px 0;
}
.markdown-body .footnotes {
  font-size: 13px;
  color: var(--mdv-muted);
  border-top: 1px solid var(--mdv-hairline);
  margin-top: 32px;
  padding-top: 16px;
}
.markdown-body .footnotes p {
  margin-bottom: 8px;
}
.markdown-body dt {
  font-weight: 600;
  margin-top: 12px;
}
.markdown-body dd {
  margin: 4px 0 12px 16px;
  color: var(--mdv-text-soft);
}
.markdown-body .katex-display {
  margin: 20px 0;
  overflow-x: auto;
}
```

- [ ] **Step 2: Create `assets/styles/hljs-cursor.css`** (light values, then dark overrides — exact hexes from the spec table):

```css
.hljs {
  color: var(--mdv-text);
  background: transparent;
}
.hljs-comment,
.hljs-quote {
  color: #8d8a7e;
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-meta {
  color: #b3372f;
}
.hljs-string,
.hljs-addition,
.hljs-regexp {
  color: #1f7a5c;
}
.hljs-number,
.hljs-literal,
.hljs-deletion,
.hljs-symbol {
  color: #9a5b00;
}
.hljs-title,
.hljs-title.function_,
.hljs-function,
.hljs-section,
.hljs-name {
  color: #6f42c1;
}
.hljs-attr,
.hljs-attribute,
.hljs-variable,
.hljs-template-variable,
.hljs-params {
  color: #2f6db5;
}
.hljs-type,
.hljs-class,
.hljs-title.class_,
.hljs-built_in {
  color: #b45309;
}
.hljs-emphasis {
  font-style: italic;
}
.hljs-strong {
  font-weight: 600;
}

html[data-mdv-theme='dark'] .hljs-comment,
html[data-mdv-theme='dark'] .hljs-quote {
  color: #85826f;
}
html[data-mdv-theme='dark'] .hljs-keyword,
html[data-mdv-theme='dark'] .hljs-selector-tag,
html[data-mdv-theme='dark'] .hljs-meta {
  color: #f57058;
}
html[data-mdv-theme='dark'] .hljs-string,
html[data-mdv-theme='dark'] .hljs-addition,
html[data-mdv-theme='dark'] .hljs-regexp {
  color: #56d4a0;
}
html[data-mdv-theme='dark'] .hljs-number,
html[data-mdv-theme='dark'] .hljs-literal,
html[data-mdv-theme='dark'] .hljs-deletion,
html[data-mdv-theme='dark'] .hljs-symbol {
  color: #e0a45c;
}
html[data-mdv-theme='dark'] .hljs-title,
html[data-mdv-theme='dark'] .hljs-title.function_,
html[data-mdv-theme='dark'] .hljs-function,
html[data-mdv-theme='dark'] .hljs-section,
html[data-mdv-theme='dark'] .hljs-name {
  color: #b99df5;
}
html[data-mdv-theme='dark'] .hljs-attr,
html[data-mdv-theme='dark'] .hljs-attribute,
html[data-mdv-theme='dark'] .hljs-variable,
html[data-mdv-theme='dark'] .hljs-template-variable,
html[data-mdv-theme='dark'] .hljs-params {
  color: #7fb3e8;
}
html[data-mdv-theme='dark'] .hljs-type,
html[data-mdv-theme='dark'] .hljs-class,
html[data-mdv-theme='dark'] .hljs-title.class_,
html[data-mdv-theme='dark'] .hljs-built_in {
  color: #e0a45c;
}
```

- [ ] **Step 3: Import both in `entrypoints/content/index.ts`** after the tokens import:

```ts
import '@/assets/styles/markdown.css';
import '@/assets/styles/hljs-cursor.css';
```

- [ ] **Step 4: Verify**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm build`
Expected: green / clean / builds.

- [ ] **Step 5: Commit**

```bash
git add assets/styles/markdown.css assets/styles/hljs-cursor.css entrypoints/content/index.ts
git commit -m "feat: cursor editorial document styling with token-mapped syntax palette"
```

---

### Task 3: Chrome — sidebar, toolbar, viewer.css rewrite + viewer.ts changes

**Files:**
- Modify: `entrypoints/content/viewer.ts`, `entrypoints/content/viewer.css` (full rewrite)

**Interfaces:**
- Consumes: tokens (Task 1); `renderTocList`/`collectHeadings`/`initScrollSpy` from `lib/toc.ts` (unchanged).
- Produces: `ViewerShell` gains `sidebarTitle: HTMLElement` and `tocHost: HTMLElement`; TOC renders into `#mdv-toc-host` (header preserved across re-renders). Toolbar buttons keep exact `title` attributes (E2E contract); each gains an icon + visible label.

- [ ] **Step 1: Update `ViewerShell` and `buildShell` in `viewer.ts`**:

```ts
export interface ViewerShell {
  root: HTMLElement;
  sidebar: HTMLElement;
  sidebarTitle: HTMLElement;
  tocHost: HTMLElement;
  toolbar: HTMLElement;
  article: HTMLElement;
  rawPre: HTMLPreElement;
}
```

```ts
function buildShell(rawText: string): ViewerShell {
  const root = document.createElement('div');
  root.id = 'mdv-root';
  const sidebar = document.createElement('aside');
  sidebar.id = 'mdv-sidebar';
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'mdv-sidebar-header';
  const caption = document.createElement('div');
  caption.className = 'mdv-sidebar-caption';
  caption.textContent = 'On this page';
  const sidebarTitle = document.createElement('div');
  sidebarTitle.className = 'mdv-sidebar-title';
  sidebarHeader.append(caption, sidebarTitle);
  const tocHost = document.createElement('div');
  tocHost.id = 'mdv-toc-host';
  sidebar.append(sidebarHeader, tocHost);
  const toolbar = document.createElement('div');
  toolbar.id = 'mdv-toolbar';
  const article = document.createElement('main');
  article.id = 'mdv-content';
  article.classList.add('markdown-body');
  const rawPre = document.createElement('pre');
  rawPre.id = 'mdv-raw';
  rawPre.textContent = rawText;
  rawPre.hidden = true;
  root.append(sidebar, toolbar, article, rawPre);
  return { root, sidebar, sidebarTitle, tocHost, toolbar, article, rawPre };
}
```

- [ ] **Step 2: Update the TOC block inside `updateContent`** — replace the three `sidebar`-based lines with `tocHost`, and sync the sidebar title (after `document.title` is computed):

```ts
  shell.sidebarTitle.textContent = document.title;
```

```ts
  disconnectScrollSpy?.();
  shell.tocHost.replaceChildren(renderTocList(collectHeadings(shell.article)));
  disconnectScrollSpy = initScrollSpy(shell.article, shell.tocHost);
```

- [ ] **Step 3: Start collapsed on narrow windows** — in `initViewer`, right after `document.body.replaceChildren(shell.root);`:

```ts
  if (window.innerWidth < 960) shell.root.setAttribute('data-sidebar-collapsed', '');
```

- [ ] **Step 4: Icons + labeled buttons** — add above `wireToolbar`, and rewrite `wireToolbar`/`makeButton`. Icons are static-attribute SVGs built with `createElementNS` (never innerHTML — sanitization-boundary rule):

```ts
const SVG_NS = 'http://www.w3.org/2000/svg';

type IconPart = Record<string, string>;

function makeIcon(parts: IconPart[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const part of parts) {
    const { tag = 'path', ...attrs } = part;
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    svg.appendChild(el);
  }
  return svg;
}

const iconPanelLeft = (): SVGSVGElement =>
  makeIcon([
    { tag: 'rect', x: '1.5', y: '2.5', width: '13', height: '11', rx: '2' },
    { tag: 'line', x1: '6', y1: '2.5', x2: '6', y2: '13.5' },
  ]);

const iconTheme = (): SVGSVGElement =>
  makeIcon([
    { tag: 'circle', cx: '8', cy: '8', r: '6.25' },
    { d: 'M8 1.75a6.25 6.25 0 0 1 0 12.5z', fill: 'currentColor', stroke: 'none' },
  ]);

const iconRaw = (): SVGSVGElement =>
  makeIcon([{ d: 'M6 4 2.5 8 6 12' }, { d: 'M10 4 13.5 8 10 12' }]);
```

```ts
function wireToolbar(shell: ViewerShell, settings: Settings): void {
  const tocBtn = makeButton('Contents', 'Toggle table of contents', iconPanelLeft());
  tocBtn.addEventListener('click', () => {
    shell.root.toggleAttribute('data-sidebar-collapsed');
  });

  const themeBtn = makeButton('Theme', 'Cycle theme (auto → light → dark)', iconTheme());
  themeBtn.addEventListener('click', () => {
    const order: Settings['theme'][] = ['auto', 'light', 'dark'];
    settings.theme = order[(order.indexOf(settings.theme) + 1) % order.length];
    applyTheme(settings.theme);
    void saveSettings(settings);
  });

  const rawBtn = makeButton('Raw', 'Toggle raw markdown', iconRaw());
  rawBtn.addEventListener('click', () => {
    const showRaw = shell.rawPre.hidden;
    shell.rawPre.hidden = !showRaw;
    shell.article.hidden = showRaw;
    shell.sidebar.hidden = showRaw;
    rawBtn.classList.toggle('is-active', showRaw);
  });

  shell.toolbar.append(tocBtn, themeBtn, rawBtn);
}

function makeButton(label: string, title: string, icon: SVGSVGElement): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.title = title;
  b.className = 'mdv-btn';
  const text = document.createElement('span');
  text.className = 'mdv-btn-label';
  text.textContent = label;
  b.append(icon, text);
  return b;
}
```

- [ ] **Step 5: Rewrite `entrypoints/content/viewer.css`** entirely:

```css
body {
  margin: 0;
  background: var(--mdv-canvas);
}
#mdv-root {
  display: flex;
  min-height: 100vh;
  background: var(--mdv-canvas);
  font-family: var(--mdv-font-sans);
}

/* Sidebar — quiet, hairline-divided, part of the page */
#mdv-sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  width: 248px;
  max-height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 20px 12px;
  border-right: 1px solid var(--mdv-hairline);
}
#mdv-root[data-sidebar-collapsed] #mdv-sidebar {
  width: 0;
  padding-left: 0;
  padding-right: 0;
  opacity: 0;
  border-right-width: 0;
  overflow: hidden;
}
.mdv-sidebar-header {
  padding: 0 8px 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--mdv-hairline-soft);
}
.mdv-sidebar-caption {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.88px;
  text-transform: uppercase;
  color: var(--mdv-muted);
  margin-bottom: 6px;
  white-space: nowrap;
}
.mdv-sidebar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--mdv-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* TOC entries — Cursor app row treatment */
.mdv-toc a {
  position: relative;
  display: block;
  box-sizing: border-box;
  min-height: 28px;
  padding: 5px 8px 5px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--mdv-muted);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mdv-toc a:hover {
  background: var(--mdv-pill);
  color: var(--mdv-text);
}
.mdv-toc a.active {
  background: var(--mdv-pill);
  color: var(--mdv-text);
  font-weight: 500;
}
.mdv-toc a.active::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 14px;
  border-radius: 2px;
  background: var(--mdv-accent);
}
.mdv-toc a[data-level='2'] {
  padding-left: 24px;
}
.mdv-toc a[data-level='3'] {
  padding-left: 36px;
}
.mdv-toc a[data-level='4'],
.mdv-toc a[data-level='5'],
.mdv-toc a[data-level='6'] {
  padding-left: 48px;
}

/* Article on canvas — editorial, no card */
#mdv-content {
  flex: 1;
  min-width: 0;
  max-width: 780px;
  margin: 0 auto;
  padding: 56px 48px 96px;
  box-sizing: border-box;
}

/* Toolbar — compact Cursor buttons */
#mdv-toolbar {
  position: fixed;
  top: 12px;
  right: 16px;
  display: flex;
  gap: 6px;
  z-index: 10;
}
.mdv-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  background: var(--mdv-surface);
  border: 1px solid var(--mdv-hairline);
  border-radius: 6px;
  color: var(--mdv-text-soft);
  font-family: var(--mdv-font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.mdv-btn:hover {
  background: var(--mdv-canvas-soft);
  color: var(--mdv-text);
}
.mdv-btn:active,
.mdv-btn.is-active {
  background: var(--mdv-pill);
  color: var(--mdv-text);
  border-color: var(--mdv-hairline-strong);
}
.mdv-btn:focus-visible {
  outline: 2px solid var(--mdv-accent);
  outline-offset: 1px;
}

/* Notice (render failure) */
.mdv-notice {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  background: var(--mdv-error-tint);
  border: 1px solid var(--mdv-error);
  border-radius: 6px;
  color: var(--mdv-error);
  font-size: 12px;
  font-weight: 500;
}

/* Raw view */
#mdv-raw {
  flex: 1;
  padding: 56px 48px;
  font-family: var(--mdv-font-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--mdv-text-soft);
}

/* Motion — hover fills, pills, sidebar collapse */
@media (prefers-reduced-motion: no-preference) {
  .mdv-btn,
  .mdv-toc a {
    transition: background-color 150ms ease-out, color 150ms ease-out;
  }
  #mdv-sidebar {
    transition: width 180ms ease-out, opacity 180ms ease-out, padding 180ms ease-out;
  }
  #mdv-root,
  #mdv-content,
  body {
    transition: background-color 120ms ease-out, color 120ms ease-out;
  }
}

/* Responsive */
@media (max-width: 720px) {
  .mdv-btn-label {
    display: none;
  }
  #mdv-content {
    padding: 48px 20px 80px;
  }
}
@media print {
  #mdv-sidebar,
  #mdv-toolbar {
    display: none;
  }
}
```

- [ ] **Step 6: Verify (including E2E — viewer changed)**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm build && pnpm e2e`
Expected: unit green, tsc clean, builds, E2E 3/3 (titles/ids/`data-mdv-theme` contracts intact).

- [ ] **Step 7: Commit**

```bash
git add entrypoints/content/viewer.ts entrypoints/content/viewer.css
git commit -m "feat: cursor-style sidebar with header and active pill, labeled icon toolbar"
```

---

### Task 4: Popup restyle

**Files:**
- Modify: `entrypoints/popup/index.html`, `entrypoints/popup/style.css` (full rewrite)
- Unchanged: `entrypoints/popup/main.ts` (binding logic keys off input `name`s — do not touch)

**Interfaces:**
- Consumes: tokens + fonts. `main.ts` already runs as a Vite module, so the token/font CSS imports go at the top of `main.ts` (imports only — the binding logic below them is untouched); `style.css` stays a plain `<link>` stylesheet.
- Produces: same form contract (`#settings-form`, field names = Settings keys).

- [ ] **Step 1: Add style imports at the top of `entrypoints/popup/main.ts`** (imports only — no logic changes):

```ts
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@/assets/styles/tokens.css';
```

- [ ] **Step 2: Replace `entrypoints/popup/index.html` body markup** (same field names, new structure; `<link rel="stylesheet" href="./style.css">` stays in head):

```html
  <body>
    <form id="settings-form">
      <header class="popup-header">
        <div>
          <h1>Markdown Viewer</h1>
          <p class="version">Cursor-style markdown rendering</p>
        </div>
        <input type="checkbox" name="enabled" class="switch" title="Enable Markdown Viewer" />
      </header>
      <section class="group">
        <label class="row"><span>Theme</span>
          <select name="theme">
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>
      <section class="group">
        <div class="group-caption">Rendering</div>
        <label class="row"><span>Mermaid diagrams</span><input type="checkbox" name="enableMermaid" class="switch" /></label>
        <label class="row"><span>Math (KaTeX)</span><input type="checkbox" name="enableKatex" class="switch" /></label>
        <label class="row"><span>Emoji shortcodes</span><input type="checkbox" name="enableEmoji" class="switch" /></label>
      </section>
      <section class="group">
        <div class="group-caption">Auto-reload</div>
        <label class="row"><span>Local files</span><input type="checkbox" name="autoReload" class="switch" /></label>
        <label class="row"><span>Remote URLs</span><input type="checkbox" name="autoReloadRemote" class="switch" /></label>
        <label class="row"><span>Interval (ms)</span><input type="number" name="autoReloadIntervalMs" min="500" step="250" /></label>
      </section>
      <p class="hint">Theme applies live; other changes apply on next page load.</p>
    </form>
    <script type="module" src="./main.ts"></script>
  </body>
```

- [ ] **Step 3: Rewrite `entrypoints/popup/style.css`**:

```css
body {
  width: 320px;
  margin: 0;
  background: var(--mdv-canvas);
  color: var(--mdv-text);
  font-family: var(--mdv-font-sans);
  font-size: 13px;
}
#settings-form {
  padding: 0 16px 12px;
}
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0 12px;
  border-bottom: 1px solid var(--mdv-hairline);
}
.popup-header h1 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.1px;
}
.version {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--mdv-muted);
}
.group {
  padding: 8px 0;
  border-bottom: 1px solid var(--mdv-hairline-soft);
}
.group:last-of-type {
  border-bottom: none;
}
.group-caption {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.88px;
  text-transform: uppercase;
  color: var(--mdv-muted);
  padding: 6px 0 2px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 36px;
}
.row span {
  color: var(--mdv-text-soft);
}

/* Toggle switches — orange when on */
input.switch {
  appearance: none;
  width: 34px;
  height: 18px;
  border-radius: 9999px;
  background: var(--mdv-surface-strong);
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
}
input.switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--mdv-surface);
}
input.switch:checked {
  background: var(--mdv-accent);
}
input.switch:checked::after {
  left: 18px;
  background: var(--mdv-on-accent);
}
input.switch:focus-visible {
  outline: 2px solid var(--mdv-accent);
  outline-offset: 1px;
}
@media (prefers-reduced-motion: no-preference) {
  input.switch,
  input.switch::after {
    transition: background-color 120ms ease-out, left 120ms ease-out;
  }
}

/* Select + number input */
select,
input[type='number'] {
  height: 28px;
  box-sizing: border-box;
  background: var(--mdv-surface);
  color: var(--mdv-text);
  border: 1px solid var(--mdv-hairline);
  border-radius: 6px;
  font-family: var(--mdv-font-sans);
  font-size: 13px;
  padding: 0 8px;
}
input[type='number'] {
  width: 84px;
}
select:focus-visible,
input[type='number']:focus-visible {
  outline: 2px solid var(--mdv-accent);
  outline-offset: 1px;
}

.hint {
  color: var(--mdv-muted);
  font-size: 11px;
  margin: 10px 0 0;
}
```

- [ ] **Step 4: Verify**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm build`
Expected: green / clean / builds; `output/chrome-mv3/manifest.json` still has `action.default_popup`.

- [ ] **Step 5: Commit**

```bash
git add entrypoints/popup
git commit -m "feat: cursor-style settings popup with toggle switches"
```

---

### Task 5: Screenshots, docs, full verification

**Files:**
- Create: `scripts/screenshots.mjs`
- Modify: `AGENTS.md` (update stale gotchas/architecture lines)

**Interfaces:**
- Consumes: built extension at `output/chrome-mv3`; fixture `tests/fixtures/kitchen-sink.md`.
- Produces: `output/screenshots/light.png` + `dark.png` (git-ignored via existing `output/` rule) for the human to review.

- [ ] **Step 1: Create `scripts/screenshots.mjs`**:

```js
import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const EXT_PATH = path.resolve('output/chrome-mv3');
const PORT = 8124;
const OUT_DIR = path.resolve('output/screenshots');

const server = http
  .createServer((req, res) => {
    const file = path.join('tests/fixtures', path.basename(req.url ?? ''));
    if (!fs.existsSync(file)) {
      res.statusCode = 404;
      return res.end('not found');
    }
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(fs.readFileSync(file));
  })
  .listen(PORT);

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const scheme of ['light', 'dark']) {
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    colorScheme: scheme,
    viewport: { width: 1440, height: 1200 },
    args: [`--disable-extensions-except=${EXT_PATH}`, `--load-extension=${EXT_PATH}`],
  });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/kitchen-sink.md`);
  await page.waitForSelector('#mdv-content h1');
  await page.waitForTimeout(1500); // mermaid + idle highlighting
  await page.screenshot({ path: path.join(OUT_DIR, `${scheme}.png`), fullPage: true });
  await ctx.close();
}

server.close();
console.log(`wrote ${OUT_DIR}/light.png and dark.png`);
```

- [ ] **Step 2: Generate screenshots**

Run: `pnpm build && node scripts/screenshots.mjs`
Expected: `output/screenshots/light.png` and `dark.png` exist and show the Cursor-styled page (cream canvas light / warm dark).

- [ ] **Step 3: Update `AGENTS.md`** — three edits:
  1. In Architecture, replace the `theme.ts` line with: `theme.ts       stamps html[data-mdv-theme]; all colors are --mdv-* tokens in assets/styles/tokens.css (static, no injection)`.
  2. In Gotchas, DELETE the two bullets about `?inline` CSS in tests and "KaTeX CSS vs theme CSS paths"; ADD: `- **Theming is static tokens.** assets/styles/tokens.css defines light (:root) and dark (html[data-mdv-theme='dark']) palettes; theme.ts only flips the attribute. Never re-introduce runtime <style> injection or github-markdown-css.` and `- **Fonts are bundled** (@fontsource Inter latin 400/500/600 + JetBrains Mono latin 400), imported in the content entry and popup main.ts; they inline into the built CSS.`
  3. In the Architecture tree, add `assets/styles/  tokens.css + markdown.css + hljs-cursor.css (design system)` after the `lib/` block.

- [ ] **Step 4: Full verification**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm build && pnpm e2e && pnpm lint:firefox`
Expected: unit green, tsc clean, builds, E2E 3/3, lint 0 errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/screenshots.mjs AGENTS.md
git commit -m "chore: screenshot script and agent-guide updates for token theming"
```

---

## Post-plan checklist (for the executor)

- Spec coverage: tokens/fonts/theme.ts (1), document + syntax palette (2), sidebar/toolbar/notice/raw/motion/responsive (3), popup (4), screenshots/docs/verification (5). Dependency removal in 1; vitest cleanup in 1.
- Contracts preserved everywhere: `applyTheme`, button titles, ids, `markdown-body`, `.mdv-toc a[data-*]`, `data-sidebar-collapsed`, popup names, innerHTML rule (icons via `createElementNS`).
- The controller sends `output/screenshots/{light,dark}.png` to the user after Task 5.
