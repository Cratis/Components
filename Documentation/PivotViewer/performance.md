# PivotViewer - Performance

## Architecture

PivotViewer uses several techniques for high performance with large datasets.

### Web Workers

Filtering and grouping operations run in a background Web Worker thread:

- **Main thread**: Handles UI rendering and interactions
- **Worker thread**: Processes data filtering and grouping

Benefits:

- UI remains responsive during heavy computations
- No frame drops or stuttering
- Smooth interactions even with 50,000+ items

### Columnar Storage

Data is stored in columnar format for efficient filtering:

```javascript
Traditional (row-based):
[{id: 1, name: 'A', price: 10}, {id: 2, name: 'B', price: 20}, ...]

Columnar:
{
  id: [1, 2, 3, ...],
  name: ['A', 'B', 'C', ...],
  price: [10, 20, 30, ...]
}
```

Benefits:

- Faster filtering (only process relevant columns)
- Better cache utilization
- Lower memory overhead

### Virtualized Rendering

Only visible cards are rendered to the DOM:

- Renders cards in viewport + small buffer
- Reuses DOM elements as you scroll
- Handles thousands of items smoothly

## Performance Tips

### Optimize Accessors

Keep dimension and filter accessors simple:

**Good:**

```typescript
{
    key: 'status',
    accessor: (item) => item.status
}
```

**Avoid:**

```typescript
{
    key: 'status',
    accessor: (item) => {
        // Complex computation on every filter
        return expensiveCalculation(item.data, item.metadata, item.relationships);
    }
}
```

### Memoize Renderers

Use React.memo for card and detail renderers:

```typescript
const TaskCard = React.memo(({ item }: { item: Task }) => (
    <div className="task-card">
        <h4>{item.title}</h4>
        <p>{item.description}</p>
    </div>
));

<PivotViewer
    cardRenderer={(item) => <TaskCard item={item} />}
    // ...
/>
```

### Limit Initial Data

Start with a reasonable dataset size:

```typescript
const [data, setData] = useState([]);
const [hasMore, setHasMore] = useState(true);

// Load data in chunks
const loadMore = async () => {
    const nextBatch = await fetchNextBatch();
    setData([...data, ...nextBatch]);
};
```

### Optimize Images

For card images:

- Use thumbnails, not full-size images
- Lazy load images
- Use appropriate formats (WebP, AVIF)
- Set explicit dimensions

```typescript
<img 
    src={item.thumbnailUrl} 
    alt={item.name}
    width={200}
    height={150}
    loading="lazy"
/>
```

### Reduce Re-renders

Avoid creating new objects in render:

**Avoid:**

```typescript
<PivotViewer
    dimensions={[{ key: 'status', label: 'Status', accessor: i => i.status }]}
    // ... creates new array on every render
/>
```

**Better:**

```typescript
const dimensions = useMemo(() => [
    { key: 'status', label: 'Status', accessor: i => i.status }
], []);

<PivotViewer dimensions={dimensions} />
```

## Benchmarks

Typical performance on modern hardware:

| Dataset Size | Initial Load | Filter Update | Dimension Change |
|--------------|--------------|---------------|------------------|
| 1,000 items  | < 100ms      | < 10ms        | < 20ms           |
| 10,000 items | < 500ms      | < 50ms        | < 100ms          |
| 50,000 items | < 2s         | < 200ms       | < 500ms          |
| 100,000 items| < 5s         | < 500ms       | < 1s             |

**Note:** Performance varies based on data complexity and device

## Monitoring Performance

### Browser DevTools

1. **Performance** tab: Record interaction, analyze bottlenecks
2. **Memory** tab: Check for memory leaks
3. **React DevTools**: Profiler for component renders

### Console Warnings

The component logs warnings for performance issues:

```text
PivotViewer: Large dataset detected (100,000 items).
Consider implementing pagination or virtual scrolling.
```

## Scaling Strategies

### For 1K-10K Items

Default configuration works well. No special optimization needed.

### For 10K-50K Items

- Use simple card renderers
- Minimize dimension/filter count
- Consider precomputed values

### For 50K-100K Items

- Implement pagination
- Use server-side filtering
- Precompute dimensions on backend
- Limit active filters

### For 100K+ Items

- Server-side filtering is essential
- Paginate or virtualize at API level
- Consider alternative visualization
- Use database indexes

## Memory Considerations

PivotViewer stores:

- Original data array
- Columnar indexed data
- Filter results (Uint32Array of IDs)
- Rendered components (virtualized)

Approximate memory usage:

```text
BaseMemory = DataSize × 3
(original + columnar + filter indexes)

Example:
10,000 items × 5KB each = 50MB × 3 = 150MB
```

## Best Practices

1. **Profile before optimizing**: Measure actual performance
2. **Optimize data structure**: Clean, normalized data loads faster
3. **Lazy load details**: Fetch full item details only when selected
4. **Use production build**: Development mode is slower
5. **Consider pagination**: For very large datasets
6. **Monitor memory**: Check for leaks in long sessions
7. **Test on target devices**: Mobile performance differs from desktop
8. **Set appropriate limits**: Don't try to visualize millions of items

## Troubleshooting Performance Issues

### Slow Initial Load

- Check data size
- Optimize accessor functions
- Reduce number of dimensions/filters
- Preprocess data server-side

### Laggy Filtering

- Simplify filter accessors
- Reduce dataset size
- Check browser console for errors
- Ensure Web Worker is initialized

### Stuttery Scrolling

- Simplify card renderer
- Optimize images
- Reduce number of visible cards
- Check for expensive computations in render

### High Memory Usage

- Check for memory leaks in renderers
- Reduce data retention
- Clear old filter results
- Implement pagination
