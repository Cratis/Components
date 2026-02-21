# PivotViewer

The `PivotViewer` component provides an interactive, high-performance visualization for exploring large datasets with dynamic grouping, filtering, and zooming capabilities.

## Purpose

PivotViewer enables users to explore and analyze collections of data items through an intuitive, visual interface with pivot-style grouping and filtering.

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
import { PivotViewer } from '@cratis/components';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
}

function ProductViewer() {
    const dimensions = [
        { key: 'category', label: 'Category', accessor: (item: Product) => item.category }
    ];

    const filters = [
        { key: 'category', label: 'Category', type: 'categorical', accessor: (item: Product) => item.category }
    ];

    return (
        <PivotViewer
            data={products}
            dimensions={dimensions}
            filters={filters}
            defaultDimensionKey="category"
            cardRenderer={(item) => <ProductCard product={item} />}
            detailRenderer={(item) => <ProductDetails product={item} />}
            getItemId={(item) => item.id}
            searchFields={['name', 'category']}
        />
    );
}
```

## Core Concepts

- **Dimensions**: Properties to group data by
- **Filters**: Options to narrow down the dataset
- **Cards**: Visual representation of items in collection view
- **Details**: Full information shown when item is selected

## See Also

- [Configuration](configuration.md) - Props and options
- [Dimensions and Filters](dimensions-and-filters.md) - Setting up data access
- [Renderers](renderers.md) - Customizing card and detail views
- [Interactions](interactions.md) - Zoom, pan, filter, select
- [Performance](performance.md) - Optimization for large datasets
