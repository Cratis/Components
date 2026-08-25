# PivotViewer

The `PivotViewer` component provides an interactive, high-performance visualization for exploring large datasets with dynamic grouping, filtering, and zooming capabilities.

PivotViewer belongs to the [Spatial capability profile](../ui-foundation.md#capability-profiles) alongside [`Canvas`](../Canvas/index.md) — the only two subpaths that install the optional `pixi.js` peer. Spatial is not a lesser-supported tier: it ships at the same version, behind the same release gates, as every Foundation and Advanced React subpath.

## Purpose

PivotViewer enables users to explore and analyze collections of data items through an intuitive, visual interface with pivot-style grouping and filtering.

## Install the optional Pixi peer

PivotViewer renders cards with `pixi.js`, an optional peer rather than a nested Components dependency:

```bash
npm install pixi.js@^8.20.0
```

Keep exactly one compatible Pixi resolution across the application and Components — see [Canvas: Single Pixi peer](../Canvas/index.md#single-pixi-peer) for why. Unlike `Canvas`, PivotViewer does not expose Pixi types on its own public props, so consuming it does not require writing against `PIXI.*` types directly; the peer is still required at install time because PivotViewer's own rendering depends on it.

## Key Features

- High-performance rendering using Web Workers
- Columnar data storage for efficient filtering
- Dynamic grouping by configurable dimensions
- Multiple filter types (categorical, range, search)
- Smooth zoom and pan interactions
- Responsive card-based layout
- Collection and detail view modes
- Custom card and detail renderers

## Quick Start

```typescript
import { PivotViewer } from '@cratis/components/PivotViewer';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
}

function ProductViewer() {
    const dimensions = [
        { key: 'category', label: 'Category', getValue: (item: Product) => item.category }
    ];

    const filters = [
        { key: 'category', label: 'Category', type: 'string', getValue: (item: Product) => item.category }
    ];

    return (
        <PivotViewer
            data={products}
            dimensions={dimensions}
            filters={filters}
            defaultDimensionKey="category"
            cardRenderer={(item) => ({ title: item.name, labels: ['Category'], values: [item.category] })}
            detailRenderer={(item) => <ProductDetails product={item} />}
            getItemId={(item) => item.id}
            searchFields={[item => item.name, item => item.category]}
        />
    );
}
```

## Core Concepts

- **Dimensions**: Properties to group data by
- **Filters**: Options to narrow down the dataset
- **Cards**: Visual representation of items in collection view
- **Details**: Full information shown when item is selected

## Worker and search architecture

PivotViewer computes indexing, filtering, and grouping off the main thread. A dedicated Web Worker (`pivot.worker.ts`) owns columnar storage and the filter/group/sort computation; the `usePivotEngine` hook posts work to it and resolves promises as results come back, so large datasets do not block interaction while a filter or grouping recomputes.

The worker is optional infrastructure, not a hard requirement: `usePivotEngine` checks `typeof window === 'undefined' || typeof Worker === 'undefined'` before creating it, and separately probes that the worker script actually serves as JavaScript before instantiating it. Either check failing — including during server rendering, where `window` and `Worker` do not exist — falls back to the equivalent synchronous, in-thread computation instead of failing. PivotViewer therefore degrades gracefully rather than crashing in SSR or restrictive environments; it simply loses the off-main-thread benefit there.

`searchFields` drives PivotViewer's free-text search: an array of property-accessor functions (`PropertyAccessor<TItem>[]`, i.e. `(item: TItem) => value`), one per field the search box should match against. A search term matches an item when it matches the value returned by any accessor in the array — there is no default set of searched fields, so search is a no-op until `searchFields` is supplied.

## See Also

- [Configuration](configuration.md) - Props and options
- [Dimensions and Filters](dimensions-and-filters.md) - Setting up data access
- [Renderers](renderers.md) - Customizing card and detail views
- [Interactions](interactions.md) - Zoom, pan, filter, select
- [Performance](performance.md) - Optimization for large datasets
