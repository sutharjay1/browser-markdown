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
  vite: () => ({
    plugins: [asciiSafeExtensionOutput()],
  }),
  manifest: ({ browser }) => ({
    name: 'Markdown Viewer',
    description: 'Fast, safe markdown rendering for local and remote .md files.',
    permissions: ['storage', 'declarativeNetRequest'],
    host_permissions: ['*://*/*.md*', '*://*/*.markdown*', '*://*/*.mkd*'],
    declarative_net_request: {
      rule_resources: [{ id: 'strip-csp', enabled: true, path: 'rules.json' }],
    },
    web_accessible_resources: [
      {
        resources: ['assets/*', 'chunks/*', 'mermaid-runner.js'],
        matches: ['<all_urls>'],
      },
    ],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: { id: 'browser-markdown@sutharjay', strict_min_version: '128.0' },
      },
    }),
  }),
});
