import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../lib/renderer';

describe('renderMarkdown — GFM', () => {
  it('renders tables', () => {
    const html = renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });

  it('gives headings GitHub-style anchor ids', () => {
    expect(renderMarkdown('# Hello World!')).toContain('id="hello-world"');
  });

  it('deduplicates repeated heading slugs', () => {
    const html = renderMarkdown('# Same\n\n# Same');
    expect(html).toContain('id="same"');
    expect(html).toContain('id="same-1"');
  });

  it('renders task lists as disabled checkboxes', () => {
    const html = renderMarkdown('- [x] done\n- [ ] todo');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('disabled');
  });

  it('renders strikethrough', () => {
    expect(renderMarkdown('~~gone~~')).toContain('<s>gone</s>');
  });

  it('renders footnotes', () => {
    const html = renderMarkdown('text[^1]\n\n[^1]: the note');
    expect(html).toContain('footnote');
    expect(html).toContain('the note');
  });

  it('autolinks bare URLs', () => {
    expect(renderMarkdown('see https://example.com')).toContain('href="https://example.com"');
  });
});

describe('renderMarkdown — extensions', () => {
  it('renders emoji shortcodes', () => {
    expect(renderMarkdown('ship it :rocket:')).toContain('🚀');
  });

  it('renders inline math with KaTeX', () => {
    expect(renderMarkdown('$e = mc^2$')).toContain('katex');
  });

  it('marks mermaid fences for the post-processor', () => {
    const html = renderMarkdown('```mermaid\ngraph TD; A-->B;\n```');
    expect(html).toContain('<pre class="mermaid">');
    expect(html).toContain('graph TD');
  });

  it('tags code fences with a language class', () => {
    expect(renderMarkdown('```ts\nconst x = 1;\n```')).toContain('language-ts');
  });

  it('respects the katex toggle', () => {
    expect(renderMarkdown('$x + y$', { katex: false })).not.toContain('class="katex"');
  });

  it('respects the emoji toggle', () => {
    expect(renderMarkdown(':rocket:', { emoji: false })).not.toContain('🚀');
  });
});

describe('renderMarkdown — sanitization', () => {
  it('strips script tags', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script');
  });

  it('strips event handler attributes', () => {
    expect(renderMarkdown('<img src="x.png" onerror="alert(1)">')).not.toContain('onerror');
  });

  it('strips javascript: links', () => {
    expect(renderMarkdown('[click](javascript:alert(1))')).not.toContain('javascript:');
  });

  it('keeps benign inline HTML (GitHub compatibility)', () => {
    expect(renderMarkdown('a <b>bold</b> move')).toContain('<b>bold</b>');
  });

  it('strips javascript: image sources', () => {
    expect(renderMarkdown('![x](javascript:alert(1))')).not.toContain('javascript:');
  });

  it('strips javascript: autolinks', () => {
    expect(renderMarkdown('<javascript:alert(1)>')).not.toContain('href="javascript:');
  });

  it('strips javascript: reference-style links', () => {
    expect(renderMarkdown('[x][1]\n\n[1]: javascript:alert(1)')).not.toContain('javascript:');
  });

  it('returns empty output for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });
});
