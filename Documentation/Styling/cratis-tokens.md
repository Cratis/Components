---
title: Cratis token reference
description: Stable semantic CSS variables consumed by Components markup and structural styles.
---

The `--cratis-*` variables are the supported theming boundary. The optional baseline theme supplies concrete values; a product design system can define them directly.

## Core colors

| Token                                           | Purpose                                    |
| ----------------------------------------------- | ------------------------------------------ |
| `--cratis-primary-color`                        | Primary actions and selected controls.     |
| `--cratis-primary-color-text`                   | Content on the primary color.              |
| `--cratis-primary-300` … `--cratis-primary-600` | Accent scale used by specialized surfaces. |
| `--cratis-green-500`                            | Success state.                             |
| `--cratis-orange-500`                           | Warning state.                             |
| `--cratis-red-500`                              | Error/destructive state.                   |

## Surfaces

| Token                                         | Purpose                                        |
| --------------------------------------------- | ---------------------------------------------- |
| `--cratis-surface-ground`                     | Application/page background.                   |
| `--cratis-surface-section`                    | Grouped section background.                    |
| `--cratis-surface-card`                       | Cards and inputs.                              |
| `--cratis-surface-overlay`                    | Dialogs, dropdowns, popovers, and toasts.      |
| `--cratis-surface-hover`                      | Hovered or quiet selected state.               |
| `--cratis-surface-border`                     | Borders and dividers.                          |
| `--cratis-surface-0` / `--cratis-surface-100` | Small neutral ramp used by display components. |

## Text and interaction

| Token                           | Purpose                           |
| ------------------------------- | --------------------------------- |
| `--cratis-text-color`           | Primary text.                     |
| `--cratis-text-color-secondary` | Supporting text and placeholders. |
| `--cratis-highlight-bg`         | Selected/highlighted background.  |
| `--cratis-highlight-text-color` | Text on a highlighted background. |
| `--cratis-focus-ring`           | Keyboard-visible focus treatment. |
| `--cratis-maskbg`               | Modal backdrop.                   |
| `--cratis-border-radius`        | Default component radius.         |

## Map a product system

```css
:root {
    --cratis-primary-color: var(--product-accent-700);
    --cratis-primary-color-text: var(--product-text-inverse);
    --cratis-surface-ground: var(--product-canvas);
    --cratis-surface-card: var(--product-surface);
    --cratis-surface-overlay: var(--product-surface-raised);
    --cratis-surface-hover: var(--product-subtle);
    --cratis-surface-border: var(--product-border);
    --cratis-text-color: var(--product-text-primary);
    --cratis-text-color-secondary: var(--product-text-secondary);
    --cratis-focus-ring: var(--product-focus-ring);
}
```

The token layer has renderer-independent baseline values and does not read legacy `--surface-*`, `--text-color`, `--primary-color`, or `--p-*` names. Import `@cratis/components/tokens` first, then assign product values to `--cratis-*` directly. This keeps product theming independent of any renderer token vocabulary.

Use [Stable component parts](pass-through.md) when token changes are not enough for a product-specific component treatment.
