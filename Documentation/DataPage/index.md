---
title: DataPage
description: Combine query-backed tables, actions, selection, and optional details in a complete data page.
---

`DataPage` turns a generated Arc query into a list page: an action toolbar, a paged table with sorting and filtering, row selection, and an optional details pane for the selected row.

## Purpose

DataPage combines a menu bar, data table, and optional detail view into a single component for building data-driven pages. You declare the pieces as children and props; DataPage wires selection between them.

## Key Features

- Integrated data table with filtering, sorting, and pagination of the loaded page
- Action toolbar whose items can be disabled until a row is selected
- Support for both snapshot queries and observable queries
- Selection management, uncontrolled or controlled
- Split view with a resizable details panel
- A layout that keeps the paginator inside the height the page is given

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

A few things this example relies on:

- `MenuItem.command` receives no arguments. To act on the selected row, keep it in your own state from `onSelectionChange`, as above. DataPage still manages the selection itself; `onSelectionChange` only reports it to you.
- The explicit type arguments `<AllAuthors, Author, object>` tell TypeScript the row type. Without them, and without a typed `detailsComponent`, TypeScript infers the row as `object`, so `event.value.name` does not compile. The third argument is the query's parameter type; use `object` for a query without parameters.
- `title` is required, but DataPage does not render it as a visible heading. Render your own heading or breadcrumb outside the page if you need one.

`MenuItem` is also available as `DataPage.MenuItem`. See [Menu Items](menu-items.md) for the full item surface.

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

A typed `detailsComponent` is enough for TypeScript to infer the row type, so this example needs no explicit type arguments. See [Details Panel](details-panel.md) for loading related data, sizing, and narrow screens.

## Selection

The table uses single-row selection by default. A user selects a row by clicking it, or by focusing it and pressing Enter or Space.

- **Uncontrolled (default):** leave `selection` out. DataPage keeps the selected row in its own state and still calls `onSelectionChange` on every change.
- **Controlled:** pass `selection` and update it from `onSelectionChange`. Pass `null` to clear the selection, which also closes the details pane. Passing `undefined` switches back to uncontrolled mode.

The table itself never clears a selection: clicking the selected row again selects the same row. If users need to deselect, for example to close the details pane, use controlled mode and offer an action that sets `selection` to `null`.

Provide `dataKey` (for example `'id'`) whenever rows can be replaced by new objects, which happens on every observable-query update and every page change. Without it, the table matches the selected row by object identity and loses the highlight when the row objects change.

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

