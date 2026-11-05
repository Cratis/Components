---
title: DataPage for list-and-detail screens
description: Build a query-backed list-and-detail screen with DataPage. Connect row selection to actions and related data, and plan the layout for narrow screens.
---

`DataPage` builds a list-and-detail screen from a generated Cratis Arc query, connecting a paged table's selected row to actions and an optional details pane. Use it when users need to find a record, inspect it, and act on it without leaving the list.

## Purpose

Start with the rows your query returns and the actions someone needs to take on them. You declare the columns and toolbar items as children, then pass a details component if the selected record needs more space. DataPage coordinates selection; your handlers open dialogs or execute commands.

## Key Features

The table can show a snapshot query, fetched on request, or an observable query, which delivers updated results as the server sends them. Sorting and filtering apply to the loaded page unless you opt into [server mode](#filtering-scope) for the complete result.

Selection ties the screen together: it can enable an action and show the same row in a resizable side pane. Let DataPage own selection for a simple list, or control it when your page needs to clear it or choose a row. The layout keeps the paginator within the height you give the page; the side pane needs a separate plan for [narrow screens](details-panel.md#narrow-screens).

## Prerequisites

- Your app renders `<Arc>` from `@cratis/arc.react` around `CratisComponentsProvider`. DataPage runs the query through Arc's React hooks and does not replace that provider.
- A generated Arc query proxy (`IQueryFor` or `IObservableQueryFor`) for the rows.
- The Components stylesheet (`@cratis/components/styles`, or `@cratis/components/DataPage/styles`) imported once at your app entry point. See [Layout](#layout).
- An ancestor element with a definite height. See [DataPage needs an ancestor with a height](#datapage-needs-an-ancestor-with-a-height).

## Basic Usage

Declare the columns and menu actions with the compound `DataPage.Columns` and `DataPage.MenuItems` children. `DataPage`, `MenuItem`, and `Column` all come from `@cratis/components/DataPage`:

```tsx
import { useState } from 'react';
import { DataPage, MenuItem, Column } from '@cratis/components/DataPage';
import { FaPlus, FaPencil, FaTrash } from 'react-icons/fa6';
import { AllAuthors, type Author } from './Author'; // generated Arc query proxy and read model

export function Authors() {
    const [selected, setSelected] = useState<Author | null>(null);

    const addAuthor = () => {
        // open your "register author" dialog here
    };
    const editAuthor = () => {
        if (!selected) return;
        // open your edit dialog for `selected` here
    };
    const removeAuthor = () => {
        if (!selected) return;
        // ask for confirmation, then execute your remove command for `selected.id`
    };

    return (
        <div style={{ height: '100vh' }}>
            <DataPage<AllAuthors, Author, object>
                title='Authors'
                query={AllAuthors}
                emptyMessage='No authors found'
                dataKey='id'
                onSelectionChange={(event) => setSelected(event.value)}
            >
                <DataPage.MenuItems>
                    <MenuItem label='Add' icon={FaPlus} command={addAuthor} />
                    <MenuItem label='Edit' icon={FaPencil} disableOnUnselected command={editAuthor} />
                    <MenuItem label='Remove' icon={FaTrash} disableOnUnselected command={removeAuthor} />
                </DataPage.MenuItems>
                <DataPage.Columns>
                    <Column field='name' header='Name' sortable />
                    <Column field='id' header='Id' />
                </DataPage.Columns>
            </DataPage>
        </div>
    );
}
```

The page renders a toolbar with the three actions above a table with a sortable **Name** column. **Edit** and **Remove** stay disabled until a row is selected.

Selecting an author reports the row through `onSelectionChange`, which stores it in `selected`. The edit and remove handlers read that state because `MenuItem.command` receives no arguments. DataPage still owns the selection in this example; the callback gives your handlers access to it.

The explicit type arguments `<AllAuthors, Author, object>` give `event.value` the type `Author | null`. Without them or a typed `detailsComponent`, TypeScript infers the row as `object`. The third argument describes the query's parameters; `object` is used here because `AllAuthors` has none.

`title` is required but does not render a visible heading. Put your own heading or breadcrumb outside the page if you need one. For more actions, including async work and confirmation dialogs, continue with [Menu Items](menu-items.md). `MenuItem` is also available as `DataPage.MenuItem`.

## List-and-detail with a details panel

Pass a `detailsComponent` and `DataPage` adds a resizable split: the table on the left, your component on the right, shown only while a row is selected. Type the component with `IDetailsComponentProps<T>`, exported from `@cratis/components/DataPage`; it receives the selected row as `item`:

```tsx
import { DataPage, Column, type IDetailsComponentProps } from '@cratis/components/DataPage';
import { AllAuthors, type Author } from './Author';

const AuthorDetails = ({ item }: IDetailsComponentProps<Author>) => (
    <section aria-label={`Details for ${item.name}`} style={{ padding: '1rem' }}>
        <h2>{item.name}</h2>
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

A typed `detailsComponent` is enough for TypeScript to infer the row type, so this example needs no explicit type arguments. To load the selected author's books, handle loading, and size the pane, continue with [Details Panel](details-panel.md#complex-details-example). To act on that author, use [Accessing Selected Item](menu-items.md#accessing-selected-item).

## Selection

The table uses single-row selection by default. A user selects a row by clicking it, or by focusing it and pressing Enter or Space.

Leave `selection` out for uncontrolled selection: DataPage keeps the row in its own state and reports changes through `onSelectionChange`. To make selection controlled, pass `selection` and update it from that callback. Your parent component then decides which row remains selected.

Pass `null` to clear a controlled selection and close the details pane. Passing `undefined` hands ownership back to DataPage; it is not an instruction to clear the row.

Activating the selected row again selects the same row; it does not toggle selection off. To let users deselect, for example to close the details pane, use controlled mode and offer an action that sets `selection` to `null`.

Query results can also change selection. After a successful, ready result, the table matches the selected row against the returned rows. If the same object is still present, selection stays unchanged. Otherwise the table reports the refreshed row matching `dataKey`, or `null` if none matches, through `onSelectionChange`. In uncontrolled mode, DataPage updates its internal selection automatically. In controlled mode, your handler decides whether to update `selection`. Clearing the single selection also closes the details pane.

Provide a unique, stable `dataKey` (for example `'id'`) when results can replace row objects. Key values are compared as strings. Without a key, matching uses object identity, so a replacement object for the same row is not a match. A key cannot retain a row absent from the returned page. Loading, failed, and unauthorized results do not reconcile selection; neither does a snapshot query waiting for required arguments.

### Multiple selection

Set `selectionMode='multiple'` and add a `<Column selectionMode='multiple' />` inside `DataPage.Columns` for actions that operate on a set of rows. The column renders a checkbox per row and a select-all checkbox in its header; clicking a row also toggles it. Read the set from `onSelectedItemsChange`, or control it with `selectedItems`. `disableOnUnselected` menu items are disabled while the set is empty.

```tsx
<DataPage<AllAuthors, Author, object>
    title='Authors'
    query={AllAuthors}
    dataKey='id'
    emptyMessage='No authors yet'
    selectionMode='multiple'
    selectedItems={selected}
    onSelectedItemsChange={setSelected}
>
    <DataPage.MenuItems>
        <MenuItem label='Remove selected' icon={FaTrash} disableOnUnselected command={removeSelected} />
    </DataPage.MenuItems>
    <DataPage.Columns>
        <Column selectionMode='multiple' headerStyle={{ width: '3rem' }} />
        <Column field='name' header='Name' sortable />
    </DataPage.Columns>
</DataPage>
```

This is an excerpt: `selected`/`setSelected` are `useState<Author[]>` state and `removeSelected` is your handler. Row activation changes the set through `onSelectedItemsChange`, not the single item through `onSelectionChange`. The set does not choose a details item: the pane still follows the separate single `selection`, including one supplied by a controlled caller in multiple mode. In this excerpt no single item is supplied, so the pane stays closed. Select-all acts only on the rows visible after search and filtering. See [Column Configuration: Selection](../DataTables/column-configuration.md#selection).

## Loading, empty, and failed queries

DataPage renders its table through [`DataTableForQuery`](../DataTables/data-table-for-query.md) or [`DataTableForObservableQuery`](../DataTables/data-table-for-observable-query.md), so it has the same states:

| Situation | What renders |
| --- | --- |
| First result still loading without rows | A loading row with `loadingMessage` (default `Loading…`) |
| Refetching with rows | Existing rows; the table is marked busy |
| Query returned no rows | `emptyMessage` |
| A search or column filter is active and no rows are shown | `filteredEmptyMessage` (default `No rows on this page match the search.`, or `No rows match the search.` with `serverQuery`) |
| Query failed, settled without success, or was unauthorized | An alert row with `failureMessage` or `unauthorizedMessage` |
| Snapshot query missing a required argument | `emptyMessage` (no request is sent) |
| Observable query missing a required argument | A loading row with `loadingMessage` remains until every required argument has a value; Arc does not start a subscription |

Unauthorized takes precedence over failure, which takes precedence over loading. A snapshot response that is not valid JSON, such as an HTML error page from a proxy, is reported by Arc as unsuccessful without throwing and shows the failure row, not `emptyMessage`. Server exception text is not shown. Set the three message props on `DataPage` or configure the provider's `messages.dataTable` defaults. See [Loading, empty, and failed queries](../DataTables/data-table-for-query.md#loading-empty-and-failed-queries) for the exact table behavior.

## Props

### Required Props

- `title`: Page title. Required, but not rendered visibly.
- `query`: Constructor of the generated query (`IQueryFor` or `IObservableQueryFor`)
- `emptyMessage`: Message to display when no rows are available
- `children`: `<DataPage.MenuItems>` and `<DataPage.Columns>`

### Optional Props

- `filteredEmptyMessage`: Message shown instead of `emptyMessage` when a search or column filter is active and no rows are shown. Defaults to the provider's `messages.dataTable.filteredEmpty` (`No rows on this page match the search.`, because only the loaded page is searched) or, with `serverQuery`, `messages.dataTable.filteredEmptyServer` (`No rows match the search.`)
- `onGlobalFilterChange`: Called with the search text each time it changes, so the page can tell a search is active
- `queryArguments`: Named arguments for the generated query. Changes to argument values rerun a snapshot query or resubscribe an observable query. See [Query arguments](#query-arguments).
- `loadingMessage`, `failureMessage`, `unauthorizedMessage`: Optional React content for the query states, passed to the bound table
- `dataKey`: Row property used as stable identity for selection
- `selection`: Currently selected row. See [Selection](#selection).
- `onSelectionChange`: Called with `{ value, originalEvent }` when the selection changes
- `selectionMode`: `'single'` (default) or `'multiple'`; see [Multiple selection](#multiple-selection)
- `selectedItems`: Currently selected rows in multiple mode (controlled)
- `onSelectedItemsChange`: Called with the full selected set when a multiple selection changes
- `detailsComponent`: Component rendered in the resizable details pane while a row is selected
- `onRefresh`: Callback that DataPage passes to the `detailsComponent`. DataPage does not re-run the query when it is called.
- `globalFilterFields`: Row fields searched by a search box above the table. The box appears only when this is set.
- `globalSearchPlaceholder`: Placeholder for the search input
- `globalSearchAriaLabel`: Accessible name for the search input; localize independently from the placeholder
- `defaultFilters`: Initial filter state, a `DataTableFilterMeta` (a `{ value, matchMode }` constraint per field)
- `serverQuery`: Opts the table into server mode, where the server sorts, filters, and searches the complete result before paging. See [Filtering scope](#filtering-scope).
- `clientFiltering`: Deprecated compatibility prop; accepted but ignored. Without `serverQuery`, filtering is always scoped to the loaded query page
- `tablePt` / `tableClassName`: Stable table-part attributes and root class
- `paginatorPt` / `paginatorClassName`: Stable paginator-part attributes and root class
- `paginatorAriaLabels`: Localized labels for the paginator navigation and controls
- `menubarPt` / `menubarClassName`: Stable button-part attributes and root class for the action toolbar
- `actionsAriaLabel`: Accessible name of the action toolbar. Defaults to `'Actions'`.

`tablePtOptions`, `tableUnstyled`, `paginatorPtOptions`, `menubarPtOptions`, and `menubarUnstyled` are deprecated and have no effect.

The query-backed table inside `DataPage` shows a loading row instead of `emptyMessage` while its first result is still performing without rows.

## Query Types

DataPage supports two types of queries:

- `IQueryFor`: Snapshot queries, fetched when the page mounts and again when argument values or the page change
- `IObservableQueryFor`: Observable queries that update the table as the server delivers new results

DataPage checks whether the query class derives from `QueryFor` and renders the matching data table. Both tables request 20 rows per page; the page size is not configurable through DataPage.

## Query arguments

Pass `queryArguments` when the list depends on context, such as the author whose books you want to show. Its property names and values must match the generated query's argument type. When you supply explicit DataPage type arguments, use that generated type as the third argument rather than the `object` used by the parameterless examples above.

Arc waits for every required argument before sending a request or starting a subscription. `undefined`, `null`, and an empty string count as missing. While waiting, a snapshot table shows `emptyMessage`; an observable table keeps showing its loading row. Neither state means the server has returned an empty result, so ask the user to choose the missing context before presenting the list when that distinction matters.

Changing argument values, including optional ones, reruns a snapshot query or resubscribes an observable query. A details component can also run its own query using the selected row's id, as shown in [loading related data](details-panel.md#complex-details-example).

## Filtering scope

By default, column and global filters run against the currently loaded query page. Pagination continues to use the server-reported total so filtering one page never hides later pages. Sorting is also applied to the loaded page only.

To sort, filter, and search the complete result, pass `serverQuery`. DataPage forwards it to its table, which sends the sort as Arc sorting and the filters and search text as the query arguments `serverQuery.toArguments` builds; the server applies them before paging and returns the filtered rows and filtered total. See [Server mode](../DataTables/data-table-for-query.md#server-mode) for the contract and an example.

`clientFiltering` remains in the public props only so existing applications continue to compile. It is deprecated, has no effect, and should not be used in new code. See [DataTableForQuery filtering scope](../DataTables/data-table-for-query.md#filtering-scope-and-server-pagination) for why the browser cannot filter the complete result on its own.

## Layout

DataPage uses Allotment for the resizable split when a `detailsComponent` is provided. The layout consists of:

1. Action toolbar (when `DataPage.MenuItems` is present)
2. Data table with its paginator
3. Optional details panel on the right, while a row is selected

Allotment positions its panes from a stylesheet rather than from inline styles, so the split view only works once that stylesheet is on the page. From 3.0 it is **vendored into `@cratis/components/styles`**, so importing that one file at your app entry point is all it takes — you do not need `allotment/dist/style.css` yourself, and if you were importing it you can drop it. Without `@cratis/components/styles` the details pane grows to its content and clips the paginator. If you import [per-area stylesheets](../Styling/per-area-stylesheets.md) instead of the aggregate, `@cratis/components/DataPage/styles` carries those vendored Allotment rules. When no `detailsComponent` is supplied there is nothing to split, so no split view is mounted at all.

Inside the page, the toolbar sits above the table and takes the height its buttons need, wrapping them when space is tight. The table fills the remaining height and scrolls its rows internally. With a definite-height ancestor, the paginator stays at the bottom of that region, including when a details pane is open.

The split itself does not adapt to narrow viewports: the details pane still opens beside the table, with a preferred width of `450px`. If the list and details cannot both fit, provide your own dialog, route, or stacked layout. See [Narrow screens](details-panel.md#narrow-screens).

### DataPage needs an ancestor with a height

That division only works if there is a height to divide. Every element from the page root down is sized as a percentage of its parent, so **some ancestor of `DataPage` has to have a definite height** — a viewport unit, a pixel height, a grid row, or a flex child that is allowed to shrink. Give it one and the paginator stays on screen no matter how many rows the query returns.

```tsx
// ✅ the layout gives the page a height to divide
<div style={{ height: '100vh' }}>
    <DataPage title='Authors' query={AllAuthors} emptyMessage='No authors found'>
        <DataPage.Columns>
            <Column field='name' header='Name' sortable />
        </DataPage.Columns>
    </DataPage>
</div>
```

```tsx
// ❌ nothing above resolves to a height, so the table grows to its content and
//    the paginator ends up past the bottom of the page
<div>
    <DataPage title='Authors' query={AllAuthors} emptyMessage='No authors found'>
        <DataPage.Columns>
            <Column field='name' header='Name' sortable />
        </DataPage.Columns>
    </DataPage>
</div>
```

A flex or grid child counts as bounded only when it is allowed to shrink — `min-height: 0` on the item, or `overflow: hidden` on the container. Without that, the item's automatic minimum keeps it at content height, which is the same as having no bound at all.

When no ancestor supplies a height, DataPage falls back to a minimum height of `20rem` so the page stays usable instead of collapsing to nothing. Treat that fallback as a symptom, not a solution — fix the ancestor.

## Accessibility and keyboard

- DataPage renders its content inside a `<main>` element. If your application shell already has a `<main>`, the page adds a second main landmark; account for that in your shell.
- The action bar is a toolbar of buttons named by `actionsAriaLabel` (default `'Actions'`). Disabled items are real disabled buttons. Left/Right and Home/End move between actions, and Tab still reaches each one.
- Each data row is a tab stop. Enter or Space selects the focused row; there is no arrow-key navigation between rows. Selected rows carry `aria-selected="true"`.
- Sortable headers are buttons, and the sorted column carries `aria-sort`.
- The table has no accessible name by default, and `title` is not used for one. Name it through the table part: `tablePt={{ table: { 'aria-label': 'Authors' } }}`.
- The divider between the table and the details pane can be dragged with a pointer only; it is not keyboard-operable.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The paginator is cut off or the page is only about `20rem` tall | No ancestor with a definite height. See [DataPage needs an ancestor with a height](#datapage-needs-an-ancestor-with-a-height). |
| The details pane overlaps or grows to its content | The Components stylesheet is not imported. |
| The table shows `emptyMessage` instead of rows | The query completed empty or a snapshot query is missing a required `queryArguments` value. Failures, unsuccessful results, and authorization denials have separate alert rows. |
| Sorting or filtering changes only the visible page | Without `serverQuery`, the table sorts and filters the loaded page. Set `serverQuery` and have the query apply the sort and filter arguments before paging. |
| The table remains in its loading state | The first result has not arrived, or an observable query is missing required `queryArguments`; Arc does not subscribe until all required arguments have values. |
| `event.value.name` or `item.name` does not compile | The row type was inferred as `object`. Add type arguments (`<DataPage<AllAuthors, Author, object>`) or type the `detailsComponent` with `IDetailsComponentProps<Author>`. |
| The selection highlight disappears after an update | Set `dataKey` so rows are matched by identity instead of object reference. |

## Integration

DataPage integrates with:

- `@cratis/arc/queries` and `@cratis/arc.react/queries` for data fetching
- `DataTableForQuery` and `DataTableForObservableQuery` components
- the semantic Cratis data table plus a Cratis action toolbar of Buttons
- Allotment for split view layout — its stylesheet is vendored into `@cratis/components/styles` (and into `@cratis/components/DataPage/styles`), so the split view lays out as long as you import one of them

## See Also

- [Menu Items](menu-items.md) - Configuring the action toolbar
- [Details Panel](details-panel.md) - Working with detail views
- [Column Configuration](../DataTables/column-configuration.md) - Column props, sorting, and filters
- [Pass-through cheat sheet](../Styling/pass-through.md) - Styling the table, paginator, and toolbar parts
