// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useState } from 'react';
import type { FilterDefinition, FilterValues, RangeValues, CustomFilterValues } from './types';
import { buildFilterValues, buildRangeValues } from './utils';

export interface UseFilterStateResult {
  filterValues: FilterValues;
  rangeValues: RangeValues;
  customValues: CustomFilterValues;
  expandedFilterKey: string | null;
  setExpandedFilterKey: (key: string | null) => void;
  handleToggleFilter: (filterKey: string, optionKey: string, multi: boolean) => void;
  handleClearFilter: (filterKey: string) => void;
  handleRangeChange: (filterKey: string, range: [number, number] | null) => void;
  handleCustomValueChange: (filterKey: string, value: unknown) => void;
}

/**
 * State management hook for the standalone FilterPanel.
 *
 * Tracks selected options, numeric ranges, and custom values for every
 * filter in the provided `filters` array. Pass the returned values and
 * handlers directly to <FilterPanel>.
 */
export function useFilterState(filters: FilterDefinition[] | undefined): UseFilterStateResult {
  const [filterValues, setFilterValues] = useState<FilterValues>(() => buildFilterValues(filters));
  const [rangeValues, setRangeValues] = useState<RangeValues>(() => buildRangeValues(filters));
  const [customValues, setCustomValues] = useState<CustomFilterValues>({});
  const [expandedFilterKey, setExpandedFilterKey] = useState<string | null>(
    filters?.[0]?.key ?? null
  );

  // Sync state when the filter definitions change
  useEffect(() => {
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
  }, [filters]);

  useEffect(() => {
    if (!filters?.length) {
      setExpandedFilterKey(null);
      return;
    }
    setExpandedFilterKey((current) => {
      if (current && filters.some((f) => f.key === current)) return current;
      return filters[0]?.key ?? null;
    });
  }, [filters]);

  const handleToggleFilter = useCallback((filterKey: string, optionKey: string, multi: boolean) => {
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
  }, []);

  const handleClearFilter = useCallback((filterKey: string) => {
    setFilterValues((prev) => ({ ...prev, [filterKey]: new Set() }));
  }, []);

  const handleRangeChange = useCallback((filterKey: string, range: [number, number] | null) => {
    setRangeValues((prev) => ({ ...prev, [filterKey]: range }));
  }, []);

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
