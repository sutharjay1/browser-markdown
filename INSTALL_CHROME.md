# Installing Markdown Viewer in Chrome

Works in Chrome and Chromium-based browsers (Edge, Brave, Arc, Vivaldi — menus may be named slightly differently).

## 1. Get the extension files

**From a release zip:** download the `*-chrome.zip`, and unzip it somewhere permanent (Chrome loads the folder in place — if you delete it, the extension breaks).

**From source:**

```bash
git clone https://github.com/sutharjay1/browser-markdown.git
cd browser-markdown
pnpm install
pnpm build
```

The extension folder is `.output/chrome-mv3/`.

## 2. Load it

1. Open `chrome://extensions` in a new tab.
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left).
4. Select the extension folder (`.output/chrome-mv3` if built from source, or the unzipped folder).

The "Markdown Viewer" card appears in the list. That's the extension installed — remote markdown URLs (e.g. `raw.githubusercontent.com/.../README.md`) render immediately.

## 3. Enable local file access (for `file://` .md files)

Chrome blocks extensions from file URLs by default. To view markdown files from your disk:

1. On the Markdown Viewer card in `chrome://extensions`, click **Details**.
2. Turn on **Allow access to file URLs**.

Now drag any `.md` file into a tab (or press `Cmd/Ctrl+O` and open one) and it renders. Bonus: with auto-reload on (default), edit the file in your editor, save, and the tab updates within ~2 seconds, keeping your scroll position.

## 4. Try it

- Open `https://raw.githubusercontent.com/microsoft/vscode/main/README.md` — you should see a formatted document with a table of contents sidebar, not plain text.
- Toolbar (top-right of a rendered page): **☰** toggles the TOC sidebar, **◐** cycles the theme (auto → light → dark), **{ }** shows the raw markdown.
- Click the extension's toolbar icon (puzzle piece → pin it) for settings: theme, Mermaid/KaTeX/emoji toggles, auto-reload interval, global on/off.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| A `.md` URL shows plain text | Check the extension is enabled in `chrome://extensions`; check the global "Enabled" switch in the popup. |
| Local files show plain text | **Allow access to file URLs** isn't on — see step 3. |
| Page renders but with no styling on GitHub raw URLs | Reload the tab once after install — the CSP-strip rule applies to fresh navigations only. |
| Extension disappeared after a reboot | The folder you loaded was moved or deleted. Re-load from a permanent location. |
| Updating after a `git pull` | Run `pnpm build` again, then click the reload icon (↻) on the extension card. |
