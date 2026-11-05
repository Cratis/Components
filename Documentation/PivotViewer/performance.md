---
title: PivotViewer performance planning
description: Set a PivotViewer performance budget by measuring initial load, filtering, scrolling, and memory with representative data and target devices.
---

Plan PivotViewer collection size by measuring initial load, filtering, scrolling, and memory on your target devices. Viewport-limited drawing and optional worker computation reduce different kinds of work, but neither establishes an item-count or frame-rate guarantee for your application.

## Architecture

PivotViewer splits its work across the main thread, a Web Worker, and a Pixi canvas. Use this division to locate a delay: a worker will not remove time spent extracting values or drawing cards.

| Work | Where it runs | When |
| --- | --- | --- |
| Calling dimension and filter `getValue`, building the column store and indexes | Main thread | When `data` changes identity or the extractor keys or `getValue` functions change |
| Filtering, grouping, and sorting visible ids | Web Worker, or the main thread when no worker is available | On every filter, dimension, or view change |
| Filter-panel option counts and numeric ranges | Main thread, over all of `data` | Whenever `data`, `filters`, or a filter selection changes |
| Free-text search | Main thread, over the currently visible ids | On every search change |
| Card layout | Main thread | On grouping, zoom, or container size changes |
| Card drawing | Pixi, for cards near the viewport | As you zoom and scroll |

The repository's 2,500-item employee story demonstrates a collection; it is not a benchmark or an upper bound. Use your own item shape and interactions to decide how much data to load.

### Web Workers

A background Web Worker answers filtering, grouping, and sorting requests when available. The main thread first extracts values and builds the column store and local indexes. It then posts the store to the worker, which keeps its own copy and builds its own indexes. Filter-panel counts, search, layout, and rendering remain on the main thread.

Keep source items structured-cloneable, without functions or other values `postMessage` cannot copy. The worker receives the original `data` items as part of the store, so large nested objects add to initialization and memory cost even if cards never display them.

PivotViewer checks that the worker script is served as JavaScript before starting it. If that check fails, `window` or `Worker` is unavailable, or the worker reports an error, the engine uses synchronous in-thread computation. Worker errors are logged as `[PivotEngine] Worker error:`. This fallback covers the data engine; it does not provide server-rendered cards or replace Pixi's browser canvas. Measure it separately because it moves filter, grouping, and sort work onto the main thread.

### Columnar Storage

Each unique dimension or filter `key` becomes one column:

```text
Row items:
[{ id: 'a', status: 'todo', priority: 3 }, { id: 'b', status: 'done', priority: 8 }, ...]

Columns built by PivotViewer:
status:   ['todo', 'done', ...]      (string column, with a value-to-ids index)
priority: Float64Array [3, 8, ...]   (number column, with a sorted index for ranges)
```

Filters then work on item IDs (`Uint32Array`) and only read the columns they need. The original items remain alongside the columns for rendering and details. Sharing a key does not create another column, so use the same key for a dimension and filter only when they extract the same value.

### Virtualized Rendering

Cards are Pixi sprites, not DOM elements. Only cards inside the viewport and a surrounding buffer get sprites. Sprites leaving that area return to a pool for reuse, and `cardRenderer` fills the cards being drawn rather than every source item up front.

This limits drawing work, not data loading. PivotViewer still retains the full client collection, columns, indexes, grouping results, and layout metadata; scrolling does not fetch another server page.

## Performance Tips

### Optimize Accessors

Keep dimension and filter accessors simple. `getValue` runs for every item each time the store is rebuilt, and filter `getValue` runs again for every item whenever filter-panel counts are recomputed.

Read a prepared value directly:

```typescript
const status: PivotDimension<Task> = {
    key: 'status',
    label: 'Status',
    getValue: (item) => item.status,
};
```

Avoid repeating an expensive calculation during each rebuild:

```typescript
const status: PivotDimension<Task> = {
    key: 'status',
    label: 'Status',
    // Runs for every item on every rebuild
    getValue: (item) => expensiveCalculation(item),
};
```

Precompute expensive values when you load `data`, and read the precomputed property in `getValue`.

### Memoize Renderers

Keep `cardRenderer` limited to lightweight structured data (`{ title, labels?, values? }`). Detail content can be a React component: the memoized `TaskDetails` below can skip a parent-driven re-render when its `item` reference is unchanged.

```tsx
import { memo } from 'react';

const TaskDetails = memo(({ item }: { item: Task }) => (
    <div className='task-details'>
        <h4>{item.title}</h4>
        <p>{item.description}</p>
    </div>
));

<PivotViewer
    data={tasks}
    dimensions={taskDimensions}
    cardRenderer={(item) => ({ title: item.title, values: [item.description] })}
    detailRenderer={(item) => <TaskDetails item={item} />}
/>;
```

### Limit Initial Data

PivotViewer filters and searches only the items in `data`; it does not page or fetch. Give it the collection users actually need to explore, and narrow larger sets in your query before rendering (for example, by time range or scope).

If you append more items later, pass a new array. Each new `data` array rebuilds the store and indexes and shows "Building indexes..." while the worker catches up, so batch additions rather than appending one item at a time.

