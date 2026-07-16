---
version: alpha
name: Notion-design-analysis
description: Notion presents itself as the all-in-one workspace through a confident, illustration-rich brand voice — anchored by a deep navy hero band and a signature purple pill primary CTA.
colors:
  primary: "#5645d4"
  primary-pressed: "#4534b3"
  primary-deep: "#3a2a99"
  on-primary: "#ffffff"
  brand-navy: "#0a1530"
  brand-navy-deep: "#070f24"
  brand-navy-mid: "#1a2a52"
  link-blue: "#0075de"
  link-blue-pressed: "#005bab"
  brand-orange: "#dd5b00"
  brand-pink: "#ff64c8"
  brand-purple: "#7b3ff2"
  brand-teal: "#2a9d99"
  brand-green: "#1aae39"
  brand-yellow: "#f5d75e"
  canvas: "#ffffff"
  surface: "#f6f5f4"
  hairline: "#e5e3df"
  ink: "#1a1a1a"
  charcoal: "#37352f"
typography:
  hero-display:
    fontFamily: Notion Sans
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -2px
  display-lg:
    fontFamily: Notion Sans
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.10
  heading-1:
    fontFamily: Notion Sans
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.15
  heading-2:
    fontFamily: Notion Sans
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.20
  body-md:
    fontFamily: Notion Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: Notion Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.40
rounded:
  xs: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 8px
  md: 16px
  section: 64px
  hero: 120px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  card-base:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
---

## Overview

Notion's marketing system anchors on a deep navy hero band with a purple pill CTA. This fixture exercises frontmatter rendering: the block above must appear as a metadata table, and this body must render normally.

- Top-level scalars → labeled rows
- Flat maps (colors, rounded, spacing) → inner header/value tables
- Deep maps (typography, components) → captioned groups
