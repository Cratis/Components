---
title: DataTableForQuery
description: Show a paged Arc snapshot query in a table with selection, sorting, and filtering of the loaded page or, in server mode, the complete result.
---

`DataTableForQuery` displays the result of a generated Arc snapshot query (`IQueryFor`) in a paged table.

## Purpose

DataTableForQuery runs an `IQueryFor` query with server-side paging and renders the current page through the semantic Cratis table. Use it on its own, or let [DataPage](../DataPage/index.md) render it for you together with an action toolbar and a details pane.

## Key Features

- Server-side pagination, 20 rows per page
- Single or multiple row selection
- Sorting, column filters, and a global search box, applied to the loaded page or, with `serverQuery`, to the complete result on the server
- Custom column templates
- Empty-state message

## Prerequisites

- `<Arc>` from `@cratis/arc.react` rendered around your app. The table runs the query through Arc's React hooks.
- A generated Arc query proxy that derives from `QueryFor`. For an `ObservableQueryFor` proxy, use [DataTableForObservableQuery](data-table-for-observable-query.md).
- A parent with a definite height if you want the rows to scroll inside the table. The table fills `100%` of its parent's height.

## Basic Usage

```tsx
import { DataTableForQuery, Column } from '@cratis/components/DataTables';
import { AllProducts, type Product } from './Product'; // generated Arc query proxy and read model

export function Products() {
    return (
        <DataTableForQuery query={AllProducts} emptyMessage='No products found' dataKey='id'>
            <Column field='name' header='Name' sortable />
            <Column field='category' header='Category' sortable />
            <Column<Product> field='price' header='Price' body={(product) => product.price.toFixed(2)} />
        </DataTableForQuery>
    );
}
```

