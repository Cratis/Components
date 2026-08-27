// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    Children,
    isValidElement,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type {
    FilterDefinition,
    FilterValues,
    RangeValues,
    CustomFilterValues,
} from './types';
import type { FilterEditorProps } from './FilterEditorProps';
import { FilterEditor } from './FilterEditor';
import { RangeHistogramFilter } from './RangeHistogramFilter';

/**
 * Props for {@link FilterPanel}.
 *
 * Describes the filter definitions to render, the current state
 * (selections, ranges, custom values), and the callbacks that fire when
 * the user changes a filter or expands a filter group.
 */
export interface FilterPanelProps {
    /** Whether the panel is visible. */
    isOpen: boolean;
    /** Filter definitions, each describing one filter group. */
    filters: FilterDefinition[];
    /** Current string/option selections, keyed by FilterDefinition.key. */
    filterValues: FilterValues;
    /** Current numeric range selections, keyed by FilterDefinition.key. */
    rangeValues: RangeValues;
    /** Current values for filters using a custom `<FilterEditor>` child, keyed by FilterDefinition.key. */
    customValues?: CustomFilterValues;
    /** Current search text shown in the search box. */
    search?: string;
    /** Placeholder text for the search input. Defaults to 'Search…'. */
    searchPlaceholder?: string;
    /** Accessible name for a clear-filter button. Override to localize. Defaults to 'Clear filter'. */
    clearFilterAriaLabel?: string;
    /** Accessible name for a clear-range button. Override to localize. Defaults to 'Clear range'. */
    clearRangeAriaLabel?: string;
    /** Which filter group is currently expanded. */
    expandedFilterKey?: string | null;
    /** The button element the panel anchors below. */
    anchorRef: React.RefObject<HTMLButtonElement | null>;
    /** Called when the panel should close (e.g. click outside). */
    onClose: () => void;
    /** Called when the search text changes. If omitted, the search box is hidden. */
    onSearchChange?: (value: string) => void;
    /** Called when a string option is toggled. */
    onFilterToggle: (filterKey: string, optionKey: string, multi: boolean) => void;
    /** Called when all selections for a filter are cleared. */
    onFilterClear: (filterKey: string) => void;
    /** Called when a numeric range changes. */
    onRangeChange: (filterKey: string, range: [number, number] | null) => void;
    /** Called when the expanded filter group changes. */
    onExpandedFilterChange: (key: string | null) => void;
    /** Called when a custom-editor value changes. */
    onCustomValueChange?: (filterKey: string, value: unknown) => void;
    /**
     * `<FilterEditor>` elements that provide custom UI for specific filter groups.
     *
     * ```tsx
     * <FilterPanel filters={filters} {...stateProps}>
     *   <FilterEditor filterKey="rating">
     *     {({ value, onChange }) => <MyPicker value={value} onChange={onChange} />}
     *   </FilterEditor>
     * </FilterPanel>
     * ```
     */
    children?: ReactNode;
}

/** Build a map of filterKey → render function from any <FilterEditor> children. */
function buildEditorMap(
    children: ReactNode | undefined,
): Record<string, (props: FilterEditorProps) => ReactNode> {
    const map: Record<string, (props: FilterEditorProps) => ReactNode> = {};
    Children.forEach(children, (child) => {
        if (isValidElement(child) && child.type === FilterEditor) {
            const { filterKey, children: renderFn } = child.props as {
                filterKey: string;
                children: (props: FilterEditorProps) => ReactNode;
            };
            if (filterKey && typeof renderFn === 'function') {
                map[filterKey] = renderFn;
            }
        }
    });
    return map;
}

