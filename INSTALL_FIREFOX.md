# Installing Markdown Viewer in Firefox

Two ways to run it: as a **temporary add-on** (quick, but removed when Firefox closes) or **permanently** via Firefox Developer Edition / Nightly. Once the extension is published on addons.mozilla.org, normal one-click install will replace all of this.

## 1. Get the extension files

**From a release zip:** download the `*-firefox.zip` (no need to unzip for the temporary method — Firefox accepts the zip directly).

**From source:**

```bash
git clone https://github.com/sutharjay1/browser-markdown.git
cd browser-markdown
pnpm install
pnpm build
```

The extension folder is `.output/firefox-mv3/`.

## 2. Load it (temporary add-on)

1. Open `about:debugging#/runtime/this-firefox` in a new tab.
2. Click **Load Temporary Add-on…**
3. Select `.output/firefox-mv3/manifest.json` (or the release zip file).

The extension appears under "Temporary Extensions". **Note:** temporary add-ons are removed when Firefox quits — you'll need to reload after each restart. For a persistent install, see the last section.

## 3. Grant host permissions (required)

Firefox MV3 does **not** grant site access automatically — without this step nothing renders:

1. Click the puzzle-piece (Extensions) icon in the toolbar.
2. Find **Markdown Viewer** → click the gear/… → **Manage Extension**.
3. Open the **Permissions** tab.
4. Enable the listed site access permissions (the `.md`-pattern host access).

Alternatively, when you first visit a `.md` URL, click the extension icon and grant access from the prompt.

## 4. Local files

Firefox allows content scripts on `file://` URLs for temporary add-ons without an extra toggle — open any local `.md` file (`Cmd/Ctrl+O`) and it renders.

**Known limitation:** Firefox's per-file origin policy can block the auto-reload polling of local files. Rendering works fine; the page just may not live-update on save — reload the tab manually after editing.

## 5. Try it

- Open `https://raw.githubusercontent.com/microsoft/vscode/main/README.md` — you should see a formatted document with a table of contents sidebar.
- Toolbar (top-right of a rendered page): **☰** toggles the TOC sidebar, **◐** cycles the theme (auto → light → dark), **{ }** shows the raw markdown.
- Click the extension's toolbar icon for settings: theme, Mermaid/KaTeX/emoji toggles, auto-reload interval, global on/off.

## Persistent install (survives restarts)

Unsigned extensions can be permanently installed only in **Firefox Developer Edition**, **Nightly**, or **ESR**:

1. In `about:config`, set `xpinstall.signatures.required` to `false`.
2. Build the zip: `pnpm zip` → `.output/browser-markdown-<version>-firefox.zip`.
3. Open `about:addons` → gear icon → **Install Add-on From File…** → select the zip.

(Regular release Firefox enforces signing and won't keep unsigned extensions — use the temporary method there, or wait for the AMO listing.)

## Troubleshooting

| Problem | Fix |
| --- | --- |
| A `.md` URL shows plain text | Host permissions not granted — see step 3. Then reload the tab. |
| Extension gone after restarting Firefox | Temporary add-ons don't persist — reload it, or use the persistent-install method. |
| Page renders but styles look broken on GitHub raw URLs | Reload the tab once — the CSP-strip rule applies to fresh navigations only. |
| Local file doesn't auto-reload on save | Known Firefox limitation (see step 4) — reload manually. |
| Updating after a `git pull` | Run `pnpm build`, then click **Reload** next to the extension in `about:debugging`. |
