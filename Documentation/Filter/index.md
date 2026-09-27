---
title: FilterPanel
description: Build reusable filter panels with option, range, and custom editors.
---

The `FilterPanel` component provides a standalone, reusable filter UI that can be placed next to any data view. It renders as a positioned dropdown anchored below a trigger button and supports single-select, multi-select, numeric range (with histogram), and fully custom filter editors declared as children. If you are choosing between faceted, column, and global filtering, start with [Choosing a component](../choosing-a-component.md#filtering).

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
| `CheckboxListFilter` | Standalone bounded checkbox/radio option list; `FilterPanel` uses it for option groups |
| `useFilterState` | State management hook — tracks selections, ranges, and custom values |
| `buildHistogram` | Counts values into histogram buckets, as `RangeHistogramFilter` does |
| `FilterDefinition` | Type describing a single filter group |
| `FilterOption` | One selectable option: `key`, `label`, `value`, optional `count` |
| `FilterValue` | `string \| number \| boolean \| Date \| null \| undefined` |
| `HistogramBucket` | A pre-counted bar: `start`, `end`, `count` |
| `FilterEditorProps` | Props passed to a `FilterEditor` render-prop child (`{ value, onChange }`) |
| `FilterEditorSlotProps` | Props for the `FilterEditor` component itself |
| `FilterValues` | `Record<string, Set<string>>` — selected option keys per filter |
| `RangeValues` | `Record<string, [number, number] \| null>` — selected ranges per filter |
| `CustomFilterValues` | `Record<string, unknown>` — values for custom editor filters |

## Quick Start

```tsx
import { useRef, useState } from 'react';
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

export function StatusFilter() {
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
            <button
                ref={buttonRef}
                type='button'
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
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
            <p>Selected statuses: {[...(filterValues.status ?? [])].join(', ') || 'all'}</p>
        </>
    );
}
```

Clicking **Filters** opens the panel below the button with the **Status** group expanded. Choosing **Active** updates `filterValues.status` to a `Set` containing `'active'`. The panel only collects selections: apply them to your data or send them as query arguments yourself.

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

Renders a `RangeHistogramFilter` — a range slider overlaid on a histogram of the actual data distribution. Users can drag either handle, focus the named minimum/maximum sliders and use Arrow/Home/End keys, or activate a histogram bar to snap to its bounds.

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

### Date range (`type: 'date'`)

Uses the same range slider and histogram as `type: 'number'`, configured through `numericRange`. Supply the bounds and values as timestamps in milliseconds (for example `date.getTime()`); the endpoint labels are formatted with `toLocaleString()`.

### Searching long option lists

An option group shows a search box when its options do not fit in the group's box. Set `searchable: true` on the `FilterDefinition` to always show it, or `searchable: false` to never show it. Set `searchPlaceholder` to change its placeholder and `searchAriaLabel` to give the input a distinct accessible name. Without `searchAriaLabel`, its accessible name uses the effective placeholder, then the English default `'Search'` if the placeholder is empty. Standalone `CheckboxListFilter` accepts the same search props.

Set `autoFocus: true` on a `FilterDefinition` to focus its inline search when that group becomes expanded, including if overflow measurement adds the input after rendering. The default is `false`; `autoFocus` has no effect if the group is collapsed or has no search input. For a standalone `CheckboxListFilter`, use `autoFocusSearch` to request focus when its search becomes visible.

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

Pass `customValues` and `onCustomValueChange` to `FilterPanel` when using custom editors. The complete wiring, with a number input as the editor, is shown in [`useFilterState` Hook](#usefilterstate-hook).

The editor receives `value` as `unknown`; narrow it before use. Call `onChange(undefined)` to leave the filter unset.

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
| `searchPlaceholder` | `string` | — | Placeholder for the panel's search input (default: `'Search…'`). Also the fallback placeholder for a searchable filter group that does not declare its own `searchPlaceholder`. |
| `aria-label` | `string` | — | Accessible name of the non-modal dialog (English default: `'Filters'`) |
| `searchAriaLabel` | `string` | — | Accessible name of the panel search input; falls back to `searchPlaceholder`, then the English default `'Search'` |
| `clearFilterAriaLabel` | `string` | — | Accessible name and tooltip for a string/custom filter's clear button (default: `'Clear filter'`) |
| `clearRangeAriaLabel` | `string` | — | Accessible name and tooltip for a numeric/date filter's clear button (default: `'Clear range'`) |
| `expandedFilterKey` | `string \| null` | — | Which filter group is open |
| `anchorRef` | `RefObject<HTMLButtonElement \| null>` | ✓ | Button the panel anchors below |
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

`useFilterState(filters)` initializes and manages all filter state in one call. Its handler names differ from the `FilterPanel` prop names (`handleToggleFilter` versus `onFilterToggle`), so you cannot spread the result into `FilterPanel`; map each value to its prop:

```tsx
import { useRef, useState } from 'react';
import { FilterPanel, FilterEditor, useFilterState } from '@cratis/components/Filter';
import type { FilterDefinition } from '@cratis/components/Filter';

const ratingFilters: FilterDefinition[] = [{ key: 'rating', label: 'Minimum rating', type: 'custom' }];

export function RatingFilter() {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const state = useFilterState(ratingFilters);

    return (
        <>
            <button ref={buttonRef} type='button' onClick={() => setIsOpen((open) => !open)}>
                Filters
            </button>
            <FilterPanel
                isOpen={isOpen}
                filters={ratingFilters}
                anchorRef={buttonRef}
                onClose={() => setIsOpen(false)}
                filterValues={state.filterValues}
                rangeValues={state.rangeValues}
                customValues={state.customValues}
                expandedFilterKey={state.expandedFilterKey}
                onFilterToggle={state.handleToggleFilter}
                onFilterClear={state.handleClearFilter}
                onRangeChange={state.handleRangeChange}
                onExpandedFilterChange={state.setExpandedFilterKey}
                onCustomValueChange={state.handleCustomValueChange}
            >
                <FilterEditor filterKey='rating'>
                    {({ value, onChange }) => (
                        <input
                            type='number'
                            min={1}
                            max={5}
                            aria-label='Minimum rating'
                            value={typeof value === 'number' ? value : ''}
                            onChange={(event) =>
                                onChange(event.target.value === '' ? undefined : Number(event.target.value))
                            }
                        />
                    )}
                </FilterEditor>
            </FilterPanel>
        </>
    );
}
```

The first filter group starts expanded. The hook re-syncs its state when the set of filter keys changes, not on every new `filters` array; existing selections are preserved for filter keys that are still present.

## `RangeHistogramFilter` Props

`RangeHistogramFilter` can also be used standalone, independently of `FilterPanel`.

| Prop               | Type                                        | Required | Description                                                                                |
| ------------------ | ------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `values`           | `FilterValue[]`                             | —        | Raw data values used to compute the histogram. Omit when `histogram` is supplied.          |
| `histogram`        | `HistogramBucket[]`                         | —        | Pre-counted buckets, typically covering the complete server-side result set.               |
| `min`              | `number`                                    | ✓        | Lower bound of the full range                                                              |
| `max`              | `number`                                    | ✓        | Upper bound of the full range                                                              |
| `buckets`          | `number`                                    |          | Number of histogram bars (default `20`)                                                    |
| `selectedRange`    | `[number, number] \| null`                  | ✓        | Currently selected range, or `null` for none                                               |
| `onChange`         | `(range: [number, number] \| null) => void` | ✓        | Called when the range changes                                                              |
| `formatValue`      | `(value: number) => string`                 | —        | Formatter for endpoint labels and bar-tooltip numbers (default: a plain numeric formatter) |
| `itemsLabel`       | `string`                                    | —        | Unit word shown after a bar tooltip's count, e.g. `'42 items'` (default: `'items'`)        |
| `minimumAriaLabel` | `string`                                    | —        | Accessible name for the lower-bound slider (default: `'Minimum value'`)                    |
| `maximumAriaLabel` | `string`                                    | —        | Accessible name for the upper-bound slider (default: `'Maximum value'`)                    |

## Accessibility and keyboard

- The panel is rendered into `document.body` at a fixed position below `anchorRef`, and follows the anchor on scroll and resize.
- The panel renders as a `<div>` with `role="dialog"`, so it is exposed as a named, non-modal dialog, not an `<aside>` complementary landmark. Override its English default name with `aria-label` for your locale. Opening the panel moves focus into the dialog; if an expanded group's `autoFocus` search is available, it receives focus instead. Focus is not trapped. Set `aria-expanded` on your trigger, as in the Quick Start.
- Escape closes the panel and returns focus to `anchorRef` if focus is inside the panel or on its anchor. Escape with focus elsewhere does nothing. Outside mousedown closes without moving focus.
- Each group header is a button with `aria-expanded`. The clear button is named by `clearFilterAriaLabel` or `clearRangeAriaLabel`.
- Range sliders are named by `minimumAriaLabel` and `maximumAriaLabel` and respond to Arrow, Home, and End keys.
- The panel and group search inputs have accessible names: `searchAriaLabel` on `FilterPanel`, `FilterDefinition`, or standalone `CheckboxListFilter` overrides each input's placeholder, which itself falls back to the English default `'Search'` when empty.

## Importing

The Filter module is available only at its explicit component subpath; the Components 4 package root is setup-only:

```tsx
import { FilterPanel, FilterEditor, useFilterState } from '@cratis/components/Filter';
import type { FilterDefinition } from '@cratis/components/Filter';
```
