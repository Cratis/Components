---
title: FilterPanel for standalone React filtering
description: Use FilterPanel to collect option, range, and custom filter selections in React. Apply them to local data or query arguments in your application.
---

Use `FilterPanel` from Cratis Components when users need to narrow a data view by choices such as status, salary, or date. It collects selections in a dropdown anchored to a button; your application applies those selections to local data or sends them as query arguments. The panel does not fetch or filter records itself.

## Key Features

A status choice can narrow a list to active records; a salary range can restrict it to a pay band. Define the choices with `FilterDefinition` and use `useFilterState` to track them, or connect the panel to state you already own. Each active group has a header clear button so users can remove one restriction without resetting the others.

For a choice between this panel, table-column filters, and global search, see [Choosing a component](../choosing-a-component.md#filtering). If you have not configured Cratis Components yet, follow [Getting started](../getting-started.mdx) before adding the example below.

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

Start with a status picker. The filter's `key` identifies its state entry; each option's `key` identifies a selection. The counts below are supplied display data, not totals calculated by the panel.

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

Open **Filters** and choose **Active**. The **Status** group starts expanded, and `filterValues.status` becomes a `Set` containing `'active'`. The paragraph beneath the button now reads `Selected statuses: active`. Clear the group with its header button to return that text to `all`.

To make the same choice narrow your records, read `filterValues.status` in the component that owns the data view. In this example the option keys equal the record status values, so keep a record when the set is empty or contains its status. With multiple groups, your application decides how to combine their restrictions. Selections contain option keys, not the options' `value` fields; map keys to values when those differ.

For server-side filtering, translate the selected keys into your query arguments and request the matching records. Filtering an already-loaded array only narrows that array, not every server page. Keep option counts and histogram data consistent with the dataset you intend users to explore.

## Filter Types

### Single-select (`type: 'string'`, `multi: false`)

Use a radio-button list when only one status should restrict the view at a time. `multi` defaults to `false`; choosing another option replaces the selection. Use the group's header clear button to remove the restriction.

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

Use a checkbox list when users should be able to include several departments. Each checked option adds its key to the group's selection set; unchecking it removes that key.

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

Use `RangeHistogramFilter` to let users choose a salary band while seeing how the supplied values are distributed. The histogram groups those values into bars. Drag either handle to change the endpoints, use Arrow/Home/End keys on a focused handle, or activate a bar to select its bounds. The selected pair is stored in `rangeValues.salary`; your application uses it to restrict the records.

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

Supply `numericRange.values` to count histogram bars in the browser, or `numericRange.histogram` for pre-counted `HistogramBucket` entries from your server. Pre-counted buckets take precedence when both are supplied. Use server counts when the loaded records do not cover the full result set; the panel does not obtain those counts for you.

### Date range (`type: 'date'`)

For a date interval, use the same `numericRange` shape with bounds and values expressed as timestamps in milliseconds, such as `date.getTime()`. The panel formats the endpoint labels with `toLocaleString()`, but the selected range remains a pair of numbers. Convert those endpoints to the date representation your query expects.

### Searching long option lists

An option group's search narrows its visible choices by label; it does not search your records or clear hidden selections. The search box appears automatically when the options do not fit in the group's box. Set `searchable: true` on the `FilterDefinition` to always show it, or `searchable: false` to never show it. Set `searchPlaceholder` to change its placeholder and `searchAriaLabel` to give the input a distinct accessible name. Without `searchAriaLabel`, its accessible name uses `messages.filter.searchAriaLabel` from `CratisComponentsProvider`, then the effective placeholder, then the English default `'Search'` if the placeholder is empty. Standalone `CheckboxListFilter` accepts the same search props and precedence. An empty explicit or provider search name falls back to `'Search'`, not the placeholder.

Set `autoFocus: true` on a `FilterDefinition` to focus its inline search when that group becomes expanded, including if overflow measurement adds the input after rendering. The default is `false`; `autoFocus` has no effect if the group is collapsed or has no search input. For a standalone `CheckboxListFilter`, use `autoFocusSearch` to request focus when its search becomes visible.

The panel-level search is separate from each group's option search. Supplying `onSearchChange` shows it, but your application must store the text in `search` and apply it to records or query arguments.

### Custom editor (`type: 'custom'`)

For a restriction that needs its own control, such as a minimum star rating, declare `type: 'custom'` and place a matching `<FilterEditor>` child inside `<FilterPanel>`. Its `filterKey` must equal the definition's `key`; that match tells the panel where to render the editor. With `useFilterState` wired below, changes are stored in `customValues` under the same key.

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

The editor receives `value` as `unknown`; narrow it before use. Call `onChange(undefined)` to leave the filter unset. Your application interprets the result: for a minimum rating of 4, for example, keep records rated 4 or higher. The editor collects that threshold; it does not apply the comparison.

## Clearing Filters

Use the header clear button (×) to remove a restriction without expanding the group. It appears beside the selection count for option filters, beside the `Range` indicator for numeric/date ranges, or when a custom value is neither `null` nor `undefined`. The button has an accessible name and a matching tooltip.

Clearing calls the handler for that group's state:

| Filter kind | Clear callback |
|---|---|
| String/option | `onFilterClear(filterKey)` clears its selection set |
| Numeric/date range | `onRangeChange(filterKey, null)` removes its range |
| Custom | `onCustomValueChange(filterKey, undefined)` unsets its value |

With `useFilterState`, the mapped handlers make those state changes. If you supply your own state, implement the same reset behavior in your callbacks. Custom editors can use the header button instead of adding a separate clear control.

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
| `aria-label` | `string` | — | Accessible name of the non-modal dialog; overrides `messages.filter.label` (English default: `'Filters'`) |
| `searchAriaLabel` | `string` | — | Accessible name of the panel search input; falls back to `messages.filter.searchAriaLabel`, the effective `searchPlaceholder`, then the English default `'Search'` |
| `clearFilterAriaLabel` | `string` | — | Accessible name and tooltip for a string/custom filter's clear button (default: `'Clear filter'`) |
| `clearRangeAriaLabel` | `string` | — | Accessible name and tooltip for a numeric/date filter's clear button (default: `'Clear range'`) |
| `expandedFilterKey` | `string \| null` | — | Which filter group is open |
| `anchorRef` | `RefObject<HTMLButtonElement \| null>` | ✓ | Button the panel anchors below |
| `onClose` | `() => void` | ✓ | Called when panel should close |
| `onSearchChange` | `(value: string) => void` | — | If provided, shows the panel search box; the host applies its text to data or query arguments |
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

`useFilterState(filters)` tracks option selections, ranges, custom values, and the expanded group. Keep panel visibility in your own state, as in the Quick Start. Its handler names differ from the `FilterPanel` prop names (`handleToggleFilter` versus `onFilterToggle`), so map each handler explicitly rather than spreading the result into `FilterPanel`.

This example connects a minimum-rating number input. Empty input calls `onChange(undefined)`; entering a number puts it in `state.customValues.rating` for the data view to use.

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

The first filter group starts expanded. When the filter key list changes, the hook rebuilds its option and range maps, preserving option selections and `type: 'number'` ranges for keys still present. Date ranges are created on first change and are not preserved through that rebuild. A new `filters` array with the same key list does not trigger it.

## `RangeHistogramFilter` Props

Use `RangeHistogramFilter` on its own when the range belongs directly in your layout rather than in a dropdown. Supply the bounds and histogram data, store `selectedRange` in your state, and handle `onChange`. As with the panel, your data view must apply the chosen endpoints.

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

Give the panel a name that identifies what it filters. It renders a `<div>` with `role="dialog"` as a non-modal dialog, not an `<aside>` landmark. Set `aria-label` on one panel or `messages.filter.label` on `CratisComponentsProvider` for all panels; the English default is `'Filters'`. An empty dialog label is retained, so supply a non-empty name. Set `aria-expanded` on the trigger, as in the Quick Start.

Opening moves focus into the panel unless an expanded group's `autoFocus` search receives it first. Focus is not trapped. An unhandled Escape inside the panel or on its anchor closes the panel and returns focus to `anchorRef`. Escape elsewhere does nothing; a control that handles Escape itself or an active text composition also leaves the panel open. Outside mousedown closes without moving focus.

Group headers are buttons with `aria-expanded`. Name their clear buttons with `clearFilterAriaLabel` or `clearRangeAriaLabel`. Range handles expose named sliders that respond to Arrow, Home, and End keys. For standalone `RangeHistogramFilter`, customize those names with `minimumAriaLabel` and `maximumAriaLabel`.

Give searches distinct names when their purpose differs, such as searching records versus searching status choices. The `searchAriaLabel` on each surface wins over `messages.filter.searchAriaLabel`, then the effective placeholder supplies the fallback, with `'Search'` used for an empty name. The provider does not change placeholders; `FilterDefinition.searchPlaceholder` still overrides the panel placeholder. `PivotViewer` keeps its `labels.searchGroup` names (or distinct `Search ${groupLabel}` defaults) for groups and uses `labels.search` ahead of the provider for its panel search.

The panel portals into the provider's [overlay container](../Common/cratis-components-provider.md#choose-an-overlay-container), or `document.body` without one. It follows `anchorRef` on scroll and resize, choosing above or below the button according to the available space. If a configured container is unavailable (`getContainer()` returns `null`), the panel waits; a later render can mount it once the container exists.

Inside a Cratis modal `Dialog`, a shared container outside the modal would hide the panel from assistive technology and pull focus back into the modal. The panel therefore mounts inside the dialog's modal root in that case. A container already inside the modal remains the destination. If the dialog has a persistent fixed containing block, such as a `pt.root` transform, the panel stays within the dialog's visible bounds and its contents scroll. Translated and scaled overlay containers are supported; rotated or skewed containers are not.

## Importing

The Filter module is available only at its explicit component subpath; the Components 4 package root is setup-only:

```tsx
import { FilterPanel, FilterEditor, useFilterState } from '@cratis/components/Filter';
import type { FilterDefinition } from '@cratis/components/Filter';
```
