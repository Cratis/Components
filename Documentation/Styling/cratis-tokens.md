---
title: Cratis token reference
description: Stable semantic CSS variables consumed by Components markup and structural styles.
---

The `--cratis-*` variables are the supported theming boundary. The `tokens` entry supplies conservative light defaults so an unthemed surface remains usable. A product design system overrides them directly; the optional `theme` entry adds dark, forced-colors, and scoped-subtree behavior.

## Core colors

| Token                                                   | Purpose                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| `--cratis-primary-color`                                | Accent, links, selected controls, and non-text indicators. |
| `--cratis-primary-color-text`                           | Content on the accent color where used.                    |
| `--cratis-primary-300` … `--cratis-primary-600`         | Accent scale used by specialized surfaces.                 |
| `--cratis-primary-600-text`                             | Content on the fixed `--cratis-primary-600` tone.          |
| `--cratis-green-500`                                    | Success state.                                             |
| `--cratis-orange-500`                                   | Warning state.                                             |
| `--cratis-red-500`                                      | Error/destructive indicator.                               |
| `--cratis-action-background` / `-hover` / `-active`     | Accessible primary-action state fills.                     |
| `--cratis-action-text`                                  | Text/icons on the primary action.                          |
| `--cratis-info-background` / `--cratis-info-text`       | Accessible info badge/tag pair.                            |
| `--cratis-success-background` / `--cratis-success-text` | Accessible success pair.                                   |
| `--cratis-warning-background` / `--cratis-warning-text` | Accessible warning pair.                                   |
| `--cratis-danger-background` / `--cratis-danger-text`   | Accessible danger pair.                                    |

## Surfaces

| Token                                         | Purpose                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `--cratis-surface-ground`                     | Application/page background.                                                 |
| `--cratis-surface-section`                    | Grouped section background.                                                  |
| `--cratis-surface-card`                       | Cards and raised content.                                                    |
| `--cratis-surface-overlay`                    | Dialogs, dropdowns, popovers, and toasts.                                    |
| `--cratis-surface-hover`                      | Hovered or quiet selected state.                                             |
| `--cratis-surface-border`                     | Borders and dividers.                                                        |
| `--cratis-surface-0` / `--cratis-surface-100` | Small neutral ramp used by display components.                               |
| `--cratis-control-background`                 | Inputs, Dropdown triggers, and segmented date controls.                      |
| `--cratis-control-border`                     | Visible control boundary, intentionally stronger than quiet surface borders. |

## Text and interaction

| Token                                           | Purpose                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `--cratis-text-color`                           | Primary text.                                                       |
| `--cratis-text-color-secondary`                 | Supporting text and placeholders.                                   |
| `--cratis-highlight-bg`                         | Selected/highlighted background.                                    |
| `--cratis-highlight-text-color`                 | Text on a highlighted background.                                   |
| `--cratis-focus-ring`                           | Keyboard-visible focus treatment.                                   |
| `--cratis-maskbg`                               | Modal backdrop.                                                     |
| `--cratis-border-radius`                        | Default component radius.                                           |
| `--cratis-control-height` / `-small` / `-large` | Interactive control size floor.                                     |
| `--cratis-disabled-opacity`                     | Shared disabled-state opacity.                                      |
| `--cratis-shadow-subtle`                        | Small control elevation.                                            |
| `--cratis-shadow-overlay`                       | Dropdown, DatePicker, filter, Toolbar panel, and tooltip elevation. |
| `--cratis-shadow-dialog`                        | Dialog elevation.                                                   |
| `--cratis-shadow-toast`                         | Toast elevation.                                                    |

## Overlay stacking

| Token                      | Default | Surface                           |
| -------------------------- | ------: | --------------------------------- |
| `--cratis-z-index-dialog`  |  `1100` | Dialog backdrop/root.             |
| `--cratis-z-index-overlay` |  `1200` | Dropdown and DatePicker overlays. |
| `--cratis-z-index-filter`  |  `1250` | Column filter menus.              |
| `--cratis-z-index-tooltip` |  `1300` | Tooltips.                         |
| `--cratis-z-index-toast`   |  `1400` | Toast regions.                    |

Keep their relative order when mapping into an application's overlay system. A mixed Prime/product application with overlays around `10000` can move the complete Components range together:

```css
:root {
    --cratis-z-index-dialog: 11000;
    --cratis-z-index-overlay: 11100;
    --cratis-z-index-filter: 11150;
    --cratis-z-index-tooltip: 11200;
    --cratis-z-index-toast: 11300;
}
```

These tokens coordinate Components only. Configure direct Prime or product overlays independently.

## Map a product system

```css
:root {
    --cratis-primary-color: var(--product-accent-700);
    --cratis-primary-color-text: var(--product-text-inverse);
    --cratis-action-background: var(--product-action);
    --cratis-action-background-hover: var(--product-action-hover);
    --cratis-action-background-active: var(--product-action-active);
    --cratis-action-text: var(--product-on-action);
    --cratis-surface-ground: var(--product-canvas);
    --cratis-surface-card: var(--product-surface);
    --cratis-surface-overlay: var(--product-surface-raised);
    --cratis-surface-hover: var(--product-subtle);
    --cratis-surface-border: var(--product-border);
    --cratis-control-background: var(--product-control);
    --cratis-control-border: var(--product-control-border);
    --cratis-text-color: var(--product-text-primary);
    --cratis-text-color-secondary: var(--product-text-secondary);
    --cratis-focus-ring: var(--product-focus-ring);
}
```

The token layer has renderer-independent baseline values and does not read legacy `--surface-*`, `--text-color`, `--primary-color`, or `--p-*` names. Import `@cratis/components/tokens` first, then assign product values to `--cratis-*` directly. This keeps product theming independent of any renderer token vocabulary.

Use [Stable component parts](pass-through.md) when token changes are not enough for a product-specific component treatment.
