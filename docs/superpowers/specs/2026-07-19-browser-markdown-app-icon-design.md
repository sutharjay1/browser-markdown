# Browser Markdown App Icon Design

## Goal

Create a distinctive app icon for Browser Markdown that communicates both a web browser and Markdown rendering while remaining clear at Chrome extension toolbar sizes.

## Visual Direction

The icon combines a rounded browser-window silhouette with a bold Markdown-inspired `M` mark. The browser frame provides the product context; the simplified mark provides recognition at small sizes.

- Use a saturated blue primary field with a darker blue frame detail.
- Render the central mark in white for maximum contrast.
- Use flat geometric shapes without gradients, shadows, fine strokes, or small text.
- Keep generous internal spacing so the symbol remains legible at 16×16 pixels.
- Use a transparent outer canvas with a rounded-square icon body.

## Master Asset

Create `public/icon.svg` as the single source of truth:

- `viewBox="0 0 512 512"`
- Square 512×512 design coordinate system
- Vector-only paths and basic SVG shapes
- No embedded raster data, external fonts, scripts, or remote resources
- Accessible `<title>` identifying it as the Browser Markdown icon

## PNG Exports

Render the master SVG without visual modifications into these transparent PNG files:

- `public/icon/16.png`
- `public/icon/32.png`
- `public/icon/48.png`
- `public/icon/96.png`
- `public/icon/128.png`
- `public/icon/256.png`
- `public/icon/512.png`

The rasterization must preserve transparency and use high-quality antialiasing. All PNGs must be exact square dimensions matching their filenames.

## Extension Integration

Configure the WXT manifest to use the PNG assets for extension icons. Include the standard Chrome manifest sizes 16, 32, 48, and 128. The larger exports remain available for store artwork and future packaging needs.

## Verification

- Confirm the SVG parses and renders successfully.
- Confirm every PNG has the expected square dimensions and an alpha channel.
- Inspect at least the 16px, 48px, 128px, and 512px outputs visually.
- Build both browser targets and confirm their generated manifests contain the intended icon mapping.
- Run unit tests, strict TypeScript checking, and browser E2E tests before completion.

## Scope

This work adds the app icon assets and manifest wiring only. It does not create Chrome Web Store promotional banners, screenshots, or additional brand guidelines.
