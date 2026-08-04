# Browser Markdown

Fast, safe, in-place rendering of markdown files (`.md`, `.mdx`, `.markdown`, `.txt`) — local (`file://`) and remote — for Chrome and Firefox.

GFM (tables, task lists, footnotes, strikethrough, autolinks), syntax-highlighted code, KaTeX math, Mermaid diagrams, emoji shortcodes, TOC sidebar with scrollspy, GitHub light/dark themes, raw view toggle, and auto-reload for local files. All rendering is sanitized with DOMPurify before touching the DOM.

## Develop

Uses [pnpm](https://pnpm.io) (`npm i -g pnpm` if you don't have it).

```bash
pnpm install
pnpm dev             # Chrome with HMR
pnpm dev:firefox     # Firefox
pnpm test            # unit tests (vitest)
pnpm build           # both browsers → output/
pnpm e2e             # Playwright (requires pnpm build first)
pnpm lint:firefox    # AMO linter over the Firefox build
pnpm zip             # store-ready packages
```

## Install

Step-by-step guides with screenshots-level detail:

- **[Chrome install guide](INSTALL_CHROME.md)**
- **[Firefox install guide](INSTALL_FIREFOX.md)**

Quick version: build with `pnpm install && pnpm build`, then load `output/chrome-mv3` unpacked in Chrome (and enable **Allow access to file URLs**), or `output/firefox-mv3/manifest.json` as a temporary add-on in Firefox (and grant site access under Manage Extension → Permissions).

## Store notes

- Permissions: `storage` (settings sync), `declarativeNetRequest` (strips restrictive CSP headers only on main-frame `.md` navigations that actually return raw markdown — scoped by response content-type on Chrome, github.com-excluded on Firefox), host access limited to `*.md`/`*.markdown`/`*.mkd`/`*.txt` URL patterns.
- Never renders HTML pages (content-type + raw-text detection), never runs on github.com, and any site can be disabled via the popup's "Disabled sites" list.
- No remote code; every library is bundled. Mermaid loads lazily from the bundle only when a document contains a diagram.
- Known limitation: Firefox's per-file origin policy can block auto-reload polling of `file://` documents; rendering itself is unaffected.

## License

[MIT](LICENSE)
