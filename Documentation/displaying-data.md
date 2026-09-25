---
title: "Recipe: Displaying data"
description: Render query results in a data table that updates live, and build list-and-detail screens with DataPage.
---

**Goal:** show the results of an Arc query in a table — and have it update on its own when the underlying read model changes.

## A live table from an observable query

If your query is observable, `DataTableForObservableQuery` subscribes for you and re-renders as new data arrives — no polling, no manual subscription:

```tsx
import { Column, DataTableForObservableQuery } from '@cratis/components/DataTables';
import { AllAuthors } from './Authors/Author';   // generated observable query proxy

export const Authors = () => (
    <DataTableForObservableQuery query={AllAuthors} emptyMessage="No authors yet">
        <Column field="name" header="Name" sortable />
        <Column field="id" header="Id" />
    </DataTableForObservableQuery>
);
```

While the first result is loading, the table suppresses `emptyMessage` instead of showing a loading indicator; once the query has finished with no rows, it shows `emptyMessage`. The table does not render query failures: a failed or unauthorized query also ends with no rows and shows `emptyMessage`. When the screen must tell those cases apart, read the query result with the hook below. For a one-shot (non-live) query, use `DataTableForQuery` the same way.

## Prefer the hook when you need the data, not a table

When you want the values themselves (to filter, summarize, or render custom markup), call `.use()` on the proxy:

```tsx
import { AllAuthors } from './Authors/Author';

export const AuthorCount = () => {
    const [authors] = AllAuthors.use();
    if (!authors.isAuthorized) return <p>You don't have access to the author list.</p>;
    if (authors.hasExceptions) return <p role='alert'>Couldn't load authors.</p>;
    if (authors.isPerforming && !authors.hasData) return <p>Loading…</p>;
    return <p>{authors.data.length} authors</p>;
};
```

## List-and-detail with DataPage

For the common "table on the left, details on the right" screen, `DataPage` gives you the layout, selection, and a resizable detail panel out of the box:

```tsx
import { DataPage } from '@cratis/components/DataPage';
```

See [DataPage](DataPage/index.md) for menu items, the details panel, and selection wiring.

## Tips

- **When the table updates** — an observable table re-renders when the query's source reports a change. With a direct database backend that happens after the write; with Chronicle, the read model updates shortly after a command appends its event, once the projection catches up. See [Read Models](/chronicle/read-models/).
- Keep read models **specialized per screen** — a table query and a detail query can read different, purpose-built read models rather than one shared model.

## Next

- [Building a form](building-a-form.md) — the write side
- [DataTables](DataTables/index.md) — choose the Arc query wrapper and configure columns
- [DataPage](DataPage/index.md) — compose a query-backed list screen with actions and details
