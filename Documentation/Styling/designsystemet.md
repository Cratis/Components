---
title: Use a Designsystemet theme with Cratis Components
description: Map a Digdir Designsystemet theme onto the Cratis CSS tokens with one stylesheet so Components follow the theme, its light and dark scheme, and its size modes.
---

`@cratis/components/themes/designsystemet` defines the `--cratis-*` tokens from live Designsystemet `--ds-*` variables. Components then follow the Designsystemet theme your product already uses, including a `data-color-scheme` or `data-size` set on any ancestor. The stylesheet contains no colors or sizes of its own and the package takes no dependency on Designsystemet.

## Import in this order

Import the Designsystemet packages first, then the Cratis tokens, the bridge, and the structural styles:

```css title="src/index.css"
@import '@digdir/designsystemet-css';
@import '@digdir/designsystemet-css/theme.css'; /* or your generated organisation theme */
@import '@cratis/components/tokens';
@import '@cratis/components/themes/designsystemet';
@import '@cratis/components/styles';
```

The order matters. The bridge is not in a cascade layer, so it must follow `tokens` to replace its defaults, and it keeps the tokens it deliberately does not map. Do not import `@cratis/components/theme` with the bridge: its dark-mode selectors are more specific than the bridge and would override it.

Set `data-color-scheme="light"`, `"dark"` or `"auto"` and, optionally, `data-size="sm"`, `"md"` or `"lg"` on `<html>` or any element, as Designsystemet documents. No `cratis-dark` or `cratis-light` class is involved.

## What the bridge maps

| Cratis tokens                                                                  | Designsystemet source                                                            |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Surfaces, control background, borders                                          | `--ds-color-neutral-*` (`background`, `surface`, `border-subtle`/`-default`)     |
| Text colors                                                                    | `--ds-color-neutral-text-default` and `-text-subtle`                             |
| Primary, action, and highlight colors                                          | `--ds-color-accent-*`                                                            |
| Success, warning, and danger indicators, and the info/status background pairs  | `--ds-color-{info,success,warning,danger}-*`; status pairs use the tinted surface |
| `--cratis-{info,success,warning,danger}-foreground`, `--cratis-focus-ring-inset` | `--ds-color-*-text-default` (status text on outline, ghost, and link buttons), and an inward two-tone ring from the outer and inner focus colors |
| `--cratis-border-radius`, `--cratis-radius-*`                                  | `--ds-border-radius-*`                                                           |
| `--cratis-control-height`, `-small`, `-large`                                  | `--ds-size-12`, `--ds-size-10`, `--ds-size-14`, so they follow `data-size`       |
| `--cratis-font-size-*`, `--cratis-font-weight-*`                               | `--ds-font-size-1`..`3`, `--ds-font-weight-*`                                    |
| Shadows, disabled opacity                                                      | `--ds-shadow-*`, `--ds-opacity-disabled`                                         |
| `--cratis-focus-ring`, `--cratis-focus-outline`, `--cratis-focus-outline-offset` | `--ds-color-focus-inner`, `--ds-color-focus-outer`, `--ds-border-width-focus`    |

Designsystemet has no bold weight, so `--cratis-font-weight-bold` maps to its semibold. The backdrop (`--cratis-maskbg`) and the `--cratis-z-index-*` tokens have no Designsystemet equivalent and keep their `tokens` values. The font family is not a token: components inherit it, so apply `--ds-font-family` to your document as Designsystemet's base styles do.

The bridge redeclares the tokens on `:root`, `[data-color-scheme]` and `[data-size='sm' | 'md' | 'lg']`, the elements where Designsystemet redeclares its own variables. That is what makes a nested scheme or size work. It does not use a bare `[data-size]` selector because the Cratis `Button`, `Avatar`, and `Badge` set `data-size` to their own values (`normal`, `small`, `large`).

## Create an organisation theme

The package ships Designsystemet's default theme as `@digdir/designsystemet-css/theme.css`. To generate your own, use the `@digdir/designsystemet` command-line tool with a `designsystemet.config.json` and follow the Designsystemet documentation for the config contents. The `tokens create` and `tokens build` subcommands are deprecated in favour of the config file. Import the generated CSS in place of the default theme.

## Accessibility

Contrast follows the theme Designsystemet generates. A theme with weak seed colors can fail WCAG AA, so run an accessibility check such as axe on your own theme.
