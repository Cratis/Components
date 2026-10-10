// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { useCratisIcon } from '../configuration/useCratisIcon';
import type { FilterDefinition } from './types';
import type { FilterEditorProps } from './FilterEditorProps';
import { RangeHistogramFilter } from './RangeHistogramFilter';
import { CheckboxListFilter } from './CheckboxListFilter';

interface OptionListProps {
    filter: FilterDefinition;
    selections: Set<string>;
    onFilterToggle: (filterKey: string, optionKey: string, multi: boolean) => void;
    /** Falls back to the panel-level search placeholder when the filter group has none of its own. */
    searchPlaceholder?: string;
    isExpanded: boolean;
}

/** Adapts a `FilterDefinition`'s string/option shape onto the reusable {@link CheckboxListFilter}. */
function OptionList({
    filter,
    selections,
    onFilterToggle,
    searchPlaceholder,
    isExpanded,
}: OptionListProps) {
    return (
        <CheckboxListFilter
            options={filter.options ?? []}
            selected={selections}
            multi={filter.multi}
            searchable={filter.searchable}
            searchPlaceholder={filter.searchPlaceholder ?? searchPlaceholder}
            searchAriaLabel={filter.searchAriaLabel}
            autoFocusSearch={filter.autoFocus === true && isExpanded}
            name={`filter-${filter.key}`}
            onToggle={(optionKey) =>
                onFilterToggle(filter.key, optionKey, filter.multi ?? false)
            }
        />
    );
}

interface GroupKind {
    isDate: boolean;
    isNumeric: boolean;
    isCustom: boolean;
}

interface TriggerProps extends GroupKind {
    filter: FilterDefinition;
    isExpanded: boolean;
    canClear: boolean;
    clearLabel: string;
    selectionCount: number;
    hasRange: boolean;
    hasCustomValue: boolean;
    onToggleExpanded: () => void;
    onClear: () => void;
}

function FilterGroupTrigger({
    filter,
    isExpanded,
    canClear,
    clearLabel,
    isNumeric,
    isCustom,
    selectionCount,
    hasRange,
    hasCustomValue,
    onToggleExpanded,
    onClear,
}: TriggerProps) {
    const icon = useCratisIcon();

    return (
        <div
            className='pv-filter-trigger'
            data-selected={canClear || undefined}
            data-open={isExpanded || undefined}
        >
            <button
                type='button'
                className='pv-filter-toggle'
                aria-expanded={isExpanded}
                data-selected={canClear || undefined}
                data-open={isExpanded || undefined}
                data-pressed={isExpanded || undefined}
                onClick={onToggleExpanded}
            >
                <span className='pv-filter-label'>
                    {filter.label}
                </span>
                <span className='pv-filter-trigger-meta'>
                    {!isNumeric &&
                        !isCustom &&
                        selectionCount > 0 && (
                            <span className='pv-filter-count'>
                                {selectionCount}
                            </span>
                        )}
                    {isNumeric && hasRange && (
                        <span className='pv-filter-count'>
                            Range
                        </span>
                    )}
                    {isCustom && hasCustomValue && (
                        <span className='pv-filter-count'>
                            •
                        </span>
                    )}
                    <span className='pv-filter-chevron' />
                </span>
            </button>
            {canClear && (
                <button
                    type='button'
                    className='pv-filter-clear-header'
                    title={clearLabel}
                    aria-label={clearLabel}
                    onClick={onClear}
                >
                    {icon('clear', '×')}
                </button>
            )}
        </div>
    );
}

/** Props for {@link FilterGroup}. */
export interface FilterGroupProps {
    filter: FilterDefinition;
    selections: Set<string>;
    rangeSelection: [number, number] | null | undefined;
    customValue: unknown;
    isExpanded: boolean;
    editorRender: ((props: FilterEditorProps) => ReactNode) | undefined;
    searchPlaceholder: string;
    clearFilterAriaLabel: string;
    clearRangeAriaLabel: string;
    onFilterToggle: (filterKey: string, optionKey: string, multi: boolean) => void;
    onFilterClear: (filterKey: string) => void;
    onRangeChange: (filterKey: string, range: [number, number] | null) => void;
    onExpandedFilterChange: (key: string | null) => void;
    onCustomValueChange?: (filterKey: string, value: unknown) => void;
}

