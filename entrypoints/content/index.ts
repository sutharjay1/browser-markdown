import { MARKDOWN_URL_PATTERNS } from '@/lib/patterns';
import { isRawMarkdownDocument, extractRawText } from '@/lib/detect';
import { getSettings } from '@/lib/settings';
import { isHostDisabled } from '@/lib/sitelist';
import { initViewer } from './viewer';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@/assets/styles/tokens.css';
import '@/assets/styles/markdown.css';
import '@/assets/styles/hljs-cursor.css';
import './viewer.css';
// Real stylesheet import (not ?inline): KaTeX CSS references fonts, which must
// resolve against the extension origin via the manifest css list + WAR.
import 'katex/dist/katex.min.css';

export default defineContentScript({
  matches: MARKDOWN_URL_PATTERNS,
  // github.com blob pages live at .md URLs but are HTML apps — don't even
  // wake up there (detection below would reject them anyway).
  excludeMatches: ['*://github.com/*', '*://www.github.com/*'],
  runAt: 'document_idle',
  async main() {
    if (!isRawMarkdownDocument(document.contentType, document.body)) return;
    const settings = await getSettings();
    if (!settings.enabled) return;
    if (isHostDisabled(location.hostname, settings.disabledHosts)) return;
    initViewer(extractRawText(document.body), settings);
  },
});
