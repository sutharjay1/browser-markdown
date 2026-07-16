const MARKDOWN_CONTENT_TYPES = new Set(['text/plain', 'text/markdown', 'text/x-markdown']);

/**
 * True only when the tab is the browser's raw-text rendering of a file:
 * matching content type AND the body is the plain-text <pre> wrapper.
 * This is the "never break a real website" guarantee — an HTML page that
 * happens to live at a .md URL fails both checks.
 */
export function isRawMarkdownDocument(contentType: string, body: HTMLElement | null): boolean {
  if (!MARKDOWN_CONTENT_TYPES.has(contentType.toLowerCase())) return false;
  if (!body || body.childElementCount !== 1) return false;
  return body.firstElementChild!.tagName === 'PRE';
}

export function extractRawText(body: HTMLElement): string {
  return body.firstElementChild?.textContent ?? '';
}
