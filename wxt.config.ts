import { defineConfig } from 'wxt';
import type { Plugin } from 'vite';

// esbuild's/rolldown's default 'utf8' charset emits raw non-ASCII bytes (e.g. a literal
// U+FFFF from a bundled library's Unicode-range regex, such as KaTeX's) when minifying
// \uXXXX escapes. Chrome's extension loader has a known bug (crbug 395595611) that
// rejects otherwise-valid UTF-8 containing noncharacters like U+FFFF with a misleading
// "isn't UTF-8 encoded" error, which blocks the content script from loading entirely.
// Vite 8 (Rolldown) doesn't yet expose an ascii-charset knob (rolldown/rolldown#8805),
// so this plugin re-escapes any noncharacter left in the final chunk output back into
// its \uXXXX form, which is valid (and ASCII-safe) in strings, template literals,
// regexes, identifiers, and comments alike.
function asciiSafeExtensionOutput(): Plugin {
  // Built from an escaped string (rather than a regex literal) so this source file
  // itself stays plain ASCII instead of embedding the very noncharacters it guards
  // against.
  const noncharacterRe = new RegExp('[\\ufdd0-\\ufdef\\ufffe\\uffff]', 'g');
  return {
    name: 'ascii-safe-extension-output',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') {
          file.code = file.code.replace(
            noncharacterRe,
            (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'),
          );
        }
      }
    },
  };
}

export default defineConfig({
  manifestVersion: 3,
  // 'output' instead of the default '.output': macOS file dialogs hide dot-folders,
  // making the build unselectable in Firefox's "Load Temporary Add-on" picker.
  outDir: 'output',
  vite: () => ({
    plugins: [asciiSafeExtensionOutput()],
  }),
  manifest: ({ browser }) => ({
    name: 'Markdown Viewer',
    description: 'Fast, safe markdown rendering for local and remote .md files.',
    permissions: ['storage', 'declarativeNetRequest'],
    host_permissions: ['*://*/*.md*', '*://*/*.markdown*', '*://*/*.mkd*'],
    // Per-browser CSP-strip rulesets: Chrome (>=128) scopes the strip by
    // response content-type so HTML pages at .md URLs (e.g. github.com blob
    // pages) are never touched; Firefox lacks responseHeaders conditions,
    // so it excludes github.com by domain instead.
    declarative_net_request: {
      rule_resources: [
        {
          id: 'strip-csp',
          enabled: true,
          path: browser === 'firefox' ? 'rules.firefox.json' : 'rules.chrome.json',
        },
      ],
    },
    ...(browser !== 'firefox' && { minimum_chrome_version: '128' }),
    web_accessible_resources: [
      {
        resources: ['assets/*', 'chunks/*', 'mermaid-runner.js'],
        matches: ['<all_urls>'],
      },
    ],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'browser-markdown@sutharjay',
          // 140 is the first version understanding data_collection_permissions
          // (DNR itself only needs 128, so this is the binding floor).
          strict_min_version: '140.0',
          // AMO requires an explicit data-collection declaration; this
          // extension collects nothing (settings stay in storage.sync).
          data_collection_permissions: { required: ['none'] },
        },
        // Firefox for Android understands data_collection_permissions from 142.
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
  }),
});
