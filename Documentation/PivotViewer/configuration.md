# PivotViewer - Configuration

## Props

### Required Props

- `data`: Array of items to display
- `dimensions`: Array of dimension configurations for grouping
- `filters`: Array of filter configurations
- `cardRenderer`: Function to render card view for an item
- `detailRenderer`: Function to render detail view for an item
- `getItemId`: Function to extract unique ID from an item

### Optional Props

- `defaultDimensionKey`: Initial dimension to group by
- `searchFields`: Array of accessor functions returning the values to include in text search
- `className`: CSS class for the container
- `emptyContent`: React node to show when no data matches filters
- `isLoading`: Show loading state
- `colors`: Custom color scheme configuration

## Example Configuration

```typescript
<PivotViewer
    data={items}
    dimensions={dimensions}
    filters={filters}
    defaultDimensionKey="status"
    cardRenderer={renderCard}
    detailRenderer={renderDetails}
    getItemId={(item) => item.id}
    searchFields={[item => item.title, item => item.description, item => item.assignee]}
    className="my-pivot-viewer"
    emptyContent={<div>No items match your filters</div>}
    isLoading={isLoadingData}
    colors={{
        primaryColor: '#4CAF50',
        surfaceGround: '#1a1a1a',
        surfaceCard: '#2d2d2d'
    }}
/>
```

## Color Customization

Customize the color scheme:

```typescript
const customColors = {
    primaryColor: '#0066cc',     // Primary accent color
    surfaceGround: '#ffffff',    // Main background
    surfaceCard: '#f5f5f5',      // Card backgrounds
    textColor: '#333333',        // Text color
    surfaceBorder: '#e0e0e0'     // Border color
};

<PivotViewer
    colors={customColors}
    // ... other props
/>
```

## Loading State

Show a loading indicator while data is being fetched:

```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
    fetchData().then(result => {
        setData(result);
        setLoading(false);
    });
}, []);

<PivotViewer
    data={data}
    isLoading={loading}
    // ... other props
/>
```

## Empty State

Customize the message when filters return no results:

```typescript
<PivotViewer
    emptyContent={
        <div className="empty-state">
            <i className="pi pi-inbox" style={{ fontSize: '3rem' }} />
            <h3>No results found</h3>
            <p>Try adjusting your filters</p>
        </div>
    }
    // ... other props
/>
```

## Search Configuration

Specify which fields should be searchable by passing accessor functions:

```typescript
<PivotViewer
    searchFields={[item => item.title, item => item.description, item => item.tags, item => item.author]}
    // ... other props
/>
```

The global search will look for matches in all specified fields.
