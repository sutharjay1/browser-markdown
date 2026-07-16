import { describe, it, expect } from 'vitest';
import { isRawMarkdownDocument, extractRawText } from '../lib/detect';

function bodyWith(html: string): HTMLElement {
  const body = document.createElement('body');
  body.innerHTML = html;
  return body;
}

describe('isRawMarkdownDocument', () => {
  it('accepts text/plain with a single <pre> (Chrome/Firefox plain-text viewer)', () => {
    expect(isRawMarkdownDocument('text/plain', bodyWith('<pre># hi</pre>'))).toBe(true);
  });

  it('accepts text/markdown', () => {
    expect(isRawMarkdownDocument('text/markdown', bodyWith('<pre># hi</pre>'))).toBe(true);
  });

  it('rejects HTML pages served at .md URLs', () => {
    expect(isRawMarkdownDocument('text/html', bodyWith('<pre># hi</pre>'))).toBe(false);
  });

  it('rejects bodies that are not a single <pre> wrapper', () => {
    expect(isRawMarkdownDocument('text/plain', bodyWith('<div>x</div><pre>y</pre>'))).toBe(false);
    expect(isRawMarkdownDocument('text/plain', bodyWith('<div># hi</div>'))).toBe(false);
  });

  it('rejects a missing body', () => {
    expect(isRawMarkdownDocument('text/plain', null)).toBe(false);
  });
});

describe('extractRawText', () => {
  it('returns the pre text content', () => {
    expect(extractRawText(bodyWith('<pre># Title\n\nbody &amp; more</pre>'))).toBe(
      '# Title\n\nbody & more',
    );
  });
});
