# PivotViewer - Dimensions and Filters

## Dimensions

Dimensions define how items can be grouped.

### Dimension Structure

```typescript
{
    key: string;           // Unique identifier
    label: string;         // Display name
    accessor: (item) => value;  // Function to extract grouping value
}
```

### Examples

```typescript
const dimensions = [
    {
        key: 'status',
        label: 'Status',
        accessor: (item) => item.status
    },
    {
        key: 'priority',
        label: 'Priority',
        accessor: (item) => item.priority
    },
    {
        key: 'assignee',
        label: 'Assigned To',
        accessor: (item) => item.assignedTo
    },
    {
        key: 'date',
        label: 'Created Date',
        accessor: (item) => {
            const date = new Date(item.createdAt);
            return `${date.getFullYear()}-${date.getMonth() + 1}`;
        }
    }
];
```

## Filters

Filters allow users to narrow down the dataset.

### Filter Types

1. **Categorical Filter**: For discrete values
2. **Range Filter**: For numeric ranges
3. **Multi-value Filter**: For array properties

### Categorical Filter

```typescript
{
    key: 'category',
    label: 'Category',
    type: 'categorical',
    accessor: (item) => item.category
}
```

### Range Filter

```typescript
{
    key: 'price',
    label: 'Price',
    type: 'range',
    accessor: (item) => item.price,
    min: 0,
    max: 1000
}
```

### Multi-value Filter

For properties that return arrays:

```typescript
{
    key: 'tags',
    label: 'Tags',
    type: 'categorical',
    accessor: (item) => item.tags  // Returns array of strings
}
```

## Complete Example

```typescript
interface Task {
    id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'done';
    priority: number;
    assignee: string;
    tags: string[];
    estimatedHours: number;
    createdAt: Date;
}

const dimensions = [
    {
        key: 'status',
        label: 'Status',
        accessor: (item: Task) => item.status
    },
    {
        key: 'assignee',
        label: 'Assignee',
        accessor: (item: Task) => item.assignee
    },
    {
        key: 'priority-level',
        label: 'Priority Level',
        accessor: (item: Task) => {
            if (item.priority >= 8) return 'High';
            if (item.priority >= 5) return 'Medium';
            return 'Low';
        }
    }
];

const filters = [
    {
        key: 'status',
        label: 'Status',
        type: 'categorical',
        accessor: (item: Task) => item.status
    },
    {
        key: 'priority',
        label: 'Priority',
        type: 'range',
        accessor: (item: Task) => item.priority,
        min: 0,
        max: 10
    },
    {
        key: 'estimatedHours',
        label: 'Estimated Hours',
        type: 'range',
        accessor: (item: Task) => item.estimatedHours,
        min: 0,
        max: 40
    },
    {
        key: 'tags',
        label: 'Tags',
        type: 'categorical',
        accessor: (item: Task) => item.tags
    },
    {
        key: 'assignee',
        label: 'Assigned To',
        type: 'categorical',
        accessor: (item: Task) => item.assignee
    }
];
```

## Dynamic Dimensions

Create dimensions based on computed values:

```typescript
{
    key: 'age-group',
    label: 'Age Group',
    accessor: (item) => {
        const age = item.age;
        if (age < 18) return 'Under 18';
        if (age < 35) return '18-34';
        if (age < 55) return '35-54';
        return '55+';
    }
}
```

## Date-based Dimensions

```typescript
{
    key: 'year',
    label: 'Year',
    accessor: (item) => new Date(item.createdAt).getFullYear()
},
{
    key: 'month',
    label: 'Month',
    accessor: (item) => {
        const date = new Date(item.createdAt);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
},
{
    key: 'quarter',
    label: 'Quarter',
    accessor: (item) => {
        const date = new Date(item.createdAt);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
    }
}
```

## Best Practices

1. **Choose meaningful dimensions**: Select properties that provide useful ways to organize data
2. **Limit dimensions**: Too many options can overwhelm users (5-10 is typical)
3. **Use clear labels**: Make dimension names intuitive
4. **Consider cardinality**: Dimensions with too many values become less useful
5. **Balance filters**: Provide both broad (status) and narrow (specific tags) options
6. **Test performance**: Complex accessors can slow down filtering on large datasets
7. **Provide defaults**: Set a sensible defaultDimensionKey
