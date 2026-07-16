import lightMd from 'github-markdown-css/github-markdown-light.css?inline';
import darkMd from 'github-markdown-css/github-markdown-dark.css?inline';
import lightHljs from 'highlight.js/styles/github.css?inline';
import darkHljs from 'highlight.js/styles/github-dark.css?inline';

export type ThemeChoice = 'auto' | 'light' | 'dark';

export function applyTheme(choice: ThemeChoice): void {
  const prefersDark =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = choice === 'dark' || (choice === 'auto' && prefersDark);

  let el = document.getElementById('mdv-theme-css') as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = 'mdv-theme-css';
    document.head.appendChild(el);
  }
  el.textContent = (dark ? darkMd : lightMd) + '\n' + (dark ? darkHljs : lightHljs);
  document.documentElement.dataset.mdvTheme = dark ? 'dark' : 'light';
}
