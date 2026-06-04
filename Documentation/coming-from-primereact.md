---
title: Coming from PrimeReact
description: You already know PrimeReact. Here's how the forms and tables you'd hand-wire map onto Cratis Components — concept by concept, side by side — and what changes.
---

Cratis Components isn't a different component kit — it's built **on** PrimeReact. Your theme, your `Column`, your `Button`, your icons all still apply. What changes is the *wiring*: instead of binding a form to component state by hand and fetching a query in a `useEffect`, you point a component at an Arc-generated proxy and the binding is done for you. This page maps the PrimeReact code you'd write today onto its Components equivalent, so the shift is short.

## The one-paragraph version

In a PrimeReact app you build a screen and connect it to your backend yourself: instantiate a request, track loading, render the dialog footer, bind each input, call your API, subscribe to updates. Components knows how to do all of that against your generated command and query proxies — so a form or a table is a few declarative lines, and it's type-checked against the C# it came from. You keep PrimeReact; you drop the glue.

## A command form

You have a dialog with a field and a save button. By hand, that's local state, a loading flag, a fetch, and footer buttons:

```tsx
// PrimeReact, by hand
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

By hand, a table means fetching on mount, holding rows in state, and — if you want live data — wiring up a subscription:

```tsx
// PrimeReact, by hand
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

The "table left, details right, toolbar on top" layout — split panes, selection state, showing the panel only when a row is picked — is a lot of plumbing by hand. `DataPage` is that layout as one component:

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

| You know (PrimeReact, by hand) | In Components |
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
