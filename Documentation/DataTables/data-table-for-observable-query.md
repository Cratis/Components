---
title: DataTableForObservableQuery
description: Show a paged Arc observable query in a table that updates when the read model changes on the server.
---

`DataTableForObservableQuery` displays the result of a generated Arc observable query and updates the rows when the underlying data changes.

## Purpose

DataTableForObservableQuery subscribes to an `IObservableQueryFor` query with server-side paging and re-renders the current page whenever the server pushes a new result. Its props are the same as [DataTableForQuery](data-table-for-query.md).

## Key Features

- Automatic data updates
- Server-side pagination, 20 rows per page
- Single or multiple row selection
- Sorting, column filters, and a global search box, all applied to the loaded page
- Custom column templates
- Same props as DataTableForQuery

## Basic Usage

```tsx
import { DataTableForObservableQuery, Column } from '@cratis/components/DataTables';
import { AllAuthors } from './Author'; // generated Arc observable query proxy

export function LiveAuthors() {
    return (
        <div style={{ height: '480px' }}>
            <DataTableForObservableQuery query={AllAuthors} emptyMessage='No authors yet' dataKey='id'>
                <Column field='name' header='Name' sortable />
            </DataTableForObservableQuery>
        </div>
    );
}
```

When a new author is added to the read model on the server, the row appears without a reload.

Give the table a parent with a definite height. It measures its container and sizes the scrolling row area from that height, with a minimum of 200 pixels.

## Props

Same as DataTableForQuery, but the query must derive from `ObservableQueryFor`.

### Required Props

- `query`: Constructor of the generated observable query (derives from `ObservableQueryFor`)
- `emptyMessage`: Message shown when there are no rows to display

### Optional Props

- `children`: `Column` elements
- `queryArguments`: Arguments for the query. The table resubscribes when any argument changes.
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
- `clientFiltering`: Deprecated compatibility prop; accepted but ignored because filtering is always scoped to the loaded page
- `className` / `pt`: Extra class and stable part attributes for the table
- `paginatorClassName` / `paginatorPt` / `paginatorAriaLabels`: styling and explicit localization overrides for the paginator; accessible names default from `CratisComponentsProvider` messages

`ptOptions`, `unstyled`, and `paginatorPtOptions` are deprecated and have no effect.

Filtered columns use the same `filterLabels` localization and `filterElement` custom-editor seams as `DataTableForQuery`. See [Column Configuration](column-configuration.md#column-filters). Filters are applied client-side to the currently loaded observable-query page, while pagination continues to use the server-reported totals.

The deprecated `clientFiltering` prop remains accepted only for source compatibility and does not change that scope. Complete-result filtering must be applied by the server before paging, with filter values passed in `queryArguments`; see [Filtering scope and server pagination](data-table-for-query.md#filtering-scope-and-server-pagination).

While the first observable result is performing without rows, the table shows a loading row with a status announcement instead of `emptyMessage`. If a required argument is missing, Arc does not subscribe and this loading row remains until every required argument has a value. During a refetch with rows, it keeps the rows and marks the table busy. An unauthorized result takes precedence over a failed result; either displays a failure row with an alert instead of an empty state. A successful empty result still shows `emptyMessage`. Set `loadingMessage`, `failureMessage`, or `unauthorizedMessage` to customize these states. See [Loading, empty, and failed queries](data-table-for-query.md#loading-empty-and-failed-queries) for the state rules and defaults.

## Observable Behavior

The table subscribes to the observable query when it mounts and unsubscribes when it unmounts. It updates the display when the server pushes a new result, for example when:

- New items are added
- Existing items are modified
- Items are removed

Each update replaces the row objects. Set `dataKey` so the selected row stays highlighted across updates. Sorting and filters are kept and applied to the new rows.

## Real-Time Dashboard Example

Use `body` to render a cell with other components. Type the column with `Column<Row>` so the renderer receives your row type:

```tsx
import { DataTableForObservableQuery, Column } from '@cratis/components/DataTables';
import { Tag } from '@cratis/components/Display';
import { AllAuthors, type Author } from './Author';

export function LiveAuthors() {
    return (
        <div style={{ height: '480px' }}>
            <DataTableForObservableQuery query={AllAuthors} emptyMessage='No authors yet' dataKey='id'>
                <Column field='name' header='Name' sortable />
                <Column<Author>
                    header='Status'
                    body={(author) => <Tag severity='success' value={`Registered: ${author.name}`} />}
                />
            </DataTableForObservableQuery>
        </div>
    );
}
```

## With Selection

```tsx
import { useState } from 'react';
import { DataTableForObservableQuery, Column } from '@cratis/components/DataTables';
import { AllAuthors, type Author } from './Author';

export function SelectableAuthors() {
    const [selected, setSelected] = useState<Author | null>(null);

    return (
        <DataTableForObservableQuery<AllAuthors, Author, object>
            query={AllAuthors}
            emptyMessage='No authors yet'
            dataKey='id'
            selection={selected}
            onSelectionChange={(event) => setSelected(event.value)}
        >
            <Column field='name' header='Name' />
        </DataTableForObservableQuery>
    );
}
```

The explicit type arguments type `event.value` as `Author | null`; without them TypeScript infers the row as `object`.

## Performance Considerations

Observable queries continuously listen for updates. Consider:

1. **Subscription cleanup**: Handled automatically by the component
2. **Update frequency**: Design queries to minimize unnecessary updates
3. **Data size**: Observable queries work best with moderate-sized datasets
4. **Network traffic**: Updates are pushed, reducing polling overhead

## Use Cases

Use an observable table when users need to see changes made elsewhere without reloading, such as:

- Operational dashboards and status boards
- Work queues shared by several users
- Lists that other parts of the app change while the list is open

Keyboard and accessibility behavior is the same as [DataTableForQuery](data-table-for-query.md#keyboard-and-accessibility).

## Integration

Integrates with:

- `@cratis/arc/queries` for observable query support
- `@cratis/arc.react/queries` for React observable hooks
- semantic Cratis data table

## See Also

- [Column Configuration](column-configuration.md) - Customizing columns
- [DataTableForQuery](data-table-for-query.md) - Standard query alternative
