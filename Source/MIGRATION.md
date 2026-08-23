# Migrating `@cratis/components` 2.x → 3.0 (PrimeReact 10 → 11)

`@cratis/components` 3.0 moves the library from PrimeReact 10 to **PrimeReact 11**.
Most wrapper APIs survive unchanged, so many apps upgrade with the find-and-replace
in §3 plus the install and import changes in §1 and §2. This guide lists every
change a consuming app can feel.

> **The three things you must do**, even if you change no component code:
>
> 1. **Install the PrimeReact peers yourself** — they are no longer our dependency (§1).
> 2. **Import `@cratis/components/styles`** — component CSS no longer rides along with
>    the JavaScript (§2).
> 3. **Choose a theming path** — there is no `resources/themes/*.css` to import any
>    more (§6).

---

## 1. PrimeReact is now a peer dependency

**This is the change most likely to break your install.** In 2.x, `primereact` was a
regular `dependency` of `@cratis/components`, so your app got a copy whether it asked
for one or not. That is exactly the problem: if your app also depended on `primereact`,
npm could resolve **two copies**, and two copies of PrimeReact means two
`PrimeReactProvider` React contexts. Components rendered from the library would read a
different config, theme and z-index registry than components you render yourself — and
the symptom is not an error, it is overlays stacking wrongly and `pt`/`unstyled`
silently not applying. Apps were papering over this with a `resolutions` / `overrides`
pin.

3.0 makes the requirement explicit instead. **You supply PrimeReact; we use yours.**

Add these to your app's `dependencies`:

```jsonc
{
    "dependencies": {
        "primereact": "^11.0.0",
        "@primereact/core": "^11.0.0",
        "@primereact/headless": "^11.0.0",
        "@primereact/hooks": "^11.0.0",
        "primeicons": "^8.0.0"
    }
}
```

Notes:

- `primereact` pins `@primereact/core`, `@primereact/headless` and `@primereact/hooks` to its own **exact**
  version, so installing `primereact@11.1.0` gives you 11.1.0 of all three. Declaring
  them anyway is what makes a strict installer (pnpm, Yarn PnP) resolve them for the
  library too.
- `@primeicons` went **7 → 8** alongside PrimeReact 11.
- `@primereact/types` is an **optional** peer. You only need it declared if your own
  code imports our prop types (they re-export `@primereact/types/*` shapes). It arrives
  transitively via `@primereact/core` in a hoisting installer.
- `@primereact/styles` and `@primeuix/themes` are **optional** peers. Install them only for
  PrimeReact's styled mode (§6). The baseline theme and unstyled mode need neither.
- If your app carried a `resolutions` / `overrides` entry to collapse PrimeReact into one
  copy, **you can delete it** — the peer declaration is what enforces that now.

### Arc peer range is unchanged

`@cratis/arc` and `@cratis/arc.react` now support `>=20.3.1 <23`. Arc 20, Arc 21 and
Arc 22 are supported.

