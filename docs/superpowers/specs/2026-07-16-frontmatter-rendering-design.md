# YAML Frontmatter Rendering — Design

**Date:** 2026-07-16 · **Status:** Approved · **Branch:** feature/cursor-ui-redesign

## Problem

Documents starting with a YAML `---` frontmatter block (e.g. VoltAgent/awesome-design-md DESIGN.md files) render as paragraph soup: markdown-it treats the delimiters as `<hr>`/text and the YAML as body prose. GitHub renders frontmatter as a metadata table; we should too.

## Design

- **Dependency:** `js-yaml` (+ `@types/js-yaml`). `load` in v4 is safe (no code execution); bundled locally.
- **`lib/frontmatter.ts`** (pure, no browser APIs):
  - `splitFrontmatter(source): { data: unknown; parsed: boolean; yamlText: string; body: string } | null` — fires only when the document's first line is exactly `---` (regex `^---[ \t]*\r?\n…\r?\n(---|\.\.\.)`). `parsed:false` on YAML exception. `---` elsewhere keeps meaning `<hr>`.
  - `renderFrontmatterHtml(data: Record<string, unknown>): string` — GitHub-style table (`.mdv-frontmatter`): one row per top-level key; key cell uppercase-caption styled. Values: scalars as escaped text; scalar arrays comma-joined; flat maps as inner header/value tables (`.mdv-fm-table`, horizontally scrollable via `.mdv-fm-scroll`); nested maps as captioned groups (`.mdv-fm-group`/`.mdv-fm-caption`) recursing. All strings HTML-escaped locally.
- **`lib/renderer.ts` wiring:** `renderMarkdown` splits frontmatter first; prefix HTML is the metadata table when `parsed && data` is a plain object, else a ```yaml code fence of the raw text (degrade, never break); body renders as before. Single sanitization sink preserved: `DOMPurify.sanitize(prefixHtml + md.render(body))`.
- **CSS:** `.mdv-frontmatter` block in `assets/styles/markdown.css` using existing tokens — hairline border, 8px radius, canvas-soft key column (11px uppercase muted), JetBrains Mono 12px values in inner tables, 32px bottom margin.
- **Fixture:** `tests/fixtures/frontmatter.md` (trimmed Notion DESIGN.md frontmatter + body) for tests/screenshots.

## Tests

`tests/frontmatter.test.ts`: split (no-frontmatter null, parse, malformed non-throw, nested maps); render (labeled rows, inner tables, HTML escaping). `tests/renderer.test.ts` additions: metadata table + body render; malformed → yaml fence + body; mid-document `---` stays `<hr>`; no frontmatter → unchanged.

## Out of scope

Collapsible frontmatter UI; TOML (`+++`) / JSON frontmatter; editing.
