// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { FilterPanelProps } from './FilterPanel';
import type { FilterEditorProps } from './FilterEditorProps';
import { FilterGroup } from './FilterGroup';
import { FilterSearchBox } from './FilterSearchBox';

type ForwardedProps = Pick<
    FilterPanelProps,
    | 'filters'
    | 'filterValues'
    | 'rangeValues'
    | 'customValues'
    | 'search'
    | 'expandedFilterKey'
    | 'onSearchChange'
    | 'onFilterToggle'
    | 'onFilterClear'
    | 'onRangeChange'
    | 'onExpandedFilterChange'
    | 'onCustomValueChange'
>;

interface FilterPanelContentProps extends ForwardedProps {
    searchPlaceholder: string;
    searchAriaLabel?: string;
    clearFilterAriaLabel: string;
    clearRangeAriaLabel: string;
    editorMap: Record<string, (props: FilterEditorProps) => ReactNode>;
}

export const FilterPanelContent = ({
    filters,
    filterValues,
    rangeValues,
    customValues,
    search,
    searchPlaceholder,
    searchAriaLabel,
    clearFilterAriaLabel,
    clearRangeAriaLabel,
    expandedFilterKey,
    editorMap,
    onSearchChange,
    onFilterToggle,
    onFilterClear,
    onRangeChange,
    onExpandedFilterChange,
    onCustomValueChange,
}: FilterPanelContentProps) => (
    <div className='pv-filter-dropdown-content'>
        {onSearchChange && (
            <FilterSearchBox
                search={search}
                placeholder={searchPlaceholder}
                ariaLabel={searchAriaLabel}
                onSearchChange={onSearchChange}
            />
        )}
        <div className='pv-filter-groups'>
            {filters.map((filter) => (
                <FilterGroup
                    key={filter.key}
                    filter={filter}
                    selections={filterValues[filter.key] ?? new Set<string>()}
                    rangeSelection={rangeValues[filter.key]}
                    customValue={customValues?.[filter.key]}
                    isExpanded={expandedFilterKey === filter.key}
                    editorRender={editorMap[filter.key]}
                    searchPlaceholder={searchPlaceholder}
                    clearFilterAriaLabel={clearFilterAriaLabel}
                    clearRangeAriaLabel={clearRangeAriaLabel}
                    onFilterToggle={onFilterToggle}
                    onFilterClear={onFilterClear}
                    onRangeChange={onRangeChange}
                    onExpandedFilterChange={onExpandedFilterChange}
                    onCustomValueChange={onCustomValueChange}
                />
            ))}
        </div>
    </div>
);
