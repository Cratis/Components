# Migrating `@cratis/components` v0.1 → v0.2 (PrimeReact 10 → 11)

`@cratis/components` 0.2 moves from PrimeReact 10 to **PrimeReact 11**. Most
wrapper APIs are unchanged, so many apps upgrade with only the find-and-replace
below. This guide lists every change a consuming app might feel.

> **TL;DR:** the package is now **ESM-only**; a handful of `primereact/*` imports
> moved to `@cratis/components/*`; and styled themes are applied via a
> `@primeuix/themes` preset (or the new Cratis baseline theme) instead of a
> `resources/themes/*.css` import. See **Licensing** at the bottom.

---

## 1. ESM-only packaging

PrimeReact 11 is ESM-only, so `@cratis/components` dropped its CommonJS build.

- If your app already bundles with Vite / modern tooling (the Cratis default),
  **no change is needed**.
- If something in your pipeline `require()`d the package, switch it to `import`.

## 2. Import moves (removed `primereact/*` paths)

PrimeReact 11 removed several modules. Replace them with the Cratis-owned
equivalents — the authoring model is unchanged:

| Was (PrimeReact 10) | Now (v0.2) |
|---|---|
| `import { Column } from 'primereact/column'` | `import { Column } from '@cratis/components/DataPage'` (or `@cratis/components/DataTables`) |
| `import { StepperPanel } from 'primereact/stepperpanel'` | `import { StepperPanel } from '@cratis/components/CommandDialog'` |
| `import { Menubar } from 'primereact/menubar'` | use `<DataPage.MenuItems>` for list-page actions, or a `Button` toolbar |
| `import { Dropdown } from 'primereact/dropdown'` | `import { Dropdown } from '@cratis/components/Dropdown'` |
| `primereact/calendar`, `primereact/inputtextarea` | used internally; consume via the `CommandForm` fields (`CalendarField`, `TextAreaField`) |

`<Column field="name" header="Name" sortable filter />` and
`<StepperPanel header="…">` work exactly as before.

## 3. Data-table selection event

The removed `DataTableSelectionSingleChangeEvent` is replaced by
`DataTableSelectionChangeEvent<T>`. The `event.value` (the selected row) is
unchanged, so only the type import changes:

```diff
- import { DataTableSelectionSingleChangeEvent } from 'primereact/datatable';
- onSelectionChange={(e: DataTableSelectionSingleChangeEvent<Product[]>) => setSelected(e.value as Product)}
+ import type { DataTableSelectionChangeEvent } from '@cratis/components/DataTables';
+ onSelectionChange={(e: DataTableSelectionChangeEvent<Product>) => setSelected(e.value ?? undefined)}
```

`<Column filter>` per-column filter menus, a global search box, and a paginator
range report are all restored/added — no API change to opt in beyond `filter`.

## 4. Theming — no more `resources/themes/*.css`

PrimeReact 11 removed the v10 theme stylesheets. Pick one:

- **Unstyled-first (default, no license):** ship structure + the `--cratis-*`
  token layer and bring your own visuals via `pt` / CSS / Tailwind. Your existing
  `--surface-*` / `--cratis-*` overrides keep working.
- **Cratis baseline theme (no license):** `import '@cratis/components/theme'` for
  a polished default look built entirely on the Cratis tokens.
- **A styled `@primeuix/themes` preset (license-gated — see below):**

  ```diff
  - import 'primereact/resources/themes/lara-dark-blue/theme.css';
  + import Aura from '@primeuix/themes/aura';
    // …
  - <CratisComponentsProvider>
  + <CratisComponentsProvider theme={{ preset: Aura }}>
  ```

If you dropped in the raw `PrimeReactProvider`, it now comes from
`@primereact/core` (not `primereact/api`).

## 5. Dialog

Existing `Dialog` / `CommandDialog` / `StepperCommandDialog` APIs are unchanged.
`Dialog` gains an additive `dismissable` prop; `resizable` is accepted but has no
effect (PrimeReact 11's headless dialog has no built-in resize handle).

## 6. Stepper

`CommandStepper` / `StepperCommandDialog` keep their public props, including
`orientation` (horizontal/vertical), `headerPosition`, and `start` / `end`. The
`StepperCustomizationProps` type is now Cratis-owned (it no longer aliases
PrimeReact's `StepperProps`) — if you imported it, the shape is the same minus
the removed slots.

## 7. What's new (nothing to migrate — just available)

- **`@cratis/components/Notifications`** — `Toaster`, the imperative `toast`, and
  `toastCommandResult(result)` to surface an Arc command result as a toast.
- **`@cratis/components/Display`** — `Tag`, `Badge`, `Chip`, `Skeleton`,
  `Avatar`, `ProgressBar`.
- **CommandForm fields** — `PasswordField`, `ToggleSwitchField`, `RatingField`.

---

## Licensing (read this)

PrimeReact 11 changed its licensing:

- **Unstyled core + the Cratis token layer + `pt` are free** — no key needed.
- **The styled `@primeuix/themes` presets are license-gated.** Applying a preset
  needs a **PrimeUI license key** (free community tier or paid); without one,
  PrimeReact shows an *"Invalid PrimeUI License"* banner in dev **and** prod.
  Supply your key through `CratisComponentsProvider`'s `license` prop.

**If you use unstyled-first or the Cratis baseline theme, you need no license.**
Only a bundled `@primeuix/themes` preset requires a (free or paid) PrimeUI key.
