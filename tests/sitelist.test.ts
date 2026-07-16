import { describe, it, expect } from 'vitest';
import { isHostDisabled } from '../lib/sitelist';

describe('isHostDisabled', () => {
  it('matches an exact hostname', () => {
    expect(isHostDisabled('github.com', ['github.com'])).toBe(true);
  });

  it('matches subdomains of a listed hostname', () => {
    expect(isHostDisabled('www.github.com', ['github.com'])).toBe(true);
    expect(isHostDisabled('gist.github.com', ['github.com'])).toBe(true);
  });

  it('treats a leading *. as the same pattern', () => {
    expect(isHostDisabled('docs.example.com', ['*.example.com'])).toBe(true);
    expect(isHostDisabled('example.com', ['*.example.com'])).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isHostDisabled('GitHub.COM', ['github.com'])).toBe(true);
    expect(isHostDisabled('github.com', ['GITHUB.com'])).toBe(true);
  });

  it('never matches suffix collisions', () => {
    expect(isHostDisabled('evilgithub.com', ['github.com'])).toBe(false);
    expect(isHostDisabled('github.com.evil.net', ['github.com'])).toBe(false);
  });

  it('ignores empty and whitespace-only patterns', () => {
    expect(isHostDisabled('example.com', ['', '   '])).toBe(false);
  });

  it('returns false for an empty list', () => {
    expect(isHostDisabled('example.com', [])).toBe(false);
  });
});
