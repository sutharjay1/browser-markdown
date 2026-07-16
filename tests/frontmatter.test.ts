import { describe, it, expect } from 'vitest';
import { splitFrontmatter, renderFrontmatterHtml } from '../lib/frontmatter';

describe('splitFrontmatter', () => {
  it('returns null when the document does not start with ---', () => {
    expect(splitFrontmatter('# Title\n\n---\n')).toBeNull();
  });

  it('splits and parses a leading YAML block', () => {
    const fm = splitFrontmatter('---\nname: test\nversion: 2\n---\n# Body');
    expect(fm?.parsed).toBe(true);
    expect(fm?.data).toEqual({ name: 'test', version: 2 });
    expect(fm?.body).toBe('# Body');
  });

  it('reports malformed YAML without throwing', () => {
    const fm = splitFrontmatter('---\nname: [unclosed\n---\n# Body');
    expect(fm?.parsed).toBe(false);
    expect(fm?.body).toBe('# Body');
  });

  it('handles nested maps', () => {
    const fm = splitFrontmatter('---\ncolors:\n  primary: "#fff"\n---\n');
    expect(fm?.data).toEqual({ colors: { primary: '#fff' } });
  });

  it('accepts ... as a closing fence', () => {
    const fm = splitFrontmatter('---\nname: test\n...\nbody');
    expect(fm?.parsed).toBe(true);
    expect(fm?.body).toBe('body');
  });
});

describe('renderFrontmatterHtml', () => {
  it('renders top-level keys as labeled rows', () => {
    const html = renderFrontmatterHtml({ version: 'alpha' });
    expect(html).toContain('mdv-frontmatter');
    expect(html).toContain('version');
    expect(html).toContain('alpha');
  });

  it('renders flat nested maps as inner header/value tables', () => {
    const html = renderFrontmatterHtml({ colors: { primary: '#5645d4', ink: '#1a1a1a' } });
    expect(html).toContain('mdv-fm-table');
    expect(html).toContain('#5645d4');
    expect(html).toContain('primary');
  });

  it('renders deep nested maps as captioned groups', () => {
    const html = renderFrontmatterHtml({
      typography: { 'hero-display': { fontSize: '80px', fontWeight: 600 } },
    });
    expect(html).toContain('mdv-fm-group');
    expect(html).toContain('hero-display');
    expect(html).toContain('80px');
  });

  it('joins scalar arrays with commas', () => {
    expect(renderFrontmatterHtml({ tags: ['a', 'b'] })).toContain('a, b');
  });

  it('escapes HTML in keys and values', () => {
    const html = renderFrontmatterHtml({ name: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
