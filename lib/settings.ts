import { browser } from 'wxt/browser';

export interface Settings {
  enabled: boolean;
  theme: 'auto' | 'light' | 'dark';
  enableMermaid: boolean;
  enableKatex: boolean;
  enableEmoji: boolean;
  /** Auto-reload file:// documents by polling for changes. */
  autoReload: boolean;
  /** Also poll remote http(s) documents. Off by default to avoid hammering servers. */
  autoReloadRemote: boolean;
  autoReloadIntervalMs: number;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  theme: 'auto',
  enableMermaid: true,
  enableKatex: true,
  enableEmoji: true,
  autoReload: true,
  autoReloadRemote: false,
  autoReloadIntervalMs: 1500,
};

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...(stored.settings ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ settings });
}

export function watchSettings(callback: (settings: Settings) => void): void {
  browser.storage.sync.onChanged.addListener((changes) => {
    if (changes.settings) {
      callback({ ...DEFAULT_SETTINGS, ...(changes.settings.newValue ?? {}) });
    }
  });
}
