// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import type { PivotFilter, PivotFilterOption, PivotPrimitive } from '../types';
import { applyFilters, computeFilterOptions, computeNumericRange } from '../utils/utils';
import type { FilterState, RangeFilterState } from '../types';

export function useFilterOptions<TItem extends object>(
  data: TItem[],
  filters: PivotFilter<TItem>[] | undefined,
  filterState: FilterState,
  rangeFilterState: RangeFilterState
) {
  return useMemo(() => {
    if (!filters?.length) {
      return [] as {
        filter: PivotFilter<TItem>;
        options: PivotFilterOption[];
        numericRange?: { min: number; max: number; values: PivotPrimitive[] };
      }[];
    }

    return filters.map((filter) => {
      const baseData = applyFilters(data, filters, filterState, rangeFilterState, filter.key);

      if (filter.type === 'number') {
        const numericRange = computeNumericRange(baseData, filter);
        return { filter, options: [], numericRange };
      }

      const options = computeFilterOptions(baseData, filter);
      return { filter, options };
    });
  }, [data, filters, filterState, rangeFilterState]);
}
