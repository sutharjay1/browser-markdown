import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
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
