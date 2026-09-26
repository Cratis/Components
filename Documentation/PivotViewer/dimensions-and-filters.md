---
title: PivotViewer dimensions and filters
description: Define the values PivotViewer sorts, groups, and filters by, and the value types each one supports.
---

## Dimensions

Dimensions define the values PivotViewer sorts by and groups by. The toolbar's **Sort by** list shows one entry per dimension:

- In **collection** view, the active dimension sorts the single card grid.
- In **grouped** view, the active dimension splits the cards into columns. For a string or boolean dimension, clicking a column's label below the grid shows only that column's cards, and clicking it again shows all of them. For a numeric dimension, the click only highlights the label; the cards are not filtered.

### Dimension Structure

```typescript
interface PivotDimension<TItem> {
    key: string; // Unique identifier; also the column name in PivotViewer's store
    label: string; // Shown in the Sort by list
    getValue: (item: TItem) => PivotPrimitive; // string | number | boolean | Date | null | undefined
    formatValue?: (value: PivotPrimitive) => string; // Changes displayed group labels
    sort?: (a: PivotGroup<TItem>, b: PivotGroup<TItem>) => number; // Orders groups in grouped view
}
```

How a dimension groups depends on the first non-missing (`null` or `undefined`) value returned by `getValue`:

| Value | Grouped view |
| --- | --- |
| `string` | One column per distinct value, sorted by value. Missing values appear as the string labels `null` and `undefined`. |
| `number` | Ten equal-width numeric ranges between the smallest and largest value; missing values are excluded from the ranges. |
| `Date` | Converted to a numeric timestamp, so it groups into ten ranges of milliseconds; missing values are excluded. |
| `boolean` | Separate `false` and `true` columns; missing values are not grouped with `false`. |

If every value is missing, the dimension uses string grouping. To group by exact numbers, years, or dates, return a string: `String(item.priority)` or `String(item.createdAt.getFullYear())`.

`formatValue` changes only the displayed group label, not the group's key or filter value. For numeric and Date dimensions, the formatter receives the numeric lower bound of each range (a millisecond timestamp for Dates), not the original item value. `sort` orders groups before layout; its comparator receives `PivotGroup` objects with the original `items`, `key`, `label`, `value`, and `count`. Both callbacks run in the viewer after the engine returns, so they work the same whether grouping runs in a worker or the synchronous fallback. Without a custom sort, groups retain value order.

### Examples

