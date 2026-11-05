---
title: DataPage details panel for selected rows
description: Show a selected DataPage row beside the list, query related records by its id, and choose a layout that works when the side pane cannot fit.
---

## Overview

The DataPage details panel lets users inspect the selected record beside the list without navigating away. Pass a `detailsComponent` to show it in a resizable right-hand pane; omit that prop for a table-only page. Your component decides what to show and queries any related records.

## Enabling Details Panel

Start by displaying fields from the selected row. Type your component with `IDetailsComponentProps<T>` from `@cratis/components/DataPage` so `item` has your row type, then pass it as `detailsComponent`:

```tsx
import { DataPage, Column, type IDetailsComponentProps } from '@cratis/components/DataPage';
import { AllAuthors, type Author } from './Author'; // generated Arc query proxy and read model

const AuthorDetails = ({ item }: IDetailsComponentProps<Author>) => (
    <section aria-label={`Details for ${item.name}`} style={{ padding: '1rem' }}>
        <h2>{item.name}</h2>
        <p>Id: {String(item.id)}</p>
    </section>
);

export function Authors() {
    return (
        <div style={{ height: '100vh' }}>
            <DataPage
                title='Authors'
                query={AllAuthors}
                emptyMessage='No authors yet'
                dataKey='id'
                detailsComponent={AuthorDetails}
            >
                <DataPage.Columns>
                    <Column field='name' header='Name' sortable />
                </DataPage.Columns>
            </DataPage>
        </div>
    );
}
```

Select an author and the pane opens with that author's name and id. The typed props make `item` an `Author`; an untyped `({ item }) => …` would leave it implicitly `any` under strict TypeScript.

The named `section` gives screen reader users a region they can find. Padding and typography belong to your component: Components adds neither inside the pane and does not ship utility classes such as `p-4`. Use your own CSS or inline styles.

## Detail Component Props

Your detail component receives:

- `item`: The selected row
- `onRefresh`: The `onRefresh` prop you passed to `DataPage`, forwarded unchanged; `undefined` when you did not pass one

```typescript
interface IDetailsComponentProps<TDataType> {
    item: TDataType;
    onRefresh?: () => void;
}
```

Treat `onRefresh` as a handoff to the page, not a built-in reload. Calling it runs your callback unchanged. If the list uses a snapshot query, that callback must request fresh data; an observable list receives updates as its query delivers results. Related queries inside the pane have their own data lifecycle.

## Complex Details Example

An author's row need not contain all their books. Run a related query inside the pane and pass the selected author's id as its argument. Here, the generated `BooksForAuthor` observable query accepts `authorId`.

