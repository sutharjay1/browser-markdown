import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme } from '../lib/theme';

beforeEach(() => {
  delete document.documentElement.dataset.mdvTheme;
  document.getElementById('mdv-theme-css')?.remove();
});

describe('applyTheme (token-first static theming)', () => {
  it('stamps dark on the html element', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.mdvTheme).toBe('dark');
  });

  it('stamps light', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.mdvTheme).toBe('light');
  });

  it('auto resolves to light when matchMedia is unavailable (jsdom)', () => {
    applyTheme('auto');
    expect(document.documentElement.dataset.mdvTheme).toBe('light');
  });

  it('injects no style element — theming is static CSS, attribute flip only', () => {
    applyTheme('dark');
    applyTheme('light');
    expect(document.getElementById('mdv-theme-css')).toBeNull();
  });
});
