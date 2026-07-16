import { describe, it, expect } from 'vitest';
import { collectHeadings, renderTocList } from '../lib/toc';

function articleWith(html: string): HTMLElement {
  const el = document.createElement('main');
  el.innerHTML = html;
  return el;
}

describe('collectHeadings', () => {
  it('collects id, text, and level in document order', () => {
    const article = articleWith(
      '<h1 id="a">Alpha</h1><p>x</p><h2 id="b">Beta</h2><h3 id="c">Gamma</h3>',
    );
    expect(collectHeadings(article)).toEqual([
      { id: 'a', text: 'Alpha', level: 1 },
      { id: 'b', text: 'Beta', level: 2 },
      { id: 'c', text: 'Gamma', level: 3 },
    ]);
  });

  it('skips headings without ids', () => {
    expect(collectHeadings(articleWith('<h2>No anchor</h2>'))).toEqual([]);
  });
});

describe('renderTocList', () => {
  it('renders one link per entry with level and target data', () => {
    const nav = renderTocList([
      { id: 'a', text: 'Alpha', level: 1 },
      { id: 'b', text: 'Beta', level: 2 },
    ]);
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[1].getAttribute('href')).toBe('#b');
    expect(links[1].dataset.level).toBe('2');
    expect(links[1].dataset.target).toBe('b');
    expect(links[1].textContent).toBe('Beta');
  });
});
