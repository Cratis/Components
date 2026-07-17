# DataTables

The DataTables module provides specialized table components for displaying data from queries and observable queries.

## Components

- **DataTableForQuery**: For standard queries with pagination
- **DataTableForObservableQuery**: For observable queries with real-time updates

## When to Use

Use DataTableForQuery when:

- You have standard query results
- You need server-side pagination
- Data doesn't need real-time updates

Use DataTableForObservableQuery when:

- You need real-time data synchronization
- Data changes frequently
- You want automatic UI updates

## Common Features

Both table components share:

- Single row selection
- Global filtering
- Custom column templates
- Empty state messages
- PrimeReact Column support

## Bring your own renderer

Both tables are built on a small, UI-library-agnostic rendering seam: Cratis
owns the query and paging behavior, and hands rendering off to any component
that satisfies the `TableRenderer` contract. `DataTableForQuery` is just
`bindQuery(DataTableCore)`. To render a query's paged rows with your own table
implementation, see [Bring your own table renderer](bring-your-own-renderer.md).

## See Also

- [DataTableForQuery](data-table-for-query.md) - Standard query tables
- [DataTableForObservableQuery](data-table-for-observable-query.md) - Real-time tables
- [Column Configuration](column-configuration.md) - Customizing columns
- [Bring your own table renderer](bring-your-own-renderer.md) - Plug in a custom renderer