> ⚠️ **Keep `@cratis/arc`, `@cratis/arc.react` and `@cratis/arc.vite` on the same
> version.** `@cratis/arc.react` depends on `@cratis/arc` with an **exact** pin, so if
> your own `@cratis/arc` drifts by even a patch your installer nests a second copy.
> `ObservableQuerySubscription` has a `private` field, which makes it nominally typed, so
> two copies produce a type error like *"types have separate declarations of a private
> property `_connection`"* in any code touching an observable query. This is an Arc
> packaging issue, not a Components one; `DataTableForObservableQuery` is hardened
> against it internally so the library itself still compiles either way
> ([#135](https://github.com/Cratis/Components/issues/135)).

## 2. Stylesheets — you now import them explicitly

In 2.x, every component did `import './Foo.css'` and relied on your bundler injecting
it. That put CSS files in the **JavaScript module graph**, which meant the published
package could not be loaded by Node at all: 29 of the export subpath checks failed with
`ERR_UNKNOWN_FILE_EXTENSION` / `ERR_UNSUPPORTED_DIR_IMPORT`, and no consumer whose test
environment is `node` could render a `Dialog` or `CommandDialog` in a spec
([#118](https://github.com/Cratis/Components/issues/118)).

3.0 takes CSS out of the JavaScript graph entirely. Every export subpath now loads
cleanly in Node. The cost is one explicit import in your app:

```diff
  // in your app entry point
+ import '@cratis/components/tokens';   // the --cratis-* token layer
+ import '@cratis/components/styles';   // all component CSS, in one file
+ import '@cratis/components/theme';    // optional — the Cratis baseline look, MIT CSS (§6)
```

Import them in that order. `styles` and `theme` both consume the tokens.

- `@cratis/components/styles` is new content, same specifier: in 2.x it resolved to only
  the compiled Tailwind utilities. It now contains those **plus every component
  stylesheet**.
- It also **vendors `allotment/dist/style.css`**, which `DataPage` needs for its split
  view to lay out (without it a details pane grows to its content and clips the
  paginator). If you were importing `allotment/dist/style.css` yourself, you can drop it.
- `SchemaEditor.module.css` is gone as a CSS Module. Its two classes are now plain,
  prefixed names (`cratis-schema-editor-navigable-row`, `cratis-schema-editor-bottom-border`)
  shipped in `styles`. This is internal, but noted in case you targeted the hashed names.

## 3. ESM-only packaging

PrimeReact 11 is ESM-only, so `@cratis/components` dropped its CommonJS build. `main`,
`module` and every `exports` entry point at `dist/esm`, and the package declares
`"type": "module"`.

- If your app bundles with Vite / modern tooling (the Cratis default), **no change**.
- If something in your pipeline `require()`d the package, switch it to `import`.

## 4. Import moves (removed `primereact/*` paths)

PrimeReact 11 ships **80** modules where v10 shipped 117. Replace the removed ones with
the Cratis-owned equivalents — the authoring model is unchanged:

| Was (PrimeReact 10) | Now (3.0) |
|---|---|
| `import { Column } from 'primereact/column'` | `import { Column } from '@cratis/components/DataTables'` (also re-exported from `@cratis/components/DataPage`) |
| `import { StepperPanel } from 'primereact/stepperpanel'` | `import { StepperPanel } from '@cratis/components/CommandDialog'` |
| `import { Menubar } from 'primereact/menubar'` | `<DataPage.MenuItems>` for list-page actions; `ActionMenubar` from `@cratis/components/Common` otherwise |
| `import { Dropdown } from 'primereact/dropdown'` | `import { Dropdown } from '@cratis/components/Dropdown'` |
| `primereact/calendar`, `primereact/inputtextarea`, `primereact/multiselect`, `primereact/chips`, `primereact/colorpicker` | consume through the `CommandForm` fields (`CalendarField`, `TextAreaField`, `MultiSelectField`, `ChipsField`, `ColorPickerField`) |
| `import { PrimeReactProvider } from 'primereact/api'` | `import { PrimeReactProvider } from '@primereact/core'` — or just use `CratisComponentsProvider` |

`<Column field="name" header="Name" sortable filter />` and `<StepperPanel header="…">`
work exactly as before.

### If you import `primereact/*` directly anywhere

These are the v11 renames. **v11 is compositional**, so a rename is often not a one-line
edit: `primereact/select` exports `Select.Root` / `Select.Trigger` / `Select.Value` /
`Select.Portal` / `Select.Popup` / `Select.List` / `Select.Option`, and you assemble them.
Prefer a Cratis wrapper where one exists.

| v10 module | v11 module |
|---|---|
| `dropdown` | `select` |
| `calendar` | `datepicker` |
| `overlaypanel` | `popover` |
| `inputswitch` | `toggleswitch` |
| `tabview` + `tabpanel` | `tabs` |
| `inputtextarea` | `textarea` |
| `password` | `inputpassword` |
| `chips` | `inputtags` |
| `colorpicker` | `inputcolor` |
| `galleria` | `gallery` |
| `scrollpanel` | `scrollarea` |
| `selectbutton` | `togglebuttongroup` |

> ⚠️ **The `Sidebar` trap.** v10's `Sidebar` (an overlay drawer) is now
> **`primereact/drawer`**. `primereact/sidebar` still exists in v11 but is a **different,
> new app-shell primitive**. A name-preserving migration compiles cleanly and silently
> swaps your overlay for an app shell. Check every `Sidebar` usage by hand.

### Removed with no drop-in replacement

These v10 modules are gone from v11 entirely — no rename, no equivalent:

`menubar`, `megamenu`, `tieredmenu`, `steps`, `multiselect`, `treeselect`, `treetable`,
`cascadeselect`, `splitbutton`, `image`, `virtualscroller`, `confirmdialog`, `column`,
`columngroup`, `row`, `inputicon`, `messages`, and the infrastructure modules `api`,
`menuitem`, `treenode`, `utils`, `hooks`, `passthrough`, `componentbase`.

`inputmask`, `keyfilter` and `scrolltop` exist in **neither** `primereact/*` nor
`@primereact/headless/*`. `orderlist` and `picklist` survive only as **headless hooks**
(`@primereact/headless/orderlist`, `.../picklist`) — you build the presentation.

Where the library needed one of these, it now owns a replacement:
`Source/Common/ActionMenubar.tsx` (for `menubar`), `Source/DataTables/Column.tsx` +
`ColumnFilterMenu.tsx` (for `column`), `Source/CommandDialog/StepperPanel.tsx` (for
`stepperpanel`), and `MultiSelectField` re-expressed over our own `Dropdown` wrapper
(v11's `Select` has no `multiple` prop of the v10 shape).

## 5. Data-table selection event

The removed `DataTableSelectionSingleChangeEvent` is replaced by
`DataTableSelectionChangeEvent<T>`. `event.value` (the selected row) is unchanged, so
only the type import moves:

```diff
- import { DataTableSelectionSingleChangeEvent } from 'primereact/datatable';
- onSelectionChange={(e: DataTableSelectionSingleChangeEvent<Product[]>) => setSelected(e.value as Product)}
+ import type { DataTableSelectionChangeEvent } from '@cratis/components/DataTables';
+ onSelectionChange={(e: DataTableSelectionChangeEvent<Product>) => setSelected(e.value ?? undefined)}
```

Per-column filter menus (`<Column filter dataType="…" />`), a global search box, and a
paginator range report are all restored — no API change to opt in beyond `filter`.

## 6. Theming — there is no theme stylesheet any more

**PrimeReact 11 ships zero CSS.** `primereact/resources/themes/*.css` does not exist, and
the `primereact` package is **unstyled primitives**: they render structural markup with
`data-scope` / `data-part` attributes and **no `p-*` class names**. A theme is now two
things handed to the provider at runtime: a **preset** — a plain JavaScript token object
(`@primeuix/themes` — Aura, Lara, Nora) that `@primeuix/styled` turns into `--p-*` custom
properties — and PrimeReact's **component styles** (`@primereact/styles`), which put the
`p-*` class names on the primitives and carry the CSS the tokens drive. PrimeReact's own
styled components (`@primereact/ui`) are just the primitives with those styles preset;
`@cratis/components` builds on the primitives, so **a preset alone (`theme: { preset }`)
emits tokens but paints nothing**.

The chain is: **preset (JS) → `--p-*` (runtime) → `--cratis-*` (our token layer) →
component CSS**, and in styled mode also **`primeReactStyles` → `p-*` class names +
PrimeReact's component CSS**. Our `--cratis-*` tokens resolve the v11 token first and fall
back to the v10 variable, so an app that still has a compiled v10 theme on the page during
its port keeps working, and nothing breaks the day it is removed.

Pick one of three paths:

**A. The Cratis baseline theme.** Cratis-authored MIT CSS that assigns the
`--cratis-*` tokens directly, light and dark, for a polished default with no preset and
no extra dependency. It defers to a preset's `--p-*` values when one is present.

```diff
- import 'primereact/resources/themes/lara-dark-blue/theme.css';
+ import '@cratis/components/theme';
```

**B. PrimeReact's styled mode.** `styledMode()` from `@cratis/components/styled` returns
`{ theme, defaults }`: a `@primeuix/themes` preset (default `CratisPreset` — Lara with the
blue primary and gray surfaces of `lara-light-blue` / `lara-dark-blue`, the dark surface
scale one step lighter so content sits above the page as it did there, both color schemes) plus
`primeReactStyles`, PrimeReact's own component styles keyed by primitive name, which the
provider applies to every primitive rendered under it — this library's and your own. That
is what makes the `p-*` class names appear and the preset paint them. Options: `preset`
(any preset or a `definePreset` result — `definePreset(CratisPreset, {...})` to extend),
`darkModeSelector` (default `.cratis-dark`, the class the baseline theme uses too),
`cssLayer` (default the `primereact` layer, ordered between Tailwind's `base` and
`components`, so a plain `.p-button { … }` in your CSS overrides the theme just as it did
against v10's `@layer primereact` stylesheets and a utility class still wins; `false`
emits unlayered).

```diff
- import 'primereact/resources/themes/lara-dark-blue/theme.css';
+ import { styledMode } from '@cratis/components/styled';
  // …
- <CratisComponentsProvider>
+ <CratisComponentsProvider value={{ license: '…', ...styledMode() }}>
```

`npm i @primereact/styles @primeuix/themes` for this path only (both PrimeUI-licensed —
see below).

**C. Fully unstyled.** Ship structure plus the `--cratis-*` token layer and bring your
own visuals via `pt` / CSS / Tailwind. Your existing `--cratis-*` overrides keep working.

```tsx
<CratisComponentsProvider value={{ unstyled: true, pt: myPreset }}>
```

### If your CSS was written against a v10 theme's variables

A v10 theme stylesheet published `--surface-ground`, `--surface-card`, `--surface-border`,
`--surface-hover`, `--text-color`, `--text-color-secondary`, `--primary-color`,
`--highlight-bg`, `--focus-ring`, `--maskbg`, `--border-radius`, the `--surface-0…900` and
`--primary-50…900` scales, the `--gray` / `--blue` / `--green` / `--yellow` / `--cyan` /
`--pink` / `--indigo` / `--teal` / `--orange` / `--bluegray` / `--purple` / `--red-50…900`
scales, the `--surface-a…f` aliases, `--content-padding` and `--inline-spacing` on `:root`.
On PrimeReact 11 they resolve to nothing the day it is installed — borders vanish, cards
lose their background. **`@cratis/components/primereact-v10-palette`** restores every one
of them with the `lara-light-blue` / `lara-dark-blue` values, so those call sites keep
working:

```diff
- import 'primereact/resources/themes/lara-dark-blue/theme.css';
  import '@cratis/components/tokens';
  import '@cratis/components/styles';
+ import '@cratis/components/primereact-v10-palette';
  // …
+ <CratisComponentsProvider value={{ license: '…', ...styledMode() }}>
```

- The **semantic** names (`--surface-card`, `--text-color`, `--primary-color`, …) resolve
  from the active preset's `--p-*` tokens where v11 has an equivalent, with the Lara values
  as the fallback — so they follow whatever preset styled mode applies.
- The **numbered scales** are the lara-blue values verbatim. The v10 dark surface scale was
  inverted, so `--p-surface-*` cannot stand in for it.
- Light and dark switch through `light-dark()`, keyed off `.cratis-dark` (the file sets
  `color-scheme: dark` on it) — the same class the baseline theme and `styledMode()` use.

Import order: `tokens`, `styles`, then the palette (and/or `theme`). It exists so what is
already written keeps working — write nothing new against those names; use `--cratis-*`
(or `--p-*`) instead.

`CratisComponentsProvider` takes everything through its single `value` prop, which is
deep-merged onto PrimeReact's provider config — `unstyled`, `pt`, `ptOptions`, `ripple`,
`inputVariant`, `zIndex`, `locale`, `theme`, `defaults` and `license`. It also accepts a
`toaster` prop (`true` or a `ToasterProps` object) to mount a `<Toaster />` for you.

## 7. Dialog

`Dialog` / `CommandDialog` / `StepperCommandDialog` keep their public APIs, including
`initialFocus` (`DialogInitialFocus.Confirm | Cancel | Content`), which is re-expressed on
v11's focus trap and behaves identically.

- **Added:** `dismissable` — whether the header close, backdrop click and `Escape` are
  offered. Defaults to "yes for a predefined `DialogButtons` set, no for a custom footer",
  matching v10's behavior; set it explicitly to keep a dismiss affordance with a custom
  footer.
- **Added:** `closeAriaLabel` for localizing the header close button.
- **No effect:** `resizable` is still accepted so call sites compile, but v11's headless
  dialog has no resize handle.

`StepperCommandDialog` keeps `showCancel` / `cancelLabel` (the opt-in footer Cancel), and
still withdraws every dismissal — footer Cancel, header close and `Escape` — for the whole
window a command is executing in.

## 8. Overlay z-index workarounds are gone (and no longer needed)

2.x exported a `useOverlayZIndex` hook and passed `appendTo={document.body}` on every
overlay-bearing field, because a v10 dropdown/calendar panel opened inside a modal dialog
rendered *inside* the dialog's subtree and could land under its own mask.

**`useOverlayZIndex` is removed.** PrimeReact 11 does both natively: `Select.Portal`
defaults to `appendTo: 'body'`, and the shared z-index registry gives a later-opened
overlay a value above whatever is already registered. Measured on v11.1.0: with a dialog
at z-index 1102, the select panel opens at **2103**, portaled to `document.body`. There is
a spec (`Source/Dropdown/for_Dropdown/when_opened_inside_a_dialog.ts`) pinning this, so a
future regression is caught rather than rediscovered.

If you called `useOverlayZIndex` in your own app for your own overlays, you will need to
inline it — but check first whether v11 has already made it unnecessary for you too.

## 9. Reduced capabilities (forced by PrimeReact 11)

A few v10 features have no v11 equivalent. The props are **kept so your code still
compiles**, but they no longer do anything — remove them or adopt the alternative:

| Prop | What changed |
|---|---|
| `Dialog` `resizable` | v11's headless dialog has no resize handle — no effect. |
| `ChipsField` `separator` | v11 `InputTags` commits one tag per Enter; pasted input is no longer auto-split. |
| `MultiSelectField` `display` / `maxSelectedLabels` | v11 `Select` renders the selection through its value slot; the v10 comma/chip modes and label-collapse are gone. |
| `DataTableForQuery` / `DataTableForObservableQuery` / `DataPage` `clientFiltering` | Retained as a deprecated no-op for source compatibility. Filtering always affects only the loaded page and pagination retains server totals. For complete-result filtering, pass filters as query arguments and apply them on the server before paging. |

Some wrappers also **narrowed their surface** (they no longer leak PrimeReact's full API):

- **`Column`** keeps the `field` / `header` / `body` / `sortable` / `filter` authoring
  model; v10 extras like `editor`, `frozen`, `footer`, `colSpan` and `expander` are not
  carried over.
- **`Dropdown`** exposes a curated single/multi select surface (`value`, `options`,
  `optionLabel` / `optionValue`, `placeholder`, `filter`, `multiple`, `showClear`, `style`,
  `id`, `name`, `aria-*`, …) plus `pt` / `ptOptions` / `unstyled` — it no longer accepts
  arbitrary PrimeReact Select props. `optionLabel` / `optionValue` default to `label` /
  `value` when the option objects carry those fields — the v10 `Dropdown` convention — so
  `[{ label, value }]` options with a scalar `value` keep matching (v11's `Select` compares
  the option object itself otherwise).
- The **`DataPage` action toolbar** replaces the v10 Menubar: `menubarPt` /
  `menubarPtOptions` / `menubarUnstyled` now target the toolbar's **buttons**, and the
  paginator is styled via `paginatorClassName` (+ `paginatorAriaLabels`), not `pt`.
- **`StepperCustomizationProps`** is now Cratis-owned (it no longer aliases PrimeReact's
  `StepperProps`). Same shape, minus the removed slots.

### If you write `pt` definitions or CSS selectors against PrimeReact internals

v11 is unstyled-first: outside styled mode (§6), PrimeReact elements carry **no `p-*`
class at all**. Parts are identified by data attributes instead —
`[data-scope="dialog"][data-part="close"]`, `[data-scope="select"][data-part="trigger"]`,
and so on. Selectors written against v10 class names will silently match nothing there. In
styled mode the `p-*` class names are back — `styledMode()` applies PrimeReact's component
styles to every primitive — and the theme sits in the `primereact` cascade layer, so a
plain `.p-button { … }` in your own CSS overrides it as it did on v10. (`pt` slot keys are
unaffected either way.)

## 10. What's new (nothing to migrate — just available)

- **`@cratis/components/Notifications`** — `Toaster`, the imperative `toast`, and
  `toastCommandResult(result)` to surface an Arc command result as the right toast
  (validation → per-field messages, exceptions → generic, never stack traces).
- **`@cratis/components/Display`** — `Tag`, `Badge`, `Chip`, `Skeleton`, `Avatar`,
  `ProgressBar`.
- **CommandForm fields** — `PasswordField`, `ToggleSwitchField`, `RatingField`.
- **`AutoCommandForm`** — generates a `CommandForm`'s fields from the command's own
  `propertyDescriptors`, with a `registerFieldTypeProvider` registry for custom types.
- **`@cratis/components/theme`** — the Cratis baseline theme, MIT CSS (§6). It now
  positions the dialog backdrop and positioner itself; previously a baseline-theme dialog
  could render below the page content.
- **`@cratis/components/styled`** — `styledMode()`, `CratisPreset`, `primeReactStyles`,
  `primeReactCssLayer` and `cratisDarkModeSelector`: PrimeReact's styled mode, wired for
  the provider (§6).
- **`@cratis/components/primereact-v10-palette`** — the PrimeReact 10 theme variables
  (`--surface-*`, `--text-color`, `--primary-color`, the color scales, …) restored with the
  lara-blue values, for CSS already written against them (§6).
- **`Dropdown`** reads `label` / `value` off option objects when `optionLabel` /
  `optionValue` are omitted — the v10 `Dropdown` convention (§9).

---

## Licensing (read this)

**PrimeReact 11 is no longer MIT.** This is the single most consequential change in the
upgrade, and it is not a theming detail — it applies to the whole library.

| Package                                                                               | v10       | v11                      |
| ------------------------------------------------------------------------------------- | --------- | ------------------------ |
| `primereact`                                                                          | MIT       | PrimeUI commercial       |
| `primeicons`                                                                          | MIT (7.x) | PrimeUI commercial (8.x) |
| `@primereact/core`, `@primereact/headless`, `@primereact/hooks`, `@primereact/styles` | —         | PrimeUI commercial       |
| `@primeuix/themes`, `@primeuix/styled`                                                | —         | PrimeUI commercial       |

From PrimeReact 11's own `LICENSE.md`: *"A valid license key is required to use this
software. A missing, invalid, or expired key may cause the software to display a license
notice."*

### A key is required regardless of how you style

An earlier version of this guide said unstyled rendering and the Cratis baseline theme
needed no key. **That was wrong.** The check runs in `PrimeReactProvider` on mount, with
an empty dependency array and no condition on `unstyled`, on `theme`, or on `NODE_ENV`:

```js
useEffect(() => {
    license && registerLicense({ primeui: license });
    verifyLicense('primeui', { releaseDate }).then(result => {
        result.valid || (console.warn(`[PrimeUI] ${result.message}`), showInvalidLicenseBanner());
    });
}, []);
```

So every styling path below reaches the same verification. Without a valid key you get a
console warning and a fixed *"Invalid PrimeUI License"* banner, in development **and**
production. Supply your key through the provider:

```tsx
<CratisComponentsProvider value={{ license: '…' }}>
```

What the styling choice *does* change is whether you additionally pull in
`@primereact/styles` and `@primeuix/themes` — both PrimeUI-licensed too, and needed only
for styled mode. `@cratis/components/theme` is Cratis-authored MIT CSS that embeds no
PrimeTek values — so that **stylesheet** carries no PrimeTek terms, but rendering it still
means running PrimeReact 11, which needs a key.

### Which license you need

- **[Community License](https://primeui.dev/licenses/community)** — free, and covers
  individuals, students, non-profits and non-commercial open source. For organizations it
  requires *all* of: under $1M USD annual gross revenue, fewer than 5 developers, fewer
  than 10 employees, and under $3M USD in outside funding. It supports up to 4 developers
  and must be renewed annually by confirming continued eligibility.
- **[Commercial License](https://primeui.dev/licenses/commercial)** — for everyone else.
  Per developer, perpetual, one year of updates included.

### If you redistribute

PrimeReact 11's restrictions clause is explicit: *"You may not … redistribute it as a
component library or development tool … Redistributing the software so that third parties
can develop with it requires a separate OEM License."*

If you are building an application, that clause is not about you. If you are publishing a
library or tool that others build with — as this package does — read it carefully and
check your position with PrimeTek. Nothing in this document is legal advice; the
authoritative terms are at the links above.

### Staying on MIT

If a commercial dependency is not acceptable for your project, **`@cratis/components` 2.x
remains on PrimeReact 10 and is fully MIT**. It is not receiving new features, but it is
the supported option for staying MIT-only.
