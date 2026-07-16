import { describe, it, expect } from 'vitest';
import { highlightCodeBlocks } from '../lib/highlight';

const sync = (cb: () => void) => cb();

describe('highlightCodeBlocks', () => {
  it('highlights fenced code blocks in place', () => {
    const root = document.createElement('div');
    root.innerHTML = '<pre><code class="language-ts">const x: number = 1;</code></pre>';
    highlightCodeBlocks(root, sync);
    const code = root.querySelector('code')!;
    expect(code.classList.contains('hljs')).toBe(true);
    expect(code.querySelector('.hljs-keyword')).not.toBeNull();
  });

  it('auto-detects language for unlabelled blocks', () => {
    const root = document.createElement('div');
    root.innerHTML = '<pre><code>function f() { return 42; }</code></pre>';
    highlightCodeBlocks(root, sync);
    expect(root.querySelector('code')!.classList.contains('hljs')).toBe(true);
  });

  it('skips mermaid blocks', () => {
    const root = document.createElement('div');
    root.innerHTML = '<pre class="mermaid">graph TD; A-->B;</pre>';
    highlightCodeBlocks(root, sync);
    expect(root.querySelector('.hljs')).toBeNull();
  });
});
