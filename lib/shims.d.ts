declare module 'markdown-it-task-lists';
declare module 'markdown-it-footnote';
declare module 'markdown-it-sub';
declare module 'markdown-it-sup';
declare module 'markdown-it-deflist';
declare module 'markdown-it-emoji' {
  export const full: any;
  export const light: any;
  export const bare: any;
}
declare module '@vscode/markdown-it-katex' {
  const plugin: any;
  export default plugin;
}
declare module '*.css?inline' {
  const css: string;
  export default css;
}
