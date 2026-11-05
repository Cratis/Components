---
title: "Display query data with Cratis Components"
description: Render Arc query results in a Cratis Components React table, distinguish loading from empty results, and choose live updates or a one-shot query.
---

Cratis Components tables render rows from Arc queries and handle loading, empty, failed, and unauthorized results. Use an observable query when the screen should receive later updates, or a one-shot query when it only needs a snapshot. If your application already owns the rows, use the local-data table instead.

## Choose who owns the rows

| Starting point | Surface | Runtime boundary |
| --- | --- | --- |
| Observable generated query | `DataTableForObservableQuery` | Arc subscription and backend results |
| One-shot generated query | `DataTableForQuery` | Arc query execution and backend results |
| Rows already owned by the application | `DataTableCore` | Host-supplied rows and updates; no Arc request from this surface |
| Query list with selection, actions, and details | `DataPage` | Query-backed composition plus explicit selected-row handoff |

For the query examples, complete [Getting started](getting-started.mdx), keep the backend running, and use the generated `AllAuthors` proxy in `src/Authors/Author.ts`. The [library tutorial](tutorial/index.md) supplies the full setup. A local-data table makes no Arc requests, though the package still requires its declared Arc npm peer dependencies.

## A live table from an observable query

`AllAuthors` is observable: it can deliver changed results after the first load. `DataTableForObservableQuery` subscribes to those results, so the screen needs no polling or application subscription code:

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

Denied access takes priority, followed by exceptions or invalid query arguments. A performing or not-ready result is loading; once it settles, an unsuccessful result is a failure even without exceptions. None of these states means a successful empty result. A custom panel using a query hook must handle these states itself.

## Prefer the hook when you need the data, not a table

When you want the values themselves (to filter, summarize, or render custom markup), call `.use()` on the proxy:

```tsx
import { AllAuthors } from './Authors/Author';

export const AuthorCount = () => {
    const [authors] = AllAuthors.use();
    if (!authors.isAuthorized) return <p>You don't have access to the author list.</p>;
    const isLoading = authors.isPerforming || authors.isReady === false;
    if (authors.hasExceptions || authors.isValid === false || (!isLoading && authors.isSuccess === false)) {
        return <p role='alert'>Couldn't load authors.</p>;
    }
    if (isLoading && !authors.hasData) return <p>Loading…</p>;
    return <p>{authors.data.length} authors</p>;
};
```

The initial not-ready result shows **Loading…**, not zero authors. Existing data stays visible during a refresh; zero authors means a successful empty result. If the query fails, check its arguments and the backend response before retrying. For denied access, check sign-in and permissions.

## List-and-detail with DataPage

When selecting a row should open its details beside the table, use `DataPage` for the layout, selection, and resizable detail panel:

```tsx
import { DataPage } from '@cratis/components/DataPage';
```

See [DataPage](DataPage/index.md) for menu items, the details panel, and selection wiring.

## Keep paging and filtering on the intended side

Query-backed paging uses the query's paging contract. When applying new query arguments, reset to page zero so a new filter does not reuse an old page index. Client-side filtering of loaded rows or one loaded page is not a search across the entire server result; use query arguments for that.

Column `field` is a plain string. Keep it aligned with generated row members; unlike command-field accessors, misspelled column fields are not necessarily compile-time errors. A `DataPage` also needs a definite ancestor height and a visible heading supplied by the application; its `title` prop alone is not rendered.

## Tips

An observable table re-renders when its query delivers a changed result. Command success and row visibility are separate checkpoints; Components promises no fixed delay between them. With Cratis Chronicle behind Arc, a projection must update the read model, the data shape used for reading, before the query can report it. Components does not subscribe directly to Chronicle. See [Read Models](/chronicle/read-models/).

Keep read models specialized per screen. A table query and a detail query can read different, purpose-built models, so neither has to return everything the other screen needs.

## Next

- [Building a form](building-a-form.md) — the write side
- [DataTables](DataTables/index.md) — choose the Arc query wrapper and configure columns
- [DataPage](DataPage/index.md) — compose a query-backed list screen with actions and details
