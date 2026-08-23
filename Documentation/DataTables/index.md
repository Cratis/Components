# DataTables

The DataTables module provides a semantic local-array table plus specialized Arc query and observable-query wrappers.

## Components

- **DataTableCore**: For an already-loaded local array
- **DataTableForQuery**: For standard Arc queries with pagination
- **DataTableForObservableQuery**: For observable Arc queries with real-time updates

## When to Use

Use DataTableCore when:

- Rows are already loaded locally
- Single selection and semantic table rendering are sufficient
- Filtering and sorting should apply only to that loaded array

Use DataTableForQuery when:

- You have standard query results
- You need server-side pagination
- Data doesn't need real-time updates

Use DataTableForObservableQuery when:

- You need real-time data synchronization
- Data changes frequently
- You want automatic UI updates

## Common Features

All three table components share:

- Single row selection
- Global filtering
- Custom column templates
- Empty state messages
- Cratis-owned semantic Column markers and stable table parts

Keep an application-owned or direct toolkit table when the surface requires grouping, row expansion, or controlled lazy/server sorting. Components does not silently emulate those behaviors over one loaded page.

## See Also

- [Choosing a component](../choosing-a-component.md) - Local, query-backed, and advanced table boundaries
- [DataTableForQuery](data-table-for-query.md) - Standard query tables
- [DataTableForObservableQuery](data-table-for-observable-query.md) - Real-time tables
- [Column Configuration](column-configuration.md) - Customizing columns