The snippets on this page use the `Task` type from the [complete example](#complete-example), the `Product` type from the [overview](index.md#quick-start), and an illustrative `Person` type with a numeric `age`.

```typescript
import type { PivotDimension } from '@cratis/components/PivotViewer';

const dimensions: PivotDimension<Task>[] = [
    { key: 'status', label: 'Status', getValue: (item) => item.status },
    { key: 'assignee', label: 'Assigned To', getValue: (item) => item.assignee },
    {
        key: 'month',
        label: 'Created',
        getValue: (item) =>
            `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`,
    },
];
```

The `month` dimension returns zero-padded text such as `2024-03`, so its columns sort in calendar order.

## Filters

Filters appear in the filter panel, opened from the filter button at the left of the toolbar. The button, and with it the panel's search box, appears only when `filters` has at least one entry. A badge on the button counts the active selections.

### Filter Types

1. **Categorical filter** (default): a list of values with counts. Single-select unless you set `multi: true`.
2. **Range filter** (`type: 'number'`): a histogram with a minimum/maximum range selection.

A filter and a dimension with the same `key` share one column in PivotViewer's store, and the filter's `getValue` wins. Give them the same `getValue`, or different keys. Categorical filters work on string and boolean columns; a categorical selection on a number column does not narrow the cards.

The `type` union also contains `'date'` and `'custom'`, and a filter can supply its own editor through `renderEditor`. This page covers the categorical and numeric filters that the PivotViewer stories exercise.

### Categorical Filter

```typescript
const categoryFilter: PivotFilter<Product> = {
    key: 'category',
    label: 'Category',
    getValue: (item) => item.category,
};
```

Options and their counts are computed from `data`, most frequent first. Pass `options` to supply a fixed list, or `sort` to order the options yourself. Each option's count reflects the other active filters.

Without `multi`, selecting a value replaces the previous selection and selecting it again clears it.

### Range Filter

```typescript
const priceFilter: PivotFilter<Product> = {
    key: 'price',
    label: 'Price',
    type: 'number',
    getValue: (item) => item.price,
    buckets: 20,
};
```

`buckets` sets the number of histogram bars (default `20`). `getValue` must return a number for every item that should take part in the range.

### Multi-select filters

Set `multi: true` to let users select several values of one categorical filter. An item matches when its value is any of the selected values:

```typescript
const statusFilter: PivotFilter<Task> = {
    key: 'status',
    label: 'Status',
    getValue: (item) => item.status,
    multi: true,
};
```

`getValue` returns one value per item. PivotViewer has no filter for array-valued properties such as tags: `PivotFilter.getValue` does not accept an array type, and a value that is not a primitive is converted to one string (`['a', 'b']` becomes `'a,b'`). To let users find items by tag, list the property in `searchFields` instead; see [Search configuration](configuration.md#search-configuration).

## Complete Example

```typescript
import type { PivotDimension, PivotFilter } from '@cratis/components/PivotViewer';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    priority: number;
    assignee: string;
    tags: string[];
    estimatedHours: number;
    createdAt: Date;
}

const taskDimensions: PivotDimension<Task>[] = [
    { key: 'status', label: 'Status', getValue: (item) => item.status },
    { key: 'assignee', label: 'Assignee', getValue: (item) => item.assignee },
    {
        key: 'priority-level',
        label: 'Priority Level',
        getValue: (item) => {
            if (item.priority >= 8) return 'High';
            if (item.priority >= 5) return 'Medium';
            return 'Low';
        },
    },
    {
        key: 'year',
        label: 'Year',
        getValue: (item) => String(item.createdAt.getFullYear()),
    },
    {
        key: 'quarter',
        label: 'Quarter',
        getValue: (item) => {
            const quarter = Math.floor(item.createdAt.getMonth() / 3) + 1;
            return `${item.createdAt.getFullYear()} Q${quarter}`;
        },
    },
];

const taskFilters: PivotFilter<Task>[] = [
    { key: 'status', label: 'Status', getValue: (item) => item.status, multi: true },
    { key: 'priority', label: 'Priority', type: 'number', getValue: (item) => item.priority, buckets: 10 },
    {
        key: 'estimatedHours',
        label: 'Estimated Hours',
        type: 'number',
        getValue: (item) => item.estimatedHours,
        buckets: 20,
    },
    { key: 'assignee', label: 'Assigned To', getValue: (item) => item.assignee, multi: true },
];
```

Define these arrays outside the component, or memoize them. PivotViewer rebuilds its store whenever the array identities change.

## Dynamic Dimensions

Create dimensions from computed values. Return strings so each band becomes its own column:

```typescript
const ageGroup: PivotDimension<Person> = {
    key: 'age-group',
    label: 'Age Group',
    getValue: (item) => {
        if (item.age < 18) return 'Under 18';
        if (item.age < 35) return '18-34';
        if (item.age < 55) return '35-54';
        return '55+';
    },
};
```

Columns are sorted in plain string order, so in this example `'Under 18'` comes last, after `'55+'`. Supply a dimension `sort` comparator to change the order without changing the values.

## Date-based Dimensions

A `Date` or a numeric year groups into ten numeric ranges, not one column per year. Convert dates to text:

```typescript
const byYear: PivotDimension<Task> = {
    key: 'year',
    label: 'Year',
    getValue: (item) => String(item.createdAt.getFullYear()),
};

const byMonth: PivotDimension<Task> = {
    key: 'month',
    label: 'Month',
    getValue: (item) =>
        `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`,
};

const byQuarter: PivotDimension<Task> = {
    key: 'quarter',
    label: 'Quarter',
    getValue: (item) => `${item.createdAt.getFullYear()} Q${Math.floor(item.createdAt.getMonth() / 3) + 1}`,
};
```

Put the year first so the text sorts chronologically.

## Best Practices

1. **Return strings for exact numeric or date categories**: numbers and dates produce ranges, while booleans produce `false` and `true` columns
2. **Limit dimensions**: every dimension and filter adds a column to the store PivotViewer builds on the main thread
3. **Use clear labels**: the `label` is what users see in the Sort by list and the filter panel
4. **Consider cardinality**: a dimension with hundreds of distinct values produces hundreds of columns
5. **Balance filters**: provide both broad (status) and narrow (assignee) options, with `multi: true` where users compare several values
6. **Keep accessors cheap**: `getValue` runs for every item whenever `data`, `dimensions`, or `filters` change, and again when filter options are recounted
7. **Provide defaults**: set a sensible `defaultDimensionKey`
