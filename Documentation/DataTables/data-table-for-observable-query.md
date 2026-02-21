# DataTableForObservableQuery

Displays data from observable queries that automatically refresh when the underlying data changes.

## Purpose

DataTableForObservableQuery displays data from observable queries that automatically update in real-time.

## Key Features

- Automatic data updates
- Real-time synchronization
- Single row selection
- Global filtering
- Custom column templates
- Same API as DataTableForQuery

## Basic Usage

```typescript
import { DataTableForObservableQuery } from '@cratis/components';
import { Column } from 'primereact/column';
import { MyObservableQuery } from './queries';

function MyTable() {
    return (
        <DataTableForObservableQuery
            query={MyObservableQuery}
            emptyMessage="No data available"
            dataKey="id"
        >
            <Column field="name" header="Name" sortable />
            <Column field="lastUpdated" header="Last Updated" />
        </DataTableForObservableQuery>
    );
}
```

## Props

Same as DataTableForQuery, but the query must extend `IObservableQueryFor`.

### Required Props

- `query`: Observable query constructor (extends IObservableQueryFor)
- `emptyMessage`: Message when no data is found

### Optional Props

- `queryArguments`: Optional arguments for the query
- `dataKey`: Unique identifier field
- `selection`: Currently selected row
- `onSelectionChange`: Callback when selection changes
- `globalFilterFields`: Fields to search in global filter
- `defaultFilters`: Initial filter configuration
- `children`: Column definitions

## Observable Behavior

The table automatically subscribes to the observable query and updates the display when:

- New items are added
- Existing items are modified
- Items are removed

This makes it ideal for real-time dashboards and live data monitoring.

## Real-Time Dashboard Example

```typescript
function LiveDashboard() {
    return (
        <DataTableForObservableQuery
            query={ActiveOrdersQuery}
            emptyMessage="No active orders"
            dataKey="id"
        >
            <Column 
                field="orderNumber" 
                header="Order #" 
            />
            <Column 
                field="status" 
                header="Status"
                body={(row) => <StatusBadge status={row.status} />}
            />
            <Column 
                field="lastUpdated" 
                header="Updated"
                body={(row) => formatTimeAgo(row.lastUpdated)}
            />
        </DataTableForObservableQuery>
    );
}
```

## With Selection

```typescript
const [selectedOrder, setSelectedOrder] = useState(null);

<DataTableForObservableQuery
    query={OrdersQuery}
    selection={selectedOrder}
    onSelectionChange={(e) => setSelectedOrder(e.value)}
    emptyMessage="No orders"
>
    <Column field="orderNumber" header="Order #" />
    <Column field="customerName" header="Customer" />
    <Column field="status" header="Status" />
</DataTableForObservableQuery>
```

## Performance Considerations

Observable queries continuously listen for updates. Consider:

1. **Subscription cleanup**: Handled automatically by the component
2. **Update frequency**: Design queries to minimize unnecessary updates
3. **Data size**: Observable queries work best with moderate-sized datasets
4. **Network traffic**: Updates are pushed, reducing polling overhead

## Use Cases

Perfect for:

- Real-time dashboards
- Live monitoring systems
- Chat applications
- Notification feeds
- Collaborative editing tools
- IoT device status
- Stock tickers
- Order tracking systems

## Integration

Integrates with:

- `@cratis/arc/queries` for observable query support
- `@cratis/arc.react/queries` for React observable hooks
- PrimeReact DataTable

## See Also

- [Column Configuration](column-configuration.md) - Customizing columns
- [DataTableForQuery](data-table-for-query.md) - Standard query alternative
