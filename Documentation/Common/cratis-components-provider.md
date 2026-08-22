# CratisComponentsProvider

Single setup point for Cratis Components. Wraps PrimeReact's `PrimeReactProvider` so the package can layer Cratis-wide defaults on top of PrimeReact's pass-through and unstyled mechanisms while still letting the consumer take complete control.

## Purpose

- Hosts the PrimeReact `pt` / `unstyled` / `ptOptions` / `inputVariant` / `ripple` / `theme` / `defaults` / `zIndex` / `locale` configuration for every Cratis wrapper below it in the tree.
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

The `value` prop accepts the Cratis-owned `CratisComponentsConfig` shape. Common members include `unstyled`, `pt`, `ptOptions`, `inputVariant`, `ripple`, `locale`, `license` and `theme`; none of its public types import PrimeReact. Low-level options for the active renderer can be placed in `adapter`:

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { globalPt } from './pt-preset';

export const App = () => (
    <CratisComponentsProvider
        value={{
            unstyled: true,
            pt: globalPt,
            adapter: { customRendererOption: true },
        }}
    >
        <YourApp />
    </CratisComponentsProvider>
);
```

The `value` is deep-merged with the Cratis defaults (currently empty) so consumer settings always win. Renderer-specific options passed directly in `value` are still forwarded for source compatibility, but new code should put them under `adapter` so the renderer boundary stays explicit. Pass a stable reference (a module-level constant or a `useMemo` result) to avoid unnecessary re-renders.

## PrimeReact's styled mode

PrimeReact 11's primitives are unstyled: `theme: { preset }` on its own emits the `--p-*` design tokens but the elements carry no `p-*` class names, so a preset alone paints nothing. `styledMode()` from `@cratis/components/styled` returns the `theme` _and_ the `defaults` (`primeReactStyles`, PrimeReact's own component styles keyed by primitive name) the provider needs to apply PrimeReact's look to every primitive rendered under it — this library's and your own. Spread it into `value` next to your license key:

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { styledMode } from '@cratis/components/styled';

export const App = () => (
    <CratisComponentsProvider value={{ license: 'YOUR-PRIMEUI-KEY', ...styledMode() }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

It needs `@primereact/styles` and `@primeuix/themes` installed (optional peers). Options — `preset`, `darkModeSelector`, `cssLayer` — are on [Use PrimeReact's styled mode](../Styling/themed.md).

## Props

### `value`

`CratisComponentsConfig` — Cratis-owned, renderer-type-decoupled configuration. Named fields are stable Cratis names mapped to the active renderer, but renderer-shaped values such as `pt`, `theme`, `defaults` and `license` retain their current adapter semantics. Low-level extras belong under `adapter`; named fields win when the same key appears in both. Existing direct extras remain accepted and forwarded for source compatibility.

The most useful members:

| Member         | Purpose                                                                                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unstyled`     | When `true`, disables every PrimeReact base style. Combine with `pt` (or per-component CSS / Tailwind) to fully restyle.                                                                                                                                                          |
| `pt`           | Per-component pass-through configuration. Keys are PrimeReact component names (`button`, `dialog`, `inputtext`, …); values are slot configuration objects.                                                                                                                        |
| `ptOptions`    | Controls merge vs. replace behavior for `pt`. Default is `{ mergeSections: true }` which merges per-instance `pt` with the global preset.                                                                                                                                         |
| `inputVariant` | `'outlined'` or `'filled'` — switches the default input rendering across the whole app.                                                                                                                                                                                           |
| `theme`        | `{ preset, options }` — a `@primeuix/themes` preset and its options (`darkModeSelector`, `cssLayer`, …). Emits the `--p-*` design tokens; on its own it paints nothing, because the primitives carry no `p-*` class — pair it with `defaults`, which is what `styledMode()` does. |
| `defaults`     | Default props per PrimeReact component name. `styledMode()` uses it to hand every primitive PrimeReact's component styles (`primeReactStyles`), which is what puts the `p-*` class names on the elements the preset paints.                                                       |
| `license`      | Your PrimeUI license key, passed straight through to PrimeReact. Required whichever way you style — the check runs when the provider mounts — see [Styling](../Styling/index.md).                                                                                                 |
| `ripple`       | Enables PrimeReact's ripple animation on supported components.                                                                                                                                                                                                                    |
| `zIndex`       | Per-overlay-type z-index baseline (`{ modal: 1100, overlay: 1000, menu: 1000, tooltip: 1100 }`).                                                                                                                                                                                  |
| `locale`       | Active locale string.                                                                                                                                                                                                                                                             |
| `adapter`      | Low-level options for the active rendering adapter. Use this only when no stable named field exists; named fields take precedence.                                                                                                                                                |

The full Cratis-owned type is re-exported as `CratisComponentsConfig` and does not resolve to a PrimeReact type.

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

| Export                          | Description                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| `CratisComponentsProvider`      | The React component.                                                 |
| `CratisComponentsProviderProps` | Props type.                                                          |
| `CratisComponentsConfig`        | Cratis-owned provider configuration with an adapter extension point. |
| `cratisDefaults`                | The Cratis-wide defaults that ship today (currently `{}`).           |
| `mergeCratisComponentsConfig`   | Pure deep-merge helper used inside the provider.                     |

## See also

- [Styling Overview](../Styling/index.md) — the supported styling options and where the provider fits
- [Use PrimeReact's styled mode](../Styling/themed.md) — `styledMode()`, `CratisPreset` and the options
- [Pass-through cheat sheet](../Styling/pass-through.md) — what `pt` reaches in each Cratis wrapper
- [Use fully unstyled mode](../Styling/unstyled.md) — full `pt` preset walk-through