/**
 * Renders a filter dropdown panel anchored below a trigger button. The panel
 * appears as a portal at a fixed position on the page and includes search,
 * collapsible filter groups, and per-filter editors (option lists, numeric
 * range histograms, or custom components).
 *
 * Use with {@link useFilterState} for turnkey state management, or wire the
 * props to external state when the filter state lives elsewhere (e.g. in a
 * query param reducer).
 *
 * ## Filter types
 *
 * - **String/option filters** render as a list of checkboxes or radio buttons.
 *   Controlled through `filterValues`.
 * - **Numeric/date range filters** render as a {@link RangeHistogramFilter}
 *   with a draggable range selector over a histogram. Controlled through
 *   `rangeValues`.
 * - **Custom filters** slot in a `<FilterEditor>` child whose `filterKey`
 *   matches the filter's `key`. Controlled through `customValues`.
 *
 * ```tsx
 * const state = useFilterState(filters);
 * const [isOpen, setIsOpen] = useState(false);
 * const anchorRef = useRef<HTMLButtonElement>(null);
 *
 * return (
 *   <>
 *     <button ref={anchorRef} onClick={() => setIsOpen(!isOpen)}>
 *       Filters
 *     </button>
 *     <FilterPanel
 *       isOpen={isOpen}
 *       filters={filters}
 *       anchorRef={anchorRef}
 *       onClose={() => setIsOpen(false)}
 *       {...state}
 *     >
 *       <FilterEditor filterKey="rating">
 *         {({ value, onChange }) => <RatingPicker value={value} onChange={onChange} />}
 *       </FilterEditor>
 *     </FilterPanel>
 *   </>
 * );
 * ```
 *
 * @param props - {@link FilterPanelProps}.
 */
function renderOptionCount(count: number | undefined): string | number {
    return typeof count === 'number' ? count : '';
}

interface OptionListProps {
    filter: FilterDefinition;
    selections: Set<string>;
    onFilterToggle: (filterKey: string, optionKey: string, multi: boolean) => void;
    /** Falls back to the panel-level search placeholder when the filter group has none of its own. */
    searchPlaceholder?: string;
}

