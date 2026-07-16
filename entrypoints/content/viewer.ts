import { renderMarkdown } from '@/lib/renderer';
import { applyTheme } from '@/lib/theme';
import type { Settings } from '@/lib/settings';
import { watchSettings, saveSettings } from '@/lib/settings';
import { highlightCodeBlocks } from '@/lib/highlight';
import { collectHeadings, renderTocList, initScrollSpy } from '@/lib/toc';
import { watchFileChanges } from '@/lib/reload';

declare global {
  interface Window {
    __mdvRenderMermaid?: () => Promise<void>;
  }
}

export interface ViewerShell {
  root: HTMLElement;
  sidebar: HTMLElement;
  sidebarTitle: HTMLElement;
  tocHost: HTMLElement;
  toolbar: HTMLElement;
  article: HTMLElement;
  rawPre: HTMLPreElement;
}

let disconnectScrollSpy: (() => void) | null = null;

export function initViewer(rawText: string, settings: Settings): void {
  const shell = buildShell(rawText);
  document.body.replaceChildren(shell.root);
  // Raw text/plain documents ship without a viewport meta, so mobile browsers
  // render a zoomed-out 980px virtual page. Inject one before styling matters.
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1';
    document.head.appendChild(viewport);
  }
  // Sidebar starts closed everywhere; the Contents button opens it on demand.
  shell.root.setAttribute('data-sidebar-collapsed', '');
  applyTheme(settings.theme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settings.theme === 'auto') applyTheme('auto');
  });
  void updateContent(shell, rawText, settings);
  wireToolbar(shell, settings);
  startAutoReload(shell, rawText, settings);
  watchSettings((s) => {
    Object.assign(settings, s);
    applyTheme(s.theme);
  });
}

export async function updateContent(
  shell: ViewerShell,
  rawText: string,
  settings: Settings,
): Promise<void> {
  try {
    shell.article.innerHTML = renderMarkdown(rawText, {
      katex: settings.enableKatex,
      emoji: settings.enableEmoji,
    });
  } catch (err) {
    // Spec-promised fallback: pipeline failure leaves the raw text visible
    // with a small notice, rather than a blank article.
    console.warn('[markdown-viewer] render failed:', err);
    shell.rawPre.hidden = false;
    shell.article.hidden = true;
    shell.sidebar.hidden = true;
    if (!shell.toolbar.querySelector('.mdv-notice')) {
      const notice = document.createElement('span');
      notice.className = 'mdv-notice';
      notice.textContent = 'Markdown rendering failed — showing raw text';
      shell.toolbar.append(notice);
    }
    shell.toolbar.querySelector('.mdv-btn-raw')?.classList.add('is-active');
    return;
  }
  setupFrontmatterCollapse(shell.article);
  const firstHeading = shell.article.querySelector('h1, h2');
  document.title =
    firstHeading?.textContent?.trim() || location.pathname.split('/').pop() || 'Markdown';
  shell.sidebarTitle.textContent = document.title;
  if (location.hash) {
    try {
      document
        .getElementById(decodeURIComponent(location.hash.slice(1)))
        ?.scrollIntoView();
    } catch {
      // Malformed fragment (e.g. "#%") — it simply doesn't scroll.
    }
  }
  highlightCodeBlocks(shell.article);
  await renderMermaidDiagrams(shell.article, settings);
  disconnectScrollSpy?.();
  shell.tocHost.replaceChildren(renderTocList(collectHeadings(shell.article)));
  disconnectScrollSpy = initScrollSpy(shell.article, shell.tocHost);
}

/** Long frontmatter starts clamped with a gradient-fade Expand button;
 *  expanding is one-way (no collapse) and animates unless reduced-motion. */
function setupFrontmatterCollapse(article: HTMLElement): void {
  const fm = article.querySelector<HTMLElement>('.mdv-frontmatter');
  if (!fm || fm.scrollHeight <= 420) return;
  fm.classList.add('is-collapsed');
  const overlay = document.createElement('div');
  overlay.className = 'mdv-fm-expand';
  const btn = makeButton('Expand', 'Show all metadata', iconChevronDown());
  btn.classList.add('mdv-fm-expand-btn');
  let expanded = false;
  btn.addEventListener('click', () => {
    if (expanded) return;
    expanded = true;
    const finish = () => {
      fm.classList.remove('is-collapsed');
      fm.style.maxHeight = '';
      overlay.remove();
    };
    if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      fm.style.maxHeight = `${fm.scrollHeight}px`;
      overlay.classList.add('is-hidden');
      fm.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, 450); // safety net if transitionend never fires
    } else {
      finish();
    }
  });
  overlay.appendChild(btn);
  fm.appendChild(overlay);
}