`Column<Product>` types the row the `body` renderer receives; without the type argument it is `unknown`. See [Column Configuration](column-configuration.md#typing-fields-and-cells).

## Props

### Required Props

- `query`: Constructor of the generated query (derives from `QueryFor`)
- `emptyMessage`: Message shown when there are no rows to display
- `filteredEmptyMessage`: Message shown instead of `emptyMessage` when a search or column filter is active and no rows are shown. Defaults to `messages.dataTable.filteredEmpty` (`No rows on this page match the search.`) or, with `serverQuery`, `messages.dataTable.filteredEmptyServer` (`No rows match the search.`)
- `onGlobalFilterChange`: Called with the search text each time it changes

### Optional Props

- `children`: `Column` elements
- `queryArguments`: Arguments for the query. The query runs again when a required argument changes.
- `loadingMessage`, `failureMessage`, `unauthorizedMessage`: Optional React content for the loading, failed, and unauthorized states; each overrides its `messages.dataTable` provider message and English default
- `dataKey`: Row property used as stable identity for selection
- `selection`: Currently selected row (controlled)
- `onSelectionChange`: Called with `{ value, originalEvent }` when the user selects a row
- `selectionMode`: `'single'` (default) or `'multiple'`. Multiple selection also needs a `Column` with `selectionMode='multiple'`; see [Column Configuration: Selection](column-configuration.md#selection)
- `selectedItems`: Currently selected rows in multiple mode (controlled)
- `onSelectedItemsChange`: Called with the full selected set when a multiple selection changes
- `globalFilterFields`: Row fields searched by a search box above the table. The box is shown only when this is set.
- `globalSearchPlaceholder`: Search-input placeholder. Falls back to the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s `messages.dataTable.search`, then `'Search…'`
- `globalSearchAriaLabel`: Accessible search-input name; localize independently from the placeholder. Falls back to the provider's `messages.dataTable.searchAriaLabel`, then `'Search table'`
- `defaultFilters`: Initial filter configuration (a `DataTableFilterMeta`)
- `serverQuery`: Opts the table into server mode, where the server sorts, filters, and searches the complete result before paging. See [Server mode](#server-mode).
- `clientFiltering`: Deprecated compatibility prop; accepted but ignored. Without `serverQuery`, filtering is always scoped to the loaded page
- `className` / `pt`: Extra class and stable part attributes for the table
- `paginatorClassName` / `paginatorPt` / `paginatorAriaLabels`: styling and explicit localization overrides for the paginator; accessible names default from `CratisComponentsProvider` messages

`ptOptions`, `unstyled`, and `paginatorPtOptions` are deprecated and have no effect. The accessible name of a selection column comes from the provider's `messages.dataTable.selectRow`, then `'Select row'`, and a multiple-selection header's select-all checkbox from `messages.dataTable.selectAllRows`, then `'Select all rows'`; the query tables have no per-table prop for either.

## Loading, empty, and failed queries

The table distinguishes query state from a successful empty result:

| Situation | What renders |
| --- | --- |
| First result still loading without rows | A loading row with `loadingMessage` (default `Loading…`) |
| Refetching with rows | Existing rows; the table has `aria-busy="true"` and its root has `data-busy` |
| Query returned no rows | `emptyMessage` |
| A search or column filter is active and no rows are shown | `filteredEmptyMessage` |
| Query failed (`hasExceptions === true` or `isValid === false`) | A failure row with `failureMessage` (default `Could not load data.`) |
| Query settled without success (`isSuccess === false`), for example a response that is not valid JSON | A failure row with `failureMessage` |
| Query is unauthorized (`isAuthorized === false`) | A failure row with `unauthorizedMessage` (default `You are not authorized to view this data.`) |
| Snapshot query missing a required argument | `emptyMessage` (Arc sends no request) |
| Observable query missing a required argument | A loading row remains until every required argument has a value (Arc does not subscribe) |

Authorization takes precedence over failure, and failure takes precedence over loading. A snapshot response that is not valid JSON, such as an HTML error page from a proxy, is reported by Arc as an unsuccessful result without throwing; the table shows the failure row, not `emptyMessage`. The loading row announces its content with `role="status"`; failure messages use `role="alert"`. Query exception text is never shown by default. Override the three messages per table or through `CratisComponentsProvider`'s `messages.dataTable`. If you need a custom state layout rather than a table row, use the query hook and render your own composition with `DataTableCore` and `TablePaginator`.

## Pagination

DataTableForQuery requests 20 rows per page. The page size is fixed; there is no prop to change it. The paginator appears below the rows only when the server reports more than one page, and each page change runs the query again for that page.

## Sorting

`sortable` on a `Column` sorts the rows of the loaded page in the browser. The first click sorts ascending, the next descending, and so on; there is no way back to the unsorted order. The sort is not sent to the server, so it does not order the complete result set across pages. To sort the complete result, set `serverQuery`; see [Server mode](#server-mode).

## Filtering

Add `filter` to a `<Column>` for a per-column filter menu, and/or `globalFilterFields` for a global search box. Filtering is applied client-side to the loaded page; seed the initial state with `defaultFilters`:

```tsx
import { DataTableForQuery, Column, DataTableFilterMatchMode } from '@cratis/components/DataTables';

<DataTableForQuery
    query={AllProducts}
    emptyMessage='No matching products'
    dataKey='id'
    globalFilterFields={['name', 'category']}
    defaultFilters={{
        category: { value: 'Books', matchMode: DataTableFilterMatchMode.Equals },
    }}
>
    <Column field='name' header='Name' filter />
    <Column field='category' header='Category' filter />
    <Column field='inStock' header='In stock' filter dataType='boolean' />
</DataTableForQuery>;
```

Each filtered `Column` can localize its overlay through `filterLabels` or replace the built-in value editor through `filterElement`. See [Column Configuration](column-configuration.md#column-filters) for the callback contract and draft/apply behavior.

Filtering affects the currently loaded page while the paginator continues to report the server's total result set.

### Filtering scope and server pagination

`clientFiltering` remains accepted so existing applications continue to compile, but it is deprecated and does not toggle behavior. A browser cannot correctly filter the complete result set when the query has supplied only one server page. Replacing the server total with the number of matches on that page would make later pages unreachable, while caching visited pages would still produce an incomplete result.

For complete-result filtering, set `serverQuery` so the table sends the filters and search text as query arguments and the server applies them before paging; see [Server mode](#server-mode). For a genuinely small dataset that is intentionally loaded in full, use a non-paged query and render that complete collection locally. Do not use `clientFiltering` in new code.

## Server mode

By default the table sorts, filters, and searches only the page it has loaded. Set `serverQuery` to have the server do that work on the complete result before paging:

```tsx
import {
    DataTableForQuery,
    Column,
    type DataTableFilterConstraint,
    type DataTableServerQuery,
} from '@cratis/components/DataTables';
import { SearchProducts, type Product, type SearchProductsParameters } from './Product';

const serverQuery: DataTableServerQuery<SearchProductsParameters> = {
    toArguments: ({ filters, globalFilter }) => ({
        category: (filters.category as DataTableFilterConstraint | undefined)?.value as string | undefined,
        search: globalFilter === '' ? undefined : globalFilter,
    }),
    sortFields: { name: 'displayName' },
};

export function ProductSearch() {
    return (
        <DataTableForQuery<SearchProducts, Product, SearchProductsParameters>
            query={SearchProducts}
            serverQuery={serverQuery}
            emptyMessage='No matching products'
            dataKey='id'
            globalFilterFields={['name']}
        >
            <Column field='name' header='Name' sortable />
            <Column field='category' header='Category' filter />
        </DataTableForQuery>
    );
}
```

In server mode:

- A sort change is sent as Arc sorting. `sortFields` maps a column field to the field the server sorts by; a column that is not listed sorts by its own field.
- Column filters and the search text are passed to `toArguments`, and the arguments it returns are merged over `queryArguments`. Components never guesses argument names or match modes, so `toArguments` decides what each filter means for the query.
- Search text is sent once typing pauses for `searchDebounceMilliseconds` (default 300; `0` sends every change at once).
- Every sort, filter, or search change returns to the first page.
- The rows are rendered exactly as the query returns them, and the paginator shows the totals the server reports for the filtered result.
- The search box still appears only when `globalFilterFields` is set; in server mode those fields are not used to match rows.

The query must return an `IQueryable` or use MongoDB `Observe` so Arc can sort and page the complete result, and it must apply the filter and search arguments itself. Without `serverQuery`, the table behaves exactly as described under [Sorting](#sorting) and [Filtering](#filtering).

## Selection

Every row is selectable, with or without a selection column. Track a single selection with `selection` and `onSelectionChange`:

```tsx
import { useState } from 'react';
import { DataTableForQuery, Column } from '@cratis/components/DataTables';
import { AllProducts, type Product } from './Product';

export function SelectableProducts() {
    const [selected, setSelected] = useState<Product | null>(null);

    return (
        <>
            <DataTableForQuery<AllProducts, Product, object>
                query={AllProducts}
                emptyMessage='No products found'
                dataKey='id'
                selection={selected}
                onSelectionChange={(event) => setSelected(event.value)}
            >
                <Column field='name' header='Name' />
            </DataTableForQuery>
            <p>Selected: {selected?.name ?? 'nothing'}</p>
        </>
    );
}
```

The explicit type arguments (query, row, and query parameters) type `event.value` as `Product | null`. Without them TypeScript infers the row as `object`. Use `object` as the third argument for a query without parameters.

For multiple selection with row checkboxes and a select-all header, see [Column Configuration: Selection](column-configuration.md#selection).

Set `dataKey` so the selected row is still highlighted after a page change or a re-run replaces the row objects. The table never clears a selection itself; set `selection` to `null` to clear it.

## With Query Arguments

Pass arguments to a query that takes parameters:

```tsx
import { DataTableForQuery, Column } from '@cratis/components/DataTables';
import {
    ProductsInCategory,
    type Product,
    type ProductsInCategoryParameters,
} from './Product';

export function ProductsForCategory({ category }: { category: string }) {
    return (
        <DataTableForQuery<ProductsInCategory, Product, ProductsInCategoryParameters>
            query={ProductsInCategory}
            queryArguments={{ category }}
            emptyMessage='No products in this category'
            dataKey='id'
        >
            <Column field='name' header='Product' />
            <Column field='price' header='Price' />
        </DataTableForQuery>
    );
}
```

If a required argument is missing, Arc does not call the server and the table shows `emptyMessage`. In server mode, the arguments from `serverQuery.toArguments` count toward this check.

## Keyboard and accessibility

- The table renders a native `<table>` with `scope="col"` header cells.
- Each row is a tab stop. Enter or Space selects the focused row, and the selected row carries `aria-selected="true"`. There is no arrow-key navigation between rows.
- Sortable headers are buttons; the sorted column carries `aria-sort`.
- The table has no accessible name by default. Add one through the table part: `pt={{ table: { 'aria-label': 'Products' } }}`.
- The paginator's controls are named through `paginatorAriaLabels` or the provider messages.

## Integration

Integrates with:

- `@cratis/arc/queries` for data fetching
- `@cratis/arc.react/queries` for React hooks
- semantic Cratis table and Arc-backed paginator

## See Also

- [Column Configuration](column-configuration.md) - Customizing columns
- [DataTableForObservableQuery](data-table-for-observable-query.md) - Real-time alternative
- [DataPage](../DataPage/index.md) - Table with an action toolbar and details pane
