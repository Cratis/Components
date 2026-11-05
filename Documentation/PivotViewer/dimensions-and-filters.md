---
title: PivotViewer dimensions and filters
description: Define PivotViewer dimensions for sorting and grouping, then add categorical or numeric filters so users can narrow the collection.
---

PivotViewer dimensions control how users sort and group cards; filters narrow which items remain visible. Choose dimensions for the comparisons users need to make, then add filters for finding a smaller working set. The value returned by `getValue` determines whether a dimension produces categories or numeric ranges.

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

How a dimension groups depends on the first value returned by `getValue` that is neither `null` nor `undefined`:

| Value | Grouped view |
| --- | --- |
| `string` | One column per distinct value, sorted by value. Missing values appear as the string labels `null` and `undefined`. |
| `number` | Up to ten equal-width ranges between the smallest and largest visible value; empty ranges and missing values have no column. Equal values form one column. |
| `Date` | Converted to a numeric timestamp and grouped into ranges of milliseconds, following the same rules as numbers. |
| `boolean` | Separate `false` and `true` columns; missing values are not grouped with `false`. |

In grouped view, items missing a numeric or boolean grouping value have no column, although the toolbar count still includes them. String dimensions instead show missing values in `null` and `undefined` columns. If every value is missing, the dimension uses string grouping. To group by exact numbers, years, or dates, return a string: `String(item.priority)` or `String(item.createdAt.getFullYear())`.

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

The `month` dimension returns zero-padded text such as `2024-03`, so its columns sort in calendar order. Boolean columns normally read `false` and `true`, while the filter panel labels those options **No** and **Yes**. To use the same labels in both places, set `formatValue: value => value ? 'Yes' : 'No'` on the boolean dimension.

## Filters

Filters appear in the filter panel, opened from the filter button at the left of the toolbar. The button, and with it the panel's search box, appears only when `filters` has at least one entry. A badge on the button counts the active selections.

Selections within one categorical filter combine with OR: selecting `todo` and `in-progress` includes either status. Different filters combine with AND: an item must match the status selection and any active assignee or price filter. Numeric ranges include both endpoints; clearing a selection removes that restriction.

### Filter Types

A categorical filter, the default, shows a list of values with counts. It is single-select unless you set `multi: true`. A range filter (`type: 'number'`) instead shows a histogram with minimum and maximum controls.

A filter and a dimension with the same `key` share one column in PivotViewer's store, and the filter's `getValue` wins. Give them the same `getValue`, or different keys. Categorical filters work on string and boolean columns; a categorical selection on a number column does not narrow the cards. This also applies when the numeric column's first value is missing: the first non-missing value determines its type, so selecting a categorical option still does not narrow it.

The `type` union also contains `'date'` and `'custom'`, and `renderEditor` lets a filter replace its editor UI. For the built-in numeric range editor, use `type: 'number'`; the examples below use that editor and categorical selections.

### Categorical Filter

```typescript
const categoryFilter: PivotFilter<Product> = {
    key: 'category',
    label: 'Category',
    getValue: (item) => item.category,
};
```

By default, PivotViewer computes options and counts from `data`, most frequent first. It applies the other filter-panel selections before counting, but excludes this filter's own selection. Search and clicks on grouped column labels do not affect these counts.

Use `sort` to order the computed options yourself. A non-empty `options` array instead supplies the list, order, and counts as given; PivotViewer does not recount or sort that list.

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

Keep these definitions outside the component, or memoize them when they depend on props. A new `getValue` function, a changed key, or a changed `data` array rebuilds the store. Changing only a dimension's label, formatter, or group sorter does not rebuild its columns.

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

A `Date` or a numeric year produces numeric ranges, not one column per year. Return text when users need to compare calendar periods:

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

Choose a `defaultDimensionKey` that gives users a useful first comparison, and use labels they will recognize in the toolbar and filter panel. Return strings for exact numeric or calendar categories; returning a number or `Date` asks for ranges instead.

A categorical dimension with hundreds of distinct values can produce hundreds of columns. Prefer a broader grouping when that would make the collection easier to compare, and let filters find individual values. Each unique dimension or filter key also adds a column to the store, so keep `getValue` inexpensive and precompute costly derived values before rendering.

Once grouping and filtering match the task, [customize the card text and detail content](renderers.md). If changes feel slow with representative data, [measure the main-thread and worker work](performance.md) before increasing the collection size.
