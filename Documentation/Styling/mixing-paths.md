---
title: Mix baseline and custom styling
description: Combine token overrides and stable part customization safely.
---

Start with the baseline theme, override product tokens, and add part-specific CSS only where the product needs a distinct structure.

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
import './product-components.css';
```

```css
/* Every selector the baseline theme sets values under, so the mapping wins in each scheme. */
:root,
:root:not(.cratis-light),
:root.cratis-light,
:root.cratis-dark,
:root.cratis-dark.cratis-light,
.cratis-theme,
.cratis-theme:not(.cratis-light),
.cratis-theme.cratis-light,
.cratis-theme.cratis-dark,
.cratis-dark .cratis-theme,
.cratis-dark .cratis-theme.cratis-light,
:root.cratis-light .cratis-theme:not(.cratis-dark) {
    --cratis-primary-color: var(--product-accent);
    --cratis-action-background: var(--product-action);
    --cratis-action-background-hover: var(--product-action-hover);
    --cratis-action-background-active: var(--product-action-active);
    --cratis-action-text: var(--product-on-action);
}

.product-toolbar[data-cratis-part='root'] {
    border-radius: 1rem;
}
```

The token rule maps the same product variables in every scheme, so any light/dark difference has to come from the product variables themselves. When the brand needs different literal values per scheme instead, use the per-scheme blocks in [Customize the palette](custom-palette.md). Either way, the mapping also replaces the theme's `forced-colors` values for these tokens unless you wrap it in `@media (forced-colors: none) { … }`.

The toolbar rule targets a `Toolbar` rendered with `className='product-toolbar'`.

All three entries are Cratis-owned. Structural rules live in the low-priority `cratis-components` layer and internal utilities in `cratis-utilities`; the unlayered `product-components.css` import wins over both. There is no provider theme or renderer cascade layer to coordinate. `tokens` and `theme` are not layered, which is why the token mapping above repeats the theme's selectors: it wins on equal specificity by coming later.
