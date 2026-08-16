# Migration — `@cratis/components` 2.x → 3.0 (PrimeReact 10 → 11)

`@cratis/components` 3.0 moves the library from PrimeReact 10 to **PrimeReact 11**. Most wrapper APIs survive unchanged, so many apps upgrade with the find-and-replace in [Import moves](#import-moves-removed-primereact-paths) plus the install and import changes in [PrimeReact is now a peer dependency](#primereact-is-now-a-peer-dependency) and [Stylesheets are now an explicit import](#stylesheets-are-now-an-explicit-import). This guide lists every change a consuming app can feel.

> [!IMPORTANT]
> **The three things you must do**, even if you change no component code:
>
> 1. **Install the PrimeReact peers yourself** — they are no longer our dependency.
> 2. **Import `@cratis/components/styles`** — component CSS no longer rides along with the JavaScript.
> 3. **Choose a theming path** — there is no `resources/themes/*.css` to import any more.

## PrimeReact is now a peer dependency

**This is the change most likely to break your install.** In 2.x, `primereact` was a regular `dependency` of `@cratis/components`, so your app got a copy whether it asked for one or not. That is exactly the problem: if your app also depended on `primereact`, npm could resolve **two copies**, and two copies of PrimeReact means two `PrimeReactProvider` React contexts. Components rendered from the library would read a different config, theme and z-index registry than components you render yourself — and the symptom is not an error, it is overlays stacking wrongly and `pt`/`unstyled` silently not applying. Apps were papering over this with a `resolutions` / `overrides` pin.

3.0 makes the requirement explicit instead. **You supply PrimeReact; we use yours.**

```bash
npm install @cratis/components primereact @primereact/core @primereact/headless primeicons
```

Which lands in your app's `dependencies` as:

```json
{
    "dependencies": {
        "primereact": "^11.0.0",
        "@primereact/core": "^11.0.0",
        "@primereact/headless": "^11.0.0",
        "primeicons": "^8.0.0"
    }
}
```

Notes:

- `primereact` pins `@primereact/core` and `@primereact/headless` to its own **exact** version, so installing `primereact@11.1.0` gives you 11.1.0 of all three. Declaring them anyway is what makes a strict installer (pnpm, Yarn PnP) resolve them for the library too.
- `primeicons` went **7 → 8** alongside PrimeReact 11.
- `@primereact/types` is an **optional** peer. You only need it declared if your own code imports our prop types (they re-export `@primereact/types/*` shapes). It arrives transitively via `@primereact/core` in a hoisting installer.
- `@primeuix/themes` is **not** a peer. Install it only if you want a styled preset — see [Theming without a theme stylesheet](#theming-without-a-theme-stylesheet).
- If your app carried a `resolutions` / `overrides` entry to collapse PrimeReact into one copy, **you can delete it** — the peer declaration is what enforces that now.

### Arc peer range is unchanged

`@cratis/arc` and `@cratis/arc.react` remain `>=20.3.1 <22`. Arc 20 and Arc 21 are both supported; 3.0 does **not** narrow this.

> [!WARNING]
> **Keep `@cratis/arc`, `@cratis/arc.react` and `@cratis/arc.vite` on the same version.** `@cratis/arc.react` depends on `@cratis/arc` with an **exact** pin, so if your own `@cratis/arc` drifts by even a patch your installer nests a second copy. `ObservableQuerySubscription` has a `private` field, which makes it nominally typed, so two copies produce a type error like *"types have separate declarations of a private property `_connection`"* in any code touching an observable query. This is an Arc packaging issue, not a Components one; `DataTableForObservableQuery` is hardened against it internally so the library itself still compiles either way ([#135](https://github.com/Cratis/Components/issues/135)).

## Stylesheets are now an explicit import

In 2.x, every component did `import './Foo.css'` and relied on your bundler injecting it. That put CSS files in the **JavaScript module graph**, which meant the published package could not be loaded by Node at all: 29 of the export subpath checks failed with `ERR_UNKNOWN_FILE_EXTENSION` / `ERR_UNSUPPORTED_DIR_IMPORT`, and no consumer whose test environment is `node` could render a `Dialog` or `CommandDialog` in a spec ([#118](https://github.com/Cratis/Components/issues/118)).

3.0 takes CSS out of the JavaScript graph entirely. Every export subpath now loads cleanly in Node. The cost is one explicit import in your app:

```diff
  // in your app entry point
+ import '@cratis/components/tokens';   // the --cratis-* token layer
+ import '@cratis/components/styles';   // all component CSS, in one file
+ import '@cratis/components/theme';    // optional — the license-free baseline look
```

Import them in that order. `styles` and `theme` both consume the tokens.

- `@cratis/components/styles` is new content, same specifier: in 2.x it resolved to only the compiled Tailwind utilities. It now contains those **plus every component stylesheet**.
- It also **vendors `allotment/dist/style.css`**, which `DataPage` needs for its split view to lay out (without it a details pane grows to its content and clips the paginator). If you were importing `allotment/dist/style.css` yourself, you can drop it.
- `SchemaEditor.module.css` is gone as a CSS Module. Its two classes are now plain, prefixed names (`cratis-schema-editor-navigable-row`, `cratis-schema-editor-bottom-border`) shipped in `styles`. This is internal, but noted in case you targeted the hashed names.

## ESM-only packaging

PrimeReact 11 is ESM-only, so `@cratis/components` dropped its CommonJS build. `main`, `module` and every `exports` entry point at `dist/esm`, and the package declares `"type": "module"`.

- If your app bundles with Vite / modern tooling (the Cratis default), **no change**.
- If something in your pipeline `require()`d the package, switch it to `import`.

## Import moves (removed `primereact/*` paths)

PrimeReact 11 ships **80** modules where v10 shipped 117. Replace the removed ones with the Cratis-owned equivalents — the authoring model is unchanged:

| Was (PrimeReact 10) | Now (3.0) |
|---|---|
| `import { Column } from 'primereact/column'` | `import { Column } from '@cratis/components/DataTables'` (also re-exported from `@cratis/components/DataPage`) |
| `import { StepperPanel } from 'primereact/stepperpanel'` | `import { StepperPanel } from '@cratis/components/CommandDialog'` |
| `import { Menubar } from 'primereact/menubar'` | `<DataPage.MenuItems>` for list-page actions; a `Button` toolbar of your own otherwise |
| `import { Dropdown } from 'primereact/dropdown'` | `import { Dropdown } from '@cratis/components/Dropdown'` |
| `primereact/calendar`, `primereact/inputtextarea`, `primereact/multiselect`, `primereact/chips`, `primereact/colorpicker` | consume through the [CommandForm fields](CommandForm/index.md) (`CalendarField`, `TextAreaField`, `MultiSelectField`, `ChipsField`, `ColorPickerField`) |
| `import { PrimeReactProvider } from 'primereact/api'` | `import { PrimeReactProvider } from '@primereact/core'` — or just use [`CratisComponentsProvider`](Common/cratis-components-provider.md) |

`<Column field="name" header="Name" sortable filter />` and `<StepperPanel header="…">` work exactly as before.

### If you import `primereact/*` directly anywhere

The full rename table, the removed-with-no-replacement list, and the `Sidebar` trap are on [PrimeReact and Components](coming-from-primereact.md#the-v11-module-renames). The short version: **v11 is compositional**, so a rename is often not a one-line edit — `primereact/select` exports `Select.Root` / `Select.Trigger` / `Select.Value` / `Select.Portal` / `Select.Popup` / `Select.List` / `Select.Option`, and you assemble them. Prefer a Cratis wrapper where one exists.

> [!CAUTION]
> **The `Sidebar` trap.** v10's `Sidebar` (an overlay drawer) is now **`primereact/drawer`**. `primereact/sidebar` still exists in v11 but is a **different, new app-shell primitive**. A name-preserving migration compiles cleanly and silently swaps your overlay for an app shell. Check every `Sidebar` usage by hand.

Where the library needed a removed module, it now owns a replacement: a Cratis action toolbar (for `menubar`, driven by the same `model` array shape and reached through `<DataPage.MenuItems>`), [`Column`](DataTables/column-configuration.md) plus its filter menu (for `column`), [`StepperPanel`](StepperCommandDialog/index.md) (for `stepperpanel`), and `MultiSelectField` re-expressed over our own [`Dropdown`](Dropdown/index.md) wrapper (v11's `Select` has no `multiple` prop of the v10 shape).

## Data-table selection event

The removed `DataTableSelectionSingleChangeEvent` is replaced by `DataTableSelectionChangeEvent<T>`. `event.value` (the selected row) is unchanged, so only the type import moves:

```diff
- import { DataTableSelectionSingleChangeEvent } from 'primereact/datatable';
- onSelectionChange={(e: DataTableSelectionSingleChangeEvent<Product[]>) => setSelected(e.value as Product)}
+ import type { DataTableSelectionChangeEvent } from '@cratis/components/DataTables';
+ onSelectionChange={(e: DataTableSelectionChangeEvent<Product>) => setSelected(e.value ?? undefined)}
```

Per-column filter menus (`<Column filter dataType="…" />`), a global search box, and a paginator range report are all restored — no API change to opt in beyond `filter`.

## Theming without a theme stylesheet

**PrimeReact 11 ships zero CSS.** `primereact/resources/themes/*.css` does not exist. Presets are plain **JavaScript token objects** (`@primeuix/themes` — Aura, Lara, Nora) that `@primeuix/styled` turns into `--p-*` custom properties **at runtime** when you hand one to the provider.

The chain is: **preset (JS) → `--p-*` (runtime) → `--cratis-*` (our token layer) → component CSS.** Our `--cratis-*` tokens resolve the v11 token first and fall back to the v10 variable, so an app that still has a compiled v10 theme on the page during its port keeps working, and nothing breaks the day it is removed.

Pick one of three paths — the [Styling](Styling/index.md) section walks each one:

**A. Unstyled-first (default, no license).** Ship structure plus the `--cratis-*` token layer and bring your own visuals via `pt` / CSS / Tailwind. Your existing `--surface-*` and `--cratis-*` overrides keep working.

```tsx
<CratisComponentsProvider value={{ unstyled: true, pt: myPreset }}>
```

**B. [The Cratis baseline theme](Styling/baseline-theme.md) (no license).** A license-free stylesheet that assigns the `--cratis-*` tokens directly, light and dark, for a polished default with no preset and no key. It defers to a preset's `--p-*` values when one is present.

```diff
- import 'primereact/resources/themes/lara-dark-blue/theme.css';
+ import '@cratis/components/theme';
```

**C. [A styled `@primeuix/themes` preset](Styling/themed.md) (license-gated — see below).**

```diff
- import 'primereact/resources/themes/lara-dark-blue/theme.css';
+ import Aura from '@primeuix/themes/aura';
  // …
- <CratisComponentsProvider>
+ <CratisComponentsProvider value={{ theme: { preset: Aura }, license: '…' }}>
```

`npm i @primeuix/themes` for this path only.

`CratisComponentsProvider` takes everything through its single `value` prop, which is deep-merged onto PrimeReact's provider config — `unstyled`, `pt`, `ptOptions`, `ripple`, `inputVariant`, `zIndex`, `locale`, `theme` and `license`. It also accepts a `toaster` prop (`true` or a `ToasterProps` object) to mount a `<Toaster />` for you.

## Dialog

[`Dialog`](Dialogs/dialog.md) / [`CommandDialog`](CommandDialog/index.md) / [`StepperCommandDialog`](StepperCommandDialog/index.md) keep their public APIs, including `initialFocus` (`DialogInitialFocus.Confirm | Cancel | Content`), which is re-expressed on v11's focus trap and behaves identically.

- **Added:** `dismissable` — whether the header close, backdrop click and `Escape` are offered. Defaults to "yes for a predefined `DialogButtons` set, no for a custom footer", matching v10's behavior; set it explicitly to keep a dismiss affordance with a custom footer.
- **Added:** `closeAriaLabel` for localizing the header close button.
- **No effect:** `resizable` is still accepted so call sites compile, but v11's headless dialog has no resize handle.

`StepperCommandDialog` keeps `showCancel` / `cancelLabel` (the opt-in footer Cancel), and still withdraws every dismissal — footer Cancel, header close and `Escape` — for the whole window a command is executing in.

## Overlay z-index workarounds are gone (and no longer needed)

2.x exported a `useOverlayZIndex` hook and passed `appendTo={document.body}` on every overlay-bearing field, because a v10 dropdown/calendar panel opened inside a modal dialog rendered *inside* the dialog's subtree and could land under its own mask.

**`useOverlayZIndex` is removed.** PrimeReact 11 does both natively: `Select.Portal` defaults to `appendTo: 'body'`, and the shared z-index registry gives a later-opened overlay a value above whatever is already registered. Measured on v11.1.0: with a dialog at z-index 1102, the select panel opens at **2103**, portaled to `document.body`. There is a regression spec (`Source/Dropdown/for_Dropdown/when_opened_inside_a_dialog.ts`) pinning this, so a future regression is caught rather than rediscovered.

If you called `useOverlayZIndex` in your own app for your own overlays, you will need to inline it — but check first whether v11 has already made it unnecessary for you too.

## Reduced capabilities (forced by PrimeReact 11)

A few v10 features have no v11 equivalent. The props are **kept so your code still compiles**, but they no longer do anything — remove them or adopt the alternative:

| Prop | What changed |
|---|---|
| `Dialog` `resizable` | v11's headless dialog has no resize handle — no effect. |
| `ChipsField` `separator` | v11 `InputTags` commits one tag per Enter; pasted input is no longer auto-split. |
| `MultiSelectField` `display` / `maxSelectedLabels` | v11 `Select` renders the selection through its value slot; the v10 comma/chip modes and label-collapse are gone. |
| `DataTableForQuery` / `DataTableForObservableQuery` / `DataPage` `clientFiltering` | Deprecated — filtering is always applied client-side to the loaded page; the toggle has no effect. |

Some wrappers also **narrowed their surface** (they no longer leak PrimeReact's full API):

- **`Column`** keeps the `field` / `header` / `body` / `sortable` / `filter` authoring model; v10 extras like `editor`, `frozen`, `footer`, `colSpan` and `expander` are not carried over.
- **`Dropdown`** exposes a curated single/multi select surface (`value`, `options`, `optionLabel` / `optionValue`, `placeholder`, `filter`, `multiple`, `showClear`, `style`, `id`, `name`, `aria-*`, …) plus `pt` / `ptOptions` / `unstyled` — it no longer accepts arbitrary PrimeReact Select props.
- The **`DataPage` action toolbar** replaces the v10 Menubar: `menubarPt` / `menubarPtOptions` / `menubarUnstyled` now target the toolbar's **buttons**, and the paginator is styled via `paginatorClassName` (+ `paginatorAriaLabels`), not `pt`.
- **`StepperCustomizationProps`** is now Cratis-owned (it no longer aliases PrimeReact's `StepperProps`). Same shape, minus the removed slots.

### If you write `pt` definitions or CSS selectors against PrimeReact internals

v11 is unstyled-first: with no preset applied, PrimeReact elements carry **no `p-*` class at all**. Parts are identified by data attributes instead — `[data-scope="dialog"][data-part="close"]`, `[data-scope="select"][data-part="trigger"]`, and so on. Selectors written against v10 class names will silently match nothing. (`pt` slot keys are unaffected.)

## What's new (nothing to migrate — just available)

- **[Notifications](Notifications/index.md)** — `Toaster`, the imperative `toast`, and `toastCommandResult(result)` to surface an Arc command result as the right toast (validation → per-field messages, exceptions → generic, never stack traces).
- **[Display](Display/index.md)** — `Tag`, `Badge`, `Chip`, `Skeleton`, `Avatar`, `ProgressBar`.
- **CommandForm fields** — [PasswordField](CommandForm/password-field.md), [ToggleSwitchField](CommandForm/toggle-switch-field.md), [RatingField](CommandForm/rating-field.md).
- **[AutoCommandForm](CommandForm/auto-command-form.md)** — generates a `CommandForm`'s fields from the command's own `propertyDescriptors`, with a `registerFieldTypeProvider` registry for custom types.
- **[`@cratis/components/theme`](Styling/baseline-theme.md)** — the license-free Cratis baseline theme.

## Licensing

PrimeReact 11 changed its licensing:

- **Unstyled core + the Cratis token layer + `pt` are free** — no key needed.
- **The styled `@primeuix/themes` presets are license-gated.** Applying a preset needs a **PrimeUI license key** (free community tier or paid); without one, PrimeReact shows an *"Invalid PrimeUI License"* banner in development **and** production. Supply your key through the provider: `value={{ license: '…' }}`.

**If you use unstyled-first (path A) or the Cratis baseline theme (path B), you need no license.** Only a bundled `@primeuix/themes` preset requires a (free or paid) PrimeUI key.