interface ContentProps extends GroupKind {
    filter: FilterDefinition;
    selections: Set<string>;
    rangeSelection: [number, number] | null | undefined;
    customValue: unknown;
    isExpanded: boolean;
    editorRender: ((props: FilterEditorProps) => ReactNode) | undefined;
    searchPlaceholder: string;
    onFilterToggle: FilterGroupProps['onFilterToggle'];
    onRangeChange: FilterGroupProps['onRangeChange'];
    onCustomValueChange?: FilterGroupProps['onCustomValueChange'];
}

function FilterGroupEditor({
    filter,
    selections,
    rangeSelection,
    customValue,
    isExpanded,
    editorRender,
    searchPlaceholder,
    isDate,
    isNumeric,
    isCustom,
    onFilterToggle,
    onRangeChange,
    onCustomValueChange,
}: ContentProps) {
    if (isCustom && editorRender) {
        return editorRender({
            value: customValue,
            onChange: (value) => onCustomValueChange?.(filter.key, value),
        });
    }

    if (isNumeric && filter.numericRange) {
        return (
            <RangeHistogramFilter
                values={filter.numericRange.values}
                histogram={filter.numericRange.histogram}
                min={filter.numericRange.min}
                max={filter.numericRange.max}
                buckets={filter.buckets ?? 20}
                selectedRange={rangeSelection ?? null}
                onChange={(range) => onRangeChange(filter.key, range)}
                formatValue={isDate ? (value: number) => new Date(value).toLocaleString() : undefined}
            />
        );
    }

    return (
        <OptionList
            filter={filter}
            selections={selections}
            onFilterToggle={onFilterToggle}
            searchPlaceholder={searchPlaceholder}
            isExpanded={isExpanded}
        />
    );
}

/** One collapsible filter group: its trigger/clear header and the editor for its filter type. */
export function FilterGroup({
    filter,
    selections,
    rangeSelection,
    customValue,
    isExpanded,
    editorRender,
    searchPlaceholder,
    clearFilterAriaLabel,
    clearRangeAriaLabel,
    onFilterToggle,
    onFilterClear,
    onRangeChange,
    onExpandedFilterChange,
    onCustomValueChange,
}: FilterGroupProps) {
    const isDate = filter.type === 'date';
    const isNumeric = filter.type === 'number' || isDate;
    const isCustom = filter.type === 'custom' || editorRender !== undefined;
    const hasCustomValue = customValue !== undefined && customValue !== null;
    const canClear = isNumeric
        ? Boolean(rangeSelection)
        : isCustom
          ? hasCustomValue
          : selections.size > 0;
    const clearLabel = isNumeric ? clearRangeAriaLabel : clearFilterAriaLabel;
    const clearValue = () => {
        if (isNumeric) onRangeChange(filter.key, null);
        else if (isCustom) {
            onCustomValueChange?.(filter.key, undefined);
        } else onFilterClear(filter.key);
    };

    return (
        <div
            className={`pv-filter ${isExpanded ? 'expanded' : ''}`}
            data-selected={canClear || undefined}
            data-open={isExpanded || undefined}
        >
            <FilterGroupTrigger
                filter={filter}
                isExpanded={isExpanded}
                canClear={canClear}
                clearLabel={clearLabel}
                isDate={isDate}
                isNumeric={isNumeric}
                isCustom={isCustom}
                selectionCount={selections.size}
                hasRange={Boolean(rangeSelection)}
                hasCustomValue={hasCustomValue}
                onToggleExpanded={() => onExpandedFilterChange(isExpanded ? null : filter.key)}
                onClear={clearValue}
            />
            <div
                className={`pv-filter-content ${isExpanded ? 'expanded' : ''}`}
                data-open={isExpanded || undefined}
            >
                <FilterGroupEditor
                    filter={filter}
                    selections={selections}
                    rangeSelection={rangeSelection}
                    customValue={customValue}
                    isExpanded={isExpanded}
                    editorRender={editorRender}
                    searchPlaceholder={searchPlaceholder}
                    isDate={isDate}
                    isNumeric={isNumeric}
                    isCustom={isCustom}
                    onFilterToggle={onFilterToggle}
                    onRangeChange={onRangeChange}
                    onCustomValueChange={onCustomValueChange}
                />
            </div>
        </div>
    );
}