### Keep items and details light

Cards cannot show images, so image cost only matters in your `detailRenderer`. Load large images or related data there, when the user opens a card, rather than putting them on every item in `data`: every item is copied to the worker.

### Reduce Re-renders

Keep `data`, extractor keys, and `getValue` functions stable when their meaning has not changed. New accessor functions rebuild the store and indexes, even if they read the same properties. Changing only a dimension's label, formatter, or group sorter does not rebuild its columns.

The inline definition below creates a new `getValue` function on every render:

```tsx
<PivotViewer
    data={tasks}
    // Creates a new array on every render
    dimensions={[{ key: 'status', label: 'Status', getValue: (item: Task) => item.status }]}
    cardRenderer={taskCardRenderer}
/>
```

Memoize a definition that belongs inside the component:

```tsx
const dimensions = useMemo<PivotDimension<Task>[]>(
    () => [{ key: 'status', label: 'Status', getValue: (item) => item.status }],
    [],
);

<PivotViewer data={tasks} dimensions={dimensions} cardRenderer={taskCardRenderer} />;
```

Module-level constants work as well. The same applies to `data`: pass the same array until the items actually change.

## Establish an application performance budget

Components does not publish universal item-count timing claims: load, filter, grouping, layout, and sprite cost depend on the data shape, accessors, card renderer, browser, device, and whether the worker path is available. Benchmark the representative production shape on the slowest supported device before choosing a maximum collection size.

Record at least:

- time from data change to the first stable collection frame;
- filter-update latency;
- dimension/grouping-change latency;
- main-thread long tasks while the worker is active;
- worker-unavailable fallback latency;
- memory after repeated data/filter changes;
- zoom/pan frame rate with the representative card renderer.

Use fixed fixtures and repeat each run after warm-up. Keep the dataset, browser/device, build mode, and measurement method with the result so future releases can compare like-for-like. If a budget is exceeded, reduce the client collection before rendering, provide narrower `searchFields`, simplify the card renderer, or move more filtering into the application's query/data preparation path.

## Monitoring Performance

### Browser DevTools

Record an interaction in the browser's Performance tab and look for long main-thread tasks during data changes, filter-panel updates, and search. Take Memory snapshots after repeated data and filter changes to find retained collections or detail content.

In React DevTools, inspect the component that supplies PivotViewer's props. Check whether routine re-renders create new `data` arrays or `getValue` functions and trigger avoidable rebuilds.

### Console Warnings

PivotViewer does not warn about dataset size. It logs errors to the console when the worker fails, when an in-thread fallback computation throws, or when Pixi fails to initialize (`Failed to initialize Pixi.js:`). A `[PivotEngine] Worker error:` entry means the viewer has switched to in-thread computation.

## Scaling Strategies

If the collection exceeds your [performance budget](#establish-an-application-performance-budget), reduce what reaches the client. Filter and scope in the application's query, then pass PivotViewer that working set. Precompute derived values while loading it, and keep only dimensions and filters that help users explore it: each unique key adds a column, and filter options require main-thread recounting.

Keep `cardRenderer` to a few short strings and measure again before raising the collection size.

When users need to see or edit far more rows than the budget allows, a paged table such as [DataTables](../DataTables/index.md) is the better fit.

## Memory Considerations

PivotViewer stores:

- The original `data` array, on the main thread
- One column per unique dimension or filter key, and its indexes, on the main thread
- A copy of the column store and the items in the worker, when the worker is used
- Filter results as `Uint32Array` id lists
- Pixi sprites for cards near the viewport, pooled for reuse

Components publishes no memory formula. Measure heap size with your own data, as part of the budget above.

## Best Practices

Profile a production build with representative data on your slowest supported device before choosing a collection limit. Include the worker-unavailable path and repeated data changes, not just the first load. Fetch full details when selected instead of copying them with every item, and watch for retained data during longer sessions.

## Troubleshooting Performance Issues

### Slow Initial Load

Profile value extraction, index creation, and the copy to the worker. Reduce the initial working set or precompute costly values if those steps dominate. Check that unrelated renders do not create new `data` arrays or accessor functions.

### Laggy Filtering

Start with filter accessors: filter-panel counts call them on the main thread even when worker filtering is available. Check the browser console for `[PivotEngine]` errors and confirm that the application serves the worker script with a JavaScript content type. If the work still exceeds the budget, narrow the collection before rendering.

### Stuttery Scrolling

Keep card text short and move costly computation out of `cardRenderer`. Record scrolling during a grouping or filter transition as well as after it settles. Inspect surrounding components for unnecessary re-renders on scroll.

### High Memory Usage

Account for source items, derived fields, indexes, and the worker's store copy. Check whether detail components or application state retain old collections after `data` changes. Avoid replacing unchanged data or keeping several enriched copies of it, and reduce the working set if memory remains above budget.

For the definitions that drive extraction and indexing, return to [Dimensions and Filters](dimensions-and-filters.md). To move work out of card rendering and into selected-item content, see [Renderers](renderers.md).
