---
title: Cratis Components styling choices
description: Style Cratis Components with CSS tokens and structural styles, then choose the baseline theme or map your product's own design system.
---

Cratis Components needs token defaults and structural CSS to lay out its controls. Add the optional baseline theme for Cratis appearance and dark mode, or map your design system onto the same CSS variables to keep your product's appearance.

The package publishes these separately so you can choose who owns the design:

- `@cratis/components/tokens` defines the semantic `--cratis-*` tokens: CSS variables for roles such as action colors, surfaces, and focus rings, with light defaults.
- `@cratis/components/styles` supplies component structure and internal utility rules. It contains no token copy, Tailwind Preflight, or global reset.
- `@cratis/components/theme` adds document and subtree foreground/background values, automatic or explicit dark mode, and forced-colors behavior.

```css title="src/index.css"
@import '@cratis/components/tokens';
@import '@cratis/components/styles';
@import '@cratis/components/theme'; /* optional baseline */
```

Import `./index.css` once from your application entry. Prefer this CSS-first path on TypeScript 6: the package stylesheet subpaths have no type declarations, so direct TypeScript imports can produce `TS2882`. Keep your bundler's types for local CSS imports enabled. [Set up styling](getting-started.md) covers this and the alternative declarations for existing direct imports.

If your product already has a design system, omit `theme` and map its values onto `--cratis-*`. For individual component treatments, use stable parts: named elements exposed through `data-cratis-part` attributes and the `pt` prop.

`styles` contains the whole library's CSS. An application using only a few surfaces can instead load `@cratis/components/styles/base` and one `<subpath>/styles` entry per surface. Each area includes its internal structural dependencies; the shared base still contains the library's internal utilities. See [Per-area stylesheets](per-area-stylesheets.md) before choosing the narrower imports.

## Choose a path

| Situation                                           | Imports                                                                     | Product responsibility                                                                                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| New app that wants the maintained Cratis appearance | `tokens`, `styles`, `theme`                                                 | Choose `cratis-dark`, `cratis-light`, or system preference; override only intentional brand values.                                           |
| Product with its own `--product-*` tokens           | `tokens`, `styles`, then product CSS                                        | Omit `theme`; map the complete product palette to `--cratis-*`; keep product typography, spacing, motion, contrast, and component treatments. |
| Existing app migrating gradually from PrimeReact    | `tokens`, `styles`, optional `theme`, plus the product's existing Prime CSS | Mount Components and Prime providers independently. Keep Prime styling and licensing only for direct Prime surfaces until they are removed.   |
| Independently themed embedded surface               | `tokens`, `styles`, `theme`                                                 | Put `cratis-theme` on the subtree and add `cratis-dark` or `cratis-light` there.                                                              |

For a first setup, follow [Set up styling](getting-started.md). Then use [the baseline theme](baseline-theme.md) for Cratis appearance or [build a product theme](themed.md) from your existing design tokens. [Own all styling](unstyled.md) explains the responsibilities you take on without the baseline, and [Stable component parts](pass-through.md) covers individual controls. Any row may substitute [per-area stylesheets](per-area-stylesheets.md) for `styles`.

## Cascade contract

The structural bundle declares three CSS cascade layers: `cratis-theme`, `cratis-components`, and `cratis-utilities`. Layers set precedence before selector specificity is considered. For normal declarations, product CSS outside a layer takes precedence over all three. Internal Tailwind-generated utility selectors are prefixed (`cratis:*`) and are not public styling hooks. Components does not apply Preflight or reset headings, forms, and lists.

If your product uses layers too, establish their order together. The first declaration fixes precedence; later layers win for normal declarations. For example, a Tailwind host that declares `@layer properties, theme, base, components, utilities;` before loading Components puts the subsequently declared Cratis layers after its own utilities. A utility class passed through `pt` can then lose to a component rule.

Include the Cratis names in that first declaration. Put them after the product reset and before product components and utilities:

```css
/* Parsed before any stylesheet, e.g. an inline <style> in the host document. */
@layer properties, theme, base, cratis-theme, cratis-components, cratis-utilities, components, utilities;
```

Declaring the same names again later, as the `styles` bundle does, never changes an order already fixed. The per-area entry points declare no order at all: only `@cratis/components/styles/base` establishes it, and every area sheet just reopens `cratis-components`.

Token overrides follow a different rule. `tokens` and `theme` declare their CSS variables outside cascade layers. Write product token overrides outside layers too; selector specificity then decides which value wins, followed by source order when specificity ties. Without `theme`, a later `:root` mapping overrides the defaults. With `theme`, a plain `:root` override does not cover explicit scheme selectors or themed subtrees. [Customize the palette](custom-palette.md) shows how to match the baseline selectors in light and dark mode.

Import product mappings and overrides after Components:

```css title="src/index.css"
@import '@cratis/components/tokens';
@import '@cratis/components/styles';
@import './product-components.css';
```

React Aria is internal. Never style React Aria class names or undocumented DOM structure.

## Verify the chosen posture

Check a field, table, and dialog in the application. With the baseline, include light, dark, and forced-colors states. With product-owned mappings, check foreground/background pairs, visible focus, disabled controls, and validation errors. These checks remain application responsibilities; the styling contracts do not establish accessibility conformance.

If a surface has no layout, verify that its structural CSS is loaded. If product utilities lose, inspect the first cascade-layer declaration before increasing specificity. If a brand color disappears in dark mode, compare your token selectors with the baseline's selectors. [Troubleshooting](../troubleshooting.md) helps distinguish styling symptoms from query or provider failures.

## See also

- [Troubleshooting](../troubleshooting.md) — installation, styling, rendering, and form symptoms, including product CSS precedence