This excerpt focuses on that argument handoff. Before using it as a complete result view, add the [list-and-detail tutorial's](../tutorial/list-and-detail.mdx) checks for denied access and failure; otherwise those states can look like an empty book list.

```tsx
import { type Guid } from '@cratis/fundamentals';
import { type IDetailsComponentProps } from '@cratis/components/DataPage';
import { type Author } from './Author';
import { BooksForAuthor } from './Book'; // generated Arc query proxy

const Books = ({ authorId }: { authorId: Guid }) => {
    const [books] = BooksForAuthor.use({ authorId });
    if (books.isPerforming && books.data.length === 0) return <p>Loading books…</p>;
    if (books.data.length === 0) return <p>No books registered yet.</p>;
    return (
        <ul>
            {books.data.map((book) => (
                <li key={String(book.id)}>{book.title}</li>
            ))}
        </ul>
    );
};

const AuthorDetails = ({ item }: IDetailsComponentProps<Author>) => (
    <section aria-label={`Details for ${item.name}`} style={{ padding: '1rem' }}>
        <h2>{item.name}</h2>
        <Books key={String(item.id)} authorId={item.id} />
    </section>
);
```

Selecting another author passes a new `item.id` to `BooksForAuthor.use`. The `key` also remounts the `Books` child, so its local React state starts over for that author. A cached query result can appear immediately, so do not rely on seeing a loading screen to know the author changed. Render status and data for the current `authorId`, including the tutorial's error and access checks.

## Panel Layout

DataPage gives the pane a preferred width of `450px`, leaving the rest for the table. This is a preferred size for the split layout, not a guarantee that both panes will be readable at every viewport width.

Your details component mounts only while a row is selected. Clearing selection unmounts it and discards its local state. Moving directly to another row keeps it mounted with a new `item`, so reset row-specific state yourself or key a child by the row id, as the books example does.

The pane fills the split view's height. Keep DataPage in a bounded-height container, as in the first example, and load the Components stylesheet described in [Getting started](../getting-started.mdx). Give tall details their own scrolling, for example `style={{ height: '100%', overflow: 'auto' }}` on the root element, so controls below the fold remain reachable.

## Interactive Details

The details component is ordinary React, so it can hold local state and render controls. This example toggles extra information with the Cratis `Button` and calls `onRefresh`:

```tsx
import { useState } from 'react';
import { Button } from '@cratis/components/Common';
import { type IDetailsComponentProps } from '@cratis/components/DataPage';
import { type Author } from './Author';

export const AuthorDetails = ({ item, onRefresh }: IDetailsComponentProps<Author>) => {
    const [showId, setShowId] = useState(false);

    return (
        <section aria-label={`Details for ${item.name}`} style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{item.name}</h2>
                <Button
                    label={showId ? 'Hide id' : 'Show id'}
                    variant='outline'
                    onClick={() => setShowId((current) => !current)}
                />
            </div>
            {showId && <p>Id: {String(item.id)}</p>}
            <Button label='Reload list' variant='ghost' onClick={() => onRefresh?.()} />
        </section>
    );
};
```

**Reload list** calls the page's `onRefresh` callback; without one, it does nothing. The **Show id** toggle belongs to the details component's local state, so it stays in its current state when another author is selected unless you reset it.

To change a record, execute a generated Arc command, for example through a [CommandDialog](../CommandDialog/index.md). Editing `item` in place changes no server data: it is only a row object from the query result. The server must authorize related queries and commands, including their targets, even when the row is already visible.

## Resizable Panels

Users can drag the divider to give either the table or the details more room. The divider is pointer-only: it is not reachable or adjustable from the keyboard. DataPage exposes no width-persistence setting.

### Disable Resizing

DataPage has no prop to disable resizing or to change the pane's preferred width. If you need a fixed layout, leave out `detailsComponent`, track the selection with `onSelectionChange`, and render your details beside the `DataPage` in your own layout.

## Narrow screens

:::caution[Choose a narrow-screen alternative]
DataPage keeps the table and details side by side; it does not switch to a stacked view or dialog at a breakpoint. With a preferred pane width of `450px`, that layout can leave too little room to read the table.

For small viewports, omit `detailsComponent` and use `onSelectionChange` to open a dialog or a separate route. Your own media query can choose between that layout and the side pane. Keep selection in the parent if the same selected row needs to carry across the change.
:::

## No Selection State

When no row is selected, the details pane is not mounted and the table takes the full width. Clicking the selected row again keeps it selected; it does not toggle the pane closed. To let users close it, use controlled selection and set `selection` to `null`.

With `selection` omitted or `undefined`, DataPage owns the selection internally. A non-undefined value makes it controlled, including `null`: the parent must accept updates from `onSelectionChange`. Setting it to `undefined` returns ownership to DataPage rather than explicitly clearing the selection. See [DataPage selection](index.md#selection).

Query results can also change the selection. After a successful, ready result, the table reconciles the selected row against the returned rows. With `dataKey`, a matching key replaces the selection with the refreshed row object; if no row matches, the table proposes `null`. Without `dataKey`, matching uses object identity, so a newly created object representing the same row is not a match. A controlled parent decides whether to accept that proposal. Loading, failed or unauthorized results do not reconcile selection; a snapshot query waiting for required arguments does not either.

Multiple selection is a separate channel, through `selectedItems` and `onSelectedItemsChange`. That set does not choose an item for the details pane. The pane still follows the single `selection`, including one supplied separately by a controlled caller.

## Best Practices

Choose details that help the user decide what to do with the selected record. [Query related data by its id](#complex-details-example) rather than putting every related record in the list result, and defer expensive content until it is needed.

Before relying on the pane, check that users can find its named region, reach controls in tall content, and inspect the same record on a narrow screen. If the next step is editing or removing that record, follow [Accessing Selected Item](menu-items.md#accessing-selected-item) to connect selection state to a toolbar action.
