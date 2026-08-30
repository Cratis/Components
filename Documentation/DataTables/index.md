# DataTables

The DataTables module provides a semantic local-array table plus specialized Arc query and observable-query wrappers.

## Components

- **DataTableCore**: For an already-loaded local array
- **DataTableForQuery**: For standard Arc queries with pagination
- **DataTableForObservableQuery**: For observable Arc queries with real-time updates
- **ColumnFilterMenu**: The reusable draft/apply filter popup used by filterable columns
- **TablePaginator**: The standalone zero-based paginator used by query-backed tables

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

## ColumnFilterMenu

`ColumnFilterMenu` is the same Cratis-owned filter trigger and draft/apply popup that `Column` uses when `filter` is enabled. Most tables should configure filtering through `Column`; use the component directly only when composing a custom table header or another filtering surface.

```tsx
import { useState } from 'react';
import {
    ColumnFilterMenu,
    type DataTableFilterConstraint,
} from '@cratis/components/DataTables';

const [constraint, setConstraint] = useState<DataTableFilterConstraint>();

<ColumnFilterMenu
    field='total'
    dataType='numeric'
    constraint={constraint}
    onApply={setConstraint}
    onClear={() => setConstraint(undefined)}
/>;
```

| Prop             | Type                                              | Description                                                                                         |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `field`          | `string`                                          | Effective field being filtered; also supplies default accessible labels.                            |
| `dataType`       | `'text' \| 'numeric' \| 'date' \| 'boolean'`      | Selects the built-in editor and match-mode family. Defaults to `'text'`.                            |
| `placeholder`    | `string`                                          | Placeholder for the built-in value editor.                                                          |
| `showMatchModes` | `boolean`                                         | Shows the match-mode selector. Defaults to `true`.                                                  |
| `filterElement`  | `ColumnFilterElement`                             | Replaces the built-in editor. Its options expose draft value/mode updates and apply/clear actions.  |
| `labels`         | `Partial<ColumnFilterMenuLabels>`                 | Localizes trigger, editor, match mode, and action labels. Provider-level defaults are also honored. |
| `pt`             | `ColumnFilterMenuParts`                           | Stable part attributes for the trigger, popover, menu, editor, actions, and action buttons.         |
| `constraint`     | `DataTableFilterConstraint`                       | Currently applied value and optional match mode.                                                    |
| `onApply`        | `(constraint: DataTableFilterConstraint) => void` | Receives the draft constraint when Apply is activated.                                              |
| `onClear`        | `() => void`                                      | Removes the field constraint.                                                                       |

The popup keeps draft edits local until Apply is activated. Clear resets the draft value and calls `onClear`; Apply calls `onApply`. Neither action closes the popup automatically—it remains open until the user dismisses it or toggles the trigger. Built-in date, numeric, boolean, and text editors use the corresponding match modes; register custom matching behavior through the DataTables matcher APIs rather than relying on a renderer-specific registry.

## TablePaginator

Use `TablePaginator` when a custom query/list composition needs the same first/previous/next/last navigation as the query-backed tables. Pages are always zero-based.

```tsx
import { TablePaginator } from '@cratis/components/DataTables';

<TablePaginator
    page={1}
    pageCount={8}
    pageSize={10}
    totalItems={75}
    onPageChange={(page) => loadPage(page)}
/>;
```

| Prop           | Type                     | Description                                                                           |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `page`         | `number`                 | Current zero-based page.                                                              |
| `pageCount`    | `number`                 | Total page count. Boundary controls disable on the first and last pages.              |
| `onPageChange` | `(page: number) => void` | Receives the requested zero-based page. The host owns loading and current-page state. |
| `totalItems`   | `number`                 | Total record count. Together with `pageSize`, enables the loaded range report.        |
| `pageSize`     | `number`                 | Rows per page. Together with `totalItems`, enables the loaded range report.           |
| `ariaLabels`   | `object`                 | Localizes the navigation and first/previous/next/last accessible names.               |
| `className`    | `string`                 | Extra class on the paginator root.                                                    |
| `pt`           | `TablePaginatorParts`    | Stable attributes for the root, reports, and the four button parts.                   |

`TablePaginator` does not fetch data or change pages internally. Keep `page`, `pageCount`, and the optional range inputs synchronized with the query result supplied by the host.

## See Also

- [Choosing a component](../choosing-a-component.md) - Local, query-backed, and advanced table boundaries
- [DataTableForQuery](data-table-for-query.md) - Standard query tables
- [DataTableForObservableQuery](data-table-for-observable-query.md) - Real-time tables
- [Column Configuration](column-configuration.md) - Customizing columns
