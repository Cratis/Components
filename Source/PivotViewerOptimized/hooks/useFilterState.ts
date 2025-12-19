import { useState, useEffect, useCallback } from 'react';
import { buildFilterState, buildRangeFilterState } from '../utils/utils';
import { FilterState, RangeFilterState, PivotFilter } from '../types';

/**
 * Hook to manage filter state.
 */
export function useFilterState<TItem extends object>(
  filters: PivotFilter<TItem>[] | undefined
) {
  const [filterState, setFilterState] = useState<FilterState>(() => buildFilterState(filters));
  const [rangeFilterState, setRangeFilterState] = useState<RangeFilterState>(() => buildRangeFilterState(filters));
  const [expandedFilterKey, setExpandedFilterKey] = useState<string | null>(filters?.[0]?.key ?? null);

  useEffect(() => {
    setFilterState((prev) => {
      const next = buildFilterState(filters);
      if (!filters) return next;

      filters.forEach((filter) => {
        if (prev[filter.key]) {
          next[filter.key] = new Set(prev[filter.key]);
        }
      });

      return next;
    });
    setRangeFilterState((prev) => {
      const next = buildRangeFilterState(filters);
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
      if (current && filters.some((filter) => filter.key === current)) {
        return current;
      }
      return filters[0]?.key ?? null;
    });
  }, [filters]);

  const handleToggleFilter = useCallback((filterKey: string, optionKey: string, multi: boolean | undefined) => {
    setFilterState((prev) => {
      const next: FilterState = { ...prev };
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
    setFilterState((prev) => {
      const next: FilterState = { ...prev };
      next[filterKey] = new Set();
      return next;
    });
  }, []);

  const handleRangeChange = useCallback((filterKey: string, range: [number, number] | null) => {
    setRangeFilterState((prev) => ({
      ...prev,
      [filterKey]: range,
    }));
  }, []);

  return {
    filterState,
    rangeFilterState,
    expandedFilterKey,
    setExpandedFilterKey,
    handleToggleFilter,
    handleClearFilter,
    handleRangeChange,
  };
}
