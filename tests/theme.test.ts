import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme } from '../lib/theme';

beforeEach(() => {
  document.getElementById('mdv-theme-css')?.remove();
  delete document.documentElement.dataset.mdvTheme;
});

describe('applyTheme', () => {
  it('injects dark stylesheet and stamps the html element', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.mdvTheme).toBe('dark');
    expect(document.getElementById('mdv-theme-css')?.textContent).toContain('.markdown-body');
  });

  it('switches back to light, reusing the same style element', () => {
    applyTheme('dark');
    applyTheme('light');
    expect(document.documentElement.dataset.mdvTheme).toBe('light');
    expect(document.querySelectorAll('#mdv-theme-css')).toHaveLength(1);
  });

  it('auto resolves to light when matchMedia is unavailable (jsdom)', () => {
    applyTheme('auto');
    expect(document.documentElement.dataset.mdvTheme).toBe('light');
  });
});
