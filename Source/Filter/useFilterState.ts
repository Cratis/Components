// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
    FilterDefinition,
    FilterValues,
    RangeValues,
    CustomFilterValues,
} from './types';
import { buildFilterValues, buildRangeValues } from './utils';

/**
 * Return type of {@link useFilterState}.
 *
 * Contains the current filter state (selections, ranges, custom values, and
 * the expanded filter key) and handlers for toggling options, clearing
 * filters, changing ranges, and changing custom values. Pass these directly
 * to {@link FilterPanel}.
 */
export interface UseFilterStateResult {
    /** Current string/option selections, keyed by `FilterDefinition.key`. */
    filterValues: FilterValues;
    /** Current numeric range selections, keyed by `FilterDefinition.key`. */
    rangeValues: RangeValues;
    /** Current values for filters using a custom `<FilterEditor>`, keyed by `FilterDefinition.key`. */
    customValues: CustomFilterValues;
    /** The key of the currently expanded filter group, or `null` when none is expanded. */
    expandedFilterKey: string | null;
    /** Set which filter group is expanded. Pass `null` to collapse all. */
    setExpandedFilterKey: (key: string | null) => void;
    /** Called when the user toggles a string/option filter. */
    handleToggleFilter: (filterKey: string, optionKey: string, multi: boolean) => void;
    /** Called when the user clears all selections for a filter group. */
    handleClearFilter: (filterKey: string) => void;
    /** Called when the user drags a numeric range or clicks a histogram bar. */
    handleRangeChange: (filterKey: string, range: [number, number] | null) => void;
    /** Called when a custom editor's value changes. */
    handleCustomValueChange: (filterKey: string, value: unknown) => void;
}

/**
 * State management hook for the standalone FilterPanel.
 *
 * Tracks selected options, numeric ranges, and custom values for every
 * filter in the provided `filters` array. Pass the returned values and
 * handlers directly to <FilterPanel>.
 */
export function useFilterState(
    filters: FilterDefinition[] | undefined,
): UseFilterStateResult {
    const [filterValues, setFilterValues] = useState<FilterValues>(() =>
        buildFilterValues(filters),
    );
    const [rangeValues, setRangeValues] = useState<RangeValues>(() =>
        buildRangeValues(filters),
    );
    const [customValues, setCustomValues] = useState<CustomFilterValues>({});
    const [expandedFilterKey, setExpandedFilterKey] = useState<string | null>(
        filters?.[0]?.key ?? null,
    );

    // Serialize filter keys to avoid infinite loops from reference changes
    const filterKeys = useMemo(
        () => filters?.map((f) => f.key).join(',') ?? '',
        [filters],
    );
    const prevFilterKeysRef = useRef<string>(filterKeys);

    // Sync state when the filter definitions change (only when keys actually change)
    useEffect(() => {
        // Only update if the filter keys have actually changed
        if (filterKeys === prevFilterKeysRef.current) return;
        prevFilterKeysRef.current = filterKeys;

        setFilterValues((prev) => {
            const next = buildFilterValues(filters);
            if (!filters) return next;
            filters.forEach((filter) => {
                if (prev[filter.key]) {
                    next[filter.key] = new Set(prev[filter.key]);
                }
            });
            return next;
        });

        setRangeValues((prev) => {
            const next = buildRangeValues(filters);
            if (!filters) return next;
            filters.forEach((filter) => {
                if (filter.type === 'number' && filter.key in prev) {
                    next[filter.key] = prev[filter.key];
                }
            });
            return next;
        });
    }, [filterKeys, filters]);

    useEffect(() => {
        if (!filters?.length) {
            setExpandedFilterKey(null);
            return;
        }
        setExpandedFilterKey((current) => {
            if (current && filters.some((f) => f.key === current)) return current;
            return filters[0]?.key ?? null;
        });
    }, [filterKeys, filters]);

    const handleToggleFilter = useCallback(
        (filterKey: string, optionKey: string, multi: boolean) => {
            setFilterValues((prev) => {
                const next: FilterValues = { ...prev };
                const current = new Set(prev[filterKey] ?? []);

                if (multi) {
                    if (current.has(optionKey)) {
                        current.delete(optionKey);
                    } else {
                        current.add(optionKey);
                    }
                } else {
                    if (current.has(optionKey)) {
                        current.clear();
                    } else {
                        current.clear();
                        current.add(optionKey);
                    }
                }

                next[filterKey] = current;
                return next;
            });
        },
        [],
    );

    const handleClearFilter = useCallback((filterKey: string) => {
        setFilterValues((prev) => ({ ...prev, [filterKey]: new Set() }));
    }, []);

    const handleRangeChange = useCallback(
        (filterKey: string, range: [number, number] | null) => {
            setRangeValues((prev) => ({ ...prev, [filterKey]: range }));
        },
        [],
    );

    const handleCustomValueChange = useCallback((filterKey: string, value: unknown) => {
        setCustomValues((prev) => ({ ...prev, [filterKey]: value }));
    }, []);

    return {
        filterValues,
        rangeValues,
        customValues,
        expandedFilterKey,
        setExpandedFilterKey,
        handleToggleFilter,
        handleClearFilter,
        handleRangeChange,
        handleCustomValueChange,
    };
}
