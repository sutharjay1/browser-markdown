import { browser } from 'wxt/browser';
import { MARKDOWN_URL_PATTERNS } from './patterns';

/**
 * Host access the viewer needs before its content script can run anywhere.
 *
 * Firefox MV3 grants NO host permission at install — every one of these starts
 * in the add-on's *optional* set and stays ungranted until the user says yes,
 * so a fresh install silently renders nothing. Chrome grants the web origins at
 * install but gates file:// behind its per-install "Allow access to file URLs"
 * toggle, which no API can flip.
 */
export const REQUIRED_ORIGINS: readonly string[] = MARKDOWN_URL_PATTERNS;

export const FILE_ORIGINS: readonly string[] = MARKDOWN_URL_PATTERNS.filter((p) =>
  p.startsWith('file://'),
);

export const WEB_ORIGINS: readonly string[] = MARKDOWN_URL_PATTERNS.filter(
  (p) => !p.startsWith('file://'),
);

/** The slice of browser APIs this module uses — injectable for tests. */
export interface PermissionsApi {
  contains(permissions: { origins: string[] }): Promise<boolean>;
  request(permissions: { origins: string[] }): Promise<boolean>;
  /** Chromium's file-access probe; absent on browsers without the toggle. */
  isAllowedFileSchemeAccess?(): Promise<boolean>;
  /**
   * Firefox 153+'s separate file opt-in ("Access local files on your
   * computer"). Unlike Chromium's probe it gates file:// *on top of* the host
   * grants, so both must hold.
   */
  fileSchemeOptIn?(): Promise<boolean>;
}

/**
 * True on Chromium, where file:// access is a per-install checkbox rather than
 * a grantable permission. Discriminated by runtime.getBrowserInfo, which only
 * Firefox implements — Chromium's isAllowedFileSchemeAccess exists in Firefox
 * too, so its mere presence proves nothing.
 */
export function usesFileSchemeToggle(): boolean {
  return !('getBrowserInfo' in browser.runtime);
}

/**
 * True on Firefox 153+, which blocks every file:// content script until the
 * user flips "Access local files on your computer" in about:addons — even with
 * file:// host permissions granted. Version-gated because older Firefox has
 * isAllowedFileSchemeAccess() too but it always answers false there.
 */
export function hasFirefoxFileOptIn(userAgent: string = navigator.userAgent): boolean {
  const match = /\bFirefox\/(\d+)/.exec(userAgent);
  return match !== null && Number(match[1]) >= 153;
}

function defaultApi(): PermissionsApi {
  const api = browser.permissions as unknown as PermissionsApi;
  // WXT types this as the MV2 callback form; under MV3 it returns a promise.
  const probe = browser.extension?.isAllowedFileSchemeAccess as unknown as
    | (() => Promise<boolean>)
    | undefined;
  if (typeof probe !== 'function') return api;
  const check = () => Promise.resolve(probe.call(browser.extension));
  const base = { contains: api.contains.bind(api), request: api.request.bind(api) };
  if (usesFileSchemeToggle()) return { ...base, isAllowedFileSchemeAccess: check };
  if (hasFirefoxFileOptIn()) return { ...base, fileSchemeOptIn: check };
  return api;
}

export interface AccessResult {
  granted: boolean;
  /** True when the browser refuses file:// as an API grant (Chrome's toggle). */
  fileAccessUnavailable: boolean;
}

/**
 * Which of REQUIRED_ORIGINS are not granted yet. Checked one at a time so a
 * partial grant reports precisely, rather than all-or-nothing.
 */
export async function missingOrigins(api: PermissionsApi = defaultApi()): Promise<string[]> {
  const fileAccess = api.isAllowedFileSchemeAccess
    ? await api.isAllowedFileSchemeAccess().catch(() => false)
    : null;
  const checks = await Promise.all(
    REQUIRED_ORIGINS.map(async (origin) => {
      if (fileAccess !== null && origin.startsWith('file://')) {
        return fileAccess ? null : origin;
      }
      try {
        return (await api.contains({ origins: [origin] })) ? null : origin;
      } catch {
        // A browser that can't even evaluate the pattern hasn't granted it.
        return origin;
      }
    }),
  );
  return checks.filter((o): o is string => o !== null);
}

/**
 * True when Firefox 153+'s "Access local files on your computer" toggle is
 * off. Kept apart from missingOrigins because the two are fixed differently:
 * file:// host origins go through permissions.request(), while this toggle is
 * only reachable by hand in about:addons. Both are needed for local files.
 */
export async function fileOptInMissing(api: PermissionsApi = defaultApi()): Promise<boolean> {
  if (!api.fileSchemeOptIn) return false;
  return !(await api.fileSchemeOptIn().catch(() => false));
}

/**
 * Ask for `origins` in a single prompt (must be called from a user gesture).
 *
 * A rejection means the browser won't accept file:// through this API at all
 * (Chrome), so the web origins are retried on their own — otherwise one
 * unsupported pattern would cost the user every other origin too. A resolved
 * `false` is the user declining; that is never retried.
 */
export async function requestAccess(
  origins: readonly string[],
  api: PermissionsApi = defaultApi(),
): Promise<AccessResult> {
  try {
    return { granted: await api.request({ origins: [...origins] }), fileAccessUnavailable: false };
  } catch {
    const webOnly = origins.filter((o) => !o.startsWith('file://'));
    if (webOnly.length === 0) return { granted: false, fileAccessUnavailable: true };
    try {
      return { granted: await api.request({ origins: webOnly }), fileAccessUnavailable: true };
    } catch {
      return { granted: false, fileAccessUnavailable: true };
    }
  }
}
