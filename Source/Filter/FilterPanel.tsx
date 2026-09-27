// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    Children,
    isValidElement,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import type {
    FilterDefinition,
    FilterValues,
    RangeValues,
    CustomFilterValues,
} from './types';
import { resolveDropdownPosition, type DropdownPosition } from './utils';
import type { FilterEditorProps } from './FilterEditorProps';
import { FilterEditor } from './FilterEditor';
import { RangeHistogramFilter } from './RangeHistogramFilter';
import { CheckboxListFilter } from './CheckboxListFilter';

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
    /** Accessible name for the non-modal dialog. Defaults to 'Filters'. */
    'aria-label'?: string;
    /** Accessible name for the panel search. Falls back to its placeholder, then 'Search'. */
    searchAriaLabel?: string;
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
     * See the {@link FilterPanel} example below for the complete prop mapping
     * and a custom editor.
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
 * - **String/option filters** render as a {@link CheckboxListFilter} - a bounded,
 *   scrollable list of checkboxes or radio buttons. Controlled through `filterValues`.
 *   A search box grows out of the list automatically once it has more options than
 *   fit in its box; see {@link FilterDefinition.searchable} to force it always on
 *   or always off instead.
 * - **Numeric/date range filters** render as a {@link RangeHistogramFilter}
 *   with a draggable range selector over a histogram. Controlled through
 *   `rangeValues`.
 * - **Custom filters** slot in a `<FilterEditor>` child whose `filterKey`
 *   matches the filter's `key`. Controlled through `customValues`.
 *
 * ```tsx
 * import { useRef, useState } from 'react';
 * import {
 *   FilterEditor, FilterPanel, useFilterState, type FilterDefinition,
 * } from '@cratis/components/Filter';
 *
 * const filters: FilterDefinition[] = [{ key: 'category', label: 'Category', type: 'custom' }];
 *
 * function FilterExample() {
 *   const state = useFilterState(filters);
 *   const [isOpen, setIsOpen] = useState(false);
 *   const anchorRef = useRef<HTMLButtonElement>(null);
 *
 *   return (
 *     <>
 *       <button ref={anchorRef} onClick={() => setIsOpen(!isOpen)}>
 *         Filters
 *       </button>
 *       <FilterPanel
 *         isOpen={isOpen}
 *         filters={filters}
 *         anchorRef={anchorRef}
 *         onClose={() => setIsOpen(false)}
 *         filterValues={state.filterValues}
 *         rangeValues={state.rangeValues}
 *         customValues={state.customValues}
 *         expandedFilterKey={state.expandedFilterKey}
 *         onFilterToggle={state.handleToggleFilter}
 *         onFilterClear={state.handleClearFilter}
 *         onRangeChange={state.handleRangeChange}
 *         onExpandedFilterChange={state.setExpandedFilterKey}
 *         onCustomValueChange={state.handleCustomValueChange}
 *       >
 *         <FilterEditor filterKey="category">
 *           {({ value, onChange }) => (
 *             <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
 *           )}
 *         </FilterEditor>
 *       </FilterPanel>
 *     </>
 *   );
 * }
 * ```
 *
 * @param props - {@link FilterPanelProps}.
 */
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
    'aria-label': ariaLabel = 'Filters',
    searchAriaLabel,
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
    const icon = useCratisIcon();
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const environmentContainer = isBrowser ? overlayEnvironment.getContainer() : null;
    const [resolvedAnchor, setResolvedAnchor] = useState<{
        anchor: HTMLButtonElement | null;
        modalRoot: HTMLElement | null;
    } | null>(null);
    // Refs attach during commit, after render. Resolve the modal before mounting any open
    // panel so its first portal never lands in a shared root hidden by the modal.
    // Ref attachment/identity can change on any commit; the state updater bails out if unchanged.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
    useLayoutEffect(() => {
        const anchor = anchorRef.current;
        const modalRoot = anchor?.closest<HTMLElement>('.cratis-dialog[data-cratis-part="root"]') ?? null;
        setResolvedAnchor((previous) => previous?.anchor === anchor && previous.modalRoot === modalRoot
            ? previous
            : { anchor, modalRoot });
    });
    // A shared overlay root sits outside a modal's focus scope and is hidden from assistive
    // technology. Keep a panel anchored inside a Cratis Dialog inside that modal instead.
    // An explicitly unavailable container still defers the portal; it is never a body fallback.
    const modalRoot = resolvedAnchor?.modalRoot;
    const portalContainer = environmentContainer && modalRoot && !modalRoot.contains(environmentContainer)
        ? modalRoot
        : environmentContainer;
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<DropdownPosition & { width?: number }>({
        top: 0,
        left: 0,
        maxHeight: 0,
    });

    const editorMap = useMemo(() => buildEditorMap(children), [children]);

    // Keep the fixed-position portal attached to its anchor and clamped inside the viewport.
    // A transform (or other fixed containing-block property) on the portal container OR any
    // ancestor changes the meaning of CSS left/top/bottom. A fixed probe in the portal sees
    // exactly the same containing block as the panel, without guessing which ancestor owns it.
    // Capture-phase scroll observation also covers nested scrolling containers.
    useLayoutEffect(() => {
        if (!isOpen || !portalContainer) return;

        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;margin:0;padding:0;border:0;visibility:hidden;pointer-events:none';
        portalContainer.appendChild(probe);

        const updatePosition = () => {
            if (!anchorRef.current || !panelRef.current) return;

            // The probe stays mounted while open, but its origin must be read on every
            // update: scrolling a transformed ancestor changes its viewport coordinates.
            probe.style.top = '0';
            probe.style.bottom = 'auto';
            const origin = probe.getBoundingClientRect();
            probe.style.top = 'auto';
            probe.style.bottom = '0';
            const containingBlockBottom = probe.getBoundingClientRect().bottom;

            // offsetWidth is in local CSS pixels; the probe's rect supplies the viewport scale.
            // Preserve the viewport gutter even when a containing block scales the dropdown.
            const scaleX = origin.width || 1;
            const scaleY = origin.height || 1;
            const viewport = { width: window.innerWidth, height: window.innerHeight };
            // Measure the CSS width without a previous resize's inline clamp applied.
            const panel = panelRef.current;
            const previousWidth = panel.style.width;
            if (previousWidth) panel.style.width = '';
            const cssWidth = panel.offsetWidth;
            if (previousWidth) panel.style.width = previousWidth;
            const width = cssWidth * scaleX > viewport.width - 32
                ? Math.max(0, (viewport.width - 32) / scaleX)
                : undefined;
            const viewportPosition = resolveDropdownPosition(
                anchorRef.current.getBoundingClientRect(), viewport,
                (width ?? cssWidth) * scaleX,
            );
            const nextPosition = {
                left: (viewportPosition.left - origin.left) / scaleX,
                top: viewportPosition.top === undefined ? undefined : (viewportPosition.top - origin.top) / scaleY,
                bottom: viewportPosition.bottom === undefined ? undefined
                    : (containingBlockBottom - (viewport.height - viewportPosition.bottom)) / scaleY,
                maxHeight: viewportPosition.maxHeight / scaleY,
                width,
            };
            setPosition((previous) => previous.left === nextPosition.left &&
                previous.top === nextPosition.top && previous.bottom === nextPosition.bottom &&
                previous.maxHeight === nextPosition.maxHeight && previous.width === nextPosition.width
                ? previous : nextPosition);
        };

        // A side Dialog's entering translate temporarily makes its root the fixed-position
        // containing block. Measure again when the slide finishes and viewport positioning resumes.
        let animationFrame: number | undefined;
        const schedulePosition = () => {
            if (animationFrame !== undefined) return;
            animationFrame = requestAnimationFrame(() => {
                animationFrame = undefined;
                updatePosition();
            });
        };
        const handleScroll = (event: Event) => {
            if (event.target instanceof Node && panelRef.current?.contains(event.target)) return;
            schedulePosition();
        };
        // Consumers may replace the side Dialog's entry animation or animate its positioner.
        // Ignore events bubbling from controls inside the dialog; one frame is enough for
        // any number of animations or transitions ending in the same rendering frame.
        const sideModal = modalRoot?.matches('[data-placement="start"], [data-placement="end"]')
            ? modalRoot : null;
        const positioner = sideModal?.parentElement?.matches('[data-cratis-part="positioner"]')
            ? sideModal.parentElement : null;
        const handleModalMotionEnd = (event: Event) => {
            if (event.target === sideModal || event.target === positioner) schedulePosition();
        };
        const motionEvents = ['animationend', 'animationcancel', 'transitionend'] as const;

        updatePosition();
        window.addEventListener('resize', schedulePosition);
        window.addEventListener('scroll', handleScroll, true);
        for (const eventName of motionEvents) {
            sideModal?.addEventListener(eventName, handleModalMotionEnd);
            positioner?.addEventListener(eventName, handleModalMotionEnd);
        }

        return () => {
            if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', schedulePosition);
            window.removeEventListener('scroll', handleScroll, true);
            for (const eventName of motionEvents) {
                sideModal?.removeEventListener(eventName, handleModalMotionEnd);
                positioner?.removeEventListener(eventName, handleModalMotionEnd);
            }
            probe.remove();
        };
    }, [anchorRef, isOpen, modalRoot, portalContainer, resolvedAnchor?.anchor]);

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

    useEffect(() => {
        if (isOpen && panelRef.current && !panelRef.current.contains(document.activeElement)) {
            panelRef.current.focus();
        }
    }, [isOpen, portalContainer, resolvedAnchor]);

    useEffect(() => {
        if (!isOpen) return;

        const handleAnchorEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
            const focused = document.activeElement;
            if (focused && anchorRef.current?.contains(focused)) {
                event.preventDefault();
                event.stopPropagation();
                onClose();
                anchorRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleAnchorEscape, true);
        return () => {
            document.removeEventListener('keydown', handleAnchorEscape, true);
        };
    }, [isOpen, anchorRef, onClose]);

    if (!portalContainer || !resolvedAnchor || resolvedAnchor.anchor !== anchorRef.current) return null;

    return createPortal(
        <AnimatePresence initial={Boolean(modalRoot)}>
            {isOpen && (
                <motion.div
                    ref={panelRef}
                    role='dialog'
                    aria-label={ariaLabel}
                    tabIndex={-1}
                    onKeyDown={(event) => {
                        if (event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing) return;
                        event.preventDefault();
                        event.stopPropagation();
                        onClose();
                        anchorRef.current?.focus();
                    }}
                    className='pv-filter-dropdown'
                    style={{
                        position: 'fixed',
                        left: position.left,
                        top: position.top,
                        bottom: position.bottom,
                        maxHeight: position.maxHeight,
                        width: position.width,
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
                                    aria-label={(searchAriaLabel ?? searchPlaceholder) || 'Search'}
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
                                                    {icon('clear', '×')}
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
                                                    isExpanded={isExpanded}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        portalContainer,
    );
}
