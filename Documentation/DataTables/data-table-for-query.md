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
import { DataTableForQuery } from '@cratis/components';
import { Column } from 'primereact/column';
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
- `defaultFilters`: Initial filter configuration
- `clientFiltering`: Enable client-side filtering (default: false)
- `children`: Column definitions

## Pagination

DataTableForQuery automatically handles pagination with a default page size of 20 items. Pagination controls are displayed at the bottom of the table.

## Server-Side Filtering

Default mode - filters are applied on the server:

```typescript
<DataTableForQuery
    query={MyQuery}
    globalFilterFields={['name', 'email']}
    emptyMessage="No results"
>
    <Column field="name" header="Name" />
    <Column field="email" header="Email" />
</DataTableForQuery>
```

## Client-Side Filtering

Enable client-side filtering for smaller datasets:

```typescript
<DataTableForQuery
    query={MyQuery}
    clientFiltering={true}
    defaultFilters={{
        name: { value: '', matchMode: 'contains' }
    }}
    emptyMessage="No results"
>
    <Column field="name" header="Name" filter />
    <Column field="status" header="Status" filter />
</DataTableForQuery>
```

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
