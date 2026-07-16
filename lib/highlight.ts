// lib/common = ~40 popular languages (~half the bundle of the full build).
import hljs from 'highlight.js/lib/common';

type Scheduler = (cb: () => void) => void;

const idleScheduler: Scheduler = (cb) =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(() => cb()) : setTimeout(cb, 0);

export function highlightCodeBlocks(root: ParentNode, schedule: Scheduler = idleScheduler): void {
  for (const block of root.querySelectorAll<HTMLElement>('pre > code')) {
    if (block.parentElement?.classList.contains('mermaid')) continue;
    schedule(() => hljs.highlightElement(block));
  }
}
