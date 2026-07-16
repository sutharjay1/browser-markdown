/**
 * Hostname matcher for the user's disabled-sites list.
 * `example.com` matches the host itself and any subdomain; a leading `*.`
 * is accepted and means the same thing. Matching is by dot-boundary suffix,
 * never substring — `evilgithub.com` does not match `github.com`.
 */
export function isHostDisabled(hostname: string, patterns: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return patterns.some((raw) => {
    const pattern = raw
      .trim()
      .toLowerCase()
      .replace(/^\*\./, '')
      .replace(/\.$/, '');
    if (!pattern) return false;
    return host === pattern || host.endsWith('.' + pattern);
  });
}
