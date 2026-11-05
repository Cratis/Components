---
title: Customize the Cratis Components baseline palette
description: Override Cratis Components baseline colors in light mode, dark mode, and themed subtrees by matching the theme's token selectors.
---

To use brand colors with the Cratis Components baseline theme, override its color tokens under the same light, dark, and subtree selectors. This keeps the baseline's scheme behavior and the existing component structure while letting your palette apply in each state.

Follow the CSS-first setup in [Set up styling](getting-started.md), then import your palette stylesheet after `@cratis/components/theme`. If your application retains direct TypeScript imports, the equivalent order is below; it needs the [stylesheet module declarations](../getting-started.mdx#install-and-wire-it-up).

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
import './palette.css';
```

## Why a plain `:root` override is not enough

`tokens.css` and `theme.css` declare CSS variables outside cascade layers. Write your palette outside layers too: specificity decides which declaration wins, then source order breaks a tie. Loading a plain `:root` rule later cannot beat a more specific selector such as `:root.cratis-dark`.

The baseline also declares values on `.cratis-theme` elements. Those local values take precedence over values inherited from the root. A root-only palette can therefore work in ordinary light mode yet disappear in dark mode or inside a themed subtree.

Match the theme's selectors in your palette so the rules tie on specificity and your later stylesheet wins.

## Override light and dark values

The following example changes action and highlight colors. To retain the baseline's system-color values in forced-colors mode, wrap all three blocks in `@media (forced-colors: none) { … }`. Without that wrapper, your later declarations also override the forced-colors values for tokens you set.

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

Both dark blocks use the same action colors so explicit dark mode and system dark mode agree. They leave `--cratis-highlight-bg` and `--cratis-highlight-text-color` to the baseline's dark values; add those tokens to both blocks if your brand needs a dark highlight too.

## Check the result

In browser developer tools, inspect the computed `--cratis-primary-color` on `<html>` and on each `.cratis-theme` wrapper. Check system light and dark, explicit `cratis-dark` and `cratis-light`, and any subtree combinations your application supports. With this example, light states should show `#0f766e` and dark states `#5eead4`, rather than the baseline blue (`#2563eb` light, `#60a5fa` dark).

Also check forced-colors mode and contrast for the foreground/background pairs you changed. The [token reference](cratis-tokens.md) helps identify related colors, including focus and validation states.

When several libraries share your design system, use product variables for their shared values. If your product owns the full palette and scheme behavior, omit the baseline and follow [Build a product theme](themed.md).
