import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../lib/settings';

beforeEach(() => {
  fakeBrowser.reset();
});

describe('settings', () => {
  it('returns defaults when nothing is stored', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips saved settings', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark', enableMermaid: false });
    const s = await getSettings();
    expect(s.theme).toBe('dark');
    expect(s.enableMermaid).toBe(false);
  });

  it('merges defaults into partial stored settings (forward compatibility)', async () => {
    await fakeBrowser.storage.sync.set({ settings: { theme: 'light' } });
    expect(await getSettings()).toEqual({ ...DEFAULT_SETTINGS, theme: 'light' });
  });
});
