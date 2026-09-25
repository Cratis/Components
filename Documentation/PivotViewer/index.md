---
title: PivotViewer
description: Explore large datasets through interactive grouping, filtering, zooming, and spatial rendering.
---

The `PivotViewer` component draws a collection of items as cards that users can sort, group, filter, search, zoom, and pan, with a detail drawer for the selected card.

PivotViewer belongs to the [Spatial capability profile](../ui-foundation.md#capability-profiles) alongside [`Canvas`](../Canvas/index.md) — the only two subpaths that install the optional `pixi.js` peer. Spatial is not a lesser-supported tier: it ships at the same version, behind the same release gates, as every Foundation and Advanced React subpath.

## Purpose

PivotViewer enables users to explore and analyze collections of data items through an intuitive, visual interface with pivot-style grouping and filtering.

## Install the optional Pixi peer

PivotViewer renders cards with `pixi.js`, an optional peer rather than a nested Components dependency. The `@cratis/components/PivotViewer` module imports `pixi.js` when it loads, so install the peer before importing the subpath:

```bash
npm install pixi.js@^8.20.0
```

Keep exactly one compatible Pixi resolution across the application and Components — see [Canvas: Single Pixi peer](../Canvas/index.md#single-pixi-peer) for why. Unlike `Canvas`, PivotViewer does not expose Pixi types on its own public props, so consuming it does not require writing against `PIXI.*` types directly; the peer is still required at install time because PivotViewer's own rendering depends on it.

## Key Features

- Cards drawn with Pixi (WebGL); only cards near the viewport get a sprite
- Filtering, grouping, and sorting answered by a Web Worker when one is available, with an in-thread fallback
- Collection view (one sorted grid) and grouped view (one column per dimension value)
- Categorical and numeric range filters, plus free-text search over `searchFields`
- Zoom from 10% to 300% and drag or scroll panning
- Card layout that reflows to the container width
- Text-only cards through `cardRenderer`, and custom detail content through `detailRenderer`

## Quick Start

Import `@cratis/components/tokens` and `@cratis/components/styles` (or `@cratis/components/PivotViewer/styles` with `styles/base`) once at the application root, then:

```tsx
import {
    PivotViewer,
    type PivotDimension,
    type PivotFilter,
} from '@cratis/components/PivotViewer';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
}

const dimensions: PivotDimension<Product>[] = [
    { key: 'category', label: 'Category', getValue: (item) => item.category },
];

const filters: PivotFilter<Product>[] = [
    { key: 'category', label: 'Category', getValue: (item) => item.category, multi: true },
    { key: 'price', label: 'Price', type: 'number', getValue: (item) => item.price },
];

export function ProductViewer({ products }: { products: Product[] }) {
    return (
        <div style={{ height: 600, display: 'flex', flexDirection: 'column' }}>
            <PivotViewer
                data={products}
                dimensions={dimensions}
                filters={filters}
                defaultDimensionKey='category'
                cardRenderer={(item) => ({
                    title: item.name,
                    labels: ['Category', 'Price'],
                    values: [item.category, item.price.toFixed(2)],
                })}
                detailRenderer={(item) => (
                    <dl>
                        <dt>Category</dt>
                        <dd>{item.category}</dd>
                        <dt>Price</dt>
                        <dd>{item.price.toFixed(2)}</dd>
                    </dl>
                )}
                getItemId={(item) => item.id}
                searchFields={[(item) => item.name, (item) => item.category]}
            />
        </div>
    );
}
```

The viewer opens in collection view, sorted by category. Choose **Grouped** in the toolbar to see one column per category, open the filter button to narrow by category or price and to search, and click a card to open its details.

Three details in this example are easy to get wrong:

- **Typed definitions.** Annotate the arrays as `PivotDimension<T>[]` and `PivotFilter<T>[]`. An untyped array literal widens `type: 'number'` to `string`, which does not type-check.
- **Stable definitions.** `dimensions` and `filters` live outside the component. A new array on every render makes PivotViewer rebuild its column store and indexes each time; see [Performance](performance.md#reduce-re-renders).
- **A sized parent.** PivotViewer fills its parent (`flex: 1`, `max-height: 100%`) and sets no height of its own. Give the parent a height and `display: flex; flex-direction: column`, as above.

## Core Concepts

- **Dimensions**: Values to sort by in collection view and to group by in grouped view
- **Filters**: Facets in the filter panel that narrow the dataset
- **Cards**: Fixed-size text cards, one per visible item
- **Details**: Your `detailRenderer` content in a component-owned drawer for the selected card

## Loading, empty, and error states

| State | What PivotViewer shows |
| --- | --- |
| `isLoading` is `true` | A spinner in place of the card area. It has no text or live-region announcement, so add your own status message if screen-reader users need one. |
| Indexes are being built | The text "Building indexes..." until the engine is ready. |
| No visible items (empty `data`, or nothing matches the filters and search) | `emptyContent`, or "No items to display." when you omit it. |
| Worker or engine failure | No error UI. Worker errors switch to the in-thread fallback and are logged to the console. Show data-loading errors from your own code. |

## Worker and search architecture

PivotViewer keeps each dimension and filter value in a columnar store. When `data`, `dimensions`, or `filters` change, it extracts those values and builds the store and indexes on the main thread. When a Web Worker is available, it also posts that store to a dedicated worker (`pivot.worker.ts`), which builds its own indexes and answers filter, grouping, and sort requests. The `usePivotEngine` hook posts each request and resolves a promise when the result comes back, so recomputing a filter or grouping does not block interaction.

The store posted to the worker includes the original `data` items, so items must be structured-cloneable plain data: no functions or other values `postMessage` cannot copy.

Two computations always run on the main thread: the option counts and numeric ranges shown in the filter panel, and free-text search.

The worker is optional infrastructure, not a hard requirement: `usePivotEngine` checks `typeof window === 'undefined' || typeof Worker === 'undefined'` before creating it, and separately probes that the worker script actually serves as JavaScript before instantiating it. Either check failing — including during server rendering, where `window` and `Worker` do not exist — falls back to the equivalent synchronous, in-thread computation instead of failing. PivotViewer therefore degrades gracefully rather than crashing in SSR or restrictive environments; it simply loses the off-main-thread benefit there.

`searchFields` drives PivotViewer's free-text search: an array of property-accessor functions (`PropertyAccessor<TItem>[]`, i.e. `(item: TItem) => value`), one per field the search box should match against. A search term matches an item when it matches the value returned by any accessor in the array — there is no default set of searched fields, so search is a no-op until `searchFields` is supplied.

:::caution[Search needs plain property accessors and at least one filter]
- PivotViewer does not call the accessors. It reads the property path from each accessor's source text (`item => item.address.city` becomes `address.city`) and looks that path up on each item. Computed accessors such as `item => item.name.toUpperCase()` or `item => format(item)` match nothing.
- The search box lives in the filter panel, and the toolbar shows the filter button only when `filters` has at least one entry. With `searchFields` but no `filters`, users have no way to search.
:::

Facet/range filtering and grouping run in the worker when available. Free-text search is then applied on the main thread only to the already-visible item IDs returned by that engine step, with accessor paths resolved once per search pass. This keeps worker/fallback behavior identical while avoiding a second scan of records that filters already excluded.

## See Also

- [Configuration](configuration.md) - Props and options
- [Dimensions and Filters](dimensions-and-filters.md) - Setting up data access
- [Renderers](renderers.md) - Customizing card and detail views
- [Interactions](interactions.md) - Zoom, pan, filter, select
- [Performance](performance.md) - Optimization for large datasets
