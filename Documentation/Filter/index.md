# FilterPanel

The `FilterPanel` component provides a standalone, reusable filter UI that can be placed next to any data view. It renders as a positioned dropdown anchored below a trigger button and supports single-select, multi-select, numeric range (with histogram), and fully custom filter editors declared as children.

## Key Features

- **Automatic Clear Buttons**: When a filter has active selections, a round clear button (×) appears in the filter header next to the count badge, making it easy to reset individual filters.
- **Flexible Filter Types**: Supports string/option filters (single or multi-select), numeric range filters with histograms, and fully custom editors.
- **Integrated State Management**: Use the `useFilterState` hook to manage all filter state in one place.

## Components and Exports

| Export | Description |
|---|---|
| `FilterPanel` | Main dropdown panel component |
| `FilterEditor` | Slot component — declares a custom editor for a specific filter group |
| `RangeHistogramFilter` | Standalone numeric range slider with histogram bars |
| `useFilterState` | State management hook — tracks selections, ranges, and custom values |
| `FilterDefinition` | Type describing a single filter group |
| `FilterEditorProps` | Props passed to a `FilterEditor` render-prop child (`{ value, onChange }`) |
| `FilterEditorSlotProps` | Props for the `FilterEditor` component itself |
| `FilterValues` | `Record<string, Set<string>>` — selected option keys per filter |
| `RangeValues` | `Record<string, [number, number] \| null>` — selected ranges per filter |
| `CustomFilterValues` | `Record<string, unknown>` — values for custom editor filters |

## Quick Start

```tsx
import { FilterPanel, useFilterState } from '@cratis/components/Filter';
import type { FilterDefinition } from '@cratis/components/Filter';

const filters: FilterDefinition[] = [
    {
        key: 'status',
        label: 'Status',
        type: 'string',
        options: [
            { key: 'active',   label: 'Active',   value: 'active',   count: 42 },
            { key: 'inactive', label: 'Inactive', value: 'inactive', count: 18 },
        ],
    },
];

function MyView() {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    const {
        filterValues,
        rangeValues,
        expandedFilterKey,
        setExpandedFilterKey,
        handleToggleFilter,
        handleClearFilter,
        handleRangeChange,
    } = useFilterState(filters);

    return (
        <>
            <button ref={buttonRef} onClick={() => setIsOpen(v => !v)}>
                Filters
            </button>
            <FilterPanel
                isOpen={isOpen}
                filters={filters}
                filterValues={filterValues}
                rangeValues={rangeValues}
                expandedFilterKey={expandedFilterKey}
                anchorRef={buttonRef}
                onClose={() => setIsOpen(false)}
                onFilterToggle={handleToggleFilter}
                onFilterClear={handleClearFilter}
                onRangeChange={handleRangeChange}
                onExpandedFilterChange={setExpandedFilterKey}
            />
        </>
    );
}
```

## Filter Types

### Single-select (`type: 'string'`, `multi: false`)

Renders a radio-button list. Clicking an already-selected option deselects it.

```tsx
{
    key: 'status',
    label: 'Status',
    type: 'string',
    options: [
        { key: 'active', label: 'Active', value: 'active', count: 42 },
    ],
}
```

### Multi-select (`type: 'string'`, `multi: true`)

Renders a checkbox list — multiple values may be selected simultaneously.

```tsx
{
    key: 'department',
    label: 'Department',
    type: 'string',
    multi: true,
    options: [
        { key: 'engineering', label: 'Engineering', value: 'engineering', count: 120 },
        { key: 'design',      label: 'Design',      value: 'design',      count: 32 },
    ],
}
```

### Numeric range with histogram (`type: 'number'`)

Renders a `RangeHistogramFilter` — a draggable range slider overlaid on a histogram of the actual data distribution.

```tsx
{
    key: 'salary',
    label: 'Salary',
    type: 'number',
    buckets: 15,
    numericRange: {
        min: 40_000,
        max: 200_000,
        values: salaryDataPoints,   // FilterValue[] used to draw the histogram
    },
}
```

### Custom editor (`type: 'custom'`)

Declare `type: 'custom'` in the `FilterDefinition`, then place a matching `<FilterEditor>` child inside `<FilterPanel>`. The value is stored in `customValues` keyed by the filter's `key`.

```tsx
// 1. Declare the filter group (no editor function here)
const filters: FilterDefinition[] = [
    { key: 'rating', label: 'Rating', type: 'custom' },
];

// 2. Attach the editor declaratively as a child of FilterPanel
<FilterPanel
    filters={filters}
    customValues={customValues}
    onCustomValueChange={handleCustomValueChange}
    {...otherProps}
>
    <FilterEditor filterKey="rating">
        {({ value, onChange }) => (
            <MyStarRatingWidget value={value as number} onChange={onChange} />
        )}
    </FilterEditor>
</FilterPanel>
```

Pass `customValues` and `onCustomValueChange` to `FilterPanel` when using custom editors:

```tsx
const { customValues, handleCustomValueChange, ...rest } = useFilterState(filters);

<FilterPanel
    {...rest}
    customValues={customValues}
    onCustomValueChange={handleCustomValueChange}
>
    <FilterEditor filterKey="rating">
        {({ value, onChange }) => <MyStarRatingWidget value={value as number} onChange={onChange} />}
    </FilterEditor>
</FilterPanel>
```

## Clearing Filters

Each filter group automatically displays a round clear button (×) in its header when it has active selections:

- **String/option filters**: The clear button appears next to the selection count badge (e.g., "3 selected")
- **Numeric range filters**: The clear button appears next to the "Range" indicator
- **Custom filters**: The clear button appears when the filter has a value (non-null, non-undefined)

The clear button includes a tooltip describing its action and can be clicked without expanding the filter. When clicked:

- For string/option filters, all selections are cleared via `onFilterClear(filterKey)`
- For range filters, the range is reset to `null` via `onRangeChange(filterKey, null)`
- For custom filters, the value is set to `undefined` via `onCustomValueChange(filterKey, undefined)`

Custom filter editors should not implement their own clear buttons; the header clear button handles this automatically.

## `FilterPanel` Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `isOpen` | `boolean` | ✓ | Whether the panel is visible |
| `filters` | `FilterDefinition[]` | ✓ | Filter group definitions |
| `filterValues` | `FilterValues` | ✓ | Current string/option selections |
| `rangeValues` | `RangeValues` | ✓ | Current numeric range selections |
| `customValues` | `CustomFilterValues` | — | Values for custom-editor filters |
| `search` | `string` | — | Current search-box value |
| `searchPlaceholder` | `string` | — | Placeholder for search input (default: `'Search…'`) |
| `expandedFilterKey` | `string \| null` | — | Which filter group is open |
| `anchorRef` | `RefObject<HTMLButtonElement>` | ✓ | Button the panel anchors below |
| `onClose` | `() => void` | ✓ | Called when panel should close |
| `onSearchChange` | `(value: string) => void` | — | If provided, shows a search box |
| `onFilterToggle` | `(filterKey, optionKey, multi) => void` | ✓ | Called when an option is toggled |
| `onFilterClear` | `(filterKey) => void` | ✓ | Called when all selections for a filter are cleared |
| `onRangeChange` | `(filterKey, range) => void` | ✓ | Called when a numeric range changes |
| `onExpandedFilterChange` | `(key \| null) => void` | ✓ | Called when the expanded group changes |
| `onCustomValueChange` | `(filterKey, value) => void` | — | Called when a custom editor value changes |
| `children` | `ReactNode` | — | `<FilterEditor>` slot elements for custom filter groups |

## `FilterEditor` Props

`FilterEditor` is a declarative slot component. It renders nothing itself — `FilterPanel` discovers it from `children` and slots the editor into the correct filter group.

| Prop | Type | Required | Description |
|---|---|---|---|
| `filterKey` | `string` | ✓ | Must match the `key` of the corresponding `FilterDefinition` |
| `children` | `(props: FilterEditorProps) => ReactNode` | ✓ | Render prop receiving `{ value, onChange }` |

## `useFilterState` Hook

`useFilterState(filters)` initialises and manages all filter state in one call. Its return value can be spread directly into `FilterPanel`:

```tsx
const state = useFilterState(filters);

<FilterPanel
    isOpen={open}
    filters={filters}
    anchorRef={buttonRef}
    filterValues={state.filterValues}
    rangeValues={state.rangeValues}
    customValues={state.customValues}
    expandedFilterKey={state.expandedFilterKey}
    onClose={() => setOpen(false)}
    onFilterToggle={state.handleToggleFilter}
    onFilterClear={state.handleClearFilter}
    onRangeChange={state.handleRangeChange}
    onExpandedFilterChange={state.setExpandedFilterKey}
    onCustomValueChange={state.handleCustomValueChange}
>
    <FilterEditor filterKey="myCustomFilter">
        {({ value, onChange }) => <MyEditor value={value} onChange={onChange} />}
    </FilterEditor>
</FilterPanel>
```

The hook re-syncs state when the `filters` array reference changes — existing selections are preserved for filter keys that are still present.

## `RangeHistogramFilter` Props

`RangeHistogramFilter` can also be used standalone, independently of `FilterPanel`.

| Prop | Type | Required | Description |
|---|---|---|---|
| `values` | `FilterValue[]` | ✓ | Raw data values used to compute the histogram |
| `min` | `number` | ✓ | Lower bound of the full range |
| `max` | `number` | ✓ | Upper bound of the full range |
| `buckets` | `number` | ✓ | Number of histogram bars |
| `selectedRange` | `[number, number] \| null` | ✓ | Currently selected range, or `null` for none |
| `onChange` | `(range: [number, number] \| null) => void` | ✓ | Called when the range changes |

## Importing

The Filter module is available at its own subpath — you do not need to import from the root package:

```tsx
import { FilterPanel, FilterEditor, useFilterState } from '@cratis/components/Filter';
import type { FilterDefinition } from '@cratis/components/Filter';
```

It is also re-exported from the package root:

```tsx
import { FilterPanel, FilterEditor, useFilterState } from '@cratis/components';
```
