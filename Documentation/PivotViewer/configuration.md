# PivotViewer - Configuration

## Props

### Required Props

- `data`: Array of items to display
- `dimensions`: Array of dimension configurations for grouping
- `cardRenderer`: Function to render card view for an item

### Optional Props

- `filters`: Array of filter configurations
- `detailRenderer`: Function to render detail view for an item
- `getItemId`: Function to extract unique ID from an item
- `defaultDimensionKey`: Initial dimension to group by
- `searchFields`: Array of accessor functions returning the values to include in text search
- `className`: CSS class for the container
- `emptyContent`: React node to show when no data matches filters
- `isLoading`: Show loading state
- `colors`: Custom color scheme configuration

## Example Configuration

```tsx
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

```tsx
const customColors = {
    primaryColor: '#0066cc',     // Primary accent color
    surfaceGround: '#ffffff',    // Main background
    surfaceCard: '#f5f5f5',      // Pixi card base and DOM card backgrounds
    surfaceSection: '#e8e8e8',   // Pixi card secondary surface
    textColor: '#333333',        // Text color
    surfaceBorder: '#e0e0e0'     // Border color
};

<PivotViewer
    colors={customColors}
    // ... other props
/>
```

Color props map to semantic `--cratis-*` variables and the Pixi renderer's card palette. Updating `colors` after mount refreshes both surfaces.

## Loading State

Show a loading indicator while data is being fetched:

```tsx
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

```tsx
import { FaInbox } from 'react-icons/fa6';

<PivotViewer
    emptyContent={
        <div className="empty-state">
            <FaInbox aria-hidden='true' style={{ fontSize: '3rem' }} />
            <h3>No results found</h3>
            <p>Try adjusting your filters</p>
        </div>
    }
    // ... other props
/>
```

## Search Configuration

Specify which fields should be searchable by passing accessor functions:

```tsx
<PivotViewer
    searchFields={[item => item.title, item => item.description, item => item.tags, item => item.author]}
    // ... other props
/>
```

The global search will look for matches in all specified fields.
