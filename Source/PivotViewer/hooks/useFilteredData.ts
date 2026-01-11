// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import type { PivotDimension, PivotFilter, PivotGroup, PropertyAccessor } from '../types';
import { getPropertyPath, getValueByPath } from '../types';
import { applyFilters, groupData, toKey } from '../utils/utils';
import type { FilterState, RangeFilterState } from '../utils/utils';

export function useFilteredData<TItem extends object>(
  data: TItem[],
  filters: PivotFilter<TItem>[] | undefined,
  filterState: FilterState,
  rangeFilterState: RangeFilterState,
  activeDimension: PivotDimension<TItem> | undefined,
  dimensionFilter: string | null,
  searchTerm: string,
  searchFields?: PropertyAccessor<TItem>[]
) {
  const filteredData = useMemo(() => {
    let dataWithFilters = applyFilters(data, filters, filterState, rangeFilterState);

    if (dimensionFilter && activeDimension) {
      dataWithFilters = dataWithFilters.filter((item) => {
        const value = activeDimension.getValue(item);
        const key = toKey(value);
        return key === dimensionFilter;
      });
    }

    if (!searchTerm) {
      return dataWithFilters;
    }

    // Optimize search by using indexOf instead of includes for better performance
    return dataWithFilters.filter((item) => {
      if (searchFields && searchFields.length) {
        for (const accessor of searchFields) {
          const propertyPath = getPropertyPath(accessor);
          const value = getValueByPath(item, propertyPath);
          if (value !== undefined && String(value).toLowerCase().indexOf(searchTerm) !== -1) {
            return true;
          }
        }
        return false;
      }

      // Fallback to JSON stringify - less efficient but comprehensive
      return JSON.stringify(item).toLowerCase().indexOf(searchTerm) !== -1;
    });
  }, [data, filters, filterState, rangeFilterState, dimensionFilter, activeDimension, searchFields, searchTerm]);

  const allGroupsForGroupedMode = useMemo(() => {
    if (!activeDimension) {
      return [] as PivotGroup<TItem>[];
    }
    const dataWithoutDimensionFilter = applyFilters(data, filters, filterState, rangeFilterState);
    return groupData(dataWithoutDimensionFilter, activeDimension);
  }, [data, filters, filterState, rangeFilterState, activeDimension]);

  const groupedGroups = useMemo(() => {
    if (!activeDimension) {
      return [] as PivotGroup<TItem>[];
    }

    if (dimensionFilter) {
      const filteredGroup = allGroupsForGroupedMode.find((group) => group.key === dimensionFilter);
      return filteredGroup ? [filteredGroup] : [];
    }

    return groupData(filteredData, activeDimension);
  }, [filteredData, activeDimension, dimensionFilter, allGroupsForGroupedMode]);

  const collectionGroup = useMemo(() => {
    if (filteredData.length === 0) {
      return [] as PivotGroup<TItem>[];
    }

    // Sort by active dimension when in collection mode
    const sortedData = activeDimension
      ? [...filteredData].sort((a, b) => {
          const valueA = activeDimension.getValue(a);
          const valueB = activeDimension.getValue(b);

          // Handle null/undefined
          if (valueA == null && valueB == null) return 0;
          if (valueA == null) return 1;
          if (valueB == null) return -1;

          // Handle dates
          if (valueA instanceof Date && valueB instanceof Date) {
            return valueA.getTime() - valueB.getTime();
          }

          // Handle numbers
          if (typeof valueA === 'number' && typeof valueB === 'number') {
            return valueA - valueB;
          }

          // Handle strings
          return String(valueA).localeCompare(String(valueB));
        })
      : filteredData;

    return [
      {
        key: 'collection-all',
        label: 'All Events',
        value: null,
        items: sortedData,
      } as PivotGroup<TItem>,
    ];
  }, [filteredData, activeDimension]);

  return {
    filteredData,
    allGroupsForGroupedMode,
    groupedGroups,
    collectionGroup,
  };
}
