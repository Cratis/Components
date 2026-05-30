---
title: "Recipe: Displaying data"
description: Render query results in a data table that updates live, and build list-and-detail screens with DataPage.
sidebar:
  order: 4
---

**Goal:** show the results of an Arc query in a table — and have it update on its own when the underlying read model changes.

## A live table from an observable query

If your query is observable, `DataTableForObservableQuery` subscribes for you and re-renders as new data arrives — no polling, no manual subscription:

```tsx
import { DataTableForObservableQuery } from '@cratis/components';
import { Column } from 'primereact/column';
import { AllAuthors } from './Author';   // generated observable query proxy

export const Authors = () => (
    <DataTableForObservableQuery query={AllAuthors}>
        <Column field="name" header="Name" sortable />
        <Column field="id" header="Id" />
    </DataTableForObservableQuery>
);
```

For a one-shot (non-live) query, use `DataTableForQuery` the same way.

## Prefer the hook when you need the data, not a table

When you want the values themselves (to filter, summarize, or render custom markup), call `.use()` on the proxy:

```tsx
const [authors] = AllAuthors.use();
const count = authors.data.length;
```

## List-and-detail with DataPage

For the common "table on the left, details on the right" screen, `DataPage` gives you the layout, selection, and a resizable detail panel out of the box:

```tsx
import { DataPage } from '@cratis/components/DataPage';
```

See the DataPage reference for menu items, the details panel, and selection wiring.

## Tips

- **Eventual consistency** — the read model behind your query updates shortly after a command appends its event. An observable table reflects that automatically the moment the projection catches up. See [Read Models](/chronicle/read-models/).
- Keep read models **specialized per screen** — a table query and a detail query can read different, purpose-built read models rather than one shared model.

## Next

- [Building a form](/components/building-a-form/) — the write side.
- [Build a full-stack feature](/build-a-full-app/) — the table and the form together against one Arc slice.
