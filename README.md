# Markdown Viewer

Fast, safe, in-place rendering of `.md` files — local (`file://`) and remote — for Chrome and Firefox.

GFM (tables, task lists, footnotes, strikethrough, autolinks), syntax-highlighted code, KaTeX math, Mermaid diagrams, emoji shortcodes, TOC sidebar with scrollspy, GitHub light/dark themes, raw view toggle, and auto-reload for local files. All rendering is sanitized with DOMPurify before touching the DOM.

## Develop

```bash
npm install
npm run dev            # Chrome with HMR
npm run dev:firefox    # Firefox
npm test               # unit tests (vitest)
npm run build          # both browsers → .output/
npm run e2e            # Playwright (requires npm run build first)
npm run lint:firefox   # AMO linter over the Firefox build
npm run zip            # store-ready packages
```

## Install (unpacked)

- **Chrome:** `chrome://extensions` → Developer mode → Load unpacked → `.output/chrome-mv3`. Then open the extension's Details and enable **Allow access to file URLs** for local files.
- **Firefox:** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `.output/firefox-mv3/manifest.json`. Grant site access under Manage Extension → Permissions.

## Store notes

- Permissions: `storage` (settings sync), `declarativeNetRequest` (strips restrictive CSP headers only on main-frame `.md` navigations so styles/fonts/images can render), host access limited to `*.md`/`*.markdown`/`*.mkd` URL patterns.
- No remote code; every library is bundled. Mermaid loads lazily from the bundle only when a document contains a diagram.
- Known limitation: Firefox's per-file origin policy can block auto-reload polling of `file://` documents; rendering itself is unaffected.
