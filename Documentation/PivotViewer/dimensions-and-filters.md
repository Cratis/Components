# PivotViewer - Dimensions and Filters

## Dimensions

Dimensions define how items can be grouped.

### Dimension Structure

```typescript
{
    key: string;           // Unique identifier
    label: string;         // Display name
    getValue: (item) => value;  // Function to extract grouping value
}
```

### Examples

```typescript
const dimensions = [
    {
        key: 'status',
        label: 'Status',
        getValue: (item) => item.status
    },
    {
        key: 'priority',
        label: 'Priority',
        getValue: (item) => item.priority
    },
    {
        key: 'assignee',
        label: 'Assigned To',
        getValue: (item) => item.assignedTo
    },
    {
        key: 'date',
        label: 'Created Date',
        getValue: (item) => {
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
    type: 'string',
    getValue: (item) => item.category
}
```

### Range Filter

```typescript
{
    key: 'price',
    label: 'Price',
    type: 'number',
    getValue: (item) => item.price,
    buckets: 20
}
```

### Multi-value Filter

For properties that return arrays:

```typescript
{
    key: 'tags',
    label: 'Tags',
    type: 'string',
    getValue: (item) => item.tags  // Returns array of strings
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
        getValue: (item: Task) => item.status
    },
    {
        key: 'assignee',
        label: 'Assignee',
        getValue: (item: Task) => item.assignee
    },
    {
        key: 'priority-level',
        label: 'Priority Level',
        getValue: (item: Task) => {
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
        type: 'string',
        getValue: (item: Task) => item.status
    },
    {
        key: 'priority',
        label: 'Priority',
        type: 'number',
        getValue: (item: Task) => item.priority,
        buckets: 10
    },
    {
        key: 'estimatedHours',
        label: 'Estimated Hours',
        type: 'number',
        getValue: (item: Task) => item.estimatedHours,
        buckets: 20
    },
    {
        key: 'tags',
        label: 'Tags',
        type: 'string',
        getValue: (item: Task) => item.tags
    },
    {
        key: 'assignee',
        label: 'Assigned To',
        type: 'string',
        getValue: (item: Task) => item.assignee
    }
];
```

## Dynamic Dimensions

Create dimensions based on computed values:

```typescript
{
    key: 'age-group',
    label: 'Age Group',
    getValue: (item) => {
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
    getValue: (item) => new Date(item.createdAt).getFullYear()
},
{
    key: 'month',
    label: 'Month',
    getValue: (item) => {
        const date = new Date(item.createdAt);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
},
{
    key: 'quarter',
    label: 'Quarter',
    getValue: (item) => {
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
