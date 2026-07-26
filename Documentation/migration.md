# Migration — PrimeReact 10 → 11

`@cratis/components` moved from PrimeReact 10 to **PrimeReact 11**. Most wrapper APIs are unchanged, so many apps upgrade with only the find-and-replace below. This guide lists every change a consuming app might feel.

The short version: the package is now **ESM-only**; a handful of `primereact/*` imports moved to `@cratis/components/*`; and styled themes are applied via a `@primeuix/themes` preset (or the new Cratis baseline theme) instead of a `resources/themes/*.css` import. Read the [Licensing](#licensing) note at the end.

## ESM-only packaging

PrimeReact 11 is ESM-only, so `@cratis/components` dropped its CommonJS build.

- If your app already bundles with Vite or modern tooling (the Cratis default), no change is needed.
- If something in your pipeline `require()`d the package, switch it to `import`.

## Import moves (removed `primereact/*` paths)

PrimeReact 11 removed several modules. Replace them with the Cratis-owned equivalents — the authoring model is unchanged:

| Was (PrimeReact 10) | Now |
|---|---|
| `import { Column } from 'primereact/column'` | `import { Column } from '@cratis/components/DataPage'` (or `@cratis/components/DataTables`) |
| `import { StepperPanel } from 'primereact/stepperpanel'` | `import { StepperPanel } from '@cratis/components/CommandDialog'` |
| `import { Menubar } from 'primereact/menubar'` | use `<DataPage.MenuItems>` for list-page actions, or a `Button` toolbar |
| `import { Dropdown } from 'primereact/dropdown'` | `import { Dropdown } from '@cratis/components/Dropdown'` |
| `import { PrimeReactProvider } from 'primereact/api'` | `import { PrimeReactProvider } from '@primereact/core'` |

`<Column field="name" header="Name" sortable filter />` and `<StepperPanel header="…">` work exactly as before.

PrimeReact 11's `Button` also renders its content as **children** — the v10 `label`/`icon` props are gone:

```diff
- <Button label="Save" icon="pi pi-check" onClick={save} />
+ <Button onClick={save}><i className="pi pi-check" /> Save</Button>
```

## Data-table selection event

The removed `DataTableSelectionSingleChangeEvent` is replaced by `DataTableSelectionChangeEvent<T>`. The `event.value` (the selected row) is unchanged, so only the type import changes:

```diff
- import { DataTableSelectionSingleChangeEvent } from 'primereact/datatable';
- onSelectionChange={(e: DataTableSelectionSingleChangeEvent<Product[]>) => setSelected(e.value as Product)}
+ import type { DataTableSelectionChangeEvent } from '@cratis/components/DataTables';
+ onSelectionChange={(e: DataTableSelectionChangeEvent<Product>) => setSelected(e.value ?? undefined)}
```

Per-column filter menus (`<Column filter>`), a global search box, and a paginator range report are all available with no API change beyond `filter`.

## Theming — no more `resources/themes/*.css`

PrimeReact 11 removed the v10 theme stylesheets and is unstyled-first. Pick one of the [styling setups](Styling/index.md):

- **Unstyled-first (default, no license):** ship structure plus the `--cratis-*` token layer and bring your own visuals via `pt` / CSS / Tailwind. Your existing `--cratis-*` overrides keep working.
- **[Cratis baseline theme](Styling/baseline-theme.md) (no license):** `import '@cratis/components/theme'` plus `class="cratis-theme"` for a polished default look built entirely on the Cratis tokens.
- **A styled `@primeuix/themes` preset (license-gated — see below):**

```diff
- import 'primereact/resources/themes/lara-dark-blue/theme.css';
+ import Aura from '@primeuix/themes/aura';
  // …
- <CratisComponentsProvider>
+ <CratisComponentsProvider value={{ theme: { preset: Aura } }}>
```

Styling options are passed through the provider's single `value` prop — `value={{ theme: { preset } }}`, `value={{ unstyled: true }}`, `value={{ license: '…' }}` — never as direct props on `CratisComponentsProvider`.

## Dialog and Stepper

Existing `Dialog` / `CommandDialog` / `StepperCommandDialog` APIs are unchanged. `Dialog` gains an additive `dismissable` prop; `resizable` is accepted but has no effect (PrimeReact 11's headless dialog has no built-in resize handle). `CommandStepper` / `StepperCommandDialog` keep their public props, including `orientation`, `headerPosition`, and `start` / `end`.

## Reduced capabilities (forced by PrimeReact 11)

A few v10 features have no PrimeReact 11 equivalent. The props are kept so your code still compiles, but they no longer do anything — remove them or adopt the alternative:

| Prop | What changed |
|---|---|
| `Dialog` `resizable` | v11's headless dialog has no resize handle — no effect. |
| `ChipsField` `separator` | v11 `InputTags` commits one tag per Enter; pasted input is no longer auto-split into chips. |
| `MultiSelectField` `display` / `maxSelectedLabels` | v11 `Select` renders the selection through its value slot; the v10 comma/chip modes and label-collapse are gone. |
| `DataTableForQuery` / `DataTableForObservableQuery` / `DataPage` `clientFiltering` | Deprecated — filtering is always applied client-side to the loaded page; the toggle has no effect. |

Some wrappers also narrowed their surface (they no longer leak PrimeReact's full API): `Column` keeps `field` / `header` / `body` / `sortable` / `filter` (v10 extras like `editor`, `frozen`, `footer`, `colSpan`, `expander` are dropped); `Dropdown` exposes a curated single/multi select surface plus `pt` / `ptOptions` / `unstyled`; and the `DataPage` action toolbar replaces the v10 Menubar, so `menubarPt` now targets the toolbar's buttons and the paginator is styled via `paginatorClassName` (+ `paginatorAriaLabels`), not `pt`.

## What's new (nothing to migrate — just available)

- **[Notifications](Notifications/index.md)** — `Toaster`, the imperative `toast`, and `toastCommandResult(result)` to surface an Arc command result as a toast.
- **[Display](Display/index.md)** — `Tag`, `Badge`, `Chip`, `Skeleton`, `Avatar`, `ProgressBar`.
- **CommandForm fields** — [PasswordField](CommandForm/password-field.md), [ToggleSwitchField](CommandForm/toggle-switch-field.md), [RatingField](CommandForm/rating-field.md).

## Licensing

PrimeReact 11 changed its licensing:

- **Unstyled core + the Cratis token layer + `pt` are free** — no key needed.
- **The styled `@primeuix/themes` presets are license-gated.** Applying a preset needs a **PrimeUI license key** (free community tier or paid); without one, PrimeReact shows an *"Invalid PrimeUI License"* banner in dev **and** prod. Supply your key through the provider's `value`: `value={{ license: '…' }}`.

If you use unstyled-first or the Cratis baseline theme, you need no license. Only a bundled `@primeuix/themes` preset requires a (free or paid) PrimeUI key.
