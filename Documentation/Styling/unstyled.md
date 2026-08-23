---
title: Own all styling
description: Use Components structure and behavior with a completely custom product design.
---

Components does not require a theme runtime. Import the structural CSS and define the semantic tokens yourself:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
```

```css
:root {
    --cratis-primary-color: var(--product-accent);
    --cratis-primary-color-text: var(--product-on-accent);
    --cratis-surface-card: var(--product-surface);
    --cratis-surface-overlay: var(--product-surface-raised);
    --cratis-surface-border: var(--product-border);
    --cratis-text-color: var(--product-text);
    --cratis-text-color-secondary: var(--product-text-muted);
    --cratis-focus-ring: 0 0 0 3px var(--product-focus-ring);
}
```

Do not import `@cratis/components/theme` when the product supplies all values.

## Customize structure

Use `pt` for one instance or `data-cratis-part` for a product-wide rule:

```tsx
<Dropdown
    aria-label='Role'
    options={roles}
    pt={{
        trigger: { className: 'product-select-trigger' },
        popover: { className: 'product-select-popover' },
        option: { className: 'product-select-option' },
    }}
/>
```

The parts are Cratis-owned and remain stable across internal foundation changes. See [Stable component parts](pass-through.md).

## Accessibility responsibilities

A custom design still owns visible focus, contrast, target size, reduced motion, forced colors, and responsive behavior. Components supplies semantic behavior but cannot infer product color relationships.
