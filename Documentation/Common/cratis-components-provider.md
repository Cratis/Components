# CratisComponentsProvider

Single setup point for Cratis Components. Wraps PrimeReact's `PrimeReactProvider` so the package can layer Cratis-wide defaults on top of PrimeReact's pass-through and unstyled mechanisms while still letting the consumer take complete control.

## Purpose

- Hosts the PrimeReact `pt` / `unstyled` / `ptOptions` / `inputStyle` / `ripple` / `appendTo` / `zIndex` / `locale` configuration for every Cratis wrapper below it in the tree.
- Deep-merges Cratis-wide defaults with the consumer's value, so future Cratis defaults can land without breaking consumer overrides.
- Re-exported from the package root so the recommended setup is one import:

  ```ts
  import { CratisComponentsProvider } from '@cratis/components';
  ```

## Basic usage

Mount once at the root of your tree:

```tsx
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

## Configuring `pt` / `unstyled` globally

The `value` prop accepts the full PrimeReact `APIOptions` shape. The most commonly used members are `unstyled`, `pt`, `ptOptions`, `inputStyle`, `ripple`, and `appendTo`:

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

`Partial<APIOptions>` — Cratis-wide and PrimeReact pass-through configuration. Merged on top of the library's defaults and made available to every Cratis component below in the tree.

The most useful members:

| Member | Purpose |
|---|---|
| `unstyled` | When `true`, disables every PrimeReact base style. Combine with `pt` (or per-component CSS / Tailwind) to fully restyle. |
| `pt` | Per-component pass-through configuration. Keys are PrimeReact component names (`button`, `dialog`, `inputtext`, …); values are slot configuration objects. |
| `ptOptions` | Controls merge vs. replace behavior for `pt`. Default is `{ mergeSections: true }` which merges per-instance `pt` with the global preset. |
| `inputStyle` | `'outlined'` or `'filled'` — switches the default input rendering across the whole app. |
| `ripple` | Enables PrimeReact's ripple animation on supported components. |
| `appendTo` | Where overlays mount (`document.body`, `'self'`, or a DOM ref). The Cratis `Dropdown` defaults to `document.body` independently of this setting. |
| `zIndex` | Per-overlay-type z-index baseline (`{ modal: 1100, overlay: 1000, … }`). |
| `locale` | PrimeReact locale string. |

The full type is re-exported as `CratisComponentsConfig`.

### `children`

`React.ReactNode` — your application tree.

## Using `PrimeReactProvider` directly

`CratisComponentsProvider` is optional. If you'd rather mount PrimeReact's own provider directly, that works too — every Cratis wrapper reads the same context:

```tsx
import { PrimeReactProvider } from 'primereact/api';

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
| `CratisComponentsConfig`        | Alias for `Partial<APIOptions>`. |
| `cratisDefaults`                | The Cratis-wide defaults that ship today (currently `{}`). |
| `mergeCratisComponentsConfig`   | Pure deep-merge helper used inside the provider. |

## See also

- [Styling Overview](../Styling/index.md) — three styling paths and where the provider fits
- [Pass-through cheat sheet](../Styling/pass-through.md) — what `pt` reaches in each Cratis wrapper
- [Path C — Fully unstyled](../Styling/unstyled.md) — full `pt` preset walk-through
