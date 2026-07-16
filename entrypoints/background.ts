export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    console.log('[markdown-viewer] installed');
  });
});
