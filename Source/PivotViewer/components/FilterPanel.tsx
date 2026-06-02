// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { FilterPanel as StandaloneFilterPanel } from '../../Filter/FilterPanel';
import { FilterEditor } from '../../Filter/FilterEditor';
import type { FilterDefinition } from '../../Filter/types';
import type { PivotFilter, PivotFilterOption, PivotPrimitive } from '../types';
import type { FilterState, RangeFilterState } from '../utils/utils';

export interface FilterPanelProps<TItem extends object> {
  isOpen: boolean;
  search: string;
  filterState: FilterState;
  rangeFilterState: RangeFilterState;
  expandedFilterKey: string | null;
  filterOptions: {
    filter: PivotFilter<TItem>;
    options: PivotFilterOption[];
    numericRange?: { min: number; max: number; values: PivotPrimitive[] };
  }[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onFilterToggle: (filterKey: string, optionKey: string, multi: boolean | undefined) => void;
  onFilterClear: (filterKey: string) => void;
  onRangeChange: (filterKey: string, range: [number, number] | null) => void;
  onExpandedFilterChange: (key: string | null) => void;
}

export function FilterPanel<TItem extends object>({
  isOpen,
  search,
  filterState,
  rangeFilterState,
  expandedFilterKey,
  filterOptions,
  anchorRef,
  onClose,
  onSearchChange,
  onFilterToggle,
  onFilterClear,
  onRangeChange,
  onExpandedFilterChange,
}: FilterPanelProps<TItem>) {
  // Adapt from PivotViewer-specific types to the generic FilterDefinition format
  const filters: FilterDefinition[] = filterOptions.map(({ filter, options, numericRange }) => ({
    key: filter.key,
    label: filter.label,
    type: filter.type,
    multi: filter.multi,
    options: options.map((o) => ({
      key: o.key,
      label: o.label,
      value: o.value,
      count: o.count,
    })),
    numericRange,
    buckets: filter.buckets,
  }));

  return (
    <StandaloneFilterPanel
      isOpen={isOpen}
      filters={filters}
      filterValues={filterState}
      rangeValues={rangeFilterState}
      search={search}
      searchPlaceholder="Search…"
      expandedFilterKey={expandedFilterKey}
      anchorRef={anchorRef}
      onClose={onClose}
      onSearchChange={onSearchChange}
      onFilterToggle={onFilterToggle}
      onFilterClear={onFilterClear}
      onRangeChange={onRangeChange}
      onExpandedFilterChange={onExpandedFilterChange}
    >
      {filterOptions
        .filter(({ filter }) => filter.renderEditor !== undefined)
        .map(({ filter }) => (
          <FilterEditor key={filter.key} filterKey={filter.key}>
            {(editorProps) => filter.renderEditor!(editorProps)}
          </FilterEditor>
        ))}
    </StandaloneFilterPanel>
  );
}

