---
title: DataPage details panel
description: Show the selected row in a resizable side pane, load related data for it, and handle refresh and narrow screens.
---

## Overview

The details panel shows information about the selected row in a resizable pane to the right of the table. It is optional: without a `detailsComponent`, DataPage renders the table on its own and mounts no split view.

## Enabling Details Panel

Pass a component to the `detailsComponent` prop. Type it with `IDetailsComponentProps<T>` from `@cratis/components/DataPage` so `item` has your row type:

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

Select a row and the pane opens beside the table with that author's name. The details component's markup and styling are yours: Components does not add padding or typography inside the pane, and it does not ship utility classes such as `p-4`, so use your own CSS or inline styles.

An untyped `({ item }) => …` component does not compile under `strict` TypeScript, because `item` is implicitly `any`.

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

Calling `onRefresh` runs the callback you passed to DataPage; it does not reload the query by itself. For a snapshot query, your callback must request fresh data. With an observable query, the table updates as the query delivers new results, so you usually do not need a refresh callback.

## Complex Details Example

The pane receives only the selected row. To show related data, run another query from inside the details component, keyed by the row's id. This example lists the selected author's books with a generated `BooksForAuthor` observable query that takes an `authorId` argument.

This example shows how to load related books, but it does not check for errors or denied access before showing an empty list. Use the [list-and-detail tutorial](../tutorial/list-and-detail.mdx) to handle loading, denied access, failure, and a successful empty result.

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

When the user selects another author, `item.id` supplies that author's id to `BooksForAuthor.use`. The `key` remounts the `Books` child for that author, resetting the child's React state. It does not guarantee a loading screen: the query may already have a result for that author. Render the query's status and data for the current `authorId`, using the tutorial's checks for errors and denied access too.

## Panel Layout

The pane opens at a preferred width of `450px` and the table takes the remaining width. It is mounted only while a row is selected, so its state (for example the `useState` values in your component) resets when the selection is cleared. Changing from one selected row to another keeps the same component mounted and passes it a new `item`.

The pane is a direct child of the split view and fills its height. Keep DataPage in a bounded-height container, as in the first example, and load the Components stylesheet described in [Getting started](../getting-started.mdx). If your details content is taller than the page, give your component its own scrolling, for example `style={{ height: '100%', overflow: 'auto' }}` on its root element.

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

**Reload list** calls the `onRefresh` callback you pass to DataPage. Without that callback, the button does nothing. Your details component must query any related data, and the server must authorize that query.

To change data from the pane, execute a generated Arc command, for example through a [CommandDialog](../CommandDialog/index.md), rather than editing `item` in place. `item` is the row object from the query result; mutating it changes nothing on the server. The server must authorize the command and its target even when the row is visible in the pane.

## Resizable Panels

Users can resize the split by dragging the divider between the table and the pane. The divider is operated with a pointer only; it is not reachable or adjustable from the keyboard. DataPage does not remember the width between selections or visits.

### Disable Resizing

DataPage has no prop to disable resizing or to change the pane's preferred width. If you need a fixed layout, leave out `detailsComponent`, track the selection with `onSelectionChange`, and render your details beside the `DataPage` in your own layout.

## Narrow screens

:::caution[Choose a narrow-screen alternative]
The split does not respond to the viewport: at every width the pane opens beside the table at its preferred `450px`, and the table gets what is left. On a narrow screen that can leave the table too narrow to read. DataPage does not switch to a stacked view or dialog for you.

For small viewports, leave out `detailsComponent` and show the selected row somewhere that suits the space, such as a dialog or a separate route, driven by `onSelectionChange`. You can switch between the two approaches with your own media query.
:::

## No Selection State

When no row is selected, the details pane is not mounted and the table takes the full width. Clicking the selected row again keeps it selected; it does not toggle the pane closed. To let users close it, use controlled selection and set `selection` to `null`.

With `selection` omitted or `undefined`, DataPage owns the selection internally. A non-undefined value makes it controlled, including `null`: the parent must accept updates from `onSelectionChange`. Setting it to `undefined` returns ownership to DataPage rather than explicitly clearing the selection. See [DataPage selection](index.md#selection).

Query results can also change the selection. After a successful, ready result, the table reconciles the selected row against the returned rows. With `dataKey`, a matching key replaces the selection with the refreshed row object; if no row matches, the table proposes `null`. Without `dataKey`, matching uses object identity, so a newly created object representing the same row is not a match. A controlled parent decides whether to accept that proposal. Loading, failed or unauthorized results do not reconcile selection; a snapshot query waiting for required arguments does not either.

Multiple selection is a separate channel, through `selectedItems` and `onSelectedItemsChange`. That set does not choose an item for the details pane. The pane still follows the single `selection`, including one supplied separately by a controlled caller.

## Best Practices

1. **Keep it focused**: Display essential details, not everything
2. **Load additional data**: Use the item id to query related data, as in [Complex Details Example](#complex-details-example)
3. **Provide actions**: Put row-specific actions such as edit and remove in the pane or in the toolbar with `disableOnUnselected`
4. **Name the region**: Give the pane's root element an accessible name, for example `aria-label`, so screen reader users can find it
5. **Plan for narrow screens**: Decide where details go when there is no room for a side pane
6. **Consider performance**: The pane re-renders on every selection change; defer heavy content until it is needed

To add an action for the row shown here, use [Accessing Selected Item](menu-items.md#accessing-selected-item) for keeping selection state and reading the selected row in your handler.
