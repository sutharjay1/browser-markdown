import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import { full as emojiPlugin } from 'markdown-it-emoji';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import deflist from 'markdown-it-deflist';
import katexModule from '@vscode/markdown-it-katex';
import GithubSlugger from 'github-slugger';
import DOMPurify from 'dompurify';
import { splitFrontmatter, renderFrontmatterHtml } from './frontmatter';

// ESM/CJS interop: the plugin may arrive as { default: fn } depending on bundler.
const katexPlugin = (katexModule as any).default ?? katexModule;

export interface RenderOptions {
  katex?: boolean;
  emoji?: boolean;
}

export function renderMarkdown(source: string, options: RenderOptions = {}): string {
  const { katex = true, emoji = true } = options;

  // Fresh instance per render so heading-slug deduplication starts clean.
  const slugger = new GithubSlugger();
  const md = new MarkdownIt({ html: true, linkify: true })
    .use(anchor, { slugify: (s: string) => slugger.slug(s) })
    .use(taskLists)
    .use(footnote)
    .use(sub)
    .use(sup)
    .use(deflist);
  if (emoji) md.use(emojiPlugin);
  if (katex) md.use(katexPlugin);

  // markdown-it's own validateLink rejects bad-protocol URLs (javascript:, data:, etc.)
  // by falling back to literal, unparsed text — so the raw "javascript:" substring
  // survives untouched and DOMPurify never sees an attribute to strip. Since DOMPurify
  // is the single security boundary for this module (see file-level contract), delegate
  // link-scheme validation to it entirely: let markdown-it always emit a real <a href>,
  // and let DOMPurify's ALLOWED_URI_REGEXP strip dangerous schemes from the attribute.
  md.validateLink = () => true;

  // Mermaid fences bypass code rendering; the post-processor reads textContent.
  const defaultFence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx];
    if (token.info.trim() === 'mermaid') {
      return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>\n`;
    }
    return defaultFence(tokens, idx, opts, env, self);
  };

  // Leading YAML frontmatter renders as a GitHub-style metadata table;
  // malformed YAML degrades to a readable yaml code fence, never breaking the body.
  const fm = splitFrontmatter(source);
  let prefixHtml = '';
  let bodySource = source;
  if (fm) {
    bodySource = fm.body;
    if (fm.parsed && fm.data !== null && typeof fm.data === 'object' && !Array.isArray(fm.data)) {
      prefixHtml = renderFrontmatterHtml(fm.data as Record<string, unknown>);
    } else if (fm.yamlText.trim()) {
      prefixHtml = `<pre><code class="language-yaml">${md.utils.escapeHtml(fm.yamlText)}</code></pre>\n`;
    }
  }

  // html:true above allows raw HTML through the parser (GitHub compatibility);
  // this sanitize pass is what makes that safe. 'encoding' is for KaTeX MathML
  // <annotation> elements, which DOMPurify would otherwise strip the attr from.
  return DOMPurify.sanitize(prefixHtml + md.render(bodySource), { ADD_ATTR: ['encoding'] });
}
