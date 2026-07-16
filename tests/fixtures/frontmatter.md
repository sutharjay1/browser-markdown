---
version: alpha
name: Notion-design-analysis
description: Notion presents itself as the all-in-one workspace through a confident, illustration-rich brand voice — anchored by a deep navy hero band and a signature purple pill primary CTA.
colors:
  primary: "#5645d4"
  primary-pressed: "#4534b3"
  on-primary: "#ffffff"
  brand-navy: "#0a1530"
  link-blue: "#0075de"
  canvas: "#ffffff"
  hairline: "#e5e3df"
  ink: "#1a1a1a"
typography:
  hero-display:
    fontFamily: Notion Sans
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -2px
  body-md:
    fontFamily: Notion Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
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
