---
title: Set up styling
description: Load Components CSS through a local stylesheet, choose a baseline or product theme, and verify structure and cascade order.
---

Use this after the package installation in [Getting started](../getting-started.mdx). Styles and providers solve different problems: CSS supplies structure and appearance; `CratisComponentsProvider` supplies UI configuration; `<Arc>` supplies the generated-proxy runtime.

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

`tokens` defines semantic `--cratis-*` defaults. `styles` provides structure, without Tailwind Preflight, a consumer reset, or copied token values. `theme` adds automatic dark mode, explicit `cratis-dark` / `cratis-light`, forced-colors tuning, and independently themed subtrees.

The built-in renderer needs no PrimeReact, PrimeIcons, PrimeUI theme, or vendor provider. Optional [renderer adapters](../renderers/index.md) have their own peer, provider, styling, and licensing responsibilities; do not copy their setup into a built-in-only application.

### TypeScript 6 and CSS imports

The package stylesheet subpaths ship no type declarations. Putting their imports in CSS avoids `TS2882` on direct TypeScript side-effect imports. Keep the bundler's local CSS types enabled: Vite projects normally reference `vite/client`. A non-Vite setup can declare `module '*.css'` in a project-included `.d.ts` file using this syntax:

```ts title="src/styles.d.ts"
declare module '*.css';
```

Existing direct imports remain supported if you declare the specific package stylesheet modules as shown in [Getting started](../getting-started.mdx#install-and-wire-it-up). Choose that alternative or CSS-first setup; do not remove the styles to silence the compiler.

## Choose who owns appearance

- **Cratis baseline:** retain `theme`, then choose system preference or explicit light/dark classes. See [Use the baseline theme](baseline-theme.md).
- **Product design system:** omit `theme`, map product values onto the semantic `--cratis-*` variables, and load product mappings after Components. See [Build a product theme](themed.md).

Source order is not the whole cascade contract. If your product declares cascade layers, include the Cratis layers in the first ordering declaration, below product utilities. See [Cascade contract](index.md#cascade-contract). Use [stable parts](pass-through.md), not internal React Aria classes or undocumented DOM selectors.

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

Load a field, table, and dialog. Check structure, readable foreground/background pairs, validation messages, and visible keyboard focus in the theme states your product supports. These are application checks, not an accessibility-conformance claim. If everything is unstyled, check that the local CSS file is imported and bundled; if only product overrides lose, inspect layer order. Continue with [Styling](index.md) or [Troubleshooting](../troubleshooting.md).
