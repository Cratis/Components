# Getting Started

Every styling option shares the same one-line setup. The differences come from what you load **on top** of this baseline.

## Install

Install `@cratis/components`. PrimeReact and its icons ship as **bundled dependencies**, so they install automatically — there is nothing extra to add:

```bash
npm install @cratis/components
# or
yarn add @cratis/components
```

The heavier extras (`pixi.js` for `PivotViewer`, `framer-motion` for animated panels, `allotment` for the `DataPage` resizable layout) are bundled as regular dependencies too, so they come down with the package and modern bundlers tree-shake away the ones you never import. The real peers — `react`/`react-dom` 19+, `@cratis/arc*`, `reflect-metadata`, and `tsyringe` — already come with your Arc frontend.

## Wire the provider

Mount [`CratisComponentsProvider`](../Common/cratis-components-provider.md) once at the root of your tree. The provider is a thin wrapper around PrimeReact's own `PrimeReactProvider` and is where you configure `unstyled`, `pt`, `ptOptions`, `inputVariant`, `ripple`, `theme`, and the rest of PrimeReact 11's props — all through its single `value` prop:

```tsx
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

`@cratis/components/styles` ships the Tailwind utility classes used inside the package plus the `--cratis-*` CSS variable token layer that every internal Cratis surface reads from.

If you bring your own Tailwind setup and want only the token layer, import `@cratis/components/tokens` instead:

```tsx
import '@cratis/components/tokens';
```

## What's loaded so far

With nothing else, you've imported:

- The Tailwind utility classes used internally by Cratis wrappers (so layout, spacing, sizing all work)
- The `--cratis-*` token layer (so Cratis-scoped surfaces have a stable variable surface to read from)
- The provider that hosts `pt` / `unstyled` / locale / overlay z-index settings

That's enough for the wrappers to render structurally, but PrimeReact 11 is **unstyled-first**: widgets need a look applied before they resemble anything other than raw browser primitives. Choose the setup that matches how much visual control you need:

- [Use the Cratis baseline theme](baseline-theme.md) — the license-free default look
- [Use a PrimeReact theme](themed.md) — a styled `@primeuix/themes` preset (needs a PrimeUI license key)
- [Use a custom palette on top of a theme](custom-palette.md) — keep the theme's structure and supply your colors
- [Use fully unstyled mode](unstyled.md) — bring every visual yourself through `pt` / CSS

## Using `PrimeReactProvider` directly

`CratisComponentsProvider` is optional. If you'd rather mount `PrimeReactProvider` from `@primereact/core` directly, that works too — every Cratis wrapper reads the same context. The Cratis provider exists to give Cratis a single place to layer in defaults later without breaking consumers, and to keep the setup discoverable. See [CratisComponentsProvider](../Common/cratis-components-provider.md) for the full prop reference.
