---
title: Own Cratis Components styling without the baseline
description: Keep Cratis Components structure and behavior while your product owns the appearance, dark-mode values, and accessibility checks.
---

Cratis Components can use your product's design system without the optional baseline theme. Keep the token defaults and structural CSS, then override the design values and component parts your product owns. “Unstyled” here means no baseline theme, not controls with all CSS removed.

Use the CSS-first setup in [Set up styling](getting-started.md), omitting `theme`. If your application already uses direct TypeScript imports, keep these imports once at the application entry and provide the [stylesheet module declarations](../getting-started.mdx#install-and-wire-it-up):

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
```

Map your product variables onto the Cratis tokens after those imports:

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

The example assumes your design system defines each referenced `--product-*` variable. Keep these mappings outside cascade layers and load them after the token and structural styles. Unmapped Cratis tokens retain their light defaults, so this is a starting mapping rather than a complete product palette. Use the [token reference](cratis-tokens.md) to find the other roles your design needs.

Omit `@cratis/components/theme` when your product supplies the appearance and scheme behavior. Keep `styles`: it provides component layout, borders, and interaction-state rules. To select fewer surfaces, replace the full stylesheet with the shared base and the appropriate [per-area entries](per-area-stylesheets.md).

## Customize structure

Use the `pt` prop to pass a class to a named component part, or target `data-cratis-part` for a product-wide rule. This excerpt assumes an imported `Dropdown` and an existing `roles` collection:

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

Your product owns visible focus, contrast, target size, reduced motion, forced colors, and responsive behavior. Components supplies semantic behavior, but the CSS values and overrides you choose still need checking together in the application.

Check hover, active, disabled, validation, and focus states as well as the resting appearance. For dark mode, supply token overrides under your own mode selector; the light defaults do not create a dark palette. [Build a product theme](themed.md) explains root mappings and the extra mappings needed for independently themed subtrees.

Scope custom part rules to the intended component or application region. Avoid internal renderer markup, whose structure is not a public styling contract.

## See also

- [Cratis token reference](cratis-tokens.md) — find the semantic values to map
- [Per-area stylesheets](per-area-stylesheets.md) — select structural styles
- [Combine styling setups](mixing-paths.md) — mix baseline and product-owned styling
