---
title: DataTables for local rows and Arc queries
description: Choose a Cratis Components table for local rows, snapshot Arc queries, or observable queries, with clear paging and filtering boundaries.
---

DataTables in Cratis Components render local arrays or results from Cratis Arc queries as React tables. Use local rows when you manage loading yourself, a snapshot query for a result fetched on request, or an observable query to update the displayed rows through a subscription.

## When to Use

Choose `DataTableCore` when you already have an array of rows and want the table to display, sort, filter, and select from that array. It does not run a query for you. It also fits when you run a query yourself and need a custom loading or failure layout rather than the query tables' status rows; see [Loading, empty, and failed queries](data-table-for-query.md#loading-empty-and-failed-queries). Start with [Column Configuration](column-configuration.md) to define the cells you want to show.

Use [DataTableForQuery](data-table-for-query.md) for a generated Arc snapshot query: each request returns a result rather than subscribing to later changes. The table runs the query and handles server-side pagination. Follow its guide to connect the query proxy and configure selection.

When the displayed rows should follow updates from an Arc observable query, use [DataTableForObservableQuery](data-table-for-observable-query.md). The table manages the subscription and server-side pagination, so you do not need to copy each incoming result into a local array yourself. Its guide shows the query binding and how updates affect row selection.

Both query-backed tables sort, filter, and search only the loaded page by default. Pagination alone does not make a search cover the whole result. For that, configure `serverQuery` and a query that applies filtering and search before paging; [Server mode](data-table-for-query.md#server-mode) explains the contract.

## Components

All three tables render rows through `DataTableCore` and use `Column` to describe the cells. `ColumnFilterMenu` supplies the filter popup, and `TablePaginator` supplies page navigation. Their standalone contracts are below if you are composing your own table layout.

`DataTableCore` accepts a `status` from `DataTableStatus` (`Ready`, `Loading`, `Failed`, or `Unauthorized`); it defaults to `Ready`. Import `DataTableStatus` from `@cratis/components/DataTables`. For a loading table with no rows, it renders a status row; with rows, it retains them and marks the table busy. Failed or unauthorized states render an alert row. Override the text with `loadingMessage`, `failureMessage`, and `unauthorizedMessage` or configure `CratisComponentsProvider`'s `messages.dataTable`.

When a search or column filter is active and no rows are shown, the table renders `filteredEmptyMessage` instead of `emptyMessage`. The default says only the loaded page was searched, or is neutral when `rowProcessing` is `None` because the server applies the search.

`DataTableCore` keeps its own sort, column filters, and search text unless you control them. Pass `sort` with `onSortChange`, `filters` with `onFilter`, and `globalFilter` with `onGlobalFilterChange` to own that state, for example to persist it or to send it to the server. `sort={null}` means not sorted; leaving a prop undefined lets the table keep that piece of state itself, and the change callbacks report every change either way. Import `DataTableSort`, `DataTableSortDirection`, and `DataTableRowProcessing` from `@cratis/components/DataTables`.

When your query has already filtered and sorted the rows on the server, set `rowProcessing={DataTableRowProcessing.None}` so the table renders them as given instead of processing them a second time. The default, `DataTableRowProcessing.Loaded`, filters and sorts the rows the table was given. The query-backed tables manage this state for you when you set `serverQuery`: they send sorting and the mapped filter and search arguments to the server, then render the returned rows without local processing. The query must apply those filter and search arguments itself; see [Server mode](data-table-for-query.md#server-mode).

## Common Features

All three table components share:

- Single or multiple row selection, with row checkboxes and a select-all header in multiple mode (`selectionMode='multiple'`)
- Global filtering
- Custom column templates
- Empty, loading, failure, and unauthorized state messages (set `DataTableCore.status` when rendering a locally managed query)
- Keyboard selection: each row is a tab stop, and Enter or Space selects it; in multiple mode it toggles the row (on `DataTableCore`, only when `selectionMode` or `onRowClick` is set)
- Cratis-owned semantic Column markers and stable table parts

Keep an application-owned or direct toolkit table when the surface requires grouping or row expansion. Components does not emulate those behaviors over one loaded page; server-side sorting is supported through `serverQuery` as described above.

## ColumnFilterMenu

`ColumnFilterMenu` is the same Cratis-owned filter trigger and draft/apply popup that `Column` uses when `filter` is enabled. Most tables should configure filtering through `Column`; use the component directly only when composing a custom table header or another filtering surface.

```tsx
import { useState } from 'react';
import {
    ColumnFilterMenu,
    type DataTableFilterConstraint,
} from '@cratis/components/DataTables';

export function TotalFilter() {
    const [constraint, setConstraint] = useState<DataTableFilterConstraint>();

    return (
        <ColumnFilterMenu
            field='total'
            dataType='numeric'
            constraint={constraint}
            onApply={setConstraint}
            onClear={() => setConstraint(undefined)}
        />
    );
}
```

| Prop             | Type                                              | Description                                                                                         |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `field`          | `string`                                          | Effective field being filtered; also supplies default accessible labels.                            |
| `dataType`       | `'text' \| 'numeric' \| 'date' \| 'boolean'`      | Selects the built-in editor and match-mode family. Defaults to `'text'`.                            |
| `placeholder`    | `string`                                          | Placeholder for the built-in value editor.                                                          |
| `showMatchModes` | `boolean`                                         | Shows the match-mode selector. Defaults to `true`.                                                  |
| `filterOptions`  | `ColumnFilterOption[]`                            | Offers a known set of `{ label, value }` choices in a dropdown instead of a typed value, and narrows the match modes to Equals and Not equals. Takes precedence over `filterElement`. |
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
| `pageLinks`    | `boolean \| { siblings?: number; boundaries?: number }` | Opt-in numbered page buttons with gaps; defaults to `false`. |
| `ariaLabels`   | `object`                 | Localizes navigation, control names, and numbered page names.                         |
| `className`    | `string`                 | Extra class on the paginator root.                                                    |
| `pt`           | `TablePaginatorParts`    | Stable attributes for the root, reports, navigation buttons, numbered pages, and gaps. |

`TablePaginator` does not fetch data or change pages internally. Keep `page`, `pageCount`, and the optional range inputs synchronized with the query result supplied by the host.

### Numbered page links

Set `pageLinks` to show page buttons between previous and next instead of the `info` report.
`true` includes one sibling on each side of the current page and one boundary page at each end.
An object changes those counts: `pageLinks={{ siblings: 2, boundaries: 1 }}`.
The current button has `aria-current='page'` and `data-selected`; clicking any page still requests
its zero-based index. First/last buttons and the loaded range remain unchanged.

The default window shows every page for counts up to seven. Longer ranges keep the selected window
and boundary pages, fill a gap of one page with its number, and show a non-interactive,
`aria-hidden` ellipsis for larger gaps. For custom window sizes the short-range threshold is
`2 * boundaries + 2 * siblings + 3` pages.

This complete example hides the first/last controls and range through the existing parts:

```tsx
import { useState } from 'react';
import { TablePaginator } from '@cratis/components/DataTables';

export function NumberedPages() {
    const [page, setPage] = useState(5);
    return (
        <TablePaginator
            page={page}
            pageCount={12}
            pageLinks
            onPageChange={setPage}
            ariaLabels={{ page: (number) => `Página ${number}`, pages: 'Páginas' }}
            pt={{
                first: { root: { style: { display: 'none' } } },
                last: { root: { style: { display: 'none' } } },
                range: { style: { display: 'none' } },
            }}
        />
    );
}
```

Use the same `pageLinks` prop on `DataPage`, `DataTableForQuery`, or
`DataTableForObservableQuery`. Their `paginatorAriaLabels` and `paginatorPt` props forward
labels and part attributes to the paginator.

| Part | Attributes apply to | State |
| --- | --- | --- |
| `pages` | Numbered-page group container (`HTMLAttributes<HTMLDivElement>`) | `role='group'` and the resolved group label |
| `page` | Each native numbered button (`ButtonHTMLAttributes<HTMLButtonElement>`) | `aria-current='page'` and `data-selected` only on the current button |
| `ellipsis` | Non-interactive gap span (`HTMLAttributes<HTMLSpanElement>`) | `aria-hidden='true'` |

Part names are exposed as `data-cratis-part` values. `pt.page` is a native button attribute
object, unlike the nested `ButtonParts` used by `pt.first`, `pt.previous`, `pt.next`, and `pt.last`.
Use `pt.page.className`, or `[data-cratis-part='page'][data-selected]`, to customize the current page.

Accessible names resolve from `ariaLabels` first, then `CratisComponentsProvider`'s
`messages.paginator`, then English defaults. The new `page: (number: number) => string`
message receives the **one-based** number and defaults to `Page ${number}`. The optional `pages`
message names the group and defaults to `Pages`. Existing messages (`navigation`, `first`,
`previous`, `next`, `last`) keep their precedence.

The visible range text (`1–10 of 32` by default) is also localizable through an optional
`range: (start: number, end: number, total: number) => string` message, set on `ariaLabels` or
`messages.paginator`. It receives the one-based start, the end clamped to the total, and the total:

```tsx
<CratisComponentsProvider
    value={{ messages: { paginator: { range: (start, end, total) => `${start} a ${end} de ${total}` } } }}
>
    <TablePaginator page={0} pageCount={4} pageSize={10} totalItems={32} onPageChange={setPage} />
</CratisComponentsProvider>
```

For a custom composition, import the pure `paginatorPages(page, pageCount, siblings = 1,
boundaries = 1)` helper and its `PaginatorPageItem` type from `@cratis/components/DataTables`.
It returns ordered `{ kind: 'page', page: number }` items with zero-based indices and
`{ kind: 'ellipsis', key: 'start' | 'end' }` gaps. A zero, negative, or non-finite count returns
no items; it clamps the current page to the available pages and truncates numeric inputs.
Negative window sizes become zero; non-finite window sizes use their defaults.

## See Also

- [Choosing a component](../choosing-a-component.md) - Local, query-backed, and advanced table boundaries
- [DataTableForQuery](data-table-for-query.md) - Standard query tables
- [DataTableForObservableQuery](data-table-for-observable-query.md) - Real-time tables
- [Column Configuration](column-configuration.md) - Customizing columns
