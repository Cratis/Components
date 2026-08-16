# CratisComponentsProvider

Single setup point for Cratis Components. Wraps PrimeReact's `PrimeReactProvider` so the package can layer Cratis-wide defaults on top of PrimeReact's pass-through and unstyled mechanisms while still letting the consumer take complete control.

## Purpose

- Hosts the PrimeReact `pt` / `unstyled` / `ptOptions` / `inputVariant` / `ripple` / `theme` / `zIndex` / `locale` configuration for every Cratis wrapper below it in the tree.
- Deep-merges Cratis-wide defaults with the consumer's value, so future Cratis defaults can land without breaking consumer overrides.
- Re-exported from the package root so the recommended setup is one import:

  ```ts
  import { CratisComponentsProvider } from '@cratis/components';
  ```

## Basic usage

Mount once at the root of your tree:

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

## Configuring `pt` / `unstyled` globally

The `value` prop accepts PrimeReact 11's `Partial<PrimeReactProps>` shape. The most commonly used members are `unstyled`, `pt`, `ptOptions`, `inputVariant`, `ripple`, and `theme`:

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { globalPt } from './pt-preset';

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

The `value` is deep-merged with the Cratis defaults (currently empty) so consumer settings always win. Pass a stable reference (a module-level constant or a `useMemo` result) to avoid unnecessary re-renders.

## Props

### `value`

`Partial<PrimeReactProps>` — Cratis-wide and PrimeReact pass-through configuration. Merged on top of the library's defaults and made available to every Cratis component below in the tree.

The most useful members:

| Member | Purpose |
|---|---|
| `unstyled` | When `true`, disables every PrimeReact base style. Combine with `pt` (or per-component CSS / Tailwind) to fully restyle. |
| `pt` | Per-component pass-through configuration. Keys are PrimeReact component names (`button`, `dialog`, `inputtext`, …); values are slot configuration objects. |
| `ptOptions` | Controls merge vs. replace behavior for `pt`. Default is `{ mergeSections: true }` which merges per-instance `pt` with the global preset. |
| `inputVariant` | `'outlined'` or `'filled'` — switches the default input rendering across the whole app. |
| `theme` | `{ preset, options }` — opt into a styled `@primeuix/themes` preset (e.g. `import Aura from '@primeuix/themes/aura'`). Applying a preset requires a PrimeUI `license` key; the license-free paths are the unstyled core and the Cratis baseline theme. |
| `license` | Your PrimeUI license key, passed straight through to PrimeReact. Required for the styled `@primeuix/themes` presets — see [Styling](../Styling/index.md). |
| `ripple` | Enables PrimeReact's ripple animation on supported components. |
| `zIndex` | Per-overlay-type z-index baseline (`{ modal: 1100, overlay: 1000, menu: 1000, tooltip: 1100 }`). |
| `locale` | PrimeReact locale string. |

The full type is re-exported as `CratisComponentsConfig`.

### `toaster`

`boolean | ToasterProps` — when set, mounts a [`Toaster`](../Notifications/index.md) inside the provider so the imperative `toast(...)` works app-wide with no extra setup. Pass `true` for the defaults, or a `ToasterProps` object to position and configure it:

```tsx
<CratisComponentsProvider toaster={{ position: 'bottom-right', limit: 5 }}>
    <YourApp />
</CratisComponentsProvider>
```

Unlike `value`, this is a direct prop on `CratisComponentsProvider` — it is not part of PrimeReact's config.

### `children`

`React.ReactNode` — your application tree.

## Using `PrimeReactProvider` directly

`CratisComponentsProvider` is optional. If you'd rather mount PrimeReact's own provider directly, that works too — every Cratis wrapper reads the same context:

```tsx
import { PrimeReactProvider } from '@primereact/core';

export const App = () => (
    <PrimeReactProvider value={{ unstyled: true, pt: globalPt }}>
        <YourApp />
    </PrimeReactProvider>
);
```

The Cratis provider exists to give Cratis one place to layer in defaults later without breaking consumers, and to keep the setup discoverable from a single import path.

## Pure helpers (testing / library extension)

The merge logic is exported so the contract can be verified without rendering React:

```ts
import { mergeCratisComponentsConfig, cratisDefaults } from '@cratis/components';

const merged = mergeCratisComponentsConfig({ unstyled: true, pt: myPt });
// → { ...cratisDefaults, unstyled: true, pt: myPt }
```

| Export | Description |
|---|---|
| `CratisComponentsProvider`     | The React component. |
| `CratisComponentsProviderProps` | Props type. |
| `CratisComponentsConfig`        | Alias for `Partial<PrimeReactProps>`. |
| `cratisDefaults`                | The Cratis-wide defaults that ship today (currently `{}`). |
| `mergeCratisComponentsConfig`   | Pure deep-merge helper used inside the provider. |

## See also

- [Styling Overview](../Styling/index.md) — the supported styling options and where the provider fits
- [Pass-through cheat sheet](../Styling/pass-through.md) — what `pt` reaches in each Cratis wrapper
- [Use fully unstyled mode](../Styling/unstyled.md) — full `pt` preset walk-through
