import { load } from 'js-yaml';

export interface FrontmatterSplit {
  /** Parsed YAML value (null when empty or when parsing failed). */
  data: unknown;
  /** False when the YAML failed to parse — callers fall back to a code fence. */
  parsed: boolean;
  /** Raw YAML text between the fences, without the delimiters. */
  yamlText: string;
  /** Document body after the closing fence. */
  body: string;
}

// Frontmatter only counts when the very first line is exactly `---`;
// the block closes at the next `---` (or YAML's `...`) line. A `---`
// anywhere else in a document keeps its markdown meaning (<hr>).
const FENCE_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;

export function splitFrontmatter(source: string): FrontmatterSplit | null {
  if (!source.startsWith('---')) return null;
  const match = FENCE_RE.exec(source);
  if (!match) return null;
  const yamlText = match[1];
  const body = source.slice(match[0].length);
  try {
    return { data: load(yamlText) ?? null, parsed: true, yamlText, body };
  } catch {
    return { data: null, parsed: false, yamlText, body };
  }
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function valueHtml(value: unknown): string {
  if (value === null || value === undefined) return '<span class="mdv-fm-null">—</span>';
  if (Array.isArray(value)) {
    if (value.every((v) => !isPlainObject(v) && !Array.isArray(v))) {
      return escapeHtml(value.map(String).join(', '));
    }
    return value.map((v) => `<div class="mdv-fm-item">${valueHtml(v)}</div>`).join('');
  }
  if (isPlainObject(value)) return mapHtml(value);
  return escapeHtml(String(value));
}

function mapHtml(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj);
  const flat = entries.every(([, v]) => !isPlainObject(v) && !Array.isArray(v));
  if (flat) {
    // Flat map → compact header/value table (keys across the top, GitHub-style).
    const head = entries.map(([k]) => `<th>${escapeHtml(k)}</th>`).join('');
    const cells = entries.map(([, v]) => `<td>${valueHtml(v)}</td>`).join('');
    return `<div class="mdv-fm-scroll"><table class="mdv-fm-table"><thead><tr>${head}</tr></thead><tbody><tr>${cells}</tr></tbody></table></div>`;
  }
  // Mixed/deep map → one captioned group per key, recursing.
  return entries
    .map(
      ([k, v]) =>
        `<div class="mdv-fm-group"><div class="mdv-fm-caption">${escapeHtml(k)}</div>${valueHtml(v)}</div>`,
    )
    .join('');
}

/** GitHub-style metadata table for a parsed frontmatter map. Output is
 *  HTML-escaped here and additionally sanitized by the renderer's DOMPurify pass. */
export function renderFrontmatterHtml(data: Record<string, unknown>): string {
  const rows = Object.entries(data)
    .map(
      ([key, value]) =>
        `<tr><th class="mdv-fm-key">${escapeHtml(key)}</th><td class="mdv-fm-value">${valueHtml(value)}</td></tr>`,
    )
    .join('');
  return `<table class="mdv-frontmatter"><tbody>${rows}</tbody></table>\n`;
}
