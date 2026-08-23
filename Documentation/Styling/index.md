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
| Product with its own tokens, such as Ada            | `tokens`, `styles`, then product CSS                                        | Omit `theme`; map the complete product palette to `--cratis-*`; keep product typography, spacing, motion, contrast, and component treatments. |
| Existing app migrating gradually from PrimeReact    | `tokens`, `styles`, optional `theme`, plus the product's existing Prime CSS | Mount Components and Prime providers independently. Keep Prime styling and licensing only for direct Prime surfaces until they are removed.   |
| Independently themed embedded surface               | `tokens`, `styles`, `theme`                                                 | Put `cratis-theme` on the subtree and add `cratis-dark` or `cratis-light` there.                                                              |

Read [Use the baseline theme](baseline-theme.md), [Build a product theme](themed.md), [Own all styling](unstyled.md), and [Stable component parts](pass-through.md) for the corresponding implementation.

## Cascade contract

The structural bundle declares low-priority `cratis-theme`, `cratis-components`, and `cratis-utilities` layers. Internal Tailwind-generated utility selectors are prefixed (`cratis:*`) and are not public styling hooks. Product CSS written outside a layer wins over all three without specificity tricks. If the product uses its own cascade layers, declare their order explicitly after the Components imports. Components does not inject Preflight, reset headings/forms/lists, or copy token values into `styles`.

Import product mappings and overrides after Components:

```ts
import '@cratis/components/tokens';
import '@cratis/components/styles';
import './product-components.css';
```

React Aria is internal. Never style React Aria class names or undocumented DOM structure.
