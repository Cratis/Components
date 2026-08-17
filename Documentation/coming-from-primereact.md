---
title: PrimeReact and Components
description: You already know PrimeReact. Here's how forms and tables map onto Cratis Components — concept by concept, side by side — plus what PrimeReact 11 renamed, removed, and rebuilt.
---

Cratis Components isn't a different component kit — it's built **on** PrimeReact. Your `Column`, your `Button`, your icons all still apply. What changes is the *wiring*: instead of keeping form state and query subscriptions in the screen, you point a component at an Arc-generated proxy and let the component own that integration. This page maps familiar PrimeReact code onto its Components equivalent — and, because `@cratis/components` 3.0 moved to **PrimeReact 11**, tells you what PrimeReact itself renamed, removed, and rebuilt underneath.

If you already have an app on `@cratis/components` 2.x, read the [migration guide](migration.md) first — it is the ordered checklist. This page is the map you keep open while you work through it.

## The one-paragraph version

In a PrimeReact app, the screen often owns request creation, loading state, dialog footer actions, field binding, API calls, and live updates. Components centralizes that wiring around generated command and query proxies — so a form or a table is declarative, and it's type-checked against the C# it came from. You keep PrimeReact while reducing screen-specific integration code.

## A command form

You have a dialog with a field and a save button. By hand, that's local state, a saving flag, a fetch, and footer buttons you wire yourself:

```tsx
// Manual: local state, a saving flag, a fetch, and hand-wired footer buttons
const [name, setName] = useState('');
const [saving, setSaving] = useState(false);

const save = async () => {
    setSaving(true);
    await fetch('/api/authors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    setSaving(false);
};

<Dialog title="Add author" onCancel={hide} buttons={
    <>
        <Button onClick={hide}>Cancel</Button>
        <Button disabled={saving} onClick={save}>Add</Button>
    </>
}>
    <InputText value={name} onChange={e => setName(e.target.value)} />
</Dialog>
```

With Components, the command *is* the form — instantiation, the footer, the executing state, and validation are handled:

```tsx
// Components
<CommandDialog<RegisterAuthor> command={RegisterAuthor} title="Add author" okLabel="Add">
    <InputTextField<RegisterAuthor> value={i => i.name} title="Name" />
</CommandDialog>
```

`i => i.name` is typed against the generated `RegisterAuthor` — rename the property in C#, rebuild, and this line stops compiling.

## A data table

With plain PrimeReact, a table typically fetches on mount, holds rows in state, and — if you want live data — subscribes to updates:

```tsx
// PrimeReact, local state
const [authors, setAuthors] = useState([]);

useEffect(() => {
    fetch('/api/authors').then(r => r.json()).then(setAuthors);
    // ...and a subscription if you want it to stay current
}, []);

<DataTable value={authors}>
    <Column field="name" header="Name" sortable />
</DataTable>
```

With Components, you hand the table the query proxy; it subscribes and re-renders as the read model changes:

```tsx
// Components
<DataTableForObservableQuery query={AllAuthors} emptyMessage="No authors yet">
    <Column field="name" header="Name" sortable />
</DataTableForObservableQuery>
```

The `Column` is the same PrimeReact component you already use. Only the data binding changed — and it stays live with no subscription code.

## A list-and-detail page

The "table left, details right, toolbar on top" layout has several moving parts: split panes, selection state, and a detail panel that appears only when a row is picked. `DataPage` is that layout as one component:

```tsx
// Components
import { DataPage, MenuItem, Column } from '@cratis/components/DataPage';
import { FaPencil, FaPlus } from 'react-icons/fa6';

<DataPage title="Authors" query={AllAuthorsWithBooks} emptyMessage="No authors yet"
          detailsComponent={AuthorDetails}>
    <DataPage.MenuItems>
        <MenuItem label="Add author" icon={FaPlus} command={() => showAddAuthor()} />
        <MenuItem label="Edit" icon={FaPencil} disableOnUnselected command={openEdit} />
    </DataPage.MenuItems>
    <DataPage.Columns>
        <Column field="name" header="Name" sortable />
    </DataPage.Columns>
</DataPage>
```

