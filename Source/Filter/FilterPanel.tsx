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
import { useCratisComponentsConfig } from '../configuration/CratisComponentsContext';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import type {
    FilterDefinition,
    FilterValues,
    RangeValues,
    CustomFilterValues,
} from './types';
import type { FilterEditorProps } from './FilterEditorProps';
import { FilterEditor } from './FilterEditor';
import { FilterGroup } from './FilterGroup';
import { usePanelPosition } from './usePanelPosition';
import { useDismissOnOutsideClick, useCloseOnAnchorEscape } from './usePanelDismissal';

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
    /** Accessible name for the non-modal dialog. Overrides `messages.filter.label`, then 'Filters'. */
    'aria-label'?: string;
    /** Accessible name for the panel search. Falls back to `messages.filter.searchAriaLabel`, its placeholder, then 'Search'. */
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
    'aria-label': ariaLabel,
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
    const { messages } = useCratisComponentsConfig();
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
    const position = usePanelPosition({
        isOpen,
        portalContainer,
        modalRoot,
        anchorRef,
        panelRef,
        resolvedAnchor: resolvedAnchor?.anchor,
    });

    const editorMap = useMemo(() => buildEditorMap(children), [children]);

    useDismissOnOutsideClick({ isOpen, anchorRef, panelRef, onClose });

    useEffect(() => {
        if (isOpen && panelRef.current && !panelRef.current.contains(document.activeElement)) {
            panelRef.current.focus();
        }
    }, [isOpen, portalContainer, resolvedAnchor]);

    useCloseOnAnchorEscape({ isOpen, anchorRef, onClose });

    if (!portalContainer || !resolvedAnchor || resolvedAnchor.anchor !== anchorRef.current) return null;

    return createPortal(
        <AnimatePresence initial={Boolean(modalRoot)}>
            {isOpen && (
                <motion.div
                    ref={panelRef}
                    role='dialog'
                    aria-label={ariaLabel ?? messages?.filter?.label ?? 'Filters'}
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
                                    aria-label={(searchAriaLabel ?? messages?.filter?.searchAriaLabel ?? searchPlaceholder) || 'Search'}
                                    value={search ?? ''}
                                    onChange={(event) =>
                                        onSearchChange(event.target.value)
                                    }
                                />
                            </div>
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
                </motion.div>
            )}
        </AnimatePresence>,
        portalContainer,
    );
}
