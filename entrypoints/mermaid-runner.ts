import mermaid from 'mermaid';

declare global {
  interface Window {
    __mdvRenderMermaid?: () => Promise<void>;
  }
}

export default defineUnlistedScript(() => {
  window.__mdvRenderMermaid = async () => {
    const dark = document.documentElement.dataset.mdvTheme === 'dark';
    mermaid.initialize({
      startOnLoad: false,
      theme: dark ? 'dark' : 'default',
      securityLevel: 'strict',
    });
    // mermaid.run marks rendered nodes with data-processed, so re-runs after
    // auto-reload only touch new blocks.
    await mermaid.run({ querySelector: 'pre.mermaid:not([data-processed])' });
  };
});
