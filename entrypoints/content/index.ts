import { MARKDOWN_URL_PATTERNS } from '@/lib/patterns';
import { isRawMarkdownDocument, extractRawText } from '@/lib/detect';
import { getSettings } from '@/lib/settings';
import { initViewer } from './viewer';
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