const iconChevronDown = (): SVGSVGElement => makeIcon([{ d: 'M4 6.5 8 10.5 12 6.5' }]);

async function renderMermaidDiagrams(article: HTMLElement, settings: Settings): Promise<void> {
  if (!settings.enableMermaid) return;
  if (!article.querySelector('pre.mermaid')) return;
  try {
    if (!window.__mdvRenderMermaid) {
      // Loaded on demand from the extension bundle; requires the WAR entry from Task 1.
      await import(/* @vite-ignore */ browser.runtime.getURL('/mermaid-runner.js'));
    }
    await window.__mdvRenderMermaid?.();
  } catch (err) {
    // Degrade, never break: the escaped diagram source stays visible.
    console.warn('[markdown-viewer] mermaid rendering failed:', err);
  }
}

function buildShell(rawText: string): ViewerShell {
  const root = document.createElement('div');
  root.id = 'mdv-root';
  const sidebar = document.createElement('aside');
  sidebar.id = 'mdv-sidebar';
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'mdv-sidebar-header';
  const caption = document.createElement('div');
  caption.className = 'mdv-sidebar-caption';
  caption.textContent = 'On this page';
  const sidebarTitle = document.createElement('div');
  sidebarTitle.className = 'mdv-sidebar-title';
  sidebarHeader.append(caption, sidebarTitle);
  const tocHost = document.createElement('div');
  tocHost.id = 'mdv-toc-host';
  sidebar.append(sidebarHeader, tocHost);
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
  return { root, sidebar, sidebarTitle, tocHost, toolbar, article, rawPre };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

type IconPart = Record<string, string>;

function makeIcon(parts: IconPart[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const part of parts) {
    const { tag = 'path', ...attrs } = part;
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    svg.appendChild(el);
  }
  return svg;
}

const iconPanelLeft = (): SVGSVGElement =>
  makeIcon([
    { tag: 'rect', x: '1.5', y: '2.5', width: '13', height: '11', rx: '2' },
    { tag: 'line', x1: '6', y1: '2.5', x2: '6', y2: '13.5' },
  ]);

const iconTheme = (): SVGSVGElement =>
  makeIcon([
    { tag: 'circle', cx: '8', cy: '8', r: '6.25' },
    { d: 'M8 1.75a6.25 6.25 0 0 1 0 12.5z', fill: 'currentColor', stroke: 'none' },
  ]);

const iconRaw = (): SVGSVGElement =>
  makeIcon([{ d: 'M6 4 2.5 8 6 12' }, { d: 'M10 4 13.5 8 10 12' }]);

function wireToolbar(shell: ViewerShell, settings: Settings): void {
  const tocBtn = makeButton('Contents', 'Toggle table of contents', iconPanelLeft());
  tocBtn.addEventListener('click', () => {
    shell.root.toggleAttribute('data-sidebar-collapsed');
  });

  const themeBtn = makeButton('Theme', 'Cycle theme (auto → light → dark)', iconTheme());
  themeBtn.addEventListener('click', () => {
    const order: Settings['theme'][] = ['auto', 'light', 'dark'];
    settings.theme = order[(order.indexOf(settings.theme) + 1) % order.length];
    applyTheme(settings.theme);
    void saveSettings(settings);
  });

  const rawBtn = makeButton('Raw', 'Toggle raw markdown', iconRaw());
  rawBtn.classList.add('mdv-btn-raw');
  rawBtn.classList.toggle('is-active', !shell.rawPre.hidden);
  rawBtn.addEventListener('click', () => {
    const showRaw = shell.rawPre.hidden;
    shell.rawPre.hidden = !showRaw;
    shell.article.hidden = showRaw;
    shell.sidebar.hidden = showRaw;
    rawBtn.classList.toggle('is-active', Boolean(showRaw));
  });

  shell.toolbar.append(tocBtn, themeBtn, rawBtn);
}

function makeButton(label: string, title: string, icon: SVGSVGElement): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.title = title;
  b.className = 'mdv-btn';
  const text = document.createElement('span');
  text.className = 'mdv-btn-label';
  text.textContent = label;
  b.append(icon, text);
  return b;
}

function startAutoReload(shell: ViewerShell, initialRaw: string, settings: Settings): void {
  const isFile = location.protocol === 'file:';
  const enabled = isFile ? settings.autoReload : settings.autoReloadRemote;
  if (!enabled) return;
  watchFileChanges(location.href, settings.autoReloadIntervalMs, initialRaw, (text) => {
    const scrollY = window.scrollY;
    shell.rawPre.textContent = text;
    void updateContent(shell, text, settings).then(() => window.scrollTo(0, scrollY));
  });
}
