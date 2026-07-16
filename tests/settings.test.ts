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

  it('defaults disabledHosts to an empty list and round-trips valid lists', async () => {
    expect((await getSettings()).disabledHosts).toEqual([]);
    await saveSettings({ ...DEFAULT_SETTINGS, disabledHosts: ['github.com', 'internal.dev'] });
    expect((await getSettings()).disabledHosts).toEqual(['github.com', 'internal.dev']);
  });

  it('coerces malformed stored disabledHosts back to a clean string list', async () => {
    await fakeBrowser.storage.sync.set({ settings: { disabledHosts: 'github.com' } });
    expect((await getSettings()).disabledHosts).toEqual([]);
    await fakeBrowser.storage.sync.set({ settings: { disabledHosts: ['ok.com', 42, null] } });
    expect((await getSettings()).disabledHosts).toEqual(['ok.com']);
  });

  it('merges defaults into partial stored settings (forward compatibility)', async () => {
    await fakeBrowser.storage.sync.set({ settings: { theme: 'light' } });
    expect(await getSettings()).toEqual({ ...DEFAULT_SETTINGS, theme: 'light' });
  });

  it('falls back to the default interval when stored value is 0', async () => {
    await fakeBrowser.storage.sync.set({ settings: { autoReloadIntervalMs: 0 } });
    expect((await getSettings()).autoReloadIntervalMs).toBe(1500);
  });

  it('clamps a stored interval below the floor up to 500', async () => {
    await fakeBrowser.storage.sync.set({ settings: { autoReloadIntervalMs: 100 } });
    expect((await getSettings()).autoReloadIntervalMs).toBe(500);
  });

  it('keeps a stored interval that is already above the floor', async () => {
    await fakeBrowser.storage.sync.set({ settings: { autoReloadIntervalMs: 2000 } });
    expect((await getSettings()).autoReloadIntervalMs).toBe(2000);
  });
});
