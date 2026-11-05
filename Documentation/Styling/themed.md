---
title: Build a product theme for Cratis Components
description: Map your design system onto Cratis Components CSS tokens, switch light and dark values, and use stable parts for component-specific styling.
---

A product theme maps your design system's values onto the CSS variables Cratis Components uses for colors, surfaces, focus, and other visual roles. Use this approach when the application should look like your product rather than the Cratis baseline.

Follow [Set up styling](getting-started.md) with `tokens` and structural styles, omit `@cratis/components/theme`, and load your mappings afterward. Keep the mappings outside cascade layers so they can override the unlayered token defaults. No JavaScript theme preset or provider configuration is required.

## Map product tokens

This mapping assumes your design system already defines the referenced `--brand-*` variables. Map related roles together so action text, control boundaries, and focus indicators remain readable against their surfaces:

```css
:root {
    --cratis-primary-color: var(--brand-accent-700);
    --cratis-primary-color-text: var(--brand-text-inverse);
    --cratis-action-background: var(--brand-action);
    --cratis-action-background-hover: var(--brand-action-hover);
    --cratis-action-background-active: var(--brand-action-active);
    --cratis-action-text: var(--brand-on-action);
    --cratis-surface-ground: var(--brand-canvas);
    --cratis-surface-card: var(--brand-surface);
    --cratis-surface-overlay: var(--brand-surface);
    --cratis-surface-hover: var(--brand-subtle);
    --cratis-surface-border: var(--brand-border);
    --cratis-control-background: var(--brand-control);
    --cratis-control-border: var(--brand-control-border);
    --cratis-text-color: var(--brand-text-primary);
    --cratis-text-color-secondary: var(--brand-text-secondary);
    --cratis-border-radius: 0.5rem;
    --cratis-focus-ring: var(--brand-focus-ring);
    --cratis-shadow-overlay: var(--brand-overlay-shadow);
    --cratis-shadow-dialog: var(--brand-dialog-shadow);
}
```

Switch schemes by redefining the product values under your own mode selector. This excerpt changes three values; define the remaining referenced brand variables for each scheme your product supports:

```css
[data-theme='dark'] {
    --brand-canvas: #171717;
    --brand-surface: #262626;
    --brand-text-primary: #fafafa;
}
```

Put `data-theme='dark'` on the document element for this root mapping. The browser resolves each `var(--brand-…)` reference where the `--cratis-*` variable is declared. Descendants inherit that resolved value, so changing only a brand variable on a nested element does not update the inherited Cratis token. To give a subtree another scheme, repeat the relevant `--cratis-*` mappings on its selector.

Without the baseline import, `cratis-dark` and `cratis-light` do not supply a palette. Your product CSS owns the mode selector, its values, and any `color-scheme`, document foreground, or background rules it needs.

## Add component-specific treatment

Tokens give controls shared design values. When one component needs a different treatment, target a stable part: a named element exposed by `data-cratis-part` or the `pt` prop.

```css
.product-dialog[data-cratis-part='root'] {
    backdrop-filter: blur(18px);
    border-radius: 1rem;
}
```

The `product-dialog` class reaches the dialog root through `pt={{ root: { className: 'product-dialog' } }}` on the `Dialog`. [Stable component parts](pass-through.md) lists the supported hooks; avoid internal renderer classes and undocumented DOM selectors.

Check the resulting controls in every supported scheme, including hover, disabled, validation, and keyboard-focus states. [Own all styling](unstyled.md) covers product accessibility responsibilities, and the [token reference](cratis-tokens.md) identifies the remaining values you can map.
