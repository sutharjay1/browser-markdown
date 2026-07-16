export type ThemeChoice = 'auto' | 'light' | 'dark';

/**
 * Token-first theming: all colors live in assets/styles/tokens.css under
 * :root (light) and html[data-mdv-theme='dark']. Switching themes is a pure
 * attribute flip — no style injection, nothing for page CSP to block.
 */
export function applyTheme(choice: ThemeChoice): void {
  const prefersDark =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = choice === 'dark' || (choice === 'auto' && prefersDark);
  document.documentElement.dataset.mdvTheme = dark ? 'dark' : 'light';
}
