---
title: Cratis Components styling with custom overrides
description: Keep the Cratis Components baseline theme while mapping product colors to tokens and customizing a toolbar through a stable CSS part selector.
---

Keep the Cratis Components baseline theme when you want its default appearance but need product colors and a few control-specific changes. Map your colors to CSS custom properties (`--cratis-*` tokens), then use stable `data-cratis-part` attributes to style individual controls.

## Load the baseline and product CSS

Follow [Set up styling](getting-started.md) to load the package imports through a local CSS file, then load `product-components.css` after the theme. If your app retains direct TypeScript imports, the equivalent order below needs the [stylesheet module declarations](../getting-started.mdx#install-and-wire-it-up).

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
import './product-components.css';
```

The three package entries are Cratis-owned; there is no provider theme or renderer cascade layer to coordinate. `styles` places structural rules in the `cratis-components` CSS cascade layer and internal utilities in `cratis-utilities`. Your unlayered product CSS overrides normal rules in both layers.

`tokens` and `theme` are unlayered too, so token overrides also depend on selector specificity. In `product-components.css`, repeat the baseline selectors so your later mapping wins on equal specificity. Define the `--product-*` variables in your design system before using this mapping.

To retain the baseline's forced-colors values, wrap the token mapping in `@media (forced-colors: none) { … }`. Without that wrapper, it replaces the forced-colors values for the tokens it sets.

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

The same product variables supply colors in every scheme, so define their light and dark values in your design system. For different literal values per scheme instead, use the blocks in [Customize the palette](custom-palette.md).

Render your `Toolbar` with `className='product-toolbar'` to apply the corner radius only to that toolbar. Combining your class with the stable `root` part keeps this rule separate from the shared color mappings.

## Check the result

Check that the toolbar has a `1rem` corner radius and that action colors use your product variables in each light, dark, and themed-subtree state your app supports. Check forced-colors mode too. To customize other elements, continue with [Customize stable parts](pass-through.md).
