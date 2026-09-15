---
title: Styling
description: Style Components with Cratis tokens, structural CSS, and stable parts.
---

Components separates behavior from product appearance through three independently published Cratis-owned layers:

1. `@cratis/components/tokens` defines the semantic `--cratis-*` seam with conservative light defaults.
2. `@cratis/components/styles` supplies component structure and only the internal utility rules Components uses. It contains no token copy and no Tailwind Preflight or global reset.
3. `@cratis/components/theme` optionally adds document/subtree foreground and background, automatic or explicit dark mode, and forced-colors behavior.

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme';
```

A product design system omits `theme`, maps its canonical values directly onto `--cratis-*`, and uses stable parts for component-specific treatment.

## Choose a path

| Situation                                           | Imports                                                                     | Product responsibility                                                                                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| New app that wants the maintained Cratis appearance | `tokens`, `styles`, `theme`                                                 | Choose `cratis-dark`, `cratis-light`, or system preference; override only intentional brand values.                                           |
| Product with its own `--product-*` tokens           | `tokens`, `styles`, then product CSS                                        | Omit `theme`; map the complete product palette to `--cratis-*`; keep product typography, spacing, motion, contrast, and component treatments. |
| Existing app migrating gradually from PrimeReact    | `tokens`, `styles`, optional `theme`, plus the product's existing Prime CSS | Mount Components and Prime providers independently. Keep Prime styling and licensing only for direct Prime surfaces until they are removed.   |
| Independently themed embedded surface               | `tokens`, `styles`, `theme`                                                 | Put `cratis-theme` on the subtree and add `cratis-dark` or `cratis-light` there.                                                              |

Read [Use the baseline theme](baseline-theme.md), [Build a product theme](themed.md), [Own all styling](unstyled.md), and [Stable component parts](pass-through.md) for the corresponding implementation.

## Cascade contract

The structural bundle declares `cratis-theme`, `cratis-components`, and `cratis-utilities` layers. Internal Tailwind-generated utility selectors are prefixed (`cratis:*`) and are not public styling hooks. Product CSS written outside a layer wins over all three without specificity tricks. Components does not inject Preflight, reset headings/forms/lists, or copy token values into `styles`.

The three layers are low-priority only where the product says so. Cascade-layer order is the order of first declaration, so a product that declares its own layers — a Tailwind host, for example, with `@layer properties, theme, base, components, utilities;` parsed before any stylesheet — and then imports `styles` gets the `cratis-*` layers appended *after* its own, which ranks a component stylesheet above every product utility. A `pt` class then loses to the component's own rule. Name the Components layers in that first `@layer` statement, in the position you want them: above the product reset so Preflight cannot strip a component, below the product utilities so a `pt` utility wins.

```css
/* Parsed before any stylesheet, e.g. an inline <style> in the host document. */
@layer properties, theme, base, cratis-theme, cratis-components, cratis-utilities, components, utilities;
```

Declaring the same names again later, as the `styles` bundle does, never changes an order already fixed.

Import product mappings and overrides after Components:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import './product-components.css';
```

React Aria is internal. Never style React Aria class names or undocumented DOM structure.

## See also

- [Troubleshooting](../troubleshooting.md) — installation, styling, rendering, and form symptoms, including product CSS precedence
