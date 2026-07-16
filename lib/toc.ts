export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export function collectHeadings(root: ParentNode): TocEntry[] {
  return Array.from(root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
    .filter((h) => h.id)
    .map((h) => ({ id: h.id, text: h.textContent ?? '', level: Number(h.tagName[1]) }));
}

export function renderTocList(entries: TocEntry[]): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'mdv-toc';
  for (const entry of entries) {
    const a = document.createElement('a');
    a.href = `#${entry.id}`;
    a.textContent = entry.text;
    a.dataset.level = String(entry.level);
    a.dataset.target = entry.id;
    nav.appendChild(a);
  }
  return nav;
}

export function initScrollSpy(article: HTMLElement, toc: HTMLElement): () => void {
  const headings = article.querySelectorAll<HTMLElement>(
    'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
  );
  const observer = new IntersectionObserver(
    (observed) => {
      const visible = observed.filter((e) => e.isIntersecting);
      if (visible.length === 0) return;
      const id = (visible[0].target as HTMLElement).id;
      toc.querySelectorAll('a').forEach((a) => {
        a.classList.toggle('active', a.dataset.target === id);
      });
    },
    // Trigger when a heading enters the top fifth of the viewport.
    { rootMargin: '0px 0px -80% 0px' },
  );
  headings.forEach((h) => observer.observe(h));
  return () => observer.disconnect();
}
