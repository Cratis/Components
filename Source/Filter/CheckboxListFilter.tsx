// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, useMemo, useRef, useState } from 'react';
import type { FilterOption } from './types';
import { useOptionListOverflow } from './useOptionListOverflow';

/**
 * Props for {@link CheckboxListFilter}.
 */
export interface CheckboxListFilterProps {
    /** Everything that can be picked. */
    options: FilterOption[];
    /** Keys of the currently selected options. */
    selected: Set<string>;
    /** Allow selecting more than one option (checkbox behaviour). Defaults to false (radio behaviour). */
    multi?: boolean;
    /** Called with the toggled option's key whenever a row is picked. */
    onToggle: (optionKey: string) => void;
    /**
     * Whether to show a search box for narrowing the list by label.
     *
     * - `true` always shows it.
     * - `false` never shows it, no matter how long the list gets.
     * - `undefined` (the default) shows it only when there are more options than fit inside the
     *   list's box - the search box grows out of the list needing one, rather than the caller
     *   having to predict that ahead of time.
     */
    searchable?: boolean;
    /** Placeholder text for the search input. Defaults to 'Search…'. */
    searchPlaceholder?: string;
    /** Shown in place of the list when there are no options at all. */
    emptyMessage?: string;
    /** Shown in place of the list when a search matches nothing. */
    noMatchesMessage?: string;
    /**
     * The `name` attribute grouping single-select (`multi={false}`) options into one radio group.
     * Generated automatically when omitted; only needs to be supplied to coordinate with markup
     * outside this component.
     */
    name?: string;
}

function renderOptionCount(count: number | undefined): string | number {
    return typeof count === 'number' ? count : '';
}

/**
 * A bounded, scrollable list of checkboxes or radio buttons for picking from a set of options.
 *
 * The list is capped at a fixed height so it cannot swallow whatever it sits in. When picking
 * from it would otherwise mean scrolling past more rows than fit in that box, a search input
 * appears, pinned to the top of the list so it stays reachable while the rows beneath it scroll.
 * A short list that already fits gets no search box at all - one is only ever shown because the
 * list needs it, not because the caller guessed it might.
 *
 * Used by {@link FilterPanel} to render its string/option filter groups, and equally usable
 * standalone wherever an application needs a checkbox/radio picker with the same behaviour.
 *
 * ```tsx
 * <CheckboxListFilter
 *   options={repositories}
 *   selected={selectedRepositoryKeys}
 *   multi
 *   onToggle={(key) => toggleRepository(key)}
 * />
 * ```
 *
 * @param props - {@link CheckboxListFilterProps}.
 */
export function CheckboxListFilter({
    options,
    selected,
    multi = false,
    onToggle,
    searchable,
    searchPlaceholder = 'Search…',
    emptyMessage = 'Nothing to choose from.',
    noMatchesMessage = 'No matches.',
    name,
}: CheckboxListFilterProps) {
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const mirrorRef = useRef<HTMLUListElement>(null);
    const generatedName = useId();
    const groupName = name ?? generatedName;

    const autoDetect = searchable === undefined;
    const overflows = useOptionListOverflow(containerRef, mirrorRef, autoDetect);
    const showSearch = searchable === true || (autoDetect && overflows);

    const normalized = search.trim().toLowerCase();
    const visibleOptions = useMemo(
        () =>
            showSearch && normalized.length > 0
                ? options.filter((option) => option.label.toLowerCase().includes(normalized))
                : options,
        [options, showSearch, normalized],
    );

    if (options.length === 0) {
        return <p className='pv-option-list-empty'>{emptyMessage}</p>;
    }

    return (
        <div className='pv-option-list' ref={containerRef}>
            {showSearch && (
                <div className='pv-filter-group-search pv-option-list-search'>
                    <input
                        type='search'
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
            )}
            <ul className='pv-option-list-options'>
                {visibleOptions.map((option) => {
                    const checked = selected.has(option.key);
                    return (
                        <li key={option.key} data-selected={checked || undefined}>
                            <label data-selected={checked || undefined}>
                                <input
                                    type={multi ? 'checkbox' : 'radio'}
                                    data-selected={checked || undefined}
                                    name={groupName}
                                    checked={checked}
                                    onChange={() => onToggle(option.key)}
                                />
                                <span>{option.label}</span>
                                <span className='pv-option-count'>
                                    {renderOptionCount(option.count)}
                                </span>
                            </label>
                        </li>
                    );
                })}
                {visibleOptions.length === 0 && (
                    <li className='pv-option-list-empty'>
                        <span>{noMatchesMessage}</span>
                    </li>
                )}
            </ul>
            {autoDetect && (
                // An off-screen clone of every option, in the same markup as the real rows above,
                // so its height matches theirs exactly. Measuring this rather than the real list
                // means a search that filters the visible rows down never shrinks the measured
                // height and un-decides that the list needed a search box in the first place - see
                // useOptionListOverflow. Absolutely positioned (see FilterPanel.css), so its place
                // in the DOM does not affect layout.
                <ul className='pv-option-list-mirror' ref={mirrorRef} aria-hidden='true'>
                    {options.map((option) => (
                        <li key={option.key}>
                            <label>
                                <input type={multi ? 'checkbox' : 'radio'} disabled tabIndex={-1} />
                                {/*
                                  The mirror exists purely to measure height, so its rows must occupy
                                  the same space a real row with this label would - but as plain text
                                  nodes, that same content is indistinguishable from the real (possibly
                                  filtered-out) row to text-content queries like Testing Library's
                                  `getByText`, defeating the point of filtering. CSS generated content
                                  renders identically for layout purposes without ever becoming a DOM
                                  text node, so it can't be found that way.
                                */}
                                <span className='pv-option-mirror-label' data-label={option.label} />
                                <span className='pv-option-count pv-option-mirror-label' data-label={renderOptionCount(option.count)} />
                            </label>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