`MenuItem`'s `icon` is a **component type**, not a PrimeIcons class string and not a JSX element — `DataPage` instantiates it itself.

Selection, the resizable split, and disabling menu items until a row is selected all come built in.

## How the pieces map

| You know (PrimeReact) | In Components |
|---|---|
| `Dialog` + footer `Button`s + a fetch | `CommandDialog command={...}` |
| `InputText` + `useState` + manual validation | `InputTextField value={i => i.field}` — typed to the command |
| `DataTable value={...}` + `useEffect` fetch | `DataTableForObservableQuery query={...}` (live) or `DataTableForQuery` |
| Split panes + selection + detail wiring | `DataPage` with `detailsComponent` |
| A multi-step wizard you build yourself | `StepperCommandDialog` |
| A PrimeReact theme | the Cratis baseline theme, or PrimeReact's styled mode (`styledMode()` — a `@primeuix/themes` preset plus PrimeReact's component styles), plus `--cratis-*` tokens for repainting |

## The v11 module renames

If you import from `primereact/*` anywhere in your own code, this is the table you need. PrimeReact 11 ships **80** modules where v10 shipped 117, and a dozen of the survivors moved:

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

**A rename is usually not a one-line edit.** This is the part that surprises people: v11 is **compositional**. `primereact/select` does not export a `Select` you drop in with props — it exports `Select.Root`, `Select.Trigger`, `Select.Value`, `Select.Portal`, `Select.Positioner`, `Select.Popup`, `Select.List` and `Select.Option`, and you assemble them yourself. So does `Chip`, `Avatar`, `ProgressBar`, `Rating`, `ToggleSwitch`, `InputColor`, and most of the rest. Budget for restructuring the JSX, not for a find-and-replace.

Which is exactly why you should prefer a Cratis wrapper where one exists: [`Dropdown`](Dropdown/index.md) is that seven-part `Select` assembly behind one element with props, and it stays put across PrimeReact versions.

### The `Sidebar` trap

> [!CAUTION]
> v10's `Sidebar` — the overlay drawer — is now **`primereact/drawer`**. `primereact/sidebar` **still exists** in v11, but it is a **different, new app-shell primitive**. A name-preserving migration therefore compiles cleanly and silently swaps your overlay for an app shell. There is no error, no warning, and no type mismatch to catch it. Check every `Sidebar` usage by hand.

### Removed with no drop-in replacement

These v10 modules are gone from v11 entirely — no rename, no equivalent:

`menubar`, `megamenu`, `tieredmenu`, `steps`, `multiselect`, `treeselect`, `treetable`, `cascadeselect`, `splitbutton`, `image`, `virtualscroller`, `confirmdialog`, `column`, `columngroup`, `row`, `inputicon`, `messages`, and the infrastructure modules `api`, `menuitem`, `treenode`, `utils`, `hooks`, `passthrough`, `componentbase`.

`inputmask`, `keyfilter` and `scrolltop` exist in **neither** `primereact/*` nor `@primereact/headless/*`. `orderlist` and `picklist` survive only as **headless hooks** (`@primereact/headless/orderlist`, `.../picklist`) — you build the presentation.

Where the library needed one of these, it now owns a replacement, so your authoring model is unchanged even though the import moved:

