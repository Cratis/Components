// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A value that can be rendered in a filter option or counted into a histogram bucket. */
export type FilterValue = string | number | boolean | Date | null | undefined;

/** One selectable option in a string/option filter group. */
export interface FilterOption {
    /** Unique key for this option, used to track selections. */
    key: string;
    /** Human-readable label shown in the filter UI. */
    label: string;
    /** The underlying value this option represents. */
    value: FilterValue;
    /** Optional count of items with this value, shown next to the label. */
    count?: number;
}

/** Props passed to a custom filter editor render function. */
export interface FilterEditorProps {
    /** The current value for this filter, or `undefined` when unset. */
    value: unknown;
    /** Called when the user changes the filter value. */
    onChange: (value: unknown) => void;
}

/** One pre-counted bar of a range filter's histogram. */
export interface HistogramBucket {
    /** Inclusive start of the bucket, on the same scale as the filter's range. */
    start: number;
    /** Exclusive end of the bucket, on the same scale as the filter's range. */
    end: number;
    /** Number of items that fall inside the bucket. */
    count: number;
}

/** Defines one filter group in a {@link FilterPanel}. */
export interface FilterDefinition {
    /** Unique key for this filter group. */
    key: string;
    /** Human-readable label shown in the filter panel. */
    label: string;
    /**
     * Filter type. Defaults to 'string'. Use 'number' for range/histogram.
     * Use 'custom' when providing a `<FilterEditor>` child inside `<FilterPanel>` for fully custom UI.
     */
    type?: 'string' | 'number' | 'date' | 'custom';
    /** Allow selecting multiple options (checkbox behaviour). Defaults to false (radio behaviour). */
    multi?: boolean;
    /** Pre-computed options for string/date filters. */
    options?: FilterOption[];
    /**
     * Numeric range data for 'number' and 'date' type filters.
     *
     * Supply `values` to have the histogram counted in the browser, or `histogram` when the counts
     * were produced elsewhere - by a server aggregating over more rows than are worth transferring,
     * for instance. `histogram` wins when both are present.
     */
    numericRange?: {
        min: number;
        max: number;
        values?: FilterValue[];
        histogram?: HistogramBucket[];
    };
    /** Number of histogram buckets. Defaults to 20. */
    buckets?: number;
    /** Show an inline search box that filters the displayed options for this group. */
    searchable?: boolean;
    /** Placeholder shown in the inline search box. Defaults to 'Search…'. */
    searchPlaceholder?: string;
}

/** Selected string/option values for each filter, keyed by FilterDefinition.key. */
export type FilterValues = Record<string, Set<string>>;

/** Selected numeric ranges for each filter, keyed by FilterDefinition.key. */
export type RangeValues = Record<string, [number, number] | null>;

/** Custom values for filters that use renderEditor, keyed by FilterDefinition.key. */
export type CustomFilterValues = Record<string, unknown>;
