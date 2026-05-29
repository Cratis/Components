# Getting Started

Every styling path shares the same one-line setup. The differences come from what you load **on top** of this baseline.

## Install

Install `@cratis/components` along with the required PrimeReact peer dependencies. You only need to add them to your own `package.json` once; npm/yarn won't pull them in transitively:

```bash
npm install @cratis/components primereact primeicons
# or
yarn add @cratis/components primereact primeicons
```

The optional peers (`pixi.js`, `framer-motion`, `allotment`) are only required when you use the corresponding component:

| Component | Optional peer |
|---|---|
| `PivotViewer` | `pixi.js` (canvas) and `framer-motion` (animated panels) |
| `DataPage` resizable layout | `allotment` |

## Wire the provider

Mount [`CratisComponentsProvider`](../Common/cratis-components-provider.md) once at the root of your tree. The provider is a thin wrapper around PrimeReact's own `PrimeReactProvider` and is where you configure `unstyled`, `pt`, `ptOptions`, `inputStyle`, `ripple`, `appendTo`, and the rest of PrimeReact's API options:

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

That's enough for the wrappers to render structurally, but PrimeReact widgets need **either** a theme (Path A or B) or `unstyled: true` + a `pt` preset (Path C) to look like anything other than raw browser primitives. Pick your path:

- [Path A — PrimeReact-themed](themed.md) — load a theme stylesheet and start tweaking
- [Path B — Custom palette](custom-palette.md) — same theme, your colors
- [Path C — Fully unstyled](unstyled.md) — bring everything yourself

## Using `PrimeReactProvider` directly

`CratisComponentsProvider` is optional. If you'd rather mount `PrimeReactProvider` from `primereact/api` directly, that works too — every Cratis wrapper reads the same context. The Cratis provider exists to give Cratis a single place to layer in defaults later without breaking consumers, and to keep the setup discoverable. See [CratisComponentsProvider](../Common/cratis-components-provider.md) for the full prop reference.
