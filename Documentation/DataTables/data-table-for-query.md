# DataTableForQuery

Displays data from standard queries with pagination and filtering support.

## Purpose

DataTableForQuery provides a data table specifically designed for `IQueryFor` queries with server-side pagination.

## Key Features

- Server-side pagination
- Lazy loading
- Single row selection
- Global filtering
- Custom column templates
- Client-side filtering option

## Basic Usage

```typescript
import { DataTableForQuery } from '@cratis/components/DataTables';
import { Column } from '@cratis/components/DataTables';
import { MyQuery } from './queries';

function MyTable() {
    return (
        <DataTableForQuery
            query={MyQuery}
            emptyMessage="No data available"
            dataKey="id"
        >
            <Column field="name" header="Name" sortable />
            <Column field="email" header="Email" />
            <Column field="status" header="Status" />
        </DataTableForQuery>
    );
}
```

## Props

### Required Props

- `query`: Query constructor (extends IQueryFor)
- `emptyMessage`: Message when no data is found

### Optional Props

- `queryArguments`: Optional arguments for the query
- `dataKey`: Unique identifier field
- `selection`: Currently selected row
- `onSelectionChange`: Callback when selection changes
- `globalFilterFields`: Fields to search in global filter
- `defaultFilters`: Initial filter configuration (a `DataTableFilterMeta`)
- `clientFiltering`: Deprecated compatibility prop; accepted but ignored because filtering is always scoped to the loaded page
- `paginatorClassName` / `paginatorAriaLabels`: styling and explicit localization overrides for the paginator; accessible names default from the configured PrimeReact locale
- `children`: Column definitions

While the first query result is still performing, an empty default data array renders a silent table body rather than `emptyMessage`. Once the query settles, a genuinely empty result renders the configured message normally.

## Pagination

DataTableForQuery automatically handles pagination with a default page size of 20 items. Pagination controls are displayed at the bottom of the table.

## Filtering

Add `filter` to a `<Column>` for a per-column filter menu, and/or `globalFilterFields` for a global search box. Filtering is applied client-side to the loaded page; seed the initial state with `defaultFilters`:

```typescript
<DataTableForQuery
    query={MyQuery}
    globalFilterFields={['name', 'email']}
    defaultFilters={{
        name: { value: '', matchMode: 'contains' }
    }}
    emptyMessage="No results"
>
    <Column field="name" header="Name" filter />
    <Column field="status" header="Status" filter />
</DataTableForQuery>
```

Each filtered `Column` can localize its overlay through `filterLabels` or replace the built-in value editor through `filterElement`. See [Column Configuration](column-configuration.md#column-filters) for the callback contract and draft/apply behavior.

Filtering affects the currently loaded page while the paginator continues to report the server's total result set.

### Filtering scope and server pagination

`clientFiltering` remains accepted so existing applications continue to compile, but it is deprecated and does not toggle behavior. A browser cannot correctly filter the complete result set when the query has supplied only one server page. Replacing the server total with the number of matches on that page would make later pages unreachable, while caching visited pages would still produce an incomplete result.

For complete-result filtering, put the filter values in `queryArguments`, apply them to the server query before paging, and return the filtered total from the server. For a genuinely small dataset that is intentionally loaded in full, use a non-paged query and render that complete collection locally. Do not use `clientFiltering` in new code.

## Selection

Handle row selection:

```typescript
const [selectedItem, setSelectedItem] = useState(null);

<DataTableForQuery
    query={MyQuery}
    selection={selectedItem}
    onSelectionChange={(e) => setSelectedItem(e.value)}
    emptyMessage="No data"
>
    <Column field="name" header="Name" />
</DataTableForQuery>
```

## With Query Arguments

Pass arguments to the query:

```typescript
<DataTableForQuery
    query={ProductsByCategory}
    queryArguments={{ categoryId: selectedCategory }}
    emptyMessage="No products"
>
    <Column field="name" header="Product Name" />
    <Column field="price" header="Price" />
</DataTableForQuery>
```

## Integration

Integrates with:

- `@cratis/arc/queries` for data fetching
- `@cratis/arc.react/queries` for React hooks
- PrimeReact DataTable and Paginator

## See Also

- [Column Configuration](column-configuration.md) - Customizing columns
- [DataTableForObservableQuery](data-table-for-observable-query.md) - Real-time alternative
