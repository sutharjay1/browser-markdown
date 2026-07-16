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

// Single choke point for merged settings: floors autoReloadIntervalMs so a
// stored 0/negative/non-numeric value (e.g. from clearing the popup's number
// input) can never make lib/reload.ts busy-poll with setInterval(..., 0).
function normalizeSettings(partial: Partial<Settings>): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...partial };
  return {
    ...merged,
    autoReloadIntervalMs: Math.max(500, Number(merged.autoReloadIntervalMs) || 1500),
  };
}

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.sync.get('settings');
  return normalizeSettings(stored.settings ?? {});
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ settings });
}

export function watchSettings(callback: (settings: Settings) => void): void {
  browser.storage.sync.onChanged.addListener((changes) => {
    if (changes.settings) {
      callback(normalizeSettings(changes.settings.newValue ?? {}));
    }
  });
}