This is an excerpt: `selected`/`setSelected` are `useState<Author[]>` state and `removeSelected` is your handler. `onSelectionChange` is not called in multiple mode, so the details pane, which follows the single selection, stays closed. Select-all acts only on the rows visible after search and filtering. See [Column Configuration: Selection](../DataTables/column-configuration.md#selection).

## Loading, empty, and failed queries

DataPage renders its table through [`DataTableForQuery`](../DataTables/data-table-for-query.md) or [`DataTableForObservableQuery`](../DataTables/data-table-for-observable-query.md), so it has the same states:

| Situation | What renders |
| --- | --- |
| First result still loading without rows | A loading row with `loadingMessage` (default `Loading…`) |
| Refetching with rows | Existing rows; the table is marked busy |
| Query returned no rows | `emptyMessage` |
| Filters or search match nothing on the loaded page | `emptyMessage` |
| Query failed or was unauthorized | An alert row with `failureMessage` or `unauthorizedMessage` |
| Snapshot query missing a required argument | `emptyMessage` (no request is sent) |
| Observable query missing a required argument | Depends on the Arc hook's result state; no subscription starts |

Unauthorized takes precedence over failure, which takes precedence over loading. Server exception text is not shown. Set the three message props on `DataPage` or configure the provider's `messages.dataTable` defaults. See [Loading, empty, and failed queries](../DataTables/data-table-for-query.md#loading-empty-and-failed-queries) for the exact table behavior.

## Props

### Required Props

- `title`: Page title. Required, but not rendered visibly.
- `query`: Constructor of the generated query (`IQueryFor` or `IObservableQueryFor`)
- `emptyMessage`: Message to display when no rows are available
- `children`: `<DataPage.MenuItems>` and `<DataPage.Columns>`

### Optional Props

- `queryArguments`: Arguments to pass to the query. An observable query resubscribes when any argument changes; a snapshot query re-runs when a required argument changes.
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
- `clientFiltering`: Deprecated compatibility prop; accepted but ignored because filtering is always scoped to the loaded query page
- `tablePt` / `tableClassName`: Stable table-part attributes and root class
- `paginatorPt` / `paginatorClassName`: Stable paginator-part attributes and root class
- `paginatorAriaLabels`: Localized labels for the paginator navigation and controls
- `menubarPt` / `menubarClassName`: Stable button-part attributes and root class for the action toolbar
- `actionsAriaLabel`: Accessible name of the action toolbar. Defaults to `'Actions'`.

`tablePtOptions`, `tableUnstyled`, `paginatorPtOptions`, `menubarPtOptions`, and `menubarUnstyled` are deprecated and have no effect.

The query-backed table inside `DataPage` shows a loading row instead of `emptyMessage` while its first result is still performing without rows.

## Query Types

DataPage supports two types of queries:

1. **IQueryFor**: Snapshot queries, fetched when the page mounts and again when a required argument or the page changes
2. **IObservableQueryFor**: Observable queries that update the table when the read model changes on the server

DataPage checks whether the query class derives from `QueryFor` and renders the matching data table. Both tables request 20 rows per page; the page size is not configurable through DataPage.

## Filtering scope

Column and global filters run against the currently loaded query page. Pagination continues to use the server-reported total so filtering one page never hides later pages. Sorting is also applied to the loaded page only.

`clientFiltering` remains in the public props only so existing applications continue to compile. It is deprecated, has no effect, and should not be used in new code. To filter the complete result set, pass filter values through `queryArguments` and apply them on the server before paging so the query returns the filtered rows and filtered total. See [DataTableForQuery filtering scope](../DataTables/data-table-for-query.md#filtering-scope-and-server-pagination) for the rationale.

## Layout

DataPage uses Allotment for the resizable split when a `detailsComponent` is provided. The layout consists of:

1. Action toolbar (when `DataPage.MenuItems` is present)
2. Data table with its paginator
3. Optional details panel on the right, while a row is selected

Allotment positions its panes from a stylesheet rather than from inline styles, so the split view only works once that stylesheet is on the page. From 3.0 it is **vendored into `@cratis/components/styles`**, so importing that one file at your app entry point is all it takes — you do not need `allotment/dist/style.css` yourself, and if you were importing it you can drop it. Without `@cratis/components/styles` the details pane grows to its content and clips the paginator. If you import [per-area stylesheets](../Styling/per-area-stylesheets.md) instead of the aggregate, `@cratis/components/DataPage/styles` carries those vendored Allotment rules. When no `detailsComponent` is supplied there is nothing to split, so no split view is mounted at all.

Inside the page, the menu bar and the data table share one vertical column. The menu bar keeps the height it needs; the table region takes everything that is left and scrolls its rows internally. Given an ancestor with a real height — the condition described next — the paginator therefore sits at the bottom of the page rather than below its edge, however many rows the query returns, and whether or not the page is split.

The split does not adapt to narrow viewports: the details pane opens beside the table at every width. See [Narrow screens](details-panel.md#narrow-screens).

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
- The action bar is a toolbar of buttons named by `actionsAriaLabel` (default `'Actions'`). Disabled items are real disabled buttons.
- Each data row is a tab stop. Enter or Space selects the focused row; there is no arrow-key navigation between rows. Selected rows carry `aria-selected="true"`.
- Sortable headers are buttons, and the sorted column carries `aria-sort`.
- The table has no accessible name by default, and `title` is not used for one. Name it through the table part: `tablePt={{ table: { 'aria-label': 'Authors' } }}`.
- The divider between the table and the details pane can be dragged with a pointer only; it is not keyboard-operable.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The paginator is cut off or the page is only about `20rem` tall | No ancestor with a definite height. See [DataPage needs an ancestor with a height](#datapage-needs-an-ancestor-with-a-height). |
| The details pane overlaps or grows to its content | The Components stylesheet is not imported. |
| The table shows `emptyMessage` instead of rows | The query completed empty, the loaded-page filters matched nothing, or a snapshot query is missing a required `queryArguments` value. Failures and authorization denials have separate alert rows. |
| The table remains in its loading state | The first result has not arrived; if an observable query has missing required `queryArguments`, check whether Arc started a subscription. |
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
