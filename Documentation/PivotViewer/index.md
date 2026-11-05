---
title: PivotViewer collection exploration
description: Use PivotViewer in Cratis Components to explore a collection as cards, narrow it with filters and search, and open details for a selected item.
---

`PivotViewer` in Cratis Components lets users explore a collection as cards, narrow it with filters and search, and open a selected item's details. Use it when users need to compare groups or find an item visually, rather than work through rows in a table.

## Purpose

Start with a collection your application has already loaded. Define the values users can sort, group, and filter by, then choose the text that helps them recognize each card. PivotViewer handles the card layout, zoom, and pan; your application supplies the data and detail content.

PivotViewer belongs to the [Spatial capability profile](../ui-foundation.md#capability-profiles) alongside [`Canvas`](../Canvas/index.md). Both use the optional `pixi.js` peer, which you must install when using PivotViewer.

## Install the optional Pixi peer

PivotViewer renders cards with `pixi.js`, an optional peer rather than a nested Components dependency. The `@cratis/components/PivotViewer` module imports `pixi.js` when it loads, so install the peer before importing the subpath:

```bash
npm install pixi.js@^8.20.0
```

Keep one compatible Pixi resolution across the application and Components; [Canvas: Single Pixi peer](../Canvas/index.md#single-pixi-peer) explains why. You do not need to write against `PIXI.*` types to use PivotViewer's public props, but its rendering still requires the peer.

## Key Features

Collection view puts the cards in one sorted grid. Grouped view separates them into columns for the active dimension, such as category or price range. Filters and search narrow the collection in either view, while zoom from 10% to 300% and drag or scroll panning let users move through it.

Cards show structured text from `cardRenderer`; `detailRenderer` supplies React content for the selected item. Pixi draws cards near the viewport, and a Web Worker handles filtering, grouping, and sorting when available. These mechanisms reduce drawing and main-thread computation, but collection size still needs an application-specific [performance budget](performance.md#establish-an-application-performance-budget).

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

The array type annotations keep `type: 'number'` from widening to `string`, which would not type-check. Defining the arrays outside the component keeps the definitions and their `getValue` functions stable between renders. Recreating those functions makes PivotViewer rebuild its columns and indexes; [Performance](performance.md#reduce-re-renders) explains which changes trigger that work.

The parent gives the viewer room to draw. PivotViewer fills its parent (`flex: 1`, `max-height: 100%`) and sets no height of its own, so keep the height and flex layout shown above.

## Core Concepts

| Concept | Role |
| --- | --- |
| Dimension | A value to sort by in collection view and group by in grouped view |
| Filter | A selection in the filter panel that narrows the collection |
| Card | A fixed-size text summary of one visible item |
| Details | Your `detailRenderer` content in the selected card's component-owned drawer |

## Loading, empty, and error states

| State | What PivotViewer shows |
| --- | --- |
| `isLoading` is `true` | A spinner in place of the card area, with a screen-reader status message. The default is "Loading…"; set `loadingLabel` to customize it. |
| Indexes are being built | The text "Building indexes..." until the engine is ready. |
| No visible items (empty `data`, or nothing matches the filters and search) | `emptyContent`, or "No items to display." when you omit it. |
| Worker or engine failure | No error UI. Worker errors switch to the in-thread fallback and are logged to the console. Show data-loading errors from your own code. |

## Worker and search architecture

PivotViewer builds a columnar store: one column of extracted values per unique dimension or filter key. It builds the store and indexes on the main thread when `data`, the keys, or the `getValue` functions change. When a Web Worker is available, it copies the store to that worker, which builds its own indexes and answers filtering, grouping, and sorting requests.

The copy includes the original `data` items. Use structured-cloneable data, without functions or other values `postMessage` cannot copy. The option counts and numeric ranges in the filter panel, free-text search, layout, and rendering still run on the main thread.

The worker is optional; Pixi is not. If browser worker APIs are absent, the worker-script probe fails, or the worker reports an error, the engine uses synchronous in-thread computation. That fallback does not replace the browser canvas needed to draw cards. For worker diagnostics and sizing the client collection, follow [Performance](performance.md).

`searchFields` defines where free-text search looks: an array of property-accessor functions (`PropertyAccessor<TItem>[]`, with each accessor written as `(item: TItem) => value`). Each accessor identifies a field path, and a match in any of those fields includes the item. There is no default set of searched fields, so search has no effect until you supply `searchFields`.

:::caution[Search needs plain property accessors and at least one filter]
- PivotViewer does not call the accessors. It reads the property path from each accessor's source text (`item => item.address.city` becomes `address.city`) and looks that path up on each item. Computed accessors such as `item => item.name.toUpperCase()` or `item => format(item)` match nothing.
- The search box lives in the filter panel, and the toolbar shows the filter button only when `filters` has at least one entry. With `searchFields` but no `filters`, users have no way to search.
:::

Search is a case-insensitive substring match over the values at those paths. It runs after categorical and range filtering, over the remaining item IDs, so users can search within an already-narrowed collection.

## See Also

- [Dimensions and Filters](dimensions-and-filters.md): choose how users divide and narrow the collection.
- [Renderers](renderers.md): put identifying text on cards and actions in the detail drawer.
- [Configuration](configuration.md): look up props, defaults, and search options.
- [Interactions](interactions.md): understand zoom, pan, filtering, and selection.
- [Performance](performance.md): measure the working set your application can support.
