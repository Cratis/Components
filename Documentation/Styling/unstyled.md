---
title: Own all styling
description: Use Components structure and behavior with a completely custom product design.
---

Own all styling when your application already has a design system and needs Components behavior without the optional baseline theme. Keep the structural CSS, then map the Cratis semantic tokens to your product's values.

Components does not require a theme runtime. Import these layers once at your application entry point:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
```

```css
:root {
    --cratis-primary-color: var(--product-accent);
    --cratis-primary-color-text: var(--product-on-accent);
    --cratis-action-background: var(--product-action);
    --cratis-action-background-hover: var(--product-action-hover);
    --cratis-action-background-active: var(--product-action-active);
    --cratis-action-text: var(--product-on-action);
    --cratis-surface-card: var(--product-surface);
    --cratis-surface-overlay: var(--product-surface-raised);
    --cratis-surface-border: var(--product-border);
    --cratis-control-background: var(--product-control);
    --cratis-control-border: var(--product-control-border);
    --cratis-text-color: var(--product-text);
    --cratis-text-color-secondary: var(--product-text-muted);
    --cratis-focus-ring: 0 0 0 3px var(--product-focus-ring);
    --cratis-shadow-overlay: var(--product-overlay-shadow);
    --cratis-shadow-dialog: var(--product-dialog-shadow);
}
```

The CSS example assumes that your design system defines the referenced `--product-*` variables. Load your mappings after the token and structural layers so they take precedence. The token layer includes conservative light defaults; leaving a token unmapped retains its default rather than removing the component's styles.

Do not import `@cratis/components/theme` when the product supplies all values. Omitting the theme is not the same as omitting structural CSS: component layout, borders, and interaction-state rules still come from `styles`. You can replace the full stylesheet with the documented per-area entry points when you want a smaller selection.

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

Check hover, active, disabled, and focus states as well as the resting appearance. If your application supports dark mode, supply the appropriate token overrides in your own mode selector; the light defaults do not create that mode for you. Scope custom part rules to the intended component or application region instead of relying on internal renderer markup.

## See also

- [Cratis token reference](cratis-tokens.md) — find the semantic values to map
- [Per-area stylesheets](per-area-stylesheets.md) — select structural styles
- [Combine styling setups](mixing-paths.md) — mix baseline and product-owned styling
