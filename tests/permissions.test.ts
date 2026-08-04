import { describe, it, expect, vi } from 'vitest';
import {
  REQUIRED_ORIGINS,
  FILE_ORIGINS,
  WEB_ORIGINS,
  missingOrigins,
  requestAccess,
  type PermissionsApi,
} from '../lib/permissions';

function api(overrides: Partial<PermissionsApi> = {}): PermissionsApi {
  return {
    contains: async () => true,
    request: async () => true,
    ...overrides,
  };
}

describe('permissions', () => {
  it('covers both local and remote markdown origins', () => {
    expect(FILE_ORIGINS.every((o) => o.startsWith('file://'))).toBe(true);
    expect(WEB_ORIGINS.every((o) => !o.startsWith('file://'))).toBe(true);
    expect([...FILE_ORIGINS, ...WEB_ORIGINS].sort()).toEqual([...REQUIRED_ORIGINS].sort());
    // The failure this whole module exists for: local .md files.
    expect(FILE_ORIGINS).toContain('file:///*.md*');
  });

  it('reports nothing missing when every origin is granted', async () => {
    expect(await missingOrigins(api())).toEqual([]);
  });

  it('reports only the origins that are not granted', async () => {
    const granted = new Set(WEB_ORIGINS);
    const missing = await missingOrigins(
      api({ contains: async ({ origins }) => granted.has(origins[0]!) }),
    );
    expect(missing).toEqual([...FILE_ORIGINS]);
  });

  it('treats a contains() rejection as "not granted" rather than throwing', async () => {
    const missing = await missingOrigins(
      api({
        contains: async ({ origins }) => {
          if (origins[0]!.startsWith('file://')) throw new Error('unsupported');
          return true;
        },
      }),
    );
    expect(missing).toEqual([...FILE_ORIGINS]);
  });

  it('trusts the file-scheme probe over contains() when the browser has one', async () => {
    // Chromium answers contains() with "true" for file:// patterns it merely
    // declares, whether or not "Allow access to file URLs" is on — so the
    // probe, not contains(), is the authority when it exists.
    const missing = await missingOrigins(
      api({ contains: async () => true, isAllowedFileSchemeAccess: async () => false }),
    );
    expect(missing).toEqual([...FILE_ORIGINS]);
  });

  it('reports no file origins missing when the probe says access is on', async () => {
    expect(
      await missingOrigins(api({ isAllowedFileSchemeAccess: async () => true })),
    ).toEqual([]);
  });

  it('grants in one request when the browser accepts file origins', async () => {
    const request = vi.fn(async () => true);
    const result = await requestAccess(REQUIRED_ORIGINS, api({ request }));
    expect(result).toEqual({ granted: true, fileAccessUnavailable: false });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('retries without file origins when the browser rejects them outright', async () => {
    // Chrome throws "Only permissions specified in the manifest may be
    // requested" for file:// — its file access is a per-install toggle, not an
    // API grant. The web origins must still go through.
    const request = vi.fn(async ({ origins }: { origins: string[] }) => {
      if (origins.some((o) => o.startsWith('file://'))) throw new Error('not requestable');
      return true;
    });
    const result = await requestAccess(REQUIRED_ORIGINS, api({ request }));
    expect(result).toEqual({ granted: true, fileAccessUnavailable: true });
    expect(request).toHaveBeenLastCalledWith({ origins: [...WEB_ORIGINS] });
  });

  it('does not re-prompt when the user declines the request', async () => {
    const request = vi.fn(async () => false);
    const result = await requestAccess(REQUIRED_ORIGINS, api({ request }));
    expect(result).toEqual({ granted: false, fileAccessUnavailable: false });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('requests only the origins it is given', async () => {
    const request = vi.fn(async () => true);
    await requestAccess(FILE_ORIGINS, api({ request }));
    expect(request).toHaveBeenCalledWith({ origins: [...FILE_ORIGINS] });
  });
});
