import { renderMarkdown } from '@/lib/renderer';
import { applyTheme } from '@/lib/theme';
import type { Settings } from '@/lib/settings';
import { watchSettings } from '@/lib/settings';

export interface ViewerShell {
  root: HTMLElement;
  sidebar: HTMLElement;
  toolbar: HTMLElement;
  article: HTMLElement;
  rawPre: HTMLPreElement;
}

export function initViewer(rawText: string, settings: Settings): void {
  const shell = buildShell(rawText);
  document.body.replaceChildren(shell.root);
  applyTheme(settings.theme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settings.theme === 'auto') applyTheme('auto');
  });
  void updateContent(shell, rawText, settings);
  // Task 10 wires the toolbar here.
  // Task 11 starts the auto-reload watcher here.
  watchSettings((s) => {
    settings.theme = s.theme;
    applyTheme(s.theme);
  });
}

export async function updateContent(
  shell: ViewerShell,
  rawText: string,
  settings: Settings,
): Promise<void> {
  shell.article.innerHTML = renderMarkdown(rawText, {
    katex: settings.enableKatex,
    emoji: settings.enableEmoji,
  });
  const firstHeading = shell.article.querySelector('h1, h2');
  document.title =
    firstHeading?.textContent?.trim() || location.pathname.split('/').pop() || 'Markdown';
  if (location.hash) {
    document
      .getElementById(decodeURIComponent(location.hash.slice(1)))
      ?.scrollIntoView();
  }
  // Task 7 highlights code blocks here.
  // Task 8 renders mermaid diagrams here.
  // Task 9 rebuilds the TOC here.
}

function buildShell(rawText: string): ViewerShell {
  const root = document.createElement('div');
  root.id = 'mdv-root';
  const sidebar = document.createElement('aside');
  sidebar.id = 'mdv-sidebar';
  const toolbar = document.createElement('div');
  toolbar.id = 'mdv-toolbar';
  const article = document.createElement('main');
  article.id = 'mdv-content';
  article.classList.add('markdown-body');
  const rawPre = document.createElement('pre');
  rawPre.id = 'mdv-raw';
  rawPre.textContent = rawText;
  rawPre.hidden = true;
  root.append(sidebar, toolbar, article, rawPre);
  return { root, sidebar, toolbar, article, rawPre };
}
