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
import { Column } from '@cratis/components/DataPage';
import { FaPlus, FaPencil } from 'react-icons/fa6';
import { AllAuthors } from './queries'; // generated query proxy

function Authors() {
    return (
        <DataPage title='Authors' query={AllAuthors} emptyMessage='No authors found'>
            <DataPage.MenuItems>
                <MenuItem label='Add' icon={FaPlus} command={() => handleAdd()} />
                <MenuItem
                    label='Edit'
                    icon={FaPencil}
                    disableOnUnselected
                    command={() => handleEdit()}
                />
            </DataPage.MenuItems>
            <DataPage.Columns>
                <Column field='name' header='Name' sortable />
                <Column field='id' header='Id' />
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
import { Column } from '@cratis/components/DataPage';
import { AllAuthorsWithBooks } from './queries';

const AuthorDetails = ({ item }) => (
    <div className='p-4'>
        <h2>{item.name}</h2>
        <ul>
            {item.books.map((b) => (
                <li key={String(b.id)}>{b.title}</li>
            ))}
        </ul>
    </div>
);

function Authors() {
    return (
        <DataPage
            title='Authors'
            query={AllAuthorsWithBooks}
            emptyMessage='No authors yet'
            detailsComponent={AuthorDetails}
        >
            <DataPage.Columns>
                <Column field='name' header='Name' sortable />
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
- `globalFilterFields`: Fields to include in loaded-page search
- `globalSearchPlaceholder`: Placeholder for the search input
- `globalSearchAriaLabel`: Accessible name for the search input; localize independently from the placeholder
- `defaultFilters`: Initial filter state, a `DataTableFilterMeta` (a `{ value, matchMode }` constraint per field)
- `clientFiltering`: Deprecated compatibility prop; accepted but ignored because filtering is always scoped to the loaded query page
- `tablePt` / `tableClassName`: Stable table-part attributes and root class
- `paginatorPt` / `paginatorClassName`: Stable paginator-part attributes and root class
- `paginatorAriaLabels`: Localized labels for the paginator navigation and controls

The query-backed table inside `DataPage` suppresses `emptyMessage` while its first result is still performing, so a pending query is not presented as a confirmed empty result.

- `onRefresh`: Callback triggered to signal a data refresh — forwarded to the `detailsComponent`
- `detailsComponent`: Component to render in the resizable details panel when a row is selected

## Query Types

DataPage supports two types of queries:

1. **IQueryFor**: Standard queries with pagination support
2. **IObservableQueryFor**: Observable queries that automatically update when data changes

The component automatically detects the query type and renders the appropriate data table component.

## Filtering scope

Column and global filters run against the currently loaded query page. Pagination continues to use the server-reported total so filtering one page never hides later pages.

`clientFiltering` remains in the public props only so existing applications continue to compile. It is deprecated, has no effect, and should not be used in new code. To filter the complete result set, pass filter values through `queryArguments` and apply them on the server before paging so the query returns the filtered rows and filtered total. See [DataTableForQuery filtering scope](../DataTables/data-table-for-query.md#filtering-scope-and-server-pagination) for the rationale.

## Layout

DataPage uses Allotment for the resizable split when a `detailsComponent` is provided. The layout consists of:

1. Page header with title
2. Menu bar with actions
3. Data table
4. Optional details panel (when item is selected)

Allotment positions its panes from a stylesheet rather than from inline styles, so the split view only works once that stylesheet is on the page. From 3.0 it is **vendored into `@cratis/components/styles`**, so importing that one file at your app entry point is all it takes — you do not need `allotment/dist/style.css` yourself, and if you were importing it you can drop it. Without `@cratis/components/styles` the details pane grows to its content and clips the paginator. When no `detailsComponent` is supplied there is nothing to split, so no split view is mounted at all.

Inside the page, the menu bar and the data table share one vertical column. The menu bar keeps the height it needs; the table region takes everything that is left and scrolls its rows internally. Given an ancestor with a real height — the condition described next — the paginator therefore sits at the bottom of the page rather than below its edge, however many rows the query returns, and whether or not the page is split.

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

When no ancestor supplies a height, DataPage falls back to a small fixed height so the page stays usable instead of collapsing to nothing. Treat that fallback as a symptom, not a solution — fix the ancestor.

## Integration

DataPage integrates with:

- `@cratis/arc/queries` for data fetching
- `DataTableForQuery` and `DataTableForObservableQuery` components
- the semantic Cratis data table plus a Cratis action toolbar of Buttons
- Allotment for split view layout — its stylesheet is vendored into `@cratis/components/styles`, so the split view lays out as long as you import that

## See Also

- [Menu Items](menu-items.md) - Configuring action menus
- [Details Panel](details-panel.md) - Working with detail views
