---
title: Set up Cratis Components styling
description: Load Cratis Components CSS through a local stylesheet, choose baseline or product appearance, and check layout, dark mode, and override order.
---

Load Cratis Components styles once through a local CSS file to give fields, tables, and dialogs their layout and appearance. This setup follows the package installation in [Getting started](../getting-started.mdx); you can keep the baseline theme initially or use your product's design system.

## Load the CSS once

Create a stylesheet in your frontend and keep the package imports in this order:

```css title="src/index.css"
@import '@cratis/components/tokens';
@import '@cratis/components/styles';
@import '@cratis/components/theme'; /* optional baseline */
```

Then import the local file from your application entry:

```ts title="Excerpt: src/main.tsx"
import 'reflect-metadata';
import './index.css';
```

`tokens` defines the `--cratis-*` CSS variables that controls use for colors, surfaces, and other design values. `styles` provides layout and interaction-state rules without Tailwind Preflight, a global reset, or copied token values. Keep `theme` for automatic dark mode, explicit `cratis-dark` / `cratis-light` classes, forced-colors tuning, and independently themed subtrees.

CSS does not replace the providers from the installation guide. `CratisComponentsProvider` supplies UI configuration, while `<Arc>` supplies the generated-proxy runtime. Neither loads these styles for you.

The built-in renderer needs no PrimeReact, PrimeIcons, PrimeUI theme, or vendor provider. If you choose a [renderer adapter](../renderers/index.md), follow its own dependency, provider, styling, and licensing requirements.

### TypeScript 6 and CSS imports

The package stylesheet subpaths ship no type declarations, so direct TypeScript side-effect imports can produce `TS2882` in TypeScript 6. Keeping those package imports inside CSS avoids that diagnostic. Your local `./index.css` import still needs the bundler's CSS types: Vite projects normally reference `vite/client`. A non-Vite setup can add this declaration in a project-included `.d.ts` file:

```ts title="src/styles.d.ts"
declare module '*.css';
```

Existing direct imports remain supported if you declare the specific package stylesheet modules as shown in [Getting started](../getting-started.mdx#install-and-wire-it-up). Choose that alternative or CSS-first setup; do not remove the styles to silence the compiler.

## Choose who owns appearance

Retain `theme` when you want the Cratis baseline appearance. It follows the system's color preference unless you apply explicit light or dark classes; [Use the baseline theme](baseline-theme.md) explains both choices.

For an existing product design system, omit `theme` and load your `--cratis-*` mappings after Components. [Build a product theme](themed.md) shows how to connect your design values to the controls.

If your product uses CSS cascade layers, include the Cratis layers in the first ordering declaration, before product utilities so those utilities can override normal component rules. See [Cascade contract](index.md#cascade-contract). For individual controls, use [stable parts](pass-through.md) instead of internal React Aria classes or undocumented DOM selectors.

## Import only the surfaces you mount

The whole `styles` bundle is simplest initially. To use per-area CSS, replace it with the shared base and one entry per mounted surface:

```css title="src/index.css"
@import '@cratis/components/tokens';
@import '@cratis/components/styles/base';
@import '@cratis/components/Dialogs/styles';
@import '@cratis/components/DataTables/styles';
```

Each `<subpath>/styles` includes its internal structural dependencies. This example covers dialogs and tables, not every field or page used by the library tutorial. Add the entries for all surfaces you mount; see [Per-area stylesheets](per-area-stylesheets.md). The optional `theme` can be used with either structural path.

## Check in the application

Open a page with a field, table, and dialog. The controls should have layout, readable text, and a visible keyboard-focus indicator. Check validation messages and the light, dark, or forced-colors states your product supports; this does not establish application-wide accessibility conformance.

If everything is unstyled, check that the local CSS file is imported and bundled. If only one surface lacks layout, check its per-area import. When product overrides lose, inspect layer order for structural rules and selector specificity for tokens. Continue with the [styling choices](index.md) to refine the design, or use [Troubleshooting](../troubleshooting.md) if the styles still do not appear.
