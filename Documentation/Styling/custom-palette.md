---
title: Customize the palette
description: Override the semantic Cratis color tokens without replacing component structure.
---

Use this page when you keep the baseline theme (`@cratis/components/theme`) and want your own brand colors in both light and dark mode. Import your stylesheet after the theme:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
import './palette.css';
```

## Why a plain `:root` override is not enough

`tokens.css` and `theme.css` are unlayered custom-property rules, so a token override wins by specificity and then by source order. The theme sets its values under selectors such as `:root.cratis-dark`, `.cratis-theme`, and `:root:not(.cratis-light)` inside `@media (prefers-color-scheme: dark)`. Most of them are more specific than `:root` or `.cratis-dark`. An override written only for `:root` therefore holds for a light root and is replaced by the baseline in dark mode (automatic or explicit), under an explicit `cratis-light` root, and inside every `.cratis-theme` subtree.

Repeat the theme's own selectors instead. Your rules then tie on specificity and win because they come later.

## Override light and dark values

```css
/* Light: the selectors theme.css uses for its light values. */
:root,
.cratis-theme,
:root.cratis-light,
:root.cratis-dark.cratis-light,
:root.cratis-light .cratis-theme:not(.cratis-dark),
.cratis-theme.cratis-light,
.cratis-dark .cratis-theme.cratis-light {
    --cratis-primary-color: #0f766e;
    --cratis-primary-color-text: #ffffff;
    --cratis-action-background: #0f766e;
    --cratis-action-background-hover: #115e59;
    --cratis-action-background-active: #134e4a;
    --cratis-action-text: #ffffff;
    --cratis-highlight-bg: #ccfbf1;
    --cratis-highlight-text-color: #115e59;
}

/* Explicit dark: the selectors theme.css uses for cratis-dark. */
:root.cratis-dark,
.cratis-dark .cratis-theme,
.cratis-theme.cratis-dark {
    --cratis-primary-color: #5eead4;
    --cratis-primary-color-text: #042f2e;
    --cratis-action-background: #5eead4;
    --cratis-action-background-hover: #99f6e4;
    --cratis-action-background-active: #ccfbf1;
    --cratis-action-text: #042f2e;
}

/* Automatic dark: the same media query and selectors theme.css uses. */
@media (prefers-color-scheme: dark) {
    :root:not(.cratis-light),
    .cratis-theme:not(.cratis-light) {
        --cratis-primary-color: #5eead4;
        --cratis-primary-color-text: #042f2e;
        --cratis-action-background: #5eead4;
        --cratis-action-background-hover: #99f6e4;
        --cratis-action-background-active: #ccfbf1;
        --cratis-action-text: #042f2e;
    }
}
```

The dark blocks leave `--cratis-highlight-bg` and `--cratis-highlight-text-color` to the baseline's dark values. Add them to both dark blocks if your brand needs its own dark highlight.

These rules also take precedence over the theme's `forced-colors` values for the tokens you set. To leave those in place, wrap all three blocks in `@media (forced-colors: none) { … }`.

## Check the result

In the browser's developer tools, read the computed `--cratis-primary-color` on `<html>` and on a `.cratis-theme` element in each state your application supports: operating system light and dark, `cratis-dark` and `cratis-light` on the document element, and any themed subtree. Each state should show your value, not the baseline blue (`#2563eb` light, `#60a5fa` dark). Then check contrast for every foreground/background pair you changed; see the [token reference](cratis-tokens.md).

Prefer semantic product variables when several libraries share the same design system, then map those values onto `--cratis-*` once. If your product defines every value itself, omit the baseline and follow [Build a product theme](themed.md), where a plain `:root` mapping is enough.
