---
title: PrimeReact and Components
description: You already know PrimeReact. Here's how forms and tables map onto Cratis Components — concept by concept, side by side — and what changes.
---

Cratis Components isn't a different component kit — it's built **on** PrimeReact. Your theme, your `Column`, your `Button`, your icons all still apply. What changes is the *wiring*: instead of keeping form state and query subscriptions in the screen, you point a component at an Arc-generated proxy and let the component own that integration. This page maps familiar PrimeReact code onto its Components equivalent.

## The one-paragraph version

In a PrimeReact app, the screen often owns request creation, loading state, dialog footer actions, field binding, API calls, and live updates. Components centralizes that wiring around generated command and query proxies — so a form or a table is declarative, and it's type-checked against the C# it came from. You keep PrimeReact while reducing screen-specific integration code.

## A command form

You have a dialog with a field and a save button. By hand, that's local state, a loading flag, a fetch, and footer buttons:

```tsx
// PrimeReact, local state
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

<Dialog header="Add author" visible={visible} onHide={hide} footer={
    <>
        <Button label="Cancel" onClick={hide} />
        <Button label="Add" loading={saving} onClick={save} />
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
<DataPage title="Authors" query={AllAuthorsWithBooks} detailsComponent={AuthorDetails}>
    <DataPage.MenuItems>
        <MenuItem label="Add author" icon="pi pi-plus" command={() => showAddAuthor()} />
        <MenuItem label="Edit" icon="pi pi-pencil" disableOnUnselected command={openEdit} />
    </DataPage.MenuItems>
    <DataPage.Columns>
        <Column field="name" header="Name" sortable />
    </DataPage.Columns>
</DataPage>
```

Selection, the resizable split, and disabling menu items until a row is selected all come built in.

## How the pieces map

| You know (PrimeReact) | In Components |
|---|---|
| `Dialog` + footer `Button`s + a fetch | `CommandDialog command={...}` |
| `InputText` + `useState` + manual validation | `InputTextField value={i => i.field}` — typed to the command |
| `DataTable value={...}` + `useEffect` fetch | `DataTableForObservableQuery query={...}` (live) or `DataTableForQuery` |
| Split panes + selection + detail wiring | `DataPage` with `detailsComponent` |
| A multi-step wizard you build yourself | `StepperCommandDialog` |
| A PrimeReact theme | the same theme, plus `--cratis-*` tokens for repainting |

## What stays the same

- It's still PrimeReact underneath. `Column`, `Button`, icons, and your chosen theme all work as you know them.
- You keep using plain PrimeReact for purely presentational widgets that aren't tied to a command or query — the two coexist happily on the same screen.
- Your styling knowledge carries over; Components renders PrimeReact in unstyled mode and reads colors and spacing from tokens you control. See [Styling](/components/styling/).

## What changes (and why it's less code)

- **Forms bind to commands, not to local state.** No `useState` per field, no loading flag, no hand-written validation — the command carries its own rules, and the proxy runs them on both sides.
- **Tables bind to queries, not to fetched arrays.** An observable query keeps the table current with no subscription code and no "refresh after save."
- **The binding is type-checked.** Field accessors and column fields line up with the generated types, so a backend change that breaks the screen is a compile error, not a runtime surprise.

## Where to go next

- [Getting started](/components/getting-started/) — install Components and mount the provider.
- [Build the library screen](/components/tutorial/) — the same ideas built up one screen at a time.
- [Why Components](/components/why-components/) — the case for the library, and when plain PrimeReact is the better choice.