function OptionList({
    filter,
    selections,
    onFilterToggle,
    searchPlaceholder,
}: Omit<OptionListProps, 'onFilterClear'>) {
    const [groupSearch, setGroupSearch] = useState('');
    const allOptions = filter.options ?? [];
    const normalized = groupSearch.trim().toLowerCase();
    const visibleOptions =
        filter.searchable && normalized.length > 0
            ? allOptions.filter((option) =>
                  option.label.toLowerCase().includes(normalized),
              )
            : allOptions;

    return (
        <>
            {filter.searchable && (
                <div className='pv-filter-group-search'>
                    <input
                        type='search'
                        placeholder={filter.searchPlaceholder ?? searchPlaceholder}
                        value={groupSearch}
                        onChange={(event) => setGroupSearch(event.target.value)}
                    />
                </div>
            )}
            <ul>
                {visibleOptions.map((option) => {
                    const optionKey = option.key;
                    const checked = selections.has(optionKey);
                    return (
                        <li key={option.key} data-selected={checked || undefined}>
                            <label data-selected={checked || undefined}>
                                <input
                                    type={filter.multi ? 'checkbox' : 'radio'}
                                    data-selected={checked || undefined}
                                    name={`filter-${filter.key}`}
                                    checked={checked}
                                    onChange={() =>
                                        onFilterToggle(
                                            filter.key,
                                            optionKey,
                                            filter.multi ?? false,
                                        )
                                    }
                                />
                                <span>{option.label}</span>
                                <span className='pv-option-count'>
                                    {renderOptionCount(option.count)}
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

const subscribeToBrowserState = () => () => undefined;
const browserSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * A filter dropdown panel anchored below a trigger button. Renders filter
 * groups, search, numeric range histograms, and custom editors. The panel
 * appears as a portal at a fixed position on the page and closes when the
 * user clicks outside.
 *
 * See the full documentation comment at line 169 for usage examples.
 */
export function FilterPanel({
    isOpen,
    filters,
    filterValues,
    rangeValues,
    customValues,
    search,
    searchPlaceholder = 'Search…',
    clearFilterAriaLabel = 'Clear filter',
    clearRangeAriaLabel = 'Clear range',
    expandedFilterKey,
    anchorRef,
    onClose,
    onSearchChange,
    onFilterToggle,
    onFilterClear,
    onRangeChange,
    onExpandedFilterChange,
    onCustomValueChange,
    children,
}: FilterPanelProps) {
    const isBrowser = useSyncExternalStore(
        subscribeToBrowserState,
        browserSnapshot,
        serverSnapshot,
    );
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const editorMap = useMemo(() => buildEditorMap(children), [children]);

    // Calculate position when opening
    useEffect(() => {
        if (isOpen && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
    }, [isOpen]);

    // Handle click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const panel = panelRef.current;
            const anchor = anchorRef.current;

            if (panel && !panel.contains(target) && anchor && !anchor.contains(target)) {
                onClose();
            }
        };

        // Use capture phase to ensure we catch the event before any other handlers.
        // Use timeout to avoid closing immediately when clicking the button to open.
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isOpen, anchorRef, onClose]);

    if (!isBrowser) return null;

    return createPortal(
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.aside
                    ref={panelRef}
                    className='pv-filter-dropdown'
                    style={{
                        position: 'fixed',
                        left: position.left,
                        top: position.top,
                    }}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    data-open={isOpen || undefined}
                >
                    <div className='pv-filter-dropdown-content'>
                        {onSearchChange && (
                            <div className='pv-search'>
                                <input
                                    type='search'
                                    placeholder={searchPlaceholder}
                                    value={search ?? ''}
                                    onChange={(event) =>
                                        onSearchChange(event.target.value)
                                    }
                                />
                            </div>
                        )}
                        <div className='pv-filter-groups'>
                            {filters.map((filter) => {
                                const selections =
                                    filterValues[filter.key] ?? new Set<string>();
                                const rangeSelection = rangeValues[filter.key];
                                const customValue = customValues?.[filter.key];
                                const isExpanded = expandedFilterKey === filter.key;
                                const isDate = filter.type === 'date';
                                const isNumeric = filter.type === 'number' || isDate;
                                const editorRender = editorMap[filter.key];
                                const isCustom =
                                    filter.type === 'custom' ||
                                    editorRender !== undefined;
                                const hasCustomValue =
                                    customValue !== undefined && customValue !== null;
                                const canClear = isNumeric
                                    ? Boolean(rangeSelection)
                                    : isCustom
                                      ? hasCustomValue
                                      : selections.size > 0;
                                const clearLabel = isNumeric
                                    ? clearRangeAriaLabel
                                    : clearFilterAriaLabel;
                                const clearValue = () => {
                                    if (isNumeric) onRangeChange(filter.key, null);
                                    else if (isCustom) {
                                        onCustomValueChange?.(filter.key, undefined);
                                    } else onFilterClear(filter.key);
                                };
                                const formatRangeValue = isDate
                                    ? (value: number) => new Date(value).toLocaleString()
                                    : undefined;

                                return (
                                    <div
                                        key={filter.key}
                                        className={`pv-filter ${isExpanded ? 'expanded' : ''}`}
                                        data-selected={canClear || undefined}
                                        data-open={isExpanded || undefined}
                                    >
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
                                                onClick={() =>
                                                    onExpandedFilterChange(
                                                        isExpanded ? null : filter.key,
                                                    )
                                                }
                                            >
                                                <span className='pv-filter-label'>
                                                    {filter.label}
                                                </span>
                                                <span className='pv-filter-trigger-meta'>
                                                    {!isNumeric &&
                                                        !isCustom &&
                                                        selections.size > 0 && (
                                                            <span className='pv-filter-count'>
                                                                {selections.size}
                                                            </span>
                                                        )}
                                                    {isNumeric && rangeSelection && (
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
                                                    onClick={clearValue}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                        <div
                                            className={`pv-filter-content ${isExpanded ? 'expanded' : ''}`}
                                            data-open={isExpanded || undefined}
                                        >
                                            {isCustom && editorRender ? (
                                                editorRender({
                                                    value: customValue,
                                                    onChange: (value) =>
                                                        onCustomValueChange?.(
                                                            filter.key,
                                                            value,
                                                        ),
                                                })
                                            ) : isNumeric && filter.numericRange ? (
                                                <RangeHistogramFilter
                                                    values={filter.numericRange.values}
                                                    histogram={
                                                        filter.numericRange.histogram
                                                    }
                                                    min={filter.numericRange.min}
                                                    max={filter.numericRange.max}
                                                    buckets={filter.buckets ?? 20}
                                                    selectedRange={rangeSelection ?? null}
                                                    onChange={(range) =>
                                                        onRangeChange(filter.key, range)
                                                    }
                                                    formatValue={formatRangeValue}
                                                />
                                            ) : (
                                                <OptionList
                                                    filter={filter}
                                                    selections={selections}
                                                    onFilterToggle={onFilterToggle}
                                                    searchPlaceholder={searchPlaceholder}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>,
        document.body,
    );
}
