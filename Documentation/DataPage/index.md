# DataPage

The `DataPage` component provides a complete page layout for displaying and managing data from queries, including table view, menu actions, and optional detail panels.

## Purpose

DataPage combines a page header, data table, menu bar, and optional detail view into a single, cohesive component for building data-driven pages.

## Key Features

- Integrated data table with filtering and pagination
- Action menu bar with context-aware items
- Support for both queries and observable queries
- Selection management
- Split view with details panel
- Responsive layout using Allotment

## Basic Usage

```typescript
import { DataPage, MenuItem, MenuItems, Columns } from '@cratis/components';
import { Column } from 'primereact/column';
import { MyQuery } from './queries';

function MyDataPage() {
    return (
        <DataPage
            title="My Data"
            query={MyQuery}
            emptyMessage="No data found"
        >
            <MenuItems>
                <MenuItem 
                    label="Create" 
                    icon="pi pi-plus"
                    command={() => handleCreate()}
                />
                <MenuItem 
                    label="Edit" 
                    icon="pi pi-pencil"
                    disableOnUnselected={true}
                    command={() => handleEdit()}
                />
            </MenuItems>
            
            <Columns>
                <Column field="name" header="Name" />
                <Column field="description" header="Description" />
                <Column field="createdAt" header="Created" />
            </Columns>
        </DataPage>
    );
}
```

## Props

### Required Props

- `title`: Page title
- `query`: Constructor for the query type (IQueryFor or IObservableQueryFor)
- `emptyMessage`: Message to display when no data is available

### Optional Props

- `queryArguments`: Arguments to pass to the query
- `dataKey`: Unique key field for data items
- `globalFilterFields`: Fields to include in global search
- `defaultFilters`: Initial filter state
- `ClientFiltering`: Enable client-side filtering
- `DetailsComponent`: Component to render in detail panel
- `detailsTitle`: Title for the details panel
- `initialSizes`: Initial sizes for split view panels

## Query Types

DataPage supports two types of queries:

1. **IQueryFor**: Standard queries with pagination support
2. **IObservableQueryFor**: Observable queries that automatically update when data changes

The component automatically detects the query type and renders the appropriate data table component.

## Layout

DataPage uses Allotment for resizable split panels when a DetailsComponent is provided. The layout consists of:

1. Page header with title
2. Menu bar with actions
3. Data table
4. Optional details panel (when item is selected)

## Integration

DataPage integrates with:

- `@cratis/arc/queries` for data fetching
- `DataTableForQuery` and `DataTableForObservableQuery` components
- PrimeReact components (Menubar, DataTable)
- Allotment for split view layout

## See Also

- [Menu Items](menu-items.md) - Configuring action menus
- [Details Panel](details-panel.md) - Working with detail views
