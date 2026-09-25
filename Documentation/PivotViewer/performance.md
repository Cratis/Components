---
title: PivotViewer performance
description: How PivotViewer spreads work across the main thread, a Web Worker, and Pixi, and how to keep it fast for your data.
---

## Architecture

PivotViewer splits its work across the main thread, a Web Worker, and a Pixi (WebGL) canvas. Knowing which part runs where tells you what your own code can slow down.

| Work | Where it runs | When |
| --- | --- | --- |
| Calling every dimension and filter `getValue`, building the column store and indexes | Main thread | Whenever `data`, `dimensions`, or `filters` change identity |
| Filtering, grouping, and sorting visible ids | Web Worker, or the main thread when no worker is available | On every filter, dimension, or view change |
| Filter-panel option counts and numeric ranges | Main thread, over all of `data` | Whenever `data`, `filters`, or a filter selection changes |
| Free-text search | Main thread, over the currently visible ids | On every search change |
| Card layout | Main thread | On grouping, zoom, or container size changes |
| Card drawing | Pixi, for cards near the viewport | As you zoom and scroll |

Components publishes no item-count benchmarks for PivotViewer. The largest dataset in its Storybook stories has 2,500 items; that story demonstrates the component, it does not set a limit.

### Web Workers

Filtering, grouping, and sorting requests are answered by a background Web Worker when one is available:

- **Main thread**: extracts values, builds the column store, renders the UI, computes filter-panel counts and search
- **Worker thread**: keeps its own copy of the store and indexes, and answers filter, grouping, and sort requests

This keeps the UI responsive while a filter or grouping recomputes. It does not move everything off the main thread: building the store, the filter-panel counts, and search still run there.

PivotViewer checks that the worker script is served as JavaScript before starting it. When it is not, when `Worker` is unavailable (for example during server rendering), or when the worker reports an error, the same computations run in-thread. The viewer keeps working; it only loses the off-thread benefit. Worker errors are logged to the console as `[PivotEngine] Worker error:`.

To use the worker, PivotViewer posts the column store to it, including the original `data` items. Keep items to plain, structured-cloneable data; large nested objects on each item add to that copy.

### Columnar Storage

Each dimension and filter becomes one column, keyed by its `key`:

```text
Row items:
[{ id: 'a', status: 'todo', priority: 3 }, { id: 'b', status: 'done', priority: 8 }, ...]

Columns built by PivotViewer:
status:   ['todo', 'done', ...]      (string column, with a value-to-ids index)
priority: Float64Array [3, 8, ...]   (number column, with a sorted index for ranges)
```

Filters then work on item ids (`Uint32Array`) and only read the columns they need. The original items are kept alongside the columns for rendering and details, so PivotViewer holds both the items and one column per dimension and filter.

### Virtualized Rendering

Cards are Pixi sprites, not DOM elements:

- Only cards inside the viewport plus a buffer around it get a sprite
- Sprites that leave that area are returned to a pool and reused for cards that scroll in
- `cardRenderer` runs when a card's sprite is filled, not for every item up front

## Performance Tips

### Optimize Accessors

Keep dimension and filter accessors simple. `getValue` runs for every item each time the store is rebuilt, and filter `getValue` runs again for every item whenever filter-panel counts are recomputed.

**Good:**

```typescript
const status: PivotDimension<Task> = {
    key: 'status',
    label: 'Status',
    getValue: (item) => item.status,
};
```

**Avoid:**

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

The `cardRenderer` returns lightweight structured data (`{ title, labels?, values? }`), so keep it cheap. For heavier detail content, render a memoized component from `detailRenderer`:

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

Keep `dimensions` and `filters` stable. PivotViewer memoizes its column extraction on their identity, so a new array on every render rebuilds the store, re-posts it to the worker, and recomputes filter state.

**Avoid:**

```tsx
<PivotViewer
    data={tasks}
    // Creates a new array on every render
    dimensions={[{ key: 'status', label: 'Status', getValue: (item: Task) => item.status }]}
    cardRenderer={taskCardRenderer}
/>
```

**Better:**

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

1. **Performance** tab: record an interaction and look for long main-thread tasks during data changes, filter-panel updates, and search
2. **Memory** tab: take heap snapshots after repeated data and filter changes
3. **React DevTools**: profile how often the component around PivotViewer re-renders and whether it passes new `dimensions`, `filters`, or `data` arrays

### Console Warnings

PivotViewer does not warn about dataset size. It logs errors to the console when the worker fails, when an in-thread fallback computation throws, or when Pixi fails to initialize (`Failed to initialize Pixi.js:`). A `[PivotEngine] Worker error:` entry means the viewer has switched to in-thread computation.

## Scaling Strategies

Scale by reducing what reaches the client rather than by tuning the component:

- Filter and scope on the server or in the query, and pass PivotViewer only the working set
- Precompute derived dimension values when loading data
- Use fewer dimensions and filters; each one is a column and, for filters, a main-thread recount
- Keep `cardRenderer` to a few short strings
- Measure against your [performance budget](#establish-an-application-performance-budget) before raising the collection size

When users need to see or edit far more rows than the budget allows, a paged table such as [DataTables](../DataTables/index.md) is the better fit.

## Memory Considerations

PivotViewer stores:

- The original `data` array, on the main thread
- One column per dimension and filter, and their indexes, on the main thread
- A copy of the column store and the items in the worker, when the worker is used
- Filter results as `Uint32Array` id lists
- Pixi sprites for cards near the viewport, pooled for reuse

Components publishes no memory formula. Measure heap size with your own data, as part of the budget above.

## Best Practices

1. **Profile before optimizing**: Measure actual performance
2. **Optimize data structure**: plain, flat items clone and extract faster
3. **Lazy load details**: Fetch full item details only when selected
4. **Use production build**: Development mode is slower
5. **Keep definitions stable**: memoize `dimensions`, `filters`, and `data`
6. **Monitor memory**: Check for leaks in long sessions
7. **Test on target devices**: Mobile performance differs from desktop
8. **Set appropriate limits**: Don't try to visualize millions of items

## Troubleshooting Performance Issues

### Slow Initial Load

- Check data size
- Optimize accessor functions
- Reduce number of dimensions/filters
- Preprocess data server-side
- Check that `data`, `dimensions`, and `filters` are not new arrays on every render

### Laggy Filtering

- Simplify filter accessors; they run on the main thread for filter-panel counts
- Reduce dataset size
- Check the browser console for `[PivotEngine]` errors
- Check that the worker script is served with a JavaScript content type, so the worker path is used

### Stuttery Scrolling

- Simplify card renderer
- Keep card text short
- Check for expensive computations in render
- Check that the surrounding component does not re-render on every scroll

### High Memory Usage

- Check for memory leaks in detail components
- Reduce data retention and the size of each item
- Avoid replacing `data` with a new array when nothing changed
- Narrow the collection before rendering
