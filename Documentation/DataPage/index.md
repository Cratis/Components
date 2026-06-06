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

Declare the columns and menu actions with the compound `DataPage.Columns` and `DataPage.MenuItems` children, imported alongside `DataPage` from `@cratis/components/DataPage`:

```tsx
import { DataPage, MenuItem } from '@cratis/components/DataPage';
import { Column } from 'primereact/column';
import { FaPlus, FaPencil } from 'react-icons/fa';
import { AllAuthors } from './queries';   // generated query proxy

function Authors() {
    return (
        <DataPage
            title="Authors"
            query={AllAuthors}
            emptyMessage="No authors found">
            <DataPage.MenuItems>
                <MenuItem label="Add" icon={FaPlus} command={() => handleAdd()} />
                <MenuItem label="Edit" icon={FaPencil} disableOnUnselected command={() => handleEdit()} />
            </DataPage.MenuItems>
            <DataPage.Columns>
                <Column field="name" header="Name" sortable />
                <Column field="id" header="Id" />
            </DataPage.Columns>
        </DataPage>
    );
}
```

`disableOnUnselected` greys the menu item out until a row is selected — wire your edit and remove actions to it so they only fire on a selection.

## List-and-detail with a details panel

Pass a `detailsComponent` and `DataPage` adds a resizable split: the table on the left, your component on the right, shown only when a row is selected. The component receives the selected row as `item` (the `IDetailsComponentProps<T>` contract):

```tsx
import { DataPage } from '@cratis/components/DataPage';
import { Column } from 'primereact/column';
import { AllAuthorsWithBooks } from './queries';

const AuthorDetails = ({ item }) => (
    <div className="p-4">
        <h2>{item.name}</h2>
        <ul>{item.books.map(b => <li key={String(b.id)}>{b.title}</li>)}</ul>
    </div>
);

function Authors() {
    return (
        <DataPage
            title="Authors"
            query={AllAuthorsWithBooks}
            emptyMessage="No authors yet"
            detailsComponent={AuthorDetails}>
            <DataPage.Columns>
                <Column field="name" header="Name" sortable />
            </DataPage.Columns>
        </DataPage>
    );
}
```

Selection is managed for you; to drive it yourself, pass `selection` and `onSelectionChange`.

## Props

### Required Props

- `title`: Page title
- `query`: Constructor for the query type (IQueryFor or IObservableQueryFor)
- `emptyMessage`: Message to display when no data is available

### Optional Props

- `queryArguments`: Arguments to pass to the query
- `dataKey`: Unique key field for data items
- `selection`: Currently selected item
- `onSelectionChange`: Callback when the selection changes
- `globalFilterFields`: Fields to include in global search
- `defaultFilters`: Initial filter state (see [DataTableFilterMeta](https://primereact.org/datatable/))
- `clientFiltering`: Enable client-side filtering (default: `false`)
- `onRefresh`: Callback triggered to signal a data refresh — forwarded to the `detailsComponent`
- `detailsComponent`: Component to render in the resizable details panel when a row is selected

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
