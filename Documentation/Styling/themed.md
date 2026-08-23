---
title: Build a product theme
description: Map a product design system onto Cratis tokens and stable parts.
---

A Components theme is CSS. It does not require a JavaScript preset or provider configuration.

## Map product tokens

```css
:root {
    --cratis-primary-color: var(--brand-accent-700);
    --cratis-primary-color-text: var(--brand-text-inverse);
    --cratis-surface-ground: var(--brand-canvas);
    --cratis-surface-card: var(--brand-surface);
    --cratis-surface-overlay: var(--brand-surface);
    --cratis-surface-hover: var(--brand-subtle);
    --cratis-surface-border: var(--brand-border);
    --cratis-text-color: var(--brand-text-primary);
    --cratis-text-color-secondary: var(--brand-text-secondary);
    --cratis-border-radius: 0.5rem;
    --cratis-focus-ring: var(--brand-focus-ring);
}
```

Switch schemes by redefining the product values under the product's own selector:

```css
[data-theme='dark'] {
    --brand-canvas: #171717;
    --brand-surface: #262626;
    --brand-text-primary: #fafafa;
}
```

## Add component-specific treatment

Tokens provide shared semantics. Use stable parts for a distinctive product component:

```css
.product-dialog[data-cratis-part='root'] {
    backdrop-filter: blur(18px);
    border-radius: 1rem;
}
```

This is the supported path for deeply customized products. No renderer preset, internal selector, or commercial theme package sits between product tokens and the rendered component.