| You used to import | Now |
|---|---|
| `Column` from `primereact/column` | `Column` from `@cratis/components/DataTables` (also re-exported from `@cratis/components/DataPage`) |
| `StepperPanel` from `primereact/stepperpanel` | `StepperPanel` from `@cratis/components/CommandDialog` |
| `Menubar` from `primereact/menubar` | `<DataPage.MenuItems>` for list-page actions; a `Button` toolbar of your own otherwise |
| `Dropdown` from `primereact/dropdown` | `Dropdown` from `@cratis/components/Dropdown` |
| `MultiSelect` from `primereact/multiselect` | `MultiSelectField` from `@cratis/components/CommandForm` (re-expressed over the Cratis `Dropdown` — v11's `Select` has no `multiple` prop of the v10 shape) |
| `ConfirmDialog` from `primereact/confirmdialog` | `ConfirmationDialog` from `@cratis/components/Dialogs` |
| `PrimeReactProvider` from `primereact/api` | `PrimeReactProvider` from `@primereact/core` — or just use [`CratisComponentsProvider`](Common/cratis-components-provider.md) |
| `Messages` from `primereact/messages` | `Toaster` / `toast` from [`@cratis/components/Notifications`](Notifications/index.md) |

`<Column field="name" header="Name" sortable filter />` and `<StepperPanel header="…">` work exactly as they did. Inside `DataPage`, the action toolbar that replaced Menubar keeps the same `model` array shape, so `<DataPage.MenuItems>` reads as it always did.

## What stays the same

- The authoring model. `Column`, `StepperPanel`, `DataPage`, `CommandDialog` and the CommandForm fields all take the same props they took on 2.x — the churn above is PrimeReact's, and the wrappers absorbed it.
- You keep using plain PrimeReact for purely presentational widgets that aren't tied to a command or query — the two coexist happily on the same screen.
- Your styling knowledge carries over, though the *mechanism* changed: see the next section.

## What changed in PrimeReact 11 itself

Three things bite even when you only use Cratis wrappers.

**PrimeReact is now a peer dependency.** You install `primereact`, `@primereact/core`, `@primereact/headless` and `primeicons` yourself. Two copies of PrimeReact means two `PrimeReactProvider` contexts, which breaks overlays and `pt` with no error to point at — the peer declaration is what prevents that. See [Getting started](/components/getting-started/).

**PrimeReact 11 ships zero CSS.** `primereact/resources/themes/*.css` does not exist. A theme is now [PrimeReact's styled mode](Styling/themed.md) — `styledMode()` from `@cratis/components/styled`, which hands the provider a `@primeuix/themes` preset (a JavaScript token object turned into `--p-*` custom properties at runtime) together with PrimeReact's own component styles; a preset by itself paints nothing — or the [Cratis baseline theme](Styling/baseline-theme.md), or your own `pt`. **PrimeReact 11 needs a PrimeUI license key whichever you pick** — the check runs when the provider mounts, not when a theme is applied. See [Licensing](migration.md#licensing) and [Styling](/components/styling/).

**Outside styled mode, elements carry no `p-*` class.** The `primereact` primitives identify parts by data attributes — `[data-scope="dialog"][data-part="close"]`, `[data-scope="select"][data-part="trigger"]`; the `p-*` class names come from PrimeReact's component styles, which only `styledMode()` applies. Elsewhere, CSS selectors written against v10 class names silently match nothing. (`pt` slot keys are unaffected, though the top-level keys follow the renames above: `select`, not `dropdown`.)

Two smaller ones: `Button` renders its content as **children**, not `label`/`icon` props; and the data-table selection event is now `DataTableSelectionChangeEvent<T>` rather than `DataTableSelectionSingleChangeEvent`.

## What changes (and why it's less code)

- **Forms bind to commands, not to local state.** No `useState` per field, no loading flag, no hand-written validation — the command carries its own rules, and the proxy runs them on both sides.
- **Tables bind to queries, not to fetched arrays.** An observable query keeps the table current with no subscription code and no "refresh after save."
- **The binding is type-checked.** Field accessors and column fields line up with the generated types, so a backend change that breaks the screen is a compile error, not a runtime surprise.

## Where to go next

- [Getting started](/components/getting-started/) — install Components and mount the provider.
- [Build the library screen](/components/tutorial/) — the same ideas built up one screen at a time.
- [Why Components](/components/why-components/) — the case for the library, and when plain PrimeReact is the better choice.
