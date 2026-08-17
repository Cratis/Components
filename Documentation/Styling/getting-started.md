# Getting Started

Every styling option shares the same setup — an install, two stylesheet imports, and the provider. The differences come from what you load **on top** of that baseline.

## Install

From 3.0, **PrimeReact is a peer dependency, not a bundled one.** You install it alongside `@cratis/components`:

```bash
npm install @cratis/components primereact @primereact/core @primereact/headless primeicons
# or
yarn add @cratis/components primereact @primereact/core @primereact/headless primeicons
```

Why the extra names, when 2.x needed none? Because bundling PrimeReact meant an app that also depended on it could end up with **two copies** — and two copies of PrimeReact means two `PrimeReactProvider` React contexts. Components rendered from the library then read a different config, theme and z-index registry than the ones you render yourself. Nothing errors; overlays just stack wrongly and `pt` / `unstyled` silently stop applying. Declaring the peer is what collapses it to one copy, so **if you carried a `resolutions` / `overrides` pin for `primereact` to work around this, you can delete it.**

Two more notes:

- `primeicons` went **7 → 8** alongside PrimeReact 11.
- `primereact` pins `@primereact/core` and `@primereact/headless` to its own exact version, so all three land on the same release. Declaring them anyway is what makes a strict installer (pnpm, Yarn PnP) resolve them for the library too.
- `@primereact/styles` and `@primeuix/themes` are **optional** peers — install them only for [PrimeReact's styled mode](themed.md). The baseline theme and unstyled mode need neither.

The heavier extras (`pixi.js` for `PivotViewer`, `framer-motion` for animated panels, `allotment` for the `DataPage` resizable layout) are still regular dependencies, so they come down with the package and modern bundlers tree-shake away the ones you never import. The remaining peers — `react`/`react-dom` 19+, `@cratis/arc*`, `reflect-metadata`, and `tsyringe` — already come with your Arc frontend.

## Import the stylesheets

Components no longer import their own CSS. In 2.x every component did `import './Foo.css'`, which put stylesheets in the JavaScript module graph and made the published package unloadable by Node — no consumer whose test environment is `node` could render a `Dialog` in a spec. 3.0 takes CSS out of that graph entirely, and the cost is one explicit import block in your app entry point:

```ts
import '@cratis/components/tokens';   // the --cratis-* token layer
import '@cratis/components/styles';   // every component stylesheet, in one file
import '@cratis/components/theme';    // optional — the Cratis baseline look (MIT CSS)
```

Import them in that order: `styles` and `theme` both consume the tokens.

- **`tokens`** declares the `--cratis-*` CSS variables every Cratis surface reads from. Always import it.
- **`styles`** is the component CSS plus the Tailwind utilities the package uses internally. It also vendors `allotment/dist/style.css`, which `DataPage` needs for its split view to lay out — if you were importing that yourself, you can drop it. Note that `styles` is *new content behind the same specifier*: in 2.x it resolved to only the compiled Tailwind utilities.
- **`theme`** is optional — see [Use the Cratis baseline theme](baseline-theme.md).

## Wire the provider

Mount [`CratisComponentsProvider`](../Common/cratis-components-provider.md) once at the root of your tree. The provider is a thin wrapper around PrimeReact's own `PrimeReactProvider` and is where you configure `unstyled`, `pt`, `ptOptions`, `inputVariant`, `ripple`, `zIndex`, `locale`, `theme`, `defaults` and `license` — all through its single `value` prop:

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

## What's loaded so far

With nothing else, you've imported:

- The `--cratis-*` token layer (so Cratis-scoped surfaces have a stable variable surface to read from)
- Every component stylesheet, plus the Tailwind utility classes used internally by Cratis wrappers (so layout, spacing, sizing all work)
- The provider that hosts `pt` / `unstyled` / locale / overlay z-index settings

That's enough for the wrappers to render structurally, but PrimeReact 11 is **unstyled-first**: widgets need a look applied before they resemble anything other than raw browser primitives. Choose the setup that matches how much visual control you need:

- [Use the Cratis baseline theme](baseline-theme.md) — the default look, no preset needed
- [Use PrimeReact's styled mode](themed.md) — `styledMode()`: a `@primeuix/themes` preset plus PrimeReact's own component styles
- [Use a custom palette on top of a theme](custom-palette.md) — keep the theme's structure and supply your colors
- [Use fully unstyled mode](unstyled.md) — bring every visual yourself through `pt` / CSS

## Using `PrimeReactProvider` directly

`CratisComponentsProvider` is optional. If you'd rather mount `PrimeReactProvider` from `@primereact/core` directly, that works too — every Cratis wrapper reads the same context. The Cratis provider exists to give Cratis a single place to layer in defaults later without breaking consumers, and to keep the setup discoverable. See [CratisComponentsProvider](../Common/cratis-components-provider.md) for the full prop reference.
