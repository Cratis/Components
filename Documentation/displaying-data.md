---
title: "Recipe: Displaying data"
description: Render query results in a data table that updates live, and build list-and-detail screens with DataPage.
---

**Goal:** show the results of an Arc query in a table — and have it update on its own when the underlying read model changes.

## Choose who owns the rows

| Starting point | Surface | Runtime boundary |
| --- | --- | --- |
| Observable generated query | `DataTableForObservableQuery` | Arc subscription and backend results |
| One-shot generated query | `DataTableForQuery` | Arc query execution and backend results |
| Rows already owned by the application | `DataTableCore` | Host-supplied rows and updates; no Arc request from this surface |
| Query list with selection, actions, and details | `DataPage` | Query-backed composition plus explicit selected-row handoff |

The query examples need [Getting started](getting-started.mdx), a running backend, and generated `AllAuthors` in `src/Authors/Author.ts`. Follow the [library tutorial](tutorial/index.md) for the full setup. Local-data surfaces do not execute Arc requests, but Arc's required npm peers remain required.

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

While the first result is loading without rows, the table shows `Loading…`. A failed or unauthorized query shows an alert instead of `emptyMessage`; a successful empty result shows `emptyMessage`. You can change these messages with `loadingMessage`, `failureMessage`, and `unauthorizedMessage`, or configure provider defaults. During a refetch the existing rows remain visible and the table is marked busy. For a one-shot (non-live) query, use `DataTableForQuery` the same way.

## Interpret query status

| Outcome | Default feedback | Next check |
| --- | --- | --- |
| First result pending | `Loading…` | Backend connection if it persists |
| Successful empty result | `No data available.` or your `emptyMessage` | Query arguments and matching data |
| Failed query | `Could not load data.` | Request and backend exception |
| Unauthorized query | `You are not authorized to view this data.` | Authentication and backend authorization |
| Refresh with existing rows | Rows remain; table is busy | Wait for the next result, not a new initial-empty screen |

Failure and authorization status take priority over loading and empty status. A custom detail panel using a query hook must handle those states itself.

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

## Keep paging and filtering on the intended side

Query-backed paging uses the query's paging contract. When applying new query arguments, reset to page zero so a new filter does not reuse an old page index. Client-side filtering of loaded rows or one loaded page is not a search across the entire server result; use query arguments for that.

Column `field` is a plain string. Keep it aligned with generated row members; unlike command-field accessors, misspelled column fields are not necessarily compile-time errors. A `DataPage` also needs a definite ancestor height and a visible heading supplied by the application; its `title` prop alone is not rendered.

## Tips

- **When the table updates** — it re-renders when the observable query delivers a changed result. Command success and row visibility are separate checkpoints; there is no fixed delay promised by Components. With Chronicle behind Arc, a projection must update the read model before the query can report it. Components does not subscribe directly to Chronicle. See [Read Models](/chronicle/read-models/).
- Keep read models **specialized per screen** — a table query and a detail query can read different, purpose-built read models rather than one shared model.

## Next

- [Building a form](building-a-form.md) — the write side
- [DataTables](DataTables/index.md) — choose the Arc query wrapper and configure columns
- [DataPage](DataPage/index.md) — compose a query-backed list screen with actions and details
