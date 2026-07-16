import { MARKDOWN_URL_PATTERNS } from '@/lib/patterns';
import { isRawMarkdownDocument, extractRawText } from '@/lib/detect';
import { getSettings } from '@/lib/settings';
import { initViewer } from './viewer';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@/assets/styles/tokens.css';
import './viewer.css';
// Real stylesheet import (not ?inline): KaTeX CSS references fonts, which must
// resolve against the extension origin via the manifest css list + WAR.
import 'katex/dist/katex.min.css';

export default defineContentScript({
  matches: MARKDOWN_URL_PATTERNS,
  runAt: 'document_idle',
  async main() {
    if (!isRawMarkdownDocument(document.contentType, document.body)) return;
    const settings = await getSettings();
    if (!settings.enabled) return;
    initViewer(extractRawText(document.body), settings);
  },
});
